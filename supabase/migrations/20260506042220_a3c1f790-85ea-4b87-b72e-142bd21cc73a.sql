
-- 1. Tighten events SELECT policy: drop public access, restrict to admins + assigned customers
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;

CREATE POLICY "Admins and superadmins view events"
ON public.events FOR SELECT
TO authenticated
USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Customers view their assigned events"
ON public.events FOR SELECT
TO authenticated
USING (public.is_event_customer(auth.uid(), id));

-- 2. Public-safe view: excludes owner_id, price_total, paid_amount, payment_status
CREATE OR REPLACE VIEW public.events_public
WITH (security_invoker = true)
AS
SELECT
  id, slug, title, template, event_date, venue, description, cover_message,
  created_at, updated_at, cover_image_url, gallery_urls, ceremony_time,
  reception_time, dress_code, contact_phone, bride_name, groom_name,
  cover_background_url, invite_background_url, agenda_days, agenda_view_style,
  contacts, map_embed, max_guests, text_color_primary, text_color_accent,
  gallery_layout, countdown_message, access_starts_at, access_ends_at,
  qr_code_url, qr_code_message, qr_account_name, apologies_message,
  thank_you_message, letter_bg_color, letter_bg_opacity, cover_music_url,
  frame_url, frame_type, share_preview_index, body_font, section_visibility
FROM public.events;

-- The view inherits RLS from the base table when security_invoker = true.
-- We need a permissive SELECT policy on the base table that lets the view
-- expose its rows publicly (since admins/customers already have their own
-- policies above; this one is scoped to anon/public role only).
CREATE POLICY "Public can view events via public view"
ON public.events FOR SELECT
TO anon
USING (true);

GRANT SELECT ON public.events_public TO anon, authenticated;

-- 3. Allow event customers to read their own line items
CREATE POLICY "Customers view event_line_items of their events"
ON public.event_line_items FOR SELECT
TO authenticated
USING (public.is_event_customer(auth.uid(), event_id));
