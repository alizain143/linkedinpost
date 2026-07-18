# Site Discovery

Discover linkedinpost.ai product pages, pricing, auth, and LLM-oriented indexes.

## Discovery endpoints

- `/llms.txt`: LLM-oriented site index (curated)
- `/llms-full.txt`: Full site content for LLM context
- `/.well-known/agent-skills/index.json`: Agent skills index
- `/sitemap.xml`: Search engine sitemap
- `/robots.txt`: Crawl rules, AI bot blocks, Content Signals
- `/.well-known/api-catalog`: RFC 9727 API catalog (OpenAPI + health)
- `/auth.md`: How humans and API clients authenticate (Clerk JWT)
- `/.well-known/oauth-protected-resource`: OAuth Protected Resource Metadata
- `/.well-known/openid-configuration`: OpenID Provider Configuration (Clerk)
- `/.well-known/oauth-authorization-server`: OAuth AS metadata (Clerk)
- `/.well-known/mcp/server-card.json`: MCP Server Card (SEP-1649)
- `/mcp`: MCP Streamable HTTP transport (site discovery tools)

## Product pages

- `/`: Home
- `/features`: Feature overview
- `/how-it-works`: Product workflow
- `/pricing`: Plans and pricing
- `/faq`: Frequently asked questions
- `/guides`: LinkedIn content guides
- `/about`: Mission
- `/contact`: Contact form
- `/sign-up`: Free account registration

## Content negotiation

Request marketing pages with `Accept: text/markdown` to receive a markdown representation (`Content-Type: text/markdown`).
