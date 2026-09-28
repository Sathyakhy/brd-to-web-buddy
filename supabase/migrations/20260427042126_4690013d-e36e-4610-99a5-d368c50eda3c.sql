ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS frame_url text,
  ADD COLUMN IF NOT EXISTS frame_type text NOT NULL DEFAULT 'image' CHECK (frame_type IN ('image','video'));