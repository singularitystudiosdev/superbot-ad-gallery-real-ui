/* ad.js - config for the "Gmail + United + Delta + Marriott + Airbnb, one trip timeline" spot.
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   The page the hub then opens live in Chrome lives in ./site.js + ./site.css; the numbers behind it are in
   ./data.js; the airport photo and the five app marks are in ./img and ./brand, sourced in CREDITS.txt.
   Read-only by design: Superbot signs in to the five accounts, reads every confirmation and every loyalty
   balance, merges the duplicate confirmations in its own view and changes nothing in Gmail, United, Delta,
   Marriott or Airbnb. No ChatGPT beat and no card beat in this spot (variant B: the hub's own work is the
   whole point). Every figure below is read from data.js, so the hub, the steps and the page agree. */

import { accounts, counts } from './data.js';

const acc = (id) => accounts.find((a) => a.id === id);
const src = (id, name) => ({ id, name, logo: acc(id).logo, count: acc(id).pulled, what: `${acc(id).what} pulled` });

export default {
  id: 'just-works-trip-wallet-superbot-42aac446',
  title: 'Gmail + United + Delta + Marriott + Airbnb, one trip timeline',
  slug: 'trip-wallet',

  ask: 'Sign into my Gmail, United MileagePlus, Delta SkyMiles, Marriott Bonvoy and Airbnb accounts, pull every upcoming reservation and loyalty balance, and build me one trip timeline with confirmation numbers, live flight status and seat assignments, plus a table of my miles and points with their expiry dates.',

  // no ChatGPT beat and no card beat: variant B opens on the hub
  gpt: null,
  card: null,

  // what superbot read, with the counts that tick up in the chat (14 + 3 + 3 + 3 + 2 = 25)
  sources: [
    src('gmail', 'Gmail confirmations'),
    src('united', 'United MileagePlus'),
    src('delta', 'Delta SkyMiles'),
    src('marriott', 'Marriott Bonvoy'),
    src('airbnb', 'Airbnb trips'),
  ],

  steps: [
    `Signed in to all ${counts.accounts} accounts, read-only`,
    `Pulled ${counts.pulled} records and merged ${counts.dupes} duplicate confirmations`,
    `Built ${counts.trips} trips, ${counts.bookings} bookings, with live status and seats`,
    `Found ${counts.wallets} balances, ${counts.expiring} expiring within 60 days`,
  ],

  found: { n: counts.bookings, one: 'booking', many: 'bookings', label: `bookings, ${counts.trips} trips` },

  build: {
    file: 'trip-wallet',
    url: 'superbot.app/p/trip-wallet',
    tabTitle: `Trips · ${counts.bookings} bookings`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.13 and 0.3 both name the hero, so the page holds on the sync card while render(p) reads the five
  //    accounts (p 0 to 0.15, see site.js SYNC_A/SYNC_B) and merges the duplicate confirmations (25 pulled,
  //    14 duplicates, 11 bookings, p 0.165 to 0.285, MERGE_A/MERGE_B); the finished card holds about 0.85 s.
  // 2. 0.355 and 0.5 hold on the next-up live card: its fields ease in as it lands (p 0.3 to 0.375, LIVE_A/
  //    LIVE_B), every number settles by f 0.375 and the card then holds about 1.3 s with the cursor on the
  //    gate block (Gate C71, Terminal C, Boards 4:55 PM) before the scroll leaves.
  // 3. 0.555 and 0.66 hold on the timeline; its rows settle in turn as it arrives (TL_A/TL_B, p 0.50 to
  //    0.585) and the cursor rests on the Lisbon Marriott row, the stay that runs on the points balance
  //    the wallet panel then opens on.
  // 4. 0.7 and 0.755 hold on the panels and the scroll never moves again: the click swaps the wallet table
  //    into the slot the booking list already had, so the swap happens in place, with no camera move after
  //    it. The cursor then rests on the Marriott Free Night Award, the balance that expires first, from
  //    f 0.79 to the end of the beat, 1.9 s of hold.
  // Every hover beat names a .tw-pad span in the gap beside its values, and site.css lands the highlight on
  // the real element through :has(), so the arrow never covers a number, a code or a label.
  scroll: [
    [0, 0],
    [0.13, '.tw-hero'],
    [0.3, '.tw-hero'],
    [0.355, '.tw-live'],
    [0.5, '.tw-live'],
    [0.555, '.tw-timeline'],
    [0.66, '.tw-timeline'],
    [0.7, '.tw-panels'],
    [0.755, '.tw-panels'],
  ],

  // the cursor points at each beat: the merge counters, the gate block, the Marriott stay, the free night
  hover: [
    [0.1, 0.29, '.tw-pad--merge'],
    [0.38, 0.5, '.tw-pad--live'],
    [0.58, 0.66, '.tw-pad--row'],
    [0.79, 1, '.tw-pad--wrow'],
  ],

  // the cursor clicks the Miles & points tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.75, '.tw-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25 s
  dur: { hub: 11, browser: 10.5 },
};