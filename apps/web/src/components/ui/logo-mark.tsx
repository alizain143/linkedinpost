import { SvgIcon } from "@/components/ui/svg-icon";
import { ICON_PATHS } from "@/lib/icon-paths";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 34, className }: LogoMarkProps) {
  const iconSize = Math.round(size * 0.56);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] bg-[#5B3DF5] shadow-[0_4px_12px_rgba(91,61,245,0.32)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <SvgIcon src={ICON_PATHS.logoMarkSymbol} size={iconSize} />
    </div>
  );
}
