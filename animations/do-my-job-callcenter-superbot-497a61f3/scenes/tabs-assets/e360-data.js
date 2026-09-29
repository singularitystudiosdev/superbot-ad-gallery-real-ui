// e360-data.js: everything static the Einstein 360 desktop shows, plus the UI furniture icon set.
// Two rules hold everywhere in here: (1) every name, number, ticket id and address is fictional, and
// (2) the icons are UI chrome drawn by hand in the reference's line style (1.6px round-cap stroke), not marks of
// any product. The only third-party artwork in this spot is the two logo files in ../../img (see ../../img/CREDITS.txt).
// NB: the strings below use U+00A0 between a number and its unit, per the spot's copy rules.

const NB = ' ';

const ico = (inner, w = 2) => `<svg class="e3-i" viewBox="0 0 24 24" aria-hidden="true" style="--sw:${w}">${inner}</svg>`;

// ---------- icons (account-health drawers, left rail, panel chrome, queue) ----------
export const I = {
  chevron: ico('<path d="m6 9 6 6 6-6"/>'),
  bell: ico('<path d="M6 9a6 6 0 0 1 12 0c0 4.4 1.4 5.6 1.9 6.1H4.1C4.6 14.6 6 13.4 6 9Z"/><path d="M10 18.6a2.2 2.2 0 0 0 4 0"/>'),
  search: ico('<circle cx="11" cy="11" r="6.6"/><path d="m20.5 20.5-4.4-4.4"/>'),
  bill: ico('<path d="M12 3v18"/><path d="M15.8 6.6a3.6 3.6 0 0 0-3.1-1.6h-1.4a2.9 2.9 0 0 0 0 5.8h1.4a2.9 2.9 0 0 1 0 5.8h-1.4a3.6 3.6 0 0 1-3.1-1.6"/>'),
  tv: ico('<rect x="2.5" y="4.5" width="19" height="12.5" rx="1.8"/><path d="M8.5 21h7"/><path d="M12 17.2V21"/>'),
  internet: ico('<rect x="4" y="3" width="16" height="11" rx="1.6"/><path d="M2 17.6h20"/>'),
  voice: ico('<path d="M6.6 3H4.9A1.9 1.9 0 0 0 3 5.1C3.7 13 10 19.3 17.9 20a1.9 1.9 0 0 0 2.1-1.9v-1.7a1.9 1.9 0 0 0-1.5-1.9l-2.3-.5a1.9 1.9 0 0 0-1.9.7l-.9 1.2a12.3 12.3 0 0 1-5-5l1.2-.9a1.9 1.9 0 0 0 .7-1.9l-.5-2.3A1.9 1.9 0 0 0 6.6 3Z"/>'),
  home: ico('<path d="M3.5 10.4 12 3.4l8.5 7"/><path d="M5.4 9.4v10.2h13.2V9.4"/><path d="M10 19.6v-5.2h4v5.2"/>'),
  mobile: ico('<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.6h2"/>'),
  expand: ico('<path d="M14.5 4h5.5v5.5"/><path d="M20 4l-6.2 6.2"/><path d="M9.5 20H4v-5.5"/><path d="M4 20l6.2-6.2"/>', 1.8),
  check: ico('<path d="M4.8 12.6 9 16.8 19.2 6.6"/>', 2.6),
  clock: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.4V12l3 1.9"/>', 1.9),
  ticket: ico('<path d="M4 5.5h16v13H4z"/><path d="M8 9.4h8"/><path d="M8 13h5"/>', 1.8),
  notes: ico('<path d="M5 3.6h9.6L19 8v12.4H5z"/><path d="M14.2 3.6V8H19"/><path d="M8 12.4h7"/><path d="M8 16h4.6"/>', 1.8),
  actions: ico('<path d="M4 6.5h16"/><path d="M4 12h16"/><path d="M4 17.5h10"/>', 1.8),
  devices: ico('<rect x="2.5" y="4.5" width="13" height="10" rx="1.6"/><path d="M2 17.4h14"/><rect x="17.6" y="9" width="4" height="9" rx="1.1"/>', 1.8),
  headset: ico('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M2.8 13.8h2.4a1 1 0 0 1 1 1v3.6a1 1 0 0 1-1 1H4.6a1.8 1.8 0 0 1-1.8-1.8v-2.8a1 1 0 0 1 0-1Z"/><path d="M21.2 13.8h-2.4a1 1 0 0 0-1 1v3.6a1 1 0 0 0 1 1h.6a1.8 1.8 0 0 0 1.8-1.8v-2.8a1 1 0 0 0 0-1Z"/>', 1.9),
  wave: ico('<path d="M3 12h2.5l2-6 3 12 3-15 3 18 2-9H21"/>', 1.9),
  alert: ico('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.8v5.2"/><path d="M12 16.2v.1"/>', 1.7),
  okc: ico('<circle cx="12" cy="12" r="8.6"/><path d="m8.2 12.3 2.6 2.6 5-5.2"/>', 1.7),
  avatar: ico('<circle cx="12" cy="8.6" r="3.9"/><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0"/>', 1.8),
};

