// Plan beat: Gemini plans the one-page site. Its line streams, a card rises ("Page plan  ·  maple-street-bakery", a
// section counter), and inside it the page's five sections land one by one, each with the copy Gemini wrote for it
// (Hero, Today's bakes, Our story, Visit us, Order for pickup) while the counter runs up to 5. Then the plan resolves:
// the chips land under it one by one ("5 sections", "Mobile first", "Copy written"), the last one the gold
// "Ready to build" (the data remake's backlog.js grammar, its "Ready to clean").
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so nothing reflows at any column width.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Planned a one-page site for Maple Street Bakery: 5 sections, copy and photos.';
const LABEL = 'Page plan  ·  maple-street-bakery';
// the page, top to bottom: section, the copy written for it
const SECTIONS = [
  ['Hero', 'Baked before sunrise. Gone by noon.'],
  ["Today's bakes", 'Sourdough, croissants, knots, galette'],
  ['Our story', 'Three bakers, one oven, since 2014'],
  ['Visit us', '214 Maple Street, open daily 7am to 3pm'],
  ['Order for pickup', 'Order by 9pm, pick it up warm at 7am'],
];
const CHIPS = ['5 sections', 'Mobile first', 'Copy written'];
const READY = 'Ready to build';
// timing (seconds from the reply start, or from the card where noted), the backlog beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const ROWS_AT = 0.12;                  // the card landing to the first section
const ROW_STAGGER = 0.11;              // one section to the next
const ROW_IN = 0.2;                    // a section landing
const CHIPS_AT = 0.86;                 // the card landing to the first chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.rows = SECTIONS.map((_, i) => T.card + ROWS_AT + i * ROW_STAGGER);
    T.planned = T.rows[T.rows.length - 1] + ROW_IN;   // the last section is in: the spinner resolves to the check
    T.chip = [...CHIPS, READY].map((_, i) => T.card + CHIPS_AT + i * STAGGER);
    // the beat's last visible change: the gold chip settled, or the line's last character
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="pl-card">
      <div class="pl-hd"><span class="pl-st"><i class="pl-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="pl-cnt"><b class="pl-n">0</b> of ${SECTIONS.length} sections</span></div>
      <div class="pl-vp">
        <div class="pl-fh"><span>section</span><span>copy</span></div>
        ${SECTIONS.map(([name, copy], i) => `<div class="pl-row"><i>${String(i + 1).padStart(2, '0')}</i><b>${esc(name)}</b><span>${esc(copy)}</span></div>`).join('')}
      </div>
      <div class="pl-chips">${CHIPS.map((c) => `<span class="pl-chip">${x.esc(c)}</span>`).join('')}<span class="pl-chip pl-ready">${x.esc(READY)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.pl-row')];
    const n = card.querySelector('.pl-n');
    const chips = [...card.querySelectorAll('.pl-chip')];
    const spin = card.querySelector('.pl-spin'), ok = card.querySelector('.pl-st .qc-ok');
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

        // the sections land one by one, the counter with them
        let landed = 0;
        rows.forEach((row, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          if (t >= T.rows[i]) landed = i + 1;
          row.style.opacity = q.toFixed(3);
          row.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * -8).toFixed(2)}px)`;
        });
        const c = String(landed);
        if (c !== count) { n.textContent = c; count = c; }

        // planned: the spinner resolves to the check as the last section lands
        const d = outCubic(seg(t, T.planned, T.planned + 0.2));
        spin.style.opacity = (1 - seg(t, T.planned - 0.08, T.planned + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
