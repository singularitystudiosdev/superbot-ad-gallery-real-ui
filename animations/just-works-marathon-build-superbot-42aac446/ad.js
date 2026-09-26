/* ad.js - config for the "Strava + Garmin + Nike Run Club, one training log" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the running photo and the three log marks are in ./img and ./brand, sourced in CREDITS.txt.
   Read-only by design: Superbot signs in to the three run logs, reads them, merges the duplicate copies in
   its own view and changes nothing in Strava, Garmin Connect or Nike Run Club. No ChatGPT beat and no card
   beat in this spot (variant B: the hub's own work is the whole point). */

export default {
  id: 'just-works-marathon-build-superbot-42aac446',
  title: 'Strava + Garmin + Nike Run Club, one training log',
  slug: 'marathon-build',

  ask: 'Sign into my Strava, Garmin Connect and Nike Run Club accounts, pull every run from the last 12 months, merge the duplicates, total the miles on each pair of shoes and flag any past 400, and give me one training overview for the 8 weeks before my marathon.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat
  sources: [
    { id: 'strava', name: 'Strava activities', logo: './brand/strava.svg', count: 286, what: 'runs pulled' },
    { id: 'garmin', name: 'Garmin Connect activities', logo: './brand/garmin.svg', count: 241, what: 'runs pulled' },
    { id: 'nrc', name: 'Nike Run Club runs', logo: './brand/nike.svg', count: 64, what: 'runs pulled' },
    { id: 'gear', name: 'Shoe gear and duplicates', logo: './brand/shoe.svg', count: 5, what: 'pairs totaled' },
  ],

  steps: [
    'Signed in to Strava, Garmin Connect and Nike Run Club, read-only',
    'Pulled 591 runs and merged 203 duplicates',
    'Totaled miles on 5 pairs of shoes, 2 past 400',
    'Built your 8-week Chicago block',
  ],

  found: { n: 388, one: 'run', many: 'runs', label: 'unique runs merged' },

  build: {
    file: 'marathon-build',
    url: 'superbot.app/p/marathon-build',
    tabTitle: 'Training log · Chicago block',
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Three beats, each with a hold:
  // 1. 0.13 and 0.31 both name the hero, so the page holds on the sync card while render(p) reads the three
  //    logs (p 0 to 0.14, see site.js SYNC_A/SYNC_B) and merges the duplicates (591 pulled, 203 the same
  //    run twice, 388 unique, p 0.155 to 0.275, MERGE_A/MERGE_B); the finished card then holds about 1 s.
  // 2. 0.39 and 0.55 both name the 8 week block, whose bars grow once as it lands (p 0.42 to 0.50, see
  //    GROW_A/GROW_B) and then hold for 1.5 s with the cursor on the peak week.
  // 3. 0.61 and 0.66 hold on the run log, the window the click on the Shoes tab is timed against. The click
  //    swaps the shoes panel into the same slot, 0.70 settles on it and the cursor rests on the Nike
  //    Pegasus 41 row, already past 400 mi, to the end of the scene.
  scroll: [
    [0, 0],
    [0.13, '.mb-hero'],
    [0.31, '.mb-hero'],
    [0.39, '.mb-block'],
    [0.55, '.mb-block'],
    [0.61, '.mb-panels'],
    [0.66, '.mb-panels'],
    [0.7, '.mb-panel--2'],
  ],

  // the cursor points at each beat: the merge counters, the peak week, then the flagged pair
  hover: [
    [0.1, 0.3, '.mb-merge'],
    [0.43, 0.55, '.mb-wcol--6'],
    [0.71, 0.97, '.mb-erow--pegasus'],
  ],

  // the cursor clicks the Shoes tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.655, '.mb-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25 s
  dur: { hub: 11, browser: 10.5 },
};