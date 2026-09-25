/* site.js - the generated frontend: superbot.app/p/leather, "Leather, size M".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners,
   no CSS animations or transitions. build() can be called twice and renders the same board.
   The kit toggles .is-hover on a plate and .is-active on a Save, which stamps the plate KEPT
   through a :has() rule; nothing about that runs in JS. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n1 = (n) => Number(n).toLocaleString('en-US');

/** Every plate photo declares the box it will occupy: the shape comes from the listing's own aspect, so
    the img carries matching width/height attributes and the browser can reserve the space before the file
    lands. site.css still sizes the photo to the plate (width/height 100%), so this only ever removes a
    layout shift; it changes nothing about how the board looks once the photo is in. */
function plateDims(aspect) {
  const m = /^\s*([\d.]+)\s*\/\s*([\d.]+)\s*$/.exec(String(aspect || ''));
  const aw = m ? Number(m[1]) : 4;
  const ah = m ? Number(m[2]) : 5;
  const s = 240 / Math.min(aw, ah);
  return [Math.round(aw * s), Math.round(ah * s)];
}

/** the platform a listing came from: name, logo, count. Built from cfg.sources so the footer and the
    badges match the chat's aggregation card exactly. */
function sourceIndex(cfg) {
  const out = {};
  (cfg.sources || []).forEach((s) => { out[s.id] = s; });
  return out;
}

/* ---------- masthead ---------- */

function masthead(cfg, d, readTotal) {
  const apps = (cfg.sources || []).map((s) => esc(s.name)).join(', ');
  return (
    '<header class="ljm-mast">' +
      '<div class="ljm-mast__top">' +
        '<span class="ljm-kicker">' + esc(d.kicker) + '</span>' +
        '<span class="ljm-vol">' + apps + '</span>' +
      '</div>' +
      '<h1 class="ljm-wordmark">' + esc(d.masthead) + '</h1>' +
      '<div class="ljm-mast__sub">' +
        '<span class="ljm-size">' + esc(d.mastheadSub) + '</span>' +
        '<div class="ljm-askwrap">' +
          '<span class="ljm-mast__lab">The ask</span>' +
          '<p class="ljm-ask">' + esc(cfg.ask || '') + '</p>' +
        '</div>' +
        '<div class="ljm-mast__tally">' +
          '<span class="ljm-tally__n js-read">0</span>' +
          '<span class="ljm-tally__k">of ' + n1(readTotal) + ' listings read on six apps</span>' +
        '</div>' +
      '</div>' +
      '<span class="ljm-mast__rule"><i class="js-rule"></i></span>' +
    '</header>'
  );
}

/* ---------- brief strip ---------- */

function briefStrip(d) {
  const crits = d.criteria.map((c, i) =>
    '<li class="ljm-crit"><b>' + String(i + 1).padStart(2, '0') + '</b>' + esc(c) + '</li>'
  ).join('');
  return (
    '<section class="ljm-brief">' +
      '<div class="ljm-brief__set">' +
        '<span class="ljm-set"><span class="ljm-set__k">Size</span><b>' + esc(d.size) + '</b></span>' +
        '<span class="ljm-set"><span class="ljm-set__k">Made</span><b>' + esc(d.era) + '</b></span>' +
        '<span class="ljm-set"><span class="ljm-set__k">Budget</span><b>' + esc(d.budget) + '</b></span>' +
      '</div>' +
      '<ol class="ljm-crits">' + crits + '</ol>' +
      '<span class="ljm-picked">1 picked</span>' +
    '</section>'
  );
}

/* ---------- the board ---------- */

