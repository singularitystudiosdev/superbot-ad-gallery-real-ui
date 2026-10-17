// Dancing-cat GIF beat (the 'catgif' variant): asked "Make a GIF of a dancing cat", Gemini answers with a square GIF card.
// The card shimmers as a skeleton while "Creating GIF" counts up, the first frame resolves out of a blur, then the GIF
// loops: the CC0 cat (Quaternius, the same model the catsurf variant rides a wave) dances on a light-up disco floor under
// a mirror ball and two swinging spotlights, rendered by three.js. The dance is procedural, built on the rig's bones over
// the rest pose at 125 BPM: a loop is exactly 8 beats = 3.84 s = 48 frames at 12.5 fps (GIF delay 8 cs), six frames to
// the beat. Every frame is a pure function of the loop's time tt = frame / 12.5 (bounce, sway, head bob, paws, tail, the
// hop and 360 degree spin on beats 7 to 8, the floor, the ball, the specks, the beams), so a frozen ?t= frame, the
// timeline's seeks and the exported file all draw the same pictures, and the card steps at the GIF's own frame rate.
// The card's download icon is a real export: it renders the 48 frames offscreen at 480 x 480, encodes them with the
// self-contained encoder in ./gif-encode.df575a7c.js and saves dancing-cat.gif; window.__catgifEncode() runs the same
// export and resolves with the Blob. Nothing renders offscreen unless asked. Squeezed into the window the Gemini beat
// leaves (times(r, end)) so every variant loops the same length; its stylesheet (../catgif.df575a7c.css) loads with
// the module. Sources: models/CREDITS.txt.
import { lerp, seg, outCubic } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { encodeGif } from './gif-encode.df575a7c.js';
// the Share control every output card carries (share.29a362ea.js), left of the card's download button
import { SHARE_GLYPH, shareAttrs } from './share.29a362ea.js';

const SAY = 'Here’s your GIF of a dancing cat.';
const CSS = new URL('../catgif.df575a7c.css?v=1', import.meta.url).href;
const CAT = new URL('../../../models/cat.e2265c3a.glb', import.meta.url).href;
const GLTF = '../../../vendor/three/examples/jsm/loaders/GLTFLoader.js';

const SIZE = 480;                 // the render's pixel size (square), and the GIF's
const BPM = 125;
const FPS = 12.5;                 // 8 cs per frame
const BEATS = 8;
const FRAMES = 48;                // 8 beats x 6 frames
const LOOP = FRAMES / FPS;        // 3.84 s, 8 beats at 125 BPM
const DELAY = 8;                  // GIF frame delay, centiseconds
const FOV = 34;
const PAL = [0xff3d9a, 0x27d3f5, 0xffd93b, 0x7a4dff]; // the dance floor's four colours

const TAU = Math.PI * 2;
const fract = (x) => x - Math.floor(x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };

