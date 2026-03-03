-- 1. Create the profile_image column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- 2. Modify the role escalation trigger to be safer
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the role column is ACTUALLY being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
      -- If they already had a role that wasn't pending, prevent the change
      IF OLD.role IS NOT NULL AND OLD.role != 'pending_signup' THEN
          RAISE EXCEPTION 'Role escalation is strictly prohibited from the client.';
      END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
