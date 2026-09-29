// wealthbox-data.js: everything static the rebuilt Wealthbox desk shows, plus its UI furniture icon set.
// The rules that hold everywhere in here:
//  (1) No person is named. A request is identified by its situation and its account registration, never by a name,
//      and no account number is shown.
//  (2) Every dollar figure, rate, date, limit, form number and ticker is real and comes from a published source;
//      each record carries `src` (the URL it was taken from, checked 2026-09-29). The research pack with the verbatim
//      quotes is /tmp/fa-facts.38facc16 (facts.json, src/*.txt) and the prices are /tmp/fa-mkt.38facc16/market.json.
//  (3) The client questions, the task titles and the drafted reply lines are the ad's own copy: plain restatements
//      of those sourced facts, nothing beyond them. Text inside “quotes” is verbatim from the named source.
//  (4) Every count on screen is the literal number of items on screen (12 requests, 12 tasks, 14 notes).
// The icons are UI chrome drawn by hand (1.8px round-cap stroke), not Wealthbox's helium-icons files.
// NB: U+00A0 sits between a number and the word it counts (the spot's copy rule); no em or en dash anywhere.

const NB = ' ';

// ---------- sources ----------
export const SRC = {
  p590b: 'https://www.irs.gov/pub/irs-pdf/p590b.pdf',
  fw4r: 'https://www.irs.gov/pub/irs-pdf/fw4r.pdf',
  ir111: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500',
  n2567: 'https://www.irs.gov/pub/irs-drop/n-25-67.pdf',
  td10033: 'https://www.federalregister.gov/documents/2025/09/16/2025-17865/catch-up-contributions',
  ir117: 'https://www.irs.gov/newsroom/treasury-irs-issue-guidance-on-trump-accounts-established-under-the-working-families-tax-cuts-notice-announces-upcoming-regulations',
  n2568: 'https://www.irs.gov/pub/irs-drop/n-25-68.pdf',
  rp2519: 'https://www.irs.gov/pub/irs-drop/rp-25-19.pdf',
  usc151: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section151&num=0&edition=prelim',
  usc164: 'https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section164&num=0&edition=prelim',
  ir103: 'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill',
  ssa: 'https://www.ssa.gov/news/en/press/releases/2025-10-24.html',
  cms: 'https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles',
  medicare: 'https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan',
  adv: 'https://www.sec.gov/about/forms/formadv-instructions.pdf',
  regsp: 'https://www.sec.gov/newsroom/press-releases/2024-58',
  regspFr: 'https://www.federalregister.gov/documents/2024/06/03/2024-11116/regulation-s-p-privacy-of-consumer-financial-information-and-safeguarding-customer-information',
  prices: 'Yahoo v8 chart API and api.nasdaq.com historical closes, 2025-12-31 and 2026-09-28 (/tmp/fa-mkt.38facc16/market.json)',
  vanguard: 'Vanguard fund data API, expense ratios (/tmp/fa-mkt.38facc16/market.json)',
  wbSchwab: 'https://www.wealthbox.com/integrations/charles-schwab/',
};

const ico = (inner, w = 1.8) => `<svg class="wb-i" viewBox="0 0 24 24" aria-hidden="true" style="--sw:${w}">${inner}</svg>`;

