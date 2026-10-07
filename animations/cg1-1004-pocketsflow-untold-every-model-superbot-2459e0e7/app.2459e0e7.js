// app.2459e0e7.js: act 3, the one prompt and its six beats, on 673c104b's own clock (36.949 s, every switch at the
// second it fell in the original), played in the REAL superbot desktop app: its DOM and CSS captured per phase from
// superbot-desktop driving this exact turn through its own provider_switch wire (capture/capture.2459e0e7.mjs), with
// each artifact landing under its own switch as it is made (build-app compose step). The routing is the edge's own:
//   B1 pocketsflow.com (the brand's site is the reference source)   B2 Meshy 3D (the mascot as a textured 3D model)
//   B3 Hailuo 3 Max (that model's render animated)   B4 Lyria 3.5 (the score)   B5 Claude Opus 5.5 (the Remotion cut)
//   B6 the turn's own answer with the rendered film.
// Motion: the DOM morphs between captured phases (unchanged nodes stay put), the app's own CSS animations are pinned
// to this clock, and the feed scroll and the camera are critically damped followers of per-phase targets, so every
// move is eased and continuous. The camera holds on one beat at a time.
import * as THREE from './vendor/three-gltf.2459e0e7.js';
import { clamp, lerp, seg, smoother, easeStandard, easeDecel, easeThinkOpen, hash01, driveVideo } from './lib.2459e0e7.js';

const DUR = 36.949;
const W = 1920, H = 1080;
const media = (f) => new URL(`./media/${f}`, import.meta.url).href;
const PROMPT = 'make a launch video for Pocketsflow';

// ---------- the beat clock (local seconds; global = local + 8.2) ----------
const TYPE = [1.6, 2.205];
// `cam`: the phase whose framing the camera holds for the whole beat (one shot per beat, no re-aim per row)
const TL = [
  { at: 0, phase: 'p00-idle', frame: 'idle' },
  { at: 1.45, phase: 'a0-focus', frame: 'idle' },
  { at: TYPE[0], phase: 'a1-typed', frame: 'idle', typing: true },
  { at: 2.355, phase: 'b0-sent', frame: 'live', cam: 's1-c-done' },
  { at: 2.705, phase: 's1-a-switching', frame: 'live', cam: 's1-c-done' },   // B1: Connecting to pocketsflow.com
  { at: 3.355, phase: 's1-b-live1', frame: 'live', cam: 's1-c-done' },
  { at: 4.15, phase: 's1-b-live2', frame: 'live', cam: 's1-c-done' },
  { at: 4.85, phase: 's1-b-live3', frame: 'live', cam: 's1-c-done' },
  { at: 5.45, phase: 's1-c-done', frame: 'live' },
  { at: 5.65, phase: 's1-d-resolved', frame: 'out', out: 1 },              // the brand card and the brand's mascot
  { at: 7.425, phase: 's2-a-switching', frame: 'live', sw: 2, cam: 's2-b-live' }, // B2: Meshy 3D
  { at: 8.075, phase: 's2-b-live', frame: 'live', sw: 2 },
  { at: 8.7, phase: 's2-d-resolved', frame: 'out', out: 2, sw: 2 },
  { at: 9.25, phase: 's2-e-viewer', frame: 'viewer', out: 2 },              // Expand: the mascot in superbot's 3D viewer
  { at: 13.8, phase: 's2-d-resolved', frame: 'out', out: 2, sw: 2 },
  { at: 14.515, phase: 's3-a-switching', frame: 'live', sw: 3, cam: 's3-b-live' }, // B3: Hailuo 3 Max
  { at: 15.165, phase: 's3-b-live', frame: 'live', sw: 3 },
  { at: 15.75, phase: 's3-d-resolved', frame: 'out', out: 3, sw: 3 },
  { at: 20.005, phase: 's4-a-switching', frame: 'live', sw: 4, cam: 's4-b-live' }, // B4: Lyria 3.5
  { at: 20.655, phase: 's4-b-live', frame: 'live', sw: 4 },
  { at: 21.2, phase: 's4-d-resolved', frame: 'out', out: 4, sw: 4 },
  { at: 22.975, phase: 's5-a-switching', frame: 'live', sw: 5, cam: 's5-b-live3' }, // B5: Claude Opus 5.5
  { at: 23.625, phase: 's5-b-live1', frame: 'live', sw: 5, cam: 's5-b-live3' },
  { at: 24.85, phase: 's5-b-live2', frame: 'live', sw: 5, cam: 's5-b-live3' },
  { at: 26.05, phase: 's5-b-live3', frame: 'live', sw: 5 },
  { at: 27.719, phase: 'z1-done', frame: 'answer', done: true },               // B6: the answer and the film
];
const VIEWER = { open: [9.25, 9.8], close: [13.35, 13.8] };
const CLIP = { at: 15.95, from: 0.3, len: 6.59 };               // Hailuo's shot: the lean-in, the whisper, the grin
const SCORE = { at: 21.5, len: 15 };                            // the score row plays (muted spot: the bar shows it)
const FILM = { v0: 29.749, from: 0.4, play: 6.5, len: 15 };     // 673c104b: film from 0.4 s for 6.5 s at reply + 1.3
const PUSH = [28.95, 30.05];                                    // the camera goes into the film as it starts
const B5 = [22.975, 27.719];                                    // Opus at work: the held shot drifts in a touch
const ANSWER_STREAM = [27.72, 28.26];