// the small green "verified" disc (header) and the device check discs
export const checkDisc = (cls = '') => `<svg class="e3-cd ${cls}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M6.6 12.4 10.4 16.2 17.4 8.4"/></svg>`;

// ---------- the four inbound calls the main pane works through, in order ----------
// Each one drives: the customer header, the SmartConnect two statements, the pressed solution, the two transcript
// lines, the repairs ticket that flips to CLOSED, and the disposition the queue row lands on.
export const CALLS = [
  {
    name: 'Nora Bennett',
    initials: 'NB',
    account: '8492047713956208',
    plan: 'Super Fast',
    phone: '(215) 555-0188',
    tenure: `6${NB}years`,
    city: 'Philadelphia, PA',
    temp: '72°',
    date: 'Mon, Sep 28, 2026',
    time: '10:41 AM EST',
    reason: 'Slow Internet',
    cause: 'Old Modem',
    solutions: ['Check for Outage', 'Internet Check ITG', 'Upgrade Modem'],
    press: 1,                        // which solution superbot clicks
    ask: 'My internet’s been crawling all morning.',
    reply: 'I ran the Internet Check ITG and refreshed your modem. You’re back to full speed.',
    related: [
      ['XB7-4410', `The XB7 gateway reported low downstream signal on 3 of 32 channels.`, `2${NB}days ago`],
      ['SPD-0192', `Speed tests averaged 38${NB}Mbps against a 400${NB}Mbps plan.`, `Today`],
    ],
    ticket: 'Internet · Slow Speeds · Modem refresh',
    ticketId: 'CR70542637',
    disposition: 'Modem refreshed',
  },
  {
    name: 'Marcus Reed',
    initials: 'MR',
    account: '7391180455620314',
    plan: 'Internet + TV',
    phone: '(610) 555-0143',
    tenure: `2${NB}years`,
    city: 'Camden, NJ',
    temp: '74°',
    date: 'Mon, Sep 28, 2026',
    time: '10:44 AM EST',
    reason: 'Billing Correction',
    cause: 'Equipment rental charged twice',
    solutions: ['Review Charges', 'Billing Correction', 'Offer Promo'],
    press: 1,
    ask: 'You billed me rental twice this month.',
    reply: 'You’re right, it posted twice. I’ve credited $40 back to your account.',
    related: [
      ['BIL-2231', 'Duplicate equipment charge detected on last statement.', `3${NB}days ago`],
      ['BIL-2240', 'Gateway rental posted twice on Sep 01, 2026 ($40.00).', `27${NB}days ago`],
    ],
    ticket: 'Billing Correction · Duplicate Equipment Rental',
    ticketId: 'CR70542801',
    disposition: 'Refund $40',
  },
  {
    name: 'Priya Shah',
    initials: 'PS',
    account: '6155702839144077',
    plan: 'Digital Starter',
    phone: '(856) 555-0126',
    tenure: `9${NB}years`,
    city: 'Cherry Hill, NJ',
    temp: '73°',
    date: 'Mon, Sep 28, 2026',
    time: '10:47 AM EST',
    reason: 'TV: No Signal',
    cause: 'Box out of date',
    solutions: ['Check for Outage', 'Refresh TV box', 'Send Technician'],
    press: 1,
    ask: 'Channel 4 just says no signal.',
    reply: 'I’ve refreshed your X1 box. The picture is back in about two minutes.',
    related: [
      ['XRE-03047', 'An automated check determined the customer’s X1 box had a DVR problem appear (XRE-03047).', `2${NB}days ago`],
      ['XRE-03112', 'The X1 box missed its last 2 guide updates.', `Today`],
    ],
    ticket: 'TV · No Signal · Box refreshed',
    ticketId: 'CR70542944',
    disposition: 'Box refreshed',
  },
];

