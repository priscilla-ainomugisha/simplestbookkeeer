import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { parseTransaction } from '../lib/transactionParser';
import multer from 'multer';
import { TransactionExtraction } from '@shared/schema';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { transcribeAudio } from '../config/speech';
import os from 'os';

const router = Router();
const prisma = new PrismaClient();

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
    await Promise.all(transactions.map(tx => prisma.transaction.create({ data: tx })));

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

export default router; 