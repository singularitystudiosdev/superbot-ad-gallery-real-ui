/* site.js - the generated frontend: superbot.app/p/live-shows, "Concert Overview".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on one segment of the match bar in the sync card, the tickets tile's
   icon, the knob at the end of the first presale's countdown arc, one row's "listed on" badges and the source bar at the end, and
   .is-active on the "Your tickets" tab; all are styled in site.css. The tab click swaps the By month panel for
   the Your tickets panel through a :has() + sibling rule, so no JS runs on the click; both panels share one
   grid cell, so the swap moves nothing around them. The only clock-driven output is render(root, p): the top
   bar clock, the sync card reading the seven sources (SYNC_A/SYNC_B) and matching each show into the status
   bar (MATCH_A/MATCH_B), the timeline dots in the next-show card, the four counters easing in
   (GROW_A/GROW_B), the three presale cards landing with their countdown rings (PRE_A/PRE_B), the show rows
   (LIST_A/LIST_B), the month bars (MONTH_A/MONTH_B), the ticket stubs after the click (TIX_A/TIX_B), the
   source bar (SUM_A/SUM_B) and the sync bar. Every one of them is a pure function of the beat's progress.
   Read-only: every word the page prints says what Superbot read or found, never that it bought, joined a
   presale, queued or transferred anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';

/** seconds since midnight -> "9:14:08 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** seconds -> "3d 1h", rounded to the hour, for the countdown rings */
export function countdown(secs) {
  const h = Math.round(secs / 3600);
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

/* The beats, in p (the browser scene's progress, 1 s morph included; with dur.browser 11.2 a scroll f in
   ad.js lands at p = (1 + 10.2 f) / 11.2). Each window sits inside the scroll hold that shows it:
   - the seven sources are read from SYNC_A to SYNC_B and the fourteen shows matched into the status bar from
     MATCH_A to MATCH_B, both inside the hero hold (f 0.12 to 0.28, p 0.2 to 0.34), so the finished card
     holds before the page moves;
   - the four counters ease in while the strip arrives and settles (f 0.28 to 0.42);
   - the three presale cards land in turn while the presales block arrives (f 0.42 to 0.47) and settle early
     in its hold, the longest one (to f 0.62): the money beat reads with nothing moving;
   - the show rows come up as the list arrives (f 0.62 to 0.66) and are all in before the slow pass down it;
   - the month bars grow as the panels arrive (f 0.74 to 0.78);
   - the ticket stubs land right after the "Your tickets" click (f 0.8, p 0.82) and the source bar fills as
     the page settles on it (f 0.87, p 0.88). */
const SYNC_A = 0.05;
const SYNC_B = 0.2;
const MATCH_A = 0.195;
const MATCH_B = 0.3;
const GROW_A = 0.36;
const GROW_B = 0.44;
const PRE_A = 0.49;
const PRE_B = 0.6;
const LIST_A = 0.63;
const LIST_B = 0.7;
const MONTH_A = 0.74;
const MONTH_B = 0.81;
const TIX_A = 0.82;
const TIX_B = 0.88;
const SUM_A = 0.87;
const SUM_B = 0.95;

const win = (a, b) => (p) => clamp01((p - a) / (b - a));
export const syncDone = win(SYNC_A, SYNC_B);
export const matchDone = win(MATCH_A, MATCH_B);
export const growDone = win(GROW_A, GROW_B);
export const preDone = win(PRE_A, PRE_B);
export const listDone = win(LIST_A, LIST_B);
export const monthDone = win(MONTH_A, MONTH_B);
export const tixDone = win(TIX_A, TIX_B);
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
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  merge: '<path d="m8 6 4-4 4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/><path d="m20 22-5-5"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
};
const ico = (name) =>
  `<svg class="ls-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const logo = (data, id, cls) => {
  const s = data.sellers[id];
  return `<img class="${cls}" src="${esc(s.logo)}" alt="${esc(s.name)}"/>`;
};
const hm = (sec) => fallback.hm(sec);
const hShort = (sec) => fallback.hShort(sec);
const priceText = (p) => fallback.priceText(p);
const WHY = { followed: 'You follow', top: 'Top played' };

// ---------- top bar ----------
function topBar(data) {
  const { meta, months, held } = data;
  const nMonths = months.filter((m) => m.shows.length).length;
  return `<header class="ls-top"><div class="ls-topin">
  <span class="ls-brand"><img class="ls-brandico" src="./brand/app.svg" alt=""/><b>Concert Overview</b><span class="ls-by">by Superbot</span></span>
  <nav class="ls-tabs"><span class="ls-tab ls-tab--1">By month <i>${nMonths}</i></span><span class="ls-tab ls-tab--2">Your tickets <i>${held.length}</i></span></nav>
  <div class="ls-status"><span class="ls-ro">${ico('lock')}Read-only</span><span class="ls-live"><span class="ls-dot"></span><span class="ls-clock">${esc(clockText(meta.syncStart))}</span></span></div>
