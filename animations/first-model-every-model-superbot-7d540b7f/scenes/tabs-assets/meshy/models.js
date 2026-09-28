// meshy/models.js: the six procedural toon models the Meshy beat "generates" (rider girl, city bike, wooden house,
// utility pole, round tree, wooden fence). Geometry helpers (paint / merge / xf / tube / gradMap / rim toon) are
// copied from the ride scene's first three.js build (ride-3d-v1) and restyled toward the post's painted sunset toon
// look. Every builder takes a material factory M(color, opts) so the beat can give each tile its own clip planes.
// Nothing here reads a clock: all randomness is seeded and resolved at build time.
import * as THREE from '../vendor/three.module.min.js';

export { THREE };

export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const C = (hex) => new THREE.Color(hex);

// ---------- geometry helpers ----------
export function paint(geo, color, fn) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position, n = p.count, col = new Float32Array(n * 3), c = new THREE.Color(), base = C(color);
  for (let i = 0; i < n; i++) {
    c.copy(base);
    if (fn) fn(c, p.getX(i), p.getY(i), p.getZ(i), i);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
export function merge(geos) {
  let n = 0;
  const gs = geos.map((g) => { const h = g.index ? g.toNonIndexed() : g; if (!h.attributes.normal) h.computeVertexNormals(); n += h.attributes.position.count; return h; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const g of gs) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3);
    o += c;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  m.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return m;
}
export const xf = (geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s));
  geo.applyMatrix4(m); return geo;
};
export function tube(pts, r, seg = 12, rad = 8) {
  const curve = pts.length === 2 ? new THREE.LineCurve3(new THREE.Vector3(...pts[0]), new THREE.Vector3(...pts[1])) : new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, pts.length === 2 ? 1 : seg, r, rad, false);
}
export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// a limb: a cylinder from a to b
function limb(a, b, r0, r1, seg = 10) {
  const g = new THREE.CylinderGeometry(r1, r0, 1, seg);
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), len = d.length();
  g.scale(1, len, 1);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  g.applyQuaternion(q);
  const mid = va.add(vb).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

// ---------- toon material (painted look: 5-step ramp + warm sunset rim) ----------
let GRAD = null;
export function gradMap() {
  if (GRAD) return GRAD;
  const d = new Uint8Array([150, 188, 224, 244, 255]);
  GRAD = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
  GRAD.minFilter = GRAD.magFilter = THREE.LinearFilter; GRAD.generateMipmaps = false; GRAD.needsUpdate = true;
  return GRAD;
}
const RIM = { value: new THREE.Color('#ffb27a').multiplyScalar(0.34) };
export function toon(color, opts = {}) {
  const { rim = true, ...o } = opts;
  const m = new THREE.MeshToonMaterial({ color: C(color), gradientMap: gradMap(), ...o });
  if (rim) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = RIM;
      sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
        'outgoingLight += uRim * pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.2);\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'rim';
  }
  return m;
}

