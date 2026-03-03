-- Drop the existing legacy notifications table to ensure a clean slate
DROP TABLE IF EXISTS notifications CASCADE;

-- Create the notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'assigned', 'status_update', 'remark'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist so this script can be re-run safely
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Application/System can insert notifications for users
-- We allow any authenticated user to insert a notification for any other user
CREATE POLICY "Authenticated users can insert notifications" ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Add an index on user_id and is_read for faster querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);

-- CRITICAL: Enable Realtime for the notifications table so the frontend updates instantly!
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications; 
  END IF; 
END $$;
