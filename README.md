# CookMate

CookMate is a multilingual recipe web app built with Next.js App Router. It lets users browse recipes, open recipe detail pages, and generate new recipes through an AI chat flow using either text prompts or ingredient images.

## Project Analysis

This repository contains a single frontend application. All application code lives under `src/`, the project root holds only configuration.

- Framework: Next.js 16 with React 19 RC and TypeScript
- Package manager: Bun
- Styling: Tailwind CSS with custom UI components and Radix primitives
- Internationalization: `next-intl` with English and French locales
- Data: Supabase (Postgres + Storage) and the Google Generative AI SDK
- Deployment: Cloudflare Workers through `@opennextjs/cloudflare`
- Testing: Vitest for unit tests and Playwright for end-to-end tests

### Main Features

- Locale-based routing under `src/app/[locale]`
- Home page with hero section, recipe slider, recipe listing, and AI recipe assistant
- Recipe listing page at `/[locale]/recipes`
- Recipe detail page at `/[locale]/recipes/[id]`
- AI recipe generation from text or uploaded ingredient images
- Web-grounded recipe **discovery** from an ingredient photo, a calorie target or a protein floor — see [Recipe discovery](#recipe-discovery)
- Light/dark theme support

## Tech Stack

- Next.js
- React
- TypeScript
- Bun
- Tailwind CSS
- `next-intl`
- Radix UI
- Framer Motion
- Supabase JS client
- Vitest
- Playwright

## Getting Started

### Prerequisites

- [Bun](https://bun.com) 1.3+

### Install dependencies

```bash
bun install
```

### Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser | Public key; RLS enforces access |
| `GEMINI_API_KEY` | server | Recipe generation and web-grounded discovery |
| `IMAGE_GEN_MODEL_KEY` | server | Image generation |
| `GEMINI_MODEL` | server | Optional. Overrides the default generation model |
| `GEMINI_SEARCH_MODEL` | server | Optional. Model used for search grounding, if it differs |
| `BASE_URL` | server | Canonical URLs and sitemap |

`GEMINI_API_KEY` and `IMAGE_GEN_MODEL_KEY` go through the `env` block of [`next.config.ts`](next.config.ts), which inlines them wherever they are referenced — keep them out of client components. The Supabase client is created in [`src/lib/supabase.ts`](src/lib/supabase.ts) and consumed by the recipe data layer in [`src/features/recipes/api/`](src/features/recipes/api).

### Database setup

Apply the SQL in [`supabase/migrations/`](supabase/migrations) in order, via the Supabase SQL editor or `supabase db push`:

- `0001_init_recipes.sql` — `recipes` table, indexes, and RLS policies
- `0002_storage_recipe_images.sql` — public `recipe-images` storage bucket
- `0003_visits.sql` — `visits` table for visitor telemetry, plus a retention function
- `0008_recipe_discovery_and_geo.sql` — recipe provenance columns, the
  `recipe_submissions` table, and the extra location columns on `visits`.
  **Required** for recipe discovery and for the finer visitor location; the
  save route fails without it.

> The insert policies allow anonymous writes, mirroring the previous Firestore
> rules where the browser wrote directly. To tighten this, drop those policies
> and move `RecipeProvider.saveRecipe` behind a server route using the
> service-role key.

`0004_tracking.sql` and `0005_hydration_program.sql` are **not required**. They
define per-user tracking tables behind RLS, which needs every visitor to hold an
auth session — anonymous sign-ins are disabled on this project, so the tracking
screens keep their data in the browser instead (see
[`src/features/tracking/api/local-store.ts`](src/features/tracking/api/local-store.ts)).
Applying them is harmless but the tables stay empty; drop them if they were
already created.

### Run the app

```bash
bun dev
```

The app runs locally on `http://localhost:3000`.

## Available Scripts

- `bun dev` starts the Next.js development server with Turbopack
- `bun run build` creates a production build
- `bun run start` runs the production server
- `bun run lint` runs ESLint
- `bun run test` runs the Vitest test suite
- `bun run test:watch` runs Vitest in watch mode
- `bun run test:e2e` runs Playwright end-to-end tests
- `bun run build:cf` builds the Cloudflare Workers bundle
- `bun run preview` builds and previews the Worker locally
- `bun run deploy` builds and deploys to Cloudflare
- `bun run cf-typegen` regenerates the Cloudflare env typings

### Firestore → Supabase migration

One-off scripts in [`scripts/`](scripts), run in this order:

```bash
bun run migrate:export   # Firestore -> backup/firestore-recipes.json (read-only)
bun run migrate:images   # Firebase Storage -> Supabase Storage, writes backup/image-map.json
bun run migrate:import   # backup JSON + image map -> Supabase `recipes` table
```

All three run on the publishable key alone, relying on the insert policies, and
are safe to re-run. `migrate:import` preserves the original Firestore document
ids as primary keys, so existing `/recipes/[id]` URLs keep working.

Because the publishable key has no UPDATE rights, re-running `migrate:import`
skips rows that already exist rather than refreshing them. To rewrite image URLs
after a later `migrate:images` run, delete the affected rows first (or add a
temporary update policy).

Once the migration is complete, `firebase` can be dropped from
`devDependencies` and `scripts/export-firestore.ts` deleted.

### Regenerating unreachable photos

A recipe needs a new photo when its `image` column does not actually serve one:
no URL at all, a dead Firebase link (402 while the billing account is
suspended), or a Supabase URL whose object has since gone missing. The URL alone
does not say which, so the script fetches every one and checks the response —
a broken image is caught wherever it is hosted, our own bucket included.

Broken photos cannot be copied from anywhere, so they are recreated from each
recipe's own text with the same image model the app uses (`IMAGE_GEN_MODEL_KEY`,
getimg.ai), uploaded to Supabase Storage, and written back to `recipes.image`:

```bash
bun run images:regenerate -- --dry-run   # what would run, and what it would cost
bun run images:regenerate -- --limit=3   # try a few first
bun run images:regenerate                # the whole backlog
bun run images:regenerate -- --all       # force fresh images, even for working rows
```

**Generation is billed per image.** The script never pays twice: it HEADs the
deterministic storage path first and reuses anything already uploaded, so
re-running after a failure costs nothing. `--dry-run` reports exactly how many
calls would be billed versus reused. The one object it will not reuse is a
recipe's own failing URL — that file is the problem, so it is overwritten.

Writing the new URL back needs UPDATE rights on `recipes`. Rather than a
service-role key, apply the two maintenance policies:

- [`0006_recipe_image_maintenance.sql`](supabase/migrations/0006_recipe_image_maintenance.sql)
  covers rows still pointing at Firebase — narrow and self-limiting, so each
  recipe can be rewritten once and never again.
- [`0007_recipe_image_repair.sql`](supabase/migrations/0007_recipe_image_repair.sql)
  covers the rest (no image, or a Supabase object that went missing), which
  0006's `USING` clause does not match. It also grants the storage UPDATE needed
  to overwrite a broken object in place.

Drop both when done:

```sql
drop policy "Maintenance: replace dead recipe images" on public.recipes;
drop policy "Maintenance: repair broken recipe images" on public.recipes;
drop policy "Maintenance: overwrite a broken recipe image" on storage.objects;
```

## Project Structure

```text
src/
├── app/                      App Router: routing, layouts, metadata, API routes
│   ├── [locale]/             Localized pages (home, recipes, water, program)
│   ├── api/generate/         AI generation endpoints (recipe, image)
│   ├── api/search/recipe/    Web-grounded recipe discovery
│   └── api/recipes/          Recipe save, capturing the submitter's IP
├── components/
│   ├── ui/                   shadcn/Radix primitives
│   └── layout/               Cross-cutting layout components (header, theme, locale switch)
├── features/
│   └── recipes/              Recipe domain
│       ├── api/              Data access (recipe provider, storage upload)
│       ├── components/       Recipe UI (list, card, filters, search, finder, AI chat)
│       ├── context/          Recipe React context
│       ├── lib/              Pure recipe logic (search prompts, nutrition matching)
│       └── types/            Recipe entity types
├── hooks/                    Shared React hooks
├── i18n/                     Locale routing, request config, and `messages/` dictionaries
├── lib/
│   ├── ai/                   Gemini client with Google Search grounding
│   ├── analytics/            Visit recording, user-agent and geo parsing
│   └── …                     Shared utilities (Supabase client, DB types, `cn`)
├── styles/                   Global stylesheet
└── middleware.ts             next-intl locale middleware

public/                       Static assets
scripts/                      One-off Firestore -> Supabase migration scripts
supabase/migrations/          SQL schema and storage policies
tests/e2e/                    Playwright tests
```

## Recipe discovery

`/api/generate/recipe` invents a recipe. **Recipe discovery** does the opposite:
it searches the web for recipes that already exist and reports where each one
came from. It is exposed by the finder card at the top of `/[locale]/recipes`
([`src/features/recipes/components/recipe-finder.tsx`](src/features/recipes/components/recipe-finder.tsx)),
which takes any combination of:

- a **photo of ingredients** — read by a vision pass and shown back as chips
- a **calorie target** per serving
- a **protein floor** per serving
- optional free text

[`POST /api/search/recipe`](src/app/api/search/recipe/route.ts) then runs three
model calls:

1. **vision** — lists the ingredients in the photo (skipped when there is none)
2. **search** — a call grounded in Google Search that finds real pages
3. **structure** — a plain JSON call that turns those findings into table rows

Two calls rather than one because the API rejects `responseMimeType:
application/json` together with the search tool. Every result is validated by
[`normalizeFoundRecipe`](src/features/recipes/lib/recipe-search.ts), which drops
anything without a name, ingredients and steps, keeps only `http(s)` source
URLs, and labels a recipe `origin: 'ai'` when no reachable source survived —
so the UI never claims provenance it does not have. Results are ranked by how
closely their nutrition matches the targets that were actually set.

Images are generated only for the result a visitor keeps, not for every hit.

> **Grounding quota.** Search grounding is metered separately from plain
> generation, so this feature can return `429` while the rest of the app keeps
> working. The UI shows a dedicated message in that case. Set
> `GEMINI_SEARCH_MODEL` if the default model on your key does not offer
> grounding.

Saving goes through [`POST /api/recipes`](src/app/api/recipes/route.ts) rather
than a browser insert, because the submitter's IP has to be read from the
request — see below.

## Visitor telemetry

Every page view is recorded in the `visits` table from [`src/middleware.ts`](src/middleware.ts),
behind `waitUntil` so it adds no latency. Captured fields: IP address, country,
region, city, postal code, continent, timezone, latitude/longitude, device type,
OS, browser, raw user agent, bot flag, path, locale and referrer.

The location comes from the CDN edge headers — Cloudflare's `cf-*` in
production, Vercel's `x-vercel-ip-*` on preview deploys — so no third-party
geolocation service is involved. See
[`src/lib/analytics/geo.ts`](src/lib/analytics/geo.ts). **They are only
populated behind the CDN** — locally they are null, and city-level precision is
the best they offer.

On Cloudflare, everything beyond `cf-ipcountry` requires the *Add visitor
location headers* managed transform to be enabled on the zone; without it the
country is filled in and the rest stays null.

### Who submitted a recipe

Each saved recipe also writes a row to `recipe_submissions`: the IP, the
resolved location, the user agent, the locale and the origin of the recipe.

The IP deliberately does **not** live on `recipes`. That table is world-readable
by design, so an `ip` column there would publish every contributor's address to
anyone who reads the API. `recipe_submissions` is insert-only with no select
policy, the same shape as `visits`.

The publishable key can insert but not read: there is no select policy on
`visits` or `recipe_submissions`, so both logs are only readable from the SQL
editor or with a service-role key.

> **Legal:** an IP address is personal data under GDPR. Before shipping this,
> declare the collection, its purpose and its retention period in the privacy
> policy, and make sure you have a lawful basis (legitimate interest for
> security/audience measurement, otherwise consent). `purge_old_visits()` and
> `purge_old_recipe_submissions()` are provided to enforce a 90-day retention —
> schedule both with `pg_cron`. The recipe itself is kept; only the attribution
> expires.

Because the insert policy is open to anonymous callers, the publishable key
allows forged rows. That is acceptable for audience measurement; do not treat
`visits` as a security audit log.

### Conventions

- All internal imports use the `@/*` alias, which maps to `src/*`.
- File and folder names are kebab-case.
- `src/app/` contains routing concerns only; feature logic lives in `src/features/<domain>/`.
- Components shared across features go in `src/components/`; feature-specific components stay inside that feature.

## Notes for Development

- Locales are configured in [`src/i18n/routing.ts`](src/i18n/routing.ts) with `en` as the default locale.
- Translation dictionaries live in [`src/i18n/messages/`](src/i18n/messages).
- Recipe API calls are made from [`src/features/recipes/api/recipe-provider.ts`](src/features/recipes/api/recipe-provider.ts).
- E2E tests cover the localized home page and recipe detail flow in [`tests/e2e/home.spec.ts`](tests/e2e/home.spec.ts) and [`tests/e2e/recipe-detail.spec.ts`](tests/e2e/recipe-detail.spec.ts).
- A static `public/sitemap.xml` currently shadows the dynamic `src/app/sitemap.ts` route; remove the static file if you want the generated sitemap to be served.

## Git Ignore

A root `.gitignore` is included for:

- Next.js and OpenNext build output
- dependency folders
- environment files
- TypeScript build info
- Playwright and coverage artifacts
- editor and macOS local files
