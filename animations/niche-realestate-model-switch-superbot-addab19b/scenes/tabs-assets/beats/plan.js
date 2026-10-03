// Plan beat: Claude Opus 5.5 ranks the 8 homes that passed by school rating, price and size, keeps the top 3, checks
// the user's calendar for free time and drafts the tour requests. Its line streams, a card rises ("Top 3 of 8  ·
// ranked by schools, price, size"), the three homes land one by one (rank, photo, address, price and size, the
// elementary's rating circle), each followed by the free slot found for it ("Tue Oct 6, 5:30 PM", "Thu Oct 8, 6:00 PM",
// "Sat Oct 10, 10:00 AM"), then the chips ("Calendar checked", "3 tour requests drafted") and the gold "Ready to book"
// (the template's plan grammar). Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Ranked the 8 by school rating, price and size, kept the top 3 and found times you are free.';
const LABEL = 'Top 3 of 8  ·  ranked by schools, price, size';
// [photo, address, price, details, elementary rating, the free slot]
export const TOP = [
  ['house-1.jpg', '1438 Juniper Ave', '$449,900', '1,860 sqft', 9, 'Tue Oct 6, 5:30 PM'],
  ['house-2.jpg', '682 Hillcrest Dr', '$485,000', '2,140 sqft', 9, 'Thu Oct 8, 6:00 PM'],
  ['house-3.jpg', '215 Ottawa Ave', '$419,500', '1,720 sqft', 9, 'Sat Oct 10, 10:00 AM'],
];
const CHIPS = ['Calendar checked', '3 tour requests drafted'];
const READY = 'Ready to book';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;
const SAY_AT = 0.048;
const CARD = 0.144;
const RISE = 0.36;
const ROWS_AT = 0.12;
const ROW_STAGGER = 0.14;
const ROW_IN = 0.22;
const SLOT_AT = 0.2;                   // a row in, then its slot lands
const SLOT_IN = 0.22;
const CHIPS_AT = 0.1;                  // the last slot in, then the chips
const STAGGER = 0.07;
const CHIP_IN = 0.24;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.rows = TOP.map((_, i) => T.card + ROWS_AT + i * ROW_STAGGER);
    T.slot = T.rows.map((a) => a + SLOT_AT);
    T.done = T.slot[TOP.length - 1] + SLOT_IN;
    T.chip = [...CHIPS, READY].map((_, i) => T.done + CHIPS_AT + i * STAGGER);
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const cal = '<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>';
    const card = x.el(`<div class="pl-card">
      <div class="pl-hd"><span class="pl-st"><i class="pl-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b></div>
      <div class="pl-vp">
        ${TOP.map(([f, addr, price, det, r, slot], i) => `<div class="pl-row"><i class="pl-rk">${i + 1}</i><span class="pl-th"><img src="${x.img(f)}" alt=""/></span>
          <span class="pl-tx"><b>${esc(addr)}</b><small><em>${esc(price)}</em>${esc('  ·  ' + det)}</small></span>
          <i class="pl-r">${r}</i><span class="pl-slot">${cal}${esc(slot)}</span></div>`).join('')}
      </div>
      <div class="pl-chips">${CHIPS.map((c) => `<span class="pl-chip">${x.esc(c)}</span>`).join('')}<span class="pl-chip pl-ready">${x.esc(READY)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.pl-row')];
    const slots = [...card.querySelectorAll('.pl-slot')];
    const chips = [...card.querySelectorAll('.pl-chip')];
    const spin = card.querySelector('.pl-spin'), ok = card.querySelector('.pl-st .qc-ok');
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
        rows.forEach((row, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          row.style.opacity = q.toFixed(3);
          row.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * -8).toFixed(2)}px)`;
          const s = outCubic(seg(t, T.slot[i], T.slot[i] + SLOT_IN));
          slots[i].style.opacity = s.toFixed(3);
          slots[i].style.transform = s >= 1 ? 'none' : `scale(${lerp(0.85, 1, s).toFixed(4)})`;
        });
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
      },
    };
  },
};
