import { describe, expect, it } from "vitest";
import {
  buildPageMarkdown,
  prefersMarkdown,
} from "@/lib/agent/markdown-pages";

describe("prefersMarkdown", () => {
  it("returns true when text/markdown is preferred", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown, text/html;q=0.9")).toBe(true);
  });

  it("returns false when html is preferred or markdown absent", () => {
    expect(prefersMarkdown("text/html")).toBe(false);
    expect(prefersMarkdown("text/html, text/markdown;q=0.8")).toBe(false);
    expect(prefersMarkdown(null)).toBe(false);
  });
});

describe("buildPageMarkdown", () => {
  it("builds home and faq markdown", () => {
    const home = buildPageMarkdown("/");
    expect(home).toContain("linkedinpost.ai");
    expect(home).toContain("Pricing");

    const faq = buildPageMarkdown("/faq");
    expect(faq).toContain("FAQ");
    expect(faq).toContain("credit");
  });
});
