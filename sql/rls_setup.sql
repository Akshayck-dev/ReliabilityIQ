-- Enable RLS on the tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 1. Managers can insert tasks
CREATE POLICY "Managers can insert tasks" ON tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager'
  )
);

-- 2. Managers can view all tasks
CREATE POLICY "Managers can view all tasks" ON tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager'
  )
);

-- 3. Employees can only select tasks where assigned_to = current user
CREATE POLICY "Employees can view assigned tasks" ON tasks
FOR SELECT
USING (
  assigned_to = auth.uid()
);

-- 4. Only assigned employee or manager can update status
CREATE POLICY "Assignees and managers can update tasks" ON tasks
FOR UPDATE
USING (
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager'
  )
)
WITH CHECK (
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager'
  )
);

-- 5. Only manager can delete tasks
CREATE POLICY "Only managers can delete tasks" ON tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager'
  )
);
