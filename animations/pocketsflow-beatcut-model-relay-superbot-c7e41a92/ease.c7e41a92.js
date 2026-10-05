// Closed-form tween helpers. Every value is a pure function of t (seconds).
// Bezier curves are the Superbot motion tokens: out-cubic [.33,1,.68,1], out-back [.34,1.56,.64,1],
// standard [.2,0,0,1]; in-out is the camera/scroll curve.

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
      const err = sx(u) - x;
      const d = dx(u);
      if (Math.abs(err) < 1e-6 || Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    let lo = 0, hi = 1;
    if (Math.abs(sx(u) - x) > 1e-5) {
      u = x;
      for (let i = 0; i < 30; i++) {
        if (sx(u) < x) lo = u; else hi = u;
        u = (lo + hi) / 2;
      }
    }
    return sy(u);
  };
}

export const EASE = {
  outCubic: bezier(0.33, 1, 0.68, 1),
  outBack: bezier(0.34, 1.56, 0.64, 1),
  standard: bezier(0.2, 0, 0, 1),
  inOut: bezier(0.65, 0, 0.35, 1),
  outQuint: bezier(0.22, 1, 0.36, 1),
  linear: (x) => Math.min(1, Math.max(0, x)),
};

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, k) => a + (b - a) * k;

/** Progress of a tween that starts at `start` and lasts `dur` seconds, eased. */
export function prog(t, start, dur, ease = EASE.outCubic) {
  return ease(clamp01((t - start) / dur));
}

/** A value that eases between keyframes [[time, value, durToNext?, ease?], ...] (holds outside). */
export function keys(t, frames, ease = EASE.inOut) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 0; i < frames.length - 1; i++) {
    const [t0, v0] = frames[i];
    const [t1, v1] = frames[i + 1];
    if (t < t1) return lerp(v0, v1, ease(clamp01((t - t0) / (t1 - t0))));
  }
  return frames[frames.length - 1][1];
}

/** 0→1 fade in at tIn, 1→0 fade out at tOut, each over `d` seconds (no overshoot). */
export function window01(t, tIn, tOut = Infinity, d = 0.25) {
  return Math.min(prog(t, tIn, d, EASE.standard), 1 - prog(t, tOut, d, EASE.standard));
}

/** Rotation in degrees for a 1 rev/s spinner (Lucide LoaderCircle, `animate-spin`). */
export const spinDeg = (t) => ((t % 1) + 1) % 1 * 360;
