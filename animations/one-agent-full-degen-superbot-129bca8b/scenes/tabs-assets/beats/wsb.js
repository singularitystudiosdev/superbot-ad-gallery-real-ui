// 1. "What's WSB buzzing about today?": superbot reads r/wallstreetbets and ranks the top 5 tickers by mentions.
import { seg, outCubic, lerp } from '../../../lib.js';
import { stdTimes, workBeat, counter, fmt } from './wk.js?v=1';

const TOP = [
  { s: 'GME', n: 'GameStop', v: 1912 },
  { s: 'INTC', n: 'Intel', v: 844 },
  { s: 'NVDA', n: 'NVIDIA', v: 731 },
  { s: 'SPY', n: 'S&P 500 ETF', v: 690 },
  { s: 'TSLA', n: 'Tesla', v: 402 },
];

export default {
  times(r) {
    const T = stdTimes(r, 2, 1.7, 2.7);
    T.rows = TOP.map((_, i) => [T.body + 0.15 + i * 0.13, T.body + 1.15 + i * 0.13]);
    T.hot = T.body + 1.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const w = workBeat(x, k, {
      say: 'WSB is loud today. Here are the top 5 tickers by mentions.',
      title: 'WSB scan',
      sub: 'r/wallstreetbets, last 24h',
      steps: ['Read today’s posts and comments on <b>r/wallstreetbets</b>', 'Counted every ticker mention'],
      cls: 'wk-wsb',
      body: `<div class="ws-h"><span>Ticker</span><span>Mentions</span></div>${TOP.map((q, i) => `<div class="ws-row"><span class="ws-rk">${i + 1}</span><span class="ws-tk"><b>${q.s}</b><small>${x.esc(q.n)}</small></span><span class="ws-bar"><i></i></span><span class="ws-n">0</span>${i === 0 ? '<em class="ws-hot"></em>' : ''}</div>`).join('')}`,
    });
    const rows = w.qa('.ws-row').map((r, i) => ({ r, bar: r.querySelector('.ws-bar i'), c: counter(r.querySelector('.ws-n'), TOP[i].v, T.rows[i][0], T.rows[i][1], (v) => fmt(v)) }));
    const hot = w.q('.ws-hot');
    return {
      nodes: [w.sayEl, w.card],
      marks: w.marks,
      render(t) {
        w.render(t);
        rows.forEach(({ r, bar, c }, i) => {
          const [a, z] = T.rows[i];
          r.style.opacity = outCubic(seg(t, a - 0.1, a + 0.25)).toFixed(3);
          bar.style.width = ((TOP[i].v / TOP[0].v) * 100 * outCubic(seg(t, a, z))).toFixed(2) + '%';
          c(t);
        });
        const h = seg(t, T.hot, T.hot + 0.4);
        hot.style.opacity = outCubic(h).toFixed(3);
        hot.style.transform = `scaleX(${lerp(0.4, 1, outCubic(h)).toFixed(4)})`;
      },
    };
  },
};
