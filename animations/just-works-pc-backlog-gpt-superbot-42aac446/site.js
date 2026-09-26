/* site.js - the generated frontend: superbot.app/p/pc-backlog, "Backlog".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the first backlog row and .is-active on the On sale tab;
   both are styled in site.css. The tab click swaps the backlog panel for the wishlist-sales panel through
   a :has() + sibling rule, so no JS runs on the click. The only clock-driven output is render(root, p):
   the top bar's clock, the sync card ticking through the three stores, the library ring growing to its
   real split, the merged-games count and the sync bar, all pure functions of the beat's progress. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const usd2 = (n) => '$' + Number(n).toFixed(2);
const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const hrs = (h) => (h % 1 ? h.toFixed(1) : String(h));
const played = (m) => (m === 0 ? 'Never' : `${m} min`);

/** seconds since midnight -> "8:41:37 PM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the sync beat inside the browser scene: the three stores are read from SYNC_A to SYNC_B of p, while
   ad.js holds the scroll on the hero; the ring lands on the real split at SYNC_B and stays */
const SYNC_A = 0.05;
const SYNC_B = 0.27;

/** p -> 0..1 of the sync done */
export function syncDone(p) {
  return ease(clamp01((p - SYNC_A) / (SYNC_B - SYNC_A)));
}

/* ---------- inline icons: drawn glyphs, never photos ---------- */
const SVG = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8Z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  merge: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M8.5 6H11a4 4 0 0 1 4 4v0M8.5 18H11a4 4 0 0 0 4-4v0"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9.5 2.5h5"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5"/><path d="M12 8C10.5 4 7 4 7 6s3 2 5 2c2 0 5 0 5-2s-3.5-2-5 2Z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14 5.3"/><path d="M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  play: '<path d="M8 5.5v13l10.5-6.5Z"/>',
  thumb: '<path d="M7 11v9H4v-9Z"/><path d="M7 11l4-8a2.5 2.5 0 0 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
};
const ico = (name, cls = '') =>
  `<svg class="bl-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[name]}</svg>`;

const storeOf = (id) => fallback.stores.find((s) => s.id === id);
const SHORT = { steam: 'Steam', epic: 'Epic', gog: 'GOG' };
const storeTag = (id, home) => {
  const s = storeOf(id);
  if (!s) return '';
  return `<span class="bl-atag bl-atag--${esc(id)}${home ? ' bl-atag--home' : ''}"><img src="${esc(s.logo)}" alt=""/>${esc(SHORT[id])}</span>`;
};
const capsule = (g, cls = '') => `<img class="bl-cap ${cls}" src="${esc(g.img)}" alt=""/>`;
const reviewCls = (pct) => (pct >= 95 ? 'op' : 'vp');

/* the ring: r 52 (library by store) and r 40 (share unplayed) in a 120 box, clockwise from 12 o'clock */
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;
const IN_R = 40;
const IN_C = 2 * Math.PI * IN_R;
const GAP = 2.4;

function arcAttrs(startFrac, lenFrac, circ, grow) {
  const len = Math.max(0, lenFrac * circ * grow - GAP);
  return { dash: `${len.toFixed(2)} ${circ.toFixed(2)}`, off: (-(startFrac * circ * grow)).toFixed(2) };
}

/* ---------- top bar (sticky, carries the tabs the kit clicks) ---------- */
function topBar(data) {
  return `<header class="bl-top">
  <div class="bl-topin">
    <div class="bl-brand"><img class="bl-brandico" src="./brand/app.svg" alt=""/><b>Backlog</b><span class="bl-by">by Superbot</span></div>
    <nav class="bl-tabs">
      <span class="bl-tab bl-tab--1">${ico('list')}Backlog<i>${data.counts.unplayed}</i></span>
      <span class="bl-tab bl-tab--2">${ico('tag')}On sale<i>${data.counts.onSale}</i></span>
    </nav>
    <div class="bl-status">
      <span class="bl-acct">${data.stores.map((s) => `<img src="${esc(s.logo)}" alt=""/>`).join('')}${ico('lock')}Read-only</span>
      <span class="bl-live"><i class="bl-dot"></i><span class="bl-clock">${clockText(data.meta.syncStart)}</span></span>
    </div>
  </div>
  <div class="bl-syncbar"><i class="bl-syncfill"></i></div>
</header>`;
}