</div><div class="ls-syncbar"><span class="ls-syncfill"></span></div></header>`;
}

// ---------- hero: the sync card and the next-show card ----------
const STATE = {
  have: 'You have tickets',
  presale: 'Presale this week',
  onsale: 'On sale',
  announced: 'On sale Fri',
  soldout: 'Sold out',
};
const ORDER = ['have', 'presale', 'onsale', 'announced', 'soldout'];

function syncCard(data) {
  const { accounts, copy, shows, counts } = data;
  const ticks = accounts.map((a, i) => `<li class="ls-tick ls-tick--s${i + 1}">
      <img src="${esc(a.logo)}" alt=""/>
      <span class="ls-tickt"><b>${esc(a.name)}</b><small>${esc(a.line)}</small></span>
      <span class="ls-tickc"><b class="ls-tickn" data-n="${a.pulled}" data-i="${i}">0</b><small>${esc(a.what)}</small></span>
      <span class="ls-tickok">${ico('check')}</span>
    </li>`).join('');
  const segs = shows.map((s, i) => `<span class="ls-mseg ls-mseg--${s.status} ls-mseg--${i + 1}" data-m="${i}"><span class="ls-mfill"></span></span>`).join('');
  const legend = ORDER.map((k) => {
    const n = shows.filter((s) => s.status === k).length;
    return `<span class="ls-leg ls-leg--${k}"><i></i>${esc(STATE[k])} <b>${n}</b></span>`;
  }).join('');
  return `<div class="ls-sync">
    <div class="ls-synchead">
      <span class="ls-syncnow">${ico('refresh')}${esc(copy.syncing)}<b class="ls-synccount">0 of ${accounts.length} sources</b></span>
      <span class="ls-stamp">${ico('check')}${esc(copy.stamp)}</span>
    </div>
    <ul class="ls-ticks">${ticks}</ul>
    <div class="ls-match">
      <div class="ls-matchh"><span>${ico('merge')}${esc(copy.matched)}</span><b class="ls-matchn">0 of ${counts.shows}</b><em class="ls-matchr">${counts.merged} duplicates merged</em></div>
      <div class="ls-legend">${legend}</div>
      <div class="ls-mbar">${segs}</div>
    </div>
  </div>`;
}

function nextCard(data) {
  const { nextShow: s, held, shows, meta, counts } = data;
  // the six months as one track: every show a dot, the ones you hold tickets for ringed
  const span = shows.length ? Math.max(1, dayNum(meta.until) - dayNum(meta.today)) : 1;
  const dots = shows.map((x, i) => {
    const at = (100 * x.inDays) / span;
    return `<span class="ls-tdot ls-tdot--${x.status}" data-t="${i}" style="left:${pct(at)}"></span>`;
  }).join('');
  const ticks = data.months.map((m, i) => `<small style="left:${pct((100 * i) / (data.months.length - 1))}">${esc(m.mon)}</small>`).join('');
  const others = held.slice(1).map((x) => `<li><b>${esc(x.artist)}</b><span>${esc(x.day)} · ${esc(x.v.name)}</span><em>${x.qty} tickets</em></li>`).join('');
  return `<aside class="ls-next">
    <div class="ls-nexth"><span class="ls-nextk">${ico('ticket')}Your next show</span><span class="ls-nextin">in ${s.inDays} days</span></div>
    <div class="ls-stub">
      <div class="ls-stubl">
        <b class="ls-stuba">${esc(s.artist)}</b>
        <span class="ls-stubd">${esc(s.day)}, 2026 · ${esc(hShort(s.at))}</span>
        <span class="ls-stubv">${ico('pin')}<span>${esc(s.v.name)}<small>${esc(s.v.city)} · ${s.v.mi} mi from you</small></span></span>
      </div>
      <div class="ls-stubr"><small>${esc(s.seat)}</small><b>${s.qty}</b><small>tickets</small></div>
    </div>
    <div class="ls-stubf">${logo(data, s.seller, 'ls-stublogo')}<span>Order ···${esc(s.order)} in Ticketmaster</span></div>
    <ul class="ls-held">${others}</ul>
    <div class="ls-track">
      <div class="ls-trackh"><span>${esc(meta.window)}</span><b>${counts.shows} shows · ${counts.held} yours</b></div>
      <div class="ls-trackl">${dots}</div>
      <div class="ls-trackm">${ticks}</div>
    </div>
  </aside>`;
}
const dayNum = ([y, m, d]) => Math.round(Date.UTC(y, m - 1, d) / 86400000);

function hero(data) {
  const { copy } = data;
  return `<section class="ls-hero">
  <img class="ls-herobg" src="./img/hero.jpg" alt=""/>
  <div class="ls-heroin">
    <div class="ls-herot">
      <span class="ls-kicker">${ico('music')}${esc(copy.kicker)}</span>
      <h1>${esc(copy.h1)}</h1>
      <p class="ls-dek">${esc(copy.dek)}</p>
      ${syncCard(data)}
    </div>
    ${nextCard(data)}
  </div>
