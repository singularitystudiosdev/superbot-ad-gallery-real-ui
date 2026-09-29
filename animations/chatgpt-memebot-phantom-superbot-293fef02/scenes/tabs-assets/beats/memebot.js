// Ask 1's answer, once fomo is connected: two work cards and a summary, back to back.
//   1. Backtest: four strategies replayed on 90 days of Solana memecoins; KPIs count up, the equity lines draw.
//   2. Buy scan: eight trending tokens ranked by score; the three buys light up, the watch/skip rows dim out.
//   3. Summary: the plan in three lines and the question the user answers with ask 2.
// Every row is a real Solana memecoin tradable on fomo: the three the user named plus five from Jupiter's live
// top-trending list on 2026-09-28 (icons from their token metadata, see brand/CREDITS.txt). The watch/skip reasons
// are each coin's real 24h move that day, never a rug claim; the scores and every trade are mock UI.
import { lerp, seg, outCubic, outBack, rand, streamCount } from '../../../lib.js';
import { stdTimes, workBeat, counter, equityChart, grow } from './wk.js';

const N = 60;
// deterministic noisy climb from 0 to `end` (%), with a mid-run dip so the lines read as real equity curves
const curve = (end, seed, wob) => Array.from({ length: N }, (_, i) => {
  const x = i / (N - 1);
  const base = end * Math.pow(x, 1.35);
  const dip = -wob * 1.6 * Math.exp(-Math.pow((x - 0.46) / 0.07, 2));
  const n = i === 0 ? 0 : (rand(seed + i) - 0.5) * wob;
  return +(base + dip + n).toFixed(2);
});
const SERIES = [
  { v: curve(212, 11, 18), cls: 'eq-s', tag: '+212%' },
  { v: curve(148, 37, 14), cls: 'eq-v', tag: '+148%' },
  { v: curve(61, 71, 10), cls: 'eq-d', tag: '+61%' },
  { v: curve(18, 97, 6), cls: 'eq-p', tag: '+18%' },
];
SERIES.forEach((s, i) => { s.v[N - 1] = [212, 148, 61, 18][i]; });

const BUYS = [
  { tk: '$PAID', icon: 'paid.png', why: 'volume 14x in 3h', score: 94, act: 'buy' },
  { tk: '$STONK', icon: 'stonk.png', why: 'whale wallets buying', score: 88, act: 'buy' },
  { tk: '$JEANPHIL', icon: 'jeanphil.png', why: 'top fomo traders in', score: 81, act: 'buy' },
  { tk: '$neet', icon: 'neet.png', why: 'up 20% today, wait for a dip', score: 72, act: 'watch' },
  { tk: '$e/acc', icon: 'eacc.png', why: 'up 67% today, late entry', score: 64, act: 'watch' },
  { tk: '$CATE', icon: 'cate.png', why: 'flat today, no momentum', score: 47, act: 'skip' },
  { tk: '$BOME', icon: 'bome.png', why: 'down 4% today', score: 39, act: 'skip' },
  { tk: '$USELESS', icon: 'useless.png', why: 'down 13% today', score: 31, act: 'skip' },
];
const TAG = { buy: 'BUY', watch: 'WATCH', skip: 'SKIP' };

const SUM = [
  'Best backtest: <b>Momentum</b>, <em class="up">+212%</em> over 90 days, 61% win rate',
  'Flagged buys: <b>$PAID</b>, <b>$STONK</b>, <b>$JEANPHIL</b>',
  'Plan: <b>$2,000</b> each, take profits above <em class="up">+50%</em>, stop loss at <em class="dn">-15%</em>',
];
const SUM_SAY = "Here's the summary.";
const SUM_ASK = 'Want me to start trading?';

function times(r) {
  const A = stdTimes(r, 3, 2.1, 0.25);
  const B = stdTimes(A.end, 2, 2.5, 0.25); // eight rows land, then the verdicts
  const S = { r: B.end, card: B.end + 0.3 };
  S.lines = SUM.map((_, i) => S.card + 0.25 + i * 0.4);
  S.ask = S.lines[SUM.length - 1] + 0.5;
  S.end = S.ask + 1.1;
  return { A, B, S, end: S.end };
}

