/* data.js - the numbers behind superbot.app/p/model-y-hunt, "Car Hunt".
   One read-only hunt on Sat, Sep 26 at 9:12 PM for a shopper in ZIP 78704 (Austin, TX) after a Model Y Long
   Range under $40,000 within 200 miles. Superbot read Tesla's new and used inventory at every US store, the
   Carvana and CarMax stock, a saved CarGurus search, and the trade-in estimate and open order in the Tesla
   account: 1,561 listings, 1,064 of them Tesla's. 1,548 fell outside the filters (over 200 miles, over
   budget, or not a Model Y Long Range), leaving 13 matches. Every match was read four ways (price, mileage,
   FSD, days on lot): 6,244 checks. 17 price drops worth $17,100 were logged on those listings this week, 10
   of them on the 8 matches shown. The best buy is the 2023 Long Range AWD in Pearl White at Tesla San
   Antonio, 21,480 mi, $33,900 down from $35,400, FSD (Supervised) included, 38 days on lot: $6,090 under
   the $39,990 Model Y Standard on order, and $19,600 to pay after the $14,300 trade-in estimate.
   The shopper, the dealers, the listings, the VINs and the prices are invented for the spot; Tesla,
   Carvana, CarMax and CarGurus are the real sites named, and the account figures are invented balances.
   Every figure the page, the hub and the steps print is derived here, so they never disagree. Nothing here
   orders, reserves, cancels, messages or changes anything. */

const n0 = (n) => Number(n).toLocaleString('en-US');
/* whole dollars, grouped: usd(33900) -> "$33,900"; a negative figure keeps the sign: usd(-750) -> "-$750" */
const usd = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Number(n)).toLocaleString('en-US');
export { n0, usd };

export const meta = {
  user: 'Sam',
  day: 'Sat, Sep 26',
  synced: 'Sat 9:12 PM',
  syncStart: 21 * 3600 + 12 * 60 + 4, // 9:12:04 PM, seconds since midnight
  syncSecs: 38,
  zip: '78704',
  city: 'Austin, TX',
  radius: 200,
  budget: 40000,
  target: 'Model Y Long Range AWD',
};

/* ---------- VINs: 17 characters with a real ISO 3779 check digit ----------
   head (8) + check (1) + model year (1) + plant (1) + serial (6). Model year letters as the spec fixes
   them: M 2021, N 2022, P 2023, R 2024, S 2025. Plants: F Fremont, A Austin. The check digit is computed,
   never typed, so every VIN on the page satisfies the standard. */
const TRANS = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const WEIGHT = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
function checkDigit(vin17) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue; // the check digit's own position counts as 0
    const ch = vin17[i];
    const v = ch >= '0' && ch <= '9' ? Number(ch) : TRANS[ch];
    if (v === undefined) throw new Error(`VIN position ${i + 1} is not a legal VIN character: ${ch}`);
    sum += v * WEIGHT[i];
  }
  const r = sum % 11;
  return r === 10 ? 'X' : String(r);
}
/* build a VIN from its parts: vin('7SAYGDEE', 'P', 'A', '114286') */
export function vin(head, year, plant, serial) {
  const bare = head + '0' + year + plant + serial;
  if (bare.length !== 17) throw new Error(`VIN parts must total 17 characters, got ${bare.length}`);
  const full = head + checkDigit(bare) + year + plant + serial;
  if (checkDigit(full) !== full[8]) throw new Error(`VIN check digit did not settle: ${full}`);
  return full;
}
export const shortVin = (v) => '...' + v.slice(-8);

