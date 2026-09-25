/* site.js - the generated frontend: superbot.app/p/oled-65
   A price table over four stores: cheapest pick, model x store matrix, 90 day history charts.
   Pure and idempotent. No timers, no rAF, no network, no ids, no listeners, no transitions.
   The kit toggles .is-hover on .op-cell--win and .is-active on .op-lens-btn[data-store=...];
   the store column rules in site.css read those classes (via :has), so no code runs on the click. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const usd = (n) => '$' + n0(n);
const pctText = (p) => (p > 0 ? '+' : '') + p + '%';
/** a count with the noun that agrees with it, so no line can read "1 listings" */
const pl = (n, one, many) => n0(n) + ' ' + (Number(n) === 1 ? one : many);

/* ---------- the charts: one polyline per series, drawn from the weekly reads ---------- */

/** lineChart(vals, { w, h, pad }) -> { line, area, at(i), xs, ys } geometry for a series of prices */
function geom(vals, w, h, pad) {
  const lo = Math.min.apply(null, vals);
  const hi = Math.max.apply(null, vals);
  const span = Math.max(1, hi - lo);
  const xs = (i) => pad + (i / (vals.length - 1)) * (w - pad * 2);
  const ys = (v) => h - pad - ((v - lo) / span) * (h - pad * 2);
  const pts = vals.map((v, i) => xs(i).toFixed(1) + ',' + ys(v).toFixed(1));
  const line = 'M' + pts.join(' L');
  const last = vals.length - 1;
  const area =
    line + ' L' + xs(last).toFixed(1) + ',' + (h - pad) + ' L' + xs(0).toFixed(1) + ',' + (h - pad) + ' Z';
  return { lo, hi, xs, ys, line, area, last };
}

/** the band chart beside the winner: 90 days, with the 90 day low line and a marker on today */
function bigChart(vals, w, h, pad) {
  const g = geom(vals, w, h, pad);
  const lowY = g.ys(g.lo).toFixed(1);
  const grid = [g.hi, Math.round((g.hi + g.lo) / 2), g.lo]
    .map((v) => '<line class="op-ch__grid" x1="' + pad + '" x2="' + (w - pad) + '" y1="' + g.ys(v).toFixed(1) + '" y2="' + g.ys(v).toFixed(1) + '"/>')
    .join('');
  return (
    '<svg class="op-ch op-ch--big" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="90 day price history">' +
    grid +
    '<line class="op-ch__low" x1="' + pad + '" x2="' + (w - pad) + '" y1="' + lowY + '" y2="' + lowY + '"/>' +
    '<path class="op-ch__area" d="' + g.area + '"/>' +
    '<path class="op-ch__line" d="' + g.line + '"/>' +
    '<circle class="op-ch__dot" cx="' + g.xs(g.last).toFixed(1) + '" cy="' + g.ys(vals[g.last]).toFixed(1) + '" r="5"/>' +
    '<circle class="op-ch__ring" cx="' + g.xs(g.last).toFixed(1) + '" cy="' + g.ys(vals[g.last]).toFixed(1) + '" r="9"/>' +
    '<line class="op-ch__rule" x1="' + g.xs(g.last).toFixed(1) + '" x2="' + g.xs(g.last).toFixed(1) + '" y1="' + pad + '" y2="' + (h - pad) + '"/>' +
    '</svg>'
  );
}

/** the small chart in a history card: same reads, no grid, low marker when the last read is the low */
function miniChart(vals, w, h, pad) {
  const g = geom(vals, w, h, pad);
  const lowY = g.ys(g.lo).toFixed(1);
  return (
    '<svg class="op-ch op-ch--mini" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="90 day price history">' +
    '<line class="op-ch__low" x1="' + pad + '" x2="' + (w - pad) + '" y1="' + lowY + '" y2="' + lowY + '"/>' +
    '<path class="op-ch__area" d="' + g.area + '"/>' +
    '<path class="op-ch__line" d="' + g.line + '"/>' +
    '<circle class="op-ch__dot" cx="' + g.xs(g.last).toFixed(1) + '" cy="' + g.ys(vals[g.last]).toFixed(1) + '" r="4"/>' +
    '</svg>'
  );
}

