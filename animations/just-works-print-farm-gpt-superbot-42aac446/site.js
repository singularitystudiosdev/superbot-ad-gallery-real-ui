/* site.js - the generated frontend: superbot.app/p/print-farm, "Print Farm".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the match bar, the spools short tile's icon chip, the pin by the
   next printer to finish and the cheapest total line, and .is-active on the Restock tab; all are styled in
   site.css. The tab click swaps the Runs out first panel for the Restock panel through a :has() + sibling
   rule, so no JS runs on the click. The only clock-driven output is render(root, p): the top bar clock, the
   sync card ticking through the nine sources, the match beat (1,995 g of queued models against the spools,
   MATCH_A/MATCH_B), the four status counters easing in (GROW_A/GROW_B), the five printer cards settling with
   their progress and gram bars filling (ROW_A/ROW_B), the runs out bars (OUT_A/OUT_B), the restock offers
   and the cheapest total counting in (TL_A/TL_B), and the sync bar. Every one of them is a pure function of
   the beat's progress.
   Read-only: every word the page prints says what Superbot read or found, never that it started, paused,
   cancelled or bought anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';
const money = (n) => '$' + Number(n).toFixed(2);
const g0 = (n) => n0(Math.round(n)) + ' g';

/** seconds since midnight -> "7:42:10 PM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the read beat inside the browser scene: the nine sources are read from SYNC_A to SYNC_B of p (while the
   page grows out of the hub card) and the queue is matched against the spools from MATCH_A to MATCH_B, both
   inside the first scroll hold in ad.js (f 0.13 to 0.3), so the finished card (1,182 g covered, 813 g short,
   4 colors) holds on screen before the page moves on and stays final for the rest of the spot */
const SYNC_A = 0;
const SYNC_B = 0.17;
const MATCH_A = 0.165;
const MATCH_B = 0.285;
/* the status strip is the second hold (ad.js f 0.355 to 0.52): its counters ease in as it scrolls up and
   hold settled with the cursor on the spools short tile before the scroll leaves */
const GROW_A = 0.36;
const GROW_B = 0.44;
/* the farm is the third hold (ad.js f 0.575 to 0.665): the five printer cards settle in turn while it
   scrolls in, their progress and gram bars filling, all still by the time it lands */
const ROW_A = 0.53;
const ROW_B = 0.62;
/* the runs out first panel is the first half of the fourth hold (ad.js f 0.7 to 0.79): each colour's bar
   grows to what it holds against what the queue needs, finishing just before the tab click */
const OUT_A = 0.7;
const OUT_B = 0.79;
/* the restock panel is the second half (after the click, ad.js f 0.86): the offers land and the cheapest
   total counts in under the cursor, which rests on it to the end */
const TL_A = 0.8;
const TL_B = 0.92;

export const syncDone = (p) => clamp01((p - SYNC_A) / (SYNC_B - SYNC_A));
export const matchDone = (p) => clamp01((p - MATCH_A) / (MATCH_B - MATCH_A));
export const growDone = (p) => clamp01((p - GROW_A) / (GROW_B - GROW_A));
export const rowDone = (p) => clamp01((p - ROW_A) / (ROW_B - ROW_A));
export const outDone = (p) => clamp01((p - OUT_A) / (OUT_B - OUT_A));
export const restockDone = (p) => clamp01((p - TL_A) / (TL_B - TL_A));

/* the sync card: tick i counts from 0 to its number over its own window, so the nine sources land one after
   another and the tenth tick (the queue matched) closes the card at g = 1. Each tick counts over TICK_LEN of
   g and the next starts TICK_STEP later, spaced so the last tick lands exactly at g = 1 */
const TICK_LEN = 0.2;
const tickStep = (n) => (n > 1 ? (1 - TICK_LEN) / (n - 1) : 0);
const tickDone = (g, i, n) => ease(clamp01((g - i * tickStep(n)) / TICK_LEN));

