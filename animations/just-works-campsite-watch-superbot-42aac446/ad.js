/* ad.js - config for the "Upper Pines, Jul 3 to 6" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are
   in ./data.js; the photos and the Recreation.gov mark are in ./img and ./brand, sourced in CREDITS.txt.
   No ChatGPT beat and no card beat in this spot (variant B: the hub's own work is the whole point). */

export default {
  id: 'just-works-campsite-watch-superbot-42aac446',
  title: 'Upper Pines, Jul 3 to 6',
  slug: 'campsite-watch',

  ask: 'Watch Recreation.gov around the clock for a cancellation at Upper Pines in Yosemite for July 3 to 6. The moment a site opens, sign into my account, put it in the cart and check out before the 15-minute hold expires.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat
  sources: [
    { id: 'avail', name: 'Recreation.gov availability', logo: './brand/recgov.svg', count: 9282, what: 'availability checks' },
    { id: 'openings', name: 'Upper Pines openings', logo: './brand/recgov.svg', count: 6, what: 'openings seen' },
    { id: 'account', name: 'Recreation.gov account', logo: './brand/recgov.svg', count: 7, what: 'checkout fields filled' },
    { id: 'backups', name: 'Backup campgrounds', logo: './brand/recgov.svg', count: 3, what: 'campgrounds also watched' },
  ],

  steps: [
    'Checked Upper Pines every 60 s since Jun 14',
    'Caught Site 042 opening for Jul 3 to 6 at 5:52 AM',
    'Signed in, carted it, checked out with 14:18 left',
    'Reserved 3 nights for $116, confirmation emailed',
  ],

  found: { n: 9282, one: 'check', many: 'checks', label: 'availability checks' },

  build: {
    file: 'campsite-watch',
    url: 'superbot.app/p/campsite-watch',
    tabTitle: 'Site Watch · Upper Pines',
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. 0.14 and 0.34 both name the hero, so the
  // page holds still on the reservation card and the big hold ring while render(p) counts the 15:00 cart
  // hold down to 14:18 (p 0.06 to 0.27, see site.js HOLD_A/HOLD_B) and then shows the checked-out stamp
  // standing still for a beat. 0.46 and 0.57 both name the availability log: the approach creeps it into
  // view and holds, the window the hover and the click are timed against. The click swaps in the
  // Reservation panel, 0.78 brings it into view, and 0.95 runs down to the backups.
  scroll: [
    [0, 0],
    [0.14, '.cw-hero'],
    [0.34, '.cw-hero'],
    [0.46, '.cw-log'],
    [0.57, '.cw-log'],
    [0.78, '.cw-panel--2'],
    [0.95, '.cw-watch'],
  ],

  // cursor rests on the booked row of the log, inside the hold above, and leaves before the click
  hover: [[0.475, 0.555, '.cw-row--booked']],

  // cursor clicks the Reservation tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.63, '.cw-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25 s
  dur: { hub: 11, browser: 10.5 },
};
