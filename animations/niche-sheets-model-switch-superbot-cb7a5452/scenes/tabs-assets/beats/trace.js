// Trace beat: Gemini reads the whole workbook first. Its line streams and a card rises (the sibling's queue.js grammar:
// a compact superbot card, a counter, rows that resolve; NOT Excel's UI). First the workbook: a spreadsheet glyph, the
// file "Q3 Revenue.xlsx", "14 sheets, 48,210 formulas", with a thin bar the workbook is opened along (spinner resolving
// to the check) and the big count of broken formulas on the right, "37" over "broken formulas", ticking up while it
// reads. Then "Reading 14 sheets and 48,210 formulas" ticks up, and the four causes resolve as rows (cause, the sheet
// it sits on, how many formulas it broke). The footer lands: "37 broken formulas traced to 4 causes". Every name and
// number is made up for the spot. Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze
// any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { fl } from './fluent-icons.js?v=cb7a5452';

const SAY = 'Reading the whole workbook first.';
export const BOOK = { file: 'Q3 Revenue.xlsx', sheets: 14, formulas: 48210, broken: 37 };
// the causes: [cause, sheet, count]
export const CAUSES = [
  ['#REF! after a deleted column', 'Summary', 9],
  ['VLOOKUP on approximate match picks the wrong FX rate', 'Sales', 14],
  ['Numbers typed over formulas', 'Sales', 11],
  ['SUM range misses the new region', 'Summary', 3],
];
const DONE = '37 broken formulas traced to 4 causes';
// timing (seconds from the reply start, or from the card where noted), the sibling's queue beat pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const READ_AT = 0.12;                  // the card landing to the workbook starting to open
const READ = 0.3; /* deliberate */     // the workbook opened (its bar fills)
const COUNT_AT = 0.08;                 // opened to the counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 14 sheets and 48,210 formulas (its bar fills with it)
const ROW_AT = 0.24;                   // the counter starting to the first cause
const STAGGER = 0.14;                  // one cause to the next
const ROW_IN = 0.24;                   // a cause rising in
const FOOT_AT = 0.24;                  // the last cause starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + READ_AT;
    T.p1 = T.p0 + READ;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = CAUSES.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[CAUSES.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="tr-card">
      <div class="tr-q">
        <span class="tr-ic">${fl('table')}</span>
        <div class="tr-meta">
          <b class="tr-file">${x.esc(BOOK.file)}</b>
          <span class="tr-sub">${BOOK.sheets} sheets, ${fmt(BOOK.formulas)} formulas</span>
          <span class="tr-hd"><span class="tr-st"><i class="tr-spin"></i>${x.OK}</span>Opening the workbook</span>
          <i class="tr-bar"><i class="tr-fill"></i></i>
        </div>
        <span class="tr-bigw"><b class="tr-big">0</b><small>broken formulas</small></span>
      </div>
      <div class="tr-ch"><span class="tr-st"><i class="tr-spin"></i>${x.OK}</span><b>Reading <span class="tr-n">0</span> sheets and <span class="tr-a">0</span> formulas</b></div>
      <i class="tr-cbar"><i></i></i>
      <div class="tr-list">${CAUSES.map(([cause, sheet, n]) => `<div class="tr-row">
        <span class="tr-cause">${x.esc(cause)}</span><span class="tr-sheet">${x.esc(sheet)}</span><span class="tr-cnt">${n}</span></div>`).join('')}</div>
      <div class="tr-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.tr-st')].map((n) => ({ spin: n.querySelector('.tr-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.tr-fill');
    const ch = $('.tr-ch'), cbarW = $('.tr-cbar'), cbar = $('.tr-cbar i'), n = $('.tr-n'), na = $('.tr-a'), ft = $('.tr-ft'), big = $('.tr-big');
    const rows = [...card.querySelectorAll('.tr-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the workbook: opened along its bar
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        status(vSt, t, T.card, T.p1);

        // the counter (sheets and formulas), its bar, and the broken count ticking up with it
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = `${Math.round(BOOK.sheets * q)}|${fmt(Math.round(BOOK.formulas * q))}|${Math.round(BOOK.broken * q)}`;
        if (cn !== count) { const [a, b, c] = cn.split('|'); n.textContent = a; na.textContent = b; big.textContent = c; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        status(cSt, t, T.c0, T.c1);

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
