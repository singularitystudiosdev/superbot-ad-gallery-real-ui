/* site.js - the generated frontend: superbot.app/p/portfolio-overview, "Portfolio Overview".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the stocks drift row and .is-active on the Stop levels tab;
   both are styled in site.css. The tab click swaps the holdings panel for the stop-levels panel through a
   :has() + sibling rule, so no JS runs on the click. The only clock-driven output is render(root, p): the
   top bar's clock, the sync card ticking through both brokers, the allocation ring growing to its real
   split and the sync bar, all pure functions of the beat's progress. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const usd0 = (n) => '$' + Math.round(n).toLocaleString('en-US');
const usd2 = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);

/** seconds since midnight -> "3:57:41 PM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the sync beat inside the browser scene: both brokers are read from SYNC_A to SYNC_B of p, while ad.js
   holds the scroll on the hero; the ring lands on the real split at SYNC_B and stays for the rest */
const SYNC_A = 0.05;
const SYNC_B = 0.27;

/** p -> 0..1 of the sync done */
export function syncDone(p) {
  return ease(clamp01((p - SYNC_A) / (SYNC_B - SYNC_A)));
}

/* ---------- inline icons: drawn glyphs, never photos ---------- */
const SVG = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6Z"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
  scale: '<path d="M12 3v18M7 21h10"/><path d="M5 7h14"/><path d="m5 7-3 6a3 3 0 0 0 6 0Z"/><path d="m19 7-3 6a3 3 0 0 0 6 0Z"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14 5.3"/><path d="M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
};
const ico = (name, cls = '') =>
  `<svg class="po-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[name]}</svg>`;

/* a holding's mark: the company logo when there is one, else a ticker chip in its sleeve's colour */
const tickerMark = (h) =>
  h.logo
    ? `<img class="po-tmark" src="${esc(h.logo)}" alt=""/>`
    : `<span class="po-tmark po-tmark--${esc(h.cls || 'stocks')}">${esc(h.t.slice(0, 4))}</span>`;

const acctTag = (id) => {
  const a = fallback.accounts.find((x) => x.id === id);
  if (!a) return '';
  return `<span class="po-atag po-atag--${esc(id)}"><img src="${esc(a.logo)}" alt=""/>${esc(id === 'rh' ? 'Robinhood' : a.name === 'Roth IRA' ? 'Roth IRA' : 'Schwab')}</span>`;
};

/* the ring: r 52 (now) and r 40 (target) in a 120 box, drawn clockwise from 12 o'clock */
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;
const TGT_R = 40;
const TGT_C = 2 * Math.PI * TGT_R;
const GAP = 2.4;

function arcAttrs(startFrac, lenFrac, circ, grow) {
  const len = Math.max(0, lenFrac * circ * grow - GAP);
  return { dash: `${len.toFixed(2)} ${circ.toFixed(2)}`, off: (-(startFrac * circ * grow)).toFixed(2) };
}

/* ---------- top bar (sticky, carries the tabs the kit clicks) ---------- */
function topBar(data) {
  return `<header class="po-top">
  <div class="po-topin">
    <div class="po-brand"><img class="po-brandico" src="./brand/app.svg" alt=""/><b>Portfolio Overview</b><span class="po-by">by Superbot</span></div>
    <nav class="po-tabs">
      <span class="po-tab po-tab--1">${ico('list')}Holdings<i>${data.counts.holdings}</i></span>
      <span class="po-tab po-tab--2">${ico('shield')}Stop levels<i>${data.counts.stocks}</i></span>
    </nav>
    <div class="po-status">
      <span class="po-acct"><img src="./brand/schwab.svg" alt=""/><img src="./brand/robinhood.svg" alt=""/>${ico('lock')}Read-only</span>
      <span class="po-live"><i class="po-dot"></i><span class="po-clock">${clockText(data.meta.syncStart)}</span></span>
    </div>
  </div>
  <div class="po-syncbar"><i class="po-syncfill"></i></div>
</header>`;
}

