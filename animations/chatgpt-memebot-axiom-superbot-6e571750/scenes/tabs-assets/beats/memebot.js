// "make me a memecoin trading bot", after superbot has connected Axiom: two work cards in one answer.
// 1. Backtest: 4 entry strategies over 90 days of Solana memecoin launches; the winner (Volume spike) is drawn
//    against simply holding SOL. Volume spike +38.6% vs SOL +7.4%, 61% win rate, max drawdown -8.8%.
// 2. Buy flags: superbot watches every new Axiom pair, scores it with the winning strategy, ranks the flagged
//    buys and pings the top one to you.
import { seg, outCubic, lerp } from '../../../lib.js';
import { stdTimes, workBeat, counter, equityChart } from './wk.js?v=2';

const pct = (v, d = 1) => `${v > 0 ? '+' : v < 0 ? '-' : ''}${Math.abs(v).toFixed(d)}%`;
const STRAT = [0,-0.16,0.19,1.29,1.7,2.85,3.89,5.15,5.63,6.69,7.72,9.16,9.21,10.65,11.62,13.04,13.53,14.82,13.36,12.36,12.25,11.78,10.15,9.39,8.39,8.23,7.12,6.54,5.7,4.67,5.37,6.03,7.17,8.82,10.39,11.58,12.53,14.24,15.55,16.64,17.3,18.76,19.02,19.24,19.58,21.51,22.8,23.79,24.23,25.96,27.69,29.21,29.42,29.75,31.02,32.5,33.89,35.61,36.46,36.86,37.06,38.36,38.6];
const SOL = [0,0.52,0.38,0.53,0.9,1.07,1.32,1.2,1.53,1.23,1.33,1.75,1.88,2.18,2.38,2.9,2.86,2.83,2.77,2.71,2.88,3.37,3.28,3.42,3.25,2.96,2.94,3.46,3.27,3.2,3.25,3.41,3.28,3.37,3.62,3.75,4.06,4.09,3.98,3.97,3.99,4.47,4.9,4.94,4.67,4.54,4.33,4.54,5.06,5.55,6.06,5.98,5.86,5.52,5.39,5.51,5.38,5.26,5.75,5.86,6.38,6.9,7.4];
const XL = [[2, 'Jul 1'], [24, 'Aug 3'], [45, 'Sep 1'], [62, 'Sep 27']];

const KPI = [
  { l: 'Volume spike', v: 38.6, f: (v) => pct(v), c: 'up' },
  { l: 'Hold SOL', v: 7.4, f: (v) => pct(v), c: '' },
  { l: 'Win rate', v: 61, f: (v) => `${Math.round(v)}%`, c: '' },
  { l: 'Max drawdown', v: -8.8, f: (v) => pct(v), c: 'dn' },
];

const FLAGS = [
  { s: 'FROGE', n: 'Frog Emperor', v: 94 },
  { s: 'HAMSTR', n: 'Hamster', v: 88 },
  { s: 'BLORP', n: 'Blorp', v: 81 },
  { s: 'GIGACAT', n: 'Giga Cat', v: 76 },
];

