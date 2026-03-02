# Proxy Module

## Purpose
Centralized outbound HTTP integration with policy and config controls.

Files:
- `src/proxy/proxy.module.ts`
- `src/proxy/proxy.service.ts`
- `src/proxy/proxy-config.service.ts`

## Config Source
- `PROXY_SERVICES_JSON` env key
- parsed into in-memory service config map

## Security Defaults
- Base URL override disabled:
  - `PROXY_ALLOW_BASE_URL_OVERRIDE=false`
- Dynamic runtime config disabled:
  - `PROXY_ALLOW_DYNAMIC_CONFIG=false`
- Private/local hosts blocked:
  - `PROXY_ALLOW_PRIVATE_IPS=false`
- Redirects disabled:
  - `PROXY_MAX_REDIRECTS=0`
- Non-http(s) schemes rejected
- URL credentials rejected (`username:password@host`)

## Example `PROXY_SERVICES_JSON`
```json
{
  "billing": {
    "baseUrl": "https://billing.internal",
    "timeoutMs": 30000,
    "endpoints": {
      "createPayment": {
        "targetEndpoint": "/v1/payments",
        "timeoutMs": 10000
      }
    }
  }
}
```

## Best Practice
- Keep proxy config static via env.
- Avoid enabling dynamic config in production.
- Keep private IP block enabled unless required and reviewed.