/* ---------- the pieces ---------- */

function tagLow(cls) {
  return '<span class="op-tag op-tag--low' + (cls ? ' ' + cls : '') + '">Lowest in 90 days</span>';
}

function storeChip(s, cls) {
  return (
    '<span class="op-storechip' + (cls ? ' ' + cls : '') + '">' +
    '<span class="op-logo"><img src="' + esc(s.logo) + '" alt="" width="20" height="20"></span>' +
    '<span class="op-storechip__name">' + esc(s.name) + '</span>' +
    '</span>'
  );
}

/** one price cell. data-store rides on the class so site.css can light a whole column from the lens. */
function cell(m, s) {
  const p = m.prices[s.id];
  const col = 'op-cell--' + s.id;
  if (p == null) {
    return (
      '<div class="op-cell ' + col + ' op-cell--none">' +
      '<span class="op-cell__none">Not carried</span>' +
      '<span class="op-cell__sub">checked 09:14</span>' +
      '</div>'
    );
  }
  const isBest = m.best.store === s.id;
  const win = !!m.winId;
  const pct = Math.round(((p - m.avg) / m.avg) * 100);
  const dmod = pct < 0 ? 'down' : pct > 0 ? 'up' : 'flat';
  const tip =
    isBest && win
      ? '<span class="op-tip">' +
        '<b>Lowest in 90 days</b>' +
        '<span>Previous low ' + usd(m.lowPrev) + ' in the 90 days before today</span>' +
        '<span>90 day average ' + m.avgText + '</span>' +
        '<span>' + esc(s.name) + ', shipped to ' + esc(m.zip) + ', tax added at checkout</span>' +
        '</span>'
      : '';
  return (
    '<div class="op-cell ' + col + (isBest ? ' op-cell--best' : '') + (isBest && win ? ' op-cell--win' : '') + '">' +
    '<span class="op-price">' + usd(p) + '</span>' +
    '<span class="op-delta op-delta--' + dmod + '">' + (pct === 0 ? 'flat in 90 days' : pctText(pct) + ' vs 90d avg') + '</span>' +
    (isBest && m.atLow ? tagLow('op-tag--cell') : '') +
    (isBest ? '<span class="op-cell__ship">' + esc(s.ship) + '</span>' : '') +
    tip +
    '</div>'
  );
}

function row(m, stores) {
  return (
    '<article class="op-row' + (m.winId ? ' op-row--win' : '') + '">' +
    '<div class="op-model">' +
    '<img class="op-model__img" src="' + esc(m.img) + '" alt="" width="480" height="270">' +
    '<span class="op-model__t">' +
    '<span class="op-model__name">' + esc(m.brand + ' ' + m.model) + '</span>' +
    '<span class="op-model__sub">' + esc(m.sub) + '</span>' +
    '<span class="op-model__rate">' + m.rating.toFixed(1) + ' stars, ' + n0(m.reviews) + ' ratings</span>' +
    '</span>' +
    '</div>' +
    stores.map((s) => cell(m, s)).join('') +
    '<div class="op-best">' +
    '<span class="op-best__store">' + esc(stores.filter((s) => s.id === m.best.store).map((s) => s.name).join('')) + '</span>' +
    '<span class="op-best__price">' + m.bestText + '</span>' +
    (m.atLow ? tagLow('op-tag--best') : '<span class="op-best__gap">' + usd(m.best.price - m.low) + ' over the 90 day low</span>') +
    '</div>' +
    '</article>'
  );
}

