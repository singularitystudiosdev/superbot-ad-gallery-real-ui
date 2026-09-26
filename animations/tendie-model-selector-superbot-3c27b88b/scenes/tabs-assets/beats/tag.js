// Claude Haiku 4.5, cheap grunt work: 4,000 comments tagged bullish or bearish, the counter and the cost run up
// together, sample tags flick past, and GME lands at 71% bullish.
import { lerp, seg, outCubic, outBack } from '../../../lib.js';
import { sayer, rise, fmt, setText } from './kit.js';

const SAY = 'Bulk job, so the small fast model. Tagging now.';
const ROWS = [
  ['“GME 40c 10/17, see you on the moon”', 'bull'],
  ['“bag holding since 2021, send help”', 'bear'],
  ['“Fed hikes, I buy more. Simple.”', 'bull'],
];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.p0 = T.card + 0.35; T.p1 = T.p0 + 2.3;
    T.row = ROWS.map((_, i) => T.p0 + 0.3 + i * 0.55);
    T.res = T.p1 + 0.15;
    T.end = T.res + 1.4;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const card = x.el(`<div class="tt-card tg">
      <div class="tt-hd"><b>Sentiment pass</b><span class="tt-dim">r/wallstreetbets, last 4,000 comments</span></div>
      <div class="tg-prog"><div class="tg-bar"><i></i></div><div class="tg-nums"><span class="tg-n">0 / 4,000</span><span class="tg-cost">$0.00</span></div></div>
      <div class="tg-rows">${ROWS.map(([q, s]) => `<div class="tg-row"><span class="tg-q">${x.esc(q)}</span><span class="tg-tag ${s}">${s === 'bull' ? 'Bullish' : 'Bearish'}</span></div>`).join('')}</div>
      <div class="tg-res"><div class="tg-top"><b>GME</b><span class="tg-pct"><em>71%</em> bullish</span><small>29% bearish</small></div><div class="tg-split"><i class="g"></i><i class="r"></i></div></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const bar = $('.tg-bar i'), n = $('.tg-n'), cost = $('.tg-cost'), res = $('.tg-res'), g = $('.tg-split .g'), rr = $('.tg-split .r');
    const rows = [...card.querySelectorAll('.tg-row')];
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.5), 18);
        const p = seg(t, T.p0, T.p1), e = p * p * (3 - 2 * p) * 0.35 + p * 0.65;
        bar.style.transform = `scaleX(${e.toFixed(4)})`;
        setText(n, `${fmt(4000 * e)} / 4,000`);
        setText(cost, `$${(0.38 * e).toFixed(2)}`);
        card.classList.toggle('tg-full', p >= 1);
        rows.forEach((row, i) => {
          rise(row, seg(t, T.row[i], T.row[i] + 0.3), 6, 1);
          const tg = row.lastElementChild, tp = outBack(seg(t, T.row[i] + 0.2, T.row[i] + 0.5));
          tg.style.opacity = seg(t, T.row[i] + 0.2, T.row[i] + 0.35).toFixed(3);
          tg.style.transform = `scale(${lerp(0.6, 1, tp).toFixed(4)})`;
        });
        rise(res, seg(t, T.res, T.res + 0.45), 10);
        const s = outCubic(seg(t, T.res + 0.2, T.res + 1.0));
        g.style.width = `${(71 * s).toFixed(2)}%`;
        rr.style.width = `${(29 * s).toFixed(2)}%`;
      },
    };
  },
};
