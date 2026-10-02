// do-that-too-superbot: "I can do that too." The engine. The whole spot is a pure function of t, like
// ../waffles-website-superbot-87a583a1/timeline.js: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there,
// space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock.
// It lays CONTRACT.txt's SEQUENCE end to end: black text cards (drawn here), the five scene modules
// (scenes/<id>.js, mounted once, rendered only while active) and the waffles-website end card.
import * as lib from './lib.js';
import * as shell from './shell.js';

const { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence (CONTRACT.txt) ----------
// every-model-one-chat: the hub cropped to its thread, opening on the empty state, then the three-request chat
// (scenes/tabs-assets/chat.js: Gemini, DeepSeek V4 Flash, DoorDash; ?route= picks the burger routing, one ad each) and the end card
const SEQUENCE = [
  ['scene', 'tabs'],
  ['end', 'end'],
];
// the durations a scene gets if its module fails to load (so the spot keeps its shape)
const FALLBACK_DUR = { tabs: 36 };
// the scene comes up fast (a tenth of a second, so the cut opens on its first frame, not on black) but still
// hands off to the end card over the long fade the rest of the spot uses
const SCENE_IN = 0.1, SCENE_FADE = 0.3;
const END_DUR = 4.4, DIP = 0.35;

// ---------- text cards ----------
// A part is a word string, or { img, cls, alt, after } for a brand wordmark (after = trailing punctuation),
// or { html } for styled words. The last part and the logo are kept on one line (never orphan the logo).
const B = (f) => new URL('./brand/' + f, import.meta.url).href;
const CARDS = {
  agents: { dur: 2.4, parts: ['All', { g: 'in' }, { g: 'one' }, 'app'] },
  lovable: {
    dur: 2.6, parts: ['Can', 'it', 'make', 'an', 'app', 'like', { img: B('lovable-wordmark.svg'), cls: 'wm wm-lovable', alt: 'Lovable', after: '?' }],
    logo: { src: B('lovable-logo.svg'), cls: 'lg lg-lovable', alt: '' },
  },
  cursor: {
    dur: 2.6, parts: ['But', 'can', 'it', 'code', 'like', { img: B('cursor-wordmark.svg'), cls: 'wm wm-cursor', alt: 'Cursor', after: '?' }],
    logo: { src: B('cursor-logo.svg'), cls: 'lg lg-cursor', alt: '' },
  },
  dash: {
    dur: 2.6, parts: ['I', 'just', 'want', 'a', 'burger', 'from', { img: B('doordash-wordmark.svg'), cls: 'wm wm-dash', alt: 'DoorDash' }],
    logo: { src: B('doordash-logo.svg'), cls: 'lg lg-dash', alt: '' },
  },
  cant: {
    dur: 2.6, parts: ['And', 'what', 'the', 'others', { html: '<span class="purple">can’t</span>' }],
    logo: { src: B('imp-1f608.svg'), cls: 'lg lg-imp', alt: '' },
  },
  platforms: { dur: 2.3, parts: ['It’s', 'all', 'your', 'platforms', { g: 'in' }, { g: 'one' }] },
  agents2: { dur: 2.4, parts: ['With', 'all', 'your', 'agents', { g: 'in' }, { g: 'one' }] },
  workspace: { dur: 2.9, parts: ['Your', { g: 'all' }, { g: 'in' }, { g: 'one' }, 'agent', 'workspace'] },
};
// card motion (seconds, local): words rise 18px + unblur 8px, outQuint .55s, staggered .06s
// The design timings are scaled by one factor K shared by every card, chosen so the busiest card still has
// its text fully landed and its logo fully popped READ_HOLD seconds before its exit starts (same motion on all).
const W_RISE = 18, W_BLUR = 8, CARD_OUT = 0.3, READ_HOLD = 1.2;
const BASE = { in: 0.12, stag: 0.06, dur: 0.55, gap: 0.15, logo: 0.45 };
const settleAt = (c, k) => k * (BASE.in + (c.parts.length - 1) * BASE.stag + BASE.dur + (c.logo ? BASE.gap + BASE.logo : 0));
const K = Math.min(1, ...Object.values(CARDS).map((c) => (c.dur - CARD_OUT - READ_HOLD) / settleAt(c, 1)));
const W_IN = BASE.in * K, W_STAG = BASE.stag * K, W_DUR = BASE.dur * K, LOGO_GAP = BASE.gap * K, LOGO_DUR = BASE.logo * K;

function buildCard(sec, spec) {
  sec.classList.add('card');
  const line = document.createElement('p');
  line.className = 'cl';
  const words = [], grads = [];
  const mk = (part) => {
    const w = document.createElement('span');
    w.className = 'w';
    if (typeof part === 'string') w.textContent = part;
    else if (part.g) {
      // gradient words: the gradient lives on an INNER span so the outer .w can carry the blur filter and
      // the rise without fighting background-clip:text (no filter + clip on one element)
      const gt = document.createElement('span');
      gt.className = 'gt'; gt.textContent = part.g;
      w.appendChild(gt); grads.push(gt);
    }
    else if (part.html) w.innerHTML = part.html;
    else {
      const img = document.createElement('img');
      img.className = part.cls; img.src = part.img; img.alt = part.alt || ''; img.decoding = 'sync';
      w.appendChild(img);
      if (part.after) w.appendChild(document.createTextNode(part.after));
    }
    words.push(w);
    return w;
  };
  const parts = spec.parts;
  parts.slice(0, -1).forEach((p) => { line.appendChild(mk(p)); line.appendChild(document.createTextNode(' ')); });
  const tail = document.createElement('span');
  tail.className = 'tail';
  tail.appendChild(mk(parts[parts.length - 1]));
  let logo = null;
  if (spec.logo) {
    logo = document.createElement('img');
    logo.className = spec.logo.cls; logo.src = spec.logo.src; logo.alt = spec.logo.alt; logo.decoding = 'sync';
    tail.appendChild(logo);
  }
  line.appendChild(tail);
  sec.appendChild(line);
  const land = W_IN + (words.length - 1) * W_STAG + W_DUR;
  return { line, words, logo, land, logoAt: land + LOGO_GAP, grads, gm: null };
}

function renderCard(c, lt, dur) {
  c.words.forEach((w, i) => {
    const p = outQuint(seg(lt, W_IN + i * W_STAG, W_IN + i * W_STAG + W_DUR));
    w.style.opacity = clamp(p * 1.15).toFixed(3);
    w.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * W_RISE).toFixed(2)}px)`;
    w.style.filter = p >= 1 ? 'none' : `blur(${((1 - p) * W_BLUR).toFixed(2)}px)`;
  });
  if (c.logo) {
    const f = seg(lt, c.logoAt, c.logoAt + LOGO_DUR);
    c.logo.style.opacity = outCubic(clamp(f * 2.2)).toFixed(3);
    c.logo.style.transform = `scale(${lerp(0.6, 1, outBack(f)).toFixed(4)})`;
  }
  if (c.grads.length) renderGrads(c, lt);
  const e = inOutCubic(seg(lt, dur - CARD_OUT, dur));
  c.line.style.opacity = (1 - e).toFixed(3);
  c.line.style.transform = e > 0 ? `scale(${lerp(1, 0.985, e).toFixed(4)})` : 'none';
}

// ---------- the animated brand gradient on "in one" ----------
// Two background layers clipped to the text of each .gt span, laid out in ONE coordinate space across the
// whole phrase (each word's layers are offset by its own left edge, so the colours run on across the space):
//   1. a soft white shine band, sweeping left to right once, SHINE_DUR after the words land;
//   2. the superbot storm gradient (blue -> violet -> magenta -> pink and back), a seamless tile GRAD_P px
//      wide drifting left at GRAD_V px/s. Both positions are pure functions of lt.
const GRAD_P = 900, GRAD_V = 110, SHINE_DELAY = 0.08, SHINE_DUR = 0.9;
function measureGrads(c) {
  // walk the offsetParent chain up to the line: a word mid-rise carries a transform, which makes IT the
  // offsetParent of its .gt in Chromium, so a bare offsetLeft would read 0 during the entrance
  const offX = (el) => { let x = 0; while (el && el !== c.line) { x += el.offsetLeft; el = el.offsetParent; } return x; };
  const xs = c.grads.map((g) => ({ g, x: offX(g), w: g.offsetWidth }));
  const x0 = Math.min(...xs.map((a) => a.x)), x1 = Math.max(...xs.map((a) => a.x + a.w));
  c.gm = { items: xs.map((a) => ({ g: a.g, dx: a.x - x0 })), W: Math.max(1, x1 - x0) };
}
function renderGrads(c, lt) {
  if (!c.gm) measureGrads(c);
  const { items, W } = c.gm;
  const drift = ((lt * GRAD_V) % GRAD_P + GRAD_P) % GRAD_P;
  const band = W * 0.55;
  const f = inOutCubic(seg(lt, c.land + SHINE_DELAY, c.land + SHINE_DELAY + SHINE_DUR));
  const sx = lerp(-band, W, f); // band's left edge in phrase px
  for (const { g, dx } of items) {
    g.style.backgroundSize = `${band.toFixed(1)}px 100%, ${GRAD_P}px 100%`;
    g.style.backgroundPosition = `${(sx - dx).toFixed(1)}px 0, ${(-drift - dx).toFixed(1)}px 0`;
  }
}

// the font's cap height in px at the card size, so wordmarks / logos seat on the baseline and cap line
function measureCaps() {
  const cv = document.createElement('canvas').getContext('2d');
  for (const s of SEGS) {
    if (s.kind !== 'card' || !s.card) continue;
    const cs = getComputedStyle(s.card.line);
    cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = cv.measureText('HIKMN');
    const cap = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.71;
    s.card.line.style.setProperty('--cap', cap.toFixed(2) + 'px');
    s.card.gm = null; // re-measure the gradient phrase at the new metrics
  }
}

// ---------- the end card (waffles-website drawEnd, plus the 3D void of the tabs scene) ----------
// The lockup keeps its exact text and order; it is only wrapped in the same rig/camera pair the panel uses
// (.void3d gives the perspective, .rig3d the slow orbit, .cam3d the lock row), so the end card reads as the same
// object the cut was flying around. The model logos orbit behind it at their own radius, blurred by distance.
const RING = ['openai-logo.svg', 'gemini-logo.svg', 'deepseek-logo.svg', 'doordash-logo.svg', 'reddit-logo.svg'];
function buildEnd(sec) {
  sec.innerHTML = `<div class="lock ask-end end3d">
  <div class="void3d">
    <div class="ring3d">${RING.map((f) => `<img src="${B(f)}" alt=""/>`).join('')}</div>
    <div class="rig3d"><div class="cam3d">
      <div class="words"><div class="end-slide"><h1>EVERY MODEL.<br> ONE CHAT.</h1></div></div>
      <div class="face"></div>
    </div></div>
  </div>
</div>`;
  const mark = shell.makeMark(220);
  sec.querySelector('.face').appendChild(mark.el);
  const ring = sec.querySelector('.ring3d');
  return {
    face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), mark,
    words: sec.querySelector('.words'), rig: sec.querySelector('.rig3d'), ring,
    orbs: [...ring.querySelectorAll('img')].map((node, i) => ({
      node, r: 330 + i * 72, ph: (i / RING.length) * Math.PI * 2, sp: 0.15 + 0.05 * (i % 3), y: -54 + i * 27,
    })),
  };
}
function renderEnd(e, lt, t) {
  const f = seg(lt, 0, 0.5);
  lib.op(e.face, f);
  // the mascot comes forward off the wall, nearer the camera than the line
  e.face.style.transform = `translateZ(${(112 * outCubic(f)).toFixed(1)}px) scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  const w = seg(lt, 0.3, 1.0);
  // the line slides out from behind the mascot (it sits to the line's right)
  e.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  lib.op(e.slide, w);
  // the line is pushed forward on its own z and orbits slowly, and the whole rig breathes around it
  e.words.style.transform = `translateZ(${(74 * outCubic(w)).toFixed(1)}px) rotateY(${(-3.2 * Math.sin(lt * 0.55)).toFixed(2)}deg)`;
  e.rig.style.transform = `rotateX(${(1.4 * Math.sin(lt * 0.37)).toFixed(2)}deg) rotateY(${(2.6 * Math.sin(lt * 0.29)).toFixed(2)}deg) rotateZ(${(0.6 * Math.sin(lt * 0.23)).toFixed(2)}deg)`;
  // the ring: each logo on its own radius, phase and speed, behind the lockup, dimmed and softened by distance
  e.ring.style.transform = `translateZ(-420px) rotateX(${(-7 * Math.sin(lt * 0.4)).toFixed(2)}deg)`;
  for (const o of e.orbs) {
    const a = o.ph + lt * o.sp;
    const x = Math.cos(a) * o.r, z = Math.sin(a) * o.r;
    const near = (z + o.r) / (2 * o.r);
    o.node.style.transform = `translate3d(${x.toFixed(1)}px, ${(o.y + Math.sin(a * 0.7 + o.ph) * 26).toFixed(1)}px, ${z.toFixed(1)}px) scale(${(0.7 + 0.5 * near).toFixed(3)})`;
    o.node.style.opacity = (0.18 + 0.38 * near).toFixed(3);
    o.node.style.filter = `blur(${((1 - near) * 2.4).toFixed(2)}px)`;
  }
  e.mark.render(lt);
}

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
await Promise.all(sceneIds.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=12`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=14`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[do-that-too] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id] || 8, broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
for (const [kind, id] of SEQUENCE) {
  const dur = kind === 'card' ? CARDS[id].dur : kind === 'end' ? END_DUR : Math.max(0.5, +MODS[id].dur || FALLBACK_DUR[id] || 8);
  const sec = document.createElement('section');
  sec.className = 'scene';
  sec.id = kind === 'card' ? `c-${id}` : `s-${id}`;
  stage.insertBefore(sec, dip);
  SEGS.push({ kind, id, t0: +acc.toFixed(4), t1: +(acc + dur).toFixed(4), dur, sec });
  acc += dur;
}
const CYCLE = +acc.toFixed(4);
const T = {};
SEGS.forEach((s) => { T[s.kind === 'card' ? 'card_' + s.id : s.id] = s.t0; });
window.__AD = { segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE, cardK: K, cardSettle: Object.fromEntries(Object.entries(CARDS).map(([id, c]) => [id, +settleAt(c, K).toFixed(3)])) };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[do-that-too] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
}
function markBroken(s) {
  s.broken = true;
  s.sec.innerHTML = `<div class="scene-err">scene "${s.id}" unavailable</div>`;
}
for (const s of SEGS) {
  if (s.kind === 'card') s.card = buildCard(s.sec, CARDS[s.id]);
  else if (s.kind === 'end') s.end = buildEnd(s.sec);
  else {
    s.mod = MODS[s.id];
    if (s.mod.broken) { markBroken(s); continue; }
    try { s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); markBroken(s); }
  }
}
measureCaps();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureCaps);

