// Roll beat: GPT-6 Astra looks through the creator's camera roll and picks the week. Its line streams and a card rises
// holding a grid of 12 real food photos (img/roll-*.jpg, Pexels, img/CREDITS.txt). A scan line sweeps the grid top to
// bottom; as it passes each row the photos worth posting get a blue ring and a check badge (the rest dim a little),
// and each pick's day and caption land in the "This week" list beside the grid. Then the footer tallies the week.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic } from '../../../lib.js';

const SAY = 'Looked through your camera roll and picked a dish for every day.';
// the grid, row by row (4 columns): [photo, day it is picked for (or null)]
const GRID = [
  ['roll-01.jpg', 0], ['roll-08.jpg', null], ['roll-02.jpg', 1], ['roll-03.jpg', 2],
  ['roll-09.jpg', null], ['roll-04.jpg', 3], ['roll-05.jpg', 4], ['roll-10.jpg', null],
  ['roll-06.jpg', 5], ['roll-11.jpg', null], ['roll-07.jpg', 6], ['roll-12.jpg', null],
];
const COLS = 4, ROWS = GRID.length / COLS;
// the week: [day, caption] (the captions superbot writes, the same as the Planner cards)
export const WEEK = [
  ['Mon', '15-minute garlic noodles'],
  ['Tue', 'Crispy chickpea bowl'],
  ['Wed', 'Sheet pan lemon chicken'],
  ['Thu', 'One-pan salmon and rice'],
  ['Fri', 'Friday pizza dough, no mixer'],
  ['Sat', 'Crispy egg breakfast tacos'],
  ['Sun', 'Sunday sauce, 3 ways'],
];
const TALLY = '7 posts picked and captioned for the week';
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCAN_AT = 0.24;                  // the card landing to the scan line starting
const SCAN = 0.9; /* deliberate */     // the scan line crossing the grid, top to bottom
const COL_STAGGER = 0.04;              // within a row, one pick to the next (left to right)
const PICK_IN = 0.18;                  // a pick's ring, badge and caption popping in
const TALLY_AT = 0.2;                  // the scan done to the tally footer
const TALLY_IN = 0.24;                 // the tally rising in

const pct = (v) => `${(v * 100).toFixed(3)}%`;
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCAN_AT;
    T.s1 = T.s0 + SCAN;
    // the scan is linear in y, so a row's picks land as the line crosses that row's middle
    T.pick = GRID.map((_, i) => T.s0 + SCAN * ((Math.floor(i / COLS) + 0.5) / ROWS) + (i % COLS) * COL_STAGGER);
    T.day = WEEK.map((_, d) => T.pick[GRID.findIndex(([, day]) => day === d)]);
    T.tally = Math.max(T.s1, T.day[WEEK.length - 1] + PICK_IN) + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rl-card">
      <div class="rl-hd"><span class="rl-st"><i class="rl-spin"></i>${x.OK}</span><b>Looking through your camera roll</b><span class="rl-of">Recents</span></div>
      <div class="rl-body">
        <div class="rl-grid">
          ${GRID.map(([f, d]) => `<span class="rl-ph${d === null ? '' : ' rl-pk'}"><img src="${x.img(f)}" alt=""/>${d === null ? '' : `<i class="rl-ring"></i><i class="rl-badge">${CHECK}</i>`}</span>`).join('')}
          <i class="rl-scan"></i>
        </div>
        <div class="rl-side">
          <small>This week</small>
          <ul>${WEEK.map(([day, cap]) => `<li><b>${x.esc(day)}</b><span>${x.esc(cap)}</span></li>`).join('')}</ul>
        </div>
      </div>
      <div class="rl-ft">${x.OK}<span>${x.esc(TALLY)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const cells = [...card.querySelectorAll('.rl-ph')].map((n) => ({ n, ring: n.querySelector('.rl-ring'), badge: n.querySelector('.rl-badge') }));
    const items = [...card.querySelectorAll('.rl-side li')];
    const scan = $('.rl-scan'), ft = $('.rl-ft'), spin = $('.rl-spin'), ok = $('.rl-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scan line: linear top to bottom, fading in and out at the ends
        const p = seg(t, T.s0, T.s1);
        scan.style.top = pct(p);
        scan.style.opacity = (p > 0 && p < 1 ? Math.min(1, p * 8, (1 - p) * 8) : 0).toFixed(3);
        cells.forEach((c, i) => {
          const q = outCubic(seg(t, T.pick[i], T.pick[i] + PICK_IN));
          if (c.ring) {
            c.ring.style.opacity = q.toFixed(3);
            c.badge.style.opacity = q.toFixed(3);
            c.badge.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.4, 1, q).toFixed(4)})`;
          } else {
            c.n.style.opacity = lerp(1, 0.45, q).toFixed(3); // passed over: dims
          }
        });
        WEEK.forEach((_, d) => {
          const q = outCubic(seg(t, T.day[d], T.day[d] + PICK_IN));
          items[d].style.opacity = q.toFixed(3);
          items[d].style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * -6).toFixed(2)}px)`;
        });
        // done looking: the spinner resolves to the check as the scan finishes
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
