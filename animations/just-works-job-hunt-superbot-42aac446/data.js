/* data.js - the numbers behind superbot.app/p/job-pipeline, "Job pipeline".
   One read-only sync on Thu Sep 24 at 9:14 AM for a senior backend engineer's job search: LinkedIn and
   Indeed (every job applied to in the last 60 days, since Jul 26), Gmail (every recruiter reply, rejection,
   interview invite and ATS confirmation in that window) and the Greenhouse, Lever and Ashby boards of 40
   target companies. 682 entries pulled: 83 emails, 77 of which thread onto an application LinkedIn or
   Indeed already had (6 are confirmations of direct applications, which become applications of their own),
   and 553 open roles, 539 of which are not new senior backend roles. That leaves 66 pipeline rows: 52
   applications and 14 new roles. Nothing is sent, applied to, withdrawn or changed in any account: Superbot
   reads, it does not touch.
   The person, the companies, the roles and the threads are invented for the spot; LinkedIn, Indeed, Gmail,
   Greenhouse, Lever and Ashby are the real services named. Every figure the page, the hub and the steps
   print is derived here, so they never disagree. */

const n0 = (n) => Number(n).toLocaleString('en-US');
export { n0 };

export const meta = {
  user: 'Sam Rivera',
  person: 'Sam Rivera',
  target: 'Senior Backend Engineer',
  city: 'Seattle, WA · open to remote',
  day: 'Thu, Sep 24',
  synced: '9:14 AM',
  since: 'Jul 26',
  windowDays: 60,
  quietDays: 30,
  // the clock the top bar prints: the sync starts at 9:13:22 AM and lands at 9:14:08 AM, 46 s in
  syncStart: 9 * 3600 + 13 * 60 + 22,
  syncSecs: 46,
};

/* the six places the pipeline came out of: what each one listed, and what survived as a pipeline row.
   LinkedIn and Indeed rows are applications, all kept. Gmail's 83 emails mostly belong to an application
   already listed (77 thread onto it); the 6 left are confirmations of direct applications. The boards list
   every open role; only the 14 new senior backend roles are kept. */
export const accounts = [
  { id: 'linkedin', name: 'LinkedIn', short: 'LinkedIn', what: 'applications', handle: 'linkedin.com/in/samrivera-dev', logo: './brand/linkedin.svg', pulled: 29, kept: 29, note: `Every job applied to since Jul 26` },
  { id: 'indeed', name: 'Indeed', short: 'Indeed', what: 'applications', handle: 'sam.rivera.dev@gmail.com', logo: './brand/indeed.svg', pulled: 17, kept: 17, note: `Every job applied to since Jul 26` },
  { id: 'gmail', name: 'Gmail', short: 'Gmail', what: 'emails', handle: 'sam.rivera.dev@gmail.com', logo: './brand/gmail.svg', pulled: 83, kept: 6, note: '77 threaded onto their application, 6 were direct applications' },
  { id: 'greenhouse', name: 'Greenhouse boards', short: 'Greenhouse', what: 'open roles', handle: '18 target companies', logo: './brand/greenhouse.svg', pulled: 264, kept: 7, note: '7 new senior backend roles' },
  { id: 'lever', name: 'Lever boards', short: 'Lever', what: 'open roles', handle: '11 target companies', logo: './brand/board.svg', pulled: 131, kept: 3, note: '3 new senior backend roles' },
  { id: 'ashby', name: 'Ashby boards', short: 'Ashby', what: 'open roles', handle: '11 target companies', logo: './brand/board.svg', pulled: 158, kept: 4, note: '4 new senior backend roles' },
];

export const accOf = (id) => accounts.find((a) => a.id === id);
const sum = (ids, k) => ids.reduce((a, id) => a + accOf(id)[k], 0);
const BOARDS = ['greenhouse', 'lever', 'ashby'];

/* where every application stands, from the newest email in its thread (6 + 9 + 17 + 20 = 52) */
const STATUS = { interview: 6, replied: 9, rejected: 17, waiting: 20 };

