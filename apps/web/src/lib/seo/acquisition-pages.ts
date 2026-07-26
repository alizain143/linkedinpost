/** Comparison and persona marketing copy for SEO landing pages. */

export type ComparisonPage = {
  slug: "taplio" | "buffer" | "authoredup";
  competitorName: string;
  title: string;
  seoTitle: string;
  description: string;
  answerCapsule: string;
  whoWinsWhen: { when: string; pick: string }[];
  differences: { label: string; us: string; them: string }[];
  faqs: { q: string; a: string }[];
};

export const COMPARISON_PAGES: ComparisonPage[] = [
  {
    slug: "taplio",
    competitorName: "Taplio",
    title: "linkedinpost.ai vs Taplio",
    seoTitle: "linkedinpost.ai vs Taplio",
    description:
      "Compare linkedinpost.ai and Taplio for LinkedIn content: voice-first drafts, AI Council review, calendars, and approval before publish.",
    answerCapsule:
      "Taplio is strong for LinkedIn growth tooling. linkedinpost.ai is built around sounding like you: voice profiles, multi-agent review, calendars, and approval before anything goes live.",
    whoWinsWhen: [
      {
        when: "You want drafts that match your voice and get reviewed before you see them",
        pick: "linkedinpost.ai",
      },
      {
        when: "You mainly want engagement tooling and inspiration from top posts",
        pick: "Taplio",
      },
      {
        when: "You manage client brands and need separate workspaces",
        pick: "linkedinpost.ai (Agency)",
      },
    ],
    differences: [
      {
        label: "Core focus",
        us: "Voice-first generation + review council + calendar",
        them: "LinkedIn growth suite with inspiration and engagement features",
      },
      {
        label: "Draft quality control",
        us: "Writer, reviewer, and editor agents before approval",
        them: "AI assist depends on your prompts and edits",
      },
      {
        label: "Publishing control",
        us: "Approve first, then schedule or publish",
        them: "Scheduling and engagement workflows vary by plan",
      },
      {
        label: "Agencies",
        us: "Client workspaces on Agency plan",
        them: "Team features available on higher tiers",
      },
    ],
    faqs: [
      {
        q: "Is linkedinpost.ai a Taplio alternative?",
        a: "Yes, if your main pain is writing posts that still sound like you. If you primarily need Taplio's engagement and inspiration features, stay there or use both for different jobs.",
      },
      {
        q: "Can I switch from Taplio?",
        a: "Most people start by recreating their voice profile and generating a week of drafts in linkedinpost.ai, then decide whether to move scheduling over.",
      },
    ],
  },
  {
    slug: "buffer",
    competitorName: "Buffer",
    title: "linkedinpost.ai vs Buffer",
    seoTitle: "linkedinpost.ai vs Buffer",
    description:
      "Buffer is a multi-network scheduler. linkedinpost.ai is a LinkedIn content engine with voice profiles, AI review, and calendars built for founders.",
    answerCapsule:
      "Use Buffer when you need one scheduler across many networks. Use linkedinpost.ai when LinkedIn writing quality and consistency are the bottleneck.",
    whoWinsWhen: [
      {
        when: "LinkedIn drafting and sounding like yourself is the hard part",
        pick: "linkedinpost.ai",
      },
      {
        when: "You post to LinkedIn, Instagram, X, and more from one queue",
        pick: "Buffer",
      },
      {
        when: "You want AI drafts reviewed before you approve",
        pick: "linkedinpost.ai",
      },
    ],
    differences: [
      {
        label: "Primary job",
        us: "Create LinkedIn posts in your voice, then schedule or publish",
        them: "Schedule and analyze posts across social networks",
      },
      {
        label: "AI writing",
        us: "Council pipeline trained on your profile and avoid-list",
        them: "AI features exist; depth varies by product area",
      },
      {
        label: "LinkedIn depth",
        us: "Built specifically for LinkedIn content systems",
        them: "LinkedIn is one channel among many",
      },
      {
        label: "Best together",
        us: "Generate and refine in linkedinpost.ai",
        them: "Some teams still push final posts through a multi-network tool",
      },
    ],
    faqs: [
      {
        q: "Should I replace Buffer with linkedinpost.ai?",
        a: "Only if LinkedIn is your main channel and writing is the pain. If you need cross-network scheduling, keep Buffer and use linkedinpost.ai for LinkedIn drafts.",
      },
      {
        q: "Does linkedinpost.ai schedule posts?",
        a: "Yes. After you approve a post, you can schedule it or publish to LinkedIn from the app.",
      },
    ],
  },
  {
    slug: "authoredup",
    competitorName: "AuthoredUp",
    title: "linkedinpost.ai vs AuthoredUp",
    seoTitle: "linkedinpost.ai vs AuthoredUp",
    description:
      "AuthoredUp helps craft and format LinkedIn posts. linkedinpost.ai adds voice profiles, multi-agent review, calendars, and approval workflows.",
    answerCapsule:
      "AuthoredUp is excellent for formatting and post craft. linkedinpost.ai is for generating a month of on-brand drafts with review and calendar structure.",
    whoWinsWhen: [
      {
        when: "You already write well and need formatting / preview polish",
        pick: "AuthoredUp",
      },
      {
        when: "You need volume without losing voice, plus a content calendar",
        pick: "linkedinpost.ai",
      },
      {
        when: "You want an AI council to challenge weak drafts",
        pick: "linkedinpost.ai",
      },
    ],
    differences: [
      {
        label: "Strength",
        us: "Generation + review + calendar system",
        them: "Editor, formatting, and LinkedIn-native craft tools",
      },
      {
        label: "Blank-page help",
        us: "Strong: starts from your voice profile and pillars",
        them: "Strong if you already have the idea; lighter on full-month systems",
      },
      {
        label: "Team / clients",
        us: "Agency workspaces",
        them: "Collaboration depends on plan",
      },
      {
        label: "Media",
        us: "Image and carousel generation with review",
        them: "Focus is often on text craft and formatting",
      },
    ],
    faqs: [
      {
        q: "Can I use both?",
        a: "Some writers draft in linkedinpost.ai, then polish formatting elsewhere. Most people pick one home for the weekly workflow.",
      },
      {
        q: "Which is better for agencies?",
        a: "If you need isolated client voices and calendars, linkedinpost.ai Agency is built for that. Compare collaboration features on AuthoredUp if formatting is your main deliverable.",
      },
    ],
  },
];

