// Meshy: the ride's four 3D models (bike + rider, torii gate, tree, stone lantern) in a Meshy-style result card, drawn
// by three.js (vendor/three, r186) from the real GLBs in <ad>/models/. One WebGL canvas lies over the 2x2 grid and
// draws every tile through its own viewport + scissor. Each model pops in on a turntable as its wireframe (bright
// triangle lines over a near-black shaded copy), then a scan plane runs down it: above the cut the model is shown with
// its own materials, below it is still wire, and a glowing band marks the cut. The header counts
// Meshing -> Texturing n% -> Done from the same progress.
// render(t) is a pure function of t: the turntable angle, the pop and the scan height are all computed from t and
// the frame is drawn synchronously inside render (no requestAnimationFrame, no clocks, nothing carried between frames).
import * as THREE from '../../../vendor/three/build/three.module.js';
import { GLTFLoader } from '../../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from '../../../vendor/three/examples/jsm/environments/RoomEnvironment.js';
import { clamp, seg, lerp, outCubic, outBack, inOutCubic } from '../../../lib.js';
import { sayer, rise, setText } from './kit.js';

export const MODELS = [
  { id: 'bike', name: 'Bike + rider' },
  { id: 'torii', name: 'Torii gate' },
  { id: 'tree', name: 'Tree' },
  { id: 'lantern', name: 'Stone lantern' },
];
// each model's resting yaw (rad), so the turntable settles on a three-quarter view of its front
const YAW = { bike: Math.PI + 0.75, torii: 0.48, tree: 0.3, lantern: 0.6 };
const SPIN = '<svg class="mx-spin" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke-width="2"/></svg>';

const SCAN = 0xd9ff5a; // the scan's glow (Meshy's lime)
const WIRE = 0xe9edf5;
const FOV = 26, ELEV = THREE.MathUtils.degToRad(16), FILL = 0.9; // camera: a slight downward look; the swept turntable volume fills 90% of the tile

// ---- the models: loaded once at import (top-level await, so window.__AD.ready waits for them). A model that fails
// to load is logged and its tile stays empty; it never takes the scene down.
const loader = new GLTFLoader();
const GLB = await Promise.all(MODELS.map(async (m) => {
  const url = new URL(`../../../models/${m.id}.glb`, import.meta.url).href;
  try {
    // fetched whole and parsed (rather than loader.loadAsync, whose progress stream Chrome sometimes reports as an
    // aborted request even though the load succeeds)
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const g = await loader.parseAsync(await res.arrayBuffer(), new URL('./', url).href);
    return g.scene || (g.scenes && g.scenes[0]) || null;
  } catch (err) {
    console.error(`[meshy] models/${m.id}.glb failed to load:`, err && err.message ? err.message : err);
    return null;
  }
}));

// a soft radial sprite (the scan plane's glow and the turntable's floor), drawn once
function radial(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

// one model, prepared for the reveal: centred on its turntable axis, scaled to unit height, with a dark shaded copy,
// a wireframe and a scan band hung off every mesh, and clipping planes shared by the model's materials
function prep(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  const s = 1 / Math.max(size.y, 1e-6, Math.max(size.x, size.z) * 0.6);
  // the turntable radius: the farthest vertex from the vertical axis through the box centre
  let r2 = 0, tris = 0;
  const v = new THREE.Vector3();
  const meshes = [];
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
    meshes.push(o);
    const p = o.geometry.attributes.position;
    tris += (o.geometry.index ? o.geometry.index.count : p.count) / 3;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      const dx = v.x - mid.x, dz = v.z - mid.z;
      if (dx * dx + dz * dz > r2) r2 = dx * dx + dz * dz;
    }
  });
  if (!meshes.length) return null;

  const inner = new THREE.Group();
  inner.add(root);
  inner.scale.setScalar(s);
  inner.position.set(-mid.x * s, -box.min.y * s, -mid.z * s);
  const turn = new THREE.Group();
  turn.add(inner);
  const pop = new THREE.Group();
  pop.add(turn);
  const H = size.y * s, R = Math.sqrt(r2) * s;

  // world-space horizontal planes (the turntable only turns about Y, so they stay horizontal): the textured part
  // keeps y >= h, the wire part keeps y <= h, the band keeps h - e <= y <= h + e
  const up = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), down = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const bandUp = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), bandDown = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  // the wire's density follows the triangle count, so a dense mesh reads as fine lines, not a white blob
  const wireOpacity = clamp(0.85 * Math.sqrt(9000 / Math.max(tris, 1)), 0.2, 0.8);
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, clippingPlanes: [down], transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const wire = new THREE.LineBasicMaterial({ color: WIRE, transparent: true, opacity: wireOpacity, clippingPlanes: [down], toneMapped: false, depthWrite: false });
  const band = new THREE.MeshBasicMaterial({ color: SCAN, side: THREE.DoubleSide, clippingPlanes: [bandUp, bandDown], toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const orig = new Set();
  meshes.forEach((o) => {
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m) { m.clippingPlanes = [up]; orig.add(m); } });
    if (o.isSkinnedMesh) return; // (none expected) a skinned mesh keeps its own look only
    const d = new THREE.Mesh(o.geometry, dark);
    const w = new THREE.LineSegments(new THREE.WireframeGeometry(o.geometry), wire);
    const b = new THREE.Mesh(o.geometry, band);
    w.renderOrder = 1; b.renderOrder = 2;
    o.add(d, w, b);
  });

  // the scan plane: a glowing disc at the cut, and a faint floor under the turntable
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: GLOW_TX, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.5 }));
  glow.rotation.x = -Math.PI / 2;
  glow.scale.setScalar(R * 2.9);
  glow.renderOrder = 3;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: FLOOR_TX, transparent: true, depthWrite: false, toneMapped: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.scale.setScalar(R * 3.2);
  floor.position.y = -0.002;
  floor.renderOrder = -1;
  pop.add(glow, floor);

  return { pop, turn, H, R, up, down, bandUp, bandDown, dark, wire, wireOpacity, band, glow, orig: [...orig], cams: new Map() };
}

