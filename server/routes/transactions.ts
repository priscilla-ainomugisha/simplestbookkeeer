import { Router, Request, Response } from 'express';
import { parseTransaction } from '../lib/transactionParser';
import multer from 'multer';
import { TransactionExtraction } from '@shared/schema';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { transcribeAudio } from '../config/speech';
import os from 'os';
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { geminiParseTransaction } from "../lib/geminiParser";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

router.post("/initial-balance", async (req: Request, res: Response) => {
  try {
    const { userId, cash, inventory, accountsReceivable, accountsPayable, loans, initialCapital } = req.body;

    // Create initial balance sheet transactions
    const transactions = [
      {
        user_id: userId,
        type: 'opening_balance',
        amount: cash,
        category: 'cash',
        description: 'Initial cash balance',
        date: new Date().toISOString(),
        metadata: { isInitialBalance: true }
      },
      {
        user_id: userId,
        type: 'opening_balance',
        amount: inventory,
        category: 'inventory',
        description: 'Initial inventory value',
        date: new Date().toISOString(),
        metadata: { isInitialBalance: true }
      },
      {
        user_id: userId,
        type: 'opening_balance',
        amount: accountsReceivable,
        category: 'accounts_receivable',
        description: 'Initial accounts receivable',
        date: new Date().toISOString(),
        metadata: { isInitialBalance: true }
      },
      {
        user_id: userId,
        type: 'opening_balance',
        amount: accountsPayable,
        category: 'accounts_payable',
        description: 'Initial accounts payable',
        date: new Date().toISOString(),
        metadata: { isInitialBalance: true }
      },
      {
        user_id: userId,
        type: 'opening_balance',
        amount: loans,
        category: 'loans',
        description: 'Initial loans',
        date: new Date().toISOString(),
        metadata: { isInitialBalance: true }
      },
      {
        user_id: userId,
        type: 'opening_balance',
        amount: initialCapital,
        category: 'owner_equity',
        description: 'Initial capital',
        date: new Date().toISOString(),
        metadata: { isInitialBalance: true }
      }
    ];

    // Save all transactions using Supabase
    const { error } = await supabase
      .from('transactions')
      .insert(transactions);

    if (error) {
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving initial balance:', error);
    res.status(500).json({ error: 'Failed to save initial balance' });
  }
});

// Voice note transcription endpoint
router.post('/voice', upload.single('voiceNote'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Received audio file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fieldname: req.file.fieldname,
      bufferLength: req.file.buffer.length
    });

    // Log audio buffer details for debugging
    console.log('Audio buffer details:', {
      size: req.file.buffer.length,
      isBuffer: Buffer.isBuffer(req.file.buffer),
      firstBytes: req.file.buffer.slice(0, 20).toString('hex'),
      mimetype: req.file.mimetype
    });

    // Validate audio buffer
    if (!req.file.buffer || req.file.buffer.length < 100) {
      throw new Error('Audio buffer is too small or empty');
    }

    // Send directly to Google Speech-to-Text
    console.log('Starting transcription...');
    const transcription = await transcribeAudio(req.file.buffer);
    console.log('Transcription result:', transcription);

    if (!transcription) {
      throw new Error('No transcription results returned - the audio might be empty or in an unsupported format');
    }

    // Return the transcription
    res.json({ transcription });
  } catch (error) {
    console.error('Error processing voice note:', error);
    res.status(500).json({
      message: 'Failed to process voice note',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Process text-based transaction
router.post('/text', async (req: Request, res: Response) => {
  try {
    const { userId, text } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ 
        error: "Database error while fetching user",
        details: userError
      });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Try Gemini AI parser first
    let transactions = [];
    try {
      const aiResult = await geminiParseTransaction(text);
      transactions = [aiResult];
    } catch (aiError) {
      console.error('Gemini parse failed, falling back to pattern parser:', aiError);
      // Fallback to pattern-based parser
      const transactionDetails = parseTransaction(text);
      if (!transactionDetails) {
        return res.status(400).json({ 
          message: "Could not extract transaction details from text",
          text
        });
      }
      transactions = Array.isArray(transactionDetails) ? transactionDetails : [transactionDetails];
    }

    const createdTransactions = [];
    for (const details of transactions as Array<{ date?: string | Date; description?: string; amount: number; type?: string; category?: string }>) {
      // Use the parsed fields from Gemini or fallback
      const description = details.description || text;
      const date = new Date().toISOString().slice(0, 10);
      let type = details.type || 'expense';
      let category = details.category || 'general';
      // Debug log
      console.log('Insert object:', { amount: details.amount, description, type, category, date });
      // Create the sales record
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          id: uuidv4(),
          user_id: userId,
          amount: details.amount,
          description,
          type,
          category,
          date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (saleError) {
        console.error('Error creating sale:', saleError);
        return res.status(500).json({ 
          error: "Failed to create sale",
          details: saleError.message || JSON.stringify(saleError) || saleError
        });
      }

      createdTransactions.push(sale);
    }

    res.status(201).json({
      success: true,
      transactions: createdTransactions
    });

  } catch (error) {
    console.error('Error processing text transaction:', error);
    res.status(500).json({
      message: "Failed to process transaction",
      error: error instanceof Error ? error.message : JSON.stringify(error) || String(error)
    });
  }
});

// Fetch a transaction by its transactionId (UUID)
router.get('/by-id/:transactionId', async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  try {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('Error fetching transaction:', error);
      return res.status(500).json({ message: 'Database error', error });
    }

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (err) {
    console.error('Unexpected error fetching transaction:', err);
    res.status(500).json({ message: 'Unexpected error', error: err instanceof Error ? err.message : String(err) });
  }
});

export default router; 