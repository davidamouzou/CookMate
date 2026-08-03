-- Web-grounded recipe discovery + finer visitor geolocation.
--
-- Two things happen here:
--   1. Recipes can now come from a real page on the web rather than from the
--      model's imagination, so they carry an attribution (`source_url`).
--   2. Every recipe submission is attributed to the IP that sent it.
--
-- The IP deliberately does NOT live on `recipes`: that table is world-readable
-- (see 0001), so an `ip` column there would hand every visitor's address to
-- anyone who reads the API. It lives in `recipe_submissions`, which is
-- insert-only with no select policy — the same shape as `visits`.

-- ---------------------------------------------------------------------------
-- Recipes: where the recipe came from
-- ---------------------------------------------------------------------------

alter table public.recipes
    add column if not exists origin      text not null default 'ai',
    add column if not exists source_url  text,
    add column if not exists source_name text;

comment on column public.recipes.origin is
    'ai = model-written, web = found on a real page via search grounding, user = submitted by hand';

-- Only web-sourced rows are expected to carry attribution, and the same page
-- must not be imported twice.
create unique index if not exists recipes_source_url_key
    on public.recipes (source_url)
    where source_url is not null;

create index if not exists recipes_origin_idx on public.recipes (origin);

-- ---------------------------------------------------------------------------
-- Recipe submissions: who submitted what, from where
-- ---------------------------------------------------------------------------

create table if not exists public.recipe_submissions (
    id          bigint generated always as identity primary key,
    created_at  timestamptz not null default now(),
    recipe_id   text not null references public.recipes (id) on delete cascade,

    -- Network / location, captured server-side from the edge headers.
    ip          inet,
    country     text,
    region      text,
    city        text,
    postal_code text,
    timezone    text,
    latitude    double precision,
    longitude   double precision,

    -- Device
    user_agent  text,
    locale      text,

    -- How the recipe was produced: 'ai' | 'web' | 'user'
    origin      text
);

create index if not exists recipe_submissions_recipe_idx
    on public.recipe_submissions (recipe_id);
create index if not exists recipe_submissions_created_at_idx
    on public.recipe_submissions (created_at desc);
create index if not exists recipe_submissions_ip_idx
    on public.recipe_submissions (ip);

alter table public.recipe_submissions enable row level security;

-- Written by the server route with the publishable key. As with `visits`,
-- there is deliberately NO select policy: reading the log requires the SQL
-- editor or a service-role key.
create policy "Anyone can log a recipe submission"
    on public.recipe_submissions for insert
    to anon, authenticated
    with check (true);

-- ---------------------------------------------------------------------------
-- Visits: full location, not just the country
-- ---------------------------------------------------------------------------

alter table public.visits
    add column if not exists region      text,
    add column if not exists region_code  text,
    add column if not exists continent   text,
    add column if not exists postal_code text,
    add column if not exists latitude    double precision,
    add column if not exists longitude   double precision;

comment on column public.visits.latitude is
    'City-level precision from the CDN edge, not a device GPS fix.';

create index if not exists visits_region_idx on public.visits (country, region);

-- ---------------------------------------------------------------------------
-- Retention
-- ---------------------------------------------------------------------------

-- `recipe_submissions` holds personal data (an IP identifies a person under
-- GDPR) attached to content that is kept forever. Purge the attribution on the
-- same 90-day clock as `visits`, leaving the recipe itself untouched.
--   select cron.schedule('purge-submissions', '0 3 * * *',
--                        'select public.purge_old_recipe_submissions()');
create or replace function public.purge_old_recipe_submissions()
returns void
language sql
security definer
set search_path = public
as $$
    delete from public.recipe_submissions where created_at < now() - interval '90 days';
$$;
