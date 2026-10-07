// untold.2459e0e7.js: act 2, kept beat for beat from 673c104b: THEY / WONT / TELL / YOU / HOW in Anton caps, one
// word every 25 frames from 0.25 s, each cutting in with a single-frame bloom and the closing 0.12 s cut to black.
// The settle is the only motion and it is now a critically damped spring from 1.06 (no linear tail), and the column
// keeps one optical centre as it grows, so the stack lands still.
import { seg, spring } from './lib.2459e0e7.js';

const WORDS = ['THEY', 'WONT', 'TELL', 'YOU', 'HOW'];
const FRAME = 1 / 60;
const FIRST_F = 15, STEP_F = 25;
const SETTLE = 0.16, SCALE0 = 1.06, BLACK = 0.12, DUR = 3.2, EPS = 1e-6;
const landAt = (i) => (FIRST_F + i * STEP_F) * FRAME;

let el = null;
export default {
  id: 'untold',
  dur: DUR,
  async mount(section) {
    section.innerHTML = `<div class="untold-col">${WORDS.map((w) => `<span class="untold-w">${w}</span>`).join('')}</div>`;
    el = { words: [...section.querySelectorAll('.untold-w')] };
    await document.fonts.load('400 188px Anton').catch((e) => console.warn('anton', e));
  },
  render(lt) {
    const out = lt >= DUR - BLACK - EPS;
    el.words.forEach((w, i) => {
      const at = landAt(i);
      const on = !out && lt >= at - EPS;
      w.style.visibility = on ? 'visible' : 'hidden';
      if (!on) { w.classList.remove('flash'); w.style.transform = ''; return; }
      const p = spring(lt - at, SETTLE);
      const s = SCALE0 + (1 - SCALE0) * p;
      w.style.transform = p > 0.999 ? '' : `scale(${s.toFixed(4)})`;
      w.classList.toggle('flash', lt < at + FRAME - EPS);
    });
  },
};
