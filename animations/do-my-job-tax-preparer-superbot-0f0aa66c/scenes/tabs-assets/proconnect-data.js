// proconnect-data.js: everything static the rebuilt Intuit ProConnect Tax desk shows, plus its UI furniture icons.
// The rules that hold everywhere in here:
//  (1) No person is named and no client is invented. A return is identified by its situation label only (the
//      research pack's queue labels, verbatim); no SSN, EIN, PTIN, EFIN, submission ID or Intuit "Ref #" is shown.
//  (2) Every figure, code, date, form and line number is real. Each record carries `src`: the ids of the entries in
//      the facts pack (.tmp/tp-facts.0f0aa66c/facts.json, retrieved 2026-09-29) that it restates. The numbers audit
//      (.tmp/tp-build.0f0aa66c/check-numbers.mjs) resolves every number on screen against those entries.
//  (3) Text in “curly quotes” and every `msg` (an IRS error statement) is verbatim from the named source. The client
//      emails and the drafted replies are the ad's own copy: plain restatements of the sourced facts, nothing more.
//  (4) Every count on screen is the literal number of items on screen (12 returns, 14 past returns, 6 rejected).
//  (5) Two values are not from the facts pack: the ad clock (Tue Sep 29, 2026, set by the brief) and the days
//      left to Oct 15 (calendar arithmetic from that clock); both are marked `derived` below.
// The icons are UI chrome drawn by hand (1.8px round-cap stroke), not Intuit's icon files.
// NB: U+00A0 sits between a number and the word it counts (the spot's copy rule); no em or en dash anywhere.

const NB = ' ';

const ico = (inner, w = 1.8) => `<svg class="pc-i" viewBox="0 0 24 24" aria-hidden="true" style="--sw:${w}">${inner}</svg>`;

// ---------- icons (nav rail, top bar, tabs, cells, buttons) ----------
export const I = {
  returns: ico('<rect x="7.5" y="3.5" width="12" height="15" rx="1.6"/><path d="M4.5 7v11.9a1.6 1.6 0 0 0 1.6 1.6h9.4"/>'),
  clients: ico('<circle cx="9" cy="8.6" r="3.4"/><path d="M2.8 19.4a6.4 6.4 0 0 1 12.4 0"/><path d="M15.6 5.6a3.2 3.2 0 0 1 0 6.2"/><path d="M18.2 13.6a6 6 0 0 1 3 5.8"/>'),
  efile: ico('<path d="M9 6.5h11"/><path d="M9 12h11"/><path d="M9 17.5h11"/><path d="M4.4 6.5h.1"/><path d="M4.4 12h.1"/><path d="M4.4 17.5h.1"/>', 2),
  link: ico('<rect x="5" y="4.5" width="14" height="16" rx="1.8"/><path d="M9 3.5h6v2.6H9z"/><path d="m9 13 2.2 2.2L15.4 11"/>'),
  reporting: ico('<rect x="3.5" y="5" width="17" height="14" rx="1.8"/><path d="M3.5 9.5h17"/><path d="M8 5v14"/>'),
  advisor: ico('<circle cx="12" cy="12" r="8.6"/><path d="m8.4 15.8 3.6-8 3.6 8"/><path d="M9.6 13.2h4.8"/>'),
  qb: ico('<rect x="4" y="9" width="9" height="11" rx="1.2"/><path d="M13 12h6.2a.8.8 0 0 1 .8.8V20h-7"/><circle cx="8.5" cy="5.2" r="2.2"/><path d="M6.6 13h3.8"/><path d="M6.6 16.4h3.8"/>'),
  all: ico('<rect x="4" y="4" width="6.4" height="6.4" rx="1.6"/><rect x="13.6" y="4" width="6.4" height="6.4" rx="1.6"/><rect x="4" y="13.6" width="6.4" height="6.4" rx="1.6"/><rect x="13.6" y="13.6" width="6.4" height="6.4" rx="1.6"/>'),
  purchase: ico('<rect x="3.5" y="6" width="17" height="12.5" rx="1.8"/><circle cx="12" cy="12.2" r="2.6"/><path d="M6.5 9.2h.1"/><path d="M17.5 15.2h.1"/>'),
  collapse: ico('<path d="M9 6.5h11"/><path d="M9 12h11"/><path d="M9 17.5h11"/><path d="m3.5 9 3 3-3 3"/>', 2),
  help: ico('<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2v.1"/>'),
  bell: ico('<path d="M6 9a6 6 0 0 1 12 0c0 4.4 1.4 5.6 1.9 6.1H4.1C4.6 14.6 6 13.4 6 9Z"/><path d="M10 18.6a2.2 2.2 0 0 0 4 0"/>'),
  gear: ico('<circle cx="12" cy="12" r="3"/><path d="M12 3.2v2.4M12 18.4v2.4M3.2 12h2.4M18.4 12h2.4M5.8 5.8l1.7 1.7M16.5 16.5l1.7 1.7M5.8 18.2l1.7-1.7M16.5 7.5l1.7-1.7"/>'),
  person: ico('<circle cx="12" cy="8.4" r="3.9"/><path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0"/>'),
  caret: ico('<path d="m6 9 6 6 6-6"/>', 2),
  check: ico('<path d="M4.8 12.6 9 16.8 19.2 6.6"/>', 2.6),
  send: ico('<path d="M5 4.5 20 12 5 19.5l2.4-7.5Z"/><path d="M7.4 12H13"/>'),
  pencil: ico('<path d="M15.5 4.5 19.5 8.5 8.5 19.5H4.5v-4Z"/><path d="m13 7 4 4"/>'),
  clip: ico('<rect x="5" y="4.5" width="14" height="16" rx="1.8"/><path d="M9 3.5h6v2.6H9z"/><path d="M8.5 12h7"/><path d="M8.5 15.6h4.5"/>'),
  flask: ico('<path d="M9.5 3.5h5"/><path d="M10.5 3.5v5.2L5.2 18a1.6 1.6 0 0 0 1.4 2.4h10.8a1.6 1.6 0 0 0 1.4-2.4l-5.3-9.3V3.5"/><path d="M7.6 14.5h8.8"/>'),
  profile: ico('<circle cx="9" cy="8.6" r="3.4"/><path d="M2.8 19.4a6.4 6.4 0 0 1 12.4 0"/><path d="M15.6 5.6a3.2 3.2 0 0 1 0 6.2"/><path d="M18.2 13.6a6 6 0 0 1 3 5.8"/>'),
  refresh: ico('<path d="M19.5 12a7.5 7.5 0 0 1-13.2 4.9"/><path d="M4.5 12a7.5 7.5 0 0 1 13.2-4.9"/><path d="M18 3.8v3.6h-3.6"/><path d="M6 20.2v-3.6h3.6"/>'),
  download: ico('<path d="M12 4v11"/><path d="m7.5 10.8 4.5 4.5 4.5-4.5"/><path d="M4.5 19.5h15"/>'),
  pending: ico('<circle cx="12" cy="12" r="8"/>', 2),
};

