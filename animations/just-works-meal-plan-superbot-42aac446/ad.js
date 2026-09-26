/* ad.js - config for the "Mealie + NYT Cooking + Kroger, one week of dinners" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the hero photo, the dish photos and the site marks are in ./img and ./brand, sourced in
   CREDITS.txt. Read-only by design: Superbot reads the saved recipes in Mealie, Paprika and NYT Cooking,
   this week's prices, sale flyers and stock at Kroger, Instacart and Costco, and Google Calendar for the
   busy nights, then plans a dinner a night and one grocery list. It orders nothing, adds nothing to a cart,
   edits no recipe and books nothing. No ChatGPT beat and no card beat in this spot (variant B: the hub's own
   work is the whole point). Every figure below is read from data.js, so the hub, the steps and the page
   agree. */

import { accounts, counts, meta, money, busyNights, byStore } from './data.js';

const src = (a) => ({
  id: a.id, name: a.name, logo: a.logo, count: a.pulled,
  what: a.kind === 'recipes' ? 'recipes read' : a.kind === 'store' ? 'prices checked' : 'events read',
});

const n0 = (n) => Number(n).toLocaleString('en-US');
const quick = busyNights.map((d) => `${d.dow} ${d.short.toLowerCase()} (${d.mins} min)`).join(' and ');

export default {
  id: 'just-works-meal-plan-superbot-42aac446',
  title: 'Mealie + NYT Cooking + Kroger, one week of dinners',
  slug: 'meal-plan',

  ask: 'Plan next week\'s dinners for the four of us from my saved recipes in Mealie, Paprika and NYT Cooking. Check this week\'s prices, sales and what is in stock at Kroger, Instacart and Costco, and look at my Google Calendar so the busy nights get something quick. Give me one grocery list with what each meal costs.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

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

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25.6 s
  dur: { hub: 11, browser: 11.2 },
};