// ---------- 1. the rider girl (standing, toon proportions: big head, white blouse, navy skirt, ponytail) ----------
function girl(M) {
  const g = new THREE.Group();
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); g.add(m); return m; };
  const skin = M('#f3c7ac'), blouse = M('#f8f5ef'), navy = M('#2b3668', { side: THREE.DoubleSide }), hair = M('#3a2826', { side: THREE.DoubleSide }),
    sock = M('#f4f2ee'), shoe = M('#6a4232'), red = M('#d8424f'), eye = M('#2a1c1e', { rim: false });
  for (const sx of [-1, 1]) {
    add(xf(new THREE.SphereGeometry(0.052, 12, 8), { p: [sx * 0.068, 0.035, 0.02], s: [0.8, 0.62, 1.55] }), shoe);
    add(limb([sx * 0.066, 0.04, 0], [sx * 0.068, 0.2, 0], 0.036, 0.037), sock);
    add(limb([sx * 0.068, 0.19, 0], [sx * 0.074, 0.6, 0], 0.037, 0.047), skin);
  }
  // skirt: a flared open cone with soft pleats, closed by a waistband
  const sk = new THREE.CylinderGeometry(0.142, 0.285, 0.44, 40, 4, true);
  { const p = sk.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x); const f = clamp((0.22 - y) / 0.44); const k = 1 + 0.045 * f * Math.sin(a * 12); p.setXYZ(i, x * k, y, z * k * 0.92); } sk.computeVertexNormals(); }
  add(xf(sk, { p: [0, 0.72, 0] }), navy);
  add(xf(new THREE.CylinderGeometry(0.138, 0.142, 0.06, 24), { p: [0, 0.94, 0], s: [1, 1, 0.92] }), navy);
  // blouse torso: a lathe from waist to shoulders
  const pr = [[0, 0], [0.128, 0], [0.122, 0.07], [0.13, 0.16], [0.148, 0.25], [0.15, 0.3], [0.115, 0.345], [0.05, 0.37], [0, 0.37]].map(([r, y]) => new THREE.Vector2(r, y));
  add(xf(new THREE.LatheGeometry(pr, 22), { p: [0, 0.93, 0], s: [1.1, 1, 0.78] }), blouse);
  // collar bow + neck
  add(xf(new THREE.SphereGeometry(0.026, 8, 6), { p: [-0.026, 1.24, 0.1], s: [1.2, 0.8, 0.6] }), red);
  add(xf(new THREE.SphereGeometry(0.026, 8, 6), { p: [0.026, 1.24, 0.1], s: [1.2, 0.8, 0.6] }), red);
  add(limb([0, 1.27, 0], [0, 1.36, 0.005], 0.04, 0.036), skin);
  // arms: puffed short sleeves, bare forearms, hands
  for (const sx of [-1, 1]) {
    add(xf(new THREE.SphereGeometry(0.066, 14, 10), { p: [sx * 0.168, 1.2, 0], s: [1, 1.08, 1] }), blouse);
    add(limb([sx * 0.18, 1.18, 0], [sx * 0.215, 0.98, 0.02], 0.033, 0.036), skin);
    add(limb([sx * 0.215, 0.98, 0.02], [sx * 0.225, 0.8, 0.05], 0.03, 0.032), skin);
    add(xf(new THREE.SphereGeometry(0.034, 10, 8), { p: [sx * 0.227, 0.77, 0.055] }), skin);
  }
  // head: a big toon head, bangs cap tilted back, back hair, eyes, ponytail with a red tie
  const hy = 1.5;
  add(xf(new THREE.SphereGeometry(0.15, 26, 20), { p: [0, hy, 0], s: [0.96, 1.04, 1] }), skin);
  add(xf(new THREE.SphereGeometry(0.162, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), { p: [0, hy + 0.012, -0.004], r: [-0.42, 0, 0] }), hair);
  add(xf(new THREE.SphereGeometry(0.158, 22, 16, Math.PI, Math.PI, 0.2, 2.05), { p: [0, hy - 0.004, -0.01], s: [1.02, 1.04, 1] }), hair);
  for (const sx of [-1, 1]) {
    add(xf(new THREE.SphereGeometry(0.022, 10, 8), { p: [sx * 0.052, hy - 0.012, 0.137], s: [0.75, 1.15, 0.45] }), eye);
    add(xf(new THREE.SphereGeometry(0.02, 8, 6), { p: [sx * 0.085, hy - 0.055, 0.118], s: [1.3, 0.6, 0.4] }), M('#f19d95', { rim: false }));
  }
  add(xf(new THREE.SphereGeometry(0.024, 8, 6), { p: [0, hy + 0.05, -0.158] }), red);
  const tail = [[0, hy + 0.03, -0.18, 0.05], [0, hy - 0.05, -0.2, 0.045], [0, hy - 0.13, -0.205, 0.04], [0, hy - 0.2, -0.2, 0.033], [0, hy - 0.26, -0.19, 0.024]];
  for (const [x, y, z, r] of tail) add(xf(new THREE.SphereGeometry(r, 12, 10), { p: [x, y, z], s: [1, 1.35, 0.9] }), hair);
  return g;
}