// ---------- icons (sidenav, header tools, activity types, buttons) ----------
export const I = {
  menu: ico('<path d="M4 6.5h16"/><path d="M4 12h16"/><path d="M4 17.5h16"/>', 2),
  search: ico('<circle cx="11" cy="11" r="6.6"/><path d="m20.5 20.5-4.4-4.4"/>', 2),
  plus: ico('<path d="M12 5v14"/><path d="M5 12h14"/>', 2.2),
  help: ico('<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2v.1"/>'),
  bell: ico('<path d="M6 9a6 6 0 0 1 12 0c0 4.4 1.4 5.6 1.9 6.1H4.1C4.6 14.6 6 13.4 6 9Z"/><path d="M10 18.6a2.2 2.2 0 0 0 4 0"/>'),
  caret: ico('<path d="m6 9 6 6 6-6"/>', 2),
  home: ico('<path d="M3.5 10.4 12 3.4l8.5 7"/><path d="M5.4 9.4v10.2h13.2V9.4"/>'),
  ai: ico('<path d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9Z"/><path d="M18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8Z"/>'),
  email: ico('<rect x="3" y="5.5" width="18" height="13" rx="1.6"/><path d="m3.6 6.4 8.4 6.6 8.4-6.6"/>'),
  contacts: ico('<circle cx="9" cy="8.6" r="3.4"/><path d="M2.8 19.4a6.4 6.4 0 0 1 12.4 0"/><path d="M15.6 5.6a3.2 3.2 0 0 1 0 6.2"/><path d="M18.2 13.6a6 6 0 0 1 3 5.8"/>'),
  tasks: ico('<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="2"/><path d="m7.8 12.2 3 3 5.6-6"/>'),
  workflows: ico('<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="12" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M8.4 6h3.2a2.4 2.4 0 0 1 2.4 2.4v1.2a2.4 2.4 0 0 0 1.6 2.3"/><path d="M8.4 18h3.2a2.4 2.4 0 0 0 2.4-2.4v-1.2a2.4 2.4 0 0 1 1.6-2.3"/>'),
  meetings: ico('<rect x="2.8" y="6.2" width="12.6" height="11.6" rx="1.8"/><path d="m15.4 10.4 5.8-3.2v9.6l-5.8-3.2"/>'),
  calendar: ico('<rect x="3.4" y="4.8" width="17.2" height="15.4" rx="1.8"/><path d="M3.4 9.6h17.2"/><path d="M8 3v3.4"/><path d="M16 3v3.4"/>'),
  opportunities: ico('<circle cx="12" cy="12" r="8.6"/><path d="M14.6 9.2a2.6 2.6 0 0 0-2.4-1.4h-.6a2.1 2.1 0 0 0 0 4.2h.8a2.1 2.1 0 0 1 0 4.2h-.7a2.6 2.6 0 0 1-2.4-1.4"/><path d="M12 6.4v1.4"/><path d="M12 16.2v1.4"/>'),
  projects: ico('<path d="M3.4 7.2a1.8 1.8 0 0 1 1.8-1.8h4.2l2 2.2h7.4a1.8 1.8 0 0 1 1.8 1.8v8.4a1.8 1.8 0 0 1-1.8 1.8H5.2a1.8 1.8 0 0 1-1.8-1.8Z"/>'),
  files: ico('<path d="M6 3.5h8.4L19 8v12.5H6z"/><path d="M14.2 3.5V8H19"/>'),
  reports: ico('<path d="M4 20V11"/><path d="M10 20V5"/><path d="M16 20v-7"/><path d="M21 20H3"/>'),
  dashboards: ico('<rect x="3.4" y="3.4" width="7.4" height="9" rx="1.4"/><rect x="13.2" y="3.4" width="7.4" height="5.4" rx="1.4"/><rect x="3.4" y="14.8" width="7.4" height="5.8" rx="1.4"/><rect x="13.2" y="11.2" width="7.4" height="9.4" rx="1.4"/>'),
  note: ico('<path d="M5 3.6h14v11.2l-5.6 5.6H5z"/><path d="M13.4 20.4v-5.6H19"/><path d="M8.4 8.4h7.2"/><path d="M8.4 11.8h4.4"/>'),
  check: ico('<path d="M4.8 12.6 9 16.8 19.2 6.6"/>', 2.6),
  star: ico('<path d="m12 3.6 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8L8 13.6l-4.3-4 5.8-.7Z"/>', 1.6),
  phone: ico('<path d="M6.6 3H4.9A1.9 1.9 0 0 0 3 5.1C3.7 13 10 19.3 17.9 20a1.9 1.9 0 0 0 2.1-1.9v-1.7a1.9 1.9 0 0 0-1.5-1.9l-2.3-.5a1.9 1.9 0 0 0-1.9.7l-.9 1.2a12.3 12.3 0 0 1-5-5l1.2-.9a1.9 1.9 0 0 0 .7-1.9l-.5-2.3A1.9 1.9 0 0 0 6.6 3Z"/>'),
  calc: ico('<rect x="5" y="3" width="14" height="18" rx="1.8"/><path d="M8.4 7.4h7.2"/><path d="M8.6 11.6h.1"/><path d="M12 11.6h.1"/><path d="M15.4 11.6h.1"/><path d="M8.6 15.6h.1"/><path d="M12 15.6h.1"/><path d="M15.4 15.6h.1"/>', 2),
  person: ico('<circle cx="12" cy="8.4" r="3.9"/><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0"/>'),
  link: ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  dots: ico('<path d="M5.5 12h.1"/><path d="M12 12h.1"/><path d="M18.5 12h.1"/>', 3),
};

