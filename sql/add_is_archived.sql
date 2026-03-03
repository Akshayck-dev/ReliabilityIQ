-- Add is_archived column to tasks table
-- Run this in Supabase SQL Editor

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