export function getComparisonBySlug(slug: string): ComparisonPage | undefined {
  return COMPARISON_PAGES.find((page) => page.slug === slug);
}

export type PersonaPage = {
  slug: "founders" | "agencies";
  title: string;
  seoTitle: string;
  description: string;
  answerCapsule: string;
  pains: { title: string; body: string }[];
  outcomes: string[];
  steps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
};

export const PERSONA_PAGES: PersonaPage[] = [
  {
    slug: "founders",
    title: "LinkedIn content for founders",
    seoTitle: "LinkedIn Content System for Founders",
    description:
      "Build a weekly LinkedIn rhythm as a founder: voice profile, reviewed drafts, calendar planning, and approve-before-publish control.",
    answerCapsule:
      "You do not need to become a full-time creator. You need a system that turns your real work into clear posts without sounding generic.",
    pains: [
      {
        title: "Writing loses to the product",
        body: "A good post can take an hour. That hour disappears the moment customers, hiring, or shipping call.",
      },
      {
        title: "Generic AI feels risky",
        body: "One robotic post can make investors and customers wonder who is really behind the account.",
      },
      {
        title: "Inconsistent cadence",
        body: "Two strong weeks, then silence. Momentum resets every time you vanish.",
      },
    ],
    outcomes: [
      "A voice profile you reuse instead of re-prompting every time",
      "Two to three solid posts a week without a Sunday scramble",
      "A calendar that balances product, proof, and personal notes",
      "Approval before anything schedules or publishes",
    ],
    steps: [
      {
        title: "Capture voice once",
        body: "Role, audience, pillars, and a short writing sample. That becomes the constraint for every draft.",
      },
      {
        title: "Generate and review",
        body: "The Council drafts options and flags weak lines before you spend attention editing.",
      },
      {
        title: "Approve on your schedule",
        body: "Batch-review twice a week, then schedule. Keep empty slots for timely takes.",
      },
    ],
    faqs: [
      {
        q: "How often should founders post?",
        a: "Most do well at two to three times a week. Consistency beats daily volume you cannot sustain. See our posting frequency guide for detail.",
      },
      {
        q: "Will this sound like me?",
        a: "That is the point of the voice profile and avoid-list. You still do a short human pass before publish.",
      },
    ],
  },
  {
    slug: "agencies",
    title: "LinkedIn content for agencies",
    seoTitle: "LinkedIn Content Workflow for Agencies",
    description:
      "Run LinkedIn content for multiple clients: isolated workspaces, voice profiles per brand, approvals, and calendars in one place.",
    answerCapsule:
      "Agencies do not fail from lack of ideas. They fail when every client voice collapses into the same AI tone and approvals get messy.",
    pains: [
      {
        title: "Voices blur together",
        body: "Without separate profiles, every client starts sounding like the same template farm.",
      },
      {
        title: "Approval bottlenecks",
        body: "Slack threads and Google Docs bury the final version. Clients lose trust when the wrong draft ships.",
      },
      {
        title: "Calendar chaos",
        body: "Each account needs pillars, cadence, and status. Spreadsheets do not scale past a few clients.",
      },
    ],
    outcomes: [
      "Isolated workspaces per client on Agency",
      "Distinct voice profiles and avoid-lists",
      "Approval queue before schedule or publish",
      "Shared credit pool with higher limits",
    ],
    steps: [
      {
        title: "One workspace per client",
        body: "Keep drafts, calendars, and profiles separate so brand voice cannot leak.",
      },
      {
        title: "Council drafts, humans approve",
        body: "Your team reviews packages; clients approve when needed; nothing publishes without a clear yes.",
      },
      {
        title: "Run the month from the calendar",
        body: "Balance pillars, leave reactive slots, and see status from idea to published.",
      },
    ],
    faqs: [
      {
        q: "How many clients can we manage?",
        a: "Agency includes up to 5 client workspaces. Contact us if you need a larger roster.",
      },
      {
        q: "Can clients approve without an app login maze?",
        a: "Approval flows are built for review before publish. Share links and in-app queues keep the final call clear.",
      },
    ],
  },
];

