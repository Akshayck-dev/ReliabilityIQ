-- Add parent_task_id to support sub-tasks/continuations
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
