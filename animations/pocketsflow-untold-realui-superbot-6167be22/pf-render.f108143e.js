// pf-render: the per-block motion of the thread, every value a pure function of t. Writes go through the
// write-on-change cache (w.css / w.attr / w.text) pf-chat hands in. Motion tokens are main's
// (packages/tokens/tokens/motion.tokens.json): switch-row 420 out-cubic 10px, switch-tile 400 out-back,
// switch-shimmer 1400 linear, switch-check 300 out-back from .3, the spinner one turn a second.

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const seg = (t, a, b) => clamp01((t - a) / (b - a));
export const lerp = (a, b, p) => a + (b - a) * p;
export const outCubic = (p) => 1 - Math.pow(1 - p, 3);
export const outBack = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
export const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const frac = (x) => x - Math.floor(x);
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s, Y = (s) => ((ay * s + by) * s + cy) * s, dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) { const e = X(s) - x, d = dX(s); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; s -= e / d; }
    return Y(s);
  };
}
export const emphDecel = bezier(0.05, 0.7, 0.1, 1);   // --ease-emphasized-decelerate
export const standard = bezier(0.2, 0, 0, 1);         // --ease-standard
const clock = (s) => { const n = Math.max(0, Math.floor(s)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

export function rise(w, node, t, at, dur = 0.42, dy = 10) {
  const p = outCubic(seg(t, at, at + dur));
  w.css(node, 'opacity', p >= 1 ? '' : p.toFixed(3));
  w.css(node, 'transform', p >= 1 ? '' : `translateY(${((1 - p) * dy).toFixed(2)}px)`);
}
// a spinner-then-check status slot (the pill's and the nested step rows')
export function status(w, spin, check, t, from, ok) {
  const done = t >= ok;
  w.css(spin, 'transform', done ? '' : `rotate(${(((t - from) * 360) % 360).toFixed(1)}deg)`);
  w.css(spin, 'opacity', done ? (1 - seg(t, ok, ok + 0.14)).toFixed(3) : '1');
  const cp = seg(t, ok, ok + 0.3);
  w.css(check, 'opacity', !done ? '0' : (cp >= 1 ? '1' : cp.toFixed(3)));
  w.css(check, 'transform', !done || cp >= 1 ? '' : `scale(${lerp(0.3, 1, outBack(cp)).toFixed(4)})`);
}
// ProviderSwitchPill: rise, the tile's pop, the label's travelling mask while it spins, the check. dim is the
// stack depth's opacity (depthStyle: --overlay-switch-row-prev .55 behind the newest, -older .3 beyond), applied
// to the pill and its nest alike
export function pill(w, n, t, sw, ok, running, done, dim = 1) {
  const p = outCubic(seg(t, sw, sw + 0.42)), op = p * dim;
  w.css(n.pill, 'opacity', op >= 1 ? '' : op.toFixed(3));
  w.css(n.pill, 'transform', p >= 1 ? '' : `translateY(${((1 - p) * 10).toFixed(2)}px)`);
  const tp = outBack(seg(t, sw + 0.05, sw + 0.45));
  w.css(n.tile, 'transform', tp >= 1 ? '' : `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`);
  const isOk = t >= ok;
  w.attr(n.pill, 'data-check', isOk ? 'true' : null);
  w.text(n.ink, isOk ? done : running);
  const sp = isOk ? 0 : frac((t - sw) / 1.4);
  w.css(n.sweep, 'transform', isOk ? '' : `translateX(${(150 * sp).toFixed(2)}%)`);
  w.css(n.ink, 'transform', isOk ? '' : `translateX(${(-150 * sp).toFixed(2)}%)`);
  status(w, n.spin, n.check, t, sw, ok);
  const q = outCubic(seg(t, ok, ok + 0.42)), nop = q * dim;
  w.css(n.nest, 'opacity', nop >= 1 ? '' : nop.toFixed(3));
  w.css(n.nest, 'transform', q >= 1 ? '' : `translateY(${((1 - q) * 10).toFixed(2)}px)`);
}
export function steps(w, rows, t, times, labels) {
  rows.forEach((s, j) => {
    const a = times[j], done = t >= a.done;
    rise(w, s.li, t, a.in);
    w.attr(s.li, 'data-state', done ? 'done' : 'running');
    w.text(s.label, done ? labels[j][1] : labels[j][0]);
    status(w, s.spin, s.check, t, a.in, a.done);
  });
}
// TurnShots: the window with one shot, the deck from two (one slot, so the swap moves nothing below it)
export function shots(w, n, t, at) {
  const count = at.filter((a) => t >= a).length;
  rise(w, n.root, t, at[0], 0.25, 4);
  w.attr(n.root, 'data-form', count >= 2 ? 'deck' : 'window');
  n.cards.forEach((c, i) => w.css(c, 'opacity', i < count ? '' : '0'));
}
// MediaPending: rises with the who header, breathes (--duration-skeleton-breathe), grows its mono clock past
// --duration-status-elapsed-after (1s); pf-chat drops it from the block at done, when the card lands below
const breathe = (t, from) => (0.55 + 0.45 * (0.5 - 0.5 * Math.cos((2 * Math.PI * (t - from)) / 1.6))).toFixed(3);
export function pending(w, n, t, ok) {
  rise(w, n.pend, t, ok);
  w.css(n.breath, 'opacity', breathe(t, ok));
  if (n.bar) w.css(n.bar, 'opacity', breathe(t, ok));
  w.css(n.clock, 'opacity', t - ok >= 1 ? '' : '0');
  w.text(n.clock, clock(t - ok));
}
// the card's entrance (MediaReveal): it comes up as the media resolves from a static blur
export function reveal(w, n, t, at) {
  rise(w, n.fig, t, at, 0.3, 6);
  const b = 1 - emphDecel(seg(t, at, at + 0.45));
  if (n.media) w.css(n.media, 'filter', b <= 0.001 ? '' : `blur(${(12 * b).toFixed(2)}px)`);
}
// a <video> driven by t like the tweet's (scenes/tweet.f108143e.js): a frozen frame parks it on the frame t asks
// for; a playing frame plays it and re-seeks only past drift
export function video(vid, t, at, from, len, on) {
  const want = Math.min(len - 0.08, Math.max(0, from + (t - at)));
  const live = on && t >= at && !document.body.classList.contains('freeze');
  if (live) {
    if (vid.paused) { const p = vid.play(); if (p && p.catch) p.catch((e) => console.error('[pf] video.play() rejected', e)); }
    if (Math.abs(vid.currentTime - want) > 0.25) vid.currentTime = want;
  } else {
    if (!vid.paused) vid.pause();
    if (Math.abs(vid.currentTime - want) > 0.004) vid.currentTime = want;   // frame-exact for the 60fps export
  }
}
// StepLine rows (hub/step-line.tsx): the one entrance, the running dot breathing 1 -> .4 over 1.2s
// (--duration-think-step-breathe, --overlay-pair-wait), the verb retyped and the Check at the settle
export function codeSteps(w, rows, t, times, spec) {
  rows.forEach((r, j) => {
    const a = times[j], done = t >= a.done;
    rise(w, r.li, t, a.in, 0.25, 4);
    w.attr(r.li, 'data-status', done ? 'done' : 'running');
    w.text(r.verb, done ? spec[j][1] : spec[j][0]);
    w.css(r.dot, 'opacity', done ? '' : (0.7 + 0.3 * Math.cos((Math.PI * (t - a.in)) / 1.2)).toFixed(3));
  });
}
