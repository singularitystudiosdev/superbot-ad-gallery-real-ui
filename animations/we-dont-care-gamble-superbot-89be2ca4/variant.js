// variant.js: EVERY value this spot varies on. The spot's code (timeline.js, scenes/tabs-assets/chat.js,
// scenes/tabs-assets/beats/winnings.js) reads nothing else that changes between variants: the confetti table,
// the slam motion, the card timings, the layout/CSS, the hub chrome, the end card and the loop dip are shared
// and identical in every folder generated from this one (tools/var89-generate.mjs + tools/var89-matrix.mjs).
// These values are this folder's defaults, so the base ad renders exactly the ad it shipped as.
//
// rows: [label, amount, when?]. `when` is optional: the base spot's list is dated, the generated variants list
// the outcome instead of the date, and a row without a date renders without the date column.
export default {
  id: 'we-dont-care-gamble-superbot-89be2ca4',
  // card 1: "<voice> says you shouldn't gamble". `redWord` is the one word drawn red (it lands last and
  // takes one extra punch); it must appear in introLine as a whole word.
  voice: 'Opus 5.5',
  introLine: "Opus 5.5 says you shouldn't gamble",
  redWord: 'gamble',
  // card 2 (identical in every variant): one line, slammed in, with the confetti burst on the same beat
  slamLine: 'WE DONT CARE!',
  // the one ask typed into the composer, and superbot's own streamed answer to it
  ask: 'Make a website of all my winnings',
  say: "On it. Pulling every win you've ever had, then building the site around them.",
  // the chat work card's header: task name, and the sub line beside it (the base shows the deployed host there)
  workTitle: 'Winnings site',
  // the site superbot builds and then grows out of the card to fill the frame
  site: {
    slug: 'sams-winnings.site',
    hero: 'All my winnings',
    // the stat line under the hero total
    sub: '1,284 bets · 212 payouts · every book, every table',
    // the total the counter climbs to, as displayed. The chart's own axis and the "+" tag are derived from it.
    totalDisplay: '$48,210',
    chartLabel: 'CUMULATIVE WINS',
    // the small label above the hero headline, the legend beside the chart head, and the night card's own
    // label. These are the wins-site defaults; the two bot cells override them to read as a live P&L dashboard.
    // They landed after the first twelve cells were generated, so a cell that does not name one omits the key
    // and the render falls back to the same string (see scenes/tabs-assets/beats/winnings.js).
    heroLabel: 'LIFETIME WINS',
    chartLegend: 'All winnings',
    nightLabel: 'BIGGEST NIGHT',
    // the payouts list's own headings
    hitsLabel: 'TOP PAYOUTS',
    hitsTitle: 'Biggest hits',
    rows: [
      ['6-leg parlay', 12400, 'Nov 2'],
      ['Poker, final table', 4900, 'Feb 27'],
      ['Blackjack, high limit room', 3150, 'Aug 14'],
      ['Slots jackpot', 2600, 'Jun 9'],
      ['Roulette, 17 black', 1750, 'Mar 3'],
    ],
    night: {
      label: 'One Saturday, four tables',
      amount: 6180,
      sub: 'Six bets across three sports, all of them winners, and a number that came up twice.',
    },
  },
  // the four tool lines the work card runs before the site lands (HTML allowed, as the base spot shows)
  steps: [
    'Read <b>1,284 bets</b> from your sportsbook accounts',
    'Matched <b>212 casino payouts</b> in Gmail receipts',
    'Totaled every win, biggest hits first',
    'Built and deployed <code>sams-winnings.site</code>',
  ],
};