// ---------- the date on the desk: the day of the market closes the model panel uses ----------
export const DESK = { date: 'Sep 28, 2026', weekday: 'Mon' };

// ---------- the three requests the main pane answers, in order ----------
// Each drives: the contact header card (situation, registration, tags, two key figures), the answer card (what the
// client asked, the rule quoted verbatim with its source, the math, the action pills, the drafted reply), the task
// that flips to done and the line the inbox row lands on.
export const REQUESTS = [
  {
    badge: 'IRA',
    title: 'Turns 75 in 2026, spouse 6 years younger',
    reg: 'Traditional IRA',
    topic: '2026 RMD',
    tags: ['Traditional IRA', 'RMD', 'Spouse sole beneficiary'],
    figures: [['$100,000', 'Balance, end of 2025'], ['Dec 31, 2026', '2026 RMD deadline']],
    asked: 'What is my 2026 required minimum distribution?',
    ask: 'I turn 75 this year and my spouse is 6 years younger. How much do I have to take from my IRA in 2026?',
    quote: '“Your required minimum distribution for 2026 would be $4,065 ($100,000 ÷ 24.6).”',
    source: 'IRS Pub. 590-B (2025)',
    math: [['Balance, end of 2025', '$100,000'], ['Table III, age 75', '÷ 24.6'], ['2026 RMD', '$4,065']],
    actions: [`Schedule $4,065 from Schwab`, 'Withhold 10% (Form W-4R)', 'Missed RMD: Form 5329'],
    press: 0,
    draft: [
      'Your 2026 RMD is $4,065: your $100,000 balance at the end of 2025 divided by 24.6.',
      'I scheduled it from your Schwab IRA before Dec 31, 2026, with 10% withheld by default.',
      'A missed RMD carries a 25% excise tax, or 10% if corrected in time.',
    ],
    task: 'Schedule 2026 RMD of $4,065',
    taskSub: 'Due Dec 31, 2026',
    cat: 'RMD',
    tone: 'blue',
    mark: 'Pub. 590-B',
    disp: 'RMD of $4,065 scheduled',
    src: [SRC.p590b, SRC.fw4r],
  },
  {
    badge: '401k',
    title: 'Age 50 or older, 2025 FICA wages over $150,000',
    reg: '401(k)',
    topic: '2026 catch-up',
    tags: ['401(k)', 'Catch-up', 'Roth'],
    figures: [['$32,500', '2026 limit with catch-up'], ['$150,000', '2025 FICA wage threshold']],
    asked: 'Can my 2026 catch-up still go in pre-tax?',
    ask: 'My 2025 wages were over $150,000. Can my 401(k) catch-up this year still go in pre-tax?',
    quote: '“The Roth catch-up wage threshold for 2025 … is increased from $145,000 to $150,000.”',
    source: 'IRS Notice 2025-67',
    math: [['2026 deferral limit', '$24,500'], ['Catch-up, age 50+', '$8,000'], ['Total, age 50+', '$32,500']],
    actions: ['Set $8,000 catch-up as Roth', 'Note 2026 limit $24,500', 'Ages 60 to 63: $11,250'],
    press: 0,
    draft: [
      'Your 2025 FICA wages topped $150,000, so your 2026 catch-up must be designated Roth.',
      'The 2026 limits are $24,500 plus an $8,000 catch-up, $32,500 in all.',
      'If you are 60 to 63 in 2026, the catch-up limit is $11,250 instead.',
    ],
    task: 'Set 2026 catch-up to Roth',
    taskSub: '401(k), wages over $150,000',
    cat: 'Retirement plan',
    tone: 'purple',
    mark: 'Notice 2025-67',
    disp: 'Catch-up set to Roth',
    src: [SRC.n2567, SRC.ir111, SRC.td10033],
  },
  {
    badge: 'TA',
    title: 'Child born in 2026, U.S. citizen',
    reg: 'Trump Account',
    topic: 'Form 4547 election',
    tags: ['Trump Account', 'Form 4547', 'Pilot program'],
    figures: [['$1,000', 'Treasury pilot contribution'], ['Jul 4, 2026', 'Contributions allowed from']],
    asked: 'Does our newborn get the $1,000 Trump Account deposit?',
    ask: 'Our baby was born this year. Do we get the $1,000 Trump Account deposit, and how do we sign up?',
    quote: '“…a one-time $1,000 pilot program contribution to the Trump Account of each eligible child…”',
    source: 'IRS IR-2025-117',
    math: [['Pilot, births 2025 to 2028', '$1,000'], ['Annual limit, all givers', '$5,000'], ['Employer, within limit', '$2,500']],
    actions: ['Elect on Form 4547', 'Open the Trump Account', 'Contributions from Jul 4, 2026'],
    press: 0,
    draft: [
      'Yes: U.S. citizens born in 2025 through 2028 get a one-time $1,000 pilot contribution.',
      'We make the election on Form 4547. Contributions have been allowed since July 4, 2026.',
      'Up to $5,000 a year can go in, including up to $2,500 from an employer.',
    ],
    task: 'Prepare Form 4547 election',
    taskSub: 'Trump Account, child born 2026',
    cat: 'Trump Account',
    tone: 'green',
    mark: 'IR-2025-117',
    disp: 'Form 4547 prepared',
    src: [SRC.ir117, SRC.n2568],
  },
];

