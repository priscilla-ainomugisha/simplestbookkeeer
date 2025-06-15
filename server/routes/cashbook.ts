import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Update or create cashbook entry
router.post('/update', async (req, res) => {
  try {
    const { user_id, date, opening_balance, closing_balance, transactions } = req.body;

    console.log('Received cashbook update request:', {
      user_id,
      date,
      hasOpeningBalance: !!opening_balance,
      hasClosingBalance: !!closing_balance,
      transactionsCount: transactions?.length || 0
    });

    if (!user_id || !date || !opening_balance || !closing_balance) {
      console.error('Missing required fields:', { user_id, date, opening_balance, closing_balance });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: { user_id, date, opening_balance, closing_balance }
      });
    }

    // First verify we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('cashbook')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Supabase connection test failed:', testError);
      return res.status(500).json({ 
        error: 'Database connection error',
        details: testError.message
      });
    }

    console.log('Supabase connection test successful');

    const entryData = {
      user_id,
      date,
      opening_balance,
      closing_balance,
      transactions: transactions || [],
      updated_at: new Date().toISOString()
    };

    console.log('Attempting to upsert cashbook entry:', entryData);

    // Try to upsert the entry directly
    const { data, error } = await supabase
      .from('cashbook')
      .upsert(entryData, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting cashbook entry:', error);
      return res.status(500).json({ 
        error: 'Failed to update cashbook',
        details: error.message,
        code: error.code
      });
    }

    console.log('Successfully upserted cashbook entry:', data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in cashbook update:', error);
    res.status(500).json({ 
      error: 'Failed to update cashbook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 