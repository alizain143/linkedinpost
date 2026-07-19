import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_IMAGE_ALT, SITE_NAME } from "@/lib/site";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";
export { OG_IMAGE_ALT };

async function logoDataUri(): Promise<string> {
  const logoBuffer = await readFile(
    join(process.cwd(), "public/icons/mark-violet-512.png"),
  );
  return `data:image/png;base64,${logoBuffer.toString("base64")}`;
}

type OgImageInput = {
  headline: string;
  subline?: string;
  eyebrow?: string;
};

export async function renderMarketingOgImage({
  headline,
  subline,
  eyebrow,
}: OgImageInput) {
  const logoSrc = await logoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background:
            "linear-gradient(135deg, #0d1326 0%, #1e1b4b 45%, #312e81 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <img
            src={logoSrc}
            width={72}
            height={72}
            alt={SITE_NAME}
            style={{ borderRadius: 16 }}
          />
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {SITE_NAME}
          </div>
        </div>
        {eyebrow ? (
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#a5b4fc",
              marginBottom: 16,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            maxWidth: 980,
          }}
        >
          {headline}
        </div>
        {subline ? (
          <div
            style={{
              marginTop: 24,
              fontSize: 26,
              lineHeight: 1.4,
              color: "rgba(248, 250, 252, 0.78)",
              maxWidth: 900,
            }}
          >
            {subline}
          </div>
        ) : null}
      </div>
    ),
    { ...OG_IMAGE_SIZE },
  );
}
