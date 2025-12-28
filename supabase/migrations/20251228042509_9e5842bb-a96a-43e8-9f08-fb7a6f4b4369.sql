-- Create bucket for prize images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prize-images', 'prize-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload prize images
CREATE POLICY "Authenticated users can upload prize images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prize-images');

-- Allow public read access to prize images
CREATE POLICY "Anyone can view prize images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'prize-images');

-- Allow authenticated users to delete their prize images
CREATE POLICY "Authenticated users can delete prize images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'prize-images');