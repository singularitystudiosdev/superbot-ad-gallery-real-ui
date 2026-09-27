// blockhaven-not-just-opus-superbot-2ab31e2c: "It's not just Opus 5.5." A fork of make-minecraft-every-model with
// pocketsflow-untold's tweet, Meshy and ElevenLabs beats ported in.
// The claim, answered from the Reddit discovery pass (r/llm_ai, rank 2, RISING complaint "Output quality, regressions
// and refusals", 1,985 authors, what they want: stable model performance): superbot does not bet the job on one model;
// each part of it goes to the model that does that part best, in one chat. The spot opens on the most-shared proof of
// one model (Noah Wachnik's "Opus 5.5, The Minecraft Test." post), mines it like a Minecraft block, and shows the
// same game being made by six models in turn, with a Minecraft hotbar holding them.
//   intro   0 to 5.2   the post, the HUD comes on, ten hits crack it, it shatters, its dropped item flies to slot 1
//   cards   5.2 to 8.6 "Everyone credits Opus 5.5." / "The secret?" (slots 2 to 6 fill) / "It's not just Opus 5.5."
//   tabs    the hub: one ask, six hand-offs, each hopping the hotbar's selection; ends pushed into the Play card
//   clip    @kepochnik's BlockHaven gameplay at full frame, the ad hotbar handing over to the in-game one
//   end     "Every model. One chat." over "It's not just Opus 5.5.", the hotbar back under it
// The engine: the whole spot is a pure function of t. ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there,
// space pauses, arrows step 0.25s, R restarts; a 60fps quantised clock. Scene modules (scenes/<id>.js) are mounted
// once and rendered only while active; black text cards and the end card are drawn here; the stage hotbar
// (hotbar.js) runs over all of them on a schedule written from the segment table (hotbarSchedule).
import * as lib from './lib.js';
import * as shell from './shell.js';
import { CFG } from './scenes/tabs-assets/cuts.js?v=6';
import { mountHotbar, renderHotbar, APP_SLOT, NAMES, SLOTS } from './hotbar.js?v=2';

const { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const dip = document.getElementById('dip');

// ---------- the sequence (CONTRACT.txt) ----------
const SEQUENCE = [
  ['scene', 'intro'],
  ['card', 'credits'],
  ['card', 'secret'],
  ['card', 'notjust'],
  ['scene', 'tabs'],
  ['scene', 'clip'],
  ['end', 'end'],
];
// the durations a scene gets if its module fails to load (so the spot keeps its shape)
const FALLBACK_DUR = { intro: 5.2, tabs: 17, clip: 6.3 };
const SCENE_FADE = 0.3;
const END_DUR = 3.5, DIP = 0.35;
// joins played as straight cuts (no fade on either side): the shatter's black into the first card, card to card, and
// the push into the Play card into the clip on the same framing. The spot also opens on the post with no fade in.
const HARD_CUTS = new Set(['intro>credits', 'credits>secret', 'secret>notjust', 'tabs>clip']);

// ---------- text cards ----------
// A part is a word string, or { img, cls, alt, after } for a brand wordmark (after = trailing punctuation),
// or { html } for styled words. The last part and the logo are kept on one line (never orphan the logo).
const B = (f) => new URL('./brand/' + f, import.meta.url).href;
const CARDS = {
  credits: { dur: 1.2, parts: ['Everyone', 'credits', 'Opus\u00a05.5.'] },
  secret: { dur: 0.9, parts: ['The', 'secret?'] },
  notjust: { dur: 1.3, parts: ['It’s', { g: 'not' }, { g: 'just' }, 'Opus\u00a05.5.'] },
};
// card motion (seconds, local): words rise 18px + unblur 8px, outQuint .55s, staggered .06s
// The design timings are scaled by one factor K shared by every card, chosen so the busiest card still has
// its text fully landed and its logo fully popped READ_HOLD seconds before its exit starts (same motion on all).
// These cards are short (0.9 to 1.3 s, a beat each), so the hold before the exit is READ_HOLD = 0.4 s.
const W_RISE = 18, W_BLUR = 8, CARD_OUT = 0.2, READ_HOLD = 0.4;
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

// ---------- the end card (waffles-website drawEnd) ----------
function buildEnd(sec) {
  sec.innerHTML = '<div class="lock ask-end"><div class="words"><div class="end-slide"><h1>' + CFG.end + '</h1><p class="end-sub">' + CFG.endSub + '</p></div></div><div class="face"></div></div>';
  const mark = shell.makeMark(220);
  sec.querySelector('.face').appendChild(mark.el);
  return { face: sec.querySelector('.face'), slide: sec.querySelector('.end-slide'), mark };
}
function renderEnd(e, lt, t) {
  const f = seg(lt, 0, 0.5);
  lib.op(e.face, f);
  e.face.style.transform = `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})`;
  const w = seg(lt, 0.3, 1.0);
  // the line slides out from behind the mascot (it sits to the line's right)
  e.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  lib.op(e.slide, w);
  e.mark.render(lt);
}

// ---------- load the scene modules (a broken module must not take the spot down) ----------
const sceneIds = SEQUENCE.filter(([k]) => k === 'scene').map(([, id]) => id);
const MODS = {}, NS = {};
await Promise.all(sceneIds.map(async (id) => {
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = new URL(`./scenes/${id}.css?v=1`, import.meta.url).href;
  document.head.appendChild(css);
  try {
    const ns = await import(`./scenes/${id}.js?v=1`);
    const m = ns.default;
    NS[id] = ns;
    if (!m || typeof m.render !== 'function') throw new Error(`scenes/${id}.js has no default { dur, mount, render } export`);
    MODS[id] = m;
  } catch (err) {
    console.error(`[blockhaven] scene "${id}" failed to load:`, err && err.stack ? err.stack : err);
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
SEGS.forEach((s, i) => {
  const prev = SEGS[i - 1], next = SEGS[i + 1];
  s.fadeIn = !!prev && !HARD_CUTS.has(`${prev.id}>${s.id}`);
  s.fadeOut = !next || !HARD_CUTS.has(`${s.id}>${next.id}`);
});
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
  console.error(`[blockhaven] scene "${s.id}" threw in ${phase}:`, err && err.stack ? err.stack : err);
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

// ---------- the stage hotbar's schedule (hotbar.js), from the segment table and the scenes' own constants ----------
//   intro: off until the HUD comes on (INTRO.HUD), full size at the bottom; the dropped item lands in slot 1
//   cards: slot 1's name holds through "Everyone credits Opus 5.5."; slots 2 to 6 pop in on "The secret?"; the
//          selection sweeps the six on "It's not just Opus 5.5." and lands on Superbot
//   tabs:  docked small in the strip tabs.js keeps free (HB_STRIP); every routing hand-off (ROUTES) hops the
//          selection to that model's slot and shows its name
//   clip:  it moves onto the in-game hotbar (clip.js gameHotbar) as the clip settles, selects slot 1 like the game
//          does, and fades out, leaving the game's own hotbar in its place
//   end:   back under the end card, Superbot selected
function hotbarSchedule() {
  const Wd = W();
  const S_ = (id) => SEGS.find((x) => x.id === id);
  const intro = S_('intro'), c2 = S_('secret'), c3 = S_('notjust'), tabs = S_('tabs'), clip = S_('clip'), end = S_('end');
  const I = (NS.intro && NS.intro.INTRO) || { HUD: 2.2, DROP: 4.58, PICK: 4.95, LAND: 5.3 };
  const strip = (NS.tabs && NS.tabs.HB_STRIP) || 108;
  const routes = (NS.tabs && NS.tabs.ROUTES) || [];
  const game = NS.clip && NS.clip.gameHotbar ? NS.clip.gameHotbar(Wd) : { cx: Wd / 2, top: 1026, u: 2.92 };
  const settle = (NS.clip && NS.clip.CLIP && NS.clip.CLIP.COVER_OUT[1]) || 0.55;
  const DOCK_U = 2.6;
  const FULL = { cx: Wd / 2, by: H - 26, u: 4 };
  const DOCK = { cx: Wd / 2, by: H - Math.max(6, (strip - 22 * DOCK_U - 40) / 2), u: DOCK_U };
  const GAME = { cx: game.cx, by: game.top + 22 * game.u, u: game.u };
  const END = { cx: Wd / 2, by: H - 44, u: 3.2 };
  const sweep = [1, 2, 3, 4, 5].map((slot, i) => ({ t: c3.t0 + 0.18 + i * 0.11, slot }));
  const last = sweep[sweep.length - 1].t;
  const key = (app) => SLOTS[APP_SLOT[app]];
  return {
    pos: [
      { t: 0, ...FULL },
      { t: tabs.t0 - 0.05, dur: 0.5, ...DOCK },
      { t: clip.t0, dur: settle, ...GAME },
      { t: end.t0, dur: 0, ...END },
    ],
    op: [
      { t: 0, v: 0 },
      { t: intro.t0 + I.HUD, dur: 0.25, v: 1 },
      { t: clip.t0 + 0.28, dur: 0.36, v: 0 },
      { t: end.t0 + 0.7, dur: 0.35, v: 1 },
    ],
    sel: [
      { t: 0, slot: 0 },
      ...sweep,
      ...routes.map((r) => ({ t: tabs.t0 + r.at, slot: APP_SLOT[r.app] })),
      { t: clip.t0 + 0.04, slot: 0 },
      { t: end.t0 + 0.95, slot: 5 },
    ],
    tip: [
      { t: intro.t0 + I.LAND, text: NAMES.claude, hold: 1.05 },
      { t: last + 0.02, text: NAMES.superbot, hold: 0.45 },
      ...routes.map((r) => ({ t: tabs.t0 + r.at, text: NAMES[key(r.app)], hold: 1.3 })),
      { t: end.t0 + 0.95, text: NAMES.superbot, hold: 10 },
    ],
    fill: [intro.t0 + I.LAND, ...[0, 1, 2, 3, 4].map((i) => c2.t0 + 0.08 + i * 0.075)],
    drop: { t0: intro.t0 + I.DROP, tPick: intro.t0 + I.PICK, tLand: intro.t0 + I.LAND, x: Wd / 2, y: 500 },
  };
}
const HB = mountHotbar(stage, dip);
let HBS = hotbarSchedule();
window.__AD.hotbar = HBS;

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
    const fi = cur.fadeIn ? seg(lt, 0, SCENE_FADE) : 1;
    const fo = cur.fadeOut ? 1 - seg(lt, cur.dur - SCENE_FADE, cur.dur) : 1;
    cur.sec.style.opacity = (fi * fo).toFixed(3);
    if (!cur.broken) {
      try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); }
    }
  }
  renderHotbar(HB, t, HBS);
  // the dip at the loop: the end card goes to black over its last DIP seconds
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
addEventListener('archange', () => { fit(); measureCaps(); HBS = hotbarSchedule(); window.__AD.hotbar = HBS; lastT = NaN; });

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
