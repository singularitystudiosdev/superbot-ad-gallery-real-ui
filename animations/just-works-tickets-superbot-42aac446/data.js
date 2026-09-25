/* data.js - the numbers behind superbot.app/p/friday.
   Every price is per seat, all in: base + service fee + facility fee. The venue and the matchup are
   fictional (Riverbend Arena, 7:00 PM Friday) and no team is named anywhere in this spot.
   The page renders sections, listings and the hub's preview rows from these exports. */

/* sections of the bowl, in the order they sit around the ring:
   [id, tier, base, service, facility, row, seats, view, note] */
const SECTION_ROWS = [
  // lower bowl, 100s
  ['109', 'lower', 108, 22, 8, '17', '3-4', 'Lower bowl, corner', 'Corner, 17 rows up. Seller has two more pairs.'],
  ['110', 'lower', 118, 23, 8, '12', '14-15', 'Lower bowl, behind the goal', 'Two seats on the aisle, second half of the goal end.'],
  ['111', 'lower', 132, 26, 8, '10', '6-7', 'Lower bowl, sideline', 'Sideline pair, ten rows up, no obstructions.'],
  ['112', 'lower', 96, 22, 8, '9', '4-5', 'Lower bowl, sideline corner', 'Cheapest all-in pair in the lower bowl. Nine rows up, diagonal view of the whole floor.'],
  ['113', 'lower', 142, 28, 8, '8', '1-2', 'Lower bowl, center', 'Center pair, eight rows up. Seller responds in about an hour.'],
  ['114', 'lower', 145, 28, 8, '6', '11-12', 'Lower bowl, center', 'Six rows up from the divider, center.'],
  ['115', 'lower', 147, 28, 8, '5', '9-10', 'Lower bowl, center', 'Five rows up, center. Priced near the top of your limit.'],
  ['116', 'lower', 114, 22, 8, '14', '9-10', 'Lower bowl, corner', 'Corner pair on the north side, above the tunnel.'],
  // club level, C1 to C8
  ['C1', 'club', 138, 22, 16, '4', '5-6', 'Club, corner', 'Club pair with the padded rows and its own entrance.'],
  ['C2', 'club', 146, 24, 16, '3', '7-8', 'Club, sideline', 'Club sideline, three rows up, in-seat service.'],
  ['C3', 'club', 150, 24, 16, '2', '3-4', 'Club, center', 'Second row of the club level, center. Over your limit.'],
  ['C4', 'club', 148, 24, 16, '2', '9-10', 'Club, center', 'Front rows of the club ring, center. Over your limit.'],
  ['C5', 'club', 143, 24, 16, '5', '1-2', 'Club, sideline', 'Club sideline pair. Price is above the $150 line.'],
  ['C6', 'club', 134, 22, 16, '6', '11-12', 'Club, behind the goal', 'Club end pair, six rows in.'],
  ['C7', 'club', 130, 22, 16, '7', '3-4', 'Club, behind the goal', 'Club end pair, seven rows in, near the rail.'],
  ['C8', 'club', 128, 22, 16, '8', '7-8', 'Club, corner', 'Club corner pair, eight rows up.'],
  // upper deck, 300s
  ['301', 'upper', 78, 20, 6, '6', '3-4', 'Upper deck, center', 'Six rows into the upper deck, center. Steep but straight on.'],
  ['302', 'upper', 73, 20, 6, '9', '11-12', 'Upper deck, center', 'Nine rows into the upper deck, center.'],
  ['303', 'upper', 70, 20, 6, '22', '7-8', 'Upper deck, corner', 'Highest row, corner. The cheapest all-in pair on the page.'],
  ['304', 'upper', 75, 20, 6, '18', '1-2', 'Upper deck, corner', 'Corner pair, eighteen rows up.'],
  ['305', 'upper', 86, 20, 6, '12', '5-6', 'Upper deck, sideline', 'Upper sideline pair, twelve rows up.'],
  ['306', 'upper', 95, 20, 6, '7', '9-10', 'Upper deck, sideline', 'Upper sideline, seven rows up, under the overhang.'],
  ['307', 'upper', 92, 20, 6, '8', '13-14', 'Upper deck, sideline', 'Upper sideline pair near the aisle.'],
  ['308', 'upper', 83, 20, 6, '15', '2-3', 'Upper deck, corner', 'Corner pair, fifteen rows up.'],
  ['309', 'upper', 76, 20, 6, '19', '5-6', 'Upper deck, behind the goal', 'Upper end pair, nineteen rows up.'],
  ['310', 'upper', 72, 20, 6, '20', '11-12', 'Upper deck, behind the goal', 'Upper end pair, twenty rows up, straight behind the goal.'],
];

export const sections = SECTION_ROWS.map((r) => ({
  id: r[0],
  tier: r[1],
  base: r[2],
  svc: r[3],
  fac: r[4],
  each: r[2] + r[3] + r[4],
  row: r[5],
  seats: r[6],
  view: r[7],
  note: r[8],
}));

const secById = {};
sections.forEach((s) => { secById[s.id] = s; });