// ---------- draw one frame ----------
let active = null;
function render(t) {
  ctx.W = W(); ctx.t = t;
  let cur = SEGS[SEGS.length - 1];
  for (const s of SEGS) if (t >= s.t0 && t < s.t1) { cur = s; break; }
  if (active !== cur) {
    if (active) { active.sec.classList.remove('on'); active.sec.style.opacity = '0'; }
    cur.sec.classList.add('on');
    active = cur;
  }
  const lt = clamp(t - cur.t0, 0, cur.dur);
  if (cur.kind === 'card') {
    cur.sec.style.opacity = '1';
    renderCard(cur.card, lt, cur.dur);
  } else if (cur.kind === 'end') {
    cur.sec.style.opacity = '1';
    renderEnd(cur.end, lt, t);
  } else {
    cur.sec.style.opacity = (seg(lt, 0, SCENE_IN) * (1 - seg(lt, cur.dur - SCENE_FADE, cur.dur))).toFixed(3);
    if (!cur.broken) {
      try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
    }
  }
  // the dip at the loop: the end card goes to black over its last DIP seconds (t=0 opens on black too)
  dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
}

// ---------- fit the stage to the window (assets/ar.js sets the width) ----------
function fit() {
  const w = W();
  stage.style.width = w + 'px';
  const k = Math.min(innerWidth / w, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();
addEventListener('archange', () => { fit(); measureCaps(); lastT = NaN; });

// ---------- the clock (waffles-website) ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function setTime(t) { offset = t; t0 = performance.now(); }
function restart() { setTime(0); paused = false; }
window.__V7 = { CYCLE, SPEED: 1, restart, T };
addEventListener('keydown', (e) => {
  if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25)); paused = true; }
  else if (e.key === 'r' || e.key === 'R') restart();
});
let lastT = NaN;
function frame() {
  let t = clockNow();
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  t = Math.round(t * FPS) / FPS;
  if (t >= CYCLE) t = 0;
  render(t); lastT = t;
  requestAnimationFrame(frame);
}
render(((offset % CYCLE) + CYCLE) % CYCLE);
requestAnimationFrame(frame);
// frame-exact export/QA: pause the clock and draw t now
window.__AD.seek = (t) => { paused = true; offset = t; const c = ((t % CYCLE) + CYCLE) % CYCLE; render(c); lastT = c; };
window.__AD.ready = true;
