/* ad.js - config for the "mid-century couch within 20 miles" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Listings, map pins and the footer counts live in ./data.js; this file is the config only. */

export default {
  id: 'just-works-couch-local-superbot-42aac446',
  title: 'Mid-century couches, 20 miles out',
  slug: 'couch-local',

  ask: 'Find me a mid-century couch under $800 within 20 miles',

  // no ChatGPT beat in this spot: the board and the map are the whole point
  gpt: null,
  card: null,

  // platforms aggregated, counts tick up in the chat (486 read, 38 kept, 9 shown)
  sources: [
    { id: 'facebook', name: 'Facebook Marketplace', logo: './brand/facebook.svg', count: 178 },
    { id: 'offerup', name: 'OfferUp', logo: './brand/offerup.svg', count: 121 },
    { id: 'craigslist', name: 'Craigslist', logo: './brand/craigslist.svg', count: 96 },
    { id: 'nextdoor', name: 'Nextdoor', logo: './brand/nextdoor.svg', count: 54 },
    { id: 'ebay', name: 'eBay', logo: './brand/ebay.svg', count: 37 },
  ],

  steps: [
    'Opening 5 local marketplaces',
    'Reading 486 couch listings',
    'Keeping mid-century under $800',
    'Mapping 20 miles from you',
  ],

  found: { n: 38, label: 'couches kept, 9 inside 20 miles' },

  build: {
    file: 'couches-near-you',
    url: 'superbot.app/p/couches',
    tabTitle: 'Couches near you',
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. The two identical .couch-row:nth-child(3) keys are a
  // dwell: the page holds on the third listing while the cursor hovers it and presses its message button.
  scroll: [
    [0, 0],
    [0.2, '.couch-list'],
    [0.54, '.couch-list .couch-row:nth-child(3)'],
    [0.8, '.couch-list .couch-row:nth-child(3)'],
    [0.97, '.cl-dropped'],
  ],

  // cursor rests on the third listing, which lights its own price pin on the map
  hover: [[0.44, 0.62, '.couch-list .couch-row:nth-child(3)']],

  // cursor presses that listing's message button, which stays pressed for the rest of the scene
  click: [[0.7, '.couch-list .couch-row:nth-child(3) .couch-msg']],

  end: { text: 'Superbot just works' },

  // there is no gpt beat and no card in this spot, so the two scenes this ad is built on get the room:
  // 11 + 10.5 + 3.4 = 24.9 s, inside the kit's 24 to 34 s loop range with no padding beat.
  dur: { hub: 11, browser: 10.5 },
};