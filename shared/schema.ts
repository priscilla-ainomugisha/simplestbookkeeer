import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  whatsappId: text("whatsapp_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  phoneNumber: true,
  whatsappId: true,
});

// Transaction model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "income" or "expense"
  amount: integer("amount").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Transaction categories
export const INCOME_CATEGORIES = ["Sales", "Services", "Other Income"];
export const EXPENSE_CATEGORIES = ["Transport", "Food", "Supplies", "Rent", "Utilities", "Salaries", "Other Expenses"];

// Define the NLP extraction result type
export interface NLPExtractionResult {
  type: "income" | "expense" | "unknown";
  amount: number | null;
  category: string | null;
  description?: string;
}
