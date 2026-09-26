// superbot's own work card, shared by every beat: a streamed one-line answer, then a card with a header (mascot,
// task, Working -> Done), the tool steps it ran (each grows in, spins, resolves to a check) and the result body,
// which grows in once the last step lands. Beats add their own motion inside the body. Also the equity chart the
// backtest and the DD post draw (an SVG line chart with a price-axis grid, drawn left to right with a live head).
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

export const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (v, d = 1) => `${v > 0 ? '+' : v < 0 ? '-' : ''}${Math.abs(v).toFixed(d)}%`;
const TICK = '<svg class="wk-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// standard clock: card right after the answer starts streaming, one step every 0.5 s, then the body
export function stdTimes(r, nSteps, bodyDur, hold) {
  const T = { r, card: r + 0.3 };
  T.steps = Array.from({ length: nSteps }, (_, i) => [T.card + 0.25 + i * 0.5, T.card + 0.25 + i * 0.5 + 0.6]);
  T.body = T.steps[nSteps - 1][1] + 0.05;
  T.bodyEnd = T.body + 0.5;
  T.done = T.body + bodyDur;
  T.end = T.done + hold;
  return T;
}

// grow a block from 0 to its natural height (its own scrollHeight), fading in as it goes
export function grow(n, p) {
  const e = outCubic(p);
  if (p >= 1) { n.style.height = 'auto'; n.style.opacity = '1'; return; }
  n.style.height = (n.scrollHeight * e).toFixed(2) + 'px';
  n.style.opacity = seg(e, 0.35, 1).toFixed(3);
}

