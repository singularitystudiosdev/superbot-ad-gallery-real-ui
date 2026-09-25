/* site.js - the generated frontend: superbot.app/p/friday, "Friday, 2 seats".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners,
   no CSS animations or transitions, no svg defs (no clipPaths, no gradients: every fill is a literal
   color, so two copies of this page can never collide on an id). The kit toggles .is-hover on a seat-map
   hotspot and .is-active on the Checkout button. The hotspot itself never paints: render(root,p) reads its
   .is-hover and marks the matching svg wedge .is-lit, so the highlight is the real wedge and not a polygon
   drawn over it. Everything else about both states is pure CSS in site.css, and nothing runs on the click. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const usd = (n) => '$' + Number(n).toLocaleString('en-US');
const n1 = (n) => Number(n).toLocaleString('en-US');
const r1 = (n) => Math.round(n * 10) / 10;
/* the word that fits the count, so a count of one never prints a plural: plur(1,'site','sites') */
const plur = (n, one, many) => (Number(n) === 1 ? one : many);
/* a count and its noun, singular or plural: withCount(1,'site','sites') -> '1 site' */
const withCount = (n, one, many) => n1(n) + ' ' + plur(n, one, many);

/* ---------- the arena bowl ---------- */

// the oval the whole map is drawn on: 1000 x 640 design units, sections as elliptical annular wedges
const CX = 500, CY = 318, K = 0.6;
const TIERS = [
  { id: 'upper', inner: 262, outer: 330, label: 'Upper deck' },
  { id: 'club', inner: 196, outer: 232, label: 'Club level' },
  { id: 'lower', inner: 132, outer: 190, label: 'Lower bowl' },
];
const FLOOR = 126; // rx of the playing surface

const rad = (deg) => (deg * Math.PI) / 180;
const pt = (rx, a) => [r1(CX + rx * Math.cos(rad(a))), r1(CY + rx * K * Math.sin(rad(a)))];

/** the elliptical annular sector between angles a0..a1 (degrees, screen clockwise from +x) */
function wedge(a0, a1, r0, r1_) {
  const per = (p) => p[0] + ',' + p[1];
  const o0 = pt(r1_, a0), o1 = pt(r1_, a1), i1 = pt(r0, a1), i0 = pt(r0, a0);
  return 'M' + per(o0) +
    ' A' + r1_ + ',' + r1(r1_ * K) + ' 0 0 1 ' + per(o1) +
    ' L' + per(i1) +
    ' A' + r0 + ',' + r1(r0 * K) + ' 0 0 0 ' + per(i0) + ' Z';
}

/** a section as an html hotspot: a bounding-box div clipped to the same wedge, so the pointer can rest on
    a section. An svg <g> has no offsetTop, so the kit cannot place its cursor on one; an html box it can. */
