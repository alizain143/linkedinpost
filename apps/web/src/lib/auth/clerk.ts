export function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: Array<{ message?: string }> }).errors;
    if (errors?.[0]?.message) return errors[0].message;
  }
  return "Something went wrong. Please try again.";
}

export function needsEmailSecondFactor(status: string | null) {
  return status === "needs_client_trust" || status === "needs_second_factor";
}
