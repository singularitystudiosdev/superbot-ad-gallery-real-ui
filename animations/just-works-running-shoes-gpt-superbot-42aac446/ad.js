/* ad.js - config for the "running shoes, size 10, on Amazon" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css). */

export default {
  id: 'just-works-running-shoes-gpt-superbot-42aac446',
  title: 'Size 10, in stock',
  slug: 'running-shoes-gpt',

  ask: 'Find me running shoes under $120 in size 10 on Amazon',

  gpt: {
    attempt: 'Searching amazon.com',
    reply:
      "amazon.com returned an error, so I can't read live sizes, prices or ratings from it. I can't browse Amazon at all.\n\nOpen amazon.com, search running shoes, then filter by size 10 and price under $120 yourself.",
  },

  card: {
    text: 'ChatGPT hit a wall. superbot walked in.',
    hl: 'superbot walked in.',
  },

  // platforms aggregated, counts tick up in the chat
  sources: [
    { id: 'amazon', name: 'Amazon', logo: './brand/amazon.svg', count: 264 },
  ],

  steps: [
    'Opening amazon.com',
    'Filtering to size 10 in stock',
    'Reading 9,800 reviews',
    'Ranking by cushion and weight',
  ],

  found: { n: 264, label: 'pairs read, 6 in size 10' },

  build: {
    file: 'size-10-drop-board',
    url: 'superbot.app/p/runners',
    tabTitle: 'Size 10, in stock',
    favicon: './brand/amazon.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. The two keys on the third drop's rail hold the
  // page still through the hover and the click, so both land on a target parked in the viewport, not one
  // sliding under the cursor. The rail is the key (not the card): the kit lands a target just under the
  // sticky mast, and the whole 816 px card does not fit under it at 16:9, so the hover and the click both
  // land on the Add button, which does.
  scroll: [
    [0, 0],
    [0.18, '.rs-drop--02'],
    [0.42, '.rs-drop--03 .rs-drop__rail'],
    [0.72, '.rs-drop--03 .rs-drop__rail'],
    [0.95, 1],
  ],

  // cursor rests on the third drop's Add button, then clicks it. The button is the one part of the card
  // that fits under the sticky mast at 16:9, so it is what the hover can land on. The window ends before
  // the click stop arms (clickAt - 0.42 s) so the two stops never overlap in the cursor path.
  hover: [[0.48, 0.64, '.rs-drop--03 .rs-add']],
  click: [[0.7, '.rs-drop--03 .rs-add']],

  end: { text: 'Superbot just works' },
};