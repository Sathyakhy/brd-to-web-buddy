ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS letter_bg_color text,
  ADD COLUMN IF NOT EXISTS letter_bg_opacity integer;