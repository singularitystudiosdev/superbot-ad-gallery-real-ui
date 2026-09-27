// Assets beat, re-skinned as the ROSTER: Gemini designs Turbo Kart Rally's eight original racers. Its line streams,
// the "Balancing 8 racers" chip spins, and the roster sheet rises under its race header: eight racer cards in the
// game's own select-grid order, each with an empty portrait slot (the next step, Nano Banana Pro, paints those) and
// SPD / ACC / HDL / WGT pip bars that fill pip by pip, 90ms apart. Names and pip counts are the game's own, read off
// the CHOOSE YOUR RACER screen of the clip (img/tkr/xray.json "roster"); they are copied here, not invented.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Designing 8 original racers and balancing their stats.';
const HEADER = 'Palm Cove Circuit · 100cc · 3 laps';
const MAX = 5;
const STATS = ['spd', 'acc', 'hdl', 'wgt'];
// [name, spd, acc, hdl, wgt], exactly img/tkr/xray.json roster[] in its order
const ROSTER = [
  ['Blaze', 3, 3, 3, 3],
  ['Zippy', 3, 4, 3, 2],
  ['Bella', 2, 4, 5, 2],
  ['Toadly', 2, 5, 4, 1],
  ['Rex', 5, 1, 2, 5],
  ['Grumbo', 4, 2, 2, 4],
  ['Koopz', 3, 3, 4, 2],
  ['Dotty', 2, 4, 4, 1],
];
const CARD_STAGGER = 0.09; // one racer card landing to the next
const PIP = 0.09;          // one pip lighting to the next (the four bars fill side by side)
const PIPS_AT = 0.16;      // a card's first pip, after it lands

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.card = r + 0.34;
    T.racer = ROSTER.map((_, i) => r + 0.45 + i * CARD_STAGGER);
    // pip j of stat s on racer i lights at racer + PIPS_AT + j * PIP
    T.full = ROSTER.map((row, i) => T.racer[i] + PIPS_AT + (Math.max(...row.slice(1)) - 1) * PIP + 0.12);
    T.done = Math.max(...T.full) + 0.08;
    T.end = T.done + 0.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Balancing 8 racers</span></div></div>');
    const card = x.el(`<div class="as-card as-roster">
      <div class="as-hd"><b>${x.esc(HEADER)}</b><small class="as-sum">0 / 8 racers</small></div>
      <div class="as-grid">${ROSTER.map(([name, ...v]) => `<div class="as-racer">
        <span class="as-slot" aria-label="${x.esc(name)} portrait, not painted yet"><i class="as-q">?</i></span>
        <b class="as-name">${x.esc(name.toUpperCase())}</b>
        <span class="as-stats">${STATS.map((s, si) => `<span class="as-stat"><small>${s.toUpperCase()}</small><span class="as-pips">${
    Array.from({ length: MAX }, (_, j) => (j < v[si] ? '<i class="as-on"><b></b></i>' : '<i></i>')).join('')}</span></span>`).join('')}</span>
      </div>`).join('')}</div>
    </div>`);
    // per racer, per stat: the fill of each lit pip, in order (the empty slots behind them never move)
    const racers = [...card.querySelectorAll('.as-racer')].map((n) => ({
      n, pips: [...n.querySelectorAll('.as-pips')].map((p) => [...p.querySelectorAll('.as-on b')]),
    }));
    const sum = card.querySelector('.as-sum');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.racer[4], racers[4].n]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Balanced 8 racers' : 'Balancing 8 racers';
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        let ready = 0;
        racers.forEach((m, i) => {
          const a = T.racer[i];
          const p = seg(t, a, a + 0.3);
          m.n.style.opacity = outCubic(p).toFixed(3);
          m.n.style.transform = p >= 1 ? '' : `translateY(${((1 - outCubic(p)) * 8).toFixed(2)}px) scale(${lerp(0.94, 1, outBack(p)).toFixed(4)})`;
          // each bar fills in order, pip j at a + PIPS_AT + j * PIP, with a small pop as it lights
          m.pips.forEach((bar) => bar.forEach((pip, j) => {
            const q = seg(t, a + PIPS_AT + j * PIP, a + PIPS_AT + j * PIP + 0.12);
            pip.style.opacity = q.toFixed(3);
            pip.style.transform = q > 0 && q < 1 ? `scaleY(${lerp(0.4, 1, outBack(q)).toFixed(3)})` : '';
          }));
          const full = t >= T.full[i];
          m.n.classList.toggle('as-ready', full);
          if (full) ready++;
        });
        const ss = `${ready} / 8 racers`;
        if (sum.textContent !== ss) sum.textContent = ss;
      },
    };
  },
};
