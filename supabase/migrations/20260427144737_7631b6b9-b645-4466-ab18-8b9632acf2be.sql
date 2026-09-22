ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS internal_title text;