# DNS for AI Discovery (DNS-AID)

Ops checklist so agents can discover linkedinpost.ai via DNS (draft-mozleywilliams-dnsop-dnsaid / RFC 9460 SVCB/HTTPS).

Application code cannot make this check pass — records must exist in the public DNS zone and ideally be signed with **DNSSEC**.

## Target names

Replace `linkedinpost.ai` if you use a different apex.

| Name | Purpose |
|------|---------|
| `_index._agents.linkedinpost.ai` | Index / general agent discovery |
| `_a2a._agents.linkedinpost.ai` | Optional A2A-style agent endpoint pointer |

## Example HTTPS / SVCB records

Point discovery at the marketing site (and optionally the API host):

```dns
; General index — HTTPS ServiceMode to the website
_index._agents.linkedinpost.ai. 3600 IN HTTPS 1 linkedinpost.ai. alpn="h2,h3" port=443

; Optional: explicit SVCB alias form
_index._agents.linkedinpost.ai. 3600 IN SVCB 1 linkedinpost.ai. alpn="h2,h3" port=443 mandatory=alpn,port

; Optional API pointer (agents that need the Nest API)
_a2a._agents.linkedinpost.ai. 3600 IN HTTPS 1 api.linkedinpost.ai. alpn="h2" port=443
```

Use your real API hostname (`API_DOMAIN` from deploy config) instead of `api.linkedinpost.ai` if different.

Until IANA registers DNS-AID-specific SvcParamKeys, prefer standard `alpn` / `port` parameters. Experimental keys should use numeric `keyNNNNN` form per the draft.

## DNSSEC

1. Enable DNSSEC at your DNS provider for `linkedinpost.ai`.
2. Publish DS records at the registrar.
3. Confirm validating DoH resolvers return `AD` bit for `_index._agents.linkedinpost.ai`.

## Verify

```bash
# Cloudflare DoH
curl -sG 'https://cloudflare-dns.com/dns-query' \
  --data-urlencode 'name=_index._agents.linkedinpost.ai' \
  --data-urlencode 'type=HTTPS' \
  -H 'accept: application/dns-json' | jq .

# Or
dig HTTPS _index._agents.linkedinpost.ai +dnssec
```

Then re-scan:

```bash
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'content-type: application/json' \
  -d '{"url":"https://linkedinpost.ai"}' | jq '.checks.discoverability.dnsAid'
```

## Related app discovery (already in the web app)

These do **not** replace DNS-AID but help HTTP-based agents:

- `https://linkedinpost.ai/llms.txt`
- `https://linkedinpost.ai/.well-known/api-catalog`
- `https://linkedinpost.ai/.well-known/agent-skills/index.json`
- `https://linkedinpost.ai/auth.md`