/* lucide icons (ISC), inlined as path data */
const ICONS = {
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m16 9l-5.5 5.5L8 12"/>',
  printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  timer: '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  'triangle-alert': '<path d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4m0 4h.01"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.2 8.2a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65m20-5l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  thermometer: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0"/>',
  disc: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/>',
  hourglass: '<path d="M5 22h14M5 2h14m-2 20v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12m-8.7-5l7.7 4.73a2 2 0 0 0 2 0L20.7 7M7.5 4.27l9 5.15"/>',
  scale: '<path d="m16 16l3-8l3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1m-14 0l3-8l3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1m5 5h10M12 3v18M3 7h2c2 0 5-1 7-2c2 1 5 2 7 2h2"/>',
};

const ico = (name) =>
  `<svg class="pf-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const accOf = (data, id) => data.accounts.find((a) => a.id === id) || data.accounts[0];
const printerOf = (data, id) => data.printers.find((p) => p.id === id) || data.printers[0];

/* a source tag: the site's mark plus its short name */
const srcTag = (data, id) => {
  const a = accOf(data, id);
  return `<span class="pf-tag"><img src="${esc(a.logo)}" alt="">${esc(a.short)}</span>`;
};

/* a spool swatch: the filament colour on a spool ring, drawn in CSS from --c */
const swatch = (s) => `<span class="pf-sw" style="--c:${esc(s.hex)}"></span>`;
const slotName = (data, s) => {
  const p = printerOf(data, s.printer);
  return s.slot === 'Spool' ? p.short : `${p.short} ${s.slot}`;
};

function topBar(data) {
  const { counts, meta, accounts, copy, restock } = data;
  return (
    '<header class="pf-top">' +
      '<div class="pf-topin">' +
        `<span class="pf-brand"><img class="pf-brandico" src="./brand/app.svg" alt=""><b>${esc(copy.brand)}</b><span class="pf-by">by Superbot</span></span>` +
        '<nav class="pf-tabs">' +
          `<span class="pf-tab pf-tab--1">${ico('hourglass')}Runs out first <i>${n0(data.runsOut.length)}</i></span>` +
          `<span class="pf-tab pf-tab--2">${ico('tag')}Restock <i>${n0(restock.length)}</i></span>` +
        '</nav>' +
        '<div class="pf-status">' +
          `<span class="pf-logs">${ico('lock')}${accounts.length} sources, read-only</span>` +
          `<span class="pf-live"><span class="pf-dot"></span><span class="pf-clock">${esc(clockText(meta.syncStart))}</span></span>` +
        '</div>' +
      '</div>' +
      '<div class="pf-syncbar"><span class="pf-syncfill"></span></div>' +
    '</header>'
  );
}

function syncCard(data) {
  const { accounts, counts, copy } = data;
  const ticks = accounts.map((a, i) =>
    `<li class="pf-tick pf-tick--s${i + 1}"><img src="${esc(a.logo)}" alt="" title="${esc(a.name)}"><span title="${esc(a.name)}">${esc(a.short)}</span>` +
      `<b data-n="${a.pulled}" data-i="${i}">0</b><span class="pf-tickok">${ico('check')}</span></li>`,
  );
  const last = accounts.length;
  ticks.push(
    `<li class="pf-tick pf-tick--s${last + 1} pf-tick--final"><span class="pf-tickico">${ico('scale')}</span><span>${esc(copy.syncClose)}</span>` +
      `<b data-n="${counts.short}" data-i="${last}">0</b><span class="pf-tickok">${ico('check')}</span></li>`,
  );
  return (
    '<div class="pf-sync">' +
      '<div class="pf-synchead">' +
        `<span class="pf-syncnow">${ico('refresh-cw')}${esc(copy.syncNow)}<span class="pf-synccount">0 of ${n0(counts.records)} records</span></span>` +
        `<span class="pf-stamp">${ico('circle-check')}${esc(copy.syncDone)}</span>` +
      '</div>' +
      `<ul class="pf-ticks">${ticks.join('')}</ul>` +
      '<div class="pf-merge">' +
        '<div class="pf-mrow">' +
          `<span class="pf-mk"><b>${g0(counts.queueGrams)}</b>the queue needs</span>` +
          `<span class="pf-mk pf-mk--have"><b class="pf-havenow">0 g</b>covered by spools</span>` +
          `<span class="pf-mk pf-mk--short"><b class="pf-shortnow">0 g</b>short</span>` +
          `<span class="pf-mk pf-mk--cols"><b class="pf-colsnow">0</b>colors short</span>` +
        '</div>' +
        // the bar sits under its figures, so the cursor resting on it (ad.js hover) points into empty card
        // padding and never covers a number
        '<div class="pf-mbar"><span class="pf-mhave"></span><span class="pf-mshort"></span></div>' +
      '</div>' +
    '</div>'
  );
}

/* the side card: the farm tonight and the next printer to finish */
function farmCard(data) {
  const { meta, counts, copy, nextFinish: nx } = data;
  return (
    '<aside class="pf-farmcard">' +
      `<span class="pf-fck">${ico('printer')}${esc(copy.farmK)}</span>` +
      `<h2>${esc(meta.user)}'s farm</h2>` +
      `<p class="pf-fcday">${ico('layers')}${esc(meta.date)}, ${counts.printers} printers in the garage</p>` +
      '<ul class="pf-fcfacts">' +
        `<li><small>Printing</small><b>${counts.printing} of ${counts.printers}</b></li>` +
        `<li><small>Spools loaded</small><b>${n0(counts.spools)}</b></li>` +
        `<li><small>On hand</small><b>${g0(counts.gramsOnHand)}</b></li>` +
        `<li><small>Queued models</small><b>${n0(counts.models)}</b></li>` +
      '</ul>' +
      '<div class="pf-next">' +
        `<div class="pf-nexth">${ico('timer')}Next to finish</div>` +
        `<div class="pf-nextrow"><span><b>${esc(nx.short)}</b><small>${esc(nx.job)}</small></span><b class="pf-nexteta">${esc(nx.eta)}</b></div>` +
        `<div class="pf-nextbar"><i style="width:${pct(nx.pct)}"></i></div>` +
        `<p class="pf-nextn">${nx.pct}% done, ${esc(nx.leftText)} left, layer ${n0(nx.layer[0])} of ${n0(nx.layer[1])}</p>` +
        `<p class="pf-nextn pf-nextn--ro">${ico('lock')}${esc(copy.farmNote)}</p>` +
      '</div>' +
    '</aside>'
  );
}

