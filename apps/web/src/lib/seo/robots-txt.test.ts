import { describe, expect, it } from "vitest";
import {
  AI_USER_AGENTS,
  CONTENT_SIGNAL,
  buildRobotsTxt,
} from "@/lib/seo/robots-txt";

describe("buildRobotsTxt", () => {
  it("includes User-agent, Content-Signal, AI bots, and Sitemap", () => {
    const body = buildRobotsTxt({
      origin: "https://linkedinpost.ai",
      indexingAllowed: true,
    });

    expect(body).toContain("User-agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /app/");
    expect(body).toContain(`Content-Signal: ${CONTENT_SIGNAL}`);
    expect(body).toContain("Sitemap: https://linkedinpost.ai/sitemap.xml");

    for (const ua of AI_USER_AGENTS) {
      expect(body).toContain(`User-agent: ${ua}`);
    }
  });

  it("disallows all when indexing is disabled", () => {
    const body = buildRobotsTxt({
      origin: "https://linkedinpost.ai",
      indexingAllowed: false,
    });

    expect(body).toContain("User-agent: *");
    expect(body).toContain("Disallow: /");
    expect(body).not.toContain("Allow: /");
    expect(body).toContain("Sitemap: https://linkedinpost.ai/sitemap.xml");
  });
});