/* ---------- the five places the hunt read: four listing sources and the Tesla account ---------- */
const SRCS = [
  ['tesla', 'Tesla inventory', 'Tesla', 'new and used, every US store', './brand/tesla.svg', 1064, 6],
  ['carvana', 'Carvana', 'Carvana', 'used, delivery to 78704', './brand/carvana.svg', 214, 3],
  ['carmax', 'CarMax', 'CarMax', 'used, store stock', './brand/carmax.svg', 186, 2],
  ['cargurus', 'CarGurus saved search', 'CarGurus', 'saved search, 200 mi of 78704', './brand/cargurus.svg', 97, 2],
  ['tesla-account', 'Tesla account', 'Tesla account', 'trade-in estimate and open order', './brand/tesla.svg', 2, 0],
];
export const accounts = SRCS.map(([id, name, short, what, logo, scanned, matched]) => ({
  id, name, short, what, logo, scanned, matched,
  kind: id === 'tesla-account' ? 'account' : 'list',
  pulled: scanned,
}));
export const accOf = (id) => accounts.find((a) => a.id === id);
export const listings = accounts.filter((a) => a.kind === 'list');
export const scanned = listings.reduce((a, s) => a + s.scanned, 0);
export const matched = accounts.reduce((a, s) => a + s.matched, 0);
export const filtered = scanned - matched;

/* ---------- the 8 matches shown, best buy first ----------
   [key, source, year, trim, paint, img colour, miles, price, was, drops, fsd, days, store, city, dist, VIN] */
const ROWS = [
  ['best', 'tesla', 2023, 'Long Range AWD', 'Pearl White', 'white', 21480, 33900, 35400, 2, true, 38, 'Tesla San Antonio', 'San Antonio, TX', 79, vin('7SAYGDEE', 'P', 'A', '114286')],
  ['north-loop', 'tesla', 2022, 'Long Range AWD', 'Midnight Silver', 'gray', 33120, 31750, 33200, 1, false, 54, 'Tesla Houston North', 'Houston, TX', 166, vin('7SAYGDEE', 'N', 'A', '048713')],
  ['deep-blue', 'carvana', 2023, 'Long Range AWD', 'Deep Blue Metallic', 'blue', 28905, 34450, 35900, 1, true, 21, 'Carvana', 'Austin, TX', 12, vin('7SAYGDEE', 'P', 'A', '092564')],
  ['black-2021', 'carmax', 2021, 'Long Range AWD', 'Solid Black', 'black', 44380, 27990, 29400, 1, false, 67, 'CarMax Austin', 'Austin, TX', 7, vin('5YJYGDEE', 'M', 'F', '201884')],
  ['red-rock', 'tesla', 2023, 'Long Range AWD', 'Red Multi-Coat', 'red', 19240, 36200, 37100, 1, true, 12, 'Tesla Round Rock', 'Round Rock, TX', 18, vin('7SAYGDEE', 'P', 'A', '133077')],
  ['demo-unit', 'tesla', 2024, 'Long Range AWD', 'Pearl White', 'white', 1180, 38490, 39990, 1, false, 71, 'Tesla Austin, new inventory demo', 'Austin, TX', 4, vin('7SAYGDEE', 'R', 'A', '066210')],
  ['lone-star', 'cargurus', 2022, 'Long Range AWD', 'Midnight Silver', 'gray', 38600, 30900, 32300, 2, false, 43, 'Lone Star Motors', 'Dallas, TX', 194, vin('5YJYGDEE', 'N', 'F', '118942')],
  ['bayou-blue', 'carmax', 2023, 'Long Range AWD', 'Deep Blue Metallic', 'blue', 24760, 34900, 35600, 1, false, 29, 'CarMax Houston', 'Houston, TX', 165, vin('7SAYGDEE', 'P', 'A', '075518')],
];
export const matches = ROWS.map(([key, source, year, trim, paint, colour, miles, price, was, drops, fsd, days, store, city, dist, vin17], i) => ({
  key, rank: i + 1, source, sourceName: accOf(source).name, sourceLogo: accOf(source).logo,
  year, trim, paint, colour, thumb: `./img/cars/${colour}.jpg`,
  miles, price, was, drops, drop: was - price, fsd, days, store, city, dist, vin: vin17, short: shortVin(vin17),
  best: i === 0,
  title: `${year} Model Y ${trim}`,
  chip: drops > 1 ? `${drops} drops` : drops === 1 ? '1 drop' : 'no drops',
}));
export const best = matches[0];
const dropSum = matches.reduce((a, m) => a + m.drop, 0);          // $10,310 off asking on the 8 shown
const dropCount = matches.reduce((a, m) => a + m.drops, 0);       // 10 drops on the 8 shown
const farDrops = 7;                                               // drops on the 5 matches not shown
const farDropSum = 6790;

