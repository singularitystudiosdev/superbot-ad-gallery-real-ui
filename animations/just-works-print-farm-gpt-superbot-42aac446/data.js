// data.js - the plan behind superbot.app/p/print-farm, "Print Farm".
// One evening's read-only check of a five-printer home farm: Bambu Handy (an X1 Carbon and a P1S, each with a
// four-slot AMS), Prusa Connect (an MK4S and a Core One), OctoPrint (an Ender-3 V3), the saved MakerWorld and
// Printables queues, and four filament stores (Bambu Lab store, Polymaker, Prusament, Amazon). Superbot reads
// what is printing, how many grams sit on every spool, what the queued models need, and where each missing
// colour is back in stock cheapest. It never starts, pauses or cancels a print and never buys a spool.
// Every figure the page shows is derived here from these records, so the counters, the gram bars, the
// shortfalls and the restock total cannot disagree with each other.

const n0 = (n) => Number(n).toLocaleString('en-US');
export const money = (n) => '$' + Number(n).toFixed(2);
export const grams = (n) => n0(Math.round(n)) + ' g';

// "7:42 PM" from seconds after midnight (wraps past midnight).
export function hm(sec) {
  const s = ((Math.round(sec) % 86400) + 86400) % 86400;
  const h24 = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const h = h24 % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
// "1h 38m" / "22m"
export function dur(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

export const meta = {
  user: 'Dana',
  farm: 'Garage farm',
  date: 'Sat, Sep 26',
  syncStart: 19 * 3600 + 42 * 60 + 10, // 7:42:10 PM
  syncSecs: 38,
  kg: 1, // every restock is quoted as one 1 kg spool
};

// Where Superbot reads from. `kind` decides the verb the sync card uses.
export const accounts = [
  { id: 'handy', name: 'Bambu Handy', short: 'Handy', logo: './brand/bambu.svg', kind: 'account', pulled: 648, what: 'X1C and P1S, 8 AMS slots' },
  { id: 'connect', name: 'Prusa Connect', short: 'Connect', logo: './brand/prusa.svg', kind: 'account', pulled: 312, what: 'MK4S and Core One' },
  { id: 'octo', name: 'OctoPrint', short: 'OctoPrint', logo: './brand/octoprint.svg', kind: 'account', pulled: 164, what: 'Ender-3 V3 on the Pi' },
  { id: 'makerworld', name: 'MakerWorld', short: 'MakerWorld', logo: './brand/makerworld.svg', kind: 'queue', pulled: 5, what: 'saved print queue' },
  { id: 'printables', name: 'Printables', short: 'Printables', logo: './brand/printables.svg', kind: 'queue', pulled: 5, what: 'saved print queue' },
  { id: 'bambustore', name: 'Bambu Lab store', short: 'Bambu store', logo: './brand/bambu.svg', kind: 'store', pulled: 38, what: 'filament listings' },
  { id: 'polymaker', name: 'Polymaker', short: 'Polymaker', logo: './brand/polymaker.svg', kind: 'store', pulled: 24, what: 'filament listings' },
  { id: 'prusament', name: 'Prusament', short: 'Prusament', logo: './brand/prusament.svg', kind: 'store', pulled: 19, what: 'filament listings' },
  { id: 'amazon', name: 'Amazon', short: 'Amazon', logo: './brand/amazon.svg', kind: 'store', pulled: 57, what: 'filament listings' },
];
export const accOf = (id) => accounts.find((a) => a.id === id);

// The five printers, as their apps report them at 7:42 PM. `left` is minutes to go.
export const printers = [
  {
    id: 'x1c', bay: 'Bay 1', name: 'Bambu Lab X1 Carbon', short: 'X1 Carbon', acct: 'handy',
    img: './img/printers/x1c.jpg', status: 'printing',
    job: 'Articulated Dragon', jobSrc: 'makerworld', pct: 64, layer: [212, 331], left: 98,
    nozzle: 220, bed: 55, unit: 'AMS A',
  },
  {
    id: 'p1s', bay: 'Bay 2', name: 'Bambu Lab P1S', short: 'P1S', acct: 'handy',
    img: './brand/bambu.svg', status: 'printing',
    job: 'Gridfinity Baseplate 6x4', jobSrc: 'printables', pct: 38, layer: [41, 108], left: 192,
    nozzle: 220, bed: 65, unit: 'AMS B',
  },
  {
    id: 'mk4s', bay: 'Bay 3', name: 'Original Prusa MK4S', short: 'MK4S', acct: 'connect',
    img: './brand/prusa.svg', status: 'printing',
    job: 'Cable Chain Mount', jobSrc: 'printables', pct: 81, layer: [178, 220], left: 22,
    nozzle: 215, bed: 60, unit: 'Spool',
  },
  {
    id: 'core', bay: 'Bay 4', name: 'Prusa Core One', short: 'Core One', acct: 'connect',
    img: './brand/prusa.svg', status: 'printing',
    job: 'Headphone Stand', jobSrc: 'makerworld', pct: 22, layer: [36, 164], left: 286,
    nozzle: 240, bed: 80, unit: 'Spool',
  },
  {
    id: 'ender', bay: 'Bay 5', name: 'Creality Ender-3 V3', short: 'Ender-3 V3', acct: 'octo',
    img: './brand/octoprint.svg', status: 'finished',
    job: 'Filament Swatch Rack', jobSrc: 'printables', pct: 100, layer: [96, 96], left: 0,
    doneAt: 18 * 3600 + 58 * 60, // 6:58 PM
    nozzle: 32, bed: 29, unit: 'Spool',
  },
];
export const printerOf = (id) => printers.find((p) => p.id === id);

// Every loaded spool: grams left as the printer reports it (AMS RFID or the app's spool tracker).
export const spools = [
  { id: 'a1', printer: 'x1c', slot: 'A1', brand: 'Bambu', mat: 'PLA Basic', color: 'Jade White', hex: '#ecebe4', left: 612 },
  { id: 'a2', printer: 'x1c', slot: 'A2', brand: 'Bambu', mat: 'PLA Basic', color: 'Orange', hex: '#ff6a13', left: 148 },
  { id: 'a3', printer: 'x1c', slot: 'A3', brand: 'Bambu', mat: 'PLA Basic', color: 'Cyan', hex: '#0086d6', left: 96 },
  { id: 'a4', printer: 'x1c', slot: 'A4', brand: 'Bambu', mat: 'PLA Matte', color: 'Charcoal', hex: '#3a3b3d', left: 704 },
  { id: 'b1', printer: 'p1s', slot: 'B1', brand: 'Bambu', mat: 'PLA Matte', color: 'Ivory White', hex: '#efe8d6', left: 83 },
  { id: 'b2', printer: 'p1s', slot: 'B2', brand: 'Bambu', mat: 'PETG HF', color: 'Black', hex: '#1c1c1e', left: 530 },
  { id: 'b3', printer: 'p1s', slot: 'B3', brand: 'Bambu', mat: 'PLA Basic', color: 'Bambu Green', hex: '#00ae42', left: 402 },
  { id: 'b4', printer: 'p1s', slot: 'B4', brand: 'Bambu', mat: 'PLA Matte', color: 'Ash Grey', hex: '#9b9ea0', left: 256 },
  { id: 'm1', printer: 'mk4s', slot: 'Spool', brand: 'Prusament', mat: 'PLA', color: 'Galaxy Black', hex: '#2c2b33', left: 175 },
  { id: 'c1', printer: 'core', slot: 'Spool', brand: 'Prusament', mat: 'PETG', color: 'Prusa Orange', hex: '#fa6831', left: 460 },
  { id: 'e1', printer: 'ender', slot: 'Spool', brand: 'Polymaker', mat: 'PolyTerra PLA', color: 'Forest Green', hex: '#3e6b3a', left: 118 },
];
export const spoolOf = (id) => spools.find((s) => s.id === id);
export const spoolName = (s) => `${s.brand} ${s.mat} ${s.color}`;

// The saved queues, in the order they would print. `use` is grams per spool from each model's sliced plate.
export const queue = [
  { id: 'q1', name: 'Low-Poly Planter Set', src: 'makerworld', printer: 'x1c', use: { a3: 180, a1: 60 } },
  { id: 'q2', name: 'Gridfinity Bin Pack', src: 'makerworld', printer: 'p1s', use: { b4: 140 } },
  { id: 'q3', name: 'Desk Cable Clips (20)', src: 'printables', printer: 'mk4s', use: { m1: 90 } },
  { id: 'q4', name: 'Flexi Rex', src: 'makerworld', printer: 'x1c', use: { a2: 120 } },
  { id: 'q5', name: 'Hex Wall Shelf', src: 'printables', printer: 'mk4s', use: { m1: 330 } },
  { id: 'q6', name: 'Vase Mode Lamp Shade', src: 'makerworld', printer: 'p1s', use: { b1: 265 } },
  { id: 'q7', name: 'Pegboard Tool Holders', src: 'printables', printer: 'core', use: { c1: 210 } },
  { id: 'q8', name: 'Succulent Pot Trio', src: 'printables', printer: 'ender', use: { e1: 290 } },
  { id: 'q9', name: 'Mini Benchy Fleet', src: 'makerworld', printer: 'x1c', use: { a3: 130 } },
  { id: 'q10', name: 'Spool Holder Arm', src: 'printables', printer: 'p1s', use: { b2: 180 } },
];

// Store listings for every colour the queue runs short on or low on, 1 kg each, read live.
export const offers = [
  { spool: 'a3', store: 'bambustore', price: 19.99, stock: 'in', note: 'Refill, in stock' },
  { spool: 'a3', store: 'amazon', price: 25.99, stock: 'in', note: 'Ships Monday' },
  { spool: 'b1', store: 'bambustore', price: 21.99, stock: 'in', note: 'Back in stock Thursday' },
  { spool: 'b1', store: 'amazon', price: 26.49, stock: 'out', note: 'Out of stock' },
  { spool: 'm1', store: 'prusament', price: 29.99, stock: 'in', note: 'In stock' },
  { spool: 'm1', store: 'amazon', price: 27.99, stock: 'in', note: 'Ships tomorrow' },
  { spool: 'e1', store: 'polymaker', price: 17.99, stock: 'in', note: 'Back in stock today' },
  { spool: 'e1', store: 'amazon', price: 21.49, stock: 'in', note: 'Ships Monday' },
  { spool: 'a2', store: 'bambustore', price: 19.99, stock: 'in', note: 'Refill, in stock' },
  { spool: 'a2', store: 'amazon', price: 24.99, stock: 'in', note: 'Ships Monday' },
];

/* ---------------------------------------------------------------- derived */

const eta = (p) => meta.syncStart + p.left * 60;
printers.forEach((p) => {
  p.eta = p.status === 'printing' ? hm(eta(p)) : null;
  p.leftText = p.status === 'printing' ? dur(p.left) : null;
  p.doneText = p.doneAt ? hm(p.doneAt) : null;
  p.spools = spools.filter((s) => s.printer === p.id);
});

// Need per spool, the queued job where it runs dry, and what is left after the whole queue.
spools.forEach((s) => {
  let need = 0;
  s.dryDuring = null;
  queue.forEach((q) => {
    const g = q.use[s.id] || 0;
    if (!g) return;
    need += g;
    if (!s.dryDuring && need > s.left) s.dryDuring = q.name;
  });
  s.need = need;
  s.after = s.left - need;
  s.short = Math.max(0, need - s.left);
  s.state = s.short > 0 ? 'short' : need > 0 && s.after < 50 ? 'low' : 'ok';
  s.pctLeft = Math.min(1, s.left / 1000);
});

// Runs out first: biggest shortfall first, then the colours that finish the queue under 50 g.
export const runsOut = spools
  .filter((s) => s.state !== 'ok')
  .sort((a, b) => (b.short - a.short) || (a.after - b.after));
export const shortSpools = runsOut.filter((s) => s.state === 'short');
export const lowSpools = runsOut.filter((s) => s.state === 'low');

// Restock: the cheapest in-stock listing per colour.
export const restock = runsOut.map((s) => {
  const list = offers.filter((o) => o.spool === s.id).sort((a, b) => a.price - b.price);
  const best = list.find((o) => o.stock === 'in');
  list.forEach((o) => { o.best = o === best; });
  return { spool: s, offers: list, best };
});
const shortRestock = restock.filter((r) => r.spool.state === 'short');

const printing = printers.filter((p) => p.status === 'printing');
const nextUp = printing.slice().sort((a, b) => a.left - b.left)[0];
export const nextFinish = nextUp;

export const counts = {
  printers: printers.length,
  printing: printing.length,
  spools: spools.length,
  gramsOnHand: spools.reduce((t, s) => t + s.left, 0),
  models: queue.length,
  queueGrams: queue.reduce((t, q) => t + Object.values(q.use).reduce((a, b) => a + b, 0), 0),
  mwModels: queue.filter((q) => q.src === 'makerworld').length,
  prModels: queue.filter((q) => q.src === 'printables').length,
  short: shortSpools.length,
  shortGrams: shortSpools.reduce((t, s) => t + s.short, 0),
  low: lowSpools.length,
  listings: accounts.filter((a) => a.kind === 'store').reduce((t, a) => t + a.pulled, 0),
  records: accounts.reduce((t, a) => t + a.pulled, 0),
  restockTotal: Math.round(shortRestock.reduce((t, r) => t + r.best.price, 0) * 100) / 100,
  nextMin: nextUp.left,
  nextEta: nextUp.eta,
  nextName: nextUp.short,
};

// The hub's preview rows: each colour to restock, on its printer, at the cheapest store.
export const items = restock.map((r) => {
  const s = r.spool;
  const p = printerOf(s.printer);
  return {
    img: p.img,
    title: `${s.mat} ${s.color}`,
    meta: `${p.short}${s.slot === 'Spool' ? '' : ' ' + s.slot}, ` + (s.state === 'short' ? `${grams(s.short)} short` : `${grams(s.after)} spare`),
    price: money(r.best.price),
    source: r.best.store,
  };
});

// Every line of page copy that is not a record. Read-only in every word: found, read, checked, never bought.
export const copy = {
  brand: 'Print Farm',
  kicker: `${meta.farm}, ${counts.printers} printers, read at ${hm(meta.syncStart)}`,
  heroH1: `${counts.printing} printing, ${counts.short} colors short, ${money(counts.restockTotal)} to restock`,
  heroDek: `Superbot read Bambu Handy, Prusa Connect and OctoPrint, weighed every spool against your MakerWorld and Printables queues, and checked four stores for the colors that run out. Nothing was started, paused or bought.`,
  syncNow: `Reading ${accounts.length} sources`,
  syncDone: 'All sources read',
  syncClose: 'Queue matched',
  farmK: 'Tonight',
  farmNote: `Read from ${accOf(nextUp.acct).name}. Nothing started, paused or cancelled.`,
  statsH: 'Where the farm stands',
  statsDek: 'Four answers, read from the printers, the queues and the stores',
  farmH: 'Every printer, every spool',
  farmDek: `As the apps report them at ${hm(meta.syncStart)}, each spool weighed against its queued models`,
  panelsH: 'What runs out, and where to restock',
  panelsDek: `${counts.models} queued models, ${counts.mwModels} from MakerWorld and ${counts.prModels} from Printables, matched gram by gram`,
  outFoot: `${grams(counts.shortGrams)} short across ${counts.short} colors before the queue can finish`,
  restockNote: 'Prices read live from each store for one 1 kg spool. Nothing added to a cart, nothing ordered.',
  totalLabel: `Cheapest total for the ${counts.short} short colors`,
  foot: `Read-only. Superbot read 3 printer apps, 2 queues and 4 stores. Nothing was started, paused, cancelled or bought.`,
};

export default { meta, accounts, printers, spools, queue, offers, runsOut, shortSpools, lowSpools, restock, counts, items, nextFinish, copy };
