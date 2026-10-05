// The spot's one motion vocabulary. Every move is a critically damped spring (no overshoot), written as its closed-form
// step response so the frame stays a pure function of t (?t= and __AD.seek freeze any frame):
//   S(tau) = 1 - (1 + w tau) e^(-w tau),  S(0) = 0, S'(0) = 0, settles monotonically.
// A spring is linear, so a target that jumps several times is followed exactly by summing one step response per
// jump (follow): velocity never jumps, however close together the jumps land. Fades use smootherstep (C2).
import { clamp, seg, lerp } from '../../lib.js';

// w for a spring that is within 0.3% of rest after dur seconds (S(8.5) ~ 0.997)
const W_OF = (dur) => 8.5 / dur;

/** the raw step response at tau seconds after the step, for angular frequency w */
export const step = (tau, w) => (tau <= 0 ? 0 : 1 - (1 + w * tau) * Math.exp(-w * tau));

/** 0 -> 1 from a, settling over dur seconds (normalised so it reaches exactly 1 at a + dur) */
export function spring(t, a, dur = 0.6) {
  if (t <= a) return 0;
  if (t >= a + dur) return 1;
  const w = W_OF(dur);
  return clamp(step(t - a, w) / step(dur, w));
}

/** smootherstep between a and b (C2: zero velocity and acceleration at both ends) */
export function smooth(t, a, b) {
  const x = seg(t, a, b);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** follow a piecewise-constant target: marks = [[time, value], ...] sorted by time; the first value is the start */
export function follow(t, marks, dur = 0.8) {
  if (!marks.length) return 0;
  const w = W_OF(dur);
  let y = marks[0][1];
  for (let i = 1; i < marks.length; i++) {
    const [a, v] = marks[i];
    if (t <= a) break;
    y += (v - marks[i - 1][1]) * (t >= a + dur ? 1 : step(t - a, w) / step(dur, w));
  }
  return y;
}

/** a message or row arriving: fades in (smootherstep) while it glides up dy px on a spring */
export function rise(n, t, a, dy = 14, dur = 0.6) {
  const o = smooth(t, a, a + dur * 0.55);
  const p = spring(t, a, dur);
  n.style.opacity = o.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translate3d(0,${((1 - p) * dy).toFixed(2)}px,0)`;
}

/** in-then-out envelope: 0 before a, springs to 1, holds, eases back to 0 by b */
export const hold = (t, a, b, din = 0.45, dout = 0.35) => spring(t, a, din) * (1 - smooth(t, b - dout, b));

/** a pointer glide between keyed points [[t, x, y], ...] on springs (no straight-line robot moves) */
export function glide(t, keys, dur = 0.7) {
  return { x: follow(t, keys.map(([a, x]) => [a, x]), dur), y: follow(t, keys.map(([a, , y]) => [a, y]), dur) };
}

/** a click: the pointer dips over 0.1 s and comes back over 0.18 s (0 -> 1 -> 0) */
export const click = (t, at) => smooth(t, at - 0.1, at) * (1 - smooth(t, at, at + 0.18));

/** streamed text with a soft leading edge: the newest EDGE characters fade in instead of popping, and the unstreamed
    rest is laid out but transparent, so the line's height never changes while it streams. `esc` escapes a string. */
const EDGE = 6;
export function streamHTML(text, t0, cps, t, esc) {
  const x = (t - t0) * cps; // characters streamed, fractional
  if (x <= 0) return `<span class="sm-g">${esc(text)}</span>`;
  if (x >= text.length + EDGE) return esc(text);
  const full = Math.max(0, Math.floor(x - EDGE));
  let html = esc(text.slice(0, full));
  const end = Math.min(text.length, Math.ceil(x));
  for (let i = full; i < end; i++) {
    const o = clamp((x - i) / EDGE);
    html += `<span style="opacity:${o.toFixed(2)}">${esc(text[i])}</span>`;
  }
  if (end < text.length) html += `<span class="sm-g">${esc(text.slice(end))}</span>`;
  return html;
}
export const streamEnd = (text, t0, cps) => t0 + (text.length + EDGE) / cps;

export { lerp, seg, clamp };
