// 5. "How's it doing?": Day 12, $10,642 (+6.4%), 7 wins 5 losses, best trade GME +8.4%. The balance sparkline and
// one dot per trade (green win, red loss) in the order they closed.
import { seg, outCubic, outBack, lerp } from '../../../lib.js';
import { stdTimes, workBeat, counter, equityChart, fmt } from './wk.js?v=1';

// daily closing balance, day 0 to day 12, and each day's trade (series.mjs)
const BAL = [10000, 10190, 10068, 10913, 10684, 10834, 10660, 10756, 10993, 10729, 10847, 10522, 10642];
const SEQ = [1.9, -1.2, 8.4, -2.1, 1.4, -1.6, 0.9, 2.2, -2.4, 1.1, -3.0, 1.1];

export default {
  times(r) {
    const T = stdTimes(r, 1, 2.2, 2.9);
    T.count = [T.body + 0.15, T.body + 1.2];
    T.draw = [T.body + 0.25, T.body + 1.6];
    T.dots = T.body + 0.6;
    T.best = T.body + 1.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const ch = equityChart({ W: 300, H: 84, series: [{ v: BAL.map((b) => (b / 100 - 100)), cls: 'eq-s', tag: '' }], lo: -2, hi: 10, ticks: [0, 5, 10], tags: false, L: 26, R: 6 });
    const w = workBeat(x, k, {
      say: 'Day 12 and it’s green. Here’s the clean report.',
      title: 'Paper account',
      sub: 'Day 12 of 14',
      steps: ['Pulled today’s fills and closing balance'],
      cls: 'wk-stt',
      body: `<div class="sr-top"><span class="sr-bal"><small>Balance, day 12</small><b>$10,000</b><em>+0.0%</em></span><span class="sr-spark">${ch.html}</span></div>
        <div class="sr-foot"><span class="sr-wl"><small>Trades</small><span class="sr-dots">${SEQ.map((v) => `<i class="${v > 0 ? 'w' : 'l'}"></i>`).join('')}</span><b>7 wins, 5 losses</b></span>
          <span class="sr-best"><small>Best trade</small><b>GME <em>+8.4%</em></b></span></div>`,
    });
    const bal = counter(w.q('.sr-bal b'), 10642, T.count[0], T.count[1], (v) => '$' + fmt(v), 10000);
    const chg = counter(w.q('.sr-bal em'), 6.4, T.count[0], T.count[1], (v) => '+' + v.toFixed(1) + '%');
    const svg = w.q('svg.eq'), dots = w.qa('.sr-dots i'), best = w.q('.sr-best');
    return {
      nodes: [w.sayEl, w.card],
      marks: w.marks,
      render(t) {
        w.render(t);
        bal(t); chg(t);
        ch.render(svg, seg(t, T.draw[0], T.draw[1]), 1);
        dots.forEach((d, i) => { const p = seg(t, T.dots + i * 0.07, T.dots + i * 0.07 + 0.3); d.style.opacity = outCubic(p).toFixed(3); d.style.transform = `scale(${lerp(0.2, 1, outBack(p)).toFixed(4)})`; });
        const b = seg(t, T.best, T.best + 0.4);
        best.style.opacity = outCubic(b).toFixed(3);
        best.style.transform = b >= 1 ? '' : `translateY(${((1 - outCubic(b)) * 8).toFixed(2)}px)`;
      },
    };
  },
};
