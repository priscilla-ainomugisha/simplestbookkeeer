import twilio from 'twilio';
import dotenv from 'dotenv';
import { processTextInput, processVoiceNote } from '../../lib/openai';
import { storage } from '../../storage';

dotenv.config();

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

export class WhatsAppService {
  private static instance: WhatsAppService;
  private client: twilio.Twilio;

  private constructor() {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not found in environment variables');
    }
    this.client = twilioClient;
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async sendMessage(to: string, message: string) {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`
      });
      return response;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async handleIncomingMessage(message: any) {
    try {
      const messageType = message.MediaContentType0 || 'text';
      const from = message.From.replace('whatsapp:', '');
      
      // Get or create user based on WhatsApp number
      let user = await storage.getUserByWhatsappId(from);
      if (!user) {
        // Create a new user with WhatsApp number
        user = await storage.createUser({
          username: `whatsapp_${from}`,
          whatsappId: from
        });
      }

      if (messageType.startsWith('audio/')) {
        // Handle audio message
        const audioUrl = message.MediaUrl0;
        
        // Download and process audio
        const response = await fetch(audioUrl);
        const audioBuffer = await response.arrayBuffer();
        
        // Process voice note
        const { transcription, extractionResult } = await processVoiceNote(Buffer.from(audioBuffer));
        
        if (extractionResult.type !== 'unknown' && extractionResult.amount) {
          // Create transaction
          const transaction = await storage.createTransaction({
            userId: user.id,
            type: extractionResult.type,
            amount: extractionResult.amount,
            category: extractionResult.category || 
                    (extractionResult.type === 'income' ? 'Sales' : 'Other Expenses'),
            description: extractionResult.description || '',
            rawInput: 'voice note',
            transcription
          });

          return this.sendMessage(from, 
            `✅ Transaction recorded!\n` +
            `Type: ${extractionResult.type}\n` +
            `Amount: $${extractionResult.amount}\n` +
            `Category: ${transaction.category}\n` +
            `Description: ${transaction.description || 'N/A'}`
          );
        } else {
          return this.sendMessage(from, 
            '❌ Sorry, I couldn\'t extract transaction details from your voice message. ' +
            'Please try again or send a text message.'
          );
        }
      } else {
        // Handle text message
        const text = message.Body;
        
        // Check if it's a command
        if (text.toLowerCase().startsWith('summary')) {
          const totals = await storage.getDailyTotals(user.id, new Date());
          return this.sendMessage(from,
            `📊 Daily Summary:\n` +
            `Income: $${totals.income || 0}\n` +
            `Expenses: $${totals.expense || 0}\n` +
            `Net: $${(totals.income || 0) - (totals.expense || 0)}`
          );
        }

        // Process as transaction
        const extractionResult = await processTextInput(text);
        
        if (extractionResult.type !== 'unknown' && extractionResult.amount) {
          const transaction = await storage.createTransaction({
            userId: user.id,
            type: extractionResult.type,
            amount: extractionResult.amount,
            category: extractionResult.category || 
                    (extractionResult.type === 'income' ? 'Sales' : 'Other Expenses'),
            description: extractionResult.description || '',
            rawInput: text
          });

          return this.sendMessage(from,
            `✅ Transaction recorded!\n` +
            `Type: ${extractionResult.type}\n` +
            `Amount: $${extractionResult.amount}\n` +
            `Category: ${transaction.category}\n` +
            `Description: ${transaction.description || 'N/A'}`
          );
        } else {
          return this.sendMessage(from,
            '❌ Sorry, I couldn\'t understand that as a transaction. ' +
            'Please try again or send a voice message.'
          );
        }
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
      return this.sendMessage(message.From.replace('whatsapp:', ''), 
        '❌ Sorry, there was an error processing your message. Please try again.'
      );
    }
  }
} 