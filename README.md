# CookMate

CookMate is a multilingual recipe web app built with Next.js App Router. It lets users browse recipes, open recipe detail pages, and generate new recipes through an AI chat flow using either text prompts or ingredient images.

## Project Analysis

This repository currently contains a single frontend application at the project root.

- Framework: Next.js 16 with React 19 RC and TypeScript
- Styling: Tailwind CSS with custom UI components and Radix primitives
- Internationalization: `next-intl` with English and French locales
- Data source: external recipe API configured through environment variables
- Testing: Vitest for unit tests and Playwright for end-to-end tests

### Main Features

- Locale-based routing under `app/[locale]`
- Home page with hero section, recipe slider, recipe listing, and AI recipe assistant
- Recipe listing page at `/[locale]/recipes`
- Recipe detail page at `/[locale]/recipes/[id]`
- AI recipe generation from text or uploaded ingredient images
- Light/dark theme support

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- `next-intl`
- Radix UI
- Framer Motion
- Firebase client SDK
- Vitest
- Playwright

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install dependencies

```bash
pnpm install
```

### Environment variables

Create a `.env.local` file in the project root:

```bash
API_KEY=your_api_key
BASE_URL=https://your-backend-api-url
```

`API_KEY` and `BASE_URL` are exposed through `next.config.ts` and used by the recipe provider layer in [`features/config.ts`](/Users/davidamouzou/Idx/CookMate/features/config.ts).

### Run the app

```bash
pnpm dev
```

The app runs locally on `http://localhost:3000`.

## Available Scripts

- `pnpm dev` starts the Next.js development server with Turbopack
- `pnpm build` creates a production build
- `pnpm start` runs the production server
- `pnpm lint` runs ESLint
- `pnpm test` runs the Vitest test suite
- `pnpm test:watch` runs Vitest in watch mode
- `pnpm test:e2e` runs Playwright end-to-end tests

## Project Structure

```text
app/                App Router pages, layouts, metadata, and context
components/         Reusable layout and UI components
features/           Domain entities, provider layer, and helper functions
i18n/               Locale routing and request configuration
messages/           Translation dictionaries
public/             Static assets
style/              Global styles
tests/e2e/          Playwright tests
lib/                Shared utilities and unit tests
```

## Notes for Development

- Locales are configured in [`i18n/routing.ts`](/Users/davidamouzou/Idx/CookMate/i18n/routing.ts) with `en` as the default locale.
- API calls are made from [`features/provider/recipe_provider.ts`](/Users/davidamouzou/Idx/CookMate/features/provider/recipe_provider.ts).
- E2E tests currently cover the localized home page and recipe detail flow in [`tests/e2e/home.spec.ts`](/Users/davidamouzou/Idx/CookMate/tests/e2e/home.spec.ts) and [`tests/e2e/recipe-detail.spec.ts`](/Users/davidamouzou/Idx/CookMate/tests/e2e/recipe-detail.spec.ts).

## Git Ignore

A root `.gitignore` is included for:

- Next.js build output
- dependency folders
- environment files
- TypeScript build info
- Playwright and coverage artifacts
- editor and macOS local files
