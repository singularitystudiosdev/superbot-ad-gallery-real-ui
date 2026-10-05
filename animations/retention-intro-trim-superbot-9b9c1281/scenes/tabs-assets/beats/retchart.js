// The audience retention chart in YouTube Studio's light analytics style (the "Key moments for audience retention" card):
// the first minute of the video on x, % of viewers still watching on y, Studio's grey gridlines with the % labels on the
// right and m:ss under the axis, the curve in YouTube blue over a pale wash. Shared by the Gemini card (retention.js)
// and the "48 hours later" card (editor.js). The curve draws with stroke-dashoffset on pathLength 1, so a frame is a
// pure function of the progress the beat writes.
import { ts } from './walnut.js?v=9b9c1281';

export function chart(w, h, { xMax = 60, pad = { l: 6, r: 44, t: 8, b: 22 } } = {}) {
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const X = (s) => pad.l + (s / xMax) * iw;
  const Y = (v) => pad.t + (1 - v / 100) * ih;
  const d = (curve) => curve.map(([s, v], i) => `${i ? 'L' : 'M'}${X(s).toFixed(1)} ${Y(v).toFixed(1)}`).join('');
  const area = (curve) => `${d(curve)}L${X(curve[curve.length - 1][0]).toFixed(1)} ${Y(0).toFixed(1)}L${X(0).toFixed(1)} ${Y(0).toFixed(1)}Z`;
  const grid = [0, 50, 100].map((v) => `<line class="rc-gl" x1="${pad.l}" x2="${(w - pad.r + 4).toFixed(1)}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`
    + `<text class="rc-yl" x="${(w - pad.r + 10).toFixed(1)}" y="${(Y(v) + 4).toFixed(1)}">${v}%</text>`).join('');
  const xl = [0, 15, 30, 45, 60].map((s) => `<text class="rc-xl" x="${X(s).toFixed(1)}" y="${(h - 5).toFixed(1)}" text-anchor="${s === 0 ? 'start' : 'middle'}">${ts(s)}</text>`).join('');
  return { X, Y, d, area, axes: grid + xl, iw, ih, pad };
}
