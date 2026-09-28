// Shared bits for the beats (carried from ../../tendie-model-selector kit.js): a streamed reply line, a rise-in,
// number formats, and the spot's own media in <ad>/gen/.
import { lerp, outCubic, streamCount } from '../../../lib.js';

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

export function rise(n, p, dy = 14, s0 = 0.97) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px) scale(${lerp(s0, 1, e).toFixed(4)})`;
  return e;
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

export function setText(n, s) { if (n.textContent !== s) n.textContent = s; }

// the spot's own media: the ride clip, its poster and the model tiles cut from it (see ../../../img/CREDITS.txt)
export const gen = (f) => new URL('../../../gen/' + f, import.meta.url).href;

// Primer octicons (github.com/primer/octicons, MIT), as in ../../do-that-too-apps cursor.js
const oct = (d, vb = '0 0 16 16', cls = '') => `<svg class="oct ${cls}" viewBox="${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
export const O_BRANCH = oct('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z');
export const REPO = oct('M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z', '0 0 16 16', 'tt-ric');
export const TICK = '<svg class="mc-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
export const TERM = '<svg class="mc-ico" viewBox="0 0 24 24"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>';