/* ---------- the Tesla account: the trade-in estimate and the open order ---------- */
export const trade = {
  year: 2019, model: 'Model 3 Standard Range Plus', miles: 61284, value: 14300,
  validThrough: 'Oct 3', onFile: true,
};
export const order = {
  rn: 'RN114829037', model: 'Model Y Standard RWD', price: 39990,
  placed: 'Sep 12', window: 'Nov 3 to Nov 24',
};

/* ---------- the price history of the best buy, drop by drop ---------- */
const LOG = [
  ['Listed', 'Aug 19', 35400, 0, '21,480 mi, FSD (Supervised) included'],
  ['Drop 1', 'Sep 20', 34650, -750, '7 days at this price'],
  ['Drop 2', 'Sep 24', 33900, -750, 'No change since'],
  ['Today', 'Sep 26', 33900, 0, '4 price points, lowest now'],
];
export const log = LOG.map(([step, when, price, delta, note], i) => ({
  step, when, price, delta, note, first: i === 0, last: i === LOG.length - 1, at: i / (LOG.length - 1),
}));

export const counts = {
  sources: accounts.length,
  listings: listings.length,
  stores: 6,
  radius: meta.radius,
  scanned,
  filtered,
  matches: matched,             // 13
  shown: matches.length,        // 8
  more: matched - matches.length,
  rows: scanned * 4,            // price, mileage, FSD, days on lot on every listing
  drops: dropCount + farDrops,  // 17 this week
  dropTotal: dropSum + farDropSum,
  shownDrops: dropCount,
  shownDropTotal: dropSum,
  withFsd: 5,                   // of the 13 matches
  bestPrice: best.price,
  bestSaves: order.price - best.price,
  tradeValue: trade.value,
  orderPrice: order.price,
  diff: best.price - trade.value,
  medianDays: 35,
  cheapest: Math.min(...matches.map((m) => m.price)),
  dearest: Math.max(...matches.map((m) => m.price)),
};
if (counts.filtered + counts.matches !== counts.scanned) throw new Error('hunt buckets do not add up');
if (counts.bestSaves !== counts.orderPrice - counts.bestPrice) throw new Error('best-buy saving does not add up');
if (counts.diff !== counts.bestPrice - counts.tradeValue) throw new Error('difference to pay does not add up');
if (matches.reduce((a, m) => a + m.drops, 0) !== counts.shownDrops) throw new Error('shown drops do not add up');

/* the four tiles under the hero. Each label and rule sits beside a 27 px counter, so both are kept short
   enough to fit the tile without truncating: the counter itself never shrinks or wraps (see .ev-flagn). */
export const flags = [
  {
    kind: 'listings', icon: 'search', label: 'Listings checked', n: counts.scanned,
    rule: 'Four sites plus your Tesla account',
    more: `${counts.stores} Tesla stores plus Carvana, CarMax and your saved CarGurus search`,
    examples: [
      { name: 'Tesla inventory', v: n0(accOf('tesla').scanned) },
      { name: 'Carvana', v: n0(accOf('carvana').scanned) },
      { name: 'CarMax', v: n0(accOf('carmax').scanned) },
    ],
  },
  {
    kind: 'matches', icon: 'car', label: 'Matches under $40,000', n: counts.matches,
    rule: `Within ${counts.radius} miles of ${meta.zip}`,
    more: `${counts.shown} shown, ${counts.more} more in the list`,
    examples: [
      { name: 'With FSD (Supervised)', v: n0(counts.withFsd) },
      { name: 'Cheapest match', v: usd(counts.cheapest) },
      { name: 'Dearest match', v: usd(counts.dearest) },
    ],
  },
  {
    kind: 'drops', icon: 'tag', label: 'Price drops this week', n: counts.drops,
    rule: 'Every drop logged against its VIN',
    more: `${usd(counts.dropTotal)} off asking in total`,
    examples: [
      { name: 'Tesla San Antonio', v: '2 drops' },
      { name: 'Lone Star Motors', v: '2 drops' },
      { name: 'CarMax Houston', v: '1 drop' },
    ],
  },
  {
    kind: 'saves', icon: 'wallet', label: 'Best buy saves', n: counts.bestSaves, money: true,
    rule: `vs your ${usd(counts.orderPrice)} order`,
    more: `${usd(counts.bestPrice)} at ${counts.medianDays} day median, ${usd(counts.diff)} to pay after trade-in`,
    examples: [
      { name: 'Trade-in estimate', v: usd(counts.tradeValue) },
      { name: 'Open order', v: usd(counts.orderPrice) },
      { name: 'Difference to pay', v: usd(counts.diff) },
    ],
  },
];