export default {
  times(r) {
    const bt = stdTimes(r, 3, 2.9, 0.4);
    bt.kpi = [bt.body + 0.2, bt.body + 1.3];
    bt.draw = [bt.body + 0.35, bt.body + 2.45];
    bt.tags = [bt.draw[1] - 0.05, bt.draw[1] + 0.9];
    const fl = stdTimes(bt.end, 2, 2.7, 1.1);
    fl.rows = FLAGS.map((_, i) => [fl.body + 0.15 + i * 0.13, fl.body + 1.0 + i * 0.13]);
    fl.hot = fl.body + 1.05;
    fl.ping = fl.body + 1.45;
    return { r, bt, fl, end: fl.end };
  },
  build(k, x) {
    const { bt, fl } = k.T;
    const ch = equityChart({ series: [{ v: STRAT, cls: 'eq-s', tag: '+38.6%' }, { v: SOL, cls: 'eq-p', tag: '+7.4%' }], xl: XL, lo: -5, hi: 40, ticks: [0, 10, 20, 30, 40], dd: [17, 29, 'Max DD -8.8%'] });
    const a = workBeat(x, { T: bt }, {
      say: 'Connected. I backtested 4 strategies on the last 90 days. Volume spike wins.',
      title: 'Backtest',
      sub: '4 strategies, 90 days of Solana memecoins',
      steps: ['Read your <b>Axiom</b> trade history', 'Pulled 90 days of new-pair launches', 'Ran <code>backtest.py</code> on 4 entry strategies'],
      cls: 'wk-bt',
      body: `<div class="bt-kpis">${KPI.map((q) => `<span class="bt-kpi ${q.c}"><small>${q.l}</small><b>0</b></span>`).join('')}</div>
        <div class="bt-chart"><div class="bt-lg"><span class="lg-s"><i></i>Volume spike</span><span class="lg-p"><i></i>Hold SOL</span><em>Equity, % return</em></div>${ch.html}</div>`,
    });
    const kp = a.qa('.bt-kpi b').map((n, i) => counter(n, KPI[i].v, bt.kpi[0] + i * 0.12, bt.kpi[1] + i * 0.12, KPI[i].f));
    const svg = a.q('svg.eq');

    const b = workBeat(x, { T: fl }, {
      say: 'Bot is live. I watch every new pair and flag the buys to you.',
      title: 'Buy flags',
      sub: 'Axiom, live, scored 0 to 100',
      steps: ['Watching every new pair on <b>Axiom</b>', 'Scoring each one with <b>Volume spike</b>'],
      cls: 'wk-fl',
      body: `<div class="ws-h"><span>Flagged buy</span><span>Score</span></div>${FLAGS.map((q, i) => `<div class="ws-row"><span class="ws-rk">${i + 1}</span><span class="ws-tk"><b>$${q.s}</b><small>${x.esc(q.n)}</small></span><span class="ws-bar"><i></i></span><span class="ws-n">0</span>${i === 0 ? '<em class="ws-hot"></em>' : ''}</div>`).join('')}
        <div class="fl-ping"><span class="fl-bell"><svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg></span><span class="fl-tx"><b>Buy flag: $FROGE scored 94</b><small>Matches Volume spike. Tap to buy on Axiom.</small></span><span class="fl-buy">${x.tile('axiom')}Buy</span></div>`,
    });
    const rows = b.qa('.ws-row').map((r, i) => ({ r, bar: r.querySelector('.ws-bar i'), c: counter(r.querySelector('.ws-n'), FLAGS[i].v, fl.rows[i][0], fl.rows[i][1], (v) => String(Math.round(v))) }));
    const hot = b.q('.ws-hot'), ping = b.q('.fl-ping');

    return {
      nodes: [a.sayEl, a.card, b.sayEl, b.card],
      marks: [...a.marks, ...b.marks, [fl.ping, b.card]],
      render(t) {
        a.render(t);
        kp.forEach((c) => c(t));
        ch.render(svg, seg(t, bt.draw[0], bt.draw[1]), seg(t, bt.tags[0], bt.tags[1]));
        b.render(t);
        rows.forEach(({ r, bar, c }, i) => {
          const [s, z] = fl.rows[i];
          r.style.opacity = outCubic(seg(t, s - 0.1, s + 0.25)).toFixed(3);
          bar.style.width = (FLAGS[i].v * outCubic(seg(t, s, z))).toFixed(2) + '%';
          c(t);
        });
        const h = seg(t, fl.hot, fl.hot + 0.4);
        hot.style.opacity = outCubic(h).toFixed(3);
        hot.style.transform = `scaleX(${lerp(0.4, 1, outCubic(h)).toFixed(4)})`;
        const p = outCubic(seg(t, fl.ping, fl.ping + 0.45));
        ping.style.opacity = p.toFixed(3);
        ping.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px) scale(${lerp(0.96, 1, p).toFixed(4)})`;
      },
    };
  },
};
