import { TransactionExtraction } from '@shared/schema';

export interface MobileMoneyMessage {
  content: string;
  provider: string;
  timestamp: Date;
}

export interface MobileMoneyParser {
  canParse(message: MobileMoneyMessage): boolean;
  parse(message: MobileMoneyMessage): Promise<TransactionExtraction>;
}

export abstract class BaseMobileMoneyParser implements MobileMoneyParser {
  protected abstract patterns: {
    received: RegExp;
    sent: RegExp;
    amount: RegExp;
    sender: RegExp;
    receiver: RegExp;
  };

  abstract canParse(message: MobileMoneyMessage): boolean;

  protected extractAmount(text: string): number {
    const match = text.match(this.patterns.amount);
    if (!match) return 0;
    // Remove currency symbol and commas, then parse as number
    return parseInt(match[1].replace(/[^0-9]/g, ''));
  }

  protected extractSender(text: string): string | null {
    const match = text.match(this.patterns.sender);
    return match ? match[1].trim() : null;
  }

  protected extractReceiver(text: string): string | null {
    const match = text.match(this.patterns.receiver);
    return match ? match[1].trim() : null;
  }

  protected determineCategory(type: 'sale' | 'expense', sender?: string | null, receiver?: string | null): string {
    if (type === 'sale') {
      return 'Sales'; // Default category for income
    }
    return 'Other Expense'; // Default category for expenses
  }

  async parse(message: MobileMoneyMessage): Promise<TransactionExtraction> {
    const { content } = message;
    
    // Determine if it's a received or sent transaction
    const isReceived = this.patterns.received.test(content);
    const isSent = this.patterns.sent.test(content);
    
    if (!isReceived && !isSent) {
      throw new Error('Unable to determine transaction type');
    }

    const amount = this.extractAmount(content);
    const sender = this.extractSender(content);
    const receiver = this.extractReceiver(content);
    
    return {
      type: isReceived ? 'sale' : 'expense',
      amount,
      category: this.determineCategory(isReceived ? 'sale' : 'expense', sender, receiver),
      description: isReceived 
        ? `Received from ${sender || 'unknown'}`
        : `Sent to ${receiver || 'unknown'}`,
      date: message.timestamp,
    };
  }
} 