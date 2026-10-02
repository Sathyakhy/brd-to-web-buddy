CREATE OR REPLACE FUNCTION public.get_event_by_telegram_chat_id(_chat_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _clean_id text;
  _norm_id text;
  _event record;
  _guests jsonb;
  _vis_chat_id text;
  _norm_vis text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin_or_super(auth.uid()) THEN
    RETURN NULL;
  END IF;

  _clean_id := trim(COALESCE(_chat_id, ''));
  IF _clean_id = '' THEN
    RETURN NULL;
  END IF;
  _norm_id := regexp_replace(_clean_id, '^-100', '-');

  FOR _event IN
    SELECT id, title, slug, event_date, section_visibility
    FROM public.events
    ORDER BY created_at DESC
  LOOP
    _vis_chat_id := trim(COALESCE(_event.section_visibility->>'telegram_chat_id', ''));
    IF _vis_chat_id <> '' THEN
      _norm_vis := regexp_replace(_vis_chat_id, '^-100', '-');
      IF _vis_chat_id = _clean_id
         OR _norm_vis = _norm_id
         OR regexp_replace(_vis_chat_id, '^-', '') = regexp_replace(_clean_id, '^-', '')
      THEN
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', g.id, 'name', g.name, 'token', g.token,
          'rsvp_status', g.rsvp_status, 'party_size', g.party_size,
          'message', g.message, 'responded_at', g.responded_at
        )), '[]'::jsonb)
        INTO _guests
        FROM public.guests g
        WHERE g.event_id = _event.id;

        RETURN jsonb_build_object(
          'eventId', _event.id, 'eventTitle', _event.title,
          'slug', _event.slug, 'eventDate', _event.event_date,
          'guests', _guests
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_event_by_telegram_chat_id(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_event_by_telegram_chat_id(text) TO authenticated, service_role;