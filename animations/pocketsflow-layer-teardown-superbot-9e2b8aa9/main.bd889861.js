// The spot's clock. Output first: the film plays, pauses, comes apart into its layers, each layer is traced to the
// specialist Superbot routed it to, the layers re-stack and the film resumes. render(t) is a pure function of t.
import { E, tw, prog, clamp, lerp, keys } from './ease.bd889861.js';
import { buildFilm, FILM_LEN } from './film.bd889861.js';
import { buildSuperbot, TILES } from './sb.bd889861.js';
import { mountViewer } from './viewer3d.bd889861.js';

const VO_ENV = [0.59,0.63,0.9,0.96,0.71,0.98,0.57,0.12,0.15,1,0.66,0.12,0.78,0.81,0.32,0.75,0.61,0.55,0.8,0.12,0.96,0.95,0.58,0.72,0.53,0.2,0.12,0.12,0.12,0.12,0.7,0.8,0.57,0.36,0.59,0.12,0.45,0.5,0.67,0.77,0.62,0.4,0.55,0.66,0.3,0.12,0.12,0.12];
const SCORE_ENV = [0.12,0.39,0.42,0.38,0.37,0.43,0.45,0.4,0.71,0.9,0.97,0.88,0.92,0.88,0.9,0.9,0.95,0.93,0.98,0.88,0.89,0.83,0.75,0.82,0.91,1,0.9,0.91,0.85,0.9,0.87,0.9,0.86,1,0.86,0.87,0.84,0.89,0.73,0.43,0.34,0.38,0.41,0.4,0.36,0.22,0.14,0.12];

export const CYCLE = 48.0;
// A cold open (the film plays) | B pause + explode | C trace: Superbot close-ups, alternating with stack beats where
// the delivered layers land | D the last layer lands, the stack collapses | E the film resumes from the pause | F end
const S = { A: [0, 2.0], B: [2.0, 6.0], C: [6.0, 33.1], D: [33.1, 35.2], E: [35.2, 44.1], F: [44.1, CYCLE] };
const PAUSE = 2.0, RESUME = 3.3;
// paused through the teardown; while the layers collapse the film creeps on to where it resumes, so no frame repeats
const filmTime = (t) => (t < S.A[1] ? t : t < S.D[0] ? PAUSE : t < S.E[0] ? lerp(PAUSE, RESUME, E.inOutSine(prog(t, S.D[0], S.E[0]))) : Math.min(FILM_LEN, RESUME + (t - S.E[0])));

const M = {
  keyart: 'media/keyart.jpg', keyartCut: 'media/keyart-cut.png', kling: 'media/kling.mp4', kling60: 'media/kling60.mp4', poster: 'media/film-poster.jpg', glb: 'media/mascot.glb',
  pfForm: 'media/pf-form.jpg', pfPage: 'media/pf-page.jpg', pfPhone: 'media/pf-phone.png', pfDash: 'media/pf-dash.jpg',
  shots: ['media/shot-home.jpg', 'media/shot-pricing.jpg', 'media/shot-creators.jpg'], voEnv: VO_ENV, scoreEnv: SCORE_ENV,
};

