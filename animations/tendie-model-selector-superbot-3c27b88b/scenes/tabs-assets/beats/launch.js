// Claude Sonnet 5, analysis: launch day, reported cleanly. Four stats count up and the visitors-by-hour line draws.
import { seg, outCubic, outBack, lerp } from '../../../lib.js';
import { sayer, rise, fmt, setText } from './kit.js';

const SAY = 'Strong first day. Here is the clean read.';
const SPARK = [2, 3, 2, 5, 9, 14, 22, 30, 41, 38, 52, 61, 58, 70, 66, 74];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.c0 = T.card + 0.35; T.c1 = T.c0 + 1.3;
    T.end = T.c1 + 1.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const W = 400, H = 44, mx = Math.max(...SPARK);
    const pts = SPARK.map((v, i) => `${((i / (SPARK.length - 1)) * W).toFixed(1)},${(H - 3 - (v / mx) * (H - 8)).toFixed(1)}`).join(' ');
    const card = x.el(`<div class="tt-card ls">
      <div class="tt-hd"><b>tendietracker.app</b><span class="tt-dim">since launch this morning</span></div>
      <div class="ls-grid">
        <div class="ls-k"><small>Visitors</small><b class="ls-v">0</b></div>
        <div class="ls-k"><small>Signups</small><b class="ls-s">0</b></div>
        <div class="ls-k"><small>Top ticker viewed</small><b class="ls-t">GME</b></div>
        <div class="ls-k"><small>Avg session</small><b class="ls-a">0m 00s</b></div>
      </div>
      <svg class="ls-sp" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" pathLength="1"/></svg>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const v = $('.ls-v'), s = $('.ls-s'), tk = $('.ls-t'), a = $('.ls-a'), line = $('.ls-sp polyline');
    const tiles = [...card.querySelectorAll('.ls-k')];
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.5), 18);
        tiles.forEach((n, i) => rise(n, seg(t, T.card + 0.15 + i * 0.1, T.card + 0.5 + i * 0.1), 8, 1));
        const e = outCubic(seg(t, T.c0, T.c1));
        setText(v, fmt(1284 * e));
        setText(s, fmt(212 * e));
        const sec = Math.round(220 * e);
        setText(a, `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`);
        const tp = seg(t, T.c1 - 0.3, T.c1 + 0.1);
        tk.style.opacity = tp.toFixed(3);
        tk.style.transform = `scale(${lerp(0.6, 1, outBack(tp)).toFixed(4)})`;
        line.style.strokeDasharray = '1 1';
        line.style.strokeDashoffset = (1 - outCubic(seg(t, T.c0, T.c1 + 0.2))).toFixed(4);
      },
    };
  },
};
