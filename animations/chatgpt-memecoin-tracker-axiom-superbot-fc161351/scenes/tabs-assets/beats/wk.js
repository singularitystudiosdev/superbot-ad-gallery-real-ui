// superbot's own work card, shared by every beat: a streamed one-line answer, then a card with a header (mascot,
// task, Working -> Done), the tool steps it ran (each grows in, spins, resolves to a check) and the result body,
// which grows in once the last step lands. Beats add their own motion inside the body.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

export const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const TICK = '<svg class="wk-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// standard clock: card right after the answer starts streaming, one step every 0.5 s, then the body
export function stdTimes(r, nSteps, bodyDur, hold) {
  const T = { r, card: r + 0.22 };
  T.steps = Array.from({ length: nSteps }, (_, i) => [T.card + 0.18 + i * 0.38, T.card + 0.18 + i * 0.38 + 0.45]);
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
