// Tie-out beat: GPT-6 Astra checks every total against the ledger before anything is written back. Its line streams and
// a card rises (the sibling's checks.js grammar): a header ("Checking Q3 Revenue.xlsx", spinner resolving to the
// check), then a mono well where the check lines land one by one (a check glyph left, the check, the count
// right-aligned in mono). Then the tally lands as PLAIN TEXT (no chips, no pill outlines):
// "37 of 37 fixed · 0 errors · $0 variance". The well is laid out whole from the start, so nothing reflows while it
// fills. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { fl } from './fluent-icons.js?v=cb7a5452';

const SAY = 'Checking every total against the ledger.';
// the check run, top to bottom: [text, count]
const LINES = [
  ['Every region ties out to the ledger', '5/5'],
  ['No #REF!, #N/A or #VALUE! left', '48,210/48,210'],
  ['Lookups use exact match', '14/14'],
  ['No numbers typed over formulas', '11/11'],
  ['Totals include every region', '3/3'],
];
const TALLY = '37 of 37 fixed · 0 errors · $0 variance';
// timing (seconds from the reply start, or from the card where noted), the sibling's checks beat pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.3;                    // the card landing to the first check line
const LINE = 0.13;                     // one check line to the next
const LINE_IN = 0.16;                  // a check line landing
const TALLY_AT = 0.33;                 // the last line in, then the tally (the sibling's chips-to-footer span)
const TALLY_IN = 0.24;                 // the tally rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = LINES.map((_, i) => T.card + RUN_AT + i * LINE);
    T.last = T.lines[LINES.length - 1] + LINE_IN;
    T.foot = T.last + TALLY_AT;
    T.end = Math.max(T.foot + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const line = ([text, n]) => `<div class="to-ln">${fl('checkmark-circle', 'to-ck')}<span>${esc(text)}</span><em>${esc(n)}</em></div>`;
    const card = x.el(`<div class="to-card">
      <div class="to-hd"><span class="to-st"><i class="to-spin"></i>${x.OK}</span><b>Checking Q3 Revenue.xlsx</b></div>
      <div class="to-term">${LINES.map(line).join('')}</div>
      <div class="to-ft">${x.OK}<span>${esc(TALLY)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.to-ln')];
    const st = { spin: card.querySelector('.to-spin'), ok: card.querySelector('.to-st .qc-ok') };
    const ft = card.querySelector('.to-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.lines[3], rows[3]], [T.foot, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((n, i) => {
          const p = outCubic(seg(t, T.lines[i], T.lines[i] + LINE_IN));
          n.style.opacity = p.toFixed(3);
          n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
        });
        // the header's status: spinning while the run plays, the check once the last line is in
        const d = outCubic(seg(t, T.last, T.last + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.last - 0.08, T.last + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const f = outCubic(seg(t, T.foot, T.foot + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
