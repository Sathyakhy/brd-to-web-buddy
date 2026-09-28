-- 1. Add 'customer' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- 2. Extend events with richer content fields
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ceremony_time TEXT,
  ADD COLUMN IF NOT EXISTS reception_time TEXT,
  ADD COLUMN IF NOT EXISTS dress_code TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS bride_name TEXT,
  ADD COLUMN IF NOT EXISTS groom_name TEXT;

-- 3. Linking table: which customers can see which events
CREATE TABLE IF NOT EXISTS public.event_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_customers ENABLE ROW LEVEL SECURITY;

-- Helper: is this user a customer for this event?
CREATE OR REPLACE FUNCTION public.is_event_customer(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_customers
    WHERE user_id = _user_id AND event_id = _event_id
  );
$$;

-- event_customers policies
CREATE POLICY "Admins manage event_customers"
ON public.event_customers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers view their own assignments"
ON public.event_customers FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Tighten guests RLS: customers can manage guests of their assigned events
DROP POLICY IF EXISTS "Anyone can view guests" ON public.guests;

CREATE POLICY "Public can view guests for RSVP"
ON public.guests FOR SELECT
TO anon
USING (true);

CREATE POLICY "Admins view all guests"
ON public.guests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers view guests of their events"
ON public.guests FOR SELECT
TO authenticated
USING (public.is_event_customer(auth.uid(), event_id));

CREATE POLICY "Customers insert guests for their events"
ON public.guests FOR INSERT
TO authenticated
WITH CHECK (public.is_event_customer(auth.uid(), event_id));

CREATE POLICY "Customers update guests of their events"
ON public.guests FOR UPDATE
TO authenticated
USING (public.is_event_customer(auth.uid(), event_id))
WITH CHECK (public.is_event_customer(auth.uid(), event_id));

CREATE POLICY "Customers delete guests of their events"
ON public.guests FOR DELETE
TO authenticated
USING (public.is_event_customer(auth.uid(), event_id));

-- 5. Profiles: admins can view all profiles (for user management screen)
CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Storage bucket for event media
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-media', 'event-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read event media"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-media');

CREATE POLICY "Admins upload event media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update event media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete event media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-media' AND public.has_role(auth.uid(), 'admin'));