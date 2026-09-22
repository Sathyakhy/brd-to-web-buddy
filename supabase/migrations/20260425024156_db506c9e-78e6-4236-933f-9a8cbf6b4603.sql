DROP POLICY IF EXISTS "Public read event media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event-media files" ON storage.objects;

CREATE POLICY "Public can view template media"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'event-media'
  AND (storage.foldername(name))[1] = 'template'
);

CREATE POLICY "Public can view event invite media"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'event-media'
  AND name ~ '^[0-9a-fA-F-]+/.+'
);

CREATE POLICY "Public can view agenda icons"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'event-media'
  AND (storage.foldername(name))[1] = 'agenda-icons'
);

CREATE POLICY "Public can view site assets"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'event-media'
  AND (storage.foldername(name))[1] = 'site'
);