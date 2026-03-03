-- Add manager_id column to users table
-- This links each employee to their managing manager
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id);
