// Quotes beat: superbot connects Finnhub and the live US quote stream comes up. Its line streams, a card rises (the
// Finnhub mark, name, a live dot) and under its header each position lands in its own square, staggered: ticker, last
// price ticking every QUOTE seconds, today's % in the data colours and a tiny intraday sparkline whose tail follows the
// tick; a sixth square reads '+ every US-listed symbol' (the grammar of the source's '+130 more' square).
// Prices are a deterministic function of t (quantised to the tick), so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Live US quotes are streaming in.';
// [symbol, previous close, today's % at the stream's start, drift in % a second]; NVDA is already sliding (-1.6%),
// which is where the portfolio picks it up later
export const SYMBOLS = [
  ['AAPL', 227.52, 0.38, 0.01],
  ['MSFT', 432.40, -0.28, -0.01],
  ['NVDA', 186.40, -1.62, -0.08],
  ['AMZN', 217.36, 0.86, 0.015],
  ['VOO', 549.30, -0.2, 0.0],
];
const CPS = 100;
const SAY_AT = 0.048;
const CARD_AT = 0.12;                // reply start to the card rising in
const RISE = 0.24;                   // the card and each square rising in
const TILE_AT = 0.28;                // reply start to the first square landing
const STAGGER = 0.08;                // one square to the next
const QUOTE = 0.14;                  // one trade print to the next (the price ticks on this grid)
const PTS = 28;                      // sparkline points across the session so far
const SPARK_W = 64, SPARK_H = 20;

// today's % for symbol i at (quantised) time q: the start value, a drift, and a small deterministic wiggle per tick
function pctAt(i, q) {
  const [, , p0, drift] = SYMBOLS[i];
  const tick = Math.floor(q / QUOTE);
  return p0 + drift * q + (rand(tick * 7 + i * 131) - 0.5) * 0.06;
}
// the intraday shape before the stream: a seeded walk that ends on the stream's first value
function history(i) {
  const pts = [];
  let v = 0;
  for (let j = 0; j < PTS; j++) { pts.push(v); v += (rand(i * 977 + j * 13) - 0.5) * 0.5; }
  const end = SYMBOLS[i][2];
  // bend the walk so it starts at 0% (the previous close) and lands on today's %
  return pts.map((p, j) => p - (pts[PTS - 1] - end) * (j / (PTS - 1)));
}
const HIST = SYMBOLS.map((_, i) => history(i));
const money = (v) => v.toFixed(2);
const pctTxt = (p) => `${p >= 0 ? '+' : '-'}${Math.abs(p).toFixed(2)}%`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.tile = [...SYMBOLS, 'more'].map((_, i) => r + TILE_AT + i * STAGGER);
    // the last visible landing: the '+ every US-listed symbol' square settles (prices keep ticking, it is a live feed)
    T.end = Math.max(T.tile[SYMBOLS.length] + RISE, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qt-card">
      <div class="qt-head"><img class="qt-logo" src="${x.brand('finnhub-logo.png')}" alt=""/><b>Finnhub</b><small>US stocks, real-time trades</small><em class="qt-live"><i></i>Live</em></div>
      <div class="qt-grid">${SYMBOLS.map(([s]) => `<figure class="qt-sq">
        <b class="qt-sym">${s}</b><span class="qt-px">0.00</span><span class="qt-pc">+0.00%</span>
        <svg class="qt-sp" viewBox="0 0 ${SPARK_W} ${SPARK_H}" preserveAspectRatio="none"><path class="qt-base" d="M0 0H${SPARK_W}"/><path class="qt-ln" d=""/></svg>
      </figure>`).join('')}
        <figure class="qt-sq qt-more"><span><b>+</b><small>every US-listed symbol</small></span></figure>
      </div>
    </div>`);
    const sqs = [...card.querySelectorAll('.qt-sq')];
    const rows = SYMBOLS.map((_, i) => {
      const n = sqs[i];
      return { n, px: n.querySelector('.qt-px'), pc: n.querySelector('.qt-pc'), ln: n.querySelector('.qt-ln'), base: n.querySelector('.qt-base'), key: '' };
    });
    // one row of six where the reply column is wide, 3x2 where it is narrow (4:5): picked once laid out
    let fitted = false;
    const fit = () => { if (fitted || !card.offsetWidth) return; fitted = true; if (card.offsetWidth < 520) card.classList.add('qt-narrow'); };
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        fit();
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(card, seg(t, T.card, T.card + RISE), 12);
        const q = Math.max(0, Math.floor((t - T.card) / QUOTE) * QUOTE);
        rows.forEach((m, i) => {
          rise(m.n, seg(t, T.tile[i], T.tile[i] + RISE), 10);
          const p = pctAt(i, q);
          const key = p.toFixed(4);
          if (key === m.key) return;
          m.key = key;
          m.px.textContent = money(SYMBOLS[i][1] * (1 + p / 100));
          m.pc.textContent = pctTxt(p);
          m.n.classList.toggle('dn', p < 0);
          // the sparkline: the session so far, its last point on the live tick; 0% (the previous close) as a hairline
          const pts = [...HIST[i].slice(1), p];
          const lo = Math.min(0, ...pts) - 0.2, hi = Math.max(0, ...pts) + 0.2;
          const y = (v) => (SPARK_H - 1 - ((v - lo) / (hi - lo)) * (SPARK_H - 2)).toFixed(2);
          m.ln.setAttribute('d', pts.map((v, j) => `${j ? 'L' : 'M'}${(j * SPARK_W / (PTS - 1)).toFixed(2)} ${y(v)}`).join(''));
          m.base.setAttribute('d', `M0 ${y(0)}H${SPARK_W}`);
        });
        rise(sqs[SYMBOLS.length], seg(t, T.tile[SYMBOLS.length], T.tile[SYMBOLS.length] + RISE), 10);
      },
    };
  },
};
