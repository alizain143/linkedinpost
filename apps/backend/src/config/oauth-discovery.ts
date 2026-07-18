import { primaryFrontendUrl } from './frontend-url';

const DEFAULT_PROD_API = 'https://api.linkedinpost.ai';
const DEFAULT_DEV_API = 'http://localhost:3001';

/** Public API origin used as OAuth resource identifier (no /v1). */
export function apiResourceOrigin(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const raw =
    env.PUBLIC_API_URL?.trim() ||
    env.API_PUBLIC_URL?.trim() ||
    env.API_URL?.trim() ||
    '';

  if (raw) {
    try {
      const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
      return url.origin;
    } catch {
      /* fall through */
    }
  }

  return env.NODE_ENV === 'production' ? DEFAULT_PROD_API : DEFAULT_DEV_API;
}

/** RFC 9728 Protected Resource Metadata for the Nest API. */
export function buildOauthProtectedResourceMetadata(
  env: NodeJS.ProcessEnv = process.env,
) {
  const frontend = primaryFrontendUrl(env.FRONTEND_URL).replace(/\/$/, '');
  const resource = apiResourceOrigin(env);

  return {
    resource,
    authorization_servers: [frontend],
    bearer_methods_supported: ['header'],
    scopes_supported: ['openid', 'profile', 'email'],
    resource_documentation: `${frontend}/auth.md`,
  };
}
