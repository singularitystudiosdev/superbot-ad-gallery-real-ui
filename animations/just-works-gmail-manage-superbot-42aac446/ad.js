/* ad.js - config for the "Manage my gmails" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css). */

export default {
  id: 'just-works-gmail-manage-superbot-42aac446',
  title: 'Inbox, handled',
  slug: 'gmail-manage',

  ask: 'Manage my gmails',

  // no ChatGPT beat in this spot: the mail just gets handled
  gpt: null,
  card: null,

  // platforms aggregated, counts tick up in the chat
  sources: [
    { id: 'gmail', name: 'Gmail', logo: './brand/gmail.svg', count: 2431 },
    { id: 'calendar', name: 'Google Calendar', logo: './brand/googlecalendar.svg', count: 9 },
  ],

  steps: [
    'Reading 2,431 unread emails',
    'Unsubscribing from 41 newsletters',
    'Drafting 9 replies',
    'Filing 214 receipts',
  ],

  // n is the 12 inbox threads the site's Inbox tab and the "2,431 -> 12" KPI both count, so the hub build
  // card names them: "index 12 threads into the filter state". The hub's own default would derive no noun
  // from the label "need you" and print "items".
  found: { n: 12, label: 'need you', one: 'thread', many: 'threads' },

  build: {
    file: 'inbox-handled',
    url: 'superbot.app/p/inbox',
    tabTitle: 'Inbox, handled',
    favicon: './brand/gmail.svg',
  },

  // the spot's own clock: hub 11 + browser 10.5 + end 3.5 = 25 s (contract wants 24..34)
  dur: { hub: 11, browser: 10.5, end: 3.5 },

  // f in 0..1 of the browser scene -> scroll target. The first two keys are the same selector, which holds
  // "Needs you" at the top of the viewport while the cursor works the first draft; the card is 700 px further
  // up the page, so a plan that started moving at 0.28 would have carried the Send button out of the viewport
  // before the click at 0.50.
  scroll: [
    [0, 0],
    [0.16, '.iw-lane--needs'],
    [0.58, '.iw-lane--needs'],
    [0.80, '.iw-lane--bills'],
    [0.95, '.iw-lane--unsub'],
  ],

  // cursor rests on the first drafted reply, then clicks its Send button, both while "Needs you" is held
  hover: [[0.28, 0.44, '.iw-mails .iw-mail:nth-child(1) .iw-reply']],
  click: [[0.50, '.iw-mails .iw-mail:nth-child(1) .iw-send']],

  end: { text: 'Superbot just works' },
};