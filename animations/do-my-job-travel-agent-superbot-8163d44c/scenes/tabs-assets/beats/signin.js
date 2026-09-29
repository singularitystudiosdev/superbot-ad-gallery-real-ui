// Beat: SIGNING IN TO SABRE RED 360, the last thing the chat shows before the camera pushes into the screen.
// Two chips resolve, a small card rises with the Sabre logo on it and counts the PNRs waiting in the agent's queues,
// and the pill resolves "Connecting to Sabre" -> "Connected to Sabre" with the drawn check. The card is also the
// dive target: scenes/tabs.js zooms the camera into it (the make-minecraft cut's move) and the full Sabre Red 360
// desk (../sabre.js) is revealed as the dive lands. The Sabre mark is the real logo file (../../img/sabre-logo.svg,
// see ../../img/CREDITS.txt) and appears inside the card, not as a crest. Timings are the call-center spot's. The
// queue count is the literal number of rows in the desk's queue (sabre-data.js QUEUE).
//
// REAL AND CITED: every flight, time, aircraft, rule, amount, Sabre entry, status code, queue number and ticket prefix
// the desk shows (scenes/tabs-assets/sabre-data.js; one line per fact with a verbatim quote in .tmp/ta-ad.8163d44c/
// research/sources.md, saved copies in research/snap, re-checked by audit/verify-shipped.8163d44c.mjs). The three
// worked PNRs: (a) UA852 TPE-SFO 03NOV26 retimed from 25OCT26 to 23:20 / 19:00 (AeroRoutes), 7 h 45 later on arrival,
// past the 6 h international line of 14 CFR 260.2, cancelled and rebooked on UA872 with X1‡01Y1 (Sabre queue 6);
// (b) LH440 FRA-IAH flown 02SEP26, 4 h 39 min late over 8,402 km, EUR 600 under EU261 Art. 7 (Your Europe), the
// e-ticket displayed with *T for the claim (its issue date / time are part of the fictional booking, its pseudo city
// code T3K7 and sine ASB part of the agent);
// (c) UA934 EWR-LHR 13OCT26, a US passport needs a UK ETA, £20 on GOV.UK, passport SSR added as 3DOCS/P, then ER.
// FICTIONAL ON PURPOSE (and nothing else is):
//   - traveler names (GDS 'SURNAME/FIRST MR|MS'; the source desk's own fictional callers, never a real private person)
//   - 6-letter record locators (pnr, OLD_ITEMS ids)
//   - ticket serial digits after the real 3-digit airline prefix
//   - the booking class letter 'Y' is a real full-fare economy code, chosen, not looked up per traveler
//   - desk timings: QUEUE wait/tIn/tAns/tRes/call copied verbatim from the source desk (e360-data.js QUEUE),
//     ACTIVITY handle times copied verbatim, in order, from the source desk's ACTIVITY
//   - the agent (superbot) and the fact that these travelers booked these flights
//   - the passport data in case (c)'s 3DOCS line: passport number, date of birth, gender and expiry (the field order,
//     the P document type and the US country codes follow the sourced Sabre format)
import { seg, outCubic } from '../../../lib.js';
import { chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './cc.js';
import { QUEUE } from '../sabre-data.js';

const N = QUEUE.length;

const CHIPS = [
  ['Signing in to Sabre Red 360', 'Signed in to Sabre Red 360'],
  ['Opening your queues', 'Queues open'],
];

// the pill's icon: a queue stack (UI chrome, drawn in the chip icons' stroke style)
const STACK = '<svg class="cc-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="4.4" rx="1"/><rect x="4" y="10" width="16" height="4.4" rx="1"/><path d="M4 18.6h10"/></svg>';

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.35, r + 0.60];
  T.chipDone = [r + 1.05, r + 1.30];
  T.card = r + 0.95;       // the logo card rises while the chips resolve
  T.build = r + 1.20;      // its fields land
  T.buildEnd = r + 2.00;
  T.pill = r + 2.05;       // "Connecting to Sabre" -> "Connected to Sabre"
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
      <span class="cc-badge cc-badge-logo"><img class="cc-logo" src="${x.asset('logo')}" alt="Sabre"/></span>
      <span class="cc-ht"><b>Sabre Red 360</b><small>Agent workspace · your queues</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-seatrow"><span class="cc-seat">Signed in to your Sabre session</span><span class="cc-seat-note">working as you</span></div>
    <div class="cc-tiles">
      <div class="cc-tile"><b class="cc-q">0</b><small>PNRs on queue</small></div>
      <div class="cc-tile"><b>Available</b><small>agent status</small></div>
    </div>
    ${pillHTML(STACK, 'Connecting to Sabre', 'Connected to Sabre')}
  </div>`);
  const p = pillParts(card);
  const live = card.querySelector('.cc-live i');
  const seat = card.querySelector('.cc-seatrow');
  const tiles = [...card.querySelectorAll('.cc-tile')];
  const qn = card.querySelector('.cc-q');

  return {
    nodes: [...chips.map((c) => c.el), card],
    // the feed also glides to the second chip as it rises (it would otherwise sit half under the composer's edge until
    // the card's mark): the glide starts 0.25 s early so the chip is in view by the time it is fully opaque
    marks: [[T.chipIn[0], chips[0].el], [T.chipIn[1] - 0.25, chips[1].el], [T.card, card], [T.buildEnd, card]],
    // the scene reads this and dives the camera into the card (the b055c127 zoom cut's move)
    focus: { el: card, a: T.zoom, b: T.zoomEnd },
    render(t) {
      chips.forEach((c, i) => tickChip(c, t, T.chipIn[i], T.chipDone[i], T.chipIn[i]));
      riseCard(card, t, T.card);
      rise(seat, t, T.build);
      tiles.forEach((n, i) => rise(n, t, T.build + 0.08 + i * 0.12));
      counter(qn, 0, N, T.build + 0.12, T.build + 0.85, t, (n) => String(Math.round(n)));  // a count of PNRs is whole
      liveDot(live, t, T.pill + 0.02);
      card.querySelector('.cc-seat-note').style.opacity = outCubic(seg(t, T.pill + 0.2, T.pill + 0.7)).toFixed(3);
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'signin', times, build };