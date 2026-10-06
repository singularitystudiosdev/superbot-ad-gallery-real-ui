// Code beat: Claude Opus 5.5 writes the game, as a sped-up replay of an agent run in the grammar of Cursor's agent panel
// (ported from make-minecraft-every-model's beats/opus-code.js): "Thought for 2s", "Listed" and "Read" tool rows,
// file-edit cards whose green diff hunks of real JS stream past with line numbers, collapsed edit rows, a terminal
// block running the tests to "6 passed", and the review bar "8 files changed +N -0" with Undo all / Accept all /
// Review. The transcript is bottom-anchored inside a fixed viewport, so every item that lands pushes the run up the
// way the real panel autoscrolls.
// Every number on screen is counted from the sources below, never typed: a card's +N is the lines it has streamed,
// an edit row's +N is the line count of that file's source, the review bar sums them, and the test counts are the
// it() calls in the two test files.
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else (no Math.random, no layout reads). Item heights are constants in --u units, so the stacking
// is exact at every column width.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Wrote the ride: terrain, sky, bike and sound, all in the browser.';
const REPO_NAME = 'bikeride';

// ---- the game: the four files whose hunks stream past in cards ----
const TERRAIN = `import * as THREE from 'three';

// the country road: a closed spline the bike rides
export const road = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(60, 0, -80),
  new THREE.Vector3(20, 0, -190),
  new THREE.Vector3(-70, 0, -120),
], true);
const samples = road.getSpacedPoints(400);

export function buildTerrain(scene) {
  const geo = new THREE.PlaneGeometry(640, 640, 160, 160);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    // stepped paddy terraces, a raised bank under the road
    const n = Math.sin(x * 0.013) + Math.cos(z * 0.011);
    const terrace = Math.round(n * 2) * 0.35;
    pos.setY(i, distToRoad(x, z) < 4 ? 0.3 : terrace - 0.5);
  }
  geo.computeVertexNormals();
  const grass = new THREE.MeshLambertMaterial({ color: 0x7a9a3c });
  scene.add(new THREE.Mesh(geo, grass));

  // the flooded paddies catch the sky
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(640, 640).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x9fb8c8, roughness: 0.08, metalness: 0.6,
    }),
  );
  water.position.y = -0.2;
  scene.add(water);
}

export function distToRoad(x, z) {
  let best = Infinity;
  for (const p of samples) {
    best = Math.min(best, (p.x - x) ** 2 + (p.z - z) ** 2);
  }
  return Math.sqrt(best);
}`;
const SKY = `import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

// golden hour: a low sun, warm haze, long shadows
export function buildSky(scene, renderer) {
  const sky = new Sky();
  sky.scale.setScalar(4500);
  const u = sky.material.uniforms;
  u.turbidity.value = 6;
  u.rayleigh.value = 2.4;
  u.mieCoefficient.value = 0.006;
  u.mieDirectionalG.value = 0.86;

  const { degToRad } = THREE.MathUtils;
  const sun = new THREE.Vector3()
    .setFromSphericalCoords(1, degToRad(84), degToRad(200));
  u.sunPosition.value.copy(sun);
  scene.add(sky);

  const light = new THREE.DirectionalLight(0xffc38a, 2.2);
  light.position.copy(sun).multiplyScalar(200);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  const fill = new THREE.HemisphereLight(0xffe2b8, 0x3a4a2a, 0.6);
  scene.add(light, fill);

  scene.fog = new THREE.Fog(0xf2c38f, 60, 420);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.55;
  return { sun, light };
}`;
const RIDE = `import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { road } from './terrain.js';

const SPEED = 5.5; // metres a second: an easy pedal
const up = new THREE.Vector3(0, 1, 0);

export async function createRide(scene, camera) {
  const gltf = await new GLTFLoader().loadAsync('assets/bike.glb');
  const bike = gltf.scene;
  scene.add(bike);
  const length = road.getLength();
  const look = new THREE.Vector3();
  const target = new THREE.Vector3();
  let s = 0;

  return function update(dt, t) {
    s = (s + SPEED * dt) % length;
    const u = s / length;
    const p = road.getPointAt(u);
    const ahead = road.getPointAt((u + 0.002) % 1);
    bike.position.copy(p);
    bike.lookAt(ahead);
    // a little sway from the pedals
    bike.rotateOnAxis(up, Math.sin(t * 1.3) * 0.02);

    // the camera trails behind and above the bike
    target.copy(p).sub(ahead).setY(0).normalize();
    target.multiplyScalar(6).add(p);
    target.y += 2.4;
    camera.position.lerp(target, 1 - Math.exp(-3 * dt));
    look.lerp(ahead, 1 - Math.exp(-6 * dt));
    camera.lookAt(look);
    return u;
  };
}`;
const AUDIO = `// the ElevenLabs takes, in Web Audio
const TAKES = [
  'cicadas', 'bike-bell', 'gravel', 'wind-in-the-rice',
];

export async function startAudio() {
  const ctx = new AudioContext();
  const bus = new GainNode(ctx, { gain: 0.8 });
  bus.connect(ctx.destination);
  const buf = {};
  await Promise.all(TAKES.map(async (name) => {
    const res = await fetch(\`assets/audio/\${name}.wav\`);
    const bytes = await res.arrayBuffer();
    buf[name] = await ctx.decodeAudioData(bytes);
  }));
  const loop = (name, gain) => {
    const buffer = buf[name];
    const src = new AudioBufferSourceNode(ctx, { buffer, loop: true });
    const g = new GainNode(ctx, { gain });
    src.connect(g).connect(bus);
    src.start();
    return { src, g };
  };
  loop('cicadas', 0.25);
  const wind = loop('wind-in-the-rice', 0.1);
  const gravel = loop('gravel', 0);

  return {
    // tyre noise and wind follow the speed
    update(speed) {
      const now = ctx.currentTime;
      gravel.g.gain.setTargetAtTime(Math.min(0.4, speed * 0.06), now, 0.1);
      gravel.src.playbackRate.value = 0.8 + speed * 0.05;
      wind.g.gain.setTargetAtTime(0.1 + speed * 0.02, now, 0.3);
    },
    // the bell rings on a tap
    bell() {
      const buffer = buf['bike-bell'];
      const src = new AudioBufferSourceNode(ctx, { buffer });
      src.connect(bus);
      src.start();
    },
  };
}`;