// the turn: every switch routed to the model whose job it is
const P = {
  ask: 'make a launch film for Pocketsflow',
  think: 'Planning the launch film, layer by layer',
  say: 'Your launch film is ready.',
  switches: [
    { k: 'site', tile: 'pocketsflow', label: 'pocketsflow.com', svc: true, at: 8.7, check: 10.7,
      steps: [['Opened pocketsflow.com', ''], ['Went to the pricing page', 'pocketsflow.com/pricing'], ['Read the creator pages', 'pocketsflow.com']], stepT: [[9.0, 9.5], [9.5, 10.05], [10.05, 10.6]] },
    { k: 'nb', tile: 'google', label: 'Nano Banana Pro', task: 'image', at: 12.5, check: 12.75, ready: 13.6, out: 14.6, real: 30 },
    { k: 'rodin', tile: 'generic', label: 'Rodin Gen-2', task: 'model3d', at: 15.2, check: 15.45, ready: 16.3, out: 17.4, real: 101 },
    { k: 'kling', tile: 'kling', label: 'Kling 3.0 Pro', task: 'video', at: 18.0, check: 18.25, ready: 19.1, out: 20.4, real: 110, meta: '0:05' },
    { k: 'v3', tile: 'elevenlabs', label: 'Eleven v3', task: 'audio', at: 23.6, check: 23.85, ready: 24.5, out: 25.3, real: 2, title: 'Voiceover', dur: '0:06', env: VO_ENV },
    { k: 'music', tile: 'elevenlabs', label: 'Eleven Music', task: 'audio', at: 25.9, check: 26.15, ready: 26.8, out: 27.6, real: 11, title: 'Pocketsflow launch theme', dur: '0:52', env: SCORE_ENV },
  ],
  code: { steps: [['Wrote', 'LaunchFilm.tsx'], ['Halftoned', 'mascot.mp4 + figure.glb'], ['Cut the theme to 0:12 under', 'voiceover.mp3'], ['Rendered', 'pocketsflow-launch.mp4']], film: 'pocketsflow-launch.mp4' },
  t: { dock: [7.95, 8.45], type: [7.05, 7.75], send: 7.85, think: 8.4, done: 31.4, shots: 10.85, shotsOut: 12.3, script: [11.25, 11.7],
    code: [[28.7, 29.1], [29.1, 29.5], [29.5, 29.9], [29.9, 30.3]], say: [30.35, 30.65], film: 30.7 },
  // the composer's model chip while each routed model works: [label, tile, from, to]
  chipModels: [['Claude Opus 5.5', 'anthropic'], ['Nano Banana Pro', 'google'], ['Rodin Gen-2', 'generic'], ['Kling 3.0 Pro', 'kling'], ['Eleven v3', 'elevenlabs'], ['Eleven Music', 'elevenlabs']],
  chipT: [['Claude Opus 5.5', 'anthropic', 11.05, 11.95], ['Nano Banana Pro', 'google', 12.75, 13.6], ['Rodin Gen-2', 'generic', 15.45, 16.3], ['Kling 3.0 Pro', 'kling', 18.25, 19.1],
    ['Eleven v3', 'elevenlabs', 23.85, 24.5], ['Eleven Music', 'elevenlabs', 26.15, 26.8], ['Claude Opus 5.5', 'anthropic', 28.3, 30.75]],
  viewW: 681, viewH: 404, focusY: 0.5, colW: 632, compMidY: -178,
};
const sw = (k) => (N) => N.sw.find((w) => w.s.k === k);
const COMP = { cx: 340.5, cy: 452 };
// camera keys: span to centre in the thread view, the shot's zoom, optional pane focus override; eased from the previous key
P.cam = [
  { t: 0, y: (N) => [N.ask, 0.5], z: 2.2, cx: 340.5, cy: 318 },
  { t: 7.0, y: (N) => [N.ask, 0.5], z: 2.7, ...COMP, d: 0.7 },
  { t: 7.95, y: (N) => [N.ask, 0, N.think, 1], z: 2.6, cx: 340.5, d: 0.7 },
  { t: 8.65, y: (N) => [N.ask, 0, sw('site')(N).pillRow, 1], z: 2.5, cx: 340.5, d: 0.55 },
  { t: 9.3, y: (N) => [sw('site')(N).pillRow, 0, sw('site')(N).nestRow, 1], z: 2.5, cx: 340.5 },
  { t: 10.75, y: (N) => [sw('site')(N).nestRow, 0.4, N.shots, 1], z: 2.4, cx: 340.5 },
  { t: 11.0, y: (N) => [N.shots, 0, N.script, 1], z: 2.7, ...COMP, d: 0.45 },
  { t: 11.3, y: (N) => [N.shots, 0, N.script, 1], z: 2.45, cx: 340.5, d: 0.4 },
  ...['nb', 'rodin', 'kling', 'v3', 'music'].flatMap((k) => {
    const s = P.switches.find((x) => x.k === k);
    const big = s.task === 'model3d' ? 2.6 : s.task === 'audio' ? 2.7 : 2.3;
    return [
      { t: k === 'v3' ? 23.0 : s.at - 0.15, y: (N) => [sw(k)(N).pillRow, 0, sw(k)(N).pillRow, 1], z: 3.2, d: k === 'v3' ? 0.1 : 0.5 },
      { t: s.check + 0.1, y: (N) => [sw(k)(N).pillRow, 0, sw(k)(N).pend, 1], z: s.task === 'audio' ? 2.9 : 2.5, d: 0.45 },
      { t: s.ready - 0.15, y: (N) => [sw(k)(N).pillRow, 0, sw(k)(N).card, 1], z: big, d: 0.5 },
    ];
  }),
  { t: 28.2, y: (N) => [N.code, 0, N.code, 1], z: 2.7, ...COMP, d: 0.45 },
  { t: 28.65, y: (N) => [N.code, 0, N.code, 1], z: 2.45, d: 0.5 },
  { t: 30.3, y: (N) => [N.say, 0, N.film, 1], z: 2.3, d: 0.55 },
];

