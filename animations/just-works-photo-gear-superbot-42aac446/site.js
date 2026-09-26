/* site.js - the generated frontend: superbot.app/p/photo-gear, "Gear Watch".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the wishlist match bar, the wishlist-in-stock tile's icon chip,
   the pin by the top focal length and the cheapest used total line, and .is-active on the Just listed tab;
   all are styled in site.css. The tab click swaps the Overview panel for the Just listed panel through a
   :has() + sibling rule, so no JS runs on the click. The only clock-driven output is render(root, p): the
   top bar clock, the sync card ticking through the eight sources, the match beat (the six wishlist items
   against the focal lengths you really shoot, MATCH_A/MATCH_B), the four status counters easing in
   (GROW_A/GROW_B), the five focal length cards settling with their share bars (ROW_A/ROW_B), the overview
   rows (TAB_A/TAB_B), the just listed feed and the cheapest used total counting in (FRESH_A/FRESH_B), and
   the sync bar. Every one of them is a pure function of the beat's progress.
   Read-only: every word the page prints says what Superbot read or found, never that it bought, bid on or
   added anything to a cart, and never that it edited or exported a photo. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';
const money = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** seconds since midnight -> "9:41:14 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the read beat inside the browser scene: the eight sources are read from SYNC_A to SYNC_B of p (while the
   page grows out of the hub card) and the wishlist is matched against the focal length histogram from
   MATCH_A to MATCH_B, both inside the first scroll hold in ad.js (f 0.13 to 0.3), so the finished card
   (5 of 6 in stock, 5 in a length you shoot, 1 wider than anything you own) holds on screen before the page
   moves on and stays final for the rest of the spot */
const SYNC_A = 0;
const SYNC_B = 0.17;
const MATCH_A = 0.165;
const MATCH_B = 0.285;
/* the status strip is the second hold (ad.js f 0.355 to 0.52): its counters ease in as it scrolls up and
   hold settled with the cursor on the wishlist in stock tile's icon chip before the scroll leaves */
const GROW_A = 0.36;
const GROW_B = 0.44;
/* the shoot section is the third hold (ad.js f 0.575 to 0.665): the five focal length cards settle in turn
   while it scrolls in, their share bars filling, all still by the time it lands */
const ROW_A = 0.53;
const ROW_B = 0.62;
/* the overview table is the first half of the fourth hold (ad.js f 0.7 to 0.79): each row lands with its
   store dots, finishing just before the tab click */
const TAB_A = 0.7;
const TAB_B = 0.79;
/* the just listed feed is the second half (after the click, ad.js f 0.86): the rows land and the cheapest
   used total counts in under the cursor, which rests on it to the end */
const FRESH_A = 0.8;
const FRESH_B = 0.92;

export const syncDone = (p) => clamp01((p - SYNC_A) / (SYNC_B - SYNC_A));
export const matchDone = (p) => clamp01((p - MATCH_A) / (MATCH_B - MATCH_A));
export const growDone = (p) => clamp01((p - GROW_A) / (GROW_B - GROW_A));
export const rowDone = (p) => clamp01((p - ROW_A) / (ROW_B - ROW_A));
export const tabDone = (p) => clamp01((p - TAB_A) / (TAB_B - TAB_A));
export const freshDone = (p) => clamp01((p - FRESH_A) / (FRESH_B - FRESH_A));

/* the sync card: tick i counts from 0 to its number over its own window, so the eight sources land one after
   another and the ninth tick (the wishlist matched) closes the card at g = 1. Each tick counts over TICK_LEN
   of g and the next starts TICK_STEP later, spaced so the last tick lands exactly at g = 1 */
const TICK_LEN = 0.2;
const tickStep = (n) => (n > 1 ? (1 - TICK_LEN) / (n - 1) : 0);
const tickDone = (g, i, n) => ease(clamp01((g - i * tickStep(n)) / TICK_LEN));

/* lucide icons (ISC), inlined as path data. The kit's verified set: no new icon art is drawn for this spot. */
const ICONS = {
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m16 9l-5.5 5.5L8 12"/>',
  timer: '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  'triangle-alert': '<path d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4m0 4h.01"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.2 8.2a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65m20-5l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  disc: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/>',
  hourglass: '<path d="M5 22h14M5 2h14m-2 20v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12m-8.7-5l7.7 4.73a2 2 0 0 0 2 0L20.7 7M7.5 4.27l9 5.15"/>',
  scale: '<path d="m16 16l3-8l3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1m-14 0l3-8l3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1m5 5h10M12 3v18M3 7h2c2 0 5-1 7-2c2 1 5 2 7 2h2"/>',
};