</section>`;
}

// ---------- the four counters ----------
function statTiles(data) {
  const { counts, spotify, presales } = data;
  const first = presales[0];
  const tiles = [
    { k: 'artists', icon: 'mic', label: 'Artists checked', n: counts.artists, ex: `${spotify.followed} followed + top ${spotify.top} played, ${spotify.overlap} in both` },
    { k: 'shows', icon: 'music', label: 'Shows found', n: counts.shows, ex: `${counts.listings} listings, ${counts.merged} duplicates merged` },
    { k: 'tix', icon: 'ticket', label: 'Tickets you hold', n: counts.tickets, ex: `for ${counts.held} shows, found in Ticketmaster` },
    { k: 'pre', icon: 'zap', label: 'Presales this week', n: counts.presales, ex: first ? `first ${first.pre.dow} ${hShort(first.pre.at)}, ${first.artist}` : 'none this week' },
  ];
  return `<section class="ls-stats">${tiles.map((t) => `<div class="ls-stat ls-stat--${t.k}">
    <span class="ls-stati">${ico(t.icon)}</span>
    <span class="ls-statt"><small>${esc(t.label)}</small><b data-g="${t.n}">0</b><em class="ls-statex">${esc(t.ex)}</em></span>
  </div>`).join('')}</section>`;
}

// ---------- the money beat: presales this week ----------
const RING_R = 15.9155; // circumference 100
function presaleBlock(data) {
  const { presales, copy } = data;
  const WEEK = 7 * 86400;
  const cards = presales.map((s, i) => {
    const share = Math.max(4, Math.min(100, (100 * s.pre.secs) / WEEK));
    const spot = /Spotify/.test(s.pre.kind);
    // the knob sits where the arc ends (clockwise from 12 o'clock), on the stroke itself: for the first
    // presale that is the lower right of the ring, clear of the countdown text, and it is the hover target,
    // so the pointer rests on the ring's graphic and never on the figure inside it. Fixed at build, so the
    // cursor's target point does not move while the arc closes.
    const phi = (2 * Math.PI * share) / 100;
    const kr = 50 * (RING_R / 18);
    const knob = `left:${pct(50 + kr * Math.sin(phi))};top:${pct(50 - kr * Math.cos(phi))}`;
    return `<li class="ls-pcard ls-pcard--${i + 1}" data-r="${i}">
      <span class="ls-ring"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="ls-rtrack" cx="18" cy="18" r="${RING_R}"/><circle class="ls-rarc" cx="18" cy="18" r="${RING_R}" data-s="${share.toFixed(2)}" stroke-dasharray="0 100"/></svg><span class="ls-rtext"><b>${esc(countdown(s.pre.secs))}</b><small>to presale</small></span><span class="ls-rknob" style="${knob}"></span></span>
      <div class="ls-pbody">
        <span class="ls-pkind">${spot ? `<img src="./brand/spotify.svg" alt=""/>` : ico('key')}${esc(s.pre.kind)}</span>
        <b class="ls-partist">${esc(s.artist)}</b>
        <span class="ls-pshow">${esc(s.day)} · ${esc(s.v.name)}, ${esc(s.v.city)}</span>
        <dl class="ls-pfacts">
          <div><dt>Presale</dt><dd>${esc(s.pre.day)}, ${esc(hShort(s.pre.at))}</dd></div>
          <div><dt>Public on-sale</dt><dd>${esc(s.sale.day)}, ${esc(hShort(s.sale.at))}</dd></div>
          <div><dt>Price incl. fees</dt><dd>${esc(priceText(s.price))}</dd></div>
        </dl>
        <span class="ls-pfoot">${logo(data, s.seller, 'ls-plogo')}<span>${esc(s.pre.code)}</span></span>
      </div>
    </li>`;
  }).join('');
  return `<section class="ls-pre">
  <div class="ls-sech"><h2>${ico('zap')}${esc(copy.preHead)}</h2><p>${esc(copy.preSub)}</p></div>
  <ol class="ls-pcards">${cards}</ol>
