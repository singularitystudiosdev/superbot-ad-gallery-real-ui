// ad.js: the cg1-1004 every-model ad as a pure function of time. window.seek(t) paints frame t
// from scratch (motion-reel render contract): no CSS transitions, no timers, no carried state.
// UI entrances use superbot's own motion tokens (out-cubic rises, out-back pops, emphasized
// decelerate); camera, scroll, cursor and the end card ride closed-form springs (lib/motion.mjs).
import { spring, track, mulberry32 } from './lib/motion.mjs';

const DUR = 21.24;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a, b, p) => a + (b - a) * p;

// CSS cubic-bezier, solved for x by Newton then bisection (same curve the browser draws).
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x;
      if (Math.abs(e) < 1e-6) return sy(u);
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    let lo = 0, hi = 1;
    u = x;
    for (let i = 0; i < 30; i++) { const v = sx(u); if (Math.abs(v - x) < 1e-6) break; if (x > v) lo = u; else hi = u; u = (lo + hi) / 2; }
    return sy(u);
  };
}
// superbot motion tokens (packages/tokens motion.tokens.json)
const E = {
  std: bezier(0.2, 0, 0, 1),
  outCubic: bezier(0.33, 1, 0.68, 1),
  outBack: bezier(0.34, 1.56, 0.64, 1),
  emph: bezier(0.05, 0.7, 0.1, 1),
  acc: bezier(0.3, 0, 1, 1),
  inOut: bezier(0.65, 0, 0.35, 1),
};
const prog = (t, t0, d) => clamp01((t - t0) / d);
const tw = (t, t0, d, ease = E.outCubic) => ease(prog(t, t0, d));
// a window [a, b] with r-second ramps on both ends (crossfades sum to one at the seams)
const env = (t, a, b, r = 0.14) => Math.min(clamp01((t - a) / r), clamp01((b + r - t) / r));
const springP = (t, t0, k = 170, d = 26) => (t <= t0 ? 0 : spring(t - t0, k, d));

// ---------------------------------------------------------------- marks and icons
const HEAD = 'M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32Z';
const EYES = 'ZM35 47a8 11 0 1 0 0 22a8 11 0 1 0 0-22ZM65 47a8 11 0 1 0 0 22a8 11 0 1 0 0-22Z';
const EAR_L = 'M14 46V28Q14 20 21 21Q28 24 36 32Z';
const EAR_R = 'M86 46V28Q86 20 79 21Q72 24 64 32Z';
const face = (fill, dx = 0, dy = 0) => `<g fill="${fill}" transform="translate(${dx} ${dy})"><path fill-rule="evenodd" d="${HEAD}${EYES}"/><path d="${EAR_L}"/><path d="${EAR_R}"/></g>`;
let gid = 0;
function markSvg(kind, size) {
  if (kind === 'face') return `<svg width="${size}" height="${size}" viewBox="8 14 84 78">${face('currentColor')}</svg>`;
  if (kind === 'glitch') return `<svg width="${size}" height="${size}" viewBox="6 12 88 82">${face('#00e5c3', -1.6, -1.6)}${face('#c026d3', 1.6, 1.6)}${face('#ffffff')}</svg>`;
  const id = `ring${gid++}`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00e5c3"/><stop offset=".25" stop-color="#2b6bff"/><stop offset=".5" stop-color="#6a1fd8"/><stop offset=".75" stop-color="#c026d3"/><stop offset="1" stop-color="#ff3d9a"/></linearGradient></defs><rect width="100" height="100" rx="22.5" fill="#000"/><rect x="1.37" y="1.37" width="97.26" height="97.26" rx="21.1" fill="none" stroke="url(#${id})" stroke-width="2.73"/>${face('#00e5c3', -1.2, -1.2)}${face('#c026d3', 1.2, 1.2)}${face('#ffffff')}</svg>`;
}
// lucide paths (ISC), the icon set superbot ships
const ICON = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevRight: '<path d="m9 18 6-6-6-6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  panelLeft: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  panelRight: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  code2: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  filter: '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>',
  pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  workflow: '<rect x="3" y="3" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
  bug: '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  key: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  spin: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};
const iconSvg = (name, size = 16, sw = 1.75) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" style="width:${size}px;height:${size}px;stroke-width:${sw}">${ICON[name]}</svg>`;

