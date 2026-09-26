// TradingView, the chart: GME on the daily, TradingView's dark chart (its candle greens/reds, grid and right price
// scale). The candles sweep in left to right, the 50-day moving average draws on, then three green insider-buy
// flags drop onto the lows. The price series is a deterministic made-up walk that closes at $26.60.
import { seg, outCubic, outBack, lerp, rand } from '../../../lib.js';
import { say, chips, cardIn, rise, ICON } from './kit.js?v=1';

const SAY = 'GME daily with the 50-day MA. The three insider buys are flagged in green.';
const N = 64, PRE = 50, VW = 396, VH = 176, AXIS = 38, PAD = 10;
const LAST = 26.6;
const FLAGS = [24, 33, 41];

// closes: a slide from the high 20s into a base near $21, then the recovery into $26.60
function series() {
  const raw = [];
  for (let i = 0; i < PRE + N; i++) {
    const u = i / (PRE + N - 1);
    const base = u < 0.62 ? lerp(29.4, 21.3, Math.pow(u / 0.62, 0.9)) : lerp(21.3, 26.2, Math.pow((u - 0.62) / 0.38, 1.3));
    raw.push(base + (rand(i + 3) - 0.5) * 1.3 + Math.sin(i * 0.7) * 0.35);
  }
  const fix = LAST - raw[raw.length - 1];
  const c = raw.map((v, i) => v + fix * Math.pow(i / (raw.length - 1), 3));
  const bars = [];
  for (let i = 1; i < c.length; i++) {
    const o = c[i - 1] + (rand(i + 91) - 0.5) * 0.4, cl = c[i];
    bars.push({ o, c: cl, h: Math.max(o, cl) + rand(i + 17) * 0.55, l: Math.min(o, cl) - rand(i + 29) * 0.55 });
  }
  const ma = c.map((_, i) => (i < 49 ? null : c.slice(i - 49, i + 1).reduce((a, b) => a + b, 0) / 50));
  return { bars: bars.slice(-N), ma: ma.slice(-N) };
}

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25];
    T.chipDone = [r + 0.85];
    T.card = r + 0.75;
    T.sweep = [T.card + 0.3, T.card + 1.5];
    T.ma = [T.card + 1.35, T.card + 2.25];
    T.flags = FLAGS.map((_, i) => T.card + 2.3 + i * 0.28);
    T.legend = T.card + 3.2;
    T.end = T.card + 4.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const line = say(x, SAY, T.r + 0.05, 85);
    const ch = chips(x, [['Opening GME on TradingView', 'Opened NYSE:GME on the daily chart']], T.chipIn, T.chipDone);
    const { bars, ma } = series();
    const lo = Math.min(...bars.map((b) => b.l)) - 1.5, hi = Math.max(...bars.map((b) => b.h)) + 0.5;
    const PW = VW - AXIS, step = (PW - PAD) / N;
    const X = (i) => PAD / 2 + step * (i + 0.5);
    const Y = (v) => 6 + (VH - 16) * (1 - (v - lo) / (hi - lo));
    const grid = [22, 24, 26, 28, 30].filter((v) => v > lo && v < hi);
    const candles = bars.map((b, i) => {
      const up = b.c >= b.o, top = Y(Math.max(b.o, b.c)), h = Math.max(0.8, Math.abs(Y(b.o) - Y(b.c)));
      return `<g class="${up ? 'tv-up' : 'tv-dn'}"><line x1="${X(i).toFixed(2)}" x2="${X(i).toFixed(2)}" y1="${Y(b.h).toFixed(2)}" y2="${Y(b.l).toFixed(2)}"/><rect x="${(X(i) - step * 0.34).toFixed(2)}" y="${top.toFixed(2)}" width="${(step * 0.68).toFixed(2)}" height="${h.toFixed(2)}"/></g>`;
    }).join('');
    const maD = ma.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(2)} ${Y(v).toFixed(2)}`).join('');
    // a flag planted under each insider-buy candle: the pole points up at the low, the cloth flies off its foot
    const flags = FLAGS.map((i) => `<g class="tv-flag" transform="translate(${X(i).toFixed(2)} ${(Y(bars[i].l) + 3).toFixed(2)})"><g class="tv-fl-in"><path class="tv-fl-pole" d="M0 0V22"/><path class="tv-fl-cloth" d="M0 11h12l-3 4 3 4H0Z"/></g></g>`).join('');
    const last = bars[N - 1];
    const card = x.el(`<div class="tv-card">
      <div class="tv-top"><img src="${x.brand('tradingview-icon.svg')}" alt=""/><span class="tv-sym"><b>GME</b><small>GameStop Corp. · 1D · NYSE</small></span><span class="tv-px"><b>${LAST.toFixed(2)}</b><small>+0.84 (+3.26%)</small></span></div>
      <div class="tv-legend"><span class="tv-ma-l"><i></i>MA 50 close <b>${ma[N - 1].toFixed(2)}</b></span><span class="tv-ins">${ICON.flag}3 insider buys</span></div>
      <svg class="tv-chart" viewBox="0 0 ${VW} ${VH}">
        <g class="tv-grid">${grid.map((v) => `<line x1="0" x2="${PW}" y1="${Y(v).toFixed(2)}" y2="${Y(v).toFixed(2)}"/><text x="${VW - 4}" y="${(Y(v) + 3.2).toFixed(2)}">${v.toFixed(2)}</text>`).join('')}<line class="tv-axis" x1="${PW}" x2="${PW}" y1="0" y2="${VH}"/></g>
        <g class="tv-candles">${candles}</g>
        <path class="tv-ma" d="${maD}" pathLength="1"/>
        <g class="tv-flags">${flags}</g>
        <g class="tv-last" transform="translate(${PW} ${Y(last.c).toFixed(2)})"><line x1="${-PW}" x2="0" y1="0" y2="0"/><rect x="0.5" y="-7" width="${AXIS - 1}" height="14" rx="2"/><text x="${AXIS / 2}" y="3.4">${last.c.toFixed(2)}</text></g>
      </svg>
      <div class="tv-tf">${['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y'].map((s) => `<span${s === '3M' ? ' class="on"' : ''}>${s}</span>`).join('')}</div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const cg = [...card.querySelectorAll('.tv-candles > g')];
    const maP = $('.tv-ma'), lastG = $('.tv-last'), legIns = $('.tv-ins'), legMa = $('.tv-ma-l');
    const fl = [...card.querySelectorAll('.tv-fl-in')];
    return {
      nodes: [line.n, ...ch.rows, card],
      marks: [[T.r, line.n], ...ch.marks, [T.card, card]],
      render(t) {
        line.render(t);
        ch.render(t);
        cardIn(card, t, T.card);
        const [a, z] = T.sweep, d = (z - a) / N;
        cg.forEach((g, i) => { g.style.opacity = outCubic(seg(t, a + i * d, a + i * d + 0.18)).toFixed(3); });
        lastG.style.opacity = outCubic(seg(t, z - 0.1, z + 0.25)).toFixed(3);
        maP.style.strokeDashoffset = (1 - outCubic(seg(t, T.ma[0], T.ma[1]))).toFixed(4);
        rise(legMa, seg(t, T.ma[0], T.ma[0] + 0.35), 4);
        fl.forEach((f, i) => {
          const p = seg(t, T.flags[i], T.flags[i] + 0.45);
          f.style.opacity = outCubic(seg(t, T.flags[i], T.flags[i] + 0.15)).toFixed(3);
          f.style.transform = `translateY(${((1 - outCubic(p)) * -10).toFixed(2)}px) scale(${lerp(0.4, 1, outBack(p)).toFixed(4)})`;
        });
        const g = seg(t, T.flags[2] + 0.15, T.flags[2] + 0.55);
        legIns.style.opacity = outCubic(g).toFixed(3);
        legIns.style.transform = `scale(${lerp(0.7, 1, outBack(g)).toFixed(4)})`;
      },
    };
  },
};
