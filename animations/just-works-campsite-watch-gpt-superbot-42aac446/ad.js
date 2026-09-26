/* ad.js - config for the "Upper Pines, ChatGPT vs Superbot" spot (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Beats: ChatGPT cannot keep checking Recreation.gov around the clock or sign in to the user's account ->
   the "superbot can do it!" popup is clicked -> superbot watches Upper Pines, catches the cancellation and
   checks out inside the 15-minute cart hold. This folder is a copy of the superbot-only variant
   (just-works-campsite-watch-superbot-42aac446): every asset, the site and the config below the gpt block
   are that spot's, unchanged, so the two variants share one page and one hub. */

export default {
  id: 'just-works-campsite-watch-gpt-superbot-42aac446',
  title: 'Upper Pines, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-campsite-watch), shared by both variants
  slug: 'campsite-watch',

  ask: 'Watch Recreation.gov around the clock for a cancellation at Upper Pines in Yosemite for July 3 to 6. The moment a site opens, sign into my account, put it in the cart and check out before the 15-minute hold expires.',

  // the ChatGPT beat: it tries the Upper Pines page on recreation.gov, that load fails, and the refusal
  // explains why the whole ask is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the
  // popup's click fits.
  gpt: {
    attempt: 'Opening recreation.gov/camping/campgrounds/232447',
    reply:
      "I can't keep checking Recreation.gov around the clock or sign in to your account, so I can't catch a cancellation at Upper Pines or check out before the 15-minute hold runs out.\n\nWhat I can do instead: explain how cancellations get released and when to look for one.",
  },
  card: null,

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

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

  // hub and browser keep variant B's lengths; the gpt beat in front puts the loop near 33 s, like the
  // series' other ChatGPT-first spots
  dur: { hub: 11, browser: 10.5 },
};
