/* cc-variants.js: the registry of "build your own command center" spots. One config per variant; custom.js turns
   each into a scene. Every variant: a prompt (or a prebuilt page), the apps it connects, the panels it builds, the
   grid layouts it moves between, and one or more follow-up edits that show the page being customised.
   Layout place = { panelId: [col, row, colSpan, rowSpan] }. Mock data is fictional. */

const L = (cols, rows, place) => ({ cols, rows, place });
const MY_WEEK = { name: 'My week', icon: 'grid', show: -1, active: true };

/* shared panels reused by the prebuilt variants */
const P = {
  school: { id: 'school', type: 'list', title: 'School', logos: ['canvas'], count: '4 due', items: [
    { text: 'CS 161 · Problem Set 4', meta: 'Thu 11:59 PM', tag: '3 days' },
    { text: 'ECON 102 · Midterm', meta: 'Oct 20', tag: 'start now', hot: true },
    { text: 'BIO 110 · Lab report', meta: 'Mon' }] },
  network: { id: 'network', type: 'people', title: 'Networking', logos: ['linkedin'], count: '3 waiting', items: [
    { name: 'Marcus Lee', meta: 'coffee chat', wait: '2d' },
    { name: 'Priya Nair', meta: 'career fair', wait: '4d' },
    { name: 'Prof. Alvarez', meta: 'thank-you note', wait: 'today' }] },
  projects: { id: 'projects', type: 'list', title: 'Projects', logos: ['github', 'notion'], count: 'synced', items: [
    { text: 'habit-tracker · ship streaks API', meta: '3 commits yesterday', tag: 'next: tests' },
    { text: 'Portfolio · write case study', meta: '60% drafted' },
    { text: 'Club site · fix sign-up form', meta: 'PR open' }] },
  email: { id: 'email', type: 'list', title: 'Email', logos: ['gmail'], count: '142 sorted', items: [
    { text: 'Lena · Halcyon Labs: interview times?', meta: 'reply by Wed', hot: true },
    { text: 'Financial aid · form due Fri', meta: 'to do' },
    { text: '38 newsletters archived', meta: 'filtered', muted: true }] },
  daily: { id: 'daily', type: 'list', title: 'Daily', icon: 'repeat', count: '2 rolled over', items: [
    { text: 'Read 20 pages', meta: 'every day', repeat: true },
    { text: 'LeetCode · 1 problem', meta: 'every day', repeat: true },
    { text: 'Laundry', meta: 'from Sat', tag: 'rolled ×2' }] },
  gym: { id: 'gym', type: 'streak', title: 'Gym streak', icon: 'repeat', count: '4x a week', num: 12, unit: 'days on plan',
    days: [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0], note: '3 of 4 this week' },
};

