import { BaseMobileMoneyParser, MobileMoneyMessage } from './parser';

export class AirtelMoneyParser extends BaseMobileMoneyParser {
  protected patterns = {
    received: /You have received UGX (\d+(?:,\d+)*) from/i,
    sent: /You have sent UGX (\d+(?:,\d+)*) to/i,
    amount: /UGX (\d+(?:,\d+)*)/i,
    sender: /from ([A-Za-z0-9\s]+?)(?:\.|$)/i,
    receiver: /to ([A-Za-z0-9\s]+?)(?:\.|$)/i,
  };

  canParse(message: MobileMoneyMessage): boolean {
    return message.provider.toLowerCase() === 'airtel' &&
           (this.patterns.received.test(message.content) || 
            this.patterns.sent.test(message.content));
  }

  protected determineCategory(type: 'sale' | 'expense', sender?: string | null, receiver?: string | null): string {
    if (type === 'sale') {
      // You can add more sophisticated logic here based on sender name patterns
      if (sender?.toLowerCase().includes('customer')) {
        return 'Sales';
      }
      return 'Other Income';
    }
    
    // For expenses, you can add logic based on receiver name patterns
    if (receiver?.toLowerCase().includes('supplier')) {
      return 'Supplies';
    }
    return 'Other Expense';
  }
} 