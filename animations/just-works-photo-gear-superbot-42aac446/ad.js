/* ad.js - config for the "Lightroom + B&H + MPB + KEH, one camera gear check" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the hero photo and the store marks are in ./img and ./brand, sourced in CREDITS.txt. Read-only
   by design: Superbot reads the Adobe Lightroom catalog for the focal lengths this photographer really
   shoots, reads the saved B&H and MPB wishlists, and checks B&H, Adorama, MPB, KEH and eBay for what each
   wishlist item costs new and used right now. It buys nothing, bids on nothing, adds nothing to a cart, and
   never edits or exports a photo. No ChatGPT beat and no card beat in this spot (variant B: the hub's own
   work is the whole point). Every figure below is read from data.js, so the hub, the steps and the page
   agree. */

import { accounts, counts, meta, money, n0 } from './data.js';

// what Superbot read, with the counts that tick up in the chat. `what` is the source's own noun: photos read
// for the catalog, items saved for the two wishlists, listings checked for the five stores.
const src = (a) => ({ id: a.id, name: a.name, logo: a.logo, count: a.pulled, what: a.what });

export default {
  id: 'just-works-photo-gear-superbot-42aac446',
  title: 'Lightroom + B&H + MPB + KEH, one camera gear check',
  slug: 'photo-gear',

  ask: 'Read my Lightroom catalog in my Adobe account and tell me which lenses and focal lengths I actually shoot most. Check my B&H and MPB wishlists, watch new and used stock and prices for every wishlist lens and the sold out Fujifilm X100VI across B&H, Adorama, MPB, KEH and eBay, and put it all in one overview: what I shoot, what is in stock right now, the cheapest new vs used price for each item, and which listings just appeared.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  sources: accounts.map(src),

  steps: [
    `Read the Lightroom catalog, read-only: ${n0(counts.photos)} frames across ${counts.lenses} lenses on one ${meta.body}`,
    `Sorted every frame into ${counts.buckets} focal length buckets: ${counts.topFocal} equivalent is ${counts.topShare}% of what you shoot`,
    `Read the B&H and MPB wishlists, ${counts.wish} items after the merge, and checked ${n0(counts.listings)} listings at ${counts.stores} stores`,
    `${counts.inStock} of ${counts.wish} in stock, ${counts.fresh} listed in the last hour, cheapest used ${money(counts.usedBest)}`,
  ],

  found: { n: counts.wish, one: 'lens on the wishlist', many: 'lenses on the wishlist', label: `lenses on the wishlist, ${counts.inStock} in stock right now` },

  build: {
    file: 'photo-gear',
    url: 'superbot.app/p/photo-gear',
    tabTitle: `Gear Watch · ${counts.inStock} of ${counts.wish} in stock`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.13 and 0.3 both name the hero, so the page holds on the sync card while render(p) reads the eight
  //    sources (p 0 to 0.17, see site.js SYNC_A/SYNC_B) and the wishlist is matched against the focal length
  //    histogram (p 0.165 to 0.285, MATCH_A/MATCH_B); the finished card holds about 1.7 s.
  // 2. 0.355 and 0.52 both name the status strip, whose four counters ease in as it lands (p 0.36 to 0.44,
  //    GROW_A/GROW_B), then hold with the cursor on the wishlist-in-stock tile's icon chip.
  // 3. 0.575 and 0.665 hold on the shoot section; its five focal length cards settle in turn as it arrives
  //    (ROW_A/ROW_B) and the cursor rests on the pin beside the Top length badge on the 35mm card.
  // 4. 0.7 and 0.78 hold on the panels, the window the click on the Just listed tab is timed against. The
  //    click swaps the Just listed panel into the same slot, 0.86 settles on it (FRESH_A/FRESH_B) and the
  //    cursor glides to the cheapest used total line, where it rests to the end.
  scroll: [
    [0, 0],
    [0.13, '.pg-hero'],
    [0.3, '.pg-hero'],
    [0.355, '.pg-stats'],
    [0.52, '.pg-stats'],
    [0.575, '.pg-shoot'],
    [0.665, '.pg-shoot'],
    [0.7, '.pg-panels'],
    [0.78, '.pg-panels'],
    [0.86, '.pg-panel--2'],
  ],

  // the cursor lands on a graphic at every beat, never on a figure the beat is showing: the wishlist match
  // bar in the sync card, the wishlist-in-stock tile's icon chip (not its 5 of 6), the empty .pg-pin beside
  // the Top length badge (not the share figure under it), and the cheapest used total row, whose figure is
  // right-aligned clear of the pointer. site.css highlights each block on :has(.is-hover).
  hover: [
    [0.1, 0.29, '.pg-mbar'],
    [0.39, 0.52, '.pg-stat--stock .pg-stati'],
    [0.59, 0.665, '.pg-pin'],
    [0.9, 0.97, '.pg-total'],
  ],

  // the cursor clicks the Just listed tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.79, '.pg-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25.6 s
  dur: { hub: 11, browser: 11.2 },
};