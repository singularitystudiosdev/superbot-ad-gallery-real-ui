// Shared look for the x7 aurora set (17e4a810): the lit environment, kinetic headlines, glass
// panels, the glint sweep and the end line. Everything is a pure function of t (render contract).
import { W, H, clamp, sp, h, op, tf, inOutCubic, track, PRESETS, makeMark } from './kit.js';
import { LINE } from './x7.js';

// ---- environment: arc of light over a perspective grid floor --------------------------
// o: { light 0..1, lift px (arc shift), hz horizon y, tilt deg, fx/fy floor offset px, floor 0..1 }
export function makeEnv() {
  const el = h(`<div class="env"><div class="spill"></div><div class="arc2"></div><div class="arc"></div><div class="horizon"></div><div class="floor"></div><div class="vig"></div></div>`);
  const [spill, arc2, arc, hz, floor] = el.children;
  function render(t, o = {}) {
    const light = o.light ?? 1, lift = o.lift ?? 0, hzY = o.hz ?? 700;
    op(spill, 0.9 * light); op(arc, light); op(arc2, 0.55 * light);
    tf(arc, `translateY(${lift}px)`); tf(arc2, `translateY(${lift * 1.1}px)`); tf(spill, `translateY(${lift * 0.8}px)`);
    hz.style.top = `${hzY}px`; op(hz, (o.floor ?? 1) * light);
    floor.style.top = `${hzY}px`;
    tf(floor, `perspective(640px) rotateX(${o.tilt ?? 76}deg)`);
    floor.style.backgroundPosition = `${(o.fx ?? 0).toFixed(1)}px ${(o.fy ?? t * 80).toFixed(1)}px`;
    op(floor, o.floor ?? 1);
  }
  return { el, render };
}

// ---- kinetic headline ---------------------------------------------------------------
// rows: strings; *a b* marks a gradient run, _a_ a muted run, `a` a mono run. Words rise out of
// their own mask on entry and leave upward; nothing fades.
function parseRows(rows) {
  return rows.map((r) => {
    let mode = '';
    return r.split(' ').map((tok) => {
      let txt = tok, cls = mode;
      for (const [m, c] of [['*', 'g'], ['_', 'm'], ['`', 'k']]) {
        if (txt.startsWith(m)) { cls = c; txt = txt.slice(1); if (!txt.endsWith(m)) mode = c; }
        if (txt.endsWith(m)) { txt = txt.slice(0, -1); mode = ''; }
      }
      return { txt, cls };
    });
  });
}
export function makeHead(rows, { size = 84, y = 120, gap = 0 } = {}) {
  const el = h(`<div class="hd"></div>`);
  el.style.top = `${y}px`;
  const words = [];
  for (const row of parseRows(rows)) {
    const r = h(`<div class="row"></div>`);
    r.style.fontSize = `${size}px`;
    if (gap) r.style.marginBottom = `${gap}px`;
    for (const w of row) { const s = h(`<span class="w ${w.cls}"><span>${w.txt}</span></span>`); r.appendChild(s); words.push(s.firstChild); }
    el.appendChild(r);
  }
  function render(t, tIn, tOut = null, stag = 0.055) {
    const n = words.length;
    const gone = tOut != null && t > tOut + n * stag * 0.5 + 0.7;
    el.style.visibility = t < tIn - 0.02 || gone ? 'hidden' : 'visible';
    if (el.style.visibility === 'hidden') return;
    words.forEach((s, i) => {
      const a = sp(t, tIn + i * stag, PRESETS.default);
      const b = tOut == null ? 0 : sp(t, tOut + i * stag * 0.5, { k: 260, d: 32 });
      tf(s, `translateY(${((1 - a) * 112 - b * 112).toFixed(2)}%)`);
    });
  }
  return { el, render };
}

// ---- glass panel ------------------------------------------------------------------
export function panel(w, ht, inner = '', cls = '') {
  const el = h(`<div class="zp ${cls}">${inner}<div class="glint"></div></div>`);
  el.style.width = `${w}px`; el.style.height = `${ht}px`;
  el.style.marginLeft = `${-w / 2}px`; el.style.marginTop = `${-ht / 2}px`;
  return el;
}
// a panel's center sits at (x, y); depth/tilt in one transform
export function pose(el, { x = W / 2, y = H / 2, z = 0, rx = 0, ry = 0, rz = 0, s = 1, p = 2400 } = {}) {
  el.style.left = `${x.toFixed(2)}px`; el.style.top = `${y.toFixed(2)}px`;
  tf(el, `perspective(${p}px) translateZ(${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${s.toFixed(4)})`);
}
// one diagonal sweep of light across a panel, from t0 over dur
export function glint(el, t, t0, dur = 0.9) {
  const g = el.querySelector(':scope > .glint');
  if (g) g.style.setProperty('--gx', `${(-120 + 240 * inOutCubic((t - t0) / dur)).toFixed(1)}%`);
}

// ---- world camera: keys [[t, cx, cy, s]] on the default spring ------------------------
export function cam(el, t, keys, k = 70, d = 16.7) {
  const cx = track(t, keys.map((q) => [q[0], q[1]]), k, d);
  const cy = track(t, keys.map((q) => [q[0], q[2]]), k, d);
  const s = track(t, keys.map((q) => [q[0], q[3]]), k, d);
  tf(el, `translate(${W / 2}px, ${H / 2}px) scale(${s.toFixed(4)}) translate(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px)`);
  return { cx, cy, s };
}

// cubic bezier point
export function bez(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
    v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
}

// ---- end line: the mark, the exact line on two rows, the endpoint ------------------------
export function makeZEnd({ size = 96, split = 4, url = 'beta.superbot.gg/v1' } = {}) {
  const words = LINE.split(' ');
  const gStart = words.length - 2; // "x7 faster." in the gradient
  const row = (a, b) => `<div class="row">${words.slice(a, b).map((w, i) => `<span class="w ${a + i >= gStart ? 'g' : ''}"><span>${w}</span></span>`).join('')}</div>`;
  const el = h(`<div class="zend"><div class="face"></div>${row(0, split)}${row(split, words.length)}<div class="url"><i></i>${url}</div></div>`);
  $rows(el).forEach((r) => { r.style.fontSize = `${size}px`; });
  const spans = [...el.querySelectorAll('.w > span')];
  if (spans.map((s) => s.textContent).join(' ') !== LINE) console.error('end line drifted from LINE');
  const mark = makeMark(120);
  el.querySelector('.face').appendChild(mark.el);
  const face = el.querySelector('.face'), urlEl = el.querySelector('.url');
  function render(t, t0) {
    el.style.visibility = t < t0 - 0.02 ? 'hidden' : 'visible';
    if (t < t0 - 0.02) return;
    const m = sp(t, t0, PRESETS.playful);
    tf(face, `translateY(${(1 - sp(t, t0, PRESETS.heavy)) * 40}px) scale(${0.4 + 0.6 * m})`);
    op(face, clamp((t - t0) / 0.2));
    mark.render(t - t0 + 0.3);
    spans.forEach((s, i) => tf(s, `translateY(${((1 - sp(t, t0 + 0.25 + i * 0.07, PRESETS.default)) * 112).toFixed(2)}%)`));
    const u = sp(t, t0 + 1.25, PRESETS.snappy);
    tf(urlEl, `translateY(${(1 - u) * 24}px)`); op(urlEl, clamp((t - t0 - 1.25) / 0.25));
  }
  return { el, render };
}
const $rows = (el) => [...el.querySelectorAll('.row')];
