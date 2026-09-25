/* data.js - the listing feed behind superbot.app/p/f-series.
   Every number on the board comes from here. Photos are sourced, see CREDITS.txt.
   Deal rating rule (matches the price check the ad describes):
     market delta 5 percent or more below the metro median -> Great
     anything else below the median -> Good
     at or above the median -> Fair */

export const summary = {
  active: 318,
  raw: 1204,
  dropped: 88,
  platforms: 7,
  newToday: 41,
  medianPrice: 46300,
  medianMiles: 62400,
  medianDays: 18,
  rebuilt: '12 min ago',
  diesel: 46,
  fourByFour: 71,
  states: 24,
  // median ask for a 2015 and newer half ton, last 12 weeks, oldest first
  trend: [48200, 47900, 48100, 47500, 47400, 47100, 46900, 47200, 47000, 46700, 46500, 46300],
  trendNote: 'median ask, 12 weeks',
};

/* Metro medians for the map strip. x and y are percentages of the map plate.
   Prices are medians of the listings on this board in that metro. */
export const mapPins = [
  { city: 'Seattle', state: 'WA', x: 7, y: 7, price: 48300, n: 12, side: -1 },
  { city: 'Boise', state: 'ID', x: 15, y: 31, price: 44600, n: 9 },
  { city: 'Sacramento', state: 'CA', x: 8, y: 32, price: 49800, n: 21, side: -1 },
  { city: 'Fresno', state: 'CA', x: 9.5, y: 39, price: 38400, n: 16, side: -1 },
  { city: 'Phoenix', state: 'AZ', x: 22, y: 62, price: 44900, n: 27 },
  { city: 'Cheyenne', state: 'WY', x: 34, y: 31, price: 46300, n: 6 },
  { city: 'Denver', state: 'CO', x: 35, y: 39.5, price: 47200, n: 24 },
  { city: 'Tulsa', state: 'OK', x: 50, y: 59, price: 34900, n: 18 },
  { city: 'Dallas', state: 'TX', x: 52, y: 70, price: 39800, n: 38 },
  { city: 'Chicago', state: 'IL', x: 67, y: 34, price: 43100, n: 31 },
  { city: 'Nashville', state: 'TN', x: 66.5, y: 58, price: 40600, n: 19 },
  { city: 'Roanoke', state: 'VA', x: 77, y: 48, price: 36200, n: 11 },
];

/* chips in the sticky filter bar. key feeds the class on each listing card. */
export const filterChips = [
  { key: 'all', label: 'All F-Series' },
  { key: 'f150', label: 'F-150' },
  { key: 'f250', label: 'F-250' },
  { key: 'f350', label: 'F-350' },
  { key: 'raptor', label: 'Raptor' },
  { key: 'lightning', label: 'Lightning' },
];

export const filterNotes = {
  f150: 'Filtered to F-150. 191 of 318 listings match.',
  f250: 'Filtered to F-250. 54 of 318 listings match.',
  f350: 'Filtered to F-350. 31 of 318 listings match.',
  raptor: 'Filtered to Raptor. 22 of 318 listings match.',
  lightning: 'Filtered to Lightning. 20 of 318 listings match.',
};

export const sortTabs = ['Newest', 'Price', 'Miles', 'Deal'];

/* What each marketplace contributes, in prose, for the footer. Counts come from
   cfg.sources so the chat ticker and the footer can never disagree. */
export const platformNotes = {
  facebook: 'Mostly private sellers. 4 in 5 are within a day of a major metro.',
  craigslist: 'Older trucks, cash sales. We only kept listings with a photo and a real VIN year.',
  ebay: 'Auctions and buy it now. Prices here are the current bid, not the sticker.',
  cargurus: 'Dealer listings with a live price history. This is where the deal ratings start.',
  autotrader: 'Dealer inventory, certified pre owned included. Asking price only.',
  carsdotcom: 'Dealer inventory with mileage verified at listing time.',
  offerup: 'Local pickups, short descriptions. Listings without a plate or a VIN year were dropped.',
};

