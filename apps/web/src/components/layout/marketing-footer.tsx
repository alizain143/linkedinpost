import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  FOOTER_COMPANY,
  FOOTER_LEGAL,
  FOOTER_PRODUCT,
} from "@/lib/constants";
import { FOOTER_SOCIAL } from "@/lib/site";

const socialIconClass =
  "flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-white/[0.08] transition-colors hover:bg-white/16";

export function Footer() {
  return (
    <footer className="border-t border-[#eceef3] bg-[#0d1326] text-white">
      <div className="mx-auto max-w-[1180px] px-7 pb-[30px] pt-[54px]">
        <div className="pp-foot">
          <div>
            <Link href="/" className="mb-3.5 flex items-center gap-2.5">
              <LogoMark size={32} className="rounded-[9px]" />
              <span className="font-newsreader text-[19px] font-semibold tracking-tight text-white">
                linkedinpost<span className="text-[#c9b8ff]">.ai</span>
              </span>
            </Link>
            <p className="mb-4 max-w-[300px] text-[13.5px] leading-relaxed text-[#9aa6be]">
              The AI LinkedIn content engine for founders, creators, and teams
              who want to post consistently without sounding like a robot.
            </p>
            <div className="flex gap-2.5">
              {FOOTER_SOCIAL.map((item) =>
                item.external ? (
                  <a
                    key={item.icon}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.label}
                    aria-label={item.label}
                    className={socialIconClass}
                  >
                    <MsIcon name={item.icon} size={18} className="text-[#cdd5e6]" />
                  </a>
                ) : (
                  <Link
                    key={item.icon}
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    className={socialIconClass}
                  >
                    <MsIcon name={item.icon} size={18} className="text-[#cdd5e6]" />
                  </Link>
                ),
              )}
            </div>
          </div>

          <div>
            <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.06em] text-[#6c79a3]">
              Product
            </div>
            <div className="flex flex-col gap-[11px]">
              {FOOTER_PRODUCT.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-[#cdd5e6] transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.06em] text-[#6c79a3]">
              Company
            </div>
            <div className="flex flex-col gap-[11px]">
              {FOOTER_COMPANY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-[#cdd5e6] transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/features"
                className="text-sm text-[#cdd5e6] transition-colors hover:text-white"
              >
                Use cases
              </Link>
              <Link
                href="/sign-in"
                className="text-sm text-[#cdd5e6] transition-colors hover:text-white"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-3.5 text-xs font-bold uppercase tracking-[0.06em] text-[#6c79a3]">
              Legal
            </div>
            <div className="flex flex-col gap-[11px]">
              {FOOTER_LEGAL.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-[#cdd5e6] transition-colors hover:text-white"
                >
                  {item.label === "Privacy" ? "Privacy Policy" : "Terms & Conditions"}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.09] pt-[22px]">
          <div className="text-[13px] text-[#6c79a3]">
            © 2026 linkedinpost.ai · All rights reserved.
          </div>
          <div className="text-[13px] text-[#6c79a3]">
            Not affiliated with or endorsed by LinkedIn Corporation.
          </div>
        </div>
      </div>
    </footer>
  );
}
