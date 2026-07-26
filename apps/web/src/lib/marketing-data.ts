import {
  bonusLinesForPlan,
  VOICE_GUARANTEE_COPY,
} from "@/lib/offer-bonuses";

export const PROBLEMS = [
  {
    icon: "lightbulb",
    title: "You know you should post, but you don't know what to say.",
    body: "Staring at an empty box kills momentum. Ideas feel obvious in your head but vanish the moment you start typing.",
  },
  {
    icon: "schedule",
    title: "Writing consistently takes too much time.",
    body: "A single good post can eat an hour. Doing it three times a week alongside real work is the first thing to slip.",
  },
  {
    icon: "smart_toy",
    title: "Generic AI posts sound robotic and damage trust.",
    body: 'Clichés like "in today\'s fast-paced world" and hollow hooks. Your audience can smell autopilot, and it costs you credibility.',
  },
] as const;

export const STEPS = [
  {
    num: "01",
    icon: "badge",
    title: "Define your voice",
    body: "Set your role, audience, tone, content pillars, and goals once. Your whole team of agents works from it.",
    detail:
      "Paste a short writing sample, name who you write for, and list phrases you never want in a draft. That profile becomes the constraint every generation runs against, so you are not re-explaining yourself each week.",
  },
  {
    num: "02",
    icon: "groups",
    title: "AI Council writes & reviews",
    body: "A writer agent drafts the post, a reviewer agent scores it, and an editor agent improves it until it's sharp.",
    detail:
      "You get options, not one fragile draft. The reviewer flags weak hooks and generic lines. The editor tightens structure before anything lands in your approval queue.",
  },
  {
    num: "03",
    icon: "image",
    title: "Media is generated & checked",
    body: "The system creates image or carousel media, then reviews it for readability and brand fit.",
    detail:
      "Visuals are optional but useful in a crowded feed. Media review catches unreadable text and off-brand layouts so you are not shipping a pretty image that fails on mobile.",
  },
  {
    num: "04",
    icon: "task_alt",
    title: "Approve, schedule, or publish",
    body: "You approve the final post package, then schedule it or publish to LinkedIn when you are ready.",
    detail:
      "Nothing goes live without your say. Connect LinkedIn, approve the package, then schedule for later or publish now. You stay in control of timing and the final edit.",
  },
] as const;

export const FEATURES = [
  {
    icon: "groups",
    title: "AI Content Council",
    body: "Writer, reviewer, and editor agents collaborate to improve every post before you see it.",
    tint: "#eef2ff",
    color: "#4f46e5",
  },
  {
    icon: "lightbulb",
    title: "Topic Suggestions",
    body: "A free magic button that surfaces post ideas matched to your voice and content pillars.",
    tint: "#fff7ed",
    color: "#ea580c",
  },
  {
    icon: "auto_mode",
    title: "Autopilot Content Engine",
    body: "Automatically prepares upcoming posts from your strategy and posting frequency.",
    tint: "#f5f0ff",
    color: "#7c3aed",
  },
  {
    icon: "image",
    title: "Media Generator",
    body: "Generate images, text cards, or carousels designed for the LinkedIn feed.",
    tint: "#fdf4ff",
    color: "#c026d3",
  },
  {
    icon: "fact_check",
    title: "Media Review",
    body: "AI checks whether each visual is readable, relevant, and brand-safe.",
    tint: "#ecfeff",
    color: "#0891b2",
  },
  {
    icon: "how_to_reg",
    title: "Approval Queue",
    body: "Review every post package before it goes live. Nothing publishes without you.",
    tint: "#fff8eb",
    color: "#d97706",
  },
  {
    icon: "send",
    title: "Schedule & publish",
    body: "After you approve a post, schedule it for later or publish to LinkedIn from the app.",
    tint: "#eef2ff",
    color: "#4f46e5",
  },
  {
    icon: "calendar_month",
    title: "Content Calendar",
    body: "Plan weekly or monthly LinkedIn content across every stage of production.",
    tint: "#ecfeff",
    color: "#0891b2",
  },
  {
    icon: "workspaces",
    title: "Agency Workspaces",
    body: "Manage clients, approvals, and content pipelines from one place.",
    tint: "#f5f0ff",
    color: "#7c3aed",
  },
] as const;

export type PlanStyle = {
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  nameColor: string;
  priceColor: string;
  muted: string;
  featColor: string;
  check: string;
  btnBg: string;
  btnBorder: string;
  btnColor: string;
};

export const STARTER_MONTHLY_USD = 9.99; // grandfathered; not sold on marketing
export const PRO_MONTHLY_USD = 19.99;
export const AGENCY_MONTHLY_USD = 69.99;