const mulberry32 = (a) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---- the render: one WebGL canvas, drawn by paint(tt) ---------------------------------------------------------------
async function setup(canvas) {
  const THREE = await import('three');
  const { GLTFLoader } = await import(GLTF);
  const gltf = await new GLTFLoader().loadAsync(CAT);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const BACK = new THREE.Color(0x0a0a14);
  scene.background = BACK;
  scene.fog = new THREE.Fog(0x0a0a14, 7.5, 15.5);

  // ---- the stage -----------------------------------------------------------------------------------------------------
  // dance floor: a grid of flat tiles, each lit from a 4-colour set that steps along on the beat
  const N = 11, TILE = 0.82, GAP = 0.07, FZ = -1.2;
  const tileGeo = new THREE.PlaneGeometry(TILE - GAP, TILE - GAP);
  tileGeo.rotateX(-Math.PI / 2);
  const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), N * N);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    m4.makeTranslation((i - (N - 1) / 2) * TILE, 0, FZ + (j - (N - 1) / 2) * TILE);
    tiles.setMatrixAt(i * N + j, m4);
  }
  tiles.setColorAt(0, new THREE.Color(0));
  tiles.frustumCulled = false;
  scene.add(tiles);
  const palette = PAL.map((h) => new THREE.Color(h));
  const tc = new THREE.Color();

  // backdrop: a dark wall, a touch lighter toward the top
  const WALL_Z = -6.4;
  const wallGeo = new THREE.PlaneGeometry(40, 16, 1, 1);
  const wallCol = [0.09, 0.07, 0.17, 0.09, 0.07, 0.17, 0.035, 0.035, 0.07, 0.035, 0.035, 0.07]; // top two, then bottom two (rgb)
  wallGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(wallCol), 3));
  const wall = new THREE.Mesh(wallGeo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  wall.position.set(0, 7, WALL_Z - 0.02);
  scene.add(wall);

  // the mirror ball: a flat-shaded icosahedron whose facet colours come from where each facet faces, plus a glint that
  // runs round the facets; a pale speck per facet is cast onto the backdrop from the ball's own spin
  const BALL = new THREE.Vector3(0.1, 3.05, -1.7), BALL_R = 0.42;
  const ballGeo = new THREE.IcosahedronGeometry(BALL_R, 1);
  const nFace = ballGeo.attributes.position.count / 3;
  const fN = [], fSeed = [];
  {
    const p = ballGeo.attributes.position, c = new THREE.Vector3();
    const rnd = mulberry32(0xdf575a7c);
    for (let f = 0; f < nFace; f++) {
      c.set(0, 0, 0);
      for (let k = 0; k < 3; k++) c.x += p.getX(f * 3 + k), c.y += p.getY(f * 3 + k), c.z += p.getZ(f * 3 + k);
      fN.push(c.clone().normalize());
      fSeed.push(rnd());
    }
  }
  const ballCol = new Float32Array(nFace * 9);
  ballGeo.setAttribute('color', new THREE.BufferAttribute(ballCol, 3));
  const ball = new THREE.Mesh(ballGeo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  ball.position.copy(BALL);
  scene.add(ball);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 6, 6), new THREE.MeshBasicMaterial({ color: 0x3a3a52, fog: false }));
  cord.position.set(BALL.x, BALL.y + BALL_R + 3, BALL.z);
  scene.add(cord);
  const specks = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), nFace);
  specks.frustumCulled = false;
  const SPECK = [0xcfd8ff, 0xff9ad0, 0x9ae8ff, 0xffe9a0].map((h) => new THREE.Color(h));
  specks.setColorAt(0, SPECK[0]);
  scene.add(specks);

  // two spotlights (magenta, cyan) swing their beams across the floor
  const beams = [];
  for (const [hex, ox] of [[0xff3d9a, -4.6], [0x27d3f5, 4.6]]) {
    const L = 9;
    const geo = new THREE.ConeGeometry(0.95, L, 28, 1, true);
    geo.translate(0, -L / 2, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set(ox, 6.2, -3.4);
    m.frustumCulled = false;
    scene.add(m);
    beams.push(m);
  }

  // ---- light the cat: a white key from the camera side, a magenta and a cyan rim from behind ----------------------------
  scene.add(new THREE.HemisphereLight(0xc9d0ff, 0x2a2040, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(2.5, 4.5, 6);
  const rimM = new THREE.DirectionalLight(0xff3d9a, 1.6);
  rimM.position.set(-5, 2.5, -3);
  const rimC = new THREE.DirectionalLight(0x27d3f5, 1.6);
  rimC.position.set(5, 2.5, -3);
  scene.add(key, rimM, rimC);

  // ---- the cat ------------------------------------------------------------------------------------------------------
  const cat = gltf.scene;
  cat.updateMatrixWorld(true);
  cat.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; if (o.material.map) o.material.map.anisotropy = 4; o.material.roughness = 0.85; o.material.metalness = 0; } });
  // rest frames: each dancing bone turns by a rotation D given in the model's own axes (x right, y up, z toward the camera
  // when the cat faces front): local = parent^-1 * D * parent * rest, so a swing of the shoulder is a swing about world x
  const BONES = ['Body', 'Head', 'Tail', 'Tail_end', 'FrontLegL', 'FrontLegR', 'BackLegL', 'BackLegR'];
  const bone = {};
  for (const n of BONES) {
    const o = cat.getObjectByName(n);
    if (!o) throw new Error(`the cat rig has no bone ${n}`);
    bone[n] = { o, q0: o.quaternion.clone(), P: o.parent.getWorldQuaternion(new THREE.Quaternion()) };
  }
  const D = new THREE.Quaternion(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  const turn = (n, x, y, z) => {
    const b = bone[n];
    D.setFromEuler(E.set(x, y, z, 'YXZ'));
    b.o.quaternion.copy(Q.copy(b.P).invert()).multiply(D).multiply(b.P).multiply(b.q0);
  };
  const dancer = new THREE.Group(); // origin at the feet
  dancer.add(cat);
  scene.add(dancer);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 28), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  scene.add(shadow);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(2.0, 0.95, 5.5);
  camera.lookAt(0, 1.08, 0);

  const wv = new THREE.Vector3(), dir = new THREE.Vector3(), up = new THREE.Vector3(0, -1, 0);
  const spinQ = new THREE.Quaternion();

  // the dance and the stage at loop time tt (seconds). b counts beats, 0 to 8
  return function paint(tt) {
    const b = fract(tt / LOOP) * BEATS;
    const bi = Math.floor(b), p = b - bi;
    const hit = 0.5 + 0.5 * Math.cos(TAU * p);            // 1 on the beat, 0 midway
    const snap = hit * hit * hit;
    const hop = clamp01(b - 7);                           // beats 7 to 8: the hop and the spin
    const sway = Math.sin(TAU * b / 4);                   // left for two beats, right for two

    // body: a snappy down-up on every beat with a small squash, a hip sway, the hop
    const bounce = 0.11 * Math.pow(1 - hit, 0.7);
    const air = 0.62 * Math.sin(Math.PI * hop) * (1 - 0.25 * hop);
    const sq = 0.055 * hit * hit;
    dancer.position.set(0.2 * sway, bounce + air, 0);
    dancer.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    const spin = TAU * smooth(0.1, 0.9, hop);
    dancer.rotation.set(0, spin + 0.25 * sway * (1 - smooth(0, 0.15, hop)), 0.05 * sway);
    turn('Body', 0.07 * hit - 0.02, 0.2 * sway, 0);

    // head: a hard bob down on the beat and back up, a tilt against the sway
    turn('Head', 0.3 * snap + 0.05 * hit - 0.12, -0.18 * sway, -0.3 * sway);

    // paws: the front legs lift in turn on the beats, both go up for the hop; the back legs shuffle
    const lift = Math.pow(Math.sin(Math.PI * p), 0.6);
    const both = bi === 7 ? 1 : 0;
    const lL = (bi % 2 === 0 || both) ? lift : 0, lR = (bi % 2 === 1 || both) ? lift : 0;
    turn('FrontLegL', -0.3 * lL, 0, 2.05 * lL);
    bone.FrontLegL.o.scale.y = 1 + 0.45 * lL;
    turn('FrontLegR', -0.3 * lR, 0, -2.05 * lR);
    bone.FrontLegR.o.scale.y = 1 + 0.45 * lR;
    turn('BackLegL', 0.14 * (bi % 2 === 0 ? lift : 0) + 0.5 * both * lift, 0, 0);
    turn('BackLegR', 0.14 * (bi % 2 === 1 ? lift : 0) + 0.5 * both * lift, 0, 0);

    // tail: a swish with its tip trailing the root
    turn('Tail', 0.22 * Math.cos(TAU * b / 2 + 0.4), 0, 0.5 * Math.sin(TAU * b / 2 + 0.4));
    turn('Tail_end', 0.25 * Math.cos(TAU * b / 2 - 0.5), 0, 0.6 * Math.sin(TAU * b / 2 - 0.5));

    shadow.position.x = dancer.position.x;
    shadow.scale.setScalar(1 - 0.35 * clamp01(air / 0.62));
    shadow.material.opacity = 0.45 - 0.2 * clamp01(air / 0.62);

    // floor: every tile takes one of four colours, the pattern steps one place per beat, and the whole floor flashes on it
    const flash = 0.34 + 0.66 * hit * hit;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const c = ((i + j * 2 + bi + (i >> 1)) % 4 + 4) % 4;
      const d = Math.hypot(i - (N - 1) / 2, j - (N - 1) / 2 + 0.6);
      const k = flash * (1.0 - 0.07 * d) * ((i + j) % 2 ? 1 : 0.8);
      tiles.setColorAt(i * N + j, tc.copy(palette[c]).multiplyScalar(k));
    }
    tiles.instanceColor.needsUpdate = true;

    // ball: one turn a loop, facets shaded by where they face, a glint running round them
    const ang = TAU * (b / BEATS);
    ball.rotation.y = ang;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    let nsp = 0;
    for (let f = 0; f < nFace; f++) {
      const n = fN[f];
      const nx = n.x * ca + n.z * sa, nz = -n.x * sa + n.z * ca, ny = n.y;  // world normal (rotation.y = ang)
      const glint = Math.pow(Math.max(0, Math.sin(TAU * (b / 2 + fSeed[f]))), 8);
      const m = Math.max(0, nx * -0.7 + ny * 0.35 + nz * 0.6), c2 = Math.max(0, nx * 0.7 + ny * 0.35 + nz * 0.6);
      const r = 0.2 + 0.55 * m + 0.1 * c2 + glint * 0.5, g = 0.22 + 0.1 * m + 0.5 * c2 + glint * 0.5, bl = 0.3 + 0.35 * m + 0.55 * c2 + glint * 0.5;
      for (let k = 0; k < 3; k++) { ballCol[f * 9 + k * 3] = r; ballCol[f * 9 + k * 3 + 1] = g; ballCol[f * 9 + k * 3 + 2] = bl; }
      // the speck: this facet's mirror image on the backdrop, when it faces the wall
      if (nz < -0.18) {
        const s = (WALL_Z - BALL.z) / nz;
        const px = BALL.x + nx * s, py = BALL.y + ny * s;
        if (Math.abs(px) < 10 && py > 0.3 && py < 11) {
          const sc = 0.1 + 0.07 * (-nz);
          m4.makeScale(sc, sc, 1);
          m4.setPosition(px, py, WALL_Z);
          specks.setMatrixAt(nsp, m4);
          specks.setColorAt(nsp, SPECK[f % 4]);
          nsp++;
        }
      }
    }
    specks.count = nsp;
    specks.instanceMatrix.needsUpdate = true;
    specks.instanceColor.needsUpdate = true;
    ballGeo.attributes.color.needsUpdate = true;

    // beams: each swings across the floor (a whole number of swings per loop), the cone's axis on the aimed floor point
    beams.forEach((m, i) => {
      const a = TAU * (b / (i ? 4 : 8)) + (i ? 1.3 : 0);
      wv.set((i ? 1 : -1) * 0.4 + 2.6 * Math.sin(a), 0, -2.3 + 1.0 * Math.cos(a));
      dir.copy(wv).sub(m.position).normalize();
      m.quaternion.setFromUnitVectors(up, dir);
    });

    // the rims flicker the colours on the beat
    rimM.intensity = 1.0 + 1.3 * hit;
    rimC.intensity = 1.0 + 1.3 * (1 - hit);

    renderer.render(scene, camera);
  };
}

