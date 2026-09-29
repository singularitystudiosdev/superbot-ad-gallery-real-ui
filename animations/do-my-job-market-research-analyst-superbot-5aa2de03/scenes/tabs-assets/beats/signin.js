// Beat: SIGNING IN TO QUALTRICS XM, the last thing the chat shows before the camera pushes into the screen.
// Two chips resolve, a small card rises with the Qualtrics logo on it and states what superbot just opened, and the
// pill resolves "Connecting to Qualtrics" -> "Connected to Qualtrics" with the drawn check. The card is also the dive
// target: scenes/tabs.js zooms the camera into it (the make-minecraft cut's move) and the full Qualtrics desk
// (../qx.js) is revealed as the dive lands. The Qualtrics logo is the official logo file
// (../../img/qualtrics-logo.svg, see ../../img/CREDITS.txt) and appears inside the card, not as a crest. Timings are
// the call-center spot's; the project name, the response count and the tab plan's length come from ../qx-data.js.
import { seg, outCubic } from '../../../lib.js';
import { chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './cc.js';
import { DATASET, QUEUE } from '../qx-data.js';
import { STR } from '../qx-ui.js';

const fmt = (n) => Number(n).toLocaleString('en-US');
const N = QUEUE.length;
const CHIPS = [
  ['Signing in to Qualtrics XM', 'Signed in to Qualtrics XM'],
  [`Opening ${DATASET.project}`, `Opened ${DATASET.project} · ${fmt(DATASET.responses)} responses`],
];
// the pill's icon: a table grid (UI chrome, drawn in the chip icons' stroke style)
const GRID = '<svg class="cc-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17"/><path d="M3.5 14.5h17"/><path d="M9.5 4.5v15"/></svg>';

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.35, r + 0.60];
  T.chipDone = [r + 1.05, r + 1.30];
  T.card = r + 0.95;       // the logo card rises while the chips resolve
  T.build = r + 1.20;      // its fields land
  T.buildEnd = r + 2.00;
  T.pill = r + 2.05;       // "Connecting to Qualtrics" -> "Connected to Qualtrics"
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
      <span class="cc-badge cc-badge-logo"><img class="cc-logo" src="${x.asset('logo')}" alt="Qualtrics"/></span>
      <span class="cc-ht"><b>${x.esc(STR.productXM)}</b><small>${x.esc(STR.navData)} · ${x.esc(STR.subCrosstabs)}</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-seatrow"><span class="cc-seat">Signed in as ${x.esc(STR.author)}</span><span class="cc-seat-note">working as you</span></div>
    <div class="cc-tiles">
      <div class="cc-tile"><b class="cc-q">0</b><small>responses in ${x.esc(DATASET.project)}</small></div>
      <div class="cc-tile"><b>${N}</b><small>questions in the tab plan</small></div>
    </div>
    ${pillHTML(GRID, 'Connecting to Qualtrics', 'Connected to Qualtrics')}
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
      // the response count is shown as qx-data.js states it (no count-up: every figure on screen is a real one); the
      // tile itself rises with its neighbour
      counter(qn, DATASET.responses, DATASET.responses, T.build + 0.12, T.build + 0.85, t, (v) => fmt(Math.round(v)));
      liveDot(live, t, T.pill + 0.02);
      card.querySelector('.cc-seat-note').style.opacity = outCubic(seg(t, T.pill + 0.2, T.pill + 0.7)).toFixed(3);
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'signin', times, build };
