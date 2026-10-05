// every-model-one-chat, usage-limit cold open (r1-e). The engine, forked from ../every-model-one-chat-superbot-efa8df82/
// timeline.js: the spot is a pure function of t. It opens on Claude's usage-limit notice mid-task (claude/claude.js,
// frame 0 is the finished still), cuts to one black card, then the superbot hub picks the same task up and finishes
// it, one model per step (scenes/tabs.js + tabs-assets/chat.js), and lands on the source's end card.
// ?t=<s> freezes a frame, ?t=<s>&play=1 plays on, space pauses, arrows step, R restarts. In render mode
// (window.__RENDER__, set by the motion-reel renderer) there is no rAF loop: window.seek(t) paints frame t.
import * as lib from './lib.js';
import * as shell from './shell.js';

const { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');
const RENDER = !!window.__RENDER__;
// seek exists from the first tick (the renderer probes for it on load); it waits for mount before painting
let markReady; const READY = new Promise((r) => { markReady = r; });
let paint = () => {};
// render mode: the stage sits at the viewport origin from the first tick (the renderer reads its box on load)
if (RENDER) { stage.style.left = '0'; stage.style.top = '0'; stage.style.transform = 'none'; }
window.seek = async (t) => { await READY; paint(t); };

// ---------- the sequence ----------
const SEQUENCE = [
  ['scene', 'claude'],
  ['card', 'pick'],
  ['scene', 'tabs'],
  ['end', 'end'],
];
const SCENE_SRC = {
  claude: { js: './claude/claude.js?v=6', css: './claude/claude.css?v=2', fadeIn: 0, fadeOut: 0 },
  // the hub dissolves in through the card's last XF seconds (no black between); it cuts to the end card on the
  // held meme (no dip to black)
  tabs: { js: './scenes/tabs.js?v=25', css: './scenes/tabs.css?v=10', fadeIn: 0, fadeOut: 0.15, xfade: true },
};
const FALLBACK_DUR = { claude: 2.85, tabs: 15 };
const XF = 0.3;
const END_DUR = 3.2, DIP = 0.3;

// ---------- the black card ----------
const A = (f) => new URL('./scenes/tabs-assets/' + f, import.meta.url).href;
const CARDS = {
  // the switch, not 'no limits': superbot routes the task to another model
  pick: { dur: 1.3, parts: ['Switch', 'models', 'in', { g: 'superbot' }], logo: { src: A('mark-clean.svg'), cls: 'lg lg-sb', alt: '' } },
};
const W_RISE = 18, W_BLUR = 8, CARD_OUT = 0.2, READ_HOLD = 0.4;
const BASE = { in: 0.08, stag: 0.06, dur: 0.5, gap: 0.12, logo: 0.4 };
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
      const gt = document.createElement('span');
      gt.className = 'gt'; gt.textContent = part.g;
      w.appendChild(gt); grads.push(gt);
    } else if (part.html) w.innerHTML = part.html;
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

function renderCard(c, lt, dur, lead) {
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
  // lead: the next scene dissolves in over the last XF seconds, so the line is gone (lifting away) before it shows
  const e = inOutCubic(lead ? seg(lt, dur - XF - 0.2, dur - XF) : seg(lt, dur - CARD_OUT, dur));
  c.line.style.opacity = (1 - e).toFixed(3);
  c.line.style.transform = `translateY(${(-36 * e).toFixed(2)}px) scale(${(lerp(1, 1.035, seg(lt, 0, dur)) * lerp(1, 0.985, e)).toFixed(4)})`;
}

// the superbot storm gradient on the gradient words (the source's renderGrads, unchanged)
const GRAD_P = 900, GRAD_V = 110, SHINE_DELAY = 0.08, SHINE_DUR = 0.9;
function measureGrads(c) {
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
  const sx = lerp(-band, W, f);
  for (const { g, dx } of items) {
    g.style.backgroundSize = `${band.toFixed(1)}px 100%, ${GRAD_P}px 100%`;
    g.style.backgroundPosition = `${(sx - dx).toFixed(1)}px 0, ${(-drift - dx).toFixed(1)}px 0`;
  }
}
function measureCaps() {
  const cv = document.createElement('canvas').getContext('2d');
  for (const s of SEGS) {
    if (s.kind !== 'card' || !s.card) continue;
    const cs = getComputedStyle(s.card.line);
    cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = cv.measureText('HIKMN');
    const cap = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.71;
    s.card.line.style.setProperty('--cap', cap.toFixed(2) + 'px');
    s.card.gm = null;
  }
}

// ---------- the end card (the source's, plus the product's address) ----------
function buildEnd(sec) {
  sec.innerHTML = '<div class="lock ask-end"><div class="words"><div class="end-slide"><h1>EVERY MODEL.<br> ONE CHAT.</h1><p class="end-line">Hit a limit? Switch models.</p><p class="end-url">superbot.gg</p></div></div><div class="face"></div></div>';
  const mark = shell.makeMark(220);
  sec.querySelector('.face').appendChild(mark.el);
  return { face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), line: sec.querySelector('.end-line'), url: sec.querySelector('.end-url'), mark };
}
function renderEnd(e, lt) {
  // the mark pops in at full strength (no dim hold on black)
  const f = seg(lt, 0, 0.35);
  lib.op(e.face, clamp(f * 3));
  e.face.style.transform = `scale(${lerp(0.6, 1, outBack(f)).toFixed(4)})`;
  const w = seg(lt, 0.15, 0.8);
  e.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  lib.op(e.slide, w);
  const l = outCubic(seg(lt, 0.55, 1.0));
  lib.op(e.line, l);
  e.line.style.transform = `translateY(${((1 - l) * 16).toFixed(2)}px)`;
  const u = outCubic(seg(lt, 0.8, 1.25));
  lib.op(e.url, u);
  e.url.style.transform = `translateY(${((1 - u) * 14).toFixed(2)}px)`;
  // a slow push through the hold
  e.slide.parentNode.parentNode.style.transform = `scale(${lerp(1, 1.03, seg(lt, 0, END_DUR)).toFixed(4)})`;
  e.mark.render(lt);
}

