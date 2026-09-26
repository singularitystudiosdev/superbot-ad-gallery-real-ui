/* ad.js - config for the "Discogs wantlist, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Beats: ChatGPT cannot stay up overnight or sign in to Discogs -> the "superbot can do it!" popup is
   clicked -> superbot watches the wantlist, buys the copy and files it. This folder is a copy of the
   superbot-only variant (just-works-wantlist-watch-superbot-42aac446): every asset, the site and the
   config below the gpt block are that spot's, unchanged, so the two variants share one page and one hub. */

export default {
  id: 'just-works-wantlist-watch-gpt-superbot-42aac446',
  title: 'Discogs wantlist, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-wantlist-watch), shared by both variants
  slug: 'wantlist-watch',

  ask: 'Watch my Discogs wantlist overnight. The moment a VG+ copy lists under my max price from a seller rated 99% or higher, sign into my Discogs, buy it and file it into my collection.',

  // the ChatGPT beat: it tries discogs.com, that load fails, and the refusal explains why the whole ask
  // is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the popup's click fits.
  gpt: {
    attempt: 'Opening discogs.com/mywantlist',
    reply:
      "I cannot keep running overnight or sign in to your Discogs account, so I cannot watch your wantlist, buy a record or add it to your collection for you.\n\nWhat I can do instead: paste a listing here and I will tell you whether the grade and price look fair.",
  },
  card: null,

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

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

  // hub and browser keep variant B's lengths; the gpt beat in front puts the loop near 33 s, like the
  // series' other ChatGPT-first spots
  dur: { hub: 11, browser: 10.5 },
};