function card(item, no, src) {
  const era = item.eraKey;
  const cond = item.condKey;
  const dim = plateDims(item.aspect);
  const logo = src ? '<img class="ljm-badge__logo" src="' + esc(src.logo) + '" alt="" width="16" height="16">' : '';
  return (
    '<article class="ljm-card">' +
      '<figure class="ljm-plate" style="aspect-ratio:' + esc(item.aspect || '4 / 5') + '">' +
        '<img class="ljm-photo" src="' + esc(item.img) + '" alt="' + esc(item.title) + '" width="' + dim[0] + '" height="' + dim[1] + '" loading="eager" decoding="sync">' +
        '<span class="ljm-no">' + String(no).padStart(2, '0') + '</span>' +
        '<button class="ljm-save" type="button"><span class="ljm-save__a">Save</span><span class="ljm-save__b">Kept</span></button>' +
        '<span class="ljm-stamp">kept</span>' +
        '<span class="ljm-badge">' + logo + '<b>' + esc(src ? src.name : item.source) + '</b></span>' +
      '</figure>' +
      '<div class="ljm-body">' +
        '<div class="ljm-tagrow">' +
          '<span class="ljm-tag ljm-tag--era ljm-tag--' + esc(era) + '">' + esc(item.era) + '</span>' +
          '<span class="ljm-tag ljm-tag--cond ljm-tag--' + esc(cond) + '">' + esc(item.condition) + '</span>' +
        '</div>' +
        '<h3 class="ljm-title">' + esc(item.title) + '</h3>' +
        '<p class="ljm-price"><b>' + esc(item.price) + '</b><span class="ljm-was">new ' + esc(item.retail) + '</span></p>' +
        '<dl class="ljm-meas">' +
          '<span class="ljm-meas__i"><dt>Pit</dt><dd>' + esc(item.pit) + '</dd></span>' +
          '<span class="ljm-meas__i"><dt>Length</dt><dd>' + esc(item.length) + '</dd></span>' +
          '<span class="ljm-meas__i"><dt>Zip</dt><dd>' + esc(item.zip) + '</dd></span>' +
        '</dl>' +
        '<p class="ljm-note">' + esc(item.note) + '</p>' +
        '<div class="ljm-byrow">' +
          '<span class="ljm-seller">' + esc(item.seller) + '</span>' +
          '<span class="ljm-city">' + esc(item.city) + '</span>' +
        '</div>' +
        '<div class="ljm-act">' +
          '<span class="ljm-listed">' + esc(item.listed) + ' on ' + esc(src ? src.name : item.source) + '</span>' +
          '<span class="ljm-terms">' + esc(item.terms) + '</span>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

function wall(cfg, data, srcById) {
  const cards = (data.items || []).map((it, i) => card(it, i + 1, srcById[it.source])).join('');
  return (
    '<section class="ljm-wall">' +
      '<div class="ljm-wall__head">' +
        '<div class="ljm-wall__title">' +
          '<h2 class="ljm-h2">' + esc(data.board.head) + '</h2>' +
          '<span class="ljm-wall__n">' + n1((data.items || []).length) + ' on the board</span>' +
        '</div>' +
        '<p class="ljm-dek">' + esc(data.board.dek) + '</p>' +
        '<span class="ljm-hint">' + esc(data.board.hint) + '</span>' +
      '</div>' +
      '<div class="ljm-board">' + cards + '</div>' +
      '<p class="ljm-trayline">' + esc(data.trayLine) + '</p>' +
    '</section>'
  );
}

/* ---------- price histogram, one panel per app ---------- */

function histPanel(id, src, band, maxCount) {
  const counts = band.counts;
  const kept = counts.reduce((a, b) => a + b, 0);
  const bars = counts.map((c, i) => {
    const h = maxCount > 0 ? Math.round((c / maxCount) * 100) : 0;
    return (
      '<span class="ljm-bar' + (i === 5 ? ' ljm-bar--last' : '') + '" style="--h:' + h + '%">' +
        '<i></i><b>' + (c > 0 ? c : '') + '</b>' +
      '</span>'
    );
  }).join('');
  return (
    '<article class="ljm-hpanel">' +
      '<div class="ljm-hpanel__top">' +
        '<img class="ljm-hpanel__logo" src="' + esc(src.logo) + '" alt="" width="18" height="18">' +
        '<b class="ljm-hpanel__name">' + esc(src.name) + '</b>' +
        '<span class="ljm-hpanel__read">' + n1(src.count) + ' read</span>' +
      '</div>' +
      '<div class="ljm-bars">' + bars + '</div>' +
      '<div class="ljm-hpanel__foot">' +
        '<span class="ljm-hm">median <b>$' + n1(band.median) + '</b></span>' +
        '<span class="ljm-hk">' + kept + ' kept</span>' +
      '</div>' +
    '</article>'
  );
}

function histogram(cfg, data, srcById) {
  const bySrc = data.priceBySource || {};
  let maxCount = 0;
  Object.keys(bySrc).forEach((id) => bySrc[id].counts.forEach((c) => { if (c > maxCount) maxCount = c; }));
  const panels = (cfg.sources || [])
    .filter((s) => bySrc[s.id])
    .map((s) => histPanel(s.id, s, bySrc[s.id], maxCount))
    .join('');
  const axis = (data.priceBands || []).map((b) => '<span class="ljm-axis__t">' + esc(b) + '</span>').join('');
  return (
    '<section class="ljm-hist">' +
      '<div class="ljm-hist__head">' +
        '<h2 class="ljm-h2">' + esc(data.board.histHead) + '</h2>' +
        '<p class="ljm-dek">' + esc(data.board.histDek) + '</p>' +
      '</div>' +
      '<div class="ljm-hist__grid">' + panels + '</div>' +
      '<div class="ljm-axis">' + axis + '</div>' +
      '<p class="ljm-hist__fine">' + esc(data.board.histFine) + '</p>' +
    '</section>'
  );
}

/* ---------- footer ---------- */

function footer(cfg, data, srcById) {
  const rows = (cfg.sources || []).map((s) => {
    const band = (data.priceBySource || {})[s.id];
    const kept = band ? band.counts.reduce((a, b) => a + b, 0) : 0;
    return (
      '<li class="ljm-srcrow">' +
        '<img class="ljm-srcrow__logo" src="' + esc(s.logo) + '" alt="" width="20" height="20">' +
        '<span class="ljm-srcrow__name">' + esc(s.name) + '</span>' +
        '<b class="ljm-srcrow__n">' + n1(s.count) + '</b>' +
        '<span class="ljm-srcrow__k">' + kept + ' kept</span>' +
      '</li>'
    );
  }).join('');

  const methods = (data.board.footMethods || [])
    .map((m) => '<li class="ljm-method">' + esc(m) + '</li>')
    .join('');

  const tagKey = data.tags.era.map((t) =>
    '<li class="ljm-key"><span class="ljm-tag ljm-tag--era ljm-tag--' + esc(t.key) + '">' + esc(t.label) + '</span>' +
    '<p>' + esc(t.note) + '</p></li>'
  ).join('') + data.tags.condition.map((t) =>
    '<li class="ljm-key"><span class="ljm-tag ljm-tag--cond ljm-tag--' + esc(t.key) + '">' + esc(t.label) + '</span>' +
    '<p>' + esc(t.note) + '</p></li>'
  ).join('');

  const notes = (cfg.sources || []).map((s) =>
    '<li class="ljm-appnote"><b>' + esc(s.name) + '</b> ' + esc((data.sourceNotes || {})[s.id] || '') + '</li>'
  ).join('');

  return (
    '<footer class="ljm-foot">' +
      '<div class="ljm-foot__col ljm-foot__col--src">' +
        '<h3 class="ljm-h3">' + esc(data.board.footHead) + '</h3>' +
        '<ul class="ljm-srcpile">' + rows + '</ul>' +
        '<p class="ljm-foot__p">' + esc(data.board.footSum) + '</p>' +
      '</div>' +
      '<div class="ljm-foot__col">' +
        '<h3 class="ljm-h3">' + esc(data.board.footMethod) + '</h3>' +
        '<ol class="ljm-methods">' + methods + '</ol>' +
        '<h3 class="ljm-h3 ljm-h3--tight">What each app is like</h3>' +
        '<ul class="ljm-appnotes">' + notes + '</ul>' +
      '</div>' +
      '<div class="ljm-foot__col">' +
        '<h3 class="ljm-h3">How the tags read</h3>' +
        '<ul class="ljm-keys">' + tagKey + '</ul>' +
        '<p class="ljm-sign">' + esc(data.board.footSign) + ' <b>superbot</b></p>' +
      '</div>' +
    '</footer>'
  );
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || { sources: [] };
  const data = (ctx && ctx.data) || fallback;
  const srcById = sourceIndex(cfg);
  const found = cfg.found || { n: (data.items || []).length, label: 'kept' };
  const readTotal = (cfg.sources || []).reduce((a, s) => a + (Number(s.count) || 0), 0) || found.n || 0;

  // the tally denominator lives in render(root, p), which only ever gets (root, p)
  root.setAttribute('data-ljm-total', String(readTotal));

  root.innerHTML =
    masthead(cfg, data.board, readTotal) +
    briefStrip(data.brief) +
    wall(cfg, data, srcById) +
    histogram(cfg, data, srcById) +
    footer(cfg, data, srcById);
}

/* clock hook: how much of the board the ad has read through, from browser-scene progress p.
   Pure in p, so scrubbing backwards reads backwards. */
export function render(root, p) {
  if (!root || !root.querySelector) return;
  const v = Math.max(0, Math.min(1, Number(p) || 0));
  const total = Number(root.getAttribute('data-ljm-total')) || 318;
  const n = root.querySelector('.js-read');
  const rule = root.querySelector('.js-rule');
  if (n) n.textContent = n1(Math.round(v * total));
  if (rule) rule.style.width = (v * 100).toFixed(2) + '%';
}

export { build };