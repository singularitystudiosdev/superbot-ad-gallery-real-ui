// Check beat: GPT-6 Astra checks every fix before anything is sent. Its line streams and a card rises (the base's query
// grammar via the GitHub sibling's tests.js: a header with a status spinner, lines that land one by one, then chips).
// Four checks land in turn, each a spinner that resolves to the green check with its count on the right: the six new
// titles are under 200 characters and use no word more than twice (Amazon's title requirements, Seller Forums
// announcement of 2025-01-21), the four matched prices sit above the seller's minimum price, and the margin after FBA
// fees stays above 25%. Then the chips land ("4 prices matched", "0 below your floor", "Margin kept") and the footer:
// "Ready to send to Seller Central". Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Checked every title and price before sending anything.';
const LABEL = 'Checking 10 listing updates';
// [check, count]
const CHECKS = [
  ['Titles under 200 characters', '6 of 6'],
  ['No word used more than twice', '6 of 6'],
  ['New prices above your minimum price', '4 of 4'],
  ['Margin after FBA fees stays above 25%', '4 of 4'],
];
const CHIPS = ['4 prices matched', '0 below your floor', 'Margin kept'];
const DONE = 'Ready to send to Seller Central';
// timing (seconds from the reply start, or from the card where noted), in the base's query pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const LINE_AT = 0.24;                  // the card landing to the first check line
const LINE = 0.2;                      // one check line to the next
const LINE_IN = 0.16;                  // a line landing
const RESOLVE = 0.16;                  // a line landed to its spinner resolving to the check
const CHIPS_AT = 0.12;                 // the last check resolved, then the first chip
const STAGGER = 0.07;                  // one chip to the next
const CHIP_IN = 0.22;                  // a chip rising in
const FOOT_AT = 0.1;                   // the last chip landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = CHECKS.map((_, i) => T.card + LINE_AT + i * LINE);
    T.ok = T.lines.map((a) => a + RESOLVE);
    const last = T.ok[T.ok.length - 1] + 0.2;
    T.chips = CHIPS.map((_, i) => last + CHIPS_AT + i * STAGGER);
    T.foot = T.chips[CHIPS.length - 1] + CHIP_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ck-card">
      <div class="ck-hd"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="ck-meta">Copperline Kitchen</span></div>
      <div class="ck-list">${CHECKS.map(([c, n]) => `<div class="ck-ln"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><span class="ck-tx">${x.esc(c)}</span><em>${x.esc(n)}</em></div>`).join('')}</div>
      <div class="ck-chips">${CHIPS.map((c) => `<span class="ck-chip">${x.esc(c)}</span>`).join('')}</div>
      <div class="ck-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const sts = [...card.querySelectorAll('.ck-st')].map((n) => ({ spin: n.querySelector('.ck-spin'), ok: n.querySelector('.qc-ok') }));
    const head = sts[0], lineSt = sts.slice(1);
    const lines = [...card.querySelectorAll('.ck-ln')];
    const chips = [...card.querySelectorAll('.ck-chip')];
    const ft = card.querySelector('.ck-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const lastOk = T.ok[T.ok.length - 1];

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.lines[3], lines[3]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        status(head, t, T.card, lastOk);
        lines.forEach((n, i) => {
          const p = outCubic(seg(t, T.lines[i], T.lines[i] + LINE_IN));
          n.style.opacity = p.toFixed(3);
          n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
          status(lineSt[i], t, T.lines[i], T.ok[i]);
          n.classList.toggle('ck-done', t >= T.ok[i]);
        });
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
