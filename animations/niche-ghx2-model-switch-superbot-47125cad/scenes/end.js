// scenes/end.js, beat F (5.85-6.80 s): the end card. The live superbot mark beside the "superbot" wordmark on the dark
// stage (the original ad's closing lock-up: wordmark left, mark right) and "superbot.gg" beneath. No button shape,
// no call to action. It fades up over the merged PR as the browser falls back (scenes/gh.js), 10 frames ease-out.
import { seg, outCubic, op } from '../lib.js';
import { makeMark, poseMark } from '../mark.js';

const DUR = 0.95;
const IN0 = -0.08, IN1 = IN0 + 10 / 30;

let el = null;

export default {
  id: 'end',
  dur: DUR,

  mount(section) {
    section.innerHTML = `
<div class="end-lock">
  <div class="end-row"><h1>superbot</h1><span class="end-mark"></span></div>
  <p>superbot.gg</p>
</div>`;
    el = { lock: section.querySelector('.end-lock'), url: section.querySelector('p') };
    el.mark = makeMark(section.querySelector('.end-mark'), 200);
  },

  render(lt, ctx, section) {
    if (!el) return;
    const on = lt >= IN0;
    section.classList.toggle('on', on);
    if (!on) { section.style.opacity = '0'; return; }
    const a = outCubic(seg(lt, IN0, IN1));
    section.style.opacity = a.toFixed(3); // the whole card (its stage too) fades up over the falling-back browser
    el.lock.style.transform = `translate(-50%, -50%) scale(${(0.94 + 0.06 * a).toFixed(4)})`;
    const u = outCubic(seg(lt, IN0 + 0.12, IN1 + 0.12));
    op(el.url, u);
    el.url.style.transform = `translateY(${((1 - u) * 14).toFixed(2)}px)`;
    poseMark(el.mark, ctx.t);
  },
};
