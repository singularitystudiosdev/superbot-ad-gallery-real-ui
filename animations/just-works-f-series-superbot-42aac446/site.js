/* site.js - the generated frontend: superbot.app/p/f-series, "F-Series Finder".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document
   listeners, no CSS animations. The kit toggles .is-hover on a listing card and
   .is-active on a filter chip; both are styled in site.css, and the F-250 click
   re-filters the grid through a :has() + sibling rule, so no JS runs on the click. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const usd = (n) => '$' + Number(n).toLocaleString('en-US');
const n1 = (n) => Number(n).toLocaleString('en-US');
const kMiles = (n) => Math.round(n / 1000) + 'k';

function dealClass(deal) {
  return deal === 'Great' ? 'ffx-deal--great' : deal === 'Good' ? 'ffx-deal--good' : 'ffx-deal--fair';
}

/* ---------- top bar ---------- */

function topBar(cfg, s) {
  return (
    '<header class="ffx-top">' +
      '<div class="ffx-brand">' +
        '<span class="ffx-mark">F</span>' +
        '<span class="ffx-wordmark">F-Series <em>Finder</em></span>' +
        '<span class="ffx-tagline">used trucks, one board</span>' +
      '</div>' +
      '<div class="ffx-query">' +
        '<span class="ffx-query__glyph" aria-hidden="true"></span>' +
        '<span class="ffx-query__text">F-Series, 2015 and newer, under 120,000 mi, any distance</span>' +
        '<span class="ffx-query__edit">Edit</span>' +
      '</div>' +
      '<div class="ffx-live">' +
        '<span class="ffx-live__dot"></span>' +
        '<span class="ffx-live__text">Index rebuilt ' + esc(s.rebuilt) + '</span>' +
        '<span class="ffx-live__sub">' + n1(s.states) + ' states, ' + s.platforms + ' marketplaces</span>' +
      '</div>' +
      '<span class="ffx-scanline" style="width:0%"></span>' +
    '</header>'
  );
}

/* ---------- filter bar ---------- */

function filterBar(chips, note) {
  const chipHtml = chips
    .map((c) => '<button class="ffx-chip ffx-chip--' + esc(c.key) + '" type="button">' + esc(c.label) + '</button>')
    .join('');

  return (
    '<section class="ffx-filters">' +
      '<div class="ffx-chiprow">' + chipHtml + '</div>' +
      '<div class="ffx-setter ffx-setter--year">' +
        '<span class="ffx-setter__k">Year</span>' +
        '<span class="ffx-track"><span class="ffx-track__fill"></span><span class="ffx-track__knob ffx-track__knob--a"></span><span class="ffx-track__knob ffx-track__knob--b"></span></span>' +
        '<span class="ffx-setter__v">2015 to 2024</span>' +
      '</div>' +
      '<div class="ffx-setter ffx-setter--miles">' +
        '<span class="ffx-setter__k">Max miles</span>' +
        '<span class="ffx-track ffx-track--half"><span class="ffx-track__fill ffx-track__fill--half"></span><span class="ffx-track__knob ffx-track__knob--mid"></span></span>' +
        '<span class="ffx-setter__v">120,000</span>' +
      '</div>' +
      '<div class="ffx-settermore">' +
        '<span class="ffx-criterion">Clean title</span>' +
        '<span class="ffx-criterion">Photo checked</span>' +
        '<span class="ffx-reset">Reset all</span>' +
      '</div>' +
      '<p class="ffx-note ffx-note--f250">' + esc(note) + '</p>' +
    '</section>'
  );
}

/* ---------- summary strip ---------- */

function trendBars(trend) {
  const lo = Math.min.apply(null, trend);
  const hi = Math.max.apply(null, trend);
  return trend
    .map((v) => {
      const h = 18 + Math.round(((v - lo) / Math.max(1, hi - lo)) * 70);
      return '<span class="ffx-spark__bar" style="height:' + h + '%"></span>';
    })
    .join('');
}