// ---------------------------------------------------------------- timeline (seconds)
const TURNS = [
  { u: '#u1', text: 'make me a muse meme', type: [0.25, 0.95], send: 1.1, live: [1.1, 3.62] },
  { u: '#u2', text: 'scrape reddit and look for more', type: [4.72, 5.52], send: 5.65, live: [5.65, 8.75] },
  { u: '#u3', text: 'winning, order me a burger', type: [9.78, 10.5], send: 10.65, live: [10.65, 13.35] },
];
const PILLS = [
  { el: '#p1', rise: 1.4, check: 2.1 },
  { el: '#p2', rise: 5.8, check: 6.45 },
  { el: '#p3', rise: 10.8, check: 11.45 },
];
const STEPS = { '#n2': [6.55, 6.8, 7.05, 7.3], '#n3': [11.55, 11.8, 12.05, 12.3] };
const STEP_DONE = 0.3;
const WHO1 = 2.2, GEN1 = 2.3, OPEN1 = 3.5, IMG1 = 3.56, PROV1 = 4.32;
const ANSWERS = [{ el: '#a1', t: 3.6 }, { el: '#a2', t: 7.85 }, { el: '#a3', t: 12.8 }];
const ANSWER_CPS = 150;
const DECK2 = 7.45, LINKS2 = 8.32, OUT2 = 8.75;
const WIN3 = 12.55, OUT3 = 13.35;
const CUR_IN = 13.1, CUR_AT = 13.72, CLICK1 = 13.8, PEEK_OPEN = 13.86, CUR_CLOSE_AT = 15.62, CLICK2 = 15.72, PEEK_CLOSE = 15.8, CUR_OUT = 16.05;
const PICK_SWAP = 1.4, PICK_BACK = 4.18;
const OUTRO = 17.15;
const SETTLED = ['6:41 PM', '6:42 PM', '6:42 PM'];
const LAPSE = 12; // elapsed counters run as a time-lapse so they agree with "Worked for Ns"

// ---------------------------------------------------------------- init: build, decode, measure
const M = {}; // measured layout
let ready = null;

function hydrate() {
  for (const el of $$('[data-i]')) el.outerHTML = iconSvg(el.dataset.i, +(el.dataset.s || 16));
  for (const el of $$('[data-mark]')) el.innerHTML = markSvg(el.dataset.mark, +(el.dataset.size || 48));
  for (const nest of $$('.steps[data-steps]')) {
    nest.innerHTML = JSON.parse(nest.dataset.steps).map(([l, d]) => `<div class="step"><span class="g"><svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round">${ICON.spin}</svg><svg class="okc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ICON.check}</svg></span><span class="l">${l}</span><span class="d">${d}</span></div>`).join('');
  }
  for (const a of $$('.answer')) a.innerHTML = `<span class="on"></span><span class="nx"></span><span class="rest">${a.dataset.text}</span>`;
  $('#pickGpt').style.right = '106px';
}

function offTop(el, root) { let y = 0; while (el && el !== root) { y += el.offsetTop; el = el.offsetParent; } return y; }
function offLeft(el, root) { let x = 0; while (el && el !== root) { x += el.offsetLeft; el = el.offsetParent; } return x; }

function measure() {
  const feed = $('#feed');
  const box = (sel) => { const el = $(sel); return { top: offTop(el, feed), left: offLeft(el, feed), h: el.offsetHeight, w: el.offsetWidth }; };
  for (const s of ['#u1', '#p1', '#n1', '#a1', '#g1', '#pv1', '#u2', '#p2', '#n2', '#sh2', '#a2', '#lk2', '#o2', '#u3', '#p3', '#n3', '#sh3', '#a3', '#o3']) M[s] = box(s);
  M.feedH = feed.offsetHeight;
  M.feedLeft = feed.offsetLeft;
  M.vpTop = $('#viewport').offsetTop;
  M.vpH = $('#viewport').offsetHeight;
  // each pill's two label widths, so the pill can glide between them
  for (const p of PILLS) {
    const el = $(p.el);
    p.wa = el.querySelector('.la').offsetWidth;
    p.wb = el.querySelector('.lb').offsetWidth;
  }
  // step rows: bottoms relative to the feed
  for (const n of Object.keys(STEPS)) M[n + 'rows'] = $$(n + ' .step').map((r) => offTop(r, feed) + r.offsetHeight);
  M.win3 = { x: 248 + M.feedLeft + M['#sh3'].left + 64, y: M.vpTop + M['#sh3'].top + 53 };
  // typing schedule: seeded human cadence inside each typing window
  const rnd = mulberry32(1004);
  for (const turn of TURNS) {
    const n = turn.text.length;
    const w = Array.from({ length: n }, (_, i) => 0.6 + rnd() * 0.8 + (turn.text[i] === ' ' ? 0.35 : 0));
    const sum = w.reduce((a, b) => a + b, 0);
    let acc = 0;
    turn.at = w.map((x) => (acc += x) / sum).map((f) => turn.type[0] + f * (turn.type[1] - turn.type[0]));
  }
}

