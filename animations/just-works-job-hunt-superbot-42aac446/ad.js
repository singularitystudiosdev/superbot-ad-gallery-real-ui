/* ad.js - config for the "LinkedIn + Indeed + Gmail + 40 job boards, one job pipeline" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the desk photo and the source marks are in ./img and ./brand, sourced in CREDITS.txt.
   Read-only by design: Superbot signs in to LinkedIn, Indeed and Gmail, reads every application and every
   recruiter email of the last 60 days, reads the public Greenhouse, Lever and Ashby boards of 40 target
   companies, and sends, applies to, withdraws and changes nothing. No ChatGPT beat and no card beat in this
   spot (variant B: the hub's own work is the whole point). Every figure below is read from data.js, so the
   hub, the steps and the page agree. */

import { accounts, counts } from './data.js';

const acc = (id) => accounts.find((a) => a.id === id);
const src = (id, name) => ({ id, name, logo: acc(id).logo, count: acc(id).pulled, what: `${acc(id).what} pulled` });

export default {
  id: 'just-works-job-hunt-superbot-42aac446',
  title: 'LinkedIn + Indeed + Gmail + 40 job boards, one job pipeline',
  slug: 'job-hunt',

  ask: 'Sign into my LinkedIn, Indeed and Gmail, pull every job I applied to in the last 60 days plus every recruiter reply, rejection and interview invite, check the Greenhouse, Lever and Ashby boards of my 40 target companies for new senior backend roles, and build one pipeline with dates, links and the next step for each.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat (29 + 17 + 83 + 264 + 131 + 158 = 682)
  sources: [
    src('linkedin', 'LinkedIn applications'),
    src('indeed', 'Indeed applications'),
    src('gmail', 'Gmail recruiter threads'),
    src('greenhouse', 'Greenhouse boards'),
    src('lever', 'Lever boards'),
    src('ashby', 'Ashby boards'),
  ],

  steps: [
    `Signed in to LinkedIn, Indeed and Gmail, read-only`,
    `Pulled ${counts.applications} applications and threaded ${counts.threaded} recruiter emails onto them`,
    `Checked ${counts.boards} Greenhouse, Lever and Ashby boards: ${counts.newRoles} new senior backend roles`,
    `Built one pipeline: ${counts.interview} interviews, ${counts.replied} replies, ${counts.rejected} rejections, a next step on each`,
  ],

  found: { n: counts.applications, one: 'application', many: 'applications', label: `applications tracked, ${counts.newRoles} new roles` },

  build: {
    file: 'job-pipeline',
    url: 'superbot.app/p/job-pipeline',
    tabTitle: `Job pipeline · ${counts.applications} applications`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.13 and 0.3 both name the hero, so the page holds on the sync card while render(p) reads the six
  //    sources (p 0 to 0.15, see site.js SYNC_A/SYNC_B) and threads and filters (682 pulled, 616 threaded
  //    onto an application or not a new senior backend role, 66 pipeline rows, p 0.165 to 0.285,
  //    MERGE_A/MERGE_B); the finished card holds ~0.85 s.
  // 2. 0.355 and 0.52 both name the status strip, whose four counters ease in as it lands (p 0.36 to 0.44,
  //    see GROW_A/GROW_B): settled at 6 / 9 / 17 / 20 from f 0.38, then held about 1.3 s with the cursor on
  //    the Interview invites tile before the scroll leaves.
  // 3. 0.575 and 0.66 hold on the company grid; its nine cards settle in as it arrives (ROOM_A/ROOM_B) and
  //    the cursor rests on Lumen Pay, three new roles at the company you screen with on Monday.
  // 4. 0.7 and 0.745 hold on the pipeline, the window the click on the New roles tab is timed against. The
  //    click swaps the new roles panel into the same slot, 0.78 settles on it and the cursor rests on
  //    "Senior Backend Engineer, Ledger" at Lumen Pay, posted yesterday, to the end.
  scroll: [
    [0, 0],
    [0.13, '.jh-hero'],
    [0.3, '.jh-hero'],
    [0.355, '.jh-flags'],
    [0.52, '.jh-flags'],
    [0.575, '.jh-rooms'],
    [0.66, '.jh-rooms'],
    [0.7, '.jh-panels'],
    [0.745, '.jh-panels'],
    [0.78, '.jh-panel--2'],
  ],

  // the cursor points at each beat: the merge counters, the interview tile, Lumen Pay, then its new role
  hover: [
    [0.1, 0.29, '.jh-merge'],
    [0.39, 0.52, '.jh-flag--interview'],
    [0.59, 0.66, '.jh-room--lumen'],
    [0.79, 0.97, '.jh-arow--lumen-ledger'],
  ],

  // the cursor clicks the New roles tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.74, '.jh-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25 s
  dur: { hub: 11, browser: 10.5 },
};
