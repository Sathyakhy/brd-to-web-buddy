-- Allow superadmins to upload/update/delete event-media (storage), matching admins.
DROP POLICY IF EXISTS "Admins upload event media" ON storage.objects;
DROP POLICY IF EXISTS "Admins update event media" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete event media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload agenda icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update agenda icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete agenda icons" ON storage.objects;

CREATE POLICY "Admins upload event media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-media' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins update event media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-media' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins delete event media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-media' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins can upload agenda icons"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-media' AND (storage.foldername(name))[1] = 'agenda-icons' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins can update agenda icons"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-media' AND (storage.foldername(name))[1] = 'agenda-icons' AND public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins can delete agenda icons"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-media' AND (storage.foldername(name))[1] = 'agenda-icons' AND public.is_admin_or_super(auth.uid()));