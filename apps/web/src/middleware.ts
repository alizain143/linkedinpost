import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isAuthBypassEnabled } from "@/lib/auth-bypass";

const isPublicRoute = createRouteMatcher([
  "/",
  "/features",
  "/how-it-works",
  "/pricing",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isAuthBypassEnabled()) return;
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