</section>`;
}

// ---------- every show, by date ----------
function showList(data) {
  const { shows, copy } = data;
  const rows = shows.map((s, i) => {
    const on = s.on.map((id) => logo(data, id, 'ls-onlogo')).join('');
    return `<li class="ls-row ls-row--${i + 1} ls-row--${s.status}" data-w="${i}">
      <span class="ls-date"><small>${esc(s.parts.dow)}</small><b>${s.parts.d}</b><small>${esc(s.parts.mon)}</small></span>
      <span class="ls-who"><b>${esc(s.artist)}</b><small>${esc(WHY[s.why])} on Spotify · ${esc(hShort(s.at))}</small></span>
      <span class="ls-where"><b>${esc(s.v.name)}</b><small>${esc(s.v.city)} · ${s.v.mi} mi</small></span>
      <span class="ls-on">${on}</span>
      <span class="ls-sell">${logo(data, s.seller, 'ls-selllogo')}<small>${esc(s.sellerName)}</small></span>
      <span class="ls-price">${esc(priceText(s.price))}</span>
      <span class="ls-chip ls-chip--${s.chip.k}">${esc(s.chip.text)}</span>
    </li>`;
  }).join('');
  return `<section class="ls-list">
  <div class="ls-sech"><h2>${ico('calendar')}${esc(copy.listHead)}</h2><p>${esc(copy.listSub)}</p></div>
  <div class="ls-table">
    <div class="ls-thead"><span>Date</span><span>Artist</span><span>Venue</span><span>Listed on</span><span>Sells it</span><span>Price incl. fees</span><span>Status</span></div>
    <ol class="ls-rows">${rows}</ol>
  </div>
