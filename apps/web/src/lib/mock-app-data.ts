export const MOCK_METRICS = [
  {
    label: "Current Plan",
    value: "Pro",
    sub: "Renews Jul 1",
    icon: "workspace_premium",
    tint: "bg-indigo-50",
    color: "text-indigo-600",
  },
  {
    label: "Credits Used",
    value: "23",
    unit: "/ 50",
    sub: "46% of monthly limit",
    icon: "bolt",
    tint: "bg-amber-50",
    color: "text-amber-600",
  },
  {
    label: "Drafts",
    value: "12",
    sub: "3 edited this week",
    icon: "draft",
    tint: "bg-cyan-50",
    color: "text-cyan-600",
  },
  {
    label: "Scheduled Posts",
    value: "7",
    sub: "Next: Mon 9:00 AM",
    icon: "schedule",
    tint: "bg-violet-50",
    color: "text-violet-600",
  },
  {
    label: "Generated This Month",
    value: "38",
    sub: "+12 vs last month",
    icon: "trending_up",
    tint: "bg-green-50",
    color: "text-green-600",
  },
] as const;

export const MOCK_DRAFTS = [
  {
    hook: "I almost shut down my startup last year.",
    preview:
      "Here's the one decision that turned it around — and why most founders get it backwards when the pressure hits…",
    type: "Personal story",
    tone: "Bold & punchy",
    edited: "2 hours ago",
    pillar: "Founder lessons",
  },
  {
    hook: "3 hiring mistakes that cost me $80k.",
    preview:
      "Most teams optimize for the wrong signal in interviews. After 40+ hires, here's the framework I wish I'd had…",
    type: "List post",
    tone: "Practical",
    edited: "Yesterday",
    pillar: "How-to",
  },
  {
    hook: 'Everyone says "post consistently."',
    preview:
      "Nobody tells you what to do when you've got nothing to say. So I built a system. Here's how it works…",
    type: "Contrarian take",
    tone: "Thoughtful",
    edited: "2 days ago",
    pillar: "Industry takes",
  },
] as const;

export const MOCK_CLIENTS = [
  {
    name: "Northbeam Studio",
    initials: "NB",
    color: "bg-indigo-600",
    industry: "Design Agency",
    audience: "B2B founders & marketers",
    drafts: 8,
    scheduled: 4,
    profile: "Complete",
  },
  {
    name: "Loft & Co",
    initials: "LC",
    color: "bg-cyan-600",
    industry: "Real Estate",
    audience: "Home buyers & investors",
    drafts: 5,
    scheduled: 2,
    profile: "Complete",
  },
  {
    name: "Brightpath Coaching",
    initials: "BP",
    color: "bg-violet-600",
    industry: "Career Coaching",
    audience: "Mid-career professionals",
    drafts: 12,
    scheduled: 6,
    profile: "Complete",
  },
  {
    name: "Cadence Health",
    initials: "CH",
    color: "bg-emerald-600",
    industry: "HealthTech",
    audience: "Healthcare operators",
    drafts: 3,
    scheduled: 0,
    profile: "In progress",
  },
  {
    name: "Veridian Capital",
    initials: "VC",
    color: "bg-slate-700",
    industry: "Fintech",
    audience: "CFOs & finance leaders",
    drafts: 1,
    scheduled: 0,
    profile: "Not started",
  },
] as const;

export const MOCK_PIPELINE = [
  {
    title: "I almost shut down my startup last year",
    client: "Personal",
    type: "Story",
    score: 86,
    stage: "Ready for Approval",
    src: "Autopilot",
    media: "Ready",
    date: "Mon 9:00 AM",
  },
  {
    title: "3 hiring mistakes that cost me $80k",
    client: "Personal",
    type: "List",
    score: 91,
    stage: "Scheduled",
    src: "Manual",
    media: "Image",
    date: "Tue 8:30 AM",
  },
  {
    title: "Why most LinkedIn advice is wrong",
    client: "Northbeam",
    type: "Opinion",
    score: null,
    stage: "Text Reviewing",
    src: "Autopilot",
    media: "Pending",
    date: "Wed 9:00 AM",
  },
  {
    title: "We grew to $1M ARR with zero ads",
    client: "Personal",
    type: "Story",
    score: 88,
    stage: "Published",
    src: "Manual",
    media: "Image",
    date: "Published",
  },
  {
    title: "A simple framework for B2B hooks",
    client: "Personal",
    type: "How-to",
    score: 82,
    stage: "Media Generating",
    src: "Calendar",
    media: "Generating",
    date: "Thu 9:00 AM",
  },
  {
    title: "The hire that changed everything",
    client: "Personal",
    type: "Story",
    score: null,
    stage: "Text Generating",
    src: "Autopilot",
    media: "None",
    date: "Fri 9:00 AM",
  },
  {
    title: "5 lessons from our first enterprise deal",
    client: "Northbeam",
    type: "List",
    score: 79,
    stage: "Brief Created",
    src: "Manual",
    media: "None",
    date: "Next week",
  },
  {
    title: "Cold outreach is dead (here's what works)",
    client: "Personal",
    type: "Contrarian",
    score: 74,
    stage: "Failed",
    src: "Autopilot",
    media: "Image",
    date: "Retry needed",
  },
] as const;

