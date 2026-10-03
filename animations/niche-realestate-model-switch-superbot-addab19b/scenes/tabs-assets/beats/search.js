// Search beat: Gemini searches the listing feeds around Westerville, OH. Its line streams and a card rises ("Searching
// homes for sale  ·  Westerville, OH"); the three filters land as chips ("3 bd", "Under $500k", "For sale"), the match
// count ticks up to 214 while a price histogram of the matches ($250k to $500k) rises bar by bar, and the spinner
// resolves to the check as the count lands. Pure function of t: every moving value is written from t, so ?t= and
// __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Found 214 homes for sale around Westerville, OH with 3 bedrooms under $500k.';
const LABEL = 'Searching homes for sale  ·  Westerville, OH';
const FILTERS = ['3 bd', 'Under $500k', 'For sale'];
const COUNT = 214;
// the matches by asking price, $25k bins from $250k to $500k (sums to 214)
const BINS = [6, 9, 14, 19, 24, 27, 29, 26, 22, 18, 12, 8];
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const CHIP_AT = 0.1;                   // the card landing to the first filter chip
const CHIP_STAGGER = 0.08;
const CHIP_IN = 0.22;
const COUNT_AT = 0.3;                  // the card landing to the count starting
const COUNT_RUN = 0.75;                // the count ticking up to 214 (outCubic)
const BAR_STAGGER = 0.045;             // one histogram bar to the next
const BAR_IN = 0.3;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.chip = FILTERS.map((_, i) => T.card + CHIP_AT + i * CHIP_STAGGER);
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT_RUN;            // 214: the spinner resolves to the check
    T.bar = BINS.map((_, i) => T.c0 + i * BAR_STAGGER);
    T.end = Math.max(T.c1 + 0.2, T.bar[BINS.length - 1] + BAR_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const max = Math.max(...BINS);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="se-card">
      <div class="se-hd"><span class="se-st"><i class="se-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b></div>
      <div class="se-chips">${FILTERS.map((f) => `<span class="se-chip"><i></i>${x.esc(f)}</span>`).join('')}</div>
      <div class="se-body">
        <div class="se-count"><b class="se-n">0</b><span>homes match</span></div>
        <div class="se-hist">
          <div class="se-bars">${BINS.map((v) => `<i style="height:${(100 * v / max).toFixed(1)}%"></i>`).join('')}</div>
          <div class="se-ax"><span>$250k</span><span>asking price</span><span>$500k</span></div>
        </div>
      </div>
    </div>`);
    const chips = [...card.querySelectorAll('.se-chip')];
    const bars = [...card.querySelectorAll('.se-bars i')];
    const n = card.querySelector('.se-n');
    const spin = card.querySelector('.se-spin'), ok = card.querySelector('.se-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        chips.forEach((c, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          c.style.opacity = q.toFixed(3);
          c.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
        const c = String(Math.round(COUNT * outCubic(seg(t, T.c0, T.c1))));
        if (c !== count) { n.textContent = c; count = c; }
        bars.forEach((b, i) => { b.style.transform = `scaleY(${inOutCubic(seg(t, T.bar[i], T.bar[i] + BAR_IN)).toFixed(4)})`; });
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
      },
    };
  },
};