// ---------- the ad clock and the deadline ----------
export const DESK = {
  date: 'Sep 29, 2026', weekday: 'Tue', stamp: '09/29/2026',   // derived: the ad clock set by the brief
  due: 'Thu Oct 15, 2026',                                      // A-01 (weekday: calendar arithmetic, per A-01's note)
  dueShort: 'Oct 15',
  daysLeft: 16,                                                 // derived: Sep 29 to Oct 15, 2026
  taxYear: '2025',
  src: ['A-01'],
};

// ---------- the three returns the main pane answers, in order: the IRS/Treasury worked examples D-01..D-03 ----------
// Each drives the return header (situation, Tax Year, Return type, a third meta), the answer card (the client's email,
// the example quoted verbatim with its source, the math, the checks, the drafted reply), its E-File dashboard row and
// the line its queue row lands on. Tips and overtime stop at the Schedule 1-A input line: the IRS gives no MAGI for
// them, so no phase-out is shown. The car loan example runs to its $2,000 result.
export const REQUESTS = [
  {
    badge: 'TIPS',
    title: 'Tips paid through a 1099-K platform',
    meta3: ['Schedule 1-A', 'line 5'],
    tags: ['Self-employed travel guide', 'Form 1099-K'],
    asked: 'Can I deduct the tips on my 1099-K?',
    ask: 'My 1099-K shows $55,000 of total payments, and $7,000 of it is customer tips. I keep a daily tip log.',
    quote: '“…you can use the $7,000 tip amount to figure your deduction for qualified tips. You enter $7,000 on Schedule 1-A, line 5.”',
    source: 'Instructions for Schedule 1-A (2025), Example 2',
    math: [['Form 1099-K, total payments', '$55,000'], ['Customer tips, daily tip log', '$7,000'], ['Schedule 1-A, line 5', '$7,000']],
    draft: [
      'Your 1099-K shows $55,000 of total payments, and $7,000 of that is customer tips.',
      'Your daily tip log backs up the $7,000, so it goes on Schedule 1-A, line 5.',
      'The deduction is capped at $25,000, whatever your filing status.',
    ],
    code: 'Sch 1-A line 5',
    disp: 'Schedule 1-A line 5: $7,000',
    init: 'Not e-filed',
    src: ['D-01-in', 'D-01-out', 'C-17', 'C-25'],
  },
  {
    badge: 'OT',
    title: 'Overtime at time-and-a-half',
    meta3: ['Schedule 1-A', 'Part III'],
    tags: ['FLSA-eligible employee'],
    asked: 'How much of my overtime pay is deductible?',
    ask: 'In 2025 I got $50,000 in regular pay and $15,000 for overtime hours worked. How much of it counts?',
    quote: '“You can include $5,000 of your wages for the overtime hours when figuring your deduction for qualified overtime compensation.”',
    source: 'Instructions for Schedule 1-A (2025), Part III, Example 1',
    math: [['Regular pay', '$50,000'], ['Pay for overtime hours', '$15,000'], ['The “half”: $15,000 / 3', '$5,000']],
    draft: [
      'Only the “half” of time-and-a-half counts: $15,000 divided by 3 is $5,000.',
      'So $5,000 of your overtime pay goes into the deduction on Schedule 1-A, Part III.',
      'The cap is $12,500, or $25,000 if married filing jointly.',
    ],
    code: 'Sch 1-A Part III',
    disp: 'Schedule 1-A Part III: $5,000',
    init: 'Not e-filed',
    src: ['D-02-in', 'D-02-out', 'C-26', 'C-28'],
  },
  {
    badge: 'CAR',
    title: 'Interest on new U.S.-assembled car',
    meta3: ['Filing status', 'Single'],
    tags: ['Single', 'MAGI $124,200'],
    asked: 'How much of my car loan interest can I deduct?',
    ask: 'I paid $7,000 of interest on my new car loan this year. I file single and my MAGI is $124,200.',
    quote: '“The maximum amount of QPVLI that A can deduct for the taxable year is $2,000.”',
    source: 'Treas. Reg. 1.163-16(h)(3)(ii), Example 2 (T.D. 10054)',
    math: [['Interest paid (QPVLI)', '$7,000'], ['Reduced by $200 x 25', '$5,000'], ['Schedule 1-A, line 30', '$2,000']],
    draft: [
      'Your MAGI of $124,200 is $24,200 over $100,000, so the $7,000 is reduced by $5,000.',
      'That is $200 for each $1,000 over, rounded up to 25. You can deduct $2,000.',
      'The VIN goes on Schedule 1-A, line 22, column (i), and the car must be U.S.-assembled.',
    ],
    code: 'Sch 1-A line 30',
    disp: 'Schedule 1-A line 30: $2,000',
    init: 'Not e-filed',
    src: ['D-03-in', 'D-03-out', 'D-03-calc', 'C-14', 'C-29', 'C-30', 'C-31', 'E-07'],
  },
];
// where every Schedule 1-A deduction lands on the 2025 Form 1040 (shown under each answer's math)
export const FLOW = { text: 'Schedule 1-A line 38 to Form 1040 line 13b', src: ['C-11', 'C-07'] };
// the answer card's checks before the return is e-filed: the product's three diagnostics headings (each shows its
// count, 0, only once superbot has run it; no nonzero count is ever claimed), Form 8879 (Pub 1345) and E-file ready
export const CHECKS = [
  { label: 'Fatal Diagnostics', val: '0' },
  { label: 'EF Critical Diagnostics', val: '0' },
  { label: 'Suggestions', val: '0' },
  { label: 'Form 8879 signed', val: '', src: ['C-49'] },
  { label: 'E-file ready', val: '' },
];