// the turn's own clock, time-lapsed (it reads in real seconds; the spot shows a minute of work in 25 s)
const ELAPSED = [[2.355, 0], [7.425, 9], [14.515, 21], [20.005, 31], [22.975, 38], [27.719, 54]];
function elapsedAt(t) {
  if (t <= ELAPSED[0][0]) return 0;
  for (let i = 1; i < ELAPSED.length; i++) {
    const [t1, e1] = ELAPSED[i], [t0, e0] = ELAPSED[i - 1];
    if (t <= t1) return lerp(e0, e1, (t - t0) / (t1 - t0));
  }
  return ELAPSED[ELAPSED.length - 1][1];
}
const turnClock = (s) => { const n = Math.floor(s); return n < 60 ? `${n}s` : `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, '0')}s`; };
const mediaClock = (s) => { const n = Math.max(0, Math.floor(s)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

// the score's real waveform: 48 RMS buckets of the Lyria track the row plays (gen/music/peaks48.json)
let PEAKS = null;

let SN = null, VPW = 1200, VPH = 675, K = 1.6;
let sec = null, cam = null, iframe = null, doc = null, fade = null;

// ---------- snapshots ----------
const REF = /<x-ref k="(\d+)"><\/x-ref>/g;
const expanded = new Map();
const expand = (html) => html.replace(REF, (_, k) => expand(SN.T[+k]));
// clips ship as VP9 WebM (frame-exact seeks in the renderer; every current browser plays them)
const htmlOf = (phase) => { if (!expanded.has(phase)) expanded.set(phase, expand(SN.S[phase].b).replace(/(\.\.\/media\/[\w-]+)\.mp4/g, '$1.webm')); return expanded.get(phase); };
const templates = new Map();
function templateOf(phase) {
  if (!templates.has(phase)) {
    const tpl = doc.createElement('template');
    tpl.innerHTML = htmlOf(phase);
    templates.set(phase, tpl);
  }
  return templates.get(phase);
}

// ---------- morph: patch the live DOM toward a snapshot, so unchanged nodes stay put ----------
let fresh = new Set();
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-message-id') || n.getAttribute('data-ad-out') || n.id || null : null);
function sameNode(a, b) {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType !== 1) return true;
  if (a.tagName !== b.tagName) return false;
  const ka = keyOf(a), kb = keyOf(b);
  if (ka || kb) return ka === kb;
  const ta = a.getAttribute('data-testid'), tb = b.getAttribute('data-testid');
  return ta === tb || !(ta || tb);
}
function syncAttrs(a, b) {
  for (const x of [...a.attributes]) if (!b.hasAttribute(x.name) && !x.name.startsWith('data-ad-') && x.name !== 'style') a.removeAttribute(x.name);
  for (const x of b.attributes) if (x.name !== 'style' && a.getAttribute(x.name) !== x.value) a.setAttribute(x.name, x.value);
  const bs = b.getAttribute('style') || '';
  if ((a.getAttribute('data-ad-style') ?? null) !== bs) { a.setAttribute('data-ad-style', bs); a.setAttribute('style', bs); }
}
function morphNode(a, b) {
  if (a.nodeType !== 1) { if (a.data !== b.data) a.data = b.data; return; }
  if (a.tagName === 'CANVAS' && a.classList.contains('ad-3d')) return;
  syncAttrs(a, b);
  morphChildren(a, b.content || b);
}
function insert(parent, t, before) {
  const n = doc.importNode(t, true);
  parent.insertBefore(n, before);
  if (n.nodeType === 1) { fresh.add(n); if (n.hasAttribute('style')) n.setAttribute('data-ad-style', n.getAttribute('style')); }
}
function morphChildren(from, to) {
  let f = from.firstChild;
  for (let t = to.firstChild; t; t = t.nextSibling) {
    if (!f) { insert(from, t, null); continue; }
    if (sameNode(f, t)) { morphNode(f, t); f = f.nextSibling; continue; }
    let probe = keyOf(t) ? f.nextSibling : null;
    for (let i = 0; probe && i < 12 && !sameNode(probe, t); i++) probe = probe.nextSibling;
    if (probe && sameNode(probe, t)) {
      while (f !== probe) { const n = f.nextSibling; from.removeChild(f); f = n; }
      morphNode(f, t); f = f.nextSibling;
    } else {
      insert(from, t, f);
    }
  }
  while (f) { const n = f.nextSibling; from.removeChild(f); f = n; }
}
function syncRootAttrs(phase) {
  const s = SN.S[phase];
  const de = doc.documentElement;
  const keep = de.classList.contains('ad-freeze');
  for (const x of [...de.attributes]) if (!(x.name in s.html)) de.removeAttribute(x.name);
  for (const [k, v] of Object.entries(s.html)) if (de.getAttribute(k) !== v) de.setAttribute(k, v);
  if (keep) de.classList.add('ad-freeze');
  for (const x of [...doc.body.attributes]) if (!(x.name in s.body)) doc.body.removeAttribute(x.name);
  for (const [k, v] of Object.entries(s.body)) if (doc.body.getAttribute(k) !== v) doc.body.setAttribute(k, v);
}

let shown = null;
function show(phase) {
  if (shown === phase) return false;
  fresh = new Set();
  syncRootAttrs(phase);
  morphChildren(doc.body, templateOf(phase).content);
  shown = phase;
  touched.clear();
  patchStatic();
  return true;
}

// ---------- one-time fixes on every freshly mounted phase ----------
let STATS = '';
const PAUSE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause size-(--spacing-12)" aria-hidden="true" focusable="false"><rect x="14" y="3" width="5" height="18" rx="1"></rect><rect x="5" y="3" width="5" height="18" rx="1"></rect></svg>';
let PLAY_SVG = null;
function patchStatic() {
  // the signed-in account is Kai's (the X post's author), its initial too
  for (const el of doc.querySelectorAll('[data-slot="avatar-initials"], .awc-avatar')) if (el.textContent.trim() === 'H') el.textContent = 'K';
  // the score row draws the real peaks of the Lyria track (the capture could not decode the served MP3)
  for (const wave of doc.querySelectorAll('[data-slot="audio-row-wave"]')) {
    if (wave.getAttribute('data-state') !== 'ready') wave.setAttribute('data-state', 'ready');
  }
  // the 3D card's foot reads the real mesh: triangle count and size
  for (const el of doc.querySelectorAll('.sb-viewer-model-stats')) if (STATS && el.textContent !== STATS) el.textContent = STATS;
  for (const v of doc.querySelectorAll('video')) { v.muted = true; v.defaultMuted = true; v.removeAttribute('controls'); v.preload = 'auto'; }
  // no focus ring on the viewer a pointer opened
  for (const d of doc.querySelectorAll('dialog')) d.blur?.();
}

// ---------- text ----------
const touched = new Map();
function setText(node, text) {
  if (!touched.has(node)) touched.set(node, node.data);
  if (node.data !== text) node.data = text;
}
function textNodes(root) {
  const out = [];
  const w = (root.ownerDocument || root).createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n);
  return out;
}
// a person's cadence: quicker inside words, a breath after spaces (35 characters in 0.605 s, as 673c104b typed it)
const TYPE_AT = (() => {
  const gaps = [...PROMPT].map((ch, i) => (0.6 + 0.8 * hash01(i + 3)) * (ch === ' ' ? 1.5 : 1));
  const total = gaps.reduce((a, b) => a + b, 0);
  let acc = 0;
  return gaps.map((g) => (acc += g) / total);
})();
const typedCount = (f) => { let n = 0; while (n < TYPE_AT.length && TYPE_AT[n] <= f) n++; return n; };
let caret = null;
function typeInto(n) {
  const input = doc.querySelector('[data-testid="composer-input"]');
  if (!input) return;
  const nodes = textNodes(input).filter((x) => !caret || x.parentNode !== caret);
  let left = n;
  for (const node of nodes) {
    const full = touched.has(node) ? touched.get(node) : node.data;
    const take = clamp(left, 0, full.length);
    setText(node, full.slice(0, take));
    left -= take;
  }
  const last = nodes[nodes.length - 1];
  const host = last ? last.parentNode : input;
  if (!caret || caret.ownerDocument !== doc) { caret = doc.createElement('span'); caret.className = 'ad-caret'; }
  if (caret.parentNode !== host || caret.previousSibling !== last) host.appendChild(caret);
}

