/* ad.js - config for the "Libby + Goodreads + Kindle + Audible, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the library photo and the service marks are in ./img and ./brand, sourced in CREDITS.txt.
   Beats: ChatGPT cannot sign in to Libby with either library card, see the Goodreads want-to-read shelf,
   compare it with the Kindle and Audible libraries or check live availability and hold positions, so it
   cannot build the overview -> the "superbot can do it!" popup is clicked -> superbot signs in read-only,
   reads the 48 want-to-read titles, makes 96 availability checks at Seattle Public Library and King County
   Library System, reads every hold queue, compares the shelf with the 276 Kindle and Audible titles and
   builds one reading overview: 8 to borrow now, 14 on hold, 9 already owned, 3 loans due this week, each
   with a date, a link and a next step. It borrows, holds, renews, returns and rates nothing. Every figure
   below is read from data.js, so the hub, the steps and the page agree.
   This folder is a copy of the superbot-only variant (just-works-reading-list-superbot-42aac446): every
   asset, the site and the config below the gpt block are that spot's, unchanged, so the two variants share
   one page and one hub. */

import { accounts, counts } from './data.js';

const acc = (id) => accounts.find((a) => a.id === id);
const src = (id, name) => ({ id, name, logo: acc(id).logo, count: acc(id).pulled, what: `${acc(id).what} pulled` });

export default {
  id: 'just-works-reading-list-gpt-superbot-42aac446',
  title: 'Libby + Goodreads + Kindle + Audible, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-reading-list), shared by both variants
  slug: 'reading-list',

  ask: 'Sign into my Libby with both my library cards, my Goodreads want-to-read shelf and my Kindle and Audible libraries, check every want-to-read title\'s live availability and hold-queue position at each library, and build one reading overview: what I can borrow now, my place in line and estimated wait for each hold, loans expiring this week, and which titles I already own.',

  // the ChatGPT beat: it tries the Libby shelf, that load fails, and the refusal explains why the whole ask
  // is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the popup's click fits.
  gpt: {
    attempt: 'Opening libbyapp.com/shelf',
    reply:
      "I can't sign in to Libby with your Seattle Public Library or King County Library cards, so I can't see your Goodreads want-to-read shelf or compare it with your Kindle and Audible libraries. I also can't check live availability or where you stand in a hold queue.\n\nWhat I can do instead: give you a checklist to search each of the 48 titles in Libby by hand.",
  },
  card: null,

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

  // what superbot read, with the counts that tick up in the chat (48 + 48 + 48 + 212 + 64 = 420)
  sources: [
    src('spl', 'Seattle Public Library card'),
    src('kcls', 'King County Library card'),
    src('goodreads', 'Goodreads want-to-read'),
    src('kindle', 'Kindle library'),
    src('audible', 'Audible library'),
  ],

  steps: [
    `Signed in to Libby with both library cards and to Goodreads, Kindle and Audible, read-only`,
    `Read the ${counts.titles} want-to-read titles and made ${counts.checks} availability checks, ${counts.checks / 2} titles at each of ${counts.libraries} libraries`,
    `Read every hold queue: ${counts.hold} titles already on hold, shortest wait ${counts.soonest.wait} week, longest ${counts.longest.place} places back`,
    `Built one reading overview: ${counts.available} to borrow now, ${counts.hold} on hold, ${counts.owned} already owned, ${counts.dueThisWeek} loans due this week`,
  ],

  found: { n: counts.titles, one: 'title', many: 'titles', label: `want-to-read titles checked, ${counts.available} ready to borrow` },

  build: {
    file: 'reading-list',
    url: 'superbot.app/p/reading-list',
    tabTitle: `Reading list · ${counts.titles} titles`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.13 and 0.3 both name the hero, so the page holds on the sync card while render(p) reads the five
  //    sources (p 0 to 0.17, see site.js SYNC_A/SYNC_B) and merges the checks and owned books onto a title
  //    (420 lines read, 372 merged, 48 want-to-read titles, p 0.165 to 0.285, MERGE_A/MERGE_B); the finished
  //    card holds about 0.85 s.
  // 2. 0.355 and 0.52 both name the status strip, whose four counters ease in as it lands (p 0.36 to 0.44,
  //    see GROW_A/GROW_B): settled at 8 / 14 / 3 / 9 from f 0.38, then held about 1.3 s with the cursor on
  //    the Already on hold tile before the scroll leaves.
  // 3. 0.575 and 0.66 hold on the shelf grid; its nine cover cards settle in as it arrives (ROOM_A/ROOM_B)
  //    and the cursor rests on The God of the Woods, the longest queue on the shelf.
  // 4. 0.7 and 0.745 hold on the hold queue, the window the click on the Loans tab is timed against. The
  //    click swaps the loans panel into the same slot, 0.78 settles on it and the cursor rests on
  //    "The Creative Act", the loan that comes due in two days, to the end.
  scroll: [
    [0, 0],
    [0.13, '.rl-hero'],
    [0.3, '.rl-hero'],
    [0.355, '.rl-flags'],
    [0.52, '.rl-flags'],
    [0.575, '.rl-rooms'],
    [0.66, '.rl-rooms'],
    [0.7, '.rl-panels'],
    [0.745, '.rl-panels'],
    [0.78, '.rl-panel--2'],
  ],

  // the cursor points at each beat: the merge counters, the hold tile, the longest queue, then the loan due
  hover: [
    [0.1, 0.29, '.rl-merge'],
    [0.39, 0.52, '.rl-flag--hold'],
    [0.59, 0.66, '.rl-room--the-god-of-the-woods'],
    [0.79, 0.97, '.rl-arow--creative-act'],
  ],

  // the cursor clicks the Loans tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.74, '.rl-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25 s
  dur: { hub: 11, browser: 10.5 },
};