export function workBeat(x, k, { say, title, sub, steps, body, cls = '' }) {
  const T = k.T;
  const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(say)}</span></div>`);
  const card = x.el(`<div class="wk ${cls}">
    <div class="wk-hd"><img class="wk-sb" src="${x.sbSrc}" alt=""/><b>${title}</b>${sub ? `<span class="wk-sub">${sub}</span>` : ''}
      <em class="wk-st"><span class="wk-run"><i class="wk-spin"></i>Working</span><span class="wk-ok">${TICK}Done</span></em></div>
    <div class="wk-steps">${steps.map((s) => `<div class="wk-step"><div class="wk-sr"><span class="wk-si"><i class="wk-spin"></i>${TICK}</span><span class="wk-stx">${s}</span></div></div>`).join('')}</div>
    <div class="wk-bd"><div class="wk-bdi">${body}</div></div>
  </div>`);
  const stepEls = [...card.querySelectorAll('.wk-step')].map((n) => ({ n, spin: n.querySelector('.wk-spin'), tk: n.querySelector('.wk-tk'), tx: n.querySelector('.wk-stx') }));
  const bd = card.querySelector('.wk-bd');
  const run = card.querySelector('.wk-run'), ok = card.querySelector('.wk-ok'), hSpin = run.querySelector('.wk-spin');
  const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
  let shown = -1;
  const marks = [[T.r, sayEl], [T.card, card], ...T.steps.map(([a]) => [a, card]), [T.body, card]];

  function render(t) {
    const n = streamCount(say, T.r + 0.05, 70, t);
    if (n !== shown) { vis.textContent = say.slice(0, n); hid.textContent = say.slice(n); shown = n; }
    const ci = seg(t, T.card, T.card + 0.5), e = outCubic(ci);
    card.style.opacity = e.toFixed(3);
    card.style.transform = ci >= 1 ? '' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${lerp(0.975, 1, e).toFixed(4)})`;
    stepEls.forEach((s, i) => {
      const [a, z] = T.steps[i];
      grow(s.n, seg(t, a, a + 0.32));
      const d = seg(t, z - 0.06, z + 0.08);
      s.spin.style.opacity = (1 - d).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 400).toFixed(1)}deg)`;
      const o = seg(t, z, z + 0.28);
      s.tk.style.opacity = o.toFixed(3);
      s.tk.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
      s.tx.classList.toggle('on', t >= a && t < z);
    });
    grow(bd, seg(t, T.body, T.bodyEnd));
    const f = seg(t, T.done - 0.05, T.done + 0.2);
    run.style.opacity = (1 - seg(f, 0, 0.5)).toFixed(3);
    ok.style.opacity = f.toFixed(3);
    ok.style.transform = `scale(${lerp(0.8, 1, outBack(f)).toFixed(4)})`;
    hSpin.style.transform = `rotate(${((t - T.card) * 400).toFixed(1)}deg)`;
  }
  return { sayEl, card, marks, render, q: (s) => card.querySelector(s), qa: (s) => [...card.querySelectorAll(s)] };
}

// counts a number up between a and z (outCubic), writing it only when the text changes
export function counter(node, to, a, z, fmtFn, from = 0) {
  let last = null;
  return (t) => {
    const s = fmtFn(lerp(from, to, outCubic(seg(t, a, z))));
    if (s !== last) { node.textContent = s; last = s; }
  };
}

// an equity chart: series [{ v: [...%], cls, tag }] share the axes; the first one gets the area fill and the head
let uid = 0;
export function equityChart({ W = 476, H = 150, series, xl = [], lo, hi, ticks, dd = null, tags = true, L = 34, R = 50 }) {
  const id = 'eq' + ++uid;
  const Tp = 8, B = 18, iw = W - L - R, ih = H - Tp - B, N = series[0].v.length;
  const X = (i) => L + (iw * i) / (N - 1);
  const Y = (v) => Tp + ih * (1 - (v - lo) / (hi - lo));
  const line = (v) => v.map((y, i) => `${i ? 'L' : 'M'}${X(i).toFixed(2)},${Y(y).toFixed(2)}`).join('');
  const s0 = series[0];
  const grid = ticks.map((v) => `<line class="eq-g${v === 0 ? ' eq-g0' : ''}" x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(2)}" y2="${Y(v).toFixed(2)}"/><text class="eq-yl" x="${L - 6}" y="${(Y(v) + 3).toFixed(2)}">${v > 0 ? '+' : ''}${v}%</text>`).join('');
  const xs = xl.map(([i, s]) => `<text class="eq-xl" x="${X(i).toFixed(2)}" y="${H - 4}">${s}</text>`).join('');
  const ddG = dd ? `<g class="eq-dd"><rect x="${X(dd[0]).toFixed(2)}" y="${Tp}" width="${(X(dd[1]) - X(dd[0])).toFixed(2)}" height="${ih}"/><line x1="${X(dd[0]).toFixed(2)}" x2="${X(dd[1]).toFixed(2)}" y1="${Y(s0.v[dd[0]]).toFixed(2)}" y2="${Y(s0.v[dd[0]]).toFixed(2)}"/><text x="${((X(dd[0]) + X(dd[1])) / 2).toFixed(2)}" y="${Tp + 10}">${dd[2]}</text></g>` : '';
  const tagG = tags ? series.map((s) => `<g class="eq-tag ${s.cls}" transform="translate(${(W - R + 5).toFixed(2)},${Y(s.v[N - 1]).toFixed(2)})"><rect x="0" y="-8" width="${R - 7}" height="16" rx="4"/><text x="${((R - 7) / 2).toFixed(2)}" y="3.5">${s.tag}</text></g>`).join('') : '';
  const html = `<svg class="eq" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34d399" stop-opacity=".30"/><stop offset="1" stop-color="#34d399" stop-opacity="0"/></linearGradient>
      <clipPath id="${id}c"><rect class="eq-clip" x="0" y="0" width="0" height="${H}"/></clipPath></defs>
    ${grid}${xs}${ddG}
    <g clip-path="url(#${id}c)">
      <path class="eq-area" d="${line(s0.v)}L${X(N - 1).toFixed(2)},${Y(lo).toFixed(2)}L${X(0).toFixed(2)},${Y(lo).toFixed(2)}Z" fill="url(#${id}f)"/>
      ${series.slice(1).map((s) => `<path class="eq-l ${s.cls}" d="${line(s.v)}"/>`).join('')}
      <path class="eq-l ${s0.cls}" d="${line(s0.v)}"/>
    </g>
    <line class="eq-x" x1="0" x2="0" y1="${Tp}" y2="${Tp + ih}"/>
    <circle class="eq-glow" r="7"/><circle class="eq-head" r="3"/>
    ${tagG}
  </svg>`;
  // render(svg, p, q): p draws left to right, q brings in the end tags and the drawdown band
  function render(svg, p, q) {
    const f = p * (N - 1), i = Math.min(N - 2, Math.floor(f)), fr = f - i;
    const hx = lerp(X(i), X(i + 1), fr), hy = lerp(Y(s0.v[i]), Y(s0.v[i + 1]), fr);
    svg.querySelector('.eq-clip').setAttribute('width', (hx + 1).toFixed(2));
    const live = p > 0 && p < 1 ? 1 : 0;
    ['.eq-head', '.eq-glow'].forEach((c) => { const n = svg.querySelector(c); n.setAttribute('cx', hx.toFixed(2)); n.setAttribute('cy', hy.toFixed(2)); n.style.opacity = p > 0 ? (c === '.eq-glow' ? 0.35 + 0.25 * live : 1) : 0; });
    const xl2 = svg.querySelector('.eq-x');
    xl2.setAttribute('x1', hx.toFixed(2)); xl2.setAttribute('x2', hx.toFixed(2));
    xl2.style.opacity = live ? 0.5 : 0;
    svg.querySelectorAll('.eq-tag').forEach((g, j) => { const o = outBack(seg(q, j * 0.25, j * 0.25 + 0.6)); g.style.opacity = seg(q, j * 0.25, j * 0.25 + 0.3).toFixed(3); g.style.transform = `translate(${(W - R + 5).toFixed(2)}px,${Y(series[j].v[N - 1]).toFixed(2)}px) scale(${lerp(0.6, 1, o).toFixed(4)})`; });
    const ddn = svg.querySelector('.eq-dd');
    if (ddn) ddn.style.opacity = seg(q, 0.4, 1).toFixed(3);
  }
  return { html, render };
}

