// bikeride-aeon-switch-superbot: the bikeride-model-switch engine with two beats borrowed from the A24 teaser's
// grammar, placed around the bike chat unchanged.
//   INTRO  an "A24"-style cold open: the superbot wordmark over a breathing green horizon, under a spoken line.
//   SCENE  the one-ask chat, untouched (four "Switching to X" pills, one ask the whole spot is about).
//   END    a three-card title run over the ride, a black breath, then a chrome wordmark card (the "AAA24" close).
// A music bed and the spoken lines run under all of it (audio.js); the bed rewinds with the loop. Same clock contract
// as the original: ?t=<s> freezes a frame (and stays silent), ?t=<s>&play=1 plays on, space pauses, arrows step 0.25s,
// R restarts; window.__AD.seek(t) draws t and holds.
import * as lib from './lib.js';
import * as shell from './shell.js';
import * as audio from './audio.js';
import { CUT } from './scenes/tabs-assets/cut.js?v=e2834f7d';

const { clamp, lerp, seg, outCubic, outQuint } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence ----------
const SEQUENCE = [
  ['intro', 'intro'],
  ['scene', 'tabs'],
  ['end', 'end'],
];
const INTRO_DUR = 2.2;
const END_DUR = 6.4, DIP = 0.35; /* deliberate */ // the end card holds; the dip to black at the loop
const SCENE_FADE = 0.3;
// durations if a module fails to load (tabs mirrors chat.js by hand: chat end + 0.3 s fade)
const FALLBACK_DUR = { intro: INTRO_DUR, tabs: CUT === 'nozoom' ? 19.75 : 21.35 };

const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const poster = new URL('./img/bike/poster.jpg', import.meta.url).href;

// ---------- the intro (the A24 cold open) ----------
function buildIntro(sec) {
  sec.innerHTML = `<div class="aeon"><i class="aeon-arc"></i>
    <div class="aeon-lock">
      <div class="aeon-mark"></div>
      <div class="aeon-word">superbot</div>
      <div class="aeon-tag">One ask. Every model.</div>
    </div></div>`;
  const mark = shell.makeMark(84);
  sec.querySelector('.aeon-mark').appendChild(mark.el);
  return { sec, mark, lock: sec.querySelector('.aeon-lock'), tag: sec.querySelector('.aeon-tag'), arc: sec.querySelector('.aeon-arc') };
}
function renderIntro(e, lt) {
  const rm = reducedMotion();
  const inn = rm ? 1 : outCubic(seg(lt, 0, 0.65));
  const out = seg(lt, INTRO_DUR - 0.45, INTRO_DUR);
  e.sec.style.opacity = (inn * (1 - out)).toFixed(3);
  e.lock.style.transform = `translate(-50%, -50%) translateY(${((1 - inn) * 18).toFixed(2)}px) scale(${lerp(0.95, 1, inn).toFixed(4)})`;
  e.tag.style.opacity = ((rm ? 1 : outCubic(seg(lt, 0.75, 1.3))) * (1 - out)).toFixed(3);
  e.arc.style.opacity = (0.72 + 0.28 * Math.sin(lt * 0.9)).toFixed(3);
  e.mark.render(lt);
}

