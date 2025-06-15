-- Create cashbook table
CREATE TABLE IF NOT EXISTS cashbook (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opening_balance JSONB NOT NULL,
    closing_balance JSONB NOT NULL,
    transactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cashbook_user_date ON cashbook(user_id, date);

-- Enable Row Level Security
ALTER TABLE cashbook ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own cashbook entries
CREATE POLICY "Users can only access their own cashbook entries"
    ON cashbook
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 