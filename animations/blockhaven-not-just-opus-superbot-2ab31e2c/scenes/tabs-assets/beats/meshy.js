// Step 3, Meshy 5: the three game models, built from Gemini's textures and shown the way Meshy's viewer shows a result:
// each model on a turntable, first as its wireframe mesh, then textured as a sweep crosses the viewport, then the
// file chips. The models are real CSS 3D geometry, not pictures of it: the grass block and the oak log are six-faced
// cubes (grass_top / grass_side / dirt, and the log's rings / bark, from gen/decal and gen/item), and the wooden
// pickaxe is Minecraft's own item model, its 16x16 sprite extruded into layers. The wireframe is the same geometry
// with its faces drawn as edges plus the diagonal that splits each quad into its two triangles (the pickaxe: its
// voxel grid inside the sprite's outline). Both copies turn on one clock, so the sweep reveals the textured copy in
// register over the wire copy.
import { seg, lerp, outBack } from '../../../lib.js';
import { sayer, rise, gen } from './kit.js';

const S = 54;          // cube edge, px
const LAYERS = 6;      // pickaxe extrusion layers (1 px apart)
const MODELS = [
  { id: 'grass', file: 'grass_block.glb', faces: { top: 'decal/grass_top.png', side: 'decal/grass_side.png', bottom: 'decal/dirt.png' } },
  { id: 'log', file: 'oak_log.glb', faces: { top: 'decal/oak_log.png', side: 'decal/oak_bark.png', bottom: 'decal/oak_log.png' } },
  { id: 'pick', file: 'wooden_pickaxe.glb', sprite: 'item/wooden_pickaxe.png' },
];
const FACE = {
  front: `translateZ(${S / 2}px)`,
  back: `rotateY(180deg) translateZ(${S / 2}px)`,
  right: `rotateY(90deg) translateZ(${S / 2}px)`,
  left: `rotateY(-90deg) translateZ(${S / 2}px)`,
  top: `rotateX(90deg) translateZ(${S / 2}px)`,
  bottom: `rotateX(-90deg) translateZ(${S / 2}px)`,
};
const SPIN = '<svg class="vx-spin" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke-width="2"/></svg>';

function cube(m, wire) {
  return Object.entries(FACE).map(([k, tf]) => {
    const tex = k === 'top' ? m.faces.top : k === 'bottom' ? m.faces.bottom : m.faces.side;
    const bg = wire ? '' : `background-image:url('${gen(tex)}');`;
    return `<i class="vx-f vx-f-${k}" style="${bg}transform:${tf}"></i>`;
  }).join('');
}

function pick(m, wire) {
  const url = gen(m.sprite);
  const n = wire ? 2 : LAYERS;
  return Array.from({ length: n }, (_, i) => {
    const z = wire ? (i ? -2.5 : 2.5) : i - (LAYERS - 1) / 2;
    const edge = !wire && i > 0 && i < LAYERS - 1;
    return `<i class="vx-p${wire ? ' vx-p-wire' : ''}${edge ? ' vx-p-in' : ''}" style="--m:url('${url}');${wire ? '' : `background-image:url('${url}');`}transform:translateZ(${z}px)"></i>`;
  }).join('');
}

const cell = (m, wire) => `<div class="vx-cell vx-c-${m.id}"><div class="vx-rot">${m.sprite ? pick(m, wire) : cube(m, wire)}</div><i class="vx-shadow"></i></div>`;

export default {
  times(r, c) {
    const p = c.pace || 1;
    const T = { say: r + 0.04, card: r + 0.22 * p };
    T.pop = MODELS.map((_, i) => T.card + (0.1 + i * 0.07) * p);
    T.tex0 = T.card + 0.5 * p;
    T.tex1 = T.tex0 + 0.62 * p;
    T.done = T.tex1 + 0.04;
    T.end = T.done + 0.34 * p;
    return T;
  },

  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.mesh, 90);
    const card = x.el(`<div class="vx-card">
  <div class="vx-hd">${x.tile('meshy')}<span class="vx-title">BlockHaven assets</span><span class="vx-n">3 models</span><span class="vx-state">${SPIN}<span class="vx-ok">${x.OK}</span><b>Meshing</b></span></div>
  <div class="vx-stage">
    <div class="vx-layer vx-wire">${MODELS.map((m) => cell(m, true)).join('')}</div>
    <div class="vx-layer vx-tex">${MODELS.map((m) => cell(m, false)).join('')}</div>
    <i class="vx-sweep"></i>
    <div class="vx-tools"><span class="vx-pill vx-pill-w">Wireframe</span><span class="vx-pill vx-pill-t">Textured</span></div>
  </div>
  <div class="vx-foot">${MODELS.map((m) => `<span class="vx-lab"><em>GLB</em>${m.file}</span>`).join('')}</div>
</div>`);
    const q = (s) => card.querySelector(s);
    const rots = [...card.querySelectorAll('.vx-rot')];
    const wireCells = [...card.querySelectorAll('.vx-wire .vx-cell')];
    const texCells = [...card.querySelectorAll('.vx-tex .vx-cell')];
    const labs = [...card.querySelectorAll('.vx-lab')];
    const tex = q('.vx-tex'), wire = q('.vx-wire'), sweep = q('.vx-sweep'), state = q('.vx-state b'), spin = q('.vx-spin'), ok = q('.vx-ok');
    const pw = q('.vx-pill-w'), pt = q('.vx-pill-t');
    let lastState = '';
    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say);
        rise(card, seg(t, T.card, T.card + 0.22));
        // one turntable clock for both copies: a 3/4 view turning at 80 deg/s
        const a = -35 + (t - T.card) * 80;
        rots.forEach((n, i) => {
          const tilt = i === 2 ? -12 : -24;
          n.style.transform = `rotateX(${tilt}deg) rotateY(${(a + i * 25).toFixed(2)}deg)`;
        });
        MODELS.forEach((_, i) => {
          const p = outBack(seg(t, T.pop[i], T.pop[i] + 0.26));
          const s = `scale(${(0.2 + 0.8 * p).toFixed(3)})`;
          wireCells[i].style.transform = s;
          texCells[i].style.transform = s;
          wireCells[i].style.opacity = texCells[i].style.opacity = seg(t, T.pop[i], T.pop[i] + 0.08).toFixed(3);
          rise(labs[i], seg(t, T.done + i * 0.05, T.done + i * 0.05 + 0.2), 6);
        });
        // the texture pass: a sweep crosses left to right and the textured copy is revealed behind it
        const f = seg(t, T.tex0, T.tex1);
        tex.style.clipPath = `inset(0 ${((1 - f) * 100).toFixed(2)}% 0 0)`;
        wire.style.clipPath = `inset(0 0 0 ${(f * 100).toFixed(2)}%)`; // the wire copy only where the sweep has not been
        sweep.style.left = (f * 100).toFixed(2) + '%';
        sweep.style.opacity = f > 0 && f < 1 ? '1' : '0';
        const st = t >= T.done ? 'Done' : t >= T.tex0 ? `Texturing ${Math.round(f * 100)}%` : 'Meshing';
        if (st !== lastState) { state.textContent = st; lastState = st; }
        const d = t >= T.done;
        spin.style.display = d ? 'none' : 'block';
        spin.style.transform = `rotate(${((t * 540) % 360).toFixed(1)}deg)`;
        ok.style.display = d ? 'grid' : 'none';
        pw.classList.toggle('is-on', t < T.tex0);
        pt.classList.toggle('is-on', t >= T.tex0);
      },
    };
  },
};
