// Check beat: GPT-6 Astra checks every rewrite against the product's own specs before anything is published. Its line
// streams and a card rises (the base's query grammar via the GitHub fork's test-run card: a header with the status
// spinner, lines that land one by one with green check glyphs, then the run's chips, then the tally). The four checks
// land in turn, each with its count "48 of 48": the sizes and materials match the product specs, no claim was added
// that is not in the listings, every SEO title is under 70 characters and every meta description under 160 (Shopify's
// own limits, help.shopify.com "Adding keywords for SEO": page title up to 70 characters, meta description 160). The
// chips land ("48 checked", "0 invented claims", "SEO fields filled") and the tally: "Ready to publish to your store".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic } from '../../../lib.js';
import { STORE } from './catalog.js?v=a3b73360';

const SAY = 'Checked all 48 rewrites against your product specs and Shopify\'s SEO limits.';
const LABEL = 'Checking 48 rewrites';
// the checks: [what was checked, its count]
const CHECKS = [
  ['Sizes and materials match your product specs', '48 of 48'],
  ['No claims added that are not in your listings', '48 of 48'],
  ['SEO titles under 70 characters', '48 of 48'],
  ['Meta descriptions under 160 characters', '48 of 48'],
];
const CHIPS = ['48 checked', '0 invented claims', 'SEO fields filled'];
const DONE = 'Ready to publish to your store';
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
      <div class="ck-hd"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="ck-store">${x.esc(STORE.name)}</span></div>
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
