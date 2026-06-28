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
  // #region agent log
  fetch("http://127.0.0.1:7936/ingest/839fd5aa-975f-4d2f-afc3-4e50b695a8d5", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "c80d58",
    },
    body: JSON.stringify({
      sessionId: "c80d58",
      location: "client-core.ts:parseApiResponse",
      message: "API error response",
      data: {
        status: response.status,
        statusText: response.statusText,
        code: body.code ?? null,
        error: body.error ?? null,
        payloadKeys: Object.keys(payload as object),
      },
      timestamp: Date.now(),
      hypothesisId: "D",
    }),
  }).catch(() => {});
  // #endregion
  throw new ApiError(
    body.code ?? "API_ERROR",
    body.error ?? "Request failed",
  );
}

export function authHeaders(token: string | null | undefined): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