/* ---------- hero: the photo, the headline, the sync card, the stats and the allocation ring ---------- */
function syncCard(data) {
  const ticks = [
    { k: 's1', label: 'Schwab signed in', icon: 'lock' },
    { k: 's2', label: 'Robinhood signed in', icon: 'lock' },
    { k: 's3', label: `${data.counts.positions} positions pulled`, icon: 'list' },
    { k: 's4', label: 'Overview built', icon: 'chart' },
  ]
    .map((x) => `<li class="po-tick po-tick--${x.k}"><span>${ico(x.icon)}</span>${esc(x.label)}</li>`)
    .join('');
  return `<article class="po-sync">
  <div class="po-synchead">
    <p class="po-syncnow">${ico('sync')}<span>Reading both brokers</span><b class="po-synccount">0 of ${data.counts.positions}</b></p>
    <p class="po-stamp">${ico('check')}Synced ${data.counts.positions} positions in ${data.meta.syncSecs} s · ${esc(data.meta.synced)}</p>
  </div>
  <ul class="po-ticks">${ticks}</ul>
</article>`;
}

function allocCard(data) {
  let start = 0;
  let tStart = 0;
  const arcs = [];
  const tgt = [];
  const legend = [];
  for (const s of data.sleeves) {
    const a = arcAttrs(start, s.now / 100, RING_C, 0);
    arcs.push(`<circle class="po-arc po-arc--${s.k}" data-start="${start}" data-len="${s.now / 100}" cx="60" cy="60" r="${RING_R}" stroke-dasharray="${a.dash}" stroke-dashoffset="${a.off}"/>`);
    const b = arcAttrs(tStart, s.target / 100, TGT_C, 1);
    tgt.push(`<circle class="po-tarc po-tarc--${s.k}" cx="60" cy="60" r="${TGT_R}" stroke-dasharray="${b.dash}" stroke-dashoffset="${b.off}"/>`);
    start += s.now / 100;
    tStart += s.target / 100;
    const dir = s.drift > 0 ? 'over' : 'under';
    legend.push(`<li class="po-leg po-leg--${s.k}">
      <i></i><span>${esc(s.label)}</span>
      <b class="po-legnow" data-now="${s.now}">0%</b>
      <small>target ${s.target}%</small>
      <em class="po-legdrift po-legdrift--${dir}">${s.drift > 0 ? '+' : ''}${s.drift}</em>
    </li>`);
  }
  const st = data.sleeves[0];
  return `<article class="po-alloc">
  <p class="po-alloch">${ico('chart')}Combined allocation</p>
  <div class="po-ringwrap">
    <div class="po-ring">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <g transform="rotate(-90 60 60)">
          <circle class="po-ringtrack" cx="60" cy="60" r="${RING_R}"/>
          ${arcs.join('')}
          ${tgt.join('')}
        </g>
      </svg>
      <div class="po-ringtext"><b class="po-ringnow" data-now="${st.now}">0%</b><small>stocks now</small></div>
    </div>
    <p class="po-ringkey"><span><i class="po-k-now"></i>Now</span><span><i class="po-k-tgt"></i>Your 60 / 30 / 10</span></p>
  </div>
  <ul class="po-legend">${legend.join('')}</ul>
  <p class="po-allocfoot"><span>Total</span><b>${usd2(data.total)}</b></p>
</article>`;
}

function hero(data) {
  const hot = data.stops[0];
  return `<section class="po-hero">
  <img class="po-herobg" src="./img/nyse-sign.jpg" alt=""/>
  <div class="po-heroin">
    <div class="po-herotext">
      <p class="po-kicker">${ico('eye')}${esc(data.copy.kicker)}</p>
      <h1>${esc(data.copy.heroH1)}</h1>
      <p class="po-dek">${esc(data.copy.heroDek)}</p>
      ${syncCard(data)}
      <ul class="po-stats">
        <li><b>${data.counts.accounts}</b><span>accounts, 2 brokers</span></li>
        <li><b>${data.counts.holdings}</b><span>holdings merged</span></li>
        <li class="po-stat--over"><b>+${data.sleeves[0].drift} pts</b><span>stocks over target</span></li>
        <li class="po-stat--hot"><b>${hot.cushion}%</b><span>${esc(hot.t)} above its stop</span></li>
      </ul>
    </div>
    ${allocCard(data)}
  </div>
</section>`;
}

