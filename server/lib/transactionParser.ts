import { TransactionExtraction } from '@shared/schema';

// Define transaction types
type TransactionType = 'sale' | 'expense' | 'loan' | 'opening_balance';

// Sentence splitting patterns
const SENTENCE_DELIMITERS = [
  /\.\s+/,  // Period followed by whitespace
  /\.\s*$/,  // Period at the end of text
  /\s+and\s+/i, // "and" with spaces around it
  /\s+then\s+/i, // "then" with spaces around it
  /\;\s*/, // Semicolons
  /\,\s+(?=(?:I|we)\s+)/i, // Comma followed by a subject ("I" or "we")
  /\s+also\s+/i, // "also" with spaces around it
];

// Transaction patterns with regex
const PATTERNS = {
  // Sale patterns (e.g., "Sold tomatoes 1500", "Sold for 300", "Sales 500")
  SALE: [
    { regex: /sold\s+(?:\w+\s+)?(?:for\s+)?(\d+)/i, type: 'sale' },
    { regex: /sales?\s+(?:of\s+)?(\d+)/i, type: 'sale' },
    { regex: /earned\s+(\d+)/i, type: 'sale' },
    { regex: /income\s+(?:of\s+)?(\d+)/i, type: 'sale' },
    { regex: /received\s+(\d+)(?:\s+(?:from|for))/i, type: 'sale' },
    { regex: /made\s+(\d+)/i, type: 'sale' },
  ],
  
  // Expense patterns (e.g., "Spent 200 on transport", "Paid 300 for rent", "Bought goods for 500")
  EXPENSE: [
    { regex: /spent\s+(\d+)(?:\s+(?:on|for)\s+(\w+))?/i, type: 'expense' },
    { regex: /paid\s+(\d+)(?:\s+(?:on|for)\s+(\w+))?/i, type: 'expense' },
    { regex: /bought\s+(?:(\w+)\s+)?(?:for\s+)?(\d+)/i, type: 'expense' },
    { regex: /expense\s+(?:of\s+)?(\d+)(?:\s+(?:on|for)\s+(\w+))?/i, type: 'expense' },
    { regex: /cost\s+(?:of\s+)?(\d+)/i, type: 'expense' },
  ],
  
  // Loan patterns (e.g., "Borrowed 300 from John", "Loan 500 from bank", "Lent 200 to Mary")
  LOAN: [
    { regex: /borrowed\s+(\d+)(?:\s+from\s+(\w+))?/i, type: 'loan' },
    { regex: /loan\s+(?:of\s+)?(\d+)(?:\s+from\s+(\w+))?/i, type: 'loan' },
    { regex: /lent\s+(\d+)(?:\s+to\s+(\w+))?/i, type: 'loan' },
  ],
  
  // Opening balance patterns (e.g., "Opening balance 5000", "Starting with 1000")
  OPENING_BALANCE: [
    { regex: /opening\s+balance\s+(\d+)/i, type: 'opening_balance' },
    { regex: /starting\s+(?:with\s+)?(\d+)/i, type: 'opening_balance' },
    { regex: /balance\s+(?:of\s+)?(\d+)/i, type: 'opening_balance' },
  ]
};

// Common categories for different transaction types
const CATEGORY_PATTERNS = [
  // Sales categories
  { pattern: /tomato|vegetable|fruit|food|produce/i, category: 'Produce' },
  { pattern: /cloth|fabric|textile|garment|dress|shirt|pant/i, category: 'Clothing' },
  { pattern: /phone|electronic|gadget|device/i, category: 'Electronics' },
  { pattern: /service|repair|fix/i, category: 'Services' },
  
  // Expense categories
  { pattern: /transport|transport|uber|taxi|bus|fare|travel/i, category: 'Transport' },
  { pattern: /food|meal|lunch|dinner|breakfast|snack|restaurant/i, category: 'Food' },
  { pattern: /rent|lease|housing/i, category: 'Rent' },
  { pattern: /utility|utilities|electric|water|gas|bill|power/i, category: 'Utilities' },
  { pattern: /salary|wage|payment|staff|employee/i, category: 'Salaries' },
  { pattern: /phone|internet|data|airtime|call/i, category: 'Communication' },
  { pattern: /stock|inventory|supplies|goods|material/i, category: 'Inventory' },
  
  // Loan categories
  { pattern: /bank|financial|institution/i, category: 'Bank Loan' },
  { pattern: /friend|family|personal|relative|individual/i, category: 'Personal Loan' },
];

