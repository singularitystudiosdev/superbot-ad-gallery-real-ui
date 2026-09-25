/* ad.js - config for the "which espresso machine under $300 has the best reviews" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Beats: ChatGPT cannot open amazon.com or read the review pages -> black card -> superbot reads the
   reviews and builds the report page -> the page is scrolled, a topic bar is hovered and a machine tab
   is clicked -> end card. */

export default {
  id: 'just-works-espresso-gpt-superbot-42aac446',
  title: 'Espresso, by the reviews',
  slug: 'espresso-gpt',

  ask: 'Which espresso machine under $300 on Amazon has the best reviews? Read all of them.',

  gpt: {
    attempt: 'Opening amazon.com',
    reply:
      "I can't open amazon.com or read the reviews on it. Review pages are not something I can browse, and anything I describe from memory would be months out of date.\n\nWhat to do instead: sort by lowest rating first, read the complaints about returns, and treat a fault that many reviewers describe the same way as a real pattern.",
  },

  card: {
    text: 'ChatGPT read zero reviews. superbot read 38,412.',
    hl: 'superbot read 38,412.',
  },

  // the platform the reviews come from, its count ticking up in the chat
  sources: [
    { id: 'amazon', name: 'Amazon', logo: './brand/amazon.svg', count: 38412 },
  ],

  steps: [
    'Opening amazon.com',
    'Reading 38,412 reviews',
    'Grouping complaints by topic',
    'Flagging repeat return reasons',
  ],

  found: { n: 38412, label: 'amazon reviews read' },

  build: {
    file: 'espresso-review-report',
    url: 'superbot.app/p/espresso',
    tabTitle: 'Espresso, by the reviews',
    favicon: './brand/amazon.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Repeated keys are dwells: the page holds on the
  // topic list while the cursor rests on one row, then holds on the machine tab strip while the cursor
  // clicks the Halden C3 tab and its report panel swaps in below.
  scroll: [
    [0, 0],
    [0.18, '.xr-topics'],
    [0.46, '.xr-topics'],
    [0.62, '.xr-tabbar'],
    [0.72, '.xr-tabbar'],
    [0.86, '.xr-tabpanels'],
    [0.97, '.xr-verdict'],
  ],

  // cursor rests on the milk frother topic row, which opens its complaint note
  hover: [[0.24, 0.43, '.xr-topic--frother']],

  // cursor clicks the third machine tab; its report panel is the one on screen from then on
  click: [[0.68, '.xr-tab--3']],

  end: { text: 'Superbot just works' },

  // 33.7s loop, inside the series band
  dur: { gpt: 7.5, card: 2.6, hub: 10.2, browser: 10.4, end: 3.0 },
};