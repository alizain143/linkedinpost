# SEO host & redirects (linkedinpost.ai)

Canonical URLs, sitemap, and `NEXT_PUBLIC_SITE_URL` all use the **apex** host:

`https://linkedinpost.ai`

GSC property: `https://linkedinpost.ai/` (URL-prefix). Sitemap submits apex URLs only.

## Critical: do not redirect apex → www

If the edge sends `https://linkedinpost.ai/*` → `https://www.linkedinpost.ai/*`, Google will:

1. Choose **www** as the Google-selected canonical (seen in URL Inspection)
2. Treat apex sitemap URLs as redirected away from the property’s preferred host
3. Leave coverage at **0 indexed** even when HTML already has `index, follow`

PageSpeed’s “Avoid multiple page redirects” also fires on a **two-hop** chain, e.g.:

`http://linkedinpost.ai` → `https://linkedinpost.ai` → `https://www.linkedinpost.ai`

## Preferred Cloudflare setup

In Cloudflare → **Rules** → **Redirect Rules**, use **one** rule that lands on HTTPS apex in a **single** hop:

| If (OR) | Then |
|---------|------|
| Hostname equals `www.linkedinpost.ai` | Dynamic redirect to `https://linkedinpost.ai${uri.path}${uri.query}` · 301 |
| Hostname equals `linkedinpost.ai` **and** scheme equals `http` | Same destination · 301 |

Also:

1. Vercel project → Domains: set **linkedinpost.ai** as the primary domain (not `www`). The production 301 currently includes `x-vercel-id`, so Vercel is issuing apex → `www` — flip primary so **www redirects to apex**, not the reverse.
2. Remove any older Cloudflare Page Rule / Bulk Redirect that sends apex → `www` (that causes the second hop and fights the sitemap).
3. Keep “Always Use HTTPS” only if it does **not** create an extra hop before the rule above; prefer folding HTTP→HTTPS into the same redirect rule.

Do **not** add an app middleware www→apex redirect while apex→www still exists at the edge — that creates a redirect loop.

### Verify after changing redirects

```bash
curl -sI https://linkedinpost.ai/ | rg -i 'HTTP/|location'
# expect: 200 (or single hop http→https only) — NOT location: https://www…

curl -sI https://www.linkedinpost.ai/ | rg -i 'HTTP/|location'
# expect: 301 location: https://linkedinpost.ai/

curl -sI https://linkedinpost.ai/opengraph-image | rg -i 'HTTP/|content-type'
# expect: 200 image/png (not 404 / sign-in)
```

Then in GSC → URL Inspection → **Request indexing** for `/`, `/pricing`, `/how-it-works`, and **Validate fix** on the “Excluded by noindex” coverage report.

## Analytics (Vercel / web env)

The app already loads GA4 + Clarity when these are set in **production**:

```env
NEXT_PUBLIC_SITE_URL=https://linkedinpost.ai
# Optional overrides (defaults live in apps/web/src/lib/analytics/ids.ts):
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-ZG34TRGH9L
# NEXT_PUBLIC_CLARITY_PROJECT_ID=xhsl8kcscj
```

GA4 (`G-ZG34TRGH9L`) and Clarity (`xhsl8kcscj`) ship with production defaults, so scanners should detect analytics after deploy without extra Vercel env vars.

## Email auth (DMARC)

SPF alone is not enough for deliverability scores. At the DNS zone for the sending domain, add a DMARC TXT record, e.g.:

```dns
_dmarc.linkedinpost.ai.  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@linkedinpost.ai"
```

Tighten `p=` (quarantine/reject) after reports look healthy.
