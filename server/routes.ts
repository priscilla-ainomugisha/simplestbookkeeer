import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { transcribeAudio as openaiTranscribeAudio } from "./lib/openai";
import { transcribeAudio as assemblyTranscribeAudio } from "./lib/assemblyai";
import { extractTransactionDetails } from "./lib/nlp";
import { saveTransactionToSheets } from "./lib/sheets";
import { sendWhatsAppMessage } from "./lib/twilio";
import { TransactionExtraction } from "@shared/schema";

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(import.meta.dirname, 'uploads');
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Process text message
  app.post('/api/messages/text', async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message text is required' });
      }
      
      // Extract transaction details from the message
      const transactionDetails = await extractTransactionDetails(message);
      
      if (!transactionDetails) {
        return res.status(400).json({ 
          message: 'Could not extract transaction details from your message. Please try again with a clearer message.' 
        });
      }
      
      // Save to in-memory storage
      const transaction = await storage.createTransaction({
        userId: 1, // In a real app, this would be the authenticated user's ID
        type: transactionDetails.type,
        amount: transactionDetails.amount,
        category: transactionDetails.category,
        description: transactionDetails.description || '',
        rawInput: message,
        transcription: message, // For text messages, raw input is the transcription
      });
      
      // Save to Google Sheets (if configured)
      try {
        await saveTransactionToSheets({
          timestamp: transaction.date.toISOString(),
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description || '',
          userId: transaction.userId,
          rawInput: transaction.rawInput || '',
          transcription: transaction.transcription || '',
        });
      } catch (error) {
        console.error('Error saving to sheets:', error);
        // Continue anyway since we saved to our database
      }
      
      // In a real app, we would send a WhatsApp message here
      try {
        await sendWhatsAppMessage(
          '+1234567890', // This would be the user's phone number
          `Transaction recorded! ${transaction.type === 'sale' ? 'Sale' : 'Expense'} of ${transaction.amount} for ${transaction.category}`
        );
      } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        // Continue anyway since this is not critical
      }
      
      // Send back the transaction details
      return res.status(200).json({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
      });
    } catch (error) {
      console.error('Error processing text message:', error);
      return res.status(500).json({ message: 'Error processing your message' });
    }
  });
  
  // Process voice message
  app.post('/api/messages/voice', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file provided' });
      }
      
      const audioFilePath = req.file.path;
      let text = '';
      let duration = 0;
      
      // Try to transcribe with AssemblyAI first (primary service)
      try {
        console.log('Transcribing with AssemblyAI...');
        const assemblyResult = await assemblyTranscribeAudio(audioFilePath);
        text = assemblyResult.text;
        duration = assemblyResult.duration;
        console.log('AssemblyAI transcription successful:', text);
      } catch (assemblyError) {
        console.error('AssemblyAI transcription failed, falling back to OpenAI:', assemblyError.message);
        
        // Fallback to OpenAI if AssemblyAI fails
        try {
          console.log('Transcribing with OpenAI Whisper...');
          const openaiResult = await openaiTranscribeAudio(audioFilePath);
          text = openaiResult.text;
          duration = openaiResult.duration;
          console.log('OpenAI transcription successful:', text);
        } catch (openaiError) {
          console.error('OpenAI transcription also failed:', openaiError.message);
          return res.status(500).json({ 
            message: 'Failed to transcribe audio. Please try again or use text input instead.' 
          });
        }
      }
      
      // Extract transaction details from the transcription
      const transactionDetails = await extractTransactionDetails(text);
      
      if (!transactionDetails) {
        return res.status(400).json({ 
          message: `I heard: "${text}", but couldn't understand the transaction details. Please try again with a clearer message.` 
        });
      }
      
      // Save to in-memory storage
      const transaction = await storage.createTransaction({
        userId: 1, // In a real app, this would be the authenticated user's ID
        type: transactionDetails.type,
        amount: transactionDetails.amount,
        category: transactionDetails.category,
        description: transactionDetails.description || '',
        rawInput: req.file.originalname,
        transcription: text,
      });
      
      // Save to Google Sheets (if configured)
      try {
        await saveTransactionToSheets({
          timestamp: transaction.date.toISOString(),
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description || '',
          userId: transaction.userId,
          rawInput: transaction.rawInput || '',
          transcription: text || '',
        });
      } catch (error) {
        console.error('Error saving to sheets:', error);
        // Continue anyway since we saved to our database
      }
      
      // In a real app, we would send a WhatsApp message here
      try {
        await sendWhatsAppMessage(
          '+1234567890', // This would be the user's phone number
          `Transaction recorded! ${transaction.type === 'sale' ? 'Sale' : 'Expense'} of ${transaction.amount} for ${transaction.category}`
        );
      } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        // Continue anyway since this is not critical
      }
      
      // Store the audio recording in memory (optional)
      await storage.createAudioRecording({
        userId: 1,
        filePath: audioFilePath,
        duration: duration || 0,
        transcription: text,
      });
      
      // Clean up the file (optional)
      // fs.unlinkSync(audioFilePath);
      
      // Send back the transaction details
      return res.status(200).json({
        transcription: text,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
        message: `I heard: "${text}" and recorded your ${transaction.type === 'sale' ? 'sale' : 'expense'} of ${transaction.amount} in category ${transaction.category}.`
      });
    } catch (error) {
      console.error('Error processing voice message:', error);
      return res.status(500).json({ message: 'Error processing your voice note' });
    }
  });
  
  // Get today's stats
  app.get('/api/transactions/today-stats', async (req, res) => {
    try {
      const stats = await storage.getTodayStats();
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching today\'s stats:', error);
      return res.status(500).json({ message: 'Error fetching stats' });
    }
  });
  
  // Get transaction history
  app.get('/api/transactions/history', async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const transactions = await storage.getTransactionHistory(days);
      return res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return res.status(500).json({ message: 'Error fetching transaction history' });
    }
  });
  
  // Edit a transaction
  app.patch('/api/transactions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedTransaction = await storage.updateTransaction(id, req.body);
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      return res.status(200).json(updatedTransaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      return res.status(500).json({ message: 'Error updating transaction' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
