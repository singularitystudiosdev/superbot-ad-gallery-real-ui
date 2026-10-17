// The game variant's runner: one WebGL canvas drawing a behind-the-back endless runner starring the zombie
// (models/zombie-3d.9e82faf1.glb) on a night graveyard path. draw({ g }) is a pure function of g, the game seconds since
// the card booted: the zombie's run, the camera, the graves, the brains and their pickup pops are all closed-form in g
// over a fixed course table (no accumulated simulation, no clock, no randomness), so a frozen ?t= frame is exact. The
// run plays itself: the ad spot has no input, its keys belong to the spot's clock. gameState(g) is the same course read
// as the HUD's numbers. three.js loads on first use; `ready` settles once the first frame is drawn.
import { lerp, seg, clamp, esc } from '../../../lib.9b47fc30.js';

const CSS_W = 236, CSS_H = Math.round(236 * 1024 / 870); // the meme card's footprint (chat.css .qc-img)
const PIXEL_RATIO = 2.5;  // stays crisp under the stage scale and the camera push
const FOV = 50;
const NIGHT = 0x1a2124;   // clear colour and fog
const GROUND = 0x1f2725, PATH = 0x343b38, DASH = 0x4b524e, STONE = 0x8a8f94, BRAIN = 0xf2a7b8, LIGHT = 0xe3e3e3;
const SPEED = 9;          // units per second once up to speed
const RAMP = 0.25;        // seconds of ease-in from the boot
const LANE = 1.1;         // lane spacing: x in { -LANE, 0, LANE }
const ZOMBIE_H = 0.9;
const POP = 0.15;         // a collected brain scales up to 1.3x and fades over this long
const HOP = 1.6;          // distance per stride

// the lane changes of the run, in game seconds: at `at` the zombie starts moving to `to` over `dur`
const MOVES = [
  { at: 0.5, dur: 0.28, to: LANE },
  { at: 1.35, dur: 0.3, to: -LANE },
  { at: 2.1, dur: 0.3, to: 0 },
];
// gravestones and brains as (distance along the path, x); tilts are fixed so the graves lean like old ones
const GRAVES = [[6, 0, 0.06], [14.4, LANE, -0.05], [19, LANE, 0.04], [26, -LANE, -0.07], [32, 0, 0.05], [38, LANE, -0.04]];
const BRAINS = [[2.2, 0], [3.4, 0], [7.2, LANE], [8.4, LANE], [9.6, LANE], [15.6, -LANE], [16.8, -LANE], [22, 0], [23.4, 0], [24.8, 0], [29, 0], [30.4, 0], [34, 0], [35.4, 0]];
const POSTS = 20, POST_GAP = 2.5, POST_X = 2.3;

const smooth = (f) => f * f * (3 - 2 * f);

/** distance run at game second g: eases in over RAMP, then steady */
export const distAt = (g) => (g <= 0 ? 0 : g < RAMP ? (SPEED * g * g) / (2 * RAMP) : (SPEED * RAMP) / 2 + SPEED * (g - RAMP));
/** the game second the zombie has run distance d */
const gAt = (d) => (d <= (SPEED * RAMP) / 2 ? Math.sqrt((2 * RAMP * d) / SPEED) : RAMP + (d - (SPEED * RAMP) / 2) / SPEED);
/** the zombie's x at game second g: lane to lane on smoothed steps */
export function laneX(g) {
  let x = 0;
  for (const m of MOVES) x = lerp(x, m.to, smooth(seg(g, m.at, m.at + m.dur)));
  return x;
}

// a brain is collected when the zombie's lane at the moment it passes is within reach of the brain's lane
const REACH = 1.4; // a brain is taken as the zombie closes to within this of it, so the pop plays ahead of the body
const PASS = BRAINS.map(([d]) => gAt(d - REACH));
const TAKEN = BRAINS.map(([, x], i) => Math.abs(laneX(gAt(BRAINS[i][0])) - x) < 0.55);

/** the HUD's numbers at game second g */
export function gameState(g) {
  g = Math.max(0, g);
  let brains = 0;
  BRAINS.forEach((_, i) => { if (TAKEN[i] && g >= PASS[i]) brains++; });
  return { score: Math.floor(distAt(g) * 10) + 100 * brains, brains };
}

