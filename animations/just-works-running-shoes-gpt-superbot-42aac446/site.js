/* site.js - the generated frontend: superbot.app/p/runners
   Pure and idempotent. No timers, no rAF, no network, no element ids, no listeners,
   no CSS transitions. The hover and click states are pure CSS on .is-hover / .is-active,
   toggled by the kit from the plan in ad.js. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n1 = (n) => Number(n).toLocaleString('en-US');
const usd = (n) => '$' + n1(n);
const pad2 = (n) => String(n).padStart(2, '0');

/** 5 notch cushion meter, score filled, label spelled out */
function cushionMeter(score, scale) {
  const segs = [1, 2, 3, 4, 5]
    .map((i) => '<span class="rs-notch' + (i <= score ? ' rs-notch--on' : '') + '"></span>')
    .join('');
  const lv = (scale.levels || []).find((l) => l.score === score) || { name: '', note: '' };
  return (
    '<div class="rs-cush">' +
      '<span class="rs-cush__k">Cushion</span>' +
      '<span class="rs-cush__m">' + segs + '</span>' +
      '<span class="rs-cush__v">' + score + '/5 ' + esc(lv.name) + '</span>' +
      '<span class="rs-cush__n">' + esc(lv.note) + '</span>' +
    '</div>'
  );
}

/** the size 10 run: every size, the count left, 10 marked */
function sizeRun(s) {
  const cells = Object.keys(s.stock)
    .map((k) => {
      const n = s.stock[k];
      const cls = 'rs-sz' + (k === '10' ? ' rs-sz--mine' : '') + (n === 0 ? ' rs-sz--out' : '');
      return (
        '<li class="' + cls + '">' +
          '<span class="rs-sz__sz">' + esc(k) + '</span>' +
          '<span class="rs-sz__n">' + (n === 0 ? 'out' : n) + '</span>' +
        '</li>'
      );
    })
    .join('');
  return (
    '<div class="rs-runrow">' +
      '<span class="rs-runrow__k">Size run<span class="rs-runrow__u">US, pairs left</span></span>' +
      '<ul class="rs-runrow__sizes">' + cells + '</ul>' +
      '<span class="rs-runrow__mine">10 in stock</span>' +
    '</div>'
  );
}

function drop(s, idx, scale) {
  const n = pad2(idx + 1);
  const low = s.stock[10] <= 9;
  return (
    '<article class="rs-drop rs-drop--' + n + '" style="--panel:' + esc(s.panel) + ';--ink:' + esc(s.ink) + ';--accent:' + esc(s.accent) + '">' +
      '<div class="rs-drop__panel">' +
        '<span class="rs-drop__no">' + n + '</span>' +
        '<div class="rs-drop__col">' +
          '<p class="rs-drop__cw">' + esc(s.colorway) + '</p>' +
          '<h3 class="rs-drop__name">' + esc(s.brand + ' ' + s.model) + '</h3>' +
          '<p class="rs-drop__sub">' + esc(s.sub) + '</p>' +
          '<p class="rs-drop__price"><span class="rs-drop__cur">$</span>' + n1(s.price) +
            '<s class="rs-drop__was">' + usd(s.was) + '</s></p>' +
          '<p class="rs-drop__tags">' +
            '<span class="rs-drop__tag"><i></i>Size 10 in stock</span>' +
            '<span class="rs-drop__badge">' + esc(s.badge) + '</span>' +
          '</p>' +
          '<p class="rs-drop__verdict">' + esc(s.verdict) + '</p>' +
        '</div>' +
        '<figure class="rs-drop__fig">' +
          '<img class="rs-drop__img" src="' + esc(s.hero) + '" alt="" width="1024" height="683">' +
          '<figcaption class="rs-drop__cap">' + s.weight + ' g · ' + s.drop + ' mm drop · ' + s.stack + ' mm stack</figcaption>' +
        '</figure>' +
      '</div>' +
      '<div class="rs-drop__rail">' +
        '<div class="rs-spec"><span class="rs-k">Price</span><span class="rs-v">' + usd(s.price) + '</span></div>' +
        '<div class="rs-spec"><span class="rs-k">Weight</span><span class="rs-v">' + s.weight + ' g</span></div>' +
        '<div class="rs-spec"><span class="rs-k">Drop</span><span class="rs-v">' + s.drop + ' mm</span></div>' +
        '<div class="rs-spec"><span class="rs-k">Stack</span><span class="rs-v">' + s.stack + ' mm</span></div>' +
        '<div class="rs-spec"><span class="rs-k">Rating</span><span class="rs-v">' + s.rating.toFixed(1) +
          '<span class="rs-spec__n">' + n1(s.reviews) + ' ratings</span></span></div>' +
        '<div class="rs-spec"><span class="rs-k">Size 10</span><span class="rs-v' + (low ? ' rs-v--low' : '') + '">' +
          s.stock[10] + ' pairs' + (low ? ' left' : '') + '</span></div>' +
        cushionMeter(s.cushion, scale) +
        sizeRun(s) +
        '<button class="rs-add" type="button">' +
          '<span class="rs-add__a">Add size 10</span>' +
          '<span class="rs-add__b">In the bag</span>' +
          '<span class="rs-add__p">' + usd(s.price) + '</span>' +
        '</button>' +
      '</div>' +
    '</article>'
  );
}

