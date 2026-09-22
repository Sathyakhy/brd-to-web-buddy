-- 1) GUESTS: remove blanket anon read; add secure token lookup RPC

DROP POLICY IF EXISTS "Public can view guests for RSVP" ON public.guests;

CREATE OR REPLACE FUNCTION public.get_guest_by_token(_event_slug text, _token text)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  name text,
  rsvp_status public.rsvp_status,
  party_size integer,
  message text,
  responded_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.event_id, g.name, g.rsvp_status, g.party_size, g.message, g.responded_at
  FROM public.guests g
  JOIN public.events e ON e.id = g.event_id
  WHERE e.slug = _event_slug
    AND g.token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_guest_by_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_by_token(text, text) TO anon, authenticated;

-- 2) BILLING: remove blanket public read; restrict to admins/superadmins

DROP POLICY IF EXISTS "Anyone can view event_payments" ON public.event_payments;
DROP POLICY IF EXISTS "Anyone can view event_line_items" ON public.event_line_items;

CREATE POLICY "Admins view event_payments"
  ON public.event_payments FOR SELECT TO authenticated
  USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins view event_line_items"
  ON public.event_line_items FOR SELECT TO authenticated
  USING (public.is_admin_or_super(auth.uid()));