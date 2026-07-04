# SLICE-19 — Media types and template renderer

**Status:** Superseded by [SLICE-21-unbound-media.md](SLICE-21-unbound-media.md)

## Scope

- `PostMediaType` expanded: `branded_quote_card`, `stat_highlight`, `tip_card`, `infographic`, `photo_illustration`
- `media-templates` module: SVG templates + `@resvg/resvg-js` PNG render
- `MediaRenderService` routes template vs AI generation
- Media Creator/Reviewer prompt rewrite
- Generate UI: media type, template style, custom prompt, skip scout toggle
- `mediaTypePreference`, `mediaCustomPrompt`, `mediaTemplateId` on `PostPackage`

## Env

No new required env vars for templates (AI lane unchanged).
