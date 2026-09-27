// Assets beat: a 3D asset model (Meshy) generates the lens lab's low-poly meshes, each one modelled on a crop of the
// post clip (img/ll/mesh-*.jpg, see img/CREDITS.txt): the lens barrel cutaway, the brass gear ring that sits beside
// the black knurled focus ring, the glass element group, and the cabin valley diorama the lens looks at.
// Its line streams, the "Generating 4 meshes" chip spins, and the asset list rises. Each row lands and its thumbnail
// resolves like a RACK FOCUS between two planes: the wireframe is a cyan plane-of-focus grid that starts sharp over
// a defocused render (blurred, breathing slightly large, turning on its turntable as the grid slides with it); as the
// mesh resolves, focus pulls off the grid onto the render, so the grid softens and dissolves while the render
// sharpens, and it lands with a cyan focus-confirm ring that settles to brass. Its triangle count climbs and its pill
// flips from Remeshing to Ready.
// The header's total reads like the lab's FOCUS readout: the distance racks in from infinity as the triangle total
// climbs (1/d grows with progress, like a real focus scale) and locks on 54 cm, the cabin, where the diorama crop is
// sharp, when the last mesh lands.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Generating the lens and the valley it looks at.';
// [thumbnail, file, what it is (per img/CREDITS.txt), triangles]
const MESHES = [
  ['ll/mesh-lens.jpg', 'lens_barrel.glb', 'Lens barrel, cutaway', 3480],
  ['ll/mesh-ring.jpg', 'gear_ring.glb', 'Brass gear ring', 1920],
  ['ll/mesh-elements.jpg', 'element_group.glb', 'Glass element group', 1264],
  ['ll/mesh-diorama.jpg', 'valley_diorama.glb', 'Cabin valley diorama', 2860],
];
const TOTAL = MESHES.reduce((s, m) => s + m[3], 0);
const GEN = 1.1;       // seconds one mesh takes to resolve
const STAGGER = 0.28;
const num = (n) => Math.round(n).toLocaleString('en-US');

// the focus readout: the distance the header racks to (the clip's Middle plane, the cabin) and the farthest distance
// it shows as a number before it reads infinity
const FOCUS_CM = 54, FAR_CM = 999;
const focusAt = (p) => (p * FAR_CM <= FOCUS_CM ? '∞' : `${Math.round(FOCUS_CM / p)} cm`);

// the focus-confirm ring: cyan (the clip's glass glow) flashing to brass (the gear ring) as a mesh lands
const BRASS = [201, 150, 74], CYAN = [128, 236, 255];
const mix = (a, b, u) => a.map((v, i) => Math.round(lerp(v, b[i], u))).join(', ');

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
      <div class="as-hd"><b>Lens Lab assets</b><small class="as-sum"><span class="as-tot">4 meshes · 0 tris</span><span class="as-sep">·</span><span class="as-fk">FOCUS</span><span class="as-fd">∞</span></small></div>
      ${MESHES.map(([src, file, what]) => `<div class="as-row">
        <span class="as-th"><img src="${x.img(src)}" alt="${x.esc(what)}"/><i class="as-wire"></i><i class="as-ring"></i></span>
        <span class="as-main"><b class="as-file">${x.esc(file)}</b><small>${x.esc(what)}</small></span>
        <span class="as-tris">0</span>
        <span class="as-st">Remeshing</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.as-row')].map((row) => ({
      row, img: row.querySelector('.as-th img'), wire: row.querySelector('.as-wire'), ring: row.querySelector('.as-ring'),
      tris: row.querySelector('.as-tris'), st: row.querySelector('.as-st'),
    }));
    const tot = card.querySelector('.as-tot'), fd = card.querySelector('.as-fd');
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
          // turntable: the render squashes on x as if it were spinning, slowing to rest as the mesh lands; focus
          // breathing: it sits a little large while defocused and settles to 1 as focus lands on it
          const turn = Math.cos((1 - e) * Math.PI * 3), breath = lerp(1.14, 1, e);
          m.img.style.transform = p >= 1 ? 'none' : `scale(${(lerp(0.35, 1, Math.abs(turn)) * breath).toFixed(3)}, ${breath.toFixed(3)})`;
          m.img.style.filter = p >= 1 ? 'none' : `blur(${((1 - e) * 6).toFixed(2)}px) saturate(${lerp(0.35, 1, e).toFixed(3)}) brightness(${lerp(0.7, 1, e).toFixed(3)})`;
          // the rack: the grid (the plane focus leaves) slides with the turntable, softens and dissolves
          const off = seg(p, 0.5, 1);
          m.wire.style.opacity = (1 - seg(p, 0.55, 1)).toFixed(3);
          m.wire.style.filter = off > 0 ? `blur(${(off * 2.2).toFixed(2)}px)` : '';
          m.wire.style.backgroundPosition = p >= 1 ? '' : `${((1 - e) * 21).toFixed(2)}px 0`;
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
          // focus confirm: the ring flashes cyan with an inner glow the moment the mesh is sharp, then settles to brass
          const f = 1 - outCubic(pop);
          m.ring.style.boxShadow = pop > 0 && pop < 1
            ? `inset 0 0 0 1.5px rgb(${mix(BRASS, CYAN, f)}), inset 0 0 ${(9 * f).toFixed(2)}px rgba(128, 236, 255, ${(0.7 * f).toFixed(3)})`
            : '';
        });
        const all = done ? TOTAL : total;
        const ss = `4 meshes · ${num(all)} tris`;
        if (tot.textContent !== ss) tot.textContent = ss;
        const fs = focusAt(all / TOTAL);
        if (fd.textContent !== fs) fd.textContent = fs;
        card.classList.toggle('as-lock', done);
      },
    };
  },
};
