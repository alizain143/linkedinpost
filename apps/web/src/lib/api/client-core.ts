export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";
  return url.replace(/\/$/, "");
}

type ApiEnvelope<T> = { data: T };
type ApiErrorBody = { error?: string; code?: string };

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T> | ApiErrorBody;

  if (response.ok && "data" in payload && payload.data !== undefined) {
    return payload.data;
  }

  const body = payload as ApiErrorBody;
  throw new ApiError(
    body.code ?? "API_ERROR",
    body.error ?? "Request failed",
  );
}

export function authHeaders(token: string | null | undefined): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