/* the pair the page leads with: cheapest all-in price in the lower bowl */
export const best = { sec: '112', why: 'Cheapest all-in pair in the lower bowl, and the only one under $130 a seat.' };

/* the rows of the pair list, cheapest all-in first. [secId, platform, deal tag, listing age, watchers] */
const LISTING_ROWS = [
  ['303', 'gametime', 'Lowest all-in price', 'listed 41 min ago', 6],
  ['310', 'seatgeek', 'Under $100 a seat', 'listed 2 h ago', 3],
  ['302', 'ticketmaster', 'Under $100 a seat', 'listed 5 h ago', 2],
  ['309', 'vividseats', '', 'listed 1 h ago', 4],
  ['301', 'stubhub', '', 'listed 6 h ago', 1],
  ['112', 'stubhub', 'Best view for the money', 'listed 18 min ago', 9],
  ['109', 'seatgeek', '', 'listed 3 h ago', 2],
  ['116', 'ticketmaster', '', 'listed 52 min ago', 5],
  ['110', 'gametime', '', 'listed 2 h ago', 3],
];

/* a different sourced seat-level photo per row, so the list reads as real listings */
const SHOTS = [
  './img/seat-olympic.webp',
  './img/seat-empty.jpg',
  './img/seat-fordfield.jpg',
  './img/seat-soccercity.jpg',
  './img/seat-superbowl.jpg',
  './img/seat-tele2.jpg',
  './img/seat-olympic.webp',
  './img/seat-empty.jpg',
  './img/seat-soccercity.jpg',
];

export const listings = LISTING_ROWS.map((r, i) => {
  const s = secById[r[0]];
  return {
    sec: s.id,
    tier: s.tier,
    row: s.row,
    seats: s.seats,
    base: s.base,
    svc: s.svc,
    fac: s.fac,
    each: s.each,
    total: s.each * 2,
    fees: s.svc + s.fac,
    view: s.view,
    note: s.note,
    platform: r[1],
    deal: r[2],
    age: r[3],
    watching: r[4],
    img: SHOTS[i],
    over: s.each > 150,
  };
});

/* the hub aggregation card's preview rows (first 4 to 6 of these are shown in the chat) */
export const items = listings.slice(0, 6).map((l) => ({
  img: l.img,
  title: 'Section ' + l.sec + ', Row ' + l.row,
  price: '$' + l.each + ' ea',
  meta: 'Seats ' + l.seats + ' · ' + l.view + ' · $' + l.fees + ' fees',
  source: l.platform,
}));

export const summary = {
  raw: 2904,
  pairs: 1024,
  under150: 412,
  sites: 5,
  read: '2,904 listings',
  cheapestEach: 96,
  dearestEach: 188,
  medianFee: 30,
  medianFeeEach: 15,
  updated: '7:42 PM',
  limit: 150,
  seatCount: 2,
  venue: 'Riverbend Arena',
  when: 'Friday, 7:00 PM',
  onSale: '1,024 pairs on sale',
};

export const legend = { lo: 96, hi: 190 };

export const board = {
  head: 'Two seats together, under $150 each',
  dek: 'Sorted by all-in price. Every row is one pair, two seats side by side, with the service fee and the facility fee already added.',
  mapHead: 'Which side of the bowl fits the price',
  mapDek: 'Every section colored by its cheapest two-seat pair, all in, per seat. Each section carries its own pair, row, seats and fee total.',
  mapKey: 'Price per seat, all in',
  listHead: 'Pairs on sale right now',
  listDek: 'Nine of the 412 pairs under $150 each. Prices include fees and are read live from the site each pair sits on.',
  bestKicker: 'Best view for the money',
  bestHead: 'Section 112, Row 9, Seats 4-5',
  bestBody: 'Cheapest all-in pair in the lower bowl. Nine rows up on the sideline corner, so you see the whole floor at an angle. $30 of the $126 is fees, which is $4 below the median fee on this page.',
  checkout: 'Checkout',
  checkoutDone: 'Checkout started',
  checkoutNote: 'StubHub holds the pair for 8 minutes once checkout opens.',
  footHead: 'What superbot read',
  footBody: 'Five sites, 2,904 listings, read in 38 seconds. Pairs with a single seat between them were dropped, so every row on this page is two seats side by side.',
  footFine: 'Prices are per seat with fees included and can change before checkout. Seats are released back to the seller if the hold runs out.',
};

/* how each site was read, shown in the footer */
export const platformNotes = {
  stubhub: '812 listings, all-in price with fees shown on the listing page.',
  seatgeek: '604 listings, deal score and fee-inclusive price in the listing JSON.',
  ticketmaster: '588 listings, face value plus service and facility fees at checkout.',
  vividseats: '486 listings, fees shown per ticket on the row.',
  gametime: '414 listings, price with the "all in" toggle already on.',
};

export const checkout = {
  site: 'StubHub',
  hold: '8 minutes',
  pair: '$252 for the pair',
};

export const status = {
  live: 'Index rebuilt 7:42 PM',
  scan: 'fee-inclusive prices',
};