// Staging beat: GPT-6 Astra tests every fix on a staging copy of the site before anything touches the live one. Its
// line streams and a card rises (the base's check-run card grammar, the github sibling's tests look, no shell prompt,
// no chips, no buttons): a header (a spinner resolving to the check, "Staging copy"), then a mono well where four
// check lines land one by one (a green check glyph, the check, its count right-aligned in mono, plain text). Then the
// closing check line: "Ready: 18 pages checked, 0 PHP errors". The well is laid out whole from the start, so nothing
// reflows while it fills. Pure function of t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { oi } from './hub-icons.js?v=f7b4fe31';

const SAY = 'Tested every fix on a staging copy first';
// the check run, top to bottom: [text, count] (exact, per the spec)
export const LINES = [
  ['Ran the daily menu sync, no errors', 'passed'],
  ['Updated 3 plugins, theme still renders', '3 of 3'],
  ['Removed 2 inactive themes', '2 removed'],
  ['Cleared leftover autoloaded options', '1.8 MB'],
];
const TITLE = 'Staging copy';
const DONE = 'Ready: 18 pages checked, 0 PHP errors';
// timing (seconds from the reply start, or from the card where noted), in the base checks beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.3;                    // the card landing to the first check line
const LINE = 0.2;                      // one check line to the next
const LINE_IN = 0.16;                  // a check line landing
const FOOT_AT = 0.16;                  // the last line landing to the closing check line
const FOOT_IN = 0.24;                  // the closing line rising in
const HOLD = 0.4; /* deliberate */     // the result reads before the next status line

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = LINES.map((_, i) => T.card + RUN_AT + i * LINE);
    T.foot = T.lines[LINES.length - 1] + LINE_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const line = ([text, n]) => `<div class="sg-ln">${oi('check', 'sg-ck')}<span>${esc(text)}</span><em>${esc(n)}</em></div>`;
    const card = x.el(`<div class="sg-card">
      <div class="sg-hd"><span class="sg-st"><i class="sg-spin"></i>${x.OK}</span><b>${esc(TITLE)}</b></div>
      <div class="sg-term">${LINES.map(line).join('')}</div>
      <div class="sg-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.sg-ln')];
    const st = { spin: card.querySelector('.sg-spin'), ok: card.querySelector('.sg-st .qc-ok') };
    const ft = card.querySelector('.sg-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const lastAt = T.lines[LINES.length - 1] + LINE_IN;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
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
        const d = outCubic(seg(t, lastAt, lastAt + 0.2));
        st.spin.style.opacity = (1 - seg(t, lastAt - 0.08, lastAt + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
