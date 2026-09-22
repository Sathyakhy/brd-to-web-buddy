
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS qr_code_url text,
  ADD COLUMN IF NOT EXISTS qr_code_message text,
  ADD COLUMN IF NOT EXISTS qr_account_name text,
  ADD COLUMN IF NOT EXISTS apologies_message text,
  ADD COLUMN IF NOT EXISTS thank_you_message text;