// ---------- 2. the red mamachari with a front basket (from ride-3d-v1 buildRider, static) ----------
function bike(M) {
  const g = new THREE.Group();
  const WR = 0.335;
  const red = M('#c9303b'), chrome = M('#dcdde6'), tyre = M('#2f2c33'), dark = M('#3b3238');
  const add = (geo, mat, parent = g) => { const m = new THREE.Mesh(geo, mat); parent.add(m); return m; };
  const R = [0, WR, 0.52], F = [0, WR, -0.6], BB = [0, 0.28, 0.07];
  add(tube([[0, 0.72, -0.47], [0, 0.5, -0.3], [0, 0.34, -0.1], BB], 0.03), red);
  add(tube([[0, 0.8, -0.44], [0, 0.6, -0.26], [0, 0.44, -0.02], [0, 0.4, 0.1]], 0.024), red);
  add(tube([BB, [0, 0.88, 0.27]], 0.026), red);
  for (const sx of [-0.05, 0.05]) {
    add(tube([[sx * 0.6, BB[1], BB[2]], [sx, R[1], R[2]]], 0.017), red);
    add(tube([[0, 0.8, 0.25], [sx, R[1], R[2]]], 0.016), red);
    add(tube([[0, 0.72, -0.47], [sx, 0.5, -0.53], [sx, F[1], F[2]]], 0.018), red);
  }
  add(tube([[0, 0.7, -0.47], [0, 0.93, -0.41]], 0.034), red);
  add(tube([[0, 0.93, -0.41], [0, 1.02, -0.4]], 0.02), chrome);
  add(tube([[-0.29, 1.04, -0.16], [-0.2, 1.03, -0.3], [-0.06, 1.02, -0.4], [0.06, 1.02, -0.4], [0.2, 1.03, -0.3], [0.29, 1.04, -0.16]], 0.015, 20), chrome);
  for (const sx of [-1, 1]) add(xf(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), { p: [sx * 0.3, 1.045, -0.12], r: [Math.PI / 2 - 0.2, 0, 0] }), dark);
  add(tube([[0, 0.86, 0.27], [0, 0.95, 0.3]], 0.015), chrome);
  add(xf(new THREE.SphereGeometry(0.1, 14, 10), { p: [0, 0.97, 0.31], s: [0.95, 0.38, 1.35] }), M('#4a3530'));
  add(xf(new THREE.BoxGeometry(0.14, 0.018, 0.3), { p: [0, 0.79, 0.5] }), M('#56505a'));
  add(tube([[0, 0.8, 0.36], [0.07, R[1], R[2]]], 0.009), chrome);
  add(tube([[0, 0.8, 0.36], [-0.07, R[1], R[2]]], 0.009), chrome);
  const fender = (c, a0) => add(xf(new THREE.TorusGeometry(0.365, 0.024, 5, 22, Math.PI * 0.95), { p: c, r: [0, Math.PI / 2, a0] }), chrome);
  fender(R, 0.15); fender(F, -0.1);
  add(xf(new THREE.BoxGeometry(0.014, 0.13, 0.5), { p: [0.075, 0.33, 0.3], r: [0.1, 0, 0] }), red);
  for (const c of [R, F]) {
    add(xf(new THREE.TorusGeometry(WR - 0.018, 0.03, 8, 36), { p: c, r: [0, Math.PI / 2, 0] }), tyre);
    add(xf(new THREE.TorusGeometry(WR - 0.05, 0.012, 5, 36), { p: c, r: [0, Math.PI / 2, 0] }), chrome);
    const sp = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; sp.push(tube([[0, 0, 0], [0, Math.sin(a) * 0.28, Math.cos(a) * 0.28]], 0.005, 1, 3)); }
    add(xf(merge(sp), { p: c }), chrome);
    add(xf(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 10), { p: c, r: [0, 0, Math.PI / 2] }), chrome);
  }
  // chainring, cranks, pedals
  add(xf(new THREE.CylinderGeometry(0.1, 0.1, 0.014, 20), { p: [0.06, BB[1], BB[2]], r: [0, 0, Math.PI / 2] }), chrome);
  add(xf(new THREE.BoxGeometry(0.02, 0.17, 0.032), { p: [0.085, BB[1] + 0.08, BB[2] - 0.03], r: [0.35, 0, 0] }), chrome);
  add(xf(new THREE.BoxGeometry(0.02, 0.17, 0.032), { p: [-0.085, BB[1] - 0.08, BB[2] + 0.03], r: [0.35, 0, 0] }), chrome);
  add(xf(new THREE.BoxGeometry(0.1, 0.024, 0.06), { p: [0.14, BB[1] + 0.16, BB[2] - 0.06] }), dark);
  add(xf(new THREE.BoxGeometry(0.1, 0.024, 0.06), { p: [-0.14, BB[1] - 0.16, BB[2] + 0.06] }), dark);
  // the front basket: a wire-lattice box (canvas alpha texture) with flowers, and the headlamp
  const bt = canvasTex(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#ecebf0'; c.lineWidth = 7; for (let i = 0; i <= 7; i++) { c.beginPath(); c.moveTo(i * w / 7, 0); c.lineTo(i * w / 7, h); c.stroke(); c.beginPath(); c.moveTo(0, i * h / 7); c.lineTo(w, i * h / 7); c.stroke(); } });
  add(xf(new THREE.BoxGeometry(0.36, 0.25, 0.28), { p: [0, 0.98, -0.66] }), M('#ffffff', { map: bt, alphaTest: 0.5, side: THREE.DoubleSide }));
  {
    const r2 = rng(17), fl = [];
    for (let i = 0; i < 7; i++) {
      const x = (r2() - 0.5) * 0.22, z = -0.66 + (r2() - 0.5) * 0.16, hh = 1.12 + r2() * 0.16;
      fl.push(paint(tube([[x, 0.95, z], [x * 1.2, hh, z - 0.02]], 0.007, 1, 3), '#5f8c3a'));
      fl.push(paint(xf(new THREE.CylinderGeometry(0.05, 0.05, 0.014, 12), { p: [x * 1.2, hh, z - 0.02], r: [0.3 + r2() * 0.5, 0, (r2() - 0.5) * 0.6] }), i % 3 === 0 ? '#ffffff' : '#ffc93c', (c, px, py, pz) => { if (Math.hypot(px - x * 1.2, pz - z + 0.02) < 0.019) c.set('#6b3b1c'); }));
    }
    fl.push(paint(xf(new THREE.BoxGeometry(0.3, 0.1, 0.22), { p: [0, 0.93, -0.66] }), '#e8d6b8'));
    add(merge(fl), M('#ffffff', { vertexColors: true }));
  }
  add(xf(new THREE.CylinderGeometry(0.04, 0.034, 0.08, 12), { p: [0, 0.8, -0.56], r: [Math.PI / 2, 0, 0] }), chrome);
  return g;
}

