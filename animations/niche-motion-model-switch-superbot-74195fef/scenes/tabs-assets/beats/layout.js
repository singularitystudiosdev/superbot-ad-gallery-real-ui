// Layout beat: GPT-6 Astra checks the three new layouts before anything touches the project. Its line streams and a
// card rises (the base's check-card grammar, no chips): a header ("Layout check", a spinner resolving to the check),
// then a well where three rows tick green in turn (the size in mono, the finding; a spinner on each row turns into
// the green check), the plain-text tally "41 of 41 layers inside title safe" counting up as the rows pass (text, not
// a chip), and the closing check line "All 3 layouts pass". The well is laid out whole from the start, so nothing
// reflows. Pure function of t.
import { lerp, seg, outCubic } from '../../../lib.js';

const SAY = 'Checked each new size against title safe';
const TITLE = 'Layout check';
// [size, finding] (exact, per the spec)
export const ROWS = [
  ['9:16', 'Headline re-flowed to 2 lines, bottle re-centred'],
  ['1:1', 'Lockup kept inside title safe'],
  ['4:5', 'Lockup lifted 96 px off the lower edge'],
];
const LAYERS = 41;
const TALLY = (n) => `${n} of ${LAYERS} layers inside title safe`;
const DONE = 'All 3 layouts pass';
// timing (seconds from the reply start, or from the card where noted), in the base check beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.3;                    // the card landing to the first row's check
const ROW = 0.28;                      // one row's check to the next
const POP = 0.18;                      // a check popping in
const FOOT_AT = 0.14;                  // the last check in to the closing check line
const FOOT_IN = 0.24;                  // the closing line rising in
const HOLD = 0.3; /* deliberate */     // the result reads before the next status line

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.ok = ROWS.map((_, i) => T.card + RUN_AT + i * ROW);
    T.foot = T.ok[ROWS.length - 1] + POP + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="lc-card">
      <div class="lc-hd"><span class="lc-st"><i class="lc-spin"></i>${x.OK}</span><b>${esc(TITLE)}</b><span class="lc-tally">${esc(TALLY(0))}</span></div>
      <div class="lc-well">${ROWS.map(([sz, f]) => `<div class="lc-row"><span class="lc-ok"><i class="lc-spin"></i>${x.OK}</span><span class="lc-sz">${esc(sz)}</span><span class="lc-f">${esc(f)}</span></div>`).join('')}</div>
      <div class="lc-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.lc-row')].map((n) => ({ n, spin: n.querySelector('.lc-spin'), ok: n.querySelector('.qc-ok') }));
    const hd = { spin: card.querySelector('.lc-hd .lc-spin'), ok: card.querySelector('.lc-hd .qc-ok') };
    const tally = card.querySelector('.lc-tally'), ft = card.querySelector('.lc-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, tShown = '';
    const lastAt = T.ok[ROWS.length - 1];

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each row: its spinner turns until its check lands; the rows are all there from the start
        rows.forEach((r, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          r.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          r.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          r.ok.style.opacity = o.toFixed(3);
          r.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
          r.n.classList.toggle('lc-pass', t >= T.ok[i]);
        });
        // the tally counts up with the checks (plain text)
        const tv = TALLY(Math.round(lerp(0, LAYERS, outCubic(seg(t, T.card + RUN_AT - 0.2, lastAt + 0.1)))));
        if (tv !== tShown) { tally.textContent = tv; tShown = tv; }
        const d = outCubic(seg(t, lastAt, lastAt + 0.2));
        hd.spin.style.opacity = (1 - seg(t, lastAt - 0.08, lastAt + 0.06)).toFixed(3);
        hd.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        hd.ok.style.opacity = d.toFixed(3);
        hd.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
