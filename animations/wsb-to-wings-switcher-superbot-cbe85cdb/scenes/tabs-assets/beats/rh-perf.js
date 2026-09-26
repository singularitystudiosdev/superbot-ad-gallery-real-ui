// Robinhood, the check-in: back on Robinhood, the GME position (market value counting up, the green intraday line
// drawing on) and the week in three tiles: portfolio, SPY, and the gap, with a "Beat SPY" badge.
// 9.4 x $26.60 = $250.04 cost; +8.4% = +$21.03, $271.07 value. Portfolio +3.1% vs SPY +0.9% = 2.2 points.
import { seg, outCubic, outBack, lerp, rand } from '../../../lib.js';
import { say, chips, cardIn, rise } from './kit.js?v=1';

const SAY = 'GME is up 8.4%, +$21.03. Your portfolio is up 3.1% this week and beat SPY by 2.2 points.';
const VALUE = 271.07;
const TILES = [
  { l: 'Portfolio this week', v: '+3.1%' },
  { l: 'SPY this week', v: '+0.9%' },
  { l: 'You vs SPY', v: '+2.2 pts' },
];

function linePath(w, h) {
  const n = 48, pts = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const y = 0.86 - 0.72 * Math.pow(u, 1.15) + (rand(i + 7) - 0.5) * 0.12 + Math.sin(i * 0.9) * 0.03;
    pts.push([u * w, Math.min(0.97, Math.max(0.06, i === n - 1 ? 0.12 : y)) * h]);
  }
  return pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join('');
}

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25];
    T.chipDone = [r + 0.8];
    T.card = r + 0.7;
    T.count = [T.card + 0.3, T.card + 1.4];
    T.line = [T.card + 0.3, T.card + 1.5];
    T.tiles = TILES.map((_, i) => T.card + 1.3 + i * 0.2);
    T.badge = T.card + 2.1;
    T.say = T.card + 0.4;
    T.end = T.card + 4.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const line = say(x, SAY, T.r + 0.05, 75);
    const ch = chips(x, [['Checking your GME position', 'Checked your GME position']], T.chipIn, T.chipDone);
    const d = linePath(356, 70);
    const card = x.el(`<div class="rp-card">
      <div class="rp-head"><span class="rp-tk"><img src="${x.brand('robinhood-logo.svg')}" alt=""/><b>GME</b><small>9.4 shares</small></span><em class="rp-badge">Beat SPY</em></div>
      <div class="rp-val"><b>$0.00</b><span class="rp-chg">+$21.03 (+8.4%) <small>Today</small></span></div>
      <svg class="rp-chart" viewBox="0 0 356 70" preserveAspectRatio="none"><path class="rp-base" d="M0 60.2H356"/><path class="rp-line" d="${d}" pathLength="1"/></svg>
      <div class="rp-tiles">${TILES.map((q, i) => `<span class="rp-tile${i === 2 ? ' win' : ''}"><small>${q.l}</small><b>${q.v}</b></span>`).join('')}</div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const val = $('.rp-val b'), chg = $('.rp-chg'), ln = $('.rp-line'), badge = $('.rp-badge');
    const tiles = [...card.querySelectorAll('.rp-tile')];
    return {
      nodes: [line.n, ...ch.rows, card],
      marks: [[T.r, line.n], ...ch.marks, [T.card, card]],
      render(t) {
        line.render(t);
        ch.render(t);
        cardIn(card, t, T.card);
        const c = outCubic(seg(t, T.count[0], T.count[1]));
        const s = '$' + (250.04 + (VALUE - 250.04) * c).toFixed(2);
        if (val.textContent !== s) val.textContent = s;
        rise(chg, seg(t, T.count[1] - 0.2, T.count[1] + 0.2), 4);
        ln.style.strokeDashoffset = (1 - outCubic(seg(t, T.line[0], T.line[1]))).toFixed(4);
        tiles.forEach((n, i) => rise(n, seg(t, T.tiles[i], T.tiles[i] + 0.35), 8));
        const b = seg(t, T.badge, T.badge + 0.4);
        badge.style.opacity = outCubic(b).toFixed(3);
        badge.style.transform = `scale(${lerp(0.5, 1, outBack(b)).toFixed(4)})`;
      },
    };
  },
};
