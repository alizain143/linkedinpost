import Link from "next/link";
import { MsIcon } from "@/components/ui/ms-icon";
import { COMPARE_ROWS } from "@/lib/marketing-data";
import type { PlanTier } from "@/lib/marketing-data";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  kicker: string;
  title: string;
  description?: string;
  dark?: boolean;
  className?: string;
  titleSize?: "lg" | "md";
};

export function SectionHeader({
  kicker,
  title,
  description,
  dark,
  className,
  titleSize = "lg",
}: SectionHeaderProps) {
  return (
    <div className={cn("text-center", className)}>
      <div
        className={cn(
          "mb-3 text-[13px] font-bold uppercase tracking-[0.06em]",
          dark ? "text-[#a5b4fc]" : "text-[#6366f1]",
        )}
      >
        {kicker}
      </div>
      <h2
        className={cn(
          "font-display font-extrabold leading-[1.12] tracking-[-0.025em]",
          titleSize === "lg" ? "text-[38px]" : "text-[36px]",
          dark ? "text-white" : "text-[#0f172a]",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mx-auto mt-4 max-w-xl text-[17px] leading-[1.55]",
            dark ? "text-[#9aa6be]" : "text-[#5a667a]",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

type PlanCardProps = PlanTier & { ctaHref?: string };

export function PlanCard({
  name,
  price,
  blurb,
  cta,
  features,
  popular,
  style: s,
  ctaHref = "/sign-up",
}: PlanCardProps) {
  return (
    <div
      className="relative rounded-[18px] px-[22px] py-[26px]"
      style={{
        background: s.cardBg,
        border: s.cardBorder,
        boxShadow: s.cardShadow,
      }}
    >
      {popular ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-[13px] py-[5px] text-[11px] font-bold tracking-[0.02em] text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
          MOST POPULAR
        </div>
      ) : null}
      <div
        className="mb-1 font-display text-base font-bold"
        style={{ color: s.nameColor }}
      >
        {name}
      </div>
      <div className="mb-[5px] flex items-baseline gap-[3px]">
        <span
          className="font-display text-[38px] font-extrabold tracking-[-0.03em]"
          style={{ color: s.priceColor }}
        >
          {price}
        </span>
        <span className="text-sm font-medium" style={{ color: s.muted }}>
          /month
        </span>
      </div>
      <p
        className="mb-[18px] min-h-9 text-[13px] leading-[1.5]"
        style={{ color: s.muted }}
      >
        {blurb}
      </p>
      <Link
        href={ctaHref}
        className="mb-5 flex w-full items-center justify-center rounded-[10px] py-[11px] text-sm font-semibold transition-colors hover:opacity-90"
        style={{
          background: s.btnBg,
          border: s.btnBorder,
          color: s.btnColor,
        }}
      >
        {cta}
      </Link>
      <div className="flex flex-col gap-[11px]">
        {features.map((feat) => (
          <div
            key={feat}
            className="flex items-start gap-[9px] text-[13.5px] leading-[1.4]"
            style={{ color: s.featColor }}
          >
            <MsIcon
              name="check"
              size={17}
              className="mt-0.5 shrink-0"
              style={{ color: s.check }}
            />
            {feat}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompareTable() {
  return (
    <div className="pp-cmp overflow-hidden rounded-[18px] border border-[#eceef4] bg-white">
      <div className="pp-cmp-inner">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] border-b border-[#f1f3f8] bg-[#fbfbfd] px-[22px] py-4">
          <div className="text-[12.5px] font-bold text-[#64748b]">Feature</div>
          <div className="text-center text-[12.5px] font-bold text-[#64748b]">
            Free
          </div>
          <div className="text-center text-[12.5px] font-bold text-[#64748b]">
            Starter
          </div>
          <div className="text-center text-[12.5px] font-bold text-[#4f46e5]">
            Pro
          </div>
          <div className="text-center text-[12.5px] font-bold text-[#64748b]">
            Agency
          </div>
        </div>
        {COMPARE_ROWS.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] items-center border-b border-[#f6f7fb] px-[22px] py-3.5 last:border-0"
          >
            <div className="text-[13.5px] font-medium text-[#1e293b]">
              {row.label}
            </div>
            {(["free", "starter", "pro", "agency"] as const).map((tier) => {
              const val = row[tier];
              return (
                <div key={tier} className="text-center">
                  {val === true ? (
                    <MsIcon
                      name="check_circle"
                      size={19}
                      className="inline text-[#16a34a]"
                    />
                  ) : val === false ? (
                    <span className="text-[13.5px] font-semibold text-[#cbd2e0]">
                      —
                    </span>
                  ) : (
                    <span className="text-[13.5px] font-semibold text-[#1e293b]">
                      {val}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
