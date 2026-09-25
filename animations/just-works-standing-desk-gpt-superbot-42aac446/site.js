/* site.js - the generated frontend: superbot.app/p/desks
   Pure and idempotent. No timers, no rAF, no network, no ids, no listeners.
   The Compare toggle is driven by the kit's .is-active class and the sibling combinator
   (.dw-cmp.is-active ~ .dw-sheet), so the click in ad.js needs no code here. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n1 = (n) => Number(n).toLocaleString('en-US');
const usd = (n) => '$' + n1(n);
const inch = (n) => String(Math.round(n * 10) / 10);
const rng = (h) => inch(h[0]) + ' to ' + inch(h[1]) + ' in';
/** the sheet column stays on one line, so it takes the short range */
const rngShort = (h) => inch(h[0]) + '-' + inch(h[1]) + ' in';
const db = (n) => Number(n).toFixed(1) + ' dB';

/** one cell of a compare row */
function cmpVal(d, r) {
  if (r.fmt === 'usd') return usd(d.price);
  if (r.fmt === 'range') return rng(d.height);
  if (r.fmt === 'in') return inch(d[r.field]) + ' in';
  if (r.fmt === 'lb') return n1(d[r.field]) + ' lb';
  if (r.fmt === 'db') return db(d[r.field]);
  if (r.fmt === 'yr') return d[r.field] + ' years';
  if (r.fmt === 'n') return String(d[r.field]);
  return String(d[r.field]);
}

function spec(label, value) {
  return '<div class="dw-spec"><span class="dw-k">' + esc(label) + '</span><span class="dw-v">' + esc(value) + '</span></div>';
}

function stars(p, n) {
  return (
    '<span class="dw-score">' + p.toFixed(1) + '</span>' +
    '<span class="dw-rv">' + n1(n) + '</span>'
  );
}

/** the 5 to 1 star distribution, one stacked bar */
function distBar(d) {
  const segs = d.dist
    .map((p, i) => '<span class="dw-seg dw-seg--' + (5 - i) + '" style="flex-grow:' + Math.round(p * 1000) + '"></span>')
    .join('');
  return '<span class="dw-dist">' + segs + '</span>';
}

function row(d) {
  return (
    '<article class="dw-row dw-row--' + esc(d.id) + (d.rank === 1 ? ' dw-row--top' : '') + '">' +
      '<span class="dw-c dw-c--rank">' + String(d.rank).padStart(2, '0') + '</span>' +
      '<img class="dw-c dw-thumb" src="' + esc(d.thumb) + '" alt="" width="480" height="360">' +
      '<div class="dw-c dw-ident">' +
        '<h3 class="dw-name">' + esc(d.brand + ' ' + d.model) + '</h3>' +
        '<p class="dw-sub">' + esc(d.sub) + '</p>' +
        '<p class="dw-tag">' + esc(d.badge) + '</p>' +
      '</div>' +
      '<div class="dw-c dw-price"><span class="dw-cur">$</span>' + n1(d.price) + '</div>' +
      '<div class="dw-specs">' +
        spec('Lift', rngShort(d.height)) +
        spec('Motors', d.motors) +
        spec('Load', n1(d.load) + ' lb') +
        spec('Top', inch(d.topWidth) + ' in') +
        spec('Noise', db(d.noise)) +
      '</div>' +
      '<div class="dw-c dw-cellrate">' + stars(d.rating, d.reviews) + '</div>' +
      '<div class="dw-c dw-c--distcell">' + distBar(d) + '</div>' +
      '<a class="dw-c dw-cta" href="#">View on Amazon</a>' +
    '</article>'
  );
}

