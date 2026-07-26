/** Comparison and persona marketing copy for SEO landing pages. */

export {
  COMPARISON_PAGES,
  getComparisonBySlug,
  type ComparisonPage,
} from "@/lib/seo/comparisons";

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
    seoTitle: "LinkedIn Content System for Founders (30-Min Week)",
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
        a: "Most do well at two to three times a week. Consistency beats daily volume you cannot sustain. See our posting frequency guide for more detail.",
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
    seoTitle: "LinkedIn Content Tool for Agencies: Client Workspaces",
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