// ---------- the extension queue: the research pack's 12-row queue table, labels and fixes verbatim ----------
// tIn / tAns / tRes are seconds on the desk clock (the call-center spot's queue slots; the four rejects of the ack
// beat are re-slotted so each gets its own window in the Rejected ack card). `init` is the federal e-file status the
// return starts in; from tAns it reads Received by Intuit, then Received by agency, and from tRes Accepted.
export const QUEUE = [
  { req: 0, row: 1, tIn: 8.70, tAns: 8.90, tRes: 11.06 },
  { row: 4, label: 'Prior-year AGI rejected (IND-031-04)', fix: 'Use AGI from originally filed 2024 return (not 1040-X), or an IP PIN',
    code: 'IND-031-04', init: 'Rejected', disp: 'Resubmitted with 2024 AGI', tIn: 8.95, tAns: 9.20, tRes: 9.90, src: ['B-14', 'B-15', 'B-17', 'E-01'] },
  { req: 1, row: 2, tIn: 9.30, tAns: 11.60, tRes: 13.52 },
  // row 5's label is overridden (the pack reads "IP PIN missing (IND-181-01)") so it agrees with the IRS statement the
  // ack card shows for this rule, B-19: "The Identity Protection PIN (IP PIN) entered for the primary taxpayer is not valid."
  { row: 5, label: 'IP PIN not valid (IND-181-01)', labelOverride: { pack: 'IP PIN missing (IND-181-01)', src: 'B-19' }, fix: 'Enter the 6-digit IP PIN; retrieve at IRS.gov/getanippin',
    code: 'IND-181-01', init: 'Rejected', disp: 'Resubmitted with the IP PIN', tIn: 9.60, tAns: 10.80, tRes: 11.70, src: ['B-19', 'B-20', 'E-02'] },
  { req: 2, row: 3, tIn: 9.90, tAns: 14.00, tRes: 15.68 },
  { row: 6, label: 'Child claimed elsewhere (IND-507-01)', fix: 'Verify the SSN; if correct, e-file with an IP PIN or paper-file',
    code: 'IND-507-01', init: 'Rejected', disp: 'SSN verified, IP PIN added', tIn: 10.30, tAns: 12.60, tRes: 13.50, src: ['B-25', 'B-26', 'E-03'] },
  { row: 7, label: 'APTC but no Form 8962 (F8962-070)', fix: 'Complete Form 8962 from Form 1095-A and resubmit',
    code: 'F8962-070', init: 'Rejected', disp: 'Form 8962 added from 1095-A', tIn: 10.70, tAns: 14.40, tRes: 15.30, src: ['B-32', 'B-33', 'B-45', 'E-04'] },
  { row: 8, label: 'Senior deduction reject (S1A-F1040-026)', fix: 'IRS fixed the rule 2/22/2026; confirm DOB before 1/2/1961, resubmit',
    code: 'S1A-F1040-026', init: 'Rejected', disp: 'DOB confirmed, resubmitted', tIn: 11.20, tAns: 11.40, tRes: 12.90, src: ['B-34', 'C-37', 'E-05'] },
  { row: 9, label: 'Dependent filed own return (IND-517-02)', fix: 'Wait for dependent\'s accepted amended return, or paper-file',
    code: 'IND-517-02', init: 'Rejected', disp: 'Filed after the amended return', tIn: 11.70, tAns: 12.00, tRes: 14.00, src: ['B-29', 'E-06'] },
  { row: 10, label: 'Car-loan deduction without a VIN', fix: 'Enter the VIN on Schedule 1-A line 22, column (i)',
    code: 'Sch 1-A line 22', init: 'Not e-filed', disp: 'VIN on line 22, column (i)', tIn: 12.20, tAns: 12.50, tRes: 14.70, src: ['C-32', 'E-07'] },
  { row: 11, label: 'Refund due, no bank account on file', fix: 'Answer the CP53E within 30 days: add an account online',
    code: 'CP53E', init: 'Not e-filed', disp: 'CP53E: 30 days to add an account', tIn: 12.70, tAns: 13.00, tRes: 15.00, src: ['C-44', 'C-45', 'C-46', 'E-08'] },
  // row 12: the research pack's row ("Rejected on the Oct 15 deadline day") cannot have happened on a Sep 29 desk,
  // so it is replaced by a real TY2025 disaster postponement from facts group A (A-15), e-filed early
  { row: 12, label: 'Disaster area: due Feb 1, 2027', fix: 'WA-2026-02, Douglas County wildfires',
    code: 'WA-2026-02', init: 'Not e-filed', disp: 'Filed ahead of Feb 1, 2027', tIn: 13.20, tAns: 13.50, tRes: 15.90, src: ['A-15'] },
];
// the three answered rows take their text from REQUESTS
for (const q of QUEUE) if (q.req !== undefined) {
  const r = REQUESTS[q.req];
  Object.assign(q, { label: r.title, fix: r.disp, code: r.code, init: r.init, disp: r.disp, badge: r.badge, src: r.src });
}
export const N_REJECTED = QUEUE.filter((q) => q.init === 'Rejected').length;

