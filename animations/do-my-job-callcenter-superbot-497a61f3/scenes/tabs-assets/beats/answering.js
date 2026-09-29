// Beat d: ANSWERING CALLS FOR YOU, and the spot's finale.
// The line rings, superbot answers in your voice, the live transcript streams both turns, a Resolved chip draws
// its check, then the stats row ticks (calls answered 1 -> 47, 94% resolved, 2:11 average) and the camera dives
// into this card (the make-minecraft cut's zoom: scenes/tabs.js dives until the focused box covers the frame).
// Caller, order number and figures are fictional. Pure function of t.
import { clamp, seg, outCubic, streamCount } from '../../../lib.js';
import { ICO, chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, liveDot } from './cc.js';

const CHIPS = [
  ['Picking up the incoming call', 'Picked up an incoming call'],
  ['Pulling up the order', 'Pulled up order #48213'],
];
const CALLER = 'Hi, my package still hasn’t shown up.';
const REPLY = 'Sorry about that, Maria. Order 48213 is out for delivery and arrives by 6 pm today.';

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.10, r + 0.35];
  T.card = r + 0.80;
  T.build = r + 1.05;
  T.answer = r + 1.35;    // the pill: "Ringing" -> "Answered in your voice"
  T.chipDone = [T.answer + 0.05, T.answer + 0.22];  // the chips resolve with the answer, not before it
  T.turn1 = r + 1.60;     // the caller
  T.turn2 = r + 2.05;     // you, in the caller's ear
  T.resolved = r + 2.85;  // the drawn check on the outcome chip
  T.stats = r + 2.70;     // calls answered 1 -> 47
  T.done = r + 3.15;      // the last number landed: the card holds 1.2 s before the lens
  T.buildEnd = r + 2.40;  // the card is at its full height here: the last scroll settle is measured from this
  T.zoom = r + 4.35;      // the finale: the camera dives into this card
  T.zoomEnd = r + 5.25;
  T.end = r + 5.50;
  return T;
}

export function build(x, T) {
  const chips = CHIPS.map(([run, done]) => chipRow(x, run, done));
  const card = x.el(`<div class="cc-card cc-answer">
    <div class="cc-head">
      <span class="cc-badge cc-badge-ring">${ICO.phone}</span>
      <span class="cc-ht"><b>Incoming call</b><small>Maria Lopez · Order #48213</small></span>
      <span class="cc-live"><i></i>LIVE</span>
    </div>
    <div class="cc-turns">
      <div class="cc-turn"><span class="cc-sp">Caller</span><p><span class="cc-t1"></span><span class="cc-t1h"></span></p></div>
      <div class="cc-turn you"><span class="cc-sp">You</span><p><span class="cc-t2"></span><span class="cc-t2h"></span></p></div>
    </div>
    <div class="cc-res"><span class="cc-res-chip">${ICO.check}Resolved</span><span class="cc-res-note">No follow-up needed</span></div>
    <div class="cc-tiles3">
      <div class="cc-tile"><small>calls answered</small><b><span class="cc-ca">1</span></b></div>
      <div class="cc-tile"><small>resolved</small><b>94%</b></div>
      <div class="cc-tile"><small>avg handle</small><b>2:11</b></div>
    </div>
    ${pillHTML(ICO.phone, 'Ringing', 'Answered in your voice')}
  </div>`);
  const p = pillParts(card);
  const live = card.querySelector('.cc-live i');
  const ring = card.querySelector('.cc-badge-ring');
  const turns = [...card.querySelectorAll('.cc-turn')];
  const t1 = card.querySelector('.cc-t1'), t1h = card.querySelector('.cc-t1h');
  const t2 = card.querySelector('.cc-t2'), t2h = card.querySelector('.cc-t2h');
  const res = card.querySelector('.cc-res');
  const chip = card.querySelector('.cc-res-chip');
  const tiles3 = card.querySelector('.cc-tiles3');
  const tiles = [...card.querySelectorAll('.cc-tile')];
  const ca = card.querySelector('.cc-ca');
  const sub = card.querySelector('.cc-ht small');
  const SUB = sub.textContent;
  let shown1 = -1, shown2 = -1;

  return {
    nodes: [...chips.map((c) => c.el), card],
    marks: [[T.chipIn[0], chips[0].el], [T.card, card], [T.buildEnd, card]],
    // the scene reads this and dives the camera into the card (the b055c127 zoom cut's move)
    focus: { el: card, a: T.zoom, b: T.zoomEnd },
    render(t) {
      chips.forEach((c, i) => tickChip(c, t, T.chipIn[i], T.chipDone[i], T.chipIn[i]));
      riseCard(card, t, T.card);
      // ringing: the badge pulses until the call is answered
      const ringOn = 1 - seg(t, T.answer - 0.1, T.answer + 0.2);
      const beat = Math.max(0, Math.sin((t - T.card) * 5.6));
      ring.style.transform = `scale(${(1 + 0.14 * beat * ringOn).toFixed(3)})`;
      ring.style.boxShadow = `0 0 0 ${(6 * beat * ringOn).toFixed(1)}px rgba(52,211,153,${(0.22 * beat * ringOn).toFixed(2)})`;
      // the subtitle stays "Maria Lopez · Order #48213": the pill is the only place that states the answer
      if (sub.textContent !== SUB) sub.textContent = SUB;
      liveDot(live, t, T.answer + 0.05);
      turns.forEach((n, i) => rise(n, t, T.answer + 0.2 + i * 0.1, 6));
      const n1 = streamCount(CALLER, T.turn1, 46, t);
      if (n1 !== shown1) { t1.textContent = CALLER.slice(0, n1); t1h.textContent = CALLER.slice(n1); shown1 = n1; }
      const n2 = streamCount(REPLY, T.turn2, 86, t);
      if (n2 !== shown2) { t2.textContent = REPLY.slice(0, n2); t2h.textContent = REPLY.slice(n2); shown2 = n2; }
      const rp = seg(t, T.resolved, T.resolved + 0.45);
      res.style.opacity = outCubic(rp).toFixed(3);
      res.style.transform = `translateY(${((1 - outCubic(rp)) * 8).toFixed(2)}px)`;
      chip.style.setProperty('--t', outCubic(seg(t, T.resolved + 0.05, T.resolved + 0.5)).toFixed(3));
      rise(tiles3, t, T.stats - 0.2);
      tiles.forEach((n, i) => rise(n, t, T.stats - 0.2 + i * 0.08));
      const p47 = outCubic(seg(t, T.stats + 0.05, T.stats + 0.65));
      const ca02 = Math.round(1 + 46 * p47);
      if (ca.textContent !== String(ca02)) ca.textContent = String(ca02);
      ca.style.color = `rgba(52,211,153,${clamp(seg(t, T.stats, T.stats + 0.4)).toFixed(2)})`;
      renderPill(p, t, T.answer, true);
    },
  };
}

export default { id: 'answer', times, build };