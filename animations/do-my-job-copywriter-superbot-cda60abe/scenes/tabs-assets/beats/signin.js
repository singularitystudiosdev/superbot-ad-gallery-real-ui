// Beat: OPENING THE COPY DECK IN GOOGLE DOCS, the last thing the chat shows before the camera pushes into the screen.
// Two chips resolve, a small card rises with the Google Docs icon on it and names the document superbot just opened,
// and the pill resolves "Connecting to Google Docs" -> "Connected to Google Docs" with the drawn check. The card is
// also the dive target: scenes/tabs.js zooms the camera into it (the make-minecraft cut's move) and the full Google
// Docs copy deck (../gdocs.js) is revealed as the dive lands. The Docs mark is the real icon file
// (../../img/google-docs-logo.svg, see ../../img/CREDITS.txt), shown static inside the card, not as a crest.
// Timings are the call-center spot's, unchanged. The comment count is the deck's own: one request per tab.
import { seg, outCubic } from '../../../lib.js';
import { chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './cc.js';
import { DELIVERABLES, DOC_TITLE, USER } from '../gdocs-data.js';

const N = DELIVERABLES.length;
const CHIPS = [
  ['Signing in to Google Docs', 'Signed in to Google Docs'],
  ['Opening Mailchimp copy deck', 'Mailchimp copy deck open'],
];
// the pill's icon: a document page (UI chrome, drawn in the chip icons' stroke style)
const DOC = '<svg class="cc-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>';

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.35, r + 0.60];
  T.chipDone = [r + 1.05, r + 1.30];
  T.card = r + 0.95;       // the logo card rises while the chips resolve
  T.build = r + 1.20;      // its fields land
  T.buildEnd = r + 2.00;
  T.pill = r + 2.05;       // "Connecting to Google Docs" -> "Connected to Google Docs"
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
      <span class="cc-badge cc-badge-logo"><img class="cc-logo" src="${x.asset('logo')}" alt="Google Docs"/></span>
      <span class="cc-ht"><b>Google Docs</b><small>${x.esc(DOC_TITLE)}</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-seatrow"><span class="cc-seat">Signed in as ${x.esc(USER.name)}</span><span class="cc-seat-note">writing as you</span></div>
    <div class="cc-tiles">
      <div class="cc-tile"><b class="cc-q">0</b><small>comments assigned</small></div>
      <div class="cc-tile"><b>Suggesting</b><small>mode</small></div>
    </div>
    ${pillHTML(DOC, 'Connecting to Google Docs', 'Connected to Google Docs')}
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
      // whole comments only while it counts up (the source's default fmt showed decimals mid-count)
      counter(qn, 0, N, T.build + 0.12, T.build + 0.85, t, (v) => String(Math.round(v)));
      liveDot(live, t, T.pill + 0.02);
      card.querySelector('.cc-seat-note').style.opacity = outCubic(seg(t, T.pill + 0.2, T.pill + 0.7)).toFixed(3);
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'signin', times, build };
