/* ad.js - config for the "Strava + Garmin + Nike Run Club, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Beats: ChatGPT cannot sign in to Strava, Garmin Connect or Nike Run Club or see the runs, so it cannot
   build the training log -> the "superbot can do it!" popup is clicked -> superbot signs in to all three
   logs read-only, pulls 591 runs, merges 203 duplicate copies, totals the miles on 5 pairs of shoes and
   flags the 2 already past 400, then builds the 8-week Chicago block. It changes nothing in Strava, Garmin
   Connect or Nike Run Club.
   This folder is a copy of the superbot-only variant (just-works-marathon-build-superbot-42aac446): every
   asset, the site and the config below the gpt block are that spot's, unchanged, so the two variants
   share one page and one hub. */

export default {
  id: 'just-works-marathon-build-gpt-superbot-42aac446',
  title: 'Strava + Garmin + Nike Run Club, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-marathon-build), shared by both variants
  slug: 'marathon-build',

  ask: 'Sign into my Strava, Garmin Connect and Nike Run Club accounts, pull every run from the last 12 months, merge the duplicates, total the miles on each pair of shoes and flag any past 400, and give me one training overview for the 8 weeks before my marathon.',

  // the ChatGPT beat: it tries the Strava training page, that load fails, and the refusal explains why the
  // whole ask is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the popup's click fits.
  gpt: {
    attempt: 'Opening strava.com/athlete/training',
    reply:
      "I can't sign in to your Strava, Garmin Connect or Nike Run Club accounts, so I can't see your runs, your shoes or how many miles you've put on them.\n\nWhat I can do instead: explain how to export your runs as GPX files.",
  },
  card: null,

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

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