// which full-frame view is on screen: the stack ('k') or Superbot ('sb'); every change is a push to the left
// the stack is full frame at the start, once mid-way and at the end; while Superbot is on screen it rides along as a
// picture-in-picture in the corner, and every delivered asset flies into it
const VIEWS = [[0, 'k'], [6.0, 'sb'], [21.2, 'k'], [23.0, 'sb'], [31.7, 'k']];
const PUSH = 0.5;

// the film's layers bottom to top (01 sits on top, so the labels read 01..07 down the stack), and who made each
const LAYERS = [
  { p: 'paper' },
  { p: 'cut', n: '07', name: 'Cut + halftone', tile: 'anthropic', model: 'Claude Opus 5.5', lit: 32.35 },
  { p: 'score', n: '06', name: 'Score', tile: 'elevenlabs', model: 'Eleven Music', lit: 28.15 },
  { p: 'voice', n: '05', name: 'Voiceover', tile: 'elevenlabs', model: 'Eleven v3', lit: 25.85 },
  { p: 'motion', n: '04', name: 'Motion', tile: 'kling', model: 'Kling 3.0 Pro', lit: 20.95 },
  { p: 'mesh', n: '03', name: '3D model', tile: 'generic', model: 'Rodin Gen-2', lit: 17.95 },
  { p: 'art', n: '02', name: 'Key art', tile: 'google', model: 'Nano Banana Pro', lit: 15.15 },
  { p: 'copy', n: '01', name: 'Copy', tile: 'anthropic', model: 'Claude Opus 5.5', lit: 12.45, from: 'facts: pocketsflow.com' },
];
const GHOST = new Set(['art', 'mesh', 'voice', 'score', 'cut']);   // in the finished frame these sit under (or beside) what you see

const stage = document.getElementById('stage');
const film = buildFilm(stage, M);
const labels = document.createElement('div'); labels.className = 'labels'; stage.appendChild(labels);
const tileImg = (key) => { const t = TILES[key]; return t.site ? `<span class="pfc-site"><img src="${t.site}" alt=""/></span>` : `<img src="${t.img}" alt=""/>`; };
for (const L of LAYERS) {
  const pl = film.N.planes[L.p];
  pl.insertAdjacentHTML('beforeend', '<i class="mk" style="position:absolute;left:0;top:540px;width:1px;height:1px"></i><i class="mkr" style="position:absolute;left:1919px;top:540px;width:1px;height:1px"></i>');
  if (!L.n) continue;
  L.el = document.createElement('div'); L.el.className = 'lab';
  L.el.innerHTML = `<span class="lab-n">${L.n}</span><b>${L.name}</b><span class="lab-tick"></span><span class="lab-m">${tileImg(L.tile)}<span>${L.model}</span></span>${L.from ? `<span class="lab-from">${L.from}</span>` : ''}`;
  labels.appendChild(L.el);
  L.chip = L.el.querySelector('.lab-m');
}
const cap = document.createElement('div'); cap.className = 'cap';
cap.innerHTML = '<span class="cap-a">This launch film came from one prompt.</span><span class="cap-b">Here’s who made each layer.</span>';
stage.appendChild(cap);
const capA = cap.querySelector('.cap-a'), capB = cap.querySelector('.cap-b');

const sbHost = document.createElement('div'); sbHost.style.cssText = 'position:absolute;left:0;top:0'; stage.appendChild(sbHost);
const sb = buildSuperbot(sbHost, P, M);
const Z = 1.85;
const poster = sb.el.querySelector('.sbp-poster');

