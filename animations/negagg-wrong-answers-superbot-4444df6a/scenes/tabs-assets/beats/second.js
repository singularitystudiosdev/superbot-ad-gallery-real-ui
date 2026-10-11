// The second answer, in the SAME thread. superbot runs the same ask past Claude without it being retyped
// (the composer's platform chip follows the routing chip). Claude's take stacks under ChatGPT's, so both
// answers sit one above the other in one conversation and the user picks one: the pointer presses "Use this"
// on the second take. Pure function of t.
import { clamp, lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Here is another take on the same ask.';
const LINES = ['Our app is live today.', 'One inbox for every account you keep.', 'Start free, upgrade when it earns it.'];
const CLOSE = 'Same ask, two models, one thread.';

export default {
  times(r) {
    const T = { r };
    T.say0 = r + 0.06; T.say1 = T.say0 + 0.8;
    T.card = r + 0.95; T.cardOn = T.card + 0.45;
    T.pick = T.cardOn + LINES.length * 0.16 + 0.2;
    T.close = T.pick + 0.55;
    T.end = T.close + 0.6 + 1.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qc-draft"><b>Second take · Claude</b>${LINES.map((l) => `<span>${x.esc(l)}</span>`).join('')}<span class="qc-pick"><i></i>Use this</span></div>`);
    const close = x.el(`<div class="qc-close">${x.esc(CLOSE)}</div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rows = [...card.querySelectorAll('span')].slice(0, LINES.length);
    const pick = card.querySelector('.qc-pick');
    const pickTick = pick.querySelector('i');
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
        const pv = outCubic(seg(t, T.cardOn, T.cardOn + 0.35));
        pick.style.opacity = pv.toFixed(3);
        const down = t >= T.pick && t < T.pick + 0.14 ? 1 - seg(t, T.pick + 0.05, T.pick + 0.14) : 0;
        pick.style.transform = `scale(${(1 - 0.07 * down).toFixed(3)})`;
        const tick = outBack(seg(t, T.pick + 0.06, T.pick + 0.4));
        pickTick.style.opacity = tick.toFixed(3);
        pickTick.style.transform = `scale(${lerp(0.3, 1, tick).toFixed(4)})`;
        const cv = outCubic(seg(t, T.close, T.close + 0.45));
        close.style.opacity = cv.toFixed(3);
        close.style.transform = cv >= 1 ? 'none' : `translateY(${((1 - cv) * 8).toFixed(2)}px)`;
      },
      pointer(t) {
        const a = T.pick - 0.35, b = T.pick + 0.6;
        if (t < a || t > b) return null;
        const bb = x.box(pick);
        const down = t >= T.pick && t < T.pick + 0.14 ? 1 - seg(t, T.pick + 0.05, T.pick + 0.14) : 0;
        return { x: bb.cx, y: bb.cy, p: down, v: 1 };
      },
    };
  },
};
