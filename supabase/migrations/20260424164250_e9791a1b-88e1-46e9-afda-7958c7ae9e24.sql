-- Account-wide agenda preset library
CREATE TABLE public.agenda_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Sparkle',
  icon_image_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agenda presets"
ON public.agenda_presets
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert agenda presets"
ON public.agenda_presets
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update agenda presets"
ON public.agenda_presets
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete agenda presets"
ON public.agenda_presets
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_agenda_presets_updated_at
BEFORE UPDATE ON public.agenda_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_agenda_presets_label ON public.agenda_presets (label);

-- Storage policies for custom agenda icons in the existing event-media bucket
CREATE POLICY "Public can view event-media files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-media');

CREATE POLICY "Admins can upload agenda icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-media'
  AND (storage.foldername(name))[1] = 'agenda-icons'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update agenda icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-media'
  AND (storage.foldername(name))[1] = 'agenda-icons'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete agenda icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-media'
  AND (storage.foldername(name))[1] = 'agenda-icons'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);