// The code view of the same game: what Gemini "writes" before the card boots. codeFrame(n) is the first n characters,
// highlighted, with the caret after the last one, and the caret's line so the view can scroll to keep it in sight.
export const CODE_ROWS = 16;          // lines the view shows at once (chat.css .qc-lines)
export const CODE_LINE_H = 8.5 * 1.45; // px per line (chat.css .qc-lines font)
const CODE = [
  '// zombie-run.js: the graveyard run',
  "import * as THREE from 'three';",
  "import { loadGLB } from './loader.js';",
  '',
  'const LANES = [-1.1, 0, 1.1];',
  'const SPEED = 9;',
  'let lane = 1, score = 0, dist = 0;',
  '',
  "const zombie = await loadGLB('z.glb');",
  'zombie.rotation.y = Math.PI;',
  'scene.add(zombie);',
  'spawnGraves(); spawnBrains();',
  '',
  'function update(dt) {',
  '  dist += SPEED * dt;',
  '  zombie.position.x = lerp(',
  '    zombie.position.x, LANES[lane], 0.2);',
  '  zombie.position.y =',
  '    Math.abs(Math.sin(dist * 2)) * 0.18;',
  '  for (const g of graves)',
  '    if (hit(zombie, g)) return lose();',
  '  for (const b of brains) {',
  '    if (!hit(zombie, b)) continue;',
  '    b.pop();',
  '    score += 100;',
  '  }',
  '}',
  '',
  'renderer.setAnimationLoop(update);',
].join('\n');
export const CODE_CHARS = CODE.length;

// [class, text] runs: the first match at each position wins, so a comment swallows the quotes inside it
const TOKEN = /(\/\/.*)|('[^']*')|(\b\d+(?:\.\d+)?\b)|\b(import|from|const|let|function|for|if|of|await|return|continue|new)\b/g;
const CLASS = [null, 'qc-c', 'qc-s', 'qc-n', 'qc-k'];
const RUNS = [];
{
  let at = 0, m;
  while ((m = TOKEN.exec(CODE))) {
    if (m.index > at) RUNS.push(['', CODE.slice(at, m.index)]);
    RUNS.push([CLASS[m.slice(1).findIndex(Boolean) + 1], m[0]]);
    at = m.index + m[0].length;
  }
  if (at < CODE.length) RUNS.push(['', CODE.slice(at)]);
}

export function codeFrame(n) {
  n = clamp(Math.round(n), 0, CODE_CHARS);
  let html = '', left = n;
  for (const [cls, text] of RUNS) {
    if (left <= 0) break;
    const part = esc(text.slice(0, left));
    html += cls ? `<span class="${cls}">${part}</span>` : part;
    left -= text.length;
  }
  return { html: `${html}<i class="qc-caret"></i>`, line: (CODE.slice(0, n).match(/\n/g) || []).length };
}

export function makeZombieGame(canvas, url) {
  let paint = null, want = null, lastKey = '';
  const draw = (s) => {
    want = s;
    if (!paint) return;
    const g = Math.max(0, s.g);
    const key = g.toFixed(3);
    if (key === lastKey) return;
    lastKey = key;
    paint(g);
  };
  const ready = setup(canvas, url).then((fn) => { paint = fn; draw(want || { g: 0 }); });
  ready.catch((e) => console.error('Zombie game failed to load', e));
  return { ready, draw };
}