/** Prices for all plans including legacy Starter (Billing renewals). */
export const PLAN_MONTHLY_USD: Record<
  "free" | "starter" | "pro" | "agency",
  number
> = {
  free: 0,
  starter: STARTER_MONTHLY_USD,
  pro: PRO_MONTHLY_USD,
  agency: AGENCY_MONTHLY_USD,
};

export type PlanTier = {
  name: string;
  monthlyUsd: number;
  blurb: string;
  cta: string;
  popular?: boolean;
  features: string[];
  style: PlanStyle;
};

const basePlanStyle: PlanStyle = {
  cardBg: "#fff",
  cardBorder: "1px solid #eceef4",
  cardShadow: "0 1px 2px rgba(24,28,64,0.04)",
  nameColor: "#4f46e5",
  priceColor: "#0f172a",
  muted: "#64748b",
  featColor: "#334155",
  check: "#16a34a",
  btnBg: "#fff",
  btnBorder: "1px solid #dfe3ef",
  btnColor: "#1e293b",
};

/** Public ladder: Free / Pro / Agency (Starter hidden from new sales). */
export const PLANS: PlanTier[] = [
  {
    name: "Free",
    monthlyUsd: 0,
    blurb: "Prove it sounds like you. No card required.",
    cta: "Start Free",
    features: [
      "Get your first posts that sound like you",
      "Includes 15 AI credits / month",
      "Full product: drafts, Council, media, calendars, Autopilot",
      "Schedule & publish to LinkedIn",
      "Buy extra credits anytime",
    ],
    style: { ...basePlanStyle },
  },
  {
    name: "Pro",
    monthlyUsd: PRO_MONTHLY_USD,
    blurb: "Never miss a LinkedIn week. Built for solo creators who ship.",
    cta: "Start Pro",
    popular: true,
    features: [
      "Never miss a LinkedIn week (your voice, approved by you)",
      "Includes 200 AI credits / month",
      "Council, media, calendars, Autopilot, schedule & publish",
      ...bonusLinesForPlan("pro"),
      VOICE_GUARANTEE_COPY,
    ],
    style: {
      cardBg: "linear-gradient(170deg,#1e1b4b,#312e81 60%,#4338ca)",
      cardBorder: "1px solid #4f46e5",
      cardShadow: "0 24px 50px -20px rgba(79,70,229,0.5)",
      nameColor: "#fff",
      priceColor: "#fff",
      muted: "rgba(255,255,255,0.72)",
      featColor: "rgba(255,255,255,0.9)",
      check: "#5eead4",
      btnBg: "#fff",
      btnBorder: "none",
      btnColor: "#4338ca",
    },
  },
  {
    name: "Agency",
    monthlyUsd: AGENCY_MONTHLY_USD,
    blurb: "Run clients without mixing voices. Ops for 2-5 LinkedIn brands.",
    cta: "Start Agency",
    features: [
      "Run up to 5 client LinkedIns without voice bleed",
      "Includes 1,000 AI credits / month",
      "Separate LinkedIn + voice per client",
      "Client approval share links",
      ...bonusLinesForPlan("agency"),
      VOICE_GUARANTEE_COPY,
    ],
    style: {
      ...basePlanStyle,
      btnBg: "#0f172a",
      btnBorder: "none",
      btnColor: "#fff",
    },
  },
];

