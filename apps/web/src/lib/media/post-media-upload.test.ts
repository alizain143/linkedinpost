import { describe, expect, it } from "vitest";
import {
  validatePostMediaFile,
  validatePostMediaFiles,
} from "@/lib/media/post-media-upload";

function file(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe("validatePostMediaFiles", () => {
  it("accepts jpeg and png within limits", () => {
    expect(
      validatePostMediaFiles([
        file("a.png", "image/png", 100),
        file("b.jpg", "image/jpeg", 200),
      ]),
    ).toBeNull();
  });

  it("rejects webp", () => {
    expect(validatePostMediaFile(file("x.webp", "image/webp", 100))).toMatch(
      /JPEG or PNG/,
    );
  });

  it("rejects empty selection", () => {
    expect(validatePostMediaFiles([])).toMatch(/at least one/i);
  });

  it("rejects more than 10 files", () => {
    const files = Array.from({ length: 11 }, (_, i) =>
      file(`${i}.png`, "image/png", 10),
    );
    expect(validatePostMediaFiles(files)).toMatch(/up to 10/i);
  });
});