const end = document.createElement('div'); end.className = 'end';
const END_CHIPS = [['anthropic', 'Claude Opus 5.5'], ['google', 'Nano Banana Pro'], ['generic', 'Rodin Gen-2'], ['kling', 'Kling 3.0 Pro'], ['elevenlabs', 'Eleven v3'], ['elevenlabs', 'Eleven Music']];
end.innerHTML = `<div class="end-film"><span class="end-film-t">pocketsflow-launch.mp4</span><span class="end-film-m">0:12</span></div><div class="end-in"><div class="end-row"><img class="end-mark" src="sb/brand/mono-mark-white.svg" alt=""/><span class="end-word">superbot</span></div>
  <div class="end-line">One prompt. The right model for every layer.</div>
  <div class="end-chips">${END_CHIPS.map(([k, m]) => `<span class="lab-m">${tileImg(k)}<span>${m}</span></span>`).join('')}</div>
  <div class="end-url">superbot.gg</div></div>`;
stage.appendChild(end);
const endParts = [...end.querySelectorAll('.end-row, .end-line, .end-url')];
const endChips = [...end.querySelectorAll('.end-chips .lab-m')];
const endHead = end.querySelector('.end-film');

// each delivered asset lifts out of its Superbot card and flies into its layer of the stack
const flies = document.createElement('div'); flies.className = 'flies'; flies.style.zIndex = '4'; stage.insertBefore(flies, end);
const FLIGHTS = [
  { p: 'copy', t: 11.8, src: () => sb.N.script.querySelector('.pfc-step'), html: '<div class="fly-text">Got something to <i>sell?</i></div>' },
  { p: 'art', t: 14.5, src: () => sw('nb')(sb.N).lift, html: `<img src="${M.keyart}" alt=""/>` },
  { p: 'mesh', t: 17.3, src: () => sw('rodin')(sb.N).lift, canvas: () => cardViewer.canvas },
  { p: 'motion', t: 20.3, src: () => sw('kling')(sb.N).lift, canvas: () => cardVideo },
  { p: 'voice', t: 25.2, src: () => sw('v3')(sb.N).lift, clone: true },
  { p: 'score', t: 27.5, src: () => sw('music')(sb.N).lift, clone: true },
  { p: 'cut', t: 31.7, src: () => sb.N.film.querySelector('.pfc-surface'), html: `<img src="${M.poster}" alt=""/>` },
];
function buildFlights() {
  for (const f of FLIGHTS) {
    const src = f.src();
    f.w = src.offsetWidth; f.h = src.offsetHeight;
    f.el = document.createElement('div'); f.el.className = 'fly hwc pfc';
    f.el.style.width = `${f.w}px`; f.el.style.height = `${f.h}px`;
    if (f.clone) f.el.innerHTML = src.outerHTML;
    else if (f.canvas) { f.el.innerHTML = '<canvas></canvas>'; f.cv = f.el.firstChild; f.cv.width = f.w * 3; f.cv.height = f.h * 3; }
    else f.el.innerHTML = f.html;
    flies.appendChild(f.el);
  }
}
function fly(t) {
  const s0 = stage.getBoundingClientRect(), k = s0.width / 1920;
  for (const f of FLIGHTS) {
    const on = t >= f.t && t < f.t + 0.9;
    f.src().style.visibility = t >= f.t && t < f.t + 2 ? 'hidden' : '';
    f.el.style.display = on ? '' : 'none';
    if (!on) continue;
    const p = tw(t, f.t, f.t + 0.8, E.inOutCubic);
    const a = f.src().getBoundingClientRect(), b = film.N.planes[f.p].getBoundingClientRect();
    const ax = (a.left - s0.left) / k, ay = (a.top - s0.top) / k, aw = a.width / k;
    const bx = (b.left + b.width / 2 - s0.left) / k, by = (b.top + b.height / 2 - s0.top) / k;
    const k0 = aw / f.w, k1 = (b.width / k) * 0.4 / f.w;
    const sc = Math.exp(lerp(Math.log(k0), Math.log(k1), p));
    const cx = lerp(ax + (f.w * k0) / 2, bx, p), cy = lerp(ay + (f.h * k0) / 2, by, p) - 90 * Math.sin(Math.PI * p);
    f.el.style.transform = `translate(${(cx - (f.w * sc) / 2).toFixed(1)}px, ${(cy - (f.h * sc) / 2).toFixed(1)}px) scale(${sc.toFixed(4)}) rotate(${(-14 * p).toFixed(2)}deg)`;
    f.el.style.opacity = (1 - tw(t, f.t + 0.62, f.t + 0.88)).toFixed(3);
  }
}
function flyDraw(t) {
  for (const f of FLIGHTS) {
    if (!f.cv || t < f.t || t >= f.t + 0.9) continue;
    const c = f.canvas(); const g = f.cv.getContext('2d');
    g.fillStyle = '#121213'; g.fillRect(0, 0, f.cv.width, f.cv.height);
    const sw0 = c.videoWidth || c.width, sh0 = c.videoHeight || c.height; const r = Math.min(f.cv.width / sw0, f.cv.height / sh0);
    g.drawImage(c, (f.cv.width - sw0 * r) / 2, (f.cv.height - sh0 * r) / 2, sw0 * r, sh0 * r);
  }
}
const blackout = document.createElement('div'); blackout.style.cssText = 'position:absolute;inset:0;background:#000;pointer-events:none'; stage.appendChild(blackout);