/* the target companies whose boards posted a new senior backend role since the last check, and where the
   application there stands (null: not applied yet). 3 + 2 + 1 + 1 + 1 + 1 + 1 + 2 + 2 = 14 new roles */
const COMPANIES = [
  ['lumen', 'Lumen Pay', 'greenhouse', 'boards.greenhouse.io/lumenpay', 3, 41, 'interview', 'Payments · Remote US'],
  ['northwind', 'Northwind Labs', 'greenhouse', 'boards.greenhouse.io/northwindlabs', 2, 27, null, 'Dev tools · Seattle'],
  ['quayside', 'Quayside Data', 'ashby', 'jobs.ashbyhq.com/quayside', 2, 19, 'interview', 'Data infra · Remote'],
  ['kestrel', 'Kestrel AI', 'ashby', 'jobs.ashbyhq.com/kestrel', 2, 33, 'replied', 'ML platform · SF or remote'],
  ['parcelwise', 'Parcelwise', 'lever', 'jobs.lever.co/parcelwise', 1, 22, 'interview', 'Logistics · Seattle'],
  ['tessellate', 'Tessellate', 'lever', 'jobs.lever.co/tessellate', 1, 18, 'replied', 'Maps API · Remote US'],
  ['harborview', 'Harborview', 'lever', 'jobs.lever.co/harborview', 1, 12, 'replied', 'Fintech · Remote'],
  ['fernhill', 'Fernhill', 'greenhouse', 'boards.greenhouse.io/fernhill', 1, 14, 'rejected', 'Health · Portland'],
  ['ledgerly', 'Ledgerly', 'greenhouse', 'boards.greenhouse.io/ledgerly', 1, 16, null, 'Accounting · Remote'],
];

export const companies = COMPANIES.map(([key, name, ats, board, newRoles, openRoles, you, what]) => ({
  key, name, ats, board, newRoles, openRoles, you, what,
}));

const APPLICATIONS = sum(['linkedin', 'indeed'], 'kept') + accOf('gmail').kept;          // 52
const NEW_ROLES = sum(BOARDS, 'kept');                                                    // 14
const PULLED = accounts.reduce((a, x) => a + x.pulled, 0);                                // 682

export const counts = {
  accounts: accounts.length,
  logins: 3,                                                            // LinkedIn, Indeed, Gmail
  pulled: PULLED,
  dupes: PULLED - APPLICATIONS - NEW_ROLES,                             // 616 threaded or filtered out
  rows: APPLICATIONS + NEW_ROLES,                                       // 66
  applications: APPLICATIONS,
  emails: accOf('gmail').pulled,                                        // 83
  threaded: accOf('gmail').pulled - accOf('gmail').kept,                // 77
  boards: 40,
  openRoles: sum(BOARDS, 'pulled'),                                     // 553
  newRoles: NEW_ROLES,
  newCompanies: companies.length,                                       // 9
  companyRoles: companies.reduce((a, c) => a + c.newRoles, 0),          // 14, matches NEW_ROLES
  interview: STATUS.interview,
  replied: STATUS.replied,
  rejected: STATUS.rejected,
  waiting: STATUS.waiting,
  heard: STATUS.interview + STATUS.replied + STATUS.rejected,           // 32
  quiet: 6,                                                             // of the 20 waiting, 30+ days quiet
};

/* the four status tiles: what each one means and the three the page names first */
export const flags = [
  { kind: 'interview', label: 'Interview invites', icon: 'calendar-check', n: counts.interview, rule: 'A date on the calendar',
    examples: [{ name: 'Lumen Pay', v: 'Screen, Mon Sep 28' }, { name: 'Parcelwise', v: 'Onsite, Tue Sep 29' }, { name: 'Quayside Data', v: 'HM call, Thu Oct 1' }] },
  { kind: 'replied', label: 'Recruiter replied', icon: 'message-square-text', n: counts.replied, rule: 'A person wrote back',
    examples: [{ name: 'Kestrel AI', v: 'Wants a call' }, { name: 'Harborview', v: 'Take-home, due Sep 27' }, { name: 'Tessellate', v: 'Asked your range' }] },
  { kind: 'rejected', label: 'Rejected', icon: 'circle-x', n: counts.rejected, rule: 'A no from the team or its ATS',
    examples: [{ name: 'Orbital Freight', v: 'Sep 18' }, { name: 'Brightline Health', v: 'Sep 11' }, { name: 'Cinder Security', v: 'Aug 30' }] },
  { kind: 'waiting', label: 'No reply yet', icon: 'hourglass', n: counts.waiting, rule: 'Nothing back since you applied',
    examples: [{ name: 'Driftwood Systems', v: '38 days' }, { name: 'Mapleway', v: '31 days' }, { name: 'Plinth', v: '24 days' }] },
];

