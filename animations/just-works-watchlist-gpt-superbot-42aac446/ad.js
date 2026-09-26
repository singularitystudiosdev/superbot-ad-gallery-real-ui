/* ad.js - config for the "Letterboxd + IMDb + Trakt, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the room photo, the posters and the service marks are in ./img and ./brand, sourced in CREDITS.txt.
   Beats: ChatGPT cannot sign in to the viewer's Letterboxd, IMDb or Trakt accounts, see those three
   watchlists, or read what the Netflix, Max, Prime Video, Hulu and Disney+ catalogs carry right now, so it
   cannot build the one list -> the "superbot can do it!" popup is clicked -> superbot signs in read-only,
   reads the 283 watchlist entries, folds 66 duplicate entries into 214 distinct titles, makes 1,070 checks,
   one per title per service, sorts them into 116 streaming, 9 leaving by Sep 30 and 61 rent or buy, finds 2
   subscriptions carrying nothing only they stream at $37.98/mo, and builds one watchlist page. It adds,
   rates, removes, cancels and changes nothing. Every figure below is read from data.js, so the hub, the steps
   and the page agree.
   This folder is a copy of the superbot-only variant (just-works-watchlist-superbot-42aac446): every asset,
   the site and the config below the gpt block are that spot's, unchanged, so the two variants share one page
   and one hub. */

import { accounts, counts, meta, usd, n0 } from './data.js';

const acc = (id) => accounts.find((a) => a.id === id);
const src = (id, name) => ({ id, name, logo: acc(id).logo, count: acc(id).pulled, what: acc(id).kind === 'list' ? 'watchlist entries pulled' : 'titles checked' });

export default {
  id: 'just-works-watchlist-gpt-superbot-42aac446',
  title: 'Letterboxd + IMDb + Trakt, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-watchlist), shared by both variants
  slug: 'watchlist',

  ask: 'Pull my watchlists from Letterboxd, IMDb and Trakt, merge them into one list without duplicates, check every title against the streaming services I pay for (Netflix, Max, Prime Video, Hulu, Disney+), and build me one page: what I can watch tonight on each service, what is leaving soon, what I would have to rent, and which subscriptions I am paying for but never use for anything on my list.',

  // the ChatGPT beat: it tries the Letterboxd watchlist, that load fails, and the refusal explains why the
  // whole ask is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the popup's click fits.
  gpt: {
    attempt: 'Opening letterboxd.com/jordanwatches/watchlist',
    reply:
      "I can't sign in to your Letterboxd, IMDb or Trakt accounts, so I can't see the three watchlists or merge them into one list. I also can't browse the live Netflix, Max, Prime Video, Hulu and Disney+ catalogs, so I can't say what you can watch tonight, what is leaving soon or what you would have to rent.\n\nWhat I can do instead: suggest some well-reviewed films in general, and you can look each one up on JustWatch yourself.",
  },

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

  // what superbot read, with the counts that tick up in the chat (131 + 88 + 64 entries, then 214 titles on each of 5 services)
  sources: [
    src('letterboxd', 'Letterboxd watchlist'),
    src('imdb', 'IMDb watchlist'),
    src('trakt', 'Trakt watchlist'),
    src('netflix', 'Netflix'),
    src('max', 'Max'),
    src('primevideo', 'Prime Video'),
    src('hulu', 'Hulu'),
    src('disneyplus', 'Disney+'),
  ],

  steps: [
    `Read your Letterboxd, IMDb and Trakt watchlists, read-only: ${n0(counts.entries)} entries`,
    `Folded ${n0(counts.dupes)} duplicates into ${n0(counts.titles)} distinct titles and made ${n0(counts.checks)} checks, each title on ${counts.services} services`,
    `Sorted every title: ${n0(counts.streaming)} streaming on your plans, ${n0(counts.leaving)} leaving by ${meta.cutoff}, ${n0(counts.rent)} rent or buy`,
    `Found ${counts.idle} subscriptions with nothing only they stream, ${usd(counts.idleMonthly)}/mo, and built one watchlist page`,
  ],

  found: { n: counts.titles, one: 'title', many: 'titles', label: `titles checked, ${n0(counts.streaming)} streaming on your plans` },

  build: {
    file: 'watchlist',
    url: 'superbot.app/p/watchlist',
    tabTitle: `Watchlist · ${n0(counts.titles)} titles`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.13 and 0.3 both name the hero, so the page holds on the sync card while render(p) reads the eight
  //    sources (p 0 to 0.17, see site.js SYNC_A/SYNC_B) and folds 283 entries into 214 titles and 1,070
  //    checks (p 0.165 to 0.285, MERGE_A/MERGE_B); the finished card holds about 0.85 s.
  // 2. 0.355 and 0.52 both name the status strip, whose four counters ease in as it lands (p 0.36 to 0.44,
  //    GROW_A/GROW_B): settled at 116 / 9 / 61 / 2 from f 0.38, then held with the cursor on the Leaving tile.
  // 3. 0.575 and 0.66 hold on the poster grid; its nine posters settle in as it arrives (ROOM_A/ROOM_B) and
  //    the cursor rests on Past Lives, which leaves Netflix on Sep 30.
  // 4. 0.7 and 0.745 hold on the By service panel, the window the click on the Subscriptions tab is timed
  //    against. The click swaps the subscriptions panel into the same slot, 0.78 settles on it and the cursor
  //    rests on the Disney+ row, the plan with none of the 214 titles, to the end.
  scroll: [
    [0, 0],
    [0.13, '.wl-hero'],
    [0.3, '.wl-hero'],
    [0.355, '.wl-flags'],
    [0.52, '.wl-flags'],
    [0.575, '.wl-shelf'],
    [0.66, '.wl-shelf'],
    [0.7, '.wl-panels'],
    [0.745, '.wl-panels'],
    [0.78, '.wl-panel--2'],
  ],

  // the cursor points at each beat: the fold counters, the leaving tile, the leaving poster, then the idle plan
  hover: [
    [0.1, 0.29, '.wl-merge'],
    [0.39, 0.52, '.wl-flag--leaving'],
    [0.59, 0.66, '.wl-poster--past-lives'],
    [0.79, 0.97, '.wl-srow--disneyplus'],
  ],

  // the cursor clicks the Subscriptions tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.74, '.wl-tab--2']],

  end: { text: 'Superbot just works' },

  // hub and browser keep variant B's lengths; the gpt beat in front puts the loop near 32.6 s, like the
  // series' other ChatGPT-first spots
  dur: { hub: 11, browser: 10.5 },
};
