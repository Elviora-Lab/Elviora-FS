# AdminDashboard

Operator-only shell: KPIs, sales charts, low-stock alerts.

## Structure

```
admin-dashboard/
├── api/         RTK Query endpoints (extend baseApi)
├── components/  React components
├── hooks/       React hooks
├── types/       Domain types
└── index.ts     Public barrel
```

## Status

Scaffold — wire the API endpoints, define real domain types, and build components against the shared design system (`@/design-system`, `@/components/ui`).
