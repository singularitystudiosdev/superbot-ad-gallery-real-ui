/* site.js - the generated frontend: superbot.app/p/watchlist, "Watchlist".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the fold counters, the Leaving tile, the Past Lives poster and
   the Disney+ subscription row, and .is-active on the Subscriptions tab; all are styled in site.css. The tab
   click swaps the By service panel for the subscriptions panel through a :has() + sibling rule, so no JS runs
   on the click. The only clock-driven output is render(root, p): the top bar clock, the sync card ticking
   through the eight sources, the fold beat (283 entries collapsing to 214 titles and 1,070 checks, see
   SYNC_A/SYNC_B/MERGE_A/MERGE_B), the four outcome counters easing in (GROW_A/GROW_B), the nine posters
   settling (ROOM_A/ROOM_B) and the sync bar, all pure functions of the beat's progress.
   Read-only: every word the page prints says what Superbot found, never that it added, rated, removed,
   cancelled or changed anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';
const usd = (n) => '$' + Number(n).toFixed(2);

/** seconds since midnight -> "9:12:36 PM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the sync beat inside the browser scene: the eight sources are read from SYNC_A to SYNC_B of p (while the
   page grows out of the hub card) and the 283 entries fold into 214 titles and 1,070 checks from MERGE_A to
   MERGE_B, both inside the first scroll hold in ad.js (f 0.13 to 0.3, p 0.213 to 0.367), so the finished
   283 / 214 / 1,070 card holds on screen before the page moves on and stays final for the rest of the spot */
const SYNC_A = 0;
const SYNC_B = 0.17;
const MERGE_A = 0.165;
const MERGE_B = 0.285;
/* the status strip is the second hold (ad.js f 0.355 to 0.52, p 0.416 to 0.566): its counters start easing
   in as it scrolls up, finish at 116 / 9 / 61 / 2 just after it lands (f 0.38) and then hold settled with the
   cursor on the Leaving tile before the scroll leaves */
const GROW_A = 0.36;
const GROW_B = 0.44;
/* the poster grid is the third hold (f 0.575 to 0.66, p 0.615 to 0.692): the nine posters settle in turn
   while it scrolls in (from f 0.52, p 0.566) and are all still by the time it lands */
const ROOM_A = 0.535;
const ROOM_B = 0.61;

export function syncDone(p) {
  return clamp01((p - SYNC_A) / (SYNC_B - SYNC_A));
}

export function mergeDone(p) {
  return clamp01((p - MERGE_A) / (MERGE_B - MERGE_A));
}

export function growDone(p) {
  return clamp01((p - GROW_A) / (GROW_B - GROW_A));
}

export function roomDone(p) {
  return clamp01((p - ROOM_A) / (ROOM_B - ROOM_A));
}

/* the sync card: tick i counts from 0 to its number over its own window, so the eight sources land one after
   another and the ninth tick (the watchlist) closes the card at g = 1 (8 * step + len = 1): each tick counts
   over 0.2 of g and the next starts 0.1 of g later, so two numbers are always moving at once and the last
   source tick lands at g 0.9 */
const TICK_STEP = 0.1;
const TICK_LEN = 0.2;
const tickDone = (g, i) => ease(clamp01((g - i * TICK_STEP) / TICK_LEN));

/* lucide icons (ISC), inlined as path data */
const ICONS = {
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'calendar-days': '<path d="M8 2v4m8-4v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  hourglass: '<path d="M5 22h14M5 2h14m-2 20v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  merge: '<path d="m8 6l4-4l4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22m16 0l-5-5"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m16 9l-5.5 5.5L8 12"/>',
  play: '<path d="M6 3l14 9l-14 9z"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2m0 10v2m0-8v2"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18m0-13.5h4m-4 9h4"/>',
  tv: '<rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><path d="m17 2l-5 5l-5-5"/>',
  'list-video': '<path d="M12 12H3m13-6H3m9 12H3m13-6l5 3l-5 3z"/>',
};

