// Slots beat: GPT-6 Astra solves the week. Its line streams and a card rises in the backlog card's grammar: header
// "Fitting 6 calls across 5 time zones" with the spinner resolving to the check, then the slot rows land one by one,
// each with the base's green check (client, Nina's time, the client's own time), a quieter "+3 more" row, the three
// chips ("All 6 inside their 9 to 5", "2 meetings moved", "Friday focus time kept") and the tally line with the check:
// "0 double bookings left". Every time pair is for the week of Mon Oct 5 2026 (New York EDT, UTC-4; London BST, UTC+1;
// Berlin CEST, UTC+2; Los Angeles PDT, UTC-7). Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Found a slot for every call inside each client\'s working hours.';
const HEAD = 'Fitting 6 calls across 5 time zones';
// [client, Nina's time, the client's time]
export const SLOTS = [
  ['Harbor & Pine', 'Mon 10:00 AM', '3:00 PM in London'],
  ['Brightwater Cycles', 'Tue 9:00 AM', '3:00 PM in Berlin'],
  ['Lumen & Tide', 'Wed 1:00 PM', '10:00 AM in Los Angeles'],
];
const MORE = '+3 more';
const CHIPS = ['All 6 inside their 9 to 5', '2 meetings moved', 'Friday focus time kept'];
const TALLY = '0 double bookings left';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const ROW_AT = 0.3;                    // the card landing to the first slot row
const STAGGER = 0.18;                  // one slot row to the next (each lands with its check)
const ROW_IN = 0.24;                   // a row rising in
const SOLVED = 0.1;                    // the "+3 more" row landed to the header's check
const CHIP_AT = 0.12;                  // the last row to the first chip
const CHIP_STAGGER = 0.1;              // one chip to the next
const CHIP_IN = 0.22;
const TALLY_AT = 0.12;                 // the last chip to the tally line
const TALLY_IN = 0.24;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.row = [...SLOTS, MORE].map((_, i) => T.card + ROW_AT + i * STAGGER);
    T.solved = T.row[SLOTS.length] + SOLVED;
    T.chip = CHIPS.map((_, i) => T.row[SLOTS.length] + CHIP_AT + i * CHIP_STAGGER);
    T.tally = T.chip[CHIPS.length - 1] + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="sl-card">
      <div class="sl-hd"><span class="sl-st"><i class="sl-spin"></i>${x.OK}</span><b>${x.esc(HEAD)}</b></div>
      <div class="sl-list">
        ${SLOTS.map(([c, mine, theirs]) => `<div class="sl-row"><span class="sl-ck">${x.OK}</span><b>${x.esc(c)}</b><span class="sl-mine">${x.esc(mine)}</span><span class="sl-theirs">${x.esc(theirs)}</span></div>`).join('')}
        <div class="sl-row sl-more"><span class="sl-ck">${x.OK}</span><span>${x.esc(MORE)}</span></div>
      </div>
      <div class="sl-chips">${CHIPS.map((c) => `<span class="sl-chip">${x.esc(c)}</span>`).join('')}</div>
      <div class="sl-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.sl-row')], chips = [...card.querySelectorAll('.sl-chip')];
    const spin = $('.sl-spin'), ok = $('.sl-st .qc-ok'), ft = $('.sl-ft');
    const checks = rows.map((rw) => rw.querySelector('.sl-ck .qc-ok'));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // solving: the spinner turns until the last row lands, then resolves to the check
        const d = outCubic(seg(t, T.solved, T.solved + 0.2));
        spin.style.opacity = (1 - seg(t, T.solved - 0.08, T.solved + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // each slot row rises in, and its check pops as it lands
        rows.forEach((rw, i) => {
          const q = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          rw.style.opacity = q.toFixed(3);
          rw.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px)`;
          const c = outCubic(seg(t, T.row[i] + 0.1, T.row[i] + 0.28));
          checks[i].style.opacity = c.toFixed(3);
          checks[i].style.transform = `scale(${lerp(0.4, 1, c).toFixed(4)})`;
        });
        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px) scale(${lerp(0.94, 1, q).toFixed(4)})`;
        });
        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
