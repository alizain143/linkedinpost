# linkedinpost.ai — Current Architecture (As Implemented)

> Snapshot: June 2026. Backend slices 1–20 complete. Schema cleanup phases 1–3 applied.
> Living reference for what exists today.
>
> **Field-level reference:** [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) (every table, column, enum).

## Product

AI LinkedIn content engine: generate posts → AI Council pipeline → human approval → schedule/publish to LinkedIn.

**Stack:** NestJS (`apps/backend`) · Next.js (`apps/web`, UI not built) · PostgreSQL · Prisma · Redis/BullMQ · Clerk · Stripe · Cloudflare R2 · OpenAI (text) · Google Gemini (images)

---

## High-level architecture

```
┌─────────────┐     JWT      ┌──────────────────────────────────────────┐
│  Web (TBD)  │ ──────────►  │  NestJS API  /v1                         │
└─────────────┘              │  Clerk guard · workspace scoping         │
                             └──────┬───────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
   PostgreSQL                  Redis/BullMQ              External APIs
   (Prisma)                    (async jobs)              Clerk, Stripe,
                                                         LinkedIn, OpenAI,
                                                         Google Image, R2
```

**Tenancy model:** User → owns Workspaces (personal + up to 5 client for Agency) → ContentProfiles + PostPackages + AutopilotConfig. Credits are **user-scoped**, not workspace-scoped.

---

## Backend modules (21)

| Module | Responsibility |
|--------|----------------|
| auth | Clerk JWT, webhooks, `/auth/me` |
| users | User sync from Clerk, profile doc attach |
| documents | R2 presigned upload (profile images) |
| workspaces | Personal + client workspaces, soft-delete cascade |
| content-profiles | Voice profile + pillars CRUD |
| posts | PostPackage CRUD, status machine, versions |
| pipeline | Kanban by PostPackageStatus |
| calendar | Month/week/list views (scheduledAt on PostPackage) |
| approvals | Approval queue tabs |
| approval-share | Tokenized public approve/reject links |
| scheduling | Schedule/unschedule/reschedule |
| linkedin | Profile sync, publish now, scheduled publish worker |
| credits | Ledger with billing-aligned credit period |
| billing | Stripe checkout, portal, webhooks |
| generation | Quick draft (sync) |
| job-queue | BullMQ worker for async jobs |
| council | Multi-agent orchestration + timeline |
| calendar-generation | Bulk 7/30-day calendar jobs |
| autopilot | Cron config + dispatch to council |
| media | Quote card generation + R2 attach |
| dashboard | Aggregated stats |

---

## Domain entity graph

```
User
 ├── Subscription (Stripe)
 ├── CreditTransaction[] (user-level ledger, optional generationJobId FK)
 ├── Document[] (R2 uploads — profile only)
 ├── profileDocument (1:1 optional)
 ├── ownedWorkspaces[]
 ├── workspaceMemberships[] (WorkspaceMember with WorkspaceMemberRole)
 └── ApprovalToken[] (created)

Workspace (personal | client)
 ├── ContentProfile[] → ContentPillar[]
 ├── PostPackage[] → PostVersion[], PostMedia[], ApprovalToken[]
 ├── GenerationJob[] → CouncilEvent[], PostMedia[], CreditTransaction[]
 └── AutopilotConfig? (1:1)

StripeWebhookEvent (idempotency)
```

**Central entity:** `PostPackage` — moves through pipeline statuses from draft → generating → approval → scheduled → published/failed.

**Council execution:** One `GenerationJob` (`type=council`) per council run. Fields `revisionCount`, `mediaRegenCount`, `finalScore` live on the job. No separate `CouncilRun` table.

**Not implemented as separate models (by design):**

- `CalendarEntry` — uses `PostPackage.scheduledAt`
- `LinkedInConnection` — dropped; LinkedIn data stored on `User` JSON
- `Notification` — only email prefs on `User`
- Full-text search — not built

---

## Prisma models & enums

> Full per-field documentation: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

