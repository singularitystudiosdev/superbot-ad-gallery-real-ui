/* data.js - the numbers behind the "NovelKeys + CannonKeys + KBDfans + Drop + Keychron, one group-buy
   overview" spot.
   Invented but plausible: one keyboard builder (Riley, Portland OR) on Saturday Sep 26 2026. Superbot signs
   in to Riley's Gmail and to the NovelKeys, CannonKeys, KBDfans, Drop and Keychron accounts, finds every
   group buy and preorder already in them, reads each vendor's live order page and its latest fulfillment
   update, checks r/mechmarket for listings matching the wishlist, and returns one overview: item, vendor,
   date joined, production stage, latest update, estimated ship date and how late it is, plus wishlist
   matches with price and link. Read-only: nothing is bought, no group buy is joined, no order is changed,
   no listing is claimed and no message is sent.
   Every figure the hub, the steps and the page print is derived here, so the three always agree. */

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** [y, m, d] -> day number since 1970 (UTC), so weekdays and gaps are computed, never typed */
const dayNo = ([y, m, d]) => Math.round(Date.UTC(y, m - 1, d) / 86400000);
const dowOf = (ymd) => DOW[new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2])).getUTCDay()];

/** seconds since midnight -> "8:42 AM" */
export function hm(sec) {
  const s = Math.max(0, Math.round(sec)) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
/** "10 AM" for an on-the-hour time, "9:30 AM" otherwise */
export function hShort(sec) {
  return hm(sec).replace(':00 ', ' ');
}
/** [y, m, d] -> "Sat Oct 17" */
export const dayText = (ymd) => `${dowOf(ymd)} ${MON[ymd[1] - 1]} ${ymd[2]}`;
/** [y, m, d] -> "Oct 17", the compact form the tables use */
export const dayShort = (ymd) => `${MON[ymd[1] - 1]} ${ymd[2]}`;
/** [y, m, d] -> { dow: 'SAT', mon: 'OCT', d: 17 } for the date blocks */
export const dayParts = (ymd) => ({ dow: dowOf(ymd).toUpperCase(), mon: MON[ymd[1] - 1].toUpperCase(), d: ymd[2] });
export const dowText = dowOf;

/** 971 -> "$971" */
export const money = (n) => `$${Number(Math.round(n)).toLocaleString('en-US')}`;
/** whole months between two dates, to one decimal ("3.6") */
export const monthsBetween = (a, b) => (dayNo(b) - dayNo(a)) / 30.4375;
/** 3.6 -> "+3.6 mo" */
export const monthsLate = (n) => `+${n.toFixed(1)} mo`;

export const meta = {
  user: 'Riley',
  city: 'Portland, OR',
  zip: '97214',
  today: [2026, 9, 26],
  syncStart: 8 * 3600 + 42 * 60 + 11, // 8:42:11 AM PT, Saturday
  syncSecs: 46,
};
meta.date = dayText(meta.today);
meta.todayText = dayShort(meta.today);

/* ---------- the production pipeline every buy sits somewhere on ---------- */
export const stages = [
  { key: 'ic', name: 'Interest check' },
  { key: 'gb', name: 'GB closed' },
  { key: 'prod', name: 'In production' },
  { key: 'qc', name: 'QC' },
  { key: 'ship', name: 'Shipping' },
  { key: 'deliv', name: 'Delivered' },
];
export const stageOf = (k) => stages.findIndex((s) => s.key === k);
export const stageName = (k) => (stages[stageOf(k)] || stages[0]).name;

/* ---------- the places Superbot reads, and their logos under ./brand (fixed names) ---------- */
export const vendors = {
  novelkeys: { name: 'NovelKeys', logo: './brand/novelkeys.svg', where: 'Morgantown, WV' },
  cannonkeys: { name: 'CannonKeys', logo: './brand/cannonkeys.svg', where: 'Winooski, VT' },
  kbdfans: { name: 'KBDfans', logo: './brand/kbdfans.svg', where: 'Shenzhen, CN' },
  drop: { name: 'Drop', logo: './brand/drop.svg', where: 'San Francisco, CA' },
  keychron: { name: 'Keychron', logo: './brand/keychron.svg', where: 'Shenzhen, CN' },
  gmail: { name: 'Gmail', logo: './brand/gmail.svg', where: 'order and shipping mail' },
  mechmarket: { name: 'r/mechmarket', logo: './brand/mechmarket.svg', where: 'reddit.com/r/mechmarket' },
};
export const vendorOf = (id) => vendors[id];
/** the five shops Riley actually has orders with */
export const SHOPS = ['novelkeys', 'cannonkeys', 'kbdfans', 'drop', 'keychron'];

/* Every buy, one row each. `stage` is a key of `stages`; `eta` is the date the vendor gave when the buy
   closed, `est` the date its order page gives today; `paid` what the order took at GB time; `tracking` the
   number the vendor's own shipping mail gave (null while nothing has shipped). `update` is the vendor's
   latest fulfillment line, quoted. */
const RAW = [
  { key: 'harbor', item: 'GMK Harbor', kind: 'keycap set', vendor: 'novelkeys', joined: [2026, 3, 14], stage: 'prod', paid: 138,
    eta: [2026, 8, 1], est: [2026, 11, 20], tracking: null,
    update: { date: [2026, 9, 18], text: 'RG production finished, on the water in the next batch' } },
  { key: 'silkcream', item: 'NK Silk Cream v3 switches, 110', kind: 'switches', vendor: 'novelkeys', joined: [2026, 5, 2], stage: 'gb', paid: 62,
    eta: [2027, 1, 1], est: [2027, 2, 15], tracking: null,
    update: { date: [2026, 9, 12], text: 'GB closed at 2,140 sets, factory order and molds confirmed' } },
  { key: 'ramen', item: 'Ramen Nebula artisan', kind: 'artisan', vendor: 'novelkeys', joined: [2026, 6, 20], stage: 'qc', paid: 55,
    eta: [2026, 10, 1], est: [2026, 10, 24], tracking: null,
    update: { date: [2026, 9, 22], text: 'QC on the first batch, 40 units held back for shading' } },
  { key: 'circuit', item: 'GMK Circuit', kind: 'keycap set', vendor: 'cannonkeys', joined: [2026, 2, 11], stage: 'qc', paid: 142,
    eta: [2026, 7, 1], est: [2026, 10, 5], tracking: null,
    update: { date: [2026, 9, 24], text: 'Colour chips approved, kits sorted, packing this week' } },
  { key: 'bakeneko', item: 'CannonKeys Bakeneko60 R2', kind: 'board', vendor: 'cannonkeys', joined: [2026, 1, 30], stage: 'ship', paid: 218,
    eta: [2026, 6, 1], est: [2026, 9, 27], tracking: '1Z9W4R7V0394182276',
    update: { date: [2026, 9, 25], text: 'Every order left the warehouse, tracking is live in your account' } },
  { key: 'd65', item: 'KBDfans D65 v3 kit', kind: 'board', vendor: 'kbdfans', joined: [2026, 3, 22], stage: 'prod', paid: 189,
    eta: [2026, 9, 1], est: [2026, 10, 10], tracking: null,
    update: { date: [2026, 9, 15], text: 'Anodising done, PCB and gasket sets reach the shop this month' } },
  { key: 'mt3mat', item: 'Drop MT3 Slate desk mat', kind: 'deskmat', vendor: 'drop', joined: [2026, 4, 7], stage: 'gb', paid: 32,
    eta: [2026, 11, 1], est: [2026, 11, 1], tracking: null,
    update: { date: [2026, 9, 9], text: 'GB closed, sample approved, production booked for October' } },
  { key: 'mt3slate', item: 'Drop MT3 Slate keycap set', kind: 'keycap set', vendor: 'drop', joined: [2026, 2, 11], stage: 'ship', paid: 135,
    eta: [2026, 8, 1], est: [2026, 9, 30], tracking: '1Z9W4R7V0333881190',
    update: { date: [2026, 9, 23], text: 'Container cleared customs, parcels handed to the carrier' } },
  { key: 'q6max', item: 'Keychron Q6 Max, shell white', kind: 'board', vendor: 'keychron', joined: [2026, 1, 12], stage: 'deliv', paid: 209,
    eta: [2026, 8, 1], est: [2026, 8, 28], tracking: '1Z9W4R7V0392018733',
    update: { date: [2026, 8, 28], text: 'Delivered and signed for, spare knob and cable in the box' } },
];

const today = dayNo(meta.today);

export const buys = RAW
  .map((b) => {
    const idx = stageOf(b.stage);
    const v = vendors[b.vendor];
    const late = monthsBetween(b.eta, b.est);
    const wait = Math.max(1, dayNo(b.est) - dayNo(b.joined));
    const held = Math.max(0, today - dayNo(b.joined));
    const out = {
      ...b, v, vendor: b.vendor, stageIdx: idx, stageKey: b.stage, stageLabel: stageName(b.stage),
      joinedDay: dayText(b.joined), joinedShort: dayShort(b.joined), joinedParts: dayParts(b.joined),
      joinedInDays: today - dayNo(b.joined),
      etaDay: dayText(b.eta), etaShort: dayShort(b.eta),
      estDay: dayText(b.est), estShort: dayShort(b.est), estParts: dayParts(b.est),
      estInDays: dayNo(b.est) - today,
      updateDay: dayText(b.update.date), updateShort: dayShort(b.update.date),
      updateAge: today - dayNo(b.update.date),
      late: Math.max(0, late),
      lateRaw: late,
      paidText: money(b.paid),
      // how much of the wait from the day it was joined to the day it is due has already run out
      progress: Math.min(1, Math.max(0, held / wait)),
      open: b.stage !== 'deliv',
    };
    out.lateText = out.late < 0.05 ? 'on time' : monthsLate(out.late);
    out.lateK = out.late < 0.05 ? 'on' : out.late < 1 ? 'slight' : out.late < 3 ? 'late' : 'worst';
    return out;
  })
  .sort((a, b) => dayNo(a.est) - dayNo(b.est))
  .map((b, i) => ({ ...b, n: i + 1 }));

export const byVendor = (id) => buys.filter((b) => b.vendor === id);
export const open = buys.filter((b) => b.open);
export const shipping = buys.filter((b) => b.stageKey === 'ship');
export const delivered = buys.filter((b) => b.stageKey === 'deliv');
export const worst = buys.slice().sort((a, b) => b.late - a.late)[0];
/** the buy whose order page gives the soonest date still ahead of it */
export const nextBuy = open.slice().sort((a, b) => dayNo(a.est) - dayNo(b.est))[0];
/** the next three to arrive: the ones on the water first, then the soonest still in production or QC */
export const arrivals = [
  ...shipping,
  ...open.filter((b) => b.stageKey !== 'ship').sort((a, b) => dayNo(a.est) - dayNo(b.est)),
].slice(0, 3);

// ---------- the wishlist, and what r/mechmarket has this week ----------
export const wishlist = [
  { key: 'lowtide', item: 'GMK Low Tide base kit', kind: 'keycap set', max: 150, why: 'the green modifier row Riley keeps missing' },
  { key: 'sunbreak', item: 'ePBT Sunbreak alpha kit', kind: 'keycap set', max: 95, why: 'goes on the D65 when the kit lands' },
  { key: 'paragon', item: 'Paragon 68 polycarbonate kit', kind: 'board', max: 340, why: '65 percent, gasket mount, hot swap' },
  { key: 'oilking', item: 'Gateron Oil King switches, 110', kind: 'switches', max: 70, why: 'the linears for the office board' },
  { key: 'bloom', item: 'Slime Caps Bloom artisan', kind: 'artisan', max: 60, why: 'finishes the pink artisan row' },
];
export const wishOf = (k) => wishlist.find((w) => w.key === k);

const MATCH_RAW = [
  { id: '1o4x7kd', title: '[US-CA] [H] GMK Low Tide base kit, sealed [W] PayPal', price: 165, posted: 3.5, wish: 'lowtide', cond: 'Sealed, ships in a sleeve', area: 'Los Angeles, CA' },
  { id: '1o4w2mp', title: '[US-TX] [H] ePBT Sunbreak alphas and mods [W] PayPal, trades', price: 88, posted: 9, wish: 'sunbreak', cond: 'Mounted once, no shine', area: 'Austin, TX' },
  { id: '1o4v9ss', title: '[US-WA] [H] Paragon 68 polycarbonate, built [W] PayPal', price: 295, posted: 21, wish: 'paragon', cond: 'Built on Oil Kings, spare plate', area: 'Seattle, WA' },
  { id: '1o4t1qe', title: '[US-OR] [H] Gateron Oil King x110, lubed [W] PayPal', price: 64, posted: 34, wish: 'oilking', cond: 'Local pickup in Portland', area: 'Portland, OR' },
];

export const matches = MATCH_RAW.map((m, i) => ({
  ...m, n: i + 1,
  link: `reddit.com/r/mechmarket/comments/${m.id}/`,
  postedText: m.posted < 24 ? `${Math.round(m.posted * 10) / 10}h ago` : `${Math.round(m.posted / 24)}d ago`,
  priceText: money(m.price),
  want: wishOf(m.wish),
  under: m.price <= wishOf(m.wish).max,
}));

// ---------- what the ask leaves out, said on the page instead of hidden ----------
export const skipped = {
  noMatch: wishlist.filter((w) => !matches.some((m) => m.wish === w.key))
    .map((w) => ({ item: w.item, when: `no listing under ${money(w.max)} this week`, max: w.max })),
  delivered: delivered.map((b) => ({ item: b.item, when: `delivered ${b.estShort}` })),
};

// ---------- counters ----------
const lateOpen = open.map((b) => b.late);
const joinedDays = buys.map((b) => dayNo(b.joined));
export const counts = {
  buys: buys.length,
  shops: SHOPS.length,
  open: open.length,
  joinedFirst: dayShort(buys[joinedDays.indexOf(Math.min(...joinedDays))].joined),
  joinedLast: dayShort(buys[joinedDays.indexOf(Math.max(...joinedDays))].joined),
  sources: 7, // Gmail + the five vendor accounts + r/mechmarket
  updates: buys.length,
  late: buys.filter((b) => b.late >= 0.5).length,
  onTime: buys.filter((b) => b.late < 0.05).length,
  avgLate: lateOpen.reduce((a, b) => a + b, 0) / Math.max(1, lateOpen.length),
  paidOpen: open.reduce((a, b) => a + b.paid, 0),
  paidTotal: buys.reduce((a, b) => a + b.paid, 0),
  shipping: shipping.length,
  delivered: delivered.length,
  inProd: buys.filter((b) => b.stageKey === 'prod').length,
  qc: buys.filter((b) => b.stageKey === 'qc').length,
  gb: buys.filter((b) => b.stageKey === 'gb').length,
  arrivals: arrivals.length,
  daysToNext: Math.max(0, nextBuy.estInDays),
  wishlist: wishlist.length,
  matches: matches.length,
  underMax: matches.filter((m) => m.under).length,
  noMatch: skipped.noMatch.length,
  receipts: 14, // order and shipping confirmations read in Gmail
  bought: 0,
  joined: 0,
  changed: 0,
};

// Where Superbot reads from, each read-only. `pulled` is what the hub's chat counts up beside each source.
export const accounts = [
  { id: 'gmail', name: 'Gmail', logo: vendors.gmail.logo, pulled: counts.receipts, what: 'emails', line: 'order and shipping confirmations' },
  { id: 'novelkeys', name: 'NovelKeys', logo: vendors.novelkeys.logo, pulled: byVendor('novelkeys').length, what: 'orders', line: 'GMK, Silk Cream, artisan' },
  { id: 'cannonkeys', name: 'CannonKeys', logo: vendors.cannonkeys.logo, pulled: byVendor('cannonkeys').length, what: 'orders', line: 'Bakeneko60, GMK Circuit' },
  { id: 'kbdfans', name: 'KBDfans', logo: vendors.kbdfans.logo, pulled: byVendor('kbdfans').length, what: 'orders', line: 'D65 v3 kit, one preorder' },
  { id: 'drop', name: 'Drop', logo: vendors.drop.logo, pulled: byVendor('drop').length, what: 'orders', line: 'MT3 Slate keys and mat' },
  { id: 'keychron', name: 'Keychron', logo: vendors.keychron.logo, pulled: byVendor('keychron').length, what: 'orders', line: 'Q6 Max preorder' },
  { id: 'mechmarket', name: 'r/mechmarket', logo: vendors.mechmarket.logo, pulled: counts.matches, what: 'matches', line: `${counts.wishlist} wishlist items watched` },
];
export const accOf = (id) => accounts.find((a) => a.id === id);

// the hub's preview rows: the two on the water, the next one off the line, then two wishlist matches
export const items = [
  ...shipping.map((b) => ({ img: b.v.logo, title: b.item, meta: `${b.v.name} · joined ${b.joinedShort}`, price: b.estInDays <= 0 ? 'arriving' : `in ${b.estInDays}d`, source: b.vendor })),
  ...open.filter((b) => b.stageKey === 'prod').slice(0, 1).map((b) => ({ img: b.v.logo, title: b.item, meta: `${b.v.name} · ${b.stageLabel}`, price: `est ${b.estShort}`, source: b.vendor })),
  ...matches.slice(0, 2).map((m) => ({ img: vendors.mechmarket.logo, title: m.title.split('[W]')[0].trim(), meta: `posted ${m.postedText} · matches ${m.want.item}`, price: m.priceText, source: 'mechmarket' })),
].slice(0, 5);

const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export const copy = {
  kicker: `Group-buy overview · ${meta.city} · ${counts.buys} buys · ${counts.matches} wishlist matches`,
  h1: `${counts.buys} group buys across ${counts.shops} vendors, ${counts.late} running late, next one lands ${nextBuy.estShort}.`,
  dek: `Gmail and ${counts.shops} vendor accounts signed in and read, every order page and its latest fulfillment update checked, and ${counts.matches} r/mechmarket listings matched to ${counts.wishlist} wishlist items. ${money(counts.paidOpen)} sits in open buys. Read-only: nothing bought, no order changed.`,
  syncing: 'Reading your orders',
  stamp: `Read ${hm(meta.syncStart)} · ${counts.sources} sources, read-only`,
  matched: 'Buys matched',
  shipHead: `Next to ship: ${counts.arrivals} orders`,
  shipSub: `Countdowns from ${meta.date}, ${hm(meta.syncStart)}. Estimates come from each vendor's own order page.`,
  listHead: `All ${counts.buys} group buys, by estimated ship date`,
  listSub: `Joined between ${counts.joinedFirst} and ${counts.joinedLast}. Every stage from GB closed to delivered.`,
  wishHead: `Wishlist matches this week`,
  wishSub: `${counts.matches} r/mechmarket listings for ${counts.wishlist} wishlist items, ${counts.underMax} under the target price. Nothing messaged, nothing claimed.`,
  panelHead: 'Where your money sits',
  panelSub: 'Every buy counted by the stage its order page reports today.',
  sumHead: 'How the orders were checked',
  sumLine: `${counts.sources} sources · ${counts.receipts} confirmations · ${counts.buys} buys · ${counts.updates} fulfillment updates`,
  foot: 'Nothing bought. No order changed.',
  footNote: `Read-only: ${list(accounts.map((a) => a.name))}.`,
  wishNote: `${counts.noMatch} wishlist item with no listing this week. No seller messaged, no listing claimed, no payment sent.`,
};

export default { meta, stages, vendors, SHOPS, buys, open, shipping, delivered, arrivals, nextBuy, worst, wishlist, matches, skipped, counts, accounts, items, copy };