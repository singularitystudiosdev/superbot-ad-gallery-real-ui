// Meshy 5 beat, the third request of the minecraft build: Meshy turns the textures into meshes. Its viewport (the
// chrome of pocketsflow-untold's meshy.js, meshy.css) opens on a real 3D grass block turning on a turntable: grey clay
// first, then the wireframe shell (each face split into its two triangles), then the textured pass pours down the faces
// in the atlas' own texels. The spin eases onto a three-quarter angle and the finished GLBs land in a strip under it.
//
// The block is a live CSS 3D cube (six faces, preserve-3d), not a baked image: its faces are skinned with the real
// BlockHaven textures (img/bh/tex, crops from @kepochnik's game, see CREDITS.txt), drawn pixel-sharp. The triangle
// counts are what a cube is (12 tris); nothing was sent to Meshy. The Meshy mark (brand/meshy-logo.svg) is used
// nominatively, to name the app superbot routed the request to.
//
// Pure function of t: no Date, no rAF state, no CSS animation or transition.
import { lerp, seg, outCubic, outQuint, streamCount, pressScale } from '../../../lib.js';

const SAY = 'Meshed the blocks: grass, oak log, pumpkin.';
const FILE = 'grass_block.glb';
// the cube's faces: [name, transform, shade applied to the clay and the textured pass]
const FACES = [
  ['front', 'translateZ(var(--h))', 0.86],
  ['back', 'rotateY(180deg) translateZ(var(--h))', 0.62],
  ['right', 'rotateY(90deg) translateZ(var(--h))', 0.7],
  ['left', 'rotateY(-90deg) translateZ(var(--h))', 0.78],
  ['top', 'rotateX(90deg) translateZ(var(--h))', 1.04],
  ['bottom', 'rotateX(-90deg) translateZ(var(--h))', 0.5],
];
// the three GLBs: which texture each face wears
const BLOCKS = [
  { file: 'grass_block.glb', top: 'grass-top.png', side: 'grass-side.png', bottom: 'dirt.png' },
  { file: 'oak_log.glb', top: 'oak-log.png', side: 'oak-log.png', bottom: 'oak-log.png' },
  { file: 'pumpkin.glb', top: 'pumpkin-top.png', side: 'pumpkin.png', bottom: 'pumpkin.png' },
];
const texOf = (b, face) => (face === 'top' ? b.top : face === 'bottom' ? b.bottom : b.side);
const TILT = -24;     // the camera looks down on the block
const SPIN = 230;     // degrees per second while it turns
const HOLD = 38;      // the held three-quarter angle
const SETTLE = 0.4;

function yawAt(t, a, stop) {
  if (t < a) return HOLD - 150;
  const from = HOLD - 150 + (Math.min(t, stop) - a) * SPIN;
  if (t <= stop) return from;
  const need = (((HOLD - from) % 360) + 360) % 360;
  return from + need * outCubic(seg(t, stop, stop + SETTLE));
}

const cubeHTML = (x, b, cls) => `<div class="vx-cube ${cls}">${FACES.map(([f, tf, sh]) => `<div class="vx-f vx-${f}" style="transform:${tf};--sh:${sh}">
  <i class="vx-clay"></i><i class="vx-wire"></i><img class="vx-tex" src="${x.img('bh/tex/' + texOf(b, f))}" alt="" decoding="sync" draggable="false"/>
</div>`).join('')}</div>`;

