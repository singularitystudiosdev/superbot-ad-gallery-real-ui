/* site.js - the generated frontend: superbot.app/p/mech-keys, "Group-buy Overview".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on one segment of the match bar in the sync card, the paid stats
   tile's icon, the knob at the end of the first arrival's progress arc, one row's vendor badges and the
   source bar the spot ends on, and .is-active on the "What you paid" tab; all are styled in site.css. The
   tab click swaps the By stage panel for the What you paid panel through a :has() + sibling rule, so no JS
   runs on the click; both panels share one grid cell, so the swap moves nothing around them. The only
   clock-driven output is render(root, p): the top bar clock, the sync card reading the seven sources
   (SYNC_A/SYNC_B) and matching each buy into the status bar (MATCH_A/MATCH_B), the four counters easing in
   (GROW_A/GROW_B), the three arrival cards landing with their progress rings (SHIP_A/SHIP_B), the buy rows
   (LIST_A/LIST_B), the stage bars (STAGE_A/STAGE_B), the wishlist matches (WISH_A/WISH_B), the paid rows
   after the click (PAY_A/PAY_B), the source bar (SUM_A/SUM_B) and the sync bar. Every one of them is a pure
   function of the beat's progress.
   Read-only: every word the page prints says what Superbot read or found, never that it bought a listing,
   joined a group buy, changed an order, messaged a seller or sent a payment. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';

/** seconds since midnight -> "8:42:11 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** days -> "14d" for the ring's countdown, "today" once it is due */
export function countdown(days) {
  if (days <= 0) return 'today';
  if (days < 1) return '<1d';
  return `${Math.round(days)}d`;
}

/* The beats, in p (the browser scene's progress, 1 s morph included; with dur.browser 11.2 a scroll f in
   ad.js lands at p = (1 + 10.2 f) / 11.2). Each window sits inside the scroll hold that shows it:
   - the seven sources are read from SYNC_A to SYNC_B and the nine buys matched into the status bar from
     MATCH_A to MATCH_B, both inside the hero hold (f 0.12 to 0.28), so the finished card holds still;
   - the four counters ease in while the strip arrives and settles (f 0.33 to 0.42);
   - the three arrival cards land with their rings while the strip arrives (f 0.46) and settle early in its
     hold (to f 0.58), the money beat, read with nothing else moving;
   - the wishlist match rows come in as the matches panel arrives (f 0.62 to 0.68);
   - the buy rows come up as the list arrives (f 0.72) and are all in before the slow pass down it;
   - the stage bars grow as the panels arrive (f 0.80 to 0.86);
   - the paid rows land right after the "What you paid" click (f 0.82, p 0.84) and the source bar fills as
     the page settles on it (f 0.88, p 0.89). */
const SYNC_A = 0.05;
const SYNC_B = 0.2;
const MATCH_A = 0.195;
const MATCH_B = 0.3;
const GROW_A = 0.36;
const GROW_B = 0.44;
const SHIP_A = 0.51;
const SHIP_B = 0.61;
const WISH_A = 0.65;
const WISH_B = 0.7;
const LIST_A = 0.7;
const LIST_B = 0.77;
const STAGE_A = 0.8;
const STAGE_B = 0.86;
const PAY_A = 0.85;
const PAY_B = 0.9;
const SUM_A = 0.88;
const SUM_B = 0.96;

const win = (a, b) => (p) => clamp01((p - a) / (b - a));
export const syncDone = win(SYNC_A, SYNC_B);
export const matchDone = win(MATCH_A, MATCH_B);
export const growDone = win(GROW_A, GROW_B);
export const shipDone = win(SHIP_A, SHIP_B);
export const wishDone = win(WISH_A, WISH_B);
export const listDone = win(LIST_A, LIST_B);
export const stageDone = win(STAGE_A, STAGE_B);
export const payDone = win(PAY_A, PAY_B);
export const sumDone = win(SUM_A, SUM_B);

/* n items share one window: each takes LEN of it, starting evenly spaced so the last ends at 1 */
const LEN = 0.4;
export function stepDone(g, i, n, len = LEN) {
  const step = n > 1 ? (1 - len) / (n - 1) : 0;
  return ease(clamp01((g - i * step) / len));
}