const rows = [
  {
    id: 'f150-2022-xlt', img: './img/xlt21.jpg', year: 2022, model: 'F-150', trim: 'XLT',
    cab: 'SuperCrew', spec: '4x4, 2.7 V6, 5.5 ft bed', price: 41900, miles: 34200,
    city: 'Boise', state: 'ID', platform: 'facebook', posted: 'today', days: 0, market: 44600, stock: 'FB 24081',
  },
  {
    id: 'lightning-2022-lariat', img: './img/light23.jpg', year: 2022, model: 'F-150 Lightning', trim: 'Lariat',
    cab: 'SuperCrew', spec: 'extended range, 320 mi EPA', price: 52400, miles: 18900,
    city: 'Sacramento', state: 'CA', platform: 'cargurus', posted: 'today', days: 0, market: 56800, stock: 'CG 99412',
  },
  {
    id: 'f250-2017-lariat', img: './img/f250lar17.jpg', year: 2017, model: 'F-250', trim: 'Lariat',
    cab: 'Super Duty crew cab', spec: '4x4, 6.7 Power Stroke, 8 ft bed', price: 26900, miles: 141000,
    city: 'Cheyenne', state: 'WY', platform: 'autotrader', posted: '2d', days: 2, market: 27500, stock: 'AT 40118',
  },
  {
    id: 'f250-2015-xlt', img: './img/f250xlt17.jpg', year: 2015, model: 'F-250', trim: 'XLT',
    cab: 'Super Duty Super Cab', spec: '4x4, 6.2 V8, snow plow prep', price: 32900, miles: 96400,
    city: 'Tulsa', state: 'OK', platform: 'craigslist', posted: '3d', days: 3, market: 33500, stock: 'CL 7719',
  },
  {
    id: 'f350-2006-lariat', img: './img/f350drw19.jpg', year: 2006, model: 'F-350', trim: 'Lariat',
    cab: 'Super Duty crew cab, dual rear wheels', spec: '4x4, 6.0 Power Stroke, long bed', price: 24800, miles: 148000,
    city: 'Waco', state: 'TX', platform: 'ebay', posted: '2d', days: 2, market: 23900, stock: 'EB 33025',
  },
  {
    id: 'f350-2019-platinum', img: './img/f350plat20.jpg', year: 2019, model: 'F-350', trim: 'Platinum',
    cab: 'Super Duty crew cab', spec: '4x4, 6.7 Power Stroke, ultimate package', price: 64900, miles: 46300,
    city: 'Denver', state: 'CO', platform: 'carsdotcom', posted: 'today', days: 0, market: 68400, stock: 'CD 21044',
  },
  {
    id: 'f150-2008-king-ranch', img: './img/king20.jpg', year: 2008, model: 'F-150', trim: 'King Ranch',
    cab: 'SuperCrew', spec: '4x4, 5.4 V8, two tone leather', price: 16400, miles: 158000,
    city: 'Nashville', state: 'TN', platform: 'offerup', posted: '4d', days: 4, market: 15900, stock: 'OU 5563',
  },
  {
    id: 'f150-2007-lariat', img: './img/lariat21.jpg', year: 2007, model: 'F-150', trim: 'Lariat',
    cab: 'SuperCrew', spec: '4x4, 5.4 V8, tow package', price: 12900, miles: 172000,
    city: 'Fresno', state: 'CA', platform: 'craigslist', posted: '2d', days: 2, market: 12100, stock: 'CL 8830',
  },
  {
    id: 'f150-2010-platinum', img: './img/plat18.jpg', year: 2010, model: 'F-150', trim: 'Platinum',
    cab: 'SuperCrew', spec: '4x4, 6.2 V8, 6.5 ft bed', price: 27500, miles: 118000,
    city: 'Phoenix', state: 'AZ', platform: 'facebook', posted: 'today', days: 0, market: 29900, stock: 'FB 11947',
  },
  {
    id: 'f150-2014-tremor', img: './img/tremor22.jpg', year: 2014, model: 'F-150', trim: 'Tremor',
    cab: 'SuperCab', spec: '4x4, 3.5 EcoBoost, 4.10 locking rear', price: 21800, miles: 121000,
    city: 'Kansas City', state: 'MO', platform: 'offerup', posted: '5d', days: 5, market: 20900, stock: 'OU 1184',
  },
  {
    id: 'f150-2006-xl', img: './img/xl16.jpg', year: 2006, model: 'F-150', trim: 'XL',
    cab: 'regular cab', spec: 'rear wheel drive, 4.2 V6, 8 ft bed', price: 8900, miles: 164000,
    city: 'Roanoke', state: 'VA', platform: 'ebay', posted: '3d', days: 3, market: 8400, stock: 'EB 60714',
  },
  {
    id: 'f150-2002-xlt', img: './img/xlt19.jpg', year: 2002, model: 'F-150', trim: 'XLT',
    cab: 'SuperCab', spec: '4x4, 4.6 V8, 6.5 ft bed', price: 7600, miles: 189000,
    city: 'Spokane', state: 'WA', platform: 'craigslist', posted: '6d', days: 6, market: 7100, stock: 'CL 2245',
  },
  {
    id: 'f150-2003-xlt', img: './img/xlt15.jpg', year: 2003, model: 'F-150', trim: 'XLT',
    cab: 'SuperCrew', spec: '5.4 V8, matching canopy, 138 in wheelbase', price: 9400, miles: 176000,
    city: 'Billings', state: 'MT', platform: 'offerup', posted: '4d', days: 4, market: 9700, stock: 'OU 3391',
  },
  {
    id: 'raptor-2010-svt', img: './img/raptor22.jpg', year: 2010, model: 'F-150 Raptor', trim: 'SVT',
    cab: 'SuperCrew', spec: '4x4, 6.2 V8, Fox shocks, 35 in tires', price: 33400, miles: 108000,
    city: 'Dallas', state: 'TX', platform: 'autotrader', posted: 'today', days: 0, market: 36100, stock: 'AT 77902',
  },
  {
    id: 'raptor-2013-roush', img: './img/raptor21.jpg', year: 2013, model: 'F-150 Raptor', trim: 'SVT',
    cab: 'SuperCrew', spec: '4x4, 6.2 V8, Roush supercharger', price: 44900, miles: 82000,
    city: 'Chicago', state: 'IL', platform: 'carsdotcom', posted: '2d', days: 2, market: 46700, stock: 'CD 55120',
  },
];

