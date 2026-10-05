// Shared helpers for the Pocketsflow launch film (film.f2628f01.js). Every setter is a pure function of the
// shot's local time u, so a frozen frame always paints the same pixels.
import { seg, outQuint, outCubic } from '../lib.js';

export const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// a headline: one masked line per entry, one rising span per word
export const words = (text) => text.split(' ').map((w) => `<span class="pff-w">${w}</span>`).join(' ');
export const lines = (arr) => arr.map((l) => `<span class="pff-line">${l}</span>`).join('');

// words rise out of their line's mask, staggered
export function rise(nodes, u, t0, stagger = 0.06, dur = 0.55) {
  nodes.forEach((n, i) => {
    const p = outQuint(seg(u, t0 + i * stagger, t0 + i * stagger + dur));
    n.style.transform = p >= 1 ? 'none' : `translate3d(0,${((1 - p) * 108).toFixed(1)}%,0)`;
  });
}

// a block lands: opacity plus a short travel (dx, dy in film px)
export function land(n, p, dx = 0, dy = 18, s0 = 1) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  const s = s0 + (1 - s0) * e;
  n.style.transform = e >= 1 ? 'none' : `translate3d(${((1 - e) * dx).toFixed(2)}px,${((1 - e) * dy).toFixed(2)}px,0) scale(${s.toFixed(4)})`;
}

// the shot camera: a slow push-in over the shot
export const push = (cam, u, dur, to = 1.035) => {
  cam.style.transform = `scale(${(1 + (to - 1) * outCubic(Math.min(1, u / dur))).toFixed(5)})`;
};

export const money = (v, sym = '$') => sym + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// seeded 0..1, the same per index on every run
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
