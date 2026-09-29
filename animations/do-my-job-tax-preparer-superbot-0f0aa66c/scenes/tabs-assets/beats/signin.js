// Beat: SIGNING IN TO PROCONNECT TAX, the last thing the chat shows before the camera pushes into the screen.
// Two chips resolve, a small card rises with the Intuit ProConnect Tax wordmark on it and states what superbot just
// opened (Tax Year 2025, the extended returns, their extended due date), and the pill resolves "Connecting to Intuit
// e-file" -> "Intuit e-file connected" with the drawn check ("Received by Intuit" is the product's first e-file
// status). The card is also the dive target: scenes/tabs.js zooms the camera into it (the make-minecraft cut's move)
// and the full ProConnect desk (../proconnect.js) is revealed as the dive lands. The wordmark is the official Intuit
// file (../../img/Intuit-ProConnect-Tax-2-line.svg, see ../../img/CREDITS.txt), unaltered on a white badge. Timings
// are the call-center spot's. The return count is the literal number of rows in the desk's queue; the date is the
// extended due date of 2025 Forms 1040 (Form 4868, facts id A-01).
import { seg, outCubic } from '../../../lib.js';
import { chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './cc.js';
import { QUEUE, DESK } from '../proconnect-data.js';

const N = QUEUE.length;

const CHIPS = [
  ['Signing in to ProConnect Tax', 'Signed in to ProConnect Tax'],
  [`Loading ${N} extended returns`, `Loaded ${N} extended returns`],
];

// the pill's icon: the File return tab's send arrow (UI chrome, drawn in the chip icons' stroke style)
const SEND = '<svg class="cc-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5 20 12 5 19.5l2.4-7.5Z"/><path d="M7.4 12H13"/></svg>';

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.35, r + 0.60];
  T.chipDone = [r + 1.05, r + 1.30];
  T.card = r + 0.95;       // the logo card rises while the chips resolve
  T.build = r + 1.20;      // its fields land
  T.buildEnd = r + 2.00;
  T.pill = r + 2.05;       // "Connecting to Intuit e-file" -> "Intuit e-file connected"
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
      <span class="cc-badge cc-badge-logo cc-badge-wide"><img class="cc-logo" src="${x.asset('logo')}" alt="Intuit ProConnect Tax"/></span>
      <span class="cc-ht"><b>Tax Year ${DESK.taxYear}</b><small>1040 Individual, extended returns</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-seatrow"><span class="cc-seat">Signed in to your ProConnect account</span><span class="cc-seat-note">filing as you</span></div>
    <div class="cc-tiles">
      <div class="cc-tile"><b class="cc-q">0</b><small>extended returns</small></div>
      <div class="cc-tile"><b>${DESK.due.replace(/^\w+ /, '')}</b><small>extended due date</small></div>
    </div>
    ${pillHTML(SEND, 'Connecting to Intuit e-file', 'Intuit e-file connected')}
  </div>`);
  const p = pillParts(card);
  const live = card.querySelector('.cc-live i');
  const seat = card.querySelector('.cc-seatrow');
  const tiles = [...card.querySelectorAll('.cc-tile')];
  const qn = card.querySelector('.cc-q');

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
      counter(qn, 0, N, T.build + 0.12, T.build + 0.85, t);
      liveDot(live, t, T.pill + 0.02);
      card.querySelector('.cc-seat-note').style.opacity = outCubic(seg(t, T.pill + 0.2, T.pill + 0.7)).toFixed(3);
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'signin', times, build };
