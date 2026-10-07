// GPT-6 Astra's beat: the vision step. Lena asked what the boom arm at 4:38 is; answering means reading one small
// detail of one frame, which is the job OpenAI's models are built to do by cropping and zooming into an image while
// they reason. The nest reads:
//   steps   "Opening the frame at 4:38" -> "Opened the frame at 4:38"
//           "Zooming into the arm and the mount" -> "Zoomed into the arm and the mount"
//   details the frame itself (img/frame-438.jpg, the same studio and the same man as the thumbnail); two crop boxes
//           land on it, then the view eases in on the mount, and the answer settles under it.
// Box rects are measured on img/frame-438.jpg (1920 x 1080). The clock fills exactly the original beat (reply +
// 1.564 s).
import { lerp, seg, outCubic, inOutCubic, esc } from '../../../lib.js';
import { stepHtml, mountStep, renderStep, rise } from '../thread-ui.js?v=48dc1fe1';

const W = 1920, H = 1080;
const BOXES = [
  { label: 'Boom arm', x0: 0, y0: 561, x1: 878, y1: 792, right: true }, // label at its clamp-free end, in view once zoomed
  { label: 'Mic mounted underneath', x0: 845, y0: 548, x1: 1135, y1: 1036, side: true }, // label beside it, clear of the arm
];
const ZOOM_AT = { x: 1000 / W, y: 830 / H, k: 2.0 }; // the eased push onto the arm and the mount, the face out of frame
export const ANSWER = 'Low-profile boom arm, mic mounted underneath';

export function times(r) {
  const T = {};
  T.s1 = r + 0.14;            // step one and the frame rise
  T.opened = r + 0.38;        // ...the frame is open
  T.s2 = r + 0.38;            // "Zooming into the arm and the mount"
  T.box = (i) => r + 0.46 + i * 0.16; // the crop boxes land
  T.zoom = r + 0.7;           // the view eases in on the mount
  T.zoomed = r + 1.084;
  T.verdict = r + 1.164;      // the answer under the frame
  T.tally = r + 1.244;        // "Ready for Lena's reply"
  T.end = r + 1.564;
  return T;
}

const pct = (v, of) => `${((v / of) * 100).toFixed(3)}%`;

export function build(k, x) {
  const { T } = k;
  const steps = x.el(`<ol class="sb-steps">${stepHtml('Opening the frame at 4:38')}${stepHtml('Zooming into the arm and the mount')}</ol>`);
  const [li1, li2] = steps.children;
  const s1 = mountStep(li1, ['Opening the frame at 4:38', 'Opened the frame at 4:38']);
  const s2 = mountStep(li2, ['Zooming into the arm and the mount', 'Zoomed into the arm and the mount']);
  const card = x.el(`<div class="sb-det fr-card">
    <div class="fr-view"><div class="fr-cam"><img src="${x.img('frame-438.jpg')}" alt=""/>
      ${BOXES.map((b) => `<span class="fr-box${b.right ? ' fr-r' : ''}${b.side ? ' fr-s' : ''}" style="left:${pct(b.x0, W)};top:${pct(b.y0, H)};width:${pct(b.x1 - b.x0, W)};height:${pct(b.y1 - b.y0, H)}"><i>${esc(b.label)}</i></span>`).join('')}
    </div><span class="fr-ts">4:38</span></div>
    <div class="fr-ans"><b>${esc(ANSWER)}.</b><span class="fr-for">Ready for Lena's reply</span></div>
  </div>`);
  const cam = card.querySelector('.fr-cam');
  const boxes = [...card.querySelectorAll('.fr-box')];
  const ans = card.querySelector('.fr-ans b'), forLena = card.querySelector('.fr-for');

  return {
    nodes: [steps, card],
    marks: [[T.s1, card.querySelector('.fr-view')], [T.verdict - 0.25, card.querySelector('.fr-ans')]],
    render(t) {
      renderStep(s1, t, T.s1, T.opened);
      renderStep(s2, t, T.s2, T.zoomed);
      rise(card, t, T.s1, 8);
      boxes.forEach((b, i) => {
        const p = outCubic(seg(t, T.box(i), T.box(i) + 0.3));
        b.style.opacity = p.toFixed(3);
        b.style.transform = p >= 1 ? 'none' : `scale(${lerp(1.06, 1, p).toFixed(4)})`;
      });
      const z = inOutCubic(seg(t, T.zoom, T.zoomed));
      cam.style.transformOrigin = `${(ZOOM_AT.x * 100).toFixed(2)}% ${(ZOOM_AT.y * 100).toFixed(2)}%`;
      cam.style.transform = z > 0 ? `scale(${lerp(1, ZOOM_AT.k, z).toFixed(4)})` : 'none';
      // the box outlines keep a constant on-screen weight while the view scales
      cam.style.setProperty('--fr-k', lerp(1, ZOOM_AT.k, z).toFixed(4));
      rise(ans, t, T.verdict, 6);
      rise(forLena, t, T.tally, 6);
    },
  };
}

export default { times, build };
