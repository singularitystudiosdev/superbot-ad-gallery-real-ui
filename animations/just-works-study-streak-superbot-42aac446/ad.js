/* ad.js - config for the "Duolingo + Anki + WaniKani + italki, one study overview" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the hero photo and the site marks are in ./img and ./brand, sourced in CREDITS.txt. Read-only by
   design: every morning Superbot reads the Duolingo streak, today's XP and the league table, the AnkiWeb decks
   and their due cards, the WaniKani reviews and lessons, and the next italki lesson with the tutor's
   homework, then flags what would break today and orders a morning plan. It completes no lesson, reviews no
   card, books or cancels nothing and buys no streak freeze. No ChatGPT beat and no card beat in this spot
   (variant B: the hub's own work is the whole point). Every figure below is read from data.js, so the hub,
   the steps and the page agree. */

import { accounts, counts, duolingo, anki, wanikani, italki, flags, hm } from './data.js';

const src = (a) => ({ id: a.id, name: a.name, logo: a.logo, count: a.pulled, what: a.what });

const n0 = (n) => Number(n).toLocaleString('en-US');

export default {
  id: 'just-works-study-streak-superbot-42aac446',
  title: 'Duolingo + Anki + WaniKani + italki, one study overview',
  slug: 'study-streak',

  ask: 'Every morning, check my Duolingo, Anki, WaniKani and italki and tell me what I need to do today so no streak breaks.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

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

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25.6 s
  dur: { hub: 11, browser: 11.2 },
};
