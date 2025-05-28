import twilio from 'twilio';
import dotenv from 'dotenv';
import { processTextInput, processVoiceNote } from '../../lib/openai';
import { storage } from '../../storage';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

  private async downloadAudio(audioUrl: string): Promise<Buffer> {
    try {
      console.log('Downloading audio from:', audioUrl);
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
        }
      });
      console.log('Audio downloaded successfully, size:', response.data.length);
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading audio:', error);
      throw error;
    }
  }

  async handleIncomingMessage(message: any) {
    try {
      console.log('Received WhatsApp message:', {
        type: message.MediaContentType0 || 'text',
        from: message.From,
        body: message.Body
      });

      const messageType = message.MediaContentType0 || 'text';
      const from = message.From.replace('whatsapp:', '');
      
      // Get or create user based on WhatsApp number
      let user = await storage.getUserByWhatsappId(from);
      if (!user) {
        // Create a new user with WhatsApp number
        user = await storage.createUser({
          username: `whatsapp_${from}`,
          whatsappId: from,
          password: `whatsapp_${from}_${Date.now()}` // Generate a unique password
        });
      }

      if (messageType.startsWith('audio/')) {
        // Handle audio message
        const audioUrl = message.MediaUrl0;
        console.log('Processing audio message from URL:', audioUrl);
        
        try {
          // Download audio file
          const audioBuffer = await this.downloadAudio(audioUrl);
          console.log('Audio buffer size:', audioBuffer.length);

          // Process voice note
          console.log('Starting voice note processing...');
          const { transcription, extractionResult } = await processVoiceNote(audioBuffer);
          console.log('Voice note processed:', { transcription, extractionResult });
          
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
        } catch (error) {
          console.error('Error processing audio message:', error);
          return this.sendMessage(from,
            '❌ Sorry, there was an error processing your voice message. ' +
            'Please try again or send a text message.'
          );
        }
      } else {
        // Handle text message
        const text = message.Body.toLowerCase().trim();
        
        // Check if it's a command
        if (text.startsWith('summary')) {
          const totals = await storage.getDailyTotals(user.id, new Date());
          return this.sendMessage(from,
            `📊 Daily Summary (${new Date().toLocaleDateString()}):\n` +
            `Income: $${totals.income || 0}\n` +
            `Expenses: $${totals.expense || 0}\n` +
            `Net: $${(totals.income || 0) - (totals.expense || 0)}`
          );
        }
        else if (text.startsWith('weekly')) {
          const totals = await storage.getWeeklyTotals(user.id, new Date());
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - startDate.getDay());
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          
          return this.sendMessage(from,
            `📈 Weekly Summary (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}):\n` +
            `Income: $${totals.income || 0}\n` +
            `Expenses: $${totals.expense || 0}\n` +
            `Net: $${(totals.income || 0) - (totals.expense || 0)}`
          );
        }
        else if (text.startsWith('categories')) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - startDate.getDay());
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          
          const incomeBreakdown = await storage.getCategoryBreakdown(user.id, 'income', startDate, endDate);
          const expenseBreakdown = await storage.getCategoryBreakdown(user.id, 'expense', startDate, endDate);
          
          let message = `📊 Category Breakdown (This Week):\n\n`;
          
          if (incomeBreakdown.length > 0) {
            message += `Income Categories:\n`;
            incomeBreakdown.forEach(item => {
              message += `• ${item.category}: $${item.amount}\n`;
            });
            message += '\n';
          }
          
          if (expenseBreakdown.length > 0) {
            message += `Expense Categories:\n`;
            expenseBreakdown.forEach(item => {
              message += `• ${item.category}: $${item.amount}\n`;
            });
          }
          
          if (incomeBreakdown.length === 0 && expenseBreakdown.length === 0) {
            message += 'No transactions recorded this week.';
          }
          
          return this.sendMessage(from, message);
        }
        else if (text.startsWith('balance')) {
          const transactions = await storage.getTransactionsByUserId(user.id);
          const sortedTransactions = transactions.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          let message = `📋 Recent Transactions:\n\n`;
          
          if (sortedTransactions.length > 0) {
            sortedTransactions.slice(0, 10).forEach(transaction => {
              const date = new Date(transaction.createdAt).toLocaleDateString();
              const type = transaction.type === 'income' ? '📈' : '📉';
              message += `${type} ${date} - ${transaction.category}\n`;
              message += `$${transaction.amount} - ${transaction.description || 'No description'}\n\n`;
            });
          } else {
            message += 'No transactions recorded yet.';
          }
          
          return this.sendMessage(from, message);
        }
        else if (text.startsWith('help')) {
          return this.sendMessage(from,
            `📱 Available Commands:\n\n` +
            `• summary - Get today's summary\n` +
            `• weekly - Get this week's summary\n` +
            `• categories - Get category breakdown\n` +
            `• balance - View recent transactions\n` +
            `• help - Show this help message\n\n` +
            `You can also send voice messages or text to record transactions!`
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
            'Try sending a voice message or use one of these commands:\n' +
            '• summary - Get today\'s summary\n' +
            '• weekly - Get this week\'s summary\n' +
            '• categories - Get category breakdown\n' +
            '• balance - View recent transactions\n' +
            '• help - Show all commands'
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