/* lucide icons (ISC), inline so the page needs no font or sprite */
const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  keyboard: '<rect width="20" height="13" x="2" y="6" rx="2"/><path d="M6 10h.01"/><path d="M10 10h.01"/><path d="M14 10h.01"/><path d="M18 10h.01"/><path d="M7 15h10"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  truck: '<path d="M14 17V5H2v12h12Z"/><path d="M14 8h4l4 4v5h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z"/><circle cx="7.5" cy="7.5" r=".6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  merge: '<path d="m8 6 4-4 4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/><path d="m20 22-5-5"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  hammer: '<path d="m15 12-8.4 8.4a2.1 2.1 0 0 1-3-3L12 9"/><path d="M17.6 6.4 12 12l-2-2 5.6-5.6a2.1 2.1 0 0 1 3 0l.4.4a2.1 2.1 0 0 1 0 3Z"/><path d="m20 4-1 1"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
};
const ico = (name) =>
  `<svg class="mk-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const logo = (data, id, cls) => {
  const v = data.vendors[id];
  return `<img class="${cls}" src="${esc(v.logo)}" alt="${esc(v.name)}"/>`;
};
const money = (n) => fallback.money(n);

/* the six pipeline dots: filled through the stage the buy has reached */
const pipe = (data, idx, cls = '') =>
  `<span class="mk-pipe ${cls}">${data.stages.map((s, i) => `<i class="mk-pd mk-pd--${s.key}${i <= idx ? ' is-on' : ''}"></i>`).join('')}</span>`;

// ---------- top bar ----------
function topBar(data) {
  const { counts, stages } = data;
  return `<header class="mk-top"><div class="mk-topin">
  <span class="mk-brand"><img class="mk-brandico" src="./brand/app.svg" alt=""/><b>Group-buy Overview</b><span class="mk-by">by Superbot</span></span>
  <nav class="mk-tabs"><span class="mk-tab mk-tab--1">By stage <i>${stages.length}</i></span><span class="mk-tab mk-tab--2">What you paid <i>${counts.buys}</i></span></nav>
  <div class="mk-status"><span class="mk-ro">${ico('lock')}Read-only</span><span class="mk-live"><span class="mk-dot"></span><span class="mk-clock">${esc(clockText(data.meta.syncStart))}</span></span></div>
