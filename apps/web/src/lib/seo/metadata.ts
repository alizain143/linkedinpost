import type { Metadata } from "next";
import {
  APPLE_ICON_PATH,
  FAVICON_PATHS,
  OG_IMAGE_PATH,
} from "@/lib/brand";
import {
  getSiteUrl,
  isIndexingAllowed,
  OG_IMAGE_ALT,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  THEME_COLOR,
  TWITTER_HANDLE,
} from "@/lib/site";

const INDEX_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
};

function defaultOpenGraph(
  title: string,
  description: string,
  imagePath: string = OG_IMAGE_PATH,
  imageAlt: string = OG_IMAGE_ALT,
): Metadata["openGraph"] {
  return {
    type: "website",
    siteName: SITE_NAME,
    title,
    description,
    locale: "en_US",
    images: [
      {
        url: imagePath,
        width: 1200,
        height: 630,
        alt: imageAlt,
      },
    ],
  };
}

function defaultTwitter(
  title: string,
  description: string,
  imagePath: string = OG_IMAGE_PATH,
  imageAlt: string = OG_IMAGE_ALT,
): Metadata["twitter"] {
  return {
    card: "summary_large_image",
    title,
    description,
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    images: [{ url: imagePath, alt: imageAlt }],
  };
}

type PageMetaInput = {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
  openGraphImage?: string;
  openGraphImageAlt?: string;
};

export function pageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  noIndex,
  openGraphImage,
  openGraphImageAlt,
}: PageMetaInput): Metadata {
  const shouldIndex = isIndexingAllowed() && !noIndex;
  const ogImage = openGraphImage ?? "/opengraph-image";
  const ogAlt = openGraphImageAlt ?? title;

  return {
    title,
    description,
    keywords: SITE_KEYWORDS,
    alternates: { canonical: path },
    openGraph: {
      ...defaultOpenGraph(title, description, ogImage, ogAlt),
      url: path,
    },
    twitter: defaultTwitter(title, description, ogImage, ogAlt),
    robots: shouldIndex ? INDEX_ROBOTS : NOINDEX_ROBOTS,
  };
}

export function rootMetadata(): Metadata {
  const shouldIndex = isIndexingAllowed();

  return {
    metadataBase: getSiteUrl(),
    title: {
      default: SITE_TITLE_DEFAULT,
      template: "%s | linkedinpost.ai",
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    authors: [{ name: SITE_NAME }],
    applicationName: SITE_NAME,
    alternates: { canonical: "/" },
    icons: {
      icon: [
        { url: FAVICON_PATHS.svg, type: "image/svg+xml" },
        { url: FAVICON_PATHS.png16, sizes: "16x16", type: "image/png" },
        { url: FAVICON_PATHS.png32, sizes: "32x32", type: "image/png" },
        { url: FAVICON_PATHS.png48, sizes: "48x48", type: "image/png" },
      ],
      apple: [{ url: APPLE_ICON_PATH, sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      ...defaultOpenGraph(SITE_TITLE_DEFAULT, SITE_DESCRIPTION, "/opengraph-image"),
      url: "/",
    },
    twitter: defaultTwitter(SITE_TITLE_DEFAULT, SITE_DESCRIPTION, "/opengraph-image"),
    robots: shouldIndex ? INDEX_ROBOTS : NOINDEX_ROBOTS,
    other: {
      "theme-color": THEME_COLOR,
      "msvalidate.01": "2C8E26688610C5D46C0B63DBFBEDF6F0",
      "google-site-verification": "q83s8dhRToFViAHym6yOTiLPRBaUhLza6FD1jUY63Oo",
    },
  };
}
