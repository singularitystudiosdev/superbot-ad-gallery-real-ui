/* ad.js - config for the "standing desk on Amazon" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css). */

export default {
  id: 'just-works-standing-desk-gpt-superbot-42aac446',
  title: 'Standing desks, compared',
  slug: 'standing-desk-gpt',

  ask: 'Find me a standing desk under $400 on Amazon with 4+ stars',

  gpt: {
    attempt: 'Searching amazon.com',
    reply: "I can't browse Amazon. It blocks automated access, so I can't read live listings, prices or ratings.\n\nSearch 'standing desk' on amazon.com and filter by 4 stars and up.",
  },

  card: {
    text: "ChatGPT can't open Amazon. superbot can.",
    hl: 'superbot can.',
  },

  // platforms aggregated, counts tick up in the chat
  sources: [
    { id: 'amazon', name: 'Amazon', logo: './brand/amazon.svg', count: 212 },
  ],

  steps: [
    'Opening amazon.com',
    'Reading 212 desks under $400',
    'Checking 30,680 reviews',
    'Comparing motors and lift range',
  ],

  found: { n: 212, label: 'desks under $400' },

  build: {
    file: 'desk-comparator',
    url: 'superbot.app/p/desks',
    tabTitle: 'Standing desks, compared',
    favicon: './brand/amazon.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. The two keys on the winner band and the two on the
  // Compare toggle hold the page still across the hover and the click, so both beats land on a target that
  // is parked in the viewport and not sliding under the cursor.
  scroll: [
    [0, 0],
    [0.2, '.dw-winner'],
    [0.4, '.dw-winner'],
    [0.56, '.dw-cmp'],
    [0.78, '.dw-cmp'],
    [0.96, 1],
  ],

  // cursor rests on the winning desk band while the page is parked on it, then clicks the Compare toggle
  hover: [[0.26, 0.36, '.dw-winner']],
  click: [[0.7, '.dw-cmp']],

  end: { text: 'Superbot just works' },
};