async function setup(canvas, url) {
  const THREE = await import('three');
  const { GLTFLoader } = await import('../../../vendor/three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(PIXEL_RATIO);
  renderer.setSize(CSS_W, CSS_H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(NIGHT, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(NIGHT, 6, 22);
  scene.add(new THREE.HemisphereLight(LIGHT, NIGHT, 1.6));
  const key = new THREE.DirectionalLight(LIGHT, 2.2);
  key.position.set(1.5, 3, 3);
  scene.add(key);

  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...extra });

  // the ground, the path, and its lane dashes
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 120), std(GROUND));
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -50;
  const path = new THREE.Mesh(new THREE.PlaneGeometry(LANE * 3 + 0.2, 120), std(PATH));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.002, -50);
  scene.add(ground, path);
  const dashGeo = new THREE.PlaneGeometry(0.06, 1.2), dashMat = std(DASH);
  for (const x of [-LANE / 2, LANE / 2]) {
    for (let i = 0; i < 40; i++) {
      const d = new THREE.Mesh(dashGeo, dashMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(x, 0.004, 3 - i * 2.4);
      scene.add(d);
    }
  }

  // iron fence posts and small crosses on both sides, for the sense of speed
  const postGeo = new THREE.BoxGeometry(0.08, 0.7, 0.08), barGeo = new THREE.BoxGeometry(0.36, 0.07, 0.07), ironMat = std(DASH);
  for (const side of [-1, 1]) {
    for (let i = -2; i < POSTS * 2; i++) {
      const z = 3 - i * POST_GAP + (side > 0 ? POST_GAP / 2 : 0);
      const post = new THREE.Mesh(postGeo, ironMat);
      post.position.set(side * POST_X, 0.35, z);
      scene.add(post);
      if ((i + (side > 0 ? 1 : 0)) % 3 === 0) {
        const bar = new THREE.Mesh(barGeo, ironMat);
        bar.position.set(side * POST_X, 0.5, z);
        scene.add(bar);
      }
    }
  }

  // gravestones: an arched slab, 0.6 wide, 0.75 tall, 0.15 deep
  const slab = new THREE.Shape();
  slab.moveTo(-0.3, 0); slab.lineTo(0.3, 0); slab.lineTo(0.3, 0.45);
  slab.absarc(0, 0.45, 0.3, 0, Math.PI, false);
  slab.lineTo(-0.3, 0);
  const graveGeo = new THREE.ExtrudeGeometry(slab, { depth: 0.15, bevelEnabled: false });
  graveGeo.translate(0, 0, -0.075);
  const graveMat = std(STONE);
  for (const [d, x, tilt] of GRAVES) {
    const grave = new THREE.Mesh(graveGeo, graveMat);
    grave.position.set(x, 0, -d);
    grave.rotation.z = tilt;
    scene.add(grave);
  }

  // brains: squashed pink spheres that spin and bob, and pop when taken
  const brainGeo = new THREE.SphereGeometry(0.14, 20, 14);
  const brains = BRAINS.map(([d, x]) => {
    const mat = std(BRAIN, { emissive: BRAIN, emissiveIntensity: 0.18, transparent: true });
    const m = new THREE.Mesh(brainGeo, mat);
    m.scale.set(1.15, 0.85, 0.95);
    m.position.set(x, 0.45, -d);
    scene.add(m);
    return m;
  });

  // the zombie: ZOMBIE_H tall, feet on y = 0, facing away from the camera (the model's front already looks down -z)
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const k = ZOMBIE_H / size.y;
  model.scale.setScalar(k);
  model.position.set(-centre.x * k, -box.min.y * k, -centre.z * k);
  const face = new THREE.Group();
  face.add(model);
  const runner = new THREE.Group();
  runner.rotation.order = 'YXZ';
  runner.add(face);
  scene.add(runner);

  // a soft contact shadow that stays on the ground while the zombie hops
  const shadow = contactShadow(THREE);
  scene.add(shadow);

  const camera = new THREE.PerspectiveCamera(FOV, CSS_W / CSS_H, 0.05, 60);

  return (g) => {
    const d = distAt(g), x = laneX(g);
    const vx = (laneX(g + 0.01) - laneX(g - 0.01)) / 0.02; // sideways speed, for the lean into a lane change
    const stride = (d * Math.PI) / HOP;
    const hop = Math.abs(Math.sin(stride)) * 0.18 * clamp(d / 0.6);
    const sway = Math.sin(stride) * 0.04;
    runner.position.set(x + sway, hop, -d);
    runner.rotation.y = -vx * 0.05;
    runner.rotation.x = -0.12;
    runner.rotation.z = -vx * 0.025 + Math.sin(stride) * 0.06;
    shadow.position.set(x + sway, 0.006, -d);
    shadow.scale.setScalar(1 - hop * 1.2);
    shadow.material.opacity = 1 - hop * 1.6;

    brains.forEach((m, i) => {
      const q = TAKEN[i] ? (g - PASS[i]) / POP : -1;
      m.visible = q < 1;
      const pop = q > 0 ? lerp(1, 1.3, q) : 1;
      m.scale.set(1.15 * pop, 0.85 * pop, 0.95 * pop);
      m.material.opacity = q > 0 ? 1 - q : 1;
      m.rotation.y = g * 2.2 + i;
      m.position.y = 0.45 + Math.sin(g * 4 + i) * 0.05 + (q > 0 ? q * 0.3 : 0);
    });

    // the camera trails the zombie's lane by 0.12 s
    const cx = laneX(g - 0.12);
    camera.position.set(cx * 0.85, 2, -d + 2.8);
    camera.lookAt(cx * 0.6, 0, -d - 4.5);
    renderer.render(scene, camera);
  };
}

function contactShadow(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  return shadow;
}