</section>`;
}

// ---------- the tabbed panels and what was left out ----------
function monthPanel(data) {
  const { months } = data;
  const max = Math.max(1, ...months.map((m) => m.shows.length));
  const rows = months.map((m, i) => {
    const chips = m.shows.map((s) => `<span class="ls-mchip ls-mchip--${s.status}">${esc(s.artist)}</span>`).join('');
    return `<li class="ls-mrow" data-o="${i}">
      <span class="ls-mname"><b>${esc(m.mon)}</b><small>${m.y}</small></span>
      <span class="ls-mtrack"><i data-w="${((100 * m.shows.length) / max).toFixed(2)}"></i></span>
      <span class="ls-mcount">${m.shows.length}</span>
      <span class="ls-mchips">${chips}</span>
    </li>`;
  }).join('');
  return `<div class="ls-panel ls-panel--1">
    <div class="ls-panelh"><b>${ico('calendar')}By month</b><small>Busiest: ${esc(busiest(months))}</small></div>
    <ol class="ls-months">${rows}</ol>
  </div>`;
}
const busiest = (months) => {
  const m = months.slice().sort((a, b) => b.shows.length - a.shows.length)[0];
  return `${m.mon}, ${m.shows.length} shows`;
};

function ticketPanel(data) {
  const { held, counts } = data;
  const stubs = held.map((s, i) => `<li class="ls-tstub" data-k="${i}">
      <span class="ls-date"><small>${esc(s.parts.dow)}</small><b>${s.parts.d}</b><small>${esc(s.parts.mon)}</small></span>
      <span class="ls-tmain"><b>${esc(s.artist)}</b><small>${esc(s.v.name)}, ${esc(s.v.city)} · ${esc(hShort(s.at))}</small></span>
      <span class="ls-tseat"><small>Seats</small><b>${esc(s.seat)}</b></span>
      <span class="ls-tqty"><b>${s.qty}</b><small>tickets</small></span>
      <span class="ls-torder">${logo(data, s.seller, 'ls-tlogo')}<small>···${esc(s.order)}</small></span>
    </li>`).join('');
  return `<div class="ls-panel ls-panel--2">
    <div class="ls-panelh"><b>${ico('ticket')}Your tickets</b><small>${counts.tickets} tickets for ${counts.held} shows, cross-checked by order</small></div>
    <ol class="ls-tstubs">${stubs}</ol>
    <p class="ls-tnote">${ico('lock')}Read from your Ticketmaster orders. Nothing transferred, resold or changed.</p>
  </div>`;
}

function leftOut(data) {
  const { skipped, meta, counts } = data;
  const far = skipped.farther.map((x) => `<li><b>${esc(x.artist)}</b><span>${esc(x.where)}</span><em>${x.mi} mi</em></li>`).join('');
  const later = skipped.later.map((x) => `<li><b>${esc(x.artist)}</b><span>${esc(x.when)}</span><em>later</em></li>`).join('');
  return `<aside class="ls-left">
    <div class="ls-panelh"><b>${ico('route')}Left out, on purpose</b><small>${counts.farther + counts.later} outside the ask</small></div>
    <p class="ls-lefts">Past ${meta.radius} mi</p>
    <ul class="ls-leftl">${far}</ul>
    <p class="ls-lefts">After ${esc(meta.untilText)}</p>
    <ul class="ls-leftl">${later}</ul>
  </aside>`;
}

function panels(data) {
  return `<section class="ls-panels">
  <div class="ls-sech"><h2>${ico('layers')}Six months at a glance</h2><p>Switch to Your tickets for the seats already in your account.</p></div>
  <div class="ls-pgrid">
    <div class="ls-slot">${monthPanel(data)}${ticketPanel(data)}</div>
    ${leftOut(data)}
  </div>
