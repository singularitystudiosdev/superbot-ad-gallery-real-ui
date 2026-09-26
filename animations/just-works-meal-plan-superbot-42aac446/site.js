/* site.js - the generated frontend: superbot.app/p/meal-plan, "Meal Plan".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the match bar, the busy nights tile's icon chip, the pin by the
   first busy night's dinner and the week total line, and .is-active on the Grocery list tab; all are styled
   in site.css. The tab click swaps the Sales and swaps panel for the Grocery list panel through a :has() +
   sibling rule, so no JS runs on the click. The only clock-driven output is render(root, p): the top bar
   clock, the sync card ticking through the seven sources, the match beat (every recipe's ingredients
   against the pantry, the stores' stock and the flyers, MATCH_A/MATCH_B), the four week counters easing in
   (GROW_A/GROW_B), the seven dinner cards settling with their cost bars filling (ROW_A/ROW_B), the sale
   savings bars (OUT_A/OUT_B), the grocery list lines and the week total counting in (TL_A/TL_B), and the
   sync bar. Every one of them is a pure function of the beat's progress.
   Read-only: every word the page prints says what Superbot read or found, never that it ordered, carted,
   edited or booked anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';
const money = (n) => '$' + Number(n).toFixed(2);

/** seconds since midnight -> "4:18:07 PM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the read beat inside the browser scene: the seven sources are read from SYNC_A to SYNC_B of p (while the
   page grows out of the hub card) and the recipes are matched against the pantry and the stores from
   MATCH_A to MATCH_B, both inside the first scroll hold in ad.js (f 0.13 to 0.3), so the finished card (33 to
   buy, 8 in the pantry, 3 swapped, 8 on sale) holds on screen before the page moves on and stays final for
   the rest of the spot */
const SYNC_A = 0;
const SYNC_B = 0.17;
const MATCH_A = 0.165;
const MATCH_B = 0.285;
/* the week strip is the second hold (ad.js f 0.355 to 0.52): its counters ease in as it scrolls up and hold
   settled with the cursor on the busy nights tile before the scroll leaves */
const GROW_A = 0.36;
const GROW_B = 0.44;
/* the week is the third hold (ad.js f 0.575 to 0.665): the seven dinner cards settle in turn while it
   scrolls in, their cost bars filling, all still by the time it lands */
const ROW_A = 0.53;
const ROW_B = 0.62;
/* the sales and swaps panel is the first half of the fourth hold (ad.js f 0.7 to 0.79): each sale's bar
   grows to what it saves, finishing just before the tab click */
const OUT_A = 0.7;
const OUT_B = 0.79;
/* the grocery list is the second half (after the click, ad.js f 0.86): the lines land and the week total
   counts in under the cursor, which rests on it to the end */
const TL_A = 0.8;
const TL_B = 0.92;

export const syncDone = (p) => clamp01((p - SYNC_A) / (SYNC_B - SYNC_A));
export const matchDone = (p) => clamp01((p - MATCH_A) / (MATCH_B - MATCH_A));
export const growDone = (p) => clamp01((p - GROW_A) / (GROW_B - GROW_A));
export const rowDone = (p) => clamp01((p - ROW_A) / (ROW_B - ROW_A));
export const saleDone = (p) => clamp01((p - OUT_A) / (OUT_B - OUT_A));
export const listDone = (p) => clamp01((p - TL_A) / (TL_B - TL_A));

/* the sync card: tick i counts from 0 to its number over its own window, so the seven sources land one after
   another and the eighth tick (the ingredients matched) closes the card at g = 1. Each tick counts over
   TICK_LEN of g and the next starts TICK_STEP later, spaced so the last tick lands exactly at g = 1 */
const TICK_LEN = 0.2;
const tickStep = (n) => (n > 1 ? (1 - TICK_LEN) / (n - 1) : 0);
const tickDone = (g, i, n) => ease(clamp01((g - i * tickStep(n)) / TICK_LEN));

