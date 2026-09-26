/* ad.js - config for the "Steam + Epic + GOG, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Beats: ChatGPT cannot sign in to Steam, Epic Games or GOG or see what they own, so it cannot build the
   backlog -> the "superbot can do it!" popup is clicked -> superbot signs in to all three stores
   read-only, pulls 318 games, merges the 14 owned twice, matches the unplayed ones to HowLongToBeat and
   Steam reviews, sorts them shortest-and-best first and finds 6 wishlist games on sale. Nothing is bought.
   This folder is a copy of the superbot-only variant (just-works-pc-backlog-superbot-42aac446): every
   asset, the site and the config below the gpt block are that spot's, unchanged, so the two variants
   share one page and one hub. */

export default {
  id: 'just-works-pc-backlog-gpt-superbot-42aac446',
  title: 'Steam + Epic + GOG, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-pc-backlog), shared by both variants
  slug: 'pc-backlog',

  ask: 'Sign into my Steam, Epic Games and GOG accounts, pull every game I own with its playtime, merge the ones I own on more than one store, match each unplayed game to its HowLongToBeat length and Steam review score, and give me one backlog sorted shortest-and-best first. Also tell me which of my Steam wishlist games are on sale today.',

  // the ChatGPT beat: it tries the Steam games page, that load fails, and the refusal explains why the
  // whole ask is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the popup's click fits.
  gpt: {
    attempt: 'Opening steamcommunity.com/id/dkessler/games',
    reply:
      "I can't sign in to your Steam, Epic Games or GOG accounts, so I can't see which games you own, how long you've played them or what's on your wishlist.\n\nWhat I can do instead: suggest some short, well-reviewed games in general and explain how to look them up on HowLongToBeat yourself.",
  },
  card: null,

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

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
