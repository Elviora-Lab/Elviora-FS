# Elviora — Frontend

Production-grade Next.js 15 storefront for **Elviora**, a luxury cosmetics & skincare house.

> Editorial UI. Modular feature architecture. Enterprise-grade scaffolding.

## Stack

| Concern       | Choice                                           |
| ------------- | ------------------------------------------------ |
| Framework     | Next.js 15 (App Router) + React 19               |
| Language      | TypeScript (strict, `noUncheckedIndexedAccess`)  |
| Styling       | Tailwind CSS 3 + design tokens                   |
| State         | Redux Toolkit + RTK Query                        |
| Forms         | React Hook Form + Zod                            |
| HTTP          | RTK Query (primary) + Axios (secondary)          |
| UI primitives | Radix UI + custom luxury system                  |
| Motion        | Framer Motion                                    |
| Toasts        | Sonner                                           |
| Quality       | ESLint, Prettier, Husky, lint-staged, Commitlint |

## Quickstart

```bash
nvm use            # Node 20
npm install
cp .env.example .env.local   # already provided with safe defaults
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script               | Purpose               |
| -------------------- | --------------------- |
| `npm run dev`        | Start dev server      |
| `npm run build`      | Production build      |
| `npm run start`      | Run production server |
| `npm run lint`       | ESLint                |
| `npm run type-check` | `tsc --noEmit`        |
| `npm run format`     | Prettier write        |

## Architecture at a glance

```
src/
├── app/                Next App Router (routes, layouts, sitemap, robots)
├── components/         Generic UI primitives + layout shells
│   ├── ui/             Radix-based primitives (Button, Dialog, Sheet, …)
│   └── layout/         Site shells (header, footer)
├── design-system/      The luxury system
│   ├── tokens/         Colors, typography, spacing, motion, breakpoints
│   ├── primitives/     Price, Rating, QuantitySelector, Loader, …
│   └── patterns/       Composed patterns (ProductCard)
├── features/           Vertical product slices — see features/README.md
│   ├── auth/           ✓ Fully implemented (reference)
│   ├── products/       ✓ Fully implemented (reference)
│   ├── cart/           ✓ Fully implemented (reference)
│   └── …               15 additional feature modules scaffolded
├── services/           HTTP layer
│   ├── api/            RTK Query baseApi + axios + error normalize
│   └── auth/           Token storage
├── store/              Redux store + typed hooks + middleware
├── providers/          Redux / Theme / Toast / App composition
├── hooks/              App-wide hooks (debounce, mediaQuery, localStorage)
├── lib/                cn(), SEO (metadata + JSON-LD), analytics
├── config/             env, site, navigation, routes
├── styles/             Global CSS + design-token CSS variables
├── shared/             Cross-cutting components (Form wrapper, …)
├── types/              Shared TS types
├── constants/          Magic numbers and enums
├── utils/              format, slug, safe-json
└── middleware.ts       Edge middleware (auth + role gates)
```

## Path aliases

`@/*` resolves to `src/*`. Sub-aliases (`@/features/*`, `@/components/*`, etc.) are configured in `tsconfig.json`.

## Feature contract

Every feature module under `src/features/<feature>/` follows the same shape — see [src/features/README.md](src/features/README.md).

## Design system

- Brand palette: **ivory, pearl, champagne, gold, beige, charcoal, rose** — exposed via CSS variables (`--brand-*`) and Tailwind utilities (`bg-brand-gold`, etc.).
- Typography: **Cormorant Garamond** (display) + **Inter** (UI) — loaded via `next/font/google`.
- Dark mode: handled by `next-themes` + `.dark` class. Token values are HSL channels so Tailwind's `<alpha-value>` opacity modifiers work.

## SEO

- `buildMetadata()` (`src/lib/seo/metadata.ts`) — one canonical helper for OG, Twitter, canonicals, robots.
- JSON-LD helpers (`src/lib/seo/json-ld.ts`) — Organization, Website, Product, Breadcrumb.
- `src/app/sitemap.ts` and `src/app/robots.ts` — dynamic sitemap & robots policy.

## Auth

JWT + refresh-token flow, single-flight refresh via mutex in `src/services/api/base-query.ts`. Tokens persist via `tokenStorage` (swap to httpOnly cookies in production). `useAuth()` gives `{ user, isAuthenticated, isAdmin, signIn, signOut }`.

## Editing the environment

Copy `.env.example` → `.env.local`. The `publicEnv` / `serverEnv` objects in `src/config/env.ts` are Zod-validated at boot — a missing or malformed variable fails fast at build/start time.

## Commit conventions

Conventional Commits enforced by `commitlint` via Husky's `commit-msg` hook.
