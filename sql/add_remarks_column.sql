-- Add the remarks column if it does not exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS remarks JSONB DEFAULT '[]'::jsonb;