function shortRow(s, idx) {
  const low = s.stock[10] <= 9;
  return (
    '<li class="rs-srow">' +
      '<span class="rs-srow__rank">' + pad2(idx + 1) + '</span>' +
      '<span class="rs-srow__swatch" style="--panel:' + esc(s.panel) + '"></span>' +
      '<span class="rs-srow__name"><span class="rs-srow__nm">' + esc(s.brand + ' ' + s.model) + '</span>' +
        '<span class="rs-srow__cw">' + esc(s.colorway) + '</span></span>' +
      '<span class="rs-srow__nums">' +
        '<span class="rs-srow__num"><b>' + usd(s.price) + '</b><i>price</i></span>' +
        '<span class="rs-srow__num"><b>' + s.weight + '</b><i>g</i></span>' +
        '<span class="rs-srow__num"><b>' + s.drop + '</b><i>mm drop</i></span>' +
        '<span class="rs-srow__num"><b>' + s.stack + '</b><i>mm stack</i></span>' +
        '<span class="rs-srow__num"><b>' + s.cushion + '/5</b><i>cushion</i></span>' +
        '<span class="rs-srow__num"><b>' + s.rating.toFixed(1) + '</b><i>' + n1(s.reviews) + ' ratings</i></span>' +
      '</span>' +
      '<span class="rs-srow__stk' + (low ? ' rs-srow__stk--low' : '') + '">' + s.stock[10] + ' in US 10' +
        (low ? ' · low' : '') + '</span>' +
    '</li>'
  );
}

function ladderRow(s, L) {
  const sw = Math.round((s.stack / L.stackMax) * 100);
  const dw = Math.round((s.drop / L.dropMax) * 100);
  return (
    '<li class="rs-lrow">' +
      '<span class="rs-lrow__l" style="--panel:' + esc(s.panel) + '">' + esc(s.brand + ' ' + s.model) + '</span>' +
      '<span class="rs-lrow__bars">' +
        '<span class="rs-lbar">' +
          '<span class="rs-lbar__track"><span class="rs-lbar__fill rs-lbar__fill--stack" style="width:' + sw + '%"></span></span>' +
          '<span class="rs-lbar__n">' + s.stack + ' mm stack</span>' +
        '</span>' +
        '<span class="rs-lbar">' +
          '<span class="rs-lbar__track"><span class="rs-lbar__fill rs-lbar__fill--drop" style="width:' + dw + '%"></span></span>' +
          '<span class="rs-lbar__n">' + s.drop + ' mm drop</span>' +
        '</span>' +
      '</span>' +
      '<span class="rs-lrow__ride">' + s.cushion + '/5 ' + esc((L.levels || {})[s.cushion] || '') + '</span>' +
    '</li>'
  );
}