function comparePanel(list, cmp) {
  const L = list.find((d) => d.id === cmp.left) || list[0];
  const R = list.find((d) => d.id === cmp.right) || list[1];
  const rows = cmp.rows
    .map((r) => {
      const bl = r.better === 'left' ? ' dw-cv--better' : '';
      const br = r.better === 'right' ? ' dw-cv--better' : '';
      return (
        '<div class="dw-cmprow">' +
          '<span class="dw-ck">' + esc(r.k) + '</span>' +
          '<span class="dw-cv' + bl + '">' + esc(cmpVal(L, r)) + '</span>' +
          '<span class="dw-cv' + br + '">' + esc(cmpVal(R, r)) + '</span>' +
          '<span class="dw-cn">' + esc(r.note) + '</span>' +
        '</div>'
      );
    })
    .join('');

  return (
    '<div class="dw-cmppanel">' +
      '<div class="dw-cmphead">' +
        '<h3 class="dw-cmphead__h">' + esc(L.brand + ' ' + L.model) + ' against ' + esc(R.brand + ' ' + R.model) + '</h3>' +
        '<p class="dw-cmphead__p">Ten numbers, one line each. The desk with the better number is marked.</p>' +
      '</div>' +
      '<div class="dw-cmpgrid">' +
        '<div class="dw-cmpcol dw-cmpcol--l">' +
          '<img class="dw-cmpimg" src="' + esc(L.thumb) + '" alt="" width="480" height="360">' +
          '<span class="dw-cmpname">' + esc(L.brand + ' ' + L.model) + '</span>' +
          '<span class="dw-cmpprice">' + usd(L.price) + '</span>' +
          '<span class="dw-cmprate">' + L.rating.toFixed(1) + ' stars, ' + n1(L.reviews) + ' ratings</span>' +
          '<a class="dw-cta dw-cta--wide" href="#">View on Amazon</a>' +
        '</div>' +
        '<div class="dw-cmpmid">' + rows + '</div>' +
        '<div class="dw-cmpcol dw-cmpcol--r">' +
          '<img class="dw-cmpimg" src="' + esc(R.thumb) + '" alt="" width="480" height="360">' +
          '<span class="dw-cmpname">' + esc(R.brand + ' ' + R.model) + '</span>' +
          '<span class="dw-cmpprice">' + usd(R.price) + '</span>' +
          '<span class="dw-cmprate">' + R.rating.toFixed(1) + ' stars, ' + n1(R.reviews) + ' ratings</span>' +
          '<a class="dw-cta dw-cta--wide" href="#">View on Amazon</a>' +
        '</div>' +
      '</div>' +
      '<p class="dw-cmpverdict">' + esc(cmp.verdict) + '</p>' +
    '</div>'
  );
}