/* the pipeline panel: one row per application, every place it was found, its latest status and next step */
const PIPELINE = [
  ['parcelwise', 'Parcelwise', 'Senior Backend Engineer, Platform', 'Seattle', ['linkedin', 'gmail'], 'Aug 21', 'interview', 'Onsite Tue Sep 29', 'Prep system design, 4 rounds'],
  ['lumen', 'Lumen Pay', 'Senior Software Engineer, Payments API', 'Remote US', ['gmail'], 'Aug 27', 'interview', 'Screen Mon Sep 28', 'Review idempotency and retries'],
  ['quayside', 'Quayside Data', 'Staff Backend Engineer', 'Remote', ['indeed', 'gmail'], 'Sep 2', 'interview', 'HM call Thu Oct 1', 'Confirm the time by Friday'],
  ['kestrel', 'Kestrel AI', 'Senior Backend Engineer, Inference', 'SF or remote', ['linkedin', 'gmail'], 'Sep 4', 'replied', 'Replied Sep 22', 'Send 3 times for a call'],
  ['harborview', 'Harborview', 'Senior Backend Engineer (Go)', 'Remote', ['gmail'], 'Aug 30', 'replied', 'Take-home Sep 19', 'Due Sun Sep 27'],
  ['tessellate', 'Tessellate', 'Senior Platform Engineer', 'Remote US', ['indeed', 'gmail'], 'Aug 14', 'replied', 'Replied Sep 17', 'Answer the salary question'],
  ['orbital', 'Orbital Freight', 'Senior Backend Engineer', 'Chicago', ['linkedin', 'gmail'], 'Aug 3', 'rejected', 'Rejected Sep 18', 'Closed, nothing to do'],
  ['driftwood', 'Driftwood Systems', 'Backend Engineer III', 'Remote', ['indeed'], 'Aug 17', 'waiting', 'Quiet 38 days', 'Follow up with the recruiter'],
];

export const pipeline = PIPELINE.map(([key, company, role, where, apps, applied, status, statusText, next]) => ({
  key, company, role, where, apps, applied, status, statusText, next,
}));

/* the new roles panel: roles posted on a target board since the last check, newest first */
const NEW_ROWS = [
  ['lumen-ledger', 'Senior Backend Engineer, Ledger', 'Lumen Pay', 'greenhouse', 'Sep 23', '1 d ago', 'boards.greenhouse.io/lumenpay/jobs/7241190', 'Ask about it Monday', 'You interview at Lumen Pay on Monday. This team sits next to the Payments API role you are screening for.'],
  ['kestrel-data', 'Senior Backend Engineer, Data Platform', 'Kestrel AI', 'ashby', 'Sep 22', '2 d ago', 'jobs.ashbyhq.com/kestrel/5c0e9a12', 'Mention it on the call', ''],
  ['lumen-risk', 'Senior Software Engineer, Risk', 'Lumen Pay', 'greenhouse', 'Sep 22', '2 d ago', 'boards.greenhouse.io/lumenpay/jobs/7238844', 'Same loop as your screen', ''],
  ['quayside-ingest', 'Senior Backend Engineer, Ingestion', 'Quayside Data', 'ashby', 'Sep 21', '3 d ago', 'jobs.ashbyhq.com/quayside/a81d44f0', 'Ask the hiring manager', ''],
  ['northwind-billing', 'Senior Backend Engineer, Billing', 'Northwind Labs', 'greenhouse', 'Sep 21', '3 d ago', 'boards.greenhouse.io/northwindlabs/jobs/5510327', 'Apply, not applied yet', ''],
  ['parcelwise-routing', 'Senior Backend Engineer, Routing', 'Parcelwise', 'lever', 'Sep 20', '4 d ago', 'jobs.lever.co/parcelwise/3f6b2e71', 'Ask at Tuesday onsite', ''],
  ['ledgerly-core', 'Senior Backend Engineer, Core API', 'Ledgerly', 'greenhouse', 'Sep 19', '5 d ago', 'boards.greenhouse.io/ledgerly/jobs/4402981', 'Apply, not applied yet', ''],
];

