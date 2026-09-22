CREATE TABLE public.ornamental_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  thumbnail_url text,
  position integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ornamental_frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ornamental frames"
  ON public.ornamental_frames FOR SELECT
  USING (true);

CREATE POLICY "Admins and superadmins can insert ornamental frames"
  ON public.ornamental_frames FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_super(auth.uid()));

CREATE POLICY "Admins and superadmins can update ornamental frames"
  ON public.ornamental_frames FOR UPDATE TO authenticated
  USING (is_admin_or_super(auth.uid()))
  WITH CHECK (is_admin_or_super(auth.uid()));

CREATE POLICY "Admins and superadmins can delete ornamental frames"
  ON public.ornamental_frames FOR DELETE TO authenticated
  USING (is_admin_or_super(auth.uid()));

CREATE TRIGGER update_ornamental_frames_updated_at
  BEFORE UPDATE ON public.ornamental_frames
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();