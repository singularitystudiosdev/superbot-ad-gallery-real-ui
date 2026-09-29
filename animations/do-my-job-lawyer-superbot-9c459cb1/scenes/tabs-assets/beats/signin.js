// Beat: SIGNING IN TO CLIO MANAGE, the last thing the chat shows before the camera pushes into the screen.
// Two chips resolve, a small card rises with the Clio logo on it and states what superbot just opened, and the
// pill resolves "Connecting to Clio" -> "Connected to Clio" with the drawn check. The card is also the dive
// target: scenes/tabs.js zooms the camera into it (the make-minecraft cut's move) and the full Clio Manage matter
// desk (../clio.js) is revealed as the dive lands. The Clio mark is the real logo file (../../img/clio-logo.svg,
// see ../../img/CREDITS.txt) and appears inside the card, not as a crest. Timings are the call-center spot's.
import { seg, outCubic } from '../../../lib.js';
import { chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './cc.js';
import { NOTICES } from '../clio-data.js';

const N = NOTICES.length;
const CHIPS = [
  ['Signing in to Clio Manage', 'Signed in to Clio Manage'],
  [`Syncing ${N} ECF notices`, `Synced ${N} ECF notices`],
];
// the pill's icon: a docket page (UI chrome, drawn in the chip icons' stroke style)
const DOCKET = '<svg class="cc-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8.4L19 8v12.5H6z"/><path d="M14.2 3.5V8H19"/><path d="M9 12.4h6"/><path d="M9 16h4"/></svg>';

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.35, r + 0.60];
  T.chipDone = [r + 1.05, r + 1.30];
  T.card = r + 0.95;       // the logo card rises while the chips resolve
  T.build = r + 1.20;      // its fields land
  T.buildEnd = r + 2.00;
  T.pill = r + 2.05;       // "Connecting to Clio" -> "Connected to Clio"
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
      <span class="cc-badge cc-badge-logo"><img class="cc-logo" src="${x.asset('logo')}" alt="Clio"/></span>
      <span class="cc-ht"><b>Clio Manage</b><small>Matters and ECF notices</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-seatrow"><span class="cc-seat">Signed in to your Clio account</span><span class="cc-seat-note">working as you</span></div>
    <div class="cc-tiles">
      <div class="cc-tile"><b class="cc-q">0</b><small>new ECF notices</small></div>
      <div class="cc-tile"><b>Synced</b><small>court docket</small></div>
    </div>
    ${pillHTML(DOCKET, 'Connecting to Clio', 'Connected to Clio')}
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
