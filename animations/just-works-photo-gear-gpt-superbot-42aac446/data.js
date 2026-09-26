// data.js - the plan behind superbot.app/p/photo-gear, "Gear Watch".
// One morning's read-only check of a Fujifilm X-T5 shooter's photo gear: the Adobe Lightroom catalog
// (14,862 frames, read as EXIF focal lengths), the saved B&H and MPB wishlists, and five stores (B&H,
// Adorama, MPB, KEH and eBay) checked for every wishlist item. Superbot reads what the photographer
// actually shoots, matches the wishlist against that histogram, and records what each item costs new and
// used right now, with the condition grade each store prints. It never buys, never bids, never adds
// anything to a cart, and never edits or exports a photo.
// Every figure the page shows is derived here from these records, so the histogram, the counters, the
// savings and the listing counts cannot disagree with each other.

export const n0 = (n) => Number(n).toLocaleString('en-US');
export const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "9:41 AM" from seconds after midnight (wraps past midnight).
export function hm(sec) {
  const s = ((Math.round(sec) % 86400) + 86400) % 86400;
  const h24 = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const h = h24 % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
// minutes since a listing appeared -> "12 min ago" / "1h 08m ago"
export function ago(min) {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m ago`;
}

export const meta = {
  user: 'Dana',
  body: 'X-T5',
  kit: 'X-T5 kit',
  date: 'Sat, Sep 26',
  syncStart: 9 * 3600 + 41 * 60 + 14, // 9:41:14 AM
  syncSecs: 31,
};

// Where Superbot reads from. `kind` decides the verb the sync card prints.
export const accounts = [
  { id: 'lightroom', name: 'Adobe Lightroom', short: 'Lightroom', logo: './brand/lightroom.svg', kind: 'account', pulled: 14862, what: 'photos read' },
  { id: 'bhwish', name: 'B&H wishlist', short: 'B&H list', logo: './brand/bh.svg', kind: 'wishlist', pulled: 4, what: 'items saved' },
  { id: 'mpbwish', name: 'MPB wishlist', short: 'MPB list', logo: './brand/mpb.svg', kind: 'wishlist', pulled: 3, what: 'items saved' },
  { id: 'bh', name: 'B&H', short: 'B&H', logo: './brand/bh.svg', kind: 'store', pulled: 62, what: 'listings checked' },
  { id: 'adorama', name: 'Adorama', short: 'Adorama', logo: './brand/adorama.svg', kind: 'store', pulled: 41, what: 'listings checked' },
  { id: 'mpb', name: 'MPB', short: 'MPB', logo: './brand/mpb.svg', kind: 'store', pulled: 38, what: 'listings checked' },
  { id: 'keh', name: 'KEH Camera', short: 'KEH', logo: './brand/keh.svg', kind: 'store', pulled: 34, what: 'listings checked' },
  { id: 'ebay', name: 'eBay', short: 'eBay', logo: './brand/ebay.svg', kind: 'store', pulled: 53, what: 'listings checked' },
];
export const accOf = (id) => accounts.find((a) => a.id === id) || accounts[0];
export const STORE_IDS = ['bh', 'adorama', 'mpb', 'keh', 'ebay'];
export const stores = accounts.filter((a) => a.kind === 'store');
export const wishSources = accounts.filter((a) => a.kind === 'wishlist');

// What the catalog says you own, read from EXIF: four lenses on one X-T5 body. `by` is the frames each lens
// took in each 35mm-equivalent bucket, so every share on the page is a division of the same 14,862 frames.
export const lenses = [
  { id: 'xf23', name: 'Fujinon XF 23mm f/1.4 R LM WR', short: 'XF 23mm f/1.4', mm: '23mm', eq: '35mm', hex: '#5eb4ff', acct: 'lightroom', by: { b35: 4310 } },
  { id: 'xf33', name: 'Fujinon XF 33mm f/1.4 R LM WR', short: 'XF 33mm f/1.4', mm: '33mm', eq: '50mm', hex: '#b69cff', acct: 'lightroom', by: { b50: 3567 } },
  { id: 'xf1655', name: 'Fujinon XF 16-55mm f/2.8 R LM WR', short: 'XF 16-55mm f/2.8', mm: '16-55mm', eq: '24-83mm', hex: '#6ff2b0', acct: 'lightroom', by: { b24: 2081, b35: 1338, b85: 1337 } },
  { id: 'xf70300', name: 'Fujinon XF 70-300mm f/4-5.6 R LM OIS WR', short: 'XF 70-300mm f/4-5.6', mm: '70-300mm', eq: '105-450mm', hex: '#ffb547', acct: 'lightroom', by: { b135: 2229 } },
];
export const lensOf = (id) => lenses.find((l) => l.id === id);

// The histogram, in 35mm-equivalent buckets. `share` and `frames` are derived below from `lenses`.
export const buckets = [
  { id: 'b24', label: '24mm', eq: 24, range: '16 to 28mm', note: 'Street and interiors, wide end of the zoom' },
  { id: 'b35', label: '35mm', eq: 35, range: '29 to 42mm', note: 'Everyday and travel, the one you reach for' },
  { id: 'b50', label: '50mm', eq: 50, range: '43 to 62mm', note: 'People and details' },
  { id: 'b85', label: '85mm', eq: 85, range: '63 to 120mm', note: 'Portraits' },
  { id: 'b135', label: '135mm+', eq: 135, range: 'above 120mm', note: 'Wildlife and reach, all on the tele zoom' },
];
export const bucketOf = (id) => buckets.find((b) => b.id === id);

// The six items on the two saved wishlists: 4 saved at B&H, 3 at MPB, 4 of them saved on both, 6 after the
// merge. `bucket` is the histogram bucket the item's focal length falls in, null when you shoot nothing there.
// `img` is the product shot the spot has for that item, null where it has none: those rows draw the focal
// length itself, and a photo that will not load falls back to the same tile.
export const wish = [
  { id: 'x100vi', name: 'Fujifilm X100VI, Silver', short: 'X100VI Silver', type: 'compact body', lens: '23mm fixed', eq: '35mm', bucket: 'b35', img: './img/gear/x100vi.jpg', savedAt: ['bhwish', 'mpbwish'], note: 'Fixed 35mm equivalent, the length you shoot 38% of the time' },
  { id: 'xf56', name: 'Fujinon XF 56mm f/1.2 R WR', short: 'XF 56mm f/1.2', type: 'prime lens', lens: '56mm', eq: '84mm', bucket: 'b85', img: './img/gear/xf56.jpg', savedAt: ['bhwish'], note: 'Portrait prime, just above the lens you use for people' },
  { id: 'xf16', name: 'Fujinon XF 16mm f/1.4 R WR', short: 'XF 16mm f/1.4', type: 'prime lens', lens: '16mm', eq: '24mm', bucket: 'b24', img: './img/gear/xf16.jpg', savedAt: ['bhwish'], note: 'The wide end of the zoom, as a faster prime' },
  { id: 'xf50', name: 'Fujinon XF 50mm f/1.0 R WR', short: 'XF 50mm f/1.0', type: 'prime lens', lens: '50mm', eq: '75mm', bucket: 'b85', img: null, savedAt: ['bhwish'], note: 'The fastest prime Fujifilm makes, scarce since it went out of production' },
  { id: 'xf50140', name: 'Fujinon XF 50-140mm f/2.8 R LM OIS WR', short: 'XF 50-140mm f/2.8', type: 'zoom lens', lens: '50-140mm', eq: '75-210mm', bucket: 'b135', img: null, savedAt: ['mpbwish'], note: 'A faster tele zoom than the 70-300 you own' },
  { id: 'xf8', name: 'Fujinon XF 8mm f/3.5 R WR', short: 'XF 8mm f/3.5', type: 'prime lens', lens: '8mm', eq: '12mm', bucket: null, img: null, savedAt: ['mpbwish'], note: 'Wider than anything you own, no frames anywhere near it' },
];
export const wishOf = (id) => wish.find((w) => w.id === id);

// Every listing read at the five stores. `stock` is what the store page said this morning, `grade` is the
// store's own condition word (KEH and MPB grade used gear), `age` is minutes since the listing appeared and
// is only set on the listings that appeared in the last hour.
export const listings = [
  { id: 'l1', item: 'x100vi', store: 'bh', cond: 'new', price: 1599, stock: 'out', grade: null, note: 'Sold out, backorder open', age: null },
  { id: 'l2', item: 'x100vi', store: 'adorama', cond: 'new', price: 1599, stock: 'out', grade: null, note: 'Sold out, no date', age: null },
  { id: 'l3', item: 'x100vi', store: 'ebay', cond: 'used', price: 1695, stock: 'in', grade: 'Open box', note: 'Just listed', age: 12 },
  { id: 'l4', item: 'x100vi', store: 'mpb', cond: 'used', price: 1749, stock: 'in', grade: 'Like new', note: 'Listed this morning', age: 41 },
  { id: 'l5', item: 'x100vi', store: 'keh', cond: 'used', price: 1789, stock: 'in', grade: 'Like New', note: 'Body only, in stock', age: null },

  { id: 'l6', item: 'xf56', store: 'bh', cond: 'new', price: 999, stock: 'in', grade: null, note: 'In stock', age: null },
  { id: 'l7', item: 'xf56', store: 'adorama', cond: 'new', price: 999, stock: 'in', grade: null, note: 'In stock', age: null },
  { id: 'l8', item: 'xf56', store: 'mpb', cond: 'used', price: 799, stock: 'in', grade: 'Excellent', note: 'Just listed', age: 26 },
  { id: 'l9', item: 'xf56', store: 'keh', cond: 'used', price: 849, stock: 'in', grade: 'EX+', note: 'In stock', age: null },

  { id: 'l10', item: 'xf16', store: 'bh', cond: 'new', price: 999, stock: 'in', grade: null, note: 'In stock', age: null },
  { id: 'l11', item: 'xf16', store: 'adorama', cond: 'new', price: 999, stock: 'out', grade: null, note: 'Backorder', age: null },
  { id: 'l12', item: 'xf16', store: 'keh', cond: 'used', price: 649, stock: 'in', grade: 'EX+', note: 'Just listed', age: 58 },
  { id: 'l13', item: 'xf16', store: 'ebay', cond: 'used', price: 675, stock: 'in', grade: 'Good', note: 'In stock', age: null },

  { id: 'l14', item: 'xf50', store: 'bh', cond: 'new', price: 1499, stock: 'out', grade: null, note: 'Sold out, no date', age: null },
  { id: 'l15', item: 'xf50', store: 'adorama', cond: 'new', price: 1499, stock: 'out', grade: null, note: 'Backorder', age: null },
  { id: 'l16', item: 'xf50', store: 'mpb', cond: 'used', price: 1029, stock: 'out', grade: 'Excellent', note: 'Sold, listing closed', age: null },

  { id: 'l17', item: 'xf50140', store: 'bh', cond: 'new', price: 1599, stock: 'in', grade: null, note: 'In stock', age: null },
  { id: 'l18', item: 'xf50140', store: 'adorama', cond: 'new', price: 1599, stock: 'out', grade: null, note: 'Backorder', age: null },
  { id: 'l19', item: 'xf50140', store: 'mpb', cond: 'used', price: 1049, stock: 'in', grade: 'Good', note: 'In stock', age: null },
  { id: 'l20', item: 'xf50140', store: 'keh', cond: 'used', price: 1129, stock: 'in', grade: 'EX', note: 'In stock', age: null },

  { id: 'l21', item: 'xf8', store: 'bh', cond: 'new', price: 799, stock: 'in', grade: null, note: 'In stock', age: null },
  { id: 'l22', item: 'xf8', store: 'adorama', cond: 'new', price: 799, stock: 'in', grade: null, note: 'In stock', age: null },
  { id: 'l23', item: 'xf8', store: 'keh', cond: 'used', price: 549, stock: 'in', grade: 'EX', note: 'In stock', age: null },
  { id: 'l24', item: 'xf8', store: 'ebay', cond: 'used', price: 579, stock: 'in', grade: 'Like new', note: 'Just listed', age: 52 },
];

/* ---------------------------------------------------------------- derived */

lenses.forEach((l) => {
  l.frames = Object.values(l.by).reduce((t, n) => t + n, 0);
});
export const photoTotal = lenses.reduce((t, l) => t + l.frames, 0);
lenses.forEach((l) => {
  l.share = Math.round((l.frames / photoTotal) * 100);
  l.buckets = buckets.filter((b) => l.by[b.id]);
});

buckets.forEach((b) => {
  b.frames = lenses.reduce((t, l) => t + (l.by[b.id] || 0), 0);
  b.share = Math.round((b.frames / photoTotal) * 100);
  b.rows = lenses
    .filter((l) => l.by[b.id])
    .map((l) => ({ lens: l, frames: l.by[b.id], share: Math.round((l.by[b.id] / b.frames) * 100) }));
});
export const topBucket = buckets.slice().sort((a, b) => b.frames - a.frames)[0];
export const leastBucket = buckets.slice().sort((a, b) => a.frames - b.frames)[0];

// Per time (minutes) a listing has been up, only where the store stamped one; the rest read as in stock.
listings.forEach((l) => {
  l.ago = l.age == null ? null : ago(l.age);
  const w = wishOf(l.item);
  l.itemName = w ? w.short : l.item;
});

// Per item: the cheapest in-stock new listing, the cheapest in-stock used listing, what the used one saves
// against new, whether anything is live at all, and the state at each of the five stores.
wish.forEach((w) => {
  const mine = listings.filter((l) => l.item === w.id);
  w.listings = mine;
  const byPrice = (c) => mine.filter((l) => l.cond === c && l.stock === 'in').sort((a, b) => a.price - b.price);
  w.newList = byPrice('new');
  w.usedList = byPrice('used');
  w.newBest = w.newList[0] || null;
  w.usedBest = w.usedList[0] || null;
  w.inStock = !!(w.newBest || w.usedBest);
  w.best = w.usedBest && w.newBest ? (w.usedBest.price <= w.newBest.price ? w.usedBest : w.newBest) : (w.usedBest || w.newBest);
  w.savings = w.newBest && w.usedBest ? Math.round((w.newBest.price - w.usedBest.price) * 100) / 100 : null;
  w.soldOutNew = !w.newBest;
  w.soldOutUsed = !w.usedBest;
  w.sold = mine.find((l) => l.stock === 'out') || null;
  w.spots = {};
  STORE_IDS.forEach((sid) => {
    const at = mine.filter((l) => l.store === sid);
    if (!at.length) { w.spots[sid] = 'none'; return; }
    if (at.some((l) => l.cond === 'new' && l.stock === 'in')) { w.spots[sid] = 'new'; return; }
    if (at.some((l) => l.cond === 'used' && l.stock === 'in')) { w.spots[sid] = 'used'; return; }
    w.spots[sid] = 'out';
  });
  w.bucketLabel = w.bucket ? bucketOf(w.bucket).label : '12mm';
});

// which wishlist items land in each bucket: what the shoot cards say about the wishlist
buckets.forEach((b) => { b.wish = wish.filter((w) => w.bucket === b.id); });

export const inStock = wish.filter((w) => w.inStock);
export const gone = wish.filter((w) => !w.inStock);
export const priciest = wish.filter((w) => w.savings).sort((a, b) => b.savings - a.savings);
// the new listings of the last hour, newest first: what the Just listed tab prints
export const fresh = listings.filter((l) => l.age != null).sort((a, b) => a.age - b.age);
export const freshByItem = wish.filter((w) => w.listings.some((l) => l.age != null));

export const counts = {
  sources: accounts.length,
  records: accounts.reduce((t, a) => t + a.pulled, 0),
  photos: accOf('lightroom').pulled,
  lenses: lenses.length,
  buckets: buckets.length,
  wish: wish.length,
  saves: wishSources.reduce((t, a) => t + a.pulled, 0),
  inStock: inStock.length,
  gone: gone.length,
  fresh: fresh.length,
  listings: stores.reduce((t, a) => t + a.pulled, 0),
  stores: stores.length,
  newBest: Math.min(...inStock.filter((w) => w.newBest).map((w) => w.newBest.price)),
  newCount: inStock.filter((w) => w.newBest).length,
  usedBest: Math.min(...wish.filter((w) => w.usedBest).map((w) => w.usedBest.price)),
  usedCount: wish.filter((w) => w.usedBest).length,
  savings: Math.round(priciest.reduce((t, w) => t + w.savings, 0) * 100) / 100,
  savingsItems: priciest.length,
  usedTotal: Math.round(wish.filter((w) => w.usedBest).reduce((t, w) => t + w.usedBest.price, 0) * 100) / 100,
  topFocal: topBucket.label,
  topShare: topBucket.share,
  topFrames: topBucket.frames,
  leastFocal: leastBucket.label,
  leastShare: leastBucket.share,
  gap: wish.filter((w) => !w.bucket).length,
  covered: wish.filter((w) => w.bucket).length,
  newest: fresh[0],
  oldestFresh: fresh[fresh.length - 1],
  soldLocked: wish.filter((w) => !w.newBest && !w.usedBest).length,
};

// The hub's preview rows: one per wishlist item, the listing Superbot would point at (cheapest live, and a
// listing of the last hour first), at the store that has it.
export const items = wish
  .slice()
  .sort((a, b) => {
    const af = a.best && a.best.age != null ? 0 : 1;
    const bf = b.best && b.best.age != null ? 0 : 1;
    if (af !== bf) return af - bf;
    return (a.best ? a.best.price : 9999) - (b.best ? b.best.price : 9999);
  })
  .map((w) => {
    const l = w.best;
    const st = l ? accOf(l.store) : accOf(w.listings[0].store);
    return {
      img: w.img || st.logo,
      title: `${w.short}${l ? (l.cond === 'used' ? ', used' : ', new') : ', sold out'}`,
      meta: l
        ? `${st.short}, ${l.cond === 'used' ? (l.grade || 'used') : 'new'}${l.age != null ? `, listed ${l.ago}` : ', in stock'}`
        : `${st.short}, no listing live`,
      price: money(l ? l.price : w.listings[0].price),
      source: st.id,
    };
  });

// Every line of page copy that is not a record. Read-only in every word: read, checked, found, never bought.
export const copy = {
  brand: 'Gear Watch',
  kicker: `${meta.date}, catalog and wishlists read at ${hm(meta.syncStart)}`,
  heroH1: `35mm equivalent is ${counts.topShare}% of what you shoot, and ${counts.inStock} of ${counts.wish} wishlist items are in stock`,
  heroDek: `Superbot read ${n0(counts.photos)} frames from your Lightroom catalog, pulled the B&H and MPB wishlists and checked every price at five stores. It matched the wishlist against the focal lengths you really shoot. Nothing was edited, exported, bid on or bought.`,
  syncNow: `Reading ${counts.sources} sources`,
  syncDone: 'All sources read',
  syncClose: 'Wishlist matched',
  kitK: 'Today',
  kitNote: `Read from ${accOf('lightroom').name}. Nothing edited, exported or bought.`,
  statsH: 'What the read says',
  statsDek: 'Four answers, read from the catalog, the two wishlists and five stores',
  shootH: 'What you shoot',
  shootDek: `${n0(counts.photos)} frames from Lightroom, bucketed by 35mm equivalent`,
  panelsH: 'The wishlist, item by item',
  panelsDek: `${counts.wish} items matched to your focal lengths, ${n0(counts.listings)} listings checked at ${counts.stores} stores`,
  overviewNote: `${counts.gone} of ${counts.wish} has no new or used listing live right now`,
  totalLabel: `Cheapest used price for the ${counts.inStock} in stock`,
  freshNote: `${counts.fresh} listings appeared in the last hour. Prices read live from each store. Nothing added to a cart, nothing bid on, nothing bought.`,
  foot: `Read-only. Superbot read the Lightroom catalog, 2 wishlists and 5 stores. Nothing was bought, bid on or added to a cart.`,
};

export default { meta, accounts, lenses, buckets, wish, listings, inStock, gone, fresh, freshByItem, counts, items, copy, photoTotal, topBucket };