// one viewer per canvas: draw(frame) paints when the frame changes; ready settles once the first frame can be drawn
export function makeCatGifViewer(canvas) {
  let paint = null, want = null, lastKey = -1;
  const draw = (frame) => {
    want = frame;
    if (!paint || frame === lastKey) return;
    lastKey = frame;
    paint(frame / FPS);
  };
  const ready = setup(canvas).then((fn) => { paint = fn; if (want !== null) draw(want); });
  ready.catch((e) => console.error('dancing cat renderer failed to load', e));
  return { ready, draw, redraw() { lastKey = -1; if (want !== null) draw(want); } };
}

// ---- the beat ---------------------------------------------------------------------------------------------------
const SAVE = '<svg viewBox="0 0 24 24"><path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const later = () => new Promise((r) => setTimeout(r, 0));

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`dancing cat stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

export default {
  // `end` is the base route's end (chat.9b47fc30.js routeBy), so the loop never changes length with the variant
  times(r, end = r + 2.35) {
    const T = { r };
    T.card = r + 0.22;
    T.w0 = r + 0.3; T.w1 = T.w0 + 1.0;
    T.play = T.w1 + 0.15;
    T.end = end;
    return T;
  },
  build(k, x) {
    loadSheet();
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="cg">
      <div class="cg-player">
        <canvas class="cg-canvas" width="${SIZE}" height="${SIZE}" role="img" aria-label="A cat dancing on a disco floor under a mirror ball"></canvas>
        <i class="cg-sh"></i>
        <span class="cg-tag">GIF</span>
        <button type="button" class="cg-share" ${shareAttrs('Dancing cat GIF')}>${SHARE_GLYPH}</button>
        <button type="button" class="cg-save" aria-label="Download GIF">${SAVE}</button>
        <span class="qc-genl">${x.tile('gemini')}Creating GIF<b class="qc-genn"></b></span>
        <i class="cg-prog"><i></i></i>
        <i class="cg-xp"><i></i></i>
      </div>
      <div class="cg-t"><b>dancing-cat.gif</b><small>480 × 480, 48 frames, 3.8 s loop</small></div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    const canvas = $('.cg-canvas'), sh = $('.cg-sh'), tag = $('.cg-tag'), save = $('.cg-save'), share = $('.cg-share'), genl = $('.qc-genl'), pct = $('.qc-genn');
    const prog = $('.cg-prog'), progFill = prog.firstElementChild, xp = $('.cg-xp').firstElementChild;
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let viewer = null, shown = -1, built = -1, frame = -1, exporting = false;
    const ensure = () => {
      if (!viewer) { viewer = makeCatGifViewer(canvas); track(viewer.ready); }
      return viewer;
    };

    // The download: render the 48 frames on a canvas of their own (the card keeps playing), read their pixels, encode
    // them and hand back the GIF. Each step yields to the page; xp shows how far along the export is.
    async function encode() {
      if (exporting) throw new Error('already exporting');
      exporting = true;
      const setXp = (v) => { xp.style.transform = `scaleX(${v.toFixed(3)})`; };
      let off = null, paint = null;
      try {
        off = document.createElement('canvas');
        off.width = off.height = SIZE;
        paint = await setup(off);
        const flat = document.createElement('canvas');
        flat.width = flat.height = SIZE;
        const g = flat.getContext('2d', { willReadFrequently: true });
        const frames = [];
        for (let i = 0; i < FRAMES; i++) {
          paint(i / FPS);
          g.drawImage(off, 0, 0);
          frames.push(g.getImageData(0, 0, SIZE, SIZE).data);
          setXp(0.45 * (i + 1) / FRAMES);
          await later();
        }
        await later();
        const bytes = await encodeGif({
          width: SIZE, height: SIZE, frames, delay: DELAY,
          onFrame: (done, total) => { setXp(0.45 + 0.55 * done / total); return later(); },
        });
        return new Blob([bytes], { type: 'image/gif' });
      } finally {
        exporting = false;
        setXp(0);
        if (off) { const gl = off.getContext('webgl2') || off.getContext('webgl'); const lose = gl && gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); }
      }
    }
    window.__catgifEncode = encode;
    save.addEventListener('click', () => {
      if (exporting) return;
      save.classList.add('cg-busy');
      save.setAttribute('aria-busy', 'true');
      block.classList.add('cg-exporting');
      encode().then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'dancing-cat.gif';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }).catch((e) => console.error('dancing cat download failed', e)).finally(() => {
        save.classList.remove('cg-busy');
        save.removeAttribute('aria-busy');
        block.classList.remove('cg-exporting');
      });
    });

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        const n = Math.min(SAY.length, Math.max(0, Math.floor((t - (T.r + 0.06)) * 70 + 1e-6)));
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // the GIF's clock: frame 0 holds while it is created, then it loops at 12.5 fps from T.play
        const f = Math.floor(((Math.max(0, t - T.play) % LOOP) * FPS) + 1e-6) % FRAMES;
        if (f !== frame) { ensure().draw(f); frame = f; }

        // creating: the skeleton shimmers and the first frame resolves out of a blur as the count reaches 100
        const rp = seg(t, T.w0, T.w1), e = outCubic(rp);
        canvas.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 16).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
        canvas.style.opacity = lerp(0.25, 1, e).toFixed(3);
        sh.style.transform = `translateX(${lerp(-110, 110, ((t - T.card) * 1.1) % 1).toFixed(1)}%)`;
        sh.style.opacity = (rp >= 1 ? 0 : 1 - seg(rp, 0.8, 1)).toFixed(3);
        const p = Math.round(rp * 100);
        if (p !== built) { pct.textContent = `${p}%`; built = p; }
        const label = (1 - seg(t, T.w1 - 0.25, T.w1)).toFixed(3);
        genl.style.opacity = label;
        prog.style.opacity = label;
        progFill.style.transform = `scaleX(${rp.toFixed(3)})`;

        // made: the GIF badge and the download button come up as the loop starts
        const tg = seg(t, T.w1 - 0.1, T.w1 + 0.15);
        tag.style.opacity = tg.toFixed(3);
        const pl = outCubic(seg(t, T.play, T.play + 0.25));
        save.style.opacity = save.classList.contains('cg-busy') ? '' : pl.toFixed(3);
        save.style.pointerEvents = pl > 0.5 ? 'auto' : 'none';
        share.style.opacity = pl.toFixed(3);
        share.style.pointerEvents = pl > 0.5 ? 'auto' : 'none';
      },
    };
  },
};