// the backtest's series (series.mjs, seeded): strategy ends +14.2%, max drawdown -9.8% (day 19 peak to day 31
// trough), SPY ends +6.1%, 63 trading days ending Sep 25
export const STRAT = [0,0.37,0.59,1.43,1.72,1.88,2.11,2.1,2.06,1.42,2.04,1.08,1.2,1.74,2.45,4.46,4.71,6.36,6.88,7.8,7.26,5.76,4.94,3.85,2.75,2,1.12,0.34,-0.22,-1.8,-2.23,-2.76,-2.58,-1.31,-1.65,-0.67,0.57,0.58,1.2,1.54,2.35,2.97,3.94,4.42,4.8,4.46,4.51,3.62,3.86,3.38,3.5,4.59,5.1,6.13,7.83,8.94,9.8,10.39,11.37,11.59,13.2,13.72,14.2];
export const SPY = [0,0.07,0.41,0.78,0.78,0.65,1.36,1.34,1.38,1.77,1.8,1.95,1.8,2.19,2.18,2.26,2.41,2.85,2.83,2.86,3,2.75,2.79,2.17,2.15,1.83,1.58,1.11,0.94,0.9,0.46,0.4,0.49,0.78,1.04,1.32,2.02,2.32,2.36,2.88,3.18,3.2,3.4,3.57,3.8,3.62,3.73,3.82,3.83,4.39,4.62,4.57,4.7,4.71,5.11,4.76,5.27,5.38,5.42,5.63,5.8,5.97,6.1];
export const XL = [[2, 'Jul 1'], [24, 'Aug 3'], [45, 'Sep 1'], [62, 'Sep 25']];
