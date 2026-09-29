// Beat: SIGNING IN TO MICROSOFT 365 AND OPENING THE PROOF QUEUE IN WORD, the last thing the chat shows before the
// camera pushes into the screen. Two chips resolve, a card rises that is the Microsoft sign-in box as
// login.microsoftonline.com draws it (white, square corners, its 2px/6px shadow, the Microsoft logo top left, 600
// weight title; measured into .tmp/pe-ad.c54c5ecd/ref/login-microsoftonline.png, values in ../word.css :root --ms-*),
// holding what superbot just opened, and the pill resolves "Connecting to Word" -> "Connected to Word" with the drawn
// check. The card is also the dive target: scenes/tabs.js zooms the camera into it (the make-minecraft cut's move) and
// the Word desk (../word.js) is revealed as the dive lands. Timings are the source spot's, unchanged. The logos are the
// Wikimedia Commons files (../../img/microsoft-logo.svg, ../../img/word-logo.svg; see ../../img/CREDITS.txt). The
// document name and the queue length come from ../word-data.js.
import { seg, outCubic } from '../../../lib.js';
import { DOC_ICON, chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './wd.js';
import { DOC, QUEUE } from '../word-data.js';

const N = QUEUE.length;
const CHIPS = [
  ['Signing in to Microsoft 365', 'Signed in to Microsoft 365'],
  [`Opening ${DOC.file}`, `Opened ${DOC.file}`],
];

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.35, r + 0.60];
  T.chipDone = [r + 1.05, r + 1.30];
  T.card = r + 0.95;       // the sign-in card rises while the chips resolve
  T.build = r + 1.20;      // its fields land
  T.buildEnd = r + 2.00;
  T.pill = r + 2.05;       // "Connecting to Word" -> "Connected to Word"
  T.done = r + 2.55;
  T.zoom = r + 2.60;       // the camera starts its dive into this card here
  T.zoomEnd = r + 3.20;
  T.end = r + 2.85;
  return T;
}

export function build(x, T) {
  const chips = CHIPS.map(([run, done]) => chipRow(x, run, done));
  const card = x.el(`<div class="cc-card cc-signin ms-box">
    <div class="cc-head">
      <img class="ms-logo" src="${x.asset('logo')}" alt="Microsoft"/>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="ms-app"><img class="ms-word" src="${x.asset('word')}" alt=""/><span class="cc-ht"><b>Word</b><small>${x.esc(DOC.file)}</small></span></div>
    <div class="cc-seatrow"><span class="cc-seat">Signed in as Sam</span><span class="cc-seat-note">proofing as you</span></div>
    <div class="cc-tiles">
      <div class="cc-tile"><b class="cc-q">0</b><small>pieces in the queue</small></div>
      <div class="cc-tile"><b>For Everyone</b><small>Track Changes</small></div>
    </div>
    ${pillHTML(DOC_ICON, 'Connecting to Word', 'Connected to Word')}
  </div>`);
  const p = pillParts(card);
  const live = card.querySelector('.cc-live i');
  const seat = card.querySelector('.cc-seatrow');
  const app = card.querySelector('.ms-app');
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
      rise(app, t, T.build - 0.1);
      rise(seat, t, T.build);
      tiles.forEach((n, i) => rise(n, t, T.build + 0.08 + i * 0.12));
      // whole pieces only while it counts up
      counter(qn, 0, N, T.build + 0.12, T.build + 0.85, t, (v) => String(Math.round(v)));
      liveDot(live, t, T.pill + 0.02);
      card.querySelector('.cc-seat-note').style.opacity = outCubic(seg(t, T.pill + 0.2, T.pill + 0.7)).toFixed(3);
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'signin', times, build };
