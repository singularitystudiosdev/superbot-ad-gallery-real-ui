// Assets beat (Meshy, chapter II · FORM): a 3D asset model (Meshy) raises the film's monuments. Its line streams, the
// "Generating 4 monument meshes" chip spins, and the monument list rises on a sheet of the film's parchment: each row
// lands, its thumbnail spins on a turntable under an ink hatch that fades as the mesh resolves, its triangle count
// climbs, its status flips from Remeshing to a Roman red Ready stamp, and it carries the era the clip's HUD reads on
// that very frame: the chapter tag over the ANNO year in the HUD mono, the year rolling in from the HUD's previous
// reading with the HUD's ease-out while a small red marker runs along a copy of the HUD timeline (500 BC to the end).
// The four meshes are the monuments the asset step cut from the clip: the Colosseum under SPQR (25.0 s, II · ROMA,
// AD 80), the Pantheon dome (32.0 s, II · ROMA, AD 126), Saturn V on the pad (92.0 s, XIV · T-MINUS, AD 1969) and the
// Lunar Module at Tranquility Base (96.433 s, XV · COSMOS, AD 1969). Stills, .glb names and triangle counts from
// img/prometheus/assets.json mesh[] (see img/CREDITS.txt), captions verbatim from the clip's own on-screen lines,
// years from img/prometheus/chapters.json eras[].
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Raising the monuments, from the Colosseum to the Moon.';
// [thumbnail, file, clip caption, triangles, chapter tag, ANNO year, the HUD's previous year, what it is]
// years are astronomical (0 = 1 BC, -46 = 47 BC); the previous year is the reading the HUD rolls in from on that cut
const MESHES = [
  ['prometheus/mesh-1.jpg', 'colosseum.glb', 'AMPHITHEATRVM FLAVIVM', 48216, 'II · ROMA', 80, -46, 'Colosseum under the SPQR stamp'],
  ['prometheus/mesh-2.jpg', 'pantheon_dome.glb', 'PANTHEON · UNREINFORCED CONCRETE', 21904, 'II · ROMA', 126, 117, 'Pantheon dome cutaway, STILL STANDING'],
  ['prometheus/mesh-3.jpg', 'saturn_v.glb', 'APOLLO 11 · LC-39A', 15360, 'XIV · T-MINUS', 1969, 1942, 'Saturn V and launch tower on the pad'],
  ['prometheus/mesh-4.jpg', 'lunar_module.glb', 'TRANQUILITY BASE', 11872, 'XV · COSMOS', 1969, 1969, 'Apollo Lunar Module on the surface'],
];
const TOTAL = MESHES.reduce((s, m) => s + m[3], 0);
const GEN = 1.1;       // seconds one mesh takes to resolve
const STAGGER = 0.28;
const ROLL = 0.3;      // the HUD's year counter eases in over 8 to 10 frames (0.27 to 0.33 s)
const num = (n) => Math.round(n).toLocaleString('en-US');
const anno = (y) => (y <= 0 ? `${1 - y} BC` : `AD ${y}`);
// where a year sits on the HUD timeline: the track runs x 610 to 1320 at 1080p, year 0 at x 754.5, 0.2413 px per year
const onTrack = (y) => Math.min(1, Math.max(0, (754.5 + 0.2413 * y - 610) / 710));

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
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating ${MESHES.length} monument meshes</span></div></div>`);
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><b>Prometheus II monuments</b><small class="as-sum">${MESHES.length} meshes · 0 tris</small></div>
      ${MESHES.map(([src, file, cap, , tag, , from, what]) => `<div class="as-row">
        <span class="as-th"><img src="${x.img(src)}" alt="${x.esc(what)}"/><i class="as-wire"></i></span>
        <span class="as-main"><b class="as-file">${x.esc(file)}</b><small>${x.esc(cap)}</small></span>
        <span class="as-era"><small>${x.esc(tag)}</small><b>${x.esc(anno(from))}</b><i class="as-tl"><u></u><s></s></i></span>
        <span class="as-tris">0</span>
        <span class="as-st">Remeshing</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.as-row')].map((row) => ({
      row, img: row.querySelector('.as-th img'), wire: row.querySelector('.as-wire'), tris: row.querySelector('.as-tris'), st: row.querySelector('.as-st'),
      year: row.querySelector('.as-era b'), fill: row.querySelector('.as-tl u'), mark: row.querySelector('.as-tl s'),
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
        const cl = done ? `Generated ${MESHES.length} monument meshes` : `Generating ${MESHES.length} monument meshes`;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        let total = 0;
        rows.forEach((m, i) => {
          const a = T.row[i];
          rise(m.row, seg(t, a, a + 0.3), 6);
          const p = seg(t, a + 0.1, a + GEN), e = outCubic(p);
          // turntable: the thumbnail squashes on x as if it were spinning, slowing to rest as the mesh lands, and
          // climbs out of an ink sketch (blurred, sepia) into the clip's own frame
          const turn = Math.cos((1 - e) * Math.PI * 3);
          m.img.style.transform = p >= 1 ? 'none' : `scaleX(${lerp(0.35, 1, Math.abs(turn)).toFixed(3)})`;
          m.img.style.filter = p >= 1 ? 'none' : `blur(${((1 - e) * 5).toFixed(2)}px) sepia(${(1 - e).toFixed(3)})`;
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

          // the era: rolls in from the HUD's previous reading as the mesh lands, the marker riding the timeline with it
          const [, , , , , to, from] = MESHES[i];
          const y = Math.round(lerp(from, to, outCubic(seg(t, a + GEN - ROLL, a + GEN))));
          const ys = anno(y);
          if (m.year.textContent !== ys) m.year.textContent = ys;
          const f = (onTrack(y) * 100).toFixed(2);
          m.fill.style.width = `${f}%`;
          m.mark.style.left = `${f}%`;
        });
        const ss = `${MESHES.length} meshes · ${num(done ? TOTAL : total)} tris`;
        if (sum.textContent !== ss) sum.textContent = ss;
      },
    };
  },
};
