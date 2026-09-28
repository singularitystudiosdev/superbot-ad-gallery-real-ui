// ride: the OUTPUT of the ask, "Make a Japanese relaxing biking demo", as a real three.js scene.
// A girl on a red mamachari rides a dirt road at golden hour: flooded rice paddies reflecting the dusk sky,
// cherry trees shedding petals, utility poles and wires, a vermilion torii she rides through, glowing stone
// lanterns, a Fuji-like mountain in the haze. Everything is generated in code (no downloaded models).
// Hand-off from the chat scene: at lt=0 the full-bleed canvas is clipped to the chat's preview card rect
// (full width, 538px band centred on y=540, radius 27px) and the clip opens to the full frame over lt 0..0.55.
// render(lt) is a PURE function of lt: every transform is set from lt, then renderer.render runs once.
import * as THREE from './ride-assets/three.module.min.js';

const H = 1080;
const CARD_INSET = (H - 538) / 2; // the chat scene's preview card: y 271..809, full width
const SPEED = 5.3;            // m/s (19 km/h)
const CADENCE = 1.02;         // crank rev/s
const WHEEL_R = 0.335;
const TORII_Z = -22;          // she passes under it at lt ~ 4.15, framed by the low camera beat (lt 2.4..6)
const RIDER_X = 0.32;
const SUN_DIR = new THREE.Vector3(-0.2, 0.095, -0.975).normalize(); // toward the sun: ahead, a little left, low

// ---------- pure helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, f) => a + (b - a) * f;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (x) => x * x * (3 - 2 * x);
function bezier(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t;
  const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-6) break; if (Math.abs(d) < 1e-6) break; t -= e / d; }
    if (!(t >= 0 && t <= 1) || Math.abs(X(t) - x) > 1e-4) { let lo = 0, hi = 1; t = x; for (let i = 0; i < 30; i++) { if (X(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; } }
    return Y(t);
  };
}
const emphasized = bezier(0.05, 0.7, 0.1, 1);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const C = (hex) => new THREE.Color(hex);

// ---------- geometry helpers ----------
function paint(geo, color, fn) {
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
function merge(geos) {
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
const xf = (geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s));
  geo.applyMatrix4(m); return geo;
};
function tube(pts, r, seg = 12, rad = 8) {
  const curve = pts.length === 2 ? new THREE.LineCurve3(new THREE.Vector3(...pts[0]), new THREE.Vector3(...pts[1])) : new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, pts.length === 2 ? 1 : seg, r, rad, false);
}
function canvasTex(w, h, draw, { repeat, srgb = true, aniso = 8 } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = aniso;
  return t;
}

// ---------- materials ----------
let GRAD = null;
function gradMap() {
  if (GRAD) return GRAD;
  const d = new Uint8Array([96, 150, 205, 238, 255]);
  GRAD = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
  GRAD.minFilter = GRAD.magFilter = THREE.LinearFilter; GRAD.generateMipmaps = false; GRAD.needsUpdate = true;
  return GRAD;
}
const RIM = { value: new THREE.Color('#ffb27a').multiplyScalar(0.55) };
function toon(color, opts = {}) {
  const { rim, ...o } = opts;
  const m = new THREE.MeshToonMaterial({ color: C(color), gradientMap: gradMap(), ...o });
  if (rim) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRim = RIM;
      sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
        'outgoingLight += uRim * pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 2.6);\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'rim';
  }
  return m;
}

// ---------- sky ----------
const SKY = {
  zenith: C('#6a7cd0'), upper: C('#b095d6'), lower: C('#f5a7b4'), horizon: C('#ffc78e'), sun: C('#fff1cf'), glow: C('#ffae6a'),
};
function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uZen: { value: SKY.zenith }, uUp: { value: SKY.upper }, uLow: { value: SKY.lower }, uHor: { value: SKY.horizon },
      uSun: { value: SKY.sun }, uGlow: { value: SKY.glow }, uSunDir: { value: SUN_DIR },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      uniform vec3 uZen, uUp, uLow, uHor, uSun, uGlow, uSunDir; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        float s = max(dot(d, uSunDir), 0.0);
        vec3 c = mix(uHor, uLow, smoothstep(-0.02, 0.10, h));
        c = mix(c, uUp, smoothstep(0.08, 0.34, h));
        c = mix(c, uZen, smoothstep(0.30, 0.85, h));
        c = mix(c, uHor * 0.92, smoothstep(0.0, -0.08, h));
        c += uGlow * (pow(s, 6.0) * 0.55 + pow(s, 40.0) * 0.6) * (1.0 - smoothstep(0.0, 0.5, h) * 0.5);
        c += uSun * (smoothstep(0.99955, 0.99975, s) * 3.2 + pow(s, 400.0) * 1.2);
        c += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 1.5;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// ---------- the build ----------
let S = null; // scene state

