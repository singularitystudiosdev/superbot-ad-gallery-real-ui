// Gemini beat: the MANDO wraparound can label (generated with gemini-3-pro-image from the DeepSeek brief) stays
// blurred under the generating sweep while "Creating image" shows, and resolves only as that placeholder clears.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Here’s your MANDO can label.';

export default {
  times(r) {
    const T = { r };
    T.say = r + 0.02;
    T.card = r + 0.1;
    T.w0 = r + 0.14; T.w1 = r + 1.0;
    T.landed = T.w1;
    T.end = T.w1 + 0.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qc-img gm-img"><img src="${x.img('mando-label.webp')}" width="1584" height="672" alt="MANDO label"/><i class="qc-gen"></i><span class="qc-genl">${x.tile('gemini')}Creating image</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const im = card.querySelector('img'), gen = card.querySelector('.qc-gen'), genl = card.querySelector('.qc-genl');
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.say, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.say, 95, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.3));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;
        const p = seg(t, T.w0, T.w1), e = inOutCubic(p);
        im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 24).toFixed(2)}px) saturate(${lerp(0.35, 1, e).toFixed(3)})`;
        im.style.opacity = lerp(0.4, 1, e).toFixed(3);
        im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
        gen.style.transform = `translateX(${lerp(-110, 110, (p * 2) % 1).toFixed(1)}%)`;
        gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
        genl.style.opacity = (1 - seg(t, T.w1 - 0.42, T.w1 - 0.24)).toFixed(3);
      },
    };
  },
};