// media: the clip under the film's motion plane, the clip in Superbot's video card, two 3D viewers of Rodin's mesh
const filmVideo = Object.assign(document.createElement('video'), { src: M.kling60, muted: true, playsInline: true, preload: 'auto' });
const cardVideo = sb.N.video;
const offHost = document.createElement('div'); offHost.style.cssText = 'position:fixed;left:-3000px;top:0;width:980px;height:980px;visibility:hidden'; document.body.appendChild(offHost);
const filmViewer = mountViewer(offHost, M.glb, null, { grid: false, pr: 1, dir: [0.2, 0.1, 1], dist: 0.92 });
const cardViewer = mountViewer(sb.N.viewerHost, M.glb, M.keyart, { pr: 3, dir: [0.42, 0.34, 1], dist: 0.95 });

// the push between full-frame views: x offset (stage px) of a view at t, Infinity when it is off screen
function viewX(t, which) {
  let i = 0; while (i < VIEWS.length - 1 && t >= VIEWS[i + 1][0]) i++;
  const [at, cur] = VIEWS[i], prev = i > 0 ? VIEWS[i - 1][1] : cur;
  const p = i === 0 ? 1 : tw(t, at, at + PUSH, E.inOutCubic);
  if (which === cur) return 1920 * (1 - p) * (i === 0 ? 0 : 1);
  if (which === prev && p < 1) return -1920 * p;
  return Infinity;
}

