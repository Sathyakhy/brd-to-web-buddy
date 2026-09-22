ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS gallery_layout text NOT NULL DEFAULT 'grid';