/* ---------- hero: the photo, the headline, the sync card, the stats and the library ring ---------- */
function syncCard(data) {
  const ticks = [
    { k: 's1', label: 'Steam signed in', logo: './brand/steam.svg' },
    { k: 's2', label: 'Epic Games signed in', logo: './brand/epic.svg' },
    { k: 's3', label: 'GOG signed in', logo: './brand/gog.svg' },
    { k: 's4', label: 'HowLongToBeat + reviews matched', logo: './brand/hltb.svg' },
  ]
    .map((x) => `<li class="bl-tick bl-tick--${x.k}"><img src="${x.logo}" alt=""/>${esc(x.label)}<span>${ico('check')}</span></li>`)
    .join('');
  return `<article class="bl-sync">
  <div class="bl-synchead">
    <p class="bl-syncnow">${ico('sync')}<span>Reading your libraries</span><b class="bl-synccount">0 of ${data.counts.entries} games</b></p>
    <p class="bl-stamp">${ico('check')}Synced ${data.counts.entries} games from 3 stores in ${data.meta.syncSecs} s · ${esc(data.meta.synced)}</p>
  </div>
  <ul class="bl-ticks">${ticks}</ul>
</article>`;
}

function libraryCard(data) {
  let start = 0;
  const arcs = [];
  const legend = [];
  for (const s of data.stores) {
    const share = s.games / data.counts.entries;
    const a = arcAttrs(start, share, RING_C, 0);
    arcs.push(`<circle class="bl-arc bl-arc--${s.id}" data-start="${start}" data-len="${share}" cx="60" cy="60" r="${RING_R}" stroke-dasharray="${a.dash}" stroke-dashoffset="${a.off}"/>`);
    start += share;
    legend.push(`<li class="bl-leg bl-leg--${s.id}">
      <img src="${esc(s.logo)}" alt=""/><span>${esc(s.name)}</span>
      <b class="bl-legnow" data-n="${s.games}">0</b>
      <small>${n0(s.hours)} h played</small>
    </li>`);
  }
  const unplayedShare = data.counts.unplayed / data.counts.games;
  const u = arcAttrs(0, unplayedShare, IN_C, 0);
  return `<article class="bl-lib">
  <p class="bl-libh">${ico('merge')}One library, three stores</p>
  <div class="bl-ringwrap">
    <div class="bl-ring">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <g transform="rotate(-90 60 60)">
          <circle class="bl-ringtrack" cx="60" cy="60" r="${RING_R}"/>
          <circle class="bl-ringtrack bl-ringtrack--in" cx="60" cy="60" r="${IN_R}"/>
          ${arcs.join('')}
          <circle class="bl-uarc" data-start="0" data-len="${unplayedShare}" cx="60" cy="60" r="${IN_R}" stroke-dasharray="${u.dash}" stroke-dashoffset="${u.off}"/>
        </g>
      </svg>
      <div class="bl-ringtext"><b class="bl-ringnow" data-n="${data.counts.games}">0</b><small>games, merged</small></div>
    </div>
    <p class="bl-ringkey"><span><i class="bl-k-own"></i>Owned, by store</span><span><i class="bl-k-un"></i>${data.counts.unplayed} unplayed</span></p>
  </div>
  <ul class="bl-legend">${legend.join('')}</ul>
  <p class="bl-libfoot"><span>${ico('merge')}Owned twice, merged</span><b>−${data.counts.dupes}</b></p>
</article>`;
}

function hero(data) {
  const top = data.backlog[0];
  return `<section class="bl-hero">
  <img class="bl-herobg" src="./img/hero.jpg" alt=""/>
  <div class="bl-heroin">
    <div class="bl-herotext">
      <p class="bl-kicker">${ico('play')}${esc(data.copy.kicker)}</p>
      <h1>${esc(data.copy.heroH1)}</h1>
      <p class="bl-dek">${esc(data.copy.heroDek)}</p>
      ${syncCard(data)}
      <ul class="bl-stats">
        <li><b>${data.counts.games}</b><span>games, 3 stores</span></li>
        <li><b>${data.counts.unplayed}</b><span>never played</span></li>
        <li class="bl-stat--next"><b>${hrs(top.hours)} h</b><span>${esc(top.title)}, up next</span></li>
        <li class="bl-stat--sale"><b>${data.counts.onSale}</b><span>wishlist games on sale</span></li>
      </ul>
    </div>
    ${libraryCard(data)}
  </div>
</section>`;
}

