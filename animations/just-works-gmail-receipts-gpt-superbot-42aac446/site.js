/* site.js - the frontend superbot ships: superbot.app/p/spend, "2026 spend".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners,
   no CSS animations, no CSS transitions. The kit toggles .is-hover on the September bar and
   .is-active on the Spotify Cancel button; both are styled in site.css. The cancellation state
   is read back by CSS alone (:has), so the monthly total swaps and the row dims with no JS. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** $12,885.98 */
const usd = (n) =>
  '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** $1,284 (whole dollars, for the tight columns) */
const usd0 = (n) => '$' + Math.round(Number(n)).toLocaleString('en-US');
const num = (n) => Number(n).toLocaleString('en-US');

/* ---------- top bar ---------- */

function topBar(D) {
  return `<header class="sp-top">
  <div class="sp-brand">
    <span class="sp-mark"><img src="./brand/gmail.svg" alt=""/></span>
    <span class="sp-word">2026 spend</span>
    <em class="sp-under">every receipt in the inbox, added up</em>
  </div>
  <div class="sp-q">
    <span class="sp-q-k">search</span>
    <span class="sp-q-t">receipt OR invoice, after:2026/01/01</span>
    <span class="sp-q-c">${num(D.query.receipts)} matched</span>
  </div>
  <div class="sp-read">
    <span class="sp-read-t"><i class="sp-live"></i>${num(D.query.read)} emails read</span>
    <span class="sp-read-s">${esc(D.query.window)} · ${esc(D.query.inbox)}</span>
  </div>
</header>`;
}

/* ---------- hero ---------- */

function hero(D) {
  const s = D.summary;
  const rows = [
    [usd(s.avgMonth), 'a month on average', s.months + ' months on record'],
    [usd(s.tax), 'sales tax, read off the receipts', 'pulled from the total on each receipt'],
    [usd(s.biggestOne.amount), 'the single biggest receipt', esc(s.biggestOne.what)],
    [num(s.spendDays), 'days with at least one receipt', 'out of 268 days this year'],
  ];
  return `<section class="sp-hero">
  <div class="sp-hero-main">
    <span class="sp-hero-k">Spent this year</span>
    <span class="sp-total">${usd(s.total)}</span>
    <span class="sp-hero-sub">${num(D.query.receipts)} receipts from ${num(D.query.read)} emails and 1,874 senders</span>
    <span class="sp-hero-delta"><b class="sp-down">${usd(Math.abs(s.delta))} less</b> than ${esc(s.baseline)}</span>
  </div>
  <div class="sp-hero-grid">
    ${rows.map((r) => `<div class="sp-stat"><span class="sp-stat-n">${r[0]}</span><span class="sp-stat-k">${r[1]}</span><span class="sp-stat-s">${r[2]}</span></div>`).join('')}
  </div>
</section>`;
}

/* ---------- by month ---------- */

function chart(D) {
  const live = D.months.filter((m) => m.total > 0);
  const hi = Math.max.apply(null, live.map((m) => m.total));
  const bars = D.months.map((m) => {
    const h = m.total ? Math.max(6, Math.round((m.total / hi) * 100)) : 1;
    const tip = m.total
      ? `<span class="sp-tip"><b>${usd(m.total)}</b><em>${m.n} receipts</em><em>top: ${esc(m.top)}</em>${m.to ? `<em>${esc(m.m)} 1 to ${esc(m.to)}</em>` : ''}</span>`
      : `<span class="sp-tip sp-tip-empty"><b>$0.00</b><em>no receipts yet</em></span>`;
    return `<div class="sp-bar${m.total ? '' : ' sp-bar-empty'}">
      <span class="sp-bar-col"><i style="height:${h}%"></i></span>
      <span class="sp-bar-m">${esc(m.m)}</span>
      ${tip}
    </div>`;
  }).join('');
  return `<section class="sp-chart">
  <div class="sp-sec-h">
    <h2>By month</h2>
    <span class="sp-sec-n">${usd(D.summary.avgMonth)} a month on average · ${esc(D.summary.biggest.month)} was the heaviest at ${usd(D.summary.biggest.amount)}</span>
  </div>
  <div class="sp-chartbody">
    <div class="sp-axis"><span>${usd0(hi)}</span><span>${usd0(hi / 2)}</span><span>$0</span></div>
    <div class="sp-bars">${bars}</div>
  </div>
</section>`;
}

/* ---------- categories ---------- */

function split(D) {
  const top = D.categories[0].total;
  return `<section class="sp-split">
  <div class="sp-sec-h">
    <h2>What it bought</h2>
    <span class="sp-sec-n">sorted from the sender and the subject line of each receipt</span>
  </div>
  <div class="sp-cats">
    ${D.categories.map((c) => `<div class="sp-cat">
      <span class="sp-cat-k"><i style="background:${c.color}"></i>${esc(c.name)}</span>
      <span class="sp-cat-track"><i style="width:${Math.round((c.total / top) * 100)}%;background:${c.color}"></i></span>
      <span class="sp-cat-v">${usd(c.total)}</span>
      <span class="sp-cat-p">${((c.total / D.summary.total) * 100).toFixed(0)}%</span>
    </div>`).join('')}
  </div>
</section>`;
}

