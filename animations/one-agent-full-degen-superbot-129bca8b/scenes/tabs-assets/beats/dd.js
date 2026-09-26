// 6. The DD post: a draft for r/wallstreetbets, flair DD, the backtest's equity curve attached. Drafted, not posted.
import { seg, outCubic } from '../../../lib.js';
import { stdTimes, workBeat, equityChart, STRAT, SPY, XL } from './wk.js?v=1';

const TITLE = 'I let an agent YOLO for me for 12 days. Here are the tendies.';

export default {
  times(r) {
    const T = stdTimes(r, 2, 2.2, 3.4);
    T.title = [T.body + 0.1, T.body + 0.9];
    T.draw = [T.body + 0.5, T.body + 1.7];
    return T;
  },
  build(k, x) {
    const T = k.T;
    const ch = equityChart({ W: 440, H: 104, series: [{ v: STRAT, cls: 'eq-s', tag: '+14.2%' }, { v: SPY, cls: 'eq-p', tag: 'SPY +6.1%' }], xl: XL, lo: -4, hi: 16, ticks: [0, 8, 16], R: 58 });
    const w = workBeat(x, k, {
      say: 'Drafted. Flair is DD, the chart is attached. Let them roast.',
      title: 'DD post',
      sub: 'Draft for r/wallstreetbets',
      steps: ['Wrote the post from the backtest and the paper run', 'Attached the equity curve'],
      cls: 'wk-dd',
      body: `<div class="dd-post">
          <div class="dp-hd"><span class="dp-sub">r/</span><b>r/wallstreetbets</b><span>u/sam</span><em>DD</em></div>
          <div class="dp-title"><span class="dp-vis"></span><span class="dp-hid">${x.esc(TITLE)}</span></div>
          <p class="dp-txt">Every morning the bot buys the most mentioned ticker on this sub at the open and sells at the close. Backtest: +14.2% vs SPY +6.1%, 58% win rate, -9.8% max drawdown. Paper run: day 12, $10,642, 7 W 5 L, best trade GME +8.4%. Roast me.</p>
          <div class="dp-img">${ch.html}</div>
          <div class="dp-ft"><span>Draft, not posted</span><span class="dp-btn">Post</span></div>
        </div>`,
    });
    const vis = w.q('.dp-vis'), hid = w.q('.dp-hid'), txt = w.q('.dp-txt'), svg = w.q('svg.eq');
    let shown = -1;
    return {
      nodes: [w.sayEl, w.card],
      marks: w.marks,
      render(t) {
        w.render(t);
        const n = Math.round(TITLE.length * seg(t, T.title[0], T.title[1]));
        if (n !== shown) { vis.textContent = TITLE.slice(0, n); hid.textContent = TITLE.slice(n); shown = n; }
        txt.style.opacity = outCubic(seg(t, T.title[1] - 0.2, T.title[1] + 0.3)).toFixed(3);
        ch.render(svg, seg(t, T.draw[0], T.draw[1]), seg(t, T.draw[1], T.draw[1] + 0.8));
      },
    };
  },
};
