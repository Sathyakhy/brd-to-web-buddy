-- 1) Access window + pricing cache columns on events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS access_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_ends_at   timestamptz,
  ADD COLUMN IF NOT EXISTS price_total      numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_currency   text          NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS paid_amount      numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status   text          NOT NULL DEFAULT 'unpaid';

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_price_currency_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_price_currency_check
  CHECK (price_currency IN ('USD','KHR'));

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_payment_status_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_payment_status_check
  CHECK (payment_status IN ('unpaid','partial','paid'));

-- 2) Line items (invoice rows)
CREATE TABLE IF NOT EXISTS public.event_line_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity    numeric(12,2) NOT NULL DEFAULT 1,
  unit_price  numeric(12,2) NOT NULL DEFAULT 0,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_line_items_event_id ON public.event_line_items(event_id);

ALTER TABLE public.event_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view event_line_items"   ON public.event_line_items;
DROP POLICY IF EXISTS "Admins can insert event_line_items" ON public.event_line_items;
DROP POLICY IF EXISTS "Admins can update event_line_items" ON public.event_line_items;
DROP POLICY IF EXISTS "Admins can delete event_line_items" ON public.event_line_items;

CREATE POLICY "Anyone can view event_line_items"
  ON public.event_line_items FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert event_line_items"
  ON public.event_line_items FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update event_line_items"
  ON public.event_line_items FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete event_line_items"
  ON public.event_line_items FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) Payments
CREATE TABLE IF NOT EXISTS public.event_payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  amount     numeric(12,2) NOT NULL,
  currency   text          NOT NULL DEFAULT 'USD',
  paid_at    timestamptz   NOT NULL DEFAULT now(),
  method     text,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_payments_event_id ON public.event_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_paid_at  ON public.event_payments(paid_at);

ALTER TABLE public.event_payments
  DROP CONSTRAINT IF EXISTS event_payments_currency_check;
ALTER TABLE public.event_payments
  ADD CONSTRAINT event_payments_currency_check
  CHECK (currency IN ('USD','KHR'));

ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view event_payments"   ON public.event_payments;
DROP POLICY IF EXISTS "Admins can insert event_payments" ON public.event_payments;
DROP POLICY IF EXISTS "Admins can update event_payments" ON public.event_payments;
DROP POLICY IF EXISTS "Admins can delete event_payments" ON public.event_payments;

CREATE POLICY "Anyone can view event_payments"
  ON public.event_payments FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert event_payments"
  ON public.event_payments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update event_payments"
  ON public.event_payments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete event_payments"
  ON public.event_payments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4) Helper functions to keep the cached event totals in sync
CREATE OR REPLACE FUNCTION public.recalc_event_totals(_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total numeric(12,2);
  _paid  numeric(12,2);
  _status text;
BEGIN
  SELECT COALESCE(SUM(quantity * unit_price), 0)
    INTO _total
    FROM public.event_line_items
   WHERE event_id = _event_id;

  SELECT COALESCE(SUM(amount), 0)
    INTO _paid
    FROM public.event_payments
   WHERE event_id = _event_id;

  IF _total = 0 AND _paid = 0 THEN
    _status := 'unpaid';
  ELSIF _paid >= _total AND _total > 0 THEN
    _status := 'paid';
  ELSIF _paid > 0 THEN
    _status := 'partial';
  ELSE
    _status := 'unpaid';
  END IF;

  UPDATE public.events
     SET price_total    = _total,
         paid_amount    = _paid,
         payment_status = _status,
         updated_at     = now()
   WHERE id = _event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_event_totals_li()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_event_totals(OLD.event_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_event_totals(NEW.event_id);
    IF TG_OP = 'UPDATE' AND NEW.event_id <> OLD.event_id THEN
      PERFORM public.recalc_event_totals(OLD.event_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_event_totals_pay()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_event_totals(OLD.event_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_event_totals(NEW.event_id);
    IF TG_OP = 'UPDATE' AND NEW.event_id <> OLD.event_id THEN
      PERFORM public.recalc_event_totals(OLD.event_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS event_line_items_recalc ON public.event_line_items;
CREATE TRIGGER event_line_items_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.event_line_items
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_event_totals_li();

DROP TRIGGER IF EXISTS event_payments_recalc ON public.event_payments;
CREATE TRIGGER event_payments_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.event_payments
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_event_totals_pay();

-- 5) updated_at triggers for the new tables
DROP TRIGGER IF EXISTS event_line_items_set_updated_at ON public.event_line_items;
CREATE TRIGGER event_line_items_set_updated_at
BEFORE UPDATE ON public.event_line_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS event_payments_set_updated_at ON public.event_payments;
CREATE TRIGGER event_payments_set_updated_at
BEFORE UPDATE ON public.event_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();