export const MOCK_GENERATED = [
  {
    hook: "I almost shut down my startup last year.",
    body: "Revenue had flatlined for six months. Our runway was down to eleven weeks. Every spreadsheet said the same thing: cut and survive.\n\nInstead, we narrowed our entire roadmap to one feature and shipped it in nine days.",
    cta: "What's the boldest bet you've made under pressure?",
    tags: ["#startups", "#founders", "#leadership"],
    words: 182,
  },
  {
    hook: "Scaling a team taught me one hard lesson.",
    body: "The problem wasn't hiring fast enough. It was hiring without a clear scorecard for what 'great' looked like in each role.\n\nOnce we wrote it down, our bad hires dropped by half.",
    cta: "What hiring mistake cost you the most?",
    tags: ["#hiring", "#leadership", "#startups"],
    words: 156,
  },
  {
    hook: "Most founders optimize for the wrong metric.",
    body: "We chased MRR growth while ignoring retention. The dashboard looked great until churn caught up.\n\nNow we review one number every Monday: net revenue retention.",
    cta: "What metric do you wish you'd tracked earlier?",
    tags: ["#saas", "#founders", "#metrics"],
    words: 168,
  },
] as const;

export const MOCK_SCHEDULED = [
  { title: "I almost shut down my startup last year", date: "Jun 2", time: "9:00 AM", status: "Published", author: "Maya Reyes" },
  { title: "3 hiring mistakes that cost me $80k", date: "Jun 4", time: "8:30 AM", status: "Scheduled", author: "Maya Reyes" },
  { title: "Why most LinkedIn advice is wrong", date: "Jun 6", time: "9:00 AM", status: "Scheduled", author: "Maya Reyes" },
  { title: "A simple framework for B2B hooks", date: "Jun 9", time: "9:00 AM", status: "Needs Approval", author: "Maya Reyes" },
  { title: "We grew to $1M ARR with zero ads", date: "Jun 11", time: "10:00 AM", status: "Published", author: "Maya Reyes" },
  { title: "Cold outreach is dead", date: "Jun 13", time: "9:00 AM", status: "Failed", author: "Maya Reyes" },
] as const;

export const MOCK_APPROVALS = [
  {
    title: "I almost shut down my startup last year",
    client: "Personal",
    preview:
      "Revenue had flatlined for six months. Our runway was down to eleven weeks…",
    score: 86,
    created: "2h ago",
    schedule: "Mon 9:00 AM",
    media: true,
  },
  {
    title: "A simple framework for B2B hooks",
    client: "Personal",
    preview: "Most hooks fail in the first five words. Here's the structure I use…",
    score: 82,
    created: "5h ago",
    schedule: "Tue 8:30 AM",
    media: true,
  },
] as const;

export const PIPELINE_STAGES = [
  "Brief Created",
  "Text Generating",
  "Text Reviewing",
  "Media Generating",
  "Ready for Approval",
  "Scheduled",
  "Published",
  "Failed",
] as const;

export const BILLING_SUMMARY_CARDS = [
  { label: "Current plan", value: "Pro", sub: "$19 / month · Renews Jul 1" },
  { label: "Credits used", value: "23 / 200", sub: "11.5% of monthly limit" },
  { label: "Next reset", value: "Jul 1", sub: "2026 billing cycle" },
] as const;

export const CREDIT_COSTS = [
  { action: "Quick Draft", cost: "1 credit" },
  { action: "AI Council", cost: "3 credits" },
  { action: "Post + Media", cost: "10 credits" },
  { action: "Content calendar", cost: "15 credits" },
  { action: "Autopilot (weekly)", cost: "12 credits" },
] as const;

export const USAGE_BREAKDOWN_SEGMENTS = [
  { w: "22%", color: "#4f46e5" },
  { w: "37%", color: "#7c3aed" },
  { w: "24%", color: "#0891b2" },
  { w: "15%", color: "#16a34a" },
  { w: "2%", color: "#94a3b8" },
] as const;

export const USAGE_BREAKDOWN_ROWS = [
  { label: "Manual generation", value: "18" },
  { label: "AI Council", value: "30" },
  { label: "Media", value: "20" },
  { label: "Autopilot", value: "12" },
  { label: "Publishing", value: "2" },
] as const;

export const BILLING_HISTORY = [
  { date: "Jun 1, 2026", plan: "Pro", amount: "$19.00" },
  { date: "May 1, 2026", plan: "Pro", amount: "$19.00" },
  { date: "Apr 1, 2026", plan: "Starter", amount: "$9.00" },
] as const;

export const AUTOPILOT_PLANNED_POSTS = [
  { day: "Mon", topic: "How focus saved our runway", status: "Scheduled" },
  { day: "Tue", topic: "A simple framework for B2B hooks", status: "Ready for Approval" },
  { day: "Wed", topic: "What our churn data taught us", status: "Generating" },
  { day: "Thu", topic: "Unpopular opinion on cold outreach", status: "Planned" },
  { day: "Fri", topic: "The hire that changed everything", status: "Planned" },
] as const;

export const AUTOPILOT_FREQ_OPTIONS = ["3x / week", "Daily", "Weekdays", "Weekly"] as const;

export const AUTOPILOT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const AUTOPILOT_ACTIVE_DAYS = new Set(["Mon", "Wed", "Thu", "Fri", "Sun"]);

export const AUTOPILOT_STATUS_ROWS = [
  { label: "Last run", value: "Today 10:05 AM" },
  { label: "Next generation", value: "Tomorrow 10:00 AM" },
  { label: "Next publish", value: "Fri 9:00 AM" },
  { label: "Publishing to", value: "Maya Reyes" },
] as const;

export const AUTOPILOT_POST_TYPE_MIX = ["Story", "List", "How-to", "Opinion"] as const;

export const STATUS_COLORS: Record<string, string> = {
  "Ready for Approval": "bg-amber-50 text-amber-700",
  Scheduled: "bg-indigo-50 text-indigo-700",
  "Text Reviewing": "bg-cyan-50 text-cyan-700",
  Published: "bg-green-50 text-green-700",
  Failed: "bg-red-50 text-red-700",
  Planned: "bg-slate-100 text-slate-600",
  Generating: "bg-violet-50 text-violet-700",
};
