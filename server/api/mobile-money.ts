import { MobileMoneyService } from '../lib/mobileMoney/service';
import { storage } from '../storage';
import { z } from 'zod';

const mobileMoneyService = new MobileMoneyService(storage);

const messageSchema = z.object({
  content: z.string(),
  provider: z.string(),
  timestamp: z.string().transform(str => new Date(str)),
  userId: z.number(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, provider, timestamp, userId } = messageSchema.parse(body);

    const result = await mobileMoneyService.processMessage(
      { content, provider, timestamp },
      userId
    );

    if (!result) {
      return new Response(JSON.stringify({ message: 'Duplicate transaction detected' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing mobile money message:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process mobile money message' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 