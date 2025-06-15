import express from 'express';
import { supabase } from '../config/supabase';
import { CashbookEntry } from '../types/cashbook';

const router = express.Router();

// Update cashbook entry
router.post('/update', async (req, res) => {
  try {
    console.log('Received cashbook update request:', {
      body: req.body,
      headers: req.headers
    });

    const { user_id, date, opening_balance, closing_balance, transactions } = req.body;

    // Validate required fields
    if (!user_id || !date || !opening_balance || !closing_balance) {
      console.error('Missing required fields:', { user_id, date, opening_balance, closing_balance });
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'user_id, date, opening_balance, and closing_balance are required'
      });
    }

    // Test Supabase connection
    try {
      const { data: testData, error: testError } = await supabase
        .from('cashbook')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Supabase connection test failed:', testError);
        return res.status(500).json({
          error: 'Database connection error',
          details: testError.message
        });
      }
      console.log('Supabase connection test successful');
    } catch (testError) {
      console.error('Error testing Supabase connection:', testError);
      return res.status(500).json({
        error: 'Database connection error',
        details: 'Failed to connect to database'
      });
    }

    // Prepare the entry
    const entry: CashbookEntry = {
      user_id,
      date,
      opening_balance,
      closing_balance,
      transactions: transactions || []
    };

    console.log('Attempting to update cashbook entry:', entry);

    // First check if an entry exists for this user and date
    const { data: existingEntry, error: selectError } = await supabase
      .from('cashbook')
      .select('id')
      .eq('user_id', user_id)
      .eq('date', date)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing entry:', selectError);
      return res.status(500).json({
        error: 'Failed to check existing entry',
        details: selectError.message,
        code: selectError.code
      });
    }

    let result;
    if (existingEntry) {
      // Update existing entry
      const { data, error } = await supabase
        .from('cashbook')
        .update(entry)
        .eq('id', existingEntry.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Insert new entry
      const { data, error } = await supabase
        .from('cashbook')
        .insert(entry)
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error('Error updating cashbook:', result.error);
      return res.status(500).json({
        error: 'Failed to update cashbook',
        details: result.error.message,
        code: result.error.code
      });
    }

    // Update onboarding status in public.users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .upsert({
        id: user_id,
        has_completed_onboarding: true
      }, {
        onConflict: 'id'
      });

    if (userUpdateError) {
      console.error('Error updating user status:', userUpdateError);
      // Don't return error here, as the cashbook update was successful
    }

    console.log('Successfully updated cashbook entry and onboarding status');
    return res.json({ success: true, data: result.data });

  } catch (error) {
    console.error('Unexpected error in cashbook update:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router; 