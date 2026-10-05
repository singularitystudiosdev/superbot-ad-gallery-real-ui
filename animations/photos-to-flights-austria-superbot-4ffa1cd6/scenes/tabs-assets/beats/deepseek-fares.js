// DeepSeek V4 Flash's answer: the fares. The say line streams, then a comparison card: the six airport chips (from
// JFK, EWR to MUC, SZG, VIE), a fare counter that runs 0 to 1,248 over a blur of fare rows (the sound bed's whirr,
// cues read T.count / T.counted), then the table narrows to three rows, cheapest first, and the best row lights:
// Lufthansa LH 411 JFK-MUC nonstop $798, United EWR-MUC nonstop $846, Austrian JFK-VIE nonstop $871. Airline names
// are text. Every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

const SAY = 'Compared 1,248 round-trip fares, JFK and EWR to MUC, SZG and VIE, Nov 20 to 27.';
const TOTAL = 1248;
const ROWS = [
  { air: 'Lufthansa', fl: 'LH 411', route: 'JFK-MUC', price: 798, best: true },
  { air: 'United', fl: '', route: 'EWR-MUC', price: 846 },
  { air: 'Austrian', fl: '', route: 'JFK-VIE', price: 871 },
];
const BLUR = 9; // rows in the whirr strip

export default {
  times(r) {
    return { say: r + 0.02, card: r + 0.12, count: r + 0.3, counted: r + 1.55, narrow: r + 1.6, rows: r + 1.72, best: r + 2.15, end: r + 3.5 };
  },

  build(k, { el, esc }) {
    const T = k.T;
    const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const blur = Array.from({ length: BLUR }, (_, i) => `<span class="ds-sk"><i style="width:${[62, 48, 70, 55, 66, 44, 58, 72, 50][i]}px"></i><i></i><i></i><i style="width:${[34, 38, 30, 36, 32, 38, 34, 30, 36][i]}px"></i></span>`).join('');
    const rows = ROWS.map((w, i) => `<div class="ds-row${w.best ? ' ds-best' : ''}"><span class="ds-rank">${i + 1}</span><span class="ds-air"><b>${esc(w.air)}</b>${w.fl ? `<small>${esc(w.fl)}</small>` : ''}</span><span class="ds-rt">${esc(w.route)}</span><span class="ds-st">Nonstop</span><span class="ds-pr">$${w.price}</span>${w.best ? '<em class="ds-tag">Best</em>' : '<em class="ds-tag ds-tag-x"></em>'}</div>`).join('');
    const card = el(`<div class="ds-card">
  <div class="ds-top">
    <span class="ds-aps"><b>JFK</b><b>EWR</b><i>to</i><b>MUC</b><b>SZG</b><b>VIE</b></span>
    <span class="ds-cnt"><b class="ds-n">0</b><small>fares compared</small></span>
  </div>
  <i class="ds-bar"><i></i></i>
  <div class="ds-body">
    <div class="ds-head"><span></span><span>Airline</span><span>Route</span><span>Stops</span><span>Per person</span><span></span></div>
    <div class="ds-whirr"><div class="ds-strip">${blur}${blur}</div></div>
    <div class="ds-rows">${rows}</div>
  </div>
  <div class="ds-foot">Round trip, Fri Nov 20 to Fri Nov 27, 2 adults</div>
</div>`.replace(/>\s+</g, '><'));
    const q = (s) => card.querySelector(s), qa = (s) => [...card.querySelectorAll(s)];
    const n = {
      vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'), num: q('.ds-n'), bar: q('.ds-bar i'), whirr: q('.ds-whirr'),
      strip: q('.ds-strip'), rows: qa('.ds-row'), best: q('.ds-best'), tag: q('.ds-best .ds-tag'), aps: qa('.ds-aps b'), cnt: q('.ds-cnt'),
    };
    let lastSay = -1, lastN = -1;

    return {
      nodes: [say, card],
      marks: [[T.card, card]],
      render(t) {
        const c = Math.floor(clamp((t - T.say) * 110, 0, SAY.length));
        if (c !== lastSay) { n.vis.textContent = SAY.slice(0, c); n.hid.textContent = SAY.slice(c); lastSay = c; }

        const a = outCubic(seg(t, T.card, T.card + 0.32));
        card.style.opacity = a.toFixed(3);
        card.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 12).toFixed(2)}px)`;
        n.aps.forEach((b, i) => { b.style.opacity = seg(t, T.card + 0.1 + i * 0.04, T.card + 0.3 + i * 0.04).toFixed(3); });

        // the counter: fast, then easing into 1,248
        const cp = seg(t, T.count, T.counted);
        const v = Math.round(TOTAL * (1 - Math.pow(1 - cp, 2.2)));
        if (v !== lastN) { n.num.textContent = v.toLocaleString('en-US'); lastN = v; }
        n.bar.style.transform = `scaleX(${cp.toFixed(4)})`;
        n.cnt.classList.toggle('ds-done', t >= T.counted);

        // the whirr: fare rows stream past under a motion blur, then fold away for the three winners
        const w = 1 - inOutCubic(seg(t, T.narrow, T.narrow + 0.22));
        const on = seg(t, T.count - 0.05, T.count + 0.1);
        n.whirr.style.opacity = (on * w).toFixed(3);
        const speed = 1 - 0.75 * cp;
        n.strip.style.transform = `translateY(${(-(((t - T.count) * 520 * speed) % (BLUR * 24))).toFixed(1)}px)`;
        n.strip.style.filter = `blur(${(1.6 * (1 - cp)).toFixed(2)}px)`;

        n.rows.forEach((r, i) => {
          const p = outCubic(seg(t, T.rows + i * 0.1, T.rows + i * 0.1 + 0.3));
          r.style.opacity = p.toFixed(3);
          r.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 10).toFixed(2)}px)`;
        });
        n.best.classList.toggle('ds-lit', t >= T.best);
        const tg = outBack(seg(t, T.best, T.best + 0.3));
        n.tag.style.opacity = clamp(tg * 1.4).toFixed(3);
        n.tag.style.transform = `scale(${lerp(0.5, 1, tg).toFixed(4)})`;
      },
    };
  },
};