function histCard(m) {
  return (
    '<article class="op-hcard">' +
    '<div class="op-hcard__top">' +
    '<span class="op-hcard__name">' + esc(m.brand + ' ' + m.model) + '</span>' +
    '<span class="op-hcard__now">' + m.bestText + '</span>' +
    '</div>' +
    '<div class="op-hcard__meta">' +
    '<span class="op-hcard__low">low ' + m.lowText + '</span>' +
    '<span>avg ' + m.avgText + '</span>' +
    '<span>high ' + usd(m.high) + '</span>' +
    '</div>' +
    miniChart(m.hist, 320, 120, 12) +
    '<div class="op-hcard__foot">' +
    (m.atLow ? tagLow() : '<span class="op-tag op-tag--flat">' + pctText(m.pct) + ' on the 90 day average</span>') +
    '<span class="op-hcard__store">' + esc(m.storeName) + '</span>' +
    '</div>' +
    '</article>'
  );
}

/* ---------- build ---------- */

export default function build(root, ctx) {
  const data = (ctx && ctx.data) || fallback;
  const list = (data.models || fallback.models).slice();
  const stores = data.stores || fallback.stores;
  const q = data.query || fallback.query;
  const w0 = data.winner || fallback.winner;
  const wStore = data.winnerStore || fallback.winnerStore;
  const hero = data.heroImage || fallback.heroImage;
  const delivered = data.delivered != null ? data.delivered : fallback.delivered;
  const lowCount = (data.atLow || fallback.atLow).length;

  // mark the overall cheapest row (and its cell) once, here
  const winId = w0.id;
  const models = list.map((m) => ({
    ...m,
    winId: m.id === winId,
    zip: q.taxZip,
    lowPrev: Math.min.apply(null, m.hist.slice(0, -1)),
    storeName: (stores.filter((s) => s.id === m.best.store)[0] || {}).name || m.best.store,
  }));

  const crit = [
    ['Size', q.sizeInch + ' inch'],
    ['Panel', 'OLED'],
    ['Carried by', '3 or more stores'],
    ['Read at', q.readAt],
  ];

  const critHtml = crit
    .map((c) => '<li class="op-chip"><span class="op-chip__k">' + esc(c[0]) + '</span><span class="op-chip__v">' + esc(c[1]) + '</span></li>')
    .join('');

  const headHtml =
    '<header class="op-top">' +
    '<div class="op-bar">' +
    '<span class="op-bar__path">superbot.app/p/oled-65</span>' +
    '<span class="op-bar__read"><i class="op-live"><i></i></i>prices read at ' + esc(q.readAt) + '</span>' +
    '</div>' +
    '<h1 class="op-h1">OLED 65, today</h1>' +
    '<p class="op-dek">Every 65 inch OLED we found at Amazon, Best Buy, Walmart and Target, in one price table. Cheapest first, 90 day lows marked. ' +
    pl(q.listings, 'listing', 'listings') + ' read, ' + pl(q.matched, 'model', 'models') + ' matched, ' + q.shown + ' carried by three stores or more.</p>' +
    '<p class="op-ask"><span class="op-ask__lbl">The ask</span> <q class="op-ask__q">' + esc(q.ask) + '</q></p>' +
    '<ul class="op-crit">' + critHtml + '</ul>' +
    '</header>';

  const altHtml = stores
    .filter((s) => s.id !== wStore.id)
    .map((s) => {
      const p = w0.prices[s.id];
      return (
        '<span class="op-alt">' +
        '<img class="op-alt__logo" src="' + esc(s.logo) + '" alt="" width="16" height="16">' +
        '<span class="op-alt__name">' + esc(s.name) + '</span>' +
        '<b class="op-alt__price">' + (p == null ? 'not carried' : usd(p)) + '</b>' +
        '</span>'
      );
    })
    .join('');

  const specHtml = [
    ['Panel', w0.panel],
    ['Refresh', w0.hz + ' Hz'],
    ['HDMI 2.1', String(w0.hdmi)],
    ['Rating', w0.rating.toFixed(1) + ' of 5'],
    ['Reviews', n0(w0.reviews)],
  ]
    .map((s) => '<div class="op-spec"><span class="op-spec__k">' + esc(s[0]) + '</span><span class="op-spec__v">' + esc(s[1]) + '</span></div>')
    .join('');

  const pickHtml =
    '<section class="op-pick">' +
    '<div class="op-pick__main">' +
    '<span class="op-plate"><b>Cheapest right now</b><span>of ' + pl(q.shown, 'model', 'models') + ', ' + q.matched + ' matched</span></span>' +
    '<h2 class="op-wname">' + esc(w0.title) + '</h2>' +
    '<p class="op-wsub">' + esc(w0.sub) + '</p>' +
    '<p class="op-wverdict">' + esc(w0.note) + '. Best price today is at ' + esc(wStore.name) + ', and it is the lowest this model has been in the 90 days we have been reading it.</p>' +
    '<div class="op-wbuy">' +
    '<span class="op-wprice"><span class="op-wprice__cur">$</span>' + n0(w0.best.price) + '</span>' +
    '<span class="op-wbuy__stack">' +
    storeChip(wStore, 'op-storechip--win') +
    '<span class="op-was">was ' + w0.wasText + ' on Jun 27, save ' + w0.saveText + '</span>' +
    '<span class="op-delivered">' + usd(delivered) + ' with ' + esc(q.taxRate) + ' to ' + esc(q.taxZip) + ', ' + esc(wStore.ship).toLowerCase() + '</span>' +
    '</span>' +
    tagLow('op-tag--win') +
    '<a class="op-cta" href="#">Open at ' + esc(wStore.name) + '</a>' +
    '</div>' +
    '<div class="op-alts"><span class="op-alts__lbl">Same model elsewhere</span>' + altHtml + '</div>' +
    '<div class="op-specs">' + specHtml + '</div>' +
    '</div>' +
    '<figure class="op-wfig">' +
    bigChart(w0.hist, 640, 220, 24) +
    '<div class="op-wfig__axis"><span>Jun 27</span><span>Aug 1</span><span>Sep 5</span><span>Today</span></div>' +
    '<div class="op-wfig__labels"><span class="op-wfig__hi">highest ' + w0.wasText + '</span><span class="op-wfig__lo">lowest ' + w0.lowText + '</span></div>' +
    '<img class="op-wfig__img" src="' + esc(hero) + '" alt="" width="1200" height="675">' +
    '<figcaption>90 day history for the ' + esc(w0.brand + ' ' + w0.model) + ', one read a week at all four stores</figcaption>' +
    '</figure>' +
    '</section>';

  const lensHtml =
    '<div class="op-lens">' +
    '<span class="op-lens__lbl">Store lens</span>' +
    stores
      .map(
        (s) =>
          '<button class="op-lens-btn" type="button" data-store="' + esc(s.id) + '">' +
          '<img src="' + esc(s.logo) + '" alt="" width="18" height="18">' +
          '<span>' + esc(s.name) + '</span>' +
          '<em>' + s.count + '</em>' +
          '</button>'
      )
      .join('') +
    '<span class="op-lens__hint">4 stores, one price table</span>' +
    '<span class="op-progress"><i></i></span>' +
    '</div>';

  const mHead =
    '<div class="op-mrow op-mrow--head">' +
    '<div class="op-model op-model--head">Model</div>' +
    stores
      .map(
        (s) =>
          '<div class="op-mhead op-mhead--' + esc(s.id) + '">' +
          storeChip(s) +
          '<span class="op-mhead__n">' + pl(s.count, 'listing', 'listings') + '</span>' +
          '<span class="op-mhead__ship">' + esc(s.ship) + '</span>' +
          '</div>'
      )
      .join('') +
    '<div class="op-mhead op-mhead--best"><span class="op-mhead__t">Cheapest today</span><span class="op-mhead__n">best of 4 stores</span></div>' +
    '</div>';

  const matrixHtml =
    '<section class="op-matrix">' +
    '<div class="op-sechead">' +
    '<h2 class="op-h2">Model against store, price today</h2>' +
    '<p class="op-secp">One row per model, one column per store. The cheapest cell in each row is boxed, and every cell carries the price we read today plus how far it sits from that model\'s 90 day average. Sold out and not carried cells say so.</p>' +
    '</div>' +
    mHead +
    models.map((m) => row(m, stores)).join('') +
    '<div class="op-legend">' +
    '<span class="op-legend__lbl">' + lowCount + ' of ' + q.shown + (lowCount === 1 ? ' sits at its' : ' sit at their') + ' 90 day low today</span>' +
    '<span class="op-legend__k"><i class="op-swatch op-swatch--best"></i>cheapest in the row</span>' +
    '<span class="op-legend__k"><i class="op-swatch op-swatch--low"></i>lowest in 90 days</span>' +
    '<span class="op-legend__k"><i class="op-swatch op-swatch--none"></i>not carried</span>' +
    '</div>' +
    '</section>';

  const histHtml =
    '<section class="op-hist">' +
    '<div class="op-sechead">' +
    '<h2 class="op-h2">90 days, one read a week</h2>' +
    '<p class="op-secp">Each line is the lowest listing price we saw that week at the four stores. The dashed line is the 90 day low, the dot is today.</p>' +
    '</div>' +
    '<div class="op-hgrid">' + models.map(histCard).join('') + '</div>' +
    '</section>';

  const footHtml =
    '<footer class="op-foot">' +
    '<div class="op-foot__col">' +
    '<h3 class="op-foot__h">What was read</h3>' +
    '<p class="op-foot__p">' + pl(q.listings, 'listing', 'listings') + ' at four stores, at ' + esc(q.readAt) + '. ' + q.matched + (q.matched === 1 ? ' was a 65 inch OLED panel;' : ' were 65 inch OLED panels;') + ' ' + q.shown + ' are carried by three stores or more and are on this page. Prices that only exist with a member card or an open box label are left out.</p>' +
    '<ul class="op-foot__list">' +
    stores.map((s) => '<li><img src="' + esc(s.logo) + '" alt="" width="16" height="16"><span>' + esc(s.name) + '</span><b>' + s.count + '</b><em>' + esc(s.note) + '</em></li>').join('') +
    '</ul>' +
    '</div>' +
    '<div class="op-foot__col">' +
    '<h3 class="op-foot__h">What the price includes</h3>' +
    '<p class="op-foot__p">The number in the table is the listing price today. Shipping at Walmart and Target is free over $35, Best Buy the same, Amazon free with Prime. Sales tax is added at checkout, ' + esc(q.taxRate) + ' for ' + esc(q.taxZip) + ', which is the figure on the winner above.</p>' +
    '<p class="op-foot__p">Not included: club memberships, gift card offers, credit for a trade in, and clearance stock that is not shippable.</p>' +
    '</div>' +
    '<div class="op-foot__col">' +
    '<h3 class="op-foot__h">How this page was made</h3>' +
    '<p class="op-foot__p">One ask, ' + pl(q.listings, 'listing', 'listings') + ' read, 90 days of price history pulled, then the page. No spreadsheet in between. <span class="op-mark">superbot</span></p>' +
    '<p class="op-foot__fine">Prices are as listed at ' + esc(q.readAt) + ' and move without notice. Check the listing before you buy. Model names here are illustrative; the photos show televisions, not the exact units named.</p>' +
    '</div>' +
    '</footer>';

  root.innerHTML =
    '<div class="op-page">' + headHtml + pickHtml + lensHtml + matrixHtml + histHtml + footHtml + '</div>';
}

/* clock-driven bits, all pure in p (browser scene progress 0..1): the readout hairline in the lens bar
   fills as the page is scrolled through, and the live dot breathes on the same clock. */
export function render(root, p) {
  const x = Math.max(0, Math.min(1, Number(p) || 0));
  const bar = root.querySelector('.op-progress > i');
  if (bar) bar.style.transform = 'scaleX(' + x.toFixed(4) + ')';
  const dot = root.querySelector('.op-live > i');
  if (dot) {
    const s = 1 + 0.34 * Math.sin(x * Math.PI * 6);
    dot.style.transform = 'scale(' + s.toFixed(3) + ')';
  }
}

/* the contract is a default export; the named one is here so a kit that reads site.build also finds it */
export { build };