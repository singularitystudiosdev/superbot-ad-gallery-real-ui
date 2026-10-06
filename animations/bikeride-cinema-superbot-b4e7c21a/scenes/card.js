// Tagline card on black, after the A24 teaser's "YOUR TICKET TO EVERYTHING A24" card (a small line over a big
// letterspaced one, black ground, no other image). It sits between the ride and the end card and names the
// spot's one claim, which is the ad's own thesis made explicit: the work is all visible. Holds ~0.7 s, then out.
import { seg, outCubic, inOutCubic } from '../lib.js';
import * as shell from '../shell.js';

const IN = 0.34, OUT = 0.34;
const HOLD = 1.5;

export default {
  id: 'card',
  dur: 1.5,

  mount(section) {
    section.innerHTML = `
<div class="card-cine">
  <div class="c-kicker"><span class="c-badge"></span>SUPERBOT</div>
  <h2 class="c-line">EVERY MODEL. ONE CHAT.</h2>
  <div class="c-rule"></div>
</div>`;
    const m = shell.makeMark(30);
    section.querySelector('.c-badge').appendChild(m.el);
    section._cine = { m, kicker: section.querySelector('.c-kicker'), line: section.querySelector('.c-line'), rule: section.querySelector('.c-rule') };
  },

  render(lt) {
    const e = document.getElementById('s-card')._cine;
    if (!e) return;
    const rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const t = Math.max(0, lt);
    const inn = rm ? 1 : outCubic(seg(t, 0.12, 0.12 + IN));
    const out = rm ? (t >= HOLD - OUT ? 1 : 0) : inOutCubic(seg(t, HOLD - OUT, HOLD));
    const vis = inn * (1 - out);
    const rise = (1 - inn) * 14;
    e.kicker.style.opacity = vis.toFixed(3);
    e.line.style.opacity = vis.toFixed(3);
    e.line.style.transform = `translateY(${rise.toFixed(2)}px)`;
    e.line.style.letterSpacing = `${(0.06 + 0.05 * inn).toFixed(3)}em`;
    e.rule.style.opacity = (vis * 0.7).toFixed(3);
    e.rule.style.transform = `scaleX(${(0.2 + 0.8 * inn).toFixed(3)})`;
    e.m.render(t);
  },
};