// ---------- clocks ----------
function tickClocks(t, step) {
  const e = elapsedAt(t);
  for (const el of doc.querySelectorAll('.sb-sonar-clock-digits, [data-slot="chat-row-live"] [style*="--sb-clock-chars"]')) {
    const node = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
    if (!node) continue;
    const v = turnClock(e);
    setText(node, v);
    el.style.setProperty('--sb-clock-chars', String(v.length));
  }
  if (step.sw) {
    const live = TL.find((s) => s.sw === step.sw && /-b-live/.test(s.phase));
    const from = live ? live.at : t;
    for (const el of doc.querySelectorAll('[data-slot="media-pending-clock"]')) {
      const node = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
      if (node) setText(node, mediaClock(1 + (t - from) * 2.2));
    }
  }
  if (step.done) {
    for (const meta of doc.querySelectorAll('[data-slot="turn-head-meta"]')) {
      const node = [...meta.childNodes].reverse().find((n) => n.nodeType === 3);
      if (node) setText(node, turnClock(elapsedAt(TL[TL.length - 1].at)));
    }
  }
}

// ---------- frame-exact CSS: every animation in the app is pinned to this clock ----------
function inFresh(el) {
  for (let n = el; n && n !== doc.body; n = n.parentNode) if (fresh.has(n)) return true;
  return false;
}
function pinAnimations(t, from) {
  for (const a of doc.getAnimations()) {
    const timing = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
    if (!timing) continue;
    if (a.playState !== 'paused') a.pause();
    if (timing.iterations === Infinity) a.currentTime = t * 1000;
    else if (a.effect.target && inFresh(a.effect.target)) a.currentTime = Math.min(timing.endTime, Math.max(0, (t - from) * 1000));
    else a.currentTime = timing.endTime;
  }
}