### Models (15)

| Model | Purpose |
|-------|---------|
| User | Clerk identity, plan, settings, LinkedIn profile JSON |
| Subscription | Stripe customer/subscription mirror |
| StripeWebhookEvent | Webhook idempotency |
| Document | R2 file metadata (profile uploads) |
| Workspace | Personal or client workspace |
| WorkspaceMember | User ↔ workspace membership |
| ContentProfile | Voice/strategy profile per workspace |
| ContentPillar | Named pillars under a profile |
| PostPackage | Core post unit + pipeline status |
| PostVersion | Content snapshots on edit / council |
| PostMedia | Generated quote cards attached to posts |
| CreditTransaction | Append-only credit ledger |
| GenerationJob | AI job tracking (sync + async); council execution unit |
| CouncilEvent | Per-agent step in a council job |
| AutopilotConfig | Workspace autopilot settings |
| ApprovalToken | Hashed share links for client approval |

### Enums (15)

| Enum | Values | Notes |
|------|--------|-------|
| DocumentStatus | pending, attached | |
| DocumentPurpose | profile | Profile images only |
| WorkspaceMemberRole | owner, editor, viewer | Only `owner` used today |
| UserPlan | free, starter, pro, agency | Denormalized on User, synced from Stripe |
| WorkspaceType | personal, client | |
| ContentGoal | build_authority, generate_leads, grow_audience | |
| PostPackageStatus | draft, text_generating, … | No `brief_created` |
| PostSource | manual, calendar, autopilot, generation | |
| PostType | personal_story, list_post, how_to, … | |
| CreditTransactionType | generation, council, media, calendar, autopilot, adjustment | All types used |
| GenerationJobStatus | pending, running, completed, failed | Council lifecycle uses this |
| GenerationJobType | quick_draft, council, calendar | |
| PostMediaType | quote_card | Single value only |
| CouncilAgentRole | writer, reviewer, editor, media_creator, media_reviewer | |
| CouncilEventStatus | running, completed, failed | No `skipped` |
| SubscriptionStatus | active, trialing, past_due, canceled, incomplete, unpaid | |

---

## PostPackage status machine

| Status | Set by |
|--------|--------|
| draft | Manual CRUD |
| text_generating | Council enqueue |
| text_reviewing | Council orchestrator |
| media_generating | Council orchestrator |
| ready_for_approval | Council complete |
| approved | Approvals / share links |
| scheduled | Scheduling API |
| publishing | LinkedIn publish start |
| published | LinkedIn success |
| failed | Council or publish failure |

Three transition maps govern different subsystems:

- `post-status.transitions.ts` — manual/API transitions (**excludes** publish and direct schedule; use scheduling + LinkedIn modules)
- `council-status.transitions.ts` — council pipeline (includes `failed → text_generating` for retry)
- `scheduling-status.transitions.ts` — schedule/unschedule
- `publish-status.transitions.ts` — LinkedIn worker CAS (`approved|scheduled|failed → publishing`)

---

## Generation flows

1. **Quick draft** — sync, 1 credit, returns variants in job result (no PostPackage)
2. **Council** — async, 3 credits (10 for autopilot), creates PostPackage + GenerationJob; media regens cost 5 credits each
3. **Calendar bulk** — async, 10/30 credits, creates multiple PostPackages with `source=calendar`
4. **Autopilot** — cron dispatches council jobs with `source=autopilot`; schedule from `postingDays` + `postingTime`

Council agent pipeline: writer → reviewer → editor → media_creator → media_reviewer

---

## Credits

| User type | Credit period |
|-----------|---------------|
| Paid (`active`, `trialing`, `past_due`) | `Subscription.currentPeriodStart` → `currentPeriodEnd` |
| Free / no subscription | UTC calendar month |

`CreditTransaction.generationJobId` links consumption to the job that triggered it. Partial unique index on `(generationJobId, type)` prevents double-charge on job retry. `CreditsService.grant()` supports positive `adjustment` transactions.

---

