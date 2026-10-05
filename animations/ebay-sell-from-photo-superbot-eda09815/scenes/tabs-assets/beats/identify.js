// Gemini's answer: it names the camera from the two desk photos in one line, then a card with the condition notes
// and the eBay sold comps as a dot strip (38 sales, median line at $214, the list price marker at $219).
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { ITEM, COND, SOLD, STATS } from './listing.js';

// the strip's price axis, in the card's px
const AX = { lo: 158, hi: 296, w: 406, pad: 10, dot: 7, base: 46 };
const xOf = (v) => AX.pad + ((v - AX.lo) / (AX.hi - AX.lo)) * (AX.w - 2 * AX.pad);

// a beeswarm: each sale sits on the lowest row where it does not touch a dot already placed
function swarm(values) {
  const rows = [];
  return values.map((v) => {
    const x = xOf(v);
    let r = 0;
    while ((rows[r] || []).some((px) => Math.abs(px - x) < AX.dot + 0.6)) r++;
    (rows[r] = rows[r] || []).push(x);
    return { v, x, y: AX.base - AX.dot / 2 - r * (AX.dot + 0.6) };
  });
}

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.5;
    T.dots0 = T.card + 0.35;
    T.dots1 = T.dots0 + 0.6;
    T.med = T.dots1 + 0.05;
    T.mark = T.med + 0.2;
    T.end = T.mark + 0.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(ITEM)}</span></div>`);
    const dots = swarm(SOLD);
    const S = STATS;
    const card = x.el(`<div class="eb-gcard">
      <div class="eb-cond"><span class="eb-k">Condition</span><span class="eb-v">${x.esc(COND)}</span></div>
      <div class="eb-sold">
        <div class="eb-sold-h"><b>${S.n} sold in ${S.days} days</b><span>median $${S.median}, range $${S.lo} to $${S.hi}</span><i class="eb-src">eBay sold</i></div>
        <div class="eb-strip">
          <i class="eb-axis"></i>
          ${dots.map((d) => `<i class="eb-dot" style="left:${(d.x - AX.dot / 2).toFixed(1)}px;top:${(d.y - AX.dot / 2).toFixed(1)}px"></i>`).join('')}
          <i class="eb-med" style="left:${xOf(S.median).toFixed(1)}px"></i>
          <span class="eb-medl" style="left:${xOf(S.median).toFixed(1)}px">median $${S.median}</span>
          <span class="eb-tick" style="left:${xOf(S.lo).toFixed(1)}px">$${S.lo}</span>
          <span class="eb-tick" style="left:${xOf(S.hi).toFixed(1)}px">$${S.hi}</span>
          <i class="eb-mk" style="left:${xOf(S.price).toFixed(1)}px"></i>
          <span class="eb-mkl" style="left:${xOf(S.price).toFixed(1)}px">List at $${S.price}</span>
        </div>
      </div>
    </div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const dotEls = $$('.eb-dot'), cond = $('.eb-cond'), head = $('.eb-sold-h'), axis = $('.eb-axis');
    const med = $('.eb-med'), medl = $('.eb-medl'), ticks = $$('.eb-tick'), mk = $('.eb-mk'), mkl = $('.eb-mkl');
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(ITEM, T.r + 0.06, 75, t);
        if (n !== shown) { vis.textContent = ITEM.slice(0, n); hid.textContent = ITEM.slice(n); shown = n; }
        const ci = seg(t, T.card, T.card + 0.45);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - outCubic(ci)) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;
        rise(cond, seg(t, T.card + 0.08, T.card + 0.4), 6);
        rise(head, seg(t, T.card + 0.22, T.card + 0.55), 6);
        axis.style.transform = `scaleX(${outCubic(seg(t, T.dots0 - 0.15, T.dots0 + 0.3)).toFixed(4)})`;
        ticks.forEach((tk) => { tk.style.opacity = seg(t, T.dots0, T.dots0 + 0.3).toFixed(3); });
        // the sales land left to right, cheapest first
        dotEls.forEach((d, i) => {
          const a = T.dots0 + (i / (dotEls.length - 1)) * (T.dots1 - T.dots0 - 0.2);
          const p = seg(t, a, a + 0.2);
          d.style.opacity = Math.min(1, p * 2).toFixed(3);
          d.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.2, 1, outBack(p)).toFixed(3)})`;
        });
        const m = outCubic(seg(t, T.med, T.med + 0.3));
        med.style.transform = `translateX(-50%) scaleY(${m.toFixed(4)})`;
        medl.style.opacity = m.toFixed(3);
        const q = seg(t, T.mark, T.mark + 0.4);
        mk.style.transform = `translateX(-50%) scaleY(${outCubic(q).toFixed(4)})`;
        mkl.style.opacity = outCubic(q).toFixed(3);
        mkl.style.transform = `translate(-50%, ${((1 - outCubic(q)) * 6).toFixed(2)}px) scale(${lerp(0.7, 1, outBack(q)).toFixed(3)})`;
      },
    };
  },
};