function stack(t) {
  // rig pose: flat (the film) -> pressed (pause) -> exploded (B) -> picture-in-picture while Superbot works -> full
  // again mid-way and at the end -> collapsed flat (D)
  const iso = keys(t, [[2.3, 0], [3.7, 1, E.inOutCubic], [33.45, 1], [35.1, 0, E.inOutCubic]]);
  const spread = keys(t, [[2.9, 0], [4.4, 1, E.inOutCubic], [33.25, 1], [34.3, 0, E.inOutCubic]]);
  const scFull = keys(t, [[2.0, 1], [2.3, 0.965, E.inOutSine], [3.7, 0.46, E.inOutCubic], [33.45, 0.46], [35.1, 1, E.inOutCubic]]);
  const bxFull = keys(t, [[2.3, 0], [3.7, 300, E.inOutCubic], [33.45, 300], [35.1, 0, E.inOutCubic]]);
  const byFull = keys(t, [[2.3, 0], [3.7, 130, E.inOutCubic], [33.45, 130], [35.1, 0, E.inOutCubic]]);
  // how far into the corner the stack is: follows Superbot's pane as it pushes on and off
  const sx = viewX(t, 'sb');
  const pip = Number.isFinite(sx) ? 1 - Math.abs(sx) / 1920 : 0;
  const sc = Math.exp(lerp(Math.log(scFull), Math.log(0.15), pip));
  const bx = lerp(bxFull, 690, pip), by = lerp(byFull, 300, pip);
  film.el.style.zIndex = pip > 0 ? '3' : '';
  const orbit = 6 * Math.sin((t - 4.5) * 0.21) * keys(t, [[4.0, 0], [6.0, 1, E.inOutSine], [32.6, 1], [33.45, 0, E.inOutSine]]);
  film.N.rig.style.transform = `translate(${bx.toFixed(2)}px, ${by.toFixed(2)}px) scale(${sc.toFixed(4)}) rotateX(${(56 * iso).toFixed(3)}deg) rotateZ(${((-34 + orbit) * iso).toFixed(3)}deg)`;
  LAYERS.forEach((L, i) => {
    const pl = film.N.planes[L.p];
    // in C every layer goes dark and lights as its asset lands in it
    const dark = keys(t, [[6.0, 0], [6.4, 1, E.inOutSine], [33.0, 1], [33.4, 0, E.inOutSine]]);
    const litP = L.lit ? tw(t, L.lit, L.lit + 0.45, E.inOutSine) : tw(t, 32.35, 32.8);
    const shade = L.p === 'paper' ? 1 - dark * 0.25 : 1 - dark * (1 - lerp(0.3, 1, litP));
    const ghost = GHOST.has(L.p) ? spread : 1;
    const pop = L.lit ? Math.sin(Math.PI * prog(t, L.lit, L.lit + 0.7)) * 120 : 0;
    pl.style.transform = `translateZ(${(i * 150 * spread + pop).toFixed(2)}px)`;
    pl.style.opacity = (ghost * shade * (L.p === 'paper' ? lerp(1, 0.9, spread) : 1)).toFixed(3);
    pl.style.setProperty('--pr', `${(22 * spread).toFixed(1)}px`);
    const glow = L.lit && t > 6.1 ? Math.sin(Math.PI * prog(t, L.lit, L.lit + 1.1)) : 0;
    // outlines stay a constant width on screen, so the small stack in the corner is as crisp as the full one
    pl.style.setProperty('--po', `${((2.2 * spread + 5 * glow) * 0.46 / sc).toFixed(2)}px`);
    pl.style.setProperty('--oc', glow > 0.01 ? `rgba(43,107,255,${(0.42 + 0.58 * glow).toFixed(3)})` : 'rgba(255,255,255,.42)');
    if (!L.el) return;
    // labels beside each plane's left edge, only while the stack is full frame: all of them in B, the delivered ones mid-way
    const s0 = stage.getBoundingClientRect(); const k = s0.width / 1920;
    const mk = pl.querySelector('.mk').getBoundingClientRect();
    const lx = (mk.left - s0.left) / k, ly = (mk.top - s0.top) / k;
    const w = L.w || (L.w = L.el.offsetWidth);
    const inB = Math.min(tw(t, 4.1 + (7 - Number(L.n)) * 0.08, 4.55 + (7 - Number(L.n)) * 0.08), 1 - tw(t, 5.7, 6.1));
    const inK = t > 6.1 && t < 33.7 && t >= L.lit ? 1 - tw(t, 33.35, 33.7) : 0;
    L._vis = Math.max(inB, inK) * clamp(1 - pip * 3);
    L._hot = t > 6.1 ? Math.sin(Math.PI * prog(t, L.lit, L.lit + 1.0)) : 0;
    L._x = lx - 30 - w; L._y = ly;
  });
  // the labels never collide: one slot each, at least 60 px apart, read top to bottom, inside a 96 px margin
  const labs = LAYERS.filter((L) => L.el && L._vis > 0.001).sort((a, b) => a._y - b._y);
  for (let k = 1; k < labs.length; k++) labs[k]._y = Math.max(labs[k]._y, labs[k - 1]._y + 60);
  const over = labs.length ? Math.max(0, labs[labs.length - 1]._y - 1000) : 0;
  for (const L of labs) L._y -= over;
  for (const L of LAYERS) {
    if (!L.el) continue;
    L.el.style.opacity = (L._vis || 0).toFixed(3);
    if (!(L._vis > 0.001)) continue;
    L.el.style.transform = `translate(${Math.max(96, L._x).toFixed(1)}px, ${L._y.toFixed(1)}px) translateY(-50%) scale(${(1 + 0.12 * L._hot).toFixed(3)})`;
  }
}
const inOut = (t, a, b, d, d2) => Math.min(tw(t, a, a + d), 1 - tw(t, b - d2, b));