/* job hunt, training, startup panels: used by their own spots and by the montage */
const JOB = {
  pipe: { id: 'pipe', type: 'stages', title: 'Applications', icon: 'doc', count: '18 total', cols: [
    { name: 'Applied', n: 14, items: ['Halcyon Labs', 'Brightline'] },
    { name: 'Interviewing', n: 3, items: ['Kestrel AI', 'Orbital'], hot: true },
    { name: 'Offer', n: 1, items: ['Northwind'] }] },
  interviews: { id: 'interviews', type: 'list', title: 'Interviews this week', logos: ['gcal'], count: '3', items: [
    { text: 'Kestrel AI · technical', meta: 'Wed 2:00 PM', tag: 'prep doc ready' },
    { text: 'Orbital · recruiter call', meta: 'Thu 10:00 AM' },
    { text: 'Halcyon Labs · final round', meta: 'Fri 1:00 PM', tag: 'big one', hot: true }] },
  recruiters: { id: 'recruiters', type: 'people', title: 'Recruiters to answer', logos: ['linkedin', 'gmail'], count: '3 waiting', items: [
    { name: 'Lena Park', meta: 'Halcyon Labs · interview times', wait: '2d' },
    { name: 'Sam Ortiz', meta: 'Kestrel AI · coding test', wait: '1d' },
    { name: 'Priya Nair', meta: 'career fair follow-up', wait: '4d' }] },
  opens: { id: 'opens', type: 'list', title: 'Opening soon', icon: 'bell', count: '3', items: [
    { text: 'Research fellowship', meta: 'opens tomorrow 9 AM', hot: true },
    { text: 'Summer SWE internships', meta: 'open Oct 14' },
    { text: 'Product design residency', meta: 'opens Oct 20' }] },
};
const RUN = {
  miles: { id: 'miles', type: 'bars', title: 'Miles this week', logos: ['strava'], count: 'goal 30',
    total: { num: 24.6, dec: 1, suffix: ' mi' }, label: 'of 30 mi', values: [4, 0, 6.2, 3.1, 0, 11.3, 0], labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] },
  long: { id: 'long', type: 'countdown', title: 'Long run', icon: 'clock', count: 'Sat', num: 11, from: 6, unit: 'miles',
    label: 'Sat 7:00 AM · river loop', segs: 4, on: 3, note: 'build week 3 of 4 · 54°F, light wind' },
  gym: { ...P.gym, id: 'rgym' },
  plan: { id: 'plan', type: 'list', title: "This week's plan", logos: ['gcal'], count: '4 runs', items: [
    { text: 'Tue · 4 mi easy', meta: 'done, 8:52 /mi' },
    { text: 'Thu · 5 x 800m', meta: 'track, 6:00 PM' },
    { text: 'Sat · 11 mi long', meta: 'river loop', tag: 'longest yet', hot: true }] },
  sleep: { id: 'sleep', type: 'stat', title: 'Sleep', icon: 'clock', value: { num: 7.4, dec: 1, suffix: 'h' },
    label: 'average this week', delta: '+40 min vs last week', spark: [6.5, 7.1, 6.8, 7.9, 7.2, 8.1, 7.4] },
};
const BIZ = {
  mrr: { id: 'mrr', type: 'stat', title: 'MRR', logos: ['stripe'], count: 'live', value: { num: 18.4, dec: 1, prefix: '$', suffix: 'k' },
    label: 'monthly recurring revenue', delta: '+9% this month', spark: [9, 10, 10.5, 11.8, 12.6, 13.1, 14.9, 15.2, 16.4, 16.9, 17.3, 18.4] },
  prs: { id: 'prs', type: 'list', title: 'Open PRs', logos: ['github'], count: '5 open', items: [
    { text: 'streaks API · add tests', meta: '2 approvals', tag: 'ready' },
    { text: 'billing · proration fix', meta: 'needs your review', hot: true },
    { text: 'onboarding · new empty state', meta: 'draft' }] },
  investors: { id: 'investors', type: 'people', title: 'Investor follow-ups', logos: ['gmail'], count: '3', seed: 2, items: [
    { name: 'Jordan Wells', meta: 'you sent the deck Thu', wait: '3d' },
    { name: 'Maya Brooks', meta: 'asked for metrics', wait: '1d' },
    { name: 'Theo Grant', meta: 'intro from Sam', wait: '5d' }] },
  calls: { id: 'calls', type: 'list', title: "Today's calls", logos: ['gcal'], count: '3', items: [
    { text: '10:00  Design partner check-in', meta: 'Zoom', block: 'call' },
    { text: '1:30  Hiring · backend engineer', meta: 'interview', block: 'class' },
    { text: '4:00  Maya Brooks · metrics', meta: 'deck updated', block: 'work' }] },
  churn: { id: 'churn', type: 'stat', title: 'Churn', icon: 'grid', value: { num: 2.1, dec: 1, suffix: '%' },
    label: 'monthly churn', delta: 'down from 2.8%', spark: [3.1, 3.0, 2.9, 2.8, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1] },
};
const SCH = {
  exam: { id: 'exam', type: 'countdown', title: 'ECON 102 midterm', icon: 'clock', count: 'Oct 20', num: 15, unit: 'days',
    label: 'Midterm · Oct 20 · 9 AM', segs: 6, on: 2, note: 'review 2 of 6 done · next block tonight 8 PM' },
  due: { id: 'due', type: 'list', title: 'Due this week', logos: ['canvas'], count: '4 due', items: [
    { text: 'CS 161 · Problem Set 4', meta: 'Thu 11:59 PM', tag: '3 days' },
    { text: 'BIO 110 · Lab report', meta: 'Mon' },
    { text: 'ENG 210 · Essay draft', meta: 'Fri', tag: 'start early', hot: true }] },
  profs: { id: 'profs', type: 'people', title: 'Professors to email', logos: ['gmail'], count: '3 waiting', seed: 4, items: [
    { name: 'Prof. Alvarez', meta: 'thank-you note', wait: 'today' },
    { name: 'Dr. Chen', meta: 'office hours question', wait: '2d' },
    { name: 'Prof. Rivera', meta: 'extension request', wait: '4d' }] },
  study: { id: 'study', type: 'list', title: 'Study blocks today', logos: ['gcal'], count: '3 booked', items: [
    { text: '4:00  ECON review · ch. 5 to 7', meta: 'from your syllabus', block: 'work' },
    { text: '7:00  PSET 4 · problems 1 to 3', meta: 'from Canvas', block: 'class' },
    { text: '9:30  Read 20 pages', meta: 'every day', block: 'gym' }] },
  capstone: { id: 'capstone', type: 'countdown', title: 'Capstone proposal', icon: 'doc', count: 'Oct 30', num: 25, unit: 'days',
    label: 'Proposal draft · Oct 30', segs: 5, on: 1, note: 'outline started · 20 min a day keeps it easy' },
};

