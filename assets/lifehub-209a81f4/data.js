/* data.js: one believable week for one person, shared by all five lifehub spots so every cut tells the same life.
   Today is Mon, Oct 5. Brand logos live in ./brand (see brand/CREDITS.txt). */

export const TODAY = 'Mon, Oct 5';
export const USER = 'Alex';

/** the 7 areas, in dashboard order. `logos` are brand/<name>.svg files. */
export const AREAS = [
  {
    key: 'school', title: 'School', logos: ['canvas'], count: '4 due',
    rows: [
      { text: 'CS 161 · Problem Set 4', meta: 'Thu 11:59 PM', tag: '3 days' },
      { text: 'ECON 102 · Midterm', meta: 'Oct 20', tag: 'start now', hot: true },
      { text: 'BIO 110 · Lab report', meta: 'Mon' },
      { text: 'Capstone · Proposal draft', meta: 'Oct 30', tag: 'start early' },
    ],
  },
  {
    key: 'network', title: 'Networking', logos: ['linkedin', 'gmail'], count: '3 people',
    rows: [
      { text: 'Reply to Marcus · coffee chat', meta: 'waiting 2 days', hot: true },
      { text: 'Follow up with Priya · career fair', meta: 'met Thu' },
      { text: 'Thank-you note to Prof. Alvarez', meta: 'today' },
    ],
  },
  {
    key: 'projects', title: 'Projects', logos: ['github', 'notion'], count: 'synced',
    rows: [
      { text: 'habit-tracker · ship streaks API', meta: '3 commits yesterday', tag: 'next: tests' },
      { text: 'Portfolio · write case study', meta: '60% drafted' },
      { text: 'Club site · fix sign-up form', meta: 'PR open' },
    ],
  },
  {
    key: 'apps', title: 'Applications', logos: [], icon: 'doc', count: '3 opening',
    rows: [
      { text: 'Research fellowship', meta: 'opens tomorrow 9 AM', hot: true },
      { text: 'Summer SWE internships', meta: 'open Oct 14' },
      { text: 'Hackathon registration', meta: 'closes Fri' },
    ],
  },
  {
    key: 'daily', title: 'Daily', logos: [], icon: 'repeat', count: '2 rolled over',
    rows: [
      { text: 'Read 20 pages', meta: 'every day', repeat: true },
      { text: 'LeetCode · 1 problem', meta: 'every day', repeat: true },
      { text: 'Laundry', meta: 'from Sat', tag: 'rolled ×2' },
    ],
  },
  {
    key: 'email', title: 'Email', logos: ['gmail'], count: '142 sorted',
    rows: [
      { text: 'Lena · Halcyon Labs: interview times?', meta: 'reply by Wed', hot: true },
      { text: 'Financial aid · form due Fri', meta: 'to do' },
      { text: '38 newsletters archived', meta: 'filtered', muted: true },
    ],
  },
  {
    key: 'cal', title: 'Calendar', logos: ['gcal'], count: 'today',
    rows: [
      { text: '9:00  Deep work · PSET 4', meta: 'from tasks', block: 'work' },
      { text: '11:00  ECON 102 lecture', meta: 'class', block: 'class' },
      { text: '1:00  Coffee chat · Marcus', meta: 'call', block: 'call' },
      { text: '5:30  Gym · push day', meta: '3 of 4 this week', block: 'gym' },
    ],
  },
];

export const areaByKey = Object.fromEntries(AREAS.map((a) => [a.key, a]));