// ---------- 3. a two-storey wooden Japanese house: dark timber, lattice windows, tiled hip roofs ----------
function house(M) {
  const gs = [];
  const P = (geo, col, fn) => { gs.push(paint(geo, col, fn)); };
  const timber = '#5a3a2a', post = '#3a251b', plaster = '#eadcc4', shoji = '#ffdca0', roof = '#454a5a', stone = '#9d968c';
  const tiles = (c, x, y, z) => { if (Math.floor((x + z * 0.001) * 11 + 100) % 2) c.multiplyScalar(0.84); };
  P(xf(new THREE.BoxGeometry(3.3, 0.16, 2.3), { p: [0, 0.08, 0] }), stone);
  // ground floor: timber walls, plaster band, a glowing shoji front with lattice, posts
  P(xf(new THREE.BoxGeometry(3.1, 1.25, 2.1), { p: [0, 0.78, 0] }), timber, (c, x, y) => { if (y > 1.18) c.set(plaster); });
  P(xf(new THREE.BoxGeometry(2.0, 0.78, 0.05), { p: [-0.35, 0.62, 1.06] }), shoji);
  P(xf(new THREE.BoxGeometry(0.62, 0.9, 0.05), { p: [1.05, 0.62, 1.06] }), '#3b2a22');
  for (let i = 0; i <= 8; i++) P(xf(new THREE.BoxGeometry(0.03, 0.78, 0.07), { p: [-1.35 + i * 0.25, 0.62, 1.07] }), post);
  for (const y of [0.35, 0.62, 0.9]) P(xf(new THREE.BoxGeometry(2.0, 0.03, 0.07), { p: [-0.35, y, 1.07] }), post);
  for (const [x, z] of [[-1.55, 1.05], [1.55, 1.05], [-1.55, -1.05], [1.55, -1.05], [0.72, 1.05]]) P(xf(new THREE.BoxGeometry(0.12, 1.3, 0.12), { p: [x, 0.8, z] }), post);
  // side windows (shoji squares)
  for (const sx of [-1, 1]) P(xf(new THREE.BoxGeometry(0.05, 0.42, 0.8), { p: [sx * 1.56, 0.8, -0.2] }), shoji);
  // lower eave: a hipped frustum skirt all round, then the upper storey and its own hip roof with a ridge
  P(xf(new THREE.CylinderGeometry(1.34, 2.2, 0.42, 4, 1, true), { p: [0, 1.58, 0], r: [0, Math.PI / 4, 0], s: [1.34, 1, 1] }), roof, tiles);
  P(xf(new THREE.BoxGeometry(2.4, 0.95, 1.55), { p: [0, 2.1, -0.1] }), timber, (c, x, y) => { if (y > 1.95 && y < 2.4) c.set(plaster); });
  P(xf(new THREE.BoxGeometry(1.3, 0.36, 0.05), { p: [-0.25, 2.18, 0.68] }), shoji);
  for (let i = 0; i <= 10; i++) P(xf(new THREE.BoxGeometry(0.025, 0.36, 0.06), { p: [-0.9 + i * 0.13, 2.18, 0.69] }), post);
  for (const [x, z] of [[-1.2, 0.68], [1.2, 0.68], [-1.2, -0.88], [1.2, -0.88]]) P(xf(new THREE.BoxGeometry(0.1, 0.95, 0.1), { p: [x, 2.1, z] }), post);
  P(xf(new THREE.CylinderGeometry(0.42, 1.95, 0.78, 4, 1), { p: [0, 2.94, -0.1], r: [0, Math.PI / 4, 0], s: [1.5, 1, 1] }), roof, tiles);
  P(xf(new THREE.BoxGeometry(1.0, 0.1, 0.14), { p: [0, 3.35, -0.1] }), '#2f323d');
  for (const sx of [-1, 1]) P(xf(new THREE.BoxGeometry(0.1, 0.18, 0.16), { p: [sx * 0.5, 3.4, -0.1] }), '#2f323d');
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge(gs), M('#ffffff', { vertexColors: true })));
  // a red paper lantern by the door
  const lan = new THREE.Mesh(xf(new THREE.SphereGeometry(0.13, 14, 10), { p: [1.05, 1.08, 1.22], s: [1, 1.25, 1] }), M('#e0473f'));
  g.add(lan);
  return g;
}

