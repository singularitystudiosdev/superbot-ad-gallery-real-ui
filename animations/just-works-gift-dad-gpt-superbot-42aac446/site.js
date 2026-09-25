/* site.js - the generated frontend: superbot.app/p/dad, the gift guide "For Dad, who fishes".
   Pure and idempotent: no timers, no rAF, no network, no ids, no listeners, no transitions.
   States come from the kit: .is-hover on a .gd-gift row, .is-active on the .gd-wrap switch.
   render(root, p) re-prices the sticky bar's budget meter for the pick the guide is on, and mirrors the
   gift-wrap switch. Everything the ad shows is reachable from t alone: build() lays the page out once and
   render() only writes values derived from p and the classes the kit toggles. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const usd = (n) => '$' + Number(n).toFixed(2);
const num = (n) => Number(n).toLocaleString('en-US');
/** a count with the noun that agrees with it, so no line can read "1 picks" */
const pl = (n, one, many) => num(n) + ' ' + (Number(n) === 1 ? one : many);

function slugClass(s) {
  return String(s).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

/** five rating squares, the filled count rounded to the nearest half step */
function stars(r) {
  const full = Math.round(r);
  let out = '';
  for (let i = 0; i < 5; i++) out += `<i class="gd-star${i < full ? ' on' : ''}"></i>`;
  return `<span class="gd-stars">${out}</span>`;
}

function pickRow(p) {
  return `
<article class="gd-gift gd-k-${slugClass(p.kind)}">
  <figure class="gd-shot">
    <img src="${esc(p.img)}" alt="${esc(p.name)}" width="800" height="600"/>
    <figcaption class="gd-shot-no">${esc(p.no)}</figcaption>
    <span class="gd-shot-tag">${esc(usd(p.price))}</span>
    <span class="gd-shot-kind">${esc(p.kind)}</span>
  </figure>
  <div class="gd-info">
    <span class="gd-src"><img class="gd-amz" src="./brand/amazon.svg" alt="" width="15" height="15"/>amazon.com<i class="gd-dot"></i>arrives Thu<i class="gd-dot"></i>order by 11:40 pm Wed</span>
    <h3 class="gd-name">${esc(p.name)}</h3>
    <p class="gd-sub">${esc(p.sub)}</p>
    <div class="gd-note">
      <span class="gd-note-k">Why he'll use it</span>
      <p>${esc(p.note)}</p>
    </div>
    <ul class="gd-detail">${p.detail.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
    <div class="gd-meta">
      <span class="gd-price">${esc(usd(p.price))}</span>
      <span class="gd-rate">${p.rating.toFixed(1)}${stars(p.rating)}<em>${num(p.reviews)} ratings</em></span>
      <span class="gd-cap">under $50</span>
    </div>
  </div>
</article>`;
}

function funnelRow(f, n) {
  const w = Math.max(6, Math.round((f.n / n) * 100));
  return `<li class="gd-fr"><span class="gd-fr-k">${esc(f.k)}</span><i class="gd-fr-b"><i style="width:${w}%"></i></i><b class="gd-fr-n">${num(f.n)}</b></li>`;
}

function dropRow(d) {
  return `<li class="gd-dr"><span class="gd-dr-k">${esc(d.why)}</span><b class="gd-dr-n">${num(d.n)}</b></li>`;
}

function budgetRow(k, v, strong) {
  return `<li class="gd-br${strong ? ' strong' : ''}"><span>${esc(k)}</span><b>${esc(v)}</b></li>`;
}

/** the build ctx gives the ad's data module; the import is only a dev fallback for preview.html */
function dataOf(ctx) {
  const d = (ctx && ctx.data) || {};
  return d.picks ? d : fallback;
}

export default function build(root, ctx) {
  const D = dataOf(ctx);
  root.__gd = D;
  const picks = D.picks || [];
  const b = D.budget || {};
  const w = D.wrap || {};
  const q = D.query || {};
  const v = D.verdict || {};

  const first = picks[0] || { no: '', name: '', price: 0 };
  const cap0 = b.cap || 50;
  root.innerHTML = `
<header class="gd-bar">
  <span class="gd-bar-l">
    <span class="gd-mark"><i></i>superbot</span>
    <span class="gd-crumb">gift guide <b>/ Dad</b></span>
  </span>
  <span class="gd-meter-wrap">
    <span class="gd-meter-k"><b class="gd-meter-no">${esc(first.no)}</b><span class="gd-meter-t">${esc(first.name)}</span></span>
    <span class="gd-meter"><i class="gd-meter-f" style="width:${Math.min(100, (first.price / cap0) * 100).toFixed(2)}%"></i><u class="gd-meter-cap"></u></span>
    <span class="gd-meter-v"><b class="gd-meter-p">${esc(usd(first.price))}</b> of ${esc(usd(cap0))} <em class="gd-meter-l">${esc(usd(Math.max(0, cap0 - first.price)))} left</em></span>
  </span>
  <span class="gd-wrap">
    <span class="gd-wrap-sw"><i></i></span>
    <span class="gd-wrap-t">Gift wrap <b>+${esc(usd(w.fee || 0))}</b><small>kraft paper, card inside</small></span>
  </span>
</header>

<section class="gd-hero">
  <img class="gd-hero-img" src="./img/hero.jpg" alt="A boat on a lake at sunset" width="1600" height="900"/>
  <span class="gd-hero-scrim"></span>
  <div class="gd-hero-in">
    <span class="gd-eyebrow">${esc(q.site || 'amazon.com')} <i class="gd-dot"></i> ${pl(q.read || 0, 'gift listing', 'gift listings')} read <i class="gd-dot"></i> ${esc(q.readAt || '')}</span>
    <h1>For Dad,<em>who fishes.</em></h1>
    <p class="gd-dek">${esc(v.dek || '')}</p>
    <div class="gd-chips">
      <span>${esc(usd(b.cheapest || 0))} to ${esc(usd(b.dearest || 0))}</span>
      <span>${esc(q.filter || '4.3 stars and up')}</span>
      <span>${pl(picks.length, 'pick', 'picks')}, all in stock</span>
    </div>
  </div>
  <div class="gd-hero-foot">
    <span><b>${num(q.read || 0)}</b> listings read</span>
    <span><b>${num((D.dropped && D.dropped[0] ? D.dropped[0].n : 0))}</b> dropped for thin reviews</span>
    <span><b>${num(picks.length)}</b> kept, one per kind of gear</span>
    <span class="gd-hero-when">checked 09:42 today</span>
  </div>
</section>

<section class="gd-list-h">
  <span class="gd-sec-k">The list</span>
  <h2 class="gd-sec-t">${pl(picks.length, 'pick', 'picks')}</h2>
  <p class="gd-sec-p">One per kind of gear, so nothing here repeats what is already in his box. Prices are the listing's own, read this morning.</p>
</section>
<section class="gd-list">
  ${picks.map(pickRow).join('')}
</section>

<section class="gd-wrapline">
  <div class="gd-wrapcard">
    <span class="gd-sec-k">At checkout</span>
    <h2 class="gd-wrap-h">${esc(w.head || 'Add gift wrap')}</h2>
    <ul class="gd-wrap-l">${(w.lines || []).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <div class="gd-wrap-state">
      <i class="gd-wrap-bulb"></i>
      <span class="gd-wrap-state-t">Not on the order</span>
      <span class="gd-wrap-state-s">Standard box, no price on the slip</span>
    </div>
  </div>
  <div class="gd-funnel">
    <span class="gd-sec-k">${pl(q.read || 0, 'listing', 'listings')} to ${num(picks.length)}</span>
    <h2 class="gd-wrap-h">How the list was cut</h2>
    <ol class="gd-funnel-l">${(D.funnel || []).map((f, i, a) => funnelRow(f, a[0].n)).join('')}</ol>
  </div>
</section>

<footer class="gd-foot">
  <div class="gd-budget">
    <h2>What the list costs</h2>
    <ul class="gd-budget-l">
      ${budgetRow('Dearest pick', usd(b.dearest || 0))}
      ${budgetRow('Median', usd(b.median || 0))}
      ${budgetRow('Average', usd(b.average || 0))}
      ${budgetRow('Cheapest pick', usd(b.cheapest || 0))}
      ${budgetRow('All eight', usd(b.total || 0))}
      ${budgetRow('Your cap', usd(b.cap || 0), true)}
    </ul>
    <p class="gd-budget-note">${esc(b.line || '')}</p>
  </div>
  <div class="gd-drop">
    <h2>What was dropped</h2>
    <ul class="gd-drop-l">${(D.dropped || []).map(dropRow).join('')}</ul>
    <p class="gd-drop-note">Every gift on this page sits under $${esc(String(b.cap || 50))} and arrives Thursday. Ratings and review counts are the listing's own.</p>
  </div>
  <div class="gd-foot-note">
    <span class="gd-mark"><i></i>superbot</span>
    <p>${esc(v.note || '')}</p>
  </div>
</footer>`;
}

/** p is the browser scene's progress 0..1: the bar prices the pick the guide is on */
export function render(root, p) {
  if (!root) return;
  const D = root.__gd || fallback;
  const picks = D.picks || [];
  if (!picks.length) return;
  const table = (D.focusAt && D.focusAt.length ? D.focusAt : [[0, 0], [1, picks.length - 1]]);
  const x = Math.min(1, Math.max(0, p));
  let focus = table[0][1];
  for (let i = 1; i < table.length; i++) {
    const a = table[i - 1];
    const c = table[i];
    if (x <= c[0]) {
      const span = c[0] - a[0];
      const t = span > 0 ? (x - a[0]) / span : 0;
      focus = a[1] + (c[1] - a[1]) * t;
      break;
    }
    focus = c[1];
  }
  const pick = picks[Math.min(picks.length - 1, Math.max(0, Math.round(focus)))];
  const sw = root.querySelector('.gd-wrap');
  const on = !!(sw && sw.classList.contains('is-active'));
  if (sw) sw.setAttribute('aria-checked', on ? 'true' : 'false');
  const fee = on ? (D.wrap && D.wrap.fee) || 0 : 0;
  const cap = (D.budget && D.budget.cap) || 50;
  const total = pick.price + fee;
  const left = Math.max(0, cap - total);

  const q = (sel) => root.querySelector(sel);
  const no = q('.gd-meter-no');
  const nm = q('.gd-meter-t');
  const fill = q('.gd-meter-f');
  const price = q('.gd-meter-p');
  const lft = q('.gd-meter-l');
  if (no) no.textContent = pick.no;
  if (nm) nm.textContent = pick.name;
  if (fill) fill.style.width = Math.min(100, (total / cap) * 100).toFixed(2) + '%';
  if (price) price.textContent = usd(total);
  if (lft) lft.textContent = on ? usd(left) + ' left with wrap' : usd(left) + ' left';

  root.classList.toggle('is-wrapped', on);
  const st = q('.gd-wrap-state-t');
  const ss = q('.gd-wrap-state-s');
  const stail = q('.gd-wrap-t small');
  if (st) st.textContent = on ? 'Added to this order: ' + pick.name : 'Not on the order';
  if (ss) ss.textContent = on
    ? 'Gift wrap ' + usd(fee) + ' on pick ' + pick.no + ', paper and card inside'
    : 'Standard box, no price on the slip';
  if (stail) stail.textContent = on ? 'wrapped, ' + usd(fee) + ' added' : 'kraft paper, card inside';
}