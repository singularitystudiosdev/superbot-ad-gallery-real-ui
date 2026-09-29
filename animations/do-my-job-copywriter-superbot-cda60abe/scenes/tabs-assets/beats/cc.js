// Shared pieces of the single chat beat (signin.js): the tool chip row, the resolve pill, a counting helper and
// the two icons it needs. The chip row and the pill are the doordash beat's .ch-tool spinner pill and its .dd-btn
// resolve pill (ported in ports.css / signin.css with the timings unchanged). Every moving value is written
// from t, so ?t=<s> reproduces any frame exactly. This file carries no copy of its own.
import { lerp, seg, outCubic, outBack } from '../../../lib.js';

export const fmt = (n) => Number(n).toLocaleString('en-US');

const ico = (inner, cls = 'cc-ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;

export const ICO = {
  phone: ico('<path d="M6.6 3H4.9A1.9 1.9 0 0 0 3 5.1C3.7 13 10 19.3 17.9 20a1.9 1.9 0 0 0 2.1-1.9v-1.7a1.9 1.9 0 0 0-1.5-1.9l-2.3-.5a1.9 1.9 0 0 0-1.9.7l-.9 1.2a12.3 12.3 0 0 1-5-5l1.2-.9a1.9 1.9 0 0 0 .7-1.9l-.5-2.3A1.9 1.9 0 0 0 6.6 3Z"/>'),
  headset: ico('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M3 14h2.2a1 1 0 0 1 1 1v3.4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-2.4A1 1 0 0 1 3 14Z"/><path d="M21 14h-2.2a1 1 0 0 0-1 1v3.4a1 1 0 0 0 1 1H19a2 2 0 0 0 2-2v-2.4a1 1 0 0 0 0-1Z"/><path d="M17.5 19.4a3.4 3.4 0 0 1-3.4 3.1h-1.6"/>'),
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'cc-ic cc-tick'),
};

export const CHECK = '<svg class="cc-check" viewBox="0 0 24 24" aria-hidden="true"><path class="cc-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';

// ---------- the tool chips ----------
/** a chip row: `.cc-row > .ch-tool > .spin + .ch-tool-t`. run/done are the two labels the chip swaps between. */
export function chipRow(x, runLabel, doneLabel) {
  const el = x.el(`<div class="cc-row"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(runLabel)}</span></div></div>`);
  return { el, run: runLabel, done: doneLabel, spin: el.querySelector('.spin'), tx: el.querySelector('.ch-tool-t') };
}
/** chip state at t: spinner turning while running, green check when done. Spin is a pure function of t. */
export function tickChip(c, t, a, z, t0) {
  c.el.style.opacity = outCubic(seg(t, a, a + 0.35)).toFixed(3);
  c.el.style.transform = t >= a + 0.35 ? 'none' : `translateY(${((1 - outCubic(seg(t, a, a + 0.35))) * 8).toFixed(2)}px)`;
  const done = t >= z;
  c.spin.classList.toggle('done', done);
  c.spin.style.transform = done ? '' : `rotate(${(((t - t0) * 450) % 360).toFixed(1)}deg)`;
  const lab = done ? c.done : c.run;
  if (c.tx.textContent !== lab) c.tx.textContent = lab;
}

// ---------- the resolve pill (ported from the doordash beat's .dd-btn, timings identical) ----------
export function pillHTML(icon, labelA, labelB) {
  return `<div class="cc-pill">
    <span class="cc-grp cc-grp-a">${icon}<span class="cc-lab-a">${labelA}</span></span>
    <span class="cc-grp cc-grp-b">${CHECK}<span class="cc-lab-b">${labelB}</span></span>
    <i class="cc-shine" aria-hidden="true"></i>
  </div>`;
}
export function pillParts(card) {
  const q = (s) => card.querySelector(s);
  return {
    el: q('.cc-pill'), grpA: q('.cc-grp-a'), grpB: q('.cc-grp-b'), labA: q('.cc-lab-a'), labB: q('.cc-lab-b'),
    bag: q('.cc-grp-a svg'), check: q('.cc-check'), checkP: q('.cc-check-p'), shine: q('.cc-shine'),
  };
}
/** renderPill(p, t, P): the pill resolving at P. The dip, the shine and the drawn check are unchanged from
    doordash.js; stepping (`dots`) appends 1..3 animated dots to the running label, so it reads "Connecting..."
    then flips to the resolved label. */
export function renderPill(p, t, P, dots = false) {
  if (dots) {
    const n = 1 + (Math.floor(Math.max(0, t - P + 1.6) * 4) % 3);
    const s = p.labA.textContent.replace(/\.+$/, '');
    const next = s + '.'.repeat(n);
    if (p.labA.textContent !== next) p.labA.textContent = next;
  }
  const down = seg(t, P - 0.06, P + 0.04) * (1 - seg(t, P + 0.1, P + 0.24));
  const pop = outBack(seg(t, P + 0.1, P + 0.5));
  p.el.style.transform = `scale(${(1 - 0.05 * down + 0.03 * Math.sin(Math.PI * seg(t, P + 0.1, P + 0.5))).toFixed(4)})`;
  const sh = seg(t, P + 0.02, P + 0.62);
  p.shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0).toFixed(3);
  p.shine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;
  const ro = seg(t, P + 0.04, P + 0.3);
  p.grpA.style.opacity = (1 - outCubic(ro)).toFixed(3);
  p.grpA.style.transform = `translate(-50%, calc(-50% - ${(outCubic(ro) * 10).toFixed(2)}px))`;
  if (p.bag) p.bag.style.transform = `rotate(${(-40 * ro).toFixed(1)}deg) scale(${(1 - 0.6 * ro).toFixed(3)})`;
  const gi = seg(t, P + 0.1, P + 0.45);
  p.grpB.style.opacity = outCubic(gi).toFixed(3);
  p.grpB.style.transform = `translate(-50%, calc(-50% + ${((1 - outCubic(gi)) * 10).toFixed(2)}px)) scale(${lerp(0.9, 1, pop).toFixed(4)})`;
  p.checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, P + 0.14, P + 0.44)))).toFixed(2);
  p.check.style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, P + 0.14, P + 0.4))).toFixed(3)})`;
}

// ---------- small motion helpers ----------
/** rise a node in over [a, a+0.45] by dy px */
export function rise(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.45));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}
/** the card itself: rises 20px and scales in from .97 over 0.55 s */
export function riseCard(card, t, a) {
  const ci = seg(t, a, a + 0.55), e = outCubic(ci);
  card.style.opacity = e.toFixed(3);
  card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - e) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, e).toFixed(4)})`;
}
/** a number counting from -> to over [a, b], written only when the text changes */
export function counter(node, from, to, a, b, t, fn = fmt) {
  const s = fn(lerp(from, to, outCubic(seg(t, a, b))));
  if (node.textContent !== s) node.textContent = s;
  return s;
}
/** the green live dot: the whole .cc-live chip lights from `at` and its dot breathes on a 1.6 s cycle */
export function liveDot(node, t, at) {
  const on = seg(t, at, at + 0.25);
  node.parentNode.style.opacity = on.toFixed(3);
  node.style.opacity = on.toFixed(3);
  node.style.transform = `scale(${(1 + 0.22 * Math.max(0, Math.sin((t - at) * 3.9))).toFixed(3)})`;
}