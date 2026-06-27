export function isAppleSignInPlatform(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): boolean {
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isIPadDesktop = platform === "MacIntel" && maxTouchPoints > 1;
  const isMac = /Macintosh|Mac OS X/i.test(userAgent) && !isIPadDesktop;

  return isIOS || isIPadDesktop || isMac;
}