// ---------------------------------------------------------------- derived motion: scroll + camera
const GEN_SHIFT = 36; // the answer line that opens above the image once it lands (28 line + 8 gap)
let SCROLL_KEYS = [];
let CAM = { s: [], x: [], y: [] };

function contentBottom(t) {
  // bottom of what is visible in the feed at time t (feed coordinates)
  const b = (s) => M[s].top + M[s].h;
  let y = 0;
  const seen = (s, at) => { if (t >= at) y = Math.max(y, b(s)); };
  seen('#u1', 1.12); seen('#p1', 1.4); seen('#n1', WHO1);
  if (t >= GEN1) y = Math.max(y, b('#g1') - (t < OPEN1 ? GEN_SHIFT : 0));
  seen('#pv1', PROV1);
  seen('#u2', 5.67); seen('#p2', 5.8);
  STEPS['#n2'].forEach((at, i) => { if (t >= at) y = Math.max(y, M['#n2rows'][i]); });
  seen('#sh2', DECK2); seen('#a2', 7.85); seen('#lk2', LINKS2); seen('#o2', OUT2);
  seen('#u3', 10.67); seen('#p3', 10.8);
  STEPS['#n3'].forEach((at, i) => { if (t >= at) y = Math.max(y, M['#n3rows'][i]); });
  seen('#sh3', WIN3); seen('#a3', 12.8); seen('#o3', OUT3 + 0.01);
  return y;
}
const scrollFor = (t) => Math.max(0, contentBottom(t) + 34 - M.vpH);