/* lucide icons (ISC), inlined as path data */
const ICONS = {
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m16 9l-5.5 5.5L8 12"/>',
  timer: '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.2 8.2a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  'calendar-days': '<path d="M8 2v4m8-4v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  'calendar-clock': '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4m-5 4h5m9.5 7.5L16 16.3V14"/><circle cx="16" cy="16" r="6"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20m14-7V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2zm0 0v7"/>',
  'shopping-basket': '<path d="m15 11l-1 9m5-9l-4-7M2 11h20M3.5 11l1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4M4.5 15.5h15M5 11l4-7m0 7l1 9"/>',
  'arrow-right-left': '<path d="m16 3l4 4l-4 4m4-4H4m4 14l-4-4l4-4m-4 4h16"/>',
  'package-x': '<path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27l9 5.15M3.29 7L12 12l8.71-5M12 22V12m5 3l5 5m0-5l-5 5"/>',
  receipt: '<path d="M4 2v20l2-1l2 1l2-1l2 1l2-1l2 1l2-1l2 1V2l-2 1l-2-1l-2 1l-2-1l-2 1l-2-1l-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8m4 1.5v-11"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  'chef-hat': '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589a5 5 0 0 0-9.186 0a4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
  'book-open': '<path d="M12 7v14m-9-3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4a4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3a3 3 0 0 0-3-3z"/>',
  scale: '<path d="m16 16l3-8l3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1m-14 0l3-8l3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1m5 5h10M12 3v18M3 7h2c2 0 5-1 7-2c2 1 5 2 7 2h2"/>',
};

