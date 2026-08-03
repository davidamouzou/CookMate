-- CookMate: initial schema, migrated from Firestore.
--
-- `id` is text rather than uuid on purpose: it carries over the original
-- Firestore document ids so existing /recipes/[id] URLs keep working.
-- New rows fall back to a generated uuid.

create table if not exists public.recipes (
    id                text primary key default gen_random_uuid()::text,
    recipe_name       text        not null,
    description       text,
    image             text,
    ingredients       text[]      not null default '{}',
    instructions      text[]      not null default '{}',
    continent         text,
    language          text,
    duration_to_cook  integer,
    servings          integer,
    difficulty        text,
    cuisine           text,
    meal_type         text,
    nutrition_facts   jsonb       not null default '{}'::jsonb,
    created_by        text        not null default 'anonymous',
    created_at        timestamptz not null default now()
);

-- Feed order and pagination: recipes are always listed newest-first.
create index if not exists recipes_created_at_idx on public.recipes (created_at desc);

-- Filter columns used by the recipe list UI.
create index if not exists recipes_meal_type_idx  on public.recipes (lower(meal_type));
create index if not exists recipes_difficulty_idx on public.recipes (lower(difficulty));
create index if not exists recipes_cuisine_idx    on public.recipes (lower(cuisine));

alter table public.recipes enable row level security;

-- Recipes are public content.
create policy "Recipes are publicly readable"
    on public.recipes for select
    to anon, authenticated
    using (true);

-- NOTE: this mirrors the previous Firestore rules, where the browser wrote
-- recipes directly with no authentication. It means anyone can insert a row.
-- To tighten it, drop this policy and move RecipeProvider.saveRecipe behind a
-- server route using the service_role key.
create policy "Anyone can submit a recipe"
    on public.recipes for insert
    to anon, authenticated
    with check (true);
