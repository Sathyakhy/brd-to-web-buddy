-- Drop the permissive public update policy
DROP POLICY IF EXISTS "Anyone can update RSVP fields" ON public.guests;

-- Allow admins to update guests (e.g., regenerate token, edit name)
CREATE POLICY "Admins can update guests"
ON public.guests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Security definer RPC for public RSVP submission (token-validated)
CREATE OR REPLACE FUNCTION public.submit_rsvp(
  _event_slug TEXT,
  _token TEXT,
  _status rsvp_status,
  _party_size INT DEFAULT 1,
  _message TEXT DEFAULT NULL
)
RETURNS public.guests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id UUID;
  _guest public.guests;
BEGIN
  SELECT id INTO _event_id FROM public.events WHERE slug = _event_slug;
  IF _event_id IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  UPDATE public.guests
  SET rsvp_status = _status,
      party_size = GREATEST(1, COALESCE(_party_size, 1)),
      message = _message,
      responded_at = now()
  WHERE event_id = _event_id AND token = _token
  RETURNING * INTO _guest;

  IF _guest.id IS NULL THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  RETURN _guest;
END;
$$;