// ---------- outputs ----------
const outOf = (k) => doc.querySelector(`[data-ad-out="${k}"]`);
// an artifact lands the way the app's MediaReveal lands one: from soft and slightly low to sharp, on the decelerate curve
function revealOut(step, t) {
  if (!step.out) return;
  const first = TL.find((s) => s.out === step.out).at;
  const el = outOf(step.out);
  if (!el) return;
  const f = easeDecel(seg(t, first, first + 0.55));
  el.style.opacity = f >= 1 ? '' : lerp(0.0, 1, f).toFixed(3);
  el.style.transform = f >= 1 ? '' : `translateY(${((1 - f) * 12).toFixed(2)}px)`;
  el.style.filter = f >= 1 ? '' : `blur(${((1 - f) * 6).toFixed(2)}px)`;
}
function driveClip(t, playing) {
  const vids = [...doc.querySelectorAll('video')];
  const clip = vids.find((v) => (v.getAttribute('src') || '').includes('mascot-intro'));
  const film = vids.find((v) => (v.getAttribute('src') || '').includes('pocketsflow-launch'));
  if (clip) driveVideo(clip, CLIP.from + Math.max(0, t - CLIP.at), playing && t >= CLIP.at);
  if (film) driveVideo(film, FILM.from + clamp(t - FILM.v0, 0, FILM.play), playing && t >= FILM.v0 && t < FILM.v0 + FILM.play);
}
function driveScore(t) {
  const row = doc.querySelector('[data-slot="audio-row"]');
  if (!row) return;
  const wave = row.querySelector('[data-slot="audio-row-wave"]');
  // the bars rise from flat to the track's peaks as the row decodes it, then the played mask runs with the score
  const grow = easeDecel(seg(t, SCORE.at - 0.45, SCORE.at + 0.1));
  const groups = wave ? wave.querySelectorAll(':scope > span:not([data-slot]), [data-slot="audio-row-played"] > span > span') : [];
  for (const g of groups) [...g.querySelectorAll('[data-slot="audio-row-bar"]')].forEach((b, i) => {
    const h = (PEAKS ? PEAKS[i % PEAKS.length] : 0.5) * 100 * grow;
    const v = `${h.toFixed(2)}%`;
    if (b.style.height !== v) b.style.height = v;
  });
  const playing = t >= SCORE.at;
  const p = clamp((t - SCORE.at) / SCORE.len);
  const hidden = (1 - p) * 100;
  const clip = wave && wave.querySelector('[data-slot="audio-row-played"]');
  if (clip) { clip.style.transform = `translateX(-${hidden.toFixed(3)}%)`; const hold = clip.firstElementChild; if (hold) hold.style.transform = `translateX(${hidden.toFixed(3)}%)`; }
  const state = playing ? 'playing' : 'paused';
  if (row.getAttribute('data-state') !== state) {
    row.setAttribute('data-state', state);
    const btn = row.querySelector('[data-slot="audio-row-play"]');
    if (btn) {
      const svg = btn.querySelector('svg');
      if (!PLAY_SVG && svg && !playing) PLAY_SVG = svg.outerHTML;
      btn.setAttribute('aria-pressed', String(playing));
      if (svg) svg.outerHTML = playing ? PAUSE_SVG : (PLAY_SVG || svg.outerHTML);
    }
  }
  const dur = row.querySelector('[data-slot="audio-row-duration"]');
  if (dur && dur.firstChild && dur.firstChild.nodeType === 3) setText(dur.firstChild, playing ? mediaClock(p * SCORE.len) : '0:15');
}

