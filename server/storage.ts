import { 
  users, type User, type InsertUser,
  transactions, type Transaction, type InsertTransaction,
  NLPExtractionResult
} from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWhatsappId(whatsappId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction methods
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getTransactionsByUserIdAndType(userId: number, type: string): Promise<Transaction[]>;
  getRecentTransactionsByUserId(userId: number, limit: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Analytics methods
  getDailyTotals(userId: number, date: Date): Promise<{income: number, expense: number, net: number}>;
  getWeeklyTotals(userId: number, startDate: Date): Promise<{income: number, expense: number, net: number}>;
  getCategoryBreakdown(userId: number, type: string, startDate: Date, endDate: Date): Promise<{category: string, amount: number}[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private userIdCounter: number;
  private transactionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
    
    // Load data from file if it exists
    this.loadData();
    
    // Create a demo user if none exists
    this.createUser({
      username: "demo_user",
      password: "password",
      phoneNumber: null,
      whatsappId: null
    }).then(user => {
      console.log("Demo user created:", user);
    });
  }

  private loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        this.users = new Map(Object.entries(data.users || {}).map(([id, user]) => [Number(id), user as User]));
        this.transactions = new Map(Object.entries(data.transactions || {}).map(([id, tx]) => [Number(id), tx as Transaction]));
        this.userIdCounter = data.userIdCounter || 1;
        this.transactionIdCounter = data.transactionIdCounter || 1;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private saveData() {
    try {
      const data = {
        users: Object.fromEntries(this.users),
        transactions: Object.fromEntries(this.transactions),
        userIdCounter: this.userIdCounter,
        transactionIdCounter: this.transactionIdCounter
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByWhatsappId(whatsappId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.whatsappId === whatsappId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      phoneNumber: insertUser.phoneNumber || null,
      whatsappId: insertUser.whatsappId || null
    };
    this.users.set(id, user);
    this.saveData();
    return user;
  }

  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => {
        // Sort by created date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getTransactionsByUserIdAndType(userId: number, type: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId && transaction.type === type)
      .sort((a, b) => {
        // Sort by created date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getRecentTransactionsByUserId(userId: number, limit: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => {
        // Sort by created date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      description: insertTransaction.description || null,
      rawInput: insertTransaction.rawInput || null,
      transcription: insertTransaction.transcription || null,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    this.saveData();
    return transaction;
  }

  // Analytics methods
  async getDailyTotals(userId: number, date: Date): Promise<{ income: number; expense: number; net: number; }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const userTransactions = Array.from(this.transactions.values())
      .filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transaction.userId === userId && 
               transactionDate >= startOfDay && 
               transactionDate <= endOfDay;
      });
    
    const income = userTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = userTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      net: income - expense
    };
  }

  async getWeeklyTotals(userId: number, startDate: Date): Promise<{ income: number; expense: number; net: number; }> {
    const startOfWeek = new Date(startDate);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startDate);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const userTransactions = Array.from(this.transactions.values())
      .filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transaction.userId === userId && 
               transactionDate >= startOfWeek && 
               transactionDate <= endOfWeek;
      });
    
    const income = userTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = userTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      net: income - expense
    };
  }

  async getCategoryBreakdown(userId: number, type: string, startDate: Date, endDate: Date): Promise<{ category: string; amount: number; }[]> {
    const userTransactions = Array.from(this.transactions.values())
      .filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transaction.userId === userId && 
               transaction.type === type &&
               transactionDate >= startDate && 
               transactionDate <= endDate;
      });
    
    const categoryMap = new Map<string, number>();
    
    userTransactions.forEach(transaction => {
      const currentAmount = categoryMap.get(transaction.category) || 0;
      categoryMap.set(transaction.category, currentAmount + transaction.amount);
    });
    
    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount); // Sort by amount descending
  }
}

export const storage = new MemStorage();
