/* ad.js - config for the "cheapest 65 inch OLED across four stores" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css). */

export default {
  id: 'just-works-tv-price-gpt-superbot-42aac446',
  title: 'OLED 65, today',
  slug: 'tv-price-gpt',

  ask: 'Find the cheapest 65 inch OLED TV right now on Amazon, Best Buy, Walmart and Target',

  gpt: {
    reply:
      "I can't check a live price. My numbers come from training data that is months old, and I have no way to open a store page and read what it says today.\n\nVisit Amazon, Best Buy, Walmart and Target yourself and compare the 65 inch OLED listings. Prices move every few weeks.",
  },

  card: {
    text: "ChatGPT has old prices. superbot has today's.",
    hl: "superbot has today's.",
  },

  // platforms aggregated, counts tick up in the chat
  sources: [
    { id: 'amazon', name: 'Amazon', logo: './brand/amazon.svg', count: 121 },
    { id: 'bestbuy', name: 'Best Buy', logo: './brand/bestbuy.svg', count: 84 },
    { id: 'walmart', name: 'Walmart', logo: './brand/walmart.svg', count: 96 },
    { id: 'target', name: 'Target', logo: './brand/target.svg', count: 40 },
  ],

  steps: [
    'Opening 4 stores',
    'Matching 14 models across stores',
    'Pulling 90-day price history',
    'Adding tax and shipping',
  ],

  found: { n: 341, label: 'listings read, 14 models matched' },

  build: {
    file: 'oled-65-price-radar',
    url: 'superbot.app/p/oled-65',
    tabTitle: 'OLED 65, today',
    favicon: './brand/walmart.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. The two .op-matrix keys are a dwell: the page
  // holds on the price table while the cursor hovers the cheapest cell and clicks the Walmart lens.
  scroll: [
    [0, 0],
    [0.28, '.op-pick'],
    [0.5, '.op-matrix'],
    [0.72, '.op-matrix'],
    [0.9, '.op-hist'],
    [0.99, 1],
  ],

  // cursor rests on the cheapest cell in the price matrix, then clicks the Walmart lens button.
  // The click sits at 0.70, clear of the hover window's end (0.62): the click stop opens at
  // click[0] - 0.42/(browser dur - 1) = 0.6475, so the two never pull the cursor at once.
  hover: [[0.54, 0.62, '.op-cell--win']],
  click: [[0.70, '.op-lens-btn[data-store="walmart"]']],

  end: { text: 'Superbot just works' },
};