// Cold-open ident, after the A24 teaser's opening card (its mark held over a live sea plate, ~1.5 s, no text).
// Here the plate is a slow-drifting two-glow gradient (composition, not sourced footage) and the subject is the
// superbot mark, blooming in on outQuint while the plate parallaxes. It replaces the ad's old cold open, which
// started straight on the empty app state; the spot's first text now arrives with the ask, one beat later.
import { seg, outQuint, outCubic } from '../lib.js';
import * as shell from '../shell.js';

const PLATE_IN = 0.45;   // the plate comes up from black
const MARK_IN = 0.9;     // the mark blooms in
const DRIFT = 3.2;       // px/s of parallax, the plate is still under prefers-reduced-motion

export default {
  id: 'title',
  dur: 1.6,

  mount(section) {
    section.innerHTML = `
<div class="title-cine">
  <i class="t-plate t-plate-a"></i><i class="t-plate t-plate-b"></i>
  <div class="t-mark"></div>
</div>`;
    const mark = shell.makeMark(236);
    section.querySelector('.t-mark').appendChild(mark.el);
    section._cine = { mark, a: section.querySelector('.t-plate-a'), b: section.querySelector('.t-plate-b') };
  },

  render(lt) {
    const e = document.getElementById('s-title')._cine;
    if (!e) return;
    const rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const t = Math.max(0, lt);
    const pin = rm ? 1 : outCubic(seg(t, 0, PLATE_IN));
    const a = rm ? 0 : t * DRIFT, b = rm ? 0 : t * DRIFT * -0.62;
    e.a.style.transform = `translate3d(${a.toFixed(2)}px,${(a * 0.4).toFixed(2)}px,0)`;
    e.b.style.transform = `translate3d(${b.toFixed(2)}px,${(b * 0.5).toFixed(2)}px,0)`;
    const m = rm ? 1 : outQuint(seg(t, 0.15, 0.15 + MARK_IN));
    e.mark.el.style.opacity = (pin * m).toFixed(3);
    e.mark.el.style.transform = `scale(${(0.86 + 0.14 * m).toFixed(4)})`;
    e.mark.render(t);
  },
};