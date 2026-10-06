// Cold open: the superbot mark centred over the ride's own establishing frame, a brand line typed in below it, then a
// hard cut into the chat. It is the A24 open (a wordmark over a live landscape, a line spoken over it) rebuilt in the
// ad's own material: the ask's own footage, the app's own type. The brief for this beat is open.js's own: no black
// card, no UI, just the place the ride lives and the line that names the product.
import { seg, outCubic, streamCount, op } from '../lib.js';
import * as shell from '../shell.js';

const LINE = 'EVERY MODEL. ONE CHAT.';
const BG = new URL('../img/bike/poster.jpg', import.meta.url).href;
const BG_IN = 1.0;        // the landscape eases up from black
const MARK_IN = 1.0;      // the mark fades in over it
const LINE_T0 = 1.6, LINE_CPS = 20;

let el = null;

export default {
  id: 'open',
  dur: 3.7,

  mount(section) {
    section.innerHTML = `
<div class="open-root">
  <img class="open-bg" alt="" src="${BG}"/>
  <div class="open-scrim"></div>
  <div class="open-center">
    <div class="open-mark"></div>
    <div class="open-line"><span class="open-vis"></span><i class="open-caret"></i></div>
  </div>
</div>`;
    const mark = shell.makeMark(156);
    section.querySelector('.open-mark').appendChild(mark.el);
    el = { section, mark, bg: section.querySelector('.open-bg'), line: section.querySelector('.open-line'),
      vis: section.querySelector('.open-vis'), caret: section.querySelector('.open-caret'),
      markBox: section.querySelector('.open-mark') };
  },

  render(lt) {
    if (!el) return;
    const t = Math.max(0, lt);
    // the landscape eases up from black and keeps a slow push (a live shot, not a freeze)
    const bgIn = outCubic(seg(t, 0.2, 0.2 + BG_IN));
    op(el.bg, bgIn);
    el.bg.style.transform = `scale(${(1.08 - 0.08 * bgIn).toFixed(4)})`;
    el.section.querySelector('.open-scrim').style.opacity = (0.55 * bgIn).toFixed(3);
    // the mark settles in over it
    const mIn = outCubic(seg(t, 0.9, 0.9 + MARK_IN));
    op(el.markBox, mIn);
    el.markBox.style.transform = `scale(${(0.88 + 0.12 * mIn).toFixed(4)})`;
    // the line types on below it
    const n = streamCount(LINE, LINE_T0, LINE_CPS, t);
    el.vis.textContent = LINE.slice(0, n);
    el.caret.style.opacity = n > 0 && n < LINE.length ? '1' : '0';
    el.mark.render(t);
  },
};