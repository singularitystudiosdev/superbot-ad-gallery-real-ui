// scene 'hub': the Superbot hub window, landed. A chat is typed into the composer, superbot reports what it
// did (tool chips), shows the aggregation card (a row per source, its count ticking up, then the first listings
// off ctx.data.items) and then the build card: the app it just made, running live in a 1280px-wide thumbnail
// that fills in section by section, with an "Open in Chrome" button the pointer presses before the scene ends.
//
// render(lt) is a pure function of the scene clock: no timers, no rAF, no CSS animation, no transitions.
// Everything that moves (typed ask, spinner, counts, reveal, scroll, pointer) is computed from lt here.
//
// The one irreversible step is mount(): the ad's site is built ONCE into the thumbnail (the same ctx.site.default
// the browser scene will call, which the ad contract requires to be idempotent), so the preview in the card is
// the real page and the later Chrome scene morphs out of this exact rect (ctx.shared.thumb).
import { seg, lerp, outCubic, inOutCubic, esc, press, path, placeCursor, boxIn } from '../lib.js';
import { makeCursor } from '../shell.js';
import { SYMBOLS } from './hub-assets/icons.js';
import { hubMarkup } from './hub-assets/hub-markup.js';

// hub chrome assets (tile.svg, mark-clean.svg, the rail's pngs) live beside this scene, not in the ad folders
const A = (f) => new URL('./hub-assets/' + f, import.meta.url).href;

const H = 1080;
// the window is drawn at a design width and scaled: 1205 design px is the reference hub window (tabs-chaos),
// 1.43402 the scale at which 1205 design px fill a 1920 frame. Narrower frames keep at least KMIN so the
// hub's 11px body type stays >= 15 stage px, and the window narrows with them (chats shed, see hub.css).
const DW0 = 1205, KMAX = 1.43402, KMIN = 1.36, MX = 24, MY = 26;
const DUR_DEFAULT = 10.0;
const THUMB_W = 1280; // the real page width the thumbnail is built at, then CSS-scaled into the card
// The feed glides to a block that has landed. The glide is started LEAD seconds before that block appears
// and is over SCROLL seconds later, so it has already landed when the block fades in: the block never
// fades in half behind the composer and then slides up out of it (an earlier build shared the 0.35s glide
// with the block's own mark, and the aggregation card was 75px too low on the frame it first appeared on).
const SCROLL = 0.30;
const LEAD = 0.42;
const THUMB_MIN = 96; // css px: the shortest the build card's thumbnail may be squeezed to on a short feed
const clampT = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = (n) => Math.round(n).toLocaleString('en-US');
/** a count with the noun that agrees with it: 1 listing / 318 listings. Every count the hub prints goes
    through this, so no line can read "index 1 listings into the filter state" */
const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;

// ---------- what the hub calls the things it collected ----------
// The hub serves 12 different apps, so no line of its copy may assume a marketplace. The noun comes from the
// ad: cfg.found.one / cfg.found.many when the ad names them, else the head noun of cfg.found.label
// ("active listings" -> listing/listings, "receipts" -> receipt/receipts, "pairs under $150 each" ->
// pair/pairs), which is the only way "listing" reaches the screen: when the ad's own label says listings. An
// app whose label names no thing ("need you", "in size M") falls back to the neutral item/items.
const LABEL_STOP = new Set([
  'in', 'on', 'at', 'under', 'over', 'to', 'for', 'of', 'from', 'with', 'by', 'per', 'within', 'near', 'each',
  'every', 'all', 'any', 'the', 'a', 'an', 'and', 'you', 'me', 'them', 'it', 'this', 'that', 'now', 'today',
  'read', 'kept', 'picked', 'found', 'matched', 'scanned', 'compared', 'indexed', 'checked', 'shown', 'listed',
  'scored', 'ranked', 'filtered', 'grouped', 'sorted', 'waiting', 'pending',
]);
const LABEL_NOT_A_NOUN = new Set([
  'need', 'needs', 'want', 'wants', 'did', 'done', 'is', 'are', 'was', 'were', 'has', 'have', 'had', 'can',
  'will', 'more',
]);

/** the singular of an English plural noun: couches -> couch, dresses -> dress, receipts -> receipt */
function singular(w) {
  if (/ies$/.test(w) && w.length > 3) return w.slice(0, -3) + 'y';
  if (/(ches|shes|sses|xes|zes)$/.test(w)) return w.slice(0, -2);
  if (/ss$/.test(w)) return w;
  if (/s$/.test(w) && w.length > 3) return w.slice(0, -1);
  return w;
}

/** the thing itself, read off a label the hub already prints beside the total ("receipts", "active listings",
    "pairs under $150 each"); null when the label names no countable thing */
function headNoun(label) {
  const words = String(label || '').toLowerCase().split(',')[0].trim().split(/\s+/).filter(Boolean);
  while (words.length) {
    const w = words[words.length - 1];
    if (LABEL_STOP.has(w) || LABEL_NOT_A_NOUN.has(w) || /^[$\d]/.test(w)) { words.pop(); continue; }
    if (!/^[a-z]{3,}$/.test(w)) return null;
    return { one: singular(w), many: w };
  }
  return null;
}