/* ---------- the three stores, side by side ---------- */
function storesStrip(data) {
  const cards = data.stores
    .map(
      (s) => `<li class="bl-acc bl-acc--${esc(s.id)}">
      <img src="${esc(s.logo)}" alt=""/>
      <span class="bl-acct-t"><small>${esc(s.name)}</small><b>${esc(s.handle)}</b></span>
      <span class="bl-acct-v"><b>${s.games} games</b><small>${n0(s.hours)} h played · ${s.unplayed} unplayed</small></span>
      <span class="bl-acct-ok">${ico('check')}Synced</span>
    </li>`,
    )
    .join('');
  return `<section class="bl-accts"><ul class="bl-acclist">${cards}</ul></section>`;
}

/* ---------- games owned twice, merged into one row each ---------- */
function dupesSection(data) {
  const chips = data.dupes
    .map(
      (g) => `<li class="bl-dupe">
      ${capsule(g)}
      <span class="bl-dupet"><b>${esc(g.title)}</b><span class="bl-dupes">${g.owned.map((id) => storeTag(id, id === g.home)).join('')}</span></span>
      <span class="bl-dupeok">${ico('merge')}</span>
    </li>`,
    )
    .join('');
  const more = data.counts.dupes - data.dupes.length;
  return `<section class="bl-drift">
  <div class="bl-sech"><h2>${esc(data.copy.dupesH)}</h2><span>${esc(data.copy.dupesDek)}</span></div>
  <ul class="bl-dupelist">${chips}</ul>
  ${more > 0 ? `<p class="bl-note">${ico('info')}<span>${more} more merged the same way, ${data.counts.entries} library entries in, ${data.counts.games} games out.</span></p>` : ''}
</section>`;
}

/* ---------- panel 1: the backlog, shortest and best first (the hover lands on row 1) ---------- */
const SHOWN = 10;
function backlogPanel(data) {
  const maxH = Math.max(...data.backlog.slice(0, SHOWN).map((g) => g.hours));
  const rows = data.backlog
    .slice(0, SHOWN)
    .map(
      (g) => `<div class="bl-hrow bl-brow--${g.rank}">
      <span class="bl-rank">${g.rank}</span>
      <span class="bl-hname">${capsule(g)}<span><b>${esc(g.title)}${g.rank === 1 ? '<em class="bl-next">Up next</em>' : ''}</b><small>${esc(g.genre)}</small></span></span>
      <span class="bl-haccts">${g.owned.map((id) => storeTag(id)).join('')}</span>
      <span class="bl-hnum bl-played">${played(g.played)}</span>
      <span class="bl-hw"><i class="bl-hwbar" style="width:${((g.hours / maxH) * 100).toFixed(1)}%"></i><b>${hrs(g.hours)} h</b></span>
      <span class="bl-rev bl-rev--${reviewCls(g.review)}"><b>${g.review}%</b><small>${esc(g.label)}</small></span>
    </div>`,
    )
    .join('');
  const rest = data.counts.unplayed - SHOWN;
  return `<div class="bl-panel bl-panel--1">
  <div class="bl-sech"><h2>${esc(data.copy.backlogH)}</h2><span>${esc(data.copy.backlogDek)}</span></div>
  <div class="bl-table">
    <div class="bl-hrow bl-hrow--h"><span>#</span><span>Game</span><span>Owned on</span><span>Played</span><span>Main story</span><span>Steam reviews</span></div>
    ${rows}
    <div class="bl-more">${ico('list')}${rest} more, longest and lowest-rated last · ${data.counts.matched} of ${data.counts.unplayed} matched on HowLongToBeat</div>
  </div>
</div>`;
}

