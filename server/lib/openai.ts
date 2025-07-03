import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import { NLPExtractionResult } from "@shared/schema";
import { transcribeAudio } from "../config/speech";

// Commented out to avoid error if OPENAI_API_KEY is missing
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
    
    // If extraction failed, return unknown type
    if (basicResult.type === "unknown" || basicResult.amount === null) {
      return { 
        type: "unknown", 
        amount: null, 
        category: null,
        description: text
      };
    }
    
    // Return the regex result
    return basicResult;
  } catch (error) {
    console.error("Error processing text input:", error);
    return { 
      type: "unknown", 
      amount: null, 
      category: null,
      description: text
    };
  }
}

// Function to process voice note - transcribe and extract transaction details
export async function processVoiceNote(audioBuffer: Buffer): Promise<{
  transcription: string;
  extractionResult: NLPExtractionResult;
}> {
  try {
    console.log('=== Voice Note Processing Start ===');
    console.log('Audio buffer details:', {
      length: audioBuffer.length,
      isBuffer: Buffer.isBuffer(audioBuffer),
      firstBytes: audioBuffer.slice(0, 20).toString('hex')
    });

    // Save audio buffer to file
    const uploadsDir = path.join(process.cwd(), 'server', 'uploads');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `voice-note-${timestamp}.webm`;
    const filepath = path.join(uploadsDir, filename);

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write the audio buffer to file
    fs.writeFileSync(filepath, audioBuffer);
    console.log('✅ Saved audio file to:', filepath);

    // Transcribe the audio using Google Speech-to-Text
    console.log('🔄 Starting transcription...');
    const transcription = await transcribeAudio(audioBuffer);
    
    console.log('✅ Transcription result:', transcription);

    if (!transcription || transcription.trim().length === 0) {
      console.error('❌ No speech detected in the audio');
      throw new Error('No speech detected in the audio');
    }
    
    // Process the transcription
    console.log('🔄 Processing transcription for transaction details...');
    const extractionResult = await processTextInput(transcription);
    
    console.log('✅ Extraction result:', extractionResult);
    console.log('=== Voice Note Processing End ===');

    return {
      transcription,
      extractionResult
    };
  } catch (error) {
    console.error('❌ Voice note processing error:', error);
    throw error;
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
  // If no explicit type is mentioned but we have numbers, assume it's an expense
  else if (/\d+/.test(lowerText)) {
    type = "expense";
  }
  
  // Extract amount - look for number patterns with currency symbols
  // First try to find amounts with currency symbols
  let amountMatch = lowerText.match(/[\$£€](\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)/);
  
  // If not found, look for numbers followed by currency words
  if (!amountMatch) {
    amountMatch = lowerText.match(/(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)\s*(dollars|usd|gbp|eur|naira|cedis|shillings)/i);
  }
  
  // If still not found, look for any number
  if (!amountMatch) {
    amountMatch = lowerText.match(/\b(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)\b/);
  }
  
  // Parse the amount
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[$£€,a-zA-Z]/g, '')) : null;
  
  // Extract category based on items mentioned
  let category: string | null = null;
  
  if (type === "expense") {
    if (/book|books|magazine|newspaper/i.test(lowerText)) {
      category = "Books & Media";
    } else if (/cup|cups|plate|plates|utensil|kitchen/i.test(lowerText)) {
      category = "Kitchen Supplies";
    } else if (/egg|eggs|food|grocery|produce/i.test(lowerText)) {
      category = "Groceries";
    } else if (/transport|taxi|bus|fare|car|petrol|gas|travel/i.test(lowerText)) {
      category = "Transport";
    } else if (/food|lunch|dinner|meal|eat/i.test(lowerText)) {
      category = "Food";
    } else if (/supply|supplies|material|stock|inventory/i.test(lowerText)) {
      category = "Supplies";
    } else if (/rent|lease|office/i.test(lowerText)) {
      category = "Rent";
    } else if (/utility|utilities|electric|water|bill|phone|internet/i.test(lowerText)) {
      category = "Utilities";
    } else if (/salary|wage|staff|employee|worker/i.test(lowerText)) {
      category = "Salaries";
    } else {
      category = "Other Expenses";
    }
  } else if (type === "income") {
    if (/sales|sold|goods|products/i.test(lowerText)) {
      category = "Sales";
    } else if (/service|repair|work/i.test(lowerText)) {
      category = "Services";
    } else {
      category = "Other Income";
    }
  }
  
  return {
    type,
    amount,
    category,
    description: text
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

// Commented out to avoid linter error and because OpenAI is not in use
/*
export async function aiParseTransaction(text: string): Promise<{
  type: 'sale' | 'expense',
  amount: number,
  category: string,
  description: string
}> {
  const prompt = `Extract the following fields from this message:
- type: "sale" for income, "expense" for expense
- amount: the number
- category: a simple category like "Sales", "Food", "Transport", etc.
- description: the original message

Message: "${text}"

Respond in JSON like: {"type": "sale", "amount": ..., "category": "...", "description": "..." }`;

  // const response = await openai.chat.completions.create({
  //   model: "gpt-3.5-turbo",
  //   messages: [{ role: "user", content: prompt }],
  //   temperature: 0,
  // });

  // // Try to extract the JSON from the response
  // const content = response.choices[0].message.content;
  // if (!content) {
  //   throw new Error("OpenAI did not return any content in the response.");
  // }
  // const match = content.match(/\{[\s\S]*\}/);
  // if (match) {
  //   const parsed = JSON.parse(match[0]);
  //   // Ensure type is 'sale' or 'expense'
  //   if (parsed.type === 'income') parsed.type = 'sale';
  //   return parsed;
  // }
  // throw new Error("AI did not return a valid JSON object: " + content);
}
*/