// ---------- the inbox: 12 client requests, the three above first, then nine more ----------
// tIn / tAns / tRes are seconds on the desk clock and are the call-center spot's queue timings, row for row (the
// three `req` rows are opened exactly when their request takes the main pane and resolve when its task closes).
// Each of the nine extra rows is one sourced 2026 figure; its task sits in the Tasks card.
export const QUEUE = [
  { req: 0, tIn: 8.70, tAns: 8.90, tRes: 11.06 },
  { req: 1, tIn: 9.30, tAns: 11.60, tRes: 13.52 },
  { req: 2, tIn: 9.90, tAns: 14.00, tRes: 15.68 },
  { badge: 'IRA', title: 'Age 50 or older, adding to an IRA', sub: 'Traditional IRA, 2026 limit', disp: '2026 IRA limit $7,500',
    task: 'Send 2026 IRA limit: $7,500', taskSub: 'Catch-up at 50 or older: $1,100', cat: 'Contributions', tone: 'blue', mark: 'IR-2025-111',
    tIn: 10.40, tAns: 10.95, tRes: 12.60, src: SRC.ir111 },
  { badge: 'IRA', title: 'Giving to charity from an IRA', sub: 'IRA, qualified charitable distributions', disp: '2026 QCD cap $111,000',
    task: 'Plan QCDs under the $111,000 cap', taskSub: 'Qualified charitable distributions, 2026', cat: 'Charitable', tone: 'orange', mark: 'Notice 2025-67',
    tIn: 10.90, tAns: 11.35, tRes: 13.10, src: SRC.n2567 },
  { badge: 'MED', title: 'On Medicare Part B', sub: 'Medicare, 2026 premium', disp: 'Part B $202.90 a month',
    task: 'Budget Part B at $202.90 a month', taskSub: 'Part B deductible $283 in 2026', cat: 'Medicare', tone: 'red', mark: 'CMS',
    tIn: 11.40, tAns: 11.80, tRes: 13.45, src: SRC.cms },
  { badge: 'MED', title: 'Changing Medicare plans', sub: 'Medicare, open enrollment', disp: 'Enroll Oct 15 to Dec 7',
    task: 'Compare plans by Dec 7', taskSub: 'Open enrollment Oct 15 to Dec 7', cat: 'Medicare', tone: 'red', mark: 'Medicare.gov',
    tIn: 11.90, tAns: 12.30, tRes: 14.20, src: SRC.medicare },
  { badge: 'JT', title: 'Married, both 65 or older', sub: 'Joint account, 2026 taxes', disp: 'Senior deduction $6,000 each',
    task: 'Add senior deduction, $6,000 each', taskSub: '2025 to 2028, phases out over $150,000 joint', cat: 'Tax planning', tone: 'purple', mark: '26 USC 151',
    tIn: 12.40, tAns: 12.85, tRes: 14.55, src: SRC.usc151 },
  { badge: 'JT', title: 'High state and local taxes', sub: 'Joint account, itemizing', disp: '2026 SALT cap $40,400',
    task: 'Check SALT cap: $40,400 for 2026', taskSub: 'Phases down over $505,000, floor $10,000', cat: 'Tax planning', tone: 'purple', mark: '26 USC 164',
    tIn: 12.90, tAns: 13.35, tRes: 15.20, src: SRC.usc164 },
  { badge: 'IND', title: 'Gifting to grandchildren', sub: 'Individual account, gifts', disp: 'Annual exclusion $19,000',
    task: 'Log gifts, $19,000 exclusion', taskSub: '2026 annual gift exclusion', cat: 'Estate', tone: 'yellow', mark: 'IR-2025-103',
    tIn: 13.40, tAns: 13.85, tRes: 15.60, src: SRC.ir103 },
  { badge: 'SS', title: 'Collecting Social Security', sub: 'Income plan, 2026', disp: '2026 COLA 2.8%',
    task: 'Update income plan for 2.8% COLA', taskSub: 'Average retired worker $2,015 to $2,071', cat: 'Social Security', tone: 'blue', mark: 'SSA',
    tIn: 13.90, tAns: 14.35, tRes: 15.92, src: SRC.ssa },
  { badge: 'HSA', title: 'Family high-deductible plan', sub: 'HSA, 2026 limit', disp: 'Family limit $8,750',
    task: 'Set HSA to $8,750 family limit', taskSub: 'Self-only limit $4,400', cat: 'HSA', tone: 'green', mark: 'Rev. Proc. 2025-19',
    tIn: 14.40, tAns: 14.75, tRes: 16.02, src: SRC.rp2519 },
];
// the three request rows take their text from REQUESTS
for (const q of QUEUE) if (q.req !== undefined) {
  const r = REQUESTS[q.req];
  Object.assign(q, { badge: r.badge, title: r.title, sub: `${r.reg}, ${r.topic}`, disp: r.disp, task: r.task, taskSub: r.taskSub,
    cat: r.cat, tone: r.tone, mark: r.mark, src: r.src });
}

