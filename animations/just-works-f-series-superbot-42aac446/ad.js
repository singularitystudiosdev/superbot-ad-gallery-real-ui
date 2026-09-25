/* ad.js - config for the "used F-Series on every platform" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Listing data, footer counts and map pins live in ./data.js; this file is the config only. */

export default {
  id: 'just-works-f-series-superbot-42aac446',
  title: 'Used F-Series, every platform',
  slug: 'f-series',

  ask: 'Find me all listings of used Ford F-Series on all platforms',

  // no ChatGPT beat in this spot: the board is the whole point
  gpt: null,
  card: null,

  // platforms aggregated, counts tick up in the chat (406 raw, 318 after dedupe)
  sources: [
    { id: 'facebook', name: 'Facebook Marketplace', logo: './brand/facebook.svg', count: 96 },
    { id: 'craigslist', name: 'Craigslist', logo: './brand/craigslist.svg', count: 71 },
    { id: 'ebay', name: 'eBay Motors', logo: './brand/ebay.svg', count: 68 },
    { id: 'cargurus', name: 'CarGurus', logo: './brand/cargurus.svg', count: 54 },
    { id: 'autotrader', name: 'Autotrader', logo: './brand/autotrader.svg', count: 49 },
    { id: 'carsdotcom', name: 'Cars.com', logo: './brand/carsdotcom.svg', count: 38 },
    { id: 'offerup', name: 'OfferUp', logo: './brand/offerup.svg', count: 30 },
  ],

  steps: [
    'Opening 7 marketplaces',
    'Reading 1,204 listings',
    'Removing 88 duplicates',
    'Checking prices against market',
  ],

  found: { n: 318, label: 'active listings' },

  build: {
    file: 'f-series-finder',
    url: 'superbot.app/p/f-series',
    tabTitle: 'F-Series Finder',
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic, and the last key ends on the map strip.
  // 0.20 lands the board head. 0.52 and 0.62 both name the card the cursor hovers: the approach creeps
  // the card up to the sticky filter bar and then holds the page still, which is the window the hover and
  // the click are timed against. Naming the card (not the grid) is what keeps it on screen at 1x1 and 4x5,
  // where the grid is two columns wide and card three sits a full row lower than at 16x9. 0.90 is the run
  // down to the map.
  scroll: [
    [0, 0],
    [0.2, '.ffx-listings'],
    [0.52, '.ffx-listings .ffx-grid .ffx-card:nth-child(3)'],
    [0.62, '.ffx-listings .ffx-grid .ffx-card:nth-child(3)'],
    [0.9, '.ffx-map'],
  ],

  // cursor rests on the third listing card, an F-250 (2017 Lariat). The window covers the end of the
  // approach and ends where the hold begins, so the card is inside the viewport, clear of the sticky
  // filter bar, for every frame of it. The old window (0.44 to 0.6) fired after the card had left the top.
  hover: [[0.42, 0.52, '.ffx-listings .ffx-grid .ffx-card:nth-child(3)']],

  // cursor clicks the F-250 chip, which re-filters the grid from then on. site.js builds the chips from
  // data.filterChips, so the class selector is used, never a chip position. The chip row is sticky, so it
  // is on screen from the first scroll onward. 0.6 sits inside the 0.52 to 0.62 hold: the page does not
  // move in the 0.42 s the cursor needs to travel to the chip, so the press lands on it.
  click: [[0.6, '.ffx-chip--f250']],

  end: { text: 'Superbot just works' },

  // 24.9 s loop. gpt and card are null in this spot, so the chain is hub + browser + end: the kit's own
  // lengths (hub 10, browser 9) would give 22.4 s, under the contract's 24 s floor. This override belongs
  // to this ad only: the kit defaults are untouched, so a gpt + card sibling stays at ~32.5 s.
  dur: { hub: 11, browser: 10.5 },
};