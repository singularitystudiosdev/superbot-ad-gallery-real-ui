// Shared pieces of the six launch-video beats (script, board, animate, voice, compose, premiere .f2628f01.js): the
// streamed reply line, the tool chips, the card shell and its rise. Pure functions of t, like every beat here.
import { seg, lerp, outCubic, streamCount } from '../../../lib.js';

export const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

export function rise(n, p, dy = 8) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
}

// the reply line superbot streams under the model's header
export function sayLine(x, text) {
  const n = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
  return { n, vis: n.firstElementChild, hid: n.lastElementChild, text, shown: -1 };
}
export function renderSay(s, t, t0, cps = 80) {
  const k = streamCount(s.text, t0, cps, t);
  if (k === s.shown) return;
  s.vis.textContent = s.text.slice(0, k);
  s.hid.textContent = s.text.slice(k);
  s.shown = k;
}

// a tool chip: lands spinning with what it is doing, resolves to what it did
export function toolChip(x, run, done) {
  const row = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`);
  return { row, chip: row.firstElementChild, run, done };
}
export function renderChip(c, t, tin, tdone) {
  rise(c.row, seg(t, tin, tin + 0.35), 8);
  const d = t >= tdone;
  const sp = c.chip.firstElementChild;
  sp.classList.toggle('done', d);
  sp.style.transform = d ? '' : `rotate(${(((t - tin) * 450) % 360).toFixed(1)}deg)`;
  setText(c.chip.lastElementChild, d ? c.done : c.run);
}

// the card header: the app's own tile, the title, a badge, and a right-hand slot
export const head = (x, app, title, badge = '', right = '') =>
  `<div class="pfc-hd">${x.tile(app, 'pfc-tile')}<b>${x.esc(title)}</b>${badge ? `<span class="pfc-badge">${x.esc(badge)}</span>` : ''}<span class="pfc-r">${right}</span></div>`;

// the card rises in, then the camera creeps in on it for as long as the beat runs
export function cardIn(card, t, t0, tEnd, creep = 1.02) {
  const ci = outCubic(seg(t, t0, t0 + 0.5));
  const push = lerp(1, creep, seg(t, t0, tEnd));
  card.style.opacity = ci.toFixed(3);
  card.style.transform = `translateY(${((1 - ci) * 18).toFixed(2)}px) scale(${(lerp(0.965, 1, ci) * push).toFixed(4)})`;
}

export const spin = (n, t, t0) => { n.style.transform = `rotate(${(((t - t0) * 420) % 360).toFixed(1)}deg)`; };
export const blinkOn = (t) => (t % 1.06) < 0.53;

// seeded 0..1, the same per index on every run
export const rnd = (i) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
