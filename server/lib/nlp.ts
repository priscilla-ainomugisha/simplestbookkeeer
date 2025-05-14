import { extractTransactionInfo } from './openai';
import { TransactionExtraction } from '@shared/schema';

// Regular expressions for simple extraction fallbacks
const SALE_PATTERNS = [
  /sold\s+(?:for\s+)?(\d+)/i,
  /sale\s+(?:of\s+)?(\d+)/i,
  /earned\s+(\d+)/i,
  /received\s+(\d+)/i,
  /income\s+(?:of\s+)?(\d+)/i,
  /made\s+(\d+)/i,
];

const EXPENSE_PATTERNS = [
  /spent\s+(\d+)/i,
  /paid\s+(\d+)/i,
  /expense\s+(?:of\s+)?(\d+)/i,
  /cost\s+(?:of\s+)?(\d+)/i,
  /bought\s+(?:for\s+)?(\d+)/i,
];

const CATEGORY_PATTERNS = [
  { pattern: /transport|transport|uber|taxi|bus|fare/i, category: 'Transport' },
  { pattern: /food|meal|lunch|dinner|breakfast|snack|restaurant/i, category: 'Food' },
  { pattern: /rent|lease|housing/i, category: 'Rent' },
  { pattern: /utility|utilities|electric|water|gas|bill/i, category: 'Utilities' },
  { pattern: /fabric|material|inventory|stock|goods|merchandise/i, category: 'Inventory' },
  { pattern: /salary|wage|payment|staff|employee/i, category: 'Salaries' },
  { pattern: /phone|internet|data|airtime/i, category: 'Communication' },
];

export async function extractTransactionDetails(text: string): Promise<TransactionExtraction | null> {
  try {
    // First try with OpenAI for best accuracy
    const openaiExtraction = await extractTransactionInfo(text);
    
    return {
      type: openaiExtraction.type === 'sale' ? 'sale' : 'expense',
      amount: Number(openaiExtraction.amount),
      category: openaiExtraction.category,
      description: openaiExtraction.description,
      date: new Date(),
    };
  } catch (error) {
    console.warn('OpenAI extraction failed, falling back to regex:', error);
    
    // Fallback to regex-based extraction
    try {
      // Determine if it's a sale or expense
      let type: 'sale' | 'expense' = 'expense';
      let amount = 0;
      
      // Check for sale patterns
      for (const pattern of SALE_PATTERNS) {
        const match = text.match(pattern);
        if (match && match[1]) {
          type = 'sale';
          amount = parseInt(match[1], 10);
          break;
        }
      }
      
      // If not found as a sale, check for expense patterns
      if (type !== 'sale') {
        for (const pattern of EXPENSE_PATTERNS) {
          const match = text.match(pattern);
          if (match && match[1]) {
            type = 'expense';
            amount = parseInt(match[1], 10);
            break;
          }
        }
      }
      
      // If we couldn't extract an amount, fail
      if (amount === 0) {
        return null;
      }
      
      // Try to determine category
      let category = type === 'sale' ? 'Sales' : 'Miscellaneous';
      for (const { pattern, category: cat } of CATEGORY_PATTERNS) {
        if (pattern.test(text)) {
          category = cat;
          break;
        }
      }
      
      return {
        type,
        amount,
        category,
        description: text,
        date: new Date(),
      };
    } catch (fallbackError) {
      console.error('Regex fallback also failed:', fallbackError);
      return null;
    }
  }
}