function buildWorld(scene, skyScene) {
  const R = rng(20260928);
  const fogCol = C('#e8b7b4');
  scene.fog = new THREE.Fog(fogCol, 38, 430);

  // sky dome (both in the scene and the env-map scene)
  const skyGeo = new THREE.SphereGeometry(1500, 48, 24);
  const sky = new THREE.Mesh(skyGeo, skyMaterial());
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);
  skyScene.add(new THREE.Mesh(skyGeo, sky.material));

  // clouds: painted cumulus planes, pink-lit from the low sun on the left
  const cloudTex = [0, 1, 2].map((k) => canvasTex(512, 256, (g, w, h) => {
    const r2 = rng(99 + k * 13);
    const puffs = [];
    const n = 70;
    const lump = [r2(), r2(), r2()];
    for (let i = 0; i < n; i++) {
      const u = r2();
      const x = w * (0.1 + 0.8 * u);
      const top = Math.pow(Math.sin(u * Math.PI), 1.2) * (0.7 + 0.3 * Math.sin(u * 9 + lump[0] * 6));
      const rad = (10 + r2() * 26) * (0.5 + top * 0.9);
      const y = h * 0.8 - r2() * top * h * 0.55 - rad * 0.25;
      puffs.push([x, y, rad]);
    }
    g.filter = 'blur(1.6px)';
    g.fillStyle = '#fff';
    for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.filter = 'none';
    g.globalCompositeOperation = 'destination-out';
    const cut = g.createLinearGradient(0, h * 0.74, 0, h * 0.86);
    cut.addColorStop(0, 'rgba(0,0,0,0)'); cut.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = cut; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-atop';
    const vg = g.createLinearGradient(0, h * 0.15, 0, h * 0.84);
    vg.addColorStop(0, '#fff4ec'); vg.addColorStop(0.45, '#fad3d3'); vg.addColorStop(0.8, '#cdb1d6'); vg.addColorStop(1, '#b7a2d2');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    const sg = g.createLinearGradient(0, 0, w, 0);
    sg.addColorStop(0, 'rgba(255,196,150,0.35)'); sg.addColorStop(0.5, 'rgba(255,196,150,0)'); sg.addColorStop(1, 'rgba(150,130,200,0.18)');
    g.fillStyle = sg; g.fillRect(0, 0, w, h);
    for (const [x, y, r] of puffs) {
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.5, 0, x - r * 0.3, y - r * 0.5, r * 0.9);
      gr.addColorStop(0, 'rgba(255,250,244,0.55)'); gr.addColorStop(1, 'rgba(255,250,244,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'destination-in';
    const eg = g.createLinearGradient(0, 0, w, 0);
    eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(0.1, 'rgba(0,0,0,1)'); eg.addColorStop(0.9, 'rgba(0,0,0,1)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = eg; g.fillRect(0, 0, w, h);
  }, { aniso: 1 }));
  const clouds = [
    [-520, 250, -1150, 520, 0], [380, 330, -1250, 620, 1], [-60, 420, -1300, 420, 2], [760, 200, -900, 380, 0], [-900, 180, -900, 460, 1], [120, 160, -1200, 300, 2],
  ];
  for (const [x, y, z, w, k] of clouds) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), new THREE.MeshBasicMaterial({ map: cloudTex[k], transparent: true, fog: false, depthWrite: false, opacity: 0.95 }));
    m.position.set(x, y, z); m.lookAt(0, y * 0.4, 0); m.renderOrder = -9;
    scene.add(m); skyScene.add(m.clone());
  }

  // Fuji: a concave cone, snow cap with streaks, sunlit left flank
  {
    const prof = [];
    for (let i = 0; i <= 24; i++) { const f = i / 24; prof.push(new THREE.Vector2(620 * Math.pow(1 - f, 1.55) + 26 * (1 - f) + 18, f * 235)); }
    prof.push(new THREE.Vector2(0, 238));
    const geo = new THREE.LatheGeometry(prof, 96);
    const mat = new THREE.ShaderMaterial({
      fog: false,
      uniforms: { uBody: { value: C('#8f8ec4') }, uLit: { value: C('#d7a8c6') }, uSnow: { value: C('#fff0f2') }, uSnowSh: { value: C('#c2b8e4') }, uHaze: { value: C('#f3bfb8') }, uSun: { value: SUN_DIR } },
      vertexShader: `varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normalize(normalMatrix * normal); vN = normalize((modelMatrix * vec4(normal,0.0)).xyz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uBody,uLit,uSnow,uSnowSh,uHaze,uSun; varying vec3 vP; varying vec3 vN;
        void main(){
          float h = vP.y / 238.0; float a = atan(vP.z, vP.x);
          float line = 0.64 + 0.05*sin(a*7.0) + 0.035*sin(a*17.0+1.3) + 0.02*sin(a*31.0);
          float streak = smoothstep(0.55, 1.0, sin(a*23.0)*0.5+0.5) * 0.12;
          float snow = smoothstep(line - streak - 0.01, line - streak + 0.01, h);
          float lit = clamp(dot(normalize(vec3(vN.x, 0.0, vN.z)), normalize(vec3(uSun.x, 0.0, uSun.z))) * 0.5 + 0.5, 0.0, 1.0);
          vec3 body = mix(uBody, uLit, lit * 0.55);
          vec3 sn = mix(uSnowSh, uSnow, smoothstep(0.25, 0.8, lit));
          vec3 c = mix(body, sn, snow);
          c = mix(c, uHaze, (1.0 - smoothstep(0.0, 0.45, h)) * 0.72);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const fuji = new THREE.Mesh(geo, mat);
    fuji.position.set(-25, -8, -1100);
    fuji.renderOrder = -8;
    scene.add(fuji); skyScene.add(fuji.clone());
  }

  // layered hills: far to near, hazier with distance (baked haze, no fog)
  const ridge = (dist, amp, base, col, top, seed, span = 2400, n = 160) => {
    const r2 = rng(seed);
    const ph = [r2() * 6, r2() * 6, r2() * 6, r2() * 6];
    const pos = [], cols = [], idx = [];
    const cTop = C(top), cBot = C(col);
    for (let i = 0; i <= n; i++) {
      const x = -span / 2 + (span * i) / n;
      const u = x / span;
      const hgt = base + amp * (0.55 * Math.sin(u * 9 + ph[0]) + 0.3 * Math.sin(u * 23 + ph[1]) + 0.15 * Math.sin(u * 51 + ph[2]) + 0.08 * Math.sin(u * 111 + ph[3]));
      pos.push(x, Math.max(2, hgt), 0, x, -20, 0);
      cols.push(cTop.r, cTop.g, cTop.b, cBot.r, cBot.g, cBot.b);
      if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
    m.position.set(0, 0, -dist);
    m.renderOrder = -7;
    scene.add(m); skyScene.add(m.clone());
  };
  ridge(820, 70, 60, '#e9b9b6', '#b5a2c6', 11, 3600);
  ridge(600, 55, 40, '#e6b3ae', '#a293b8', 12, 3000);
  ridge(430, 38, 22, '#dcae9f', '#8e86a4', 13, 2400);
  ridge(300, 18, 9, '#d4a894', '#7b7d8a', 14, 1800);

  // ground
  const grassTex = canvasTex(512, 512, (g, w, h) => {
    const r2 = rng(5);
    g.fillStyle = '#93ab58'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = r2() * w, y = r2() * h, r = 4 + r2() * 26;
      g.fillStyle = r2() < 0.5 ? `rgba(120,150,62,${0.12 + r2() * 0.2})` : `rgba(176,190,96,${0.1 + r2() * 0.18})`;
      g.beginPath(); g.ellipse(x, y, r, r * 0.6, r2() * 3, 0, Math.PI * 2); g.fill();
    }
  }, { repeat: [90, 90] });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), toon('#ffffff', { map: grassTex }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -500); ground.receiveShadow = true;
  scene.add(ground);

  // road: warm dirt, lighter crown, darker tyre tracks
  const roadTex = canvasTex(256, 1024, (g, w, h) => {
    const r2 = rng(8);
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#9a7353'); gr.addColorStop(0.08, '#b48a64'); gr.addColorStop(0.5, '#c29a70'); gr.addColorStop(0.92, '#b48a64'); gr.addColorStop(1, '#9a7353');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (const cx of [0.3, 0.7]) { g.fillStyle = 'rgba(120,86,60,0.22)'; g.fillRect(w * cx - 14, 0, 28, h); }
    for (let i = 0; i < 2600; i++) { const x = r2() * w, y = r2() * h; g.fillStyle = r2() < 0.5 ? `rgba(90,62,44,${0.15 + r2() * 0.25})` : `rgba(230,205,170,${0.15 + r2() * 0.25})`; g.fillRect(x, y, 1 + r2() * 3, 1 + r2() * 2); }
    for (let i = 0; i < 40; i++) { const x = r2() * w, y = r2() * h; g.fillStyle = 'rgba(110,80,55,0.10)'; g.beginPath(); g.ellipse(x, y, 10 + r2() * 30, 20 + r2() * 60, 0, 0, Math.PI * 2); g.fill(); }
  }, { repeat: [1, 70] });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 700), toon('#ffffff', { map: roadTex }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.012, -300); road.receiveShadow = true;
  scene.add(road);

  // paddies: reflective water sheets, grass banks between them
  const waterMat = new THREE.MeshStandardMaterial({ color: C('#39406a'), roughness: 0.14, metalness: 0.0, envMapIntensity: 1.35 });
  S.waterMat = waterMat;
  const addWater = (x0, x1, z0, z1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), waterMat);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.035, (z0 + z1) / 2); m.receiveShadow = true;
    scene.add(m);
  };
  addWater(-420, -3.1, -620, 40);
  addWater(11.5, 420, -620, 40);
  const bankMat = toon('#86a352');
  const bankGeos = [];
  for (let z = 30; z > -600; z -= 13 + R() * 6) {
    bankGeos.push(xf(new THREE.BoxGeometry(400, 0.22, 0.55), { p: [-203.1, 0.08, z] }));
    bankGeos.push(xf(new THREE.BoxGeometry(400, 0.22, 0.55), { p: [211.5, 0.08, z + 5] }));
  }
  for (const x of [-21, -44, -80, -130, 28, 52, 90, 140]) bankGeos.push(xf(new THREE.BoxGeometry(0.6, 0.22, 660), { p: [x, 0.08, -290] }));
  const banks = new THREE.Mesh(merge(bankGeos), bankMat); banks.receiveShadow = true; scene.add(banks);

  // rice seedlings in rows (near paddies only)
  {
    const g = [];
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI + 0.3; g.push(xf(new THREE.PlaneGeometry(0.035, 0.26), { p: [0, 0.13, 0], r: [0.25 * Math.cos(a), a, 0.25 * Math.sin(a)] })); }
    const geo = merge(g.map((x) => paint(x, '#6e9a3c', (c, px, py) => c.lerp(C('#c4d77a'), clamp(py / 0.26)))));
    for (let i = 0; i < geo.attributes.normal.count; i++) geo.attributes.normal.setXYZ(i, 0, 1, 0);
    const cells = [];
    for (let x = -3.7; x > -13; x -= 0.6) for (let z = 16; z > -70; z -= 0.45) cells.push([x, z]);
    for (let x = 12.2; x < 20; x += 0.6) for (let z = 16; z > -70; z -= 0.45) cells.push([x, z]);
    const im = new THREE.InstancedMesh(geo, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), cells.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    cells.forEach(([x, z], i) => {
      e.set(0, R() * 6.28, 0); q.setFromEuler(e);
      const s = 0.75 + R() * 0.5;
      m.compose(new THREE.Vector3(x + (R() - 0.5) * 0.08, 0.02, z + (R() - 0.5) * 0.08), q, new THREE.Vector3(s, s, s));
      im.setMatrixAt(i, m);
    });
    scene.add(im);
  }

  // grass tufts along the verges and banks
  {
    const blades = [];
    for (let k = 0; k < 11; k++) {
      const a = (k / 11) * Math.PI * 2 + R();
      const hgt = 0.16 + R() * 0.24, lean = 0.06 + R() * 0.12;
      const b = new THREE.BufferGeometry();
      b.setAttribute('position', new THREE.Float32BufferAttribute([-0.016, 0, 0, 0.016, 0, 0, lean * 0.6, hgt, lean], 3));
      xf(b, { r: [0, a, 0] });
      blades.push(paint(b, '#5d8a36', (c, px, py) => c.lerp(C('#d6dd86'), clamp(py / 0.45))));
    }
    const geo = merge(blades);
    for (let i = 0; i < geo.attributes.normal.count; i++) geo.attributes.normal.setXYZ(i, 0, 1, 0);
    const spots = [];
    for (let z = 22; z > -120; z -= 0.28) {
      spots.push([-1.85 - R() * 0.5, z + R() * 0.2, 0.6 + R() * 0.6]);
      spots.push([1.85 + R() * 0.6, z + R() * 0.2, 0.6 + R() * 0.6]);
      for (let k = 0; k < 3; k++) spots.push([2.5 + R() * 9, z + R() * 0.28, 0.6 + R() * 1.0]);
      if (R() < 0.35) spots.push([-2.3 - R() * 0.8, z, 0.6 + R() * 0.9]);
    }
    const im = new THREE.InstancedMesh(geo, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), spots.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    spots.forEach(([x, z, s], i) => { e.set(0, R() * 6.28, 0); q.setFromEuler(e); m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s * (0.8 + R() * 0.5), s)); im.setMatrixAt(i, m); });
    im.receiveShadow = true;
    scene.add(im);
    // wildflowers
    const fl = new THREE.IcosahedronGeometry(0.035, 0);
    const n = 1400;
    const fm = new THREE.InstancedMesh(fl, toon('#ffffff'), n);
    const pal = ['#f6f1f4', '#b99be0', '#ffd66b', '#f59cc0', '#9aa7f0'];
    for (let i = 0; i < n; i++) {
      const side = R() < 0.55 ? 1 : -1;
      const x = side > 0 ? 1.9 + R() * 9 : -1.9 - R() * 1.1, z = 20 - R() * 130;
      m.compose(new THREE.Vector3(x, 0.18 + R() * 0.3, z), q.identity(), new THREE.Vector3(1, 1, 1));
      fm.setMatrixAt(i, m); fm.setColorAt(i, C(pal[Math.floor(R() * pal.length)]));
    }
    scene.add(fm);
  }

  // wooden fence between road and the left paddies
  {
    const g = [];
    for (let z = 20; z > -130; z -= 2.4) g.push(xf(new THREE.BoxGeometry(0.11, 1.0, 0.11), { p: [-2.45, 0.5, z], r: [0, 0, (R() - 0.5) * 0.06] }));
    g.push(xf(new THREE.BoxGeometry(0.07, 0.09, 150), { p: [-2.43, 0.82, -55] }));
    g.push(xf(new THREE.BoxGeometry(0.07, 0.08, 150), { p: [-2.43, 0.45, -55] }));
    const fence = new THREE.Mesh(merge(g.map((x) => paint(x, '#8a6a52'))), toon('#ffffff', { vertexColors: true }));
    fence.castShadow = true; fence.receiveShadow = true; scene.add(fence);
  }

  // trees ----------------------------------------------------------------
  const blobCanopy = (r2, center, spread, nBlobs, rMin, rMax, cLow, cHigh, cVar) => {
    const gs = [];
    for (let i = 0; i < nBlobs; i++) {
      const a = r2() * Math.PI * 2, rr = Math.sqrt(r2());
      const bx = Math.cos(a) * rr * spread[0], bz = Math.sin(a) * rr * spread[2], by = (r2() - 0.35) * spread[1];
      const br = rMin + r2() * (rMax - rMin);
      const b = new THREE.IcosahedronGeometry(br, 1);
      xf(b, { p: [center[0] + bx, center[1] + by, center[2] + bz] });
      const tint = r2();
      gs.push(paint(b, cLow, (c, x, y, z) => {
        const f = clamp((y - (center[1] - spread[1] * 0.9)) / (spread[1] * 1.9 + rMax));
        c.lerp(C(cHigh), f); c.lerp(C(cVar), tint * 0.35);
      }));
    }
    const geo = merge(gs);
    // fluffy normals: bend every normal toward the canopy's own sphere
    const p = geo.attributes.position, nm = geo.attributes.normal, v = new THREE.Vector3(), w = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i) - center[0], (p.getY(i) - center[1]) * 1.3, p.getZ(i) - center[2]).normalize();
      w.set(nm.getX(i), nm.getY(i), nm.getZ(i)).lerp(v, 0.7).normalize();
      nm.setXYZ(i, w.x, w.y, w.z);
    }
    return geo;
  };
  const trunkGeo = (r2, top, branches, rTrunk, col) => {
    const gs = [paint(tube([[0, -0.2, 0], [top[0] * 0.3, top[1] * 0.45, top[2] * 0.3], top], rTrunk, 8, 7), col)];
    for (const b of branches) gs.push(paint(tube([[top[0] * 0.5, top[1] * 0.62, top[2] * 0.5], [(top[0] + b[0]) / 2, (top[1] + b[1]) / 2 + 0.2, (top[2] + b[2]) / 2], b], rTrunk * 0.45, 6, 5), col));
    return merge(gs);
  };
  const cherryVariants = [0, 1, 2].map((k) => {
    const r2 = rng(300 + k);
    const lean = [(r2() - 0.5) * 0.5, 2.1 + r2() * 0.5, (r2() - 0.5) * 0.4];
    const br = [0, 1, 2, 3].map((i) => { const a = (i / 4) * Math.PI * 2 + r2(); return [Math.cos(a) * 1.3, 2.9 + r2() * 0.5, Math.sin(a) * 1.3]; });
    return {
      trunk: trunkGeo(r2, lean, br, 0.17, '#5a3b3d'),
      crown: blobCanopy(r2, [lean[0], 3.35, lean[2]], [2.1, 0.95, 2.1], 30, 0.42, 0.85, '#e99ab6', '#fff0f3', '#fbd0dd'),
    };
  });
  const greenVariants = [0, 1].map((k) => {
    const r2 = rng(400 + k);
    const lean = [(r2() - 0.5) * 0.4, 3.2, (r2() - 0.5) * 0.4];
    const br = [0, 1, 2].map((i) => { const a = (i / 3) * Math.PI * 2 + r2(); return [Math.cos(a) * 1.2, 4.2, Math.sin(a) * 1.2]; });
    return {
      trunk: trunkGeo(r2, lean, br, 0.2, '#5b4638'),
      crown: blobCanopy(r2, [lean[0], 4.8, lean[2]], [1.9, 1.2, 1.9], 14, 0.8, 1.3, '#3e6a3a', '#9fc062', '#5d8a44'),
    };
  });
  const place = (variants, spots, cast = true) => {
    const byV = variants.map(() => []);
    spots.forEach((s) => byV[s.v % variants.length].push(s));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    variants.forEach((vv, k) => {
      const list = byV[k]; if (!list.length) return;
      for (const part of ['trunk', 'crown']) {
        const im = new THREE.InstancedMesh(vv[part], toon('#ffffff', { vertexColors: true }), list.length);
        list.forEach((s, i) => { e.set(0, s.ry, 0); q.setFromEuler(e); m.compose(new THREE.Vector3(s.x, 0, s.z), q, new THREE.Vector3(s.s, s.s * (s.sy || 1), s.s)); im.setMatrixAt(i, m); });
        im.castShadow = cast; im.receiveShadow = true;
        scene.add(im);
      }
    });
  };
  const cherries = [];
  // right side row (behind the poles), the odd one on the left bank; open around the torii
  for (let z = 16; z > -170; z -= 6.5 + R() * 4) {
    if (z < TORII_Z + 7 && z > TORII_Z - 22) continue;
    cherries.push({ v: Math.floor(R() * 3), x: 4.4 + R() * 2.2, z, s: 0.95 + R() * 0.35, ry: R() * 6.28 });
    if (R() < 0.45) cherries.push({ v: Math.floor(R() * 3), x: 8.5 + R() * 3, z: z - 3, s: 0.9 + R() * 0.3, ry: R() * 6.28 });
  }
  for (const z of [4, -9, -48, -63, -82, -104]) cherries.push({ v: Math.floor(R() * 3), x: -3.6 - R() * 0.8, z, s: 0.85 + R() * 0.3, ry: R() * 6.28 });
  place(cherryVariants, cherries);
  S.cherries = cherries;
  // distant tree lines across the paddies
  const greens = [];
  for (let i = 0; i < 70; i++) greens.push({ v: i, x: -60 - R() * 40, z: 30 - i * 9 - R() * 6, s: 1 + R() * 0.6, ry: R() * 6.28 });
  for (let i = 0; i < 60; i++) greens.push({ v: i, x: 55 + R() * 50, z: 20 - i * 10 - R() * 6, s: 1 + R() * 0.7, ry: R() * 6.28 });
  for (let i = 0; i < 40; i++) greens.push({ v: i, x: (R() - 0.5) * 300, z: -170 - R() * 60, s: 1.2 + R() * 0.8, ry: R() * 6.28 });
  place(greenVariants, greens, false);

  // cedar grove behind the torii (the shrine's forest), right side
  {
    const g = [];
    const r2 = rng(71);
    for (let i = 0; i < 4; i++) {
      const y0 = 1.6 + i * 1.7, rad = 1.5 - i * 0.3;
      g.push(paint(xf(new THREE.ConeGeometry(rad, 3.0, 14), { p: [0, y0 + 1.2, 0] }), '#3f6248', (c, x, y) => c.lerp(C('#86aa66'), clamp((y - y0) / 3) * 0.55)));
    }
    g.push(paint(xf(new THREE.CylinderGeometry(0.14, 0.2, 2.2, 7), { p: [0, 1.1, 0] }), '#4a3226'));
    const geo = merge(g);
    const spots = [];
    for (let i = 0; i < 30; i++) spots.push([8.2 + r2() * 18, TORII_Z - 4 - r2() * 26, 1.0 + r2() * 0.7]);
    const im = new THREE.InstancedMesh(geo, toon('#ffffff', { vertexColors: true }), spots.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    spots.forEach(([x, z, s], i) => { m.compose(new THREE.Vector3(x, 0, z), q.setFromEuler(new THREE.Euler(0, r2() * 6, 0)), new THREE.Vector3(s, s * (1.05 + r2() * 0.3), s)); im.setMatrixAt(i, m); });
    im.castShadow = true; im.receiveShadow = true;
    scene.add(im);
  }

  // fallen-petal carpets under the cherries
  {
    const tex = canvasTex(256, 256, (g, w, h) => {
      const r2 = rng(3);
      for (let i = 0; i < 520; i++) {
        const a = r2() * 6.28, rr = Math.pow(r2(), 0.7) * w * 0.48;
        const x = w / 2 + Math.cos(a) * rr, y = h / 2 + Math.sin(a) * rr;
        g.fillStyle = r2() < 0.5 ? 'rgba(255,214,226,0.9)' : 'rgba(246,176,200,0.9)';
        g.beginPath(); g.ellipse(x, y, 3 + r2() * 2, 2, r2() * 3, 0, Math.PI * 2); g.fill();
      }
    }, { aniso: 4 });
    const mat = toon('#ffffff', { map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    for (const t of cherries) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5), mat);
      m.rotation.x = -Math.PI / 2; m.position.set(t.x - 0.5, 0.03, t.z + 1); m.receiveShadow = true;
      scene.add(m);
    }
  }

  // utility poles and sagging wires (right verge)
  {
    const g = [], wires = [];
    const poleZ = [40, 4, -44, -80, -116, -152, -188];
    const tops = [];
    for (const z of poleZ) {
      const x = 3.25;
      g.push(paint(xf(new THREE.CylinderGeometry(0.1, 0.14, 8.6, 8), { p: [x, 4.3, z] }), '#857a70'));
      g.push(paint(xf(new THREE.CylinderGeometry(0.155, 0.155, 1.8, 8), { p: [x, 0.9, z] }), '#f0c63a', (c, px, py) => { if (Math.floor(py / 0.3) % 2 === 0) c.set('#222027'); }));
      g.push(paint(xf(new THREE.BoxGeometry(1.5, 0.1, 0.1), { p: [x, 7.9, z] }), '#6e6760'));
      for (const dx of [-0.6, 0, 0.6]) g.push(paint(xf(new THREE.CylinderGeometry(0.035, 0.045, 0.14, 6), { p: [x + dx, 8.02, z] }), '#dcdad6'));
      tops.push([x, 8.05, z]);
    }
    for (let i = 0; i + 1 < tops.length; i++) {
      for (const [dx, dy] of [[-0.6, 0], [0.6, 0], [0, 0]]) {
        const a = tops[i], b = tops[i + 1], pts = [];
        for (let k = 0; k <= 10; k++) { const f = k / 10; pts.push([a[0] + dx, a[1] + dy - 0.9 * 4 * f * (1 - f), lerp(a[2], b[2], f)]); }
        wires.push(paint(tube(pts, 0.013, 16, 4), '#2c2830'));
      }
      // a low drop wire to the houses across
    }
    const poles = new THREE.Mesh(merge(g), toon('#ffffff', { vertexColors: true })); poles.castShadow = true; poles.receiveShadow = true; scene.add(poles);
    const w = new THREE.Mesh(merge(wires), new THREE.MeshBasicMaterial({ vertexColors: true, fog: true })); scene.add(w);
  }

  // farmhouses (a few, far across the fields)
  {
    const g = [];
    const house = (x, z, ry, s) => {
      const parts = [];
      parts.push(paint(xf(new THREE.BoxGeometry(7, 3, 5), { p: [0, 1.5, 0] }), '#efe2cf'));
      parts.push(paint(xf(new THREE.BoxGeometry(7.1, 0.9, 5.1), { p: [0, 0.45, 0] }), '#6b4c3a'));
      const roof = new THREE.CylinderGeometry(0.01, 4.3, 2.2, 4, 1); xf(roof, { p: [0, 4.1, 0], r: [0, Math.PI / 4, 0], s: [1.35, 1, 0.95] });
      parts.push(paint(roof, '#3f3f4c'));
      for (const wx of [-2, 0.2, 2.2]) parts.push(paint(xf(new THREE.BoxGeometry(1.1, 0.8, 0.05), { p: [wx, 1.8, 2.53] }), '#ffd79a'));
      for (const p of parts) { xf(p, { r: [0, ry, 0], s: [s, s, s] }); xf(p, { p: [x, 0, z] }); g.push(p); }
    };
    house(34, -96, -0.3, 1); house(58, -150, 0.4, 1.1); house(-62, -120, 0.2, 1); house(-40, -190, -0.5, 1.2); house(24, -210, 0.1, 1);
    const m = new THREE.Mesh(merge(g), toon('#ffffff', { vertexColors: true })); m.castShadow = true; m.receiveShadow = true; scene.add(m);
  }

  // torii (Myojin style): vermilion pillars and nuki, black kasagi with upswept ends
  {
    const g = [];
    const red = '#e04a2e', black = '#2a2326', px = 2.5;
    for (const sx of [-1, 1]) {
      g.push(paint(xf(new THREE.CylinderGeometry(0.24, 0.29, 5.6, 16), { p: [sx * px, 2.8, 0], r: [0, 0, sx * 0.035] }), red));
      g.push(paint(xf(new THREE.CylinderGeometry(0.34, 0.36, 0.55, 16), { p: [sx * px, 0.27, 0] }), black));
    }
    g.push(paint(xf(new THREE.BoxGeometry(6.7, 0.36, 0.32), { p: [0, 4.35, 0] }), red));
    g.push(paint(xf(new THREE.BoxGeometry(0.3, 0.75, 0.24), { p: [0, 4.9, 0] }), red));
    g.push(paint(xf(new THREE.BoxGeometry(0.62, 0.8, 0.08), { p: [0, 4.9, 0.14] }), black));
    // shimaki (red) + kasagi (black), curved: extrude a crescent profile
    const beam = (yb, th, half, lift, col, depth) => {
      const sh = new THREE.Shape();
      const N = 24;
      const top = (x) => yb + th + lift * Math.pow(Math.abs(x) / half, 2.6);
      const bot = (x) => yb + lift * 0.8 * Math.pow(Math.abs(x) / half, 3.2);
      sh.moveTo(-half, bot(-half));
      for (let i = 0; i <= N; i++) { const x = -half + (2 * half * i) / N; sh.lineTo(x, bot(x)); }
      sh.lineTo(half + 0.05, top(half) + 0.04);
      for (let i = N; i >= 0; i--) { const x = -half + (2 * half * i) / N; sh.lineTo(x, top(x)); }
      sh.lineTo(-half - 0.05, top(-half) + 0.04);
      const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 4 });
      xf(geo, { p: [0, 0, -depth / 2] });
      return paint(geo, col);
    };
    g.push(beam(5.3, 0.34, 3.75, 0.28, red, 0.5));
    g.push(beam(5.62, 0.3, 4.05, 0.42, black, 0.66));
    const torii = new THREE.Mesh(merge(g), toon('#ffffff', { vertexColors: true, rim: true }));
    torii.position.set(0, 0, TORII_Z); torii.castShadow = true; torii.receiveShadow = true;
    scene.add(torii);
  }

  // stone lanterns (kasuga-doro) with glowing fire boxes
  {
    const g = [], lamps = [];
    const stone = '#a8a196';
    const lantern = (x, z, s = 1) => {
      const parts = [];
      parts.push(paint(xf(new THREE.CylinderGeometry(0.32, 0.36, 0.16, 6), { p: [0, 0.08, 0] }), stone));
      parts.push(paint(xf(new THREE.CylinderGeometry(0.09, 0.11, 0.62, 10), { p: [0, 0.47, 0] }), stone));
      parts.push(paint(xf(new THREE.CylinderGeometry(0.3, 0.2, 0.14, 6), { p: [0, 0.84, 0] }), stone));
      parts.push(paint(xf(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 6, 1, true), { p: [0, 1.06, 0] }), '#8f887e'));
      parts.push(paint(xf(new THREE.CylinderGeometry(0.1, 0.46, 0.26, 6), { p: [0, 1.33, 0] }), '#9b948a'));
      parts.push(paint(xf(new THREE.CylinderGeometry(0.46, 0.44, 0.05, 6), { p: [0, 1.21, 0] }), '#9b948a'));
      parts.push(paint(xf(new THREE.SphereGeometry(0.08, 10, 8), { p: [0, 1.5, 0] }), stone));
      for (const p of parts) { xf(p, { s: [s, s, s] }); xf(p, { p: [x, 0, z] }); g.push(p); }
      lamps.push([x, 1.06 * s, z, s]);
    };
    for (const z of [-8, TORII_Z + 5.5, TORII_Z - 5.5, TORII_Z - 17, -58]) { lantern(-2.05, z); lantern(2.05, z + (z === -8 ? 1 : 0)); }
    const m = new THREE.Mesh(merge(g), toon('#ffffff', { vertexColors: true })); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    // fire boxes: emissive cores
    const core = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.155, 0.155, 0.24, 6), new THREE.MeshBasicMaterial({ color: C('#ffd08a').multiplyScalar(2.2), fog: false, toneMapped: false }), lamps.length);
    const mt = new THREE.Matrix4();
    lamps.forEach(([x, y, z, s], i) => { mt.makeTranslation(x, y, z); core.setMatrixAt(i, mt); });
    scene.add(core);
    // halos (additive sprites) and warm pools on the road
    const halo = canvasTex(128, 128, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,220,160,1)'); gr.addColorStop(0.2, 'rgba(255,190,120,0.55)'); gr.addColorStop(0.55, 'rgba(255,150,90,0.12)'); gr.addColorStop(1, 'rgba(255,140,80,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }, { aniso: 1 });
    const hm = new THREE.SpriteMaterial({ map: halo, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, transparent: true, opacity: 1 });
    const pm = new THREE.MeshBasicMaterial({ map: halo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5, toneMapped: false });
    for (const [x, y, z] of lamps) {
      const sp = new THREE.Sprite(hm); sp.position.set(x, y, z); sp.scale.set(2.1, 2.1, 1); scene.add(sp);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), pm); pool.rotation.x = -Math.PI / 2; pool.position.set(x * 0.8, 0.04, z); scene.add(pool);
    }
    S.lamps = lamps;
  }
}

// ---------- the bike and the rider ----------
function buildRider(scene) {
  const bike = new THREE.Group();
  scene.add(bike);
  const red = toon('#c9303b', { rim: true }), chrome = toon('#dcdde6', { rim: true }), tyre = toon('#2f2c33', { rim: true }), dark = toon('#3b3238', { rim: true });
  const add = (geo, mat, parent = bike) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const R = [0, WHEEL_R, 0.52], F = [0, WHEEL_R, -0.6], BB = [0, 0.28, 0.07];
  // frame (step-through mamachari)
  add(tube([[0, 0.72, -0.47], [0, 0.5, -0.3], [0, 0.34, -0.1], BB], 0.028), red);
  add(tube([[0, 0.8, -0.44], [0, 0.6, -0.26], [0, 0.44, -0.02], [0, 0.4, 0.1]], 0.022), red);
  add(tube([BB, [0, 0.88, 0.27]], 0.024), red);
  for (const sx of [-0.05, 0.05]) {
    add(tube([[sx * 0.6, BB[1], BB[2]], [sx, R[1], R[2]]], 0.016), red);
    add(tube([[0, 0.8, 0.25], [sx, R[1], R[2]]], 0.015), red);
    add(tube([[0, 0.72, -0.47], [sx, 0.5, -0.53], [sx, F[1], F[2]]], 0.017), red);
  }
  add(tube([[0, 0.7, -0.47], [0, 0.93, -0.41]], 0.032), red);
  // stem + swept-back bars + grips
  add(tube([[0, 0.93, -0.41], [0, 1.02, -0.4]], 0.018), chrome);
  add(tube([[-0.29, 1.04, -0.16], [-0.2, 1.03, -0.3], [-0.06, 1.02, -0.4], [0.06, 1.02, -0.4], [0.2, 1.03, -0.3], [0.29, 1.04, -0.16]], 0.013, 20), chrome);
  for (const sx of [-1, 1]) add(xf(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), { p: [sx * 0.3, 1.045, -0.12], r: [Math.PI / 2 - 0.2, 0, 0] }), dark);
  // seat post + saddle
  add(tube([[0, 0.86, 0.27], [0, 0.95, 0.3]], 0.014), chrome);
  add(xf(new THREE.SphereGeometry(0.1, 14, 10), { p: [0, 0.97, 0.31], s: [0.9, 0.35, 1.35] }), toon('#4a3530', { rim: true }));
  // rear rack, fenders, chain guard
  add(xf(new THREE.BoxGeometry(0.13, 0.015, 0.3), { p: [0, 0.79, 0.5] }), toon('#56505a', { rim: true }));
  add(tube([[0, 0.8, 0.36], [0.07, R[1], R[2]]], 0.008), chrome);
  add(tube([[0, 0.8, 0.36], [-0.07, R[1], R[2]]], 0.008), chrome);
  const fender = (c, a0) => add(xf(new THREE.TorusGeometry(0.365, 0.022, 5, 22, Math.PI * 0.95), { p: c, r: [0, Math.PI / 2, a0] }), chrome);
  fender(R, 0.15); fender(F, -0.1);
  add(xf(new THREE.BoxGeometry(0.012, 0.13, 0.5), { p: [0.075, 0.33, 0.3], r: [0.1, 0, 0] }), red);
  // wheels (spin in render)
  const wheel = (c) => {
    const w = new THREE.Group(); w.position.set(...c); bike.add(w);
    add(xf(new THREE.TorusGeometry(WHEEL_R - 0.018, 0.027, 8, 36), { r: [0, Math.PI / 2, 0] }), tyre, w);
    add(xf(new THREE.TorusGeometry(WHEEL_R - 0.048, 0.01, 5, 36), { r: [0, Math.PI / 2, 0] }), chrome, w);
    const sp = [];
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; sp.push(tube([[0, 0, 0], [0, Math.sin(a) * 0.28, Math.cos(a) * 0.28]], 0.0035, 1, 3)); }
    add(merge(sp), chrome, w);
    add(xf(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 10), { r: [0, 0, Math.PI / 2] }), chrome, w);
    return w;
  };
  const wR = wheel(R), wF = wheel(F);
  // chainring + cranks + pedals
  const crank = new THREE.Group(); crank.position.set(...BB); bike.add(crank);
  add(xf(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), { p: [0.06, 0, 0], r: [0, 0, Math.PI / 2] }), chrome, crank);
  const arms = [];
  for (const sx of [1, -1]) {
    const arm = add(xf(new THREE.BoxGeometry(0.018, 0.17, 0.03), { p: [0, 0.085, 0] }), chrome, new THREE.Group());
    const pivot = arm.parent; pivot.position.set(sx * 0.085, 0, 0); crank.add(pivot);
    arms.push(pivot);
  }
  const pedals = [0, 1].map(() => add(new THREE.BoxGeometry(0.1, 0.022, 0.06), dark));
  // basket with a bunch of flowers, headlamp
  const bt = canvasTex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#e8e8ee'; g.lineWidth = 5; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } }, { aniso: 4 });
  const basket = add(xf(new THREE.BoxGeometry(0.36, 0.25, 0.28), { p: [0, 0.98, -0.66] }), toon('#ffffff', { map: bt, alphaTest: 0.5, side: THREE.DoubleSide, rim: true }));
  basket.castShadow = true;
  {
    const r2 = rng(17), fl = [];
    for (let i = 0; i < 7; i++) {
      const x = (r2() - 0.5) * 0.22, z = -0.66 + (r2() - 0.5) * 0.16, hh = 1.12 + r2() * 0.16;
      fl.push(paint(tube([[x, 0.95, z], [x * 1.2, hh, z - 0.02]], 0.006, 1, 3), '#5f8c3a'));
      fl.push(paint(xf(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 12), { p: [x * 1.2, hh, z - 0.02], r: [0.3 + r2() * 0.5, 0, (r2() - 0.5) * 0.6] }), i % 3 === 0 ? '#ffffff' : '#ffc93c', (c, px, py, pz) => { if (Math.hypot(px - x * 1.2, pz - z + 0.02) < 0.017) c.set('#6b3b1c'); }));
    }
    fl.push(paint(xf(new THREE.BoxGeometry(0.3, 0.1, 0.22), { p: [0, 0.93, -0.66] }), '#e8d6b8'));
    add(merge(fl), toon('#ffffff', { vertexColors: true, rim: true }));
  }
  add(xf(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 10), { p: [0, 0.8, -0.55], r: [Math.PI / 2, 0, 0] }), chrome);

  // --- the rider ---
  const skin = toon('#f0c2a8', { rim: true }), blouse = toon('#f7f4ef', { rim: true }), navy = toon('#2c3766', { rim: true, side: THREE.DoubleSide }), hair = toon('#3a2826', { rim: true }), sock = toon('#f4f2ee', { rim: true }), shoe = toon('#6a4232', { rim: true });
  const pelvis = new THREE.Group(); pelvis.position.set(0, 1.0, 0.32); bike.add(pelvis);
  const torso = new THREE.Group(); torso.rotation.x = -0.36; pelvis.add(torso);
  {
    const pr = [[0.0, 0.0], [0.125, 0.0], [0.13, 0.08], [0.125, 0.2], [0.15, 0.32], [0.155, 0.4], [0.12, 0.46], [0.05, 0.49], [0, 0.49]].map(([r, y]) => new THREE.Vector2(r, y));
    add(xf(new THREE.LatheGeometry(pr, 18), { s: [1.12, 1, 0.78] }), blouse, torso);
    add(xf(new THREE.CylinderGeometry(0.04, 0.045, 0.1, 10), { p: [0, 0.52, 0.005] }), skin, torso);
    // sailor-ish collar bow for a touch of colour
    add(xf(new THREE.SphereGeometry(0.03, 8, 6), { p: [0, 0.4, -0.12], s: [1.6, 0.8, 0.6] }), toon('#d8424f', { rim: true }), torso);
  }
  const head = new THREE.Group(); head.position.set(0, 0.62, 0.0); torso.add(head);
  head.rotation.x = 0.28;
  add(xf(new THREE.SphereGeometry(0.105, 20, 16), { s: [0.95, 1.05, 1] }), skin, head);
  add(xf(new THREE.SphereGeometry(0.117, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), { p: [0, 0.018, 0.012], r: [0.5, 0, 0] }), hair, head);
  add(xf(new THREE.SphereGeometry(0.113, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), { p: [0, 0.0, 0.018], r: [-1.35, 0, 0] }), hair, head);
  add(xf(new THREE.SphereGeometry(0.02, 8, 6), { p: [0, 0.02, 0.118] }), toon('#e0525f'), head);
  const tail = new THREE.Group(); tail.position.set(0, 0.02, 0.118); head.add(tail);
  const tailSegs = [];
  {
    let parent = tail;
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group(); g.position.set(0, i === 0 ? 0 : -0.07, 0); parent.add(g);
      add(xf(new THREE.SphereGeometry(0.036 - i * 0.006, 10, 8), { p: [0, -0.04, 0], s: [1, 1.5, 0.9] }), hair, g);
      tailSegs.push(g); parent = g;
    }
  }
  // limbs: unit cylinders placed between points each frame
  const limb = (r0, r1, mat) => add(new THREE.CylinderGeometry(r1, r0, 1, 10), mat);
  const joint = (r, mat) => add(new THREE.SphereGeometry(r, 10, 8), mat);
  const legs = [0, 1].map(() => ({ thigh: limb(0.062, 0.048, skin), shin: limb(0.045, 0.034, skin), sock: limb(0.036, 0.034, sock), knee: joint(0.05, skin), shoe: add(xf(new THREE.SphereGeometry(0.05, 10, 8), { s: [0.75, 0.6, 1.7] }), shoe) }));
  const armsR = [0, 1].map(() => ({ up: limb(0.04, 0.034, skin), lo: limb(0.032, 0.026, skin), sleeve: joint(0.052, blouse), elbow: joint(0.034, skin), hand: joint(0.03, skin) }));
  // skirt: a flared lathe that the thighs push around every frame
  const skirtRest = [];
  const sk = new THREE.CylinderGeometry(0.135, 0.3, 0.5, 26, 6, true);
  xf(sk, { p: [0, -0.18, 0.02] });
  const sp = sk.attributes.position;
  for (let i = 0; i < sp.count; i++) skirtRest.push(new THREE.Vector3(sp.getX(i), sp.getY(i), sp.getZ(i)));
  sp.setUsage(THREE.DynamicDrawUsage);
  const skirt = add(sk, navy, pelvis);
  // hide the frame-coloured waist seam
  add(xf(new THREE.CylinderGeometry(0.13, 0.135, 0.06, 20), { p: [0, 0.05, 0.02], s: [1.1, 1, 0.85] }), navy, pelvis);

  S.rider = { bike, wR, wF, crank, arms, pedals, pelvis, torso, head, tailSegs, legs, armsR, skirt, skirtRest, BB };
}

// place a unit cylinder between a (top) and b (bottom)
const _v = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0);
function between(m, a, b) {
  m.position.copy(a).add(b).multiplyScalar(0.5);
  _v.copy(a).sub(b); const len = _v.length();
  m.quaternion.setFromUnitVectors(_u, _v.divideScalar(len));
  m.scale.set(1, len, 1);
}
// two-bone IK: returns the knee/elbow for hip a, foot b, lengths l1 l2, bending toward pole direction
function ik(a, b, l1, l2, pole) {
  const d = _t1.copy(b).sub(a); let len = d.length();
  len = Math.min(len, (l1 + l2) * 0.999);
  const u = d.normalize();
  const x = (l1 * l1 - l2 * l2 + len * len) / (2 * len);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const n = _t2.copy(pole).addScaledVector(u, -pole.dot(u)).normalize();
  return new THREE.Vector3().copy(a).addScaledVector(u, x).addScaledVector(n, h);
}
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3();

// ---------- petals + motes ----------
function buildParticles(scene) {
  const R = rng(777);
  const N = 900;
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.03); shape.bezierCurveTo(0.03, -0.015, 0.028, 0.02, 0.006, 0.03); shape.lineTo(0, 0.022); shape.lineTo(-0.006, 0.03); shape.bezierCurveTo(-0.028, 0.02, -0.03, -0.015, 0, -0.03);
  const geo = new THREE.ShapeGeometry(shape, 3);
  const petals = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: C('#ffffff'), side: THREE.DoubleSide, emissive: C('#f7b8c8'), emissiveIntensity: 0.55 }), N);
  const pal = ['#ffd7e2', '#f9b9cc', '#ffe9ef', '#f3a6bf'];
  const seeds = [];
  for (let i = 0; i < N; i++) {
    seeds.push({ x: -5 + R() * 11, y: R() * 6, z: 12 - R() * 58, fall: 0.25 + R() * 0.3, drift: 0.2 + R() * 0.45, sw: 0.3 + R() * 0.6, ph: R() * 6.28, fq: 0.6 + R() * 1.2, rx: R() * 6, ry: R() * 6, spin: 1.2 + R() * 2.5, s: 1.1 + R() * 1.0 });
    petals.setColorAt(i, C(pal[i % 4]));
  }
  petals.frustumCulled = false;
  scene.add(petals);
  // fireflies / golden motes
  const M = 220, mp = new Float32Array(M * 3), mph = new Float32Array(M), msz = new Float32Array(M);
  const mseeds = [];
  for (let i = 0; i < M; i++) {
    const side = R() < 0.5 ? -1 : 1;
    mseeds.push({ x: side * (2.2 + R() * 16), y: 0.3 + R() * 2.4, z: 10 - R() * 90, ph: R() * 6.28, f: 0.5 + R() * 1.1, a: 0.1 + R() * 0.25 });
    mph[i] = R() * 6.28; msz[i] = 0.6 + R() * 0.8;
  }
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3).setUsage(THREE.DynamicDrawUsage));
  mg.setAttribute('aPh', new THREE.BufferAttribute(mph, 1));
  mg.setAttribute('aSz', new THREE.BufferAttribute(msz, 1));
  const mm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uScale: { value: 540 } },
    vertexShader: `attribute float aPh; attribute float aSz; uniform float uT; uniform float uScale; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
        vA = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uT * 2.2 + aPh * 3.0), 2.0);
        gl_PointSize = clamp(aSz * uScale * 0.06 / -mv.z, 1.5, 14.0); }`,
    fragmentShader: `varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); float a = smoothstep(0.5, 0.0, r); a = a * a; gl_FragColor = vec4(vec3(1.0, 0.86, 0.52) * a * vA * 1.4, 1.0); }`,
  });
  const motes = new THREE.Points(mg, mm); motes.frustumCulled = false;
  scene.add(motes);
  S.petals = { mesh: petals, seeds };
  S.motes = { pts: motes, seeds: mseeds, mat: mm };
}

// ---------- the DOM ----------
function buildDom(section) {
  section.innerHTML = `