## API surface (implemented)

| Area | Routes |
|------|--------|
| Health | `GET /v1/health` |
| Auth | `GET/PATCH /v1/auth/me`, `POST /v1/auth/logout`, Clerk webhook |
| Documents | `POST /v1/documents/init`, `GET /v1/documents/:id` |
| Workspaces | `GET /v1/workspaces`, `GET current`, `POST`, `GET/PATCH/DELETE :workspaceId` |
| Content profiles | CRUD `/v1/workspaces/:workspaceId/content-profiles` |
| Posts | CRUD + status + approve/reject/request-changes + versions |
| Pipeline | `GET .../pipeline` |
| Calendar | `GET .../calendar` |
| Approvals | `GET .../approvals` |
| Generate | `POST .../generate/quick`, `council`, `calendar` |
| Jobs | `GET /v1/jobs/:id` |
| Council | `GET .../posts/:postId/council` |
| Credits | `GET /v1/credits` |
| Billing | `GET /v1/billing`, checkout, portal, Stripe webhook |
| Scheduling | schedule/unschedule/reschedule on posts |
| LinkedIn | connection, profile sync, publish |
| Autopilot | `GET/PUT .../autopilot`, planned posts |
| Approval share | create/list/revoke tokens + public approve endpoints |
| Dashboard | `GET .../dashboard/stats` |

---

## External integrations

| Service | Usage |
|---------|-------|
| Clerk | Auth + LinkedIn OAuth token for publish |
| Stripe | Subscriptions; plan synced to `User.plan` |
| R2 | Profile images, post media (quote cards) |
| OpenAI | Text generation (GPT-5.4 default) |
| Google Gemini | Quote card images (Nano Banana 2) |
| Redis | BullMQ job queue |

---

## Plans & limits

| Plan | Credits/mo | Highlights |
|------|------------|------------|
| free | 5 | Basic generator |
| starter | $9 / 50 | Drafts, templates |
| pro | $19 / 200 | Calendar, autopilot, scheduling |
| agency | $49 / 1000 | 5 client workspaces, approval links |

Credit costs (from product spec): Quick Draft 1 · Council 3 · Post+Media 10 · Regenerate Media 5 · 7-day Calendar 10 · 30-day Calendar 30 · Autopilot 10

Agency max client workspaces: 5 (enforced in code)

---

## Soft delete

`deletedAt` on: User, Workspace, ContentProfile, PostPackage, GenerationJob, AutopilotConfig.

Cascade soft-delete when an agency client workspace is deleted. Individual post delete sets `deletedAt` (soft delete).

---

## Known remaining items (deferred / tech debt)

| Item | Detail |
|------|--------|
| `PRODUCT_OVERVIEW.md` ER diagram | May reference removed models (e.g. `CouncilRun`) |
| `PostPackage.pillar` string not FK | Rename pillar → old posts keep old name |
| R2 orphan cleanup | Media objects may remain in R2 after post soft-delete |
| `CouncilEvent.output` retention | No TTL; large agent outputs accumulate |
| Per-workspace LinkedIn connections | LinkedIn tokens/profile stay on `User`, not workspace |
| Full-text search | Not built |
| Document enums | Duplicated in Prisma schema and `document.constants.ts` |
| Quick draft async queue | Sync only today; optional future move to BullMQ |

Schema-level deferred items are also listed in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md#remaining-schema-notes-deferred).

---

## Slice docs (implementation history)

Per-slice specs at repo root: `SLICE-01` through `SLICE-20` (all marked done in `PRODUCT_OVERVIEW.md`).

Backend deep-dives in `apps/backend/`: `GENERATION.md`, `COUNCIL.md`, `PUBLISHING.md`, `SCHEDULING.md`, `TESTING.md`.

---

## Frontend status

All app screens listed in `PRODUCT_OVERVIEW.md` are **not started** (marketing, dashboard, generate, calendar, pipeline, etc.).

---

*Last updated: after schema optimization phases 1–3 (June 2026).*