const SALE_PATTERNS = [
  /sold\s+(\d+)\s+(\w+)\s+at\s+(\d+)(?:\s+each)?/i,  // "sold 10 tomatoes at 150 each"
  /sold\s+(\d+)\s+(?:\w+)\s+(?:at|for)\s+(\d+)/i,  // "sold 4 eggs at 3030"
  /sold\s+(?:\w+\s+)?(?:for\s+)?(\d+)/i,  // "sold for 300"
  /sale\s+(?:of\s+)?(?:\w+\s+)?(?:for\s+)?(\d+)/i,  // "sale of items for 500"
  /sold\s+(?:items?\s+)?(?:for\s+)?(\d+)/i  // "sold items for 400"
];

const EXPENSE_PATTERNS = [
  /spent\s+(\d+)(?:\s+(?:on|for)\s+(\w+))?/i,
  /bought\s+(?:\w+\s+)?(?:for\s+)?(\d+)/i,
  /purchase\s+(?:of\s+)?(?:\w+\s+)?(?:for\s+)?(\d+)/i
];

const LOAN_PATTERNS = [
  /borrowed\s+(\d+)(?:\s+from\s+(\w+))?/i,
  /loan\s+(?:of\s+)?(\d+)(?:\s+from\s+(\w+))?/i
];

const OPENING_BALANCE_PATTERNS = [
  /opening\s+balance\s+(\d+)/i,
  /initial\s+balance\s+(\d+)/i
];

/**
 * Parse a single sentence to extract transaction details
 */
export function parseSingleTransaction(text: string): TransactionExtraction | null {
  // Try to match sale patterns first
  for (const pattern of SALE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // For patterns with quantity, item, and unit price (e.g., "sold 10 tomatoes at 150 each")
      if (match.length > 3) {
        const quantity = parseInt(match[1]);
        const item = match[2];
        const unitPrice = parseInt(match[3]);
        const total = quantity * unitPrice;
        
        return {
          type: 'sale',
          amount: total,
          category: 'sales',
          description: `${quantity} ${item} at ${unitPrice} each`,
          date: new Date(),
          isSale: true,
          quantity,
          unitPrice,
          item
        };
      }
      
      // For patterns with both quantity and price (e.g., "sold 4 eggs at 3030")
      if (match.length > 2) {
        const quantity = parseInt(match[1]);
        const price = parseInt(match[2]);
        return {
          type: 'sale',
          amount: price,
          category: 'sales',
          description: text,
          date: new Date(),
          isSale: true,
          quantity
        };
      }
      
      // For patterns with just amount
      return {
        type: 'sale',
        amount: parseInt(match[1]),
        category: 'sales',
        description: text,
        date: new Date(),
        isSale: true
      };
    }
  }
    
  // Try to match expense patterns
  for (const pattern of EXPENSE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'expense',
        amount: parseInt(match[1]),
        category: match[2] || 'general',
        description: text,
        date: new Date()
      };
    }
  }
    
  // Try to match loan patterns
  for (const pattern of LOAN_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'expense',
        amount: parseInt(match[1]),
        category: 'loans',
        description: text,
        date: new Date()
      };
    }
  }
    
  // Try to match opening balance patterns
  for (const pattern of OPENING_BALANCE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'expense',
        amount: parseInt(match[1]),
        category: 'opening_balance',
        description: text,
        date: new Date()
      };
    }
  }

  return null;
}

/**
 * Split text into separate transaction sentences
 */
function splitIntoSentences(text: string): string[] {
  // Initial split by delimiters
  let sentences: string[] = [text];
  
  // Apply each delimiter pattern
  for (const delimiter of SENTENCE_DELIMITERS) {
    let newSentences: string[] = [];
    for (const sentence of sentences) {
      // Split by current delimiter
      const splits = sentence.split(delimiter).filter(s => s.trim().length > 0);
      newSentences.push(...splits);
    }
    sentences = newSentences;
  }
  
  // Clean up and remove any empty sentences
  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Parse text to extract transaction details
 * Returns an array of transactions if multiple are detected
 */
export function parseTransaction(text: string): TransactionExtraction | TransactionExtraction[] | null {
  try {
    // Split the input text into potential separate transactions
    const sentences = splitIntoSentences(text);
    
    // If there's only one sentence, process it directly
    if (sentences.length === 1) {
      return parseSingleTransaction(sentences[0]);
    }
    
    // Otherwise, try to parse each sentence as a separate transaction
    const transactions: TransactionExtraction[] = [];
    
    for (const sentence of sentences) {
      const transaction = parseSingleTransaction(sentence);
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
    // Return null if no transactions were found
    if (transactions.length === 0) {
      return null;
    }
    
    // Return array of transactions
    return transactions;
    
  } catch (error) {
    console.error('Error parsing transactions:', error);
    return null;
  }
}

export function parseTransactions(text: string): TransactionExtraction[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const transactions: TransactionExtraction[] = [];

  for (const line of lines) {
    const transaction = parseSingleTransaction(line);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  return transactions;
}