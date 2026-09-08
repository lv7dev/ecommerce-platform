# E-commerce Admin

Internal admin console built as a separate Next.js app in the monorepo. It
reuses the same API auth cookies and shared frontend primitives as the
storefront, while keeping admin routes deployable on a dedicated subdomain.

## Getting Started

Create the admin environment file:

```powershell
Copy-Item apps\admin\.env.example apps\admin\.env.local
```

Run the admin app:

```powershell
pnpm --filter admin dev
```

The local HTTPS proxy maps:

```text
https://admin.ecommerce.localhost:3444 -> http://127.0.0.1:3001
```

## Architecture

```text
app/
  login/
  page.tsx
  providers.tsx
src/
  shared/
    api/
    config/
    forms/
    lib/
    query/
    types/
    ui/
  features/
    auth/
    dashboard/
```

The current dashboard accepts users with `ADMIN` or `STAFF` roles. Future admin
screens should add permission checks per feature.