function buildMotion() {
  const times = [0, 1.12, 1.4, WHO1, GEN1, OPEN1, PROV1, 5.67, 5.8, ...STEPS['#n2'], DECK2, 7.85, LINKS2, OUT2, 10.67, 10.8, ...STEPS['#n3'], WIN3, 12.8, OUT3 + 0.01];
  // the meme close-up frames the answer line and the whole image together
  const scrollKey = (at) => (at === OPEN1 ? Math.min(scrollFor(at + 1e-4), M['#a1'].top - 16) : scrollFor(at + 1e-4));
  SCROLL_KEYS = times.map((at) => [Math.max(0, at - 0.18), scrollKey(at)]);
  const scrollAt = (t) => track(t, SCROLL_KEYS, 120, 22);
  // app-space centre of a feed element at time t (after the scroll has mostly settled)
  const at = (sel, t, fy = 0.5, fx = 0.5) => ({
    x: 248 + M.feedLeft + M[sel].left + M[sel].w * fx,
    y: M.vpTop + M[sel].top + M[sel].h * fy - scrollAt(t),
  });
  const g1 = at('#g1', 4.0);
  const a1 = at('#a1', 4.0, 0);
  const g1b = at('#g1', 4.0, 1);
  const memeFrame = { x: g1.x + 40, y: (a1.y + g1b.y) / 2 };
  const lk = at('#lk2', 9.2);
  const st2 = at('#n2', 7.6);
  const st3 = at('#n3', 12.6);
  const peekFocus = { x: 222 + 8 + 691 * 0.27, y: 83 + 40 + 432 * 0.44 };
  // three framings: WIDE (whole window), CLOSE (the main pane, s 1.3) and DETAIL (one artifact)
  const CX = 700; // main pane centre
  const peekC = { x: 222 + 354.5, y: 83 + 241 };
  const K = [ // [time, s, fx, fy]
    [0, 1.0, 576, 324],
    [0.3, 1.3, CX, 350],
    [1.25, 1.48, 690, 232],
    [2.35, 1.34, 640, at('#g1', 3.0, 0.42).y],
    [3.58, 1.46, memeFrame.x, memeFrame.y],
    [4.55, 1.3, CX, 399],
    [5.75, 1.3, CX, 330],
    [6.6, 1.32, CX, st2.y + 20],
    [8.3, 1.52, lk.x, lk.y - 6],
    [9.55, 1.3, CX, 399],
    [10.75, 1.3, CX, 330],
    [11.6, 1.32, CX, st3.y + 20],
    [13.15, 1.24, 640, at('#sh3', 13.4).y],
    [13.72, 1.28, peekC.x, peekC.y],
    [14.45, 1.44, 222 + 8 + 691 * 0.3, 83 + 40 + 432 * 0.48],
    [15.25, 1.28, peekC.x, peekC.y],
    [15.92, 1.0, 576, 324],
    [OUTRO, 0.9, 576, 324],
  ];
  CAM = { s: K.map((k) => [k[0], k[1]]), x: K.map((k) => [k[0], k[2]]), y: K.map((k) => [k[0], k[3]]) };
  M.scrollAt = scrollAt;
  // cursor path: in from the lower right, onto the page shot, then onto the peek's Close chip
  const win = { x: M.win3.x, y: M.win3.y - scrollAt(13.7) };
  M.closeChip = { x: 222 + 709 - 8 - 30, y: 83 + 20 };
  M.curKeys = { x: [[0, 980], [CUR_IN, win.x + 6], [PEEK_OPEN + 0.5, 760], [CUR_CLOSE_AT - 0.45, M.closeChip.x]], y: [[0, 560], [CUR_IN, win.y + 4], [PEEK_OPEN + 0.5, 470], [CUR_CLOSE_AT - 0.45, M.closeChip.y]] };
}

async function init() {
  hydrate();
  await document.fonts.ready;
  await Promise.all($$('img').map((im) => (im.complete && im.naturalWidth ? Promise.resolve() : im.decode().catch((e) => { console.error('image decode failed', im.src, e); throw e; }))));
  measure();
  buildMotion();
}

// ---------------------------------------------------------------- painters
const css = (el, o) => { for (const k in o) el.style[k] = o[k]; };
function rise(el, t, t0, dy = 10, d = 0.42) {
  const p = tw(t, t0, d);
  el.style.opacity = t < t0 ? 0 : p;
  el.style.transform = `translateY(${(1 - p) * dy}px)`;
  return p;
}

function paintCamera(t) {
  const s = track(t, CAM.s, 60, 15.5);
  const fx = track(t, CAM.x, 60, 15.5);
  const fy = track(t, CAM.y, 60, 15.5);
  const S = (1920 / 1152) * s;
  let tx, ty;
  if (S >= 1920 / 1152) {
    tx = Math.min(0, Math.max(1920 - 1152 * S, 960 - fx * S));
    ty = Math.min(0, Math.max(1080 - 648 * S, 540 - fy * S));
  } else {
    tx = (1920 - 1152 * S) / 2;
    ty = (1080 - 648 * S) / 2;
  }
  const app = $('#app');
  app.style.transform = `translate(${tx}px, ${ty}px) scale(${S})`;
  app.style.opacity = 1 - tw(t, OUTRO, 0.36, E.std);
}