export const newRoles = NEW_ROWS.map(([key, role, company, ats, posted, ago, link, next, note]) => ({
  key, role, company, ats, posted, ago, link, next, note,
}));

/* the rows the hub's live card previews while the sync runs */
export const items = [
  { img: './brand/role.svg', title: 'Lumen Pay, Payments API', price: 'Screen Mon', meta: 'Senior Software Engineer · interview invite', source: 'gmail' },
  { img: './brand/role.svg', title: 'Parcelwise, Platform', price: 'Onsite Tue', meta: 'Senior Backend Engineer · applied Aug 21', source: 'linkedin' },
  { img: './brand/role.svg', title: 'Kestrel AI, Inference', price: 'Replied', meta: 'Recruiter wants a call · Sep 22', source: 'gmail' },
  { img: './brand/role.svg', title: 'Lumen Pay, Ledger', price: 'New', meta: 'Senior Backend Engineer · posted Sep 23', source: 'greenhouse' },
  { img: './brand/role.svg', title: 'Quayside Data, Staff', price: 'HM call', meta: 'Staff Backend Engineer · applied Sep 2', source: 'indeed' },
];

/* prose the page prints about its own numbers */
export const copy = {
  kicker: `LinkedIn + Indeed + Gmail + ${counts.boards} job boards, synced ${meta.synced}`,
  heroH1: `${counts.applications} applications, ${counts.emails} recruiter emails, ${counts.boards} job boards. One pipeline.`,
  heroDek: `Superbot signed in to LinkedIn, Indeed and Gmail, pulled every job you applied to since ${meta.since}, threaded every reply onto its application and checked the Greenhouse, Lever and Ashby boards of your ${counts.boards} target companies. Read-only, nothing was sent or changed.`,
  flagsH: 'Where every application stands',
  flagsDek: `${counts.applications} applications in ${meta.windowDays} days. Status from the newest email in each thread.`,
  roomsH: 'New senior backend roles on your boards',
  roomsDek: `${counts.newRoles} new roles at ${counts.newCompanies} of your ${counts.boards} target companies, out of ${n0(counts.openRoles)} open roles read.`,
  devicesH: 'Your pipeline, one row per application',
  devicesDek: `The ${PIPELINE.length} below are a slice of ${counts.applications}, interviews first. Every reply is threaded onto the job it answers.`,
  autosH: 'New roles, with the link and the next step',
  autosDek: `${counts.newRoles} senior backend roles posted since your last check, newest first.`,
  worstNote: 'Lumen Pay posted a Ledger role yesterday, the day before your screen there. Worth a question on Monday.',
  watchH: 'Next steps this week',
  watchDek: 'Pulled from every thread. The boards get checked again every morning.',
};

/* what the week holds, read off the threads */
export const watch = [
  { icon: 'calendar-check', k: 'Mon, Sep 28, 10:00 AM', v: 'Lumen Pay tech screen', note: 'Zoom link is in the Greenhouse invite' },
  { icon: 'calendar-days', k: 'Tue, Sep 29, 9:30 AM', v: 'Parcelwise onsite', note: 'Four rounds, system design first' },
  { icon: 'send', k: 'Waiting on you', v: 'Reply to 2 recruiters', note: 'Kestrel AI and Tessellate wrote back' },
  { icon: 'hourglass', k: 'Follow up', v: `${counts.quiet} quiet for ${meta.quietDays}+ days`, note: 'Driftwood Systems first, 38 days' },
];
