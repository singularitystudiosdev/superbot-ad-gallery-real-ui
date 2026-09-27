// Assets beat: a 3D asset model (Meshy) generates Inkturf's character and stage meshes. Its line streams, the "Generating 4
// meshes" chip spins, and the asset list rises: each row lands, its thumbnail spins on a turntable under a wireframe
// that fades as the mesh resolves, its triangle count climbs, and its status pill flips from Remeshing to Ready.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Generating the inkling and the stage meshes.';
// [thumbnail, file, what it is, triangles]
const MESHES = [
  ['ink/mesh-inkling.jpg', 'inkling_kid.glb', 'Inkling kid, third-person rig', 3120],
  ['ink/mesh-spawn.jpg', 'spawn_pad.glb', 'Spawn pad and jump beam', 640],
  ['ink/mesh-wall.jpg', 'turf_wall.glb', 'Paintable turf wall', 212],
  ['ink/mesh-podium.jpg', 'victory_podium.glb', 'Victory podium', 880],
];
const TOTAL = MESHES.reduce((s, m) => s + m[3], 0);
const GEN = 1.1;       // seconds one mesh takes to resolve
const STAGGER = 0.28;
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.row = MESHES.map((_, i) => r + 0.55 + i * STAGGER);
    T.done = T.row[MESHES.length - 1] + GEN;
    T.end = T.done + 0.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating 4 meshes</span></div></div>');
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><b>Inkturf assets</b><small class="as-sum">4 meshes · 0 tris</small></div>
      ${MESHES.map(([src, file, what]) => `<div class="as-row">
        <span class="as-th"><img src="${x.img(src)}" alt="${x.esc(what)}"/><i class="as-wire"></i></span>
        <span class="as-main"><b class="as-file">${x.esc(file)}</b><small>${x.esc(what)}</small></span>
        <span class="as-tris">0</span>
        <span class="as-st">Remeshing</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.as-row')].map((row) => ({
      row, img: row.querySelector('.as-th img'), wire: row.querySelector('.as-wire'), tris: row.querySelector('.as-tris'), st: row.querySelector('.as-st'),
    }));
    const sum = card.querySelector('.as-sum');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[MESHES.length - 1], rows[MESHES.length - 1].row]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Generated 4 meshes' : 'Generating 4 meshes';
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        let total = 0;
        rows.forEach((m, i) => {
          const a = T.row[i];
          rise(m.row, seg(t, a, a + 0.3), 6);
          const p = seg(t, a + 0.1, a + GEN), e = outCubic(p);
          // turntable: the thumbnail squashes on x as if it were spinning, slowing to rest as the mesh lands
          const turn = Math.cos((1 - e) * Math.PI * 3);
          m.img.style.transform = p >= 1 ? 'none' : `scaleX(${lerp(0.35, 1, Math.abs(turn)).toFixed(3)})`;
          m.img.style.filter = p >= 1 ? 'none' : `blur(${((1 - e) * 5).toFixed(2)}px) saturate(${lerp(0.2, 1, e).toFixed(3)})`;
          m.wire.style.opacity = (1 - seg(p, 0.55, 1)).toFixed(3);
          const c = MESHES[i][3] * e;
          total += c;
          const s = num(c);
          if (m.tris.textContent !== s) m.tris.textContent = s;
          const ready = p >= 1;
          m.row.classList.toggle('as-ready', ready);
          const st = ready ? 'Ready' : 'Remeshing';
          if (m.st.textContent !== st) m.st.textContent = st;
          const pop = seg(t, a + GEN, a + GEN + 0.3);
          m.st.style.transform = pop > 0 && pop < 1 ? `scale(${lerp(0.8, 1, outBack(pop)).toFixed(3)})` : '';
        });
        const ss = `4 meshes · ${num(done ? TOTAL : total)} tris`;
        if (sum.textContent !== ss) sum.textContent = ss;
      },
    };
  },
};
