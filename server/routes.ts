import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertUserSchema } from "@shared/schema";
import { processVoiceNote, processTextInput } from "./lib/openai";
import { addTransactionToSheet } from "./lib/google-sheets";
import { transcribeAudio } from "./config/speech";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { z } from "zod";
import ffmpeg from "fluent-ffmpeg";
import { WhatsAppService } from './src/services/whatsapp';
import { supabase } from "./config/supabase";
import cashbookRoutes from './routes/cashbook';
import transactionsRouter from './routes/transactions';

// Configure file upload for voice notes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Utility function to validate request body with a Zod schema
function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  req: Request,
  res: Response
): z.infer<T> | null {
  try {
    return schema.parse(req.body);
  } catch (error) {
    res.status(400).json({ message: "Invalid request data", error });
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount cashbook routes
  app.use('/api/cashbook', cashbookRoutes);
  
  // Mount transactions routes
  app.use('/api/transactions', transactionsRouter);

  // === User Routes ===
  
  // Create a new user
  app.post("/api/users", async (req, res) => {
    const userData = validateBody(insertUserSchema, req, res);
    if (!userData) return;
    
    try {
      // Check if user with same username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user", error });
    }
  });
  
  // === Transaction Routes ===
  
  // Get all sales for a user
  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales", error });
    }
  });
  
  // Save initial balance sheet
  app.post("/api/transactions/initial-balance", async (req, res) => {
    try {
      const { userId, cash, inventory, accountsReceivable, accountsPayable, loans, initialCapital } = req.body;

      // Create initial balance sheet transactions
      const transactions = [
        {
          userId,
          type: 'opening_balance',
          amount: cash,
          category: 'cash',
          description: 'Initial cash balance',
          date: new Date(),
          metadata: { isInitialBalance: true }
        },
        {
          userId,
          type: 'opening_balance',
          amount: inventory,
          category: 'inventory',
          description: 'Initial inventory value',
          date: new Date(),
          metadata: { isInitialBalance: true }
        },
        {
          userId,
          type: 'opening_balance',
          amount: accountsReceivable,
          category: 'accounts_receivable',
          description: 'Initial accounts receivable',
          date: new Date(),
          metadata: { isInitialBalance: true }
        },
        {
          userId,
          type: 'opening_balance',
          amount: accountsPayable,
          category: 'accounts_payable',
          description: 'Initial accounts payable',
          date: new Date(),
          metadata: { isInitialBalance: true }
        },
        {
          userId,
          type: 'opening_balance',
          amount: loans,
          category: 'loans',
          description: 'Initial loans',
          date: new Date(),
          metadata: { isInitialBalance: true }
        },
        {
          userId,
          type: 'opening_balance',
          amount: initialCapital,
          category: 'owner_equity',
          description: 'Initial capital',
          date: new Date(),
          metadata: { isInitialBalance: true }
        }
      ];

      // Save all transactions
      await Promise.all(transactions.map(tx => storage.createTransaction(tx)));

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving initial balance:', error);
      res.status(500).json({ error: 'Failed to save initial balance' });
    }
  });
  
  // Get transactions by type (income/expense)
  app.get("/api/transactions/:userId/:type", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { type } = req.params;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: "Type must be 'income' or 'expense'" });
      }
      const transactions = await storage.getTransactionsByUserIdAndType(userId, type);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions", error });
    }
  });
  
  // Create a transaction from text input
  app.post("/api/transactions/text", async (req, res) => {
    try {
      const { userId, text } = req.body;
      
      if (!userId || !text) {
        return res.status(400).json({ message: "Missing userId or text" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Process the text input to extract transaction details
      const extractionResult = await processTextInput(text);
      
      // Create transaction if we could extract meaningful data
      if (extractionResult.type !== 'unknown' && extractionResult.amount) {
        const newTransaction = {
          userId: userId,
          type: extractionResult.type,
          amount: extractionResult.amount,
          category: extractionResult.category || 
                  (extractionResult.type === 'income' ? 'Sales' : 'Other Expenses'),
          description: extractionResult.description || '',
          rawInput: text,
          transcription: text
        };
        try {
          console.log('Attempting to create transaction:', newTransaction);
          const transaction = await storage.createTransaction(newTransaction);
          // Add to Google Sheets (if API key is provided)
          try {
            await addTransactionToSheet(transaction);
          } catch (sheetError) {
            console.error("Failed to add transaction to Google Sheet:", sheetError);
            // Continue anyway, as the transaction is already saved in our storage
          }
          res.status(201).json({
            transaction,
            extractionResult
          });
        } catch (err) {
          console.error('Error during transaction creation:', err);
          res.status(500).json({ message: 'Failed to create transaction', error: err instanceof Error ? err.message : err });
        }
      } else {
        // Return error if extraction failed
        res.status(400).json({
          message: "Could not extract transaction details from text",
          extractionResult
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to process transaction", error });
    }
  });
  
  // Upload and process voice note
  app.post("/api/transactions/voice", upload.single('voiceNote'), async (req, res) => {
    console.log('=== Voice Note Endpoint Hit ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');

    if (!req.file) {
      return res.status(400).json({ message: "No voice note uploaded" });
    }
    
    try {
      const userId = req.body.userId;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get audio buffer from uploaded file
      const audioBuffer = req.file.buffer;
      
      console.log('Processing voice note:', {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        bufferLength: audioBuffer.length
      });

      // Process voice note - transcribe and extract transaction details
      console.log('🔄 Calling processVoiceNote...');
      const { transcription, extractionResult } = await processVoiceNote(audioBuffer);
      
      console.log('Voice note processing result:', {
        transcription,
        extractionResult
      });

      // Create transaction if we could extract meaningful data
      if (extractionResult.type !== 'unknown' && extractionResult.amount) {
        const newTransaction = {
          userId: userId,
          type: extractionResult.type,
          amount: extractionResult.amount,
          category: extractionResult.category || 
                  (extractionResult.type === 'income' ? 'Sales' : 'Other Expenses'),
          description: extractionResult.description || '',
          rawInput: 'voice note',
          transcription
        };
        
        const transaction = await storage.createTransaction(newTransaction);
        
        // Add to Google Sheets (if API key is provided)
        try {
          await addTransactionToSheet(transaction);
        } catch (sheetError) {
          console.error("Failed to add transaction to Google Sheet:", sheetError);
          // Continue anyway, as the transaction is already saved in our storage
        }
        
        res.status(201).json({
          transaction,
          transcription,
          extractionResult
        });
      } else {
        res.status(400).json({
          message: "Could not extract transaction details from voice note",
          transcription,
          extractionResult
        });
      }
    } catch (error) {
      console.error("Error processing voice note:", error);
      res.status(500).json({ 
        message: "Failed to process voice note", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // === Analytics Routes ===
  
  // Get daily summary
  app.get("/api/analytics/daily/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const dateParam = req.query.date as string;
      const date = dateParam ? new Date(dateParam) : new Date();
      
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      
      const totals = await storage.getDailyTotals(userId, date);
      res.json(totals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily summary", error });
    }
  });
  
  // Get weekly summary
  app.get("/api/analytics/weekly/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const dateParam = req.query.startDate as string;
      const startDate = dateParam ? new Date(dateParam) : new Date();
      
      // If no date provided, set to beginning of current week (Sunday)
      if (!dateParam) {
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day);
      }
      
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }
      
      const totals = await storage.getWeeklyTotals(userId, startDate);
      res.json(totals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly summary", error });
    }
  });
  
  // Get category breakdown
  app.get("/api/analytics/categories/:userId/:type", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { type } = req.params;
      
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: "Type must be 'income' or 'expense'" });
      }
      
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      
      const startDate = startDateParam ? new Date(startDateParam) : new Date();
      const endDate = endDateParam ? new Date(endDateParam) : new Date();
      
      // If no dates provided, default to current week
      if (!startDateParam) {
        const day = startDate.getDay();
        startDate.setDate(startDate.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
      }
      
      if (!endDateParam) {
        // End of current week
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      }
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      
      const breakdown = await storage.getCategoryBreakdown(userId, type, startDate, endDate);
      res.json(breakdown);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category breakdown", error });
    }
  });

  // WhatsApp webhook endpoint
  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      const whatsappService = WhatsAppService.getInstance();
      await whatsappService.handleIncomingMessage(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error in WhatsApp webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