// ---------- the Activity tab: the advisor's past notes and emails superbot reads on the LEARN beat ----------
// [type, title, snippet, source mark]: each restates one sourced figure, the way an advisor's own client notes do.
export const ACTIVITY = [
  ['email', '2026 401(k) limits', '$24,500 deferral, $8,000 catch-up at 50 or older', 'Email', SRC.ir111],
  ['note', 'RMD review', 'Table III divisor at 75 is 24.6', 'Note', SRC.p590b],
  ['email', 'Roth catch-up rule', 'Catch-up is Roth when 2025 FICA wages top $150,000', 'Email', SRC.n2567],
  ['note', 'Medicare costs', `Part B $202.90 a month, deductible $283`, 'Note', SRC.cms],
  ['email', 'Trump Accounts', '$1,000 pilot for children born 2025 to 2028', 'Email', SRC.ir117],
  ['task', 'Withholding on IRA payouts', 'Nonperiodic default rate is 10% (Form W-4R)', 'Task', SRC.fw4r],
  ['email', 'IRA limits', '$7,500, plus $1,100 at 50 or older', 'Email', SRC.ir111],
  ['note', 'Giving from the IRA', '2026 QCD cap is $111,000', 'Note', SRC.n2567],
  ['email', 'Social Security 2026', 'COLA of 2.8% starting in January', 'Email', SRC.ssa],
  ['note', 'Senior deduction', '$6,000 each at 65 or older, 2025 to 2028', 'Note', SRC.usc151],
  ['email', 'State and local taxes', '2026 SALT cap $40,400', 'Email', SRC.usc164],
  ['note', 'Estate planning', 'Basic exclusion $15,000,000 in 2026', 'Note', SRC.ir103],
  ['email', 'Standard deduction', '$32,200 joint, $16,100 single for 2026', 'Email', SRC.ir103],
  ['task', 'HSA limits', '$4,400 self-only, $8,750 family', 'Task', SRC.rp2519],
];

