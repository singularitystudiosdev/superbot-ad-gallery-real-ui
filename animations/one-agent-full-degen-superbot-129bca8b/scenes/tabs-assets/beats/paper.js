// 4. Paper trading: superbot opens a $10,000 paper account and switches auto-trade ON for two weeks.
import { seg, outCubic, outBack, lerp } from '../../../lib.js';
import { stdTimes, workBeat, counter, fmt } from './wk.js?v=1';

export default {
  times(r) {
    const T = stdTimes(r, 2, 1.8, 2.7);
    T.count = [T.body + 0.15, T.body + 1.05];
    T.flip = T.body + 0.9;
    T.live = T.flip + 0.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const w = workBeat(x, k, {
      say: 'Paper account is open. Auto-trade is on, no real money on the line.',
      title: 'Paper trading',
      sub: '2 weeks, simulated',
      steps: ['Opened a paper trading account', 'Wired the strategy to auto-trade'],
      cls: 'wk-pp',
      body: `<div class="pp-top"><span class="pp-bal"><small>Paper balance</small><b>$0.00</b></span><em class="pp-live"><i></i>Live</em></div>
        <div class="pp-rows">
          <div class="pp-row"><span>Auto-trade</span><span class="pp-auto"><b class="pp-onl">ON</b><span class="al-sw"><i></i></span></span></div>
          <div class="pp-row"><span>Strategy</span><b>Top WSB ticker, buy open, sell close</b></div>
          <div class="pp-row"><span>Runs</span><b>2 weeks, every market day</b></div>
        </div>`,
    });
    const bal = counter(w.q('.pp-bal b'), 10000, T.count[0], T.count[1], (v) => '$' + fmt(v, 2));
    const sw = w.q('.al-sw'), knob = w.q('.al-sw i'), onl = w.q('.pp-onl'), live = w.q('.pp-live');
    return {
      nodes: [w.sayEl, w.card],
      marks: w.marks,
      render(t) {
        w.render(t);
        bal(t);
        const f = seg(t, T.flip, T.flip + 0.3);
        knob.style.transform = `translateX(${(outCubic(f) * 14).toFixed(2)}px)`;
        sw.classList.toggle('on', f > 0.45);
        onl.style.opacity = outCubic(seg(t, T.flip + 0.1, T.flip + 0.4)).toFixed(3);
        const l = seg(t, T.live, T.live + 0.4);
        live.style.opacity = outCubic(l).toFixed(3);
        live.style.transform = `scale(${lerp(0.6, 1, outBack(l)).toFixed(4)})`;
        live.style.setProperty('--pulse', (0.5 + 0.5 * Math.sin((t - T.live) * 5)).toFixed(3));
      },
    };
  },
};
