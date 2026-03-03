-- Step 1: Add designation column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS designation TEXT;

-- Step 2: Drop ALL existing versions of the function
DROP FUNCTION IF EXISTS update_user_profile(TEXT, TEXT);
DROP FUNCTION IF EXISTS update_user_profile(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_user_profile;

-- Step 3: Recreate with designation support
CREATE OR REPLACE FUNCTION update_user_profile(
    new_name TEXT DEFAULT NULL,
    new_avatar_url TEXT DEFAULT NULL,
    new_designation TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    ALTER TABLE public.users DISABLE TRIGGER enforce_role_security;

    UPDATE public.users
    SET
        name = COALESCE(new_name, name),
        profile_image = COALESCE(new_avatar_url, profile_image),
        designation = COALESCE(new_designation, designation),
        role = role
    WHERE id = auth.uid();

    ALTER TABLE public.users ENABLE TRIGGER enforce_role_security;

EXCEPTION
    WHEN OTHERS THEN
        ALTER TABLE public.users ENABLE TRIGGER enforce_role_security;
        RAISE;
END;
$$;