// ---------- the 3D model: superbot's own viewer rig (Model3dView.tsx), drawn into the viewer's stage ----------
const R3 = { renderer: null, scene: null, camera: null, model: null, sphere: null, ready: false };
async function mount3d() {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.01, 1000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3b40, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 8, 6);
  scene.add(key);
  const gltf = await new THREE.GLTFLoader().loadAsync(media('pocketsflow-mascot.glb'));
  const model = gltf.scene;
  scene.add(model);
  const box = new THREE.Box3().setFromObject(model);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.z);
  const grid = new THREE.GridHelper(span * 2.5, clamp(Math.round(span * 2.5), 10, 60), 0x3a3b40, 0x1e1e21);
  grid.material.transparent = true;
  grid.material.opacity = 0.6;
  grid.position.y = box.min.y;
  scene.add(grid);
  let tris = 0;
  model.traverse((n) => { if (n.isMesh) tris += (n.geometry.index ? n.geometry.index.count : n.geometry.attributes.position.count) / 3; });
  const f1 = (v) => v.toFixed(1);
  STATS = `${Math.round(tris).toLocaleString('en-US')} tri · ${f1(size.x)} × ${f1(size.y)} × ${f1(size.z)}`;
  Object.assign(R3, { renderer, scene, camera, model, sphere, ready: true });
}
// orbit: the viewer's fitted direction (1, 0.65, 1.25) at a turntable pace a viewer can read in four seconds
function draw3d(t) {
  if (!R3.ready) return;
  const stage = doc.querySelector('dialog .sb-viewer-model-stage');
  if (!stage) return;
  let cv = stage.querySelector('canvas.ad-3d');
  if (!cv) {
    for (const c of stage.querySelectorAll('canvas')) c.style.display = 'none';
    cv = doc.createElement('canvas');
    cv.className = 'ad-3d';
    stage.appendChild(cv);
  }
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  const S = 2.6;
  const pw = Math.round(w * S), ph = Math.round(h * S);
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  R3.renderer.setSize(pw, ph, false);
  const cam = R3.camera;
  cam.aspect = pw / ph;
  const { center, radius } = R3.sphere;
  const fov = THREE.MathUtils.degToRad(cam.fov);
  const dist = (radius / Math.sin(fov / 2)) * 0.8;   // the viewer zoomed in a step: the mascot fills the stage
  const base = Math.atan2(1, 1.25);
  const a = base - THREE.MathUtils.degToRad(24) * Math.max(0, t - VIEWER.open[0]);
  const dir = new THREE.Vector3(Math.sin(a), 0.65 / Math.hypot(1, 1.25), Math.cos(a)).normalize();
  const aim = center.clone(); aim.y += radius * 0.08;
  cam.position.copy(aim).addScaledVector(dir, dist);
  cam.near = dist / 100; cam.far = dist * 100;
  cam.lookAt(aim);
  cam.updateProjectionMatrix();
  R3.renderer.render(R3.scene, cam);
  const g = cv.getContext('2d');
  g.clearRect(0, 0, pw, ph);
  g.drawImage(R3.renderer.domElement, 0, 0);
}

const viewerDialog = () => doc.querySelector('dialog .sb-viewer-model-stage')?.closest('dialog') || null;
// the viewer opens as a FLIP from the card (the app's Expand) and closes back into it
function driveViewer(t) {
  const dlg = viewerDialog();
  if (!dlg) return;
  if (!dlg.matches(':modal')) {
    if (dlg.open) dlg.close();
    try { dlg.showModal(); } catch (e) { console.warn('viewer showModal', e); dlg.setAttribute('open', ''); }
    doc.activeElement?.blur?.();
  }
  const card = doc.querySelector('[data-ad-out="2"] [data-testid="embed-media"]');
  const a = card ? card.getBoundingClientRect() : null;
  dlg.style.transform = '';
  const b = dlg.getBoundingClientRect();
  const fo = easeThinkOpen(seg(t, VIEWER.open[0], VIEWER.open[1]));
  const fc = easeStandard(seg(t, VIEWER.close[0], VIEWER.close[1]));
  const f = fo * (1 - fc);
  if (a && b.width && f < 1) {
    const sx = a.width / b.width, sy = a.height / b.height;
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    dlg.style.transformOrigin = '50% 50%';
    dlg.style.transform = `translate(${(dx * (1 - f)).toFixed(2)}px, ${(dy * (1 - f)).toFixed(2)}px) scale(${lerp(sx, 1, f).toFixed(4)}, ${lerp(sy, 1, f).toFixed(4)})`;
  }
  dlg.style.opacity = clamp(f * 1.6).toFixed(3);
}

