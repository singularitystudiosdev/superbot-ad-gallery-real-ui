/* stage.js — the 3D phone stage for "every model, one chat".
   A CSS-3D device (plate side wall, titanium conic rim, glass sheen, contact shadow) holds the LIVE
   source spot in an iframe. The source exposes window.__AD = { ready, CYCLE, seek(t) } and is driven
   frame by frame from this page's clock, so ?t=<s> reproduces a frame exactly.
   TWO source iframes sit in the screen: #src runs the chat at the screen's own aspect (fills edge to
   edge), #src-end runs the end card at its own design width and is cross-faded in at the source's own
   chat -> end segment boundary. Both are seek()ed from the one clock below.

   Exposed to the capture tool:
     window.__AD    = { CYCLE, ready, seek(t) }         the stage's own timeline
     window.__PHONE = { screenRect(), tilt(), t }       the screen plate in stage px, the camera tilt
     window.__STAGE = { srcwA, srcwB, boundary(), mix(), ready() }   both source widths and the swap */
'use strict';

const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;

const LEAD = 4.3;     // black lead-in: entrance + icon slam, before the source spot takes the screen
const TAIL = 1.2;     // hold after the source spot finishes
const FADE = 0.4;     // the last 0.4s of the stage fade to black
const FALLBACK_AD_CYCLE = 21.24;
const CONNECT_DEADLINE = 15000;

const q = new URLSearchParams(location.search);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, f) => a + (b - a) * f;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const smooth = (x) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const px = (v) => (+v).toFixed(2);
const deg = (v) => (+v).toFixed(3);

// ---------- dom ----------
const stage = document.getElementById('stage');
const rig3d = document.getElementById('rig3d');
const phone = document.getElementById('phone');
const screenEl = phone.querySelector('.screen');
const sheen = phone.querySelector('.sheen');
const contact = document.getElementById('contact');
const glow = document.getElementById('glow');
const iconsLayer = document.getElementById('icons');
const iframe = document.getElementById('src');
const iframeEnd = document.getElementById('src-end');
const screenOff = document.getElementById('screen-off');
const screenFlash = document.getElementById('screen-flash');
const fade = document.getElementById('fade');