function stockRow(r) {
  return (
    '<li class="rs-stkrow' + (r.low ? ' rs-stkrow--low' : '') + '">' +
      '<span class="rs-stkrow__l">' + esc(r.label) + '</span>' +
      '<span class="rs-stkrow__bar"><span class="rs-stkrow__fill" style="width:' + Math.min(100, Math.round((r.n / 31) * 100)) + '%"></span></span>' +
      '<span class="rs-stkrow__n">' + r.n + ' pairs</span>' +
      (r.low ? '<span class="rs-stkrow__flag">low</span>' : '') +
    '</li>'
  );
}

export default function build(root, ctx) {
  const data = (ctx && ctx.data) || fallback;
  const shoes = (data.shoes || fallback.shoes).slice().sort((a, b) => a.rank - b.rank);
  const q = data.query || fallback.query;
  const crit = data.criteria || fallback.criteria;
  const rej = data.rejects || fallback.rejects;
  const vd = data.verdict || fallback.verdict;
  const scale = data.cushionScale || fallback.cushionScale;
  const sheet = data.shortlist || fallback.shortlist;
  const L = data.ladder || fallback.ladder;
  const stockRead = data.stockRead || fallback.stockRead;
  const st = data.stats || fallback.stats;

  const critHtml = crit
    .map((c) => '<li class="rs-chip"><span class="rs-chip__k">' + esc(c.label) + '</span><span class="rs-chip__v">' + esc(c.value) + '</span></li>')
    .join('');

  const statsHtml = st
    .map((s) => '<li class="rs-stat"><span class="rs-stat__v">' + esc(s.v) + '</span><span class="rs-stat__k">' + esc(s.k) + '</span></li>')
    .join('');

  const mast =
    '<header class="rs-mast">' +
      '<span class="rs-mast__mark">SPLIT/CO</span>' +
      '<span class="rs-mast__tag">runner\'s dept.</span>' +
      '<span class="rs-mast__mid">' + n1(q.read) + ' listings read · ' + n1(q.reviewsRead) + ' reviews</span>' +
      '<span class="rs-mast__chip">US ' + esc(q.size) + ' · in stock</span>' +
    '</header>';

  const hero =
    '<section class="rs-hero">' +
      '<img class="rs-hero__bg" src="./img/cover.jpg" alt="" width="1600" height="620">' +
      '<div class="rs-hero__box">' +
        '<p class="rs-kicker"><span class="rs-kicker__dot"></span>drop board · ' + esc(q.source) + ' · read at ' + esc(q.readAt) + '</p>' +
        '<h1 class="rs-h1">' + esc(vd.head).toUpperCase() + '</h1>' +
        '<p class="rs-dek">' + esc(vd.dek) + '</p>' +
        '<p class="rs-ask"><span class="rs-ask__k">The ask</span><q class="rs-ask__q">' + esc(q.ask) + '</q></p>' +
        '<ul class="rs-crit">' + critHtml + '</ul>' +
        '<ul class="rs-stats">' + statsHtml + '</ul>' +
      '</div>' +
    '</section>';

  const dropsHead =
    '<div class="rs-drops__head">' +
      '<h2 class="rs-h2">The six that passed</h2>' +
      '<p class="rs-drops__p">Ranked by the ask: cheaper first among equals, then weight, then how the ride splits between soft and firm. Every pair had a US 10 on the shelf at ' + esc(q.readAt) + '.</p>' +
    '</div>';

  const drops =
    '<section class="rs-drops">' +
      dropsHead +
      shoes.map((s, i) => drop(s, i, scale)).join('') +
    '</section>';

  const sheetRows = shoes.map((s, i) => shortRow(s, i)).join('');
  const sheetHtml =
    '<section class="rs-sheet">' +
      '<div class="rs-sheet__head">' +
        '<h2 class="rs-h2">' + esc(sheet.head) + '</h2>' +
        '<p class="rs-sheet__p">' + esc(sheet.dek) + '</p>' +
      '</div>' +
      '<ol class="rs-sheet__list">' + sheetRows + '</ol>' +
      '<p class="rs-sheet__foot">' + esc(sheet.footnote) + '</p>' +
    '</section>';

  const levels = {};
  (scale.levels || []).forEach((l) => { levels[l.score] = l.name; });
  const ladderHtml =
    '<section class="rs-ladder">' +
      '<div class="rs-ladder__head">' +
        '<h2 class="rs-h2">' + esc(L.head) + '</h2>' +
        '<p class="rs-ladder__p">' + esc(L.dek) + '</p>' +
      '</div>' +
      '<ul class="rs-ladder__list">' + shoes.map((s) => ladderRow(s, { stackMax: L.stackMax, dropMax: L.dropMax, levels })).join('') + '</ul>' +
      '<ul class="rs-scale">' +
        (scale.levels || []).map((l) => '<li class="rs-scale__i"><span class="rs-scale__s">' + l.score + '</span><b>' + esc(l.name) + '</b><i>' + esc(l.note) + '</i></li>').join('') +
      '</ul>' +
    '</section>';

  const stockHtml =
    '<section class="rs-stock">' +
      '<div class="rs-stock__head">' +
        '<h2 class="rs-h2">' + esc(stockRead.head) + '</h2>' +
        '<p class="rs-stock__p">' + esc(stockRead.note) + '</p>' +
      '</div>' +
      '<ul class="rs-stock__list">' + (stockRead.rows || []).map(stockRow).join('') + '</ul>' +
    '</section>';

  const notesHtml = shoes
    .map((s) =>
      '<li class="rs-note"><span class="rs-note__l" style="--panel:' + esc(s.panel) + '">' + esc(s.brand + ' ' + s.model) + '</span>' +
        '<ul class="rs-note__list">' + s.notes.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></li>')
    .join('');

  const rejHtml = rej
    .map((r) => '<li class="rs-rej"><span class="rs-rej__k">' + esc(r.why) + '</span><span class="rs-rej__n">' + n1(r.n) + '</span></li>')
    .join('');

  const foot =
    '<footer class="rs-foot">' +
      '<div class="rs-foot__col">' +
        '<h3 class="rs-foot__h">What the filter dropped</h3>' +
        '<ul class="rs-rejlist">' + rejHtml + '</ul>' +
        '<p class="rs-foot__p">Of ' + n1(q.read) + ' listings read, ' + n1(rej.reduce((a, r) => a + r.n, 0)) + ' failed one test and 6 passed all five.</p>' +
      '</div>' +
      '<div class="rs-foot__col">' +
        '<h3 class="rs-foot__h">What the reviews said</h3>' +
        '<ul class="rs-notes">' + notesHtml + '</ul>' +
      '</div>' +
      '<div class="rs-foot__col">' +
        '<h3 class="rs-foot__h">Where the numbers came from</h3>' +
        '<p class="rs-foot__p">' + n1(q.read) + ' listings read on ' + esc(q.source) + ' at ' + esc(q.readAt) + ', ' + n1(q.reviewsRead) + ' reviews read across them. Prices, ratings and stock counts are as listed. Sellers move stock and prices, so check the listing before you buy.</p>' +
        '<p class="rs-foot__p">' + esc(vd.footnote) + '</p>' +
        '<p class="rs-foot__p rs-foot__made">One ask, ' + n1(q.read) + ' listings, 6 pairs kept, then this board. <span class="rs-foot__mark">superbot</span></p>' +
      '</div>' +
    '</footer>';

  root.innerHTML =
    '<div class="rs-board">' + mast + hero + drops + sheetHtml + ladderHtml + stockHtml + foot + '</div>';
}

/* optional clock hook: nothing on this page is driven by t */
export function render() {}

/* the contract is a default export; the named one is here so a kit that reads site.build also finds it */
export { build };