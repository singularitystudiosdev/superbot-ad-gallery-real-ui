// Backlog beat: Gemini reads the raw CSV. Its line streams, a card rises ("Reading sales_2026.csv", a row counter),
// and inside it a window of the file's raw lines in mono (order_id,date,region,amount) scrolls fast from the header to
// the end while the counter runs up to 2,418 rows. The mess is visible as it passes: five date formats, money in
// three currencies and three notations, blank regions, a line that repeats. Then the read resolves: the lines dim
// under a scrim and the problems Gemini found land as chips over them, one by one, the last one the gold
// "Ready to clean".
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Read all 2,418 rows. Found 37 duplicates, 5 date formats and 3 currencies.';
const LABEL = 'Reading sales_2026.csv';
const TOTAL = 2418;
const HEAD = 'order_id,date,region,amount';
// the raw file as it scrolls past: [order_id, date, region, amount, duplicate?]. Made up for the spot.
const ROWS = [
  ['10231', '03/14/2026', 'North America', '"$1,240.00"'],
  ['10232', '2026-03-14', 'Europe', 'EUR 980.50'],
  ['10233', '14 Mar 2026', '', '2150'],
  ['10233', '14 Mar 2026', '', '2150', true],
  ['10234', 'Mar 14 26', 'Asia Pacific', 'GBP 715'],
  ['10235', '2026/03/15', 'Latin America', 'USD 2050'],
  ['10236', '03/15/2026', 'Europe', 'EUR 2,310.00'],
  ['10236', '03/15/2026', 'Europe', 'EUR 2,310.00', true],
  ['10237', '15 Mar 2026', '', '"$3,480.00"'],
  ['10238', '2026-03-16', 'North America', '1890'],
  ['10239', 'Mar 16 26', 'Asia Pacific', 'GBP 1,240'],
  ['10240', '03/16/2026', 'North America', 'USD 4200'],
  ['10241', '16 Mar 2026', 'Europe', 'EUR 1,150.00'],
  ['10242', '2026/03/17', 'Latin America', '960'],
  ['12647', '09/29/2026', '', '"$2,780.00"'],
  ['12648', '2026-09-30', 'North America', 'USD 3100'],
  ['12648', '2026-09-30', 'North America', 'USD 3100', true],
  ['12649', 'Sep 30 26', 'Europe', 'EUR 1,420.00'],
  ['12650', '30 Sep 2026', 'Asia Pacific', 'GBP 860'],
  ['12651', '2026/09/30', 'Latin America', '1675'],
];
const ISSUES = ['37 duplicate rows', '5 date formats', '3 currencies', '14 blank regions'];
const READY = 'Ready to clean';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */  // the file scrolling past, header to the last line (the counter runs with it)
const CHIPS_AT = 0.82;                 // the card landing to the first issue chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in
const SHOWN = 5;                       // rows visible in the window
const ROW = 22;                        // one row's height, px

const fmt = (n) => n.toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// one raw line, its fields tinted so the mess reads at speed (a blank region is just the two commas)
const line = ([id, date, region, amount, dup]) => `<div class="bk-row${dup ? ' bk-dup' : ''}"><span class="bk-id">${id}</span>,<span class="bk-dt">${esc(date)}</span>,${region ? `<span class="bk-rg">${esc(region)}</span>` : '<i class="bk-blank"></i>'},<span class="bk-am">${esc(amount)}</span></div>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.chip = [...ISSUES, READY].map((_, i) => T.card + CHIPS_AT + i * STAGGER);
    // the beat's last visible change: the gold chip settled, or the line's last character
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="bk-card">
      <div class="bk-hd"><span class="bk-st"><i class="bk-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="bk-cnt"><b class="bk-n">0</b> rows</span></div>
      <div class="bk-vp">
        <div class="bk-fh">${HEAD}</div>
        <div class="bk-win"><div class="bk-list">${ROWS.map(line).join('')}</div></div>
        <i class="bk-scrim"></i>
        <div class="bk-chips">${ISSUES.map((tp) => `<span class="bk-chip">${x.esc(tp)}</span>`).join('')}<span class="bk-chip bk-ready">${x.esc(READY)}</span></div>
      </div>
    </div>`);
    const list = card.querySelector('.bk-list'), n = card.querySelector('.bk-n'), scrim = card.querySelector('.bk-scrim');
    const chips = [...card.querySelectorAll('.bk-chip')];
    const spin = card.querySelector('.bk-spin'), ok = card.querySelector('.bk-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ROWS.length - SHOWN) * ROW;
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

        // the scroll: header to the last line, fast through the middle (a touch of blur at speed), the counter with it
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        list.style.transform = `translateY(${(-span * e).toFixed(2)}px)`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        const c = fmt(Math.round(TOTAL * outCubic(p)));
        if (c !== count) { n.textContent = c; count = c; }

        // done reading: the spinner resolves to the check as the counter lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the read resolves into its issues: the lines dim under the scrim, the chips land over them
        scrim.style.opacity = outCubic(seg(t, T.chip[0] - 0.1, T.chip[0] + 0.2)).toFixed(3);
        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