export default function build(root, ctx) {
  const data = (ctx && ctx.data) || fallback;
  const list = (data.desks || fallback.desks).slice().sort((a, b) => a.rank - b.rank);
  const q = data.query || fallback.query;
  const crit = data.criteria || fallback.criteria;
  const rej = data.rejects || fallback.rejects;
  const vd = data.verdict || fallback.verdict;
  const cmp = data.compare || fallback.compare;
  const read = data.ratingRead || fallback.ratingRead;
  const w = list[0];

  const critHtml = crit
    .map((c) => '<li class="dw-chip"><span class="dw-chip__k">' + esc(c.label) + '</span><span class="dw-chip__v">' + esc(c.value) + '</span></li>')
    .join('');

  const headHtml =
    '<header class="dw-top">' +
      '<div class="dw-srcbar">' +
        '<span class="dw-src"><img class="dw-srclogo" src="./brand/amazon.svg" alt="" width="18" height="18"> amazon.com</span>' +
        '<span class="dw-read">read at ' + esc(q.readAt) + '</span>' +
      '</div>' +
      '<h1 class="dw-h1">' + esc(vd.head) + '</h1>' +
      '<p class="dw-dek">' + esc(vd.dek) + '</p>' +
      '<p class="dw-ask"><span class="dw-ask__lbl">The ask</span> <q class="dw-ask__q">' + esc(q.ask) + '</q></p>' +
      '<ul class="dw-crit">' + critHtml + '</ul>' +
    '</header>';

  const statsHtml = [
    spec('Height', rng(w.height)),
    spec('Motors', w.motors),
    spec('Load', n1(w.load) + ' lb'),
    spec('Top', inch(w.topWidth) + ' in'),
    spec('Noise', db(w.noise)),
  ].join('');

  const winnerHtml =
    '<section class="dw-winner">' +
      '<div class="dw-winner__main">' +
        '<div class="dw-plate"><span class="dw-plate__rank">01</span><span class="dw-plate__of">of 6</span></div>' +
        '<h2 class="dw-wname">' + esc(w.brand + ' ' + w.model) + '</h2>' +
        '<p class="dw-wsub">' + esc(w.sub) + '</p>' +
        '<p class="dw-wverdict">' + esc(w.verdict) + '</p>' +
        '<div class="dw-wstats">' + statsHtml + '</div>' +
        '<div class="dw-wbuy">' +
          '<span class="dw-wprice"><span class="dw-cur">$</span>' + n1(w.price) + '</span>' +
          '<a class="dw-cta dw-cta--solid" href="#">View on Amazon</a>' +
          '<span class="dw-wnote">Prime, in stock</span>' +
        '</div>' +
      '</div>' +
      '<figure class="dw-wphoto">' +
        '<img src="' + esc(w.hero) + '" alt="" width="1000" height="667">' +
        '<figcaption>Top ' + inch(w.topWidth) + ' x ' + inch(w.topDepth) + ' in, steel frame, 3 stage</figcaption>' +
      '</figure>' +
    '</section>';

  const barsHtml = read.bars
    .map(
      (b) =>
        '<div class="dw-histrow">' +
          '<span class="dw-hl">' + b.star + ' star</span>' +
          '<span class="dw-hb"><span class="dw-hb__fill" style="width:' + b.pct + '%"></span></span>' +
          '<span class="dw-hp">' + b.pct + '%</span>' +
        '</div>'
    )
    .join('');
  const notesHtml = read.notes.map((t) => '<li class="dw-rnote">' + esc(t) + '</li>').join('');

  const rateHtml =
    '<section class="dw-rate">' +
      '<div class="dw-rate__bars">' +
        '<h3 class="dw-rate__h">' + esc(read.head) + '</h3>' + barsHtml +
      '</div>' +
      '<ul class="dw-rate__notes">' + notesHtml + '</ul>' +
    '</section>';

  const sheetHead =
    '<div class="dw-row dw-row--head">' +
      '<span class="dw-c dw-c--rank">#</span>' +
      '<span class="dw-c dw-c--photo"></span>' +
      '<span class="dw-c dw-c--ident">Desk</span>' +
      '<span class="dw-c dw-c--price">Price</span>' +
      '<span class="dw-c dw-c--spec">Lift range</span>' +
      '<span class="dw-c dw-c--spec">Motors</span>' +
      '<span class="dw-c dw-c--spec">Load</span>' +
      '<span class="dw-c dw-c--spec">Top width</span>' +
      '<span class="dw-c dw-c--spec">Noise</span>' +
      '<span class="dw-c dw-c--rate">Rating</span>' +
      '<span class="dw-c dw-c--distcell">Stars</span>' +
      '<span class="dw-c dw-c--cta"></span>' +
    '</div>';

  const sheetHtml =
    '<div class="dw-sheet">' +
      sheetHead +
      list.map(row).join('') +
    '</div>';

  const viewsHtml =
    '<section class="dw-views">' +
      '<div class="dw-viewbar">' +
        '<span class="dw-count">6 of ' + n1(q.read) + ' pass</span>' +
        '<span class="dw-sort">Sorted by lift range, widest first</span>' +
      '</div>' +
      '<button class="dw-cmp" type="button">' +
        '<span class="dw-cmp__lbl">Compare the top two</span>' +
        '<span class="dw-cmp__track"><span class="dw-cmp__knob"></span></span>' +
      '</button>' +
      sheetHtml +
      comparePanel(list, cmp) +
    '</section>';

  const rejHtml = rej
    .map((r) => '<li class="dw-rej"><span class="dw-rej__k">' + esc(r.why) + '</span><span class="dw-rej__n">' + n1(r.n) + '</span></li>')
    .join('');

  const footHtml =
    '<footer class="dw-foot">' +
      '<div class="dw-foot__col">' +
        '<h3 class="dw-foot__h">Dropped on the way</h3>' +
        '<ul class="dw-rejlist">' + rejHtml + '</ul>' +
      '</div>' +
      '<div class="dw-foot__col">' +
        '<h3 class="dw-foot__h">Where the numbers came from</h3>' +
        '<p class="dw-foot__p">' + esc(q.read) + ' listings read on amazon.com, ' + esc(q.readAt) + '. Star ratings and review counts are as listed. Load figures are the seller numbers, not a bench test of ours. Prices move, so check the listing before you buy.</p>' +
      '</div>' +
      '<div class="dw-foot__col">' +
        '<h3 class="dw-foot__h">How this page was made</h3>' +
        '<p class="dw-foot__p">One ask, ' + n1(q.reviewsRead) + ' reviews read, 6 desks kept, then the page. No spreadsheet in between. <span class="dw-foot__mark">superbot</span></p>' +
      '</div>' +
    '</footer>';

  root.innerHTML = '<div class="dw-page">' + headHtml + winnerHtml + rateHtml + viewsHtml + footHtml + '</div>';
}

/* optional clock hook: nothing in this page is driven by t */
export function render() {}

/* the contract is a default export; the named one is here so a kit that reads site.build also finds it */
export { build };