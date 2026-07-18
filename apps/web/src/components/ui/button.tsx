import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { ButtonShape, ButtonSize, ButtonVariant } from "@/types";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  href?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
  role?: React.AriaRole;
  "aria-checked"?: boolean;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "data-tour"?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[#4f46e5] text-white shadow-[0_5px_14px_rgba(79,70,229,0.28)] hover:bg-[#4338ca]",
  secondary:
    "border border-[#e3e6ef] bg-white text-[#1e293b] hover:border-[#cbd2e0] hover:bg-[#f6f7fb]",
  outline:
    "border border-[#e3e6ef] bg-white text-[#64748b] font-medium hover:bg-[#f6f7fb]",
  selected:
    "border border-[#4f46e5] bg-[#eef2ff] text-[#4338ca]",
  muted:
    "border border-[#e3e6ef] bg-white text-[#475569] hover:bg-[#f6f7fb]",
  success:
    "border border-transparent bg-[#16a34a] text-white hover:brightness-95",
  destructive:
    "border border-transparent bg-[#dc2626] text-white hover:brightness-[0.94]",
  "destructive-outline":
    "border border-[#fecaca] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]",
  linkedin:
    "border border-transparent bg-[#0a66c2] text-white hover:bg-[#004182]",
  ghost:
    "border border-transparent bg-transparent text-[#64748b] hover:bg-[#f6f7fb] hover:text-[#1e293b]",
  gradient:
    "border border-transparent bg-gradient-to-br from-[#4f46e5] to-[#6d3fe0] text-white shadow-[0_8px_20px_rgba(79,70,229,0.32)] hover:brightness-105",
  segment:
    "border border-transparent bg-transparent text-[#64748b] hover:text-[#1e293b]",
  "segment-active":
    "border border-transparent bg-white text-[#1e293b] shadow-sm",
  filter:
    "border border-[#e3e6ef] bg-white text-[#475569] hover:bg-[#f6f7fb]",
  "filter-active":
    "border border-transparent bg-[#0f172a] text-white",
  "filter-accent":
    "border border-[#ece3ff] bg-[#f5f0ff] text-[#7c3aed]",
  icon:
    "border border-[#e3e6ef] bg-white text-[#475569] hover:bg-[#f6f7fb]",
};

const sizes: Record<ButtonSize, string> = {
  xs: "rounded-[9px] px-3 py-1.5 text-[12.5px]",
  sm: "rounded-[9px] px-3.5 py-2 text-[13px]",
  md: "rounded-[11px] px-4 py-2.5 text-[14px]",
  lg: "rounded-xl px-6 py-3.5 text-[14.5px]",
  auth: "rounded-[11px] px-6 py-[13px] text-[15.5px]",
  modal: "rounded-[11px] px-[11px] py-[11px] text-sm",
  tab: "rounded-full px-4 py-2 text-[13px]",
  icon: "size-8 rounded-lg p-0",
  day: "h-9 w-10 rounded-lg px-0 text-xs",
};

const pillSizes: Partial<Record<ButtonSize, string>> = {
  xs: "px-3 py-1.5 text-[12.5px]",
  sm: "px-3.5 py-2 text-[13px]",
  tab: "px-4 py-2 text-[13px]",
};

export function toggleVariant(active: boolean): ButtonVariant {
  return active ? "selected" : "outline";
}

export function filterVariant(active: boolean, accent = false): ButtonVariant {
  if (active) return "filter-active";
  if (accent) return "filter-accent";
  return "filter";
}

export function segmentVariant(active: boolean): ButtonVariant {
  return active ? "segment-active" : "segment";
}

function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  shape: ButtonShape,
  fullWidth?: boolean,
  className?: string,
) {
  const sizeClass =
    shape === "pill"
      ? cn("rounded-full", pillSizes[size] ?? sizes[size])
      : sizes[size];

  return cn(
    base,
    variants[variant],
    sizeClass,
    fullWidth && "w-full",
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      shape = "default",
      href,
      className,
      children,
      onClick,
      type = "button",
      disabled,
      fullWidth,
      role,
      "aria-checked": ariaChecked,
      "aria-label": ariaLabel,
      "aria-expanded": ariaExpanded,
      "data-tour": dataTour,
    },
    ref,
  ) {
    const classes = buttonClasses(variant, size, shape, fullWidth, className);

    if (href) {
      return (
        <Link href={href} className={classes} data-tour={dataTour}>
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        onClick={onClick}
        disabled={disabled}
        role={role}
        aria-checked={ariaChecked}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        data-tour={dataTour}
      >
        {children}
      </button>
    );
  },
);
