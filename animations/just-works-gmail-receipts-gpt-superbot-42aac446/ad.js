/* ad.js - config for the "every receipt in Gmail, totalled" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Every number the chat counts up comes from ./data.js; this file is the config only. */

export default {
  id: 'just-works-gmail-receipts-gpt-superbot-42aac446',
  title: 'What I spent this year',
  slug: 'gmail-receipts-gpt',

  ask: 'Find every receipt in my Gmail from this year and tell me what I spent',

  gpt: {
    attempt: 'Reading mail.google.com',
    reply: "I can't open your Gmail, so I can't see your receipts, your totals or what any of it cost.\n\nTry searching your inbox for 'receipt' or 'invoice', or filtering by sender, then paste the amounts here. I can help add them up once you have.",
  },

  card: {
    text: "ChatGPT can't open your inbox. superbot already did.",
    hl: 'superbot already did.',
  },

  // platforms aggregated, counts tick up in the chat
  sources: [
    { id: 'gmail', name: 'Gmail', logo: './brand/gmail.svg', count: 14902 },
  ],

  steps: [
    'Reading 14,902 emails from 2026',
    'Found 612 receipts',
    'Reading totals and taxes',
    'Spotting 11 subscriptions',
  ],

  found: { n: 612, label: 'receipts' },

  build: {
    file: 'spend-2026',
    url: 'superbot.app/p/spend',
    tabTitle: '2026 spend',
    favicon: './brand/gmail.svg',
  },

  // f in 0..1 of the browser scene -> scroll target (chart and subscriptions each hold at the viewport top)
  scroll: [
    [0, 0],
    [0.18, '.sp-hero'],
    [0.34, '.sp-chart'],
    [0.52, '.sp-chart'],
    [0.64, '.sp-sublist'],
    [0.8, '.sp-sublist'],
    [0.94, '.sp-receipts'],
  ],

  // cursor rests on the September bar while the chart is held on screen: its tooltip opens
  hover: [[0.36, 0.5, '.sp-chart .sp-bars .sp-bar:nth-child(9)']],

  // cursor presses Cancel on the Spotify row while the subscriptions list is held: the row and the
  // month total stay cancelled for the rest of the spot
  click: [[0.68, '.sp-sublist .sp-sub:nth-child(2) .sp-cancel']],

  end: { text: 'Superbot just works' },
};