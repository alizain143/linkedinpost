export type NavVariant = "landing" | "subpage" | "legal" | "hidden";
export type FooterVariant = "full" | "minimal";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "selected"
  | "muted"
  | "success"
  | "destructive"
  | "destructive-outline"
  | "linkedin"
  | "ghost"
  | "gradient"
  | "segment"
  | "segment-active"
  | "filter"
  | "filter-active"
  | "filter-accent"
  | "icon";

export type ButtonSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "auth"
  | "modal"
  | "tab"
  | "icon"
  | "day";

export type ButtonShape = "default" | "pill";

export type AppNavItem = {
  id: string;
  href: string;
  icon: string;
  label: string;
  badge?: string;
};

export type MarketingNavItem = {
  label: string;
  href: string;
};
