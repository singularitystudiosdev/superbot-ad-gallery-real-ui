/* data.js - four store price table for 65 inch OLED televisions.
   One object per model: today's listing price at each store, the 14 weekly reads behind the 90 day
   chart, and the numbers the page prints. The matrix, the charts, the winner band and the hub
   aggregation card all read these same objects.
   Brands and models are fictional. Photos are sourced (see CREDITS.txt). */

const STORE_IDS = ['amazon', 'bestbuy', 'walmart', 'target'];

export const query = {
  ask: 'Find the cheapest 65 inch OLED TV right now on Amazon, Best Buy, Walmart and Target',
  readAt: '09:14 today',
  listings: 341,
  matched: 14,
  shown: 6,
  weeks: 14,
  taxZip: '78701',
  taxRate: '8.25% sales tax',
  sizeInch: 65,
};

export const stores = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: './brand/amazon.svg',
    count: 121,
    ship: 'Free Prime ship',
    note: 'Marketplace sellers included',
  },
  {
    id: 'bestbuy',
    name: 'Best Buy',
    logo: './brand/bestbuy.svg',
    count: 84,
    ship: 'Free ship over $35',
    note: 'Store pickup in 12 stores',
  },
  {
    id: 'walmart',
    name: 'Walmart',
    logo: './brand/walmart.svg',
    count: 96,
    ship: 'Free ship over $35',
    note: 'Marketplace sellers excluded',
  },
  {
    id: 'target',
    name: 'Target',
    logo: './brand/target.svg',
    count: 40,
    ship: 'Free ship over $35',
    note: 'Only carries 3 of the 6',
  },
];

/* hist: one read every 7 days, oldest first, last one is today.
   prices: today's listing price at each store, null when that store does not carry it. */
const raw = [
  {
    id: 'aurel',
    brand: 'Aurel',
    model: 'G6',
    title: 'Aurel G6 65 inch OLED, 144 Hz',
    sub: 'W-OLED panel, 144 Hz, 4 HDMI 2.1, slim stand',
    panel: 'W-OLED',
    hz: 144,
    hdmi: 4,
    img: './img/tv-1.jpg',
    rating: 4.7,
    reviews: 2140,
    prices: { amazon: 1146, bestbuy: 1199, walmart: 1096, target: 1164 },
    hist: [1348, 1348, 1329, 1319, 1299, 1279, 1299, 1249, 1249, 1229, 1199, 1199, 1148, 1096],
    note: 'Sold out at this price twice in 90 days, both times for 3 days',
  },
  {
    id: 'norval',
    brand: 'Norval',
    model: 'Vanta 65',
    title: 'Norval Vanta 65 inch OLED',
    sub: 'W-OLED panel, 120 Hz, 3 HDMI 2.1, soundbar mounts',
    panel: 'W-OLED',
    hz: 120,
    hdmi: 3,
    img: './img/tv-2.jpg',
    rating: 4.6,
    reviews: 1188,
    prices: { amazon: 1348, bestbuy: 1299, walmart: 1297, target: 1449 },
    hist: [1429, 1429, 1399, 1399, 1379, 1379, 1349, 1349, 1329, 1329, 1299, 1299, 1297, 1297],
    note: 'Best Buy price matches this listing in store',
  },
  {
    id: 'meridian',
    brand: 'Meridian',
    model: 'Arc OLED',
    title: 'Meridian Arc OLED 65 inch',
    sub: 'QD-OLED, 138 Hz, 4 HDMI 2.1, no stand in the box',
    panel: 'QD-OLED',
    hz: 138,
    hdmi: 4,
    img: './img/tv-3.jpg',
    rating: 4.8,
    reviews: 3411,
    prices: { amazon: 1496, bestbuy: 1499, walmart: null, target: 1529 },
    hist: [1599, 1599, 1579, 1569, 1549, 1549, 1529, 1529, 1499, 1499, 1499, 1479, 1479, 1496],
    note: 'Out of stock at Walmart since Aug 29',
  },
  {
    id: 'kestrel',
    brand: 'Kestrel',
    model: 'S65 Pro',
    title: 'Kestrel S65 Pro 65 inch OLED',
    sub: 'W-OLED panel, 120 Hz, 4 HDMI 2.1, wall mount included',
    panel: 'W-OLED',
    hz: 120,
    hdmi: 4,
    img: './img/tv-4.jpg',
    rating: 4.5,
    reviews: 902,
    prices: { amazon: 1698, bestbuy: 1749, walmart: 1688, target: null },
    hist: [1799, 1769, 1749, 1749, 1719, 1699, 1699, 1699, 1699, 1689, 1689, 1688, 1688, 1688],
    note: 'Price has not moved since Aug 21',
  },
  {
    id: 'halcyon',
    brand: 'Halcyon',
    model: 'P65 Eclipse',
    title: 'Halcyon P65 Eclipse OLED',
    sub: 'QD-OLED, 144 Hz, 4 HDMI 2.1, 5 year panel warranty',
    panel: 'QD-OLED',
    hz: 144,
    hdmi: 4,
    img: './img/tv-5.jpg',
    rating: 4.9,
    reviews: 1877,
    prices: { amazon: 1898, bestbuy: 1946, walmart: 1899, target: 1879 },
    hist: [2099, 2049, 1999, 1979, 1949, 1949, 1949, 1929, 1929, 1899, 1899, 1879, 1879, 1879],
    note: 'Only model on this page carried by all four stores',
  },
  {
    id: 'vesper',
    brand: 'Vesper',
    model: 'B65 Master',
    title: 'Vesper B65 Master Series OLED',
    sub: 'W-OLED panel, 120 Hz, 4 HDMI 2.1, studio picture modes',
    panel: 'W-OLED',
    hz: 120,
    hdmi: 4,
    img: './img/tv-6.jpg',
    rating: 4.6,
    reviews: 604,
    prices: { amazon: 2196, bestbuy: 2249, walmart: null, target: 2199 },
    hist: [2299, 2299, 2249, 2249, 2249, 2199, 2199, 2199, 2199, 2199, 2199, 2199, 2199, 2199],
    note: 'Same price at Amazon for 8 weeks',
  },
];

