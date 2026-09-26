// 2. The backtest: superbot pulls 90 days of prices, writes backtest.py, runs it, and draws the equity curve
// against SPY. Strategy +14.2% vs SPY +6.1%, 58% win rate, max drawdown -9.8%.
import { seg } from '../../../lib.js';
import { stdTimes, workBeat, counter, equityChart, pct, STRAT, SPY, XL } from './wk.js?v=1';

const KPI = [
  { l: 'Strategy', v: 14.2, f: (v) => pct(v), c: 'up' },
  { l: 'SPY', v: 6.1, f: (v) => pct(v), c: '' },
  { l: 'Win rate', v: 58, f: (v) => `${Math.round(v)}%`, c: '' },
  { l: 'Max drawdown', v: -9.8, f: (v) => pct(v), c: 'dn' },
];

export default {
  times(r) {
    const T = stdTimes(r, 3, 2.9, 3.3);
    T.kpi = [T.body + 0.2, T.body + 1.3];
    T.draw = [T.body + 0.35, T.body + 2.45];
    T.tags = [T.draw[1] - 0.05, T.draw[1] + 0.9];
    return T;
  },
  build(k, x) {
    const T = k.T;
    const ch = equityChart({ series: [{ v: STRAT, cls: 'eq-s', tag: '+14.2%' }, { v: SPY, cls: 'eq-p', tag: '+6.1%' }], xl: XL, lo: -4, hi: 16, ticks: [-4, 0, 4, 8, 12, 16], dd: [19, 31, 'Max DD -9.8%'] });
    const w = workBeat(x, k, {
      say: 'Pulled the prices, wrote it, ran it. The WSB pick beat the index.',
      title: 'Backtest',
      sub: 'Top WSB ticker, buy open, sell close, 90 days',
      steps: ['Pulled 90 days of daily open and close prices', 'Wrote <code>backtest.py</code>', 'Ran it on every trading day'],
      cls: 'wk-bt',
      body: `<div class="bt-kpis">${KPI.map((q) => `<span class="bt-kpi ${q.c}"><small>${q.l}</small><b>0</b></span>`).join('')}</div>
        <div class="bt-chart"><div class="bt-lg"><span class="lg-s"><i></i>Strategy</span><span class="lg-p"><i></i>SPY</span><em>Equity, % return</em></div>${ch.html}</div>`,
    });
    const kp = w.qa('.bt-kpi b').map((n, i) => counter(n, KPI[i].v, T.kpi[0] + i * 0.12, T.kpi[1] + i * 0.12, KPI[i].f));
    const svg = w.q('svg.eq');
    return {
      nodes: [w.sayEl, w.card],
      marks: w.marks,
      render(t) {
        w.render(t);
        kp.forEach((c) => c(t));
        ch.render(svg, seg(t, T.draw[0], T.draw[1]), seg(t, T.tags[0], T.tags[1]));
      },
    };
  },
};