function paintHeroAndComposer(t) {
  const C0 = 296, C1 = 510;
  const c = lerp(C0, C1, E.emph(prog(t, TURNS[0].send, 0.5)));
  $('#composer').style.top = `${c}px`;
  const gone = tw(t, TURNS[0].send, 0.26, E.std);
  css($('#hero'), { top: `${c - 87}px`, opacity: 1 - gone, transform: `translateY(${-14 * gone}px)` });
  css($('#chips'), { top: `${c + 154}px`, opacity: 1 - tw(t, TURNS[0].send, 0.2, E.std), transform: `translateY(${10 * gone}px)` });

  // which turn owns the composer right now
  let typed = '', live = false, focusW = 0, typing = false;
  for (const turn of TURNS) {
    if (t >= turn.type[0] - 0.2 && t < turn.send) {
      typing = true;
      const n = turn.at.filter((x) => x <= t).length;
      typed = turn.text.slice(0, n);
    }
    if (t >= turn.live[0] && t < turn.live[1]) live = true;
    focusW = Math.max(focusW, env(t, turn.type[0] - 0.3, turn.send, 0.2));
  }
  $('#typed').textContent = typed;
  const ph = $('#ph');
  ph.textContent = live ? 'Queues until this turn ends' : 'How can superbot help you today?';
  ph.style.opacity = typed ? 0 : 1;
  // caret: solid while typing, caret-pulse (1s, 50% at .2) while focused and idle
  const caret = $('#caret');
  caret.style.left = `${$('#typed').offsetWidth + (typed ? 1 : 0)}px`;
  const pulse = 0.6 + 0.4 * Math.cos(((t % 1) / 1) * Math.PI * 2);
  caret.style.opacity = typing ? (typed ? 1 : pulse) : 0;
  // ring: rest .3, focus .8, a live turn breathes between them
  let ring = 0.3 + 0.5 * focusW;
  for (const turn of TURNS) {
    const w = env(t, turn.live[0], turn.live[1], 0.3);
    if (w > 0) ring = Math.max(ring, 0.3 + w * (0.22 + 0.16 * Math.sin((t - turn.live[0]) * Math.PI * 1.25)));
  }
  $('#cring').style.opacity = ring;
  // send: idle / armed / stop, cross-faded at each seam; a press dips it
  let armed = 0, stop = 0;
  for (const turn of TURNS) {
    const firstKey = turn.at[0];
    armed = Math.max(armed, env(t, firstKey, turn.send, 0.12));
    stop = Math.max(stop, env(t, turn.send, turn.live[1], 0.16));
  }
  $('#sendArmed').style.opacity = armed;
  $('#sendStop').style.opacity = stop;
  $('#sendIdle').style.opacity = Math.max(0, 1 - armed - stop);
  let press = 1;
  for (const turn of TURNS) press = Math.min(press, 1 - 0.06 * Math.sin(Math.PI * prog(t, turn.send - 0.05, 0.14)));
  $('.send').style.transform = `scale(${press})`;
  $('#super').style.opacity = live ? 0.5 : 1;
  // model chip: dips to .15 over 140ms, swaps to the vendor, pops 1.08 -> 1 over 400ms out-cubic
  const sb = $('#pickSb'), gpt = $('#pickGpt');
  const dip = (t0) => 1 - 0.85 * tw(t, t0, 0.14, E.std);
  const pop = (t0) => ({ o: lerp(0.15, 1, tw(t, t0, 0.18, E.std)), s: lerp(1.08, 1, tw(t, t0, 0.4)) });
  if (t < PICK_SWAP + 0.14) { css(sb, { opacity: dip(PICK_SWAP), transform: 'scale(1)' }); gpt.style.opacity = 0; }
  else if (t < PICK_BACK) { sb.style.opacity = 0; const p = pop(PICK_SWAP + 0.14); css(gpt, { opacity: p.o, transform: `scale(${p.s})` }); }
  else if (t < PICK_BACK + 0.14) { sb.style.opacity = 0; css(gpt, { opacity: dip(PICK_BACK), transform: 'scale(1)' }); }
  else { gpt.style.opacity = 0; const p = pop(PICK_BACK + 0.14); css(sb, { opacity: p.o, transform: `scale(${p.s})` }); }
}

function paintHeader(t) {
  const p = tw(t, TURNS[0].send + 0.05, 0.3, E.std);
  $('#titleNew').style.opacity = 1 - p;
  $('#titleThread').style.opacity = p;
  const b = tw(t, TURNS[0].send + 0.05, 0.36, E.std);
  css($('#band'), { opacity: b, transform: `translateY(${-6 * (1 - b)}px)` });
}

