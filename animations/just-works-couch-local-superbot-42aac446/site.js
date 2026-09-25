/* site.js - the generated frontend: superbot.app/p/couches, "Couches near you".
   A map first split view: nine listings down the left, a drawn 20 mile map with price pins on the right.
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations or transitions. The kit toggles .is-hover on the third listing and .is-active on its message
   button; both are styled in site.css, and the hover lights that listing's pin through a :has() rule,
   so no JavaScript runs on the hover or the click. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const n1 = (n) => Number(n).toLocaleString('en-US');
/* the word that fits the count, so a count of one never prints a plural: plur(1,'save','saves') */
const plur = (n, one, many) => (Number(n) === 1 ? one : many);
/* a count and its noun, singular or plural: withCount(1,'pin','pins') -> '1 pin' */
const withCount = (n, one, many) => n1(n) + ' ' + plur(n, one, many);

/* ---------- 1. top bar ---------- */

function topBar(s) {
  return (
    '<header class="cl-top">' +
      '<div class="cl-brand">' +
        '<span class="cl-mark"><i></i><i></i><i></i></span>' +
        '<span class="cl-wordmark">Couches <em>near you</em></span>' +
        '<span class="cl-tagline">mid-century only, 20 mile ring</span>' +
      '</div>' +
      '<div class="cl-ask">' +
        '<span class="cl-ask__k">search</span>' +
        '<span class="cl-ask__v">mid-century couch, under $800, within 20 miles</span>' +
        '<span class="cl-ask__edit">Edit</span>' +
      '</div>' +
      '<div class="cl-where">' +
        '<span class="cl-where__dot"></span>' +
        '<span class="cl-where__t">' + esc(s.city) + '</span>' +
        '<span class="cl-where__s">refreshed ' + esc(s.refreshed) + '</span>' +
      '</div>' +
      '<span class="cl-scan" style="width:0%"></span>' +
    '</header>'
  );
}

/* ---------- 2. counters ---------- */

function strip(s) {
  return (
    '<section class="cl-strip">' +
      '<div class="cl-count">' +
        '<span class="cl-count__n">' + n1(s.read) + '</span>' +
        '<span class="cl-count__k">listings read</span>' +
        '<span class="cl-count__s">five marketplaces, one page at a time</span>' +
      '</div>' +
      '<div class="cl-count cl-count--kept">' +
        '<span class="cl-count__n">' + n1(s.kept) + '</span>' +
        '<span class="cl-count__k">kept under $800</span>' +
        '<span class="cl-count__s">' + n1(s.droppedCheap) + ' past the price, ' + n1(s.droppedLate) + ' not mid-century</span>' +
      '</div>' +
      '<div class="cl-count cl-count--near">' +
        '<span class="cl-count__n">' + n1(s.shown) + '</span>' +
        '<span class="cl-count__k">inside ' + withCount(s.radius, 'mile', 'miles') + '</span>' +
        '<span class="cl-count__s">' + n1(s.droppedFar) + ' ' + plur(s.droppedFar, 'was further out and dropped', 'were further out and dropped') + '</span>' +
      '</div>' +
      '<div class="cl-count">' +
        '<span class="cl-count__n">' + esc(s.medianText) + '</span>' +
        '<span class="cl-count__k">median ask</span>' +
        '<span class="cl-count__s">cheapest inside the ring is ' + esc(s.cheapestText) + '</span>' +
      '</div>' +
      '<div class="cl-dial">' +
        '<span class="cl-dial__k">Radius</span>' +
        '<span class="cl-dial__track"><i class="cl-dial__fill"></i><i class="cl-dial__stop"></i></span>' +
        '<span class="cl-dial__v">' + s.radius + ' mi</span>' +
      '</div>' +
    '</section>'
  );
}

/* ---------- 3. filter row ---------- */

function filterRow(filters, activeKey, notes) {
  const chips = filters
    .map((f) => '<span class="cl-chip' + (f.key === activeKey ? ' is-on' : '') + '">' + esc(f.label) + '</span>')
    .join('');
  const note = notes[activeKey] || '';
  return (
    '<section class="cl-filters">' +
      '<div class="cl-chiprow">' + chips + '</div>' +
      '<div class="cl-sort">' +
        '<span class="cl-sort__k">Sort</span>' +
        '<span class="cl-sort__v">Closest first</span>' +
        '<span class="cl-sort__alt">Cheapest</span>' +
        '<span class="cl-sort__alt">Newest</span>' +
      '</div>' +
      '<p class="cl-fnote">' + esc(note) + '</p>' +
    '</section>'
  );
}