/* the rows the hub's card previews while the hunt runs */
export const items = [
  { img: './img/cars/white.jpg', title: best.title, price: usd(best.price), meta: `${n0(best.miles)} mi, ${best.store}, ${best.dist} mi`, source: 'tesla' },
  { img: './img/cars/blue.jpg', title: '2023 Model Y Long Range', price: usd(matches[2].price), meta: `${n0(matches[2].miles)} mi, Carvana, 12 mi`, source: 'carvana' },
  { img: './img/cars/black.jpg', title: '2021 Model Y Long Range', price: usd(matches[3].price), meta: '44,380 mi, CarMax Austin, 7 mi', source: 'carmax' },
  { img: './img/cars/gray.jpg', title: '2022 Model Y Long Range', price: usd(matches[6].price), meta: '38,600 mi, Lone Star Motors, 194 mi', source: 'cargurus' },
  { img: './img/cars/red.jpg', title: '2023 Model Y Long Range', price: usd(matches[4].price), meta: '19,240 mi, Tesla Round Rock, 18 mi', source: 'tesla' },
];

/* prose the page prints about its own numbers */
export const copy = {
  brand: 'Car Hunt',
  kicker: `Tesla stores + Carvana + CarMax + CarGurus, checked ${meta.day}`,
  heroH1: `${n0(counts.matches)} ${meta.target} matches under ${usd(meta.budget)}, one shortlist.`,
  heroDek: `Superbot read new and used Tesla inventory at every US store, plus Carvana, CarMax and your saved CarGurus search, and kept every Model Y Long Range under ${usd(meta.budget)} within ${counts.radius} miles of ${meta.zip}. Read-only: nothing was ordered, reserved or messaged.`,
  syncNow: `Reading ${counts.sources} sources, read-only`,
  syncDone: `Synced ${meta.day}, ${meta.synced.replace(/^\w+ /, '')}. Nothing ordered, reserved or changed.`,
  syncClose: `Ranked ${n0(counts.matches)} matches, best buy flagged`,
  statsH: 'Hunt summary',
  huntK: `${meta.zip}, ${meta.city}`,
  huntDek: `Model Y Long Range, under ${usd(meta.budget)}, radius ${counts.radius} mi`,
  budgetH: 'Budget check',
  flagsH: `What the ${n0(counts.scanned)} listings came to`,
  flagsDek: `${n0(counts.rows)} checks on price, mileage, FSD and days on lot, ${meta.day}.`,
  tableH: `Top ${counts.shown} matches, ranked`,
  tableDek: `Ranked on price against mileage, FSD, days on lot and distance. The best buy is flagged.`,
  tableFoot: `${counts.more} more matches under ${usd(meta.budget)}, ${usd(counts.cheapest)} to ${usd(counts.dearest)}.`,
  panelsH: 'The best buy and your Tesla account',
  panelsDek: `Price history for the best buy, then the trade-in and the order on your Tesla account.`,
  logH: `Price history, ${best.vin}`,
  logDek: `${best.store}, ${best.days} days on lot, FSD (Supervised) included.`,
  logFoot: `${best.drops} drops, ${usd(best.drop)} off asking, all logged against this VIN.`,
  teslaH: 'Your Tesla account',
  teslaDek: 'Read-only. Nothing was cancelled, changed or ordered.',
  payH: 'What you would pay',
  payNote: `${usd(counts.bestSaves)} under the ${usd(counts.orderPrice)} Model Y Standard RWD you have on order.`,
  foot: `Made by Superbot for ${meta.user}. Read-only access to Tesla inventory, Carvana, CarMax, CarGurus and the Tesla account.`,
};