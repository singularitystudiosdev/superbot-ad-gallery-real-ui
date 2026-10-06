// Blender beat: the can Blender modeled (Gemini's label UV-wrapped on a lathed 12 oz body) comes up as Cycles
// refines it, 1 -> 2 -> 4 -> 8 samples with the sample count on the render, then the denoised frame lands and the
// can sways on its turntable. Blender is a service switch: its progress is the pill's steps ("Rendering in Cycles"
// ticks as the clean frame lands, chat.js), so the card carries no media placeholder of its own.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { makeCan } from './can.js';

const SAY = 'Your can, modeled in 3D.';
const SPP = [1, 2, 4, 8];

export default {
  times(r) {
    const T = { r };
    T.say = r + 0.02;
    T.card = r + 0.06;
    T.pass = [r + 0.1, r + 0.18, r + 0.26, r + 0.34];
    T.clean = r + 0.52;
    T.landed = T.clean + 0.1;
    T.end = T.clean + 0.2;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qc-img bl-card"><span class="bl-cap"></span></div>`);
    const can = makeCan('bl-can');
    card.insertBefore(can.node, card.firstChild);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const cap = card.querySelector('.bl-cap');
    let shown = -1, lastCap = '';
    return {
      nodes: [say, card],
      marks: [[T.say, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.say, 95, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.28));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;
        // hard refreshes between raw passes (as Cycles redraws), then 8 spp resolves into the denoised frame
        const stage = t >= T.clean ? 5 : Math.max(0, T.pass.filter((p) => t >= p).length - 1) + (t >= T.pass[3] ? seg(t, T.clean - 0.13, T.clean) : 0);
        can.render(t, T.clean, stage);
        const c = t >= T.clean ? 'Cycles · denoised' : stage > 3 ? 'Cycles · denoising' : `Cycles · ${SPP[Math.floor(stage)]} spp`;
        if (c !== lastCap) { cap.textContent = c; lastCap = c; }
      },
    };
  },
};
