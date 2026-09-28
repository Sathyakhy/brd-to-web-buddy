
DROP POLICY IF EXISTS "Anon can read events for public view" ON public.events;
DROP VIEW IF EXISTS public.events_public;

CREATE OR REPLACE FUNCTION public.get_event_public_by_slug(_slug text)
RETURNS TABLE (
  id uuid, slug text, title text, template text, event_date timestamptz,
  venue text, description text, cover_message text, created_at timestamptz,
  updated_at timestamptz, cover_image_url text, gallery_urls text[],
  ceremony_time text, reception_time text, dress_code text, contact_phone text,
  bride_name text, groom_name text, cover_background_url text,
  invite_background_url text, agenda_days jsonb, agenda_view_style text,
  contacts jsonb, map_embed text, max_guests integer, text_color_primary text,
  text_color_accent text, gallery_layout text, countdown_message text,
  access_starts_at timestamptz, access_ends_at timestamptz, qr_code_url text,
  qr_code_message text, qr_account_name text, apologies_message text,
  thank_you_message text, letter_bg_color text, letter_bg_opacity integer,
  cover_music_url text, frame_url text, frame_type text,
  share_preview_index integer, body_font text, section_visibility jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id, e.slug, e.title, e.template, e.event_date, e.venue, e.description,
    e.cover_message, e.created_at, e.updated_at, e.cover_image_url,
    e.gallery_urls, e.ceremony_time, e.reception_time, e.dress_code,
    e.contact_phone, e.bride_name, e.groom_name, e.cover_background_url,
    e.invite_background_url, e.agenda_days, e.agenda_view_style, e.contacts,
    e.map_embed, e.max_guests, e.text_color_primary, e.text_color_accent,
    e.gallery_layout, e.countdown_message, e.access_starts_at, e.access_ends_at,
    e.qr_code_url, e.qr_code_message, e.qr_account_name, e.apologies_message,
    e.thank_you_message, e.letter_bg_color, e.letter_bg_opacity,
    e.cover_music_url, e.frame_url, e.frame_type, e.share_preview_index,
    e.body_font, e.section_visibility
  FROM public.events e
  WHERE e.slug = _slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_public_by_slug(text) TO anon, authenticated;
