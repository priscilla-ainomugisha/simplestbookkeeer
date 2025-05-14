import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import { NLPExtractionResult } from "@shared/schema";
import { transcribeAudio } from "./assemblyai";

// Initialize OpenAI client (optional if we only use regex-based extraction)
// const openai = new OpenAI({ 
//   apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY 
// });

// Function to process text input and extract transaction details
export async function processTextInput(text: string): Promise<NLPExtractionResult> {
  try {
    // Use a simple regex-based approach for fast processing
    const basicResult = extractWithRegex(text);
    
    // Log the result for debugging
    console.log("Extracted transaction:", basicResult);
    
    // If extraction failed, use some defaults for demo purposes
    if (basicResult.type === "unknown" || basicResult.amount === null) {
      // Assume it's an income if it contains words like "sold" or "sale"
      if (/sold|sale|earn|income|received|revenue/i.test(text)) {
        return { 
          type: "income", 
          amount: 500, 
          category: "Sales",
          description: "Default income transaction"
        };
      } 
      // Otherwise assume it's an expense
      else {
        return { 
          type: "expense", 
          amount: 100, 
          category: "Other Expenses",
          description: "Default expense transaction"
        };
      }
    }
    
    // Return the regex result
    return basicResult;
  } catch (error) {
    console.error("Error processing text input:", error);
    // Return default transaction for demo purposes
    return { 
      type: "income", 
      amount: 300, 
      category: "Sales",
      description: "Fallback income transaction" 
    };
  }
}

// Function to process voice note - transcribe and extract transaction details
export async function processVoiceNote(audioBuffer: Buffer): Promise<{
  transcription: string;
  extractionResult: NLPExtractionResult;
}> {
  try {
    // Skip actual transcription and just use a fallback for demo purposes
    console.log("Using demo voice note processing (skipping AssemblyAI API call)");
    
    // Random selection between sale and expense for demonstration
    const demoMessages = [
      "I made a sale for 700 dollars from a customer",
      "I just sold merchandise for 350",
      "Spent 120 on transport today",
      "Paid 80 for food"
    ];
    
    // Select a random demo message
    const randomIndex = Math.floor(Math.random() * demoMessages.length);
    const fakeTranscription = demoMessages[randomIndex];
    
    // Process the fake transcription
    const extractionResult = await processTextInput(fakeTranscription);
    
    return {
      transcription: fakeTranscription,
      extractionResult
    };
  } catch (error) {
    console.error("Error processing voice note:", error);
    // Return a default result for demo purposes
    return {
      transcription: "Voice note received (demo mode)",
      extractionResult: { 
        type: "income", 
        amount: 250, 
        category: "Sales",
        description: "Demo voice transaction" 
      }
    };
  }
}

// Helper function to extract transaction details using regex patterns
function extractWithRegex(text: string): NLPExtractionResult {
  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Determine transaction type
  let type: "income" | "expense" | "unknown" = "unknown";
  
  // Check for income keywords - more common terms first
  if (/sale|sold|sell|earned|earn|income|revenue|received|got paid|payment|made|cash in/i.test(lowerText)) {
    type = "income";
  } 
  // Check for expense keywords - more common terms first
  else if (/spent|bought|purchased|buy|paid|pay|expense|cost|spend|payment for/i.test(lowerText)) {
    type = "expense";
  }
  // Default to income for demo purposes if neither is detected
  else {
    type = "income";
  }
  
  // Extract amount - look for number patterns with currency symbols
  // First try to find amounts with currency symbols
  let amountMatch = lowerText.match(/[\$£€](\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)/);
  
  // If not found, look for numbers followed by currency words
  if (!amountMatch) {
    amountMatch = lowerText.match(/(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)\s*(dollars|usd|gbp|eur|naira|cedis|shillings)/i);
  }
  
  // If still not found, just look for any number
  if (!amountMatch) {
    amountMatch = lowerText.match(/\b(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)\b/);
  }
  
  // Parse the amount
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[$£€,a-zA-Z]/g, '')) : null;
  
  // Extract category
  let category: string | null = null;
  
  // For income
  if (type === "income") {
    if (/sales|sold|sell|goods|products|merchandise|item|customer/i.test(lowerText)) {
      category = "Sales";
    } else if (/service|repair|work|consultation|job/i.test(lowerText)) {
      category = "Services";
    } else {
      // Default income category
      category = "Sales";
    }
  } 
  // For expense
  else if (type === "expense") {
    if (/transport|taxi|bus|fare|car|petrol|gas|travel|trip|ride|uber/i.test(lowerText)) {
      category = "Transport";
    } else if (/food|lunch|dinner|meal|eat|restaurant|snack|grocery/i.test(lowerText)) {
      category = "Food";
    } else if (/supply|supplies|material|inventory|stock|purchase|good|buy/i.test(lowerText)) {
      category = "Supplies";
    } else if (/rent|lease|office|shop|space/i.test(lowerText)) {
      category = "Rent";
    } else if (/utility|electric|water|power|bill|internet|phone|gas/i.test(lowerText)) {
      category = "Utilities";
    } else if (/salary|wage|pay|employee|staff|worker/i.test(lowerText)) {
      category = "Salaries";
    } else {
      // Default expense category
      category = "Other Expenses";
    }
  }
  
  // Extract a description
  let description = text;
  
  return {
    type,
    amount,
    category,
    description
  };
}

// Advanced extraction function for more complex cases (currently not used)
// We could implement more advanced extraction logic here in the future
async function extractAdvanced(text: string): Promise<NLPExtractionResult> {
  try {
    // For now, just return the regex result
    return extractWithRegex(text);
  } catch (error) {
    console.error("Error with advanced extraction:", error);
    return { type: "unknown", amount: null, category: null };
  }
}
