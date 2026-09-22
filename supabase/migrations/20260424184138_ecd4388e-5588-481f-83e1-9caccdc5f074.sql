-- Catalog tables for invoice item presets and payment methods, used to speed up
-- billing entry on each event.

CREATE TABLE IF NOT EXISTS public.invoice_item_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  default_quantity numeric NOT NULL DEFAULT 1,
  default_unit_price numeric NOT NULL DEFAULT 0,
  default_currency text NOT NULL DEFAULT 'USD',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_item_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invoice_item_presets"
  ON public.invoice_item_presets FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert invoice_item_presets"
  ON public.invoice_item_presets FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update invoice_item_presets"
  ON public.invoice_item_presets FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete invoice_item_presets"
  ON public.invoice_item_presets FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_invoice_item_presets_updated_at
  BEFORE UPDATE ON public.invoice_item_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  details text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment_methods"
  ON public.payment_methods FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert payment_methods"
  ON public.payment_methods FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment_methods"
  ON public.payment_methods FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payment_methods"
  ON public.payment_methods FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed sensible defaults so admins see something on first load.
INSERT INTO public.invoice_item_presets (label, description, default_quantity, default_unit_price, default_currency, position)
VALUES
  ('Template fee', 'Base invitation template', 1, 50, 'USD', 0),
  ('Extra guest', 'Additional invited guest above the included count', 1, 1, 'USD', 1),
  ('Custom design', 'Custom artwork / illustration', 1, 30, 'USD', 2)
ON CONFLICT DO NOTHING;

INSERT INTO public.payment_methods (label, details, position) VALUES
  ('Cash', NULL, 0),
  ('ABA Bank', 'KHQR / bank transfer', 1),
  ('Wing', NULL, 2)
ON CONFLICT DO NOTHING;