// ---------- scroll and camera: critically damped followers of per-phase targets ----------
const feedEl = () => doc.querySelector('[data-testid="feed"]');
const maxScroll = () => { const f = feedEl(); return f ? Math.max(0, f.scrollHeight - f.clientHeight) : 0; };
const rectOf = (el) => (el ? el.getBoundingClientRect() : null);
const TARGETS = new Map();   // phase -> { scroll, cx, cy, z }
const PAD = 22;

function fitFrame(top, bottom, left, right, zMax) {
  const h = bottom - top + 2 * PAD, w = right - left + 2 * PAD;
  const z = Math.min(zMax, H / (K * h), W / (K * w));
  return { cx: (left + right) / 2, cy: (top + bottom) / 2, z, top: top - PAD };
}
// the element a beat's shot starts at: its own switch pill, or the prompt for the first beat
function beatTop(step) {
  if (step.frame === 'idle' || step.frame === 'viewer' || step.frame === 'answer') return null;
  if (step.out === 1 || /^s1|^b0/.test(step.phase)) return doc.querySelector('[data-slot="message-row-bubble"]');
  const pills = [...doc.querySelectorAll('[data-testid="provider-switch-pill"]')];
  return pills[pills.length - 1] || null;
}
function measure(step) {
  const comp = rectOf(doc.querySelector('[data-testid="composer"]'));
  const foot = comp.bottom + 26;   // the "No project / This Mac" row under the composer
  const colL = comp.left, colR = comp.right;
  const feed = feedEl();
  const pills = [...doc.querySelectorAll('[data-testid="provider-switch-pill"]')];
  const lastPill = pills[pills.length - 1];
  if (step.frame === 'idle') {
    const greet = rectOf(doc.querySelector('.chat-hero-greeting')) || comp;
    return fitFrame(Math.min(greet.top, comp.top) - 6, foot + 34, colL, colR, 1.42);
  }
  if (step.frame === 'viewer') {
    const d = rectOf(viewerDialog());
    return fitFrame(d.top, d.bottom, d.left, d.right, 1.6);
  }
  if (step.frame === 'answer') {
    const row = [...doc.querySelectorAll('[data-testid="feed"] [data-testid="message-row"]')].pop();
    const lead = row && [...row.querySelectorAll('[data-slot="markdown-para"]')].filter((p) => !p.querySelector('img') && !p.closest('[data-slot="provider-switch-block"]')).pop();
    const film = [...doc.querySelectorAll('figure[data-media="video"]')].pop();
    const top = rectOf(lead || film).top - 8;
    const fr = rectOf(film);
    return fitFrame(top, fr.bottom + 8, colL, colR, 1.9);
  }
  // live and resolved beats: from the beat's own pill (or the prompt, for the first) down to the composer
  const topEl = beatTop(step);
  let top = topEl ? rectOf(topEl).top - 10 : comp.top - 300;
  if (feed) top = Math.max(top, rectOf(feed).top);
  // the first beat has no composer business: frame its content only, on the chat column, and closer
  if (step.out === 1 || /^s1|^b0/.test(step.phase)) {
    const rows = [...doc.querySelectorAll('[data-testid="feed"] [data-testid="message-row"]')];
    const last = rows[rows.length - 1];
    const bottom = Math.min(comp.top - 8, last ? rectOf(last).bottom + 6 : foot);
    const measureW = parseFloat(getComputedStyle(doc.querySelector('.hub-root') || doc.body).getPropertyValue('--hub-chat-measure')) || 600;
    const cx = (comp.left + comp.right) / 2;
    return fitFrame(top, bottom, cx - measureW / 2, cx + measureW / 2, 1.85);
  }
  // the composer beats: the shot sits on the composer (its foot row at the frame's bottom edge, never the window's
  // edge below it) and opens upward to the beat's own pill
  const fr = fitFrame(top, foot, colL, colR, 1.75);
  fr.cy = foot + PAD - H / (2 * K * fr.z);
  fr.pillTop = topEl ? rectOf(topEl).top : top;
  return fr;
}

// every image in the frame decoded, so the heights measured are the heights drawn
async function imagesIn() {
  await Promise.all([...doc.images].filter((i) => i.getAttribute("src")).map((i) => (i.complete && i.naturalWidth ? null : i.decode().catch((e) => console.warn('img', i.getAttribute('src'), e.message)))));
}
async function precompute() {
  for (const step of TL) {
    if (TARGETS.has(step.phase + '|' + step.frame)) continue;
    show(step.phase);
    pinAnimations(1e4, 0);
    for (const a of doc.getAnimations()) { const tm = a.effect?.getComputedTiming?.(); if (tm && tm.iterations !== Infinity) a.currentTime = tm.endTime; }
    if (step.frame === 'viewer') driveViewer(VIEWER.open[1] + 0.01);
    await imagesIn();
    const f = feedEl();
    let scroll = maxScroll();
    if (f) f.scrollTop = scroll;
    // bottom-anchored like the app, unless that pushes the beat's own pill above the feed: then the beat starts at the top
    const top = beatTop(step);
    if (f && top) {
      const over = rectOf(f).top + 10 - rectOf(top).top;
      if (over > 0) { scroll = Math.max(0, scroll - over); f.scrollTop = scroll; }
    }
    await new Promise((r) => requestAnimationFrame(r));
    const m = measure(step);
    TARGETS.set(step.phase + '|' + step.frame, { scroll, ...m });
  }
  shown = null;
}
const targetAt = (step) => TARGETS.get(step.phase + '|' + step.frame);
const camTargetAt = (step) => (step.cam ? TARGETS.get(step.cam + '|live') : null) || targetAt(step);

// the push into the film: the card fills the frame
let FILM_FRAME = null;
function filmFrame() {
  const film = [...doc.querySelectorAll('figure[data-media="video"]')].pop();
  const surf = film && (film.querySelector('[data-slot="embed-media-surface"]') || film);
  const r = rectOf(surf);
  if (!r) return null;
  const z = Math.min(W * 0.94 / (K * r.width), H * 0.94 / (K * r.height));
  return { cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2, z };
}

// a critically damped follower, integrated on a fixed grid from the start of the act, so it is a pure function of t
const SIM_DT = 1 / 240;
function follower(omega, keys) {
  let cache = null;
  return (t) => {
    if (!cache || t < cache.t) cache = { t: 0, x: keys(0), v: keys(0).map(() => 0) };
    while (cache.t + SIM_DT <= t) {
      const tg = keys(cache.t);
      for (let i = 0; i < tg.length; i++) {
        const a = omega * omega * (tg[i] - cache.x[i]) - 2 * omega * cache.v[i];
        cache.v[i] += a * SIM_DT;
        cache.x[i] += cache.v[i] * SIM_DT;
      }
      cache.t += SIM_DT;
    }
    return cache.x;
  };
}
const stepAt = (t) => { let s = TL[0]; for (const x of TL) if (t >= x.at) s = x; return s; };
let camFollow = null, scrollFollow = null, fadeFollow = null;