function build(k, x) {
  const { A, B, S } = k.T;

  // 1. backtest
  const chart = equityChart({ series: SERIES, lo: -30, hi: 240, ticks: [0, 100, 200], xl: [[0, 'Jul 1'], [29, 'Aug 1'], [N - 1, 'Sep 28']] });
  const bt = workBeat(x, { T: A }, {
    say: 'fomo is connected. Backtesting strategies before it trades a cent.',
    title: 'Backtesting strategies', sub: '90 days of Solana memecoins',
    steps: ['Read your fomo account: <b>$6,000</b> available', 'Replayed <b>4,812</b> memecoin launches', 'Tested <b>4</b> strategies'],
    body: `<div class="bt-kpis">
        <div class="bt-kpi"><small>Winner</small><b class="mb-name">Momentum</b></div>
        <div class="bt-kpi up"><small>Return</small><b class="k-ret">+0%</b></div>
        <div class="bt-kpi"><small>Win rate</small><b class="k-win">0%</b></div>
        <div class="bt-kpi dn"><small>Max drawdown</small><b class="k-dd">0%</b></div>
      </div>
      <div class="bt-chart"><div class="bt-lg"><span class="lg-s"><i></i>Momentum</span><span class="lg-v"><i></i>Volume spike</span><span class="lg-d"><i></i>Dip buy</span><span class="lg-p"><i></i>Hold SOL</span><em>90 days</em></div>${chart.html}</div>`,
  });
  const btSvg = bt.q('svg.eq');
  const kRet = counter(bt.q('.k-ret'), 212, A.body + 0.3, A.body + 1.5, (v) => `+${Math.round(v)}%`);
  const kWin = counter(bt.q('.k-win'), 61, A.body + 0.3, A.body + 1.3, (v) => `${Math.round(v)}%`);
  const kDd = counter(bt.q('.k-dd'), -18, A.body + 0.3, A.body + 1.1, (v) => `${Math.round(v)}%`);

  // 2. buy scan
  const rows = BUYS.map((b, i) => `<div class="ws-row mb-row mb-${b.act}"><i class="ws-hot"></i><span class="ws-rk">${i + 1}</span>
      <span class="ws-tk"><img class="mb-ti" src="${x.brand('tokens/' + b.icon)}" alt=""/><b>${b.tk}</b><small>${b.why}</small></span><span class="ws-bar"><i></i></span>
      <span class="mb-tag ${b.act}">${TAG[b.act]}</span><span class="ws-n">${b.score}</span></div>`).join('');
  const sc = workBeat(x, { T: B }, {
    say: 'Momentum wins. Now scanning live for buys that fit it.',
    title: 'Scanning for buys', sub: 'Trending on fomo, live',
    steps: ['Checked <b>1,284</b> trending tokens', 'Dropped <b>1,061</b> rugs, honeypots and dev dumps'],
    body: `<div class="ws-h"><span>Flagged tokens</span><span>Score</span></div>${rows}`,
    cls: 'mb-scan',
  });
  const scRows = sc.qa('.ws-row').map((n) => ({ n, bar: n.querySelector('.ws-bar i'), hot: n.querySelector('.ws-hot'), tag: n.querySelector('.mb-tag') }));

  // 3. summary
  const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SUM_SAY)}</span></div>`);
  const sum = x.el(`<div class="mb-sum"><div class="mb-sum-h"><img class="mb-gh" src="${x.brand('fomo-mark.png')}" alt=""/>Trading plan</div>
      ${SUM.map((s, i) => `<div class="mb-l"><i>${i + 1}</i><span>${s}</span></div>`).join('')}
      <div class="mb-ask">${SUM_ASK}</div></div>`);
  const lines = [...sum.querySelectorAll('.mb-l')], ask = sum.querySelector('.mb-ask');
  const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
  let shown = -1;

  const marks = [...bt.marks, [A.body + 0.4, bt.card], ...sc.marks, [B.body + 0.4, sc.card], [S.r, sayEl], [S.card, sum], ...S.lines.map((a) => [a, sum])];

  function render(t) {
    bt.render(t);
    chart.render(btSvg, seg(t, A.body + 0.25, A.body + 1.6), seg(t, A.body + 1.45, A.body + 2.1));
    kRet(t); kWin(t); kDd(t);

    sc.render(t);
    scRows.forEach((r, i) => {
      const a = B.body + 0.12 + i * 0.11, v = B.body + 1.3 + i * 0.07; // row lands at a, its verdict at v
      const buy = BUYS[i].act === 'buy';
      const p = outCubic(seg(t, a, a + 0.35));
      r.n.style.opacity = (p * (buy ? 1 : lerp(1, 0.5, seg(t, B.body + 1.9, B.body + 2.2)))).toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * -10).toFixed(2)}px)`;
      r.bar.style.width = (BUYS[i].score * outCubic(seg(t, a + 0.1, a + 0.7))).toFixed(1) + '%';
      const h = buy ? outCubic(seg(t, v, v + 0.3)) : 0;
      r.hot.style.opacity = h.toFixed(3);
      r.hot.style.transform = `scaleX(${lerp(0.9, 1, h).toFixed(4)})`;
      const g = outBack(seg(t, v, v + 0.35));
      r.tag.style.opacity = seg(t, v, v + 0.15).toFixed(3);
      r.tag.style.transform = `scale(${lerp(0.5, 1, g).toFixed(4)})`;
    });

    const n = streamCount(SUM_SAY, S.r + 0.05, 70, t);
    if (n !== shown) { vis.textContent = SUM_SAY.slice(0, n); hid.textContent = SUM_SAY.slice(n); shown = n; }
    const ci = outCubic(seg(t, S.card, S.card + 0.45));
    sum.style.opacity = ci.toFixed(3);
    sum.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
    lines.forEach((l, i) => grow(l, seg(t, S.lines[i], S.lines[i] + 0.35)));
    grow(ask, seg(t, S.ask, S.ask + 0.35));
  }

  return { nodes: [bt.sayEl, bt.card, sc.sayEl, sc.card, sayEl, sum], marks, render };
}

export default { times, build };
