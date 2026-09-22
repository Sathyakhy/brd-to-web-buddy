
-- 1) Restrict invoice_item_presets reads to admins only
DROP POLICY IF EXISTS "Anyone can view invoice_item_presets" ON public.invoice_item_presets;

CREATE POLICY "Admins and superadmins view invoice_item_presets"
ON public.invoice_item_presets
FOR SELECT
TO authenticated
USING (public.is_admin_or_super(auth.uid()));

-- 2) Harden submit_rsvp with bounds checks
CREATE OR REPLACE FUNCTION public.submit_rsvp(_event_slug text, _token text, _status rsvp_status, _party_size integer DEFAULT 1, _message text DEFAULT NULL::text)
 RETURNS guests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _event_id UUID;
  _guest public.guests;
  _clamped_party INT;
BEGIN
  IF _message IS NOT NULL AND char_length(_message) > 1000 THEN
    RAISE EXCEPTION 'Message too long (max 1000 characters)';
  END IF;

  _clamped_party := LEAST(GREATEST(1, COALESCE(_party_size, 1)), 20);

  SELECT id INTO _event_id FROM public.events WHERE slug = _event_slug;
  IF _event_id IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  UPDATE public.guests
  SET rsvp_status = _status,
      party_size = _clamped_party,
      message = _message,
      responded_at = now()
  WHERE event_id = _event_id AND token = _token
  RETURNING * INTO _guest;

  IF _guest.id IS NULL THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  RETURN _guest;
END;
$function$;