const ico = (name) =>
  `<svg class="pg-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const accOf = (data, id) => data.accounts.find((a) => a.id === id) || data.accounts[0];
const wishOf = (data, id) => data.wish.find((w) => w.id === id) || data.wish[0];
const chips = (s) => String(s).replace(/mm$/, '').replace(' fixed', '');

/* a source tag: the site's mark plus its short name */
const srcTag = (data, id) => {
  const a = accOf(data, id);
  return `<span class="pg-tag"><img src="${esc(a.logo)}" alt="">${esc(a.short)}</span>`;
};

/* the item's focal length as a chip: the graphic the bucket cards carry, and the fallback the wishlist rows
   draw where the spot has no product shot for that item. It is a focal length, not a brand mark, so no brand
   art is invented for a camera Fujifilm never shipped us. */
const chip = (w) =>
  `<span class="pg-fchip${chips(w.lens).length > 4 ? ' pg-fchip--sm' : ''}"><b>${esc(chips(w.lens))}</b><small>${esc(w.eq)}</small></span>`;

/* the item tile a wishlist row carries: the product shot when the spot has one for that item, else the focal
   length, in the same 34 px slot, so the table reads as one column either way. A photo that fails to load
   (a missing file) swaps itself for that text tile through its own onerror, so no row is ever left with an
   empty box or a browser's broken-image glyph. The handler is part of the markup string, not a listener the
   module registers: build() stays idempotent and render() still only reads the beat's progress. */
const itile = (w) => {
  const f = esc(chips(w.lens));
  const e = esc(w.eq);
  if (!w.img) return `<span class="pg-itile pg-itile--text" data-focal="${f}" data-eq="${e}"></span>`;
  return (
    `<span class="pg-itile" data-focal="${f}" data-eq="${e}">` +
      `<img src="${esc(w.img)}" alt="" onerror="this.onerror=null;this.closest('.pg-itile').classList.add('pg-itile--text');this.remove()">` +
    '</span>'
  );
};

/* a lens swatch: the lens's own accent colour, drawn in CSS from --c, the ring the print kit drew */
const swatch = (l) => `<span class="pg-sw" style="--c:${esc(l.hex)}"></span>`;

function topBar(data) {
  const { counts, meta, copy } = data;
  return (
    '<header class="pg-top">' +
      '<div class="pg-topin">' +
        `<span class="pg-brand"><img class="pg-brandico" src="./brand/app.svg" alt=""><b>${esc(copy.brand)}</b><span class="pg-by">by Superbot</span></span>` +
        '<nav class="pg-tabs">' +
          `<span class="pg-tab pg-tab--1">${ico('layers')}Overview <i>${n0(counts.wish)}</i></span>` +
          `<span class="pg-tab pg-tab--2">${ico('timer')}Just listed <i>${n0(counts.fresh)}</i></span>` +
        '</nav>' +
        '<div class="pg-status">' +
          `<span class="pg-logs">${ico('lock')}${counts.sources} sources, read-only</span>` +
          `<span class="pg-live"><span class="pg-dot"></span><span class="pg-clock">${esc(clockText(meta.syncStart))}</span></span>` +
        '</div>' +
      '</div>' +
      '<div class="pg-syncbar"><span class="pg-syncfill"></span></div>' +
    '</header>'
  );
}

function syncCard(data) {
  const { accounts, counts, copy } = data;
  const ticks = accounts.map((a, i) =>
    `<li class="pg-tick pg-tick--s${i + 1}"><img src="${esc(a.logo)}" alt="" title="${esc(a.name)}"><span title="${esc(a.name)}">${esc(a.short)}</span>` +
      `<b data-n="${a.pulled}" data-i="${i}">0</b><span class="pg-tickok">${ico('check')}</span></li>`,
  );
  const last = accounts.length;
  ticks.push(
    `<li class="pg-tick pg-tick--s${last + 1} pg-tick--final"><span class="pg-tickico">${ico('package')}</span><span>${esc(copy.syncClose)}</span>` +
      `<b data-n="${counts.inStock}" data-i="${last}">0</b><span class="pg-tickok">${ico('check')}</span></li>`,
  );
  return (
    '<div class="pg-sync">' +
      '<div class="pg-synchead">' +
        `<span class="pg-syncnow">${ico('refresh-cw')}${esc(copy.syncNow)}<span class="pg-synccount">0 of ${n0(counts.records)} records</span></span>` +
        `<span class="pg-stamp">${ico('circle-check')}${esc(copy.syncDone)}</span>` +
      '</div>' +
      `<ul class="pg-ticks">${ticks.join('')}</ul>` +
      '<div class="pg-merge">' +
        '<div class="pg-mrow">' +
          `<span class="pg-mk"><b>${n0(counts.wish)}</b>items on the wishlist</span>` +
          `<span class="pg-mk pg-mk--have"><b class="pg-covernow">0</b>in a length you shoot</span>` +
          `<span class="pg-mk pg-mk--short"><b class="pg-gapnow">0</b>wider than you own</span>` +
          `<span class="pg-mk pg-mk--cols"><b class="pg-innow">0</b>in stock now</span>` +
        '</div>' +
        // the bar sits under its figures, so the cursor resting on it (ad.js hover) points into empty card
        // padding and never covers a number
        '<div class="pg-mbar"><span class="pg-mhave"></span><span class="pg-mshort"></span></div>' +
      '</div>' +
    '</div>'
  );
}

/* the side card: the catalog read, and the focal length you shoot most */
function kitCard(data) {
  const { meta, counts, copy, topBucket: tb } = data;
  const topLens = tb.rows.slice().sort((a, b) => b.frames - a.frames)[0].lens;
  return (
    '<aside class="pg-farmcard">' +
      `<span class="pg-fck">${ico('disc')}${esc(copy.kitK)}</span>` +
      `<h2>${esc(meta.user)}'s ${esc(meta.kit)}</h2>` +
      `<p class="pg-fcday">${ico('layers')}${esc(meta.date)}, ${n0(counts.photos)} frames in the catalog</p>` +
      '<ul class="pg-fcfacts">' +
        `<li><small>Frames read</small><b>${n0(counts.photos)}</b></li>` +
        `<li><small>Lenses in the bag</small><b>${n0(counts.lenses)}</b></li>` +
        `<li><small>Top length</small><b>${esc(tb.label)}</b></li>` +
        `<li><small>Wishlist items</small><b>${n0(counts.wish)}</b></li>` +
      '</ul>' +
      '<div class="pg-next">' +
        `<div class="pg-nexth">${ico('scale')}What you shoot most</div>` +
        `<div class="pg-nextrow"><span><b>${esc(tb.label)} equivalent</b><small>${esc(topLens.name)}</small></span><b class="pg-nexteta">${tb.share}%</b></div>` +
        `<div class="pg-nextbar"><i style="width:${pct(tb.share)}"></i></div>` +
        `<p class="pg-nextn">${n0(tb.frames)} of ${n0(counts.photos)} frames land in the ${esc(tb.label)} bucket</p>` +
        `<p class="pg-nextn pg-nextn--ro">${ico('lock')}${esc(copy.kitNote)}</p>` +
      '</div>' +
    '</aside>'
  );
}

