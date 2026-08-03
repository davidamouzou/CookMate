-- Visitor telemetry: IP, device and country for each page view.
--
-- This table holds personal data (an IP address identifies a person under
-- GDPR). Keep it disclosed in the privacy policy and purge it on a schedule —
-- see the retention helper at the bottom of this file.

create table if not exists public.visits (
    id           bigint generated always as identity primary key,
    created_at   timestamptz not null default now(),

    -- Network
    ip           inet,
    country      text,        -- ISO 3166-1 alpha-2, from the Cloudflare edge
    city         text,
    timezone     text,

    -- Device
    device_type  text,        -- mobile | tablet | desktop | bot | unknown
    os           text,
    browser      text,
    user_agent   text,
    is_bot       boolean not null default false,

    -- Context
    path         text,
    locale       text,
    referrer     text
);

create index if not exists visits_created_at_idx on public.visits (created_at desc);
create index if not exists visits_country_idx    on public.visits (country);
create index if not exists visits_ip_idx         on public.visits (ip);

alter table public.visits enable row level security;

-- Insert-only for the publishable key: the browser can record a visit but can
-- never read the log back. There is deliberately NO select policy, so reading
-- requires the SQL editor or a service-role key.
create policy "Anyone can record a visit"
    on public.visits for insert
    to anon, authenticated
    with check (true);

-- Retention: drop visits older than 90 days. Schedule with pg_cron, e.g.
--   select cron.schedule('purge-visits', '0 3 * * *', 'select public.purge_old_visits()');
create or replace function public.purge_old_visits()
returns void
language sql
security definer
set search_path = public
as $$
    delete from public.visits where created_at < now() - interval '90 days';
$$;
