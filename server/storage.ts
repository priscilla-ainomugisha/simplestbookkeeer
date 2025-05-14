import { 
  users, type User, type InsertUser,
  transactions, type Transaction, type InsertTransaction,
  NLPExtractionResult
} from "@shared/schema";

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
    
    // Create a default demo user
    this.createDemoUser();
  }
  
  // Initialize with a demo user
  private createDemoUser() {
    const demoUser: User = {
      id: 1,
      username: "demo_user",
      password: "password",
      phoneNumber: "+1234567890",
      whatsappId: "demo_whatsapp"
    };
    
    this.users.set(demoUser.id, demoUser);
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
      createdAt: new Date(),
      description: insertTransaction.description || null,
      rawInput: insertTransaction.rawInput || null,
      transcription: insertTransaction.transcription || null
    };
    this.transactions.set(id, transaction);
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