function summaryStrip(s, srcs) {
  const logos = srcs
    .map((x) => '<img class="ffx-srcpile__logo" src="' + esc(x.logo) + '" alt="" width="16" height="16">')
    .join('');

  return (
    '<section class="ffx-summary">' +
      '<div class="ffx-stat">' +
        '<span class="ffx-stat__n">' + n1(s.active) + '</span>' +
        '<span class="ffx-stat__k">active listings</span>' +
        '<span class="ffx-stat__sub">' + n1(s.raw) + ' read, ' + s.dropped + ' duplicates dropped</span>' +
      '</div>' +
      '<div class="ffx-stat ffx-stat--median">' +
        '<span class="ffx-stat__n">' + usd(s.medianPrice) + '</span>' +
        '<span class="ffx-stat__k">median ask</span>' +
        '<span class="ffx-stat__sub">' + esc(s.trendNote) + '</span>' +
        '<span class="ffx-spark">' + trendBars(s.trend) + '</span>' +
      '</div>' +
      '<div class="ffx-stat">' +
        '<span class="ffx-stat__n">' + s.platforms + '</span>' +
        '<span class="ffx-stat__k">platforms searched</span>' +
        '<span class="ffx-srcpile">' + logos + '</span>' +
      '</div>' +
      '<div class="ffx-stat">' +
        '<span class="ffx-stat__n">' + n1(s.newToday) + '</span>' +
        '<span class="ffx-stat__k">listed today</span>' +
        '<span class="ffx-stat__sub">median ' + n1(s.medianMiles) + ' mi, ' + esc(s.medianDays + ' days on market') + '</span>' +
      '</div>' +
    '</section>'
  );
}

/* ---------- listing cards ---------- */

function priceBar(l) {
  const fillW = Math.max(28, Math.min(94, Math.round((l.price / l.market) * 82)));
  const pinX = 82;
  return (
    '<div class="ffx-vs">' +
      '<div class="ffx-vs__top">' +
        '<span class="ffx-vs__market">Market ' + esc(l.marketText) + '</span>' +
        '<span class="ffx-vs__delta' + (l.over ? ' ffx-vs__delta--over' : '') + '">' +
          (l.over ? '+' + usd(l.delta) : usd(-l.delta) + ' under') +
        '</span>' +
      '</div>' +
      '<span class="ffx-vs__bar">' +
        '<span class="ffx-vs__zone"></span>' +
        '<span class="ffx-vs__fill" style="width:' + fillW + '%"></span>' +
        '<span class="ffx-vs__pin" style="left:' + pinX + '%"></span>' +
      '</span>' +
      '<span class="ffx-vs__scale"><i>under the metro median</i><i>median ' + esc(l.marketText) + '</i></span>' +
    '</div>'
  );
}