// ---------- load the scene modules ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
await Promise.all(sceneIds.map(async (id) => {
  const src = SCENE_SRC[id];
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(src.css, import.meta.url).href;
  document.head.appendChild(css);
  await new Promise((res) => { css.onload = res; css.onerror = res; });
  try {
    const m = (await import(src.js)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`${src.js} has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[film] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
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
window.__AD = { segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell };
function report(s, phase, err) { console.error(`[film] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err); }
for (const s of SEGS) {
  if (s.kind === 'card') s.card = buildCard(s.sec, CARDS[s.id]);
  else if (s.kind === 'end') s.end = buildEnd(s.sec);
  else {
    s.mod = MODS[s.id];
    if (s.mod.broken) { s.broken = true; continue; }
    try { s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); s.broken = true; }
  }
}
// every face and image decoded before frame 0
if (document.fonts) {
  const faces = ['400 16px anthropic-serif', '500 14px anthropic-sans', '400 16px anthropic-sans', '20px Anthropicons-Variable'];
  await Promise.all(faces.map((f) => document.fonts.load(f).catch(() => {})));
  await document.fonts.ready;
}
await Promise.all([...document.images].map((im) => (im.decode ? im.decode().catch(() => {}) : null)));
measureCaps();

// ---------- draw one frame ----------
let active = null, partner = null;
// does this card dissolve into the scene after it?
const xf0 = (s) => { const n = SEGS[SEGS.indexOf(s) + 1]; return s.kind === 'card' && !!n && n.kind === 'scene' && !!SCENE_SRC[n.id].xfade && !n.broken; };
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
  // a card dissolves straight into a scene marked xfade: the scene, held on its first frame, rises over the card's
  // last XF seconds while the card's line fades out
  const nx = SEGS[SEGS.indexOf(cur) + 1];
  const xf = xf0(cur) ? seg(lt, cur.dur - XF, cur.dur) : 0;
  if (partner && partner !== cur && (partner !== nx || xf <= 0)) { partner.sec.classList.remove('on'); partner.sec.style.opacity = '0'; }
  partner = null;
  if (xf > 0) {
    nx.sec.classList.add('on');
    nx.sec.style.opacity = inOutCubic(xf).toFixed(3);
    try { nx.mod.render(0, ctx); } catch (err) { report(nx, 'render', err); }
    partner = nx;
  }
  if (cur.kind === 'card') {
    cur.sec.style.opacity = '1';
    renderCard(cur.card, lt, cur.dur, xf0(cur));
  } else if (cur.kind === 'end') {
    cur.sec.style.opacity = '1';
    renderEnd(cur.end, lt);
  } else {
    const src = SCENE_SRC[cur.id];
    const fi = src.fadeIn ? seg(lt, 0, src.fadeIn) : 1, fo = src.fadeOut ? 1 - seg(lt, cur.dur - src.fadeOut, cur.dur) : 1;
    cur.sec.style.opacity = (fi * fo).toFixed(3);
    if (!cur.broken) { try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); } }
  }
  // the film ends on the end card (no dip to black: a feed freezes or loops on the last frame)
  dip.style.opacity = '0';
}

// ---------- fit the stage to the window ----------
function fit() {
  const w = W();
  stage.style.width = w + 'px';
  const k = RENDER ? 1 : Math.min(innerWidth / w, innerHeight / H);
  stage.style.transform = RENDER ? 'none' : `translate(-50%, -50%) scale(${k})`;
  if (RENDER) { stage.style.left = '0'; stage.style.top = '0'; }
}
addEventListener('resize', fit); fit();

// ---------- the clock ----------
const FPS = 60;
paint = (t) => render(clamp(t, 0, CYCLE - 1e-6));
window.__AD.seek = window.seek;
if (!RENDER) {
  const q = new URLSearchParams(location.search);
  const hasT = q.has('t'), freeze = hasT && !q.has('play');
  let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
  const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
  addEventListener('keydown', (e) => {
    if (e.key === ' ') { e.preventDefault(); if (paused) { paused = false; t0 = performance.now(); } else { offset = clockNow(); paused = true; } }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset = Math.max(0, clockNow() + (e.key === 'ArrowRight' ? 1 / FPS : -1 / FPS)); paused = true; }
    else if (e.key === 'r' || e.key === 'R') { offset = 0; t0 = performance.now(); paused = false; }
  });
  const frame = () => {
    let t = clockNow();
    t = ((t % CYCLE) + CYCLE) % CYCLE;
    render(Math.round(t * FPS) / FPS);
    requestAnimationFrame(frame);
  };
  render(((offset % CYCLE) + CYCLE) % CYCLE);
  requestAnimationFrame(frame);
  window.__AD.seek = (t) => { paused = true; offset = t; render(clamp(t, 0, CYCLE - 1e-6)); };
} else {
  render(0);
}
window.__AD.ready = true;
markReady();
