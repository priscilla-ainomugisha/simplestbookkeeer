const saveMutation = useMutation({
  mutationFn: async (data: typeof formData) => {
    devLog('Starting save mutation with data:', data);
    devLog('Current user:', user);

    if (!user) {
      throw new Error('No user found');
    }

    // Prepare cashbook entry
    const cashbookEntry = {
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      opening_balance: {
        cash: parseFloat(data.cash),
        liabilities: parseFloat(data.liabilities),
        capital: parseFloat(data.capital),
        inventory: parseFloat(data.inventory)
      },
      closing_balance: {
        cash: parseFloat(data.cash),
        liabilities: parseFloat(data.liabilities),
        capital: parseFloat(data.capital),
        inventory: parseFloat(data.inventory)
      },
      transactions: []
    };

    devLog('Prepared cashbook entry:', cashbookEntry);

    // Send request to server endpoint
    const response = await fetch('/api/cashbook/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cashbookEntry)
    });

    if (!response.ok) {
      const errorText = await response.text();
      devLog('Error response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || errorJson.message || 'Failed to update cashbook');
      } catch (e) {
        throw new Error(`Failed to update cashbook: ${errorText}`);
      }
    }

    const result = await response.json();

    // Update onboarding status in public.users table
    devLog('Updating user onboarding status...');
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ has_completed_onboarding: true })
      .eq('id', user.id)
      .select();

    if (userUpdateError) {
      console.error('Error updating user status:', userUpdateError);
      throw new Error(`Failed to update user status: ${userUpdateError.message}`);
    }

    devLog('Successfully updated user onboarding status');
    return result.data;
  },
  onSuccess: () => {
    devLog('Setup completed successfully');
    toast({
      title: "Setup Complete",
      description: "Your initial balance sheet has been saved.",
    });
    // Close the wizard and navigate to home
    onClose();
  },
  onError: (error) => {
    console.error('Setup failed:', error);
    toast({
      title: "Setup Failed",
      description: error instanceof Error ? error.message : "Failed to complete setup. Please try again.",
      variant: "destructive"
    });
  }
}); 