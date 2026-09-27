// Shared bits for the Minecraft beats (carried from ../../tendie-model-selector kit.js): a streamed reply line, a
// rise-in, number formats, the gen band reveal, and the spot's own media in <ad>/gen/.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

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

// an image resolving out of a blur, pure function of t
export function unblur(im, t, w0, w1) {
  const e = outCubic(seg(t, w0, w1));
  im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 10).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
  im.style.opacity = lerp(0.2, 1, e).toFixed(3);
  im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.12, 1, e).toFixed(4)})`;
}

// the sweeping "generating" band and its label
export function band(gen, genl, t, w0, w1) {
  const p = seg(t, w0, w1);
  gen.style.transform = `translateX(${lerp(-110, 110, (Math.max(0, t - w0) * 1.4) % 1).toFixed(1)}%)`;
  gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.85, 1)).toFixed(3);
  if (genl) genl.style.opacity = (1 - seg(t, w1 - 0.25, w1)).toFixed(3);
}

// the spot's own media: the gameplay clip and the decal tiles cut from it (see ../../../img/CREDITS.txt)
export const gen = (f) => new URL('../../../gen/' + f, import.meta.url).href;

// Primer octicons (github.com/primer/octicons, MIT), as in ../../do-that-too-apps cursor.js
const oct = (d, vb = '0 0 16 16', cls = '') => `<svg class="oct ${cls}" viewBox="${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
export const GH = oct('M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943', '0 0 24 24', 'gh');
export const O_CHECK = oct('M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z');
export const O_BRANCH = oct('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z');
export const REPO = oct('M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z', '0 0 16 16', 'tt-ric');
export const TICK = '<svg class="mc-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
export const TERM = '<svg class="mc-ico" viewBox="0 0 24 24"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>';
export const GRID = '<svg class="mc-ico" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
