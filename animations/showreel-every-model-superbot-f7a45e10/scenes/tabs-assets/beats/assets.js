// Meshy beat: a 3D asset model (Meshy) models the showreel's hero shapes, each one a crop of @shneural's clip
// (img/sr/mesh-*.jpg, see img/sr/CREDITS.txt): the Opus reel's extruded cube field with its orange ball and its
// particle sphere, then the GPT reel's chrome torus knot and chrome star, both with lime cores.
// Its line streams, the "Generating 4 meshes" chip spins, and the mesh list wipes down. Each row lands with its file
// name rising glyph by glyph out of a baseline mask (outBack, so every glyph overshoots and settles), and its
// thumbnail builds like a 3D render, pass by pass: a scanline sweeps down and draws the triangle wireframe, the clay
// (grey) pass fades up under it, then the shaded still resolves under a skewed mask wipe, and the material tag fills
// in step with that wipe. The scanline and the wipe's edge both trail a directional smear whose length follows their
// speed (longest mid-move, none at rest). All through, the render sits a little large, off centre and turned, and
// settles to rest facing front (a turntable coming to a stop) while the wireframe slides with it. A mesh lands with
// a flash of its reel's accent (signal orange for the Opus meshes, acid lime for the GPT ones) that settles to a
// hairline; its count climbs and its pill steps Wireframe, Clay pass, Shading, Ready as a fill tracks the build.
// The header carries the render's own timecode ruler: a signal orange playhead crosses it at constant speed and each
// mesh's keyframe diamond, set hollow on the ruler from the start, pops filled (outBack) the moment the playhead
// reaches it, which is the moment that mesh lands; the last sits on the ruler's end, where the header total locks and
// the chip resolves to "Generated 4 meshes".
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Modeling the hero shapes: a cube field, a particle sphere, two chrome forms.';
// accents from the clip (the 709 column of img/sr/CREDITS.txt): the Opus reel's signal orange, the GPT reel's acid
// lime; each with the colour its wireframe is drawn in (paper for the Opus meshes, lime for the GPT ones)
const OPUS = { hex: '#fc591f', rgb: '252, 89, 31', wire: 'rgba(242, 238, 230, .5)' };
const GPT = { hex: '#c9fb1e', rgb: '201, 251, 30', wire: 'rgba(201, 251, 30, .58)' };
// material tags: [label, fill, ink] (paper, cobalt and lime from the clip)
const MAT = {
  matte: ['matte extrude', '#f2eee6', '#0c0b0e'],
  points: ['points', '#3043fe', '#f2eee6'],
  chrome: ['chrome + lime', '#c9fb1e', '#0a0a08'],
};
// [thumbnail, file, what it shows (per img/sr/CREDITS.txt), material, count, unit, reel]
const MESHES = [
  ['sr/mesh-cubes.jpg', 'cube_field.glb', 'Columns + orange ball', 'matte', 6272, 'tris', OPUS],
  ['sr/mesh-sphere.jpg', 'particle_sphere.glb', 'Red, white + cobalt', 'points', 4096, 'pts', OPUS],
  ['sr/mesh-knot.jpg', 'chrome_knot.glb', 'Torus knot, lime core', 'chrome', 16384, 'tris', GPT],
  ['sr/mesh-star.jpg', 'chrome_star.glb', 'Five-point star', 'chrome', 5120, 'tris', GPT],
];
const sum = (u) => MESHES.reduce((s, m) => s + (m[5] === u ? m[4] : 0), 0);
const TRIS = sum('tris'), PTS = sum('pts');
const GEN = 1.1;       // seconds one mesh takes to build, from its render starting to Ready
const STAGGER = 0.28;
const num = (n) => Math.round(n).toLocaleString('en-US');

