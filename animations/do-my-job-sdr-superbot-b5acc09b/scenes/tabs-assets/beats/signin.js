// Beat: SIGNING IN TO OUTREACH, the last thing the chat shows before the camera pushes into the screen.
// Two chips resolve, a small card rises with the Outreach logo on a white badge and states the seat superbot just
// took (Sales Development Rep), and the pill resolves "Connecting to Outreach" -> "Connected to Outreach" with the drawn
// check. The card is also the dive target: scenes/tabs.js zooms the camera into it (the make-minecraft cut's move) and
// the full Outreach desk (../outreach.js) is revealed as the dive lands. The Outreach logo is the official logo file
// (../../img/outreach-logo.svg, see ../../img/CREDITS.txt) and appears inside the card, not as a crest. Timings are the
// call-center spot's; every string and both tile counts come from ../outreach-data.js (the counts are computed from its
// TASKS array: the tasks due today and the distinct sequences they belong to).
import { seg, outCubic } from '../../../lib.js';
import { ICO, chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './cc.js';
import { SEAT, TASKS, SIGNIN } from '../outreach-data.js';

const fmt = (n) => Number(n).toLocaleString('en-US');
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : `{${k}}`));
const DUE = Math.min(TASKS.length, 12);
const SEQS = new Set(TASKS.slice(0, DUE).map((t) => t.sequence)).size;
const COUNTS = [DUE, SEQS];
const CHIPS = SIGNIN.chips.map(([run, done]) => [fill(run, { n: fmt(DUE) }), fill(done, { n: fmt(DUE) })]);

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.35, r + 0.60];
  T.chipDone = [r + 1.05, r + 1.30];
  T.card = r + 0.95;       // the logo card rises while the chips resolve
  T.build = r + 1.20;      // its fields land
  T.buildEnd = r + 2.00;
  T.pill = r + 2.05;       // "Connecting to Outreach" -> "Connected to Outreach"
  T.done = r + 2.55;
  T.zoom = r + 2.60;       // the camera starts its dive into this card here
  T.zoomEnd = r + 3.20;
  T.end = r + 2.85;
  return T;
}

export function build(x, T) {
  const chips = CHIPS.map(([run, done]) => chipRow(x, run, done));
  const card = x.el(`<div class="cc-card cc-signin">
    <div class="cc-head">
      <span class="cc-badge cc-badge-logo"><img class="cc-logo" src="${x.asset('logo')}" alt="Outreach"/></span>
      <span class="cc-ht"><b>${x.esc(SEAT.role)}</b><small>${x.esc(SIGNIN.sub)}</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-seatrow"><span class="cc-seat">${x.esc(fill(SIGNIN.seat, { user: SEAT.user }))}</span><span class="cc-seat-note">${x.esc(SIGNIN.seatNote)}</span></div>
    <div class="cc-tiles">
      ${SIGNIN.tiles.map(([, label], i) => `<div class="cc-tile"><b class="cc-q">0</b><small>${x.esc(label)}</small></div>`).join('')}
    </div>
    ${pillHTML(ICO.phone, x.esc(SIGNIN.pill[0]), x.esc(SIGNIN.pill[1]))}
  </div>`);
  const p = pillParts(card);
  const live = card.querySelector('.cc-live i');
  const seat = card.querySelector('.cc-seatrow');
  const tiles = [...card.querySelectorAll('.cc-tile')];
  const nums = [...card.querySelectorAll('.cc-q')];

  return {
    nodes: [...chips.map((c) => c.el), card],
    marks: [[T.chipIn[0], chips[0].el], [T.card, card], [T.buildEnd, card]],
    // the scene reads this and dives the camera into the card (the b055c127 zoom cut's move)
    focus: { el: card, a: T.zoom, b: T.zoomEnd },
    render(t) {
      chips.forEach((c, i) => tickChip(c, t, T.chipIn[i], T.chipDone[i], T.chipIn[i]));
      riseCard(card, t, T.card);
      rise(seat, t, T.build);
      tiles.forEach((n, i) => rise(n, t, T.build + 0.08 + i * 0.12));
      // both counts are counted from the data (no figure typed in); they count up as their tile rises
      nums.forEach((n, i) => counter(n, 0, COUNTS[i] || 0, T.build + 0.12, T.build + 0.85, t, (v) => fmt(Math.round(v))));
      liveDot(live, t, T.pill + 0.02);
      card.querySelector('.cc-seat-note').style.opacity = outCubic(seg(t, T.pill + 0.2, T.pill + 0.7)).toFixed(3);
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'signin', times, build };