// the camera for one model at one tile aspect: looking down ELEV, fitted so the turntable's swept cylinder fills FILL
// of the tile at every angle (fitted by projecting the cylinder's rims, so it holds for any model shape). Cached per
// aspect: it depends on nothing but the model and the aspect.
function camFor(M, aspect) {
  const key = aspect.toFixed(3);
  if (M.cams.has(key)) return M.cams.get(key);
  const cam = new THREE.PerspectiveCamera(FOV, aspect, 0.01, 100);
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * M.R, 0, Math.sin(a) * M.R), new THREE.Vector3(Math.cos(a) * M.R, M.H, Math.sin(a) * M.R));
  }
  let d = 3, ty = M.H / 2;
  const q = new THREE.Vector3();
  for (let it = 0; it < 8; it++) {
    cam.position.set(0, ty + Math.sin(ELEV) * d, Math.cos(ELEV) * d);
    cam.lookAt(0, ty, 0);
    cam.updateMatrixWorld(true);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach((p) => { q.copy(p).project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
    // re-centre vertically, then scale the distance so the larger extent is FILL
    const cy = (y0 + y1) / 2;
    ty += cy * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * d * 0.9;
    const ext = Math.max((x1 - x0) / 2, (y1 - y0) / 2);
    d *= ext / FILL;
  }
  cam.position.set(0, ty + Math.sin(ELEV) * d, Math.cos(ELEV) * d);
  cam.lookAt(0, ty, 0);
  cam.updateMatrixWorld(true);
  M.cams.set(key, cam);
  return cam;
}

let GLOW_TX = null, FLOOR_TX = null;

export default {
  times(r, next, c) {
    const p = c.pace || 1;
    const T = { say: r + 0.02, card: r + 0.06 * p };
    // each model pops in as wire and turns a moment (all four are wire as the card settles), then the scan runs
    // down it; every model is textured by ~r + 0.9 (tabs-local 2.34 at r = 1.44)
    T.pop = MODELS.map((_, i) => T.card + (0.06 + i * 0.04) * p);
    T.scan = T.pop.map((a) => [a + 0.3 * p, a + 0.64 * p]);
    T.tex0 = T.scan[0][0];
    T.done = T.scan[MODELS.length - 1][1] + 0.02;
    T.end = next;
    return T;
  },

  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.mesh, 95);
    const card = x.el(`<div class="mx-card">
  <div class="mx-hd"><span class="mx-title">Japanese bike ride</span><span class="mx-n">4 models</span><span class="mx-state">${SPIN}<span class="mx-ok">${x.OK}</span><b>Meshing</b></span></div>
  <div class="mx-grid">${MODELS.map((m) => `<div class="mx-cell"><div class="mx-view"></div><span class="mx-lab">${x.esc(m.name)}</span></div>`).join('')}<canvas class="mx-gl"></canvas></div>
</div>`);
    const canvas = card.querySelector('.mx-gl');
    const cells = [...card.querySelectorAll('.mx-cell')].map((n) => ({ n, view: n.querySelector('.mx-view'), lab: n.querySelector('.mx-lab') }));
    const state = card.querySelector('.mx-state b'), spin = card.querySelector('.mx-spin'), ok = card.querySelector('.mx-ok');
    const gl = setupGL(canvas);
    const hideAt = k.squeeze ? k.squeeze[1] : T.end + 0.3;

    function draw(t) {
      if (!gl || t < T.card || t > hideAt) return;
      const cb = canvas.getBoundingClientRect();
      if (cb.width < 2 || cb.height < 2) return;
      const dpr = window.devicePixelRatio || 1;
      const W = Math.max(1, Math.round(cb.width * dpr)), Hc = Math.max(1, Math.round(cb.height * dpr));
      const R = gl.renderer;
      if (canvas.width !== W || canvas.height !== Hc) R.setSize(W, Hc, false);
      const sx = W / cb.width, sy = Hc / cb.height;
      R.setScissorTest(false);
      R.setClearColor(0x000000, 0);
      R.clear(true, true, true);
      R.setScissorTest(true);
      cells.forEach((c, i) => {
        const M = gl.models[i];
        if (!M || t < T.pop[i]) return;
        const vb = c.view.getBoundingClientRect();
        const vx = Math.round((vb.left - cb.left) * sx), vy = Math.round((cb.bottom - vb.bottom) * sy);
        const vw = Math.round(vb.width * sx), vh = Math.round(vb.height * sy);
        if (vw < 2 || vh < 2) return;
        R.setViewport(vx, vy, vw, vh);
        R.setScissor(vx, vy, vw, vh);
        pose(M, t, T.pop[i], T.scan[i], YAW[MODELS[i].id] || 0);
        gl.models.forEach((m) => { if (m) m.pop.visible = m === M; });
        R.render(gl.scene, camFor(M, vw / vh));
      });
      R.setScissorTest(false);
    }

    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say);
        rise(card, seg(t, T.card, T.card + 0.2), 12);
        let tex = 0;
        cells.forEach((c, i) => {
          tex += scanAt(t, T.scan[i]);
          rise(c.lab, seg(t, T.scan[i][1] - 0.08, T.scan[i][1] + 0.14), 5, 1);
        });
        const d = t >= T.done;
        setText(state, d ? 'Done' : t >= T.tex0 ? `Texturing ${Math.round((tex / cells.length) * 100)}%` : 'Meshing');
        spin.style.display = d ? 'none' : 'block';
        spin.style.transform = `rotate(${((t * 540) % 360).toFixed(1)}deg)`;
        ok.style.display = d ? 'grid' : 'none';
        draw(t);
      },
    };
  },
};

