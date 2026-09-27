// Plan beat, the build's first answer: Claude Opus 5.5 reads the one ask, streams its planning line, and lays out
// the build plan for Turbo Kart Rally as a card, one row per part: the part, then the model superbot will route it to
// (its tile pops in and its name lands a beat after the task, so each row reads as an assignment). The rows are the
// same list the chat routes through, in order (chat.js PLAN, handed in as k.opts.rows), and the pinned BUILD PLAN
// HUD (scenes/tabs.js) lifts off this very card once it has finished. Pure function of t: every moving value is
// written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Planning Turbo Kart Rally, and which model builds each part.';
const CPS = 80;
const STAGGER = 0.08;   // row to row
const ASSIGN = 0.14;    // a row's task lands, then its model this much later
const READ = 1.15;      // the finished card holds this long before the first switch
const rowsOf = (opts) => (opts && opts.rows) || [];

export default {
  times(r, opts) {
    const n = rowsOf(opts).length;
    const T = { r };
    T.card = r + 0.42;
    T.row = Array.from({ length: n }, (_, i) => r + 0.62 + i * STAGGER);
    T.done = (n ? T.row[n - 1] : T.card) + ASSIGN + 0.3; // the last model has landed: the card is finished
    T.end = Math.max(r + 2.8, T.done + READ);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const rows = rowsOf(k.opts);
    const models = new Set(rows.filter((p) => p.model !== false).map((p) => p.app)).size;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="pl-card">
      <div class="pl-hd"><b>Build plan · Turbo Kart Rally</b><small>${rows.length} parts · ${models} models</small></div>
      ${rows.map((p, i) => `<div class="pl-row">
        <span class="pl-n">${i + 1}</span>
        <span class="pl-task">${x.esc(p.task)}</span>
        <span class="pl-who">${x.tile(p.app, 'pl-tile')}<b>${x.esc(p.name)}</b></span>
      </div>`).join('')}
    </div>`);
    const els = [...card.querySelectorAll('.pl-row')].map((row) => ({ row, who: row.querySelector('.pl-who'), tile: row.querySelector('.pl-tile') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        els.forEach((m, i) => {
          const a = T.row[i];
          const p = outCubic(seg(t, a, a + 0.3));
          m.row.style.opacity = p.toFixed(3);
          m.row.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
          // the assignment: the model's tile springs in and its name follows
          const w = seg(t, a + ASSIGN, a + ASSIGN + 0.3);
          m.who.style.opacity = outCubic(w).toFixed(3);
          m.who.style.transform = w >= 1 ? '' : `translateX(${((1 - outCubic(w)) * 8).toFixed(2)}px)`;
          m.tile.style.transform = w >= 1 ? '' : `scale(${lerp(0.4, 1, outBack(w)).toFixed(4)})`;
        });
      },
    };
  },
};