/** the noun pair the hub's copy uses for what superbot collected */
function foundNoun(cfg) {
  const f = (cfg && cfg.found) || {};
  const one = typeof f.one === 'string' ? f.one.trim() : '';
  const many = typeof f.many === 'string' ? f.many.trim() : '';
  if (one && many) return { one, many };
  return headNoun(f.label) || { one: 'item', many: 'items' };
}

let el = null, T = null, CFG = null;

/** the scene's own stylesheet: the kit engine links scenes/hub.css; this only covers a harness that does not. */
function ensureCss() {
  const href = new URL('./hub.css', import.meta.url).href;
  for (const s of document.styleSheets) { const h = s.href || ''; if (h && h.split('?')[0].endsWith('/scenes/hub.css')) return; }
  if (document.querySelector('link[data-hub-css]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href; l.dataset.hubCss = '1';
  document.head.appendChild(l);
}

/** the chat's short title: the thread this hub already has open (cfg.chat, else the build's tab/app name) */
function chatTitle(cfg) {
  const b = cfg.build || {};
  const raw = cfg.chat || b.tabTitle || b.file || cfg.slug || 'new search';
  return String(raw).toLowerCase().slice(0, 30);
}

// ---------- the beats ----------
// Two anchored ends. The head (fade, typed ask, send, the ask landing) is fixed. The tail is pinned to the
// scene's duration: the pointer presses "Open in Chrome" 0.65s before the end, the thumbnail's reveal runs
// just before the button lands, and the build card opens a beat earlier. What is left between the ask and
// the build card is where superbot's chips, the aggregation card and the listings are packed, sped up or
// slowed down to fill exactly that room. Every value in T is a second on the scene clock.
function schedule(cfg, ctx, dur) {
  const ask = String(cfg.ask || '');
  const steps = cfg.steps || [];
  const sources = cfg.sources || [];
  const items = (ctx.data && ctx.data.items) || [];
  // 4 to 6 preview rows, and one fewer when the card is already tall: the whole aggregation card has to
  // fit the feed (16:9 leaves 503 design px) or its total ends up behind the composer.
  const nPrev = Math.min(items.length, sources.length >= 5 ? 5 : 6);
  const t = { fade: 0.42, type0: 0.55 };
  t.typeDur = clampT(0.42 + ask.length * 0.026, 0.8, 1.55);
  t.type1 = t.type0 + t.typeDur;
  t.send = t.type1 + 0.22;
  t.user = t.send + 0.05;

  // the tail, pinned to the end
  t.press = Math.max(t.user + 1.4, dur - 0.65);
  t.open = t.press - 0.78;
  t.rev1 = t.open - 0.15;
  t.revDur = clampT(t.rev1 - t.user - 1.5, 0.9, 1.75);
  t.rev0 = t.rev1 - t.revDur;
  t.build = t.rev0 - 0.75;
  t.lineN = 3; t.lineGap = 0.14;
  t.line0 = t.build + 0.42;
  t.move = t.open + 0.12; t.moveDur = 0.55;

  // the middle, packed into the room between the ask and the build card
  const botT = t.user + 0.40;
  const CHIP0 = 0.22, CHIP_GAP = 0.40, CHIP_RES = 0.50;
  const chipsEnd = CHIP0 + Math.max(0, steps.length - 1) * CHIP_GAP + CHIP_RES;
  const aggAt = chipsEnd + 0.18, AGG_GAP = 0.16, AGG_TICK = 0.55;
  const aggRows = Math.max(0, sources.length - 1);
  const aggEnd = aggAt + aggRows * AGG_GAP + AGG_TICK + 0.10;
  const prevAt = aggEnd + 0.14, PREV_GAP = 0.11, PREV_DUR = 0.30;
  const midEnd = prevAt + Math.max(0, nPrev - 1) * PREV_GAP + PREV_DUR;
  const f = clampT((t.build - 0.16 - botT) / Math.max(0.2, midEnd), 0.35, 1.5);
  const at = (x) => botT + x * f;
  t.bot = botT;
  t.chip0 = at(CHIP0); t.chipGap = CHIP_GAP * f; t.chipRes = CHIP_RES * f;
  t.chipsEnd = at(chipsEnd);
  t.agg = at(aggAt); t.aggGap = AGG_GAP * f; t.aggTick = AGG_TICK * f;
  t.aggEnd = at(aggEnd); t.aggFoot = at(aggAt + aggRows * AGG_GAP + AGG_TICK + 0.02);
  t.prev0 = at(prevAt); t.prevGap = PREV_GAP * f; t.prevDur = PREV_DUR * f;
  t.prevEnd = at(midEnd);
  t.pressAt = t.press;
  t.dur = dur;
  t.nPrev = nPrev;
  t.pack = f;
  return t;
}

// ---------- markup ----------
const TPL = (html) => { const c = document.createElement('template'); c.innerHTML = html.trim(); return c.content.firstElementChild; };

/** the page's own background luminance: the loading skeleton is translucent, so its bars have to be read
    against whatever the site paints (a cream page got dark slabs until this was measured) */
function bgLum(root) {
  const seen = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return null;
    const p = m[1].split(',').map(Number);
    if (p.length > 3 && p[3] < 0.4) return null;
    return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
  };
  let L = seen(getComputedStyle(root).backgroundColor);
  if (L == null) for (const c of [...root.children].slice(0, 4)) { L = seen(getComputedStyle(c).backgroundColor); if (L != null) break; }
  return L;
}
/** a source's logo on its own white chip. Platform SVGs (simple-icons and friends) paint currentColor,
    which resolves to black inside an <img> and vanished on the hub's dark ground; on white they read. */
const logo = (src, cls = '') => `<span class="hb-logo ${cls}"><img src="${src}" alt=""/></span>`;

// ---------- logo legibility ----------
// The chip is white because most platform SVGs paint black (currentColor inside an <img>) and vanish on the
// hub's dark ground. A mark that is ITSELF white (Amazon's wordmark, Walmart's, Best Buy's tag, Google
// Calendar's white page) is then white on white and all but invisible, and those SVG files are shared with the
// ad's own site, so they cannot be recoloured at the source. So each logo is drawn once into a small offscreen
// canvas, the mean luminance of its opaque pixels is read, and a nearly all light mark is put on a DARK chip
// (.hb-logo--light in hub.css), where it keeps the brand's own colours and reads. Decided once per img (at
// mount, on its own load event, and again from measure()'s settle gate), never per frame, and only ever
// ADDED: an image whose pixels cannot be read (a canvas the browser will not rasterise a file into) keeps
// today's white chip, so no logo can get worse than it was.
const LUM_PX = 32;
const LUM_LIGHT = 0.8;   // above this a mark is treated as a light mark: it needs the dark chip
let lumCanvas = null;
function markLuminance(img) {
  if (img.dataset.hbLum) return;
  img.dataset.hbLum = '1';
  const chip = img.closest('.hb-logo');
  if (!chip) return;
  try {
    if (!lumCanvas) { lumCanvas = document.createElement('canvas'); lumCanvas.width = LUM_PX; lumCanvas.height = LUM_PX; }
    const c = lumCanvas.getContext('2d', { willReadFrequently: true });
    if (!c) return;
    c.clearRect(0, 0, LUM_PX, LUM_PX);
    c.drawImage(img, 0, 0, LUM_PX, LUM_PX);
    const d = c.getImageData(0, 0, LUM_PX, LUM_PX).data;
    let sum = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;   // only opaque pixels describe the mark
      sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      n += 1;
    }
    if (n >= 6 && sum / n > LUM_LIGHT) chip.classList.add('hb-logo--light');
  } catch (err) { /* unreadable pixels: the chip stays white, exactly as before */ }
}

