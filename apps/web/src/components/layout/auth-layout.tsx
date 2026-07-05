import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";

const BENEFITS = [
  "Generate posts in your real voice",
  "Plan a full month in minutes",
  "5 free posts, no credit card",
];

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="pp-auth-brand relative hidden w-[44%] shrink-0 flex-col overflow-hidden bg-[linear-gradient(160deg,#1e1b4b,#312e81_55%,#4338ca)] p-11 text-white lg:flex">
        <div className="pointer-events-none absolute -right-[10%] -top-[15%] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-[20%] -left-[12%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(103,232,249,0.16),transparent_70%)]" />
        <Brand href="/" light className="relative [&_div]:bg-white/16" />
        <div className="relative mt-auto">
          <h2 className="mb-6 font-display text-[30px] font-extrabold leading-[1.18] tracking-[-0.02em]">
            Your LinkedIn content, handled.
          </h2>
          <div className="mb-[34px] flex flex-col gap-3.5">
            {BENEFITS.map((b) => (
              <div
                key={b}
                className="flex items-center gap-[11px] text-[15px] text-white/90"
              >
                <MsIcon name="check_circle" size={21} className="text-[#5eead4]" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-7 py-[22px]">
          <div className="pp-auth-logo hidden">
            <Brand href="/" size="sm" />
          </div>
          <Button href="/" variant="muted" size="sm" className="ml-auto text-[13.5px]">
            <MsIcon name="arrow_back" size={17} />
            Back to home
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center px-7 pb-12 pt-5">
          <div className="w-full max-w-[404px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
