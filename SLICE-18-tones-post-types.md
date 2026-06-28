# SLICE-18 — Tones and post types expansion

**Status:** Complete

## Scope

- Expanded `TONE_OPTIONS` (12 presets + custom tone on Generate)
- Added 6 `PostType` enum values: `question_post`, `framework`, `myth_buster`, `prediction`, `behind_the_scenes`, `comparison`
- Shared tone/post-type playbooks in generation prompts
- Migration `20250709100000_media_tones_expansion` (PostType portion)

## API

No new routes. Existing generation DTOs accept expanded `PostType` values.