// ---- the files that land as collapsed edit rows: never shown, but their +N is their real line count ----
const INDEX = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bike ride</title>
    <style>html, body { margin: 0; height: 100%; overflow: hidden; background: black; }</style>
  </head>
  <body>
    <canvas id="game"></canvas>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`;
const MAIN = `import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildTerrain } from './terrain.js';
import { buildSky } from './sky.js';
import { createRide } from './ride.js';
import { startAudio } from './audio.js';

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 5000);

buildTerrain(scene);
buildSky(scene, renderer);
const loader = new GLTFLoader();
for (const [name, x, z] of [['farmhouse', 30, -40], ['vending', 8, -12], ['cedar', -14, -60]]) {
  loader.load(\`assets/\${name}.glb\`, ({ scene: m }) => { m.position.set(x, 0, z); scene.add(m); });
}
const ride = await createRide(scene, camera);

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

let audio = null;
addEventListener('pointerdown', async () => { audio ??= await startAudio(); audio.bell(); });

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  ride(dt, clock.elapsedTime);
  audio?.update(5.5);
  renderer.render(scene, camera);
});`;
const TERRAIN_TEST = `import { describe, it, expect } from 'vitest';
import { road, distToRoad } from '../src/terrain.js';

describe('terrain', () => {
  it('closes the road into a loop', () => {
    expect(road.getPointAt(0).distanceTo(road.getPointAt(1))).toBeLessThan(1e-6);
  });
  it('puts the road on the road', () => {
    const p = road.getPointAt(0.3);
    expect(distToRoad(p.x, p.z)).toBeLessThan(1);
  });
  it('keeps the far paddies off the road', () => {
    expect(distToRoad(300, 300)).toBeGreaterThan(50);
  });
});`;
const RIDE_TEST = `import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('three/addons/loaders/GLTFLoader.js', async () => {
  const { Group } = await vi.importActual('three');
  return { GLTFLoader: class { loadAsync() { return Promise.resolve({ scene: new Group() }); } } };
});
const { createRide } = await import('../src/ride.js');

describe('ride', () => {
  it('moves the bike along the road', async () => {
    const update = await createRide(new THREE.Scene(), new THREE.PerspectiveCamera());
    expect(update(1, 0)).toBeGreaterThan(0);
  });
  it('wraps around the loop', async () => {
    const update = await createRide(new THREE.Scene(), new THREE.PerspectiveCamera());
    let u = 0;
    for (let i = 0; i < 2000; i++) u = update(0.5, i);
    expect(u).toBeGreaterThanOrEqual(0);
    expect(u).toBeLessThan(1);
  });
  it('keeps the camera above the bike', async () => {
    const camera = new THREE.PerspectiveCamera();
    const update = await createRide(new THREE.Scene(), camera);
    for (let i = 0; i < 200; i++) update(1 / 60, i / 60);
    expect(camera.position.y).toBeGreaterThan(1);
  });
});`;

const lineCount = (src) => src.split('\n').length;
const testCount = (src) => (src.match(/\bit\(/g) || []).length;

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 2s' },
  { k: 'row', v: 'Listed', a: 'assets/' },
  { k: 'row', v: 'Read', a: 'package.json' },
  { k: 'edit', f: 'index.html', src: INDEX },
  { k: 'card', f: 'src/terrain.js', src: TERRAIN },
  { k: 'card', f: 'src/sky.js', src: SKY },
  { k: 'card', f: 'src/ride.js', src: RIDE },
  { k: 'edit', f: 'src/main.js', src: MAIN },
  { k: 'card', f: 'src/audio.js', src: AUDIO },
  { k: 'edit', f: 'test/terrain.test.js', src: TERRAIN_TEST },
  { k: 'edit', f: 'test/ride.test.js', src: RIDE_TEST },
  { k: 'row', v: 'Thought', a: 'for 1s' },
  { k: 'term', cmd: 'npm test' },
];
SCRIPT.forEach((s) => { if (s.src) s.n = lineCount(s.src); });
const FILES = SCRIPT.filter((s) => s.f);
const TOTAL = FILES.reduce((a, f) => a + f.n, 0);
const SUITES = [['test/terrain.test.js', testCount(TERRAIN_TEST)], ['test/ride.test.js', testCount(RIDE_TEST)]];
const NTESTS = SUITES.reduce((a, [, n]) => a + n, 0);
const PASSED = `${NTESTS} passed`;
const TESTS = [
  ['$', 'npm test'],
  ['', `> ${REPO_NAME}@0.1.0 test`],
  ['', '> vitest run'],
  ['', ''],
  ...SUITES.map(([f, n]) => ['ok', f, `(${n} tests)`]),
  ['', ''],
  ['sum', 'Test Files', `${SUITES.length} passed (${SUITES.length})`],
  ['sum', '     Tests', `${NTESTS} passed (${NTESTS})`],
];

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP). The reference
// ran its whole run in ~1.6 s; this one has ~2.8 s for 13 items, so each card streams its whole file in 0.464 s.
// v3 pace: every duration below (and the camera's push/hold/pull on the panel) is 0.8x its v2 value.
const DUR = { row: 0.08, edit: 0.08, card: 0.464, term: 0.36 };
const STEP = { row: 0.072, edit: 0.08, card: 0.4, term: 0.36 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (v2 85)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the tests pass, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Accept all pulses once
const HOLD_DONE = 0.36; /* deliberate */ // done: the review bar reads, pushed in, before the camera pulls back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
// heights in --u units (1px at narrow columns, a bit more on wide ones); GAP rides inside each item's slot
const BODY = 7, LH = 17; // a code/terminal body shows 7 lines of 17
const HGT = { row: 22, edit: 28, card: 32 + BODY * LH + 12, term: 32 + BODY * LH + 12 };
const GAP = 6;

// ---- a small highlighter, run once at build: comments, strings, numbers, keywords, calls, types, members ----
const KW = new Set('import export from const let var function return for of if else continue new class async await this true false null while break'.split(' '));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hl(src) {
  const re = /(\/\/.*$)|('[^']*'|"[^"]*"|`[^`]*`)|(\b0x[\da-f]+\b|\b\d+(?:\.\d+)?(?:e-?\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s])/g;
  let out = '', m, prev = '';
  while ((m = re.exec(src))) {
    const [tok, cm, str, num, id, ws] = m;
    if (cm) out += `<i class="c">${esc(cm)}</i>`;
    else if (str) out += `<i class="s">${esc(str)}</i>`;
    else if (num) out += `<i class="n">${esc(num)}</i>`;
    else if (id) {
      const next = src.slice(re.lastIndex).trimStart()[0];
      const cls = KW.has(id) ? 'k' : next === '(' ? 'f' : /^[A-Z][A-Z0-9_]+$/.test(id) ? 'n' : /^[A-Z]/.test(id) ? 't' : prev === '.' ? 'p' : '';
      out += cls ? `<i class="${cls}">${esc(id)}</i>` : esc(id);
    } else out += esc(tok);
    if (!ws) prev = tok;
  }
  return out;
}

// Primer octicons (github.com/primer/octicons, MIT) and the panel's glyphs, as in the reference's kit.js
const oct = (d) => `<svg class="oct" viewBox="0 0 16 16" aria-hidden="true"><path d="${d}"/></svg>`;
const O_BRANCH = oct('M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z');
const REPO = oct('M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z');
const TICK = '<svg class="code-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const TERM = '<svg class="code-ico" viewBox="0 0 24 24"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>';
const CHEV = '<svg class="code-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';

const ext = (f) => f.slice(f.lastIndexOf('.') + 1);
const fileIco = (f) => `<b class="code-fi ${ext(f)}">${ext(f) === 'html' ? '&lt;&gt;' : 'JS'}</b>`;
const nameOf = (f) => f.split('/').pop();
const dirOf = (f) => (f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '');
const stats = (n) => `<span class="code-add">+${n}</span><span class="code-del">-0</span>`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="code-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="code-ed">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(s.n)}</em></div>`;
  if (s.k === 'card') {
    const lines = s.src.split('\n');
    return `<div class="code-card">
      <div class="code-ch">${fileIco(s.f)}<b>${nameOf(s.f)}</b><s>${dirOf(s.f)}</s><em>${stats(0)}</em></div>
      <div class="code-bd"><div class="code-lines">${lines.map((l, i) => `<div class="code-l"><u>${i + 1}</u><code>${hl(l) || ' '}</code></div>`).join('')}</div></div>
    </div>`;
  }
  // the terminal block
  const tl = TESTS.map(([kind, a, b]) => {
    if (kind === '$') return `<div class="code-l"><code><i class="dl">$</i> <i class="cmd">${esc(a)}</i></code></div>`;
    if (kind === 'ok') return `<div class="code-l"><code> <i class="ok">&#10003;</i> ${esc(a)} <i class="dim">${esc(b)}</i></code></div>`;
    if (kind === 'sum') return `<div class="code-l"><code><i class="dim">${esc(a)}</i>  <i class="ok">${esc(b)}</i></code></div>`;
    return `<div class="code-l"><code><i class="dim">${esc(a) || ' '}</i></code></div>`;
  }).join('');
  return `<div class="code-term">
    <div class="code-ch">${TERM}<b class="code-tv">Running</b><span class="code-cmd">${esc(s.cmd)}</span><em class="code-tst"><i class="code-spin"></i><span></span></em></div>
    <div class="code-bd"><div class="code-lines">${tl}</div></div>
  </div>`;
}

const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
function rise(n, p, dy) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
}

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    let at = T.card + FIRST;
    T.items = SCRIPT.map((s) => { const o = { a: at, b: at + DUR[s.k] }; at += STEP[s.k]; return o; });
    T.done = T.items[T.items.length - 1].b + SETTLE; // the tests pass: review bar live, Worked for
    // zoom cut only (chat.js passes opts.zoom; nozoom has no camera move): the camera (scenes/tabs.js, via chat.js
    // FOCUS) pushes in on the panel once it is up, holds through the run, and pulls back to rest after done
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    // chat.js cues the next beat ("Press play.") from done, not from end: the settle (and the zoom cut's pull-back)
    // overlaps it
    T.next = T.done;
    // the beat's last visible change: the camera back at rest in the zoom cut; the panel itself settles at done + PULSE
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="code-x">
      <div class="code-hd">
        <span class="code-repo">${REPO}<b>${REPO_NAME}</b></span><span class="code-br">${O_BRANCH}main</span>
        <em class="code-state"><i class="code-spin"></i>${TICK}<span class="code-sl">Working</span><span class="code-clk">0s</span></em>
      </div>
      <div class="code-vp"><div class="code-stk">${SCRIPT.map((s) => `<div class="code-it">${itemHTML(s)}</div>`).join('')}<div class="code-sp"></div></div></div>
      <div class="code-stat"><span class="code-ran">Ran 0 commands</span><i>·</i><span>auto Opus 5.5</span><i>·</i><span>1M context</span></div>
      <div class="code-ft">
        <span class="code-sum">${CHEV}<b class="code-nf">0 files</b><span class="code-add">+0</span><span class="code-del">-0</span></span>
        <span class="code-btns"><i class="code-b">Undo all</i><i class="code-b code-pri">Accept all</i><i class="code-b">Review</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (as the reference): thresholds on the card's width
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('code-wide', w >= 760); card.classList.toggle('code-narrow', w <= 470); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const items = [...card.querySelectorAll('.code-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'card' || s.k === 'term') {
        o.lines = [...n.querySelectorAll('.code-l')];
        o.box = n.querySelector('.code-lines');
        o.shown = -1;
      }
      if (s.k === 'card') o.add = n.querySelector('.code-ch .code-add');
      if (s.k === 'term') { o.tv = n.querySelector('.code-tv'); o.tst = n.querySelector('.code-tst'); o.tsl = o.tst.lastElementChild; o.spin = o.tst.firstElementChild; }
      return o;
    });
    const state = $('.code-state'), stateL = $('.code-sl'), clk = $('.code-clk'), spin = $('.code-hd .code-spin'), stTk = state.querySelector('.code-tk');
    const nf = $('.code-nf'), fAdd = $('.code-ft .code-add'), ft = $('.code-ft'), pri = $('.code-pri');
    const ran = $('.code-ran');
    let said = -1;

    // lines streamed so far in a card/terminal body: a slow first line, then a run to the end
    const streamed = (o, t) => o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 16);
        const d = t >= T.done;
        let lines = 0, files = 0, cmds = 0;
        items.forEach((o) => {
          const { s } = o;
          if (((s.k === 'row' && s.v !== 'Thought') || s.k === 'term') && t >= o.a) cmds++;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + SLOT_IN));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'card' || s.k === 'term') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            // once the body overflows it also scrolls its 6-unit top padding away, so no sliver of a line peeks under the header
            const over = Math.max(0, nf2 - BODY);
            o.box.style.transform = `translateY(calc(var(--u) * ${(-(over * LH + Math.min(1, over) * 6)).toFixed(2)}))`;
            o.n.classList.toggle('live', t >= o.a && t < o.b);
            if (s.k === 'card') {
              // the header counts the lines that have actually streamed
              setText(o.add, `+${shown}`);
              lines += shown; if (t >= o.b) files++;
            } else {
              const ok = t >= o.b;
              setText(o.tv, ok ? 'Ran' : 'Running');
              setText(o.tsl, ok ? PASSED : '');
              o.tst.classList.toggle('ok', ok);
              o.spin.style.transform = `rotate(${((t - o.a) * 900).toFixed(1)}deg)`;
            }
          } else if (s.k === 'edit' && t >= o.a) { lines += s.n; files++; }
        });

        // header: an honest clock, this beat's own elapsed whole seconds from r: "Working 2s" with a spinner, then a
        // check and "Worked for 3s" (the whole seconds from r to done)
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the Attio-style status line under the run: commands run so far (counted from the rows and the terminal), model, context
        setText(ran, `Ran ${cmds} command${cmds === 1 ? '' : 's'}`);

        // the review bar: files and lines count up as edits land; at done its buttons go live and Accept all pulses
        setText(nf, d ? `${FILES.length} files changed` : `${files} file${files === 1 ? '' : 's'}`);
        setText(fAdd, `+${d ? TOTAL : lines}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('code-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
