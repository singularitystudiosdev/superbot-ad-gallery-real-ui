/* ad.js - config for the "waiver night, three leagues" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are
   in ./data.js; the photos and the three platform marks are in ./img and ./brand, sourced in CREDITS.txt.
   No ChatGPT beat and no card beat in this spot (variant B: the hub's own work is the whole point). */

export default {
  id: 'just-works-waiver-night-superbot-42aac446',
  title: 'Waiver night, three leagues',
  slug: 'waiver-night',

  ask: "It's waiver night. Sign into my ESPN, Yahoo and Sleeper leagues, put in the best waiver claims and set my optimal lineups before Thursday kickoff.",

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

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

  // 24.9 s loop. gpt and card are null in this spot, so the chain is hub + browser + end: the kit's own
  // lengths (hub 10, browser 9) would give 22.4 s, under the series' 24 s floor. The override belongs to
  // this ad only; the kit defaults stay as they are, so a gpt + card sibling still lands near 33 s.
  dur: { hub: 11, browser: 10.5 },
};