</section>`;
}

// ---------- how it was checked, and the footer ----------
function summary(data) {
  const { listings, counts, copy, sellers } = data;
  const ids = Object.keys(listings);
  const segs = ids.map((id, i) => `<span class="ls-sseg ls-sseg--${id}" data-p="${i}" style="flex:${listings[id]} 1 0"><i></i></span>`).join('');
  const legend = ids.map((id) => `<span class="ls-slegi"><img src="${esc(sellers[id].logo)}" alt=""/>${esc(sellers[id].name)}<b>${listings[id]}</b></span>`).join('');
  return `<section class="ls-sum">
  <div class="ls-sumh"><span class="ls-sumk">${ico('merge')}${esc(copy.sumHead)}</span><b>${esc(copy.sumLine)}</b></div>
  <div class="ls-slegend">${legend}</div>
  <div class="ls-sflow"><div class="ls-sbar">${segs}</div><span class="ls-sarrow">${ico('merge')}</span><span class="ls-sres"><b>${counts.shows}</b><small>shows</small></span></div>
</section>`;
}

function footer(cfg, data) {
  const { copy } = data;
  return `<footer class="ls-foot">
  <p class="ls-footmain">${ico('shield')}<b>${esc(copy.foot)}</b></p>
  <p class="ls-footnote">${esc(copy.footNote)} ${esc((cfg && cfg.build && cfg.build.url) || 'superbot.app/p/live-shows')}</p>
