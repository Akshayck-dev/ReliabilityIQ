-- Create the storage bucket for profile images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public access to read profile images
CREATE POLICY "Public Access to Profile Images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-images');

-- Policy: Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own profile image" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.role() = 'authenticated' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own images
CREATE POLICY "Users can update their own profile image" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'profile-images' 
    AND auth.role() = 'authenticated' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own images (optional, but good practice)
CREATE POLICY "Users can delete their own profile image" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'profile-images' 
    AND auth.role() = 'authenticated' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: Ensure the 'users' table has an RLS policy for updating the profile_image column:
-- CREATE POLICY "Users can update their own profile" 
-- ON public.users FOR UPDATE 
-- USING (auth.uid() = id);