</div><div class="mk-syncbar"><span class="mk-syncfill"></span></div></header>`;
}

// ---------- hero: the sync card and the next-to-arrive card ----------
function syncCard(data) {
  const { accounts, copy, buys, counts } = data;
  const ticks = accounts.map((a, i) => `<li class="mk-tick mk-tick--s${i + 1}">
      <img src="${esc(a.logo)}" alt=""/>
      <span class="mk-tickt"><b>${esc(a.name)}</b><small>${esc(a.line)}</small></span>
      <span class="mk-tickc"><b class="mk-tickn" data-n="${a.pulled}" data-i="${i}">0</b><small>${esc(a.what)}</small></span>
      <span class="mk-tickok">${ico('check')}</span>
    </li>`).join('');
  const segs = buys.map((b, i) => `<span class="mk-mseg mk-mseg--${b.stageKey} mk-mseg--${i + 1}" data-m="${i}"><span class="mk-mfill"></span></span>`).join('');
  const legend = data.stages.map((s) => {
    const n = buys.filter((b) => b.stageKey === s.key).length;
    return `<span class="mk-leg mk-leg--${s.key}"><i></i>${esc(s.name)} <b>${n}</b></span>`;
  }).join('');
  return `<div class="mk-sync">
    <div class="mk-synchead">
      <span class="mk-syncnow">${ico('refresh')}${esc(copy.syncing)}<b class="mk-synccount">0 of ${accounts.length} sources</b></span>
      <span class="mk-stamp">${ico('check')}${esc(copy.stamp)}</span>
    </div>
    <ul class="mk-ticks">${ticks}</ul>
    <div class="mk-match">
      <div class="mk-matchh"><span>${ico('merge')}${esc(copy.matched)}</span><b class="mk-matchn">0 of ${counts.buys}</b><em class="mk-matchr">${counts.late} running late</em></div>
      <div class="mk-legend">${legend}</div>
      <div class="mk-mbar">${segs}</div>
    </div>
  </div>`;
}

function nextCard(data) {
  const { nextBuy: b, arrivals, stages, counts, meta } = data;
  const R = 15.9155; // circumference 100
  const share = Math.max(3, Math.min(100, b.progress * 100));
  const phi = (2 * Math.PI * share) / 100;
  const kr = 50 * (R / 18);
  const knob = `left:${pct(50 + kr * Math.sin(phi))};top:${pct(50 - kr * Math.cos(phi))}`;
  const others = arrivals.slice(1).map((x) => `<li><b>${esc(x.item)}</b><span>${esc(x.v.name)} · est ${esc(x.estShort)}</span><em>${countdown(x.estInDays)}</em></li>`).join('');
  const rail = stages.map((s, i) => {
    const n = data.buys.filter((x) => x.stageIdx === i).length;
    return `<li class="mk-step mk-step--${s.key}${n ? ' is-on' : ''}"><i></i><b>${esc(s.name)}</b><small>${n} ${n === 1 ? 'buy' : 'buys'}</small></li>`;
  }).join('');
  return `<aside class="mk-next">
    <div class="mk-nexth"><span class="mk-nextk">${ico('truck')}Next to arrive</span><span class="mk-nextin">in ${countdown(b.estInDays)}</span></div>
    <div class="mk-stub">
      <div class="mk-stubl">
        <b class="mk-stuba">${esc(b.item)}</b>
        <span class="mk-stubd">${esc(b.kind)} · est ${esc(b.estDay)}</span>
        <span class="mk-stubv">${ico('pin')}<span>${esc(b.v.name)}<small>${esc(b.v.where)} · joined ${esc(b.joinedShort)}</small></span></span>
      </div>
      <div class="mk-stubr">
        <span class="mk-nextring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="mk-rtrack" cx="18" cy="18" r="${R}"/><circle class="mk-rarc" cx="18" cy="18" r="${R}" data-s="${share.toFixed(2)}" stroke-dasharray="0 100"/></svg><span class="mk-rtext"><b>${esc(countdown(b.estInDays))}</b><small>to ship</small></span></span>
      </div>
    </div>
    <div class="mk-stubf">${logo(data, b.vendor, 'mk-stublogo')}<span>${b.tracking ? `Tracking ···${esc(b.tracking.slice(-6))}` : `Preorder held at ${esc(b.v.name)}`} · ${esc(b.paidText)} paid at GB</span></div>
    <ul class="mk-arrivals">${others}</ul>
    <div class="mk-track">
      <div class="mk-trackh"><span>${esc(meta.todayText)} pipeline</span><b>${counts.buys} buys · ${counts.delivered} delivered</b></div>
      <ol class="mk-rail">${rail}</ol>
    </div>
  </aside>`;
}

function hero(data) {
  const { copy } = data;
  return `<section class="mk-hero">
  <img class="mk-herobg" src="./img/hero.jpg" alt=""/>
  <div class="mk-heroin">
    <div class="mk-herot">
      <span class="mk-kicker">${ico('keyboard')}${esc(copy.kicker)}</span>
      <h1>${esc(copy.h1)}</h1>
      <p class="mk-dek">${esc(copy.dek)}</p>
      ${syncCard(data)}
    </div>
    ${nextCard(data)}
  </div>
