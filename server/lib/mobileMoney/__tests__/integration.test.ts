import { MobileMoneyService } from '../service';
import { storage } from '../../storage';
import { MobileMoneyMessage } from '../parser';

describe('Mobile Money Integration', () => {
  let mobileMoneyService: MobileMoneyService;
  const testUserId = 1;

  beforeAll(async () => {
    mobileMoneyService = new MobileMoneyService(storage);
  });

  const testMessages: MobileMoneyMessage[] = [
    {
      content: 'You have received UGX 10,000 from John Doe.',
      provider: 'airtel',
      timestamp: new Date()
    },
    {
      content: 'You have sent UGX 5,000 to Supplier Co.',
      provider: 'airtel',
      timestamp: new Date()
    }
  ];

  test('should process received money message', async () => {
    const result = await mobileMoneyService.processMessage(testMessages[0], testUserId);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('sale');
    expect(result?.amount).toBe(10000);
    expect(result?.category).toBe('Other Income');
  });

  test('should process sent money message', async () => {
    const result = await mobileMoneyService.processMessage(testMessages[1], testUserId);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('expense');
    expect(result?.amount).toBe(5000);
    expect(result?.category).toBe('Supplies');
  });

  test('should detect duplicate transactions', async () => {
    // Process the same message twice
    const firstResult = await mobileMoneyService.processMessage(testMessages[0], testUserId);
    const secondResult = await mobileMoneyService.processMessage(testMessages[0], testUserId);
    
    expect(firstResult).not.toBeNull();
    expect(secondResult).toBeNull(); // Should detect duplicate
  });
}); 