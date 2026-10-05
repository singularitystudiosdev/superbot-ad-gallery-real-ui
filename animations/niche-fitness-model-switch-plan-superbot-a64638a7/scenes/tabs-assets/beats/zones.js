// Gemini's beat: sets the training paces the whole plan runs on. The goal half marathon (1:55:00) gives a VDOT, and
// each zone is the speed at a fraction of it (plan-data.js), so the card is real coaching math, not a pace chart typed in.
// The card: four stat tiles (goal, race pace, VDOT, easy pace), then the five zones as range bars on one pace axis
// (slow on the left, fast on the right) with a dashed race-pace guide through every row, each zone's pace range, its
// % of VDOT and what the plan uses it for. Same grammar as the hub's reply cards: dark card, inset wells.
import { lerp, seg, outCubic } from '../../../lib.js';
import { ZONES, VDOT, PACE, GOAL, fmt } from './plan-data.js?v=a64638a7';
import { ZC } from './struct.js?v=a64638a7';

const SAY = `Worked out your paces from a ${GOAL} goal: five zones, race pace ${PACE.RP} a mile.`;
const TITLE = 'Training paces';
const TAG = `From your ${GOAL} goal`;
const DONE = `5 zones set, every pace from VDOT ${VDOT.toFixed(1)}`;
const TILES = [
  ['Goal', GOAL, 'Half marathon, 13.1 mi'],
  ['Race pace', PACE.RP, 'per mile, even splits'],
  ['VDOT', VDOT.toFixed(1), 'fitness the goal needs'],
  ['Easy pace', PACE.E, 'per mile, conversational'],
];
// the pace axis: 11:00 /mi on the left to 7:00 /mi on the right
const SLOW = 11, FAST = 7;
const X = (p) => ((SLOW - p) / (SLOW - FAST)) * 100;
const TICKS = [11, 10, 9, 8, 7];

// timing (seconds)
const CARD_AT = 0.144; /* deliberate */ // reply start to the card
const CARD_IN = 0.36;
const SAY_AT = 0.04, CPS = 100;
const TILE_AT = 0.12, TILE_GAP = 0.06, TILE_IN = 0.24;
const ROW_AT = 0.3, ROW_GAP = 0.08, ROW_IN = 0.22, BAR = 0.34;
const GUIDE_IN = 0.3;
const DONE_AT = 1.18;
const FOOT_IN = 0.24, HOLD = 0.3; /* deliberate */ // the finished card reads before the next switch

const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

function rise(n, p, dy = 8) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`;
}

export default {
  times(r) {
    const T = { r, card: r + CARD_AT };
    T.tiles = TILES.map((_, i) => T.card + TILE_AT + i * TILE_GAP);
    T.rows = ZONES.map((_, i) => T.card + ROW_AT + i * ROW_GAP);
    T.guide = T.rows[T.rows.length - 1] + 0.2;
    T.done = T.card + DONE_AT;
    T.foot = T.done + 0.04;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild;
    const rp = ZONES.find((z) => z.z === 'RP');
    const card = x.el(`<div class="pz-card">
      <div class="pz-hd"><span class="pz-st"><i class="pz-spin"></i>${x.OK}</span><b>${TITLE}</b><span class="pz-tag">${TAG}</span></div>
      <div class="pz-tiles">${TILES.map(([k1, v, s]) => `<div class="pz-tile"><em>${k1}</em><b>${v}</b><i>${s}</i></div>`).join('')}</div>
      <div class="pz-well">
        <div class="pz-axis"><span class="pz-ax-l">Zone</span><span class="pz-ax">${TICKS.map((p) => `<i style="left:${X(p)}%">${p}:00</i>`).join('')}</span><span class="pz-ax-r">Pace /mi</span><span class="pz-ax-p">% VDOT</span></div>
        <div class="pz-rows">
          <span class="pz-guide" style="left:calc(122px + (100% - 260px) * ${(X(rp.at) / 100).toFixed(4)})"></span><span class="pz-glab" style="left:calc(122px + (100% - 260px) * ${(X(rp.at) / 100).toFixed(4)})">Race pace ${PACE.RP}</span>
          ${ZONES.map((z) => {
            const c = ZC.dark[z.z], a = X(z.range[0]), b = X(z.range[1]), one = z.range[0] === z.range[1];
            const w = one ? 1.6 : b - a, l = one ? a - 0.8 : a;
            return `<div class="pz-row">
              <span class="pz-nm"><i style="background:${c}"></i><span><b>${z.name}</b><em>${z.use}</em></span></span>
              <span class="pz-tr">${TICKS.map((p) => `<u style="left:${X(p)}%"></u>`).join('')}<span class="pz-bar" style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%;background:linear-gradient(90deg,${rgba(c, 0.55)},${c});box-shadow:0 0 0 1px ${rgba(c, 0.35)}"></span></span>
              <span class="pz-pc">${one ? fmt(z.at) : `${fmt(z.range[1])}-${fmt(z.range[0])}`}</span>
              <span class="pz-pt">${z.pct ? `${z.pct[0]}-${z.pct[1]}%` : 'goal'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="pz-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.pz-st .pz-spin'), ok: $('.pz-st .qc-ok') };
    const tiles = [...card.querySelectorAll('.pz-tile')];
    const vdotN = tiles[2].querySelector('b');
    const rows = [...card.querySelectorAll('.pz-row')].map((n) => ({ n, bar: n.querySelector('.pz-bar'), pc: n.querySelector('.pz-pc'), pt: n.querySelector('.pz-pt') }));
    const guide = $('.pz-guide'), glab = $('.pz-glab'), ft = $('.pz-ft');
    let said = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, ft]],
      render(t) {
        const n = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS)));
        if (n !== said) { vis.textContent = SAY.slice(0, n); said = n; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 10);
        const done = t >= T.done;
        st.spin.style.opacity = done ? '0' : '1';
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = outCubic(seg(t, T.done, T.done + 0.16)).toFixed(3);
        tiles.forEach((tl, i) => rise(tl, seg(t, T.tiles[i], T.tiles[i] + TILE_IN), 6));
        // VDOT counts up to its value as the tile lands
        const vp = outCubic(seg(t, T.tiles[2], T.tiles[2] + 0.5));
        vdotN.textContent = lerp(30, VDOT, vp).toFixed(1);
        rows.forEach((o, i) => {
          const a = T.rows[i];
          rise(o.n, seg(t, a, a + ROW_IN), 5);
          o.bar.style.transform = `scaleX(${outCubic(seg(t, a + 0.06, a + 0.06 + BAR)).toFixed(3)})`;
          const tx = outCubic(seg(t, a + BAR * 0.6, a + BAR + 0.1)).toFixed(3);
          o.pc.style.opacity = tx; o.pt.style.opacity = tx;
        });
        const g = outCubic(seg(t, T.guide, T.guide + GUIDE_IN));
        guide.style.opacity = g > 0 ? '1' : '0';
        guide.style.transform = `scaleY(${g.toFixed(3)})`;
        glab.style.opacity = outCubic(seg(t, T.guide + GUIDE_IN * 0.7, T.guide + GUIDE_IN + 0.12)).toFixed(3);
        rise(ft, seg(t, T.foot, T.foot + FOOT_IN), 4);
      },
    };
  },
};