/* ---------- subscriptions ---------- */

function subs(D) {
  const S = D.subscriptions;
  return `<section class="sp-subs">
  <div class="sp-sec-h">
    <h2>Subscriptions the receipts repeat on</h2>
    <span class="sp-subs-tot">
      <b class="sp-tot-a">${usd(S.monthly)} a month</b>
      <b class="sp-tot-b">${usd(S.cancelled)} a month</b>
      <em>${S.count} renewals found · ${usd(S.yearly)} a year</em>
    </span>
  </div>
  <div class="sp-sublist">
    ${S.shown.map((s) => `<div class="sp-sub">
      <span class="sp-sub-l"><img src="${esc(s.logo)}" alt=""/></span>
      <span class="sp-sub-t"><b>${esc(s.name)}</b><small>since ${esc(s.since)} · ${s.mails} receipts · next charge ${esc(s.next)}</small></span>
      <b class="sp-sub-a">${usd(s.amount)}</b>
      <button class="sp-cancel" type="button"><span class="sp-cancel-a">Cancel</span><span class="sp-cancel-b">Cancelled</span></button>
    </div>`).join('')}
  </div>
  <div class="sp-folded">
    <span class="sp-folded-k">${S.folded.length} more, ${usd(S.folded.reduce((a, b) => a + b.amount, 0))} a month</span>
    ${S.folded.map((s) => `<span class="sp-fold">${s.logo ? `<img src="${esc(s.logo)}" alt=""/>` : ''}${esc(s.name)} ${usd(s.amount)}</span>`).join('')}
  </div>
</section>`;
}

/* ---------- merchants ---------- */

function merchantRow(m, i, top) {
  const initials = m.name === 'Whole Foods Market' ? 'WF' : m.name === 'Trader Joe’s' ? 'TJ' : m.name === 'Home Depot' ? 'HD' : m.name.slice(0, 1);
  return `<li class="sp-mer-row">
    <span class="sp-mer-i">${String(i + 1).padStart(2, '0')}</span>
    <span class="sp-mer-mon">${esc(initials)}</span>
    <span class="sp-mer-n"><b>${esc(m.name)}</b><small>${m.n} ${m.n === 1 ? 'receipt' : 'receipts'}</small></span>
    <span class="sp-mer-track"><i style="width:${Math.round((m.total / top) * 100)}%"></i></span>
    <b class="sp-mer-v">${usd(m.total)}</b>
  </li>`;
}

function merchants(D) {
  const top = D.merchants[0].total;
  const sum = D.merchants.reduce((a, b) => a + b.total, 0);
  return `<section class="sp-mer">
  <div class="sp-sec-h">
    <h2>Where it went</h2>
    <span class="sp-sec-n">top ${D.merchants.length} of 1,874 senders · ${usd(sum)} between them</span>
  </div>
  <ol class="sp-merlist">${D.merchants.map((m, i) => merchantRow(m, i, top)).join('')}</ol>
</section>`;
}

/* ---------- receipts ---------- */

function receipts(D) {
  return `<section class="sp-receipts">
  <div class="sp-sec-h">
    <h2>Recent receipts</h2>
    <span class="sp-sec-n">subject line, sender and total, newest first</span>
  </div>
  <div class="sp-rows">
    ${D.receipts.map((r) => `<article class="sp-row">
      <img class="sp-row-img" src="${esc(r.img)}" alt=""/>
      <span class="sp-row-t">
        <b class="sp-row-s">${esc(r.subject)}</b>
        <small class="sp-row-m">${esc(r.sender)} · ${esc(r.cat)}</small>
      </span>
      <span class="sp-row-d">${esc(r.date)}</span>
      <b class="sp-row-a">${usd(r.amount)}</b>
      <span class="sp-row-open">Open email</span>
    </article>`).join('')}
  </div>
  <div class="sp-rows-foot">Showing ${num(D.receipts.length)} of ${num(D.query.receipts)} receipts. The rest are grouped by sender in the archive.</div>
</section>`;
}

/* ---------- footer ---------- */

function foot(D) {
  return `<footer class="sp-foot">
  <span>Read from ${esc(D.query.inbox)}. Nothing left the account.</span>
  <span>${esc(D.query.parser)} · rebuilt Sep 25, 09:41</span>
</footer>`;
}

/**
 * build(root, ctx) - appends the whole page. Idempotent: the root is emptied first, so calling it
 * twice on the same root (the hub thumbnail, then the Chrome viewport) leaves one page, not two.
 */
export default function build(root, ctx) {
  const D = ctx && ctx.data && ctx.data.months ? ctx.data : fallback;
  while (root.firstChild) root.removeChild(root.firstChild);
  const html = topBar(D) + hero(D) + chart(D) + split(D) + subs(D) + merchants(D) + receipts(D) + foot(D);
  const box = document.createElement('div');
  box.className = 'sp-page';
  box.innerHTML = html;
  root.appendChild(box);
}