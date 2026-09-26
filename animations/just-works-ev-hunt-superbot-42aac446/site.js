/* site.js - the generated frontend: superbot.app/p/model-y-hunt, "Car Hunt".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the filter block, the drops tile, the best buy row and the
   difference-to-pay line, and .is-active on the Your Tesla tab; all are styled in site.css. The tab click
   swaps the VIN log panel for the Tesla account panel through a :has() + sibling rule, so no JS runs on the
   click. The only clock-driven output is render(root, p): the top bar clock, the sync card ticking through
   the five sources, the filter beat (1,561 listings narrowing to 13 matches, FILT_A/FILT_B), the four status
   counters easing in (GROW_A/GROW_B), the eight ranked rows settling (ROW_A/ROW_B), the price history bars
   rising (LOG_A/LOG_B), the account figures counting in and the difference-to-pay line (TL_A/TL_B), and the
   sync bar. Every one of them is a pure function of the beat's progress.
   Read-only: every word the page prints says what Superbot found, never that it ordered, reserved, cancelled,
   messaged or changed anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';
const usd = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Number(n)).toLocaleString('en-US');

/** seconds since midnight -> "9:12:36 PM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the hunt beat inside the browser scene: the five sources are read from SYNC_A to SYNC_B of p (while the
   page grows out of the hub card) and the filter runs 1,561 listings down to 13 matches from FILT_A to
   FILT_B, both inside the first scroll hold in ad.js (f 0.13 to 0.3, p 0.213 to 0.367), so the finished
   1,561 / 1,548 / 13 card holds on screen before the page moves on and stays final for the rest of the spot */
const SYNC_A = 0;
const SYNC_B = 0.17;
const FILT_A = 0.165;
const FILT_B = 0.285;
/* the status strip is the second hold (ad.js f 0.355 to 0.52, p 0.426 to 0.573): its counters start easing
   in as it scrolls up, finish at 1,561 / 13 / 17 / 6,090 just after it lands (f 0.38) and then hold settled
   with the cursor on the drops tile before the scroll leaves */
const GROW_A = 0.36;
const GROW_B = 0.44;
/* the ranked table is the third hold (ad.js f 0.575 to 0.665, p 0.622 to 0.703): the eight rows settle in
   turn while it scrolls in (from f 0.52, p 0.573) and are all still by the time it lands */
const ROW_A = 0.53;
const ROW_B = 0.62;
/* the price history is the first half of the fourth hold (ad.js f 0.7 to 0.79, p 0.723 to 0.809): the four
   bars rise from the axis and their deltas fade in, finishing just before the tab click swaps the panel */
const LOG_A = 0.7;
const LOG_B = 0.79;
/* the Tesla account panel is the second half (after the click, ad.js f 0.86, p 0.87): the trade-in and the
   order count in and the difference-to-pay line eases in under the cursor, which rests on it to the end */
const TL_A = 0.8;
const TL_B = 0.92;

export const syncDone = (p) => clamp01((p - SYNC_A) / (SYNC_B - SYNC_A));
export const filtDone = (p) => clamp01((p - FILT_A) / (FILT_B - FILT_A));
export const growDone = (p) => clamp01((p - GROW_A) / (GROW_B - GROW_A));
export const rowDone = (p) => clamp01((p - ROW_A) / (ROW_B - ROW_A));
export const logDone = (p) => clamp01((p - LOG_A) / (LOG_B - LOG_A));
export const teslaDone = (p) => clamp01((p - TL_A) / (TL_B - TL_A));

/* the sync card: tick i counts from 0 to its number over its own window, so the five sources land one after
   another and the sixth tick (the shortlist being ranked) closes the card at g = 1: each tick counts over
   0.2 of g and the next starts 0.1 of g later, so two numbers are always moving at once and the last source
   tick lands at g 0.6 */
const TICK_STEP = 0.1;
const TICK_LEN = 0.2;
const tickDone = (g, i) => ease(clamp01((g - i * TICK_STEP) / TICK_LEN));

