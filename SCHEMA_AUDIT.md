# Schema Audit — Resolved & Deferred

> **Source of truth:** `apps/backend/prisma/schema.prisma`  
> **Migrations:** `20250704100000_phase1_schema_cleanup`, `20250705100000_phase2_enum_flatten`, `20250706100000_phase3_merge_council_run`  
> **Last updated:** June 2026

This document tracks schema optimization work from the 3-phase cleanup plan. See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for the current schema reference.

---

## Resolved (Phases 1–3)

| Item | Resolution |
|------|------------|
| Credits use UTC calendar month only | Paid users (`active`, `trialing`, `past_due`) now use `Subscription.currentPeriodStart/End`; free users fall back to UTC month |
| `PostPackage` hard delete | Individual delete sets `deletedAt` (soft delete) |
| `brief_created` dead enum | Removed from `PostPackageStatus` |
| `skipped` dead enum | Removed from `CouncilEventStatus` |
| `CreditTransaction` audit trail | Added optional `generationJobId` FK; all `consume()` callers pass job id |
| `CreditTransactionType.adjustment` unused | `CreditsService.grant()` added for positive adjustments |
| Duplicate `finalScore` in job JSON | Removed from `GenerationJob.result`; score lives on `PostPackage.score` and `GenerationJob.finalScore` |
| Redundant `subscriptions_stripeCustomerId_idx` | Dropped (`@unique` on column already indexes it) |
| Personal workspace uniqueness | Partial unique index: one active personal workspace per owner |
| Document polymorphic attach | Dropped `attachedToType` / `attachedToId`; profile attach via `User.profileDocumentId` only |
| `DocumentPurpose.user_document` | Removed (no upload flow) |
| `PostMediaSource` | Dropped; all media is council-generated |
| `AutopilotConfig.frequency` drift | Dropped; `postingDays` + `postingTime` are source of truth; API may derive display preset label |
| `WorkspaceMember.role` free string | Replaced with `WorkspaceMemberRole` enum |
| `CreditTransactionType.media` unused | Charged on council media regen (`MEDIA_REGEN_CREDIT_COST = 5`) |
| `CouncilRun` parallel table | Merged into `GenerationJob` (council fields + events FK) |
| `CouncilRunStatus` | Dropped; council lifecycle uses `GenerationJobStatus` only |
| `CouncilRun.workspaceId` no FK | Eliminated with table |
| Score triplication | Reduced: `PostPackage.score` (display), `GenerationJob.finalScore` (audit); not duplicated in `result` JSON |

---

## Deferred (out of scope)

| Item | Notes |
|------|-------|
| R2 orphan cleanup on post delete | Media objects may remain in R2 after post soft-delete |
| JSON retention / TTL on `CouncilEvent.output` | Large agent outputs accumulate indefinitely |
| `PostPackage.contentPillarId` FK | Pillar still stored as string snapshot on post |
| Per-workspace LinkedIn connections | LinkedIn data remains on `User` JSON |
| Full-text search | Not built |

---

## Verification checklist

- [x] Prisma migrations apply cleanly (3 phase migrations)
- [x] `npx prisma generate` succeeds
- [x] `npm test` in `apps/backend` — 224 tests passing
- [ ] Manual smoke: credits balance (free vs paid period), post soft delete, council job E2E, council history API

---

*Update when new schema work completes or deferred items are picked up.*