</section>`;
}

// ---------- the four counters ----------
function statTiles(data) {
  const { counts, nextBuy, worst, skipped } = data;
  const tiles = [
    { k: 'buys', icon: 'keyboard', label: 'Group buys tracked', n: counts.buys, ex: `${counts.shops} vendors, joined ${counts.joinedFirst} to ${counts.joinedLast}` },
    { k: 'paid', icon: 'card', label: 'Paid in open buys', n: counts.paidOpen, money: 1, ex: `${counts.open} open buys, ${counts.delivered} delivered, ${money(counts.paidTotal)} paid all time` },
    { k: 'late', icon: 'clock', label: 'Months late on average', n: counts.avgLate, dec: 1, ex: `${worst.item} is the worst at ${worst.lateText}` },
    { k: 'next', icon: 'truck', label: 'Arriving next', n: counts.daysToNext, unit: 'd', ex: `${nextBuy.item}, ${nextBuy.v.name}, est ${nextBuy.estShort}` },
  ];
  return `<section class="mk-stats">${tiles.map((t) => `<div class="mk-stat mk-stat--${t.k}">
    <span class="mk-stati">${ico(t.icon)}</span>
    <span class="mk-statt"><small>${esc(t.label)}</small><b data-g="${t.n}"${t.money ? ' data-money="1"' : ''}${t.dec ? ` data-dec="${t.dec}"` : ''}${t.unit ? ` data-unit="${esc(t.unit)}"` : ''}>0</b><em class="mk-statex">${esc(t.ex)}</em></span>
  </div>`).join('')}</section>`;
}

// ---------- the money beat: what is on the water ----------
const RING_R = 15.9155; // circumference 100
function shipBlock(data) {
  const { arrivals, copy, counts } = data;
  const cards = arrivals.map((b, i) => {
    const share = Math.max(4, Math.min(100, b.progress * 100));
    const phi = (2 * Math.PI * share) / 100;
    const kr = 50 * (RING_R / 18);
    const knob = `left:${pct(50 + kr * Math.sin(phi))};top:${pct(50 - kr * Math.cos(phi))}`;
    return `<li class="mk-scd mk-scd--${i + 1} mk-scd--${b.stageKey}" data-r="${i}">
      <span class="mk-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="mk-rtrack" cx="18" cy="18" r="${RING_R}"/><circle class="mk-rarc" cx="18" cy="18" r="${RING_R}" data-s="${share.toFixed(2)}" stroke-dasharray="0 100"/></svg><span class="mk-rtext"><b>${esc(countdown(b.estInDays))}</b><small>to ship</small></span><span class="mk-rknob" style="${knob}"></span></span>
      <div class="mk-scbody">
        <span class="mk-sckind">${logo(data, b.vendor, 'mk-sclogo')}${esc(b.v.name)} · ${esc(b.updateShort)}</span>
        <b class="mk-scitem">${esc(b.item)}</b>
        <span class="mk-scline">${ico('tag')}${esc(b.kind)} · ${esc(b.paidText)} paid at GB</span>
        <dl class="mk-scfacts">
          <div><dt>Joined</dt><dd>${esc(b.joinedDay)}</dd></div>
          <div><dt>Original ETA</dt><dd>${esc(b.etaShort)}</dd></div>
          <div><dt>Latest update</dt><dd>${esc(b.update.text)}</dd></div>
        </dl>
        <span class="mk-scfoot">
          <span class="mk-chip mk-chip--${b.lateK}">${esc(b.lateText)}</span>
          <span class="mk-sctrack">${b.tracking ? `${ico('truck')}Tracking ···${esc(b.tracking.slice(-6))}` : `${ico('hammer')}${esc(b.stageLabel)}`}</span>
        </span>
        ${pipe(data, b.stageIdx, 'mk-pipe--lg')}
      </div>
    </li>`;
  }).join('');
  return `<section class="mk-ship">
  <div class="mk-sech"><h2>${ico('truck')}${esc(copy.shipHead)}</h2><p>${esc(copy.shipSub)}</p></div>
  <ol class="mk-scards">${cards}</ol>