</footer>`;
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data && ctx.data.shows ? ctx.data : fallback);
  root.innerHTML =
    topBar(data) +
    hero(data) +
    statTiles(data) +
    presaleBlock(data) +
    showList(data) +
    panels(data) +
    summary(data) +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

export function render(root, p) {
  if (!root || !root.querySelector) return;
  const data = fallback;
  const { meta, accounts, counts, shows } = data;
  const g = syncDone(p);
  const mt = matchDone(p);
  const gw = growDone(p);
  const pr = preDone(p);
  const ls = listDone(p);
  const mo = monthDone(p);
  const tx = tixDone(p);
  const sm = sumDone(p);
  const nA = accounts.length;

  // the clock runs fast while the sources are read, then at real speed
  const clock = root.querySelector('.ls-clock');
  if (clock) {
    const read = clamp01(p / MATCH_B);
    clock.textContent = clockText(meta.syncStart + meta.syncSecs * read + Math.max(0, p - MATCH_B) * 11.2);
  }
  const fill = root.querySelector('.ls-syncfill');
  if (fill) fill.style.width = pct(100 * (0.7 * g + 0.3 * mt));

  // the sync card: each source's count runs up, then its row checks
  const heroEl = root.querySelector('.ls-hero');
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
  const count = root.querySelector('.ls-synccount');
  if (count) count.textContent = `${done} of ${nA} sources`;

  // the match: each show's segment fills in turn, in its status colour
  let matched = 0;
  for (const s of root.querySelectorAll('.ls-mseg')) {
    const i = Number(s.dataset.m) || 0;
    const t = stepDone(mt, i, shows.length, 0.3);
    const f = s.querySelector('.ls-mfill');
    if (f) f.style.transform = `scaleY(${t.toFixed(3)})`;
    if (f) f.style.opacity = (0.25 + 0.75 * t).toFixed(3);
    if (t >= 0.999) matched++;
  }
  const mn = root.querySelector('.ls-matchn');
  if (mn) mn.textContent = `${matched} of ${shows.length}`;
  const mr = root.querySelector('.ls-matchr');
  if (mr) mr.style.opacity = ease(clamp01((mt - 0.85) / 0.15)).toFixed(3);
  const leg = root.querySelector('.ls-legend');
  if (leg) leg.style.opacity = (0.3 + 0.7 * ease(clamp01((mt - 0.5) / 0.5))).toFixed(3);

  // the next-show card's six-month track: the dots land with the match
  for (const d of root.querySelectorAll('.ls-tdot')) {
    const i = Number(d.dataset.t) || 0;
    const t = stepDone(mt, i, shows.length, 0.3);
    d.style.opacity = t.toFixed(3);
    d.style.transform = `translate(-50%, -50%) scale(${(0.4 + 0.6 * t).toFixed(3)})`;
  }

  // the counters ease in
  const e = ease(gw);
  for (const b of root.querySelectorAll('[data-g]')) {
    b.textContent = n0(Math.round(Number(b.dataset.g) * e));
  }
  for (const ex of root.querySelectorAll('.ls-statex')) ex.style.opacity = (0.2 + 0.8 * ease(clamp01((gw - 0.4) / 0.6))).toFixed(3);

  // the presales land one after another, their rings closing on the share of the week left before each opens
  for (const li of root.querySelectorAll('.ls-pcard')) {
    const i = Number(li.dataset.r) || 0;
    const t = stepDone(pr, i, counts.presales, 0.5);
    li.style.opacity = (0.12 + 0.88 * t).toFixed(3);
    li.style.transform = `translateY(${(12 * (1 - t)).toFixed(2)}px)`;
    const arc = li.querySelector('.ls-rarc');
    if (arc) arc.setAttribute('stroke-dasharray', `${(Number(arc.dataset.s) * t).toFixed(2)} 100`);
    // the knob appears as the arc reaches it
    const knob = li.querySelector('.ls-rknob');
    if (knob) knob.style.opacity = ease(clamp01((t - 0.75) / 0.25)).toFixed(3);
  }

  // the show rows come up in date order
  for (const r of root.querySelectorAll('.ls-row')) {
    const i = Number(r.dataset.w) || 0;
    const t = stepDone(ls, i, shows.length, 0.3);
    r.style.opacity = (0.15 + 0.85 * t).toFixed(3);
    r.style.transform = `translateX(${(10 * (1 - t)).toFixed(2)}px)`;
  }

  // the month bars grow as the panels arrive
  for (const r of root.querySelectorAll('.ls-mrow')) {
    const i = Number(r.dataset.o) || 0;
    const t = stepDone(mo, i, data.months.length, 0.45);
    const bar = r.querySelector('.ls-mtrack i');
    if (bar) bar.style.width = pct(Number(bar.dataset.w) * t);
    const chips = r.querySelector('.ls-mchips');
    if (chips) chips.style.opacity = (0.2 + 0.8 * t).toFixed(3);
  }

  // the ticket stubs slide in once "Your tickets" shows them
  for (const s of root.querySelectorAll('.ls-tstub')) {
    const i = Number(s.dataset.k) || 0;
    const t = stepDone(tx, i, counts.held, 0.5);
    s.style.opacity = (0.15 + 0.85 * t).toFixed(3);
    s.style.transform = `translateY(${(10 * (1 - t)).toFixed(2)}px)`;
  }

  // the source bar: each source's listings fill in order, then the merge lands
  const ids = Object.keys(data.listings);
  for (const s of root.querySelectorAll('.ls-sseg')) {
    const i = Number(s.dataset.p) || 0;
    const t = stepDone(sm, i, ids.length, 0.4);
    const bar = s.querySelector('i');
    if (bar) bar.style.width = pct(100 * t);
  }
  const res = root.querySelector('.ls-sres');
  if (res) {
    const t = ease(clamp01((sm - 0.8) / 0.2));
    res.style.opacity = (0.2 + 0.8 * t).toFixed(3);
  }
  for (const li of root.querySelectorAll('.ls-slegi')) {
    const i = [...li.parentNode.children].indexOf(li);
    li.style.opacity = (0.35 + 0.65 * stepDone(sm, i, ids.length, 0.4)).toFixed(3);
  }
}
