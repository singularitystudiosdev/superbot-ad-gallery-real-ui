// Schools beat: GreatSchools rates the assigned schools of every home. Its line streams and a card rises ("GreatSchools
// ratings  ·  assigned schools", a counter running up to 214 of 214 homes checked); a table lands row by row, each home
// with its assigned elementary, middle and high school as GreatSchools-style 1 to 10 rating circles (8 to 10 green,
// 5 to 7 amber, 1 to 4 red). The homes whose schools miss the bar dim out, the filter chip "Schools rated 8+ within
// 1 mi" lands and the result resolves: "11 homes near schools rated 8 or higher". Every school name is invented for the
// spot (brand/CREDITS.txt DATA): no rating is attached to a real school. Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Checked the assigned schools for all 214 homes. 11 are near schools rated 8 or higher.';
const LABEL = 'GreatSchools ratings  ·  assigned schools';
// [home, [rating, school] elementary, middle, high, passes]
const ROWS = [
  ['1438 Juniper Ave', [9, 'Linden Grove', '0.4 mi'], [8, 'Oak Creek'], [8, 'Westbrook'], true],
  ['4170 Moss Rd', [6, 'Brookside', '0.9 mi'], [5, 'Elm Park'], [7, 'Kingsley'], false],
  ['215 Ottawa Ave', [9, 'Cherry Hill', '0.3 mi'], [8, 'Oak Creek'], [8, 'Westbrook'], true],
  ['529 Kienle Ave', [4, 'Sycamore Bend', '1.2 mi'], [6, 'Elm Park'], [7, 'Kingsley'], false],
  ['682 Hillcrest Dr', [9, 'Maple Ridge', '0.6 mi'], [8, 'Oak Creek'], [8, 'Westbrook'], true],
];
const FILTER = 'Schools rated 8+ within 1 mi';
const RESULT = '11 homes near schools rated 8 or higher';
const TOTAL = 214;
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;
const SAY_AT = 0.048;
const CARD = 0.144;
const RISE = 0.36;
const ROWS_AT = 0.14;                  // the card landing to the first row
const ROW_STAGGER = 0.1;
const ROW_IN = 0.2;
const DIM_AT = 0.1;                    // the last row in, then the misses dim out and the filter lands
const DIM = 0.25;
const RES_AT = 0.1;                    // the filter in, then the result line
const RES_IN = 0.24;

const tone = (v) => (v >= 8 ? 'gs-hi' : v >= 5 ? 'gs-mid' : 'gs-lo');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cell = ([v, name, dist]) => `<span class="gs-c"><i class="gs-r ${tone(v)}">${v}</i><span class="gs-nm"><b>${esc(name)}</b>${dist ? `<small>${esc(dist)}</small>` : ''}</span></span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.rows = ROWS.map((_, i) => T.card + ROWS_AT + i * ROW_STAGGER);
    T.dim = T.rows[ROWS.length - 1] + ROW_IN + DIM_AT;
    T.res = T.dim + DIM + RES_AT;      // the counter has landed on 214: the spinner resolves to the check
    T.end = Math.max(T.res + RES_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="gs-card">
      <div class="gs-hd"><span class="gs-st"><i class="gs-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="gs-cnt"><b class="gs-n">0</b> of ${TOTAL} homes</span></div>
      <div class="gs-vp">
        <div class="gs-fh"><span>home</span><span>elementary</span><span>middle</span><span>high</span></div>
        ${ROWS.map(([h, e, m, hi, ok]) => `<div class="gs-row${ok ? '' : ' gs-miss'}"><b class="gs-home">${esc(h)}</b>${cell(e)}${cell(m)}${cell(hi)}</div>`).join('')}
      </div>
      <div class="gs-ft"><span class="gs-flt">${x.esc(FILTER)}</span><span class="gs-res">${x.OK}<b>${x.esc(RESULT)}</b></span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.gs-row')];
    const n = card.querySelector('.gs-n'), flt = card.querySelector('.gs-flt'), res = card.querySelector('.gs-res');
    const spin = card.querySelector('.gs-spin'), ok = card.querySelector('.gs-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.res, res]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const dim = outCubic(seg(t, T.dim, T.dim + DIM));
        rows.forEach((row, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          const miss = !ROWS[i][4];
          row.style.opacity = (q * (miss ? lerp(1, 0.32, dim) : 1)).toFixed(3);
          row.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * -8).toFixed(2)}px)`;
          if (miss) row.style.setProperty('--strike', dim.toFixed(3));
        });
        const c = String(Math.round(TOTAL * seg(t, T.rows[0], T.res)));
        if (c !== count) { n.textContent = c; count = c; }
        const f = outCubic(seg(t, T.dim, T.dim + 0.24));
        flt.style.opacity = f.toFixed(3);
        flt.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px) scale(${lerp(0.9, 1, f).toFixed(4)})`;
        const rr = outCubic(seg(t, T.res, T.res + RES_IN));
        res.style.opacity = rr.toFixed(3);
        res.style.transform = rr >= 1 ? 'none' : `translateY(${((1 - rr) * 6).toFixed(2)}px)`;
        const d = outCubic(seg(t, T.res, T.res + 0.2));
        spin.style.opacity = (1 - seg(t, T.res - 0.08, T.res + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
      },
    };
  },
};
