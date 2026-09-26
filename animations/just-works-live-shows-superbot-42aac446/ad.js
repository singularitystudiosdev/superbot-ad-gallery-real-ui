/* ad.js - config for the "Spotify + Ticketmaster + AXS + Dice, one concert overview" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the hero photo and the site marks are in ./img and ./brand. Read-only by design: Superbot reads
   the artists Jordan follows and plays most on Spotify, checks every one of them against Ticketmaster, AXS,
   Dice, Bandsintown, Songkick and eleven Denver-area venue sites for shows within 50 miles over the next six
   months, merges the same show listed on several sites into one row, and cross-checks the Ticketmaster
   account for tickets already held. It buys nothing, joins no presale or queue and transfers no ticket. No
   ChatGPT beat and no card beat in this spot (variant B: the hub's own work is the whole point). Every figure
   below is read from data.js, so the hub, the steps and the page agree. */

import { accounts, counts, spotify, presales, meta, hShort } from './data.js';

const src = (a) => ({ id: a.id, name: a.name, logo: a.logo, count: a.pulled, what: a.what });

const n0 = (n) => Number(n).toLocaleString('en-US');
const first = presales[0];

export default {
  id: 'just-works-live-shows-superbot-42aac446',
  title: 'Spotify + Ticketmaster + AXS + Dice, one concert overview',
  slug: 'live-shows',

  ask: "Check the artists I follow and play most on Spotify against Ticketmaster, AXS, Dice, Bandsintown, Songkick and my local venues. List every show within 50 miles in the next six months, mark the ones I already have tickets for, and don't buy anything.",

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat (seven sources, one row each)
  sources: accounts.map(src),

  steps: [
    `Read Spotify, read-only: ${spotify.followed} followed artists + your top ${spotify.top} played = ${n0(counts.artists)} artists to check`,
    `Checked Ticketmaster, AXS, Dice, Bandsintown, Songkick and ${counts.venueSites} venue sites: ${counts.listings} listings within ${meta.radius} mi through ${meta.untilText}`,
    `Merged ${counts.merged} duplicate listings into ${counts.shows} shows; ${counts.presales} presales open this week, the first ${first.pre.dow} ${hShort(first.pre.at)}`,
    `Found your tickets for ${counts.held} shows (${counts.tickets} tickets) in Ticketmaster. Nothing bought, no presale joined`,
  ],

  found: { n: counts.shows, one: 'show found', many: 'shows found', label: `shows within ${meta.radius} mi, ${counts.held} you have tickets for, ${counts.presales} presales this week` },

  build: {
    file: 'live-shows',
    url: 'superbot.app/p/live-shows',
    tabTitle: `Concert Overview · ${counts.shows} shows`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Five beats, each with a hold:
  // 1. 0.12 and 0.28 both name the hero, so the page holds on the sync card while render(p) reads the seven
  //    sources (p 0.05 to 0.2, see site.js SYNC_A/SYNC_B) and matches each show into the status bar (p 0.195
  //    to 0.3, MATCH_A/MATCH_B); the finished card holds before the page moves.
  // 2. 0.33 and 0.42 both name the stats strip, whose four counters ease in as it lands (p 0.37 to 0.46,
  //    GROW_A/GROW_B), then hold with the cursor on the tickets tile's icon.
  // 3. 0.47 and 0.62 hold on the presales, the money beat and the longest hold: the three presale cards land
  //    in turn (PRE_A/PRE_B) and their countdown rings close, then the cursor rests on the first ring.
  // 4. 0.67 and 0.7 hold on the top of the show list (its rows are all in by p 0.7, LIST_A/LIST_B), then
  //    0.75 glides down to row 8 so the second half of the list reads on the way past.
  // 5. 0.79 lands on the tabbed slot (the same place in 16:9 and 4:3; in the stacked 1:1 and 4:5 layouts the
  //    left-out card sits above the slot and scrolls past), the window the click on "Your tickets" is timed
  //    against; the month bars grow meanwhile (MONTH_A/MONTH_B). The click swaps the ticket stubs into the
  //    same slot (same height, nothing below moves), 0.87 settles on the source summary, which sits right
  //    under the slot and is the last block before the footer, so the page bottoms out with the stubs still
  //    above it while they land (TIX_A/TIX_B) and the source bar fills (SUM_A/SUM_B); the cursor rests on the
  //    bar to the end.
  scroll: [
    [0, 0],
    [0.12, '.ls-hero'],
    [0.28, '.ls-hero'],
    [0.33, '.ls-stats'],
    [0.42, '.ls-stats'],
    [0.47, '.ls-pre'],
    [0.62, '.ls-pre'],
    [0.67, '.ls-list'],
    [0.7, '.ls-list'],
    [0.75, '.ls-row--8'],
    [0.79, '.ls-slot'],
    [0.87, '.ls-sum'],
  ],

  // the cursor lands on a graphic at every beat, never on a figure or a name, and the pointer's body (which
  // hangs down and right of its tip) falls on empty space or more graphics: the Japanese Breakfast segment
  // of the match bar (a show you hold tickets for; its legend sits ABOVE the bar, so nothing is under the
  // pointer, and its "You have tickets" entry lights up), the tickets tile's icon (not its count, which sits
  // right of the icon clear of the pointer), the knob at the end of the first presale's countdown arc (lower
  // right of the ring, below the "3d 1h" figure and left of the card's text), the "listed on" badges of that
  // same Japanese Breakfast row (four sites, one row; in the two-line layouts they sit at the right of their
  // cell, clear of the next row's name) and the source bar the spot ends on, whose counts sit above it.
  // site.css highlights each block on :has(.is-hover).
  hover: [
    [0.1, 0.28, '.ls-mseg--4'],
    [0.36, 0.42, '.ls-stat--tix .ls-stati'],
    [0.51, 0.62, '.ls-pcard--1 .ls-rknob'],
    [0.675, 0.7, '.ls-row--4 .ls-on'],
    [0.9, 0.97, '.ls-sbar'],
  ],

  // the cursor clicks "Your tickets" in the sticky top bar; site.css swaps the panel on that class
  click: [[0.8, '.ls-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25.6 s
  dur: { hub: 11, browser: 11.2 },
};