const money = (n) => '$' + Number(n).toLocaleString('en-US');

/** the cheapest store that carries a model, with the price it charges today */
function bestOf(prices) {
  let best = null;
  STORE_IDS.forEach((s) => {
    const p = prices[s];
    if (p == null) return;
    if (!best || p < best.price) best = { store: s, price: p };
  });
  return best;
}

export const models = raw.map((m) => {
  const best = bestOf(m.prices);
  const low = Math.min(...m.hist);
  const high = Math.max(...m.hist);
  const avg = Math.round(m.hist.reduce((a, b) => a + b, 0) / m.hist.length);
  const pct = Math.round(((best.price - avg) / avg) * 100);
  const was = m.hist[0];
  return Object.assign({}, m, {
    best,
    low,
    high,
    avg,
    pct,
    was,
    save: was - best.price,
    atLow: best.price <= low,
    bestText: money(best.price),
    lowText: money(low),
    avgText: money(avg),
    wasText: money(was),
    saveText: money(was - best.price),
  });
});

/** the photo the winner band prints, separate from the row thumbnail */
export const heroImage = './img/room-window.jpg';

/** the model the page opens on: the cheapest of the six, then the cheapest store for it */
export const winner = models.slice().sort((a, b) => a.best.price - b.best.price)[0];
export const winnerStore = stores.find((s) => s.id === winner.best.store) || stores[0];

/** every model that sits at its own 90 day low today */
export const atLow = models.filter((m) => m.atLow);

/** the hub's aggregation card reads these (>= 6, as the ad contract requires): image, title, price today,
    meta line, and the source id of the store that is cheapest for it */
export const items = models.map((m) => ({
  img: m.img,
  title: m.title,
  price: m.bestText,
  meta: m.panel + ' panel · ' + m.hz + ' Hz · ' + m.rating.toFixed(1) + ' stars · ' + m.reviews.toLocaleString('en-US') + ' ratings',
  source: m.best.store,
}));

/** what the winner costs once sales tax and shipping are added, for the zip on the page */
export const delivered = Math.round(winner.best.price * 1.0825 + 0);

/** the price the winner's store charged 90 days ago, for the headline saving */
export const winnerWas = winner.was;