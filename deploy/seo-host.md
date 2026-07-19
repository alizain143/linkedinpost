# SEO host & redirects (linkedinpost.ai)

Canonical URLs, sitemap, and `NEXT_PUBLIC_SITE_URL` all use the **apex** host:

`https://linkedinpost.ai`

PageSpeed’s “Avoid multiple page redirects” fires when the edge does a **two-hop** chain, e.g.:

`http://linkedinpost.ai` → `https://linkedinpost.ai` → `https://www.linkedinpost.ai`

That also conflicts with the sitemap (apex) if `www` is the final host.

## Preferred Cloudflare setup

In Cloudflare → **Rules** → **Redirect Rules**, use **one** rule that lands on HTTPS apex in a **single** hop:

| If (OR) | Then |
|---------|------|
| Hostname equals `www.linkedinpost.ai` | Dynamic redirect to `https://linkedinpost.ai${uri.path}${uri.query}` · 301 |
| Hostname equals `linkedinpost.ai` **and** scheme equals `http` | Same destination · 301 |

Also:

1. Vercel project → Domains: set **linkedinpost.ai** as the primary domain (not `www`).
2. Remove any older Page Rule / Bulk Redirect that sends apex → `www` (that causes the second hop and fights the sitemap).
3. Keep “Always Use HTTPS” only if it does **not** create an extra hop before the rule above; prefer folding HTTP→HTTPS into the same redirect rule.

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
