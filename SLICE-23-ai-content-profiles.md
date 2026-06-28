# SLICE-23 — AI content profile suggestions

**Status:** Complete

## Scope

- Generate up to 3 AI content profile suggestions (free preview)
- User approves 1–3 profiles; **1 credit each** on save
- Seed: LinkedIn profile (if connected) + optional questionnaire

## API

| Method | Route |
|--------|-------|
| `POST` | `/v1/workspaces/:workspaceId/content-profiles/suggest` |
| `POST` | `/v1/workspaces/:workspaceId/content-profiles/approve-suggestions` |

## Credits

- New `CreditTransactionType.content_profile` (migration `20250709110000_add_content_profile_credit_type`)
- Cost: 1 credit per profile saved via approve endpoint

## Backend

- `ContentProfileAiService`, prompt `content-profile-suggest` v1
- LinkedIn OIDC data merged into suggest prompt

## Frontend

- `AiContentProfileWizard` modal on Profile page
- Entry: "Generate with AI" header button + "Create with AI" empty state