// the render passes, as fractions of a mesh's build: the wireframe scan, the clay pass fading up, the shading wipe
const SCAN = [0, 0.32], CLAY = [0.22, 0.55], SHADE = [0.5, 0.94];
const passAt = (p) => (p >= 1 ? 'Ready' : p >= SHADE[0] ? 'Shading' : p >= 0.3 ? 'Clay pass' : 'Wireframe');
// thumbnail geometry (assets.css): 42px square; the shading wipe's edge leans SK px either side of its centre, so its
// skew is atan(SK / half the height), leaning right at the top
const TH = 42, SK = 9;
const LEAN = (Math.atan(SK / (TH / 2)) * 180 / Math.PI).toFixed(2);
// normalised speed of inOutCubic (1 at its midpoint, 0 at rest): the smear behind a moving edge scales with it
const vel = (u) => (u <= 0 || u >= 1 ? 0 : u < 0.5 ? 4 * u * u : 4 * (1 - u) * (1 - u));
// the header ruler (assets.css .as-rl is RW + 2 * RPAD wide): its track, and the rise of a file name glyph, px
const RW = 64, RPAD = 4, GLYPH_DY = 14;

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
    // the ruler maps the render window (the first mesh starting to build .. the last one landing) onto its track, so
    // each mesh's keyframe sits where the playhead will be when that mesh lands
    const R0 = T.row[0] + 0.1, land = T.row.map((a) => a + GEN);
    const at = (tt) => RPAD + RW * seg(tt, R0, T.done);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating 4 meshes</span></div></div>');
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><b>Showreel hero meshes</b><small class="as-sum"><span class="as-tot">0 tris · 0 pts</span><span class="as-sep">·</span><span class="as-rl"><i class="as-ph"></i>${MESHES.map(([, , , , , , reel], i) => `<i class="as-kd" style="left:${at(land[i]).toFixed(2)}px;--acc:${reel.hex};--acc-rgb:${reel.rgb}"></i>`).join('')}</span></small></div>
      ${MESHES.map(([src, file, what, mat, , unit, reel]) => `<div class="as-row" style="--acc:${reel.hex};--acc-rgb:${reel.rgb};--wire:${reel.wire};--tg:${MAT[mat][1]};--tt:${MAT[mat][2]}">
        <span class="as-th"><i class="as-clay"><img src="${x.img(src)}" alt=""/></i><i class="as-wire"></i><i class="as-shade"><img src="${x.img(src)}" alt="${x.esc(what)}"/></i><i class="as-scan"></i><i class="as-edge"></i><i class="as-ring"></i></span>
        <span class="as-main"><b class="as-file">${[...file].map((c) => `<i>${x.esc(c)}</i>`).join('')}</b><small><span class="as-tag">${x.esc(MAT[mat][0])}<i class="as-tagf" aria-hidden="true">${x.esc(MAT[mat][0])}</i></span>${x.esc(what)}</small></span>
        <span class="as-tris" data-u="${unit}">0</span>
        <span class="as-st">Wireframe</span>
      </div>`).join('')}
    </div>`);
    const q = (n, s) => n.querySelector(s);
    const rows = [...card.querySelectorAll('.as-row')].map((row) => ({
      row, clay: q(row, '.as-clay'), wire: q(row, '.as-wire'), shade: q(row, '.as-shade'), scan: q(row, '.as-scan'),
      edge: q(row, '.as-edge'), ring: q(row, '.as-ring'), tagf: q(row, '.as-tagf'), tris: q(row, '.as-tris'),
      st: q(row, '.as-st'), imgs: [...row.querySelectorAll('.as-th img')], glyphs: [...row.querySelectorAll('.as-file i')],
    }));
    const tot = q(card, '.as-tot'), ph = q(card, '.as-ph'), kds = [...card.querySelectorAll('.as-kd')];
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const set = (n, prop, v) => { if (n.style[prop] !== v) n.style[prop] = v; };
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

        // the list rises and wipes down under a mask from its top edge
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        card.style.clipPath = ci >= 1 ? '' : `inset(0 0 ${((1 - ci) * 100).toFixed(2)}% 0 round 10px)`;

        // the ruler: the playhead at constant speed, each keyframe hollow until its mesh lands, then popping filled
        set(ph, 'transform', `translateX(${at(t).toFixed(2)}px)`);
        kds.forEach((kd, i) => {
          const on = t >= land[i], pop = seg(t, land[i], land[i] + 0.25);
          kd.classList.toggle('on', on);
          set(kd, 'transform', `rotate(45deg) scale(${(on ? lerp(0.3, 1, outBack(pop)) : 0.85).toFixed(3)})`);
        });

        let tris = 0, pts = 0;
        rows.forEach((m, i) => {
          const a = T.row[i], [, , , , count, unit] = MESHES[i];
          rise(m.row, seg(t, a, a + 0.3), 6);
          // kinetic type: each glyph of the file name rises out of the baseline mask, overshooting as it lands
          m.glyphs.forEach((g, j) => {
            const gq = seg(t, a + 0.02 + j * 0.016, a + 0.3 + j * 0.016);
            set(g, 'transform', gq >= 1 ? '' : `translateY(${((1 - outBack(gq)) * GLYPH_DY).toFixed(2)}px)`);
          });

          const p = seg(t, a + 0.1, a + GEN), e = outCubic(p), ready = p >= 1;
          // turntable: the render sits large, panned and turned, and comes to rest facing front as the mesh lands
          const tf = ready ? '' : `perspective(160px) translateX(${lerp(4, 0, e).toFixed(2)}px) rotateY(${lerp(14, 0, e).toFixed(2)}deg) scale(${lerp(1.16, 1, e).toFixed(4)})`;
          m.imgs.forEach((img) => set(img, 'transform', tf));

          // wireframe pass: a scanline sweeps down and the lattice is drawn above it, sliding with the turntable
          const w = seg(p, SCAN[0], SCAN[1]), wy = inOutCubic(w) * TH, wh = 2 + 12 * vel(w);
          set(m.wire, 'clipPath', `inset(0 0 ${(TH - wy).toFixed(2)}px 0)`);
          set(m.wire, 'opacity', ready ? '0' : '1');
          set(m.wire, 'backgroundPosition', ready ? '' : `${((1 - e) * 14).toFixed(2)}px 0`);
          set(m.scan, 'opacity', w > 0 && w < 1 ? '1' : '0');
          set(m.scan, 'height', `${wh.toFixed(2)}px`);
          set(m.scan, 'transform', `translateY(${(wy - wh).toFixed(2)}px)`);
          // clay pass: the grey render fades up under the wireframe
          set(m.clay, 'opacity', ready ? '0' : (0.9 * outCubic(seg(p, CLAY[0], CLAY[1]))).toFixed(3));
          // shading pass: the still resolves under a skewed mask wipe, left to right, its edge smeared by its speed
          const b = seg(p, SHADE[0], SHADE[1]), bx = lerp(-SK, TH + SK, inOutCubic(b)), bw = 2 + 12 * vel(b);
          set(m.shade, 'clipPath', b >= 1 ? 'none' : `polygon(0 0, ${(bx + SK).toFixed(2)}px 0, ${(bx - SK).toFixed(2)}px 100%, 0 100%)`);
          set(m.edge, 'opacity', b > 0 && b < 1 ? '1' : '0');
          set(m.edge, 'width', `${bw.toFixed(2)}px`);
          set(m.edge, 'transform', `translateX(${(bx - bw).toFixed(2)}px) skewX(-${LEAN}deg)`);
          // the material is assigned as the shading lands: the filled copy of its tag is uncovered in step with the wipe
          set(m.tagf, 'clipPath', `inset(0 ${((1 - inOutCubic(b)) * 100).toFixed(2)}% 0 0)`);

          // the count resolves with the wireframe and the clay pass (the mesh exists before it is shaded)
          const c = count * outCubic(seg(p, 0, 0.5));
          if (unit === 'pts') pts += c; else tris += c;
          const s = num(c);
          if (m.tris.textContent !== s) m.tris.textContent = s;

          m.row.classList.toggle('as-ready', ready);
          const st = passAt(p);
          if (m.st.textContent !== st) m.st.textContent = st;
          set(m.st, 'background', ready ? '' : `linear-gradient(90deg, rgba(242, 238, 230, .13) ${(p * 100).toFixed(1)}%, #17161b 0)`);
          const pop = seg(t, a + GEN, a + GEN + 0.3);
          set(m.st, 'transform', pop > 0 && pop < 1 ? `scale(${lerp(0.8, 1, outBack(pop)).toFixed(3)})` : '');
          // render complete: the ring flashes the reel's accent with an inner glow, then settles to its hairline
          const fl = 1 - outCubic(pop);
          set(m.ring, 'boxShadow', pop > 0 && pop < 1
            ? `inset 0 0 0 1.5px rgba(${MESHES[i][6].rgb}, ${lerp(0.75, 1, fl).toFixed(3)}), inset 0 0 ${(10 * fl).toFixed(2)}px rgba(${MESHES[i][6].rgb}, ${(0.75 * fl).toFixed(3)})`
            : '');
        });
        const ss = done ? `${num(TRIS)} tris · ${num(PTS)} pts` : `${num(tris)} tris · ${num(pts)} pts`;
        if (tot.textContent !== ss) tot.textContent = ss;
        card.classList.toggle('as-lock', done);
      },
    };
  },
};