/* lucide icons (ISC), inlined as path data */
const ICONS = {
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.3-4.3"/>',
  car: '<path d="M5 17a2 2 0 1 0 4 0a2 2 0 0 0-4 0m10 0a2 2 0 1 0 4 0a2 2 0 0 0-4 0M5 17H3v-4l2-1l1.5-3.5A2 2 0 0 1 8.3 7h7.4a2 2 0 0 1 1.8 1.5L19 12l2 1v4h-2"/><path d="M5 17h10M9 7l-1 5m7-5l1 5M4 12h16"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.2 8.2a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  'calendar-days': '<path d="M8 2v4m8-4v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m16 9l-5.5 5.5L8 12"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  gauge: '<path d="m12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  'trending-down': '<path d="M16 17h6v-6"/><path d="M22 17l-8.5-8.5l-5 5L2 7"/>',
  key: '<path d="m15.5 7.5l3 3L22 7l-3-3"/><path d="m18.5 10.5L9 20H4v-5l9.5-9.5"/><circle cx="7.5" cy="16.5" r="0.5"/>',
  filter: '<path d="M3 6h18M7 12h10M10 18h4"/>',
};

const ico = (name) =>
  `<svg class="ev-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const accOf = (data, id) => data.accounts.find((a) => a.id === id) || data.accounts[0];

/* a source tag: the site's mark plus its short name */
const srcTag = (data, id) => {
  const a = accOf(data, id);
  return `<span class="ev-tag"><img src="${esc(a.logo)}" alt="">${esc(a.short)}</span>`;
};

/* the four outcomes and the words and icons they print with */
const KIND = {
  listings: { icon: 'search', word: 'Checked' },
  matches: { icon: 'car', word: 'Match' },
  drops: { icon: 'trending-down', word: 'Drops' },
  saves: { icon: 'wallet', word: 'Saving' },
};

function topBar(data) {
  const { counts, meta, accounts } = data;
  return (
    '<header class="ev-top">' +
      '<div class="ev-topin">' +
        `<span class="ev-brand"><img class="ev-brandico" src="./brand/app.svg" alt=""><b>${esc(data.copy.brand)}</b><span class="ev-by">by Superbot</span></span>` +
        '<nav class="ev-tabs">' +
          `<span class="ev-tab ev-tab--1">${ico('trending-down')}VIN log <i>1</i></span>` +
          `<span class="ev-tab ev-tab--2">${ico('key')}Your Tesla <i>${n0(2)}</i></span>` +
        '</nav>' +
        '<div class="ev-status">' +
          `<span class="ev-logs">${ico('lock')}${counts.sources} sources, read-only</span>` +
          `<span class="ev-live"><span class="ev-dot"></span><span class="ev-clock">${esc(clockText(meta.syncStart))}</span></span>` +
        '</div>' +
      '</div>' +
      '<div class="ev-syncbar"><span class="ev-syncfill"></span></div>' +
    '</header>'
  );
}

function syncCard(data) {
  const { accounts, counts, meta, copy } = data;
  const ticks = accounts.map((a, i) =>
    `<li class="ev-tick ev-tick--s${i + 1}"><img src="${esc(a.logo)}" alt="" title="${esc(a.name)}"><span title="${esc(a.name)}">${esc(a.short)}</span>` +
      `<b data-n="${a.pulled}" data-i="${i}">0</b><span class="ev-tickok">${ico('check')}</span></li>`,
  );
  const last = accounts.length;
  ticks.push(
    `<li class="ev-tick ev-tick--s${last + 1} ev-tick--final"><span class="ev-tickico">${ico('car')}</span><span>${esc(copy.syncClose)}</span>` +
      `<b data-n="${counts.matches}" data-i="${last}">0</b><span class="ev-tickok">${ico('check')}</span></li>`,
  );
  return (
    '<div class="ev-sync">' +
      '<div class="ev-synchead">' +
        `<span class="ev-syncnow">${ico('refresh-cw')}${esc(copy.syncNow)}<span class="ev-synccount">0 of ${n0(counts.rows)} rows</span></span>` +
        `<span class="ev-stamp">${ico('circle-check')}${esc(copy.syncDone)}</span>` +
      '</div>' +
      `<ul class="ev-ticks">${ticks.join('')}</ul>` +
      '<div class="ev-merge">' +
        '<div class="ev-mbar"><span class="ev-mun"></span><span class="ev-mdup"></span></div>' +
        '<div class="ev-mrow">' +
          `<span class="ev-mk"><b>${n0(counts.scanned)}</b>listings scanned</span>` +
          `<span class="ev-mk ev-mk--cut"><b class="ev-cutnow">0</b>set aside</span>` +
          `<span class="ev-mk ev-mk--keep"><b class="ev-keepnow">${n0(counts.scanned)}</b>still in play</span>` +
          `<span class="ev-mk ev-mk--match"><b class="ev-matchnow">0</b>matches</span>` +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function huntCard(data) {
  const { meta, counts, copy } = data;
  const covered = (counts.tradeValue / counts.bestPrice) * 100;
  return (
    '<aside class="ev-hunt">' +
      `<span class="ev-huntk">${ico('map-pin')}${esc(copy.huntK)}</span>` +
      `<h2>${esc(meta.user)}'s hunt</h2>` +
      `<p class="ev-huntday">${ico('car')}${esc(meta.target)}, under ${usd(meta.budget)}</p>` +
      '<ul class="ev-huntfacts">' +
        `<li><small>Listings checked</small><b>${n0(counts.scanned)}</b></li>` +
        `<li><small>Matches</small><b>${n0(counts.matches)}</b></li>` +
        `<li><small>With FSD</small><b>${n0(counts.withFsd)}</b></li>` +
        `<li><small>Median days on lot</small><b>${n0(counts.medianDays)}</b></li>` +
      '</ul>' +
      '<div class="ev-budget">' +
        `<div class="ev-budgeth">${ico('shield-check')}${esc(copy.budgetH)}</div>` +
        '<div class="ev-budgetrow">' +
          `<span><b>${usd(counts.bestPrice)}</b>best buy</span>` +
          `<span class="ev-br--trade"><b>${usd(counts.tradeValue)}</b>trade-in</span>` +
          `<span class="ev-br--diff"><b>${usd(counts.diff)}</b>to pay</span>` +
        '</div>' +
        `<div class="ev-budgetbar"><i style="width:${pct(covered)}"></i></div>` +
        `<p class="ev-budgetn">${ico('lock')}Trade-in covers ${Math.round(covered)}% of the best buy. Read-only, nothing ordered.</p>` +
      '</div>' +
    '</aside>'
  );
}

