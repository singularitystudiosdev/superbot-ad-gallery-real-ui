// Superbot acts for Claude's answer: the hotel booking for night one. Three tool steps tick one by one (opened the
// hotel page, picked 1 night and 2 guests, booked with the saved card), then a confirmation card lands with the
// hotel photo, the dates, the guests and the night's price. Pure function of t. Hotel and booking: ./data.js (invented).
import { seg, outCubic, rise, sayLine, money } from './util.js';
import { HOTEL as H } from './data.js';
import { outBack } from '../../../lib.js';

const SAY = `On it. Booking night one at ${H.name}:`;
const STEPS = [
  [`Opening the ${H.name} page`, `Opened the ${H.name} page`],
  ['Picking 1 night, 2 guests', 'Picked 1 night, 2 guests'],
  ['Booking with your saved card', 'Booked with your saved card'],
];

export default {
  times(r) {
    const T = { r };
    T.step = STEPS.map((_, i) => r + 0.4 + i * 0.55);
    T.stepDone = STEPS.map((_, i) => T.step[i] + 0.45);
    T.card = T.stepDone[STEPS.length - 1] + 0.1;
    T.end = T.card + 1.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const rows = STEPS.map(([run]) => x.el(`<div class="sw-step"><span class="sw-sp"></span><span class="sw-step-t">${x.esc(run)}</span></div>`));
    const card = x.el(`<div class="bk-card">
      <div class="bk-ph"><img src="${x.img(H.photo)}" alt="${x.esc(H.name)}"/><span class="bk-badge"><svg viewBox="0 0 24 24"><path class="bk-p" d="M5 12.5l4.5 4.5L19 7.5"/></svg>Booking confirmed</span></div>
      <div class="bk-body">
        <div class="bk-nm"><b>${x.esc(H.name)}</b><span>${x.esc(H.area)}</span></div>
        <div class="bk-grid">
          <span><small>Dates</small><b>${H.dates}</b></span>
          <span><small>Stay</small><b>1 night, ${H.guests} guests</b></span>
          <span><small>Total</small><b>${money(H.night)}</b></span>
        </div>
        <div class="bk-f"><span>Saved card ending 4242</span><em>Ref ${H.ref}</em></div>
      </div>
    </div>`);
    const badge = card.querySelector('.bk-badge'), path = card.querySelector('.bk-p');
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
        const img = card.firstElementChild.firstElementChild;
        img.style.transform = p >= 1 ? '' : `scale(${(1.1 - 0.1 * e).toFixed(4)})`;
        badge.style.transform = `scale(${(0.7 + 0.3 * outBack(seg(t, T.card + 0.1, T.card + 0.45))).toFixed(3)})`;
        path.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.card + 0.16, T.card + 0.5)))).toFixed(2);
      },
    };
  },
};