function hotspot(a0, a1, r0, r1_) {
  const N = 7, out = [], back = [];
  for (let i = 0; i <= N; i++) {
    const a = a0 + ((a1 - a0) * i) / N;
    out.push(pt(r1_, a));
    back.unshift(pt(r0, a));
  }
  const pts = out.concat(back);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  pts.forEach((p) => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
  const w = Math.max(0.01, x1 - x0), h = Math.max(0.01, y1 - y0);
  const inner = pt(r1_ + 40, (a0 + a1) / 2);
  const pct = (v) => (v * 100).toFixed(2) + '%';
  return {
    box: 'left:' + ((x0 / 1000) * 100).toFixed(2) + '%;top:' + ((y0 / 640) * 100).toFixed(2) + '%;width:' +
      ((w / 1000) * 100).toFixed(2) + '%;height:' + ((h / 640) * 100).toFixed(2) + '%',
    clip: 'polygon(' + pts.map((p) => pct((p[0] - x0) / w) + ' ' + pct((p[1] - y0) / h)).join(',') + ')',
    tip: 'left:' + (((inner[0] - x0) / w) * 100).toFixed(2) + '%;top:' + (((inner[1] - y0) / h) * 100).toFixed(2) + '%',
  };
}

/** where a section's number sits, and how it is turned: tangential, flipped so it never reads upside down */
function lab(rxMid, aMid) {
  const [x, y] = pt(rxMid, aMid);
  let deg = aMid + 90;
  deg = ((deg % 360) + 360) % 360;
  if (deg > 90 && deg < 270) deg -= 180;
  return { x, y, deg: r1(deg) };
}

/** the price color scale: mint at the cheap end, amber at the $150 line, coral at the top */
function priceColor(each, lo, hi) {
  const mix = (a, b, f) => a.map((c, i) => Math.round(c + (b[i] - c) * f));
  const rgb = (c) => 'rgb(' + c.join(',') + ')';
  const mint = [52, 214, 164], amber = [255, 192, 70], coral = [255, 107, 107], grey = [122, 136, 152];
  const t = Math.max(0, Math.min(1, (each - lo) / Math.max(1, hi - lo)));
  if (each > 150) return rgb(mix(grey, [96, 108, 124], t));
  return t <= 0.5 ? rgb(mix(mint, amber, t * 2)) : rgb(mix(amber, coral, (t - 0.5) * 2));
}

/** the sections of one ring, laid around the oval from the top, clockwise */
function ring(tier, byTier, lo, hi) {
  const out = [];
  const list = byTier[tier.id] || [];
  list.forEach((s, i) => {
    const span = 360 / list.length;
    const a0 = -90 + i * span + 1.2;
    const a1 = -90 + (i + 1) * span - 1.2;
    const aMid = (a0 + a1) / 2;
    const rxMid = (tier.inner + tier.outer) / 2;
    const L = lab(rxMid, aMid);
    const over = s.each > 150;
    const t = {
      s, d: wedge(a0, a1, tier.inner, tier.outer), over,
      fill: priceColor(s.each, lo, hi),
      lx: L.x, ly: L.y, ldeg: L.deg,
      hb: hotspot(a0, a1, tier.inner, tier.outer),
      fs: tier.id === 'upper' ? 12.5 : 14,
    };
    out.push(t);
  });
  return out;
}

function bowl(data) {
  const lo = data.legend.lo, hi = data.legend.hi;
  const byTier = { lower: [], club: [], upper: [] };
  data.sections.forEach((s) => { if (byTier[s.tier]) byTier[s.tier].push(s); });
  const groups = TIERS.map((t) => ({ t, secs: ring(t, byTier, lo, hi) }));

  const ringsHtml = groups.map((g) => g.secs.map((sec) => {
    const s = sec.s;
    return (
      '<g class="tix-sec' + (sec.over ? ' tix-sec--over' : '') + '" data-sec="' + esc(s.id) + '">' +
        '<path class="tix-sec__fill" d="' + sec.d + '" fill="' + sec.fill + '"/>' +
        '<path class="tix-sec__edge" d="' + sec.d + '"/>' +
        '<text class="tix-sec__no" x="' + sec.lx + '" y="' + sec.ly + '" font-size="' + sec.fs +
          '" text-anchor="middle" dominant-baseline="central" transform="rotate(' + sec.ldeg + ' ' + sec.lx + ' ' + sec.ly + ')">' +
          esc(s.id) + '</text>' +
      '</g>'
    );
  }).join('')).join('');

  // the pointer targets: one html wedge per section, clipped to the same shape, carrying that section's pair
  const hotHtml = groups.map((g) => g.secs.map((sec) => {
    const s = sec.s;
    return (
      '<div class="tix-hb" style="' + sec.hb.box + '">' +
        '<i class="tix-hb__w" data-sec="' + esc(s.id) + '" style="clip-path:' + sec.hb.clip + '"></i>' +
        '<span class="tix-tip" style="' + sec.hb.tip + '">' +
          '<b class="tix-tip__k">Section ' + esc(s.id) + ' · Row ' + esc(s.row) + ' · Seats ' + esc(s.seats) + '</b>' +
          '<span class="tix-tip__p">' + usd(s.each) + ' each, all in</span>' +
          '<span class="tix-tip__n">' + esc(s.view) + ' · ' + usd(s.svc + s.fac) + ' of fees' + (sec.over ? ' · over your limit' : '') + '</span>' +
        '</span>' +
      '</div>'
    );
  }).join('')).join('');

  const bestSec = (data.sections || []).find((s) => s.id === (data.best && data.best.sec)) || null;
  const bestMark = (() => {
    if (!bestSec) return '';
    const tier = TIERS.find((t) => t.id === bestSec.tier);
    const list = byTier[bestSec.tier] || [];
    const i = list.indexOf(bestSec);
    const span = 360 / Math.max(1, list.length);
    const aMid = -90 + i * span + span / 2;
    const rxMid = (tier.inner + tier.outer) / 2;
    const [x, y] = pt(rxMid, aMid);
    return (
      '<g class="tix-mark" data-best="' + esc(bestSec.id) + '">' +
        '<circle class="tix-mark__pulse" cx="' + x + '" cy="' + y + '" r="21"/>' +
        '<circle class="tix-mark__dot" cx="' + x + '" cy="' + y + '" r="5.5"/>' +
      '</g>'
    );
  })();

  const tierKey = TIERS.map((t) =>
    '<li class="tix-mapkey__tier">' + esc(t.label) + '</li>'
  ).join('') +
    '<li class="tix-mapkey__tier tix-mapkey__tier--over"><i></i>Over $150 a seat</li>';

  const limitPos = ((150 - lo) / Math.max(1, hi - lo)) * 100;

  // cheapest pair in each ring, so the side column answers "where is the value" without the map
  const cheapestIn = (tier) => {
    const list = (byTier[tier] || []).map((s) => s.each);
    return list.length ? Math.min.apply(null, list) : 0;
  };
  const ringRows = [
    ['upper', 'Upper deck'], ['club', 'Club level'], ['lower', 'Lower bowl'],
  ].map(([id, label]) =>
    '<li class="tix-rings__r"><span class="tix-rings__k">' + esc(label) + '</span>' +
    '<b class="tix-rings__v">' + usd(cheapestIn(id)) + '</b>' +
    '<span class="tix-rings__n">' + (cheapestIn(id) > 150 ? 'past your limit' : 'inside your limit') + '</span></li>'
  ).join('');

  return (
    '<section class="tix-map">' +
      '<div class="tix-map__head">' +
        '<h2 class="tix-h2">' + esc(data.board.mapHead) + '</h2>' +
        '<p class="tix-dek">' + esc(data.board.mapDek) + '</p>' +
      '</div>' +
      '<div class="tix-map__grid">' +
        '<div class="tix-stage">' +
          '<svg class="tix-bowl" viewBox="0 0 1000 640" role="img" aria-label="Arena seat map, sections colored by price">' +
            '<ellipse class="tix-floor" cx="' + CX + '" cy="' + CY + '" rx="' + FLOOR + '" ry="' + r1(FLOOR * K) + '"/>' +
            '<text class="tix-floor__t" x="' + CX + '" y="' + (CY - 8) + '" text-anchor="middle">THE FLOOR</text>' +
            '<text class="tix-floor__s" x="' + CX + '" y="' + (CY + 14) + '" text-anchor="middle">2 seats, side by side</text>' +
            '<path class="tix-floor__mid" d="M' + (CX - 40) + ',' + CY + ' L' + (CX + 40) + ',' + CY + '"/>' +
            ringsHtml +
            bestMark +
          '</svg>' +
          '<div class="tix-hot">' + hotHtml + '</div>' +
          '<div class="tix-scale">' +
            '<span class="tix-scale__k">' + esc(data.board.mapKey) + '</span>' +
            '<span class="tix-scale__bar"></span>' +
            '<span class="tix-scale__l"><i>' + usd(lo) + '</i><i>' + usd(Math.round((lo + hi) / 2)) + '</i><i>' + usd(hi) + '</i></span>' +
            '<span class="tix-scale__limit" style="left:' + limitPos.toFixed(2) + '%"><i></i>$150 each limit</span>' +
          '</div>' +
        '</div>' +
        '<aside class="tix-map__side">' +
          '<ul class="tix-mapkey">' + tierKey + '</ul>' +
          '<div class="tix-mstat tix-mstat--rings">' +
            '<span class="tix-mstat__k">Cheapest pair by ring</span>' +
            '<ul class="tix-rings">' + ringRows + '</ul>' +
          '</div>' +
          '<div class="tix-mstat"><span class="tix-mstat__k">Cheapest pair on the page</span>' +
            '<span class="tix-mstat__v">Section 303, Row 22, Seats 7-8</span>' +
            '<span class="tix-mstat__n">' + usd(96) + ' each all in · ' + usd(192) + ' the pair</span></div>' +
          '<div class="tix-mstat"><span class="tix-mstat__k">Pairs over your limit</span>' +
            '<span class="tix-mstat__v">' + n1(data.summary.pairs - data.summary.under150) + ' ' + plur(data.summary.pairs - data.summary.under150, 'pair asks', 'pairs ask') + ' more than $150 a seat</span>' +
            '<span class="tix-mstat__n">grey on the map</span></div>' +
          '<div class="tix-mstat"><span class="tix-mstat__k">Fee spread</span>' +
            '<span class="tix-mstat__v">' + usd(data.summary.medianFee) + ' median fees on a pair</span>' +
            '<span class="tix-mstat__n">$' + data.summary.medianFeeEach + ' a seat</span></div>' +
          '<p class="tix-map__fine">Map is drawn from the venue chart. Section numbers match the ones on the listings, and every price on it already includes the fees.</p>' +
        '</aside>' +
      '</div>' +
      '<p class="tix-map__note">Sections past $150 a seat stay grey, so the pairs inside your limit are the only ones holding color. The seat map is read from the same fee-inclusive feed as the list below it, section by section.</p>' +
    '</section>'
  );
}

/* ---------- header ---------- */

function head(cfg, s) {
  return (
    '<header class="tix-top">' +
      '<div class="tix-brand">' +
        '<span class="tix-mark" aria-hidden="true"></span>' +
        '<span class="tix-wordmark">Friday, <em>2 seats</em></span>' +
      '</div>' +
      '<div class="tix-when">' +
        '<span class="tix-when__d">' + esc(s.when) + '</span>' +
        '<span class="tix-when__v">' + esc(s.venue) + ' · Doors 6:00 PM</span>' +
      '</div>' +
      '<div class="tix-query">' +
        '<span class="tix-query__k">Your ask</span>' +
        '<span class="tix-query__t">2 seats together, under $150 each, fees shown</span>' +
        '<span class="tix-query__e">Edit</span>' +
      '</div>' +
      '<div class="tix-live">' +
        '<span class="tix-live__dot"></span>' +
        '<span class="tix-live__t">' + esc(s.onSale) + '</span>' +
        '<span class="tix-live__s">' + esc(s.updated) + ' · ' + withCount(s.sites, 'site', 'sites') + '</span>' +
      '</div>' +
      '<span class="tix-scan" style="width:0%"></span>' +
    '</header>'
  );
}

function summaryStrip(data) {
  const s = data.summary;
  const logos = data.sources;
  const pile = logos.map((x) =>
    '<img class="tix-pile__l" src="' + esc(x.logo) + '" alt="" width="16" height="16">').join('');
  return (
    '<section class="tix-summary">' +
      '<div class="tix-stat"><span class="tix-stat__n">' + esc(s.read) + '</span>' +
        '<span class="tix-stat__k">read across ' + withCount(s.sites, 'site', 'sites') + '</span>' +
        '<span class="tix-stat__s">in 38 seconds, ' + n1(s.pairs) + ' of them ' + plur(s.pairs, 'is a pair', 'pairs') + '</span></div>' +
      '<div class="tix-stat tix-stat--good"><span class="tix-stat__n">' + n1(s.under150) + '</span>' +
        '<span class="tix-stat__k">' + plur(s.under150, 'pair under $150 a seat', 'pairs under $150 a seat') + '</span>' +
        '<span class="tix-stat__s">fees included, two seats side by side</span></div>' +
      '<div class="tix-stat"><span class="tix-stat__n">' + usd(s.cheapestEach) + '</span>' +
        '<span class="tix-stat__k">cheapest seat, all in</span>' +
        '<span class="tix-stat__s">upper deck, corner, row 22</span></div>' +
      '<div class="tix-stat"><span class="tix-stat__n">' + data.sources.length + '</span>' +
        '<span class="tix-stat__k">ticket sites opened</span>' +
        '<span class="tix-pile">' + pile + '</span></div>' +
    '</section>'
  );
}

/* ---------- the best pair ---------- */

function bestCard(data) {
  const b = data.listings.find((l) => l.sec === data.best.sec) || data.listings[data.listings.length - 1];
  return (
    '<section class="tix-best">' +
      '<div class="tix-best__shot">' +
        '<img src="' + esc(b.img) + '" alt="View from the seats" width="600" height="450">' +
        '<span class="tix-best__cap">View from row ' + esc(b.row) + ', seat ' + esc(String(b.seats).split('-')[0]) + '</span>' +
      '</div>' +
      '<div class="tix-best__body">' +
        '<span class="tix-best__kick">' + esc(data.board.bestKicker) + '</span>' +
        '<h2 class="tix-h2">Section ' + esc(b.sec) + ', Row ' + esc(b.row) + ', Seats ' + esc(b.seats) + '</h2>' +
        '<p class="tix-best__why">' + esc(data.board.bestBody) + '</p>' +
        '<div class="tix-math">' +
          '<span class="tix-math__part"><b>' + usd(b.base) + '</b> ticket</span>' +
          '<span class="tix-math__plus">+</span>' +
          '<span class="tix-math__part"><b>' + usd(b.svc) + '</b> service fee</span>' +
          '<span class="tix-math__plus">+</span>' +
          '<span class="tix-math__part"><b>' + usd(b.fac) + '</b> facility fee</span>' +
          '<span class="tix-math__eq">=</span>' +
          '<span class="tix-math__part tix-math__part--all"><b>' + usd(b.each) + '</b> each, all in</span>' +
          '<span class="tix-math__pair">' + usd(b.total) + ' for the pair</span>' +
        '</div>' +
        '<div class="tix-best__cta">' +
          '<span class="tix-go" role="button" tabindex="-1">' +
            '<span class="tix-go__label">' + esc(data.board.checkout) + '</span>' +
            '<span class="tix-go__done">' + esc(data.board.checkoutDone) + '</span>' +
          '</span>' +
          '<span class="tix-goodnote">Opening ' + esc(data.checkout.site) + ' checkout · pair held ' + esc(data.checkout.hold) + '</span>' +
          '<span class="tix-go__note">' + esc(data.board.checkoutNote) + '</span>' +
        '</div>' +
      '</div>' +
    '</section>'
  );
}

/* ---------- the pair list ---------- */

function feeBar(l) {
  const pct = (v) => ((v / l.each) * 100).toFixed(1) + '%';
  return (
    '<div class="tix-fee">' +
      '<span class="tix-fee__bar">' +
        '<i class="tix-fee__base" style="width:' + pct(l.base) + '"></i>' +
        '<i class="tix-fee__svc" style="width:' + pct(l.svc) + '"></i>' +
        '<i class="tix-fee__fac" style="width:' + pct(l.fac) + '"></i>' +
      '</span>' +
      '<span class="tix-fee__key">' + usd(l.base) + ' ticket · ' + usd(l.svc) + ' service · ' + usd(l.fac) + ' facility</span>' +
    '</div>'
  );
}

function row(l, src, isBest) {
  return (
    '<article class="tix-row' + (isBest ? ' tix-row--best' : '') + '">' +
      '<div class="tix-row__shot">' +
        '<img src="' + esc(l.img) + '" alt="View from section ' + esc(l.sec) + '" width="600" height="450">' +
        '<span class="tix-row__plat" title="' + esc(src.name) + '">' +
          '<i class="tix-chip"><img src="' + esc(src.logo) + '" alt="" width="16" height="16"></i>' +
          esc(src.name) +
        '</span>' +
      '</div>' +
      '<div class="tix-row__main">' +
        '<h3 class="tix-row__h">Section ' + esc(l.sec) + ' · Row ' + esc(l.row) + ' · Seats ' + esc(l.seats) + '</h3>' +
        '<p class="tix-row__meta">' + esc(l.view) + ' · ' + esc(l.age) + ' · ' + withCount(l.watching, 'person watching', 'watching') + '</p>' +
        '<p class="tix-row__note">' + esc(l.note) + '</p>' +
        (l.deal ? '<span class="tix-deal">' + esc(l.deal) + '</span>' : '') +
      '</div>' +
      '<div class="tix-row__price">' +
        '<span class="tix-row__each">' + usd(l.each) + '<i>each, all in</i></span>' +
        '<span class="tix-row__pair">' + usd(l.total) + ' for the pair</span>' +
        feeBar(l) +
      '</div>' +
      '<span class="tix-row__go">' + esc(src.name) + ' checkout</span>' +
    '</article>'
  );
}

function list(cfg, data) {
  const srcById = {};
  cfg.sources.forEach((s) => { srcById[s.id] = s; });
  const rows = data.listings
    .slice()
    .sort((a, b) => a.each - b.each)
    .map((l) => row(l, srcById[l.platform] || { name: l.platform, logo: '' }, l.sec === data.best.sec))
    .join('');
  const over = data.summary.pairs - data.summary.under150;
  return (
    '<section class="tix-list">' +
      '<div class="tix-lhead">' +
        '<div>' +
          '<h2 class="tix-h2">' + esc(data.board.listHead) + '</h2>' +
          '<p class="tix-dek">' + esc(data.board.listDek) + '</p>' +
        '</div>' +
        '<div class="tix-sort">' +
          '<span class="tix-sort__k">Sort</span>' +
          '<span class="tix-sort__o tix-sort__o--on">All-in price</span>' +
          '<span class="tix-sort__o">View</span>' +
          '<span class="tix-sort__o">Row</span>' +
        '</div>' +
      '</div>' +
      '<div class="tix-rows">' + rows + '</div>' +
      '<div class="tix-more">' +
        '<span class="tix-more__t">' + n1(data.summary.under150 - data.listings.length) + ' more ' + plur(data.summary.under150 - data.listings.length, 'pair', 'pairs') + ' under $150 a seat</span>' +
        '<span class="tix-more__s">' + n1(over) + ' ' + plur(over, 'pair', 'pairs') + ' on the five sites ' + plur(over, 'asks', 'ask') + ' more than $150 a seat and stay hidden</span>' +
        '<span class="tix-more__b">Load 40 more</span>' +
      '</div>' +
    '</section>'
  );
}

/* ---------- footer ---------- */

function footer(cfg, data) {
  const srcRows = cfg.sources.map((s) =>
    '<li class="tix-srcrow">' +
      '<i class="tix-chip"><img src="' + esc(s.logo) + '" alt="" width="18" height="18"></i>' +
      '<span class="tix-srcrow__n">' + esc(s.name) + '</span>' +
      '<span class="tix-srcrow__c">' + n1(s.count) + '</span>' +
      '<span class="tix-srcrow__p">' + esc(data.platformNotes[s.id] || '') + '</span>' +
    '</li>').join('');
  return (
    '<footer class="tix-foot">' +
      '<div class="tix-foot__col tix-foot__col--src">' +
        '<h3 class="tix-foot__h">' + esc(data.board.footHead) + '</h3>' +
        '<p class="tix-foot__p">' + esc(data.board.footBody) + '</p>' +
        '<ul class="tix-srcs">' + srcRows + '</ul>' +
      '</div>' +
      '<div class="tix-foot__col">' +
        '<h3 class="tix-foot__h">Before you buy</h3>' +
        '<p class="tix-foot__p">' + esc(data.board.footFine) + '</p>' +
        '<p class="tix-foot__p">' + withCount(data.summary.raw, 'listing read', 'listings read') + '. ' + n1(data.summary.raw - data.summary.pairs * 2) + ' ' + plur(data.summary.raw - data.summary.pairs * 2, 'was a single seat', 'were single seats') + ' or pairs split apart, so they were dropped.</p>' +
        '<p class="tix-foot__mark">Made by <span class="tix-foot__sb">superbot</span></p>' +
      '</div>' +
    '</footer>'
  );
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || { sources: [] };
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    head(cfg, data.summary) +
    summaryStrip({ ...data, sources: cfg.sources.length ? cfg.sources : fallbackSources() }) +
    bowl(data) +
    bestCard(data) +
    list(cfg, data) +
    footer(cfg, data);
}

function fallbackSources() {
  return fallbackSourcesList;
}
const fallbackSourcesList = [
  { id: 'stubhub', name: 'StubHub', logo: './brand/stubhub.svg', count: 812 },
  { id: 'seatgeek', name: 'SeatGeek', logo: './brand/seatgeek.svg', count: 604 },
  { id: 'ticketmaster', name: 'Ticketmaster', logo: './brand/ticketmaster.svg', count: 588 },
  { id: 'vividseats', name: 'Vivid Seats', logo: './brand/vividseats.svg', count: 486 },
  { id: 'gametime', name: 'Gametime', logo: './brand/gametime.svg', count: 414 },
];

/* clock hook: the header scan line and the pulse ring on the cheapest lower-bowl pair */
export function render(root, p) {
  if (!root || !root.querySelector) return;
  const v = Math.max(0, Math.min(1, Number(p) || 0));

  // The hovered section lights its own svg wedge: the html hotspot itself never paints, it only reports
  // which section the cursor is on. The kit toggles .is-hover on that hotspot before it calls render(root,p),
  // so this mirrors that class onto the matching <g class="tix-sec"> as .is-lit and nothing else. Pure and
  // idempotent: no listener, no timer, no cached state, same DOM plus same p gives the same frame, and
  // calling it twice in a row changes nothing.
  const hot = root.querySelector('.tix-hb__w.is-hover');
  const lit = hot ? hot.getAttribute('data-sec') : '';
  const bowl = root.querySelector('.tix-bowl');
  if (bowl) {
    for (const g of bowl.querySelectorAll('.tix-sec')) {
      g.classList.toggle('is-lit', lit !== '' && g.getAttribute('data-sec') === lit);
    }
  }

  const scan = root.querySelector('.tix-scan');
  if (scan) scan.style.width = (v * 100).toFixed(2) + '%';
  const pulse = root.querySelector('.tix-mark__pulse');
  if (pulse) {
    const tri = 1 - Math.abs(((v * 5) % 2) - 1); // a triangle wave in p, never a timer
    pulse.style.opacity = (0.18 + 0.42 * tri).toFixed(3);
    pulse.style.transform = 'scale(' + (0.9 + 0.35 * tri).toFixed(3) + ')';
    pulse.style.transformOrigin = pulse.getAttribute('cx') + 'px ' + pulse.getAttribute('cy') + 'px';
  }
}

export { build };