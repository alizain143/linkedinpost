import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/features",
  "/how-it-works",
  "/guides(.*)",
  "/pricing",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/llms.txt",
  "/llms-full.txt",
  "/.well-known(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/approve(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
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
