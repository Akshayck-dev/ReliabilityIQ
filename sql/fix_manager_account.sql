-- 1. Ensure the Users table allows users to insert their own profile on signup
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users 
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. Force-Insert the missing manager account into the users table securely
-- This copies the auth ID from Supabase's secure auth.users table directly into public.users
INSERT INTO public.users (id, email, role)
SELECT id, email, 'manager'
FROM auth.users
WHERE email = 'photosakshaybackupnew@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'manager';
