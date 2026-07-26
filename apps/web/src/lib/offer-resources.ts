export type ResourceSlug = "client-onboarding" | "approval-workflow";

export type OfferResource = {
  slug: ResourceSlug;
  title: string;
  description: string;
  audience: "agency";
  steps: { title: string; body: string }[];
};

export const OFFER_RESOURCES: OfferResource[] = [
  {
    slug: "client-onboarding",
    title: "Client onboarding checklist",
    description:
      "Use this when you open a new client workspace so voice, LinkedIn, and approvals are set before you generate.",
    audience: "agency",
    steps: [
      {
        title: "Create the client workspace",
        body: "Name it after the client brand. Keep one workspace per LinkedIn account so voices never mix.",
      },
      {
        title: "Connect the correct LinkedIn",
        body: "Reconnect as that client's member only. Identity lock keeps the same person after disconnect.",
      },
      {
        title: "Capture voice once",
        body: "Paste a writing sample, set role, audience, pillars, and avoid-words. Approve an AI profile suggestion if it helps, then edit until it sounds like them.",
      },
      {
        title: "Agree the first week of topics",
        body: "Pick 3-5 themes from their pillars. Generate with Council for the serious posts; keep one slot open for reactive news.",
      },
      {
        title: "Send the approval share link",
        body: "Share the Approvals link so the client reviews without needing a login. Collect yes / change requests before you schedule.",
      },
      {
        title: "Publish or schedule only after approval",
        body: "Nothing goes live without a clear yes. That is how you protect trust and keep the retainer.",
      },
    ],
  },
  {
    slug: "approval-workflow",
    title: "Approval workflow SOP",
    description:
      "A simple loop for agencies: draft, review, share link, revise, schedule. Prevents voice bleed and surprise posts.",
    audience: "agency",
    steps: [
      {
        title: "Draft in the client workspace only",
        body: "Never generate Client A copy while Client B is selected. Switch workspace first, every time.",
      },
      {
        title: "Run Council on high-stakes posts",
        body: "Use AI Council when the post represents the brand publicly. Quick draft is fine for low-risk updates.",
      },
      {
        title: "Internal pass before the client sees it",
        body: "Skim hooks, claims, and avoid-words yourself. Fix obvious issues so the client review is about taste, not typos.",
      },
      {
        title: "Send one share link per review batch",
        body: "Group 2-5 posts in Approvals and share the link. Ask for approve / request changes by a clear deadline.",
      },
      {
        title: "Apply changes in-app, then re-share if needed",
        body: "Do not paste edits into Slack as the source of truth. Keep the final text in linkedinpost.ai.",
      },
      {
        title: "Schedule only approved items",
        body: "Move approved posts to the calendar or publish now. Rejected items stay in the queue until rewritten.",
      },
    ],
  },
];

export function getOfferResource(slug: string): OfferResource | undefined {
  return OFFER_RESOURCES.find((resource) => resource.slug === slug);
}