function hero(data) {
  const { copy, counts } = data;
  return (
    '<section class="pf-hero">' +
      '<img class="pf-herobg" src="./img/hero.jpg" alt="">' +
      '<div class="pf-heroin">' +
        '<div class="pf-herot">' +
          `<span class="pf-kicker">${ico('printer')}${esc(copy.kicker)}</span>` +
          `<h1>${esc(copy.heroH1)}</h1>` +
          `<p class="pf-dek">${esc(copy.heroDek)}</p>` +
          syncCard(data) +
          '<ul class="pf-heronums">' +
            `<li><b>${n0(counts.records)}</b><span>records read</span></li>` +
            `<li><b>${n0(counts.models)}</b><span>models queued</span></li>` +
            `<li class="pf-hn--short"><b>${g0(counts.queueGrams)}</b><span>filament the queue needs</span></li>` +
            `<li class="pf-hn--ok"><b>${n0(counts.listings)}</b><span>store listings checked</span></li>` +
          '</ul>' +
        '</div>' +
        farmCard(data) +
      '</div>' +
    '</section>'
  );
}

/* the nine sources: what each gave the read */
function srcStrip(data) {
  const { accounts } = data;
  const what = (a) => (a.kind === 'account' ? 'records' : a.kind === 'queue' ? 'models' : 'listings');
  const kind = (a) => (a.kind === 'account' ? 'Printer app' : a.kind === 'queue' ? 'Print queue' : 'Store');
  return (
    '<section class="pf-accs"><ul class="pf-acclist">' +
      accounts.map((a) =>
        `<li class="pf-acc pf-acc--${esc(a.kind)}">` +
          `<img src="${esc(a.logo)}" alt="">` +
          `<span class="pf-acc-t"><b title="${esc(a.name)}">${esc(a.short)}</b><small>${kind(a)}</small></span>` +
          `<span class="pf-acc-v"><b>${n0(a.pulled)}</b><small>${what(a)}</small></span>` +
        '</li>',
      ).join('') +
    '</ul></section>'
  );
}

