/** Skip Clerk auth in local dev. Set NEXT_PUBLIC_BYPASS_AUTH=false to disable. */
export function isAuthBypassEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_BYPASS_AUTH;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV === "development";
}