// ---------- the stage fit (the exact contract of the source ad's timeline.js fit()) ----------
function fit() {
  const w = W();
  stage.style.width = w + 'px';
  const k = Math.min(innerWidth / w, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}

// ---------- the camera path, in ad seconds ----------
const ORBIT_W = (2 * Math.PI) / 16;
const ORBIT_FROM = 3, ORBIT_TO = 19, ORBIT_BLEND = 0.8;
const SETTLE = { rx: 3.4, ry: -10, rz: 0, ty: 0 };

function orbitPose(u) {
  return {
    ry: -10 + 22 * Math.sin(ORBIT_W * u),
    rx: 3.4 + 4.5 * Math.sin(ORBIT_W * u + 1.1),
    rz: 1.6 * Math.sin(0.7 * ORBIT_W * u),
    ty: -8 * Math.cos(0.9 * ORBIT_W * u),
  };
}
const ORBIT_END = orbitPose(ORBIT_TO - ORBIT_FROM);

function camera(t) {
  if (t < 1) {
    // entrance
    const p = outCubic(clamp(t));
    return { ty: lerp(150, 0, p), s: lerp(0.84, 1, p), rx: lerp(26, 6, p), ry: lerp(-34, -15, p), rz: 0 };
  }
  if (t < ORBIT_FROM) {
    // settle onto the orbit's start pose
    const p = smooth((t - 1) / (ORBIT_FROM - 1));
    return { ty: 0, s: 1, rx: lerp(6, SETTLE.rx, p), ry: lerp(-15, SETTLE.ry, p), rz: 0 };
  }
  if (t < ORBIT_TO) {
    // the continuous orbit. The brief's rx/ty formulas start a few degrees/px away from the settle pose,
    // so the first 0.8s cross-fades the settle pose into the orbit instead of popping at t=3.
    const o = orbitPose(t - ORBIT_FROM);
    const p = smooth((t - ORBIT_FROM) / ORBIT_BLEND);
    return { ty: lerp(0, o.ty, p), rx: lerp(SETTLE.rx, o.rx, p), ry: o.ry, rz: lerp(0, o.rz, p), s: 1 };
  }
  // straighten out and settle, then the last FADE seconds go to black
  const p = smooth(seg(t, ORBIT_TO, CYCLE - FADE));
  return {
    ty: lerp(ORBIT_END.ty, 0, p),
    rx: lerp(ORBIT_END.rx, 1.0, p),
    ry: lerp(ORBIT_END.ry, 1.5, p),
    rz: lerp(ORBIT_END.rz, 0, p),
    s: lerp(1, 1.03, p),
  };
}

// ---------- the source spots ----------
// The design width handed to the source. Its fit() scales the 1080-tall canvas by
// min(iframeW / AR.w, iframeH / 1080), so the chat iframe is driven at the SCREEN'S OWN ASPECT
// (srcw = screenW * 1080 / screenH, ~483 on the shipped device) and its canvas covers the screen box
// exactly - edge to edge, no black bands above and below the chat.
// The end card is the one beat that cannot ride that width: its .lock (the 96px nowrap headline plus the
// 220px superbot mark, in a row) measures 906.7 design px, so at 483 the mascot overflows the screen's
// right edge by 76% of itself. Re-pushing the width mid-run perturbs the source's own end segment, so a
// SECOND iframe - #src-end, laid out at END_W = the lock's own width, where the whole lock lands inside
// the screen (0 -> 353, edge to edge) - is parked on the end card and cross-faded in at the source's own
// chat -> end boundary. ?srcw= / ?endw= override either width.
const screenAspectWidth = () => {
  const sw = screenEl.clientWidth || 353;
  const sh = screenEl.clientHeight || 790;
  return Math.max(1, Math.round((sw * H) / sh));
};
const SRC_W = +(q.get('srcw') || 0) || screenAspectWidth();
const END_W = +(q.get('endw') || 0) || 907; // the end card's .lock measures 906.7 design px wide
const SWAP = 0.25; // the cross-fade at the boundary, seconds
const source = { win: null, cycle: FALLBACK_AD_CYCLE, ready: false, pushedW: 0 };
const endCard = { win: null, cycle: FALLBACK_AD_CYCLE, ready: false, pushedW: 0, parked: false };
// the source's own segment table decides when the chat gives way to the end card - never a hardcoded
// time. boundary = the chat scene's t1 (=== the end segment's t0). If the source ever stops publishing
// segments the stage keeps driving the chat iframe alone (its end card is clipped - the pre-fix look)
// rather than guessing a time.
let boundary = Infinity;
function readBoundary() {
  const segs = source.win && source.win.__AD && source.win.__AD.segments;
  if (!Array.isArray(segs)) {
    console.warn('[stage] source __AD.segments missing — the end card stays on the chat iframe');
    return Infinity;
  }
  const chat = segs.find((s) => s && s.kind === 'scene');
  const end = segs.find((s) => s && s.kind === 'end');
  const b = chat && chat.t1 > 0 ? +chat.t1 : end && end.t0 > 0 ? +end.t0 : NaN;
  if (!(b > 0)) {
    console.warn('[stage] source published no usable scene boundary — the end card stays on the chat iframe');
    return Infinity;
  }
  return b;
}
let CYCLE = +(LEAD + FALLBACK_AD_CYCLE + TAIL).toFixed(4);

const powerOn = () => (window.__ICONS_FLASH && +window.__ICONS_FLASH.t) || 3.10;

// mirror what assets/ar.js apply() does, but with our design width: the source's layout widths come from
// :root --ar-w, its timeline's W() from window.AR.w, so both have to move together or the ad lays out at
// one width and is scaled at another.
function pushAr(w, width) {
  const ar = w.AR;
  if (!ar) return false;
  try {
    ar.w = width;
    ar.crop = (1920 - width) / 2;
    const root = w.document.documentElement;
    root.style.setProperty('--ar-w', width + 'px');
    root.style.setProperty('--ar-crop', ar.crop + 'px');
    w.dispatchEvent(new w.CustomEvent('archange', { detail: ar }));
    source.pushedW = width;
    return true;
  } catch (e) {
    console.error('[stage] could not push the design width into the source ad', e);
    return false;
  }
}


const END_READY_DEADLINE = 8000; // how long the end-card iframe may take before the stage boots without it

function finalize(w, we) {
  source.win = w || null;
  const live = !!(w && w.__AD && w.__AD.ready);
  source.ready = live;
  source.cycle = live ? (+w.__AD.CYCLE || FALLBACK_AD_CYCLE) : FALLBACK_AD_CYCLE;
  endCard.win = we || null;
  endCard.ready = !!(we && we.__AD && we.__AD.ready);
  endCard.cycle = endCard.ready ? (+we.__AD.CYCLE || FALLBACK_AD_CYCLE) : FALLBACK_AD_CYCLE;
  // the stage's cycle is the CHAT ad's (the brief's CYCLE = LEAD + iframe A CYCLE + TAIL): the end-card
  // iframe is the same spot at another width, so its cycle is the same number and must not drive layout.
  CYCLE = +(LEAD + source.cycle + TAIL).toFixed(4);
  window.__AD.CYCLE = CYCLE;
  if (live) pushAr(w, SRC_W);
  if (endCard.ready) pushAr(we, END_W);
  boundary = live ? readBoundary() : Infinity;
  endCard.parked = false;
  render(isNaN(lastT) ? 0 : lastT);
  window.__AD.ready = true;
  if (live) console.info('[stage] source ready · source cycle ' + source.cycle + 's · stage cycle ' + CYCLE + 's · chat srcw ' + SRC_W + ' · end srcw ' + END_W + ' · boundary ' + boundary);
  if (!endCard.ready && endCard.win) console.warn('[stage] end-card iframe not ready — the end card stays on the chat iframe (clipped)');
}

let connectStart = 0;
function connect() {
  let w = null, we = null;
  try { w = iframe.contentWindow; } catch (e) { console.error('[stage] source iframe window unavailable', e); }
  try { we = iframeEnd.contentWindow; } catch (e) { console.error('[stage] end-card iframe window unavailable', e); }
  if (w && w.AR && !source.pushedW) pushAr(w, SRC_W);
  if (we && we.AR && !endCard.pushedW) pushAr(we, END_W);
  const waited = performance.now() - connectStart;
  const aReady = !!(w && w.__AD && w.__AD.ready);
  const bReady = !!(we && we.__AD && we.__AD.ready);
  // hold the stage's ready until BOTH spots have a document (a frame captured at the end card must not
  // race the end-card iframe's load), but never past END_READY_DEADLINE: the chat spot alone still plays.
  if (aReady && (bReady || waited > END_READY_DEADLINE)) { finalize(w, we); return; }
  if (waited > CONNECT_DEADLINE) {
    console.error('[stage] source ad never reported __AD.ready (waited ' + (CONNECT_DEADLINE / 1000) + 's) — continuing with the fallback cycle');
    finalize(w, we);
    return;
  }
  setTimeout(connect, 60);
}

// ---------- render ----------
let T = 0;
let lastT = NaN;
const tilt = { rx: 0, ry: 0 };
let swapMix = 0;

// ---------- the two source spots ----------
function seekSpot(s, st) {
  if (!s.ready || !s.win || !s.win.__AD || typeof s.win.__AD.seek !== 'function') return;
  try { s.win.__AD.seek(st); } catch (e) { console.error('[stage] source seek failed at t=' + st, e); }
}

// st = the source ad's own time (0 at ?t=0 / the power-on instant). Everything here is a pure function of
// st, so a capture can seek any frame in any order and get the same pixels.
function drive(st) {
  // the chat iframe rides the whole spot at the screen's own aspect; past the boundary it renders its own
  // end card too, but it is what the cross-fade fades out of.
  seekSpot(source, st);
  // the end-card iframe is parked on its first end-card frame until the boundary (one seek, then it holds
  // that frame on its own), and driven in lock step with the chat from the boundary on.
  if (endCard.ready && st >= boundary) {
    endCard.parked = false;
    seekSpot(endCard, st);
  } else if (endCard.ready && !endCard.parked) {
    endCard.parked = true;
    seekSpot(endCard, Number.isFinite(boundary) ? boundary : 0);
  }
  // the cross-fade: the chat spot fades out and the end-card spot fades in over SWAP seconds from the
  // boundary. Both are inside the end card's black-to-reveal phase, so the overlap reads as a soft one.
  swapMix = Number.isFinite(boundary) && endCard.ready ? clamp((st - boundary) / SWAP) : 0;
  iframe.style.opacity = (1 - swapMix).toFixed(3);
  iframeEnd.style.opacity = swapMix.toFixed(3);
  iframeEnd.style.visibility = swapMix > 0 ? 'visible' : 'hidden';
}

function render(t) {
  T = t;
  const c = camera(t);
  tilt.rx = c.rx;
  tilt.ry = c.ry;

  rig3d.style.transform =
    `translate3d(0px, ${px(c.ty)}px, 0px) rotateX(${deg(c.rx)}deg) rotateY(${deg(c.ry)}deg) rotateZ(${deg(c.rz)}deg) scale(${c.s.toFixed(4)})`;

  // the sheen slides across the glass as the device turns
  sheen.style.backgroundPosition = `${(50 - c.ry * 1.15).toFixed(1)}% ${(50 + c.rx * 1.35).toFixed(1)}%`;

  // the contact shadow stays on the floor: it takes the opposite displacement of the tilt
  contact.style.transform =
    `translate3d(${px(-c.ry * 2.0)}px, ${px(c.rx * 1.5)}px, -30px) scale(${(1 + Math.abs(c.ry) / 140).toFixed(4)}, ${(1 + Math.abs(c.rx) / 260).toFixed(4)})`;

  const gs = 1 + 0.05 * Math.sin(t * 0.5);
  glow.style.transform = `translate3d(${px(-c.ry * 3)}px, ${px(c.rx * 2)}px, 0px) scale(${gs.toFixed(4)})`;
  glow.style.opacity = (0.7 + 0.3 * Math.sin(t * 0.35 + 1)).toFixed(3);

  // the screen is pure black until the power-on moment, then the source spot drives it
  const on = powerOn();
  screenOff.style.opacity = (1 - seg(t, on, on + 0.26)).toFixed(3);
  screenFlash.style.opacity = (Math.sin(Math.PI * seg(t, on, on + 0.55)) * 0.55).toFixed(3);

  drive(Math.max(0, Math.min(source.cycle, t - on)));

  if (icons.render) {
    try { icons.render(t); } catch (e) { console.error('[stage] icons render failed at t=' + t, e); }
  }

  fade.style.opacity = seg(t, CYCLE - FADE, CYCLE).toFixed(3);
}

// ---------- the clock (the same model as the source ad's timeline.js) ----------
const hasT = q.has('t');
let paused = hasT;
let offset = hasT ? (parseFloat(q.get('t')) || 0) : 0;
let t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);

