import { pgTable, text, serial, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  phoneNumber: true,
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'expense' or 'sale'
  amount: doublePrecision("amount").notNull(),
  category: text("category").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  description: text("description"),
  rawInput: text("raw_input"),
  transcription: text("transcription"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  type: true,
  amount: true,
  category: true,
  description: true,
  rawInput: true,
  transcription: true,
});

// For voice messages
export const audioRecordings = pgTable("audio_recordings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  url: text("url").notNull(),
  transcription: text("transcription"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAudioRecordingSchema = createInsertSchema(audioRecordings).pick({
  userId: true,
  url: true,
});

// Schema for transaction extraction from text/voice
export const transactionExtractionSchema = z.object({
  type: z.enum(["sale", "expense"]),
  amount: z.number().positive(),
  category: z.string(),
  description: z.string().optional(),
  date: z.date().optional(),
});

// Define types from schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type AudioRecording = typeof audioRecordings.$inferSelect;
export type InsertAudioRecording = z.infer<typeof insertAudioRecordingSchema>;

export type TransactionExtraction = z.infer<typeof transactionExtractionSchema>;

// Types for Google Sheets integration
export type SheetRow = {
  timestamp: string;
  type: string;
  amount: number;
  category: string; 
  description?: string;
  userId: number;
  rawInput?: string;
  transcription?: string;
};
