export const MARKETING_NAV = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Guides", href: "/guides" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
] as const;

export const FOOTER_PRODUCT = [
  { label: "How it works", href: "/how-it-works" },
  { label: "All features", href: "/features" },
  { label: "Guides", href: "/guides" },
  { label: "Plans & pricing", href: "/pricing" },
  { label: "Start free", href: "/sign-up" },
];

export const FOOTER_COMPANY = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_LEGAL = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export const APP_NAV = [
  { id: "dashboard", href: "/app/dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "generate", href: "/app/generate", icon: "auto_awesome", label: "Generate" },
  { id: "autopilot", href: "/app/autopilot", icon: "auto_mode", label: "Autopilot" },
  { id: "pipeline", href: "/app/pipeline", icon: "account_tree", label: "Pipeline" },
  { id: "calendar", href: "/app/calendar", icon: "calendar_month", label: "Calendar" },
  { id: "approvals", href: "/app/approvals", icon: "fact_check", label: "Approvals" },
  { id: "clients", href: "/app/clients", icon: "groups", label: "Clients" },
  { id: "templates", href: "/app/templates", icon: "dashboard_customize", label: "Templates" },
  { id: "profile", href: "/app/profile", icon: "badge", label: "Profile" },
  { id: "billing", href: "/app/billing", icon: "credit_card", label: "Billing" },
  { id: "settings", href: "/app/settings", icon: "settings", label: "Settings" },
] as const;
