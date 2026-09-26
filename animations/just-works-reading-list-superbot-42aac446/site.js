/* site.js - the generated frontend: superbot.app/p/reading-list, "Reading list".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the merge counters, the Already on hold tile, The God of the
   Woods card and the "The Creative Act" loan row, and .is-active on the Loans tab; all are styled in
   site.css. The tab click swaps the hold queue for the loans panel through a :has() + sibling rule, so no
   JS runs on the click. The only clock-driven output is render(root, p): the top bar clock, the sync card
   ticking through the five sources, the merge beat (420 lines collapsing to 48 titles, see SYNC_A/SYNC_B/
   MERGE_A/MERGE_B), the four outcome counters easing in (GROW_A/GROW_B), the nine shelf cards settling
   (ROOM_A/ROOM_B) and the sync bar, all pure functions of the beat's progress.
   Read-only: every word the page prints says what Superbot found, never that it borrowed, held, renewed or
   returned anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';

/** seconds since midnight -> "8:41:36 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the sync beat inside the browser scene: the five sources are read from SYNC_A to SYNC_B of p (while the
   page grows out of the hub card) and the availability checks and owned books merge onto a want-to-read
   title from MERGE_A to MERGE_B, both inside the first scroll hold in ad.js (f 0.13 to 0.3, p 0.213 to
   0.367), so the finished 420 / 372 / 48 card holds on screen before the page moves on and stays final for
   the rest of the spot. SYNC_B is set so the last of the five source ticks lands at p 0.143 (t 1.50 s), at
   the end of the beat's first ~1.5 s, and the merge follows at MERGE_A/MERGE_B. Those two are unchanged, so
   the strip (p 0.36), the grid (p 0.535) and the tab click (f 0.74) all keep their times */
const SYNC_A = 0;
const SYNC_B = 0.17;
const MERGE_A = 0.165;
const MERGE_B = 0.285;
/* the status strip is the second hold (ad.js f 0.355 to 0.52, p 0.416 to 0.566): its counters start easing
   in as it scrolls up (from f 0.3, p 0.367), finish at 8 / 14 / 3 / 9 just after it lands (f 0.38) and then
   hold settled about 1.3 s with the cursor on the Already on hold tile before the scroll leaves */
const GROW_A = 0.36;
const GROW_B = 0.44;
/* the shelf grid is the third hold (f 0.575 to 0.66, p 0.615 to 0.692): the nine cards settle in turn while
   it scrolls in (from f 0.52, p 0.566) and are all still by the time it lands (f 0.575, p 0.615) */
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

/* the sync card: tick i counts from 0 to its number over its own window, so the five sources land one after
   another and the sixth tick (the reading overview) closes the card at g = 1. The step is as wide as the
   card's 1.0 of g allows while the overview tick still lands at g 1 (5 * step + len = 1): each tick counts
   over 0.2 of g (0.36 s) and the next starts 0.16 of g (0.29 s) later, so the next number is visibly into
   its count before the one before it settles, and the last source tick lands at g 0.84 (p 0.143, t 1.50 s) */
const TICK_STEP = 0.16;
const TICK_LEN = 0.2;
const tickDone = (g, i) => ease(clamp01((g - i * TICK_STEP) / TICK_LEN));

/* lucide icons (ISC), inlined as path data */
const ICONS = {
  list: '<path d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4m2-2h-4"/>',
  'calendar-check': '<path d="M8 2v4m8-4v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M9 16l2 2l4-4"/>',
  'calendar-days': '<path d="M8 2v4m8-4v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  hourglass: '<path d="M5 22h14M5 2h14m-2 20v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  'external-link': '<path d="M15 3h6v6m-11 5L21 3m-3 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  merge: '<path d="m8 6l4-4l4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22m16 0l-5-5"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m16 9l-5.5 5.5L8 12"/>',
  bookmark: '<path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/>',
  'book-open': '<path d="M12 5v16m8.001-2A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2a5 5 0 0 1 4-2z"/>',
  library: '<path d="m16 6l4 14M12 6v14M8 8v12M4 4v16"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
};

