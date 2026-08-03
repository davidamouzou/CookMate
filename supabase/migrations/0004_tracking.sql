-- Daily food tracking, scoped to the signed-in user.
--
-- Requires anonymous sign-ins to be enabled:
--   Dashboard -> Authentication -> Sign In / Providers -> Anonymous sign-ins.
-- Every visitor then gets a real auth user (uuid + JWT) with no signup form,
-- which is what makes the row-level security below meaningful.

-- Per-user daily targets.
create table if not exists public.profiles (
    id             uuid primary key references auth.users on delete cascade,
    created_at     timestamptz not null default now(),
    daily_kcal     integer not null default 2000,
    daily_carbs_g  integer not null default 250,
    daily_protein_g integer not null default 120,
    daily_fat_g    integer not null default 70
);

-- One logged item. `logged_on` is a date, not a timestamp: the day a meal
-- belongs to is the user's calendar day, independent of timezone drift.
create table if not exists public.food_entries (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users on delete cascade,
    created_at  timestamptz not null default now(),
    logged_on   date not null default current_date,

    title       text not null,
    kcal        integer not null default 0,
    carbs_g     numeric(6, 1) not null default 0,
    protein_g   numeric(6, 1) not null default 0,
    fat_g       numeric(6, 1) not null default 0,

    -- How the entry was created: manual | ai_text | ai_photo | recipe
    source      text not null default 'manual',
    -- Set when the entry came from the recipe catalogue; keeps the two halves
    -- of the app connected without duplicating recipe data.
    recipe_id   text references public.recipes (id) on delete set null,

    constraint food_entries_kcal_positive check (kcal >= 0)
);

create index if not exists food_entries_user_day_idx
    on public.food_entries (user_id, logged_on desc);

alter table public.profiles     enable row level security;
alter table public.food_entries enable row level security;

-- Each user sees and writes only their own rows. `auth.uid()` is null for
-- unauthenticated callers, so these policies also deny anonymous REST access.
create policy "Users read their own profile"
    on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users create their own profile"
    on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update their own profile"
    on public.profiles for update to authenticated
    using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users read their own entries"
    on public.food_entries for select to authenticated using (auth.uid() = user_id);
create policy "Users create their own entries"
    on public.food_entries for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update their own entries"
    on public.food_entries for update to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their own entries"
    on public.food_entries for delete to authenticated using (auth.uid() = user_id);
