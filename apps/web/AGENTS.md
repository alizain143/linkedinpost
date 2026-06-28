<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# linkedinpost.ai — Web app (`apps/web`)

Next.js App Router · Clerk auth · TanStack Query · API at `NEXT_PUBLIC_API_URL`.

## Documentation (read before feature work)

| Doc | Purpose |
|-----|---------|
| [FRONTEND_IMPLEMENTATION.md](../../FRONTEND_IMPLEMENTATION.md) | **Slice plan, dependencies, API wiring order** |
| [CURRENT_ARCHITECTURE.md](../../CURRENT_ARCHITECTURE.md) | Backend routes and flows to integrate |
| [PRODUCT_OVERVIEW.md](../../PRODUCT_OVERVIEW.md) | Product scope and screen inventory |
| `FE-SLICE-NN-*.md` | Per-slice frontend specs (create when starting a slice) |

## Conventions

- **API:** `useApiClient()` + `parseApiResponse`; Bearer token from Clerk
- **Server state:** TanStack Query hooks in `src/hooks/api/`
- **Workspace:** Most calls need `workspaceId` from workspace context (FE-SLICE-01)
- **UI:** Prefer wiring existing section components; delete unused mock data as slices ship
- **Types:** Align with backend DTOs — see Swagger or `apps/backend/src/common/swagger/`

## Keep docs updated

When shipping a frontend slice: check off [FRONTEND_IMPLEMENTATION.md](../../FRONTEND_IMPLEMENTATION.md), update `PRODUCT_OVERVIEW.md` frontend section, and mark `FE-SLICE-NN-*.md` complete.
