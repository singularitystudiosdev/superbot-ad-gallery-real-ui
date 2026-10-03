// Queries beat: superbot reads the blog's top search queries from Search Console. Its line streams, a card rises
// ("Top queries  ·  slowpour.coffee  ·  Last 3 months", a target counter), and inside it the six queries land one by
// one with their impressions and average position (the report's own columns). Then the four that rank on page 2
// with no post written for them are marked: each row takes a soft blue highlight and a "Target" chip, one by one,
// while the counter runs up to 4. Then the chips land under it one by one ("4 target keywords", "69.4K impressions",
// "Avg position 13.7"), the last one the gold "Ready to write" (the webdev remake's plan.js grammar).
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants, so nothing reflows at any column width.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Pulled your top queries. 4 rank on page 2 with no post written for them.';
const LABEL = 'Top queries  ·  slowpour.coffee  ·  Last 3 months';
// query, impressions, average position, target (page 2, no post yet)
const ROWS = [
  ['cold brew ratio', '22,140', '14.8', true],
  ['pour over coffee ratio', '18,960', '12.3', true],
  ['french press grind size', '15,470', '16.1', true],
  ['aeropress recipe', '12,830', '11.7', true],
  ['how to descale a coffee maker', '9,410', '4.2', false],
  ['best beans for espresso', '7,925', '6.8', false],
];
const TARGETS = ROWS.filter((r) => r[3]).length;
const CHIPS = ['4 target keywords', '69.4K impressions', 'Avg position 13.7'];
const READY = 'Ready to write';
// timing (seconds from the reply start, or from the card where noted), plan.js's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const ROWS_AT = 0.12;                  // the card landing to the first query
const ROW_STAGGER = 0.08;              // one query to the next
const ROW_IN = 0.2;                    // a query landing
const TARGET_AT = 0.08;                // the last query in, then the first target is marked
const TARGET_STAGGER = 0.11;           // one target to the next
const TARGET_IN = 0.2;                 // a target's highlight and chip landing
const CHIPS_AT = 0.12;                 // the last target marked, then the first chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.rows = ROWS.map((_, i) => T.card + ROWS_AT + i * ROW_STAGGER);
    const lastRow = T.rows[T.rows.length - 1] + ROW_IN;
    T.tg = Array.from({ length: TARGETS }, (_, i) => lastRow + TARGET_AT + i * TARGET_STAGGER);
    T.marked = T.tg[TARGETS - 1] + TARGET_IN;          // the last target is marked: the spinner resolves to the check
    T.chip = [...CHIPS, READY].map((_, i) => T.marked + CHIPS_AT + i * STAGGER);
    // the beat's last visible change: the gold chip settled, or the line's last character
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qy-card">
      <div class="qy-hd"><span class="qy-st"><i class="qy-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="qy-cnt"><b class="qy-n">0</b> of ${TARGETS} targets</span></div>
      <div class="qy-vp">
        <div class="qy-fh"><span>Query</span><span>Impressions</span><span>Position</span><span></span></div>
        ${ROWS.map(([q, imp, pos, tg]) => `<div class="qy-row${tg ? ' qy-tg' : ''}"><b>${esc(q)}</b><span>${esc(imp)}</span><span>${esc(pos)}</span><span>${tg ? '<i class="qy-tag">Target</i>' : ''}</span></div>`).join('')}
      </div>
      <div class="qy-chips">${CHIPS.map((c) => `<span class="qy-chip">${x.esc(c)}</span>`).join('')}<span class="qy-chip qy-ready">${x.esc(READY)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.qy-row')];
    const targets = rows.filter((n) => n.classList.contains('qy-tg')).map((n) => ({ n, tag: n.querySelector('.qy-tag') }));
    const n = card.querySelector('.qy-n');
    const chips = [...card.querySelectorAll('.qy-chip')];
    const spin = card.querySelector('.qy-spin'), ok = card.querySelector('.qy-st .qc-ok');
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

        // the queries land one by one
        rows.forEach((row, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          row.style.opacity = q.toFixed(3);
          row.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * -8).toFixed(2)}px)`;
        });
        // the four targets are marked one by one, the counter with them
        let marked = 0;
        targets.forEach((o, i) => {
          const q = outCubic(seg(t, T.tg[i], T.tg[i] + TARGET_IN));
          if (t >= T.tg[i]) marked = i + 1;
          o.n.style.setProperty('--hl', q.toFixed(3));
          o.tag.style.opacity = q.toFixed(3);
          o.tag.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.6, 1, q).toFixed(4)})`;
        });
        const c = String(marked);
        if (c !== count) { n.textContent = c; count = c; }

        // marked: the spinner resolves to the check as the last target lands
        const d = outCubic(seg(t, T.marked, T.marked + 0.2));
        spin.style.opacity = (1 - seg(t, T.marked - 0.08, T.marked + 0.06)).toFixed(3);
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