/* ---------- panel 2: the wishlist games on sale today, swapped in by the tab ---------- */
function salesPanel(data) {
  const rows = data.sales
    .map(
      (s) => `<div class="bl-srow${s.low ? ' bl-srow--low' : ''}">
      <span class="bl-hname">${capsule(s)}<span><b>${esc(s.title)}</b><small>${s.low ? 'Lowest price ever · ' : ''}ends ${esc(s.ends)}</small></span></span>
      <span class="bl-off">−${s.off}%</span>
      <span class="bl-hnum bl-was">${usd2(s.was)}</span>
      <span class="bl-hnum bl-now">${usd2(s.now)}</span>
      <span class="bl-hnum">${hrs(s.hours)} h</span>
      <span class="bl-rev bl-rev--${reviewCls(s.review)}"><b>${s.review}%</b><small>${esc(s.label)}</small></span>
    </div>`,
    )
    .join('');
  return `<div class="bl-panel bl-panel--2">
  <div class="bl-sech"><h2>${esc(data.copy.salesH)}</h2><span>${esc(data.copy.salesDek)}</span></div>
  <div class="bl-table">
    <div class="bl-srow bl-srow--h"><span>Game</span><span>Off</span><span>Was</span><span>Today</span><span>Main story</span><span>Steam reviews</span></div>
    ${rows}
  </div>
</div>`;
}

/* ---------- what keeps running after the sync ---------- */
function watchSection(data) {
  const cards = data.watch
    .map(
      (w) => `<li class="bl-w">
      <span class="bl-wi">${ico(w.icon)}</span>
      <span class="bl-wt"><small>${esc(w.k)}</small><b>${esc(w.v)}</b><em>${esc(w.note)}</em></span>
    </li>`,
    )
    .join('');
  return `<section class="bl-watch">
  <div class="bl-sech"><h2>${esc(data.copy.watchH)}</h2><span>${esc(data.copy.watchDek)}</span></div>
  <ul class="bl-wlist">${cards}</ul>
</section>`;
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/pc-backlog';
  return `<footer class="bl-foot"><span>${ico('lock')}Read-only access. Nothing bought or installed. Made by Superbot for ${esc(data.meta.user)}</span><span>${esc(url)}</span></footer>`;
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(data) +
    hero(data) +
    storesStrip(data) +
    dupesSection(data) +
    '<section class="bl-panels">' +
      backlogPanel(data) +
      salesPanel(data) +
    '</section>' +
    watchSection(data) +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

/* clock hook: the top bar clock, the sync card, the ring, the counts and the sync bar, all functions of p */
export function render(root, p) {
  if (!root || !root.querySelector) return;
  const t = clamp01(Number(p) || 0);
  const m = fallback.meta;
  const g = syncDone(t);
  const clock = root.querySelector('.bl-clock');
  if (clock) clock.textContent = clockText(m.syncStart + g * m.syncSecs + Math.max(0, t - SYNC_B) * 40);
  const count = root.querySelector('.bl-synccount');
  if (count) count.textContent = `${Math.round(fallback.counts.entries * clamp01(g / 0.72))} of ${fallback.counts.entries} games`;
  const heroEl = root.querySelector('.bl-hero');
  if (heroEl) {
    heroEl.classList.toggle('is-s1', g > 0.08);
    heroEl.classList.toggle('is-s2', g > 0.3);
    heroEl.classList.toggle('is-s3', g > 0.52);
    heroEl.classList.toggle('is-s4', g >= 0.999);
  }
  // the ring grows over the second half of the sync, once the libraries are in
  const grow = ease(clamp01((g - 0.35) / 0.65));
  for (const arc of root.querySelectorAll('.bl-arc')) {
    const a = arcAttrs(Number(arc.dataset.start), Number(arc.dataset.len), RING_C, grow);
    arc.setAttribute('stroke-dasharray', a.dash);
    arc.setAttribute('stroke-dashoffset', a.off);
  }
  // the unplayed arc follows once the stores have landed
  const un = root.querySelector('.bl-uarc');
  if (un) {
    const a = arcAttrs(0, Number(un.dataset.len), IN_C, ease(clamp01((g - 0.7) / 0.3)));
    un.setAttribute('stroke-dasharray', a.dash);
    un.setAttribute('stroke-dashoffset', a.off);
  }
  for (const b of root.querySelectorAll('[data-n]')) b.textContent = n0(Math.round(Number(b.dataset.n) * grow));
  const fill = root.querySelector('.bl-syncfill');
  if (fill) fill.style.width = (t * 100).toFixed(2) + '%';
}

export { build };
