// Files beat: GPT-6 Astra gets the files ready for Bandcamp. Its line streams and a card rises (the sibling's check
// grammar: a header with the status spinner, lines that land one by one with green check glyphs, then the footer). The
// header shows the cover (the real photograph, img/cover.jpg) and the two files. Five lines tick in: the bridge peak
// lowered to -1.0 dBTP, the room noise trimmed after the last chord, the master as a 24-bit WAV at 44.1 kHz, the
// cover cropped square at 3000 x 3000, the lyrics matched to the vocal line for line. Then the green line "Ready for
// Bandcamp". No chips, no values that read as outcomes. Pure function of t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { REL } from './rel.js?v=cd0a8aa3';

const SAY = 'Got the files ready for Bandcamp.';
const CHECKS = [
  'Bridge peak lowered to -1.0 dBTP',
  'Room noise trimmed after the last chord',
  '24-bit WAV, 44.1 kHz',
  'Cover cropped square, 3000 x 3000',
  'Lyrics match the vocal line for line',
];
const DONE = 'Ready for Bandcamp';
const CPS = 100;                       // the reply line streams
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const LINE_AT = 0.26;                  // the card landing to the first line
const LINE = 0.19;                     // one line to the next
const LINE_IN = 0.18;                  // a line landing
const TICK_AT = 0.1;                   // a line landed to its check popping in
const FOOT_AT = 0.14;                  // the last check in, then the footer
const FOOT_IN = 0.24;                  // the footer rising in
const HOLD = 0.4; /* deliberate */     // the footer reads before the next pill

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = CHECKS.map((_, i) => T.card + LINE_AT + i * LINE);
    T.last = T.lines[CHECKS.length - 1] + TICK_AT + LINE_IN;
    T.foot = T.last + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="fl-card">
      <div class="fl-hd"><img class="fl-cv" src="${x.img('cover.jpg')}" alt=""/><span class="fl-names"><b>${x.esc(REL.file)}</b><small>${x.esc(REL.cover)}</small></span><span class="fl-st"><i class="fl-spin"></i>${x.OK}</span></div>
      <div class="fl-well">${CHECKS.map((text) => `<div class="fl-ln"><span class="fl-g"><i class="fl-dot"></i>${x.OK}</span><span class="fl-tx">${x.esc(text)}</span></div>`).join('')}</div>
      <div class="fl-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.fl-ln')].map((n) => ({ n, dot: n.querySelector('.fl-dot'), ok: n.querySelector('.qc-ok') }));
    const st = { spin: card.querySelector('.fl-spin'), ok: card.querySelector('.fl-st .qc-ok') };
    const ft = card.querySelector('.fl-ft');
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
        rows.forEach((o, i) => {
          const a = T.lines[i];
          const p = outCubic(seg(t, a, a + LINE_IN));
          o.n.style.opacity = p.toFixed(3);
          o.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
          const q = outCubic(seg(t, a + TICK_AT, a + TICK_AT + LINE_IN));
          o.dot.style.opacity = (1 - q).toFixed(3);
          o.ok.style.opacity = q.toFixed(3);
          o.ok.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.4, 1, q).toFixed(4)})`;
        });
        const d = outCubic(seg(t, T.last, T.last + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.last - 0.08, T.last + 0.06)).toFixed(3);
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
