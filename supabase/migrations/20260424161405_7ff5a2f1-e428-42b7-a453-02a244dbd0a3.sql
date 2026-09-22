ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS text_color_primary text,
  ADD COLUMN IF NOT EXISTS text_color_accent text;