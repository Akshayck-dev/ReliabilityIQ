-- 1. Remove the incorrectly placed policies from the storage buckets
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated uploads vejz8c_0" ON storage.buckets;

-- Ensure RLS is enabled on the files table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any previous attempts on the storage objects table just to be completely safe
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;

-- 3. Create the SINGLE correct, fully working policy on the storage.objects table
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
AS PERMISSIVE 
FOR ALL 
TO authenticated 
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');