// what the HUD lifts out of those notes on the LEARN beat
export const TOPICS = ['RMDs', 'Catch-up limits', 'Medicare costs', 'Trump Accounts'];

// the VOICE beat: a line in the advisor's own style from a past email, and superbot's line in that style
export const VOICE_LINES = {
  you: 'Quick note: the 2026 401(k) limit is $24,500.',
  sb: 'Quick note: the 2026 IRA limit is $7,500.',
  src: SRC.ir111,
};

// the four HUD checklist rows
export const STEPS = [
  'Connected to Wealthbox',
  'Writing matched',
  `Read ${ACTIVITY.length}${NB}past notes`,
  'Answering requests',
];

// the header card before a request is open
export const IDLE = {
  title: 'No request open',
  line1: 'Open a client request to load it here',
};

// the idle view: a Wealthbox workflow ("Steps") superbot runs as it opens the book, and the firm's compliance
// to-dos (both sourced dates; shown as they read in the rules, no fiscal year end assumed)
export const WORKFLOW = {
  name: 'Open the book',
  steps: ['Sign in to Wealthbox', 'Connect Schwab', 'Match your writing', 'Read your past notes', 'Answer client requests'],
};
export const COMPLIANCE = [
  ['Form ADV annual updating amendment', 'Within 90 days after fiscal year end', 'SEC', SRC.adv],
  ['Regulation S-P amendments', 'Smaller entities: Jun 3, 2026', 'SEC', SRC.regsp],
  ['Medicare open enrollment', 'Oct 15 to Dec 7', 'Medicare.gov', SRC.medicare],
];

// ---------- the Schwab model panel (the DEVICES beat) ----------
// A 60/40 model of three Vanguard ETFs set on Dec 31, 2025 (the ad's own illustrative model: 36 / 24 / 40), carried
// on the real closing prices to Sep 28, 2026. Weights, drift and trades are recomputed in the verification script
// (/Users/adrianagne/Documents/cosmos/projects/upload-creation-pipeline-reddit-x-ads/.tmp/fa-build.38facc16/check-numbers.mjs) and match market.json to the cent.
export const MODEL = {
  name: '60/40 model',
  set: 'Set Dec 31, 2025',
  asOf: 'Closes to Sep 28, 2026',
  rows: [
    // ticker, sleeve, model %, drifted %, drift pts, price Dec 31 -> Sep 28, expense ratio
    { tk: 'VTI', sleeve: 'US stocks', model: 36, drift: 38.22, pts: '+2.22', c0: 335.27, c1: 375.84, er: '0.03%' },
    { tk: 'VXUS', sleeve: 'Intl stocks', model: 24, drift: 25.84, pts: '+1.84', c0: 75.44, c1: 85.75, er: '0.05%' },
    { tk: 'BND', sleeve: 'US bonds', model: 40, drift: 35.94, pts: '-4.06', c0: 74.07, c1: 70.28, er: '0.03%' },
  ],
  equity: '64.06%',
  trades: ['Sell VTI 2.22 pts', 'Sell VXUS 1.84 pts', 'Buy BND 4.06 pts'],
  src: [SRC.prices, SRC.vanguard],
};

export const NBSP = NB;
