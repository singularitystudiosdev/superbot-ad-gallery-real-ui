// Turn one. The ask is typed into the composer, superbot routes it to ChatGPT, and ChatGPT answers it with a
// normal, working answer: the first version of the trip plan, drawn as the same answer card every answer is drawn
// in. No failure state, no complaint on screen; the ad shows the feature. Pure function of t (the scene's local time).
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Three days in Lisbon, one district a day.';
const LINES = ['Day one: Alfama and the riverfront.', 'Day two: Belem and the market.', 'Day three: a Sintra day trip.'];

export default {
  times(r) {
    const T = { r };
    T.say0 = r + 0.06; T.say1 = T.say0 + 0.7;
    T.card = r + 0.9; T.cardOn = T.card + 0.45;
    T.end = T.cardOn + LINES.length * 0.16 + 1.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qc-draft"><b>Trip plan · ChatGPT</b>${LINES.map((l) => `<span>${x.esc(l)}</span>`).join('')}</div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rows = [...card.querySelectorAll('span')];
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
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
      },
    };
  },
};