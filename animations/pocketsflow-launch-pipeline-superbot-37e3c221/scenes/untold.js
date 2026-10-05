// untold: Act 2 of the pocketsflow spot. A pure black frame and one centred column of heavy condensed caps,
// THEY / WONT / TELL / YOU / HOW (the user's spelling, "WONT" verbatim), each word hard-cutting in on its own
// beat: no fade, a 1.06 -> 1 scale settle over 0.12s and a single-frame white bloom on the word that just landed.
// After HOW lands the column holds, then the last 0.12s cuts everything to black. render(lt) is a pure function
// of local time (?t=<s> freezes any frame); the column is laid out at 1080 stage px high and guarded against the
// stage width (window.AR via ctx.W), so it reads the same at 16:9, 4:3, 1:1 and 4:5.
import { seg, outCubic } from '../lib.js';

const WORDS = ['THEY', 'WONT', 'TELL', 'YOU', 'HOW'];
const FIRST = 0.25;         // the first word's cut
const STEP = 0.42;          // one word every STEP seconds
const SETTLE = 0.12;        // 1.06 -> 1 scale settle after each cut
const SCALE0 = 1.06;
const FRAME = 1 / 60;       // the engine's clock is quantised to 60fps: the bloom lives on exactly one frame
const BLACK = 0.12;         // the closing cut to black
const DUR = 3.2;            // HOW lands at 1.917, settles by 2.04, holds to 3.08, black to 3.2
const EPS = 1e-6;
const FIT_W = 0.86;         // the widest word never exceeds this share of the stage width

// each cut on the 60fps grid, a whole number of frames apart (STEP rounds to 25 frames, 0.417s):
// 0.25, 0.667, 1.083, 1.5, 1.917 (a frozen ?t= on those frames shows the bloom)
const FIRST_F = Math.round(FIRST / FRAME), STEP_F = Math.round(STEP / FRAME);
const landAt = (i) => (FIRST_F + i * STEP_F) * FRAME;
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Anton&display=block';

let el = null;

function injectFont() {
  if (document.querySelector('link[data-untold-font]')) return;
  for (const [rel, href, cross] of [
    ['preconnect', 'https://fonts.googleapis.com', false],
    ['preconnect', 'https://fonts.gstatic.com', true],
    ['stylesheet', FONT_HREF, false],
  ]) {
    const l = document.createElement('link');
    l.rel = rel; l.href = href;
    if (cross) l.crossOrigin = 'anonymous';
    l.setAttribute('data-untold-font', '');
    document.head.appendChild(l);
  }
}

export default {
  id: 'untold',
  dur: DUR,
  // a hint for the engine: this scene opens and closes on hard cuts, so the generic SCENE_FADE should not apply
  fade: 0,

  mount(section) {
    injectFont();
    section.innerHTML = `<div class="untold-col">${WORDS.map((w) => `<span class="untold-w">${w}</span>`).join('')}</div>`;
    el = {
      col: section.querySelector('.untold-col'),
      words: [...section.querySelectorAll('.untold-w')],
    };
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || (window.AR && window.AR.w) || 1920;

    // width guard: the words' layout widths ignore transforms, so this read is the same every frame at a given W
    // and font (a fallback face, or a very narrow stage, only ever shrinks the column, never grows it)
    const widest = Math.max(1, ...el.words.map((w) => w.offsetWidth));
    const fit = Math.min(1, (W * FIT_W) / widest);
    el.col.style.transform = fit < 1 ? `scale(${fit.toFixed(4)})` : 'none';

    // the closing cut: the whole column goes at once (per word, since a child's visibility overrides its parent's)
    const out = t >= DUR - BLACK - EPS;

    el.words.forEach((w, i) => {
      const at = landAt(i);
      const on = !out && t >= at - EPS;
      w.style.visibility = on ? 'visible' : 'hidden';
      if (!on) { w.classList.remove('flash'); w.style.transform = 'none'; return; }
      const p = outCubic(seg(t, at, at + SETTLE));
      const s = SCALE0 + (1 - SCALE0) * p;
      w.style.transform = p >= 1 ? 'none' : `scale(${s.toFixed(4)})`;
      // the one-frame bloom: the first 60fps frame at or after the cut
      w.classList.toggle('flash', t < at + FRAME - EPS);
    });
  },
};
