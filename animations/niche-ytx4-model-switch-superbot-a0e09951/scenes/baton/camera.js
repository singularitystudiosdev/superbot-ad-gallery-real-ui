// ytx4 relay baton: the camera inside the framed window. The window frame never moves; the page inside it pushes in
// on what the leg is about (so the key comment and reply text reads at ~24 px on a 1080p frame) and pans between rows.
// Targets are measured from the live DOM in page px, so the camera follows rows while they move.
import { clamp, lerp, inOutCubic } from '../../lib.js';
import { PAGE, VIEW, WIN_S } from './layout.js';

// an element's box in its page's own (unscaled 1920x1080) px
export function rectOf(pageEl, el) {
  if (!el) return null;
  const pr = pageEl.getBoundingClientRect();
  if (!pr.width) return null;
  const k = pr.width / PAGE.w;
  const r = el.getBoundingClientRect();
  return { x: (r.left - pr.left) / k, y: (r.top - pr.top) / k, w: r.width / k, h: r.height / k };
}
export function union(...rs) {
  rs = rs.filter(Boolean);
  if (!rs.length) return null;
  const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
  const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
// the camera that frames a rect (with a margin), z capped
export function frame(r, { pad = 24, zMax = 2.4, zMin = 1, ax = 0.5, ay = 0.5 } = {}) {
  if (!r) return { z: 1, fx: PAGE.w / 2, fy: PAGE.h / 2 };
  const w = r.w + pad * 2, h = r.h + pad * 2;
  const z = clamp(Math.min(VIEW.w / (w * WIN_S), VIEW.h / (h * WIN_S)), zMin, zMax);
  return { z, fx: r.x + r.w * ax, fy: r.y + r.h * ay };
}
// a camera with a fixed zoom whose view's left edge sits `inset` page px left of the rect (reads like a line of text)
export function readAt(r, z, { inset = 40, ay = 0.5 } = {}) {
  if (!r) return { z: 1, fx: PAGE.w / 2, fy: PAGE.h / 2 };
  const halfW = VIEW.w / 2 / (WIN_S * z);
  return { z, fx: r.x - inset + halfW, fy: r.y + r.h * ay };
}
export const WIDE = () => ({ z: 1, fx: PAGE.w / 2, fy: PAGE.h / 2 });

// clamp a camera so the page always covers the view (no empty edge inside the window)
export function contain(c) {
  const k = WIN_S * c.z;
  const hx = VIEW.w / 2 / k, hy = VIEW.h / 2 / k;
  return { z: c.z, fx: clamp(c.fx, hx, PAGE.w - hx), fy: clamp(c.fy, hy, PAGE.h - hy) };
}
function mix(a, b, f) {
  // zoom moves in log space; the focus moves so the zoom and the pan feel like one move
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), f));
  return { z, fx: lerp(a.fx, b.fx, f), fy: lerp(a.fy, b.fy, f) };
}
// keys: [[t, () => cam], ...] sorted by t. Between two keys the camera eases from one target to the next; equal
// targets on consecutive keys make a hold. Every target is evaluated now (live DOM), so held targets track motion.
export function camAt(t, keys) {
  if (t <= keys[0][0]) return contain(keys[0][1]());
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, ga] = keys[i], [tb, gb] = keys[i + 1];
    if (t < tb) {
      const f = inOutCubic(clamp((t - ta) / (tb - ta)));
      if (f <= 0) return contain(ga());
      if (f >= 1) return contain(gb());
      return mix(contain(ga()), contain(gb()), f);
    }
  }
  return contain(keys[keys.length - 1][1]());
}
