// cam: act 3's camera over main's window, the every-model-one-chat real-UI spot's camera (ad.js there) driven by
// pf-chat's focusAt: it frames what has landed (the ask, the switch and its steps, the pending surface, the card),
// clipped to the thread's viewport, sampled once per layout, fitted per ratio and smoothed twice with a moving
// average, so it eases between beats and rides the scroll. The composer is either wholly in a shot or out of it.
// The finished film gets a deeper push (Z_FILM) so it plays near full frame.
const H = 1080, DT = 1 / 30, SMOOTH = 0.3, Z_MAX = 2.4, Z_FILM = 3.0, TOP_MIN = 100;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a, b, p) => a + (b - a) * p;
const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const within = (v, a, b) => (a > b ? (a + b) / 2 : Math.min(Math.max(v, a), b));
const mix = (a, b, k) => ({ cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), lz: lerp(a.lz, b.lz, k) });

export function createCamera({ win, chat, heroEl, composerEl, geo }) {
  let SAMPLES = null, SHOTS = null, COL_W = 720, COMPOSER_W = 883;
  const N = () => Math.ceil(chat.DUR / DT) + 1;
  const rectOf = (nd, wr, k) => { const r = nd.getBoundingClientRect(); return [(r.left - wr.left) / k, (r.top - wr.top) / k, (r.right - wr.left) / k, (r.bottom - wr.top) / k]; };
  function boxOf(nodes) {
    const wr = win.getBoundingClientRect(), k = wr.width / geo.WIN_W;
    const view = rectOf(chat.el, wr, k);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const nd of nodes) {
      if (!nd) continue;
      let r = rectOf(nd, wr, k);
      if (r[2] - r[0] <= 0 || r[3] - r[1] <= 0) continue;
      if (chat.el.contains(nd)) {
        r = [Math.max(r[0], view[0]), Math.max(r[1], view[1]), Math.min(r[2], view[2]), Math.min(r[3], view[3])];
        if (r[2] <= r[0] || r[3] <= r[1]) continue;
      }
      x0 = Math.min(x0, r[0]); y0 = Math.min(y0, r[1]); x1 = Math.max(x1, r[2]); y1 = Math.max(y1, r[3]);
    }
    const comp = rectOf(composerEl, wr, k);
    return { box: x0 < x1 ? [x0, y0, x1, y1] : comp, comp };
  }
  function measure() {
    chat.render(chat.T.settled);
    const wr = win.getBoundingClientRect(), k = wr.width / geo.WIN_W;
    const col = rectOf(chat.nodes.user, wr, k), comp = rectOf(composerEl, wr, k);
    COL_W = col[2] - col[0]; COMPOSER_W = comp[2] - comp[0];
    // built aside and swapped in whole, so a refit that lands mid-measure never reads a partial path
    const samples = [];
    for (let i = 0; i < N(); i++) {
      const ct = Math.min(chat.DUR, i * DT);
      chat.render(ct);
      const f = chat.focusAt(ct);
      const s = boxOf(f || [heroEl, composerEl]);
      s.zMax = ct >= chat.T.push + 0.3 ? Z_FILM : Z_MAX;
      samples.push(s);
    }
    SAMPLES = samples;
    SHOTS = shots();
  }
  function shots() {
    const w = geo.W(), { WIN_W, WIN_H, PANE_X, PAD, NARROW } = geo;
    const zWide = NARROW ? Math.max(w / WIN_W, H / WIN_H) : Math.min((w - 96) / WIN_W, (H - 72) / WIN_H);
    const wide = { cx: WIN_W / 2, cy: WIN_H / 2, lz: Math.log(zWide) };
    const fit = ({ box: [x0, y0, x1, y1], comp, zMax }) => {
      const ctop = comp[1], mid = (y0 + y1) / 2;
      const zFor = (minW) => Math.max(zWide, Math.min(zMax, w / (Math.max(x1 - x0, minW) + 2 * PAD), H / (y1 - y0 + 2 * PAD)));
      const placeX = (z, minW) => {
        const hw = w / z / 2;
        const cx0 = Math.min(x0, (x0 + x1 - minW) / 2), cx1 = Math.max(x1, (x0 + x1 + minW) / 2);
        const left = 2 * hw <= WIN_W - PANE_X ? PANE_X : 0;
        return within((cx0 + cx1) / 2, left + hw, WIN_W - hw);
      };
      const minW = zMax > Z_MAX ? 0 : COL_W;
      let z = zFor(minW), hh = H / z / 2;
      if (y1 <= ctop + 1 && 2 * hh <= ctop) {
        const top = 2 * hh <= ctop - TOP_MIN ? TOP_MIN : 0;
        return { cx: placeX(z, minW), cy: within(mid, top + hh, ctop - hh), lz: Math.log(z) };
      }
      z = Math.min(z, zFor(COMPOSER_W));
      if (!NARROW && w / z > WIN_W - PANE_X + 1) z = Math.max(Math.min(z, w / WIN_W), zWide);
      hh = H / z / 2;
      return { cx: placeX(z, COMPOSER_W), cy: within(Math.max(mid, TOP_MIN + hh), hh, WIN_H - hh), lz: Math.log(z) };
    };
    let path = SAMPLES.map(fit);
    const r = Math.round(SMOOTH / DT);
    for (let pass = 0; pass < 2; pass++) {
      path = path.map((_, i) => {
        let cx = 0, cy = 0, lz = 0, n = 0;
        for (let j = i - r; j <= i + r; j++) { const p = path[Math.min(path.length - 1, Math.max(0, j))]; cx += p.cx; cy += p.cy; lz += p.lz; n++; }
        return { cx: cx / n, cy: cy / n, lz: lz / n };
      });
    }
    // a composer peeking in at the bottom of a narrower shot: under 40px pan up, past 80px take the whole composer
    const zComp = Math.max(zWide, w / (COMPOSER_W + 2 * PAD));
    path = path.map((p, i) => {
      const [cl, ctop, cr] = SAMPLES[i].comp;
      const z0 = Math.exp(p.lz), hh0 = H / z0 / 2, d = p.cy + hh0 - ctop;
      if (d <= 0 || z0 <= zComp + 1e-6) return { cx: within(p.cx, w / z0 / 2, WIN_W - w / z0 / 2), cy: within(p.cy, hh0, WIN_H - hh0), lz: p.lz };
      const zA = Math.max(z0, H / ctop), hhA = H / zA / 2;
      const A = { cx: p.cx, cy: ctop - hhA, lz: Math.log(zA) };
      const hhB = H / zComp / 2, hwB = w / zComp / 2;
      const B = { cx: within(p.cx, cr + PAD - hwB, cl - PAD + hwB), cy: within(p.cy, hhB, WIN_H - hhB), lz: Math.log(zComp) };
      const q = mix(A, B, inOutCubic(clamp01((d - 40) / 40)));
      const z = Math.exp(q.lz), hh = H / z / 2, hw = w / z / 2;
      return { cx: within(q.cx, hw, WIN_W - hw), cy: within(q.cy, hh, WIN_H - hh), lz: q.lz };
    });
    return { wide, path };
  }
  // ct: chat time; pull: [a, b] the pull back to the whole window
  function at(ct, pull) {
    if (!SHOTS || !SHOTS.path.length || !Number.isFinite(ct)) {
      console.error('[cam] no camera path at', ct, SHOTS && SHOTS.path.length, new Error().stack);
      const w = SHOTS ? SHOTS.wide : { cx: geo.WIN_W / 2, cy: geo.WIN_H / 2, lz: 0 };
      return { cx: w.cx, cy: w.cy, z: Math.exp(w.lz) };
    }
    const P = SHOTS.path, f = Math.max(0, Math.min(P.length - 1, ct / DT)), i = Math.floor(f);
    let c = mix(P[i], P[Math.min(P.length - 1, i + 1)], f - i);
    if (ct > pull[0]) c = mix(c, SHOTS.wide, inOutCubic(clamp01((ct - pull[0]) / (pull[1] - pull[0]))));
    return { cx: c.cx, cy: c.cy, z: Math.exp(c.lz) };
  }
  return { measure, refit() { if (SAMPLES && SAMPLES.length) SHOTS = shots(); }, at };
}
