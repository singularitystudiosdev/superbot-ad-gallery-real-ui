// Pure timing helpers shared by the scenes. Every visual is a function of t, so these never read a clock.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, f) => a + (b - a) * f;
/** 0..1 progress of t through [a, b]. */
export const seg = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));

export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const outQuint = (x) => 1 - Math.pow(1 - x, 5);
export const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const inOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
/** Settles past 1 and back, for things that land (a like, the end mark). */
export const outBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
/** C2-continuous step: zero velocity AND acceleration at both ends (no jolt where two moves meet). */
export const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10);
/** The "expressive decelerate" most UI motion systems ship for entrances (cubic-bezier(0.16, 1, 0.3, 1)). */
export const outSoft = (x) => cubicBezier(0.16, 1, 0.3, 1)(x);

/** CSS cubic-bezier as a function of x (Newton-Raphson on the x curve, then y). */
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
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x;
      if (Math.abs(e) < 1e-6) break;
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    return sy(clamp(u));
  };
}

/** Opacity with visibility, so a fully faded layer costs no paint. */
export function op(el, v) {
  const o = clamp(v);
  el.style.opacity = o.toFixed(4);
  el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
}

/** Deterministic 0..1 noise for index i (typing cadence, jitter). */
export const hash01 = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
