import { Transaction } from '@/hooks/use-snapshot';

/**
 * Parse a text message to extract transaction details
 * @param text The text message to parse
 * @returns Transaction object or null if no transaction could be parsed
 */
export function parseTransaction(text: string): Omit<Transaction, 'date'> | null {
  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Determine transaction type
  let type: Transaction['type'] = 'expense'; // Default
  
  // Sale detection
  if (/sold|sell|sale|earn|income|revenue|received|payment/i.test(lowerText)) {
    type = 'sale';
  } 
  // Loan detection
  else if (/borrow|loan|credit|lend|borrowed|loaned/i.test(lowerText)) {
    type = 'loan';
  }
  // Capital detection 
  else if (/invest|capital|contribution|invested/i.test(lowerText)) {
    type = 'capital';
  }
  // Inventory detection
  else if (/stock|inventory|supplies|goods|purchased goods/i.test(lowerText)) {
    type = 'inventory';
  }
  // Expense detection (default)
  
  // Extract amount - find numbers in the text
  const amountMatch = lowerText.match(/[\$£€]?\s*(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)/);
  if (!amountMatch) return null;
  
  const amount = parseFloat(amountMatch[0].replace(/[^0-9.]/g, ''));
  if (isNaN(amount) || amount <= 0) return null;
  
  // Extract item or category
  let item = '';
  let category = '';
  
  // For sales, try to extract what was sold
  if (type === 'sale') {
    // Look for "sold X" or "X sales" patterns
    const itemMatch = lowerText.match(/sold\s+([a-z0-9\s]+)(?=\s+for|\s+at|\s+\d|$)/i) || 
                     lowerText.match(/([a-z0-9\s]+)\s+sales/i);
    
    if (itemMatch && itemMatch[1]) {
      item = itemMatch[1].trim();
    }
    
    category = item ? item : 'Sales';
  }
  // For expenses, try to extract what was bought
  else if (type === 'expense') {
    // Look for "spent X on Y" or "paid X for Y" patterns
    const categoryMatch = lowerText.match(/(?:spent|paid|bought|purchased).*(?:on|for)\s+([a-z0-9\s]+)(?=\s+for|\s+at|\s+\d|$)/i);
    
    if (categoryMatch && categoryMatch[1]) {
      category = categoryMatch[1].trim();
    }
    
    // Categorize common expenses
    if (/transport|fare|taxi|bus|ride|travel/i.test(category)) {
      category = 'Transport';
    } else if (/food|lunch|dinner|meal|eat/i.test(category)) {
      category = 'Food';
    } else if (/rent|lease|office/i.test(category)) {
      category = 'Rent';
    } else if (/utility|electric|water|bill|internet|phone/i.test(category)) {
      category = 'Utilities';
    } else if (/salary|wage|staff|employee/i.test(category)) {
      category = 'Salaries';
    } else if (!category) {
      category = 'Other Expenses';
    }
  }
  // For loans, try to extract who loaned the money
  else if (type === 'loan') {
    // Look for "borrowed from X" patterns
    const sourceMatch = lowerText.match(/borrowed.*from\s+([a-z0-9\s]+)(?=\s+for|\s+at|\s+\d|$)/i) ||
                       lowerText.match(/loan.*from\s+([a-z0-9\s]+)(?=\s+for|\s+at|\s+\d|$)/i);
    
    if (sourceMatch && sourceMatch[1]) {
      item = sourceMatch[1].trim();
    }
    
    category = 'Loans';
  }
  // For inventory, try to extract what inventory was purchased
  else if (type === 'inventory') {
    // Look for inventory item
    const inventoryMatch = lowerText.match(/(?:bought|purchased)\s+([a-z0-9\s]+)(?=\s+for|\s+at|\s+\d|$)/i) ||
                          lowerText.match(/inventory\s+of\s+([a-z0-9\s]+)(?=\s+for|\s+at|\s+\d|$)/i);
    
    if (inventoryMatch && inventoryMatch[1]) {
      item = inventoryMatch[1].trim();
    }
    
    category = 'Inventory';
  }
  // For capital, it's just capital
  else if (type === 'capital') {
    category = 'Capital';
  }
  
  return {
    type,
    amount,
    category,
    item,
    description: text
  };
}