const ico = (name) =>
  `<svg class="wl-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const accOf = (data, id) => data.accounts.find((a) => a.id === id) || data.accounts[0];

/* a service tag: the service's mark plus its short name */
const appTag = (data, id) => {
  const a = accOf(data, id);
  return `<span class="wl-ltag"><img src="${esc(a.logo)}" alt="">${esc(a.short)}</span>`;
};

/* the four outcomes and the words and chips they print with */
const KIND = {
  stream: { icon: 'play', word: 'Streaming' },
  leaving: { icon: 'hourglass', word: 'Leaving' },
  rent: { icon: 'ticket', word: 'Rent or buy' },
  none: { icon: 'tv', word: 'Not on your plans' },
};

function topBar(data) {
  const { counts, meta, accounts } = data;
  return (
    '<header class="wl-top">' +
      '<div class="wl-topin">' +
        '<span class="wl-brand"><img class="wl-brandico" src="./brand/app.svg" alt=""><b>Watchlist</b><span class="wl-by">by Superbot</span></span>' +
        '<nav class="wl-tabs">' +
          `<span class="wl-tab wl-tab--1">${ico('list-video')}By service <i>${n0(counts.titles)}</i></span>` +
          `<span class="wl-tab wl-tab--2">${ico('wallet')}Subscriptions <i>${n0(counts.services)}</i></span>` +
        '</nav>' +
        '<div class="wl-status">' +
          '<span class="wl-logs">' +
            accounts.map((a) => `<img src="${esc(a.logo)}" alt="">`).join('') +
            `${ico('lock')}Read-only` +
          '</span>' +
          `<span class="wl-live"><span class="wl-dot"></span><span class="wl-clock">${esc(clockText(meta.syncStart))}</span></span>` +
        '</div>' +
      '</div>' +
      '<div class="wl-syncbar"><span class="wl-syncfill"></span></div>' +
    '</header>'
  );
}

function syncCard(data) {
  const { accounts, counts, meta } = data;
  const ticks = accounts.map((a, i) =>
    `<li class="wl-tick wl-tick--s${i + 1}"><img src="${esc(a.logo)}" alt=""><span>${esc(a.short)}</span>` +
      `<b data-n="${a.pulled}" data-i="${i}">0</b><span class="wl-tickok">${ico('check')}</span></li>`,
  );
  const last = accounts.length;
  ticks.push(
    `<li class="wl-tick wl-tick--s${last + 1} wl-tick--rooms"><span class="wl-tickico">${ico('film')}</span><span>Built one watchlist: streaming, leaving, rent or buy</span>` +
      `<b data-n="${counts.titles}" data-i="${last}">0</b><span class="wl-tickok">${ico('check')}</span></li>`,
  );
  return (
    '<div class="wl-sync">' +
      '<div class="wl-synchead">' +
        `<span class="wl-syncnow">${ico('refresh-cw')}Reading ${counts.sources} sources, read-only<span class="wl-synccount">0 of ${n0(counts.rows)} rows</span></span>` +
        `<span class="wl-stamp">${ico('circle-check')}Synced ${esc(meta.day)}, ${esc(meta.synced.replace(/^\w+ /, ''))}. Nothing added, rated or changed.</span>` +
      '</div>' +
      `<ul class="wl-ticks">${ticks.join('')}</ul>` +
      '<div class="wl-merge">' +
        '<div class="wl-mbar"><span class="wl-mun"></span><span class="wl-mdup"></span></div>' +
        '<div class="wl-mrow">' +
          `<span class="wl-mk"><b class="wl-pulled">${n0(counts.entries)}</b>watchlist entries</span>` +
          `<span class="wl-mk wl-mk--dup"><b class="wl-dupnow">0</b>duplicates folded</span>` +
          `<span class="wl-mk wl-mk--uniq"><b class="wl-uniqnow">${n0(counts.entries)}</b>distinct titles</span>` +
          `<span class="wl-mk wl-mk--chk"><b class="wl-chknow">0</b>service checks</span>` +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function homeCard(data) {
  const { meta, counts } = data;
  const streamPct = (counts.streaming / counts.titles) * 100;
  const rentPct = (counts.rent / counts.titles) * 100;
  return (
    '<aside class="wl-home">' +
      `<span class="wl-homek">${ico('film')}${esc(meta.region)} catalog, ${esc(meta.day)}</span>` +
      `<h2>${esc(meta.user)}'s watchlist</h2>` +
      `<p class="wl-homeday">${ico('tv')}${counts.lists} lists, ${counts.services} services, ${usd(counts.monthly)}/mo</p>` +
      '<ul class="wl-homefacts">' +
        `<li><small>Distinct titles</small><b>${n0(counts.titles)}</b></li>` +
        `<li><small>Service checks</small><b>${n0(counts.checks)}</b></li>` +
        `<li><small>Streaming now</small><b>${n0(counts.streaming)}</b></li>` +
        `<li><small>Leaving by ${esc(meta.cutoff)}</small><b>${n0(counts.leaving)}</b></li>` +
      '</ul>' +
      '<div class="wl-health">' +
        `<div class="wl-healthh">${ico('shield-check')}Plan check</div>` +
        '<div class="wl-healthrow">' +
          `<span><b>${n0(counts.streaming)}</b>on your plans</span>` +
          `<span class="wl-hr--rent"><b>${n0(counts.rent)}</b>rent or buy</span>` +
          `<span class="wl-hr--none"><b>${n0(counts.none)}</b>elsewhere</span>` +
        '</div>' +
        `<div class="wl-healthbar"><i style="width:${pct(streamPct)}"></i><i class="wl-hb--rent" style="width:${pct(rentPct)}"></i></div>` +
        `<p class="wl-healthn">${ico('lock')}Read-only. Nothing was added, rated, removed or cancelled.</p>` +
      '</div>' +
    '</aside>'
  );
}

