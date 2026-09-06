# E-commerce Web

Frontend storefront built with Next.js, Tailwind CSS, shadcn-style UI primitives,
TanStack Query, Zustand, React Hook Form, and Zod.

## Getting Started

Install dependencies from the repository root:

```powershell
pnpm install
```

Create the web environment file:

```powershell
Copy-Item apps\web\.env.example apps\web\.env.local
```

Run the app:

```powershell
pnpm --filter web dev
```

## Architecture

Routes live in `app`. Shared infrastructure lives in `src/shared`. Domain code
lives in `src/features`.

```text
app/
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
    cart/
    products/
```

## Conventions

- Use Server Components for page-level reads where possible.
- Use Client Components for interactive UI, forms, cart behavior, and browser-only state.
- Put API functions in `features/<domain>/api.ts`.
- Use `apiRequest` for backend calls; it centralizes query params, credentials, data unwrap,
  and request/response/error interceptors.
- Put TanStack Query option factories in `features/<domain>/queries.ts`.
- Let route-level `error.tsx` files handle render/runtime failures; use `ErrorState` for
  recoverable API/query failures inside feature UI.
- Keep product/cart/auth domain types in their feature folders.
- Keep generic response and pagination types in `src/shared/types`.
- Keep reusable UI in `src/shared/ui`; feature-specific UI stays under the feature.
- Use semantic tokens from `app/globals.css` instead of hardcoded colors.
- Use `react-hook-form` with `zod` schemas for forms.
- Keep sensitive auth tokens in httpOnly cookies through server route handlers or server actions.
- Use Zustand only for client-side interaction state such as cart UI state.

## Quality Gates

```powershell
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build
```

Use `pnpm --filter web verify` before opening a pull request.