function hero(data) {
  const { copy, counts, meta } = data;
  return (
    '<section class="ev-hero">' +
      '<img class="ev-herobg" src="./img/hero.jpg" alt="">' +
      '<div class="ev-heroin">' +
        '<div class="ev-herot">' +
          `<span class="ev-kicker">${ico('car')}${esc(copy.kicker)}</span>` +
          `<h1>${esc(copy.heroH1)}</h1>` +
          `<p class="ev-dek">${esc(copy.heroDek)}</p>` +
          syncCard(data) +
          '<ul class="ev-stats">' +
            `<li><b>${n0(counts.scanned)}</b><span>listings checked</span></li>` +
            `<li><b>${n0(counts.matches)}</b><span>matches under ${usd(meta.budget)}</span></li>` +
            `<li class="ev-stat--iv"><b>${n0(counts.drops)}</b><span>price drops this week</span></li>` +
            `<li class="ev-stat--ok"><b>${usd(counts.bestSaves)}</b><span>best buy saves</span></li>` +
          '</ul>' +
        '</div>' +
        huntCard(data) +
      '</div>' +
    '</section>'
  );
}

/* the five sources: what each gave the hunt */
function srcStrip(data) {
  const { accounts } = data;
  return (
    '<section class="ev-accs"><ul class="ev-acclist">' +
      accounts.map((a) =>
        `<li class="ev-acc ev-acc--${esc(a.id)}">` +
          `<img src="${esc(a.logo)}" alt="">` +
          `<span class="ev-acc-t"><b>${esc(a.name)}</b><small>${esc(a.what)}</small></span>` +
          `<span class="ev-acc-v"><b>${n0(a.scanned)}</b><small>${a.kind === 'account' ? `records read, <em>${n0(a.matched)} whose order or trade matched</em>` : `listings scanned, <em>${n0(a.matched)} matched</em>`}</small></span>` +
          `<span class="ev-acc-ok">${ico('check')}</span>` +
        '</li>',
      ).join('') +
    '</ul></section>'
  );
}

