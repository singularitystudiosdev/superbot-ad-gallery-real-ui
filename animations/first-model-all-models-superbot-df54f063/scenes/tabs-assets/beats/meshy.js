// Meshy: the ride's four 3D models (bike + rider, torii gate, tree, stone lantern) in a Meshy-style result card. Each
// model turns in on a turntable as its wireframe (a triangulated mesh over the dimmed model), then a scan line runs
// down it and the textured model is revealed behind it; the header counts Meshing -> Texturing n% -> Done. The tiles
// are real frames of the ride (gen/ride/meshy-*.png, 512x512 crops, img/CREDITS.txt). Pure function of t.
import { seg, lerp, outCubic, outBack } from '../../../lib.js';
import { sayer, rise, setText, gen } from './kit.js';

export const MODELS = [
  { id: 'bike', name: 'Bike + rider' },
  { id: 'torii', name: 'Torii gate' },
  { id: 'tree', name: 'Tree' },
  { id: 'lantern', name: 'Stone lantern' },
];
const SPIN = '<svg class="mx-spin" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke-width="2"/></svg>';
// the wireframe: an 8x8 quad grid, every quad split on its diagonal (the triangles a mesh is made of)
const N = 8, STEP = 100 / N;
const MESH = `<svg class="mx-mesh" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${[
  ...Array.from({ length: N + 1 }, (_, i) => `M0 ${i * STEP}H100M${i * STEP} 0V100`),
  ...Array.from({ length: 2 * N - 1 }, (_, i) => { const d = (i + 1) * STEP; return d <= 100 ? `M0 ${d}L${d} 0` : `M${d - 100} 100L100 ${d - 100}`; }),
].join('')}"/></svg>`;

export default {
  times(r, next, c) {
    const p = c.pace || 1;
    const T = { say: r + 0.02, card: r + 0.1 * p };
    T.pop = MODELS.map((_, i) => T.card + (0.1 + i * 0.07) * p);
    T.scan = T.pop.map((a) => [a + 0.18 * p, a + 0.46 * p]);
    T.tex0 = T.scan[0][0];
    T.done = T.scan[MODELS.length - 1][1] + 0.03;
    T.end = next;
    return T;
  },

  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.mesh, 95);
    const card = x.el(`<div class="mx-card">
  <div class="mx-hd"><span class="mx-title">Japanese bike ride</span><span class="mx-n">4 models</span><span class="mx-state">${SPIN}<span class="mx-ok">${x.OK}</span><b>Meshing</b></span></div>
  <div class="mx-grid">${MODELS.map((m) => {
    const bg = `background-image:url('${gen(`ride/meshy-${m.id}.png`)}')`;
    return `<div class="mx-cell"><div class="mx-view"><div class="mx-rot"><i class="mx-img mx-tex" style="${bg}"></i><div class="mx-wire"><i class="mx-img" style="${bg}"></i>${MESH}</div></div><i class="mx-scan"></i></div><span class="mx-lab">${x.esc(m.name)}</span></div>`;
  }).join('')}</div>
</div>`);
    const cells = [...card.querySelectorAll('.mx-cell')].map((n) => ({
      n, rot: n.querySelector('.mx-rot'), wire: n.querySelector('.mx-wire'), scan: n.querySelector('.mx-scan'), lab: n.querySelector('.mx-lab'),
    }));
    const state = card.querySelector('.mx-state b'), spin = card.querySelector('.mx-spin'), ok = card.querySelector('.mx-ok');
    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say);
        rise(card, seg(t, T.card, T.card + 0.2), 12);
        let tex = 0;
        cells.forEach((c, i) => {
          // the turntable: each model swings in from a 3/4 turn and settles facing the camera
          const a = outCubic(seg(t, T.pop[i], T.pop[i] + 0.62));
          const s = outBack(seg(t, T.pop[i], T.pop[i] + 0.3));
          c.n.style.opacity = seg(t, T.pop[i], T.pop[i] + 0.1).toFixed(3);
          c.rot.style.transform = a >= 1 ? 'none' : `scale(${lerp(0.55, 1, s).toFixed(4)}) rotateY(${((1 - a) * -75).toFixed(2)}deg)`;
          // the texture pass: the wire copy is cut away from the top as the scan line runs down
          const f = seg(t, T.scan[i][0], T.scan[i][1]);
          tex += f;
          c.wire.style.clipPath = f <= 0 ? 'none' : `inset(${(f * 100).toFixed(2)}% 0 0 0)`;
          c.wire.style.visibility = f >= 1 ? 'hidden' : 'visible';
          c.scan.style.top = (f * 100).toFixed(2) + '%';
          c.scan.style.opacity = f > 0 && f < 1 ? '1' : '0';
          rise(c.lab, seg(t, T.scan[i][1] - 0.08, T.scan[i][1] + 0.14), 5, 1);
        });
        const d = t >= T.done;
        setText(state, d ? 'Done' : t >= T.tex0 ? `Texturing ${Math.round((tex / cells.length) * 100)}%` : 'Meshing');
        spin.style.display = d ? 'none' : 'block';
        spin.style.transform = `rotate(${((t * 540) % 360).toFixed(1)}deg)`;
        ok.style.display = d ? 'grid' : 'none';
      },
    };
  },
};
