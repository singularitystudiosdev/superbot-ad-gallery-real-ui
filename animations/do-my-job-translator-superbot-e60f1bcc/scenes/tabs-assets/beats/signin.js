// Beat: SIGNING IN TO PHRASE TMS, the last thing the chat shows before the camera pushes into the screen.
// Two chips resolve, a small card rises with the Phrase logo on it and states what superbot just opened, and the
// pill resolves "Connecting to Phrase" -> "Connected to Phrase" with the drawn check. The card is also the dive
// target: scenes/tabs.js zooms the camera into it (the make-minecraft cut's move) and the full Phrase TMS
// translator desk (../phrase.js) is revealed as the dive lands. The Phrase logo is the real logo file
// (../../img/phrase-logo.svg, see ../../img/CREDITS.txt) and appears inside the card, not as a crest. Timings are
// the call-center spot's.
import { seg, outCubic } from '../../../lib.js';
import { chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './cc.js';
import { JOBS, PAIR } from '../phrase-data.js';

const N = JOBS.length;
const CHIPS = [
  ['Signing in to Phrase TMS', 'Signed in to Phrase TMS'],
  [`Syncing ${N} jobs`, `Synced ${N} jobs`],
];
// the pill's icon: a document page (UI chrome, drawn in the chip icons' stroke style)
const DOC = '<svg class="cc-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8.4L19 8v12.5H6z"/><path d="M14.2 3.5V8H19"/><path d="M9 12.4h6"/><path d="M9 16h4"/></svg>';

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.35, r + 0.60];
  T.chipDone = [r + 1.05, r + 1.30];
  T.card = r + 0.95;       // the logo card rises while the chips resolve
  T.build = r + 1.20;      // its fields land
  T.buildEnd = r + 2.00;
  T.pill = r + 2.05;       // "Connecting to Phrase" -> "Connected to Phrase"
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
      <span class="cc-badge cc-badge-logo"><img class="cc-logo" src="${x.asset('logo')}" alt="Phrase"/></span>
      <span class="cc-ht"><b>Phrase TMS</b><small>Jobs and CAT editor</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-seatrow"><span class="cc-seat">Signed in to your Phrase account</span><span class="cc-seat-note">working as you</span></div>
    <div class="cc-tiles">
      <div class="cc-tile"><b class="cc-q">0</b><small>new jobs</small></div>
      <div class="cc-tile"><b>${x.esc(PAIR.src)} to ${x.esc(PAIR.tgt)}</b><small>language pair</small></div>
    </div>
    ${pillHTML(DOC, 'Connecting to Phrase', 'Connected to Phrase')}
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
      // a job count is a whole number while it counts up (the helper's default format keeps 3 decimals)
      counter(qn, 0, N, T.build + 0.12, T.build + 0.85, t, (v) => String(Math.round(v)));
      liveDot(live, t, T.pill + 0.02);
      card.querySelector('.cc-seat-note').style.opacity = outCubic(seg(t, T.pill + 0.2, T.pill + 0.7)).toFixed(3);
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'signin', times, build };
