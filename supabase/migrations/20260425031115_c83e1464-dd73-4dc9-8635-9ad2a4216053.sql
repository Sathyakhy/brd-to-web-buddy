
-- Grant superadmins the same write/manage permissions as admins across all tables.
-- Replace has_role(auth.uid(), 'admin') with is_admin_or_super(auth.uid()).

-- agenda_presets
DROP POLICY IF EXISTS "Admins can insert agenda presets" ON public.agenda_presets;
DROP POLICY IF EXISTS "Admins can update agenda presets" ON public.agenda_presets;
DROP POLICY IF EXISTS "Admins can delete agenda presets" ON public.agenda_presets;
CREATE POLICY "Admins and superadmins can insert agenda presets" ON public.agenda_presets
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can update agenda presets" ON public.agenda_presets
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can delete agenda presets" ON public.agenda_presets
  FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- event_customers
DROP POLICY IF EXISTS "Admins manage event_customers" ON public.event_customers;
CREATE POLICY "Admins and superadmins manage event_customers" ON public.event_customers
  FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- event_line_items
DROP POLICY IF EXISTS "Admins can insert event_line_items" ON public.event_line_items;
DROP POLICY IF EXISTS "Admins can update event_line_items" ON public.event_line_items;
DROP POLICY IF EXISTS "Admins can delete event_line_items" ON public.event_line_items;
CREATE POLICY "Admins and superadmins can insert event_line_items" ON public.event_line_items
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can update event_line_items" ON public.event_line_items
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can delete event_line_items" ON public.event_line_items
  FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- event_payments
DROP POLICY IF EXISTS "Admins can insert event_payments" ON public.event_payments;
DROP POLICY IF EXISTS "Admins can update event_payments" ON public.event_payments;
DROP POLICY IF EXISTS "Admins can delete event_payments" ON public.event_payments;
CREATE POLICY "Admins and superadmins can insert event_payments" ON public.event_payments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can update event_payments" ON public.event_payments
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can delete event_payments" ON public.event_payments
  FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- events
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins and superadmins can insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can update events" ON public.events
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can delete events" ON public.events
  FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- guests
DROP POLICY IF EXISTS "Admins view all guests" ON public.guests;
DROP POLICY IF EXISTS "Admins can insert guests" ON public.guests;
DROP POLICY IF EXISTS "Admins can update guests" ON public.guests;
DROP POLICY IF EXISTS "Admins can delete guests" ON public.guests;
CREATE POLICY "Admins and superadmins view all guests" ON public.guests
  FOR SELECT TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can insert guests" ON public.guests
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can update guests" ON public.guests
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can delete guests" ON public.guests
  FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- invoice_item_presets
DROP POLICY IF EXISTS "Admins can insert invoice_item_presets" ON public.invoice_item_presets;
DROP POLICY IF EXISTS "Admins can update invoice_item_presets" ON public.invoice_item_presets;
DROP POLICY IF EXISTS "Admins can delete invoice_item_presets" ON public.invoice_item_presets;
CREATE POLICY "Admins and superadmins can insert invoice_item_presets" ON public.invoice_item_presets
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can update invoice_item_presets" ON public.invoice_item_presets
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can delete invoice_item_presets" ON public.invoice_item_presets
  FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- payment_methods
DROP POLICY IF EXISTS "Admins can insert payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can update payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can delete payment_methods" ON public.payment_methods;
CREATE POLICY "Admins and superadmins can insert payment_methods" ON public.payment_methods
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can update payment_methods" ON public.payment_methods
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can delete payment_methods" ON public.payment_methods
  FOR DELETE TO authenticated USING (public.is_admin_or_super(auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins and superadmins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- site_settings
DROP POLICY IF EXISTS "Admins can insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site_settings" ON public.site_settings;
CREATE POLICY "Admins and superadmins can insert site_settings" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins and superadmins can update site_settings" ON public.site_settings
  FOR UPDATE TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins and superadmins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));
