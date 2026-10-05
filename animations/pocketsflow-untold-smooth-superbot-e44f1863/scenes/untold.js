// untold: Act 2. A black frame and one centred column of heavy condensed caps, THEY / WONT / TELL / YOU / HOW
// (the user's spelling, "WONT" verbatim). Each word eases up out of a blur on its own beat (outExpo, no cut, no
// flash), and the whole column drifts in a few percent across the act so the hold never sits dead still. In its
// last 0.8s the column lifts and blurs away while the hub dissolves in (timeline.js JOIN). render(lt) is pure in lt.
// Anton is linked by index.html.
import { seg, lerp, outExpo, inOutSine, rise } from '../lib.js';

const WORDS = ['THEY', 'WONT', 'TELL', 'YOU', 'HOW'];
const FIRST = 0.3;       // the first word starts rising
const STEP = 0.34;       // one word every STEP seconds
const LAND = 0.6;        // each word's rise
const DUR = 3.3;
const FIT_W = 0.86;      // the widest word never exceeds this share of the stage width

let el = null;

export default {
  id: 'untold',
  dur: DUR,

  mount(section) {
    section.innerHTML = `<div class="untold-col">${WORDS.map((w) => `<span class="untold-w">${w}</span>`).join('')}</div>`;
    el = { col: section.querySelector('.untold-col'), words: [...section.querySelectorAll('.untold-w')] };
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    // width guard (layout widths ignore transforms, so this read is stable at a given W and font)
    const widest = Math.max(1, ...el.words.map((w) => w.offsetWidth));
    const fit = Math.min(1, (W * FIT_W) / widest);
    const drift = lerp(1, 1.045, inOutSine(seg(t, 0, DUR)));
    // the exit: the column lifts and softens away while the hub dissolves in under it (no double exposure)
    const out = inOutSine(seg(t, DUR - 0.8, DUR - 0.1));
    el.col.style.transform = `translate3d(0,${(-46 * out).toFixed(2)}px,0) scale(${(fit * drift).toFixed(4)})`;
    el.col.style.opacity = (1 - out).toFixed(3);
    el.col.style.filter = out > 0 ? `blur(${(8 * out).toFixed(2)}px)` : 'none';
    el.words.forEach((w, i) => {
      const a = FIRST + i * STEP;
      rise(w, outExpo(seg(t, a, a + LAND)), 34, 12);
    });
  },
};