/* ---------- the three accounts, side by side ---------- */
function accountsStrip(data) {
  const cards = data.byAccount
    .map(
      (a) => `<li class="po-acc po-acc--${esc(a.id)}">
      <img src="${esc(a.logo)}" alt=""/>
      <span class="po-acct-t"><small>${esc(a.broker)}</small><b>${esc(a.name)} ···${esc(a.no)}</b></span>
      <span class="po-acct-v"><b>${usd2(a.value)}</b><small>${a.positions} positions · ${Math.round((a.value / data.total) * 1000) / 10}%</small></span>
      <span class="po-acct-ok">${ico('check')}Synced</span>
    </li>`,
    )
    .join('');
  return `<section class="po-accts"><ul class="po-acclist">${cards}</ul></section>`;
}

/* ---------- drift against 60/30/10 (the hover lands on the stocks row) ---------- */
function driftSection(data) {
  const rows = data.sleeves
    .map((s) => {
      const over = s.gap < 0;
      return `<div class="po-row po-row--${esc(s.k)}${over ? ' po-row--over' : ''}">
      <span class="po-rlabel"><i></i><b>${esc(s.label)}</b><small>${usd0(s.value)}</small></span>
      <span class="po-rbar">
        <i class="po-rfill" style="width:${s.now}%"></i>
        <i class="po-rtgt" style="left:${s.target}%"><em>${s.target}%</em></i>
      </span>
      <span class="po-rnow"><b>${s.now}%</b><small>now</small></span>
      <span class="po-rdrift po-rdrift--${over ? 'over' : 'under'}">${ico(over ? 'up' : 'down')}${Math.abs(s.drift)} pts</span>
      <span class="po-rgap"><b>${usd0(Math.abs(s.gap))}</b><small>${over ? 'over target' : 'under target'}</small></span>
    </div>`;
    })
    .join('');
  return `<section class="po-drift">
  <div class="po-sech"><h2>${esc(data.copy.driftH)}</h2><span>${esc(data.meta.day)} · ${esc(data.meta.synced)} close</span></div>
  <div class="po-rows">${rows}</div>
  <p class="po-note">${ico('info')}<span>${esc(data.copy.driftNote)}</span></p>
</section>`;
}

/* ---------- panel 1: every holding, both brokers ---------- */
function holdingsPanel(data) {
  const rows = data.holdings
    .map(
      (h) => `<div class="po-hrow">
      <span class="po-hname">${tickerMark(h)}<span><b>${esc(h.t)}</b><small>${esc(h.name)}</small></span></span>
      <span class="po-haccts">${h.accts.map(acctTag).join('')}</span>
      <span class="po-hnum">${h.t === 'CASH' ? '' : n0(h.shares)}</span>
      <span class="po-hnum">${h.t === 'CASH' ? '' : usd2(h.last)}</span>
      <span class="po-hnum po-hval">${usd2(h.value)}</span>
      <span class="po-hw"><i style="width:${Math.min(100, h.weight * 4)}%" class="po-hwbar po-hwbar--${esc(h.cls)}"></i><b>${h.weight.toFixed(1)}%</b></span>
    </div>`,
    )
    .join('');
  return `<div class="po-panel po-panel--1">
  <div class="po-sech"><h2>${esc(data.copy.positionsH)}</h2><span>${data.counts.positions} positions in, ${data.counts.holdings} holdings out</span></div>
  <div class="po-table">
    <div class="po-hrow po-hrow--h"><span>Holding</span><span>Held in</span><span>Shares</span><span>Last</span><span>Value</span><span>Weight</span></div>
    ${rows}
  </div>
</div>`;
}

