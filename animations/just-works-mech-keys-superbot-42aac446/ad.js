/* ad.js - config for the "NovelKeys + CannonKeys + KBDfans + Drop + Keychron, one group-buy overview" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the hero photo and the site marks are in ./img and ./brand. Read-only by design: Superbot signs
   in to Riley's Gmail and to the NovelKeys, CannonKeys, KBDfans, Drop and Keychron accounts, reads every
   group buy and preorder already in them, reads each vendor's live order page and its latest fulfillment
   update, and checks r/mechmarket for listings matching the wishlist. It buys nothing, joins no group buy,
   changes no order, posts nothing and sends no message. No ChatGPT beat and no card beat in this spot
   (variant B: the hub's own work is the whole point). Every figure below is read from data.js, so the hub,
   the steps and the page agree. */

import { accounts, counts, nextBuy, money } from './data.js';

const src = (a) => ({ id: a.id, name: a.name, logo: a.logo, count: a.pulled, what: a.what });

const n0 = (n) => Number(n).toLocaleString('en-US');
const late = `${counts.avgLate.toFixed(1)} months late on average`;

export default {
  id: 'just-works-mech-keys-superbot-42aac446',
  title: 'NovelKeys + CannonKeys + KBDfans + Drop + Keychron, one group-buy overview',
  slug: 'mech-keys',

  ask: "Sign in to my email and my NovelKeys, CannonKeys, KBDfans, Drop and Keychron accounts, find every group buy and preorder I am in, read each vendor's live order page and its latest fulfillment update, and check r/mechmarket for anything on my wishlist. Give me one overview: each item, vendor, date joined, production stage, latest update, estimated ship date and how late it is, plus wishlist matches with price and link. Buy nothing.",

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat (seven sources, one row each)
  sources: accounts.map(src),

  steps: [
    `Signed in to Gmail and ${counts.shops} vendor accounts, read-only: ${counts.buys} group buys and preorders found, ${money(counts.paidTotal)} paid all time`,
    `Read every order page and its latest fulfillment update: ${counts.updates} updates, ${counts.late} buys running late, ${late}`,
    `Checked r/mechmarket for ${counts.wishlist} wishlist items: ${counts.matches} listings match, ${counts.underMax} under the target price`,
    `Built one overview: ${money(counts.paidOpen)} still in ${counts.open} open buys, next landing ${nextBuy.estShort}. Nothing bought, no order changed`,
  ],

  found: { n: counts.buys, one: 'group buy', many: 'group buys', label: `${counts.buys} group buys · ${counts.late} running late · ${counts.matches} wishlist matches` },

  build: {
    file: 'mech-keys',
    url: 'superbot.app/p/mech-keys',
    tabTitle: `Group-buy Overview · ${n0(counts.buys)} buys`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Six beats, each with a hold:
  // 1. 0.12 and 0.28 both name the hero, so the page holds on the sync card while render(p) reads the seven
  //    sources (p 0.05 to 0.2, see site.js SYNC_A/SYNC_B) and matches each buy into the status bar (p 0.195
  //    to 0.3, MATCH_A/MATCH_B); the finished card holds before the page moves.
  // 2. 0.33 and 0.42 both name the stats strip, whose four counters ease in as it lands (p 0.36 to 0.44,
  //    GROW_A/GROW_B), then hold with the cursor on the paid tile's icon.
  // 3. 0.46 and 0.58 hold on the arrival strip, the money beat and the longest hold: the three arrival cards
  //    land in turn (SHIP_A/SHIP_B) and their progress rings close, then the cursor rests on the first ring.
  // 4. 0.62 and 0.68 hold on the mechmarket matches panel as its four rows slide in (WISH_A/WISH_B), then
  //    0.72 lands on the buy list and 0.76 glides down to row 8 so the second half of the list reads on the
  //    way past (LIST_A/LIST_B, rows all in by p 0.77).
  // 5. 0.80 lands on the tabbed slot, the window the click on "What you paid" is timed against, while the
  //    stage bars grow (STAGE_A/STAGE_B). The click swaps the paid rows into the same slot (same height,
  //    nothing below moves), 0.88 settles on the source summary, which sits right under the slot and is the
  //    last block before the footer, so the page bottoms out with the paid rows still above it while they
  //    land (PAY_A/PAY_B) and the source bar fills (SUM_A/SUM_B); the cursor rests on the bar to the end.
  scroll: [
    [0, 0],
    [0.12, '.mk-hero'],
    [0.28, '.mk-hero'],
    [0.33, '.mk-stats'],
    [0.42, '.mk-stats'],
    [0.46, '.mk-ship'],
    [0.58, '.mk-ship'],
    [0.62, '.mk-matches'],
    [0.68, '.mk-matches'],
    [0.72, '.mk-list'],
    [0.76, '.mk-row--8'],
    [0.8, '.mk-slot'],
    [0.88, '.mk-sum'],
  ],

  // the cursor lands on a graphic at every beat, never on a figure or a name, and the pointer's body (which
  // hangs down and right of its tip) falls on empty space or more graphics: the GMK Circuit segment of the
  // match bar (a buy in QC; its legend sits ABOVE the bar, so nothing is under the pointer, and its "QC"
  // entry lights up), the paid tile's icon (not its figure, which sits right of the icon clear of the
  // pointer), the knob at the end of the first arrival's progress arc (via the taller hit box site.css gives
  // it, the tip lands on the ring's upper right and the body in the gap before the card's text, so neither
  // covers the "1d" figure), the vendor tile of the GMK Circuit row (row 4 by estimated
  // ship date; in the two-line layouts it sits at the right of its cell, clear of the next row's item name)
  // and the source bar the spot ends on, whose counts sit above it. site.css highlights each block on
  // :has(.is-hover).
  hover: [
    [0.1, 0.28, '.mk-mseg--4'],
    [0.36, 0.42, '.mk-stat--paid .mk-stati'],
    [0.5, 0.57, '.mk-scd--1 .mk-rknob'],
    [0.7, 0.77, '.mk-row--4 .mk-vend'],
    [0.9, 0.97, '.mk-sbar'],
  ],

  // the cursor clicks "What you paid" in the sticky top bar; site.css swaps the panel on that class
  click: [[0.82, '.mk-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25.6 s
  dur: { hub: 11, browser: 11.2 },
};