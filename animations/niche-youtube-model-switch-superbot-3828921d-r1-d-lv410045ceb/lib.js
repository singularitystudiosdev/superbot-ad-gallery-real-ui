// Pure helpers. Everything in this spot is a function of t: no state, no transitions, nothing reads the clock.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, f) => a + (b - a) * f;
/** progress of t through [a, b], clamped to 0..1 */
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const outQuint = (x) => 1 - Math.pow(1 - x, 5);
export const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** set an element's opacity, clamped, 3 decimals (never leaves a transition to do it) */
export const op = (el, v) => { el.style.opacity = clamp(v).toFixed(3); };
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** number of characters of text visible at t when streaming starts at t0 at cps chars/second */
export const streamCount = (text, t0, cps, t) => clamp(Math.floor((t - t0) * cps + 1e-6), 0, text.length);
/** a pointer press: 0 outside, 1 at the bottom of the press */
export const press = (t, at, down = 0.06, hold = 0.06, up = 0.14) =>
  seg(t, at - down, at) * (1 - seg(t, at + hold, at + hold + up));
/** deterministic pseudo-random in [0,1) from an integer seed: jitter that never changes frame to frame */
export const rand = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** a block that starts hidden and rises into place over `din` at a: opacity + translateY */
export function enter(n, t, a, din = 0.22, dy = 8) {
  const p = outCubic(seg(t, a, a + din));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
  return p;
}
/** the classic spinner: a ring with one bright arc, turning while spinning */
export function spinner(n, t, on) {
  n.style.opacity = on ? '1' : '0';
  n.style.transform = `rotate(${(t * 380 % 360).toFixed(1)}deg)`;
}
export const ICON_SVG = (body, cls = '', vb = '0 0 24 24') =>
  `<svg class="${cls}" viewBox="${vb}" aria-hidden="true">${body}</svg>`;
export const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };