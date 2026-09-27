// Assets beat: a 3D asset model (Meshy) generates the point clouds of the reel's 05 DEPTH chapter. Its line streams,
// the "Generating 4 point clouds" chip spins, and the mesh list rises under an ink viewport that plays the chapter:
// the same 576 points run wave, vortex, sphere, torus (the clip's order), each shape arriving on an ease-in-out
// morph (Meshy's easing in this reel), under the clip's own readout "VERTICES 576 · FOCAL 1400 · ROT.Y 021.8°".
// Each row lands with a live thumbnail of its own point cloud turning on Y, points condensing out of a scatter
// while its vertex count climbs to 576 and its status pill flips from Sampling to Ready.
// Pure function of t: every moving value (rotation, morph, scatter, counts) is written from t, so ?t= freezes any
// frame. The canvases are redrawn from t on every render and hold no state between frames.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Generating the DEPTH point clouds.';
// [file, what it is, shape]. Every shape is the same 24 x 24 = 576 points, as in the clip's readout.
const MESHES = [
  ['depth_wave.glb', 'Wave surface, point grid in perspective', 'wave'],
  ['vortex_plane.glb', 'Vortex, the grid pulled into a funnel', 'vortex'],
  ['sphere_points.glb', 'Wireframe point sphere, open poles', 'sphere'],
  ['torus_points.glb', 'Torus, the same 576 points', 'torus'],
];
const N = 24;                    // grid side: N * N = 576 vertices per mesh
const VERTS = N * N;
const TOTAL = VERTS * MESHES.length;
const GEN = 1.1;                 // seconds one mesh takes to resolve
const STAGGER = 0.28;
const FOCAL = 1400;              // the clip's readout; the projection below uses it against the clip's 1920px frame
const num = (n) => Math.round(n).toLocaleString('en-US');
const pad3 = (d) => { const s = (((d % 360) + 360) % 360).toFixed(1); return s.padStart(5, '0'); };

// palette (the ad's --mr-* custom properties, with the reel's own values as the fallback)
const INK = '#0F0F11', CREAM = '#F2EFE7', RED = '#F04B3A';

// ---- geometry: point (i, j) of shape s, in a unit box, at time t (the wave and vortex breathe with t) ----
function shapePoint(s, i, j, t) {
  const u = i / (N - 1), v = j / (N - 1);
  if (s === 'wave') {
    const x = (u - 0.5) * 2.4, z = (v - 0.5) * 2.4;
    const y = 0.16 * Math.sin(x * 2.6 + t * 3.1) + 0.1 * Math.sin(z * 3.3 - t * 2.3);
    return [x, y, z];
  }
  if (s === 'vortex') {
    const x0 = (u - 0.5) * 2.4, z0 = (v - 0.5) * 2.4;
    const r = Math.hypot(x0, z0), a0 = Math.atan2(z0, x0);
    const tw = 3.2 * Math.exp(-r * 1.4) + t * 1.1 * Math.exp(-r * 0.9);   // the twist tightens toward the eye
    const x = r * Math.cos(a0 + tw), z = r * Math.sin(a0 + tw);
    const y = 0.32 - 1.05 * Math.exp(-r * r * 2.2);                      // the grid sinks into a funnel
    return [x, y, z];
  }
  if (s === 'sphere') {
    const ph = lerp(0.12, 0.88, u) * Math.PI, th = v * Math.PI * 2;      // open poles, like the clip's rings
    return [Math.sin(ph) * Math.cos(th), Math.cos(ph) * 1.04, Math.sin(ph) * Math.sin(th)];
  }
  // torus
  const a = u * Math.PI * 2, b = v * Math.PI * 2, R = 0.86, r = 0.3;
  return [(R + r * Math.cos(a)) * Math.cos(b), r * Math.sin(a), (R + r * Math.cos(a)) * Math.sin(b)];
}
// the camera per shape: tilt on X (the planes and the torus are seen from above, the sphere near level)
const TILT = { wave: 0.42, vortex: 0.5, sphere: 0.3, torus: 0.88 };
// a sparse, fixed set of red vertices (about 8%, as in the clip)
const RED_V = Array.from({ length: VERTS }, (_, k) => rand(k * 7 + 3) < 0.08);

/** project the N*N points of a mix of shapes: from shape a to shape b at morph m (0..1), rotated rotY on Y, tilt on X.
    w, h: canvas px; scale: the object's radius in px; cyf: the centre's height as a fraction of h.
    Returns [x, y, depth 0..1] per vertex. */
