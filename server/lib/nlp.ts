import { extractTransactionInfo } from './openai';
import { parseTransaction } from './transactionParser';
import { TransactionExtraction } from '@shared/schema';

export async function extractTransactionDetails(text: string): Promise<TransactionExtraction | TransactionExtraction[] | null> {
  try {
    // First try with OpenAI for best accuracy
    try {
      const openaiExtraction = await extractTransactionInfo(text);
      
      return {
        type: openaiExtraction.type === 'sale' ? 'sale' : 'expense',
        amount: Number(openaiExtraction.amount),
        category: openaiExtraction.category,
        description: openaiExtraction.description,
        date: new Date(),
      };
    } catch (openaiError) {
      console.warn('OpenAI extraction failed, falling back to enhanced parser:', openaiError);
      
      // Use our enhanced transaction parser as a fallback
      const parsedTransaction = parseTransaction(text);
      
      if (parsedTransaction) {
        return parsedTransaction;
      } else {
        console.error('Enhanced parser failed to extract transaction details');
        return null;
      }
    }
  } catch (error) {
    console.error('All transaction extraction methods failed:', error);
    return null;
  }
}