const ico = (name) =>
  `<svg class="mp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const accOf = (data, id) => data.accounts.find((a) => a.id === id) || data.accounts[0];

/* a source tag: the site's mark plus its short name */
const srcTag = (data, id) => {
  const a = accOf(data, id);
  return `<span class="mp-tag"><img src="${esc(a.logo)}" alt="">${esc(a.short)}</span>`;
};
const storeMark = (data, id) => `<img class="mp-smark" src="${esc(accOf(data, id).logo)}" alt="">`;

/* "1.5 lb", "4", "2 cans": what the week needs of a line, in the recipes' unit */
const PLURAL = { bunch: 'bunches', head: 'heads', can: 'cans', carton: 'cartons', tub: 'tubs', bag: 'bags', pack: 'packs' };
function qty(l) {
  const n = +l.need.toFixed(2);
  if (l.unit === 'ct') return n0(n);
  return `${n} ${n > 1 && PLURAL[l.unit] ? PLURAL[l.unit] : l.unit}`;
}
/* "2 x 1 lb", "3 lb bag": what is bought */
const buyText = (l) => (l.packs > 1 ? `${l.packs} x ${l.label}` : l.label);
/* a list line's note: what the week needs, and what is bought when that is more ("1.5 bunches, buy 2") */
const LOOSE = ['each', 'bunch', 'head'];
function lineNote(l) {
  const bought = l.packs * (l.pack || 0);
  const exact = Math.abs(bought - l.need) < 1e-9;
  if (exact) return /^\d/.test(l.label) || LOOSE.includes(l.label) ? qty(l) : `${qty(l)}, ${l.label}`;
  return `${qty(l)}, buy ${LOOSE.includes(l.label) ? n0(l.packs) : buyText(l)}`;
}

function topBar(data) {
  const { meta, accounts, copy, sales, swaps, lines } = data;
  return (
    '<header class="mp-top">' +
      '<div class="mp-topin">' +
        `<span class="mp-brand"><img class="mp-brandico" src="./brand/app.svg" alt=""><b>${esc(copy.brand)}</b><span class="mp-by">by Superbot</span></span>` +
        '<nav class="mp-tabs">' +
          `<span class="mp-tab mp-tab--1">${ico('tag')}Sales and swaps <i>${n0(sales.length + swaps.length)}</i></span>` +
          `<span class="mp-tab mp-tab--2">${ico('shopping-basket')}Grocery list <i>${n0(lines.length)}</i></span>` +
        '</nav>' +
        '<div class="mp-status">' +
          `<span class="mp-logs">${ico('lock')}${accounts.length} sources, read-only</span>` +
          `<span class="mp-live"><span class="mp-dot"></span><span class="mp-clock">${esc(clockText(meta.syncStart))}</span></span>` +
        '</div>' +
      '</div>' +
      '<div class="mp-syncbar"><span class="mp-syncfill"></span></div>' +
    '</header>'
  );
}

function syncCard(data) {
  const { accounts, counts, copy } = data;
  const ticks = accounts.map((a, i) =>
    `<li class="mp-tick mp-tick--s${i + 1}"><img src="${esc(a.logo)}" alt="" title="${esc(a.name)}"><span title="${esc(a.name)}">${esc(a.short)}</span>` +
      `<b data-n="${a.pulled}" data-i="${i}">0</b><span class="mp-tickok">${ico('check')}</span></li>`,
  );
  const last = accounts.length;
  ticks.push(
    `<li class="mp-tick mp-tick--s${last + 1} mp-tick--final"><span class="mp-tickico">${ico('scale')}</span><span>${esc(copy.syncClose)}</span>` +
      `<b data-n="${counts.ingredients}" data-i="${last}">0</b><span class="mp-tickok">${ico('check')}</span></li>`,
  );
  return (
    '<div class="mp-sync">' +
      '<div class="mp-synchead">' +
        `<span class="mp-syncnow">${ico('refresh-cw')}${esc(copy.syncNow)}<span class="mp-synccount">0 of ${n0(counts.records)} records</span></span>` +
        `<span class="mp-stamp">${ico('circle-check')}${esc(copy.syncDone)}</span>` +
      '</div>' +
      `<ul class="mp-ticks">${ticks.join('')}</ul>` +
      '<div class="mp-merge">' +
        '<div class="mp-mrow">' +
          `<span class="mp-mk"><b>${n0(counts.ingredients)}</b>ingredients, ${n0(counts.dinners)} recipes</span>` +
          `<span class="mp-mk mp-mk--have"><b class="mp-havenow">0</b>to buy, in stock</span>` +
          `<span class="mp-mk mp-mk--pantry"><b class="mp-pantrynow">0</b>already in the pantry</span>` +
          `<span class="mp-mk mp-mk--short"><b class="mp-shortnow">0</b>out of stock, swapped</span>` +
        '</div>' +
        // the bar sits under its figures, so the cursor resting on it (ad.js hover) points into empty card
        // padding and never covers a number
        '<div class="mp-mbar"><span class="mp-mpantry"></span><span class="mp-mhave"></span><span class="mp-mshort"></span></div>' +
      '</div>' +
    '</div>'
  );
}

/* the side card: next week at a glance and the first busy night, laid on an evening timeline */
function weekCard(data) {
  const { meta, counts, copy, busyNights } = data;
  const b = busyNights[0];
  // the evening from 4 PM to 9 PM: the calendar event, then the dinner cooked after it
  const T0 = 16;
  const T1 = 21;
  const at = (h) => pct(((h - T0) / (T1 - T0)) * 100);
  const cookFrom = b.busy.to + 0.25;
  const cookTo = cookFrom + b.mins / 60;
  const hText = (h) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh % 12 || 12}:${pad(mm)} ${hh < 12 ? 'AM' : 'PM'}`;
  };
  return (
    '<aside class="mp-weekcard">' +
      `<span class="mp-wck">${ico('calendar-days')}${esc(copy.weekK)}</span>` +
      `<h2>${esc(meta.user)}'s week</h2>` +
      `<p class="mp-wcday">${ico('utensils')}${esc(meta.week)}, ${esc(meta.household)}</p>` +
      '<ul class="mp-wcfacts">' +
        `<li><small>Dinners</small><b>${n0(counts.dinners)}</b></li>` +
        `<li><small>Busy nights</small><b>${n0(counts.busy)}</b></li>` +
        `<li><small>Stores</small><b>${n0(counts.stores)}</b></li>` +
        `<li><small>Per dinner</small><b>${money(counts.perDinner)}</b></li>` +
      '</ul>' +
      '<div class="mp-next">' +
        `<div class="mp-nexth">${ico('calendar-clock')}First busy night</div>` +
        `<div class="mp-nextrow"><span><b>${esc(b.dow)} ${esc(b.date)}, ${esc(b.busy.title.toLowerCase())}</b><small>${esc(b.busy.when)}</small></span><b class="mp-nexteta">${b.mins} min</b></div>` +
        '<div class="mp-eve">' +
          `<i class="mp-eve-ev" style="left:${at(b.busy.from)};width:${at(T0 + b.busy.to - b.busy.from)}"></i>` +
          `<i class="mp-eve-cook" style="left:${at(cookFrom)};width:${at(T0 + cookTo - cookFrom)}"></i>` +
        '</div>' +
        '<div class="mp-evescale"><span>4 PM</span><span>6 PM</span><span>8 PM</span><span>9 PM</span></div>' +
        `<p class="mp-nextn">${esc(b.short)} from ${esc(accOf(data, b.src).short)}, ${b.mins} min, on the table by ${hText(cookTo)}</p>` +
        `<p class="mp-nextn mp-nextn--ro">${ico('lock')}${esc(copy.weekNote)}</p>` +
      '</div>' +
    '</aside>'
  );
}

