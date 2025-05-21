import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { parseTransaction } from '../lib/transactionParser';
import multer from 'multer';
import { TransactionExtraction } from '@shared/schema';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

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

export default router; 