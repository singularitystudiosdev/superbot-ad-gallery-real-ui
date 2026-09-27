// Assets beat: Meshy runs image-to-3D on Gemini's portraits, the link after the art beat. Its line streams, the
// "Image to 3D" chip spins, and the kart list rises: each row lands with its source portrait (Gemini's art-N),
// an arrow, and the kart that portrait became. The kart thumbnail spins on a turntable under a wireframe that fades
// as the mesh resolves, its triangle count climbs, and its status pill flips from Remeshing to Ready.
// Every image is a real frame of the Turbo Kart Rally footage: the portraits are img/kart/art-1..4.jpg, and each
// racer's kart is that racer's own kart in the clip (Blaze's red cap kart and Bella's pink crown kart from the
// racer select, Zippy's green #2 kart at the start, Toadly's blue mushroom kart from behind), see
// img/kart/assets.json mesh[] and img/CREDITS.txt. The .glb names and triangle counts are made up for the spot.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = "Turning Gemini's portraits into karts.";
// [portrait, racer, kart still, file, what it is, triangles]: img/kart/assets.json art[] + mesh[]
const KARTS = [
  ['kart/art-1.jpg', 'Blaze', 'kart/mesh-2.jpg', 'blaze_kart.glb', 'red cap kart', 8720],
  ['kart/art-2.jpg', 'Zippy', 'kart/mesh-5.jpg', 'zippy_kart.glb', 'green #2 cap kart', 8956],
  ['kart/art-3.jpg', 'Bella', 'kart/mesh-6.jpg', 'bella_kart.glb', 'pink crown kart', 9412],
  ['kart/art-4.jpg', 'Toadly', 'kart/mesh-1.jpg', 'toadly_kart.glb', 'blue mushroom kart', 9184],
];
const TOTAL = KARTS.reduce((s, m) => s + m[5], 0);
const GEN = 1.1;       // seconds one mesh takes to resolve
const STAGGER = 0.3;
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.row = KARTS.map((_, i) => r + 0.6 + i * STAGGER);
    T.done = T.row[KARTS.length - 1] + GEN;
    T.end = T.done + 0.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Image to 3D: ${KARTS.length} karts</span></div></div>`);
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><b>Turbo Kart Rally karts</b><small class="as-sum">${KARTS.length} meshes · 0 tris</small></div>
      ${KARTS.map(([art, name, src, file, what]) => `<div class="as-row">
        <span class="as-src"><img src="${x.img(art)}" alt="${x.esc(name)} portrait"/></span>
        <i class="as-arrow" aria-hidden="true"></i>
        <span class="as-th"><img src="${x.img(src)}" alt="${x.esc(name)}'s ${x.esc(what)}"/><i class="as-wire"></i></span>
        <span class="as-main"><b class="as-file">${x.esc(file)}</b><small>${x.esc(what)}</small></span>
        <span class="as-tris">0</span>
        <span class="as-st">Remeshing</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.as-row')].map((row) => ({
      row, arrow: row.querySelector('.as-arrow'), img: row.querySelector('.as-th img'),
      wire: row.querySelector('.as-wire'), tris: row.querySelector('.as-tris'), st: row.querySelector('.as-st'),
    }));
    const sum = card.querySelector('.as-sum');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[KARTS.length - 1], rows[KARTS.length - 1].row]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? `Generated ${KARTS.length} kart meshes` : `Image to 3D: ${KARTS.length} karts`;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        let total = 0;
        rows.forEach((m, i) => {
          const a = T.row[i];
          rise(m.row, seg(t, a, a + 0.3), 6);
          // the arrow draws from the portrait toward the kart as the row starts meshing
          const ar = outCubic(seg(t, a + 0.05, a + 0.35));
          m.arrow.style.transform = `scaleX(${ar.toFixed(3)})`;
          const p = seg(t, a + 0.1, a + GEN), e = outCubic(p);
          // turntable: the thumbnail squashes on x as if it were spinning, slowing to rest as the mesh lands
          const turn = Math.cos((1 - e) * Math.PI * 3);
          m.img.style.transform = p >= 1 ? 'none' : `scaleX(${lerp(0.35, 1, Math.abs(turn)).toFixed(3)})`;
          m.img.style.filter = p >= 1 ? 'none' : `blur(${((1 - e) * 5).toFixed(2)}px) saturate(${lerp(0.2, 1, e).toFixed(3)})`;
          m.wire.style.opacity = (1 - seg(p, 0.55, 1)).toFixed(3);
          const c = KARTS[i][5] * e;
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
        const ss = `${KARTS.length} meshes · ${num(done ? TOTAL : total)} tris`;
        if (sum.textContent !== ss) sum.textContent = ss;
      },
    };
  },
};