// ---------- 4. a utility pole: crossarms, insulators, a transformer can, sagging wire stubs, striped guard ----------
function pole(M) {
  const gs = [];
  const P = (geo, col, fn) => { gs.push(paint(geo, col, fn)); };
  P(xf(new THREE.CylinderGeometry(0.075, 0.1, 4.6, 12), { p: [0, 2.3, 0] }), '#8a7f74', (c, x, y) => c.lerp(C('#b3a597'), clamp((y - 3) / 1.6) * 0.5));
  P(xf(new THREE.CylinderGeometry(0.108, 0.108, 1.0, 12), { p: [0, 0.5, 0] }), '#f0c63a', (c, x, y) => { if (Math.floor(y / 0.2) % 2 === 0) c.set('#222027'); });
  for (let i = 0; i < 6; i++) P(xf(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 5), { p: [0, 1.5 + i * 0.4, 0], r: [0, (i % 2) * Math.PI / 2, Math.PI / 2] }), '#55504c');
  // crossarms and insulators
  for (const [y, w] of [[4.35, 1.3], [3.85, 1.0]]) {
    P(xf(new THREE.BoxGeometry(w, 0.08, 0.09), { p: [0, y, 0.06] }), '#6e6760');
    for (const dx of w > 1.1 ? [-0.55, -0.2, 0.2, 0.55] : [-0.42, 0.42]) {
      P(xf(new THREE.CylinderGeometry(0.035, 0.05, 0.14, 8), { p: [dx, y + 0.11, 0.06] }), '#e4e2dc');
      P(xf(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 10), { p: [dx, y + 0.1, 0.06] }), '#cfcac2');
    }
  }
  // the transformer can on a bracket, with its bushings
  P(xf(new THREE.BoxGeometry(0.28, 0.05, 0.05), { p: [0, 3.35, 0.18], r: [0, Math.PI / 2, 0] }), '#6e6760');
  P(xf(new THREE.CylinderGeometry(0.17, 0.17, 0.46, 16), { p: [0, 3.2, 0.3] }), '#96a09a', (c, x, y) => { if (y > 3.38) c.multiplyScalar(0.8); });
  P(xf(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16), { p: [0, 3.44, 0.3] }), '#7d8680');
  for (const dx of [-0.07, 0.07]) P(xf(new THREE.CylinderGeometry(0.018, 0.024, 0.1, 6), { p: [dx, 3.5, 0.3] }), '#e4e2dc');
  // wire stubs: short sagging spans leaving the pole both ways (along x), and a drop to the can
  const wires = [];
  for (const dx of [-0.55, -0.2, 0.2, 0.55]) for (const side of [-1, 1]) {
    const pts = []; for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push([dx + side * f * 0.62, 4.47 - 0.22 * f * f, 0.06 + side * f * 0.05]); }
    wires.push(paint(tube(pts, 0.011, 10, 4), '#2c2830'));
  }
  wires.push(paint(tube([[0.2, 4.47, 0.06], [0.12, 4.0, 0.2], [0.07, 3.55, 0.3]], 0.01, 10, 4), '#2c2830'));
  gs.push(...wires);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge(gs), M('#ffffff', { vertexColors: true })));
  return g;
}