function card(l, src) {
  return (
    '<article class="ffx-card ffx-card--' + esc(l.family) + '">' +
      '<div class="ffx-shot">' +
        '<img class="ffx-photo" src="' + esc(l.img) + '" alt="' + esc(l.title) + '" width="640" height="480">' +
        '<span class="ffx-plate"><img class="ffx-plate__logo" src="' + esc(src.logo) + '" alt="" width="16" height="16">' + esc(src.short) + '</span>' +
        '<span class="ffx-when">' + esc(l.posted) + '</span>' +
        '<span class="ffx-stock">' + esc(l.stock) + '</span>' +
      '</div>' +
      '<div class="ffx-body">' +
        '<h3 class="ffx-name">' + esc(l.title) + '</h3>' +
        '<p class="ffx-spec">' + esc(l.cab) + ', ' + esc(l.spec) + '</p>' +
        '<p class="ffx-facts">' + kMiles(l.miles) + ' mi<span class="ffx-dot"></span>' + esc(l.city) + ', ' + esc(l.state) + '</p>' +
        '<div class="ffx-pricerow">' +
          '<span class="ffx-price">' + esc(l.priceText) + '</span>' +
          '<span class="ffx-deal ' + dealClass(l.deal) + '">' + esc(l.deal) + '</span>' +
        '</div>' +
        priceBar(l) +
        '<div class="ffx-actions">' +
          '<span class="ffx-act">Save</span>' +
          '<span class="ffx-act ffx-act--go">Open on ' + esc(src.short) + '</span>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

function listings(cfg, data) {
  const srcById = {};
  cfg.sources.forEach((s) => { srcById[s.id] = { name: s.name, short: s.name.split(' ')[0], logo: s.logo }; });
  srcById.carsdotcom = { name: 'Cars.com', short: 'Cars.com', logo: './brand/carsdotcom.svg' };
  srcById.ebay = { name: 'eBay Motors', short: 'eBay', logo: './brand/ebay.svg' };

  const tabs = data.sortTabs
    .map((t, i) => '<span class="ffx-sorttab' + (i === 3 ? ' is-active' : '') + '">' + esc(t) + '</span>')
    .join('');

  const notes = Object.keys(data.filterNotes)
    .map((k) => '<p class="ffx-note ffx-note--' + esc(k) + '">' + esc(data.filterNotes[k]) + '</p>')
    .join('');

  const cards = data.listings
    .map((l) => card(l, srcById[l.platform] || { short: l.platform, logo: '' }))
    .join('');

  return (
    '<section class="ffx-listings">' +
      '<div class="ffx-lhead">' +
        '<div class="ffx-lhead__main">' +
          '<h2 class="ffx-h2">' + esc(data.board.head) + '</h2>' +
          '<p class="ffx-dek">' + n1(data.counts.showing) + ' of ' + n1(data.summary.active) + ' listings shown. Updated ' + esc(data.summary.rebuilt) + '.</p>' +
        '</div>' +
        '<div class="ffx-sortrow">' +
          '<span class="ffx-sortrow__k">Sort</span>' + tabs +
        '</div>' +
      '</div>' +
      '<div class="ffx-notes">' + notes + '</div>' +
      '<div class="ffx-grid">' + cards + '</div>' +
      '<div class="ffx-more">' +
        '<span class="ffx-more__text">' + n1(data.summary.active - data.counts.showing) + ' more listings match these filters</span>' +
        '<span class="ffx-more__btn">Load 60 more</span>' +
      '</div>' +
    '</section>'
  );
}

/* ---------- map strip ---------- */

function pins(pins) {
  return pins
    .map((p) =>
      '<span class="ffx-pin' + (p.side === -1 ? ' ffx-pin--left' : '') + '" style="left:' + p.x + '%;top:' + p.y + '%">' +
        '<span class="ffx-pin__dot"></span>' +
        '<span class="ffx-pin__card"><b>' + usd(p.price) + '</b>' + esc(p.city) + ', ' + esc(p.state) +
          '<span class="ffx-pin__n">' + p.n + ' listings</span></span>' +
      '</span>')
    .join('');
}

function mapStrip(data) {
  const cheapest = data.mapPins.slice().sort((a, b) => a.price - b.price)[0];
  const busiest = data.mapPins.slice().sort((a, b) => b.n - a.n)[0];
  return (
    '<section class="ffx-map">' +
      '<div class="ffx-map__head">' +
        '<h2 class="ffx-h2">Where the ' + n1(data.summary.active) + ' are</h2>' +
        '<p class="ffx-dek">Median asking price per metro. Pins sized by how many trucks are live there.</p>' +
      '</div>' +
      '<div class="ffx-map__grid">' +
        '<div class="ffx-map__plate">' +
          '<span class="ffx-map__us" aria-hidden="true"></span>' +
          pins(data.mapPins) +
          '<span class="ffx-map__key">Pins: median ask per metro, updated ' + esc(data.summary.rebuilt) + '</span>' +
        '</div>' +
        '<div class="ffx-map__side">' +
          '<div class="ffx-mstat">' +
            '<span class="ffx-mstat__k">Cheapest metro</span>' +
            '<span class="ffx-mstat__v">' + esc(cheapest.city) + ', ' + esc(cheapest.state) + '</span>' +
            '<span class="ffx-mstat__n">' + usd(cheapest.price) + '</span>' +
          '</div>' +
          '<div class="ffx-mstat">' +
            '<span class="ffx-mstat__k">Most listings</span>' +
            '<span class="ffx-mstat__v">' + esc(busiest.city) + ', ' + esc(busiest.state) + '</span>' +
            '<span class="ffx-mstat__n">' + busiest.n + ' trucks</span>' +
          '</div>' +
          '<div class="ffx-mstat">' +
            '<span class="ffx-mstat__k">4x4 share</span>' +
            '<span class="ffx-mstat__v">' + data.summary.fourByFour + ' percent of listings</span>' +
            '<span class="ffx-mstat__n">' + data.summary.diesel + ' percent diesel</span>' +
          '</div>' +
          '<p class="ffx-map__fine">Miles are seller reported. A truck with no mileage on the listing is shown with the metro median until the seller answers.</p>' +
        '</div>' +
      '</div>' +
    '</section>'
  );
}

/* ---------- footer ---------- */

function footer(cfg, data) {
  const srcRows = cfg.sources
    .map((s) =>
      '<li class="ffx-srcrow">' +
        '<img class="ffx-srcrow__logo" src="' + esc(s.logo) + '" alt="" width="18" height="18">' +
        '<span class="ffx-srcrow__name">' + esc(s.name) + '</span>' +
        '<span class="ffx-srcrow__n">' + n1(s.count) + '</span>' +
      '</li>')
    .join('');

  const notes = cfg.sources
    .map((s) => '<li class="ffx-fnote"><b>' + esc(s.name) + '</b> ' + esc(data.platformNotes[s.id] || '') + '</li>')
    .join('');

  return (
    '<footer class="ffx-foot">' +
      '<div class="ffx-foot__col ffx-foot__col--src">' +
        '<h3 class="ffx-foot__h">What was searched</h3>' +
        '<ul class="ffx-srcpile-list">' + srcRows + '</ul>' +
        '<p class="ffx-foot__sum">' + n1(data.summary.raw) + ' listings read. ' + data.summary.dropped + ' were the same truck posted twice.</p>' +
      '</div>' +
      '<div class="ffx-foot__col">' +
        '<h3 class="ffx-foot__h">How the price check works</h3>' +
        '<ul class="ffx-fnotes">' + notes + '</ul>' +
      '</div>' +
      '<div class="ffx-foot__col">' +
        '<h3 class="ffx-foot__h">' + esc(data.board.footTitle) + '</h3>' +
        '<p class="ffx-foot__p">' + esc(data.board.footBody) + '</p>' +
        '<p class="ffx-foot__p">' + esc(data.board.vdpNote) + '</p>' +
        '<p class="ffx-foot__mark">Made by <span class="ffx-foot__sb">superbot</span></p>' +
      '</div>' +
    '</footer>'
  );
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || { sources: [] };
  const data = (ctx && ctx.data) || fallback;
  const s = data.summary || fallback.summary;
  const chips = data.filterChips || fallback.filterChips;
  const note = (data.filterNotes && data.filterNotes.f250) || '';

  root.innerHTML =
    topBar(cfg, s) +
    filterBar(chips, note) +
    summaryStrip(s, cfg.sources) +
    listings(cfg, data) +
    mapStrip(data) +
    footer(cfg, data);
}

/* clock hook: the thin line under the top bar sweeps with browser-scene progress */
export function render(root, p) {
  const line = root && root.querySelector ? root.querySelector('.ffx-scanline') : null;
  if (!line) return;
  const v = Math.max(0, Math.min(1, Number(p) || 0));
  line.style.width = (v * 100).toFixed(2) + '%';
}

export { build };