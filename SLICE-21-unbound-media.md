# SLICE-21 — Unbound media generation

**Status:** Complete

## Scope

- Remove media types, templates, image scout / reference images, and Post + Media (premium council)
- AI Council (3 credits) produces reviewed post + one unbound AI feed image
- Autopilot charges 3 credits per post (same council path)
- Standalone generate-media and in-council media regen cost 2 credits
- Media inputs: post copy + content profile brand colors + LinkedIn guidance + optional `mediaCustomPrompt`
- New `PostMedia` rows use `PostMediaType.generated`
- Dropped `PostPackage.mediaTypePreference` and `mediaTemplateId`

## Supersedes

- [SLICE-19-media-templates.md](SLICE-19-media-templates.md) (generation path)
- [SLICE-20-image-scout.md](SLICE-20-image-scout.md)
