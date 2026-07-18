# DNS for AI Discovery (DNS-AID)

Ops checklist so agents can discover linkedinpost.ai via DNS (draft-mozleywilliams-dnsop-dnsaid / RFC 9460 SVCB/HTTPS).

Application code cannot make this check pass — records must exist in the public DNS zone and ideally be signed with **DNSSEC**.

**Provider for this domain:** Cloudflare (`george.ns.cloudflare.com` / `mira.ns.cloudflare.com`).

## Cloudflare dashboard (do this once)

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → zone **linkedinpost.ai** → **DNS** → **Records**.
2. **Add record**:
   - Type: `HTTPS` (if missing in UI, use API below or Type `SVCB`)
   - Name: `_index._agents`
   - Priority: `1`
   - Target: `linkedinpost.ai`
   - Value / SvcParams: `alpn="h2,h3" port=443`
   - Proxy status: **DNS only** (grey cloud)
3. Optional second record:
   - Name: `_a2a._agents`
   - Target: `api.linkedinpost.ai`
   - SvcParams: `alpn="h2" port=443`
4. **DNSSEC**: DNS → Settings → enable **DNSSEC** (and add DS at the registrar if Cloudflare asks).

### Cloudflare API alternative

```bash
# Requires a token with Zone.DNS Edit for linkedinpost.ai
export CF_API_TOKEN=...
export ZONE_ID=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=linkedinpost.ai" | jq -r '.result[0].id')

curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "HTTPS",
    "name": "_index._agents.linkedinpost.ai",
    "data": {
      "priority": 1,
      "target": "linkedinpost.ai",
      "value": "alpn=\"h2,h3\" port=443"
    }
  }' | jq .
```

If your Cloudflare plan/UI rejects `HTTPS` type, create an equivalent `SVCB` record with the same name/target/params.

## Target names

| Name | Purpose |
|------|---------|
| `_index._agents.linkedinpost.ai` | Index / general agent discovery |
| `_a2a._agents.linkedinpost.ai` | Optional API agent pointer |

## Example zone file form

```dns
_index._agents.linkedinpost.ai. 3600 IN HTTPS 1 linkedinpost.ai. alpn="h2,h3" port=443
_a2a._agents.linkedinpost.ai. 3600 IN HTTPS 1 api.linkedinpost.ai. alpn="h2" port=443
```

## Verify

```bash
curl -sG 'https://cloudflare-dns.com/dns-query' \
  --data-urlencode 'name=_index._agents.linkedinpost.ai' \
  --data-urlencode 'type=HTTPS' \
  -H 'accept: application/dns-json' | jq .

dig HTTPS _index._agents.linkedinpost.ai +dnssec @1.1.1.1
```

Then re-scan:

```bash
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'content-type: application/json' \
  -d '{"url":"https://linkedinpost.ai"}' | jq '.checks.discoverability.dnsAid'
```

## Related app discovery (already live on the web app)

- `https://linkedinpost.ai/llms.txt`
- `https://linkedinpost.ai/.well-known/api-catalog`
- `https://linkedinpost.ai/.well-known/mcp/server-card.json`
- `https://linkedinpost.ai/auth.md`
