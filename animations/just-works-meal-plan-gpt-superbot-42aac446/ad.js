/* ad.js - config for the "Mealie + NYT Cooking + Kroger, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the hero photo, the dish photos and the site marks are in ./img and ./brand, sourced in
   CREDITS.txt.
   Beats: ChatGPT cannot sign in to Mealie, Paprika or NYT Cooking to see the saved recipes, cannot see the
   Kroger, Instacart and Costco accounts for this week's live prices, sale flyers and stock, and cannot read
   Google Calendar for the busy nights, so it cannot plan the week -> the "superbot can do it!" popup is
   clicked -> superbot reads 547 saved recipes in Mealie, Paprika and NYT Cooking and 23 calendar events,
   finds 2 busy nights and puts a quick dinner on each, checks 1,071 prices at Kroger, Instacart and Costco
   (8 on sale, 3 out of stock and swapped), and merges 7 dinners into 33 items at 3 stores, $148.70 for the
   week, $21.24 a dinner. It orders nothing, adds nothing to a cart, edits no recipe and books nothing. Every
   figure below is read from data.js, so the hub, the steps and the page agree.
   This folder is a copy of the superbot-only variant (just-works-meal-plan-superbot-42aac446): every asset,
   the site and the config below the gpt block are that spot's, unchanged, so the two variants share one page
   and one hub. */

import { accounts, counts, meta, money, busyNights, byStore } from './data.js';

const src = (a) => ({
  id: a.id, name: a.name, logo: a.logo, count: a.pulled,
  what: a.kind === 'recipes' ? 'recipes read' : a.kind === 'store' ? 'prices checked' : 'events read',
});

const n0 = (n) => Number(n).toLocaleString('en-US');
const quick = busyNights.map((d) => `${d.dow} ${d.short.toLowerCase()} (${d.mins} min)`).join(' and ');

export default {
  id: 'just-works-meal-plan-gpt-superbot-42aac446',
  title: 'Mealie + NYT Cooking + Kroger, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-meal-plan), shared by both variants
  slug: 'meal-plan',

  ask: 'Plan next week\'s dinners for the four of us from my saved recipes in Mealie, Paprika and NYT Cooking. Check this week\'s prices, sales and what is in stock at Kroger, Instacart and Costco, and look at my Google Calendar so the busy nights get something quick. Give me one grocery list with what each meal costs.',

  // the ChatGPT beat: it tries the NYT Cooking recipe box page, that load fails, and the refusal explains why
  // the whole ask is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the popup's click fits.
  gpt: {
    attempt: 'Opening cooking.nytimes.com/recipe-box',
    reply:
      "I can't sign in to your Mealie, Paprika or NYT Cooking accounts, and I can't see your Kroger, Instacart or Costco accounts, so I can't read your saved recipes, this week's live prices, sale flyers or what is actually in stock. I also can't open your Google Calendar to find the busy nights.\n\nWhat I can do instead: give you a checklist to open each recipe app yourself, write out the week's dinners by hand, and call or visit the three stores to check what is actually in stock.",
  },
  card: null,

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

  // what superbot read, with the counts that tick up in the chat (three recipe apps, three stores, a calendar)
  sources: accounts.map(src),

  steps: [
    `Read ${n0(counts.recipes)} saved recipes in Mealie, Paprika and NYT Cooking and ${counts.events} calendar events, read-only`,
    `Found ${counts.busy} busy nights and put a quick dinner on each: ${quick}`,
    `Checked ${n0(counts.prices)} prices at Kroger, Instacart and Costco: ${counts.onSale} on sale, ${counts.swaps} out of stock and swapped`,
    `Merged ${counts.dinners} recipes into ${counts.lines} items at ${byStore.length} stores, ${money(counts.total)} for the week, ${money(counts.perDinner)} a dinner`,
  ],

  found: { n: counts.dinners, one: 'dinner planned', many: 'dinners planned', label: `dinners planned for ${meta.week}, ${money(counts.total)} for the week` },

  build: {
    file: 'meal-plan',
    url: 'superbot.app/p/meal-plan',
    tabTitle: `Meal Plan · ${counts.dinners} dinners`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.13 and 0.3 both name the hero, so the page holds on the sync card while render(p) reads the seven
  //    sources (p 0 to 0.17, see site.js SYNC_A/SYNC_B) and every recipe's ingredients are matched against
  //    the pantry and the stores (p 0.165 to 0.285, MATCH_A/MATCH_B); the finished card holds about 1.7 s.
  // 2. 0.355 and 0.52 both name the week at a glance strip, whose four counters ease in as it lands (p 0.36
  //    to 0.44, GROW_A/GROW_B), then hold with the cursor on the busy nights tile.
  // 3. 0.575 and 0.665 hold on the week; its seven dinner cards settle in turn as it arrives (ROW_A/ROW_B)
  //    and the cursor rests on the pin by the first busy night's badge.
  // 4. 0.7 and 0.78 hold on the panels, the window the click on the Grocery list tab is timed against; the
  //    sale bars grow meanwhile (OUT_A/OUT_B). The click swaps the Grocery list into the same slot, 0.86
  //    settles on it (TL_A/TL_B) and the cursor glides to the week total line, where it rests to the end.
  scroll: [
    [0, 0],
    [0.13, '.mp-hero'],
    [0.3, '.mp-hero'],
    [0.355, '.mp-stats'],
    [0.52, '.mp-stats'],
    [0.575, '.mp-week'],
    [0.665, '.mp-week'],
    [0.7, '.mp-panels'],
    [0.78, '.mp-panels'],
    [0.86, '.mp-panel--2'],
  ],

  // the cursor lands on a graphic at every beat, never on a figure the beat is showing: the match bar in the
  // sync card, the busy nights tile's icon chip (not its 2), the .mp-pin beside the first Busy night badge,
  // and the week total row, whose figure is right-aligned clear of the pointer. site.css highlights each
  // block on :has(.is-hover).
  hover: [
    [0.1, 0.29, '.mp-mbar'],
    [0.39, 0.52, '.mp-stat--busy .mp-stati'],
    [0.59, 0.665, '.mp-pin'],
    [0.9, 0.97, '.mp-total'],
  ],

  // the cursor clicks the Grocery list tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.79, '.mp-tab--2']],

  end: { text: 'Superbot just works' },

  // hub and browser keep variant B's lengths, so every f in the scroll/hover/click plan above lands on the
  // same frame of the page as it does in B; the gpt beat in front (about 7.75 s, ask + reply driven, no
  // cfg.dur.gpt) puts the loop near 33.4 s, like the series' other ChatGPT-first spots
  dur: { hub: 11, browser: 11.2 },
};