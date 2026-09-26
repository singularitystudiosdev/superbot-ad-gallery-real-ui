/* ad.js - config for the "Steam + Epic + GOG, one backlog" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are
   in ./data.js; the photo, the game capsules and the store marks are in ./img and ./brand, sourced in
   CREDITS.txt. Read-only by design: Superbot signs in, reads the three libraries and the wishlist, and
   buys nothing. No ChatGPT beat and no card beat in this spot (variant B: the hub's own work is the
   whole point). */

export default {
  id: 'just-works-pc-backlog-superbot-42aac446',
  title: 'Steam + Epic + GOG, one backlog',
  slug: 'pc-backlog',

  ask: 'Sign into my Steam, Epic Games and GOG accounts, pull every game I own with its playtime, merge the ones I own on more than one store, match each unplayed game to its HowLongToBeat length and Steam review score, and give me one backlog sorted shortest-and-best first. Also tell me which of my Steam wishlist games are on sale today.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat
  sources: [
    { id: 'steam', name: 'Steam library', logo: './brand/steam.svg', count: 214, what: 'games pulled' },
    { id: 'epic', name: 'Epic Games library', logo: './brand/epic.svg', count: 63, what: 'games pulled' },
    { id: 'gog', name: 'GOG library', logo: './brand/gog.svg', count: 41, what: 'games pulled' },
    { id: 'hltb', name: 'HowLongToBeat + Steam reviews', logo: './brand/hltb.svg', count: 112, what: 'games matched' },
  ],

  steps: [
    'Signed in to Steam, Epic Games and GOG, read-only',
    'Pulled 318 games and merged the 14 you own twice',
    'Matched 112 unplayed games to HowLongToBeat and reviews',
    '6 of your 34 wishlist games are on sale today',
  ],

  found: { n: 118, one: 'game', many: 'games', label: 'unplayed games sorted' },

  build: {
    file: 'pc-backlog',
    url: 'superbot.app/p/pc-backlog',
    tabTitle: 'Backlog · shortest + best',
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. 0.14 and 0.34 both name the hero, so the
  // page holds still on the sync card and the library ring while render(p) reads the three stores and
  // grows the ring to its real split (p 0.05 to 0.27, see site.js SYNC_A/SYNC_B), then lets the synced
  // stamp stand for a beat. 0.44 drifts past the merged duplicates; 0.52 and 0.61 both name the backlog
  // panel, the hold the hover on row 1 and the tab click are timed against. The click swaps the wishlist
  // sales into the same slot, 0.80 settles on them, and 0.95 runs down to what keeps watching.
  scroll: [
    [0, 0],
    [0.14, '.bl-hero'],
    [0.34, '.bl-hero'],
    [0.44, '.bl-drift'],
    [0.52, '.bl-panels'],
    [0.61, '.bl-panels'],
    [0.8, '.bl-panel--2'],
    [0.95, '.bl-watch'],
  ],

  // cursor rests on the first backlog row (the game up next), inside the hold above, and leaves before the click
  hover: [[0.53, 0.6, '.bl-brow--1']],

  // cursor clicks the On sale tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.65, '.bl-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25 s
  dur: { hub: 11, browser: 10.5 },
};