function hero(data) {
  const { copy, counts } = data;
  return (
    '<section class="wl-hero">' +
      '<img class="wl-herobg" src="./img/hero.jpg" alt="">' +
      '<div class="wl-heroin">' +
        '<div class="wl-herot">' +
          `<span class="wl-kicker">${ico('film')}${esc(copy.kicker)}</span>` +
          `<h1>${esc(copy.heroH1)}</h1>` +
          `<p class="wl-dek">${esc(copy.heroDek)}</p>` +
          syncCard(data) +
          '<ul class="wl-stats">' +
            `<li><b>${n0(counts.titles)}</b><span>distinct titles</span></li>` +
            `<li><b>${n0(counts.checks)}</b><span>service checks</span></li>` +
            `<li class="wl-stat--ok"><b>${n0(counts.streaming)}</b><span>streaming now</span></li>` +
            `<li class="wl-stat--iv"><b>${n0(counts.leaving)}</b><span>leaving by ${esc(data.meta.cutoff)}</span></li>` +
          '</ul>' +
        '</div>' +
        homeCard(data) +
      '</div>' +
    '</section>'
  );
}

/* the eight sources: what each gave the watchlist */
function accStrip(data) {
  const { accounts } = data;
  return (
    '<section class="wl-accs"><ul class="wl-acclist">' +
      accounts.map((a) =>
        `<li class="wl-acc wl-acc--${esc(a.id)}">` +
          `<img src="${esc(a.logo)}" alt="">` +
          `<span class="wl-acc-t"><b>${esc(a.name)}</b><small>${esc(a.kind === 'list' ? a.handle : a.plan)}</small></span>` +
          `<span class="wl-acc-v"><b>${n0(a.pulled)}</b><small>${a.kind === 'list' ? 'entries read' : `checked, <em>${n0(a.carries)} on it</em>`}</small></span>` +
          `<span class="wl-acc-ok">${ico('check')}</span>` +
        '</li>',
      ).join('') +
    '</ul></section>'
  );
}