</section>`;
}

// ---------- every buy, by estimated ship date ----------
function buyList(data) {
  const { buys, copy } = data;
  const rows = buys.map((b, i) => `<li class="mk-row mk-row--${i + 1} mk-row--${b.stageKey} mk-row--late-${b.lateK}" data-w="${i}">
      <span class="mk-date"><small>${esc(b.estParts.dow)}</small><b>${b.estParts.d}</b><small>${esc(b.estParts.mon)}</small></span>
      <span class="mk-what"><b class="mk-whatn">${esc(b.item)}</b><small>${esc(b.kind)} · joined ${esc(b.joinedShort)} · ${esc(b.paidText)}</small></span>
      <span class="mk-vend">${logo(data, b.vendor, 'mk-vendlogo')}<small>${esc(b.v.name)}</small></span>
      <span class="mk-stg"><span class="mk-chip mk-chip--${b.stageKey}">${esc(b.stageLabel)}</span>${pipe(data, b.stageIdx)}</span>
      <span class="mk-upd"><b>${esc(b.updateShort)}</b><small>${esc(b.update.text)}</small></span>
      <span class="mk-eta"><b>${esc(b.etaShort)}</b><small>${ico('route')}est ${esc(b.estShort)}</small></span>
      <span class="mk-late mk-late--${b.lateK}">${b.late < 0.05 ? esc(b.lateText) : `${ico('clock')}${esc(b.lateText)}`}</span>
    </li>`).join('');
  return `<section class="mk-list">
  <div class="mk-sech"><h2>${ico('calendar')}${esc(copy.listHead)}</h2><p>${esc(copy.listSub)}</p></div>
  <div class="mk-table">
    <div class="mk-thead"><span>Due</span><span>Item</span><span>Vendor</span><span>Stage</span><span>Latest update</span><span>ETA to est</span><span>Late</span></div>
    <ol class="mk-rows">${rows}</ol>
  </div>
</section>`;
}

// ---------- the mechmarket matches and the wishlist ----------
function matchPanel(data) {
  const { matches, wishlist, copy, counts, vendors } = data;
  const rows = matches.map((m, i) => `<li class="mk-mrow2" data-j="${i}">
      <span class="mk-mav">${logo(data, 'mechmarket', 'mk-mlogo')}</span>
      <span class="mk-mmain"><b>${esc(m.title)}</b><small>${esc(m.area)} · ${esc(m.cond)} · posted ${esc(m.postedText)}</small></span>
      <span class="mk-mwish"><small>Matches</small><b>${esc(m.want.item)}</b></span>
      <span class="mk-mprice ${m.under ? 'is-under' : 'is-over'}">${esc(m.priceText)}<small>${m.under ? `under ${money(m.want.max)}` : `target ${money(m.want.max)}`}</small></span>
      <span class="mk-mlink">${ico('message')}<small>${esc(m.link)}</small></span>
    </li>`).join('');
  const wish = wishlist.map((w) => {
    const hit = matches.find((m) => m.wish === w.key);
    return `<li class="mk-wrow ${hit ? 'is-hit' : 'is-miss'}"><span class="mk-wname"><b>${esc(w.item)}</b><small>${esc(w.kind)} · up to ${money(w.max)}</small></span><em>${hit ? `${hit.priceText} found` : 'no match'}</em></li>`;
  }).join('');
  return `<section class="mk-matches">
  <div class="mk-sech"><h2>${ico('tag')}${esc(copy.wishHead)}</h2><p>${esc(copy.wishSub)}</p></div>
  <div class="mk-mgrid">
    <ol class="mk-mlist">${rows}</ol>
    <aside class="mk-wish">
      <div class="mk-panelh"><b>${ico('heart')}Your wishlist</b><small>${counts.matches} of ${counts.wishlist} matched</small></div>
      <ol class="mk-wrows">${wish}</ol>
      <p class="mk-wnote">${ico('lock')}${esc(copy.wishNote)}</p>
    </aside>
  </div>