/* ---------- panel 2: the 7% trailing-stop line under every stock, swapped in by the tab ---------- */
function stopsPanel(data) {
  const rows = data.stops
    .map((s) => {
      // the cushion bar spans 0..8%: how much room the last price has above its stop line
      const room = Math.min(100, (s.cushion / 8) * 100);
      return `<div class="po-srow${s.hot ? ' po-srow--hot' : ''}">
      <span class="po-hname">${tickerMark({ ...s, cls: 'stocks' })}<span><b>${esc(s.t)}</b><small>${esc(s.name)}</small></span></span>
      <span class="po-hnum">${usd2(s.high)}</span>
      <span class="po-hnum po-sline">${usd2(s.line)}</span>
      <span class="po-hnum">${usd2(s.last)}</span>
      <span class="po-scush"><i class="po-scbar"><i style="width:${room.toFixed(1)}%"></i></i><b>${s.cushion.toFixed(1)}%</b></span>
    </div>`;
    })
    .join('');
  return `<div class="po-panel po-panel--2">
  <div class="po-sech"><h2>${esc(data.copy.stopsH)}</h2><span>${esc(data.copy.stopsDek)}</span></div>
  <div class="po-table">
    <div class="po-srow po-srow--h"><span>Stock</span><span>High since buy</span><span>Stop line (−7%)</span><span>Last</span><span>Room above the line</span></div>
    ${rows}
  </div>
</div>`;
}

/* ---------- what keeps running after the sync ---------- */
function watchSection(data) {
  const cards = data.watch
    .map(
      (w) => `<li class="po-w">
      <span class="po-wi">${ico(w.icon)}</span>
      <span class="po-wt"><small>${esc(w.k)}</small><b>${esc(w.v)}</b><em>${esc(w.note)}</em></span>
    </li>`,
    )
    .join('');
  return `<section class="po-watch">
  <div class="po-sech"><h2>${esc(data.copy.watchH)}</h2><span>${esc(data.copy.watchDek)}</span></div>
  <ul class="po-wlist">${cards}</ul>
</section>`;
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/portfolio-overview';
  return `<footer class="po-foot"><span>${ico('lock')}Read-only access. No trades placed. Made by Superbot for ${esc(data.meta.user)}</span><span>${esc(url)}</span></footer>`;
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(data) +
    hero(data) +
    accountsStrip(data) +
    driftSection(data) +
    '<section class="po-panels">' +
      holdingsPanel(data) +
      stopsPanel(data) +
    '</section>' +
    watchSection(data) +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished overview
  render(root, 1);
}

/* clock hook: the top bar clock, the sync card, the ring and the sync bar, all functions of p */
export function render(root, p) {
  if (!root || !root.querySelector) return;
  const t = clamp01(Number(p) || 0);
  const m = fallback.meta;
  const g = syncDone(t);
  const clock = root.querySelector('.po-clock');
  if (clock) clock.textContent = clockText(m.syncStart + g * m.syncSecs + Math.max(0, t - SYNC_B) * 40);
  const count = root.querySelector('.po-synccount');
  if (count) count.textContent = `${Math.round(fallback.counts.positions * clamp01(g / 0.72))} of ${fallback.counts.positions}`;
  const heroEl = root.querySelector('.po-hero');
  if (heroEl) {
    heroEl.classList.toggle('is-s1', g > 0.08);
    heroEl.classList.toggle('is-s2', g > 0.3);
    heroEl.classList.toggle('is-s3', g > 0.72);
    heroEl.classList.toggle('is-s4', g >= 0.999);
  }
  // the ring grows over the second half of the sync, once positions are in
  const grow = ease(clamp01((g - 0.35) / 0.65));
  for (const arc of root.querySelectorAll('.po-arc')) {
    const a = arcAttrs(Number(arc.dataset.start), Number(arc.dataset.len), RING_C, grow);
    arc.setAttribute('stroke-dasharray', a.dash);
    arc.setAttribute('stroke-dashoffset', a.off);
  }
  for (const b of root.querySelectorAll('[data-now]')) b.textContent = (Number(b.dataset.now) * grow).toFixed(1) + '%';
  const fill = root.querySelector('.po-syncfill');
  if (fill) fill.style.width = (t * 100).toFixed(2) + '%';
}

export { build };
