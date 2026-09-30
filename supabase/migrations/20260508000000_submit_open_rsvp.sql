-- Migration: Add submit_open_rsvp RPC for public broadcast links
-- Allows self-registered guests to submit RSVP with their name, status, party size, and message.

CREATE OR REPLACE FUNCTION public.submit_open_rsvp(
  _event_slug text,
  _name text,
  _status rsvp_status,
  _party_size integer DEFAULT 1,
  _message text DEFAULT NULL::text,
  _language text DEFAULT 'km'
)
RETURNS guests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _event_id UUID;
  _guest public.guests;
  _clamped_party INT;
  _clean_name TEXT;
  _token TEXT;
  _lang_suffix TEXT;
BEGIN
  _clean_name := trim(COALESCE(_name, ''));
  IF _clean_name = '' THEN
    RAISE EXCEPTION 'Guest name is required';
  END IF;

  IF char_length(_clean_name) > 200 THEN
    RAISE EXCEPTION 'Guest name too long (max 200 characters)';
  END IF;

  IF _message IS NOT NULL AND char_length(_message) > 1000 THEN
    RAISE EXCEPTION 'Message too long (max 1000 characters)';
  END IF;

  _clamped_party := LEAST(GREATEST(1, COALESCE(_party_size, 1)), 20);

  SELECT id INTO _event_id FROM public.events WHERE slug = _event_slug;
  IF _event_id IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  _lang_suffix := CASE WHEN lower(_language) IN ('en', 'english') THEN 'en' ELSE 'km' END;
  _token := substr(md5(random()::text || clock_timestamp()::text), 1, 12) || '-' || _lang_suffix;

  INSERT INTO public.guests (
    event_id,
    name,
    token,
    rsvp_status,
    party_size,
    message,
    responded_at
  )
  VALUES (
    _event_id,
    _clean_name,
    _token,
    _status,
    _clamped_party,
    _message,
    now()
  )
  RETURNING * INTO _guest;

  RETURN _guest;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_open_rsvp(text, text, rsvp_status, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_open_rsvp(text, text, rsvp_status, integer, text, text) TO anon, authenticated;
