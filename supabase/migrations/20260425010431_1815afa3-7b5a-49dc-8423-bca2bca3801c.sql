-- Audit log table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  event_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_id ON public.audit_logs(event_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins / superadmins can read
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin_or_super(auth.uid()));

-- Authenticated users can insert their own audit rows (for client-logged events like login/logout).
-- Triggers run as SECURITY DEFINER so they bypass RLS regardless.
CREATE POLICY "Users can insert own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Helper to fetch caller email for audit rows
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Trigger function: log guest changes only when actor is a customer (not admin/superadmin)
CREATE OR REPLACE FUNCTION public.log_guest_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _action text;
  _event uuid;
  _guest_id uuid;
  _details jsonb := '{}'::jsonb;
BEGIN
  -- Skip if no authenticated user (e.g. anon RSVP submissions handled separately)
  -- and skip admin actions to keep the log focused on customers.
  IF _uid IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF public.is_admin_or_super(_uid) THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  _email := public.get_user_email(_uid);

  IF TG_OP = 'INSERT' THEN
    _action := 'guest.created';
    _event := NEW.event_id;
    _guest_id := NEW.id;
    _details := jsonb_build_object('name', NEW.name);
  ELSIF TG_OP = 'UPDATE' THEN
    _event := NEW.event_id;
    _guest_id := NEW.id;
    IF NEW.token IS DISTINCT FROM OLD.token THEN
      _action := 'guest.token_regenerated';
      _details := jsonb_build_object('name', NEW.name);
    ELSIF NEW.rsvp_status IS DISTINCT FROM OLD.rsvp_status THEN
      _action := 'guest.rsvp_changed';
      _details := jsonb_build_object('name', NEW.name, 'from', OLD.rsvp_status, 'to', NEW.rsvp_status);
    ELSE
      _action := 'guest.updated';
      _details := jsonb_build_object('name', NEW.name);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'guest.deleted';
    _event := OLD.event_id;
    _guest_id := OLD.id;
    _details := jsonb_build_object('name', OLD.name);
  END IF;

  INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, event_id, details)
  VALUES (_uid, _email, _action, 'guest', _guest_id, _event, _details);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

CREATE TRIGGER trg_log_guest_insert
AFTER INSERT ON public.guests
FOR EACH ROW EXECUTE FUNCTION public.log_guest_changes();

CREATE TRIGGER trg_log_guest_update
AFTER UPDATE ON public.guests
FOR EACH ROW EXECUTE FUNCTION public.log_guest_changes();

CREATE TRIGGER trg_log_guest_delete
AFTER DELETE ON public.guests
FOR EACH ROW EXECUTE FUNCTION public.log_guest_changes();