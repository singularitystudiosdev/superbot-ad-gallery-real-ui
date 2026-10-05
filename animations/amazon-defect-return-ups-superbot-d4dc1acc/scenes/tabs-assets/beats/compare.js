// Perplexity Sonar lays the two ways out side by side: the Amazon return (full refund, free UPS pickup, refund on
// scan) against the Vortexa warranty (replacement jar only, 2 to 3 weeks, $14 to ship). The rows land in pairs, then
// the Amazon column takes the green check and the warranty column steps back.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { WAYS, SOURCES } from './returns.js';

const SAY = 'Compared both ways to get your money back.';
const YES = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const NO = '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg>';
// four of the six source dots: amazon.com, vortexa.com, reddit.com, ftc.gov
const SRC = [['a', '#ff9900', '#111'], ['V', '#e5e5ea', '#111'], ['r', '#ff4500', '#fff'], ['f', '#1d4ed8', '#fff']];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.row = [0, 1, 2].flatMap((i) => [T.card + 0.4 + i * 0.42, T.card + 0.58 + i * 0.42]);
    T.win = T.card + 1.85;
    T.end = T.win + 2.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="cp-card">
      <div class="cp-h"><b>Amazon return vs maker warranty</b><span class="cp-src">${SRC.map(([l, bg, c]) => `<i style="background:${bg};color:${c}">${l}</i>`).join('')}<small>${SOURCES} sources</small></span></div>
      <div class="cp-cols">${WAYS.map((w) => `<div class="cp-col${w.win ? ' cp-win' : ''}">
        <div class="cp-ch"><b>${x.esc(w.name)}</b><small>${x.esc(w.sub)}</small>${w.win ? `<span class="cp-best">${YES}Best way</span>` : ''}</div>
        ${w.rows.map((t) => `<div class="cp-row"><i class="cp-ic ${w.win ? 'cp-y' : 'cp-n'}">${w.win ? YES : NO}</i><span>${x.esc(t)}</span></div>`).join('')}
      </div>`).join('')}</div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const cols = $$('.cp-col'), best = $('.cp-best');
    // rows in reading order: Amazon 1, warranty 1, Amazon 2, warranty 2 ...
    const rows = [0, 1, 2].flatMap((i) => [cols[0].querySelectorAll('.cp-row')[i], cols[1].querySelectorAll('.cp-row')[i]]);
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.42));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        rows.forEach((rw, i) => {
          const p = outCubic(seg(t, T.row[i], T.row[i] + 0.3));
          rw.style.opacity = p.toFixed(3);
          rw.style.transform = p >= 1 ? '' : `translateX(${((1 - p) * -8).toFixed(2)}px)`;
        });
        const w = seg(t, T.win, T.win + 0.4);
        cols[0].style.setProperty('--win', outCubic(w).toFixed(3));
        cols[1].style.opacity = lerp(1, 0.5, outCubic(w)).toFixed(3);
        best.style.opacity = outCubic(w).toFixed(3);
        best.style.transform = `scale(${lerp(0.5, 1, outBack(w)).toFixed(4)})`;
      },
    };
  },
};
