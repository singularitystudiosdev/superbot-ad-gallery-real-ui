// Meshy beat: "Modeling the 3D assets." over a card of five models generating at once, staggered: each row's
// progress bar fills, then resolves to a check and its triangle count. Pure function of t (scene-local time).
import { seg, outCubic, clamp } from '../../../lib.js';

const SAY = 'Modeling the 3D assets.';
const ROWS = [
  ['city_bike.glb', '18.2k tris', '#7fb3ff'],
  ['rider.glb', '24.6k tris', '#f2b27a'],
  ['torii_gate.glb', '6.4k tris', '#ff7a6b'],
  ['sakura_tree.glb', '31.0k tris', '#ff9fc4'],
  ['stone_lantern.glb', '4.8k tris', '#c9c3b6'],
];
const STAG = 0.06, GEN = 0.26;

// a small isometric cube, tinted per model
const cube = (c) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 19.6 7.6v8.8L12 20.8 4.4 16.4V7.6Z" fill="${c}" fill-opacity=".16" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/><path d="M4.4 7.6 12 12l7.6-4.4M12 12v8.8" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round" stroke-opacity=".8"/></svg>`;

export default {
  times(r) {
    const T = { r, say: r + 0.04, card: r + 0.08, row: ROWS.map((_, i) => r + 0.12 + i * STAG) };
    T.done = T.row.map((a) => a + 0.06 + GEN);
    T.end = T.done[T.done.length - 1] + 0.05;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.sayEl(SAY);
    const card = x.el(`<div class="ms-card">${ROWS.map(([n, tris, c]) => `
      <div class="ms-row"><span class="ms-th">${cube(c)}</span><span class="ms-n">${x.esc(n)}</span>
        <span class="ms-bar"><i></i></span><span class="ms-st"><b class="ms-pc">0%</b><b class="ms-tr">${tris}</b>${x.OK}</span></div>`).join('')}</div>`);
    const rows = [...card.querySelectorAll('.ms-row')].map((r) => ({
      r, f: r.querySelector('.ms-bar i'), pc: r.querySelector('.ms-pc'), tr: r.querySelector('.ms-tr'), ok: r.querySelector('.qc-ok'), th: r.querySelector('.ms-th'), last: -1,
    }));
    return {
      nodes: [say.n, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say, 110);
        x.rise(card, t, T.card, 0.24, 8);
        rows.forEach((o, i) => {
          x.rise(o.r, t, T.row[i], 0.22, 6);
          const p = outCubic(seg(t, T.row[i] + 0.06, T.done[i]));
          o.f.style.transform = `scaleX(${p.toFixed(4)})`;
          const done = t >= T.done[i];
          o.r.classList.toggle('on', done);
          const pc = Math.round(p * 100);
          if (pc !== o.last) { o.pc.textContent = `${pc}%`; o.last = pc; }
          const d = seg(t, T.done[i], T.done[i] + 0.2);
          o.ok.style.opacity = done ? '1' : '0';
          o.ok.style.transform = `scale(${(0.5 + 0.5 * clamp(outCubic(d) * 1.08, 0, 1.08)).toFixed(4)})`;
          o.th.style.transform = done ? `scale(${(1 + 0.12 * Math.sin(Math.PI * d)).toFixed(4)})` : 'none';
        });
      },
    };
  },
};
