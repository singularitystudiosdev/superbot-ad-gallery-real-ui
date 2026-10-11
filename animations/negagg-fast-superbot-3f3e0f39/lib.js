// lib.js: the shared, pure helpers every scene uses. No state, no clock: everything is a function of t.
// Easings and op/esc are the exact ones from ../waffles-website-superbot-87a583a1/timeline.js.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, f) => a + (b - a) * f;
/** progress of t through [a, b], clamped to 0..1 */
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const outQuint = (x) => 1 - Math.pow(1 - x, 5);
export const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const outBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
/** set an element's opacity, clamped, 3 decimals */
export const op = (el, v) => { el.style.opacity = clamp(v).toFixed(3); };
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** fade in over [a, a+din] and out over [b-dout, b]: 0..1 */
export const window01 = (t, a, b, din = 0.3, dout = 0.3) => seg(t, a, a + din) * (1 - seg(t, b - dout, b));

/** number of characters of text visible at t when streaming starts at t0 at cps chars/second */
export const streamCount = (text, t0, cps, t) => clamp(Math.floor((t - t0) * cps + 1e-6), 0, text.length);
/** the visible prefix of text at t (streamed replies, ~100-150 cps) */
export const stream = (text, t0, cps, t) => text.slice(0, streamCount(text, t0, cps, t));
/** time the last character of text lands when typed from t0 at cps */
export const typeEnd = (text, t0, cps) => t0 + Math.max(0, text.length - 1) / cps;
/** typed prompt state at t (steady 60 cps like waffles-website: char i lands at t0 + i/cps).
    -> { text, n, done, typing } ; typing = true while characters are still landing */
export function typed(text, t0, cps, t) {
  const n = t < t0 ? 0 : clamp(Math.floor((t - t0) * cps + 1e-6) + 1, 0, text.length);
  return { text: text.slice(0, n), n, done: n >= text.length, typing: n > 0 && n < text.length };
}

/** caret markup (a 2px bar). on=false renders nothing. Solid while typing; blink(t) for idle carets. */
export const caret = (on = true, cls = 'lb-caret') => (on ? `<i class="${cls}"></i>` : '');
/** deterministic caret blink from t: visible for the first half of each 1.06s period */
export const blink = (t, period = 1.06) => ((t % period + period) % period) < period / 2;

/** a cursor press: 0 before, dips to 1 around `at` over ~0.2s (0.06s down, hold, 0.14s up), 0 after */
export const press = (t, at, down = 0.06, hold = 0.06, up = 0.14) =>
  seg(t, at - down, at) * (1 - seg(t, at + hold, at + hold + up));
/** scale factor for a pressed button: 1 -> 1-depth at the bottom of the press */
export const pressScale = (t, at, depth = 0.05) => 1 - depth * press(t, at);

/** ease a point along a path of keyframes [{t, x, y}] with inOutCubic between neighbours */
export function path(t, keys) {
  if (t <= keys[0].t) return { x: keys[0].x, y: keys[0].y };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) { const f = inOutCubic(seg(t, a.t, b.t)); return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) }; }
  }
  const z = keys[keys.length - 1]; return { x: z.x, y: z.y };
}

/** place a makeCursor() svg so its TIP sits at (x, y) in the parent's px, with the press dip applied.
    p = press amount 0..1 (use press()), v = opacity 0..1 */
export function placeCursor(el, x, y, p = 0, v = 1) {
  el.style.opacity = clamp(v).toFixed(3);
  el.style.transform = `translate(${(x - 17).toFixed(1)}px, ${(y - 11).toFixed(1)}px) scale(${(1 - 0.12 * p).toFixed(3)})`;
}

/** the element's box in the coordinates of `root` (layout px, ignores transforms on root itself) */
export function boxIn(el, root) {
  const a = el.getBoundingClientRect(), b = root.getBoundingClientRect();
  const sx = b.width / (root.offsetWidth || b.width) || 1, sy = b.height / (root.offsetHeight || b.height) || 1;
  return { x: (a.left - b.left) / sx, y: (a.top - b.top) / sy, w: a.width / sx, h: a.height / sy,
    cx: (a.left - b.left + a.width / 2) / sx, cy: (a.top - b.top + a.height / 2) / sy };
}

/** deterministic pseudo-random in [0,1) from an integer seed (for jitter that must not change per frame) */
export const rand = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
