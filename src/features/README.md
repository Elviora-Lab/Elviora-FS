# Feature Modules

Each feature is a self-contained vertical slice of the product. Code that belongs to _only one_ feature lives here. Code shared across two or more features is promoted to `src/shared/`, `src/components/`, or `src/design-system/`.

## Anatomy

```
src/features/<feature>/
├── api/         RTK Query endpoints (injected into baseApi)
├── components/  Feature-specific React components
├── hooks/       Feature-specific React hooks
├── schemas/     Zod schemas (input validation, RHF resolvers)
├── store/       Redux slices (local UI/state — server data goes through RTK Query)
├── types/       TypeScript types & contracts
├── utils/       Pure helpers
└── index.ts     Public barrel — only export what the rest of the app should use
```

## Rules

1. **One-way imports.** Features may import from `shared/`, `design-system/`, `components/`, `lib/`, `services/`, `store/`, `hooks/`, `utils/`, `config/`. Features **must not** import from sibling features directly — go through their `index.ts`.
2. **Server data via RTK Query.** Inject endpoints into `baseApi` rather than creating new APIs. This keeps cache + tag invalidation coherent.
3. **Schemas are the boundary.** Validate every input (forms, URL params, server responses where reasonable) at the seam between the network and the app.
4. **Public surface = barrel.** Anything not exported from `index.ts` is internal — refactor freely.

## Implemented features

- `auth/` — JWT + refresh, RHF + Zod forms, role hook, session hydrator
- `products/` — list / detail / search endpoints, grid + filters
- `cart/` — local slice, RTK Query mirror, drawer pattern
- `wishlist/` — toggle + hydrator

These four are the only feature modules. The previously generated scaffolds
(orders, checkout, reviews, blog, etc.) were removed — they exported
real-looking hooks against placeholder endpoints. Add new features here
following the anatomy above; much of their server logic already exists under
`src/server/` (services, repositories, actions).
