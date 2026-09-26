/* site.js - the generated frontend: superbot.app/p/wantlist-watch, "Wantlist Watch".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the bought log row and .is-active on the Collection tab; both
   are styled in site.css. The tab click swaps the checkout panel for the collection panel through a
   :has() + sibling rule, so no JS runs on the click. The only clock-driven output is render(root, p): the
   top bar's clock and sync line and the watch bar, all pure functions of the beat's progress. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const usd = (n) => '$' + n0(n);
const pad = (n) => String(n).padStart(2, '0');

/** seconds since midnight -> "3:12:04 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* ---------- inline icons: drawn glyphs, never photos ---------- */
const SVG = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.4"/><path d="M12 5.5a6.5 6.5 0 0 1 6.5 6.5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2.5l2.2 11h11.1l2-8H6.4"/>',
  card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10.5h18"/>',
  folder: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/>',
  tag: '<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9Z"/><circle cx="8" cy="8" r="1.4"/>',
};
const ico = (name, cls = '') =>
  `<svg class="ww-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[name]}</svg>`;

const grade = (g) => `<span class="ww-grade ww-grade--${esc(g).replace('+', 'p').toLowerCase()}">${esc(g)}</span>`;
const mark = (ok) => `<span class="ww-mark ${ok ? 'is-ok' : 'is-no'}">${ico(ok ? 'check' : 'x')}</span>`;

/* ---------- top bar (sticky, carries the tabs the kit clicks) ---------- */
function topBar(cfg, data) {
  return `<header class="ww-top">
  <div class="ww-topin">
    <div class="ww-brand">${ico('disc', 'ww-brandico')}<b>Wantlist Watch</b><span class="ww-by">by Superbot</span></div>
    <nav class="ww-tabs">
      <span class="ww-tab ww-tab--1">${ico('moon')}Overnight</span>
      <span class="ww-tab ww-tab--2">${ico('folder')}Collection<i>${n0(data.counts.collectionBefore + 1)}</i></span>
    </nav>
    <div class="ww-status">
      <span class="ww-acct"><img src="./brand/discogs.svg" alt=""/>@${esc(data.meta.user)}</span>
      <span class="ww-live"><i class="ww-dot"></i><span class="ww-clock">${clockText(data.meta.clockStart)}</span></span>
    </div>
  </div>
  <div class="ww-watchbar"><i class="ww-watchfill"></i></div>
</header>`;
}

/* ---------- hero: the photo, the headline, and the order card ---------- */
function hero(data) {
  const o = data.order;
  const c = data.counts;
  return `<section class="ww-hero">
  <img class="ww-herobg" src="./img/hero.jpg" alt=""/>
  <div class="ww-heroin">
    <div class="ww-herotext">
      <p class="ww-kicker">${ico('moon')}${esc(data.copy.kicker)}</p>
      <h1>${esc(data.copy.heroH1)}</h1>
      <p class="ww-dek">${esc(data.copy.heroDek)}</p>
      <ul class="ww-stats">
        <li><b>${n0(c.watched)}</b><span>records watched</span></li>
        <li><b>${n0(c.listings)}</b><span>listings checked</span></li>
        <li><b>${n0(c.bought)}</b><span>copy bought</span></li>
        <li class="ww-stat--hot"><b>${usd(c.underMax)}</b><span>under your max</span></li>
      </ul>
    </div>
    <article class="ww-order">
      <div class="ww-orderart"><img src="${esc(o.img)}" alt=""/><span class="ww-orderbadge">${ico('check')}Bought ${esc(data.meta.bought)}</span></div>
      <div class="ww-orderbody">
        <p class="ww-orderartist">${esc(o.artist)}</p>
        <h2>${esc(o.title)}</h2>
        <p class="ww-orderpress">${esc(o.press)} · ${esc(o.cat)}</p>
        <dl class="ww-orderrows">
          <div><dt>Media / Sleeve</dt><dd>${grade(o.media)}${grade(o.sleeve)}</dd></div>
          <div><dt>Paid</dt><dd><b>${usd(o.price)}</b><small>your max ${usd(o.max)}</small></dd></div>
          <div><dt>Seller</dt><dd><b>${esc(o.seller)}</b><small>${ico('star')}${o.rating}% · ${n0(o.ratings)}</small></dd></div>
        </dl>
        <p class="ww-orderfoot">${ico('folder')}Filed to Collection › ${esc(o.folder)}<span>#${esc(o.number)}</span></p>
      </div>
    </article>
  </div>
</section>`;
}

