// Helpers for the v4 Opus coding beat (beats/opus-lapse.js), ported from the Minecraft ad's beats/kit.js so this ad
// never imports across ad folders. Icons: GitHub Octicons (repo-16, git-branch-16; MIT, github.com/primer/octicons)
// and Lucide (check, terminal; ISC, lucide.dev), the same glyphs the referent ships. Pure helpers: every one writes
// from the t it is handed and nothing else.
import { lerp, outCubic, streamCount } from '../../../lib.js';

const oct = (d, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 16 16"><path d="${d}"/></svg>`;
export const O_BRANCH = oct('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z');
export const REPO = oct('M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z', 'ocx-ric');
export const TICK = '<svg class="ocx-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
export const TERM = '<svg class="ocx-ico" viewBox="0 0 24 24"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>';

// the model's reply line, streamed at cps into the thread's own .qc-say markup (chat.css)
export function sayer(x, text, cps = 85) {
  const node = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
  const vis = node.firstElementChild, hid = node.lastElementChild;
  let shown = -1;
  return {
    node,
    render(t, t0) {
      const n = streamCount(text, t0, cps, t);
      if (n !== shown) { vis.textContent = text.slice(0, n); hid.textContent = text.slice(n); shown = n; }
    },
  };
}

// a node rising into place: opacity, a short lift and a hair of scale, all from p in [0, 1]
export function rise(n, p, dy = 14, s0 = 0.97) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px) scale(${lerp(s0, 1, e).toFixed(4)})`;
  return e;
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

export function setText(n, s) { if (n.textContent !== s) n.textContent = s; }
