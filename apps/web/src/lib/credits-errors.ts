import { ApiError } from "@/lib/api/client";

export function isCreditsExhaustedError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "CREDITS_EXHAUSTED";
}
