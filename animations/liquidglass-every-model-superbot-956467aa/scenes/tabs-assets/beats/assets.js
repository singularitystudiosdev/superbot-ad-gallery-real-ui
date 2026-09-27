// Assets beat: the 3D asset model (Meshy) generates the Liquid Glass reel's primitives. Its line streams, the
// "Generating 4 meshes" chip spins, and the mesh list rises: each row lands, its thumbnail turns on a turntable under
// a glass bevel/specular pass that fades as the mesh resolves, a sheen sweeping it once per beat, its triangle count
// climbs, and its status pill flips from Remeshing to Ready. Pure function of t: every moving value is written from t,
// so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Generating the glass primitives for the reel.';
// [thumbnail, file, what it is, triangles]
const MESHES = [
  ['lg/mesh-orb.jpg', 'glass_orb.glb', 'Liquid glass orb, 64-seg sphere', 4096],
  ['lg/mesh-capsule.jpg', 'capsule_island.glb', 'Capsule island, morph target', 2048],
  ['lg/mesh-lens.jpg', 'refraction_lens.glb', 'Refraction lens, IOR 1.5', 1536],
  ['lg/mesh-slab.jpg', 'glass_slab.glb', 'Card slab, 28px corner', 320],
];
const TOTAL = MESHES.reduce((s, m) => s + m[3], 0);
const GEN = 1.1;       // seconds one mesh takes to resolve
const STAGGER = 0.28;
const BEAT = 0.5;      // 120 BPM: one beat every 0.5s, the grid the specular sweep moves on
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
    const chip = x.el('<div class="dd-chiprow as-chip" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating 4 meshes</span></div></div>');
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><b>Liquid Glass meshes</b><small class="as-sum">4 meshes · 0 tris</small></div>
      ${MESHES.map(([src, file, what]) => `<div class="as-row">
        <span class="as-th"><img${src.includes('lens') ? ' class="as-zoom"' : ''} src="${x.img(src)}" alt="${x.esc(what)}"/><i class="as-wire"></i><i class="as-sh"></i></span>
        <span class="as-main"><b class="as-file">${x.esc(file)}</b><small>${x.esc(what)}</small></span>
        <span class="as-tris">0</span>
        <span class="as-st">Remeshing</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.as-row')].map((row) => ({
      row, img: row.querySelector('.as-th img'), wire: row.querySelector('.as-wire'), sh: row.querySelector('.as-sh'),
      tris: row.querySelector('.as-tris'), st: row.querySelector('.as-st'),
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

        // the one beat grid: beat = 0 on each beat, 1 just before the next
        const beat = ((t % BEAT) + BEAT) % BEAT / BEAT;

        const ci = seg(t, T.card, T.card + 0.5);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? 'none'
          : `translateY(${((1 - outCubic(ci)) * 14).toFixed(2)}px) scale(${lerp(0.94, 1, outBack(ci)).toFixed(4)})`;

        let total = 0;
        rows.forEach((m, i) => {
          const a = T.row[i];
          rise(m.row, seg(t, a, a + 0.3), 6);
          const p = seg(t, a + 0.1, a + GEN), e = outCubic(p);
          // turntable: the thumbnail squashes on x as if it were spinning, slowing to rest as the mesh lands
          const turn = Math.cos((1 - e) * Math.PI * 3);
          m.img.style.transform = p >= 1 ? 'none' : `scaleX(${lerp(0.35, 1, Math.abs(turn)).toFixed(3)})`;
          m.img.style.opacity = lerp(0.7, 1, e).toFixed(3);
          // the bevel/specular pass over the thumbnail, and the sheen crossing it once per beat
          m.wire.style.opacity = (0.9 * (1 - seg(p, 0.55, 1))).toFixed(3);
          m.sh.style.opacity = seg(p, 0, 0.05).toFixed(3);
          m.sh.style.left = `${(-58 + 158 * beat).toFixed(1)}%`;
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