// Polymarket, the odds: the October FOMC market in Polymarket's dark multi-outcome layout. The three outcomes rise
// in, their chances count up with a fill bar, and each carries its Yes / No prices in cents. Volume and prices are
// the spot's script, made up.
import { seg, outCubic } from '../../../lib.js';
import { say, chips, cardIn, rise } from './kit.js?v=1';

const SAY = 'Polymarket has a hike at 67% for the October meeting.';
const OUT = [
  { l: 'Hike', s: '25+ bps', p: 67 },
  { l: 'Hold', s: 'No change', p: 31 },
  { l: 'Cut', s: '25+ bps', p: 2 },
];

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25];
    T.chipDone = [r + 0.85];
    T.card = r + 0.75;
    T.rows = OUT.map((_, i) => T.card + 0.45 + i * 0.2);
    T.count = 1.0;
    T.end = T.card + 3.4;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const line = say(x, SAY, T.r + 0.05, 80);
    const ch = chips(x, [['Finding the October FOMC market', 'Found “Fed decision in October?”']], T.chipIn, T.chipDone);
    const card = x.el(`<div class="pm-card">
      <div class="pm-head"><img src="${x.brand('polymarket-icon.svg')}" alt=""/><span class="pm-t"><b>Fed decision in October?</b><small>$31.4M Vol. · FOMC · Ends Oct 28</small></span></div>
      <div class="pm-cols"><span>Outcome</span><span>Chance</span><span></span></div>
      ${OUT.map((o) => `<div class="pm-row"><span class="pm-o"><b>${o.l}</b><small>${o.s}</small><span class="pm-bar"><i></i></span></span><span class="pm-p"><b>0</b>%</span><span class="pm-btns"><i class="pm-yes">Yes ${o.p}¢</i><i class="pm-no">No ${100 - o.p}¢</i></span></div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.pm-row')].map((r) => ({ r, bar: r.querySelector('.pm-bar i'), n: r.querySelector('.pm-p b') }));
    return {
      nodes: [line.n, ...ch.rows, card],
      marks: [[T.r, line.n], ...ch.marks, [T.card, card]],
      render(t) {
        line.render(t);
        ch.render(t);
        cardIn(card, t, T.card);
        rows.forEach(({ r, bar, n }, i) => {
          const a = T.rows[i];
          rise(r, seg(t, a - 0.2, a + 0.25), 6);
          const p = outCubic(seg(t, a, a + T.count));
          bar.style.transform = `scaleX(${((OUT[i].p / 100) * p).toFixed(4)})`;
          const s = String(Math.round(OUT[i].p * p));
          if (n.textContent !== s) n.textContent = s;
          r.classList.toggle('lead', i === 0 && t >= a + T.count);
        });
      },
    };
  },
};