/** A source logo that cannot paint (a 404, a decode failure, a file that lays out at zero size) must not
    leave an empty white chip on the hub: the whole chip is dropped, not just the <img>, and a favicon stack
    left with nothing in it is dropped too. A logo that DID paint is measured for luminance and may be moved
    to a dark chip. Runs at mount and on the img's own load/error event; it never runs per frame and never
    touches a logo that did paint, so every cfg.sources logo stays visible. */
function wireLogos(boxed = false) {
  const drop = (img) => {
    const chip = img.closest('.hb-logo');
    if (!chip) { img.remove(); return; }
    const stack = chip.closest('.hb-favs');
    chip.remove();
    if (stack && !stack.querySelector('.hb-logo')) stack.remove();
  };
  for (const img of el.secRoot.querySelectorAll('.hb-logo img')) {
    // boxed is only true once the hub is laid out (from measure()): at mount the scene may still be hidden,
    // where every box reads zero and a zero test would drop a logo that is actually fine.
    const good = () => img.naturalWidth > 0 && img.naturalHeight > 0 && (!boxed || img.offsetWidth > 0 || img.offsetHeight > 0);
    const check = () => { if (good()) markLuminance(img); else drop(img); };
    if (img.complete) check();
    else {
      img.addEventListener('load', check, { once: true });
      img.addEventListener('error', () => drop(img), { once: true });
    }
  }
}

