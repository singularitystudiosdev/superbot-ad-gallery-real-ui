// Beat I (13.20-14.80 s, 1.60 s): the end card, reusing the original's lock-up: the superbot mark scales in
// (shell.makeMark) and the wordmark "superbot" slides out from behind it, then the tagline and the domain fade up.
// "superbot.gg" is plain text, not a button. ASCII only, no em/en dash, no time-bound promise, no third-party handle.
// Pure function of lt.
import { dur } from './budget.js';
import { lerp, seg, op, outQuint } from '../lib.js';

// tuned so the card reads within the first ~0.35 s of the beat: the frame reviewer flagged frames 13.4-13.9 as
// near-black with the original 0.5/0.3/0.7 timing, because the end card is white-on-black and only the tiny mark was
// up while the wordmark still sat behind it.
const END_IN = 0.3;      // the mascot scales into place
const END_SLIDE = 0.45;  // the wordmark slides out from behind it
const TAG_IN = 0.42;     // the tagline + domain rise up once the lock-up has landed
const TAG_DUR = 0.34;

let el = null;

export default {
  id: 'i',
  dur: dur('i'),

  mount(section, ctx) {
    section.innerHTML = `
<div class="lock ask-end">
  <div class="words"><div class="end-slide"><h1>superbot</h1></div></div>
  <div class="face"></div>
</div>
<div class="end-tag">
  <p class="end-line">Three models race. superbot ships the patch that passes.</p>
  <span class="end-dom">superbot.gg</span>
</div>`;
    const face = section.querySelector('.face');
    const mark = ctx.shell.makeMark(200);
    face.appendChild(mark.el);
    el = {
      face, mark,
      slide: section.querySelector('.end-slide'),
      tag: section.querySelector('.end-tag'),
    };
  },

  render(lt) {
    if (!el) return;
    const f = seg(lt, 0, END_IN);
    op(el.face, f);
    el.face.style.transform = `scale(${lerp(0.5, 1, outQuint(f)).toFixed(4)})`;

    const w = seg(lt, 0.1, 0.1 + END_SLIDE);
    el.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
    op(el.slide, w);

    const tp = seg(lt, TAG_IN, TAG_IN + TAG_DUR);
    op(el.tag, tp);
    el.tag.style.transform = `translateY(${((1 - outQuint(tp)) * 14).toFixed(2)}px)`;

    el.mark.render(lt);
  },
};