/* ---------- rules + the overnight log (the hover lands on the bought row) ---------- */
function rulesSection(data) {
  const chips = data.rules
    .map(
      (r, i) => `<li class="ww-rule">
      <span class="ww-rulei">${ico(['disc', 'tag', 'star'][i])}</span>
      <span class="ww-rulet"><small>${esc(r.label)}</small><b>${esc(r.value)}</b><em>${esc(r.note)}</em></span>
      ${mark(true)}
    </li>`,
    )
    .join('');
  const rows = data.log
    .map(
      (l) => `<div class="ww-row${l.buy ? ' ww-row--buy' : ''}">
      <span class="ww-rtime">${esc(l.time)}</span>
      <span class="ww-rgrade">${grade(l.media)}<i>/</i>${grade(l.sleeve)}${mark(l.ok[0])}</span>
      <span class="ww-rprice"><b>${usd(l.price)}</b>${mark(l.ok[1])}</span>
      <span class="ww-rseller"><b>${esc(l.seller)}</b><small>${l.rating}%</small>${mark(l.ok[2])}</span>
      <span class="ww-rresult">${l.buy ? ico('cart') : ''}${esc(l.result)}</span>
    </div>`,
    )
    .join('');
  return `<section class="ww-rules">
  <div class="ww-sech"><h2>${esc(data.copy.rulesH)}</h2><span>Night Ferry · max ${usd(data.order.max)}</span></div>
  <ul class="ww-rulelist">${chips}</ul>
  <div class="ww-log">
    <div class="ww-loghead"><p>${esc(data.copy.logH)}</p><span>${ico('eye')}Watching since ${esc(data.meta.started)}</span></div>
    <div class="ww-row ww-row--h"><span>Listed</span><span>Media / Sleeve</span><span>Price</span><span>Seller</span><span>Result</span></div>
    ${rows}
  </div>
</section>`;
}

/* ---------- panel 1: checkout, second by second ---------- */
function checkoutPanel(data) {
  const icons = ['check', 'lock', 'cart', 'card', 'folder'];
  const steps = data.checkout
    .map(
      (s, i) => `<li class="ww-step">
      <span class="ww-stepi">${ico(icons[i] || 'check')}</span>
      <span class="ww-stept"><b>${esc(s.title)}</b><small>${esc(s.sub)}</small></span>
      <time>${esc(s.time)}</time>
    </li>`,
    )
    .join('');
  return `<div class="ww-panel ww-panel--1">
  <div class="ww-sech"><h2>${esc(data.copy.checkoutH)}</h2><span>20 seconds, start to filed</span></div>
  <ol class="ww-steps">${steps}</ol>
</div>`;
}

/* ---------- panel 2: the collection, swapped in by the Collection tab ---------- */
function collectionPanel(data) {
  const chips = data.folders
    .map((f) => `<span class="ww-folder${f.hot ? ' is-hot' : ''}">${esc(f.name)}<i>${n0(f.n)}</i></span>`)
    .join('');
  const cards = data.shelf
    .map(
      (r) => `<figure class="ww-rec${r.fresh ? ' ww-rec--new' : ''}">
      <div class="ww-recart"><img src="${esc(r.img)}" alt=""/>${r.fresh ? `<span class="ww-new">${ico('check')}New</span>` : ''}</div>
      <figcaption><b>${esc(r.title)}</b><small>${esc(r.artist)}</small><span>${grade(r.grade)}<em>${esc(r.added)}</em></span></figcaption>
    </figure>`,
    )
    .join('');
  return `<div class="ww-panel ww-panel--2">
  <div class="ww-collhead">
    <img src="./img/shelf.jpg" alt=""/>
    <div><p>${esc(data.copy.collectionH)}</p><h2>${n0(data.counts.collectionBefore + 1)} records<span>+1 tonight</span></h2></div>
  </div>
  <div class="ww-folders">${chips}</div>
  <div class="ww-shelf">${cards}</div>
</div>`;
}

/* ---------- the rest of the wantlist ---------- */
function watchSection(data) {
  const rows = data.watching
    .map((w) => {
      const over = w.low > w.max;
      const why = over ? `Lowest ${usd(w.low)}, over max` : w.why === 'grade' ? `${usd(w.low)} copy is ${w.grade}` : `${usd(w.low)} seller under 99%`;
      return `<li class="ww-want">
      <img src="${esc(w.img)}" alt=""/>
      <span class="ww-wantt"><b>${esc(w.title)}</b><small>${esc(w.artist)}</small></span>
      <span class="ww-wantmax"><small>Your max</small><b>${usd(w.max)}</b></span>
      <span class="ww-wantwhy">${esc(why)}</span>
      <span class="ww-wantst">${ico('eye')}Watching</span>
    </li>`;
    })
    .join('');
  return `<section class="ww-watch">
  <div class="ww-sech"><h2>${esc(data.copy.watchH)}</h2><span>${esc(data.copy.watchDek)}</span></div>
  <ul class="ww-wants">${rows}</ul>
</section>`;
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/wantlist-watch';
  return `<footer class="ww-foot"><span>${ico('disc')}Made by Superbot for @${esc(data.meta.user)}</span><span>${esc(url)}</span></footer>`;
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(cfg, data) +
    hero(data) +
    rulesSection(data) +
    '<section class="ww-panels">' +
      checkoutPanel(data) +
      collectionPanel(data) +
    '</section>' +
    watchSection(data) +
    footer(cfg, data);
}

/* clock hook: the top bar clock, the sync line and the watch bar, all functions of the beat's progress */
export function render(root, p) {
  if (!root || !root.querySelector) return;
  const t = Math.max(0, Math.min(1, Number(p) || 0));
  const clock = root.querySelector('.ww-clock');
  if (clock) clock.textContent = clockText(fallback.meta.clockStart + t * 66);
  const fill = root.querySelector('.ww-watchfill');
  if (fill) fill.style.width = (t * 100).toFixed(2) + '%';
}

export { build };
