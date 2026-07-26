import Link from "next/link";
import { notFound } from "next/navigation";
import { MsIcon } from "@/components/ui/ms-icon";
import { getOfferResource, OFFER_RESOURCES } from "@/lib/offer-resources";

type ResourcePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return OFFER_RESOURCES.map((resource) => ({ slug: resource.slug }));
}

export default async function OfferResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const resource = getOfferResource(slug);
  if (!resource) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/app/resources"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#4f46e5] hover:underline"
        >
          <MsIcon name="arrow_back" size={16} />
          All resources
        </Link>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.02em] text-[#0f172a]">
          {resource.title}
        </h1>
        <p className="mt-2 text-[15px] leading-[1.6] text-[#64748b]">
          {resource.description}
        </p>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.06em] text-[#6366f1]">
          Agency bonus
        </p>
      </div>
      <ol className="space-y-4">
        {resource.steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl border border-[#eceef4] bg-white px-5 py-4"
          >
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-[#94a3b8]">
              Step {index + 1}
            </div>
            <h2 className="mt-1 font-display text-lg font-bold text-[#0f172a]">
              {step.title}
            </h2>
            <p className="mt-1.5 text-sm leading-[1.6] text-[#64748b]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
