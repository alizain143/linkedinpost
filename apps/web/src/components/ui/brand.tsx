import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

type BrandProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md";
  showWordmark?: boolean;
  light?: boolean;
};

export function Brand({
  href = "/",
  className,
  size = "md",
  showWordmark = true,
  light = false,
}: BrandProps) {
  const markSize = size === "sm" ? 28 : 34;
  const textSize = size === "sm" ? "text-base" : "text-[20px]";

  const inner = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} className={size === "md" ? "rounded-[10px]" : "rounded-lg"} />
      {showWordmark ? (
        <span
          className={cn(
            "font-newsreader font-semibold tracking-[-0.01em]",
            textSize,
            light ? "text-white" : "text-[#1b1726]",
          )}
        >
          linkedinpost
          <span className={light ? "text-[#c9b8ff]" : "text-[#5B3DF5]"}>
            .ai
          </span>
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {inner}
      </Link>
    );
  }

  return inner;
}