// ---------- the act ----------
export default {
  id: 'app',
  dur: DUR,
  async mount(section, ctx) {
    sec = section;
    sec.innerHTML = '<div class="app-cam"><iframe class="app-frame" title="superbot" scrolling="no"></iframe></div><div class="app-fade"></div>';
    fade = sec.querySelector('.app-fade');
    cam = sec.querySelector('.app-cam');
    iframe = sec.querySelector('iframe');
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('./app/snaps.js', import.meta.url).href;
      s.onload = resolve;
      s.onerror = (e) => reject(new Error('snaps.js failed to load'));
      document.head.appendChild(s);
    });
    SN = window.SB_SNAPS;
    VPW = SN.vp.w; VPH = SN.vp.h; K = W / VPW;
    iframe.width = VPW; iframe.height = VPH;
    iframe.style.width = `${VPW}px`; iframe.style.height = `${VPH}px`;
    await new Promise((resolve) => { iframe.onload = resolve; iframe.src = new URL('./app/frame.html', import.meta.url).href; });
    doc = iframe.contentDocument;
    doc.documentElement.classList.add('ad-freeze');
    try { PEAKS = await (await fetch(media('score-peaks.json'))).json(); } catch (e) { console.error('score peaks', e); }
    try { await mount3d(); } catch (e) { console.error('3d model', e); }
    await doc.fonts.ready;
    await precompute();
    window.__APP_DEBUG = { TARGETS, TL };
    camFollow = follower(5.2, (t) => {
      const s = stepAt(t);
      const g = camTargetAt(s);
      if (s.done && FILM_FRAME) {
        const f = smoother(seg(t, PUSH[0], PUSH[1]));
        return [lerp(g.cx, FILM_FRAME.cx, f), lerp(g.cy, FILM_FRAME.cy, f), Math.exp(lerp(Math.log(g.z), Math.log(FILM_FRAME.z * lerp(1, 1.025, seg(t, PUSH[1], DUR))), f))];
      }
      const drift = s.sw === 5 ? lerp(1, 1.05, smoother(seg(t, B5[0], B5[1]))) : 1;
      return [g.cx, g.cy, g.z * drift];
    });
    scrollFollow = follower(8.5, (t) => [targetAt(stepAt(t)).scroll]);
    // over the stacked beats, what is above the current beat fades into the app's own background (less on screen)
    fadeFollow = follower(6, (t) => { const st = stepAt(t); return [st.sw >= 2 && (st.frame === 'live' || st.frame === 'out') ? 1 : 0]; });
    const bg = getComputedStyle(doc.querySelector('[data-testid="feed"]')?.closest('.hub-main') || doc.body).backgroundColor;
    sec.style.setProperty('--app-bg', bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : 'rgb(14, 14, 16)');
    // the film's frame is measured once in the settled answer
    show('z1-done');
    const f = feedEl();
    if (f) f.scrollTop = targetAt(TL[TL.length - 1]).scroll;
    await new Promise((r) => requestAnimationFrame(r));
    FILM_FRAME = filmFrame();
    shown = null;
  },
  leave() {
    for (const v of doc ? doc.querySelectorAll('video') : []) if (!v.paused) v.pause();
  },
  render(lt, ctx) {
    const t = clamp(lt, 0, DUR);
    const step = stepAt(t);
    show(step.phase);
    pinAnimations(t, step.at);
    // typing
    if (step.typing) typeInto(typedCount(seg(t, TYPE[0], TYPE[1])));
    if (caret) caret.style.display = step.typing ? '' : 'none';
    tickClocks(t, step);
    revealOut(step, t);
    driveScore(t);
    driveClip(t, ctx.playing);
    if (step.frame === 'viewer') { driveViewer(t); draw3d(t); }
    // the answer streams in under the last switch
    if (step.done) revealAnswer(t);
    // scroll, then camera
    const f = feedEl();
    if (f) {
      // the turn settling swaps the live rows for the answer in place: the feed stays pinned to its bottom, as the app keeps it
      const st = step.done ? targetAt(step).scroll : scrollFollow(t)[0];
      f.scrollTop = clamp(st, 0, maxScroll());
    }
    const [cx, cy, z] = camFollow(t);
    const s = K * z;
    cam.style.transform = `translate(${W / 2}px,${H / 2}px) scale(${s.toFixed(5)}) translate(${(-cx).toFixed(3)}px,${(-cy).toFixed(3)}px)`;
    const fo = clamp(fadeFollow(t)[0]);
    // measured live: the fade stops just above the current beat's pill wherever the scroll has it right now
    const pill = fo > 0 ? beatTop(step) : null;
    const yTop = pill ? clamp(H / 2 + (pill.getBoundingClientRect().top - 3 - cy) * s, 0, H * 0.7) : 0;
    fade.style.opacity = fo.toFixed(3);
    fade.style.height = `${yTop.toFixed(1)}px`;
    fade.style.background = `linear-gradient(to bottom, var(--app-bg) ${Math.max(0, yTop - 20).toFixed(1)}px, transparent ${yTop.toFixed(1)}px)`;
  },
};

// ---------- B6: the answer streams, its film card settles in the way MediaReveal does ----------
function revealAnswer(t) {
  const row = [...doc.querySelectorAll('[data-testid="feed"] [data-testid="message-row"]')].pop();
  if (!row) return;
  const paras = [...row.querySelectorAll('[data-slot="answer-lead"], [data-slot="markdown-para"]')].filter((p) => !p.querySelector('img') && !p.closest('[data-slot="provider-switch-block"]'));
  const nodes = paras.flatMap(textNodes);
  const full = nodes.map((n) => (touched.has(n) ? touched.get(n) : n.data));
  const total = full.reduce((a, s) => a + s.length, 0);
  let left = Math.round(total * seg(t, ANSWER_STREAM[0], ANSWER_STREAM[1]));
  nodes.forEach((n, i) => { const take = clamp(left, 0, full[i].length); setText(n, full[i].slice(0, take)); left -= take; });
  const film = [...row.querySelectorAll('figure[data-media="video"]')].pop();
  if (film) {
    const f = easeDecel(seg(t, ANSWER_STREAM[0], ANSWER_STREAM[0] + 0.4));
    film.style.opacity = f >= 1 ? '' : f.toFixed(3);
    film.style.transform = f >= 1 ? '' : `translateY(${((1 - f) * 12).toFixed(2)}px)`;
    film.style.filter = f >= 1 ? '' : `blur(${((1 - f) * 6).toFixed(2)}px)`;
  }
}
