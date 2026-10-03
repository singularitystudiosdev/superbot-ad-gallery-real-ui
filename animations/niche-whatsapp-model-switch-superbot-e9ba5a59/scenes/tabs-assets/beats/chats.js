// Chats beat: Gemini reads the shop's WhatsApp Business inbox. Its line streams and a card rises: "Reading N chats",
// the counter ticking up to 38 while a thin progress bar fills, and under it the chats land sorted into four rows,
// each with its count, what the customers ask (a real-sounding example) and what superbot will do about it. A footer
// lands with the check: "38 chats sorted, 7 voice notes and 4 photos flagged". The grammar is the source's backlog
// card (header with spinner resolving to the check, a counter, staggered rows), via the Instagram fork's dms.js.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Read your WhatsApp Business inbox and sorted every chat.';
const TOTAL = 38;
// the sorted chats: [count + kind, an example ask, the action superbot takes]
export const SORTED = [
  ['14 repair bookings', '"Can you fit me in Saturday?"', 'Book a slot'],
  ['11 price questions', '"How much is a tune-up?"', 'Send a quote'],
  ['9 "is my bike ready?"', '"Did you finish my bike yet?"', 'Status update'],
  ['4 other', '"Do you sell kids\' helmets?"', 'Reply'],
];
const DONE = '38 chats sorted, 7 voice notes and 4 photos flagged';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.08;                 // the card landing to the counter starting
const COUNT = 0.8; /* deliberate */    // the counter running up to 38 (the progress bar fills with it)
const ROW_AT = 0.36;                   // the card landing to the first row
const STAGGER = 0.14;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in
const FOOT_AT = 0.12;                  // the last row landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = SORTED.map((_, i) => T.card + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[SORTED.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ws-card">
      <div class="ws-hd"><span class="ws-st"><i class="ws-spin"></i>${x.OK}</span><b>Reading <span class="ws-n">0</span> chats</b>
        <span class="ws-where"><img src="${x.brand('whatsapp-logo.svg')}" alt=""/>WhatsApp Business</span></div>
      <i class="ws-bar"><i></i></i>
      <div class="ws-list">${SORTED.map(([kind, ask, act]) => `<div class="ws-row"><b>${x.esc(kind)}</b><span class="ws-ask">${x.esc(ask)}</span><span class="ws-act">${x.esc(act)}</span></div>`).join('')}</div>
      <div class="ws-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const n = $('.ws-n'), bar = $('.ws-bar i'), spin = $('.ws-spin'), ok = $('.ws-st .qc-ok'), ft = $('.ws-ft');
    const rows = [...card.querySelectorAll('.ws-row')];
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

        // the counter and the bar: a fast run through the chats, easing in at the end
        const p = seg(t, T.c0, T.c1);
        const c = String(Math.round(TOTAL * inOutCubic(p)));
        if (c !== count) { n.textContent = c; count = c; }
        bar.style.transform = `scaleX(${inOutCubic(p).toFixed(4)})`;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        rows.forEach((row, i) => {
          const q = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = q.toFixed(3);
          row.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
