ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS agenda_days jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS agenda_view_style text NOT NULL DEFAULT 'list';