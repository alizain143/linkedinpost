import { apiBaseUrl } from "@/lib/api/client-core";

/** API host origin (no `/v1` suffix) for discovery docs and catalogs. */
export function getApiOrigin(): string {
  const base = apiBaseUrl();
  try {
    const url = new URL(base.endsWith("/") ? base.slice(0, -1) : base);
    if (url.pathname === "/v1" || url.pathname.endsWith("/v1")) {
      url.pathname = "/";
    }
    // Normalize trailing slash off pathname root
    return url.origin;
  } catch {
    return base.replace(/\/v1\/?$/, "") || base;
  }
}

export function getApiDocsUrl(): string {
  return `${getApiOrigin()}/docs`;
}

export function getApiOpenApiUrl(): string {
  return `${getApiOrigin()}/docs/json`;
}

export function getApiHealthUrl(): string {
  return `${getApiOrigin()}/v1/health`;
}
