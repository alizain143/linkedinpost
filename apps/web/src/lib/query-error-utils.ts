export function toQueryError(error: unknown): Error | null {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string" && error.trim()) {
    return new Error(error);
  }

  return error ? new Error("Something went wrong. Try again.") : null;
}