export const FEATURE_DETAIL = [
  {
    kicker: "AI POST GENERATOR",
    title: "Posts that sound like you wrote them",
    body: "Most AI tools produce the same hollow, generic posts. linkedinpost.ai learns your voice from a writing sample, your role, and your audience, then generates three distinct, ready-to-publish options every time.",
    bullets: [
      "Trained on your tone, niche, and past posts",
      "Hook, body, CTA, and hashtags in one pass",
      'A built-in "avoid" list strips out AI clichés',
    ],
    color: "#4f46e5",
    tint: "#eef2ff",
    icon: "auto_awesome",
    img: "AI generator output card",
  },
  {
    kicker: "TOPIC SUGGESTIONS",
    title: "Never start from a blank idea again",
    body: "One click surfaces fresh LinkedIn topics matched to your voice, pillars, and audience: a magic button when you know you should post but do not know what to say.",
    bullets: [
      "Free magic button on Generate, no credits charged",
      "Ideas grounded in your content profile and pillars",
      "Pick a topic and draft in one flow",
    ],
    color: "#ea580c",
    tint: "#fff7ed",
    icon: "lightbulb",
    img: "Topic suggestions picker",
  },
  {
    kicker: "AI CONTENT COUNCIL",
    title: "Writer, reviewer, and editor on every draft",
    body: "One fragile draft is not enough. A writer agent drafts, a reviewer scores hooks and generic lines, and an editor tightens structure before anything reaches your queue.",
    bullets: [
      "Multi-agent pipeline with scored feedback",
      "Council timeline on every post package",
      "Request changes and apply revisions in-app",
    ],
    color: "#4f46e5",
    tint: "#eef2ff",
    icon: "groups",
    img: "AI Council review timeline",
  },
  {
    kicker: "MEDIA GENERATOR & REVIEW",
    title: "Visuals built for the LinkedIn feed",
    body: "Generate images, text cards, or carousels alongside the post, then run media review for readability and brand fit before you approve.",
    bullets: [
      "Images, text cards, and multi-slide carousels",
      "Template library plus freestyle layouts",
      "AI media review for readability and brand safety",
    ],
    color: "#c026d3",
    tint: "#fdf4ff",
    icon: "image",
    img: "Media generator with review scores",
  },
  {
    kicker: "30-DAY CONTENT CALENDAR",
    title: "Never stare at an empty week again",
    body: "Turn scattered ideas into a structured publishing plan. Generate a full month of post themes mapped to your content pillars, then drag, edit, and reschedule in week, month, or list views.",
    bullets: [
      "7-day and 30-day bulk calendar generation",
      "Week, month, and list views",
      "Status tracking from idea to published",
      "Pipeline kanban by production stage",
    ],
    color: "#0891b2",
    tint: "#ecfeff",
    icon: "calendar_month",
    img: "Content calendar month view",
  },
  {
    kicker: "AUTOPILOT CONTENT ENGINE",
    title: "Upcoming posts prepared on a schedule",
    body: "Set frequency and strategy once. Autopilot prepares upcoming post packages from your content profile so your queue stays full without starting from a blank page each week.",
    bullets: [
      "Configurable posting frequency and strategy",
      "Approval mode so nothing goes live unreviewed",
      "Planned posts you can edit before publish",
    ],
    color: "#7c3aed",
    tint: "#f5f0ff",
    icon: "auto_mode",
    img: "Autopilot planned posts",
  },
  {
    kicker: "APPROVE, SCHEDULE & PUBLISH",
    title: "Nothing posts without your say",
    body: "Review every package in the approval queue, then schedule for later or publish to LinkedIn from the app. Failed publishes can be retried without starting over.",
    bullets: [
      "Approval queue with request-changes flow",
      "Schedule for later or publish now",
      "LinkedIn OAuth connection with retry on failure",
      "Client approval share links on Agency",
    ],
    color: "#d97706",
    tint: "#fff8eb",
    icon: "task_alt",
    img: "Approval queue and schedule controls",
  },
  {
    kicker: "VOICE & TONE PRESETS",
    title: "One brand voice, infinite posts",
    body: "Define your voice once in a content profile and reuse it everywhere. Switch tone per post (bold, thoughtful, contrarian) without losing the through-line that makes your writing recognizable.",
    bullets: [
      "Reusable content profiles per brand or client",
      "AI-assisted profile suggestions you approve",
      "Per-post tone and goal controls",
      "Words-to-avoid keeps you on-brand",
    ],
    color: "#7c3aed",
    tint: "#f5f0ff",
    icon: "tune",
    img: "Content profile editor",
  },
  {
    kicker: "AGENCY WORKSPACES",
    title: "Run content for every client in one place",
    body: "Agencies get separate workspaces per client, each with its own profile, drafts, calendar, and LinkedIn connection. Switch context in a click and keep every brand's voice distinct.",
    bullets: [
      "Up to 5 isolated client workspaces",
      "Per-client LinkedIn, profiles, and calendars",
      "Client approval share links",
    ],
    color: "#16a34a",
    tint: "#f0fdf4",
    icon: "groups",
    img: "Agency clients dashboard",
  },
] as const;

export const FAQS = [
  {
    q: "Will my posts sound like generic AI?",
    a: "No. linkedinpost.ai builds a voice profile from your writing sample, role, and audience, and strips out common AI tells with a words-to-avoid list. You get drafts you'd actually publish.",
  },
  {
    q: "Does linkedinpost.ai post to LinkedIn automatically?",
    a: "After you connect LinkedIn and approve a post, you can schedule it or publish it from the app. Nothing posts without your approval. You can still copy a draft to LinkedIn manually if you prefer.",
  },
  {
    q: "What is an AI credit?",
    a: "Credits power AI actions: quick drafts, AI Council, media, calendars, and autopilot. Free includes 15 credits / month, Pro 200, Agency 1,000. You can also buy extra credits anytime.",
  },
  {
    q: "Can I use it for multiple brands or clients?",
    a: "Each workspace connects one LinkedIn account. For multiple brands, the Agency plan adds up to 5 client workspaces, each with its own LinkedIn, profile, calendar, and approval share links.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan includes 15 credits a month with no card required. Upgrade to Pro when LinkedIn is a weekly channel, or Agency when you run multiple clients.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel in one click from the billing page. You keep your paid credit budget until the end of the billing period, then move to the Free plan.",
  },
] as const;