function hero(data) {
  const { copy, counts } = data;
  return (
    '<section class="mp-hero">' +
      '<img class="mp-herobg" src="./img/hero.jpg" alt="">' +
      '<div class="mp-heroin">' +
        '<div class="mp-herot">' +
          `<span class="mp-kicker">${ico('chef-hat')}${esc(copy.kicker)}</span>` +
          `<h1>${esc(copy.heroH1)}</h1>` +
          `<p class="mp-dek">${esc(copy.heroDek)}</p>` +
          syncCard(data) +
          '<ul class="mp-heronums">' +
            `<li><b>${n0(counts.records)}</b><span>records read</span></li>` +
            `<li><b>${n0(counts.recipes)}</b><span>saved recipes</span></li>` +
            `<li class="mp-hn--ok"><b>${n0(counts.prices)}</b><span>store prices checked</span></li>` +
            `<li class="mp-hn--total"><b>${money(counts.total)}</b><span>for ${n0(counts.dinners)} dinners</span></li>` +
          '</ul>' +
        '</div>' +
        weekCard(data) +
      '</div>' +
    '</section>'
  );
}

/* the seven sources: what each gave the read */
function srcStrip(data) {
  const { accounts } = data;
  const what = (a) => (a.kind === 'recipes' ? 'recipes' : a.kind === 'store' ? 'prices' : 'events');
  const kind = (a) => (a.kind === 'recipes' ? 'Recipe app' : a.kind === 'store' ? 'Store' : 'Calendar');
  return (
    '<section class="mp-accs"><ul class="mp-acclist">' +
      accounts.map((a) =>
        `<li class="mp-acc mp-acc--${esc(a.kind)}">` +
          `<img src="${esc(a.logo)}" alt="">` +
          `<span class="mp-acc-t"><b title="${esc(a.name)}">${esc(a.short)}</b><small>${kind(a)}</small></span>` +
          `<span class="mp-acc-v"><b>${n0(a.pulled)}</b><small>${what(a)}</small></span>` +
        '</li>',
      ).join('') +
    '</ul></section>'
  );
}

