-- Templates table: editable name, description and a JSONB config mirroring the
-- event configuration (used as preview dummy data and as defaults when an
-- admin creates a new event with that template).
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Stable key used by the React renderer (e.g. 'khmer-traditional').
  -- Every event references this string in its `template` column.
  slug TEXT NOT NULL UNIQUE,
  -- Human-readable name shown in the picker / template list.
  label TEXT NOT NULL,
  -- Short subtitle ("Deep red & gold, ornate").
  description TEXT,
  -- One of the three built-in renderers ('khmer-traditional', 'modern-luxury',
  -- 'floral-romantic'). New custom templates pick a base to render with.
  base_renderer TEXT NOT NULL DEFAULT 'khmer-traditional',
  -- Active templates show in the picker. Built-ins should stay active.
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Display order in the picker.
  position INTEGER NOT NULL DEFAULT 0,
  -- Full preview / default-event configuration. Same shape as the event row's
  -- look-and-feel fields, plus sample agenda/contacts/gallery — anything the
  -- preview needs to render and that we want to copy when creating a new event.
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
  ON public.templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert templates"
  ON public.templates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update templates"
  ON public.templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete templates"
  ON public.templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Keep updated_at fresh on every change.
CREATE TRIGGER trg_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the three built-in designs with sample data the current Templates page
-- already uses for preview. Admins can edit any of these later.
INSERT INTO public.templates (slug, label, description, base_renderer, position, config)
VALUES
  (
    'khmer-traditional',
    'Khmer Traditional',
    'Deep red & gold, ornate',
    'khmer-traditional',
    0,
    jsonb_build_object(
      'title', 'Wedding Reception',
      'cover_message', E'ឯកឧត្តម លោកឧកញ្ញ៉ា លោកជំទាវ លោក​ លោកស្រី អ្នកនាង កញ្ញាអញ្ចើញចូលរួម\nជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធពរជ័យសិរិសួស្តីជ័យមង្គល​',
      'countdown_message', NULL,
      'description', 'We would be honoured by your presence as we celebrate the start of our new chapter together with family and friends.',
      'venue', 'Sokha Phnom Penh Hotel, Grand Ballroom',
      'cover_image_url', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
      'cover_background_url', NULL,
      'invite_background_url', NULL,
      'gallery_urls', '[]'::jsonb,
      'gallery_layout', 'grid',
      'ceremony_time', '10:00 AM',
      'reception_time', '6:00 PM',
      'dress_code', E'Formal · Gold accents welcome',
      'contact_phone', '+855 12 345 678',
      'bride_name', 'Sophea',
      'groom_name', 'Dara',
      'agenda_days', '[]'::jsonb,
      'agenda_view_style', 'list',
      'contacts', '[]'::jsonb,
      'map_embed', NULL,
      'text_color_primary', NULL,
      'text_color_accent', NULL,
      'sample_guest_name', E'លោក សំអុល យុទ្ធបញ្ញា និង គរិយា'
    )
  ),
  (
    'modern-luxury',
    'Modern Luxury',
    'Navy & champagne, minimal',
    'modern-luxury',
    1,
    jsonb_build_object(
      'title', 'Wedding Celebration',
      'cover_message', 'Two souls, one journey. Join us as we begin our forever.',
      'countdown_message', NULL,
      'description', 'Please join us for an evening of elegance and celebration.',
      'venue', 'The Ritz-Carlton, Grand Ballroom',
      'cover_image_url', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
      'cover_background_url', NULL,
      'invite_background_url', NULL,
      'gallery_urls', '[]'::jsonb,
      'gallery_layout', 'grid',
      'ceremony_time', '5:00 PM',
      'reception_time', '7:00 PM',
      'dress_code', 'Black tie',
      'contact_phone', '+855 12 345 678',
      'bride_name', 'Isabella',
      'groom_name', 'Alexander',
      'agenda_days', '[]'::jsonb,
      'agenda_view_style', 'list',
      'contacts', '[]'::jsonb,
      'map_embed', NULL,
      'text_color_primary', NULL,
      'text_color_accent', NULL,
      'sample_guest_name', 'Honoured Guest'
    )
  ),
  (
    'floral-romantic',
    'Floral Romantic',
    'Blush pink & cream',
    'floral-romantic',
    2,
    jsonb_build_object(
      'title', 'Garden Wedding',
      'cover_message', 'In the garden of love, our story blooms.',
      'countdown_message', NULL,
      'description', 'Join us for a day filled with flowers, love, and joyful celebration.',
      'venue', 'Botanical Gardens Pavilion',
      'cover_image_url', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
      'cover_background_url', NULL,
      'invite_background_url', NULL,
      'gallery_urls', '[]'::jsonb,
      'gallery_layout', 'grid',
      'ceremony_time', '4:00 PM',
      'reception_time', '6:30 PM',
      'dress_code', 'Garden chic',
      'contact_phone', '+855 12 345 678',
      'bride_name', 'Rose',
      'groom_name', 'Liam',
      'agenda_days', '[]'::jsonb,
      'agenda_view_style', 'list',
      'contacts', '[]'::jsonb,
      'map_embed', NULL,
      'text_color_primary', NULL,
      'text_color_accent', NULL,
      'sample_guest_name', 'Honoured Guest'
    )
  )
ON CONFLICT (slug) DO NOTHING;