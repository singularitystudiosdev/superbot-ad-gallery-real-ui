// Turn three, still the same thread: the model is switched a second time and Claude answers the next follow-up
// ("add a packing list for that trip"), which again depends on the whole conversation above it. The spot closes on
// the line that names what the viewer just watched: same thread, three models, nothing retyped. Pure function of t.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Packing list for the same three days.';
const LINES = ['Light layers and one rain jacket.', 'Comfortable shoes for the hills.', 'A day bag and a refillable bottle.'];
const CLOSE = 'Same thread, three models, nothing retyped.';

export default {
  times(r) {
    const T = { r };
    T.say0 = r + 0.06; T.say1 = T.say0 + 0.8;
    T.card = r + 0.9; T.cardOn = T.card + 0.45;
    T.close = T.cardOn + LINES.length * 0.16 + 0.4;
    T.end = T.close + 0.55 + 1.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qc-draft"><b>Packing list · Claude</b>${LINES.map((l) => `<span>${x.esc(l)}</span>`).join('')}</div>`);
    const close = x.el(`<div class="qc-close">${x.esc(CLOSE)}</div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rows = [...card.querySelectorAll('span')];
    let shown = -1;
    return {
      nodes: [say, card, close],
      marks: [[T.r, say], [T.card, card], [T.close, close]],
      render(t) {
        const n = streamCount(SAY, T.say0, 40, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.cardOn));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        rows.forEach((row, i) => {
          const p = outCubic(seg(t, T.card + 0.18 + i * 0.16, T.card + 0.48 + i * 0.16));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
        });
        const cv = outCubic(seg(t, T.close, T.close + 0.45));
        close.style.opacity = cv.toFixed(3);
        close.style.transform = cv >= 1 ? 'none' : `translateY(${((1 - cv) * 8).toFixed(2)}px)`;
      },
    };
  },
};