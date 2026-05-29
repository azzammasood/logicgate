-- Run in Supabase SQL Editor after creating a public bucket named "avatars"
-- Dashboard → Storage → New bucket → name: avatars → Public bucket: ON

-- Allow authenticated users to upload/update their own folder
CREATE POLICY "avatars_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
