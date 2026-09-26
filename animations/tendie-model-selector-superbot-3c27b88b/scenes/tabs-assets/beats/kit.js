// Shared bits for the model beats: a streamed reply line, a rise-in, number formats and the "Creating image" reveal.
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
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

export function setText(n, s) { if (n.textContent !== s) n.textContent = s; }

// an image resolving out of a blur under a sweeping band, with its "Creating image" label fading as it lands
export function reveal(im, gen, genl, t, w0, w1) {
  const p = seg(t, w0, w1), e = outCubic(p);
  im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 18).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
  im.style.opacity = lerp(0.25, 1, e).toFixed(3);
  im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
  gen.style.transform = `translateX(${lerp(-110, 110, (Math.max(0, t - w0) * 1.6) % 1).toFixed(1)}%)`;
  gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
  if (genl) genl.style.opacity = (1 - seg(t, w1 - 0.25, w1)).toFixed(3);
}

// the spot's generated media (Nano Banana, GPT Image, Veo 3.1 output), in <ad>/gen/
export const gen = (f) => new URL('../../../gen/' + f, import.meta.url).href;
