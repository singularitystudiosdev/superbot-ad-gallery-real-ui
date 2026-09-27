// Mapkit beat: Meshy builds the Tidewater Plaza kit. The line streams, the "Generating 6 meshes" chip spins, and the
// bench splits in two: a 3x2 grid of mesh tiles on the left, each thumbnail coming out of its wireframe shell into the
// shaded pass while its triangle count climbs; and the TAB MAP map plate on the right, where a marker pin drops onto its
// spot the moment its mesh lands. The beat closes on "Tidewater Plaza · Turf War" and the kit's total triangles.
// Every thumbnail is a real frame or crop of the Inkwave capture (img/ink, see INDEX.txt), never a drawing; the
// wireframe, the scan line, the map grid and the pins are UI chrome. The map plate is the capture's own TAB MAP
// minimap, img/ink/hud-minimap.jpg, cropped out of the in match HUD frame and sitting absolute inside the plate under
// the pins; the ink blobs over it are chrome drawn from t. The launch ramp tile keeps the super jump frame because the
// capture isolates no ramp.
// Pure function of t: no Date, no rAF state, no self-running CSS animation or transition, so ?t=<sec> freezes a frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Building Tidewater Plaza.';
const RUN = 'Generating 6 meshes';
const DONE = 'Generated 6 meshes';
// the six-mesh plaza kit: the GLB name, its source crop in img/ink, what it is, its low-poly triangle budget, and the
// spot on the minimap its pin drops onto (per cent of the map plate). The triangle counts are the kit's own low-poly
// budget figures: they are spot chrome, not a published stat.
const MESHES = [
  { file: 'pier_deck.glb', src: 'ink/prop-pier.jpg', what: 'Pier decking', tris: 1280, x: 26, y: 66 },
  { file: 'launch_ramp.glb', src: 'ink/superjump.jpg', what: 'Launch ramp', tris: 384, x: 45, y: 30 },
  { file: 'palm_tree.glb', src: 'ink/prop-palm.jpg', what: 'Palm tree', tris: 512, x: 70, y: 58 },
  { file: 'traffic_cone.glb', src: 'ink/prop-cone.jpg', what: 'Traffic cone', tris: 96, x: 15, y: 36 },
  { file: 'crate_stack.glb', src: 'ink/prop-crates.jpg', what: 'Crate stack', tris: 420, x: 56, y: 78 },
  { file: 'harbor_bridge.glb', src: 'ink/prop-bridge.jpg', what: 'Harbor bridge', tris: 2140, x: 82, y: 24 },
];
const N = MESHES.length;
// the ink coverage on the map plate: lime spreading up the left half, magenta down the right, one blob per mesh slot so
// each blob can swell as its mesh lands. Chrome, drawn from t, never an image.
const INKS = [
  { x: 12, y: 20, w: 46, team: 'lime' },
  { x: 5, y: 56, w: 38, team: 'lime' },
  { x: 28, y: 42, w: 34, team: 'lime' },
  { x: 18, y: 78, w: 42, team: 'lime' },
  { x: 60, y: 14, w: 40, team: 'magenta' },
  { x: 76, y: 44, w: 44, team: 'magenta' },
  { x: 54, y: 64, w: 34, team: 'magenta' },
  { x: 82, y: 80, w: 36, team: 'magenta' },
];
const GEN = 0.7;       // seconds one mesh takes to come out of its wireframe
const STAGGER = 0.19;  // gap between two tiles starting
const DROP = 0.34;     // seconds a pin takes to fall onto the map
const num = (n) => Math.round(n).toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.chipDone = T.chip + 0.4;
    T.card = r + 0.4;
    T.tile = MESHES.map((_, i) => r + 0.52 + i * STAGGER);
    T.pin = MESHES.map((_, i) => T.tile[i] + GEN);   // the pin falls as that mesh resolves
    T.kit = T.pin[N - 1] + 0.14;                     // the map label and the total land
    T.end = T.kit + 0.44;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating 6 meshes</span></div></div>');
    const card = x.el(`<div class="mk-card">
      <div class="mk-hd">
        <span class="mk-badge"><img src="${x.brand('meshy-icon.png')}" alt=""/>MESHY</span>
        <b>Tidewater Plaza kit</b>
        <small class="mk-sum">6 meshes</small>
      </div>
      <div class="mk-body">
        <div class="mk-tiles">${MESHES.map((m) => `<div class="mk-tile">
          <span class="mk-th"><img class="mk-img" src="${x.img(m.src)}" alt="${x.esc(m.what)} source crop" draggable="false"/>
            <i class="mk-wire"></i><i class="mk-scan"></i></span>
          <b class="mk-file">${x.esc(m.file)}</b>
          <small class="mk-tris">0</small>
          <i class="mk-prog"></i>
        </div>`).join('')}</div>
        <div class="mk-side">
          <div class="mk-maphd"><i class="mk-tab">TAB MAP</i><small class="mk-pins">0 of 6 snapped</small></div>
          <div class="mk-mapwrap">
            <img class="mk-mapim" src="${x.img('ink/hud-minimap.jpg')}" alt="${x.esc('TAB MAP minimap from the Inkwave capture')}" draggable="false"/>
            <span class="mk-inks">${INKS.map((k) => `<i class="mk-ink ${k.team}" style="left:${k.x}%;top:${k.y}%;width:${k.w}%"></i>`).join('')}</span>
            <i class="mk-grid"></i>
            <i class="mk-mscan"></i>
            ${MESHES.map((m) => `<span class="mk-pin" style="left:${m.x}%;top:${m.y}%"><i class="mk-ring"></i><i class="mk-core"></i></span>`).join('')}
          </div>
        </div>
      </div>
      <div class="mk-foot"><b>Tidewater Plaza &#183; Turf War</b><small class="mk-total">0 tris</small></div>
    </div>`);
    const tiles = [...card.querySelectorAll('.mk-tile')].map((node) => ({
      node, img: node.querySelector('.mk-img'), wire: node.querySelector('.mk-wire'), scan: node.querySelector('.mk-scan'),
      tris: node.querySelector('.mk-tris'), prog: node.querySelector('.mk-prog'),
    }));
    const pins = [...card.querySelectorAll('.mk-pin')].map((node) => ({ node, ring: node.querySelector('.mk-ring') }));
    const inks = card.querySelector('.mk-inks'), blobs = [...card.querySelectorAll('.mk-ink')];
    const mscan = card.querySelector('.mk-mscan');
    const foot = card.querySelector('.mk-foot'), totalEl = card.querySelector('.mk-total'), npins = card.querySelector('.mk-pins');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, lastPins = -1, lastTotal = '';

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.pin[N - 1], pins[N - 1].node], [T.kit, foot]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const chipDone = t >= T.chipDone;
        spin.classList.toggle('done', chipDone);
        spin.style.transform = chipDone ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = chipDone ? DONE : RUN;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the ink spreads over the plate as the bench works, and the plate settles out of a slight over scale
        const mp = outCubic(seg(t, T.card, T.pin[N - 1]));
        inks.style.opacity = (0.22 + 0.78 * mp).toFixed(3);
        inks.style.transform = mp >= 1 ? 'none' : `scale(${lerp(1.07, 1, mp).toFixed(4)})`;
        blobs.forEach((b, i) => {
          const mi = i % N, e = outCubic(seg(t, T.tile[mi], T.pin[mi]));
          b.style.opacity = lerp(0.08, 0.34, e).toFixed(3);
          b.style.transform = `scale(${lerp(0.55, 1, e).toFixed(3)})`;
        });
        // one scan line down the plate, done before the last pin lands
        const sp = seg(t, T.card + 0.12, T.kit - 0.05);
        mscan.style.opacity = (sp > 0 && sp < 1 ? 0.85 : 0).toFixed(3);
        mscan.style.transform = `translateY(${(-8 + 116 * sp).toFixed(1)}%)`;

        // left: each tile comes out of its wireframe shell into the shaded pass, its triangle count climbing with it
        let total = 0;
        tiles.forEach((m, i) => {
          const a = T.tile[i], p = seg(t, a, a + GEN), e = outCubic(p);
          m.img.style.opacity = lerp(0.16, 1, e).toFixed(3);
          m.img.style.filter = p >= 1 ? 'none' : `blur(${((1 - e) * 6).toFixed(2)}px) saturate(${lerp(0.2, 1, e).toFixed(3)})`;
          m.img.style.transform = p >= 1 ? 'none' : `scale(${lerp(1.05, 1, e).toFixed(4)})`;
          m.wire.style.opacity = (1 - seg(p, 0.45, 1)).toFixed(3);
          m.scan.style.opacity = (p > 0 && p < 1 ? 0.9 : 0).toFixed(3);
          m.scan.style.transform = `translateY(${lerp(-25, 130, p).toFixed(1)}%)`;
          m.prog.style.transform = `scaleX(${e.toFixed(3)})`;
          const c = MESHES[i].tris * e;
          total += c;
          const s = num(c);
          if (m.tris.textContent !== s) m.tris.textContent = s;
          m.node.classList.toggle('mk-on', p >= 1);
        });

        // right: a pin drops onto its spot the moment its mesh is ready
        let snapped = 0;
        pins.forEach((p, i) => {
          const a = T.pin[i], d = seg(t, a, a + DROP), de = outBack(d);
          p.node.style.opacity = d.toFixed(3);
          p.node.style.transform = d <= 0 ? 'none' : `translateY(${((1 - de) * -14).toFixed(2)}px) scale(${lerp(0.72, 1, de).toFixed(3)})`;
          const ping = seg(t, a + 0.04, a + 0.46);
          p.ring.style.opacity = (ping > 0 && ping < 1 ? (1 - ping) * 0.85 : 0).toFixed(3);
          p.ring.style.transform = `scale(${lerp(0.35, 2.5, outCubic(ping)).toFixed(3)})`;
          if (d >= 1) snapped++;
        });
        if (snapped !== lastPins) { lastPins = snapped; npins.textContent = `${snapped} of ${N} snapped`; }

        const tot = num(total);
        if (tot !== lastTotal) { lastTotal = tot; totalEl.textContent = `${tot} tris`; }

        // the kit closes on its map line and the triangles the six meshes add up to
        const ki = outCubic(seg(t, T.kit, T.kit + 0.34));
        foot.style.opacity = ki.toFixed(3);
        foot.style.transform = ki >= 1 ? 'none' : `translateY(${((1 - ki) * 8).toFixed(2)}px)`;
      },
    };
  },
};