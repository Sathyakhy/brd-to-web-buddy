-- Section visibility & template defaults
-- 1) Per-event override map (jsonb of section_key -> boolean)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS section_visibility jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) The templates.config jsonb already exists; we'll just store
--    section_visibility inside it. No schema change needed there.

COMMENT ON COLUMN public.events.section_visibility IS
  'Per-section show/hide overrides. Keys: title, parents, honorific, description, couple_names, details, agenda, gallery, countdown, location, rsvp, floating_contact, footer. Missing keys fall back to the template default, then to built-in defaults (true).';