function hero(data) {
  const { copy, counts } = data;
  return (
    '<section class="pg-hero">' +
      '<img class="pg-herobg" src="./img/hero.jpg" alt="">' +
      '<div class="pg-heroin">' +
        '<div class="pg-herot">' +
          `<span class="pg-kicker">${ico('disc')}${esc(copy.kicker)}</span>` +
          `<h1>${esc(copy.heroH1)}</h1>` +
          `<p class="pg-dek">${esc(copy.heroDek)}</p>` +
          syncCard(data) +
          '<ul class="pg-heronums">' +
            `<li><b>${n0(counts.photos)}</b><span>frames read</span></li>` +
            `<li><b>${n0(counts.listings)}</b><span>listings checked</span></li>` +
            `<li class="pg-hn--short"><b>${n0(counts.gone)}</b><span>with no listing live</span></li>` +
            `<li class="pg-hn--ok"><b>${money(counts.usedBest)}</b><span>cheapest used</span></li>` +
          '</ul>' +
        '</div>' +
        kitCard(data) +
      '</div>' +
    '</section>'
  );
}

/* the eight sources: what each gave the read */
function srcStrip(data) {
  const { accounts } = data;
  const what = (a) => (a.kind === 'account' ? 'frames' : a.kind === 'wishlist' ? 'items' : 'listings');
  const kind = (a) => (a.kind === 'account' ? 'Catalog' : a.kind === 'wishlist' ? 'Wishlist' : 'Store');
  return (
    '<section class="pg-accs"><ul class="pg-acclist">' +
      accounts.map((a) =>
        `<li class="pg-acc pg-acc--${esc(a.kind)}">` +
          `<img src="${esc(a.logo)}" alt="">` +
          `<span class="pg-acc-t"><b title="${esc(a.name)}">${esc(a.short)}</b><small>${kind(a)}</small></span>` +
          `<span class="pg-acc-v"><b>${n0(a.pulled)}</b><small>${what(a)}</small></span>` +
        '</li>',
      ).join('') +
    '</ul></section>'
  );
}