function flagsSection(data) {
  const { flags, copy } = data;
  return (
    '<section class="wl-flags">' +
      `<div class="wl-sech"><h2>${esc(copy.flagsH)}</h2><span>${esc(copy.flagsDek)}</span></div>` +
      '<ul class="wl-flaglist">' +
        flags.map((f) =>
          `<li class="wl-flag wl-flag--${esc(f.kind)}">` +
            '<div class="wl-flagh">' +
              `<span class="wl-flagi">${ico(f.icon)}</span>` +
              `<span class="wl-flagt"><b>${esc(f.label)}</b><small>${esc(f.rule)}</small></span>` +
              `<b class="wl-flagn" data-g="${f.n}">${n0(f.n)}</b>` +
            '</div>' +
            '<ul class="wl-flagex">' +
              f.examples.map((e, j) => `<li data-j="${j}"><span>${esc(e.name)}</span><b>${esc(e.v)}</b></li>`).join('') +
            '</ul>' +
            `<span class="wl-flagmore">${esc(f.more)}</span>` +
          '</li>',
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

/* the poster grid: nine of the titles with the poster the services show, and where each one stands tonight */
function shelfSection(data) {
  const { shelf, copy } = data;
  const chip = (kind) => `<span class="wl-chip wl-chip--${kind}">${ico(KIND[kind].icon)}<em>${KIND[kind].word}</em></span>`;
  return (
    '<section class="wl-shelf">' +
      `<div class="wl-sech"><h2>${esc(copy.shelfH)}</h2><span>${esc(copy.shelfDek)}</span></div>` +
      '<ul class="wl-posters">' +
        shelf.map((b, i) =>
          `<li class="wl-poster wl-poster--${esc(b.key)} wl-poster--${esc(b.kind)}" data-r="${i}">` +
            '<div class="wl-pimg">' +
              `<img src="${esc(b.poster)}" alt="">` +
              (b.kind === 'leaving' ? `<span class="wl-leave">${ico('hourglass')}${esc(b.note)}</span>` : '') +
              (b.at ? `<img class="wl-pmark" src="${esc(accOf(data, b.at).logo)}" alt="">` : '') +
            '</div>' +
            `<span class="wl-pt"><b>${esc(b.title)}</b><small>${b.year} · ${esc(b.type)}</small></span>` +
            `<span class="wl-pf">${chip(b.kind)}<span class="wl-pfig">${esc(b.figure)}</span></span>` +
          '</li>',
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

/* tab 1, By service: every one of the titles lands in exactly one group */
function servicePanel(data) {
  const { groups, counts, copy } = data;
  const max = Math.max(...groups.map((g) => g.n));
  return (
    '<div class="wl-panel wl-panel--1">' +
      `<div class="wl-sech"><h2>${esc(copy.byServiceH)}</h2><span>${esc(copy.byServiceDek)}</span></div>` +
      '<div class="wl-table">' +
        groups.map((g) =>
          `<div class="wl-grp wl-grp--${esc(g.id)}">` +
            `<span class="wl-gname"><img src="${esc(g.logo)}" alt=""><span><b>${esc(g.name)}</b><small>${esc(g.note)}</small></span></span>` +
            `<span class="wl-gn"><b>${n0(g.n)}</b><small>titles</small></span>` +
            `<span class="wl-gbar"><i style="width:${pct((g.n / max) * 100)}"></i></span>` +
            `<span class="wl-gtitles">${g.titles.map((t) => `<em>${esc(t)}</em>`).join('')}<em class="wl-gmore">+${n0(g.n - g.titles.length)}</em></span>` +
          '</div>',
        ).join('') +
        `<div class="wl-more">${ico('merge')}${esc(copy.byServiceNote)}</div>` +
      '</div>' +
    '</div>'
  );
}

/* tab 2, Subscriptions: what the click on the tab swaps in, each plan against the list */
function subsPanel(data) {
  const { subs, counts, copy } = data;
  return (
    '<div class="wl-panel wl-panel--2">' +
      `<div class="wl-sech"><h2>${esc(copy.subsH)}</h2><span>${esc(copy.subsDek)}</span></div>` +
      '<div class="wl-table">' +
        '<div class="wl-srow wl-srow--h"><span>Subscription</span><span>On your list</span><span>Only here</span><span>Monthly</span><span>What we found</span></div>' +
        subs.map((s) =>
          `<div class="wl-srow wl-srow--${esc(s.id)}${s.idle ? ' wl-srow--idle' : ''}">` +
            `<span class="wl-sname"><img src="${esc(s.logo)}" alt=""><span><b>${esc(s.name)}</b><small>${esc(s.plan)}</small></span></span>` +
            `<span class="wl-snum">${n0(s.carries)}</span>` +
            `<span class="wl-snum wl-sonly">${n0(s.only)}</span>` +
            `<span class="wl-sprice">${usd(s.price)}</span>` +
            `<span class="wl-sfound">${s.idle ? `<span class="wl-echip">${ico('wallet')}Idle</span>` : `<span class="wl-echip wl-echip--ok">${ico('circle-check')}In use</span>`}<em>${esc(s.reason)}</em></span>` +
          '</div>',
        ).join('') +
        `<div class="wl-more wl-more--sum">${ico('wallet')}<span>${esc(copy.subsNote)}</span><b>${usd(counts.idleMonthly)}/mo</b></div>` +
      '</div>' +
      `<p class="wl-autosum">${ico('lock')}<span>${esc(copy.subsFoot)}</span></p>` +
    '</div>'
  );
}

/* the nine titles that leave their service by the cutoff */
function leavingSection(data) {
  const { leaving, copy } = data;
  return (
    '<section class="wl-watch">' +
      `<div class="wl-sech"><h2>${esc(copy.leavingH)}</h2><span>${esc(copy.leavingDek)}</span></div>` +
      '<ul class="wl-wlist">' +
        leaving.map((l) =>
          `<li class="wl-w"><span class="wl-wi">${ico('calendar-days')}</span><span class="wl-wt"><small>${esc(l.date)}</small><b>${esc(l.title)}</b><em>${l.year}</em></span>${appTag(data, l.at)}</li>`,
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/watchlist';
  return (
    '<footer class="wl-foot">' +
      `<span>${ico('lock')}Made by Superbot for ${esc(data.meta.user)}. Read-only access to Letterboxd, IMDb, Trakt and five streaming services.</span>` +
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
    accStrip(data) +
    flagsSection(data) +
    shelfSection(data) +
    '<section class="wl-panels">' +
      servicePanel(data) +
      subsPanel(data) +
    '</section>' +
    leavingSection(data) +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

export function render(root, p) {
  if (!root || !root.querySelector) return;
  const g = syncDone(p);
  const mg = mergeDone(p);
  const gw = growDone(p);
  const rw = roomDone(p);
  const data = fallback;
  const { counts, meta } = data;

  const clock = root.querySelector('.wl-clock');
  if (clock) clock.textContent = clockText(meta.syncStart + meta.syncSecs * (0.6 * g + 0.4 * mg));

  const heroEl = root.querySelector('.wl-hero');
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
  const count = root.querySelector('.wl-synccount');
  if (count) count.textContent = `${n0(read)} of ${n0(counts.rows)} rows`;

  // the fold: the bar starts as all 283 entries, the amber band of duplicates shrinks to nothing
  const k = ease(mg);
  const bar = root.querySelector('.wl-mbar');
  if (bar) {
    const mun = bar.querySelector('.wl-mun');
    const mdup = bar.querySelector('.wl-mdup');
    if (mun) mun.style.width = pct((counts.titles / counts.entries) * 100);
    if (mdup) mdup.style.width = pct(((counts.dupes * (1 - k)) / counts.entries) * 100);
    bar.classList.toggle('is-merged', mg >= 0.999);
  }
  const dupnow = root.querySelector('.wl-dupnow');
  if (dupnow) dupnow.textContent = n0(Math.round(counts.dupes * k));
  const uniqnow = root.querySelector('.wl-uniqnow');
  if (uniqnow) uniqnow.textContent = n0(Math.round(counts.entries - counts.dupes * k));
  const chknow = root.querySelector('.wl-chknow');
  if (chknow) chknow.textContent = n0(Math.round(counts.checks * k));

  // the flags strip: the four counters ease in, then the example rows land one after another
  for (const b of root.querySelectorAll('[data-g]')) b.textContent = n0(Math.round(Number(b.dataset.g) * ease(gw)));
  for (const li of root.querySelectorAll('.wl-flagex li')) {
    const j = Number(li.dataset.j) || 0;
    li.style.opacity = (0.15 + 0.85 * ease(clamp01((gw - j * 0.2) / 0.6))).toFixed(3);
  }

  // the poster grid: nine posters settle in turn
  for (const card of root.querySelectorAll('.wl-poster')) {
    const i = Number(card.dataset.r) || 0;
    const kk = ease(clamp01((rw - i * 0.06) / 0.52));
    card.style.opacity = (0.2 + 0.8 * kk).toFixed(3);
    card.style.transform = `translateY(${((1 - kk) * 12).toFixed(2)}px)`;
  }

  const fill = root.querySelector('.wl-syncfill');
  if (fill) fill.style.width = pct(100 * (0.6 * g + 0.4 * mg));
}
