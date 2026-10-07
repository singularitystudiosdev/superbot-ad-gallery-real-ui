// lib.2459e0e7.js: the spot's maths. Every scene renders as a pure function of its local time, so everything here
// is a pure function too: no clocks, no state.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, f) => a + (b - a) * f;
/** 0 before a, 1 after b, linear between. */
export const seg = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));

export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const outQuint = (x) => 1 - Math.pow(1 - x, 5);
export const inOutQuint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
export const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const inOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
/** Perlin's smootherstep: zero velocity AND zero acceleration at both ends. */
export const smoother = (x) => { const u = clamp(x); return u * u * u * (u * (u * 6 - 15) + 10); };

/** CSS cubic-bezier(x1, y1, x2, y2) as a function of progress, solved by Newton steps on x. */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 10; i++) {
      const e = sx(u) - x;
      if (Math.abs(e) < 1e-7) break;
      const d = dx(u);
      if (Math.abs(d) < 1e-7) break;
      u = clamp(u - e / d);
    }
    return sy(u);
  };
}
// superbot's own motion tokens (packages/tokens/tokens/motion.tokens.json): ease.standard for moves inside the app,
// ease.emphasized-decelerate for entrances, ease.think-open for the larger camera-scale moves
export const easeStandard = cubicBezier(0.2, 0, 0, 1);
export const easeDecel = cubicBezier(0.05, 0.7, 0.1, 1);
export const easeThinkOpen = cubicBezier(0.22, 1, 0.36, 1);

/** Critically damped spring step response (no overshoot), settled to ~99.5% at t = settle. */
export function spring(t, settle = 0.6) {
  if (t <= 0) return 0;
  const w = 7.4 / settle;
  return 1 - (1 + w * t) * Math.exp(-w * t);
}

/** A value that eases from one keyed target to the next: keys [{t, v}] sorted by t, each move taking `dur` with
    `ease`. Continuous in value; a new key starts from wherever the previous move had got to, so a key that lands
    mid-move never jumps. */
export function track(keys, t, dur = 0.8, ease = inOutCubic) {
  let v = keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t < k.t) break;
    const d = k.dur ?? dur;
    const f = (k.ease ?? ease)(seg(t, k.t, k.t + d));
    v = Array.isArray(v) ? v.map((x, j) => lerp(x, k.v[j], f)) : lerp(v, k.v, f);
  }
  return v;
}

export const hash01 = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const op = (el, v) => { if (el) el.style.opacity = v >= 0.999 ? '' : Math.max(0, v).toFixed(3); };

// ---------- video: one clock for playback and for frame-exact export ----------
const pending = new Map();
/** Drive a <video> to `want` seconds. Playing (the gallery's live loop): let it run, re-seek only on drift. Frozen
    (export, ?t=, seek()): pause and land on the exact frame; settleVideos() waits for every such seek. */
export function driveVideo(v, want, playing) {
  if (!v) return;
  const len = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : Infinity;
  const w = clamp(want, 0, len - 0.02);
  if (playing) {
    if (v.paused) v.play().catch((e) => console.warn('video play', v.currentSrc, e.message));
    if (Math.abs(v.currentTime - w) > 0.25) v.currentTime = w;
    return;
  }
  if (!v.paused) v.pause();
  if (v.readyState >= 1 && Math.abs(v.currentTime - w) > 1 / 240) v.currentTime = w;
  if (v.readyState < 2 || v.seeking || Math.abs(v.currentTime - w) > 1 / 240) pending.set(v, w);
}
const once = (v, ev, ms) => new Promise((resolve) => {
  const timer = setTimeout(() => { v.removeEventListener(ev, done); resolve(false); }, ms);
  function done() { clearTimeout(timer); resolve(true); }
  v.addEventListener(ev, done, { once: true });
});
/** Resolve once every video driven since the last settle shows the frame it was asked for. A seek set before the
    clip had loaded is re-applied once its metadata is in (Chromium drops it otherwise). */
export async function settleVideos(timeoutMs = 6000) {
  const list = [...pending];
  pending.clear();
  await Promise.all(list.map(async ([v, want]) => {
    if (!v.isConnected) return;
    if (v.readyState < 1) { if (v.networkState === 3) v.load(); await once(v, 'loadedmetadata', timeoutMs); }
    const len = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : Infinity;
    const w = clamp(want, 0, len - 0.02);
    if (Math.abs(v.currentTime - w) > 1 / 240) { const s = once(v, 'seeked', timeoutMs); v.currentTime = w; await s; }
    else if (v.seeking) await once(v, 'seeked', timeoutMs);
    if (v.readyState < 2) await once(v, 'loadeddata', timeoutMs);
    if (v.requestVideoFrameCallback) await Promise.race([new Promise((r) => v.requestVideoFrameCallback(() => r())), new Promise((r) => setTimeout(r, 250))]);
    if (Math.abs(v.currentTime - w) > 0.02) console.warn('video settle off', v.currentSrc, v.currentTime, w);
  }));
}
