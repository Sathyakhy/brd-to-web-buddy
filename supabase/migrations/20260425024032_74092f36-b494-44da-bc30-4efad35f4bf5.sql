DROP POLICY IF EXISTS "Admins can insert templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.templates;

CREATE POLICY "Admins and superadmins can insert templates"
ON public.templates
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins and superadmins can update templates"
ON public.templates
FOR UPDATE
TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins and superadmins can delete templates"
ON public.templates
FOR DELETE
TO authenticated
USING (public.is_admin_or_super(auth.uid()));