/* ad.js - config for the "Tesla + Carvana + CarMax + CarGurus, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the hero photo, the listing thumbs and the site marks are in ./img and ./brand, sourced in
   CREDITS.txt.
   Beats: ChatGPT cannot sign in to the Tesla account, cannot watch Tesla's inventory and the Carvana, CarMax
   and CarGurus listings continuously or log each VIN's price drops over time, so it cannot run the hunt ->
   the "superbot can do it!" popup is clicked -> superbot reads Tesla's new and used inventory, the Carvana
   and CarMax stock, a saved CarGurus search and the trade-in estimate and open order in the Tesla account,
   filters 1,561 listings to 13 matches within 200 miles of 78704 under $40,000, logs 6,244 price, mileage,
   FSD and days-on-lot checks with 17 price drops worth $17,100 this week, and ranks every match in one
   shortlist with the best buy flagged. It orders, reserves, cancels and messages nothing. Every figure below
   is read from data.js, so the hub, the steps and the page agree.
   This folder is a copy of the superbot-only variant (just-works-ev-hunt-superbot-42aac446): every asset, the
   site and the config below the gpt block are that spot's, unchanged, so the two variants share one page and
   one hub. */

import { accounts, accOf, counts, meta, usd, n0, best, order, trade } from './data.js';

const src = (a) => ({
  id: a.id, name: a.name, logo: a.logo, count: a.pulled,
  what: a.kind === 'account' ? 'records read' : 'listings scanned',
});

export default {
  id: 'just-works-ev-hunt-gpt-superbot-42aac446',
  title: 'Tesla + Carvana + CarMax + CarGurus, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-ev-hunt), shared by both variants
  slug: 'ev-hunt',

  ask: 'Watch Tesla\'s new and used inventory at every US store plus Carvana, CarMax and my saved CarGurus search for a Model Y Long Range under $40k within 200 miles of 78704. Log every VIN\'s price drops, mileage, FSD and days on lot, pull my trade-in estimate and open order status from my Tesla account, and rank every match in one overview with the best buy flagged.',

  // the ChatGPT beat: it tries the Tesla inventory page, that load fails, and the refusal explains why the
  // whole ask is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the popup's click fits.
  gpt: {
    attempt: 'Opening tesla.com/inventory/new/my',
    reply:
      "I can't sign in to your Tesla account, so I can't pull your trade-in estimate or read your open order status. I also can't watch Tesla's inventory and the Carvana, CarMax and CarGurus listings continuously, so I can't log each VIN's price drops, mileage or days on lot over time.\n\nWhat I can do instead: check tesla.com/inventory, Carvana, CarMax and CarGurus yourself, and set an alert on each one for the Model Y you want.",
  },
  card: null,

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

  // what superbot read, with the counts that tick up in the chat (1,064 + 214 + 186 + 97 listings, then the account)
  sources: accounts.map(src),

  steps: [
    `Read Tesla's inventory at every US store plus Carvana, CarMax and a saved CarGurus search, read-only: ${n0(counts.scanned)} listings`,
    `Filtered to Model Y Long Range under ${usd(meta.budget)} within ${counts.radius} miles of ${meta.zip}: ${n0(counts.matches)} matches, ${n0(counts.filtered)} set aside`,
    `Logged price, mileage, FSD and days on lot on every listing, ${n0(counts.rows)} checks, and ${n0(counts.drops)} price drops worth ${usd(counts.dropTotal)} this week`,
    `Ranked all ${n0(counts.matches)} and flagged the best buy: ${usd(best.price)} at ${best.store}, ${usd(counts.bestSaves)} under the ${usd(order.price)} order`,
  ],

  found: { n: counts.matches, one: 'match', many: 'matches', label: `matches under ${usd(meta.budget)}, ${usd(best.price)} at the top` },

  build: {
    file: 'model-y-hunt',
    url: 'superbot.app/p/model-y-hunt',
    tabTitle: `Car Hunt · ${n0(counts.matches)} matches`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.13 and 0.3 both name the hero, so the page holds on the sync card while render(p) reads the five
  //    sources (p 0 to 0.17, see site.js SYNC_A/SYNC_B) and the filter runs 1,561 listings down to 13
  //    (p 0.165 to 0.285, FILT_A/FILT_B); the finished card holds about 1.7 s.
  // 2. 0.355 and 0.52 both name the status strip, whose four counters ease in as it lands (p 0.36 to 0.44,
  //    GROW_A/GROW_B): settled at 1,561 / 13 / 17 / $6,090 from f 0.38, then held with the cursor on the
  //    drops tile.
  // 3. 0.575 and 0.665 hold on the ranked table; its eight rows settle in turn as it arrives (ROW_A/ROW_B)
  //    and the cursor rests on the flagged best buy row.
  // 4. 0.7 and 0.78 hold on the panels, the window the click on the Your Tesla tab is timed against. The
  //    click swaps the Your Tesla panel into the same slot, 0.86 settles on it (p 0.86, TL_A/TL_B) and the
  //    cursor glides to the difference-to-pay line, where it rests to the end.
  scroll: [
    [0, 0],
    [0.13, '.ev-hero'],
    [0.3, '.ev-hero'],
    [0.355, '.ev-flags'],
    [0.52, '.ev-flags'],
    [0.575, '.ev-rank'],
    [0.665, '.ev-rank'],
    [0.7, '.ev-panels'],
    [0.78, '.ev-panels'],
    [0.86, '.ev-panel--2'],
  ],

  // the cursor points at each beat, and every one of those points is chosen so the pointer lands on a graphic
  // and never on a figure the beat is showing: the filter bar (not the counters), the drops tile's icon chip
  // (not its 17), the best buy row's .ev-pin, an empty 1 px box in the gap right of the Best buy badge (not the
  // price the drop badge sits on), and the difference-to-pay row, whose figure is right-aligned clear of the
  // pointer. site.css highlights each block on :has(.is-hover) on the anchor.
  hover: [
    [0.1, 0.29, '.ev-mbar'],
    [0.39, 0.52, '.ev-flag--drops .ev-flagi'],
    [0.59, 0.665, '.ev-pin'],
    [0.9, 0.97, '.ev-diff'],
  ],

  // the cursor clicks the Your Tesla tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.79, '.ev-tab--2']],

  end: { text: 'Superbot just works' },

  // hub and browser keep variant B's lengths, so every f in the scroll/hover/click plan above lands on the
  // same frame of the page as it does in B; the gpt beat in front (about 7.75 s, ask + reply driven, no
  // cfg.dur.gpt) puts the loop near 33.4 s, like the series' other ChatGPT-first spots
  dur: { hub: 11, browser: 11.2 },
};