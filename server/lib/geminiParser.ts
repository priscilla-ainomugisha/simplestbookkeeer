import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function geminiParseTransaction(text: string): Promise<{
  type: "sale" | "expense",
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

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text();

  // Try to extract the JSON from the response
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    const parsed = JSON.parse(match[0]);
    // Ensure type is 'sale' or 'expense'
    if (parsed.type === 'income') parsed.type = 'sale';
    return parsed;
  }
  throw new Error("Gemini did not return a valid JSON object: " + content);
} 