<div class="rd-win">
  <div class="rd-view"></div>
  <div class="rd-grade"></div>
  <div class="rd-sun"></div>
  <div class="rd-hud"><div class="rd-speed"><b class="rd-kmh">19</b><span>km/h</span></div><div class="rd-dist"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="16" r="3.6"/><circle cx="18" cy="16" r="3.6"/><path d="M6 16l4-7h5l3 7M10 9l-1.6-2.4H6.5M13.4 16L10 9"/></svg><span class="rd-km">2.40 km</span></div></div>
</div>`;
  const q = (s) => section.querySelector(s);
  return { win: q('.rd-win'), view: q('.rd-view'), hud: q('.rd-hud'), kmh: q('.rd-kmh'), km: q('.rd-km'), sun: q('.rd-sun') };
}

export default {
  id: 'ride',
  dur: 6,

  mount(section, ctx) {
    S = { W: 0 };
    S.dom = buildDom(section);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    S.renderer = renderer;
    S.dom.view.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const skyScene = new THREE.Scene();
    S.scene = scene;
    const camera = new THREE.PerspectiveCamera(46, 864 / H, 0.1, 4000);
    S.camera = camera;

    buildWorld(scene, skyScene);
    buildRider(scene);
    buildParticles(scene);

    // lights
    scene.add(new THREE.HemisphereLight(C('#c9b9ec'), C('#8a7656'), 1.35));
    const sun = new THREE.DirectionalLight(C('#ffc58c'), 3.1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 13; sc.bottom = -13; sc.near = 1; sc.far = 260;
    sun.shadow.intensity = 0.62; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.035; sun.shadow.radius = 3;
    scene.add(sun); scene.add(sun.target);
    S.sun = sun;
    const fill = new THREE.DirectionalLight(C('#ffd9cf'), 0.55); fill.position.set(0.3, 0.6, 1); scene.add(fill);

    // environment: the sky, hills and Fuji baked into a PMREM for the paddy reflections
    const pm = new THREE.PMREMGenerator(renderer);
    const env = pm.fromScene(skyScene, 0, 1, 5000).texture;
    S.waterMat.envMap = env; S.waterMat.needsUpdate = true;
    pm.dispose();

    this.ready = (async () => {
      this.render(1.2, ctx || { W: 864 });
      renderer.compile(scene, camera);
      this.render(0, ctx || { W: 864 });
      const gl = renderer.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    })();
  },

  render(lt, ctx) {
    if (!S) return;
    const t = clamp(lt, 0, 6);
    const W = (ctx && ctx.W) || 864;
    const { renderer, camera, scene } = S;
    // the stage is CSS-scaled to the viewport (1.25x in the 1080x1350 4x5 export), so the drawing buffer follows it
    const pr = Math.min(Math.max((window.devicePixelRatio || 1) * Math.min(innerWidth / W, innerHeight / H), 1), 2);
    if (S.pr !== pr) { S.pr = pr; renderer.setPixelRatio(pr); S.W = 0; }
    if (S.W !== W) {
      S.W = W;
      renderer.setSize(W, H, true);
      camera.aspect = W / H;
      // portrait frames see a narrower slice, so widen the vertical fov a touch there
      camera.fov = W / H < 1 ? 50 : 40;
      camera.updateProjectionMatrix();
      S.motes.mat.uniforms.uScale.value = H * renderer.getPixelRatio();
    }

    // ---- reveal: the chat card's rect (538px band, r27) opens to the full frame ----
    const e = emphasized(seg(t, 0, 0.55));
    const inset = lerp(CARD_INSET, 0, e), rad = lerp(27, 0, e);
    S.dom.win.style.clipPath = e >= 1 ? 'none' : `inset(${inset.toFixed(2)}px 0px ${inset.toFixed(2)}px 0px round ${rad.toFixed(2)}px)`;
    const hudA = seg(t, 0.7, 1.2);
    S.dom.hud.style.opacity = hudA.toFixed(3);
    S.dom.hud.style.transform = `translateY(${((1 - smooth(hudA)) * 10).toFixed(2)}px)`;

    // ---- ride ----
    const dist = SPEED * t;
    const rz = -dist;
    const r = S.rider;
    const theta = Math.PI * 2 * CADENCE * t + 0.4;
    r.bike.position.set(RIDER_X + 0.05 * Math.sin(t * 0.7), 0, rz);
    r.bike.rotation.set(0, 0.012 * Math.sin(t * 0.7 + 1), 0.018 * Math.sin(theta));
    r.wR.rotation.x = -dist / WHEEL_R;
    r.wF.rotation.x = -dist / WHEEL_R;
    r.crank.rotation.x = -theta;
    r.arms[0].rotation.x = 0; r.arms[1].rotation.x = Math.PI;
    // pedals in bike-local space
    const ped = [0, 1].map((k) => { const a = theta + k * Math.PI; return new THREE.Vector3(k ? -0.13 : 0.13, r.BB[1] + 0.17 * Math.cos(a), r.BB[2] - 0.17 * Math.sin(a)); });
    ped.forEach((p, k) => { r.pedals[k].position.copy(p); });
    // pelvis bob + torso sway
    const bob = 0.01 * Math.sin(2 * theta);
    r.pelvis.position.set(0, 1.0 + bob, 0.32);
    r.pelvis.rotation.set(0, 0, -0.02 * Math.sin(theta));
    r.torso.rotation.set(-0.36 + 0.015 * Math.sin(2 * theta + 0.5), 0.03 * Math.sin(theta), 0.02 * Math.sin(theta));
    // she glances left over the paddies toward the sun, then back to the road
    const look = smooth(seg(t, 1.4, 2.4)) * (1 - smooth(seg(t, 3.3, 4.2)));
    r.head.rotation.set(0.28 - 0.08 * look, 0.55 * look, 0.05 * look);
    // ponytail swings with the pedal rhythm, trailing a touch in the wind
    r.tailSegs.forEach((g, i) => { g.rotation.set(0.35 + 0.1 * i + 0.06 * Math.sin(2 * theta - i * 0.7), 0, 0.12 * Math.sin(theta - i * 0.6)); });
    scene.updateMatrixWorld(true);
    // legs (IK in bike space)
    const toBike = new THREE.Matrix4().copy(r.bike.matrixWorld).invert();
    const hipW = [new THREE.Vector3(0.095, -0.02, 0.0), new THREE.Vector3(-0.095, -0.02, 0.0)].map((h) => h.applyMatrix4(r.pelvis.matrixWorld).applyMatrix4(toBike));
    const knees = [];
    r.legs.forEach((L, k) => {
      const hip = hipW[k];
      const ankle = ped[k].clone().add(new THREE.Vector3(0, 0.07, 0.035));
      const knee = ik(hip, ankle, 0.47, 0.47, new THREE.Vector3(k ? -0.08 : 0.08, 0.25, -1));
      knees.push(knee);
      between(L.thigh, hip, knee);
      const sockTop = knee.clone().lerp(ankle, 0.72);
      between(L.shin, knee, sockTop);
      between(L.sock, sockTop, ankle);
      L.knee.position.copy(knee);
      L.shoe.position.copy(ped[k]).add(new THREE.Vector3(0, 0.035, -0.02));
      L.shoe.rotation.set(0.12 * Math.sin(theta + k * Math.PI), 0, 0);
    });
    // arms to the grips
    const shW = [new THREE.Vector3(0.165, 0.43, 0.0), new THREE.Vector3(-0.165, 0.43, 0.0)].map((h) => h.applyMatrix4(r.torso.matrixWorld).applyMatrix4(toBike));
    r.armsR.forEach((A, k) => {
      const sx = k ? -1 : 1;
      const grip = new THREE.Vector3(sx * 0.27, 1.05, -0.15);
      const el = ik(shW[k], grip, 0.29, 0.28, new THREE.Vector3(sx * 0.35, -0.8, 0.5));
      const mid = shW[k].clone().lerp(el, 0.18);
      between(A.up, shW[k], el); between(A.lo, el, grip);
      A.sleeve.position.copy(mid); A.sleeve.scale.set(1, 1.05, 1);
      A.elbow.position.copy(el); A.hand.position.copy(grip);
    });
    // skirt drape: push the fabric out of the thighs
    {
      const pos = r.skirt.geometry.attributes.position;
      const pInv = new THREE.Matrix4().copy(r.pelvis.matrixWorld).invert().multiply(r.bike.matrixWorld);
      const segs = [0, 1].map((k) => [hipW[k].clone().applyMatrix4(pInv), knees[k].clone().applyMatrix4(pInv)]);
      const v = new THREE.Vector3(), ab = new THREE.Vector3(), cp = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.copy(r.skirtRest[i]);
        const down = clamp(-v.y / 0.43);
        for (const [a, b] of segs) {
          ab.copy(b).sub(a);
          const f = clamp(v.clone().sub(a).dot(ab) / ab.lengthSq());
          cp.copy(a).addScaledVector(ab, f);
          const d = v.distanceTo(cp), R0 = 0.085 + 0.02 * f;
          if (d < R0) v.copy(cp).addScaledVector(v.clone().sub(cp).normalize(), R0);
        }
        // gravity + a little wind: the hem lifts back
        v.z += down * down * 0.05; v.y += down * 0.02 * Math.sin(theta * 2 + v.x * 12);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true;
      r.skirt.geometry.computeVertexNormals();
    }

    // ---- camera: a slow drifting chase ----
    const u = smooth(t / 6);
    // the torii beat: pull back and sink low so the gate frames her as she rides through it
    const gate = smooth(seg(t, 2.4, 3.7)) * (1 - smooth(seg(t, 4.9, 6.0)));
    const az = lerp(0.17, -0.13, u);
    const dCam = lerp(5.3, 5.0, u) - 0.15 * Math.sin(t * 0.8) + 1.5 * gate;
    const hCam = 1.9 + 0.12 * Math.sin(t * 0.55 + 0.4) - 0.1 * u - 0.55 * gate;
    const px = RIDER_X + Math.sin(az) * dCam, pz = rz + Math.cos(az) * dCam;
    const bobCam = 0.02 * Math.sin(t * 1.3);
    camera.position.set(px, hCam + bobCam, pz);
    const tilt = 1 - smooth(seg(t, 0, 1.3));
    const tgt = new THREE.Vector3(RIDER_X - 0.1 * Math.sin(az), 1.28 + 0.75 * gate - 0.85 * tilt, rz - 4.0);
    camera.lookAt(tgt);
    camera.rotateZ(0.012 * Math.sin(t * 0.5));
    if (camera.aspect < 1) camera.setViewOffset(W, H, 0, 0, W, H); else camera.clearViewOffset();

    // ---- sun + shadow box (snapped to texels so shadows never swim) ----
    {
      const sun = S.sun;
      const f = SUN_DIR.clone().negate();
      const right = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
      const up = new THREE.Vector3().crossVectors(right, f);
      const T = new THREE.Vector3(RIDER_X, 0, rz - 9);
      const texR = 48 / 2048, texU = 26 / 2048;
      const tr = Math.round(T.dot(right) / texR) * texR, tu = Math.round(T.dot(up) / texU) * texU, tf = T.dot(f);
      const Ts = right.multiplyScalar(tr).add(up.multiplyScalar(tu)).add(f.multiplyScalar(tf));
      sun.target.position.copy(Ts);
      sun.position.copy(Ts).addScaledVector(SUN_DIR, 120);
      sun.target.updateMatrixWorld();
    }

    // ---- petals ----
    {
      const { mesh, seeds } = S.petals;
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
      seeds.forEach((sd, i) => {
        const yRange = 6.2;
        let y = sd.y - sd.fall * t;
        y = ((y % yRange) + yRange) % yRange + 0.05;
        const x = sd.x + sd.drift * t + sd.sw * Math.sin(sd.fq * t + sd.ph) * 0.4;
        const z = sd.z + 0.25 * Math.cos(sd.fq * 0.7 * t + sd.ph);
        p.set(x, y, z);
        e3.set(sd.rx + sd.spin * t, sd.ry + sd.spin * 0.7 * t, 0.5 * Math.sin(sd.fq * t));
        q.setFromEuler(e3);
        const fadeLow = clamp(y / 0.3), near = clamp((p.distanceTo(camera.position) - 0.9) / 1.6);
        sc.setScalar(sd.s * fadeLow * near);
        m.compose(p, q, sc);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    // ---- motes ----
    {
      const { pts, seeds, mat } = S.motes;
      const a = pts.geometry.attributes.position;
      seeds.forEach((sd, i) => a.setXYZ(i, sd.x + sd.a * Math.sin(sd.f * t + sd.ph), sd.y + sd.a * Math.sin(sd.f * 1.3 * t + sd.ph * 2), sd.z + sd.a * Math.cos(sd.f * 0.8 * t + sd.ph)));
      a.needsUpdate = true;
      mat.uniforms.uT.value = t;
    }

    // ---- sun glare overlay: follow the projected sun ----
    {
      const sp = camera.position.clone().addScaledVector(SUN_DIR, 1000).project(camera);
      const x = (sp.x * 0.5 + 0.5) * W, y = (-sp.y * 0.5 + 0.5) * H;
      S.dom.sun.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      S.dom.sun.style.opacity = sp.z < 1 ? '1' : '0';
    }

    // ---- HUD ----
    const kmh = 19 + Math.round(Math.sin(t * 0.9) * 0.6);
    S.dom.kmh.textContent = String(kmh);
    S.dom.km.textContent = (2.4 + dist / 1000).toFixed(2) + ' km';

    renderer.render(scene, camera);
  },
};