// the four product e-file statuses a row passes through (Intuit's "Understanding E-file status descriptions")
export const STATUS = { rej: 'Rejected', nef: 'Not e-filed', rbi: 'Received by Intuit', rba: 'Received by agency', acc: 'Accepted' };

// ---------- the Rejected ack card: queue rows 4 to 7, one at a time ----------
// Error message = the IRS statement for the rule (IRS Free File Fillable Forms reject-code help page), verbatim;
// Solution = the pack's one-line fix; Code = the MeF business rule. `a`/`b` = the window the card shows it.
export const ACKS = [
  { code: 'IND-031-04', msg: 'The prior-year information used to verify the primary taxpayers identity does not match IRS records.', a: 8.60, b: 10.60, src: ['B-14', 'E-01'] },
  { code: 'IND-181-01', msg: 'The Identity Protection PIN (IP PIN) entered for the primary taxpayer is not valid.', a: 10.60, b: 12.40, src: ['B-19', 'E-02'] },
  { code: 'IND-507-01', msg: 'A dependent\'s Social Security number (SSN) was already used on another accepted tax return for this tax year.', a: 12.40, b: 14.20, src: ['B-25', 'E-03'] },
  { code: 'F8962-070', msg: 'Form 8962 is missing from your return.', a: 14.20, b: Infinity, src: ['B-32', 'E-04'] },
];
for (const k of ACKS) { const q = QUEUE.find((x) => x.code === k.code); k.fix = q.fix; k.label = q.label; k.q = q; }