// the scan's progress (0..1): the cut height and the header's percentage both follow it
const scanAt = (t, scan) => inOutCubic(seg(t, scan[0], scan[1]));

// the model's state at t, from t alone: pop (scale), turntable angle, scan height
function pose(M, t, pop, scan, yaw) {
  const a = seg(t, pop, pop + 0.34);
  const s = lerp(0.6, 1, outBack(a)); // overshoots ~4%, inside the fit's margin
  M.pop.scale.setScalar(Math.max(0.001, s));
  // swings in from a half turn back and keeps turning slowly for the rest of the beat
  M.turn.rotation.y = yaw + 0.8 * (t - pop - 1) - 2.2 * (1 - outCubic(seg(t, pop, pop + 0.7)));
  const fade = seg(t, pop, pop + 0.12);
  const f = scanAt(t, scan);
  // the cut runs top to bottom, a touch past both ends so the start and end are clean
  const m = 0.04;
  const h = lerp(M.H + m, -m, f) * s;
  const e = 0.012 * M.H * s;
  M.up.constant = -h; M.down.constant = h;
  M.bandUp.constant = -(h - e); M.bandDown.constant = h + e;
  const scanning = f > 0 && f < 1;
  M.orig.forEach((mat) => { mat.visible = f > 0; });
  M.dark.visible = M.wire.visible = f < 1;
  M.dark.opacity = fade;
  M.wire.opacity = M.wireOpacity * fade;
  M.band.visible = scanning;
  M.glow.visible = scanning;
  M.glow.position.y = h / s; // the glow lives in the pop group, which is scaled by s
  M.glow.material.opacity = 0.55 * Math.sin(Math.PI * f);
}

function setupGL(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
  } catch (err) {
    console.error('[meshy] WebGL unavailable:', err && err.message ? err.message : err);
    return null;
  }
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  renderer.autoClear = false;

  GLOW_TX = GLOW_TX || radial([[0, 'rgba(217,255,90,0.9)'], [0.35, 'rgba(217,255,90,0.35)'], [1, 'rgba(217,255,90,0)']]);
  FLOOR_TX = FLOOR_TX || radial([[0, 'rgba(255,255,255,0.10)'], [0.6, 'rgba(255,255,255,0.04)'], [1, 'rgba(255,255,255,0)']]);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();
  // soft studio light: sky/ground fill, a warm key from the front left, a cool rim from behind
  scene.add(new THREE.HemisphereLight(0xf2f4ff, 0x2a2622, 1.1));
  const key = new THREE.DirectionalLight(0xfff3e4, 2.4);
  key.position.set(-2, 3, 2.5);
  const rim = new THREE.DirectionalLight(0xcfe0ff, 1.8);
  rim.position.set(1.5, 2, -3);
  scene.add(key, rim);

  const models = GLB.map((root, i) => {
    if (!root) return null;
    try {
      const M = prep(root);
      if (M) scene.add(M.pop);
      else console.error(`[meshy] models/${MODELS[i].id}.glb has no meshes`);
      return M;
    } catch (err) {
      console.error(`[meshy] models/${MODELS[i].id}.glb could not be prepared:`, err && err.message ? err.message : err);
      return null;
    }
  });
  return { renderer, scene, models };
}