function paintSidebar(t) {
  const ins = springP(t, TURNS[0].send + 0.06, 170, 26);
  for (const r of $$('#recent .row[data-r]')) r.style.top = `${36 * (+r.dataset.r + ins)}px`;
  const live = $('#liveRow');
  const a = tw(t, TURNS[0].send + 0.1, 0.36);
  css(live, { top: '0px', opacity: a, transform: `translateX(${-8 * (1 - a)}px)` });
  // time: elapsed (time-lapse) while a turn runs, then the clock
  let label = 'now', liveW = 0;
  TURNS.forEach((turn, i) => {
    if (t >= turn.live[0]) label = t < turn.live[1] ? `${Math.max(1, Math.floor((t - turn.live[0]) * LAPSE))}s` : SETTLED[i];
    liveW = Math.max(liveW, env(t, turn.live[0], turn.live[1], 0.2));
  });
  $('#liveTime').textContent = label;
  const bar = $('#liveProg');
  bar.style.opacity = liveW;
  bar.style.left = `${(((t * 0.8) % 1) * 134 - 34)}%`;
}

function paintPill(p, t) {
  const el = $(p.el);
  rise(el, t, p.rise, 10, 0.42);
  const tile = el.querySelector('.tile20');
  const tp = tw(t, p.rise + 0.05, 0.4, E.outBack);
  css(tile, { opacity: tw(t, p.rise + 0.05, 0.12, E.std), transform: `scale(${lerp(0.5, 1, tp)}) rotate(${lerp(-25, 0, tp)}deg)` });
  const done = tw(t, p.check, 0.3, E.std);
  const la = el.querySelector('.la'), lb = el.querySelector('.lb');
  la.style.opacity = 1 - tw(t, p.check, 0.16, E.std);
  lb.style.opacity = tw(t, p.check + 0.06, 0.2, E.std);
  el.querySelector('.lbl').style.width = `${lerp(p.wa, p.wb, done)}px`;
  // the switching shimmer: a highlight band travels the label every 1.4s
  const sweep = ((t - p.rise) % 1.4) / 1.4;
  css(la, { backgroundImage: `linear-gradient(90deg, #8d909a 0%, #8d909a ${sweep * 140 - 40}%, #ffffff ${sweep * 140 - 15}%, #8d909a ${sweep * 140 + 10}%, #8d909a 100%)`, webkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' });
  const spin = el.querySelector('.spin'), ok = el.querySelector('.okc');
  css(spin, { opacity: 1 - tw(t, p.check, 0.2, E.std), transform: `rotate(${(t - p.rise) * 360}deg)` });
  const cp = tw(t, p.check, 0.3, E.outBack);
  css(ok, { opacity: t < p.check ? 0 : tw(t, p.check, 0.1, E.std), transform: `scale(${lerp(0.3, 1, cp)})` });
}

function paintSteps(nestSel, t) {
  const nest = $(nestSel);
  const rows = $$(nestSel + ' .step');
  const times = STEPS[nestSel];
  nest.style.opacity = t >= times[0] ? 1 : 0;
  rows.forEach((row, i) => {
    const t0 = times[i];
    rise(row, t, t0, 6, 0.34);
    const spin = row.querySelector('.spin'), ok = row.querySelector('.okc');
    const td = t0 + STEP_DONE;
    css(spin, { opacity: t < t0 ? 0 : 1 - tw(t, td, 0.16, E.std), transform: `rotate(${(t - t0) * 360}deg)` });
    css(ok, { opacity: t < td ? 0 : tw(t, td, 0.1, E.std), transform: `scale(${lerp(0.3, 1, tw(t, td, 0.3, E.outBack))})` });
    row.querySelector('.l').style.color = mix('#e6e8ee', '#aeb1bc', tw(t, td, 0.24, E.std));
  });
  // the guide rail grows down to the last row that has landed
  const rail = nest.querySelector('.rail');
  const top0 = M[nestSel].top;
  let target = 0;
  times.forEach((t0, i) => { if (t >= t0) target = M[nestSel + 'rows'][i] - top0; });
  const prev = times.filter((x) => x <= t).length;
  const from = prev >= 2 ? M[nestSel + 'rows'][prev - 2] - top0 : 0;
  const g = prev ? tw(t, times[prev - 1], 0.34) : 0;
  rail.style.height = `${8 + lerp(from, target, g)}px`;
  rail.style.bottom = 'auto';
}

function mix(a, b, p) {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})`;
}

function paintAnswer(a, t) {
  const el = $(a.el);
  const text = el.dataset.text;
  const x = Math.max(0, (t - a.t) * ANSWER_CPS);
  const n = Math.min(text.length, Math.floor(x));
  const frac = x - n;
  el.querySelector('.on').textContent = text.slice(0, n);
  const nx = el.querySelector('.nx');
  nx.textContent = n < text.length ? text[n] : '';
  nx.style.opacity = n < text.length ? frac : 1;
  el.querySelector('.rest').textContent = text.slice(n + 1);
  el.style.opacity = t >= a.t ? 1 : 0;
}

function paintTurn1(t) {
  rise($('#u1'), t, TURNS[0].send + 0.02, 4, 0.2);
  // who header under the pill
  const n1 = $('#n1');
  rise(n1, t, WHO1, 8, 0.42);
  n1.querySelector('.rail').style.height = '28px';
  // generating placeholder, then the meme in the same box; the answer line opens above it
  const g = $('#g1');
  const open = E.std(prog(t, OPEN1, 0.5));
  const shift = -GEN_SHIFT * (1 - open);
  const r = tw(t, GEN1, 0.42);
  css(g, { opacity: t < GEN1 ? 0 : r, transform: `translateY(${shift + (1 - r) * 10}px)` });
  const sweep = ((Math.max(0, t - GEN1)) % 1.4) / 1.4;
  g.querySelector('.band-sweep').style.left = `${-180 + sweep * 540}px`;
  const img = tw(t, IMG1, 0.32, E.std);
  g.querySelector('.meme').style.opacity = img;
  g.querySelector('.chip').style.opacity = 1 - tw(t, IMG1, 0.18, E.std);
  g.querySelector('.band-sweep').style.opacity = 1 - img;
  const pv = $('#pv1');
  css(pv, { opacity: tw(t, PROV1, 0.3, E.std), transform: `translateY(${shift}px)` });
}

function paintTurn2(t) {
  rise($('#u2'), t, TURNS[1].send + 0.02, 4, 0.2);
  paintSteps('#n2', t);
  // page-shot deck: rises, then the cards fan out on a spring
  const sh = $('#sh2');
  rise(sh, t, DECK2, 8, 0.42);
  const f = springP(t, DECK2 + 0.06, 210, 20);
  for (const c of $$('#sh2 .deck-card')) {
    const d = +c.dataset.depth;
    c.style.transform = d === 0 ? `rotate(${-4 * f}deg)` : d === 1 ? `translateX(${12 * f}px)` : `translateX(${24 * f}px) rotate(${4 * f}deg)`;
  }
  $$('#lk2 .lcard').forEach((c, i) => {
    const t0 = LINKS2 + i * 0.07;
    const p = tw(t, t0, 0.5);
    css(c, { opacity: t < t0 ? 0 : p, transform: `translateY(${(1 - p) * 14}px) scale(${lerp(0.97, 1, p)})` });
  });
  $('#o2').style.opacity = tw(t, OUT2, 0.3, E.std);
}

function paintTurn3(t) {
  rise($('#u3'), t, TURNS[2].send + 0.02, 4, 0.2);
  paintSteps('#n3', t);
  const sh = $('#sh3');
  const p = rise(sh, t, WIN3, 8, 0.42);
  const press = 1 - 0.035 * Math.sin(Math.PI * prog(t, CLICK1 - 0.04, 0.16));
  $('#win3').style.transform = `scale(${lerp(0.96, 1, p) * press})`;
  $('#o3').style.opacity = tw(t, OUT3, 0.3, E.std);
}

function paintPeek(t) {
  const open = tw(t, PEEK_OPEN, 0.26, E.emph);
  const close = tw(t, PEEK_CLOSE, 0.16, E.acc);
  const o = t < PEEK_OPEN ? 0 : open * (1 - close);
  $('#scrim').style.opacity = o;
  const peek = $('#peek');
  css(peek, { left: '222px', top: '83px', width: '709px', opacity: o, transform: `scale(${t < PEEK_CLOSE ? lerp(0.96, 1, open) : lerp(1, 0.98, close)})`, visibility: o > 0.001 ? 'visible' : 'hidden' });
  css($('#pstage'), { width: '691px', height: '432px' });
  // the Close chip acknowledges the click
  const chip = peek.querySelector('.close');
  const press = Math.sin(Math.PI * prog(t, CLICK2 - 0.04, 0.16));
  css(chip, { background: `rgba(230,232,238,${0.1 * press})`, transform: `scale(${1 - 0.05 * press})` });
}

function paintCursor(t) {
  const c = $('#cursor');
  const x = track(t, M.curKeys.x, 320, 30);
  const y = track(t, M.curKeys.y, 320, 30);
  const o = Math.min(tw(t, CUR_IN - 0.05, 0.25, E.std), 1 - tw(t, CUR_OUT, 0.3, E.std));
  let press = 1;
  for (const k of [CLICK1, CLICK2]) press = Math.min(press, 1 - 0.12 * Math.sin(Math.PI * prog(t, k - 0.04, 0.16)));
  css(c, { opacity: o, transform: `translate(${x}px, ${y}px) scale(${press})` });
}

function paintEnd(t) {
  const end = $('#end');
  end.style.opacity = tw(t, OUTRO + 0.05, 0.3, E.std);
  end.style.visibility = t >= OUTRO ? 'visible' : 'hidden';
  // a slow push across the whole hold
  end.style.transform = `scale(${lerp(1.0, 1.035, E.inOut(prog(t, OUTRO, DUR - OUTRO)))})`;
  const mk = end.querySelector('.mark');
  const m = springP(t, OUTRO + 0.14, 90, 20);
  css(mk, { opacity: tw(t, OUTRO + 0.14, 0.4, E.std), transform: `translateY(${(1 - m) * 26}px) scale(${lerp(0.74, 1, m)})` });
  $$('#end h1 span').forEach((w, i) => {
    const t0 = OUTRO + 0.34 + i * 0.08;
    const s = springP(t, t0, 90, 20);
    css(w, { opacity: tw(t, t0, 0.42, E.std), transform: `translateY(${(1 - s) * 34}px)` });
  });
  $$('#end .rp').forEach((pill, i) => {
    const t0 = OUTRO + 0.92 + i * 0.13;
    const s = springP(t, t0, 170, 26);
    css(pill, { opacity: tw(t, t0, 0.36, E.std), transform: `translateY(${(1 - s) * 20}px)` });
    const tile = pill.querySelector('img');
    const tp = tw(t, t0 + 0.05, 0.4, E.outBack);
    tile.style.transform = `scale(${lerp(0.5, 1, tp)}) rotate(${lerp(-25, 0, tp)}deg)`;
    const ck = pill.querySelector('.ck');
    const cp = tw(t, t0 + 0.32, 0.3, E.outBack);
    css(ck, { opacity: t < t0 + 0.32 ? 0 : 1, transform: `scale(${lerp(0.3, 1, cp)})` });
  });
}

function paint(t) {
  t = Math.max(0, Math.min(DUR, t));
  paintCamera(t);
  paintHeader(t);
  paintSidebar(t);
  paintHeroAndComposer(t);
  for (const p of PILLS) paintPill(p, t);
  paintTurn1(t);
  paintTurn2(t);
  paintTurn3(t);
  for (const a of ANSWERS) paintAnswer(a, t);
  $('#feed').style.transform = `translateY(${-M.scrollAt(t)}px)`;
  paintPeek(t);
  paintCursor(t);
  paintEnd(t);
}

window.__AD = { DUR, CYCLE: DUR, ready: false };
window.seek = async (t) => {
  if (!ready) ready = init();
  await ready;
  paint(t);
};
ready = init().then(() => { window.__AD.ready = true; window.__AD.seek = (t) => paint(t); });

if (!window.__RENDER__) {
  // preview (gallery iframe, any size): letterbox the 1920x1080 stage into the window
  const fit = () => {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    css(document.documentElement, { width: '100%', height: '100%' });
    css(document.body, { width: '100%', height: '100%' });
    css($('#stage'), { transformOrigin: '0 0', transform: `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})` });
  };
  fit();
  addEventListener('resize', fit);
  ready.then(() => {
    const q = new URLSearchParams(location.search);
    if (q.has('t')) { paint(+q.get('t')); return; }
    const t0 = performance.now();
    const loop = () => { paint(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });
}