/* the four answers, each with its own examples */
function statTiles(data) {
  const { counts, buckets, wish, inStock, gone, fresh, copy } = data;
  const byShare = buckets.slice().sort((a, b) => b.frames - a.frames);
  const saving = wish.filter((w) => w.savings).sort((a, b) => b.savings - a.savings);
  const tiles = [
    {
      kind: 'top', icon: 'scale', label: 'Top focal length', rule: 'Share of frames',
      n: counts.topShare, unit: '%',
      ex: byShare.slice(0, 3).map((b) => ({ name: `${b.label} equivalent`, v: `${b.share}%` })),
      more: `${counts.leastFocal} last, ${counts.leastShare}% of frames`,
    },
    {
      kind: 'stock', icon: 'package', label: 'Wishlist in stock', rule: 'Across 5 stores',
      n: counts.inStock, unit: ` of ${counts.wish}`,
      ex: inStock.slice(0, 3).map((w) => ({ name: `${w.short}, ${w.best.cond}`, v: money(w.best.price) })),
      more: gone.length ? `${gone[0].short} has no new or used listing live` : '',
    },
    {
      kind: 'save', icon: 'tag', label: 'Cheaper used', rule: 'Used against new',
      n: counts.savings, unit: 'money',
      ex: saving.slice(0, 3).map((w) => ({ name: `${w.short}, used`, v: `save ${money(w.savings)}` })),
      more: saving[3] ? `${saving[3].short} saves ${money(saving[3].savings)}` : '',
    },
    {
      kind: 'fresh', icon: 'timer', label: 'Just listed', rule: 'In the last hour',
      n: counts.fresh, unit: '',
      ex: fresh.slice(0, 3).map((l) => ({ name: `${l.itemName}, ${accOf(data, l.store).short}`, v: l.ago })),
      more: counts.oldestFresh ? `oldest of them ${counts.oldestFresh.ago}, at ${accOf(data, counts.oldestFresh.store).short}` : '',
    },
  ];
  const fmt = (t) => (t.unit === 'money' ? money(t.n) : t.unit ? `${n0(t.n)}${t.unit}` : n0(t.n));
  return (
    '<section class="pg-stats">' +
      `<div class="pg-sech"><h2>${esc(copy.statsH)}</h2><span>${esc(copy.statsDek)}</span></div>` +
      '<ul class="pg-statlist">' +
        tiles.map((t) =>
          `<li class="pg-stat pg-stat--${t.kind}">` +
            '<div class="pg-stath">' +
              `<span class="pg-stati">${ico(t.icon)}</span>` +
              `<span class="pg-statt"><b>${esc(t.label)}</b><small>${esc(t.rule)}</small></span>` +
              `<b class="pg-statn" data-g="${t.n}" data-unit="${t.unit}">${fmt(t)}</b>` +
            '</div>' +
            '<ul class="pg-statex">' +
              t.ex.map((e, j) => `<li data-j="${j}"><span>${esc(e.name)}</span><b>${esc(e.v)}</b></li>`).join('') +
            '</ul>' +
            `<span class="pg-statmore">${esc(t.more)}</span>` +
          '</li>',
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

/* one lens that shot a bucket: accent swatch, name, its frames in this bucket as a bar, and its share of it */
function lensRow(data, b, r, j) {
  const l = r.lens;
  return (
    `<li class="pg-lens pg-lens--${l.id}" data-j="${j}">` +
      swatch(l) +
      `<span class="pg-sl"></span>` +
      `<span class="pg-ln"><b>${esc(l.short)}</b><small>${esc(l.mm)}, ${esc(l.eq)} equivalent</small></span>` +
      `<span class="pg-lg"><i class="pg-lgbar"><i style="--c:${esc(l.hex)}" data-w="${r.share}"></i></i><b>${n0(r.frames)}</b></span>` +
      `<em class="pg-lv">${r.share}%</em>` +
    '</li>'
  );
}

/* the shoot section: every 35mm-equivalent bucket, on the cards the print kit used for its printers, biggest
   share first so the length you actually shoot leads. The two biggest cards take three of the six grid
   columns and the other three take two each, so five cards fill exactly two rows with no empty cell. The top
   length carries the badge the kit's pointer rests on: an empty .pg-pin after it, a 1 px box clear of the
   share figure below. */
function shootSection(data) {
  const { buckets, copy, counts, topBucket: tb } = data;
  const order = buckets.slice().sort((a, b) => b.frames - a.frames);
  const card = (b, i) => {
    const isTop = b.id === tb.id;
    const badge = isTop
      ? `<span class="pg-nextb">Top length</span><span class="pg-pin"></span>`
      : `<span class="pg-chip pg-chip--share">${b.share}%</span>`;
    const tie = b.wish.length === 1 ? `${b.wish[0].short} on the wishlist lands here`
      : b.wish.length > 1 ? `${b.wish.length} items on the wishlist land here`
      : 'nothing on the wishlist lands here';
    return (
      `<article class="pg-card pg-card--${esc(b.id)}${i < 2 ? ' pg-card--big' : ''}${b.eq >= 135 ? ' pg-card--tele' : ''}${isTop ? ' pg-card--top' : ''}" data-r="${i}">` +
        '<div class="pg-ch">' +
          `<span class="pg-thumb">${chip({ lens: b.label, eq: 'eq' })}</span>` +
          `<span class="pg-cn"><b>${esc(b.label)} equivalent</b><small>${esc(b.range)}</small></span>` +
          srcTag(data, 'lightroom') +
          badge +
        '</div>' +
        '<div class="pg-job">' +
          `<div class="pg-jobt"><b>${b.share}% of every frame you took</b>${srcTag(data, 'lightroom')}</div>` +
          `<div class="pg-prog"><i data-w="${pct((b.share / counts.topShare) * 100)}"></i></div>` +
          '<div class="pg-jobm">' +
            `<span class="pg-jp">${n0(b.frames)} frames</span>` +
            `<span>${ico('layers')}${b.rows.length} ${b.rows.length === 1 ? 'lens' : 'lenses'} shot here</span>` +
            `<span class="pg-eta">${ico('hourglass')}${esc(tie)}</span>` +
          '</div>' +
        '</div>' +
        `<div class="pg-unit"><span class="pg-unitk">${ico('disc')}${esc(b.note)}</span><span class="pg-unitk pg-unitk--r">frames in this bucket</span></div>` +
        `<ul class="pg-lenslist">${b.rows.map((r, j) => lensRow(data, b, r, j)).join('')}</ul>` +
      '</article>'
    );
  };
  return (
    '<section class="pg-farm pg-shoot">' +
      `<div class="pg-sech"><h2>${esc(copy.shootH)}</h2><span>${esc(copy.shootDek)}</span></div>` +
      `<div class="pg-grid">${order.map(card).join('')}</div>` +
    '</section>'
  );
}

/* one store dot in the overview: what that store had this morning */
const dot = (data, w, sid) => {
  const a = accOf(data, sid);
  const s = w.spots[sid];
  const label = s === 'new' ? 'new, in stock' : s === 'used' ? 'used, in stock' : s === 'out' ? 'sold out' : 'not listed';
  return `<i class="pg-sd pg-sd--${s}" title="${esc(a.name)}: ${label}"></i>`;
};

/* tab 1, Overview: every wishlist item, what each of the five stores had, the cheapest new and the cheapest
   used with the grade the store printed. */
function overviewPanel(data) {
  const { wish, copy, counts, STORE_IDS, stores } = data;
  const row = (w, j) => {
    const usedStore = w.usedBest ? accOf(data, w.usedBest.store) : null;
    const newStore = w.newBest ? accOf(data, w.newBest.store) : null;
    return (
      `<li class="pg-out${w.inStock ? '' : ' pg-out--gone'}" data-j="${j}">` +
        `<span class="pg-outr"><b>${j + 1}</b></span>` +
        `<span class="pg-outc">${itile(w)}<span><b>${esc(w.name)}</b><small>${esc(w.type)}, ${esc(w.lens)}, ${esc(w.eq)} equivalent</small></span></span>` +
        `<span class="pg-stocks">${STORE_IDS.map((sid) => dot(data, w, sid)).join('')}</span>` +
        (w.newBest
          ? `<b class="pg-outs">${money(w.newBest.price)}</b>`
          : `<b class="pg-outs pg-outs--none">Sold out</b>`) +
        (w.usedBest
          ? `<span class="pg-outd"><b>${money(w.usedBest.price)}</b>, ${esc(w.usedBest.grade || 'used')}, at ${esc(usedStore.short)}</span>`
          : `<span class="pg-outd pg-outd--none">${w.sold ? `${esc(w.sold.note)}, was ${money(w.sold.price)}` : 'no used listing'}</span>`) +
      '</li>'
    );
  };
  return (
    '<div class="pg-panel pg-panel--1">' +
      '<div class="pg-legend">' +
        `<span><i class="pg-sd pg-sd--new"></i>new in stock</span>` +
        `<span><i class="pg-sd pg-sd--used"></i>used in stock</span>` +
        `<span><i class="pg-sd pg-sd--out"></i>sold out</span>` +
        `<span><i class="pg-sd pg-sd--none"></i>not listed</span>` +
        `<span class="pg-legend-s">${ico('refresh-cw')}Stock as read at 9:41 AM, in this order: ${stores.map((s) => esc(s.short)).join(', ')}</span>` +
      '</div>' +
      '<div class="pg-outhead"><span>#</span><span>Item</span><span>Stock at 5 stores</span><span>Cheapest new</span><span>Cheapest used, and where</span></div>' +
      '<ol class="pg-outlist">' +
        wish.map(row).join('') +
      '</ol>' +
      `<div class="pg-outfoot">${ico('triangle-alert')}<span>${esc(copy.overviewNote)}</span><b>${counts.gone} of ${counts.wish}</b></div>` +
    '</div>'
  );
}

/* tab 2, Just listed: every listing that appeared in the last hour, newest first, and the cheapest used
   price for the items in stock under the cursor at the end. */
function freshPanel(data) {
  const { fresh, copy, counts } = data;
  const row = (l, j) => {
    const w = wishOf(data, l.item);
    const st = accOf(data, l.store);
    return (
      `<li class="pg-rs" data-k="${j}">` +
        `<span class="pg-outc">${itile(w)}<span><b>${esc(w.short)}</b><small>listed ${esc(l.ago)}, ${esc(w.eq)} equivalent</small></span></span>` +
        '<span class="pg-offers">' +
          '<span class="pg-offer">' +
            `<img src="${esc(st.logo)}" alt="">` +
            `<span class="pg-offt"><b>${esc(st.short)}</b><small>${esc(l.cond === 'used' ? l.grade || 'used' : 'new')}, in stock</small></span>` +
            `<b class="pg-offp">${money(l.price)}</b>` +
            '<span class="pg-cheap pg-cheap--fresh">Just listed</span>' +
          '</span>' +
        '</span>' +
      '</li>'
    );
  };
  return (
    '<div class="pg-panel pg-panel--2">' +
      '<ul class="pg-rslist">' +
        fresh.map(row).join('') +
      '</ul>' +
      '<div class="pg-sum">' +
        `<div class="pg-total"><span>${ico('package')}${esc(copy.totalLabel)}</span><b data-t="${counts.usedTotal}">$0.00</b></div>` +
        `<p class="pg-sumn">${ico('lock')}${esc(copy.freshNote)}</p>` +
      '</div>' +
    '</div>'
  );
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/photo-gear';
  return (
    '<footer class="pg-foot">' +
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
    shootSection(data) +
    '<section class="pg-panels">' +
      `<div class="pg-sech"><h2>${esc(data.copy.panelsH)}</h2><span>${esc(data.copy.panelsDek)}</span></div>` +
      overviewPanel(data) +
      freshPanel(data) +
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
  const tg = tabDone(p);
  const fg = freshDone(p);
  const data = fallback;
  const { counts, meta, accounts } = data;
  const nTicks = accounts.length + 1;

  const clock = root.querySelector('.pg-clock');
  if (clock) clock.textContent = clockText(meta.syncStart + meta.syncSecs * (0.6 * g + 0.4 * mg));

  const heroEl = root.querySelector('.pg-hero');
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
  const count = root.querySelector('.pg-synccount');
  if (count) count.textContent = `${n0(read)} of ${n0(counts.records)} records`;

  // the match: the wishlist split into what sits in a length you shoot and what is wider than you own
  const k = ease(mg);
  const covered = root.querySelector('.pg-covernow');
  if (covered) covered.textContent = n0(Math.round(counts.covered * k));
  const gap = root.querySelector('.pg-gapnow');
  if (gap) gap.textContent = n0(Math.round(counts.gap * k));
  const inn = root.querySelector('.pg-innow');
  if (inn) inn.textContent = n0(Math.round(counts.inStock * k));
  const bar = root.querySelector('.pg-mbar');
  if (bar) {
    const mh = bar.querySelector('.pg-mhave');
    const ms = bar.querySelector('.pg-mshort');
    if (mh) mh.style.width = pct((counts.covered / counts.wish) * 100 * k);
    if (ms) ms.style.width = pct((counts.gap / counts.wish) * 100 * k);
    bar.classList.toggle('is-matched', mg >= 0.999);
  }

  // the status strip: the four counters ease in, then the example rows land one after another
  for (const b of root.querySelectorAll('[data-g]')) {
    const target = Number(b.dataset.g);
    const unit = b.dataset.unit;
    const e = ease(gw);
    b.textContent = unit === 'money' ? money(Math.round(target * e * 100) / 100)
      : unit ? `${n0(Math.round(target * e))}${unit}` : n0(Math.round(target * e));
  }
  for (const li of root.querySelectorAll('.pg-statex li')) {
    const j = Number(li.dataset.j) || 0;
    li.style.opacity = (0.15 + 0.85 * ease(clamp01((gw - j * 0.2) / 0.6))).toFixed(3);
  }

  // the shoot section: the five focal length cards settle in turn, each share bar filling as it lands
  for (const c of root.querySelectorAll('.pg-card')) {
    const i = Number(c.dataset.r) || 0;
    const kk = ease(clamp01((rw - i * 0.08) / 0.6));
    c.style.opacity = (0.2 + 0.8 * kk).toFixed(3);
    c.style.transform = `translateY(${((1 - kk) * 10).toFixed(2)}px)`;
    for (const b of c.querySelectorAll('[data-w]')) b.style.width = pct(Number(b.dataset.w) * kk);
  }

  // the overview table: each item's row lands with its store dots
  for (const r of root.querySelectorAll('.pg-out')) {
    const j = Number(r.dataset.j) || 0;
    r.style.opacity = (0.25 + 0.75 * ease(clamp01((tg - j * 0.1) / 0.55))).toFixed(3);
  }

  // just listed: the rows land one after another and the cheapest used total counts in under the cursor
  for (const r of root.querySelectorAll('.pg-rs')) {
    const j = Number(r.dataset.k) || 0;
    r.style.opacity = (0.25 + 0.75 * ease(clamp01((fg - j * 0.08) / 0.5))).toFixed(3);
  }
  for (const b of root.querySelectorAll('[data-t]')) b.textContent = money(Math.round(Number(b.dataset.t) * ease(fg) * 100) / 100);
  const total = root.querySelector('.pg-total');
  if (total) total.style.opacity = (0.3 + 0.7 * ease(clamp01((fg - 0.25) / 0.6))).toFixed(3);

  const fill = root.querySelector('.pg-syncfill');
  if (fill) fill.style.width = pct(100 * (0.6 * g + 0.4 * mg));
}