// ---------- the E-File Dashboard (LEARN): past rejected returns, each fixed and accepted ----------
// [code, IRS error statement (verbatim, or a verbatim clause of it), lifted?, src]. `lift` marks the four fixes the
// queue uses later; the HUD lifts them out as chips.
export const PAST = [
  ['R0000-500-01', 'The primary taxpayer\'s name or Social Security number (SSN) does not match IRS records.', 0, 'B-35'],
  ['IND-032-04', 'The prior-year information used to verify the spouses\' identity does not match IRS records.', 0, 'B-18'],
  ['FW2-502', 'The employer identification number (EIN) on a Form W-2 does not match IRS records.', 0, 'B-38'],
  ['IND-180-01', 'The Identity Protection PIN (IP PIN) entered for the primary taxpayer does not match IRS records.', 0, 'B-21'],
  ['IND-031-04', 'The prior-year information used to verify the primary taxpayers identity does not match IRS records.', 1, 'B-14'],
  ['R0000-504-02', 'The Social Security Number (SSN) for your dependent\'s last name does not match IRS records.', 0, 'B-27'],
  ['IND-181-01', 'The Identity Protection PIN (IP PIN) entered for the primary taxpayer is not valid.', 1, 'B-19'],
  ['IND-046-01', 'Form 8862 must be present in the return.', 0, 'B-13'],
  ['IND-507-01', 'A dependent\'s Social Security number (SSN) was already used on another accepted tax return for this tax year.', 1, 'B-25'],
  ['R0000-503-02', 'The name and/or Social Security number (SSN) of your spouse, on your Form 1040 is missing or does not match IRS records.', 0, 'B-36'],
  ['F8962-070', 'Form 8962 is missing from your return.', 1, 'B-32'],
  ['R0000-902-01', 'The taxpayer identification number (TIN) on your return was already used on another accepted return for this tax year.', 0, 'B-37'],
  ['IND-183-01', 'The spouse did not enter a valid Identity Protection Personal Identification Number (IP PIN).', 0, 'B-22'],
  ['R0000-075-03', '‘RoutingTransitNum’ (RTN) must conform to the banking industry RTN algorithm.', 0, 'B-09'],
];
// what the HUD lifts out of the dashboard on the LEARN beat (the four rejects the queue fixes)
export const TOPICS = PAST.filter((p) => p[2]).map((p) => p[0]);

// the VOICE beat: a line in the preparer's own style from a past email, and superbot's line in that style
export const VOICE_LINES = {
  you: 'Quick note: your 2025 standard deduction is $15,750.',
  sb: 'Quick note: your extended due date is Oct 15, 2026.',
  src: ['C-02', 'A-01'],
};

// the four HUD checklist rows (the third is the literal row count of the E-File Dashboard table)
export const STEPS = [
  'Connected to ProConnect',
  'Writing matched',
  `Learned from ${PAST.length}${NB}past returns`,
  'Filing returns',
];

// the Tax Returns 2025 list (the idle view): the product's own column headings and segmented control
export const SEGMENTS = ['By return type', 'By e-file progress', 'By eSignature status', 'By return status', 'By assignee'];
export const COLS = ['RETURN NAME', 'TYPE', 'FEDERAL EFILE STATUS', 'STATE EFILE STATUS', 'EXTENSION EFILE STATUS'];
// every return here is on an extension (Form 4868, filed by Apr 15, 2026) and has no state e-file in this queue
export const EXT = { status: 'Accepted', src: ['A-02'] };
export const STATE_STATUS = 'Not e-filed';

export const NBSP = NB;