function aggCard(cfg, ctx, T) {
  const sources = cfg.sources || [];
  const found = cfg.found || {};
  const rows = sources.map((s) => `<div class="hb-src">${logo(ctx.asset(s.logo), 'hb-src-l')}<span class="hb-src-n">${esc(s.name)}</span><i class="hb-src-bar"><i></i></i><b class="hb-src-c">0</b></div>`).join('');
  const items = (ctx.data && ctx.data.items) || [];
  const prev = items.slice(0, T.nPrev).map((it) => {
    const src = sources.find((s) => s.id === it.source) || sources[0];
    return `<div class="hb-prev"><img class="hb-prev-img" src="${ctx.asset(it.img)}" alt=""/><span class="hb-prev-t"><b>${esc(it.title)}</b><small>${esc(it.meta || '')}</small></span><b class="hb-prev-p">${esc(it.price || '')}</b>${src ? logo(ctx.asset(src.logo), 'hb-prev-s') : ''}</div>`;
  }).join('');
  const head = sources.length === 1 ? `${esc(sources[0].name)} reporting` : `${esc(sources.length)} sites reporting`;
  return `<div class="hb-agg">
    <div class="hb-agg-h"><span class="hb-live"></span><b>${head}</b><em>live</em></div>
    <div class="hb-src-rows">${rows}</div>
    <div class="hb-agg-f"><span class="hb-agg-fn">0</span><span class="hb-agg-fl">${esc(found.label || 'results')}</span></div>
    <div class="hb-prevs">${prev}</div>
  </div>`;
}

function buildCard(cfg, ctx) {
  const b = cfg.build || {};
  const noun = foundNoun(cfg);   // what this ad collected, never a marketplace noun by default
  const fav = b.favicon ? logo(ctx.asset(b.favicon), 'hb-build-fav') : `<svg viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6"/></svg>`;
  const lines = [
    `scaffold ${plural((cfg.steps || []).length + 11, 'component', 'components')}`,
    `index ${plural((cfg.found || {}).n || 0, noun.one, noun.many)} into the filter state`,
    `preview ready on port 5173`,
  ].map((s) => `<div class="hb-line"><i></i><code>${s}</code></div>`).join('');
  return `<div class="hb-build">
    <div class="hb-build-h">
      <span class="hb-file-ic">${fav}</span>
      <span class="hb-build-t"><b>${esc(b.file || 'app')}</b><small>${esc(b.url || '')}</small></span>
      <span class="hb-app">APP</span>
    </div>
    <div class="hb-lines">${lines}</div>
    <div class="hb-thumb"><div class="hb-thumb-in"></div><div class="hb-skel"></div><div class="hb-shine"></div></div>
    <div class="hb-build-f"><span class="hb-open"><svg viewBox="0 0 24 24"><path d="M14 3h7v7"/><path d="M21 3 11 13"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></svg>Open in Chrome</span><span class="hb-url">${esc(b.url || '')}</span></div>
  </div>`;
}

// ---------- geometry ----------
function geo(W, H0) {
  const k = clampT((W - 2 * MX) / DW0, KMIN, KMAX);
  const dw = (W - 2 * MX) / k, dh = (H0 - 2 * MY) / k;
  el.site.style.width = dw.toFixed(3) + 'px';
  el.site.style.height = dh.toFixed(3) + 'px';
  el.site.style.transform = `translate(${MX}px,${MY}px) scale(${k.toFixed(5)})`;
  el.W = W;
  el.mode = W > 1500 ? 'wide' : W > 1150 ? 'mid' : 'narrow';
  el.root.className = 'hub-root ar-' + el.mode;
  el.k = k;
}

/** one-time measurement of the live thumbnail: the site's own sections (the skeleton geometry) and the two
    points the pointer visits. Runs on the first render whose layout is live (the scene may mount hidden). */
function measure() {
  if (!el.siteRoot.offsetWidth || !el.thumb.offsetWidth) return false;
  const tw = el.thumb.offsetWidth;               // the thumbnail's own CSS scale, re-read when the frame changes
  if (tw !== el.thumbW) { el.thumbW = tw; el.thumbIn.style.transform = `scale(${(tw / THUMB_W).toFixed(5)})`; }
  // The latch is taken on a SETTLED page only. Latched before document.fonts and the site's imgs were in,
  // the slabs were drawn over blocks that then moved: the header bar sat below the header, the bars ran
  // past the content edges. While unsettled this returns false, the frame loop calls it again, and the
  // latch happens on the first frame whose layout is final. A frozen ?t= frame re-renders every rAF, so it
  // ends up with the correct skeleton too.
  if (!el.settled) return false;
  if (el.measured) {
    // the frame can change size (archange): the feed is a different height then, so the two cards are
    // re-fitted instead of being left at the size the previous frame needed
    const key = el.feed.clientHeight + ':' + tw;
    if (el.fitKey !== key) { el.fitKey = key; fitCards(); }
    // the page itself can still change size after the latch (a late font, an ad whose site grows): the
    // slabs are measured again rather than left sitting on blocks that have moved
    const size = el.siteRoot.scrollHeight + ':' + el.siteRoot.scrollWidth;
    if (size === el.skelSize) return true;
    el.measured = false;
    el.skel.innerHTML = '';
    el.secs = [];
  }
  el.measured = true;
  el.skel.style.display = '';
  el.skelSize = el.siteRoot.scrollHeight + ':' + el.siteRoot.scrollWidth;
  // measured on the page's own layout: a frame before the reveal has the section itself at translateY(14px),
  // and latching then put every slab 14px below the block it stands for (the latch frame is not the same on
  // every load, so that was also non-deterministic). The reveal loop re-applies both later in this frame.
  for (const n of el.siteRoot.children) { n.style.transform = ''; n.style.visibility = ''; }
  const secs = [...el.siteRoot.children].map((node) => {
    const b = boxIn(node, el.siteRoot);
    const sk = TPL(`<div class="hb-skb" style="left:${b.x.toFixed(1)}px;top:${b.y.toFixed(1)}px;width:${b.w.toFixed(1)}px;height:${b.h.toFixed(1)}px"></div>`);
    const bars = Math.max(2, Math.min(4, Math.round(b.h / 120)));
    let inner = `<div class="hb-bar t"></div>`;
    for (let i = 0; i < bars; i++) inner += `<div class="hb-bar" style="top:${34 + i * 26}px;width:${(78 - i * 9).toFixed(1)}%;height:${i === bars - 1 ? 10 : 13}px"></div>`;
    sk.innerHTML = inner;
    el.skel.appendChild(sk);
    return { node, sk, at: b.y };
  });
  el.secs = secs;
  const L = bgLum(el.siteRoot);
  el.skel.classList.toggle('hb-sk-light', L != null && L > 0.5);
  el.fitKey = el.feed.clientHeight + ':' + tw;
  fitCards();
  // now that the hub is laid out, a logo that paints nothing (a zero-size file) can be judged by its box too
  wireLogos(true);
  return true;
}