function flagsSection(data) {
  const { flags, copy } = data;
  return (
    '<section class="ev-flags">' +
      `<div class="ev-sech"><h2>${esc(copy.flagsH)}</h2><span>${esc(copy.flagsDek)}</span></div>` +
      '<ul class="ev-flaglist">' +
        flags.map((f) =>
          `<li class="ev-flag ev-flag--${esc(f.kind)}">` +
            '<div class="ev-flagh">' +
              `<span class="ev-flagi">${ico(f.icon)}</span>` +
              `<span class="ev-flagt"><b>${esc(f.label)}</b><small>${esc(f.rule)}</small></span>` +
              `<b class="ev-flagn" data-g="${f.n}" data-money="${f.money ? 1 : 0}">${f.money ? usd(f.n) : n0(f.n)}</b>` +
            '</div>' +
            '<ul class="ev-flagex">' +
              f.examples.map((e, j) => `<li data-j="${j}"><span>${esc(e.name)}</span><b>${esc(e.v)}</b></li>`).join('') +
            '</ul>' +
            `<span class="ev-flagmore">${esc(f.more)}</span>` +
          '</li>',
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

/* the ranked table: the money shot, best buy first and flagged. The best buy row carries an empty .ev-pin
   after the badge: it is the anchor the kit's cursor rests on in beat 3, a 1 px box in the gap right of the
   badge, so the pointer never sits on the price, the mileage or the FSD chip the beat is showing. */
function rankSection(data) {
  const { matches, counts, copy } = data;
  const row = (m) =>
    `<div class="ev-row ev-row--${esc(m.key)}${m.best ? ' ev-row--best' : ''}" data-r="${m.rank - 1}">` +
      `<span class="ev-rankc"><b>${m.rank}</b></span>` +
      srcTag(data, m.source) +
      `<span class="ev-thumb"><img src="${esc(m.thumb)}" alt=""></span>` +
      `<span class="ev-car"><b>${esc(m.title)}</b>${m.best ? '<span class="ev-best">Best buy</span><span class="ev-pin"></span>' : ''}<small>${esc(m.paint)}, ${m.fsd ? 'FSD (Supervised) included' : 'no FSD'}</small></span>` +
      `<span class="ev-miles">${n0(m.miles)}</span>` +
      `<span class="ev-price"><b>${usd(m.price)}</b>${m.drop ? `<s>${usd(m.was)}</s><span class="ev-drop">${m.chip}, ${usd(-m.drop)}</span>` : `<span class="ev-drop ev-drop--flat">no drops</span>`}</span>` +
      `<span class="ev-fsd${m.fsd ? ' ev-fsd--yes' : ''}">${m.fsd ? 'FSD' : 'none'}</span>` +
      `<span class="ev-days">${n0(m.days)}</span>` +
      `<span class="ev-store"><b>${esc(m.store)}</b><small>${esc(m.city)}, ${n0(m.dist)} mi</small></span>` +
      `<span class="ev-vin" title="${esc(m.vin)}">${esc(m.short)}</span>` +
    '</div>';
  return (
    '<section class="ev-rank">' +
      `<div class="ev-sech"><h2>${esc(copy.tableH)}</h2><span>${esc(copy.tableDek)}</span></div>` +
      '<div class="ev-table">' +
        '<div class="ev-thead">' +
          '<span>#</span><span>Source</span><span></span><span>Listing</span><span>Miles</span><span>Price</span><span>FSD</span><span>Days</span><span>Store</span><span>VIN</span>' +
        '</div>' +
        matches.map(row).join('') +
        `<div class="ev-tfoot">${ico('filter')}${esc(copy.tableFoot)}</div>` +
      '</div>' +
    '</section>'
  );
}

/* tab 1, VIN log: the price history of the best buy, drop by drop. Bar heights are a share of a fixed
   $33,000 to $36,000 axis, so the four prices are comparable and the last two sit level. */
const AXIS_LO = 33000;
const AXIS_HI = 36000;
const barHeight = (price) => 30 + ((price - AXIS_LO) / (AXIS_HI - AXIS_LO)) * 70;

function logPanel(data) {
  const { log, best, copy, counts } = data;
  return (
    '<div class="ev-panel ev-panel--1">' +
      '<div class="ev-loghead">' +
        `<span class="ev-lh"><small>VIN</small><b>${esc(best.vin)}</b></span>` +
        `<span class="ev-lh"><small>Store</small><b>${esc(best.store)}</b></span>` +
        `<span class="ev-lh"><small>Distance</small><b>${n0(best.dist)} mi</b></span>` +
        `<span class="ev-lh"><small>Days on lot</small><b>${n0(best.days)}</b></span>` +
        `<span class="ev-lh"><small>Price now</small><b class="ev-lh--now">${usd(best.price)}</b></span>` +
        `<span class="ev-lh"><small>FSD (Supervised)</small><b>${best.fsd ? 'Included' : 'No'}</b></span>` +
      '</div>' +
      `<ol class="ev-log">` +
        log.map((s) =>
          `<li class="ev-step${s.first ? ' ev-step--first' : ''}${s.last ? ' ev-step--last' : ''}" data-j="${Math.round(s.at * 100)}" data-h="${barHeight(s.price).toFixed(2)}">` +
            `<span class="ev-when">${esc(s.step)} ${esc(s.when)}</span>` +
            `<b class="ev-lprice">${usd(s.price)}</b>` +
            `<span class="ev-barn"><i></i></span>` +
            (s.delta ? `<span class="ev-ldelta">${usd(s.delta)}</span>` : `<span class="ev-ldelta ev-ldelta--flat">${s.first ? 'start' : 'no change'}</span>`) +
            `<small class="ev-lnote">${esc(s.note)}</small>` +
          '</li>',
        ).join('') +
      '</ol>' +
      `<div class="ev-logfoot">${ico('trending-down')}<span>${esc(copy.logFoot)}</span><b>${usd(counts.bestPrice)}</b></div>` +
    '</div>'
  );
}

/* tab 2, Your Tesla: what the click on the tab swaps in */
function teslaPanel(data) {
  const { trade, order, counts, copy, best } = data;
  return (
    '<div class="ev-panel ev-panel--2">' +
      '<div class="ev-tgrid">' +
        '<div class="ev-tcard">' +
          `<span class="ev-tk">${ico('key')}Trade-in estimate</span>` +
          `<h3>${trade.year} ${esc(trade.model)}</h3>` +
          `<p class="ev-tmeta">${n0(trade.miles)} mi, on file in your Tesla account</p>` +
          `<div class="ev-tv"><b data-t="${trade.value}">$0</b><small>valid through ${esc(trade.validThrough)}</small></div>` +
        '</div>' +
        '<div class="ev-tcard">' +
          `<span class="ev-tk">${ico('calendar-days')}Open order ${esc(order.rn)}</span>` +
          `<h3>${esc(order.model)}</h3>` +
          `<p class="ev-tmeta">Ordered ${esc(order.placed)}, ${usd(order.price)} before taxes and fees</p>` +
          `<div class="ev-tv"><b data-t="${order.price}">$0</b><small>estimated delivery ${esc(order.window)}</small></div>` +
        '</div>' +
        '<div class="ev-pay">' +
          `<span class="ev-tk">${ico('wallet')}${esc(copy.payH)}</span>` +
          `<div class="ev-prow"><span>Best buy, ${esc(best.title)}</span><b>${usd(best.price)}</b></div>` +
          `<div class="ev-prow"><span>Trade-in estimate, ${trade.year} Model 3</span><b>${usd(-trade.value)}</b></div>` +
          `<div class="ev-prow ev-prow--diff ev-diff"><span>Difference to pay</span><b data-t="${counts.diff}">$0</b></div>` +
          `<p class="ev-pnote">${esc(copy.payNote)}</p>` +
          `<p class="ev-pfoot">${ico('lock')}${esc(copy.teslaDek)}</p>` +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/model-y-hunt';
  return (
    '<footer class="ev-foot">' +
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
    flagsSection(data) +
    rankSection(data) +
    '<section class="ev-panels">' +
      `<div class="ev-sech"><h2>${esc(data.copy.panelsH)}</h2><span>${esc(data.copy.panelsDek)}</span></div>` +
      logPanel(data) +
      teslaPanel(data) +
    '</section>' +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

export function render(root, p) {
  if (!root || !root.querySelector) return;
  const g = syncDone(p);
  const mg = filtDone(p);
  const gw = growDone(p);
  const rw = rowDone(p);
  const lg = logDone(p);
  const tl = teslaDone(p);
  const data = fallback;
  const { counts, meta } = data;

  const clock = root.querySelector('.ev-clock');
  if (clock) clock.textContent = clockText(meta.syncStart + meta.syncSecs * (0.6 * g + 0.4 * mg));

  const heroEl = root.querySelector('.ev-hero');
  let read = 0;
  for (const b of root.querySelectorAll('[data-n]')) {
    const i = Number(b.dataset.i) || 0;
    const v = Math.round(Number(b.dataset.n) * tickDone(g, i));
    b.textContent = n0(v);
    if (i < counts.sources) read += v;
  }
  if (heroEl) {
    const ticks = counts.sources + 1;
    for (let i = 0; i < ticks; i++) heroEl.classList.toggle(`is-s${i + 1}`, tickDone(g, i) >= 0.999);
    heroEl.classList.toggle('is-m1', mg > 0.06);
    heroEl.classList.toggle('is-m2', mg >= 0.999);
  }
  const count = root.querySelector('.ev-synccount');
  if (count) count.textContent = `${n0(read * 4)} of ${n0(counts.rows)} rows`;

  // the filter: every listing starts in play, the band of set-aside listings stays, the match sliver grows
  const k = ease(mg);
  const setAside = Math.round(counts.filtered * k);
  const cutnow = root.querySelector('.ev-cutnow');
  if (cutnow) cutnow.textContent = n0(setAside);
  const keepnow = root.querySelector('.ev-keepnow');
  if (keepnow) keepnow.textContent = n0(counts.scanned - setAside);
  const matchnnow = root.querySelector('.ev-matchnow');
  if (matchnnow) matchnnow.textContent = n0(Math.round(counts.matches * k));
  const bar = root.querySelector('.ev-mbar');
  if (bar) {
    const mun = bar.querySelector('.ev-mun');
    const mdup = bar.querySelector('.ev-mdup');
    const keepPct = (counts.matches / counts.scanned) * 100 * k;
    if (mun) mun.style.width = pct(keepPct);
    if (mdup) mdup.style.width = pct(100 - keepPct);
    bar.classList.toggle('is-filtered', mg >= 0.999);
  }

  // the status strip: the four counters ease in, then the example rows land one after another
  for (const b of root.querySelectorAll('[data-g]')) {
    const v = Math.round(Number(b.dataset.g) * ease(gw));
    b.textContent = b.dataset.money === '1' ? usd(v) : n0(v);
  }
  for (const li of root.querySelectorAll('.ev-flagex li')) {
    const j = Number(li.dataset.j) || 0;
    li.style.opacity = (0.15 + 0.85 * ease(clamp01((gw - j * 0.2) / 0.6))).toFixed(3);
  }

  // the ranked table: the eight rows settle in turn
  for (const r of root.querySelectorAll('.ev-row')) {
    const i = Number(r.dataset.r) || 0;
    const kk = ease(clamp01((rw - i * 0.05) / 0.55));
    r.style.opacity = (0.2 + 0.8 * kk).toFixed(3);
    r.style.transform = `translateY(${((1 - kk) * 10).toFixed(2)}px)`;
  }

  // the price history: each bar rises to its share of the axis, its delta fading in behind it
  for (const s of root.querySelectorAll('.ev-step')) {
    const j = (Number(s.dataset.j) || 0) / 100;
    const h = Number(s.dataset.h) || 0;
    const kk = ease(clamp01((lg - j * 0.24) / 0.55));
    const b = s.querySelector('.ev-barn i');
    if (b) b.style.height = pct(h * kk);
    s.style.opacity = (0.25 + 0.75 * kk).toFixed(3);
  }

  // the Tesla account: the two figures count in and the difference-to-pay line lands under the cursor
  for (const b of root.querySelectorAll('[data-t]')) b.textContent = usd(Math.round(Number(b.dataset.t) * ease(tl)));
  const diff = root.querySelector('.ev-diff');
  if (diff) diff.style.opacity = (0.3 + 0.7 * ease(clamp01((tl - 0.25) / 0.6))).toFixed(3);

  const fill = root.querySelector('.ev-syncfill');
  if (fill) fill.style.width = pct(100 * (0.6 * g + 0.4 * mg));
}