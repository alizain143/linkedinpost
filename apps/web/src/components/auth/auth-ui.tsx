"use client";

import Link from "next/link";
import { InputField } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const authLabelClass =
  "mb-[7px] block text-[12.5px] font-semibold text-[#475569]";

export const authSocialBtnClass =
  "flex w-full items-center justify-center rounded-[11px] border border-[#e3e6ef] bg-white px-4 py-[11px] text-sm font-semibold text-[#1e293b] transition-colors hover:bg-[#f6f7fb] disabled:cursor-not-allowed disabled:opacity-60";

/** Centered row: fixed width so icons line up in a column across all OAuth buttons. */
export const authSocialBtnInnerClass =
  "inline-flex w-[214px] items-center gap-2.5";

export const authSocialIconSlotClass =
  "flex size-[18px] shrink-0 items-center justify-center";

export function AuthDivider() {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#eceef3]" />
      <span className="text-xs text-[#94a3b8]">or</span>
      <div className="h-px flex-1 bg-[#eceef3]" />
    </div>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-[11px] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}

type AuthFieldProps = {
  label: string;
  icon: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

export function AuthField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: AuthFieldProps) {
  return (
    <InputField
      label={label}
      icon={icon}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
      fieldClassName="mb-4"
      variant="auth-icon"
    />
  );
}

export function AuthHeading({
  title,
  subtitle,
  center,
}: {
  title: string;
  subtitle: string;
  center?: boolean;
}) {
  return (
    <div className={cn(center && "text-center")}>
      <h1 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
        {title}
      </h1>
      <p className="mt-1.5 mb-[26px] text-[14.5px] leading-[1.55] text-[#64748b]">
        {subtitle}
      </p>
    </div>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className="mt-[22px] text-center text-sm text-[#64748b]">
      {text}{" "}
      <Link href={href} className="font-semibold text-[#4f46e5] hover:text-[#4338ca]">
        {linkText}
      </Link>
    </p>
  );
}
