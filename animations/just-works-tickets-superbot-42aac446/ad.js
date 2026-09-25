/* ad.js - config for the "two seats together for Friday's game" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Listing rows, venue sections and platform counts live in ./data.js; this file is the config only. */

export default {
  id: 'just-works-tickets-superbot-42aac446',
  title: 'Two seats together, Friday',
  slug: 'tickets',

  ask: "Find me 2 seats together for Friday's game under $150 each on every ticket site",

  // no ChatGPT beat in this spot: the seat map and the fee math are the whole point
  gpt: null,
  card: null,

  // the five ticket sites superbot opened, with the listings each one returned (2,904 in all)
  sources: [
    { id: 'stubhub', name: 'StubHub', logo: './brand/stubhub.svg', count: 812 },
    { id: 'seatgeek', name: 'SeatGeek', logo: './brand/seatgeek.svg', count: 604 },
    { id: 'ticketmaster', name: 'Ticketmaster', logo: './brand/ticketmaster.svg', count: 588 },
    { id: 'vividseats', name: 'Vivid Seats', logo: './brand/vividseats.svg', count: 486 },
    { id: 'gametime', name: 'Gametime', logo: './brand/gametime.svg', count: 414 },
  ],

  steps: [
    'Opening 5 ticket sites',
    'Reading 2,904 listings',
    'Keeping pairs side by side',
    'Showing prices with fees',
  ],

  found: { n: 412, label: 'pairs under $150 each' },

  build: {
    file: 'friday-two-seats',
    url: 'superbot.app/p/friday',
    tabTitle: 'Friday, 2 seats',
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> 0..1 page scroll, or a selector scrolled under the sticky header.
  // The paired keys hold the page still while the pointer hovers a section and while it presses Checkout.
  scroll: [
    [0, 0],
    [0.26, '.tix-map'],
    [0.5, '.tix-map'],
    [0.6, '.tix-best'],
    [0.78, '.tix-best'],
    [0.96, '.tix-list'],
  ],

  // the pointer rests on the lower bowl section that holds the best pair, while the map is held still
  hover: [[0.34, 0.48, '.tix-hb__w[data-sec="112"]']],

  // the pointer presses Checkout on the best-view card, which then switches to its started state
  click: [[0.68, '.tix-best .tix-go']],

  end: { text: 'Superbot just works' },

  // 25.9 s loop: 11 s hub, 11.5 s in Chrome (the page plan stretches over it), 3.4 s end card
  dur: { hub: 11, browser: 11.5, end: 3.4 },
};