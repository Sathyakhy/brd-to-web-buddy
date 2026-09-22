-- Replace existing admin role with superadmin for chansathya1@gmail.com.
-- Done in a single statement so the user is never left without an elevated role.
WITH target AS (
  SELECT user_id FROM public.profiles WHERE email = 'chansathya1@gmail.com'
), inserted AS (
  INSERT INTO public.user_roles (user_id, role)
  SELECT user_id, 'superadmin'::public.app_role FROM target
  ON CONFLICT (user_id, role) DO NOTHING
  RETURNING user_id
)
DELETE FROM public.user_roles
WHERE user_id IN (SELECT user_id FROM target)
  AND role = 'admin'::public.app_role;