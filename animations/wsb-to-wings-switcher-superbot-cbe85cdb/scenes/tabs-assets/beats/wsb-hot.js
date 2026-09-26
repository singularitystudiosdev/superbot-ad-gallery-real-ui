// Reddit, the scan: r/wallstreetbets Hot and the Daily Discussion thread are read, then a ranked "most mentioned
// today" card rises in Reddit's dark layout and the five tickers' bars grow as their mention counts tick up.
// The counts are the spot's script, made up.
import { seg, outCubic, outBack, lerp } from '../../../lib.js';
import { comma, say, chips, cardIn, rise } from './kit.js?v=1';

const SAY = 'Here’s what r/wallstreetbets is losing it over today.';
export const TICKERS = [
  { s: 'GME', n: 1912, tag: 'Hot' },
  { s: 'INTC', n: 844 },
  { s: 'NVDA', n: 731 },
  { s: 'SPY', n: 690 },
  { s: 'TSLA', n: 402 },
];

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25, r + 0.6];
    T.chipDone = [r + 0.8, r + 1.35];
    T.card = r + 1.25;
    T.rows = TICKERS.map((_, i) => T.card + 0.4 + i * 0.16);
    T.count = 1.1;
    T.tag = T.card + 1.7;
    T.end = T.card + 3.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const line = say(x, SAY, T.r + 0.05, 80);
    const ch = chips(x, [
      ['Reading r/wallstreetbets Hot', 'Read r/wallstreetbets Hot'],
      ['Scanning the Daily Discussion thread', 'Scanned 14,210 comments in the Daily Discussion'],
    ], T.chipIn, T.chipDone);
    const card = x.el(`<div class="wh-card">
      <div class="wh-head"><img src="${x.brand('reddit-logo.svg')}" alt=""/><span class="wh-sub"><b>r/wallstreetbets</b><small>Hot + Daily Discussion · today</small></span><em>Most mentioned</em></div>
      <div class="wh-rows">${TICKERS.map((q, i) => `<div class="wh-row"><span class="wh-rank">${i + 1}</span><b class="wh-tk">${q.s}</b>${q.tag ? `<i class="wh-tag">${q.tag}</i>` : ''}<span class="wh-track"><i></i></span><span class="wh-n"><b>0</b> mentions</span></div>`).join('')}</div>
    </div>`);
    const rows = [...card.querySelectorAll('.wh-row')].map((r) => ({ r, bar: r.querySelector('.wh-track i'), n: r.querySelector('.wh-n b') }));
    const tag = card.querySelector('.wh-tag');
    const max = TICKERS[0].n;
    return {
      nodes: [line.n, ...ch.rows, card],
      marks: [[T.r, line.n], ...ch.marks, [T.card, card]],
      render(t) {
        line.render(t);
        ch.render(t);
        cardIn(card, t, T.card);
        rows.forEach(({ r, bar, n }, i) => {
          const a = T.rows[i];
          rise(r, seg(t, a - 0.15, a + 0.25), 6);
          const p = outCubic(seg(t, a, a + T.count));
          bar.style.transform = `scaleX(${((TICKERS[i].n / max) * p).toFixed(4)})`;
          const s = comma(TICKERS[i].n * p);
          if (n.textContent !== s) n.textContent = s;
        });
        const g = seg(t, T.tag, T.tag + 0.4);
        tag.style.opacity = outCubic(g).toFixed(3);
        tag.style.transform = `scale(${lerp(0.5, 1, outBack(g)).toFixed(4)})`;
      },
    };
  },
};
