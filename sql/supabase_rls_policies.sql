-- 0. Ensure the missing manager_id column exists before we apply policies on it
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS manager_id UUID;

-- 1. ENABLE RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------------
-- TASKS TABLE POLICIES
-- ----------------------------------------------------------------------------------

-- 1. SELECT: Allow if auth.uid() = assigned_to OR auth.uid() = manager_id.
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks"
ON tasks
FOR SELECT
TO authenticated
USING (
  auth.uid() = assigned_to OR 
  auth.uid() = manager_id
);

-- 2. INSERT: Only allow if auth.uid() = manager_id.
DROP POLICY IF EXISTS "Managers can insert tasks" ON tasks;
CREATE POLICY "Managers can insert tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = manager_id
);

-- 3. UPDATE: 
-- Managers can update tasks they created.
-- Employees can update ONLY status and completed_at where assigned_to = auth.uid().
DROP POLICY IF EXISTS "Users can update relevant tasks" ON tasks;
CREATE POLICY "Users can update relevant tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  auth.uid() = assigned_to OR 
  auth.uid() = manager_id
)
WITH CHECK (
  -- If you are the manager, you can update anything on this row
  auth.uid() = manager_id 
  OR 
  -- If you are the employee, you can ONLY update if your id matches assigned_to
  -- AND you are not changing restricted columns (title, description, manager_id, due_date, assigned_to).
  (
    auth.uid() = assigned_to
    -- To strictly prevent employees from editing other columns via Supabase RLS, 
    -- we ensure the new values (implicit here in WITH CHECK) match the OLD values 
    -- by creating an explicit trigger, OR we use column-level REVOKE.
    -- However, in a pure RLS boolean statement, relying on a secure Postgres function or trigger is best.
    -- Assuming a standard strict RLS here for row matching:
  )
);

-- To strictly enforce the COLUMN level restrictions for the Employee UPDATE policy above,
-- execute this trigger which prevents modifying restricted columns if they are not the manager:
CREATE OR REPLACE FUNCTION check_task_update_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user modifying the row is NOT the manager
  IF auth.uid() != OLD.manager_id THEN
    -- Check if they are trying to maliciously modify restricted columns
    IF NEW.title != OLD.title OR 
       NEW.description != OLD.description OR 
       NEW.priority != OLD.priority OR 
       NEW.due_date != OLD.due_date OR 
       NEW.assigned_to != OLD.assigned_to OR 
       NEW.manager_id != OLD.manager_id 
    THEN
      RAISE EXCEPTION 'Employees are only allowed to update status and completed_at columns.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_task_employee_updates ON tasks;
CREATE TRIGGER enforce_task_employee_updates
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION check_task_update_permissions();

-- 4. DELETE: Only allow if auth.uid() = manager_id.
DROP POLICY IF EXISTS "Managers can delete tasks" ON tasks;
CREATE POLICY "Managers can delete tasks"
ON tasks
FOR DELETE
TO authenticated
USING (
  auth.uid() = manager_id
);


-- ----------------------------------------------------------------------------------
-- USERS TABLE POLICIES
-- ----------------------------------------------------------------------------------

-- 1. SELECT: Authenticated users can read.
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON users;
CREATE POLICY "Authenticated users can view profiles"
ON users
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT: Only allow user to insert row where id = auth.uid().
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

-- 3. UPDATE: Only allow updating own row. Prevent role escalation.
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- 4. Prevent role escalation from client
-- We use a trigger to ensure the `role` column cannot be changed by an UPDATE statement
-- once it has been initially set (e.g., during the pending_selection phase).
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is trying to change their role after it's already set
  -- (We allow the very first update if they were 'pending_selection', 
  -- but generally you want to lock it down).
  IF OLD.role IS NOT NULL AND NEW.role != OLD.role THEN
      RAISE EXCEPTION 'Role escalation is strictly prohibited from the client.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_role_security ON users;
CREATE TRIGGER enforce_role_security
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_role_escalation();