</section>`;
}

// ---------- the tabbed panels and what was left out ----------
function stagePanel(data) {
  const { stages, buys } = data;
  const max = Math.max(1, ...stages.map((s) => buys.filter((b) => b.stageKey === s.key).length));
  const rows = stages.map((s, i) => {
    const list = buys.filter((b) => b.stageKey === s.key);
    const chips = list.map((b) => `<span class="mk-mchip mk-mchip--${b.stageKey}">${esc(b.item)}</span>`).join('');
    return `<li class="mk-mrow" data-o="${i}">
      <span class="mk-mname"><b>${esc(s.name)}</b><small>${list.length}</small></span>
      <span class="mk-mtrack"><i data-w="${((100 * list.length) / max).toFixed(2)}"></i></span>
      <span class="mk-mcount">${list.length}</span>
      <span class="mk-mchips">${chips}</span>
    </li>`;
  }).join('');
  return `<div class="mk-panel mk-panel--1">
    <div class="mk-panelh"><b>${ico('layers')}By stage</b><small>${esc(data.copy.panelSub)}</small></div>
    <ol class="mk-stages">${rows}</ol>
    <p class="mk-pnote">${ico('lock')}Stage and payment state read from each vendor's own order page. No order was changed, cancelled or refunded.</p>
  </div>`;
}

function payPanel(data) {
  const { buys, counts } = data;
  const stubs = buys.filter((b) => b.open).map((b, i) => `<li class="mk-pstub" data-k="${i}">
      <span class="mk-pmain">${logo(data, b.vendor, 'mk-plogo')}<span><b>${esc(b.item)}</b><small>${esc(b.kind)} · joined ${esc(b.joinedDay)}, ${esc(b.v.name)}</small></span></span>
      <span class="mk-pstage"><small>Stage</small><b>${esc(b.stageLabel)}</b></span>
      <span class="mk-pamt"><b>${esc(b.paidText)}</b><small>at GB</small></span>
      <span class="mk-pord">${b.tracking ? `${ico('truck')}<small>···${esc(b.tracking.slice(-6))}</small>` : `${ico('hammer')}<small>not shipped</small>`}</span>
    </li>`).join('');
  return `<div class="mk-panel mk-panel--2">
    <div class="mk-panelh"><b>${ico('card')}What you paid</b><small>${money(counts.paidOpen)} across ${counts.open} open buys</small></div>
    <ol class="mk-pstubs">${stubs}</ol>
    <p class="mk-pnote">${ico('lock')}Amounts read from each vendor's own order page. No payment made, no order changed, no refund started.</p>
  </div>`;
}

function leftOut(data) {
  const { skipped, counts } = data;
  const miss = skipped.noMatch.map((x) => `<li><b>${esc(x.item)}</b><span>${esc(x.when)}</span><em>unmatched</em></li>`).join('');
  const done = skipped.delivered.map((x) => `<li><b>${esc(x.item)}</b><span>${esc(x.when)}</span><em>closed</em></li>`).join('');
  return `<aside class="mk-left">
    <div class="mk-panelh"><b>${ico('route')}Left out, on purpose</b><small>${counts.noMatch + counts.delivered} outside the ask</small></div>
    <p class="mk-lefts">Wishlist, no listing this week</p>
    <ul class="mk-leftl">${miss}</ul>
    <p class="mk-lefts">Buys already delivered</p>
    <ul class="mk-leftl">${done}</ul>
  </aside>`;
}

function panels(data) {
  return `<section class="mk-panels">
  <div class="mk-sech"><h2>${ico('layers')}All ${data.counts.buys} buys at a glance</h2><p>${esc(data.copy.panelHead)}</p></div>
  <div class="mk-pgrid">
    <div class="mk-slot">${stagePanel(data)}${payPanel(data)}</div>
    ${leftOut(data)}
  </div>
</section>`;
}

// ---------- how the orders were checked, and the footer ----------
function summary(data) {
  const { accounts, counts, copy } = data;
  const segs = accounts.map((a, i) => `<span class="mk-sseg mk-sseg--${a.id}" data-p="${i}" style="flex:${a.pulled} 1 0"><i></i></span>`).join('');
  const legend = accounts.map((a) => `<span class="mk-slegi"><img src="${esc(a.logo)}" alt=""/>${esc(a.name)}<b>${a.pulled}</b></span>`).join('');
  return `<section class="mk-sum">
  <div class="mk-sumh"><span class="mk-sumk">${ico('merge')}${esc(copy.sumHead)}</span><b>${esc(copy.sumLine)}</b></div>
  <div class="mk-slegend">${legend}</div>
  <div class="mk-sflow"><div class="mk-sbar">${segs}</div><span class="mk-sarrow">${ico('merge')}</span><span class="mk-sres"><b>${counts.buys}</b><small>buys</small></span></div>
