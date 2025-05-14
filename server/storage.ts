import { 
  users, type User, type InsertUser,
  transactions, type Transaction, type InsertTransaction,
  audioRecordings, type AudioRecording, type InsertAudioRecording
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction management
  createTransaction(transaction: Omit<InsertTransaction, 'date'>): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getTransactionHistory(days: number): Promise<Transaction[]>;
  getTodayStats(): Promise<{ revenue: number; expenses: number; profit: number }>;
  
  // Audio recording management
  createAudioRecording(recording: InsertAudioRecording): Promise<AudioRecording>;
  updateAudioRecordingTranscription(id: number, transcription: string): Promise<AudioRecording | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private audioRecordings: Map<number, AudioRecording>;
  private userIdCounter: number;
  private transactionIdCounter: number;
  private audioRecordingIdCounter: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.audioRecordings = new Map();
    this.userIdCounter = 1;
    this.transactionIdCounter = 1;
    this.audioRecordingIdCounter = 1;
    
    // Add a test user
    this.createUser({
      username: 'testuser',
      password: 'password123',
      phoneNumber: '+1234567890'
    });
    
    // Add some sample transactions for the demo
    this.createTransaction({
      userId: 1,
      type: 'sale',
      amount: 2500,
      category: 'Fabric',
      description: 'Sold fabrics',
      rawInput: 'I sold fabrics for 2500',
      transcription: 'I sold fabrics for 2500'
    });
    
    this.createTransaction({
      userId: 1,
      type: 'expense',
      amount: 700,
      category: 'Transport',
      description: 'Transport expenses',
      rawInput: 'Spent 700 on transport today',
      transcription: 'Spent 700 on transport today'
    });
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Transaction methods
  async createTransaction(transactionData: Omit<InsertTransaction, 'date'>): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const transaction: Transaction = {
      ...transactionData,
      id,
      date: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...updates };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date DESC
  }
  
  async getTransactionHistory(days: number): Promise<Transaction[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.date >= cutoffDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date DESC
  }
  
  async getTodayStats(): Promise<{ revenue: number; expenses: number; profit: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = Array.from(this.transactions.values())
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        transactionDate.setHours(0, 0, 0, 0);
        return transactionDate.getTime() === today.getTime();
      });
    
    const revenue = todayTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      revenue,
      expenses,
      profit: revenue - expenses
    };
  }
  
  // Audio recording methods
  async createAudioRecording(recording: InsertAudioRecording): Promise<AudioRecording> {
    const id = this.audioRecordingIdCounter++;
    const audioRecording: AudioRecording = {
      ...recording,
      id,
      transcription: null,
      processedAt: null,
      createdAt: new Date(),
    };
    this.audioRecordings.set(id, audioRecording);
    return audioRecording;
  }
  
  async updateAudioRecordingTranscription(id: number, transcription: string): Promise<AudioRecording | undefined> {
    const recording = this.audioRecordings.get(id);
    if (!recording) return undefined;
    
    const updatedRecording = {
      ...recording,
      transcription,
      processedAt: new Date(),
    };
    this.audioRecordings.set(id, updatedRecording);
    return updatedRecording;
  }
}

export const storage = new MemStorage();