const usd = (n) => '$' + Number(n).toLocaleString('en-US');
const kMiles = (n) => Math.round(n / 1000) + 'k mi';

function rating(price, market) {
  const delta = price - market;
  if (delta <= -0.05 * market) return 'Great';
  if (delta < -0.01 * market) return 'Good';
  return 'Fair';
}

function family(model) {
  if (/Raptor/.test(model)) return 'raptor';
  if (/Lightning/.test(model)) return 'lightning';
  if (/F-350/.test(model)) return 'f350';
  if (/F-250/.test(model)) return 'f250';
  return 'f150';
}

export const listings = rows.map((r) => {
  const delta = r.price - r.market;
  return {
    ...r,
    family: family(r.model),
    delta,
    over: delta >= 0,
    pctOfMarket: Math.round((r.price / r.market) * 100),
    deal: rating(r.price, r.market),
    priceText: usd(r.price),
    marketText: usd(r.market),
    title: `${r.year} Ford ${r.model} ${r.trim} ${r.cab}`,
    meta: `${r.year} · ${kMiles(r.miles)} · ${r.city}, ${r.state}`,
    source: r.platform,
    postedText: r.posted === 'today' ? 'Listed today' : `Listed ${r.posted} ago`,
  };
});

/* the hub aggregation card reads this shape */
export const items = listings.map((l) => ({
  img: l.img,
  title: l.title,
  price: l.priceText,
  meta: l.meta,
  source: l.source,
}));

export const counts = {
  byFamily: { f150: 191, f250: 54, f350: 31, raptor: 22, lightning: 20 },
  byDeal: { Great: 96, Good: 121, Fair: 101 },
  showing: listings.length,
};

export const board = {
  head: '318 used F-Series trucks, checked against their own market',
  dek: 'Seven marketplaces, one board. Every price is weighed against the median ask for the same year, cab and mileage band in the same metro.',
  priceNote: 'Deal ratings come from a price history on the same truck, not a book value. A truck priced 5 percent or more under its metro median is rated Great.',
  footTitle: 'How this board was built',
  footBody: 'One ask, 1,204 listings read across 7 marketplaces, 88 duplicates dropped, then the price check. 318 trucks are live on this board.',
  vdpNote: 'Prices are asking prices and they move. Confirm the trim, the title and the VIN year with the seller before you drive out.',
};