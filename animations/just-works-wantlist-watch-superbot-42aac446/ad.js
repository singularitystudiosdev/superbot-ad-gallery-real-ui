/* ad.js - config for the "Discogs wantlist, overnight" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are
   in ./data.js; the photos and the Discogs mark are in ./img and ./brand, sourced in CREDITS.txt.
   No ChatGPT beat and no card beat in this spot (variant B: the hub's own work is the whole point). */

export default {
  id: 'just-works-wantlist-watch-superbot-42aac446',
  title: 'Discogs wantlist, overnight',
  slug: 'wantlist-watch',

  ask: 'Watch my Discogs wantlist overnight. The moment a VG+ copy lists under my max price from a seller rated 99% or higher, sign into my Discogs, buy it and file it into my collection.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat
  sources: [
    { id: 'wantlist', name: 'Discogs wantlist', logo: './brand/discogs.svg', count: 42, what: 'records watched' },
    { id: 'market', name: 'Discogs Marketplace', logo: './brand/discogs.svg', count: 1284, what: 'listings checked' },
    { id: 'sellers', name: 'Seller feedback', logo: './brand/discogs.svg', count: 212, what: 'sellers checked' },
    { id: 'history', name: 'Discogs sales history', logo: './brand/discogs.svg', count: 42, what: 'price histories read' },
  ],

  steps: [
    'Watched 42 wantlist records overnight',
    'Checked 1,284 listings for VG+ under your max',
    'Signed into Discogs, bought Night Ferry for $38',
    'Filed it to your collection, folder Jazz',
  ],

  found: { n: 1284, one: 'listing', many: 'listings', label: 'listings checked' },

  build: {
    file: 'wantlist-watch',
    url: 'superbot.app/p/wantlist-watch',
    tabTitle: 'Wantlist Watch · Overnight',
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. 0.16 holds on the hero (the order card).
  // 0.50 and 0.60 both name the overnight log: the approach creeps it into view and then holds still,
  // which is the window the hover and the click are timed against. The click swaps in the Collection
  // panel, 0.80 brings the whole panel (banner, folders, shelf) into view, and 0.95 runs down to the still-watching list.
  scroll: [
    [0, 0],
    [0.16, '.ww-hero'],
    [0.34, '.ww-rules'],
    [0.5, '.ww-log'],
    [0.6, '.ww-log'],
    [0.8, '.ww-panel--2'],
    [0.95, '.ww-watch'],
  ],

  // cursor rests on the bought row of the log, inside the hold above, and leaves before the click
  hover: [[0.47, 0.58, '.ww-row--buy']],

  // cursor clicks the Collection tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.65, '.ww-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25 s
  dur: { hub: 11, browser: 10.5 },
};
