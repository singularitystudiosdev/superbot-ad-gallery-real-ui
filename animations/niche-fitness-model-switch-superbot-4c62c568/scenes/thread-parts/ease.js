// Easing for the thread scene, all pure functions of a 0..1 progress (or of t, for the springs).
// Curves are the design-token ones: superbot's own switch motion (out-cubic, out-back, standard) and the M3
// entrance/exit pair for windows (emphasized-decelerate in, standard-accelerate out).
import { clamp, seg, lerp } from '../../lib.js';
import { track } from '../../spring.js';

/** cubic-bezier(x1, y1, x2, y2) as a function of x in 0..1 (Newton on x, then bisection fallback) */
export function bezier(x1, y1, x2, y2) {
  const bx = (u) => 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u * u * (1 - u) + u * u * u;
  const by = (u) => 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u * u * (1 - u) + u * u * u;
  const dx = (u) => 3 * x1 * (1 - u) * (1 - u) + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u;
  return (x) => {
    x = clamp(x);
    if (x === 0 || x === 1) return x;
    let u = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u = clamp(u - (bx(u) - x) / d);
    }
    if (Math.abs(bx(u) - x) > 1e-4) {
      let a = 0, b = 1;
      for (let i = 0; i < 24; i++) { u = (a + b) / 2; if (bx(u) < x) a = u; else b = u; }
    }
    return by(u);
  };
}

export const outCubic = bezier(0.33, 1, 0.68, 1);      // superbot ease.out-cubic (switch rows, chip pop)
export const outBack = bezier(0.34, 1.56, 0.64, 1);    // superbot ease.out-back (tile and check pops)
export const standard = bezier(0.2, 0, 0, 1);          // superbot / M3 ease.standard (dims, crossfades, scroll legs)
export const enter = bezier(0.05, 0.7, 0.1, 1);        // M3 emphasized-decelerate: windows and docks arriving
export const exit = bezier(0.3, 0, 1, 1);              // M3 standard-accelerate: windows leaving (shorter than enter)
/** in-out sine: the even fade for anything that changes how bright the frame is (no front-loaded jump) */
export const sine = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));
/** minimum-jerk profile: how a hand moves a pointer (bell-shaped velocity) */
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };

/** eased progress of a window [a, b] */
export const ep = (t, a, b, f = standard) => f(seg(t, a, b));

/** critically damped closed-form spring over keyed targets [[t, v], ...]; seekable, velocity-continuous */
export const follow = (t, keys, k = 150, d = 24.5) => track(t, keys, k, d);

/** a pointer leg from p to q over [a, b]: minimum-jerk along a shallow arc (bow px, perpendicular) */
export function leg(t, a, b, p, q, bow = 40) {
  const f = smoother(seg(t, a, b));
  const x = lerp(p.x, q.x, f), y = lerp(p.y, q.y, f);
  const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
  const arc = Math.sin(Math.PI * f) * bow * Math.min(1, len / 400);
  return { x: x + (-dy / len) * arc, y: y + (dx / len) * arc };
}