export const VALUES = [
  {
    icon: "fingerprint",
    title: "Authenticity over automation",
    body: "We will never ship a feature that makes you sound like everyone else. Your voice is the product.",
  },
  {
    icon: "bolt",
    title: "Speed with intention",
    body: "Fast is only useful if the output is good. We optimize for posts you'd actually be proud to publish.",
  },
  {
    icon: "shield_lock",
    title: "Your data stays yours",
    body: "We don't train public models on your private drafts. Your content and voice profile are yours alone.",
  },
] as const;

/** Pricing-page FAQs only (kept distinct from global FAQS to avoid duplicate FAQ schema). */
export const PRICING_FAQS = [
  {
    q: "Do I need a credit card to start?",
    a: "No. Free includes 15 credits a month with no card required. Upgrade when you are ready for a weekly channel (Pro) or client workspaces (Agency).",
  },
  {
    q: "What is an AI credit?",
    a: "Credits power drafts, AI Council, media, calendars, and autopilot. Free / Pro / Agency include 15 / 200 / 1,000 credits per month. Extra credits can be purchased anytime.",
  },
  {
    q: "What is the 7-day voice guarantee?",
    a: "On your first Pro or Agency subscription, if you set a content profile, use the product, and drafts still feel generic within 7 days of the first charge, email support@linkedinpost.ai for a full refund of that charge. Credit top-ups alone are not covered.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from billing in one click. You keep your paid credit budget until the end of the billing period, then move to Free.",
  },
  {
    q: "Which plan is right for agencies?",
    a: "Agency is for multi-brand LinkedIn: up to 5 client workspaces, a separate LinkedIn connection per client, approval share links, and agency bonuses (onboarding checklist + approval SOP). Solo creators usually choose Pro.",
  },
  {
    q: "Are features locked by plan?",
    a: "No for solo creators: generation, calendars, Autopilot, and scheduling work on any plan when you have credits. Free vs Pro is capacity and bonuses. Agency uniquely unlocks client workspaces and approval share links.",
  },
  {
    q: "Why upgrade instead of only buying top-ups?",
    a: "Pro is the prepaid pack for a consistent weekly rhythm plus bonuses and the voice guarantee. Stay on Free + top-ups if usage is occasional. Choose Agency when you need multiple client LinkedIn accounts.",
  },
] as const;


export const ABOUT_STORY = [
  {
    heading: "The problem we kept seeing",
    body: "Founders and operators with the sharpest insights were posting the least. Not because they had nothing to say, but because a good LinkedIn post competed with the rest of the job. When they tried generic AI, the drafts sounded like everyone else. Trust went down. Consistency still did not go up.",
  },
  {
    heading: "What we built instead",
    body: "linkedinpost.ai is a content system, not a one-shot chatbot. You capture voice once. Agents draft, review, and tighten. You approve. Then you schedule or publish. The goal is a month of posts that still sound like you wrote them on a focused afternoon.",
  },
  {
    heading: "Who it is for",
    body: "Solo founders who need a weekly rhythm. Creators who want better drafts without losing their tone. Agencies that juggle multiple client voices and need separate workspaces. If LinkedIn matters to your pipeline and you refuse to sound generic, you are who we built for.",
  },
] as const;

export const COMPARE_ROWS = [
  {
    label: "Best for",
    free: "Prove your voice",
    pro: "Weekly LinkedIn channel",
    agency: "2-5 client brands",
  },
  {
    label: "Outcome",
    free: "First drafts that sound like you",
    pro: "Never miss a LinkedIn week",
    agency: "Clients without voice bleed",
  },
  {
    label: "AI credits / month",
    free: "15",
    pro: "200",
    agency: "1,000",
  },
  {
    label: "Rough monthly room",
    free: "Several drafts to prove fit",
    pro: "Heavy weekly + media",
    agency: "Multi-brand volume",
  },
  {
    label: "Full product (drafts, Council, media, calendars, Autopilot, publish)",
    free: "Included · uses credits",
    pro: "Included · uses credits",
    agency: "Included · uses credits",
  },
  {
    label: "Pro bonuses (calendar template + hooks)",
    free: false,
    pro: "Included",
    agency: "Included",
  },
  {
    label: "Agency bonuses (onboarding + approval SOP)",
    free: false,
    pro: false,
    agency: "Included",
  },
  {
    label: "7-day voice guarantee",
    free: false,
    pro: "First paid charge",
    agency: "First paid charge",
  },
  {
    label: "Buy extra credits",
    free: "Anytime",
    pro: "Anytime",
    agency: "Anytime",
  },
  {
    label: "Client workspaces",
    free: false,
    pro: false,
    agency: "Up to 5",
  },
  {
    label: "Client approval share links",
    free: false,
    pro: false,
    agency: "Included",
  },
] as const;