/* the four answers, each with its own examples */
function statTiles(data) {
  const { counts, printers, runsOut, restock, copy } = data;
  const printing = printers.filter((p) => p.status === 'printing');
  const byEta = printing.slice().sort((a, b) => a.left - b.left);
  const done = printers.find((p) => p.status === 'finished');
  const short = runsOut.filter((s) => s.state === 'short');
  const low = runsOut.filter((s) => s.state === 'low');
  const best = restock.filter((r) => r.spool.state === 'short');
  const tiles = [
    {
      kind: 'printing', icon: 'printer', label: 'Printing now', rule: 'Handy, Connect, OctoPrint',
      n: counts.printing, unit: '',
      ex: printing.slice(0, 3).map((p) => ({ name: `${p.short}, ${p.job}`, v: `${p.pct}%` })),
      more: done ? `${done.short} finished ${done.job} at ${done.doneText}` : '',
    },
    {
      kind: 'next', icon: 'timer', label: 'Next to finish', rule: 'Soonest ETA across all five',
      n: counts.nextMin, unit: 'min',
      ex: byEta.slice(0, 3).map((p) => ({ name: `${p.short}, ${p.job}`, v: p.eta })),
      more: byEta[3] ? `${byEta[3].short} last, at ${byEta[3].eta}` : '',
    },
    {
      kind: 'short', icon: 'triangle-alert', label: 'Spools short', rule: 'Queue needs more than it holds',
      n: counts.short, unit: '',
      ex: short.slice(0, 3).map((s) => ({ name: `${s.mat} ${s.color}`, v: `${g0(s.short)} short` })),
      more: [short[3] ? `${short[3].color} ${g0(short[3].short)} short` : '', low[0] ? `${low[0].color} runs low` : ''].filter(Boolean).join(', '),
    },
    {
      kind: 'restock', icon: 'tag', label: 'Cheapest restock', rule: 'One 1 kg spool per color',
      n: counts.restockTotal, unit: 'money',
      ex: best.slice(0, 3).map((r) => ({ name: `${accOf(data, r.best.store).short}, ${r.spool.color}`, v: money(r.best.price) })),
      more: best[3] ? `${accOf(data, best[3].best.store).short}, ${best[3].spool.color} ${money(best[3].best.price)}` : '',
    },
  ];
  const fmt = (t) => (t.unit === 'money' ? money(t.n) : t.unit ? `${n0(t.n)} ${t.unit}` : n0(t.n));
  return (
    '<section class="pf-stats">' +
      `<div class="pf-sech"><h2>${esc(copy.statsH)}</h2><span>${esc(copy.statsDek)}</span></div>` +
      '<ul class="pf-statlist">' +
        tiles.map((t) =>
          `<li class="pf-stat pf-stat--${t.kind}">` +
            '<div class="pf-stath">' +
              `<span class="pf-stati">${ico(t.icon)}</span>` +
              `<span class="pf-statt"><b>${esc(t.label)}</b><small>${esc(t.rule)}</small></span>` +
              `<b class="pf-statn" data-g="${t.n}" data-unit="${t.unit}">${fmt(t)}</b>` +
            '</div>' +
            '<ul class="pf-statex">' +
              t.ex.map((e, j) => `<li data-j="${j}"><span>${esc(e.name)}</span><b>${esc(e.v)}</b></li>`).join('') +
            '</ul>' +
            `<span class="pf-statmore">${esc(t.more)}</span>` +
          '</li>',
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

/* one loaded spool inside a printer card: swatch, slot, grams left as a bar on a 1 kg scale, and what the
   queue leaves on it */
function spoolRow(data, s) {
  const verdict =
    s.state === 'short' ? `<em class="pf-sv pf-sv--short">${g0(s.short)} short</em>` :
    s.state === 'low' ? `<em class="pf-sv pf-sv--low">${g0(s.after)} spare</em>` :
    s.need ? `<em class="pf-sv">${g0(s.after)} spare</em>` : '<em class="pf-sv pf-sv--idle">not queued</em>';
  return (
    `<li class="pf-spool pf-spool--${s.state}">` +
      swatch(s) +
      `<span class="pf-sl">${esc(s.slot === 'Spool' ? '' : s.slot)}</span>` +
      `<span class="pf-sn"><b>${esc(s.mat)} ${esc(s.color)}</b><small>${esc(s.brand)}${s.need ? `, queue needs ${g0(s.need)}` : ''}</small></span>` +
      `<span class="pf-sg"><i class="pf-sgbar"><i style="--c:${esc(s.hex)}" data-w="${(s.pctLeft * 100).toFixed(2)}"></i>${s.need ? `<u style="left:${pct(Math.min(100, s.need / 10))}"></u>` : ''}</i><b>${g0(s.left)}</b></span>` +
      verdict +
    '</li>'
  );
}

/* the farm: every printer as its app reports it. The next printer to finish carries an empty .pf-pin after
   its badge: the anchor the kit's cursor rests on in beat 3, a 1 px box clear of the progress figures. */
function farmSection(data) {
  const { printers, copy, nextFinish: nx } = data;
  const card = (p, i) => {
    const photo = /\.jpe?g$/.test(p.img);
    const isNext = p.id === nx.id;
    // the next printer to finish trades its Printing chip for the violet badge and the cursor's pin
    const status = isNext
      ? '<span class="pf-nextb">Next to finish</span><span class="pf-pin"></span>'
      : p.status === 'printing'
        ? `<span class="pf-chip pf-chip--run"><span class="pf-dot"></span>Printing</span>`
        : `<span class="pf-chip pf-chip--done">${ico('circle-check')}Finished</span>`;
    return (
      `<article class="pf-card pf-card--${esc(p.id)}${p.spools.length > 1 ? ' pf-card--ams' : ''}${isNext ? ' pf-card--next' : ''}" data-r="${i}">` +
        '<div class="pf-ch">' +
          `<span class="pf-thumb${photo ? ' pf-thumb--photo' : ''}"><img src="${esc(p.img)}" alt=""></span>` +
          `<span class="pf-cn"><b>${esc(p.name)}</b><small>${esc(p.bay)}</small></span>` +
          srcTag(data, p.acct) +
          status +
        '</div>' +
        '<div class="pf-job">' +
          `<div class="pf-jobt"><b>${esc(p.job)}</b>${srcTag(data, p.jobSrc)}</div>` +
          `<div class="pf-prog${p.status === 'finished' ? ' pf-prog--done' : ''}"><i data-w="${p.pct}"></i></div>` +
          '<div class="pf-jobm">' +
            `<span class="pf-jp">${p.pct}%</span>` +
            `<span>${ico('layers')}Layer ${n0(p.layer[0])} of ${n0(p.layer[1])}</span>` +
            `<span>${ico('thermometer')}${p.nozzle}°C nozzle, ${p.bed}°C bed</span>` +
            (p.status === 'printing'
              ? `<span class="pf-eta">${ico('timer')}Done ${esc(p.eta)}, ${esc(p.leftText)} left</span>`
              : `<span class="pf-eta pf-eta--done">${ico('circle-check')}Finished ${esc(p.doneText)}, bed to clear</span>`) +
          '</div>' +
        '</div>' +
        `<div class="pf-unit"><span class="pf-unitk">${ico('disc')}${esc(p.unit)}</span><span class="pf-unitk pf-unitk--r">left, on a 1 kg spool</span></div>` +
        `<ul class="pf-spools">${p.spools.map((s) => spoolRow(data, s)).join('')}</ul>` +
      '</article>'
    );
  };
  return (
    '<section class="pf-farm">' +
      `<div class="pf-sech"><h2>${esc(copy.farmH)}</h2><span>${esc(copy.farmDek)}</span></div>` +
      `<div class="pf-grid">${printers.map(card).join('')}</div>` +
    '</section>'
  );
}

/* tab 1, Runs out first: every colour the queue empties, biggest shortfall first. Each bar is on a shared
   0 to 450 g axis: the solid part is what the spool holds, the hatched part what the queue still needs. */
const AXIS = 450;
function outPanel(data) {
  const { runsOut, copy, counts } = data;
  return (
    '<div class="pf-panel pf-panel--1">' +
      '<div class="pf-outhead"><span>#</span><span>Color</span><span>Holds against needs</span><span>Shortfall</span><span>Runs dry during</span></div>' +
      '<ol class="pf-outlist">' +
        runsOut.map((s, j) => {
          const have = Math.min(s.left, s.need);
          return (
            `<li class="pf-out pf-out--${s.state}" data-j="${j}">` +
              `<span class="pf-outr"><b>${j + 1}</b></span>` +
              `<span class="pf-outc">${swatch(s)}<span><b>${esc(s.mat)} ${esc(s.color)}</b><small>${esc(slotName(data, s))}, ${esc(s.brand)}</small></span></span>` +
              '<span class="pf-outbar">' +
                `<i class="pf-ob"><i class="pf-obh" style="--c:${esc(s.hex)}" data-w="${pct((have / AXIS) * 100)}"></i><i class="pf-obs" data-w="${pct((Math.max(0, s.need - s.left) / AXIS) * 100)}"></i></i>` +
                `<small>holds ${g0(s.left)}, queue needs ${g0(s.need)}</small>` +
              '</span>' +
              (s.state === 'short'
                ? `<b class="pf-outs">${g0(s.short)}</b>`
                : `<b class="pf-outs pf-outs--low">${g0(s.after)} spare</b>`) +
              `<span class="pf-outd">${s.dryDuring ? esc(s.dryDuring) : 'Finishes the queue, barely'}</span>` +
            '</li>'
          );
        }).join('') +
      '</ol>' +
      `<div class="pf-outfoot">${ico('triangle-alert')}<span>${esc(copy.outFoot)}</span><b>${g0(counts.shortGrams)}</b></div>` +
    '</div>'
  );
}

/* tab 2, Restock: what the click on the tab swaps in. Every colour, every store that lists it, the cheapest
   in-stock one flagged, and the cheapest total for the short colours under the cursor at the end. */
function restockPanel(data) {
  const { restock, copy, counts } = data;
  const offer = (o) => {
    const a = accOf(data, o.store);
    return (
      `<span class="pf-offer${o.best ? ' pf-offer--best' : ''}${o.stock === 'out' ? ' pf-offer--out' : ''}">` +
        `<img src="${esc(a.logo)}" alt="">` +
        `<span class="pf-offt"><b>${esc(a.short)}</b><small>${esc(o.note)}</small></span>` +
        `<b class="pf-offp">${money(o.price)}</b>` +
        (o.best ? '<span class="pf-cheap">Cheapest</span>' : '') +
      '</span>'
    );
  };
  return (
    '<div class="pf-panel pf-panel--2">' +
      '<ul class="pf-rslist">' +
        restock.map((r, j) =>
          `<li class="pf-rs pf-rs--${r.spool.state}" data-k="${j}">` +
            `<span class="pf-outc">${swatch(r.spool)}<span><b>${esc(r.spool.mat)} ${esc(r.spool.color)}</b><small>${r.spool.state === 'short' ? `${g0(r.spool.short)} short` : `runs low, ${g0(r.spool.after)} spare`}</small></span></span>` +
            `<span class="pf-offers">${r.offers.map(offer).join('')}</span>` +
          '</li>',
        ).join('') +
      '</ul>' +
      '<div class="pf-sum">' +
        `<div class="pf-total"><span>${ico('package')}${esc(copy.totalLabel)}</span><b data-t="${counts.restockTotal}">$0.00</b></div>` +
        `<p class="pf-sumn">${ico('lock')}${esc(copy.restockNote)}</p>` +
      '</div>' +
    '</div>'
  );
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/print-farm';
  return (
    '<footer class="pf-foot">' +
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
    farmSection(data) +
    '<section class="pf-panels">' +
      `<div class="pf-sech"><h2>${esc(data.copy.panelsH)}</h2><span>${esc(data.copy.panelsDek)}</span></div>` +
      outPanel(data) +
      restockPanel(data) +
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
  const og = outDone(p);
  const tl = restockDone(p);
  const data = fallback;
  const { counts, meta, accounts } = data;
  const nTicks = accounts.length + 1;

  const clock = root.querySelector('.pf-clock');
  if (clock) clock.textContent = clockText(meta.syncStart + meta.syncSecs * (0.6 * g + 0.4 * mg));

  const heroEl = root.querySelector('.pf-hero');
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
  const count = root.querySelector('.pf-synccount');
  if (count) count.textContent = `${n0(read)} of ${n0(counts.records)} records`;

  // the match: the queue's grams split into what the spools cover and what is short
  const k = ease(mg);
  const covered = counts.queueGrams - counts.shortGrams;
  const havenow = root.querySelector('.pf-havenow');
  if (havenow) havenow.textContent = g0(covered * k);
  const shortnow = root.querySelector('.pf-shortnow');
  if (shortnow) shortnow.textContent = g0(counts.shortGrams * k);
  const colsnow = root.querySelector('.pf-colsnow');
  if (colsnow) colsnow.textContent = n0(Math.round(counts.short * k));
  const bar = root.querySelector('.pf-mbar');
  if (bar) {
    const mh = bar.querySelector('.pf-mhave');
    const ms = bar.querySelector('.pf-mshort');
    if (mh) mh.style.width = pct((covered / counts.queueGrams) * 100 * k);
    if (ms) ms.style.width = pct((counts.shortGrams / counts.queueGrams) * 100 * k);
    bar.classList.toggle('is-matched', mg >= 0.999);
  }

  // the status strip: the four counters ease in, then the example rows land one after another
  for (const b of root.querySelectorAll('[data-g]')) {
    const target = Number(b.dataset.g);
    const unit = b.dataset.unit;
    const e = ease(gw);
    b.textContent = unit === 'money' ? money(Math.round(target * e * 100) / 100)
      : unit ? `${n0(Math.round(target * e))} ${unit}` : n0(Math.round(target * e));
  }
  for (const li of root.querySelectorAll('.pf-statex li')) {
    const j = Number(li.dataset.j) || 0;
    li.style.opacity = (0.15 + 0.85 * ease(clamp01((gw - j * 0.2) / 0.6))).toFixed(3);
  }

  // the farm: the five cards settle in turn, each card's progress and gram bars filling as it lands
  for (const c of root.querySelectorAll('.pf-card')) {
    const i = Number(c.dataset.r) || 0;
    const kk = ease(clamp01((rw - i * 0.08) / 0.6));
    c.style.opacity = (0.2 + 0.8 * kk).toFixed(3);
    c.style.transform = `translateY(${((1 - kk) * 10).toFixed(2)}px)`;
    for (const b of c.querySelectorAll('[data-w]')) b.style.width = pct(Number(b.dataset.w) * kk);
  }

  // runs out first: each colour's held and missing grams grow along the shared axis
  for (const r of root.querySelectorAll('.pf-out')) {
    const j = Number(r.dataset.j) || 0;
    const kk = ease(clamp01((og - j * 0.1) / 0.55));
    r.style.opacity = (0.25 + 0.75 * kk).toFixed(3);
    for (const b of r.querySelectorAll('[data-w]')) b.style.width = pct(parseFloat(b.dataset.w) * kk);
  }

  // restock: the offers land row by row and the cheapest total counts in under the cursor
  for (const r of root.querySelectorAll('.pf-rs')) {
    const j = Number(r.dataset.k) || 0;
    r.style.opacity = (0.25 + 0.75 * ease(clamp01((tl - j * 0.08) / 0.5))).toFixed(3);
  }
  for (const b of root.querySelectorAll('[data-t]')) b.textContent = money(Math.round(Number(b.dataset.t) * ease(tl) * 100) / 100);
  const total = root.querySelector('.pf-total');
  if (total) total.style.opacity = (0.3 + 0.7 * ease(clamp01((tl - 0.25) / 0.6))).toFixed(3);

  const fill = root.querySelector('.pf-syncfill');
  if (fill) fill.style.width = pct(100 * (0.6 * g + 0.4 * mg));
}
