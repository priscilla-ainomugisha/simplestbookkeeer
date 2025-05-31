import { MobileMoneyMessage, MobileMoneyParser } from './parser';
import { AirtelMoneyParser } from './airtelParser';
import { TransactionExtraction } from '@shared/schema';
import { IStorage } from '../storage';

export class MobileMoneyService {
  private parsers: MobileMoneyParser[];

  constructor(private storage: IStorage) {
    this.parsers = [
      new AirtelMoneyParser(),
      // Add more parsers here as needed
    ];
  }

  async processMessage(message: MobileMoneyMessage, userId: number): Promise<TransactionExtraction | null> {
    // Find a parser that can handle this message
    const parser = this.parsers.find(p => p.canParse(message));
    if (!parser) {
      throw new Error(`No parser found for provider: ${message.provider}`);
    }

    // Parse the message
    const transaction = await parser.parse(message);

    // Check for duplicates by looking at recent transactions
    const recentTransactions = await this.storage.getRecentTransactionsByUserId(userId, 10);
    const isDuplicate = recentTransactions.some(t => 
      t.amount === transaction.amount &&
      t.type === transaction.type &&
      Math.abs(new Date(t.createdAt).getTime() - transaction.date.getTime()) < 5 * 60 * 1000 // 5 minutes window
    );

    if (isDuplicate) {
      return null;
    }

    // Create the transaction
    await this.storage.createTransaction({
      userId,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      rawInput: message.content,
      transcription: null,
    });

    return transaction;
  }
} 