export default {
  times(r) {
    const T = { r };
    T.vp = r + 0.1;           // the viewport opens, grey clay turning
    T.wire = r + 0.45;        // Wireframe
    T.tex = r + 0.78;         // Texturing: the texels pour down the faces
    T.texEnd = T.tex + 0.42;
    T.stop = T.texEnd - 0.1;  // the spin lets go and eases onto the held angle
    T.strip = r + 1.28;       // the finished GLBs
    T.end = r + 1.75;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vp = x.el(`<div class="msy-vp vx-vp">
      <div class="msy-hd">
        <span class="msy-mk"><img src="${x.brand('meshy-logo.svg')}" alt=""/></span>
        <span class="msy-file">${x.esc(FILE)}</span>
        <span class="msy-htri">12 tris</span>
        <span class="msy-state">Untextured</span>
      </div>
      <div class="msy-frame vx-frame">
        <i class="vx-floor"></i>
        <div class="vx-scene">${cubeHTML(x, BLOCKS[0], 'vx-main')}</div>
        <i class="msy-sweep"></i>
      </div>
      <div class="msy-tools">
        <span class="msy-pill" data-m="clay">Clay</span>
        <span class="msy-pill" data-m="wire">Wireframe</span>
        <span class="msy-pill" data-m="tex">Textured</span>
        <span class="msy-spin"></span>
      </div>
    </div>`);
    const cube = vp.querySelector('.vx-main');
    const faces = [...cube.querySelectorAll('.vx-f')].map((n) => ({ n, clay: n.querySelector('.vx-clay'), wire: n.querySelector('.vx-wire'), tex: n.querySelector('.vx-tex') }));
    const floor = vp.querySelector('.vx-floor');
    const sweep = vp.querySelector('.msy-sweep'), state = vp.querySelector('.msy-state');
    const pills = { clay: vp.querySelector('[data-m="clay"]'), wire: vp.querySelector('[data-m="wire"]'), tex: vp.querySelector('[data-m="tex"]') };
    const spin = vp.querySelector('.msy-spin');

    const strip = x.el(`<div class="msy-strip vx-strip">${BLOCKS.map((b) => `<div class="msy-tile">
      <div class="msy-thumb vx-thumb"><div class="vx-scene vx-mini">${cubeHTML(x, b, 'vx-small')}</div><span class="msy-glb">GLB</span></div>
      <span class="msy-tname">${x.esc(b.file)}</span>
      <span class="msy-tris">12 tris</span>
    </div>`).join('')}</div>`);
    const tiles = [...strip.children];
    const minis = [...strip.querySelectorAll('.vx-small')];

    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    let shown = -1, lastState = '';

    return {
      nodes: [sayEl, vp, strip],
      marks: [[T.r, sayEl], [T.vp, vp], [T.strip, strip]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.04, 110, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const vi = outCubic(seg(t, T.vp, T.vp + 0.4));
        vp.style.opacity = vi.toFixed(3);
        vp.style.transform = vi >= 1 ? 'none' : `translateY(${((1 - vi) * 14).toFixed(2)}px) scale(${lerp(0.972, 1, vi).toFixed(4)})`;

        // the turntable, with a gentle bob
        const yaw = yawAt(t, T.vp, T.stop);
        const bob = Math.sin((t - T.vp) * 3.2) * 4;
        cube.style.transform = `translateY(${bob.toFixed(2)}px) rotateX(${TILT}deg) rotateY(${yaw.toFixed(2)}deg)`;
        floor.style.transform = `translateX(-50%) scale(${(1 - bob / 60).toFixed(4)})`;

        // passes: clay -> wireframe shell -> textured, poured down each face from the top
        const wi = outCubic(seg(t, T.wire, T.wire + 0.2)) * (1 - seg(t, T.texEnd - 0.1, T.texEnd + 0.15));
        const tx = seg(t, T.tex, T.texEnd);
        const edge = outQuint(tx) * 118 - 9;
        const mask = tx <= 0 || tx >= 1 ? 'none' :`linear-gradient(180deg, #000 ${(edge - 9).toFixed(1)}%, rgba(0,0,0,0) ${(edge + 9).toFixed(1)}%)`;
        const clayOp = (1 - 0.55 * outCubic(seg(t, T.wire, T.wire + 0.2))) * (1 - seg(t, T.texEnd - 0.05, T.texEnd + 0.1));
        faces.forEach((f) => {
          f.wire.style.opacity = wi.toFixed(3);
          f.clay.style.opacity = clayOp.toFixed(3);
          f.tex.style.opacity = tx > 0 ? '1' : '0';
          f.tex.style.maskImage = mask; f.tex.style.webkitMaskImage = mask;
        });
        const sw = seg(t, T.tex, T.texEnd + 0.1);
        sweep.style.opacity = (sw > 0 && sw < 1 ? 1 : 0).toFixed(3);
        sweep.style.transform = `translateX(${lerp(-110, 460, sw).toFixed(1)}%)`;

        const label = t < T.tex ? 'Untextured' : t < T.texEnd ? `Texturing ${Math.round(tx * 100)}%` : 'Textured';
        if (label !== lastState) { state.textContent = label; lastState = label; }
        state.classList.toggle('is-tex', t >= T.texEnd);
        const hot = t >= T.texEnd ? 'tex' : t >= T.wire ? 'wire' : 'clay';
        for (const m of ['clay', 'wire', 'tex']) pills[m].classList.toggle('is-on', hot === m);
        pills.wire.style.transform = `scale(${pressScale(t, T.wire, 0.08).toFixed(4)})`;
        pills.tex.style.transform = `scale(${pressScale(t, T.tex, 0.08).toFixed(4)})`;
        spin.style.opacity = (t < T.texEnd ? 1 : 0).toFixed(3);
        spin.style.transform = `rotate(${((t - T.vp) * 420).toFixed(0)}deg)`;

        // the finished GLBs, each a small textured block at the held angle
        const si = outCubic(seg(t, T.strip, T.strip + 0.3));
        strip.style.opacity = si.toFixed(3);
        tiles.forEach((node, i) => {
          const a = T.strip + i * 0.08;
          const p = outCubic(seg(t, a, a + 0.32));
          node.style.opacity = p.toFixed(3);
          node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 12).toFixed(2)}px)`;
          minis[i].style.transform = `rotateX(${TILT}deg) rotateY(${(HOLD + (t - a) * 40).toFixed(2)}deg)`;
        });
      },
    };
  },
};