function render(t) {
  const ft = filmTime(t);
  stack(t);
  film.render(ft, { video: filmVideo, viewer: filmViewer.canvas, spread: keys(t, [[2.9, 0], [4.4, 1, E.inOutCubic], [33.25, 1], [34.3, 0, E.inOutCubic]]) });
  // captions over the exploded frame
  capA.style.opacity = inOut(t, 3.05, 4.25, 0.4, 0.3).toFixed(3);
  capB.style.opacity = inOut(t, 4.2, 6.0, 0.4, 0.3).toFixed(3);
  capA.style.transform = `translateY(${(lerp(16, 0, tw(t, 3.05, 3.6, E.outQuint)) - 10 * tw(t, 3.95, 4.25)).toFixed(2)}px)`;
  capB.style.transform = `translateY(${lerp(16, 0, tw(t, 4.2, 4.75, E.outQuint)).toFixed(2)}px)`;
  capB.style.marginTop = '-74px';
  cap.style.translate = `${Math.min(0, Number.isFinite(viewX(t, 'k')) ? viewX(t, 'k') : -1920).toFixed(1)}px 0`;
  // Superbot's pane, full frame under a camera; pushed on and off like the stack
  const sx = viewX(t, 'sb');
  sb.el.style.visibility = Number.isFinite(sx) ? 'visible' : 'hidden';
  if (Number.isFinite(sx)) {
    sb.render(t);
    const c = sb.camera(t);
    sb.el.style.transform = `translate(${(960 + sx - c.z * c.cx).toFixed(2)}px, ${(540 - c.z * c.cy).toFixed(2)}px) scale(${c.z.toFixed(4)})`;
    sb.el.style.opacity = (1 - c.dip).toFixed(3);
    poster.style.transform = `scale(${(1 + 0.05 * E.inOutSine(clamp((t - 31.15) / 1.4))).toFixed(4)})`;
  }
  // F: the finished film shrinks back into the card it was in Superbot, and the superbot lockup arrives beside it
  const e = tw(t, S.F[0], S.F[0] + 0.85, E.inOutCubic);
  const fs0 = lerp(1, 0.44, e);
  film.el.style.transform = e > 0 ? `translate(${lerp(0, -370, e).toFixed(2)}px, ${lerp(0, -10, e).toFixed(2)}px) scale(${fs0.toFixed(4)})` : '';
  film.el.style.borderRadius = e > 0 ? `${(36 * e / fs0).toFixed(1)}px` : '';
  film.el.style.overflow = e > 0 ? 'hidden' : '';
  film.el.style.boxShadow = e > 0 ? `0 0 0 ${(2 / fs0).toFixed(1)}px rgba(255,255,255,${(0.12 * e).toFixed(3)}), 0 ${(40 / fs0).toFixed(0)}px ${(120 / fs0).toFixed(0)}px rgba(0,0,0,${(0.6 * e).toFixed(3)})` : '';
  end.style.visibility = e > 0 ? 'visible' : 'hidden';
  endHead.style.opacity = tw(t, S.F[0] + 0.55, S.F[0] + 0.95).toFixed(3);
  endParts.forEach((p, i) => { const q = tw(t, S.F[0] + 0.4 + i * 0.12, S.F[0] + 1.1 + i * 0.12, E.outQuint); p.style.opacity = q.toFixed(3); p.style.transform = `translateY(${lerp(28, 0, q).toFixed(2)}px)`; });
  endChips.forEach((c, i) => { const q = tw(t, S.F[0] + 0.8 + i * 0.09, S.F[0] + 1.5 + i * 0.09, E.outBack); c.style.opacity = clamp(q * 1.4).toFixed(3); c.style.transform = `translateY(${(lerp(30, 0, q) + 3 * Math.sin(t * 1.7 + i * 0.9)).toFixed(2)}px)`; });
  const breathe = 1 + 0.012 * Math.sin(Math.PI * prog(t, S.F[0] + 1.2, CYCLE));
  end.querySelector('.end-in').style.transform = `scale(${breathe.toFixed(4)})`;
  film.el.style.zIndex = film.el.style.zIndex || (e > 0 ? '2' : '');
  blackout.style.opacity = tw(t, CYCLE - 0.3, CYCLE).toFixed(3);
  fly(t);
  flyDraw(t);
}