export const PRIVACY_SECTIONS = [
  {
    h: "1. Information we collect",
    p: [
      "We collect the information you provide directly: your name, email, content profile details, writing samples, and the posts you generate or draft. We also collect basic usage analytics (pages visited, features used) to improve the product.",
    ],
  },
  {
    h: "2. How we use your information",
    p: [
      "Your data is used to operate linkedinpost.ai: to generate posts in your voice, save your drafts and calendar, process billing, and send service communications. We do not sell your personal data.",
    ],
  },
  {
    h: "3. AI and your content",
    p: [
      "Your private drafts and voice profile are used only to serve your account. We do not use your private content to train public, shared AI models. Generated outputs belong to you.",
    ],
  },
  {
    h: "4. Data sharing",
    p: [
      "We share data only with trusted processors that help us run the service (hosting, payments, analytics), under agreements that require them to protect it. We may disclose information if required by law.",
    ],
  },
  {
    h: "5. Data retention & your rights",
    p: [
      "You can export or delete your content at any time. Deleting your account removes your profiles, drafts, and calendar. You may request access, correction, or deletion of your personal data by contacting us.",
    ],
  },
  {
    h: "6. Security",
    p: [
      "We use encryption in transit, access controls, and regular reviews to protect your data. No system is perfectly secure, but we work hard to safeguard your information.",
    ],
  },
  {
    h: "7. Contact",
    p: [
      "Questions about this policy? Reach us at privacy@linkedinpost.ai. We will respond within 30 days.",
    ],
  },
] as const;

export const TERMS_SECTIONS = [
  {
    h: "1. Acceptance of terms",
    p: [
      "By creating an account or using linkedinpost.ai, you agree to these Terms & Conditions. If you do not agree, please do not use the service.",
    ],
  },
  {
    h: "2. Your account",
    p: [
      "You are responsible for keeping your login secure and for all activity under your account. You must be at least 16 years old to use linkedinpost.ai.",
    ],
  },
  {
    h: "3. Acceptable use",
    p: [
      "You agree not to use the service to generate unlawful, deceptive, harassing, or infringing content. You are responsible for reviewing every post before publishing it to LinkedIn or elsewhere.",
    ],
  },
  {
    h: "4. Relationship to LinkedIn",
    p: [
      "linkedinpost.ai is an independent tool and is not affiliated with, endorsed by, or sponsored by LinkedIn Corporation. You are responsible for complying with LinkedIn's own terms of service when posting.",
    ],
  },
  {
    h: "5. Plans, credits & billing",
    p: [
      "Paid plans are billed monthly in advance. AI credits reset each billing cycle and do not roll over. You can upgrade, downgrade, or cancel at any time; cancellations take effect at the end of the current period. Public plans are Free, Pro, and Agency. Legacy Starter subscriptions may continue until cancelled.",
    ],
  },
  {
    h: "6. Voice guarantee",
    p: [
      "For your first Pro or Agency subscription charge, if you create a content profile, use the service, and still find drafts generic or unlike your voice within seven (7) days of that charge, email support@linkedinpost.ai to request a full refund of that first charge. The guarantee does not apply to credit top-ups alone, renewals after the first paid period, or accounts we reasonably believe are abusing the policy (including multi-account abuse). Refunds are processed manually; plan access ends when the refund completes.",
    ],
  },
  {
    h: "7. Intellectual property",
    p: [
      "You own the posts you generate. We own the software, brand, and underlying technology. You grant us a limited license to process your content solely to provide the service.",
    ],
  },
  {
    h: "8. Disclaimers & liability",
    p: [
      'The service is provided "as is." We are not liable for the performance of any content you publish. Our total liability is limited to the amount you paid in the prior 12 months.',
    ],
  },
  {
    h: "9. Changes & contact",
    p: [
      "We may update these terms; material changes will be announced in-app. Questions? Email legal@linkedinpost.ai.",
    ],
  },
] as const;