</section>`;
}

function footer(cfg, data) {
  const { copy } = data;
  return `<footer class="mk-foot">
  <p class="mk-footmain">${ico('shield')}<b>${esc(copy.foot)}</b></p>
  <p class="mk-footnote">${esc(copy.footNote)} ${esc((cfg && cfg.build && cfg.build.url) || 'superbot.app/p/mech-keys')}</p>
</footer>`;
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data && ctx.data.buys ? ctx.data : fallback);
  root.innerHTML =
    topBar(data) +
    hero(data) +
    statTiles(data) +
    shipBlock(data) +
    matchPanel(data) +
    buyList(data) +
    panels(data) +
    summary(data) +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

export function render(root, p) {
  if (!root || !root.querySelector) return;
  const data = fallback;
  const { meta, accounts, counts, buys, stages, matches } = data;
  const g = syncDone(p);
  const mt = matchDone(p);
  const gw = growDone(p);
  const sh = shipDone(p);
  const wy = wishDone(p);
  const ls = listDone(p);
  const st = stageDone(p);
  const py = payDone(p);
  const sm = sumDone(p);
  const nA = accounts.length;

  // the clock runs fast while the sources are read, then at real speed
  const clock = root.querySelector('.mk-clock');
  if (clock) {
    const read = clamp01(p / MATCH_B);
    clock.textContent = clockText(meta.syncStart + meta.syncSecs * read + Math.max(0, p - MATCH_B) * 11.2);
  }
  const fill = root.querySelector('.mk-syncfill');
  if (fill) fill.style.width = pct(100 * (0.7 * g + 0.3 * mt));

  // the sync card: each source's count runs up, then its row checks
  const heroEl = root.querySelector('.mk-hero');
  let done = 0;
  for (const b of root.querySelectorAll('[data-n]')) {
    const i = Number(b.dataset.i) || 0;
    const t = stepDone(g, i, nA);
    b.textContent = n0(Math.round(Number(b.dataset.n) * t));
    if (t >= 0.999) done++;
  }
  if (heroEl) {
    for (let i = 0; i < nA; i++) heroEl.classList.toggle(`is-s${i + 1}`, stepDone(g, i, nA) >= 0.999);
    heroEl.classList.toggle('is-read', g >= 0.999);
    heroEl.classList.toggle('is-matched', mt >= 0.999);
  }
  const count = root.querySelector('.mk-synccount');
  if (count) count.textContent = `${done} of ${nA} sources`;

  // the match: each buy's segment fills in turn, in its stage colour
  let matched = 0;
  for (const s of root.querySelectorAll('.mk-mseg')) {
    const i = Number(s.dataset.m) || 0;
    const t = stepDone(mt, i, buys.length, 0.3);
    const f = s.querySelector('.mk-mfill');
    if (f) { f.style.transform = `scaleY(${t.toFixed(3)})`; f.style.opacity = (0.25 + 0.75 * t).toFixed(3); }
    if (t >= 0.999) matched++;
  }
  const mn = root.querySelector('.mk-matchn');
  if (mn) mn.textContent = `${matched} of ${buys.length}`;
  const mr = root.querySelector('.mk-matchr');
  if (mr) mr.style.opacity = ease(clamp01((mt - 0.85) / 0.15)).toFixed(3);
  const leg = root.querySelector('.mk-legend');
  if (leg) leg.style.opacity = (0.3 + 0.7 * ease(clamp01((mt - 0.5) / 0.5))).toFixed(3);

  // the "Next to arrive" card's ring closes as the read finishes
  const nring = root.querySelector('.mk-nextring .mk-rarc');
  if (nring) nring.setAttribute('stroke-dasharray', `${(Number(nring.dataset.s) * ease(clamp01((mt - 0.15) / 0.85))).toFixed(2)} 100`);

  // the counters ease in
  const e = ease(gw);
  for (const b of root.querySelectorAll('[data-g]')) {
    const n = Number(b.dataset.g);
    const dec = Number(b.dataset.dec) || 0;
    const v = dec ? (n * e).toFixed(dec) : n0(Math.round(n * e));
    b.textContent = (b.dataset.money ? '$' + n0(Math.round(n * e)) : v) + (b.dataset.unit || '');
  }
  for (const ex of root.querySelectorAll('.mk-statex')) ex.style.opacity = (0.2 + 0.8 * ease(clamp01((gw - 0.4) / 0.6))).toFixed(3);

  // the arrival cards land one after another, their progress rings closing on how much of the wait is gone
  for (const li of root.querySelectorAll('.mk-scd')) {
    const i = Number(li.dataset.r) || 0;
    const t = stepDone(sh, i, counts.arrivals, 0.5);
    li.style.opacity = (0.12 + 0.88 * t).toFixed(3);
    li.style.transform = `translateY(${(12 * (1 - t)).toFixed(2)}px)`;
    const arc = li.querySelector('.mk-rarc');
    if (arc) arc.setAttribute('stroke-dasharray', `${(Number(arc.dataset.s) * t).toFixed(2)} 100`);
    const knob = li.querySelector('.mk-rknob');
    if (knob) knob.style.opacity = ease(clamp01((t - 0.75) / 0.25)).toFixed(3);
    const dots = li.querySelectorAll('.mk-pd');
    dots.forEach((d, j) => { d.style.opacity = (0.3 + 0.7 * stepDone(t, j, dots.length, 0.7)).toFixed(3); });
  }

  // the wishlist match rows come in one after another
  for (const m of root.querySelectorAll('.mk-mrow2')) {
    const i = Number(m.dataset.j) || 0;
    const t = stepDone(wy, i, matches.length, 0.5);
    m.style.opacity = (0.15 + 0.85 * t).toFixed(3);
    m.style.transform = `translateX(${(10 * (1 - t)).toFixed(2)}px)`;
  }

  // the buy rows come up in estimated ship order
  for (const r of root.querySelectorAll('.mk-row')) {
    const i = Number(r.dataset.w) || 0;
    const t = stepDone(ls, i, buys.length, 0.3);
    r.style.opacity = (0.15 + 0.85 * t).toFixed(3);
    r.style.transform = `translateX(${(10 * (1 - t)).toFixed(2)}px)`;
  }

  // the stage bars grow as the panels arrive
  for (const r of root.querySelectorAll('.mk-mrow')) {
    const i = Number(r.dataset.o) || 0;
    const t = stepDone(st, i, stages.length, 0.45);
    const bar = r.querySelector('.mk-mtrack i');
    if (bar) bar.style.width = pct(Number(bar.dataset.w) * t);
    const chips = r.querySelector('.mk-mchips');
    if (chips) chips.style.opacity = (0.2 + 0.8 * t).toFixed(3);
  }

  // the paid rows slide in once "What you paid" shows them
  for (const s of root.querySelectorAll('.mk-pstub')) {
    const i = Number(s.dataset.k) || 0;
    const t = stepDone(py, i, counts.open, 0.5);
    s.style.opacity = (0.15 + 0.85 * t).toFixed(3);
    s.style.transform = `translateY(${(10 * (1 - t)).toFixed(2)}px)`;
  }

  // the source bar: each source's count fills in order, then the merge lands
  for (const s of root.querySelectorAll('.mk-sseg')) {
    const i = Number(s.dataset.p) || 0;
    const t = stepDone(sm, i, accounts.length, 0.4);
    const bar = s.querySelector('i');
    if (bar) bar.style.width = pct(100 * t);
  }
  const res = root.querySelector('.mk-sres');
  if (res) res.style.opacity = (0.2 + 0.8 * ease(clamp01((sm - 0.8) / 0.2))).toFixed(3);
  for (const li of root.querySelectorAll('.mk-slegi')) {
    const i = [...li.parentNode.children].indexOf(li);
    li.style.opacity = (0.35 + 0.65 * stepDone(sm, i, accounts.length, 0.4)).toFixed(3);
  }
}