/* ---------- 4. a listing row ---------- */

function row(l, src, i) {
  const pct = Math.max(4, Math.min(100, Math.round((l.miles / 20) * 100)));
  return (
    '<article class="couch-row couch-row--' + esc(l.id) + '">' +
      '<div class="couch-shot">' +
        '<img class="couch-photo" src="' + esc(l.img) + '" alt="' + esc(l.title) + '" width="800" height="600">' +
        '<span class="couch-plate">' +
          '<img class="couch-plate__logo" src="' + esc(src.logo) + '" alt="" width="14" height="14">' +
          '<span class="couch-plate__t">' + esc(src.short) + '</span>' +
        '</span>' +
        '<span class="couch-when">' + esc(l.posted) + '</span>' +
        '<span class="couch-rank">' + (i + 1) + '</span>' +
      '</div>' +
      '<div class="couch-body">' +
        '<div class="couch-head">' +
          '<h3 class="couch-title">' + esc(l.title) + '</h3>' +
          '<span class="couch-price">' + esc(l.priceText) + '</span>' +
        '</div>' +
        '<p class="couch-spec">' + esc(l.yearText) + ' · ' + esc(l.fabric) + ' · ' + esc(l.lengthText) + ' · ' + esc(l.seat) + '</p>' +
        '<p class="couch-where">' +
          '<b>' + esc(l.neighbour) + '</b>' +
          '<span class="cl-dot"></span>' + esc(l.milesText) +
          '<span class="cl-dot"></span>' + esc(l.reply) +
          '<span class="cl-dot"></span>' + esc(l.deltaText) +
        '</p>' +
        '<span class="couch-dist"><i class="couch-dist__fill" style="width:' + pct + '%"></i><i class="couch-dist__home"></i></span>' +
        '<p class="couch-cond">' + esc(l.condition) + '</p>' +
        '<div class="couch-foot">' +
          '<div class="couch-tags">' +
            l.tags.map((t) => '<span class="couch-tag">' + esc(t) + '</span>').join('') +
            '<span class="couch-tag couch-tag--save">' + withCount(l.saves, 'save', 'saves') + '</span>' +
          '</div>' +
          '<div class="couch-act">' +
            '<span class="couch-msg"><span class="couch-msg__idle">Message seller</span><span class="couch-msg__sent">Chat opened</span></span>' +
            '<span class="couch-read">' + esc(l.driveText) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

function list(cfg, data) {
  const byId = {};
  (cfg.sources || []).forEach((s) => { byId[s.id] = { name: s.name, short: s.name.split(' ')[0], logo: s.logo }; });
  (data.platforms || []).forEach((p) => { byId[p.id] = { name: p.name, short: p.short, logo: p.logo }; });
  const rows = (data.listings || []).map((l, i) => row(l, byId[l.platform] || { short: l.platform, logo: './brand/app.svg' }, i)).join('');
  return (
    '<div class="cl-col">' +
      '<div class="cl-listhead">' +
        '<h2 class="cl-h2">' + withCount((data.listings || []).length, 'mid-century couch', 'mid-century couches') + ', closest first</h2>' +
        '<p class="cl-dek">Every one under $800 and inside the 20 mile ring. Prices are what the seller is asking right now.</p>' +
      '</div>' +
      '<div class="couch-list">' + rows + '</div>' +
      '<div class="cl-more">' +
        '<span class="cl-more__t">' + n1(data.summary.kept - data.summary.shown) + ' more ' + plur(data.summary.kept - data.summary.shown, 'couch fits', 'couches fit') + ' the price and the style but sit further out</span>' +
        '<span class="cl-more__b">Widen to 25 miles</span>' +
      '</div>' +
    '</div>'
  );
}

/* ---------- 5. the map ---------- */

function mapGrid() {
  let v = '';
  for (let i = 1; i < 12; i++) {
    const x = i * 83.3;
    v += '<line class="cl-road' + (i % 4 === 0 ? ' cl-road--wide' : '') + '" x1="' + x.toFixed(0) + '" y1="0" x2="' + x.toFixed(0) + '" y2="750"/>';
  }
  for (let j = 1; j < 9; j++) {
    const y = j * 83.3;
    v += '<line class="cl-road' + (j % 4 === 0 ? ' cl-road--wide' : '') + '" x1="0" y1="' + y.toFixed(0) + '" x2="1000" y2="' + y.toFixed(0) + '"/>';
  }
  v += '<line class="cl-road cl-road--wide" x1="0" y1="640" x2="1000" y2="250"/>';
  v += '<line class="cl-road" x1="120" y1="0" x2="760" y2="750"/>';
  return v;
}

function mapPlate(data) {
  return (
    '<div class="cl-plate">' +
      '<svg class="cl-gridmap" viewBox="0 0 1000 750" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
        '<rect class="cl-ground" x="0" y="0" width="1000" height="750"/>' +
        '<path class="cl-water" d="M0 96 C 150 120, 260 60, 420 96 C 560 128, 700 74, 1000 112 L 1000 168 C 760 140, 620 190, 430 158 C 300 138, 140 178, 0 150 Z"/>' +
        '<rect class="cl-park" x="612" y="470" width="196" height="164" rx="12"/>' +
        '<rect class="cl-park" x="150" y="300" width="132" height="108" rx="10"/>' +
        '<g class="cl-blocks">' +
          '<rect x="88" y="182" width="150" height="96" rx="4"/><rect x="258" y="182" width="188" height="96" rx="4"/>' +
          '<rect x="466" y="182" width="132" height="96" rx="4"/><rect x="620" y="182" width="196" height="96" rx="4"/>' +
          '<rect x="88" y="300" width="46" height="200" rx="4"/><rect x="300" y="430" width="150" height="90" rx="4"/>' +
          '<rect x="470" y="430" width="120" height="90" rx="4"/><rect x="828" y="300" width="132" height="120" rx="4"/>' +
        '</g>' +
        '<g class="cl-roads">' + mapGrid() + '</g>' +
        '<g class="cl-rings">' +
          '<circle class="cl-ring" cx="480" cy="390" r="300"/>' +
          '<circle class="cl-ring" cx="480" cy="390" r="225"/>' +
          '<circle class="cl-ring" cx="480" cy="390" r="150"/>' +
          '<circle class="cl-ring" cx="480" cy="390" r="75"/>' +
          '<circle class="cl-ring cl-ring--sweep" cx="480" cy="390" r="300"/>' +
        '</g>' +
        '<g class="cl-home">' +
          '<circle class="cl-home__halo" cx="480" cy="390" r="16"/>' +
          '<circle class="cl-home__dot" cx="480" cy="390" r="7"/>' +
        '</g>' +
        '<g class="cl-ringlabel">' +
          '<text x="480" y="96">20 mi</text>' +
          '<text x="480" y="171">15 mi</text>' +
          '<text x="480" y="246">10 mi</text>' +
          '<text x="480" y="321">5 mi</text>' +
          '<text class="cl-home-label" x="480" y="424">' + esc(data.summary.homeLabel) + '</text>' +
        '</g>' +
      '</svg>' +
      '<div class="cl-pins">' +
        (data.mapPins || []).map((p) =>
          '<span class="couch-pin" style="left:' + p.x + '%;top:' + p.y + '%">' +
            '<span class="couch-pin__tag"><b>' + esc(p.priceText) + '</b></span>' +
            '<span class="couch-pin__dot"></span>' +
          '</span>').join('') +
      '</div>' +
      '<span class="cl-maplabel cl-maplabel--n">N</span>' +
      '<span class="cl-scale"><i></i><span>2 mi</span></span>' +
    '</div>'
  );
}

function mapPanel(data) {
  return (
    '<aside class="cl-map">' +
      '<div class="cl-maphead">' +
        '<h3 class="cl-maphead__t">20 miles from ' + esc(data.summary.homeLabel.replace(/^You, /, '')) + '</h3>' +
        '<span class="cl-maphead__b"><i></i>' + withCount((data.mapPins || []).length, 'pin', 'pins') + ', one per couch</span>' +
      '</div>' +
      mapPlate(data) +
      '<ul class="cl-legend">' +
        '<li class="cl-legend__i cl-legend__i--pin"><i></i>Pin is the asking price</li>' +
        '<li class="cl-legend__i cl-legend__i--ring"><i></i>Rings are 5, 10, 15 and 20 miles</li>' +
        '<li class="cl-legend__i cl-legend__i--home"><i></i>' + esc(data.summary.homeLabel) + '</li>' +
      '</ul>' +
      '<p class="cl-mapfine">Pin spacing is spread out so nine prices stay readable. The ring distances are true.</p>' +
    '</aside>'
  );
}

/* ---------- 6. dropped, notes, footer ---------- */

function droppedBand(data) {
  const rows = (data.dropped || []).map((d) =>
    '<li class="cl-drop">' +
      '<span class="cl-drop__n">' + n1(d.v) + '</span>' +
      '<span class="cl-drop__k">' + esc(d.k) + '</span>' +
      '<span class="cl-drop__s">' + esc(d.note) + '</span>' +
    '</li>').join('');
  return (
    '<section class="cl-dropped">' +
      '<h2 class="cl-h2">What the search cut</h2>' +
      '<p class="cl-dek">' + n1(data.summary.read) + ' ' + plur(data.summary.read, 'listing was opened', 'listings were opened') + '. These ' + n1((data.dropped || []).reduce((a, d) => a + d.v, 0)) + ' never made the board.</p>' +
      '<ul class="cl-droplist">' + rows + '</ul>' +
      '<div class="cl-how">' +
        '<img class="cl-how__img" src="' + esc(data.roomImage) + '" alt="A sitting room photographed in the 1960s, orange sofa on a green rug" width="800" height="600">' +
        '<div class="cl-how__body">' +
          '<h3 class="cl-how__t">' + esc(data.notes.title) + '</h3>' +
          '<p class="cl-how__p">' + esc(data.notes.body) + '</p>' +
          '<p class="cl-how__p">' + esc(data.notes.fine) + '</p>' +
          '<p class="cl-how__fine">' + esc(data.notes.replyNote) + '</p>' +
        '</div>' +
      '</div>' +
    '</section>'
  );
}

function footer(cfg, data) {
  const rows = (data.platforms || []).map((p) =>
    '<li class="cl-srcrow">' +
      '<img class="cl-srcrow__logo" src="' + esc(p.logo) + '" alt="" width="18" height="18">' +
      '<span class="cl-srcrow__name">' + esc(p.name) + '</span>' +
      '<span class="cl-srcrow__n">' + n1(p.count) + '</span>' +
      '<span class="cl-srcrow__note">' + esc(p.note) + '</span>' +
    '</li>').join('');
  return (
    '<footer class="cl-foot">' +
      '<div class="cl-foot__col">' +
        '<h3 class="cl-foot__h">Where the nine came from</h3>' +
        '<ul class="cl-srcrows">' + rows + '</ul>' +
      '</div>' +
      '<div class="cl-foot__col cl-foot__col--q">' +
        '<h3 class="cl-foot__h">The search</h3>' +
        '<p class="cl-foot__q">' + esc(cfg.ask || '') + '</p>' +
        '<p class="cl-foot__p">Prices, distances and reply times are copied from the listing, not estimated. A couch that was sold or deleted between reads was dropped before this page was drawn.</p>' +
        '<p class="cl-foot__mark">Made by <span class="cl-foot__sb">superbot</span></p>' +
      '</div>' +
    '</footer>'
  );
}

/* ---------- build ---------- */

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  const s = data.summary || fallback.summary;
  root.innerHTML =
    topBar(s) +
    strip(s) +
    filterRow(data.filters || fallback.filters, 'all', data.filterNotes || fallback.filterNotes) +
    '<div class="cl-split">' + list(cfg, data) + mapPanel(data) + '</div>' +
    droppedBand(data) +
    footer(cfg, data);
}

/* clock hook: the 20 mile ring is drawn by the browser scene's progress, so the map reads as still
   being measured while the page scrolls. Pure in p; the same p always paints the same frame. */
export function render(root, p) {
  if (!root || !root.querySelector) return;
  const v = Math.max(0, Math.min(1, Number(p) || 0));
  const sweep = root.querySelector('.cl-ring--sweep');
  if (sweep) {
    const len = 2 * Math.PI * 300;
    sweep.style.strokeDasharray = len.toFixed(1);
    sweep.style.strokeDashoffset = (len * (1 - v)).toFixed(1);
  }
  const fill = root.querySelector('.cl-dial__fill');
  if (fill) fill.style.width = (18 + v * 82).toFixed(1) + '%';
  const scan = root.querySelector('.cl-scan');
  if (scan) scan.style.width = (v * 100).toFixed(2) + '%';
}

export { build };