function loop() {
  let t = clockNow();
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  if (t >= CYCLE) t = 0;
  if (!paused || t !== lastT) { render(t); lastT = t; }
  requestAnimationFrame(loop);
}

window.__AD = {
  CYCLE,
  ready: false,
  seek(t) {
    paused = true;
    offset = t;
    const c = ((t % CYCLE) + CYCLE) % CYCLE;
    render(c);
    lastT = c;
  },
};

window.__PHONE = {
  screenRect() {
    const r = screenEl.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const k = (s.width / W()) || 1;
    return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k };
  },
  tilt() { return { rx: tilt.rx, ry: tilt.ry }; },
  get t() { return T; },
};

// read-only diagnostics for the capture tool: the two source widths, the boundary the swap reads live
// from the source, the current cross-fade mix, and which spots reported ready.
window.__STAGE = {
  srcwA: SRC_W,
  srcwB: END_W,
  boundary: () => boundary,
  mix: () => swapMix,
  ready: () => ({ chat: source.ready, end: endCard.ready }),
};

// ---------- the icon layer (item #3's icons.js; the stage must run with or without it) ----------
const icons = { render: null, mod: null };

import('./icons.js').then((m) => {
  const mod = m && (m.default || m);
  if (!mod || typeof mod.mount !== 'function' || typeof mod.render !== 'function') {
    console.error('[stage] icons.js exports no mount()/render() — running without the icon layer');
    return;
  }
  try {
    mod.mount(iconsLayer, { W: W(), H: H });
    icons.mod = mod;
    icons.render = (t) => mod.render(t);
    console.info('[stage] icons mounted · TOTAL ' + mod.TOTAL + 's · merge on at ' + mod.MERGE_ON_AT + 's');
  } catch (e) {
    console.error('[stage] icons.mount() failed', e);
  }
}).catch((e) => {
  console.error('[stage] icons.js not available (' + (e && e.message) + ') — running without the icon layer');
});

// ---------- controls (same keys as the source ad) ----------
addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    e.preventDefault();
    if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; }
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25));
    paused = true;
  } else if (e.key === 'r' || e.key === 'R') {
    offset = 0; t0 = performance.now(); paused = false;
  }
});

// ---------- boot ----------
addEventListener('resize', fit);
addEventListener('archange', () => {
  fit();
  if (source.win) pushAr(source.win, source.pushedW || SRC_W);
  if (endCard.win) pushAr(endCard.win, endCard.pushedW || END_W);
});
fit();

connectStart = performance.now();
connect();
render(((offset % CYCLE) + CYCLE) % CYCLE);
requestAnimationFrame(loop);