export function getPersonaBySlug(slug: string): PersonaPage | undefined {
  return PERSONA_PAGES.find((page) => page.slug === slug);
}

export type CaseStudy = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  role: string;
  timeframe: string;
  summary: string;
  situation: string;
  approach: string[];
  results: string[];
  note: string;
};

/** Illustrative workflows (not named customer endorsements). */
export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "founder-weekly-rhythm",
    title: "How a B2B founder rebuilt a weekly LinkedIn rhythm",
    seoTitle: "Founder LinkedIn Weekly Rhythm Example",
    description:
      "An illustrative walkthrough of how a busy B2B founder moved from sporadic posts to three reviewed drafts a week.",
    role: "B2B SaaS founder (illustrative)",
    timeframe: "First 6 weeks",
    summary:
      "The bottleneck was not ideas. It was finishing posts that still sounded human while shipping product.",
    situation:
      "Posting happened in bursts after events, then silence for two weeks. Generic AI drafts felt off-brand, so they got abandoned mid-edit.",
    approach: [
      "Built a voice profile from five real posts and a short avoid-list",
      "Set pillars: product lessons, customer stories, hiring notes, industry takes",
      "Generated a week ahead every Monday; approved Tuesday and Thursday",
      "Left two calendar slots empty for reactive posts",
    ],
    results: [
      "Stable 3 posts per week for six weeks without weekend catch-up writing",
      "Edit time per post dropped because drafts arrived closer to publishable",
      "Fewer abandoned drafts sitting in notes apps",
    ],
    note: "Composite example based on common founder workflows. Not a named customer testimonial.",
  },
  {
    slug: "agency-three-clients",
    title: "How a small agency separated three client voices",
    seoTitle: "Agency LinkedIn Client Workflow Example",
    description:
      "An illustrative agency workflow using separate workspaces, approvals, and calendars for three LinkedIn clients.",
    role: "3-person content agency (illustrative)",
    timeframe: "First month on Agency",
    summary:
      "The team needed volume without letting Client A sound like Client B after AI drafting.",
    situation:
      "Shared prompts and one Notion doc caused tone bleed. Approvals lived in Slack. Status was unclear by Friday.",
    approach: [
      "One workspace and profile per client",
      "Council drafts inside each workspace only",
      "Client approval before schedule",
      "Month view per client with pillar balance",
    ],
    results: [
      "Clear ownership of drafts per brand",
      "Faster approval cycles with fewer wrong-version publishes",
      "Calendars visible to the team without spreadsheet archaeology",
    ],
    note: "Composite example based on common agency workflows. Not a named customer testimonial.",
  },
];

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}
