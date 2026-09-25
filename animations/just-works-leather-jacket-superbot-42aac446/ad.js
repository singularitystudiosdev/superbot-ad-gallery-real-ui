/* ad.js: config for the "vintage leather jacket, size M, on every resale app" spot.
   Kit: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Listing rows, era/condition tags, the per-app price histogram and the footer copy live in ./data.js. */

export default {
  id: 'just-works-leather-jacket-superbot-42aac446',
  title: 'Vintage leather jacket, size M',
  slug: 'leather-jacket',

  ask: 'Find me a vintage leather jacket in size M on every resale app',

  // no ChatGPT beat here: the moodboard is the whole point
  gpt: null,
  card: null,

  // every app that was read, with how many listings it reported before the size and era filter.
  // Counts sum to 3,318, the number in step 2.
  sources: [
    { id: 'ebay', name: 'eBay', logo: './brand/ebay.svg', count: 1124 },
    { id: 'depop', name: 'Depop', logo: './brand/depop.svg', count: 806 },
    { id: 'vinted', name: 'Vinted', logo: './brand/vinted.svg', count: 623 },
    { id: 'poshmark', name: 'Poshmark', logo: './brand/poshmark.svg', count: 402 },
    { id: 'grailed', name: 'Grailed', logo: './brand/grailed.svg', count: 236 },
    { id: 'mercari', name: 'Mercari', logo: './brand/mercari.svg', count: 127 },
  ],

  steps: [
    'Opening 6 resale apps',
    'Reading 3,318 jackets',
    'Keeping size M and true vintage',
    'Removing 140 reposts',
  ],

  // n counts listings kept (size M, true vintage), so the hub build card names them: "318 listings".
  // label stays "in size M" for the aggregation footer; one/many are read only by the hub's copy.
  found: { n: 318, one: 'listing', many: 'listings', label: 'in size M' },

  build: {
    file: 'leather-size-m',
    url: 'superbot.app/p/leather',
    tabTitle: 'Leather, size M',
    favicon: './brand/grailed.svg',
  },

  // f in 0..1 of the browser scene -> scroll target (selector, or a 0..1 fraction of the scroll range).
  // The two identical keys around 0.6 hold the page still for the hover and the Save press: the button
  // has to be on screen at the moment the pointer lands on it.
  // the first key holds at the top for the opening beat, so the masthead is whole when the window lands
  scroll: [
    [0, 0],
    [0.1, 0],
    [0.22, '.ljm-brief'],
    [0.42, '.ljm-wall'],
    [0.58, '.ljm-wall .ljm-card:nth-child(3)'],
    [0.74, '.ljm-wall .ljm-card:nth-child(3)'],
    [1, '.ljm-hist'],
  ],

  // cursor rests on the third plate's Save, then presses it. The window has to close before the click
  // stop arms at click[0] - 0.42/(browser dur - 1) = 0.66 - 0.042 = 0.618, or the glide to the Save would
  // start while the hover stop still held the pointer: 0.61 is the last key that clears it. There is no
  // visual gap, because the click stop hovers its own target from 0.618 on.
  hover: [[0.5, 0.61, '.ljm-wall .ljm-card:nth-child(3) .ljm-save']],

  // the press stamps that plate kept for the rest of the loop
  click: [[0.66, '.ljm-wall .ljm-card:nth-child(3) .ljm-save']],

  // 10 + 11 + 3.4 = 24.4 s loop
  dur: { hub: 10, browser: 11, end: 3.4 },

  end: { text: 'Superbot just works' },
};