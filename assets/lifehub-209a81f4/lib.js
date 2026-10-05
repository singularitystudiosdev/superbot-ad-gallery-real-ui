/* lib.js: pure helpers for the lifehub ad kit. Every visual is a function of t; nothing here reads a clock. */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
/** progress of t through [a, b], clamped 0..1 */
export const prog = (t, a, b) => clamp((t - a) / (b - a));

export const ease = {
  linear: (k) => k,
  outCubic: (k) => 1 - Math.pow(1 - k, 3),
  inCubic: (k) => k * k * k,
  inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  outQuint: (k) => 1 - Math.pow(1 - k, 5),
  inOutQuint: (k) => (k < 0.5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2),
  outBack: (k) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
  /** emphasized decelerate, like the app's own curve */
  outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
};

/** eased progress of t through [a, b] */
export const ep = (t, a, b, fn = ease.outCubic) => fn(prog(t, a, b));

/** closed-form damped spring 0 -> 1 starting at t0 (no state, seekable) */
export function spring(t, t0, { freq = 2.2, damp = 0.55 } = {}) {
  const x = t - t0;
  if (x <= 0) return 0;
  const w = 2 * Math.PI * freq;
  return 1 - Math.exp(-damp * w * x) * Math.cos(w * Math.sqrt(1 - damp * damp) * x);
}

/** in/out window: fades in over [a, a+fi], out over [b-fo, b] */
export function win(t, a, b, fi = 0.3, fo = 0.3) {
  if (t < a || t > b) return 0;
  return Math.min(ease.outCubic(prog(t, a, a + fi)), 1 - ease.inCubic(prog(t, b - fo, b)));
}

/** deterministic pseudo-random in [0,1) from an integer seed */
export function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** typed prefix of text at time t, starting t0, chars per second cps */
export function typed(text, t, t0, cps = 28) {
  const n = Math.floor(clamp((t - t0) * cps, 0, text.length));
  return text.slice(0, n);
}

export function h(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => [...root.querySelectorAll(sel)];

/** write opacity + transform only when they change (keeps 60fps renders cheap) */
export function setStyle(el, { o, x = 0, y = 0, s = 1, r = 0, sx, sy, blur } = {}) {
  if (!el) return;
  const tf = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${(sx ?? s).toFixed(4)},${(sy ?? s).toFixed(4)})`;
  if (el.__tf !== tf) { el.style.transform = tf; el.__tf = tf; }
  if (o !== undefined) {
    const os = clamp(o).toFixed(3);
    if (el.__o !== os) { el.style.opacity = os; el.__o = os; }
  }
  if (blur !== undefined) {
    const f = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    if (el.__f !== f) { el.style.filter = f; el.__f = f; }
  }
}

export function setText(el, text) {
  if (el && el.__txt !== text) { el.textContent = text; el.__txt = text; }
}

export function toggle(el, cls, on) {
  if (el && el.classList.contains(cls) !== !!on) el.classList.toggle(cls, !!on);
}

/** camera: a 1920x1080 layer zoomed so that point (cx, cy) of the layer sits at the stage centre at zoom z */
export function camera(el, cx, cy, z) {
  const x = 960 - cx * z, y = 540 - cy * z;
  const tf = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${z.toFixed(4)})`;
  if (el.__tf !== tf) { el.style.transform = tf; el.__tf = tf; }
}

/** interpolate between camera keys [{t, cx, cy, z}], eased inOutCubic between neighbours */
export function camAt(keys, t) {
  if (t <= keys[0].t) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const k = (b.ease || ease.inOutCubic)(prog(t, a.t, b.t));
      return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), z: lerp(a.z, b.z, k) };
    }
  }
  return keys[keys.length - 1];
}

/** an element's box in layer coordinates (layer must be untransformed when called) */
export function boxIn(el, layer) {
  const a = el.getBoundingClientRect(), b = layer.getBoundingClientRect();
  const sc = b.width / layer.offsetWidth || 1;
  return { x: (a.left - b.left) / sc, y: (a.top - b.top) / sc, w: a.width / sc, h: a.height / sc,
    cx: (a.left - b.left + a.width / 2) / sc, cy: (a.top - b.top + a.height / 2) / sc };
}
