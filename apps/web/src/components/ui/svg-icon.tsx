import { cn } from "@/lib/utils";

type SvgIconProps = {
  src: string;
  size?: number;
  className?: string;
  /** Accessible label. Empty string marks the image as decorative. */
  alt?: string;
  /** Tint the icon with the current text color (for monochrome SVGs). */
  inheritColor?: boolean;
};

export function SvgIcon({
  src,
  size = 18,
  className,
  alt = "",
  inheritColor = false,
}: SvgIconProps) {
  if (inheritColor) {
    return (
      <span
        aria-hidden
        className={cn("inline-block shrink-0 bg-current", className)}
        style={{
          width: size,
          height: size,
          maskImage: `url(${src})`,
          WebkitMaskImage: `url(${src})`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
    );
  }

  const decorative = alt === "";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={decorative || undefined}
      className={cn("block shrink-0", className)}
    />
  );
}