/** Both cards have to fit the feed they are read in: a block taller than the feed cannot be shown whole, its
    footer simply ends up behind the composer, and no scroll offset can fix that. At the four shipped ARs the
    two cards already fit (1920 leaves a 494px feed for a 444px 7-source aggregation card and a 473px build
    card), so this is the guard: it only acts on a shorter feed than any shipped frame, or on an ad with more
    sources or preview rows than the schedule clamped. Fitted from the live layout, once per frame size: the
    aggregation card gives height in its preview rows, the build card in its thumbnail, the only part of it
    that is not fixed chrome. */
function fitCards() {
  const cs = getComputedStyle(el.feed);
  const avail = el.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 8;
  if (!(avail > 80)) return false;
  // aggregation card: measured with every preview row in it, because the rows land later and grow the card:
  // the height that has to fit the feed is the height it ENDS at (that growth is what put the 7-source card
  // 36px behind the composer at 1920, and no scroll offset can show a block taller than the feed whole).
  // A tighter preview row first, then fewer preview rows if that is still not enough.
  const rowH = () => (el.prevs.length ? el.prevs[0].n.offsetHeight : 0);
  el.fitPrev = el.prevs.length;
  const aggFull = () => el.agg.offsetHeight - el.prevsBox.offsetHeight + (el.fitPrev * rowH() + 8);
  el.agg.classList.toggle('hb-tight', aggFull() > avail);
  while (el.fitPrev > 1 && aggFull() > avail) {
    el.fitPrev -= 1;
    el.prevs[el.fitPrev].n.style.display = 'none';
  }
  el.prevH = rowH();
  // build card: header, code lines, button row and url are fixed, so the thumbnail takes the difference.
  // clientHeight and offsetHeight are both untransformed css px, the same unit avail is measured in, so this
  // needs no stage scale and the thumbnail keeps its aspect-ratio whenever the card already clears the composer.
  const th = el.thumb, card = el.build;
  const fits = () => card.offsetHeight <= avail;
  th.style.height = '';
  const natural = th.offsetHeight;
  const want = avail - (card.offsetHeight - natural);
  if (natural > 0 && want < natural) th.style.height = Math.max(THUMB_MIN, want).toFixed(1) + 'px';
  // last resort on a very short feed: the last code line is worth about 20 css px of thumbnail
  if (!fits()) {
    for (let i = el.lines.length - 1; i > 0; i--) {
      el.lines[i].n.style.display = 'none';
      th.style.height = '';
      const w2 = avail - (card.offsetHeight - th.offsetHeight);
      if (th.offsetHeight > 0 && w2 < th.offsetHeight) th.style.height = Math.max(THUMB_MIN, w2).toFixed(1) + 'px';
      if (fits()) break;
    }
  }
  return true;
}

