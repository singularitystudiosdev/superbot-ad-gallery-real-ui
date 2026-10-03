// Sheet beat: Gemini reads the supplier's spreadsheet and cleans it up. Its line streams and a card rises (the base's
// compact-card grammar, no tabs, no footer controls): a flat sheet glyph, "fall-line.xlsx" with the muted "97 rows from
// your supplier", then a plain data table (horizontal rules only: no cell boxes, no column letters, no row numbers)
// with the columns Style, Color, Size, Qty and Cost (4:5 drops Cost, sheet.css). Gemini's findings land one after
// another: "navy blue" is struck through and "Navy" appears beside it, "2XL" becomes "XXL", "Oatmeal" becomes "Oat",
// and the second Zip Hoodie / Forest / M row dims with the plain caption "duplicate row, merged". Under the table the
// status line spins on "Reading 97 rows", the muted line "23 sizes and colors cleaned up, 1 duplicate merged" lands,
// and the status resolves to the green check "96 variations: 4 styles, 4 colors, 6 sizes". The supplier, the sheet and
// every row are made up for the spot. Pure function of t: every moving value is written from t, so ?t= and __AD.seek
// freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { li } from './lucide-icons.js?v=14250a28';

const SAY = 'Read your supplier sheet and cleaned up 23 messy rows';
const FILE = 'fall-line.xlsx';
const META = '97 rows from your supplier';
const COLS = ['Style', 'Color', 'Size', 'Qty', 'Cost'];
// the supplier's rows, exactly as the spec lists them (the messy values included)
const ROWS = [
  ['Heavyweight Hoodie', 'Black', 'M', '20', '$28.50'],
  ['Heavyweight Hoodie', 'navy blue', 'L', '18', '$28.50'],
  ['Heavyweight Hoodie', 'Oat', '2XL', '6', '$28.50'],
  ['Zip Hoodie', 'Oatmeal', 'S', '10', '$31.00'],
  ['Zip Hoodie', 'Forest', 'M', '16', '$31.00'],
  ['Zip Hoodie', 'Forest', 'M', '16', '$31.00'],
  ['Crewneck Sweatshirt', 'Black', 'XL', '12', '$24.00'],
  ['Long Sleeve Tee', 'Navy', 'S', '14', '$16.00'],
];
// the findings, in the order they land: [row, column, the cleaned value] and then the duplicate row
const FIX = [[1, 1, 'Navy'], [2, 2, 'XXL'], [3, 1, 'Oat']];
const DUP = 5;
const DUP_NOTE = 'duplicate row, merged';
const READING = 'Reading 97 rows';
const MUTED = '23 sizes and colors cleaned up, 1 duplicate merged';
const DONE = '96 variations: 4 styles, 4 colors, 6 sizes';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const ST_AT = 0.16;                    // the card landing to the status line (spinner, "Reading 97 rows")
const FIND_AT = 0.5; /* deliberate */  // the card landing to the first finding
const FIND = 0.3; /* deliberate */     // one finding to the next
const STRIKE = 0.16;                   // the strike line drawing across the old value
const NEW_AT = 0.1;                    // the strike starting to the cleaned value fading in
const NEW_IN = 0.2;                    // the cleaned value fading in
const MUT_AT = 0.38;                   // the last finding to the muted summary line
const OK_AT = 0.28;                    // the muted line to the status resolving to the check
const DONE_IN = 0.24;                  // the status line's text crossfade
const HOLD = 0.35; /* deliberate */    // the result reads before the next status line

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.st = T.card + ST_AT;
    T.find = [...FIX, DUP].map((_, i) => T.card + FIND_AT + i * FIND);
    T.mut = T.find[T.find.length - 1] + MUT_AT;
    T.ok = T.mut + OK_AT;
    T.end = Math.max(T.ok + DONE_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const fixAt = (ri, ci) => FIX.findIndex(([r, c]) => r === ri && c === ci);
    const cell = (v, ri, ci) => {
      const f = fixAt(ri, ci);
      const inner = f < 0 ? esc(v) : `<span class="sh-old">${esc(v)}<i class="sh-strike"></i></span><span class="sh-new">${esc(FIX[f][2])}</span>`;
      return `<span class="sh-c sh-c${ci}${f >= 0 ? ' sh-fx' : ''}">${inner}</span>`;
    };
    const card = x.el(`<div class="sh-card">
      <div class="sh-hd"><span class="sh-ic">${li('file-spreadsheet')}</span><b>${esc(FILE)}</b><span class="sh-meta">${esc(META)}</span></div>
      <div class="sh-tbl">
        <div class="sh-row sh-head">${COLS.map((c, ci) => `<span class="sh-c sh-c${ci}">${esc(c)}</span>`).join('')}</div>
        ${ROWS.map((row, ri) => `<div class="sh-row${ri === DUP ? ' sh-dup' : ''}">${row.map((v, ci) => cell(v, ri, ci)).join('')}${ri === DUP ? `<span class="sh-note">${esc(DUP_NOTE)}</span>` : ''}</div>`).join('')}
      </div>
      <div class="sh-mut">${esc(MUTED)}</div>
      <div class="sh-st"><span class="sh-sti"><i class="sh-spin"></i>${x.OK}</span><span class="sh-tx"><span class="sh-a">${esc(READING)}</span><span class="sh-b">${esc(DONE)}</span></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const fixes = [...card.querySelectorAll('.sh-fx')].map((n) => ({ old: n.querySelector('.sh-old'), strike: n.querySelector('.sh-strike'), nw: n.querySelector('.sh-new') }));
    // the fixes in the DOM are in row order, which is the FIX order
    const dup = $('.sh-dup'), dupCells = [...dup.querySelectorAll('.sh-c')], note = $('.sh-note');
    const mut = $('.sh-mut'), st = $('.sh-st'), spin = $('.sh-spin'), ok = $('.sh-sti .qc-ok'), ta = $('.sh-a'), tb = $('.sh-b');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.mut, st]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the three cleaned values: the strike draws across the old one, which goes muted, the new one fades in
        fixes.forEach((f, i) => {
          const a = T.find[i];
          const s = outCubic(seg(t, a, a + STRIKE));
          f.strike.style.transform = `scaleX(${s.toFixed(4)})`;
          f.old.classList.toggle('on', t >= a);
          const n = outCubic(seg(t, a + NEW_AT, a + NEW_AT + NEW_IN));
          f.nw.style.opacity = n.toFixed(3);
          f.nw.style.transform = n >= 1 ? 'none' : `translateX(${((1 - n) * -4).toFixed(2)}px)`;
        });
        // the duplicate row dims; its size, qty and cost give way to the caption
        const a = T.find[FIX.length];
        const d = outCubic(seg(t, a, a + 0.26));
        dupCells.forEach((n, i) => { n.style.opacity = (i < 2 ? lerp(1, 0.38, d) : 1 - d).toFixed(3); });
        note.style.opacity = outCubic(seg(t, a + 0.12, a + 0.36)).toFixed(3);

        // the status: spinner and "Reading 97 rows"; the muted summary; then the check and the result
        st.style.opacity = outCubic(seg(t, T.st, T.st + 0.22)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.st) * 420).toFixed(1)}deg)`;
        spin.style.opacity = (1 - seg(t, T.ok - 0.08, T.ok + 0.06)).toFixed(3);
        const o = outCubic(seg(t, T.ok, T.ok + 0.2));
        ok.style.opacity = o.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        const sw = seg(t, T.ok, T.ok + DONE_IN);
        ta.style.opacity = (1 - outCubic(seg(sw, 0, 0.5))).toFixed(3);
        tb.style.opacity = outCubic(seg(sw, 0.5, 1)).toFixed(3);
        const m = outCubic(seg(t, T.mut, T.mut + 0.24));
        mut.style.opacity = m.toFixed(3);
        mut.style.transform = m >= 1 ? 'none' : `translateY(${((1 - m) * 5).toFixed(2)}px)`;
      },
    };
  },
};
