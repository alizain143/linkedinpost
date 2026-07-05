import type { Guide } from "@/lib/guides/types";

export const GUIDE_ARTICLES: Guide[] = [
  {
    slug: "linkedin-posts-dont-sound-like-ai",
    title: "How to Write LinkedIn Posts That Don't Sound Like AI",
    seoTitle: "LinkedIn Posts That Don't Sound Like AI",
    description:
      "Practical tactics to keep AI-assisted LinkedIn posts authentic: voice profiles, banned phrases, specific hooks, and a human review pass before you publish.",
    answerCapsule:
      "AI posts feel robotic when they use generic hooks, hedge every claim, and ignore your real voice. Fix it by training on your writing sample, banning AI clichés, adding one concrete detail per paragraph, and always editing the final draft yourself.",
    updatedAt: "2026-07-01",
    relatedGuides: [
      "linkedin-hooks-that-get-engagement",
      "linkedin-content-calendar-template",
    ],
    sections: [
      {
        heading: "Why most AI LinkedIn posts fail",
        body: "Readers spot AI writing fast: vague inspiration and hooks like \"In today's fast-paced world.\" The problem isn't using AI. It's publishing the first draft unchanged.\n\nLinkedIn rewards specificity. A post about \"leadership lessons\" gets ignored. A post about the Tuesday you fired a vendor after three missed deadlines gets read.",
      },
      {
        heading: "Build a voice profile before you generate",
        body: "Paste 3–5 posts you've actually published. Note your sentence length, whether you use questions, and words you never say. Feed that into your content profile along with your role, audience, and content pillars.\n\nThe goal isn't perfection. It's constraint. AI performs better with boundaries than with \"write like a thought leader.\"",
      },
      {
        heading: "Ban the tells",
        body: "Maintain a words-to-avoid list: \"delve,\" \"landscape,\" \"game-changer,\" \"it's not X, it's Y,\" and any phrase you've seen on ten other feeds this week.\n\nReplace abstract claims with numbers, names, or timelines. Instead of \"we improved retention,\" write \"churn dropped from 8% to 4% in Q1 after we changed onboarding.\"",
      },
      {
        heading: "The 10-minute human pass",
        body: "Before you publish, read aloud. Cut the first sentence if it's throat-clearing. Add one line only you would write: a mistake, a doubt, a contrarian take.\n\nIf every paragraph could belong to anyone in your industry, it's not ready.",
      },
    ],
    faqs: [
      {
        q: "Is it okay to use AI for LinkedIn posts?",
        a: "Yes, if you treat AI as a drafting assistant, not a ghostwriter. The posts that perform best combine AI speed with your specific stories, opinions, and editing voice.",
      },
      {
        q: "What phrases make LinkedIn posts sound like AI?",
        a: "Overused hooks (\"Here's the thing…\"), empty inspiration, and buzzwords like \"synergy\" or \"leverage.\" Readers also notice posts with no concrete detail: no dates, numbers, or named examples.",
      },
      {
        q: "How do I train AI on my LinkedIn voice?",
        a: "Provide real writing samples, define your audience and tone, list words to avoid, and regenerate until one option feels close, then edit manually. Tools like linkedinpost.ai store this as a reusable content profile.",
      },
    ],
  },
  {
    slug: "linkedin-content-calendar-template",
    title: "30-Day LinkedIn Content Calendar Template for Founders",
    seoTitle: "30-Day LinkedIn Content Calendar Template",
    description:
      "A repeatable framework to plan a month of LinkedIn posts: content pillars, weekly themes, post types, and a simple spreadsheet structure you can start today.",
    answerCapsule:
      "A useful 30-day calendar balances four content pillars across four weeks, mixes post formats (story, how-to, opinion, proof), and leaves buffer slots for timely reactions so you're never staring at a blank box on Monday morning.",
    updatedAt: "2026-06-20",
    relatedGuides: [
      "linkedin-posting-frequency-founders",
      "linkedin-posts-dont-sound-like-ai",
    ],
    sections: [
      {
        heading: "Start with four content pillars",
        body: "Pick four themes you'll return to all month: e.g. product lessons, industry takes, customer stories, and personal founder notes. Each pillar should map to something you can talk about without research.\n\nAim for roughly equal weight. If 80% of posts are product pitches, engagement drops.",
      },
      {
        heading: "Assign a weekly rhythm",
        body: "Week 1: establish context (who you are, what you build). Week 2: teach something practical. Week 3: share proof (metrics, testimonials, before/after). Week 4: take a stand or tell a story with stakes.\n\nPosting 3× per week? That's 12 slots, three per pillar.",
      },
      {
        heading: "Rotate post formats",
        body: "Alternate formats so the feed doesn't feel repetitive:\n\n• Story post (problem → action → result)\n• How-to list (3–5 bullets)\n• Contrarian take (\"Everyone says X. Here's why Y.\")\n• Carousel or image quote for visual break\n\nSchedule format rotation in your calendar so you don't default to text-only.",
      },
      {
        heading: "Leave two empty slots",
        body: "Reserve two days per month for reactive content: a comment on industry news, a reply to a trending discussion, or a quick win you didn't plan.\n\nPlanned calendars fail when they're too rigid. Empty slots keep you human.",
      },
    ],
    faqs: [
      {
        q: "How many posts should be on a 30-day LinkedIn calendar?",
        a: "Most founders do well with 12–16 posts per month (3–4 per week). Consistency beats volume. A sustainable rhythm you keep for six months beats a burst of daily posts that burns out in two weeks.",
      },
      {
        q: "What are LinkedIn content pillars?",
        a: "Recurring themes that organize your posts, e.g. leadership, product, industry news, and personal stories. Pillars prevent you from repeating the same angle and help your audience know what to expect from you.",
      },
    ],
  },
  {
    slug: "linkedin-posting-frequency-founders",
    title: "How Often Should Founders Post on LinkedIn?",
    seoTitle: "How Often Should Founders Post on LinkedIn?",
    description:
      "Data-informed guidance on LinkedIn posting frequency for founders: minimum viable rhythm, when to scale up, and signs you're posting too much or too little.",
    answerCapsule:
      "Most founders see meaningful traction at 3 posts per week. Below once a week, the algorithm and your audience forget you. Above once daily, quality usually collapses unless you have a content team.",
    updatedAt: "2026-06-10",
    relatedGuides: [
      "linkedin-content-calendar-template",
      "linkedin-hooks-that-get-engagement",
    ],
    sections: [
      {
        heading: "The minimum effective dose",
        body: "If you're starting from zero, commit to 2–3 posts per week for 90 days. That's enough for the algorithm to learn your audience and for readers to remember your name.\n\nOne post every two weeks won't compound. You'll rebuild momentum from scratch each time.",
      },
      {
        heading: "When to post more",
        body: "Increase frequency when: (1) you have a pipeline of drafts ready, (2) engagement per post is stable or rising, and (3) writing time is under 30 minutes per post with your system.\n\nScale to 4–5× weekly only if quality holds. Founders who jump to daily often recycle the same insight six ways.",
      },
      {
        heading: "Best days and times",
        body: "Tuesday through Thursday mornings (8–10 AM in your audience's timezone) consistently perform well for B2B founders. Test your own data. LinkedIn analytics shows when your followers are online.\n\nConsistency of day matters less than consistency of week.",
      },
      {
        heading: "Signs you're over-posting",
        body: "Watch for declining comments, repeated topics within the same week, or posts you're not proud to link in a sales call. Cut back and raise the bar.\n\nOne strong post beats three mediocre ones.",
      },
    ],
    faqs: [
      {
        q: "Is posting every day on LinkedIn too much?",
        a: "For most solo founders, yes, unless you have a content system and editor. Daily posting works for creators whose full-time job is content. Founders usually get better ROI at 3× per week with higher quality.",
      },
      {
        q: "How long until LinkedIn posting shows results?",
        a: "Expect 8–12 weeks of consistent posting before meaningful inbound or follower growth. Compound effects kick in when your back catalog gives new visitors something to read.",
      },
    ],
  },
  {
    slug: "linkedin-hooks-that-get-engagement",
    title: "LinkedIn Hooks That Get Engagement (With Examples)",
    seoTitle: "LinkedIn Hooks That Get Engagement",
    description:
      "Twelve hook formulas that stop the scroll on LinkedIn, with founder-friendly examples you can adapt without sounding like a copywriting template.",
    answerCapsule:
      "Strong LinkedIn hooks promise a specific payoff in the first line: a number, a mistake, a surprise, or a tension your reader recognizes. The best hooks feel like the start of a conversation, not a headline.",
    updatedAt: "2026-06-05",
    relatedGuides: [
      "linkedin-posts-dont-sound-like-ai",
      "linkedin-posting-frequency-founders",
    ],
    sections: [
      {
        heading: "The job of the first line",
        body: "LinkedIn truncates after ~140 characters on mobile. Your hook must earn the \"see more\" click. That means tension, specificity, or a pattern interrupt, not a greeting or context-setting.\n\nBad: \"I've been thinking about pricing lately.\" Good: \"We raised prices 40% and churn went down. Here's why.\"",
      },
      {
        heading: "Hook formulas that work for founders",
        body: "• The mistake: \"I lost our biggest client because of this email.\"\n• The number: \"3 hires. 2 failed. 1 lesson I'll never forget.\"\n• The contrarian: \"Stop building MVPs. Start here instead.\"\n• The before/after: \"6 months ago I had 200 followers. Today, 12 inbound leads/week.\"\n• The question: \"Why do senior engineers quit after the Series A?\"\n\nPick one formula per post. Mixing three hooks in one opening line feels chaotic.",
      },
      {
        heading: "Hooks to retire",
        body: "Avoid: \"I'm excited to announce,\" \"Hot take:\", \"Unpopular opinion:\" (when the opinion is popular), and any hook that could apply to any industry.\n\nIf you swap your company name for a competitor and the hook still works, it's too generic.",
      },
      {
        heading: "Match hook to post body",
        body: "The fastest way to lose trust is a clickbait hook with a generic body. If your hook promises a pricing story, deliver the pricing story in line two, not three paragraphs of setup.\n\nWrite the hook last if you need to. Draft the insight first, then compress the most surprising line to the top.",
      },
    ],
    faqs: [
      {
        q: "What is a hook on LinkedIn?",
        a: "The first one or two lines of your post, visible before the \"see more\" fold. A good hook creates curiosity or recognition so readers expand the full post.",
      },
      {
        q: "Do emojis in hooks help engagement?",
        a: "One emoji can add visual contrast in a text-heavy feed, but emoji-heavy hooks often read as spam. Test with your audience. B2B founder feeds usually prefer clean text hooks.",
      },
    ],
  },
];
