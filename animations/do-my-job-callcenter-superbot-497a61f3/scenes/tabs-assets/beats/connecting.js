// Beat a: CONNECTING TO THE CALL CENTER.
// Two chips land and resolve, the line card rises (headset, the support number, the agent's seat and the queue
// stats), and the status pill resolves "Connecting..." into "Connected" with a shine and a drawn check while the
// card's live dot lights. The whole card is a pure function of t. Every name and number is fictional.
import { seg, outCubic } from '../../../lib.js';
import { ICO, chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter, liveDot } from './cc.js';

const CHIPS = [
  ['Connecting to your call center', 'Connected to your call center'],
  ['Syncing today’s queue', 'Synced today’s queue'],
];

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.10, r + 0.35];
  T.chipDone = [r + 0.85, r + 1.05];
  T.card = r + 0.80;      // the card rises while the chips resolve
  T.build = r + 1.05;     // the card's fields land
  T.buildEnd = r + 2.25;
  T.pill = r + 2.35;      // "Connecting..." -> "Connected"
  T.done = r + 2.85;      // everything landed (1.35 s of it stays on screen before the next beat)
  T.end = r + 4.20;
  return T;
}

export function build(x, T) {
  const chips = CHIPS.map(([run, done]) => chipRow(x, run, done));
  const card = x.el(`<div class="cc-card cc-connect">
    <div class="cc-head">
      <span class="cc-badge">${ICO.headset}</span>
      <span class="cc-ht"><b>Support line</b><small>(415) 555-0142</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-seatrow"><span class="cc-seat">Seat 14 · Sam R.</span><span class="cc-seat-note">answering as you</span></div>
    <div class="cc-tiles">
      <div class="cc-tile"><b class="cc-q">0</b><small>in queue</small></div>
      <div class="cc-tile"><b>3:40</b><small>avg wait</small></div>
    </div>
    ${pillHTML(ICO.phone, 'Connecting', 'Connected')}
  </div>`);
  const p = pillParts(card);
  const live = card.querySelector('.cc-live i');
  const seat = card.querySelector('.cc-seatrow');
  const tiles = [...card.querySelectorAll('.cc-tile')];
  const qn = card.querySelector('.cc-q');

  return {
    nodes: [...chips.map((c) => c.el), card],
    marks: [[T.chipIn[0], chips[0].el], [T.card, card], [T.buildEnd, card]],
    render(t) {
      chips.forEach((c, i) => tickChip(c, t, T.chipIn[i], T.chipDone[i], T.chipIn[i]));
      riseCard(card, t, T.card);
      rise(seat, t, T.build);
      tiles.forEach((n, i) => rise(n, t, T.build + 0.08 + i * 0.12));
      counter(qn, 0, 12, T.build + 0.12, T.build + 0.85, t);
      liveDot(live, t, T.pill + 0.02);
      const q = card.querySelector('.cc-seat-note');
      q.style.opacity = outCubic(seg(t, T.pill + 0.2, T.pill + 0.7)).toFixed(3);
      renderPill(p, t, T.pill, true);
    },
  };
}

export default { id: 'connect', times, build };