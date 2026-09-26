/* ad.js - config for the "Schwab + Robinhood, one overview" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are
   in ./data.js; the photo, the ticker marks and the broker marks are in ./img and ./brand, sourced in
   CREDITS.txt. Read-only by design: Superbot signs in, pulls positions and builds the overview, and
   places no orders. No ChatGPT beat and no card beat in this spot (variant B: the hub's own work is the
   whole point). */

export default {
  id: 'just-works-portfolio-overview-superbot-42aac446',
  title: 'Schwab + Robinhood, one overview',
  slug: 'portfolio-overview',

  ask: 'Log into my Schwab and Robinhood accounts, pull my live positions from both, and give me one overview: how the combined portfolio sits against my 60/30/10 target, and where a 7% trailing stop would sit under every stock I own.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat
  sources: [
    { id: 'schwab', name: 'Schwab Individual', logo: './brand/schwab.svg', count: 5, what: 'positions pulled' },
    { id: 'roth', name: 'Schwab Roth IRA', logo: './brand/schwab.svg', count: 3, what: 'positions pulled' },
    { id: 'rh', name: 'Robinhood Individual', logo: './brand/robinhood.svg', count: 4, what: 'positions pulled' },
    { id: 'stops', name: '7% trailing-stop levels', logo: './brand/app.svg', count: 8, what: 'stocks mapped' },
  ],

  steps: [
    'Signed in to Schwab and Robinhood, read-only',
    'Pulled 12 live positions across 3 accounts',
    'Stocks at 71.5% against your 60% target',
    'Mapped a 7% trailing stop under all 8 stocks',
  ],

  found: { n: 11, one: 'holding', many: 'holdings', label: 'holdings merged' },

  build: {
    file: 'portfolio-overview',
    url: 'superbot.app/p/portfolio-overview',
    tabTitle: 'Portfolio Overview · 60/30/10',
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. 0.14 and 0.34 both name the hero, so the
  // page holds still on the sync card and the allocation ring while render(p) reads both brokers and
  // grows the ring to its real split (p 0.05 to 0.27, see site.js SYNC_A/SYNC_B), then lets the synced
  // stamp stand for a beat. 0.46 and 0.57 both name the drift rows: the approach creeps them into view and
  // holds, the window the hover and the click are timed against. The click swaps in the Stop levels
  // panel, 0.78 brings it into view, and 0.95 runs down to what keeps watching.
  scroll: [
    [0, 0],
    [0.14, '.po-hero'],
    [0.34, '.po-hero'],
    [0.46, '.po-drift'],
    [0.57, '.po-drift'],
    [0.78, '.po-panel--2'],
    [0.95, '.po-watch'],
  ],

  // cursor rests on the stocks row (the sleeve over target), inside the hold above, and leaves before the click
  hover: [[0.475, 0.555, '.po-row--stocks']],

  // cursor clicks the Stop levels tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.63, '.po-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25 s
  dur: { hub: 11, browser: 10.5 },
};
