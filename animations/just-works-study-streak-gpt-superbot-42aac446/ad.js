/* ad.js - config for the "Duolingo + Anki + WaniKani + italki, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the hero photo and the site marks are in ./img and ./brand, sourced in CREDITS.txt.
   Beats: ChatGPT cannot sign in to Duolingo, AnkiWeb, WaniKani or italki, so it cannot see the streak, today's
   XP or the league table, cannot read the Anki decks and what they have due, cannot see the WaniKani reviews
   and lessons, and cannot see the next italki lesson or the tutor's homework, and cannot check any of them
   every morning -> the "superbot can do it!" popup is clicked -> superbot reads 7,250 Anki cards, 228
   WaniKani reviews, 30 Duolingo league rows and 3 italki lessons, finds the 247-day streak at 0 of 50 XP
   today and #6 of 30 in the Sapphire League, flags 3 things that break today and builds a 42 min morning plan
   that clears them. It completes no lesson, reviews no card, books or cancels nothing and buys no streak
   freeze. Every figure below is read from data.js, so the hub, the steps and the page agree.
   This folder is a copy of the superbot-only variant (just-works-study-streak-superbot-42aac446): every
   asset, the site and the config below the gpt block are that spot's, unchanged, so the two variants share
   one page and one hub. */

import { accounts, counts, duolingo, anki, wanikani, italki, flags, hm } from './data.js';

const src = (a) => ({ id: a.id, name: a.name, logo: a.logo, count: a.pulled, what: a.what });

const n0 = (n) => Number(n).toLocaleString('en-US');

export default {
  id: 'just-works-study-streak-gpt-superbot-42aac446',
  title: 'Duolingo + Anki + WaniKani + italki, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-study-streak), shared by both variants
  slug: 'study-streak',

  ask: 'Every morning, check my Duolingo, Anki, WaniKani and italki and tell me what I need to do today so no streak breaks.',

  // the ChatGPT beat: it tries the Duolingo learn page, that load fails, and the refusal explains why the
  // whole ask is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the popup's click fits.
  gpt: {
    attempt: 'Opening duolingo.com/learn',
    reply:
      "I can't sign in to your Duolingo, AnkiWeb, WaniKani or italki accounts, so I can't see your streak, today's XP or your league standing, I can't read your Anki decks and what they have due, I can't see your WaniKani reviews and lessons, and I can't see your next italki lesson or the homework your tutor left. I also can't check any of them every morning.\n\nWhat I can do instead: give you a checklist to open each app yourself, write out what is due on paper, and set a reminder to log in and work through it all by hand before midnight.",
  },
  card: null,

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

  // what superbot read, with the counts that tick up in the chat (four study apps, one row each)
  sources: accounts.map(src),

  steps: [
    `Read Duolingo, AnkiWeb, WaniKani and italki, read-only: ${n0(counts.cardsRead)} cards, ${counts.reviewsRead} reviews, ${counts.lessons} lessons`,
    `Duolingo: ${duolingo.streak}-day streak, ${duolingo.xpToday} of ${duolingo.goal} XP today, no freeze, #${duolingo.rank} of ${duolingo.size} in the ${duolingo.league} League`,
    `Due today: ${anki.due} Anki cards, ${wanikani.reviewsNow} WaniKani reviews, italki homework before the ${hm(italki.next.at)} lesson`,
    `Flagged ${flags.length} things that break today and built a ${counts.planMin} min morning plan that clears them`,
  ],

  found: { n: flags.length, one: 'streak risk flagged', many: 'streak risks flagged', label: `streak risks flagged for today, a ${counts.planMin} min morning plan clears them` },

  build: {
    file: 'study-streak',
    url: 'superbot.app/p/study-streak',
    tabTitle: `Study Overview · ${flags.length} flags`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.12 and 0.28 both name the hero, so the page holds on the sync card while render(p) reads the four
  //    apps (p 0.05 to 0.2, see site.js SYNC_A/SYNC_B) and checks each streak into the segmented bar (p 0.19
  //    to 0.3, CHECK_A/CHECK_B); the finished card holds before the page moves.
  // 2. 0.33 and 0.44 both name the today strip, whose four counters ease in as it lands (p 0.37 to 0.47,
  //    GROW_A/GROW_B), then hold with the cursor on the streak tile's flame chip.
  // 3. 0.49 and 0.66 hold on the flags, the money beat and the longest hold: the three flags land in turn
  //    (FLAG_A/FLAG_B) and their deadline rings fill, then the cursor rests on the first flag's ring.
  // 4. 0.71 lands on the panels and 0.78 on the tabbed slot inside them (the same place in 16:9 and 4:3; in
  //    the stacked 1:1 and 4:5 layouts the italki card sits above the slot and scrolls past), the window the
  //    click on the Decks tab is timed against; the league rows and the WaniKani forecast bars grow meanwhile
  //    (OUT_A/OUT_B). The click swaps the Anki decks into the same slot (same height, nothing below moves),
  //    0.86 settles on the morning plan, which sits right under the slot and is the last block before the
  //    footer, so the page bottoms out with the decks still above it while the deck bars grow
  //    (DECK_A/DECK_B) and the plan bar fills (PLAN_A/PLAN_B); the cursor rests on the bar to the end.
  scroll: [
    [0, 0],
    [0.12, '.ss-hero'],
    [0.28, '.ss-hero'],
    [0.33, '.ss-stats'],
    [0.44, '.ss-stats'],
    [0.49, '.ss-flags'],
    [0.66, '.ss-flags'],
    [0.71, '.ss-panels'],
    [0.78, '.ss-slot'],
    [0.86, '.ss-plan'],
  ],

  // the cursor lands on a graphic at every beat, never on a figure the beat is showing: the on-track (Anki)
  // segment of the streak check bar in the sync card, whose label sits above it, the streak tile's flame
  // chip (not its 247), the first flag's deadline ring and the morning plan's bar, the last row of its card,
  // whose steps and minutes sit above it clear of the pointer. site.css highlights each block on
  // :has(.is-hover).
  hover: [
    [0.1, 0.28, '.ss-cseg--ok .ss-ctrack'],
    [0.36, 0.44, '.ss-stat--streak .ss-stati'],
    [0.53, 0.66, '.ss-flag--1 .ss-fring'],
    [0.9, 0.97, '.ss-pbar'],
  ],

  // the cursor clicks the Decks tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.79, '.ss-tab--2']],

  end: { text: 'Superbot just works' },

  // hub and browser keep variant B's lengths, so every f in the scroll/hover/click plan above lands on the
  // same frame of the page as it does in B; the gpt beat in front (about 7.75 s, ask + reply driven, no
  // cfg.dur.gpt) puts the loop near 33 s, like the series' other ChatGPT-first spots
  dur: { hub: 11, browser: 11.2 },
};