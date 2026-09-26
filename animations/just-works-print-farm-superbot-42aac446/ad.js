/* ad.js - config for the "Bambu + Prusa + OctoPrint, one print farm check" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the hero photo, the printer photo and the site marks are in ./img and ./brand, sourced in
   CREDITS.txt. Read-only by design: Superbot reads Bambu Handy, Prusa Connect and OctoPrint for what every
   printer is doing and how many grams sit on every spool, reads the saved MakerWorld and Printables queues,
   and checks the Bambu Lab store, Polymaker, Prusament and Amazon for the colours running short. It starts,
   pauses, cancels and buys nothing. No ChatGPT beat and no card beat in this spot (variant B: the hub's own
   work is the whole point). Every figure below is read from data.js, so the hub, the steps and the page
   agree. */

import { accounts, counts, meta, money, grams, runsOut } from './data.js';

const src = (a) => ({
  id: a.id, name: a.name, logo: a.logo, count: a.pulled,
  what: a.kind === 'account' ? 'records read' : a.kind === 'queue' ? 'models queued' : 'listings checked',
});

const first = runsOut[0];

export default {
  id: 'just-works-print-farm-superbot-42aac446',
  title: 'Bambu + Prusa + OctoPrint, one print farm check',
  slug: 'print-farm',

  ask: 'Check my Bambu Handy, Prusa Connect and OctoPrint printers: what each one is printing, when it finishes, and how much filament is left on every spool and AMS slot. Match that against my MakerWorld and Printables queues, tell me which spools run out first, and find where each missing color is back in stock cheapest at the Bambu store, Polymaker, Prusament or Amazon.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat (three printer apps, two queues, four stores)
  sources: accounts.map(src),

  steps: [
    `Read Bambu Handy, Prusa Connect and OctoPrint, read-only: ${counts.printing} of ${counts.printers} printers printing, next done at ${counts.nextEta}`,
    `Weighed all ${counts.spools} spools and AMS slots, ${grams(counts.gramsOnHand)} on hand, against ${counts.models} queued models needing ${grams(counts.queueGrams)}`,
    `${counts.short} colors run short by ${grams(counts.shortGrams)}, ${first.color} first, dry during ${first.dryDuring}`,
    `Checked ${counts.listings} listings at 4 stores and found every missing color in stock: ${money(counts.restockTotal)} for the cheapest ${meta.kg} kg spools`,
  ],

  found: { n: counts.short, one: 'spool short', many: 'spools short', label: `spools short for the queue, ${money(counts.restockTotal)} to restock` },

  build: {
    file: 'print-farm',
    url: 'superbot.app/p/print-farm',
    tabTitle: `Print Farm · ${counts.printing} printing`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.13 and 0.3 both name the hero, so the page holds on the sync card while render(p) reads the nine
  //    sources (p 0 to 0.17, see site.js SYNC_A/SYNC_B) and the queue is matched against the spools
  //    (p 0.165 to 0.285, MATCH_A/MATCH_B); the finished card holds about 1.7 s.
  // 2. 0.355 and 0.52 both name the status strip, whose four counters ease in as it lands (p 0.36 to 0.44,
  //    GROW_A/GROW_B), then hold with the cursor on the spools short tile.
  // 3. 0.575 and 0.665 hold on the farm; its five printer cards settle in turn as it arrives (ROW_A/ROW_B)
  //    and the cursor rests on the pin by the next printer to finish.
  // 4. 0.7 and 0.78 hold on the panels, the window the click on the Restock tab is timed against. The click
  //    swaps the Restock panel into the same slot, 0.86 settles on it (TL_A/TL_B) and the cursor glides to
  //    the cheapest total line, where it rests to the end.
  scroll: [
    [0, 0],
    [0.13, '.pf-hero'],
    [0.3, '.pf-hero'],
    [0.355, '.pf-stats'],
    [0.52, '.pf-stats'],
    [0.575, '.pf-farm'],
    [0.665, '.pf-farm'],
    [0.7, '.pf-panels'],
    [0.78, '.pf-panels'],
    [0.86, '.pf-panel--2'],
  ],

  // the cursor lands on a graphic at every beat, never on a figure the beat is showing: the match bar in the
  // sync card, the spools short tile's icon chip (not its 4), the .pf-pin beside the Next to finish badge, and
  // the cheapest total row, whose figure is right-aligned clear of the pointer. site.css highlights each block
  // on :has(.is-hover).
  hover: [
    [0.1, 0.29, '.pf-mbar'],
    [0.39, 0.52, '.pf-stat--short .pf-stati'],
    [0.59, 0.665, '.pf-pin'],
    [0.9, 0.97, '.pf-total'],
  ],

  // the cursor clicks the Restock tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.79, '.pf-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25.6 s
  dur: { hub: 11, browser: 11.2 },
};
