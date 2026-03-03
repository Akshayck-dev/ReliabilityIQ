-- 1. Drop the old trigger to clear existing restrictions
DROP TRIGGER IF EXISTS enforce_task_employee_updates ON tasks;

-- 2. Rewrite the function with robust NULL-safe equality checks
CREATE OR REPLACE FUNCTION check_task_update_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user modifying the row is NOT the manager
  IF auth.uid() != OLD.manager_id THEN
    -- Check if they are trying to maliciously modify restricted columns
    -- IS DISTINCT FROM safely handles NULL vs NULL comparisons
    IF NEW.title IS DISTINCT FROM OLD.title OR 
       NEW.description IS DISTINCT FROM OLD.description OR 
       NEW.priority IS DISTINCT FROM OLD.priority OR 
       NEW.due_date IS DISTINCT FROM OLD.due_date OR 
       NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR 
       NEW.manager_id IS DISTINCT FROM OLD.manager_id 
    THEN
      RAISE EXCEPTION 'Employees are only allowed to update status, completed_at, and remarks columns.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-attach the trigger
CREATE TRIGGER enforce_task_employee_updates
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION check_task_update_permissions();
