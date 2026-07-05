import { FAQS, PLANS } from "@/lib/marketing-data";
import { ICON_PATHS } from "@/lib/icon-paths";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  socialProfileUrls,
} from "@/lib/site";

const IN_STOCK = "https://schema.org/InStock";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  const siteUrl = getSiteUrl().origin;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: siteUrl,
        logo: `${siteUrl}${ICON_PATHS.markVioletPng}`,
        description: SITE_DESCRIPTION,
        sameAs: socialProfileUrls(),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: `${siteUrl}/contact`,
        },
      }}
    />
  );
}

export function WebSiteJsonLd() {
  const siteUrl = getSiteUrl().origin;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl,
        description: SITE_DESCRIPTION,
        publisher: { "@type": "Organization", name: SITE_NAME },
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  const siteUrl = getSiteUrl().origin;
  const offers = PLANS.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.monthlyUsd.toFixed(2),
    priceCurrency: "USD",
    availability: IN_STOCK,
    url: `${siteUrl}/pricing`,
    description: plan.blurb,
  }));

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: siteUrl,
        image: `${siteUrl}${ICON_PATHS.ogImage}`,
        description: SITE_DESCRIPTION,
        offers,
      }}
    />
  );
}

export function PricingOfferCatalogJsonLd() {
  const siteUrl = getSiteUrl().origin;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "OfferCatalog",
        name: `${SITE_NAME} plans`,
        url: `${siteUrl}/pricing`,
        itemListElement: PLANS.map((plan, index) => ({
          "@type": "Offer",
          position: index + 1,
          name: plan.name,
          price: plan.monthlyUsd.toFixed(2),
          priceCurrency: "USD",
          availability: IN_STOCK,
          description: plan.blurb,
          url: `${siteUrl}/sign-up`,
        })),
      }}
    />
  );
}

export function FaqPageJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      }}
    />
  );
}

export function FaqPageJsonLdFromItems({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const base = getSiteUrl().origin;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${base}${item.path}`,
        })),
      }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  path,
  updatedAt,
}: {
  title: string;
  description: string;
  path: string;
  updatedAt: string;
}) {
  const base = getSiteUrl().origin;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        dateModified: updatedAt,
        datePublished: updatedAt,
        image: `${base}${path}/opengraph-image`,
        author: {
          "@type": "Organization",
          name: SITE_NAME,
          url: base,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: {
            "@type": "ImageObject",
            url: `${base}${ICON_PATHS.markVioletPng}`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${base}${path}`,
        },
        isAccessibleForFree: true,
      }}
    />
  );
}
