
DROP VIEW IF EXISTS public.events_public;
CREATE VIEW public.events_public
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

GRANT SELECT ON public.events_public TO anon, authenticated;

CREATE POLICY "Anon can read events for public view"
ON public.events FOR SELECT
TO anon
USING (true);
