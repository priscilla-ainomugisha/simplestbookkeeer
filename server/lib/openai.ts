import OpenAI from "openai";
import fs from "fs";

// Initialize OpenAI with API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key'
});

// Audio transcription function
export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      duration: transcription.duration || 0,
    };
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio: " + (error as Error).message);
  }
}

// Transaction classification and extraction
export async function extractTransactionInfo(text: string) {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial assistant that extracts transaction details from text messages. 
          Extract the following information from the user's message:
          1. Transaction type (sale or expense)
          2. Amount (as a number without currency symbols)
          3. Category (e.g., food, transport, inventory, services)
          4. Description (optional)
          
          Respond with JSON in this format: 
          { 
            "type": "sale" or "expense", 
            "amount": number, 
            "category": "category name", 
            "description": "description if available" 
          }`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("OpenAI extraction error:", error);
    throw new Error("Failed to extract transaction information: " + (error as Error).message);
  }
}
