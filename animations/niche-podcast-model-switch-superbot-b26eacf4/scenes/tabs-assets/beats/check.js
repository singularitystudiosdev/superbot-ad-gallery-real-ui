// Check beat: GPT-6 Astra checks episode 42 before it is published. Its line streams and a card rises (the base's
// check grammar: a header with the status spinner, lines that land one by one with green check glyphs, then the run's
// chips, then the tally). The four checks land in turn, each with its value: every chapter lands on the edit, host and
// guest sit at the same level, the names in the notes are spelled right, and the chapters meet Spotify's rules (first
// at 00:00, at least 30 s apart). The chips land ("56:32 runtime", "0 clipped peaks", "7 chapters") and the tally:
// "Ready to publish on Spotify". Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze
// any frame.
import { lerp, seg, outCubic } from '../../../lib.js';
import { EP } from './edit.js?v=b26eacf4';

const SAY = 'Checked the cut, the levels and the notes before publishing.';
const LABEL = `Checking episode ${EP.number}`;
const N = EP.chapters.length;
// the checks: [what was checked, its value]
const CHECKS = [
  ['Every chapter lands on the edit', `${N} of ${N}`],
  ['Host and guest at the same level', 'Matched'],
  ['Names spelled right in the notes', '4 of 4'],
  ["Chapters meet Spotify's rules", 'Starts 00:00'],
];
const CHIPS = [`${EP.runtime} runtime`, '0 clipped peaks', `${N} chapters`];
const DONE = 'Ready to publish on Spotify';
// timing (seconds from the reply start, or from the card where noted), in the base's query pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const LINE_AT = 0.26;                  // the card landing to the first check line
const LINE = 0.17;                     // one check line to the next
const LINE_IN = 0.18;                  // a line landing
const TICK_AT = 0.1;                   // a line landed to its check glyph and count popping in
const CHIPS_AT = 0.12;                 // the last line in, then the first chip
const STAGGER = 0.07;                  // one chip to the next
const CHIP_IN = 0.22;                  // a chip rising in
const FOOT_AT = 0.1;                   // the last chip landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = CHECKS.map((_, i) => T.card + LINE_AT + i * LINE);
    const last = T.lines[CHECKS.length - 1] + TICK_AT + LINE_IN;
    T.last = last;
    T.chips = CHIPS.map((_, i) => last + CHIPS_AT + i * STAGGER);
    T.foot = T.chips[CHIPS.length - 1] + CHIP_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ck-card">
      <div class="ck-hd"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="ck-store">${x.esc(EP.show)}</span></div>
      <div class="ck-well">${CHECKS.map(([text, n]) => `<div class="ck-ln"><span class="ck-g"><i class="ck-dot"></i>${x.OK}</span><span class="ck-tx">${x.esc(text)}</span><em>${x.esc(n)}</em></div>`).join('')}</div>
      <div class="ck-chips">${CHIPS.map((c) => `<span class="ck-chip">${x.esc(c)}</span>`).join('')}</div>
      <div class="ck-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.ck-ln')].map((n) => ({ n, dot: n.querySelector('.ck-dot'), ok: n.querySelector('.qc-ok'), em: n.querySelector('em') }));
    const st = { spin: card.querySelector('.ck-spin'), ok: card.querySelector('.ck-st .qc-ok') };
    const chips = [...card.querySelectorAll('.ck-chip')];
    const ft = card.querySelector('.ck-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.lines[2], rows[2].n], [T.foot, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each check: the line lands with a pending dot, then the dot gives way to the green check and the count
        rows.forEach((o, i) => {
          const a = T.lines[i];
          const p = outCubic(seg(t, a, a + LINE_IN));
          o.n.style.opacity = p.toFixed(3);
          o.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
          const q = outCubic(seg(t, a + TICK_AT, a + TICK_AT + LINE_IN));
          o.dot.style.opacity = (1 - q).toFixed(3);
          o.ok.style.opacity = q.toFixed(3);
          o.ok.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.4, 1, q).toFixed(4)})`;
          o.em.style.opacity = q.toFixed(3);
        });
        // the header's status: spinning while the checks run, the check once the last one is in
        const d = outCubic(seg(t, T.last, T.last + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.last - 0.08, T.last + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        chips.forEach((c, i) => {
          const o = outCubic(seg(t, T.chips[i], T.chips[i] + CHIP_IN));
          c.style.opacity = o.toFixed(3);
          c.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 6).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
