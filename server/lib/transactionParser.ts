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

/**
 * Parse a single sentence to extract transaction details
 */
function parseSingleTransaction(text: string): TransactionExtraction | null {
  try {
    // Determine transaction type and amount
    let transactionType: TransactionType | null = null;
    let amount = 0;
    let categoryFromText = '';
    let personName = '';
    
    // Check for sale patterns
    for (const { regex, type } of PATTERNS.SALE) {
      const match = text.match(regex);
      if (match && match[1]) {
        transactionType = 'sale';
        amount = parseInt(match[1], 10);
        // If there's a product name, extract it
        if (match[2]) categoryFromText = match[2];
        break;
      }
    }
    
    // Check for expense patterns
    if (!transactionType) {
      for (const { regex, type } of PATTERNS.EXPENSE) {
        const match = text.match(regex);
        if (match) {
          transactionType = 'expense';
          // Regex variations for expenses can have amount in different positions
          if (type === 'expense' && match[2] && !isNaN(parseInt(match[2], 10))) {
            amount = parseInt(match[2], 10);
            categoryFromText = match[1] || '';
          } else {
            amount = parseInt(match[1], 10);
            categoryFromText = match[2] || '';
          }
          break;
        }
      }
    }
    
    // Check for loan patterns
    if (!transactionType) {
      for (const { regex, type } of PATTERNS.LOAN) {
        const match = text.match(regex);
        if (match && match[1]) {
          transactionType = 'loan';
          amount = parseInt(match[1], 10);
          personName = match[2] || '';
          break;
        }
      }
    }
    
    // Check for opening balance patterns
    if (!transactionType) {
      for (const { regex, type } of PATTERNS.OPENING_BALANCE) {
        const match = text.match(regex);
        if (match && match[1]) {
          transactionType = 'opening_balance';
          amount = parseInt(match[1], 10);
          break;
        }
      }
    }
    
    // If we couldn't extract a transaction type or amount, return null
    if (!transactionType || amount === 0) {
      return null;
    }
    
    // Determine category (either from explicit text or by inferring from context)
    let category = '';
    
    // If we've already found a category from the text, use that
    if (categoryFromText) {
      // Capitalize first letter
      category = categoryFromText.charAt(0).toUpperCase() + categoryFromText.slice(1);
    } else {
      // Infer category from text
      for (const { pattern, category: cat } of CATEGORY_PATTERNS) {
        if (pattern.test(text)) {
          category = cat;
          break;
        }
      }
    }
    
    // Set default categories if none found
    if (!category) {
      switch (transactionType) {
        case 'sale':
          category = 'Sales';
          break;
        case 'expense':
          category = 'Miscellaneous';
          break;
        case 'loan':
          category = personName ? `Loan from ${personName}` : 'Loan';
          break;
        case 'opening_balance':
          category = 'Opening Balance';
          break;
      }
    }
    
    // Handle special transaction types
    if (transactionType === 'loan' || transactionType === 'opening_balance') {
      // For now, we'll map these to sales or expenses to fit into our existing model
      // In a real app, you'd want to expand the data model to handle these types
      if (transactionType === 'loan') {
        transactionType = 'sale'; // Borrowed money comes in (like a sale)
      } else if (transactionType === 'opening_balance') {
        transactionType = 'sale'; // Opening balance is initial money (like a sale)
      }
    }
    
    // Create the transaction extraction object
    return {
      type: transactionType as 'sale' | 'expense', // Cast needed because we mapped loan/opening_balance
      amount,
      category,
      description: text,
      date: new Date(),
    };
    
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return null;
  }
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