// ---------- the end card (title run over the ride, then the chrome card) ----------
const END_CARDS = [
  { t: 0.35, text: 'One ask.' },
  { t: 1.75, text: 'Gemini. Blender. ElevenLabs. Opus.' },
  { t: 3.15, text: 'superbot.gg' },
];
const END_BLACK = 4.25;   // the plate and titles leave; black holds a breath
const END_CHROME = 4.75;  // the chrome wordmark card rises
function buildEnd(sec) {
  sec.innerHTML = `<div class="aeon-end">
    <div class="aeon-plate"><img src="${poster}" alt=""/></div>
    <div class="aeon-scrim"></div>
    <div class="aeon-cards">${END_CARDS.map((c) => `<div class="aeon-card">${c.text}</div>`).join('')}</div>
    <div class="aeon-chrome">
      <div class="stack"><div class="mark"></div><div class="chromeword">superbot</div></div>
      <div class="row top"><span>One ask. Every model.</span></div>
      <div class="row bot"><span>superbot.gg</span></div>
    </div></div>`;
  const mark = shell.makeMark(66);
  sec.querySelector('.aeon-chrome .mark').appendChild(mark.el);
  return {
    sec, mark,
    plate: sec.querySelector('.aeon-plate'),
    plateImg: sec.querySelector('.aeon-plate img'),
    scrim: sec.querySelector('.aeon-scrim'),
    cards: [...sec.querySelectorAll('.aeon-card')],
    chrome: sec.querySelector('.aeon-chrome'),
  };
}
function renderEnd(e, lt) {
  const rm = reducedMotion();
  const pin = rm ? 1 : outCubic(seg(lt, 0, 0.5));
  const plateOut = 1 - seg(lt, END_BLACK - 0.25, END_BLACK);
  e.plate.style.opacity = (pin * plateOut).toFixed(3);
  e.plateImg.style.transform = `scale(${lerp(1.08, 1.18, clamp(lt / END_DUR)).toFixed(4)})`;
  e.scrim.style.opacity = plateOut.toFixed(3);
  // three title cards, hard cut one to the next (the teaser snaps, it does not cross-fade)
  e.cards.forEach((c, i) => {
    const t0 = END_CARDS[i].t, t1 = i + 1 < END_CARDS.length ? END_CARDS[i + 1].t : END_BLACK;
    const on = lt >= t0 && lt < t1;
    c.style.opacity = (on ? (rm ? 1 : seg(lt, t0, t0 + 0.05)) : 0).toFixed(3);
    const rise = rm ? 1 : outCubic(seg(lt, t0, t0 + 0.3));
    c.style.transform = `translateY(${((1 - rise) * 12).toFixed(2)}px)`;
  });
  // black breath, then the chrome wordmark card
  const cin = rm ? 1 : seg(lt, END_CHROME, END_CHROME + 0.5);
  const cout = 1 - seg(lt, END_DUR - DIP, END_DUR);
  e.chrome.style.opacity = (cin * cout).toFixed(3);
  e.chrome.style.transform = `scale(${lerp(0.93, 1, rm ? 1 : outQuint(seg(lt, END_CHROME, END_DUR - DIP))).toFixed(4)})`;
  e.mark.render(lt);
}

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {};
await Promise.all(sceneIds.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=b37d209c`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const m = (await import(`./scenes/${id}.js?v=b37d209c`)).default;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[aeon] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
    MODS[id] = { id, dur: FALLBACK_DUR[id] || 8, broken: true, mount() {}, render() {} };
  }
}));

// ---------- lay the timeline ----------
const SEGS = [];
let acc = 0;
for (const [kind, id] of SEQUENCE) {
  const dur = kind === 'end' ? END_DUR : kind === 'intro' ? INTRO_DUR : Math.max(0.5, +MODS[id].dur || FALLBACK_DUR[id] || 8);
  const sec = document.createElement('section');
  sec.className = 'scene';
  sec.id = `s-${id}`;
  stage.insertBefore(sec, dip);
  SEGS.push({ kind, id, t0: +acc.toFixed(4), t1: +(acc + dur).toFixed(4), dur, sec });
  acc += dur;
}
const CYCLE = +acc.toFixed(4);
const T = {};
SEGS.forEach((s) => { T[s.id] = s.t0; });
window.__AD = { segments: SEGS.map(({ kind, id, t0, t1 }) => ({ kind, id, t0, t1 })), CYCLE, cut: CUT };

// ---------- mount ----------
const ctx = { W: W(), H, t: 0, lib, shell };
const errSeen = new Set();
function report(s, phase, err) {
  const key = `${s.id}:${phase}:${err && err.message}`;
  if (errSeen.has(key)) return;
  errSeen.add(key);
  console.error(`[aeon] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
}
function markBroken(s) {
  s.broken = true;
  s.sec.innerHTML = `<div class="scene-err">scene "${s.id}" unavailable</div>`;
}
for (const s of SEGS) {
  if (s.kind === 'end') s.end = buildEnd(s.sec);
  else if (s.kind === 'intro') s.intro = buildIntro(s.sec);
  else {
    s.mod = MODS[s.id];
    if (s.mod.broken) { markBroken(s); continue; }
    try { s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); markBroken(s); }
  }
}

// ---------- draw one frame ----------
let active = null;
function render(t) {
  ctx.W = W(); ctx.t = t;
  let cur = SEGS[SEGS.length - 1];
  for (const s of SEGS) if (t >= s.t0 && t < s.t1) { cur = s; break; }
  if (active !== cur) {
    if (active) { active.sec.classList.remove('on'); active.sec.style.opacity = '0'; }
    cur.sec.classList.add('on');
    if (cur.kind === 'intro' && !paused) audio.say('vo8'); // the cold-open line, once per pass
    active = cur;
  }
  const lt = clamp(t - cur.t0, 0, cur.dur);
  if (cur.kind === 'end') { cur.sec.style.opacity = '1'; renderEnd(cur.end, lt); }
  else if (cur.kind === 'intro') { cur.sec.style.opacity = '1'; renderIntro(cur.intro, lt); }
  else {
    cur.sec.style.opacity = (seg(lt, 0, SCENE_FADE) * (1 - seg(lt, cur.dur - SCENE_FADE, cur.dur))).toFixed(3);
    if (!cur.broken) { try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); } }
  }
  dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
}

// ---------- fit the stage to the window ----------
function fit() {
  const w = W();
  stage.style.width = w + 'px';
  const k = Math.min(innerWidth / w, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit); fit();
addEventListener('archange', () => {
  fit(); lastT = NaN;
  for (const s of SEGS) if (s.kind === 'end') s.end = buildEnd(s.sec);
});

// ---------- the clock ----------
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
let paused = freeze, offset = hasT ? parseFloat(q.get('t')) || 0 : 0, t0 = performance.now();
const clockNow = () => (paused ? offset : offset + (performance.now() - t0) / 1000);
function setTime(t) { offset = t; t0 = performance.now(); }
function restart() { setTime(0); paused = false; if (window.__AUDIO) { try { window.__AUDIO.bed && (window.__AUDIO.bed.currentTime = 0); } catch (e) {} } }
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
  const wrapped = !Number.isNaN(lastT) && t < lastT;
  audio.syncBed(!paused, wrapped);   // the bed follows the clock; rewinds on the loop
  render(t); lastT = t;
  requestAnimationFrame(frame);
}
render(((offset % CYCLE) + CYCLE) % CYCLE);
requestAnimationFrame(frame);
// frame-exact export/QA: pause the clock and draw t now
window.__AD.seek = (t) => { paused = true; offset = t; const c = ((t % CYCLE) + CYCLE) % CYCLE; render(c); lastT = c; };
window.__AD.ready = true;