const ico = (name) =>
  `<svg class="rl-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const accOf = (data, id) => data.accounts.find((a) => a.id === id) || data.accounts[0];

/* a card tag: the library's mark plus its short name */
const appTag = (data, id) => {
  const a = accOf(data, id);
  return `<span class="rl-ltag"><img src="${esc(a.logo)}" alt="">${esc(a.short)}</span>`;
};

/* the four outcomes and the words and chips they print with */
const KIND = {
  available: { icon: 'circle-check', word: 'Borrow now' },
  hold: { icon: 'hourglass', word: 'On hold' },
  owned: { icon: 'bookmark', word: 'Owned' },
  waitlist: { icon: 'library', word: 'Waitlist' },
};

function topBar(data) {
  const { counts, meta, accounts } = data;
  // both library cards share the neutral Libby glyph, so it is printed once
  const logos = accounts.filter((a, i) => accounts.findIndex((b) => b.logo === a.logo) === i);
  return (
    '<header class="rl-top">' +
      '<div class="rl-topin">' +
        '<span class="rl-brand"><img class="rl-brandico" src="./brand/app.svg" alt=""><b>Reading list</b><span class="rl-by">by Superbot</span></span>' +
        '<nav class="rl-tabs">' +
          `<span class="rl-tab rl-tab--1">${ico('list')}Want to read <i>${n0(counts.titles)}</i></span>` +
          `<span class="rl-tab rl-tab--2">${ico('book-open')}Loans <i>${n0(counts.loans)}</i></span>` +
        '</nav>' +
        '<div class="rl-status">' +
          '<span class="rl-logs">' +
            logos.map((a) => `<img src="${esc(a.logo)}" alt="">`).join('') +
            `${ico('lock')}Read-only` +
          '</span>' +
          `<span class="rl-live"><span class="rl-dot"></span><span class="rl-clock">${esc(clockText(meta.syncStart))}</span></span>` +
        '</div>' +
      '</div>' +
      '<div class="rl-syncbar"><span class="rl-syncfill"></span></div>' +
    '</header>'
  );
}

function syncCard(data) {
  const { accounts, counts, meta } = data;
  const ticks = accounts.map((a, i) =>
    `<li class="rl-tick rl-tick--s${i + 1}"><img src="${esc(a.logo)}" alt=""><span>${esc(a.short)}</span>` +
      `<b data-n="${a.pulled}" data-i="${i}">0</b><span class="rl-tickok">${ico('check')}</span></li>`,
  );
  const last = accounts.length;
  ticks.push(
    `<li class="rl-tick rl-tick--s${last + 1} rl-tick--rooms"><span class="rl-tickico">${ico('book-open')}</span><span>Built one reading overview: available, on hold, owned</span>` +
      `<b data-n="${counts.rows}" data-i="${last}">0</b><span class="rl-tickok">${ico('check')}</span></li>`,
  );
  return (
    '<div class="rl-sync">' +
      '<div class="rl-synchead">' +
        `<span class="rl-syncnow">${ico('refresh-cw')}Reading ${counts.sources} sources, read-only<span class="rl-synccount">0 of ${n0(counts.pulled)} entries</span></span>` +
        `<span class="rl-stamp">${ico('circle-check')}Synced ${esc(meta.day)}, ${esc(meta.synced)}. Nothing borrowed, held or returned.</span>` +
      '</div>' +
      `<ul class="rl-ticks">${ticks.join('')}</ul>` +
      '<div class="rl-merge">' +
        '<div class="rl-mbar"><span class="rl-mun"></span><span class="rl-mdup"></span></div>' +
        '<div class="rl-mrow">' +
          `<span class="rl-mk"><b class="rl-pulled">${n0(counts.pulled)}</b>lines read</span>` +
          `<span class="rl-mk rl-mk--dup"><b class="rl-dupnow">0</b>checks and owned books merged</span>` +
          `<span class="rl-mk rl-mk--uniq"><b class="rl-uniqnow">${n0(counts.pulled)}</b>want-to-read titles</span>` +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function homeCard(data) {
  const { meta, counts } = data;
  const decidedPct = (counts.decided / counts.titles) * 100;
  return (
    '<aside class="rl-home">' +
      `<span class="rl-homek">${ico('map-pin')}${esc(meta.city)}</span>` +
      `<h2>${esc(meta.person)}</h2>` +
      `<p class="rl-homeday">${ico('library')}Reading across ${esc(meta.cards)}</p>` +
      '<ul class="rl-homefacts">' +
        `<li><small>Want to read</small><b>${n0(counts.titles)}</b></li>` +
        `<li><small>Availability checks</small><b>${n0(counts.checks)}</b></li>` +
        `<li><small>On hold</small><b>${n0(counts.hold)}</b></li>` +
        `<li><small>Due this week</small><b>${n0(counts.dueThisWeek)}</b></li>` +
      '</ul>' +
      '<div class="rl-health">' +
        `<div class="rl-healthh">${ico('shield-check')}Shelf check</div>` +
        '<div class="rl-healthrow">' +
          `<span><b>${n0(counts.available)}</b>ready now</span>` +
          `<span class="rl-hr--bad"><b>${n0(counts.hold)}</b>on hold</span>` +
          `<span class="rl-hr--owned"><b>${n0(counts.owned)}</b>already owned</span>` +
        '</div>' +
        `<div class="rl-healthbar"><i style="width:${pct(decidedPct)}"></i></div>` +
        `<p class="rl-healthn">${ico('lock')}Read-only. No book was borrowed, held, renewed or returned.</p>` +
      '</div>' +
    '</aside>'
  );
}

function hero(data) {
  const { copy, counts } = data;
  return (
    '<section class="rl-hero">' +
      '<img class="rl-herobg" src="./img/hero.jpg" alt="">' +
      '<div class="rl-heroin">' +
        '<div class="rl-herot">' +
          `<span class="rl-kicker">${ico('book-open')}${esc(copy.kicker)}</span>` +
          `<h1>${esc(copy.heroH1)}</h1>` +
          `<p class="rl-dek">${esc(copy.heroDek)}</p>` +
          syncCard(data) +
          '<ul class="rl-stats">' +
            `<li><b>${n0(counts.titles)}</b><span>want-to-read titles</span></li>` +
            `<li><b>${n0(counts.checks)}</b><span>availability checks</span></li>` +
            `<li class="rl-stat--iv"><b>${n0(counts.hold)}</b><span>already on hold</span></li>` +
            `<li class="rl-stat--ok"><b>${n0(counts.available)}</b><span>ready to borrow</span></li>` +
          '</ul>' +
        '</div>' +
        homeCard(data) +
      '</div>' +
    '</section>'
  );
}

/* the five sources: what each listed, and what it gave the reading overview */
function accStrip(data) {
  const { accounts } = data;
  return (
    '<section class="rl-accs"><ul class="rl-acclist">' +
      accounts.map((a) => {
        const note = a.note;
        return (
          `<li class="rl-acc rl-acc--${esc(a.id)}">` +
            `<img src="${esc(a.logo)}" alt="">` +
            `<span class="rl-acc-t"><b>${esc(a.name)}</b><small>${esc(a.handle)}</small></span>` +
            `<span class="rl-acc-v"><b>${n0(a.pulled)}</b><small>${esc(a.what)} read, <em>${n0(a.kept)} matched</em></small></span>` +
            `<span class="rl-acc-n">${esc(note)}</span>` +
            `<span class="rl-acc-ok">${ico('check')}</span>` +
          '</li>'
        );
      }).join('') +
    '</ul></section>'
  );
}

function flagsSection(data) {
  const { flags, copy } = data;
  return (
    '<section class="rl-flags">' +
      `<div class="rl-sech"><h2>${esc(copy.flagsH)}</h2><span>${esc(copy.flagsDek)}</span></div>` +
      '<ul class="rl-flaglist">' +
        flags.map((f) =>
          `<li class="rl-flag rl-flag--${esc(f.kind)}">` +
            '<div class="rl-flagh">' +
              `<span class="rl-flagi">${ico(f.icon)}</span>` +
              `<span class="rl-flagt"><b>${esc(f.label)}</b><small>${esc(f.rule)}</small></span>` +
              `<b class="rl-flagn" data-g="${f.n}">${n0(f.n)}</b>` +
            '</div>' +
            '<ul class="rl-flagex">' +
              f.examples.map((e, j) => `<li data-j="${j}"><span>${esc(e.name)}</span><b>${esc(e.v)}</b></li>`).join('') +
            '</ul>' +
            `<span class="rl-flagmore">${f.n > f.examples.length ? `and ${n0(f.n - f.examples.length)} more` : 'That is all of them'}</span>` +
          '</li>',
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

/* the shelf grid: nine want-to-read titles with the cover the library shows, and where each one stands */
function shelfSection(data) {
  const { shelf, copy } = data;
  const chip = (kind) => `<span class="rl-chip rl-chip--${kind}">${ico(KIND[kind].icon)}<em>${KIND[kind].word}</em></span>`;
  const size = (k) => (k === 'available' ? 'no wait' : k === 'owned' ? 'Kindle or Audible' : k === 'hold' ? 'in line' : 'not joined');
  /* the big figure on a card: the place in line, or the wait the catalog quotes for a title not joined */
  const figure = (b) => b.figure;
  return (
    '<section class="rl-rooms">' +
      `<div class="rl-sech"><h2>${esc(copy.roomsH)}</h2><span>${esc(copy.roomsDek)}</span></div>` +
      '<ul class="rl-roomlist">' +
        shelf.map((b, i) => {
          const big = figure(b);
          return (
            `<li class="rl-room rl-room--${esc(b.key)}" data-r="${i}">` +
              '<div class="rl-roomh">' +
                `<img class="rl-cover" src="${esc(b.cover)}" alt="">` +
                `<span class="rl-roomt"><b>${esc(b.title)}</b><small>${esc(b.author)}</small></span>` +
                `<span class="rl-roomn"><b>${esc(big)}</b><small>${esc(size(b.kind))}</small></span>` +
              '</div>' +
              '<div class="rl-roomf">' +
                `<span class="rl-chips">${chip(b.kind)}<span class="rl-chip rl-chip--open"><em>${esc(b.note)}</em></span></span>` +
                `<span class="rl-roomapps"><img src="./brand/book.svg" alt=""></span>` +
              '</div>' +
            '</li>'
          );
        }).join('') +
      '</ul>' +
    '</section>'
  );
}

/* the hold queue: one row per hold, place in line, copies and the estimated wait at the faster library */
function holdsPanel(data) {
  const { holdRows, counts, copy } = data;
  return (
    '<div class="rl-panel rl-panel--1">' +
      `<div class="rl-sech"><h2>${esc(copy.holdsH)}</h2><span>${esc(copy.holdsDek)}</span></div>` +
      '<div class="rl-table">' +
        '<div class="rl-drow rl-drow--h"><span>Title</span><span>Place</span><span>Library</span><span>Copies</span><span>Estimated wait</span></div>' +
        holdRows.map((h) =>
          `<div class="rl-drow rl-drow--${esc(h.key)}">` +
            `<span class="rl-dname"><img src="./brand/book.svg" alt=""><span><b>${esc(h.title)}</b><small>${esc(h.author)} · joined ${esc(h.joined)}</small>` +
              `${h.note ? `<em class="rl-dnote">${esc(h.note)}</em>` : ''}</span></span>` +
            `<span class="rl-dbat">${esc(h.placeText.replace(/ of .*/, ''))}</span>` +
            `<span class="rl-rtags">${appTag(data, h.at)}</span>` +
            `<span class="rl-dstat"><span class="rl-echip rl-echip--hold">${ico('book-open')}${n0(h.copies)} copies</span></span>` +
            `<span class="rl-droom">${esc(h.waitText)}</span>` +
          '</div>',
        ).join('') +
        `<div class="rl-more">${ico('merge')}${n0(counts.hold)} titles are already on hold, out of ${n0(counts.titles)} on the shelf. Each was checked at both library cards and the shorter queue is the one shown.</div>` +
      '</div>' +
      `<p class="rl-autosum">${ico('hourglass')}<span>${esc(copy.worstNote)}</span></p>` +
    '</div>'
  );
}

/* the loans panel: what the click on the Loans tab swaps in, free titles and loans due this week */
function loansPanel(data) {
  const { loanRows, counts, copy } = data;
  return (
    '<div class="rl-panel rl-panel--2">' +
      `<div class="rl-sech"><h2>${esc(copy.loansH)}</h2><span>${esc(copy.loansDek)}</span></div>` +
      '<div class="rl-table">' +
        '<div class="rl-arow rl-arow--h"><span>Loan</span><span>Library</span><span>Format</span><span>Due</span><span>Next step</span></div>' +
        loanRows.map((l) =>
          `<div class="rl-arow rl-arow--${esc(l.key)}${l.due_this_week ? ' rl-arow--hot' : ''}">` +
            `<span class="rl-aname"><b>${esc(l.title)}</b><small>${esc(l.author)}</small></span>` +
            `<span class="rl-aapp">${appTag(data, l.at)}</span>` +
            `<span class="rl-aformat">${ico(l.format === 'Audiobook' ? 'headphones' : 'book-open')}${esc(l.format)}</span>` +
            `<span class="rl-alast">${esc(l.due)} <em>${esc(l.left)}</em></span>` +
            `<span class="rl-anext">${esc(l.action)}</span>` +
          '</div>',
        ).join('') +
        `<div class="rl-more">${ico('circle-check')}${n0(counts.available)} titles on the shelf are free to borrow right now, and ${n0(counts.loans)} loans are out, ${n0(counts.dueThisWeek)} of them due by Oct 1.</div>` +
      '</div>' +
      '<ul class="rl-ready">' +
        data.ready.map((r) =>
          `<li><img src="${esc(accOf(data, r.at).logo)}" alt=""><span><b>${esc(r.title)}</b><small>${esc(r.author)} · ${esc(r.format)}, ${esc(accOf(data, r.at).short)}</small></span><em>${esc(r.note)}</em></li>`,
        ).join('') +
      '</ul>' +
    '</div>'
  );
}

function watchSection(data) {
  const { watch, copy } = data;
  return (
    '<section class="rl-watch">' +
      `<div class="rl-sech"><h2>${esc(copy.watchH)}</h2><span>${esc(copy.watchDek)}</span></div>` +
      '<ul class="rl-wlist">' +
        watch.map((w) =>
          `<li class="rl-w"><span class="rl-wi">${ico(w.icon)}</span><span class="rl-wt"><small>${esc(w.k)}</small><b>${esc(w.v)}</b><em>${esc(w.note)}</em></span></li>`,
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/reading-list';
  return (
    '<footer class="rl-foot">' +
      `<span>${ico('lock')}Made by Superbot for ${esc(data.meta.user)}. Read-only access to Libby, Goodreads, Kindle and Audible.</span>` +
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
    '<section class="rl-panels">' +
      holdsPanel(data) +
      loansPanel(data) +
    '</section>' +
    watchSection(data) +
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

  const clock = root.querySelector('.rl-clock');
  if (clock) clock.textContent = clockText(meta.syncStart + meta.syncSecs * (0.6 * g + 0.4 * mg));

  const heroEl = root.querySelector('.rl-hero');
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
  const count = root.querySelector('.rl-synccount');
  if (count) count.textContent = `${n0(read)} of ${n0(counts.pulled)} entries`;

  // the merge: the bar starts all mint as read, the amber band of merged lines shrinks to its share
  const bar = root.querySelector('.rl-mbar');
  if (bar) {
    const k = ease(mg);
    const uniq = counts.pulled - counts.dupes * k;
    const mun = bar.querySelector('.rl-mun');
    const mdup = bar.querySelector('.rl-mdup');
    if (mun) mun.style.width = pct((counts.rows / counts.pulled) * 100);
    if (mdup) mdup.style.width = pct(((uniq - counts.rows) / counts.pulled) * 100);
    bar.classList.toggle('is-merged', mg >= 0.999);
  }
  const dupnow = root.querySelector('.rl-dupnow');
  if (dupnow) dupnow.textContent = n0(Math.round(counts.dupes * ease(mg)));
  const uniqnow = root.querySelector('.rl-uniqnow');
  if (uniqnow) uniqnow.textContent = n0(Math.round(counts.pulled - counts.dupes * ease(mg)));

  // the flags strip: the four counters ease in, then the example rows land one after another
  for (const b of root.querySelectorAll('[data-g]')) b.textContent = n0(Math.round(Number(b.dataset.g) * ease(gw)));
  for (const li of root.querySelectorAll('.rl-flagex li')) {
    const j = Number(li.dataset.j) || 0;
    li.style.opacity = (0.15 + 0.85 * ease(clamp01((gw - j * 0.2) / 0.6))).toFixed(3);
  }

  // the shelf grid: nine cards with covers settle in turn
  for (const card of root.querySelectorAll('.rl-room')) {
    const i = Number(card.dataset.r) || 0;
    const k = ease(clamp01((rw - i * 0.06) / 0.52));
    card.style.opacity = (0.2 + 0.8 * k).toFixed(3);
    card.style.transform = `translateY(${((1 - k) * 12).toFixed(2)}px)`;
  }

  const fill = root.querySelector('.rl-syncfill');
  if (fill) fill.style.width = pct(100 * (0.6 * g + 0.4 * mg));
}

export { build };