// ---------- the inbound queue: 12 fictional callers, newest first ----------
// tIn / tAns / tRes are seconds on the desktop clock (see e360.js ANSWER / WINS; the three rows with `call` are
// answered exactly when their call takes the main pane and resolve when its ticket closes). Every row rings, is answered in
// Sam's own voice, and lands on a disposition; the last one clears at the end of the beat.
export const QUEUE = [
  { name: 'Nora Bennett', initials: 'NB', reason: 'Slow Internet', wait: '0:12', tIn: 8.70, tAns: 8.90, tRes: 11.06, disp: 'Modem refreshed', call: 0 },
  { name: 'Marcus Reed', initials: 'MR', reason: 'Billing Correction', wait: '0:21', tIn: 9.30, tAns: 11.60, tRes: 13.52, disp: 'Refund $40', call: 1 },
  { name: 'Priya Shah', initials: 'PS', reason: 'TV: No Signal', wait: '0:34', tIn: 9.90, tAns: 14.00, tRes: 15.68, disp: 'Box refreshed', call: 2 },
  { name: 'Dana Whitfield', initials: 'DW', reason: 'Outage in 19103', wait: '0:46', tIn: 10.40, tAns: 10.95, tRes: 12.60, disp: 'Credit applied' },
  { name: 'Owen Pike', initials: 'OP', reason: 'Slow Internet', wait: '1:02', tIn: 10.90, tAns: 11.35, tRes: 13.10, disp: 'Modem refreshed' },
  { name: 'Grace Lin', initials: 'GL', reason: 'TV: No Signal', wait: '1:18', tIn: 11.40, tAns: 11.80, tRes: 13.45, disp: 'Box refreshed' },
  { name: 'Tom Alvarez', initials: 'TA', reason: 'Billing Correction', wait: '1:31', tIn: 11.90, tAns: 12.30, tRes: 14.20, disp: 'Refund $18' },
  { name: 'Rachel Kim', initials: 'RK', reason: 'Mobile line slow', wait: '1:44', tIn: 12.40, tAns: 12.85, tRes: 14.55, disp: 'Line reprovisioned' },
  { name: 'Hassan Idris', initials: 'HI', reason: 'Slow Internet', wait: '1:56', tIn: 12.90, tAns: 13.35, tRes: 15.20, disp: 'Modem refreshed' },
  { name: 'Erin Novak', initials: 'EN', reason: 'Outage in 08103', wait: '2:08', tIn: 13.40, tAns: 13.85, tRes: 15.60, disp: 'Credit applied' },
  { name: 'Luis Moreno', initials: 'LM', reason: 'TV: No Signal', wait: '2:19', tIn: 13.90, tAns: 14.35, tRes: 15.92, disp: 'Box refreshed' },
  { name: 'Bea Cottrell', initials: 'BC', reason: 'Billing Correction', wait: '2:31', tIn: 14.40, tAns: 14.75, tRes: 16.02, disp: 'Refund $25' },
];

// ---------- the Activity tab: past calls superbot reads on the LEARN beat ----------
// The four solution names the HUD lifts out of these rows are the ones the brief names (SmartConnect / ITG style).
export const ACTIVITY = [
  ['Nora Bennett', 'Slow Internet', 'Internet Check ITG', 'Resolved', '4:12'],
  ['Marcus Reed', 'Billing Correction', 'Billing Correction', 'Resolved', '2:47'],
  ['Priya Shah', 'TV: No Signal', 'Refresh TV box', 'Resolved', '6:03'],
  ['Dana Whitfield', 'Outage', 'Check for Outage', 'Credit issued', '1:58'],
  ['Owen Pike', 'Slow Internet', 'Internet Check ITG', 'Resolved', '5:21'],
  ['Grace Lin', 'TV: No Signal', 'Refresh TV box', 'Resolved', '3:34'],
  ['Tom Alvarez', 'Billing Correction', 'Billing Correction', 'Refunded', '4:48'],
  ['Rachel Kim', 'Mobile line slow', 'Check for Outage', 'Resolved', '2:16'],
  ['Hassan Idris', 'Slow Internet', 'Internet Check ITG', 'Resolved', '7:02'],
  ['Erin Novak', 'Outage', 'Check for Outage', 'Credit issued', '2:39'],
  ['Luis Moreno', 'TV: No Signal', 'Refresh TV box', 'Resolved', '3:11'],
  ['Bea Cottrell', 'Billing Correction', 'Billing Correction', 'Refunded', '5:55'],
  ['Sam Iyer', 'Slow Internet', 'Internet Check ITG', 'Resolved', '4:05'],
  ['Jules Fontaine', 'TV: No Signal', 'Refresh TV box', 'Resolved', '2:52'],
];

// what the HUD extracts from those rows on the LEARN beat
export const RESOLVERS = ['Check for Outage', 'Internet Check ITG', 'Billing Correction', 'Refresh TV box'];

// the four HUD checklist rows
export const STEPS = [
  'Connected to Comcast',
  'Voice matched',
  'Learned from 1,284 calls',
  'Answering calls',
];

// the header the desktop carries when no call is live
export const IDLE = {
  name: 'No call connected',
  account: 'Awaiting lookup',
  plan: '',
  phone: '',
  tenure: '',
  city: '',
  temp: '',
  date: 'Mon, Sep 28, 2026',
  time: '10:39 AM EST',
};

// the older tickets already on the account (the reference's Repairs list), under this shift's new ones
export const OLD_TICKETS = [
  ['Billing Correction · Not Subscribed', 'May 16, 2026, 11:02 AM EDT', 'CR70542237'],
  ['CDV · Failed CDV Install', 'May 16, 2026, 11:02 AM EDT', 'CR70542219'],
];

export const NBSP = NB;