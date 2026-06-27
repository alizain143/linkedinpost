import { cn } from "@/lib/utils";
import { materialIconPath } from "@/lib/icon-paths";
import { SvgIcon } from "./svg-icon";

type MsIconProps = {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
};

export function MsIcon({ name, className, size = 20, style }: MsIconProps) {
  return (
    <span
      className={cn("inline-flex shrink-0 text-current", className)}
      style={style}
      aria-hidden
    >
      <SvgIcon src={materialIconPath(name)} size={size} inheritColor />
    </span>
  );
}