// media sync: the timeline owns time; seek(t) settles every video before drawing (render path), live play only corrects drift
// both turntables sway about a front three-quarter view, so the face never turns away
const meshAngle = (t) => ({ film: 0.55 * Math.sin((filmTime(t) - 6.7) * 0.9 - 0.6), card: -0.6 + 1.0 * E.inOutSine(clamp((t - 16.1) / 2.2)) });
// the card opens mid-wave (1.6 s into Kling's clip) so it never reads as the still
function videoTargets(t) { return [[filmVideo, Math.min(filmTime(t), 5.0)], [cardVideo, Math.min(2.4 + Math.max(0, t - 19.1), 5.0)]]; }
const seekTo = (v, x) => new Promise((res) => { if (Math.abs(v.currentTime - x) < 0.001 && v.readyState >= 2) return res(); const on = () => { v.removeEventListener('seeked', on); res(); }; v.addEventListener('seeked', on); v.currentTime = x; });

function drawViewers(t) {
  const a = meshAngle(t);
  filmViewer.render(a.film);
  if (t > 2 && t < 35.2) film.drawMeshPlane(filmViewer.canvas);
}
// after render(t): the card must be laid out at its drawn size before its viewer sizes itself
function drawCard(t) {
  if (t < 16.0 || t > 18.2) return;
  cardViewer.render(meshAngle(t).card);
  if (cardViewer.stats) sb.N.foot.textContent = cardViewer.stats;
  flyDraw(t);
}

function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(${((innerWidth - 1920 * k) / 2).toFixed(2)}px, ${((innerHeight - 1080 * k) / 2).toFixed(2)}px) scale(${k})`;
}
addEventListener('resize', fit); fit();

const audio = document.getElementById('sound');
let live = !/[?&]render/.test(location.search), t0 = 0;
async function seek(t) {
  live = false;
  for (const [v, x] of videoTargets(t)) { v.pause(); await seekTo(v, x); }
  drawViewers(t);
  render(t);
  drawCard(t);
  await new Promise((r) => requestAnimationFrame(() => r()));
}

const ready = (async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  await Promise.all([filmVideo, cardVideo].map((v) => (v.readyState >= 2 ? 0 : new Promise((r) => v.addEventListener('loadeddata', r, { once: true })))));
  await Promise.allSettled([filmViewer.ready, cardViewer.ready]);
  sb.measure();
  buildFlights();
  window.__AD.ready = true;
})();

window.__AD = { ready: false, CYCLE, segments: S, seek, _sb: sb };

function loop(now) {
  if (!live) return;
  const t = ((now - t0) / 1000) % CYCLE;
  for (const [v, x] of videoTargets(t)) {
    const active = x > 0.02 && x < 4.98 && ((v === filmVideo && (t < S.A[1] || (t > S.E[0] && filmTime(t) < 4.0))) || (v === cardVideo && t > 19.1 && t < 21.1));
    if (!active) { if (!v.paused) v.pause(); if (Math.abs(v.currentTime - x) > 0.05) v.currentTime = x; continue; }
    if (v.paused) { v.currentTime = x; v.play().catch(() => {}); } else if (Math.abs(v.currentTime - x) > 0.25) v.currentTime = x;
  }
  if (audio && !audio.paused && Math.abs(audio.currentTime - t) > 0.3) audio.currentTime = t;
  drawViewers(t);
  render(t);
  drawCard(t);
  requestAnimationFrame(loop);
}
ready.then(() => {
  if (!live) return;
  t0 = performance.now();
  if (audio) {
    const start = () => { audio.currentTime = ((performance.now() - t0) / 1000) % CYCLE; audio.play().catch((e) => console.error('[ad] audio blocked until a tap', e)); };
    start(); addEventListener('pointerdown', start, { once: true });
    // the gallery lightbox forwards its first click or key as { type: 'unmute' } (browsers refuse sound before a gesture)
    addEventListener('message', (e) => { if (e.data && e.data.type === 'unmute' && audio.paused) start(); });
    audio.addEventListener('ended', () => { audio.currentTime = 0; audio.play().catch((e) => console.error('[ad] audio replay', e)); });
  }
  requestAnimationFrame(loop);
});
