// Claude Opus 5.5 again, design: the plain dashboard is wiped top to bottom by a scanline into a black and amber
// terminal with monospace tickers, then the green and red sentiment bars grow in.
import { seg, outCubic } from '../../../lib.js';
import { sayer, rise } from './kit.js';

const SAY = 'Terminal mode. Black, amber, monospace, sentiment bars.';
const ROWS = [
  ['GME', '4,812', '$27.41', '+6.2%', 71], ['AMC', '2,103', '$4.18', '-1.4%', 38], ['TSLA', '1,977', '$251.30', '+2.1%', 58],
  ['NVDA', '1,466', '$142.05', '+0.8%', 64], ['PLTR', '1,102', '$41.77', '-2.3%', 45],
];
const BANNER = 'Fed +25 bps, Oct hike odds 67%';
const dash = (x, cls) => `<div class="dz ${cls}">
  <div class="dz-ban">${x.esc(BANNER)}</div>
  <div class="dz-top"><b>TENDIETRACKER</b><span>WSB mentions vs price</span></div>
  <div class="dz-th"><span>Ticker</span><span>Mentions</span><span>Price</span><span>Chg</span><span>Sentiment</span></div>
  ${ROWS.map(([tk, m, p, c, s]) => `<div class="dz-tr"><b>${tk}</b><span>${m}</span><span>${p}</span><span class="${c[0] === '-' ? 'dn' : 'up'}">${c}</span><span class="dz-sent"><i class="g" data-w="${s}"></i><i class="r" data-w="${100 - s}"></i></span></div>`).join('')}
</div>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.w0 = T.card + 0.75; T.w1 = T.w0 + 0.9;
    T.b0 = T.w1 + 0.05; T.b1 = T.b0 + 0.9;
    T.end = T.b1 + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const card = x.el(`<div class="tt-card dzc"><div class="dz-frame"><div class="dz-url"><i></i><i></i><i></i><span>tendietracker.app</span></div><div class="dz-stack">${dash(x, 'dz-plain')}${dash(x, 'dz-term')}<i class="dz-scan"></i></div></div></div>`);
    const term = card.querySelector('.dz-term'), scan = card.querySelector('.dz-scan');
    const bars = [...term.querySelectorAll('.dz-sent i')];
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.5), 18);
        const w = outCubic(seg(t, T.w0, T.w1));
        term.style.clipPath = w >= 1 ? 'none' : `inset(0 0 ${((1 - w) * 100).toFixed(2)}% 0)`;
        scan.style.top = `${(w * 100).toFixed(2)}%`;
        scan.style.opacity = (w > 0 && w < 1 ? 1 : 0).toString();
        bars.forEach((b, i) => {
          const q = outCubic(seg(t, T.b0 + Math.floor(i / 2) * 0.08, T.b0 + Math.floor(i / 2) * 0.08 + 0.6));
          b.style.width = `${(q * Number(b.dataset.w)).toFixed(2)}%`;
        });
      },
    };
  },
};
