// superbot-omni, the third ask: it cancels the two unused subscriptions. Four tool steps tick one by one (opened the
// first service's settings, cancelled it, opened the second's, cancelled it), then a result card lands: what it saved,
// $31 a month and $372 a year, with the two cancelled lines and the subscriptions total going from $94 to $63 a month.
// Pure function of t. Figures: ./data.js (invented).
import { seg, outCubic, rise, sayLine, money, CHECK } from './util.js';
import { UNUSED, UNUSED_TOTAL, SAVED_YEAR, SUBS_TOTAL } from './data.js';
import { outBack } from '../../../lib.js';

const [A, B] = UNUSED;
const SAY = `On it. Cancelling ${A.name} and ${B.name}:`;
const STEPS = [
  [`Opening ${A.name} settings`, `Opened ${A.name} settings`],
  [`Cancelling ${A.name}`, `Cancelled ${A.name}`],
  [`Opening ${B.name} settings`, `Opened ${B.name} settings`],
  [`Cancelling ${B.name}`, `Cancelled ${B.name}`],
];

export default {
  times(r) {
    const T = { r };
    T.step = STEPS.map((_, i) => r + 0.3 + i * 0.42);
    T.stepDone = STEPS.map((_, i) => T.step[i] + 0.36);
    T.card = T.stepDone[STEPS.length - 1] + 0.1;
    T.end = T.card + 1.4;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const rows = STEPS.map(([run]) => x.el(`<div class="sw-step"><span class="sw-sp"></span><span class="sw-step-t">${x.esc(run)}</span></div>`));
    const card = x.el(`<div class="sv-card">
      <div class="sv-top">
        <span class="sv-ic"><svg viewBox="0 0 24 24"><path class="sv-p" d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
        <span class="sv-t"><small>Both cancelled</small><b>Saved ${money(UNUSED_TOTAL)}/mo <i>·</i> ${money(SAVED_YEAR)} a year</b></span>
      </div>
      <div class="sv-lines">
        ${UNUSED.map((s) => `<div class="sv-line"><span>${x.esc(s.name)}</span><em>Cancelled</em><b>−${money(s.price)}/mo</b></div>`).join('')}
      </div>
      <div class="sv-f"><span>Subscriptions</span><b><s>${money(SUBS_TOTAL)}</s> ${money(SUBS_TOTAL - UNUSED_TOTAL)}<small>/mo</small></b></div>
    </div>`);
    const icon = card.querySelector('.sv-ic'), path = card.querySelector('.sv-p');
    const lines = [...card.querySelectorAll('.sv-line')];
    return {
      nodes: [say.node, ...rows, card],
      marks: [[T.r, say.node], ...rows.map((r, i) => [T.step[i], r]), [T.card, card]],
      render(t) {
        say.update(t, T.r + 0.05, 75);
        rows.forEach((r, i) => {
          rise(r, seg(t, T.step[i], T.step[i] + 0.3), 6);
          const done = t >= T.stepDone[i];
          const sp = r.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.step[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? STEPS[i][1] : STEPS[i][0];
          if (r.lastElementChild.textContent !== lab) r.lastElementChild.textContent = lab;
        });
        const p = seg(t, T.card, T.card + 0.5);
        const e = outCubic(p);
        card.style.opacity = e.toFixed(3);
        card.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        icon.style.transform = `scale(${(0.5 + 0.5 * outBack(seg(t, T.card + 0.08, T.card + 0.42))).toFixed(3)})`;
        path.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.card + 0.14, T.card + 0.48)))).toFixed(2);
        lines.forEach((l, i) => rise(l, seg(t, T.card + 0.3 + i * 0.12, T.card + 0.6 + i * 0.12), 4));
      },
    };
  },
};
