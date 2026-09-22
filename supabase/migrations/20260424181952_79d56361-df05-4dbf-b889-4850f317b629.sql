create table if not exists public.site_settings (
  id text primary key default 'global',
  logo_url text,
  footer_text text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  telegram_url text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Singleton guard: only allow the row whose id = 'global'.
alter table public.site_settings
  drop constraint if exists site_settings_singleton;
alter table public.site_settings
  add constraint site_settings_singleton check (id = 'global');

-- Seed the singleton row if not present.
insert into public.site_settings (id, footer_text)
values ('global', 'Invitation made with love by 21Invite.Online')
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can view site_settings" on public.site_settings;
create policy "Anyone can view site_settings"
  on public.site_settings for select
  to public
  using (true);

drop policy if exists "Admins can insert site_settings" on public.site_settings;
create policy "Admins can insert site_settings"
  on public.site_settings for insert
  to authenticated
  with check (has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admins can update site_settings" on public.site_settings;
create policy "Admins can update site_settings"
  on public.site_settings for update
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at on changes.
create or replace function public.touch_site_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.touch_site_settings_updated_at();