// ---------- 5. a round-canopy tree (ride-3d-v1 blob canopy with fluffy normals, darker painted greens) ----------
function tree(M) {
  const r2 = rng(401);
  const top = [0.15, 2.3, -0.05];
  const tr = [paint(tube([[0, -0.1, 0], [top[0] * 0.3, top[1] * 0.45, top[2] * 0.3], top], 0.2, 8, 8), '#5b4638', (c, x, y) => c.lerp(C('#7a604c'), clamp(y / 2.5) * 0.5))];
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + r2(); const b = [Math.cos(a) * 1.0, 3.1 + r2() * 0.3, Math.sin(a) * 1.0]; tr.push(paint(tube([[top[0] * 0.5, top[1] * 0.62, top[2] * 0.5], [(top[0] + b[0]) / 2, (top[1] + b[1]) / 2 + 0.15, (top[2] + b[2]) / 2], b], 0.085, 6, 6), '#5b4638')); }
  // root flare
  tr.push(paint(xf(new THREE.ConeGeometry(0.34, 0.35, 10, 1, true), { p: [0, 0.14, 0] }), '#5b4638'));
  const center = [0.1, 3.55, 0], spread = [1.5, 0.85, 1.5];
  const cg = [];
  for (let i = 0; i < 24; i++) {
    const a = r2() * Math.PI * 2, rr = Math.sqrt(r2());
    const bx = Math.cos(a) * rr * spread[0], bz = Math.sin(a) * rr * spread[2], by = (r2() - 0.35) * spread[1];
    const br = 0.46 + r2() * 0.36;
    const b = xf(new THREE.IcosahedronGeometry(br, 1), { p: [center[0] + bx, center[1] + by, center[2] + bz] });
    const tint = r2();
    cg.push(paint(b, '#1f4426', (c, x, y) => { const f = clamp((y - (center[1] - spread[1] * 0.9)) / (spread[1] * 1.9 + 1.1)); c.lerp(C('#6f9e46'), f); c.lerp(C('#3d6e35'), tint * 0.4); }));
  }
  const crown = merge(cg);
  const p = crown.attributes.position, nm = crown.attributes.normal, v = new THREE.Vector3(), w = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i) - center[0], (p.getY(i) - center[1]) * 1.3, p.getZ(i) - center[2]).normalize();
    w.set(nm.getX(i), nm.getY(i), nm.getZ(i)).lerp(v, 0.35).normalize();
    nm.setXYZ(i, w.x, w.y, w.z);
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge(tr), M('#ffffff', { vertexColors: true })));
  g.add(new THREE.Mesh(crown, M('#ffffff', { vertexColors: true })));
  return g;
}

