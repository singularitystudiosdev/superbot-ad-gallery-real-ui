/* ad.js - config for the "waiver night, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Beats: ChatGPT cannot sign in to the three leagues -> the "superbot can do it!" popup is clicked ->
   superbot does the whole waiver night. The page the hub then opens live in Chrome lives in ./site.js +
   ./site.css; the numbers behind it are in ./data.js; the photos and the league marks are in ./img and
   ./brand, sourced in CREDITS.txt. This folder is a copy of the superbot-only variant
   (just-works-waiver-night-superbot-42aac446): every asset, the site and the config below the gpt block
   are that spot's, unchanged, so the two variants share one page and one hub beat. */

export default {
  id: 'just-works-waiver-night-gpt-superbot-42aac446',
  title: 'Waiver night, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (browser.js sets 'site-' + cfg.slug, hub.js does the
  // same, and site.css scopes all 220 of its rules under .site-waiver-night). A 'waiver-night-gpt' slug
  // here would drop every rule and render the hub and browser beats unstyled. The id, title and the gpt
  // beat are what distinguish this variant.
  slug: 'waiver-night',

  ask: "It's waiver night. Sign into my ESPN, Yahoo and Sleeper leagues, put in the best waiver claims and set my optimal lineups before Thursday kickoff.",

  // the ChatGPT beat: it tries espn.com, that load fails, and the refusal explains why the whole ask is
  // beyond it. No cfg.dur.gpt here on purpose: pinning the gpt length would clamp the popup's click (the
  // scene grows to fit the click instead), so the beat lays itself out at the kit's 7.5s ceiling and the
  // popup lands 0.30s after the refusal finishes streaming. No card beat either.
  gpt: {
    attempt: 'Opening espn.com/fantasy',
    reply:
      "I cannot sign in to your ESPN, Yahoo or Sleeper accounts, so I cannot put in waiver claims or set your lineups for you.\n\nWhat I can do instead: tell me who is available and I will say which players are worth claiming.",
  },
  card: null,

  // the opt-in kit popup: the refusal ad's bottom-right card, clicked on its chat button, which is what
  // hands the spot to the hub. `in` and `click` are left to the kit's defaults (refusal end + 0.30, and
  // 1.15s later). The kit draws it only because cfg.popup is set.
  popup: { text: 'superbot can do it!', button: 'chat' },

  // what superbot read, with the counts that tick up in the chat. 58 + 61 + 44 free agents, then 21
  // practice and injury notes: 184 names ranked in all.
  sources: [
    { id: 'espn', name: 'ESPN Fantasy', logo: './brand/espn.svg', count: 58, what: 'free agents read' },
    { id: 'yahoo', name: 'Yahoo Fantasy', logo: './brand/yahoo.svg', count: 61, what: 'free agents read' },
    { id: 'sleeper', name: 'Sleeper', logo: './brand/sleeper.svg', count: 44, what: 'free agents read' },
    { id: 'nflwire', name: 'NFL injury wire', logo: './brand/nfl.svg', count: 21, what: 'practice notes read' },
  ],

  steps: [
    'Signed into ESPN, Yahoo and Sleeper',
    'Ranked 184 free agents for rest of season',
    'Placed 3 claims with FAAB bids',
    'Set 3 lineups before 8:15 PM kickoff',
  ],

  found: { n: 184, one: 'free agent', many: 'free agents', label: 'free agents ranked' },

  build: {
    file: 'waiver-night',
    url: 'superbot.app/p/waiver-night',
    tabTitle: 'Waiver Night · Week 4',
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic, and the last key ends on the kickoff
  // strip. 0.16 holds on the hero (the countdown beat). 0.50 and 0.60 both name league 1's claim card:
  // the approach creeps it under the sticky bar and then holds the page still, which is the window the
  // hover and the click are timed against. 0.78 is league 3's lineup card, which is the panel the click
  // swaps in, and 0.94 runs down to the kickoff block.
  scroll: [
    [0, 0],
    [0.16, '.wn-hero'],
    [0.36, '.wn-claims'],
    [0.5, '.wn-panel--1 .wn-claimcard'],
    [0.6, '.wn-panel--1 .wn-claimcard'],
    [0.78, '.wn-panel--3 .wn-lineupcard'],
    [0.94, '.wn-kickoff'],
  ],

  // cursor rests on the ADD row of league 1's claim, which is the row the claim is about. The window
  // covers the end of the approach and the whole hold, so the row is inside the viewport for every frame
  // of it, and it ends before the click below.
  hover: [[0.46, 0.58, '.wn-panel--1 .wn-crow--add']],

  // cursor clicks the Sleeper tab in the sticky league bar. site.css swaps the whole league panel on
  // that class (:has() + sibling), so the lineup and the claim on screen from here are league 3's. The
  // tab bar is sticky, so it is on screen from the first scroll onward, and 0.66 sits after the hold
  // above so the press lands on a page that is not moving out from under it.
  click: [[0.66, '.wn-tab--3']],

  end: { text: 'Superbot just works' },

  // 32.65 s loop, measured. The gpt beat lays itself out at the kit's 7.5s ceiling and grows to 7.75s so
  // the popup's click (7.20s) and its 0.55s fall-out fit inside it; hub and browser carry variant B's own
  // overrides (11 and 10.5 against the kit's 10 and 9), and end keeps the kit's 3.4s, which is what puts a
  // gpt + hub + browser + end chain in the series band without a card.
  dur: { hub: 11, browser: 10.5 },
};