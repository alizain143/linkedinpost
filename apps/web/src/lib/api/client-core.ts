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
type ApiErrorBody = {
  error?: string;
  code?: string;
  message?: string | string[];
};

function resolveApiErrorMessage(body: ApiErrorBody): string {
  if (typeof body.error === "string" && body.error.trim()) {
    return body.error;
  }
  if (Array.isArray(body.message)) {
    const parts = body.message.filter((m): m is string => typeof m === "string");
    if (parts.length > 0) return parts.join(". ");
  }
  if (typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }
  return "Something went wrong";
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  let payload: ApiEnvelope<T> | ApiErrorBody;
  try {
    payload = (await response.json()) as ApiEnvelope<T> | ApiErrorBody;
  } catch {
    throw new ApiError("API_ERROR", "Something went wrong");
  }

  if (response.ok && "data" in payload && payload.data !== undefined) {
    return payload.data;
  }

  const body = payload as ApiErrorBody;
  throw new ApiError(body.code ?? "API_ERROR", resolveApiErrorMessage(body));
}

export function authHeaders(token: string | null | undefined): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