function project(a, b, m, t, rotY, tilt, w, h, scale, cyf = 0.5) {
  const out = new Array(VERTS);
  const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(tilt), sx = Math.sin(tilt);
  const f = (FOCAL / 1920) * 4.2;          // the clip's focal over its frame width, against a camera 4.2 radii back
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const p = shapePoint(a, i, j, t);
    let x = p[0], y = p[1], z = p[2];
    if (m > 0) { const q = shapePoint(b, i, j, t); x = lerp(x, q[0], m); y = lerp(y, q[1], m); z = lerp(z, q[2], m); }
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;          // Y
    const y2 = y * cx + z1 * sx, z2 = -y * sx + z1 * cx;        // X: the camera looks down from above
    const k = f / (f + z2 * 0.32);
    out[i * N + j] = [w / 2 + x1 * scale * k, h * cyf - y2 * scale * k, clamp(0.5 - z2 * 0.42)];
  }
  return out;
}

/** draw a point cloud: the wireframe (thin cream lines to the grid neighbours), then the dots, far ones dimmer.
    vis: how many vertices are in (0..VERTS, the count climbing), scatter: 0..1 pull back toward a random cloud,
    lines: 0..1 wireframe opacity, dot: dot radius in px */
function drawCloud(g, pts, w, h, { vis = VERTS, scatter = 0, lines = 1, dot = 1.4, seed = 0 } = {}) {
  g.fillStyle = INK;
  g.fillRect(0, 0, w, h);
  const P = scatter > 0 ? pts.map(([x, y, d], k) => {
    const rx = (rand(seed * 991 + k * 3 + 1) - 0.5) * w * 1.1, ry = (rand(seed * 991 + k * 3 + 2) - 0.5) * h * 1.1;
    return [lerp(x, w / 2 + rx, scatter), lerp(y, h / 2 + ry, scatter), d];
  }) : pts;
  const shown = (k) => k < vis;
  if (lines > 0.01) {
    g.lineWidth = Math.max(0.5, dot * 0.32);
    g.strokeStyle = `rgba(242,239,231,${(0.22 * lines).toFixed(3)})`;
    g.beginPath();
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const k = i * N + j;
      if (!shown(k)) continue;
      const a = P[k];
      if (j + 1 < N && shown(k + 1)) { g.moveTo(a[0], a[1]); g.lineTo(P[k + 1][0], P[k + 1][1]); }
      if (i + 1 < N && shown(k + N)) { g.moveTo(a[0], a[1]); g.lineTo(P[k + N][0], P[k + N][1]); }
    }
    g.stroke();
  }
  // back to front, so near dots sit on top
  const order = [];
  for (let k = 0; k < VERTS; k++) if (shown(k)) order.push(k);
  order.sort((p, q) => P[p][2] - P[q][2]);
  for (const k of order) {
    const [x, y, d] = P[k];
    const red = RED_V[k];
    const r = dot * lerp(0.55, 1.15, d) * (red ? 1.35 : 1);
    g.globalAlpha = lerp(0.28, 1, d);
    g.fillStyle = red ? RED : CREAM;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

// canvases are sized in fixed device px (2x their CSS box) so a frame never depends on the viewer's screen
const PX = 2;
const canvas = (w, h) => `<canvas width="${w * PX}" height="${h * PX}" style="width:${w}px;height:${h}px"></canvas>`;
const VW = 418, VH = 108, TH = 36;
// the viewport's own clock, from the first row: the wave condenses (CONDENSE), then three ease-in-out morphs that
// never overlap, [start, duration] each: to the vortex, to the sphere, to the torus. As in the clip, the wave and the
// vortex pass quickly and the sphere and torus hold; the torus settles just as the last row turns Ready.
const CONDENSE = 0.3;
const MORPHS = [[0.4, 0.36], [0.86, 0.38], [1.5, 0.42]];

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
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating 4 point clouds</span></div></div>');
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><b>Motion reel · 05 DEPTH</b><small class="as-sum">4 meshes · 0 vertices</small></div>
      <div class="as-view">${canvas(VW, VH)}
        <i class="as-br as-br-tl"></i><i class="as-br as-br-tr"></i><i class="as-br as-br-bl"></i><i class="as-br as-br-br"></i>
        <span class="as-ch">05 · DEPTH</span><span class="as-cur">${x.esc(MESHES[0][0])}</span>
        <span class="as-lab">VERTICES <b class="as-lv">0</b> · FOCAL ${FOCAL} · ROT.Y <b class="as-lr">000.0</b>°</span>
      </div>
      ${MESHES.map(([file, what]) => `<div class="as-row">
        <span class="as-th">${canvas(TH, TH)}</span>
        <span class="as-main"><b class="as-file">${x.esc(file)}</b><small>${x.esc(what)}</small></span>
        <span class="as-tris">0</span>
        <span class="as-st">Sampling</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.as-row')].map((row) => {
      const c = row.querySelector('.as-th canvas');
      return { row, g: c.getContext('2d'), tris: row.querySelector('.as-tris'), st: row.querySelector('.as-st') };
    });
    const vg = card.querySelector('.as-view canvas').getContext('2d');
    const lv = card.querySelector('.as-lv'), lr = card.querySelector('.as-lr'), cur = card.querySelector('.as-cur');
    const view = card.querySelector('.as-view');
    const sum = card.querySelector('.as-sum');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
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
        setText(lab, done ? 'Generated 4 point clouds' : 'Generating 4 point clouds');

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        if (ci <= 0) return;   // nothing on the card is visible yet; its canvases keep their last frame hidden

        // ---- the viewport: one cloud of 576 points running the chapter's shapes in order, each arriving on an
        //      ease-in-out morph (the morphs are sequential, so shape a is always whole when its morph to b starts) ----
        let a = 0, m = 0;
        for (let i = 1; i < MESHES.length; i++) {
          const [at, dur] = MORPHS[i - 1], s0 = T.row[0] + at, p = seg(t, s0, s0 + dur);
          if (p >= 1) { a = i; m = 0; } else if (p > 0) { a = i - 1; m = inOutCubic(p); }
        }
        const b = Math.min(a + 1, MESHES.length - 1);
        const rotDeg = 8 + (t - T.card) * 38 + 60 * inOutCubic(seg(t, T.row[0], T.done));
        const tilt = lerp(TILT[MESHES[a][2]], TILT[MESHES[b][2]], m);
        const w = VW * PX, h = VH * PX;
        const inV = outCubic(seg(t, T.card + 0.05, T.row[0] + CONDENSE));   // the first cloud condenses in
        const pts = project(MESHES[a][2], MESHES[b][2], m, t, (rotDeg * Math.PI) / 180, tilt, w, h, h * 0.35, 0.45);
        drawCloud(vg, pts, w, h, { vis: VERTS, scatter: 1 - inV, lines: seg(inV, 0.55, 1), dot: 0.95 * PX, seed: 9 });
        view.dataset.shape = MESHES[m > 0.5 ? b : a][2];
        setText(cur, MESHES[m > 0.5 ? b : a][0]);
        setText(lv, num(VERTS * inV));
        setText(lr, pad3(rotDeg));

        // ---- the rows: each thumbnail condenses out of a scatter, turning, while its count climbs ----
        let total = 0;
        rows.forEach((row, i) => {
          const at = T.row[i];
          rise(row.row, seg(t, at, at + 0.3), 6);
          const p = seg(t, at + 0.1, at + GEN), e = outCubic(p);
          const s = MESHES[i][2], tw = TH * PX;
          if (t >= at) {
            // the turntable spins fast while the mesh resolves and settles to a slow idle turn (both from t)
            const rot = (i * 47 + (t - at) * 55 + 220 * outCubic(p)) * Math.PI / 180;
            const tp = project(s, s, 0, t, rot, TILT[s] + 0.08, tw, tw, tw * (s === 'wave' || s === 'vortex' ? 0.27 : 0.34));
            drawCloud(row.g, tp, tw, tw, { vis: Math.round(VERTS * clamp(e * 1.15)), scatter: 1 - e, lines: seg(p, 0.45, 1), dot: 0.62 * PX, seed: i + 1 });
          }
          const c = VERTS * e;
          total += c;
          setText(row.tris, num(c));
          const ready = p >= 1;
          row.row.classList.toggle('as-ready', ready);
          setText(row.st, ready ? 'Ready' : 'Sampling');
          const pop = seg(t, at + GEN, at + GEN + 0.3);
          row.st.style.transform = pop > 0 && pop < 1 ? `scale(${lerp(0.8, 1, outBack(pop)).toFixed(3)})` : '';
        });
        setText(sum, `4 meshes · ${num(done ? TOTAL : total)} vertices`);
      },
    };
  },
};
