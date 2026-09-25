/* ad.js - config for the "gift for dad, who fishes" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css). */

export default {
  id: 'just-works-gift-dad-gpt-superbot-42aac446',
  title: 'Fishing gifts for dad, under $50',
  slug: 'gift-dad-gpt',

  ask: 'Find a gift for my dad on Amazon under $50, he loves fishing',

  gpt: {
    attempt: 'Searching amazon.com',
    reply: "I can't browse Amazon, so I don't have live listings, prices or stock.\n\nSome ideas: a tackle box, a fishing hat, a mug with a fish on it. Search amazon.com for fishing gifts under $50 and sort by rating to see what is really in stock.",
  },

  card: {
    text: 'Ideas are not gifts. superbot found 8.',
    hl: 'superbot found 8.',
  },

  // platforms aggregated, counts tick up in the chat
  sources: [
    { id: 'amazon', name: 'Amazon', logo: './brand/amazon.svg', count: 1912 },
  ],

  steps: [
    'Opening amazon.com',
    'Searching 1,912 fishing gifts under $50',
    'Dropping items with bad reviews',
    'Checking delivery by Thursday',
  ],

  found: { n: 1912, label: 'fishing gifts under $50' },

  build: {
    file: 'dad-gift-guide',
    url: 'superbot.app/p/dad',
    tabTitle: 'For Dad, who fishes',
    favicon: './brand/amazon.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. The two .gd-gift:nth-child(4) keys are a dwell:
  // the guide holds on the fillet knife row for the whole hover window, so the row is under the cursor
  // and wholly inside the viewport (minus the sticky bar) at every frame of that window.
  scroll: [
    [0, 0],
    [0.14, '.gd-hero'],
    [0.34, '.gd-gift:nth-child(4)'],
    [0.6, '.gd-gift:nth-child(4)'],
    [0.8, '.gd-wrapline'],
    [0.97, 1],
  ],

  // cursor rests on the fillet knife row through its dwell, then presses the gift wrap switch in the sticky bar
  hover: [[0.4, 0.54, '.gd-gift:nth-child(4)']],
  click: [[0.72, '.gd-wrap']],

  end: { text: 'Superbot just works' },
};