-- Hydration log and weight programme, both scoped to the signed-in user.

-- Programme targets live alongside the daily macro goals.
alter table public.profiles
    add column if not exists daily_water_ml    integer not null default 2500,
    add column if not exists daily_caffeine_mg integer not null default 400,
    add column if not exists start_weight_kg   numeric(5, 1),
    add column if not exists goal_weight_kg    numeric(5, 1),
    -- Negative loses weight, positive gains. Drives the "~19 wks." estimate.
    add column if not exists pace_kg_per_week  numeric(3, 2) not null default -0.5,
    add column if not exists program_started_on date;

create table if not exists public.drink_entries (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users on delete cascade,
    created_at   timestamptz not null default now(),
    logged_on    date not null default current_date,

    title        text not null,
    volume_ml    integer not null,
    -- Share of the volume that counts as hydration: water 100, coffee ~90.
    hydration_pct smallint not null default 100,
    caffeine_mg  integer not null default 0,

    constraint drink_entries_volume_positive check (volume_ml > 0),
    constraint drink_entries_hydration_range check (hydration_pct between 0 and 100)
);

create index if not exists drink_entries_user_day_idx
    on public.drink_entries (user_id, logged_on desc);

create table if not exists public.weight_entries (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users on delete cascade,
    created_at timestamptz not null default now(),
    -- One reading per day: re-weighing replaces the day's value.
    logged_on  date not null default current_date,
    weight_kg  numeric(5, 1) not null,

    constraint weight_entries_positive check (weight_kg > 0),
    unique (user_id, logged_on)
);

create index if not exists weight_entries_user_day_idx
    on public.weight_entries (user_id, logged_on desc);

alter table public.drink_entries  enable row level security;
alter table public.weight_entries enable row level security;

create policy "Users read their own drinks"
    on public.drink_entries for select to authenticated using (auth.uid() = user_id);
create policy "Users create their own drinks"
    on public.drink_entries for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete their own drinks"
    on public.drink_entries for delete to authenticated using (auth.uid() = user_id);

create policy "Users read their own weights"
    on public.weight_entries for select to authenticated using (auth.uid() = user_id);
create policy "Users create their own weights"
    on public.weight_entries for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update their own weights"
    on public.weight_entries for update to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their own weights"
    on public.weight_entries for delete to authenticated using (auth.uid() = user_id);