export default {
  id: 'hub',
  dur: (cfg) => (cfg && cfg.dur && cfg.dur.hub) || DUR_DEFAULT,

  mount(section, ctx) {
    ensureCss();
    CFG = ctx.cfg || {};
    const cfg = CFG;
    T = schedule(cfg, ctx, this.dur(cfg));
    section.classList.add('s-hub');
    section.innerHTML = `<div class="hub-root ar-wide">
  <svg class="hub-defs" aria-hidden="true" width="0" height="0">${SYMBOLS}</svg>
  <div class="sbsite"><div class="stage">
    <div class="stage-bar"><i></i><i></i><i></i><span>superbot</span><em class="led on"></em></div>
    <div class="body"><div class="arena">${hubMarkup(A, { title: chatTitle(cfg) })}</div></div>
  </div></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const qa = (s) => [...section.querySelectorAll(s)];
    el = {
      secRoot: section,
      root: q('.hub-root'), site: q('.sbsite'), stage: q('.stage'), arena: q('.arena'),
      hub: q('.hub'), rail: q('.rail'), head: q('.chat-head b'),
      feed: q('.feed'), composer: q('.composer'), rcPh: q('.rc-ph'), send: q('.rc-send'),
      inners: qa('.hub .inner'), W: 0, measured: false, last: {},
    };
    el.cursor = makeCursor();
    section.appendChild(el.cursor);
    el.feedIn = TPL('<div class="feed-in"></div>');
    el.feed.appendChild(el.feedIn);
    el.phText = el.rcPh.textContent.trim();
    el.rail = qa('.rail-item');

    // ---- the thread: the ask, then superbot's reply (chips -> aggregation card -> build card) ----
    el.marks = [];
    el.user = TPL(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(cfg.ask || '')}</div></div></div>`);
    el.feedIn.appendChild(el.user);
    const bot = TPL(`<div class="msg qc-m qc-r hb-bot"><span class="avatar sb"><img src="${A('mark-clean.svg')}" alt=""/></span><div class="m-main"></div></div>`);
    el.feedIn.appendChild(bot);
    el.bot = bot;
    const main = bot.querySelector('.m-main');

    el.chips = (cfg.steps || []).map((label, i) => {
      const favs = i === 0 && (cfg.sources || []).length
        ? `<span class="hb-favs">${(cfg.sources || []).slice(0, 5).map((s, k) => `<span class="hb-logo" style="z-index:${20 - k}"><img src="${ctx.asset(s.logo)}" alt=""/></span>`).join('')}</span>`
        : '';
      const n = TPL(`<div class="ch-tool hb-chip"><span class="spin"></span>${favs}<span class="ch-tool-t">${esc(label)}</span></div>`);
      main.appendChild(n);
      return { n, spin: n.querySelector('.spin'), at: T.chip0 + i * T.chipGap, done: T.chip0 + i * T.chipGap + T.chipRes };
    });

    el.agg = TPL(aggCard(cfg, ctx, T));
    main.appendChild(el.agg);
    el.srcRows = [...el.agg.querySelectorAll('.hb-src')].map((n, i) => ({
      n, count: n.querySelector('.hb-src-c'), bar: n.querySelector('.hb-src-bar > i'),
      at: T.agg + i * T.aggGap,
    }));
    el.srcCounts = (cfg.sources || []).map((s) => s.count || 0);
    el.aggF = el.agg.querySelector('.hb-agg-fn');
    el.prevs = [...el.agg.querySelectorAll('.hb-prev')].map((n, i) => ({ n, at: T.prev0 + i * T.prevGap }));
    el.prevsBox = el.agg.querySelector('.hb-prevs');

    el.build = TPL(buildCard(cfg, ctx));
    main.appendChild(el.build);
    el.lines = [...el.build.querySelectorAll('.hb-line')].map((n, i) => ({ n, at: T.line0 + i * T.lineGap }));
    el.thumb = el.build.querySelector('.hb-thumb');
    el.thumbIn = el.build.querySelector('.hb-thumb-in');
    el.skel = el.build.querySelector('.hb-skel');
    el.open = el.build.querySelector('.hb-open');

    // the frontend itself, built ONCE at its real 1280 px width and CSS-scaled into the card. A site that
    // throws must cost the preview only: the chat's own reply is already in the DOM and stays.
    el.siteRoot = document.createElement('div');
    el.siteRoot.className = 'site site-' + (ctx.slug || cfg.slug || 'preview');
    el.siteRoot.style.width = THUMB_W + 'px';
    el.thumbIn.appendChild(el.siteRoot);
    try {
      ctx.site.default(el.siteRoot, { data: ctx.data, cfg: ctx.cfg });
    } catch (err) {
      console.error('[hub] site build threw:', err && err.message);
      el.thumbIn.classList.add('hb-nosite');
    }
    // The skeleton sits INSIDE the scaled thumbnail root: its slabs are measured in the page's own 1280px
    // layout px, so they have to be drawn in the page's coordinate space. Drawn on the card instead, every
    // slab came out (thumb width / 1280) too small in the page's space, i.e. 1.8x too big on the frame: the
    // header bar ran past the header and the bars past the content edges. Appended last so it paints over.
    el.thumbIn.appendChild(el.skel);
    // The page has to be settled before its layout is measured: a fallback face is a different height, and
    // an image that has not decoded is a zero-height block that moves everything under it. document.fonts
    // is awaited once, and every img in the page is awaited through decode(), whose rejection is swallowed,
    // so an image that errors settles the gate instead of hanging it.
    el.settled = false;
    const fontsDone = new Promise((res) => {
      if (!document.fonts || document.fonts.status === 'loaded') return res();
      document.fonts.ready.then(res, res);
    });
    // the hub's own source logos are awaited too: which chip one lands on is decided from its pixels, so that
    // decision is made before the gate opens and a frozen ?t= frame can never be shot mid-decision
    const imgs = [...el.siteRoot.querySelectorAll('img'), ...section.querySelectorAll('.hb-logo img')];
    const imgsDone = Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
    Promise.all([fontsDone, imgsDone]).then(() => { el.settled = true; });
    wireLogos(false);

    // scroll marks are whole blocks in page order: the thread's offset is the measured bottom of the newest
    // block, so a card is either fully above the composer or not on screen yet. Marking the rows INSIDE the
    // aggregation card (an earlier version) left the card's own footer, the total, behind the composer.
    // each mark is the time its glide STARTS, LEAD before its block appears: the scroll has landed by then
    el.marks = [
      [T.send - LEAD, el.user],
      ...el.chips.map((c) => [c.at - LEAD, c.n]),
      [T.agg - LEAD, el.agg],
      [T.build - LEAD, el.build],
    ].sort((a, b) => a[0] - b[0]);
  },

  render(lt, ctx) {
    if (!el) return;
    const cfg = CFG, t = clampT(lt, 0, T.dur), dur = T.dur;
    const W = (ctx && ctx.W) || 1920;
    if (el.W !== W) geo(W, H);
    const live = measure();

    // ---- the window has already landed: it only fades up ----
    const fade = outCubic(seg(t, 0, T.fade));
    el.site.style.opacity = fade.toFixed(3);
    el.hub.style.opacity = '1';
    for (const n of el.inners) n.style.opacity = '1';
    // the rail's tiles land with the window (hub.css leaves them at 0: tabs-chaos dropped them in one by one)
    for (const n of el.rail) n.style.opacity = '1';

    // ---- the ask, typed into the composer; then the send press ----
    const typing = t >= T.type0 && t < T.send;
    const nch = typing ? Math.round((cfg.ask || '').length * seg(t, T.type0, T.type1)) : 0;
    const ph = typing
      ? `<span class="qc-typed">${esc((cfg.ask || '').slice(0, nch))}</span><i class="qc-caret"></i>`
      : esc(el.phText);
    if (ph !== el.last.ph) { el.rcPh.innerHTML = ph; el.last.ph = ph; }
    el.send.classList.toggle('qc-on', typing);
    const sp = press(t, T.send, 0.05, 0.05, 0.13);
    el.send.style.transform = sp > 0 ? `scale(${(1 - 0.14 * sp).toFixed(4)})` : 'none';

    // ---- superbot's reply block (hub.css holds every .msg at 0 until a scene says otherwise) ----
    el.bot.style.opacity = outCubic(seg(t, T.bot, T.bot + 0.3)).toFixed(3);

    // ---- the user's message rises in ----
    const pu = outCubic(seg(t, T.user, T.user + 0.42));
    el.user.style.opacity = pu.toFixed(3);
    el.user.style.transform = pu >= 1 ? 'none' : `translateY(${((1 - pu) * 12).toFixed(2)}px)`;

    // ---- superbot's tool chips, spinner then check ----
    el.chips.forEach((c) => {
      const p = outCubic(seg(t, c.at, c.at + 0.3));
      c.n.style.opacity = p.toFixed(3);
      c.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
      const done = t >= c.done;
      c.spin.classList.toggle('done', done);
      c.spin.style.transform = done || t < c.at ? '' : `rotate(${(((t - c.at) * 430) % 360).toFixed(1)}deg)`;
    });

    // ---- the aggregation card: a row per source, counts ticking, then the first listings ----
    const pa = outCubic(seg(t, T.agg, T.agg + 0.34));
    el.agg.style.opacity = pa.toFixed(3);
    el.srcRows.forEach((r, i) => {
      const p = outCubic(seg(t, r.at, r.at + 0.3));
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 7).toFixed(2)}px)`;
      const tick = outCubic(seg(t, r.at, r.at + T.aggTick));
      r.count.textContent = fmt(el.srcCounts[i] * tick);
      r.bar.style.width = (tick * 100).toFixed(2) + '%';
    });
    const total = outCubic(seg(t, T.agg, T.aggEnd));
    el.aggF.textContent = fmt(((cfg.found || {}).n || 0) * total);
    el.prevs.forEach((p) => {
      const o = outCubic(seg(t, p.at, p.at + T.prevDur));
      p.n.style.opacity = o.toFixed(3);
      p.n.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 9).toFixed(2)}px)`;
    });
    // the listing rows are not reserved space: the card grows as they land, one row height at a time, so
    // there is never an empty block sitting where a listing is still to come
    if (el.prevH) {
      // fitCards() may have dropped preview rows the feed cannot hold, so the beat quoted here is over the
      // rows that are really there: the card stops growing instead of reserving a row that never lands
      const n = el.fitPrev == null ? el.prevs.length : Math.min(el.fitPrev, el.prevs.length);
      const span = n > 1 ? T.prevGap * (n - 1) + T.prevDur : T.prevDur;
      const p = n ? seg(t, T.prev0, T.prev0 + span) : 0;
      const shown = Math.min(n, Math.ceil(p * n - 1e-6));
      el.prevsBox.style.height = (shown * el.prevH + 8).toFixed(1) + 'px';
    }

    // ---- the build card: the app, its lines, and the live page filling in section by section ----
    const pb = outCubic(seg(t, T.build, T.build + 0.34));
    el.build.style.opacity = pb.toFixed(3);
    el.build.style.transform = pb >= 1 ? 'none' : `translateY(${((1 - pb) * 10).toFixed(2)}px)`;
    el.lines.forEach((l) => {
      const o = seg(t, l.at, l.at + 0.3);
      l.n.style.opacity = o.toFixed(3);
      l.n.classList.toggle('hb-ok', t >= l.at + 0.24);
    });
    if (live) {
      const nsec = el.secs.length || 1;
      el.secs.forEach((s, i) => {
        const at = T.rev0 + (i / nsec) * T.revDur * 0.92;
        const p = outCubic(seg(t, at, at + 0.42));
        s.node.style.visibility = t >= at ? '' : 'hidden';
        s.node.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * 14).toFixed(2)}px)`;
        s.sk.style.opacity = (1 - seg(t, at, at + 0.3)).toFixed(3);
        s.sk.style.display = t >= at + 0.32 ? 'none' : '';
      });
      const sh = seg(t, T.rev0, T.rev1);
      el.build.querySelector('.hb-shine').style.opacity = (t < T.rev0 || t > T.rev1 ? 0 : (1 - sh) * 0.5).toFixed(3);
    } else {
      // not latched yet: the page is not revealed by any clock, so no section may be left showing from an
      // earlier frame (prime renders the hub at its end, where everything is revealed). The frame reads as
      // an empty thumbnail for the couple of rAFs until the gate opens, never as a page with no skeleton.
      for (const n of el.siteRoot.children) n.style.visibility = 'hidden';
      el.skel.style.display = 'none';
    }
    const po = outCubic(seg(t, T.open, T.open + 0.3));
    el.open.style.opacity = po.toFixed(3);
    el.open.parentNode.style.opacity = po.toFixed(3);
    el.open.style.transform = `scale(${(1 - 0.06 * press(t, T.press)).toFixed(4)})`;

    // ---- the feed scrolls so the newest block sits above the composer ----
    const cs = getComputedStyle(el.feed);
    const viewH = el.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    // viewH <= 0 means the window is not laid out yet (a scene the engine renders while hidden): leave the
    // thread where it is instead of scrolling the whole reply out of a zero-height feed.
    if (viewH > 4) {
      // y is the scroll offset: the newest block's measured bottom sits on the composer's edge, so the block
      // is fully visible whenever it fits the feed. A block taller than the feed cannot be shown whole; then
      // it is read from its own top (min() picks the block's top + one view) rather than skipped to its end.
      let y = 0;
      for (const [a, n] of el.marks) {
        if (t <= a) break;
        const b = boxIn(n, el.feedIn);
        const target = Math.min(b.y + b.h, b.y + viewH - 8);
        const p = seg(t, a, a + SCROLL);
        if (p >= 1) { y = target; continue; }   // landed: this is the block that is on screen, keep it clear
        y = lerp(y, target, inOutCubic(p));     // still gliding: its block has not faded in yet, so it moves
        break;                                  // no block that IS on screen
      }
      // 0 is the floor: a thread shorter than the feed stays at the top of it instead of hanging on the
      // composer with half a feed height of empty space above the user's own bubble
      // (shots/gift-dad-gpt/ad-16x9-hubcards.png)
      el.feedIn.style.transform = `translateY(${Math.min(0, viewH - 8 - y).toFixed(2)}px)`;
    }

    // ---- the pointer: to "Open in Chrome", pressed 0.65s before the end. Both ends are read per frame,
    // because the button's place in the frame depends on where the feed has scrolled to by then.
    const mv = seg(t, T.move, T.move + T.moveDur);
    if (live && t >= T.move - 0.3) {
      const a = boxIn(el.send, el.secRoot), b = boxIn(el.open, el.secRoot);
      const p0 = { x: a.cx, y: a.cy }, p1 = { x: b.cx, y: b.cy };
      const q = t >= T.move ? path(t, [{ t: T.move, x: p0.x, y: p0.y }, { t: T.move + T.moveDur, x: p1.x, y: p1.y }]) : p0;
      const vis = mv * (1 - seg(t, dur - 0.22, dur - 0.04));
      placeCursor(el.cursor, q.x, q.y, press(t, T.press), vis);
    }

    // ---- handoff: the thumbnail's visible box in stage px, for the browser scene to morph out of ----
    if (t >= dur - 1.5 && ctx && ctx.shared) {
      const b = boxIn(el.thumb, el.secRoot);
      ctx.shared.thumb = { x: b.x, y: b.y, w: b.w, h: b.h };
    }
  },
};