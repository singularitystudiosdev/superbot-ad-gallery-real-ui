// Shipping beat: GPT-6 Astra sets the holiday processing times. Its line streams, a card rises in the base's query
// grammar (query.js: the card frame with a status spinner, a label and a count; results landing one by one, then the
// run's chips): "Holiday processing times" for "48 listings", then four lines land in turn, each with its green check
// glyph and a count on the right (Personalized: 3 to 5 days, 18 listings; Made to order: 1 to 2 weeks, 12; Ready to
// ship: 1 to 3 days, 18; Every order ships by Dec 17, 48 of 48), then the chips ("48 listings updated", "Order-by
// dates set", "0 late for Dec 24") and the tally line "Ready to save in Etsy". Dec 17 is USPS Ground Advantage's 2026
// holiday ship-by date for the lower 48 (about.usps.com newsroom, 2026-09-22). Processing time is Etsy's real
// per-listing field (help.etsy.com article 115015588087). Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic } from '../../../lib.js';

const SAY = 'Set holiday processing times so every order arrives by Dec 24.';
const LABEL = 'Holiday processing times';
const META = '48 listings';
// [label, value, count] (exact, per the brief)
const LINES = [
  ['Personalized', '3 to 5 days', '18 listings'],
  ['Made to order', '1 to 2 weeks', '12 listings'],
  ['Ready to ship', '1 to 3 days', '18 listings'],
  ['Every order ships by Dec 17', '', '48 of 48'],
];
const CHIPS = ['48 listings updated', 'Order-by dates set', '0 late for Dec 24'];
const TALLY = 'Ready to save in Etsy';
// timing (seconds from the reply start, or from the card where noted), in the query beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const LINE_AT = 0.3;                   // the card landing to the first line
const LINE_STAGGER = 0.16;             // one line to the next
const LINE_IN = 0.2;                   // a line landing (its check pops with it)
const CHIPS_AT = 0.12;                 // the last line in, then the first chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const TALLY_AT = 0.1;                  // the last chip in, then the tally line
const TALLY_IN = 0.24;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = LINES.map((_, i) => T.card + LINE_AT + i * LINE_STAGGER);
    T.done = T.lines[LINES.length - 1] + LINE_IN;      // the last line is in: the spinner resolves to the check
    T.chip = CHIPS.map((_, i) => T.done + CHIPS_AT + i * STAGGER);
    T.tally = T.chip[CHIPS.length - 1] + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="sp-card">
      <div class="sp-hd"><span class="sp-st"><i class="sp-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="sp-meta">${x.esc(META)}</span></div>
      <div class="sp-res">${LINES.map(([l, v, n], i) => `<div class="sp-row${i === LINES.length - 1 ? ' sp-all' : ''}">${x.OK}<span class="sp-l">${esc(l)}${v ? `: <b>${esc(v)}</b>` : ''}</span><span class="sp-n">${esc(n)}</span></div>`).join('')}</div>
      <div class="sp-chips">${CHIPS.map((c) => `<span class="sp-chip">${x.esc(c)}</span>`).join('')}</div>
      <div class="sp-tally">${x.esc(TALLY)}</div>
    </div>`);
    const rows = [...card.querySelectorAll('.sp-row')].map((n) => ({ n, ok: n.querySelector('.qc-ok') }));
    const chips = [...card.querySelectorAll('.sp-chip')];
    const tally = card.querySelector('.sp-tally');
    const spin = card.querySelector('.sp-spin'), ok = card.querySelector('.sp-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let said = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the lines land one by one, each check popping in with it
        rows.forEach((o, i) => {
          const q = outCubic(seg(t, T.lines[i], T.lines[i] + LINE_IN));
          o.n.style.opacity = q.toFixed(3);
          o.n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
          o.ok.style.transform = `scale(${lerp(0.4, 1, outCubic(seg(t, T.lines[i] + 0.06, T.lines[i] + 0.06 + LINE_IN))).toFixed(4)})`;
        });

        // done: the spinner resolves to the check as the last line lands
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
        const ty = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        tally.style.opacity = ty.toFixed(3);
        tally.style.transform = ty >= 1 ? 'none' : `translateY(${((1 - ty) * 6).toFixed(2)}px)`;
      },
    };
  },
};
