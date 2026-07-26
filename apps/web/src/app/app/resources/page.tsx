import Link from "next/link";
import { OFFER_BONUSES } from "@/lib/offer-bonuses";
import { OFFER_RESOURCES } from "@/lib/offer-resources";

export default function ResourcesHubPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-[#0f172a]">
          Plan resources
        </h1>
        <p className="mt-2 text-[15px] leading-[1.6] text-[#64748b]">
          Bonuses included with Pro and Agency. Guides open on the marketing
          site; Agency checklists live in-app.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Pro + Agency</h2>
        <ul className="space-y-3">
          {OFFER_BONUSES.filter((b) => b.plans.includes("pro")).map((bonus) => (
            <li
              key={bonus.id}
              className="rounded-2xl border border-[#eceef4] bg-white px-5 py-4"
            >
              <Link
                href={bonus.href}
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                {bonus.title}
              </Link>
              <p className="mt-1 text-sm text-[#64748b]">{bonus.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Agency only</h2>
        <ul className="space-y-3">
          {OFFER_RESOURCES.map((resource) => (
            <li
              key={resource.slug}
              className="rounded-2xl border border-[#eceef4] bg-white px-5 py-4"
            >
              <Link
                href={`/app/resources/${resource.slug}`}
                className="font-semibold text-[#4f46e5] hover:underline"
              >
                {resource.title}
              </Link>
              <p className="mt-1 text-sm text-[#64748b]">
                {resource.description}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
