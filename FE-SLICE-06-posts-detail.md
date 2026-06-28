# FE-Slice 06 — Posts list + post package detail

**Status:** Complete  
**Depends on:** FE-SLICE-01, FE-SLICE-03

## Goal

Workspace-scoped post CRUD: unified posts list, post detail with content fields and version history, manual draft create/edit/delete, and `PostPackageStatus` badges.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET/POST` | `/v1/workspaces/:workspaceId/posts` |
| `GET/PATCH/DELETE` | `.../posts/:postId` |
| `GET` | `.../posts/:postId/versions` |
| `PATCH` | `.../posts/:postId/status` |
| `POST` | `.../posts/:postId/approve`, `reject`, `request-changes` (fetch only) |

Maps to backend SLICE-02, SLICE-03.

## Delivered

### API layer

- [`lib/api/types/post.ts`](apps/web/src/lib/api/types/post.ts) — post package, version, media types
- [`lib/api/posts.ts`](apps/web/src/lib/api/posts.ts) — full CRUD + versions + approval fetch helpers
- [`lib/post-status.ts`](apps/web/src/lib/post-status.ts) — status labels and badge styles
- [`lib/post-source.ts`](apps/web/src/lib/post-source.ts) — source labels
- [`lib/post-types.ts`](apps/web/src/lib/post-types.ts) — `POST_TYPE_SELECT_OPTIONS`
- [`lib/api/query-keys.ts`](apps/web/src/lib/api/query-keys.ts) — `posts.versions`

### Hooks

- [`use-posts-api.ts`](apps/web/src/hooks/api/use-posts-api.ts) — list, detail, versions, mutations, invalidation

### Pages

- [`/app/posts`](apps/web/src/app/app/posts/page.tsx) — `PostsList` with status tabs, create draft, QueryState
- [`/app/posts/[id]`](apps/web/src/app/app/posts/[id]/page.tsx) — `PostDetail` with draft edit, versions, submit for approval, delete

### Integration

- [`StatusBadge`](apps/web/src/components/app/app-ui.tsx) — API enum labels/styles
- [`Dashboard.tsx`](apps/web/src/components/sections/app/dashboard/Dashboard.tsx) — recent drafts link to post detail; View all → `/app/posts?status=draft`
- [`app-shell.tsx`](apps/web/src/components/app/app-shell.tsx) — Posts / Post detail titles
- [`app-ui-provider.tsx`](apps/web/src/providers/app-ui-provider.tsx) — `confirmDeleteDraft(title, onConfirm)`

## Behaviors

- List tabs: Drafts, Scheduled, Published, All (URL `?status=`)
- Draft-only edit/delete; submit for approval via status transition
- Mutations invalidate posts list, detail, versions, dashboard stats
- Pipeline kanban remains mock (FE-SLICE-07)

## Progress

- [x] Post types + fetch layer
- [x] TanStack Query hooks
- [x] Posts list page
- [x] Post detail page
- [x] StatusBadge + dashboard links
- [x] `npm run build` passes

## Test plan (manual)

- [ ] List loads drafts for active workspace; tab filters refetch
- [ ] Create manual draft → opens detail
- [ ] Edit draft → saves; version history updates on content change
- [ ] Non-draft post is read-only
- [ ] Delete draft removes from list
- [ ] Submit for approval updates status badge
- [ ] Dashboard recent drafts link to post detail
- [ ] Loading skeleton + error retry
- [ ] Pipeline page still shows mock kanban

## Out of scope

- Pipeline kanban API (FE-SLICE-07)
- Approvals queue UI (FE-SLICE-08)
- Schedule/publish modals (FE-SLICE-11)