export const VARIANTS = {
  school: {
    id: 'school', title: 'School', headline: 'describe it. it builds it.',
    prompt: 'build me a command center for school: deadlines, exam countdowns, and professors I need to email back',
    connect: [['canvas', 'Canvas'], ['gmail', 'Gmail'], ['gcal', 'Google Calendar']],
    centers: [MY_WEEK, { name: 'School', icon: 'doc', show: 0 }],
    panels: [SCH.exam, SCH.due, SCH.profs, SCH.study, SCH.capstone],
    layouts: [
      L(3, 2, { exam: [0, 0, 1, 1], due: [1, 0, 2, 1], profs: [0, 1, 1, 1], study: [1, 1, 2, 1] }),
      L(4, 2, { exam: [0, 0, 1, 1], capstone: [1, 0, 1, 1], due: [2, 0, 2, 1], profs: [0, 1, 2, 1], study: [2, 1, 2, 1] }),
    ],
    tour: ['exam'],
    edits: [{ prompt: 'add a countdown for my capstone too', to: 1, focus: 'capstone' }],
  },
  jobhunt: {
    id: 'jobhunt', title: 'Job hunt', headline: 'your job hunt. your layout.',
    prompt: 'track my internship search: applications, interviews this week, and recruiters I owe a reply',
    connect: [['gmail', 'Gmail'], ['linkedin', 'LinkedIn'], ['gcal', 'Google Calendar']],
    centers: [MY_WEEK, { name: 'Job hunt', icon: 'doc', show: 0 }],
    panels: [JOB.pipe, JOB.recruiters, JOB.interviews, JOB.opens],
    layouts: [
      L(4, 2, { pipe: [0, 0, 2, 1], recruiters: [2, 0, 2, 1], interviews: [0, 1, 2, 1], opens: [2, 1, 2, 1] }),
      L(4, 2, { interviews: [0, 0, 2, 1], recruiters: [2, 0, 2, 1], pipe: [0, 1, 2, 1], opens: [2, 1, 2, 1] }),
    ],
    tour: ['pipe'],
    edits: [{ prompt: 'move interviews to the top', to: 1, focus: 'interviews', flash: 'interviews' }],
  },
  startup: {
    id: 'startup', title: 'Startup', headline: 'built the way you work.', accent: '#8b7bff',
    prompt: "one page for my startup: MRR, open PRs, investor follow-ups, and today's calls",
    connect: [['stripe', 'Stripe'], ['github', 'GitHub'], ['gmail', 'Gmail'], ['gcal', 'Google Calendar']],
    centers: [{ name: 'Personal', icon: 'grid', show: -1, active: true }, { name: 'Startup', icon: 'spark', show: 0 }],
    panels: [BIZ.mrr, BIZ.prs, BIZ.investors, BIZ.calls, BIZ.churn],
    layouts: [
      L(4, 2, { mrr: [0, 0, 2, 1], prs: [2, 0, 2, 1], investors: [0, 1, 2, 1], calls: [2, 1, 2, 1] }),
      L(4, 2, { mrr: [0, 0, 1, 1], churn: [1, 0, 1, 1], prs: [2, 0, 2, 1], investors: [0, 1, 2, 1], calls: [2, 1, 2, 1] }),
    ],
    tour: ['mrr'],
    edits: [{ prompt: 'put churn next to MRR', to: 1, focus: 'churn' }],
  },
  training: {
    id: 'training', title: 'Training', headline: 'track what you care about.', accent: '#2dd4bf',
    prompt: 'my half marathon training: miles this week, the long run, gym streak, and sleep',
    connect: [['strava', 'Strava'], ['gcal', 'Google Calendar']],
    centers: [MY_WEEK, { name: 'Training', icon: 'repeat', show: 0 }],
    panels: [RUN.miles, RUN.long, RUN.gym, RUN.plan, RUN.sleep],
    layouts: [
      L(4, 2, { miles: [0, 0, 2, 1], long: [2, 0, 1, 1], rgym: [3, 0, 1, 1], plan: [0, 1, 2, 1], sleep: [2, 1, 2, 1] }),
      L(4, 2, { long: [0, 0, 2, 1], miles: [2, 0, 2, 1], plan: [0, 1, 2, 1], rgym: [2, 1, 1, 1], sleep: [3, 1, 1, 1] }),
    ],
    tour: ['miles'],
    edits: [{ prompt: 'make the long run bigger', to: 1, focus: 'long', flash: 'long' }],
  },
  creator: {
    id: 'creator', title: 'Channel', headline: 'any layout. one sentence.', accent: '#f472b6',
    prompt: 'a dashboard for my channel: upload schedule, video ideas, comments to answer, sponsor deadlines',
    connect: [['youtube', 'YouTube'], ['notion', 'Notion'], ['gmail', 'Gmail']],
    centers: [MY_WEEK, { name: 'Channel', icon: 'spark', show: 0 }],
    panels: [
      { id: 'uploads', type: 'week', title: 'Upload schedule', logos: ['youtube'], count: '2 this week', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], hours: [8, 22], blocks: [
        { d: 0, s: 10, e: 13, label: 'Script · desk tour', k: 'work' }, { d: 1, s: 14, e: 17, label: 'Film', k: 'class' },
        { d: 2, s: 15, e: 18, label: 'Edit', k: 'work' }, { d: 3, s: 16, e: 18, label: 'Upload 5 PM', k: 'due' },
        { d: 4, s: 11, e: 13, label: 'Thumbnails', k: 'gym' }, { d: 5, s: 12, e: 15, label: 'Film short', k: 'class' },
        { d: 6, s: 16, e: 18, label: 'Upload short', k: 'due' }] },
      { id: 'ideas', type: 'list', title: 'Video ideas', logos: ['notion'], count: '12 saved', items: [
        { text: 'Desk setup tour 2026', meta: 'most requested', hot: true },
        { text: '$0 study setup', meta: '4 comments asked' },
        { text: 'A week of 5 AM', meta: 'outline drafted' }] },
      { id: 'comments', type: 'people', title: 'Comments', logos: ['youtube'], count: '9 to answer', seed: 1, items: [
        { name: 'maya edits', meta: 'what mic is that?', wait: '2h' },
        { name: 'coding kai', meta: 'part 2 please', wait: '5h' },
        { name: 'jules studies', meta: 'link the planner?', wait: '1d' }] },
      { id: 'sponsors', type: 'list', title: 'Sponsor deadlines', logos: ['gmail'], count: '2', items: [
        { text: 'Desk lamp · script due', meta: 'Thu', tag: 'draft ready' },
        { text: 'Notes app · final cut', meta: 'Oct 14' }] },
    ],
    layouts: [
      L(4, 2, { uploads: [0, 0, 2, 2], ideas: [2, 0, 2, 1], comments: [2, 1, 1, 1], sponsors: [3, 1, 1, 1] }),
      L(4, 2, { uploads: [0, 0, 2, 2], comments: [2, 0, 2, 1], sponsors: [2, 1, 2, 1] }),
    ],
    tour: ['uploads'],
    edits: [{ prompt: 'hide ideas until Friday', to: 1, focus: 'comments', flash: 'comments' }],
  },
  people: {
    id: 'people', title: 'People', headline: 'build it around people.',
    prompt: "everyone I need to follow up with, sorted by how long they've been waiting",
    connect: [['gmail', 'Gmail'], ['linkedin', 'LinkedIn']],
    centers: [MY_WEEK, { name: 'People', icon: 'chat', show: 0 }],
    panels: [
      { id: 'waiting', type: 'people', title: 'Waiting on you', logos: ['gmail', 'linkedin'], count: '6 people', items: [
        { name: 'Priya Nair', meta: 'career fair follow-up', wait: '6d' },
        { name: 'Prof. Alvarez', meta: 'thank-you note', wait: '4d' },
        { name: 'Marcus Lee', meta: 'coffee chat', wait: '2d' },
        { name: 'Lena Park', meta: 'interview times', wait: '2d' },
        { name: 'Jordan Wells', meta: 'intro to his team', wait: '1d' },
        { name: 'Dana Kim', meta: 'design club workshop', wait: 'today', ok: true }] },
      { id: 'drafts', type: 'list', title: 'Drafts ready', icon: 'chat', count: '3', items: [
        { text: 'To Priya · great meeting you Thursday', meta: 'ready to send' },
        { text: 'To Marcus · 1 PM works', meta: 'ready to send' },
        { text: 'To Lena · Thu 10, 2 or 4', meta: 'ready to send' }] },
      { id: 'met', type: 'list', title: 'Met this week', logos: ['linkedin'], count: '3', items: [
        { text: 'Sam Ortiz · Kestrel AI', meta: 'career fair' },
        { text: 'Dana Kim · design club', meta: 'workshop' },
        { text: 'Theo Grant · alum', meta: 'coffee' }] },
      { id: 'bdays', type: 'list', title: 'Birthdays this month', icon: 'bell', count: '3', items: [
        { text: 'Mom', meta: 'Oct 9', tag: 'in 4 days', hot: true },
        { text: 'Jules', meta: 'Oct 17' },
        { text: 'Dana', meta: 'Oct 28' }] },
    ],
    layouts: [
      L(4, 2, { waiting: [0, 0, 2, 2], drafts: [2, 0, 2, 1], met: [2, 1, 2, 1] }),
      L(4, 2, { waiting: [0, 0, 2, 2], drafts: [2, 0, 2, 1], met: [2, 1, 1, 1], bdays: [3, 1, 1, 1] }),
    ],
    tour: ['waiting'],
    edits: [{ prompt: 'add birthdays this month', to: 1, focus: 'bdays' }],
  },
  home: {
    id: 'home', title: 'Home', headline: 'the boring stuff, on one page.', accent: '#fbbf24',
    prompt: 'bills due, subscriptions renewing this month, groceries, and anything from my landlord',
    connect: [['gmail', 'Gmail'], ['gcal', 'Google Calendar']],
    centers: [MY_WEEK, { name: 'Home', icon: 'grid', show: 0 }],
    panels: [
      { id: 'bills', type: 'list', title: 'Bills due', icon: 'doc', count: '$1,612', items: [
        { text: 'Rent', meta: 'Nov 1', tag: '$1,450' },
        { text: 'Electric', meta: 'Oct 12', tag: '$64' },
        { text: 'Phone', meta: 'Oct 18', tag: '$45' }] },
      { id: 'subs', type: 'list', title: 'Renewing this month', icon: 'repeat', count: '4', items: [
        { text: 'Music', meta: 'Oct 8 · $10.99' },
        { text: 'Gym', meta: 'Oct 20 · $29', tag: 'used 3x' },
        { text: 'Streaming', meta: 'Oct 26 · $15.49', tag: 'unused 6 weeks', hot: true }] },
      { id: 'groceries', type: 'list', title: 'Groceries', icon: 'grid', count: '7 items', items: [
        { text: 'Oat milk, eggs, spinach', meta: 'from your list' },
        { text: 'Coffee beans', meta: 'running low' },
        { text: 'Rice, black beans', meta: 'meal prep Sun' }] },
      { id: 'landlord', type: 'list', title: 'Landlord', logos: ['gmail'], count: '1 new', items: [
        { text: 'Water shutoff Thu 9 to 11 AM', meta: 'Greenway Properties', hot: true },
        { text: 'Lease renewal opens Nov 1', meta: 'reply by Nov 15' }] },
      { id: 'spend', type: 'stat', title: 'Spent this month', icon: 'grid', value: { num: 1284, prefix: '$' },
        label: 'of $1,900 budget', delta: '$616 left', spark: [120, 240, 410, 520, 700, 880, 1010, 1284] },
    ],
    layouts: [
      L(4, 2, { bills: [0, 0, 2, 1], subs: [2, 0, 2, 1], groceries: [0, 1, 2, 1], landlord: [2, 1, 2, 1] }),
      L(3, 2, { spend: [0, 0, 1, 1], bills: [1, 0, 1, 1], subs: [2, 0, 1, 1], groceries: [0, 1, 1, 1], landlord: [1, 1, 2, 1] }),
    ],
    tour: ['subs'],
    edits: [{ prompt: "add what I've spent this month", to: 1, focus: 'spend' }],
  },
  liveedit: {
    id: 'liveedit', title: 'My week', headline: 'change anything. just ask.', prebuilt: true,
    sub: 'Mon, Oct 5 · 4 due this week · 3 people waiting',
    connect: [['gmail', 'Gmail'], ['gcal', 'Calendar'], ['canvas', 'Canvas'], ['linkedin', 'LinkedIn'], ['github', 'GitHub']],
    centers: [MY_WEEK, { name: 'Job hunt', icon: 'doc', show: -1 }],
    panels: [P.school, P.network, P.projects, P.email, P.daily, P.gym],
    layouts: [
      L(4, 2, { school: [0, 0, 1, 1], network: [1, 0, 1, 1], projects: [2, 0, 2, 1], email: [0, 1, 2, 1], daily: [2, 1, 2, 1] }),
      L(4, 2, { school: [0, 0, 1, 1], network: [1, 0, 1, 1], projects: [2, 0, 1, 1], gym: [3, 0, 1, 1], email: [0, 1, 2, 1], daily: [2, 1, 2, 1] }),
      L(4, 2, { email: [0, 0, 2, 1], school: [2, 0, 1, 1], network: [3, 0, 1, 1], projects: [0, 1, 1, 1], gym: [1, 1, 1, 1], daily: [2, 1, 2, 1] }),
    ],
    edits: [
      { prompt: 'add my gym streak', to: 1, focus: 'gym' },
      { prompt: 'move email to the top', to: 2, flash: 'email' },
      { prompt: 'make it pink', to: 2, accent: '#f472b6' },
    ],
  },
  montage: {
    id: 'montage', title: 'School', headline: 'any life. one prompt.', prebuilt: true,
    sub: 'built from your prompt · Mon, Oct 5',
    connect: [['gmail', 'Gmail'], ['gcal', 'Calendar'], ['canvas', 'Canvas'], ['linkedin', 'LinkedIn'], ['strava', 'Strava'], ['stripe', 'Stripe']],
    centers: [{ name: 'School', icon: 'doc', show: -1, active: true }, { name: 'Job hunt', icon: 'doc', show: 1 }, { name: 'Training', icon: 'repeat', show: 2 }, { name: 'Startup', icon: 'spark', show: 3 }],
    panels: [SCH.exam, SCH.due, SCH.profs, SCH.study, JOB.pipe, JOB.recruiters, JOB.interviews, JOB.opens, RUN.miles, RUN.long, RUN.gym, RUN.sleep, BIZ.mrr, BIZ.prs, BIZ.investors, BIZ.calls],
    layouts: [
      L(3, 2, { exam: [0, 0, 1, 1], due: [1, 0, 2, 1], profs: [0, 1, 1, 1], study: [1, 1, 2, 1] }),
      L(4, 2, { pipe: [0, 0, 2, 1], recruiters: [2, 0, 2, 1], interviews: [0, 1, 2, 1], opens: [2, 1, 2, 1] }),
      L(4, 2, { miles: [0, 0, 2, 1], long: [2, 0, 1, 1], rgym: [3, 0, 1, 1], sleep: [0, 1, 4, 1] }),
      L(4, 2, { mrr: [0, 0, 2, 1], prs: [2, 0, 2, 1], investors: [0, 1, 2, 1], calls: [2, 1, 2, 1] }),
    ],
    edits: [
      { prompt: 'now one for my job hunt', to: 1, title: 'Job hunt' },
      { prompt: 'and one for marathon training', to: 2, title: 'Training', accent: '#2dd4bf' },
      { prompt: 'and one for my startup', to: 3, title: 'Startup', accent: '#8b7bff' },
    ],
  },
  week: {
    id: 'week', title: 'This week', headline: 'your week, your way.',
    prompt: "show my whole week: classes, work shifts, gym, and what's due",
    connect: [['gcal', 'Google Calendar'], ['canvas', 'Canvas']],
    centers: [{ name: 'Today', icon: 'grid', show: -1, active: true }, { name: 'This week', icon: 'clock', show: 0 }],
    panels: [
      { id: 'wk', type: 'week', title: 'Oct 5 to 11', logos: ['gcal'], count: '23 blocks', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], hours: [7, 23], blocks: [
        { d: 0, s: 9, e: 10.5, label: 'CS 161', k: 'class' }, { d: 2, s: 9, e: 10.5, label: 'CS 161', k: 'class' }, { d: 4, s: 9, e: 10.5, label: 'CS 161', k: 'class' },
        { d: 1, s: 11, e: 12.5, label: 'ECON 102', k: 'class' }, { d: 3, s: 11, e: 12.5, label: 'ECON 102', k: 'class' },
        { d: 1, s: 17, e: 21, label: 'Shift · café', k: 'work' }, { d: 3, s: 17, e: 21, label: 'Shift · café', k: 'work' }, { d: 5, s: 10, e: 16, label: 'Shift · café', k: 'work' },
        { d: 0, s: 17.5, e: 18.5, label: 'Gym', k: 'gym' }, { d: 2, s: 17.5, e: 18.5, label: 'Gym', k: 'gym' }, { d: 4, s: 7, e: 8, label: 'Gym', k: 'gym' }, { d: 6, s: 10, e: 11, label: 'Gym', k: 'gym' },
        { d: 0, s: 19.5, e: 21.5, label: 'Lab report', k: 'due' }, { d: 3, s: 22, e: 23, label: 'PSET 4 due', k: 'due' },
        { d: 2, s: 13, e: 15, label: 'PSET 4', k: 'call' }, { d: 6, s: 14, e: 16, label: 'Essay draft', k: 'call' }] },
      { id: 'due', type: 'list', title: 'Due this week', logos: ['canvas'], count: '2', items: [
        { text: 'CS 161 · PSET 4', meta: 'Thu 11:59 PM', tag: '3 days' },
        { text: 'BIO 110 · Lab report', meta: 'Mon' }] },
      { id: 'hours', type: 'stat', title: 'Work hours', icon: 'clock', value: { num: 14, suffix: ' h' }, label: 'scheduled · Tue, Thu, Sat', delta: '2 h less than last week' },
      { id: 'free', type: 'stat', title: 'Free time', icon: 'spark', value: { num: 11.5, dec: 1, suffix: ' h' }, label: 'open this week', delta: 'most of it Sunday' },
    ],
    layouts: [
      L(4, 2, { wk: [0, 0, 3, 2], due: [3, 0, 1, 1], hours: [3, 1, 1, 1] }),
      L(4, 3, { wk: [0, 0, 3, 3], due: [3, 0, 1, 1], hours: [3, 1, 1, 1], free: [3, 2, 1, 1] }),
    ],
    tour: ['wk'],
    edits: [{ prompt: 'add my free time this week', to: 1, focus: 'free' }],
  },
};

export const ORDER = ['school', 'jobhunt', 'startup', 'training', 'creator', 'people', 'home', 'liveedit', 'montage', 'week'];
