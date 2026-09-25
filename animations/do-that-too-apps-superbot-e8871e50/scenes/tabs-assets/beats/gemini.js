// Gemini beat: "Here's your Muse meme." streams, then the meme resolves out of a blur under a sweeping band while
// the camera pushes onto it. Pure function of t (the tabs scene's local time).
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Here’s your Muse meme.';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.22;
    T.w0 = r + 0.3; T.w1 = T.w0 + 1.2;
    T.end = T.w1 + 0.85;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qc-img"><img src="${x.img('muse-meme.png')}" width="870" height="1024" alt="Muse meme"/><i class="qc-gen"></i><span class="qc-genl">${x.tile('gemini')}Creating image</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const im = card.querySelector('img'), gen = card.querySelector('.qc-gen'), genl = card.querySelector('.qc-genl');
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      cams: [[T.w0 - 0.1, 0.8, () => x.F.el(card, 1.4, 0.8)]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;
        const p = seg(t, T.w0, T.w1), e = outCubic(p);
        im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 18).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
        im.style.opacity = lerp(0.3, 1, e).toFixed(3);
        im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
        gen.style.transform = `translateX(${lerp(-110, 110, (p * 2) % 1).toFixed(1)}%)`;
        gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
        genl.style.opacity = (1 - seg(t, T.w1 - 0.25, T.w1)).toFixed(3);
      },
    };
  },
};