// ---------- 6. a weathered wooden fence section with grass tufts and wildflowers at its feet ----------
function fence(M) {
  const R = rng(55);
  const gs = [];
  const wood = (c) => c.lerp(C('#a2826a'), R() * 0.25);
  for (let i = 0; i < 4; i++) {
    const x = -1.35 + i * 0.9;
    gs.push(paint(xf(new THREE.BoxGeometry(0.12, 1.05, 0.12), { p: [x, 0.52, 0], r: [0, 0, (R() - 0.5) * 0.06] }), '#7c5c46', wood));
    gs.push(paint(xf(new THREE.BoxGeometry(0.15, 0.04, 0.15), { p: [x, 1.06, 0] }), '#6b4d3a'));
  }
  gs.push(paint(xf(new THREE.BoxGeometry(2.95, 0.1, 0.07), { p: [0, 0.86, 0.08], r: [0, 0, 0.012] }), '#8a6a52', wood));
  gs.push(paint(xf(new THREE.BoxGeometry(2.95, 0.09, 0.07), { p: [0, 0.46, 0.08], r: [0, 0, -0.01] }), '#8a6a52', wood));
  // grass tufts along the base
  for (let k = 0; k < 16; k++) {
    const cx = -1.5 + R() * 3.0, cz = (R() - 0.5) * 0.5;
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * Math.PI * 2 + R(), hgt = 0.22 + R() * 0.3, lean = 0.05 + R() * 0.1;
      const b = new THREE.BufferGeometry();
      b.setAttribute('position', new THREE.Float32BufferAttribute([-0.025, 0, 0, 0.025, 0, 0, lean * 0.6, hgt, lean], 3));
      xf(b, { r: [0, a, 0], p: [cx, 0, cz] });
      b.computeVertexNormals();
      gs.push(paint(b, '#4f8a36', (c, x, y) => c.lerp(C('#d2dc84'), clamp(y / 0.5))));
    }
  }
  const pal = ['#f6f1f4', '#b99be0', '#ffd66b', '#f59cc0'];
  for (let i = 0; i < 12; i++) gs.push(paint(xf(new THREE.IcosahedronGeometry(0.04, 0), { p: [-1.5 + R() * 3, 0.2 + R() * 0.2, (R() - 0.5) * 0.5] }), pal[i % 4]));
  const geo = merge(gs);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, M('#ffffff', { vertexColors: true, side: THREE.DoubleSide })));
  return g;
}

// name, builder, framing tweak (scale on the fitted size), start angle (rad; picked so the landed grid near
// lt 2.95 shows the girl's face, the bike's side, the house front at 3/4)
export const MODELS = [
  { name: 'rider_girl.glb', build: girl, fit: 1.12, a0: -0.62 },
  { name: 'city_bike.glb', build: bike, fit: 1.12, a0: 1.1 },
  { name: 'wood_house.glb', build: house, fit: 0.98, a0: -0.2 },
  { name: 'utility_pole.glb', build: pole, fit: 1.05, a0: 0.3 },
  { name: 'round_tree.glb', build: tree, fit: 1.08, a0: 2.0 },
  { name: 'wood_fence.glb', build: fence, fit: 1.15, a0: -0.3 },
];