/* the four answers, each with its own examples */
function statTiles(data) {
  const { counts, meta, week, busyNights, sales, byStore, copy } = data;
  const tiles = [
    {
      kind: 'dinners', icon: 'utensils', label: 'Dinners planned', rule: 'One saved recipe a night',
      n: counts.dinners, unit: '',
      ex: week.slice(0, 3).map((d) => ({ name: `${d.dow}, ${d.short}`, v: `${d.mins} min` })),
      more: `Then ${week.slice(3).map((d) => d.short.toLowerCase()).join(', ')}`,
    },
    {
      kind: 'busy', icon: 'calendar-clock', label: 'Busy nights', rule: `Dinner in ${meta.quickMax} min or less`,
      n: counts.busy, unit: '',
      ex: busyNights.map((d) => ({ name: `${d.dow}, ${d.busy.title.toLowerCase()} ${d.busy.when}`, v: `${d.mins} min` })),
      more: `${counts.events} events read, the other ${counts.clear} nights are clear`,
    },
    {
      kind: 'sale', icon: 'tag', label: 'Saved on sale', rule: `${counts.onSale} flyer prices on the list`,
      n: counts.saved, unit: 'money',
      ex: sales.slice(0, 3).map((l) => ({ name: `${accOf(data, l.store).short}, ${l.name}`, v: `save ${money(l.save)}` })),
      more: sales.slice(3, 5).map((l) => `${l.name} ${money(l.save)}`).join(', ') + (sales.length > 5 ? `, ${sales.length - 5} more` : ''),
    },
    {
      kind: 'total', icon: 'receipt', label: 'Week total', rule: `${counts.lines} items at ${counts.stores} stores`,
      n: counts.total, unit: 'money',
      ex: byStore.map((s) => ({ name: `${accOf(data, s.id).short}, ${s.lines.length} items`, v: money(s.subtotal) })),
      more: `${money(counts.perDinner)} a dinner, ${money(counts.perServing)} a serving`,
    },
  ];
  const fmt = (t) => (t.unit === 'money' ? money(t.n) : t.unit ? `${n0(t.n)} ${t.unit}` : n0(t.n));
  return (
    '<section class="mp-stats">' +
      `<div class="mp-sech"><h2>${esc(copy.statsH)}</h2><span>${esc(copy.statsDek)}</span></div>` +
      '<ul class="mp-statlist">' +
        tiles.map((t) =>
          `<li class="mp-stat mp-stat--${t.kind}">` +
            '<div class="mp-stath">' +
              `<span class="mp-stati">${ico(t.icon)}</span>` +
              `<span class="mp-statt"><b>${esc(t.label)}</b><small>${esc(t.rule)}</small></span>` +
              `<b class="mp-statn" data-g="${t.n}" data-unit="${t.unit}">${fmt(t)}</b>` +
            '</div>' +
            '<ul class="mp-statex">' +
              t.ex.map((e, j) => `<li data-j="${j}"><span>${esc(e.name)}</span><b>${esc(e.v)}</b></li>`).join('') +
            '</ul>' +
            `<span class="mp-statmore">${esc(t.more)}</span>` +
          '</li>',
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

/* the week: one card per night, the recipe's photo, where it was saved, how long it takes and what it costs.
   A busy night carries the calendar event that made it one; the first busy night also carries an empty
   .mp-pin after its badge: the anchor the kit's cursor rests on in beat 3, a 1 px box clear of every figure.
   The cost bar is on the week's dearest dinner. */
function weekSection(data) {
  const { week, busyNights, copy } = data;
  const top = Math.max(...week.map((d) => d.cost));
  const first = busyNights[0] && busyNights[0].id;
  const card = (d, i) =>
    `<article class="mp-day mp-day--${esc(d.id)}${d.busy ? ' mp-day--busy' : ''}" data-r="${i}">` +
      `<span class="mp-dphoto"><img src="${esc(d.img)}" alt=""><span class="mp-dd"><b>${esc(d.dow)}</b>${esc(d.date)}</span></span>` +
      '<div class="mp-dbody">' +
        (d.busy
          ? `<div class="mp-busy"><span class="mp-busyb">${ico('zap')}Busy night</span>${d.id === first ? '<span class="mp-pin"></span>' : ''}</div>` +
            `<p class="mp-busyev">${ico('calendar-clock')}${esc(d.busy.title)}, ${esc(d.busy.when)}</p>`
          : `<div class="mp-busy"><span class="mp-freeb">${ico('calendar-days')}Evening clear</span></div><p class="mp-busyev mp-busyev--free">${ico('chef-hat')}Time to cook</p>`) +
        `<h3>${esc(d.recipe)}</h3>` +
        `<div class="mp-dsrc">${srcTag(data, d.src)}</div>` +
        '<div class="mp-dmeta">' +
          `<span class="mp-mins${d.quick ? ' mp-mins--quick' : ''}">${ico('timer')}${d.mins} min</span>` +
          `<span>${money(d.perServing)} a serving</span>` +
        '</div>' +
        `<div class="mp-dcost"><i class="mp-dbar"><i data-w="${pct((d.cost / top) * 100)}"></i></i><b>${money(d.cost)}</b></div>` +
        '<div class="mp-dflags">' +
          (d.onSale.length ? `<span class="mp-flag mp-flag--sale">${ico('tag')}${d.onSale.length} on sale</span>` : '') +
          (d.swapped.length ? `<span class="mp-flag mp-flag--swap">${ico('arrow-right-left')}${esc(d.swapped[0])}</span>` : '') +
          (!d.onSale.length && !d.swapped.length ? `<span class="mp-flag">${ico('book-open')}${d.items} to buy, ${d.fromPantry} in pantry</span>` : '') +
        '</div>' +
      '</div>' +
    '</article>';
  return (
    '<section class="mp-week">' +
      `<div class="mp-sech"><h2>${esc(copy.weekH)}</h2><span>${esc(copy.weekDek)}</span></div>` +
      `<div class="mp-grid">${week.map(card).join('')}</div>` +
    '</section>'
  );
}

/* tab 1, Sales and swaps: every flyer price the list picked up, biggest saving first, each bar on the biggest
   saving; beside it every ingredient a store showed sold out, and where Superbot found it instead */
function salesPanel(data) {
  const { sales, swaps, copy, counts } = data;
  const topSave = Math.max(...sales.map((l) => l.save));
  const where = (ids) => ids.map((id) => accOf(data, id).short).join(' and ');
  return (
    '<div class="mp-panel mp-panel--1">' +
      '<div class="mp-salecol">' +
        `<div class="mp-colh">${ico('tag')}<b>${esc(copy.salesH)}</b><small>${n0(sales.length)} on the list</small></div>` +
        '<ol class="mp-salelist">' +
          sales.map((l, j) =>
            `<li class="mp-sale" data-j="${j}">` +
              storeMark(data, l.store) +
              `<span class="mp-salet"><b>${esc(l.name)}</b><small>${esc(buyText(l))}, was ${money(l.was)}</small></span>` +
              `<i class="mp-sbar"><i data-w="${pct((l.save / topSave) * 100)}"></i></i>` +
              `<b class="mp-salep">${money(l.price)}</b>` +
              `<em class="mp-saves">save ${money(l.save)}</em>` +
            '</li>',
          ).join('') +
        '</ol>' +
      '</div>' +
      '<div class="mp-swapcol">' +
        `<div class="mp-colh">${ico('package-x')}<b>${esc(copy.swapsH)}</b><small>${n0(swaps.length)} found elsewhere</small></div>` +
        '<ul class="mp-swaplist">' +
          swaps.map((l) =>
            `<li class="mp-swap mp-swap--${l.swap.kind}">` +
              `<div class="mp-swapout">${ico('package-x')}<span><b>${esc(l.asked)}</b><small>sold out at ${esc(where(l.swap.outAt))}</small></span></div>` +
              `<div class="mp-swapin">${ico('arrow-right-left')}${storeMark(data, l.store)}<span><b>${l.swap.kind === 'sub' ? esc(l.name) : esc(accOf(data, l.store).short)}</b><small>${l.swap.kind === 'sub' ? `${esc(accOf(data, l.store).short)}, ` : ''}${esc(buyText(l))}, ${money(l.cost)}</small></span>` +
                `<em class="mp-delta${l.swap.delta < 0 ? ' mp-delta--down' : ''}">${l.swap.delta < 0 ? 'saves ' + money(-l.swap.delta) : 'adds ' + money(l.swap.delta)}</em></div>` +
            '</li>',
          ).join('') +
        '</ul>' +
      '</div>' +
      `<div class="mp-salefoot">${ico('tag')}<span>${esc(copy.salesFoot)}; the swaps ${counts.swapDelta < 0 ? 'save' : 'add'} ${money(Math.abs(counts.swapDelta))}</span><b>${money(counts.saved)}</b></div>` +
    '</div>'
  );
}

/* tab 2, Grocery list: what the click on the tab swaps in. Every recipe merged into one list, split by the
   cheapest in-stock store and by aisle, each store's subtotal on its head, and the week total under the
   cursor at the end. */
function listPanel(data) {
  const { byStore, copy, counts } = data;
  let k = 0;
  const col = (s) => {
    const a = accOf(data, s.id);
    const aisles = [...new Set(s.lines.map((l) => l.aisle))];
    return (
      `<div class="mp-store mp-store--${esc(s.id)}">` +
        `<div class="mp-storeh"><img src="${esc(a.logo)}" alt=""><span><b>${esc(a.short)}</b><small>${n0(s.lines.length)} items</small></span><b class="mp-sub">${money(s.subtotal)}</b></div>` +
        '<div class="mp-aisles">' +
          aisles.map((ai) =>
            '<div class="mp-aisle">' +
              `<span class="mp-aisleh">${esc(ai)}</span>` +
              '<ul>' +
                s.lines.filter((l) => l.aisle === ai).map((l) =>
                  `<li class="mp-line${l.save ? ' mp-line--sale' : ''}${l.swap ? ' mp-line--swap' : ''}" data-l="${k++}">` +
                    `<span class="mp-lt"><b>${esc(l.name)}</b><small>${esc(lineNote(l))}</small></span>` +
                    (l.save ? `<span class="mp-lf mp-lf--sale">${ico('tag')}</span>` : l.swap ? `<span class="mp-lf mp-lf--swap">${ico('arrow-right-left')}</span>` : '') +
                    `<b class="mp-lp">${money(l.cost)}</b>` +
                  '</li>',
                ).join('') +
              '</ul>' +
            '</div>',
          ).join('') +
        '</div>' +
      '</div>'
    );
  };
  return (
    '<div class="mp-panel mp-panel--2">' +
      `<div class="mp-list">${byStore.map(col).join('')}</div>` +
      '<div class="mp-sum">' +
        `<div class="mp-total"><span>${ico('shopping-basket')}${esc(copy.totalLabel)}</span><b data-t="${counts.total}">$0.00</b></div>` +
        `<p class="mp-sumn">${ico('lock')}${esc(copy.listNote)}</p>` +
      '</div>' +
    '</div>'
  );
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/meal-plan';
  return (
    '<footer class="mp-foot">' +
      `<span>${ico('lock')}${esc(data.copy.foot)}</span>` +
      `<span>${esc(url)}</span>` +
    '</footer>'
  );
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(data) +
    hero(data) +
    srcStrip(data) +
    statTiles(data) +
    weekSection(data) +
    '<section class="mp-panels">' +
      `<div class="mp-sech"><h2>${esc(data.copy.panelsH)}</h2><span>${esc(data.copy.panelsDek)}</span></div>` +
      salesPanel(data) +
      listPanel(data) +
    '</section>' +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

export function render(root, p) {
  if (!root || !root.querySelector) return;
  const g = syncDone(p);
  const mg = matchDone(p);
  const gw = growDone(p);
  const rw = rowDone(p);
  const sg = saleDone(p);
  const tl = listDone(p);
  const data = fallback;
  const { counts, meta, accounts } = data;
  const nTicks = accounts.length + 1;

  const clock = root.querySelector('.mp-clock');
  if (clock) clock.textContent = clockText(meta.syncStart + meta.syncSecs * (0.6 * g + 0.4 * mg));

  const heroEl = root.querySelector('.mp-hero');
  let read = 0;
  for (const b of root.querySelectorAll('[data-n]')) {
    const i = Number(b.dataset.i) || 0;
    const v = Math.round(Number(b.dataset.n) * tickDone(g, i, nTicks));
    b.textContent = n0(v);
    if (i < accounts.length) read += v;
  }
  if (heroEl) {
    for (let i = 0; i < nTicks; i++) heroEl.classList.toggle(`is-s${i + 1}`, tickDone(g, i, nTicks) >= 0.999);
    heroEl.classList.toggle('is-m1', mg > 0.06);
    heroEl.classList.toggle('is-m2', mg >= 0.999);
  }
  const count = root.querySelector('.mp-synccount');
  if (count) count.textContent = `${n0(read)} of ${n0(counts.records)} records`;

  // the match: every ingredient the seven recipes name, split into what is already in the pantry, what a
  // store has in stock, and what was sold out and swapped
  const k = ease(mg);
  const inStock = counts.lines - counts.swaps;
  const set = (sel, v) => {
    const el = root.querySelector(sel);
    if (el) el.textContent = n0(Math.round(v * k));
  };
  set('.mp-havenow', inStock);
  set('.mp-pantrynow', counts.pantry);
  set('.mp-shortnow', counts.swaps);
  const bar = root.querySelector('.mp-mbar');
  if (bar) {
    const w = (sel, n) => {
      const el = bar.querySelector(sel);
      if (el) el.style.width = pct((n / counts.ingredients) * 100 * k);
    };
    w('.mp-mpantry', counts.pantry);
    w('.mp-mhave', inStock);
    w('.mp-mshort', counts.swaps);
    bar.classList.toggle('is-matched', mg >= 0.999);
  }

  // the week at a glance: the four counters ease in, then the example rows land one after another
  for (const b of root.querySelectorAll('[data-g]')) {
    const target = Number(b.dataset.g);
    const unit = b.dataset.unit;
    const e = ease(gw);
    b.textContent = unit === 'money' ? money(Math.round(target * e * 100) / 100)
      : unit ? `${n0(Math.round(target * e))} ${unit}` : n0(Math.round(target * e));
  }
  for (const li of root.querySelectorAll('.mp-statex li')) {
    const j = Number(li.dataset.j) || 0;
    li.style.opacity = (0.15 + 0.85 * ease(clamp01((gw - j * 0.2) / 0.6))).toFixed(3);
  }

  // the week: the seven dinners settle Monday to Sunday, each cost bar filling as its card lands
  for (const c of root.querySelectorAll('.mp-day')) {
    const i = Number(c.dataset.r) || 0;
    const kk = ease(clamp01((rw - i * 0.06) / 0.6));
    c.style.opacity = (0.2 + 0.8 * kk).toFixed(3);
    c.style.transform = `translateY(${((1 - kk) * 10).toFixed(2)}px)`;
    for (const b of c.querySelectorAll('[data-w]')) b.style.width = pct(parseFloat(b.dataset.w) * kk);
  }

  // sales and swaps: each saving's bar grows along the biggest saving, row by row
  for (const r of root.querySelectorAll('.mp-sale')) {
    const j = Number(r.dataset.j) || 0;
    const kk = ease(clamp01((sg - j * 0.06) / 0.55));
    r.style.opacity = (0.25 + 0.75 * kk).toFixed(3);
    for (const b of r.querySelectorAll('[data-w]')) b.style.width = pct(parseFloat(b.dataset.w) * kk);
  }
  for (const [j, r] of [...root.querySelectorAll('.mp-swap')].entries()) {
    r.style.opacity = (0.25 + 0.75 * ease(clamp01((sg - 0.2 - j * 0.12) / 0.4))).toFixed(3);
  }

  // the grocery list: the lines land store by store, aisle by aisle, and the week total counts in under the
  // cursor
  const nl = counts.lines;
  for (const li of root.querySelectorAll('.mp-line')) {
    const j = Number(li.dataset.l) || 0;
    li.style.opacity = (0.2 + 0.8 * ease(clamp01((tl - (j / nl) * 0.45) / 0.35))).toFixed(3);
  }
  for (const b of root.querySelectorAll('[data-t]')) b.textContent = money(Math.round(Number(b.dataset.t) * ease(tl) * 100) / 100);
  const total = root.querySelector('.mp-total');
  if (total) total.style.opacity = (0.3 + 0.7 * ease(clamp01((tl - 0.25) / 0.6))).toFixed(3);

  const fill = root.querySelector('.mp-syncfill');
  if (fill) fill.style.width = pct(100 * (0.6 * g + 0.4 * mg));
}
