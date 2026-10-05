// core.0cecc5e4.js: clock, stage, mark and small helpers shared by the three films.
// Contract (motion-reel): seek(t) paints frame t from scratch; nothing is carried between calls.
import { spring, track, swapAlpha, PRESETS } from './motion.mjs';

export const P = PRESETS;
export const W = 1920, H = 1080;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, u) => a + (b - a) * u;
export const ramp = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
export const smooth = (u) => { const c = clamp(u); return c * c * (3 - 2 * c); };
export const eio = (u) => { const c = clamp(u); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
export const eout = (u) => 1 - Math.pow(1 - clamp(u), 3);
// spring from rest at t0, 0 -> 1
export const sp = (t, t0, p = P.default) => spring(t - t0, p.k, p.d);
export const tr = (t, keys, p = P.default) => track(t, keys, p.k, p.d);
export { swapAlpha };
// opacity window: smooth in over dIn from tIn, smooth out over dOut ending at tOut
export const win = (t, tIn, tOut = Infinity, dIn = 0.3, dOut = 0.3) =>
  Math.min(smooth((t - tIn) / dIn), tOut === Infinity ? 1 : smooth((tOut - t) / dOut));
export const typed = (s, t, t0, cps = 30) => s.slice(0, clamp(Math.floor((t - t0) * cps), 0, s.length));
export const typedEnd = (s, t0, cps = 30) => t0 + s.length / cps;
export const blinkOn = (t) => Math.floor(t * 2.1) % 2 === 0;

export function h(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
export function at(e, x, y, w, hgt) {
  e.style.left = x + 'px'; e.style.top = y + 'px';
  if (w != null) e.style.width = w + 'px';
  if (hgt != null) e.style.height = hgt + 'px';
  return e;
}
// transform relative to the element's laid-out box
export function put(e, { x = 0, y = 0, s = 1, sx, sy, r = 0, o, blur } = {}) {
  e.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${(sx ?? s).toFixed(4)},${(sy ?? s).toFixed(4)})`;
  if (o != null) e.style.opacity = clamp(o).toFixed(3);
  if (blur != null) e.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
}
export const show = (e, on) => { e.style.display = on ? '' : 'none'; };
// camera: frame the point (cx, cy) of a full-stage layer at scale s
export function cam(e, cx, cy, s) {
  e.style.transformOrigin = '0 0';
  e.style.transform = `translate(${(W / 2 - cx * s).toFixed(2)}px,${(H / 2 - cy * s).toFixed(2)}px) scale(${s.toFixed(4)})`;
}

// ---- the real superbot mark (assets/sb-mark-live.js markup), driven from t ----
let MARK_HTML = null;
let markSeq = 0;
function markHtml() {
  if (MARK_HTML) return MARK_HTML;
  const tmp = document.createElement('div');
  const m = window.sbMarkLive(tmp, { size: 0, interactive: false });
  MARK_HTML = m.html;
  if (m.destroy) m.destroy();
  return MARK_HTML;
}
export function mark(size) {
  const host = h('span', 'mk');
  host.innerHTML = markHtml().split('sb-gate-mark').join('sbm0c' + (++markSeq));
  const svg = host.querySelector('svg');
  svg.style.width = svg.style.height = size + 'px';
  host.style.width = host.style.height = size + 'px';
  host.style.display = 'inline-grid';
  return {
    host, svg,
    body: svg.querySelector('.mark-body'),
    a: svg.querySelector('.sb-mark-a'), b: svg.querySelector('.sb-mark-b'),
    earL: svg.querySelector('.mark-ear-l'), earR: svg.querySelector('.mark-ear-r'),
    eyes: [...svg.querySelectorAll('.mark-eye')], happy: svg.querySelector('.mark-happy'),
  };
}
// breath, chromatic glitch, ear sway and blinks as closed-form functions of t
export function driveMark(m, t, { happy = false, glitch = 0 } = {}) {
  const br = 1 + 0.015 * 0.5 * (1 - Math.cos((2 * Math.PI * t) / 5.5));
  m.body.style.transform = `scale(${br.toFixed(4)})`;
  const ga = ((t % 7) / 7), gb = ((t % 11) / 11);
  const ja = ga > 0.4 && ga < 0.44 ? -1 : 0, jb = gb > 0.62 && gb < 0.66 ? 0.8 : 0;
  const g = 1 + glitch * 2.4;
  m.a.style.transform = `translate(${(-1.2 * g + ja).toFixed(2)}px,${(-1.2 * g).toFixed(2)}px)`;
  m.b.style.transform = `translate(${(1.2 * g + jb).toFixed(2)}px,${(1.2 * g - jb * 0.6).toFixed(2)}px)`;
  m.earL.style.transform = `rotate(${(-3 * Math.cos((2 * Math.PI * t) / 3.1)).toFixed(2)}deg)`;
  m.earR.style.transform = `rotate(${(3 * Math.cos((2 * Math.PI * t) / 4.3)).toFixed(2)}deg)`;
  const ph = (t + 1.1) % 3.7;
  const bl = ph < 0.16 ? 1 - Math.abs(ph - 0.08) / 0.08 : 0;
  for (const e of m.eyes) { e.setAttribute('ry', (11 * (1 - 0.9 * bl)).toFixed(2)); e.style.opacity = happy ? 0 : 1; }
  m.happy.style.opacity = happy ? 1 : 0;
}

// ---- logos, models ----
const LOGO = {
  claude: 'brand/claude-logo.svg', openai: 'brand/openai-logo.svg', gemini: 'brand/gemini-logo.svg',
  deepseek: 'brand/deepseek-logo.svg', cursor: 'brand/cursor-logo.svg',
};
export function tile(kind, size) {
  const d = h('span', 'tile ' + kind);
  if (kind === 'superbot') { const m = mark(Math.round((size || 40) * 0.74)); d.appendChild(m.host); d._mark = m; }
  else { const i = new Image(); i.src = LOGO[kind]; i.alt = ''; d.appendChild(i); }
  if (size) d.style.width = d.style.height = size + 'px';
  return d;
}
// OpenRouter list prices per 1M tokens, retrieved 2026-10-05 (in / out)
export const M = {
  opus: { name: 'Claude Opus 5.5', id: 'claude-opus-5.5', logo: 'claude', inP: 4.0, out: 20.0 },
  gpt: { name: 'GPT-6 Sol', id: 'gpt-6-sol', logo: 'openai', inP: 2.0, out: 10.0 },
  gem: { name: 'Gemini 3.8 Flash', id: 'gemini-3.8-flash', logo: 'gemini', inP: 0.75, out: 3.75 },
  ds: { name: 'DeepSeek V4.1 Flash', id: 'deepseek-v4.1-flash', logo: 'deepseek', inP: 0.3, out: 1.2 },
};
export const AGENTS = [
  { key: 'claude', name: 'Claude Code', logo: 'claude', plan: 'Claude Max' },
  { key: 'codex', name: 'Codex', logo: 'openai', plan: 'ChatGPT Pro' },
  { key: 'gemini', name: 'Gemini CLI', logo: 'gemini', plan: 'Google AI Pro' },
  { key: 'cursor', name: 'Cursor', logo: 'cursor', plan: 'Cursor Pro' },
];
export function chip(model, size) {
  const c = h('span', 'chip');
  c.appendChild(tile(M[model].logo, size));
  c.appendChild(h('span', '', M[model].name));
  return c;
}

export const ICON = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/></svg>',
  chev: '<svg viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M6 9l6 6 6-6"/></svg>',
  comp: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  ok: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  lock: '<svg class="lock" viewBox="0 0 24 24" fill="none" stroke="#a1a1a8" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
};

// ---- caption box (sentence case, bottom centre) ----
export function caption(stage, cues) {
  const el = h('div', 'cap');
  stage.appendChild(el);
  return (t) => {
    const i = cues.findIndex((c) => t >= c[0] && t < c[1]);
    if (i < 0) { el.style.opacity = 0; return; }
    const [a, b, html] = cues[i];
    if (el.dataset.i !== String(i)) { el.innerHTML = html; el.dataset.i = String(i); }
    const inn = sp(t, a, P.snappy);
    el.style.opacity = win(t, a, b, 0.16, 0.2).toFixed(3);
    el.style.transform = `translate(-50%, ${((1 - inn) * 16).toFixed(2)}px) scale(${(0.965 + 0.035 * inn).toFixed(4)})`;
  };
}
// ---- top pill ("Superbot, all your agents in one") ----
export function pill(stage, text) {
  const el = h('div', 'pill');
  const m = mark(28);
  el.appendChild(m.host);
  el.appendChild(h('span', '', text));
  stage.appendChild(el);
  return (t, o) => {
    el.style.opacity = clamp(o).toFixed(3);
    el.style.transform = `translate(-50%, ${((1 - o) * -10).toFixed(2)}px)`;
    driveMark(m, t);
  };
}

// ---- boot: build once, then seek(t) paints; live preview loops behind !__RENDER__ ----
export async function boot({ dur, build }) {
  const stage = document.getElementById('stage');
  const render = !!window.__RENDER__;
  if (render) document.documentElement.classList.add('render');
  const paint = await build(stage);
  await document.fonts.ready;
  await Promise.all([...stage.querySelectorAll('img')].map((i) => i.decode().catch((e) => { console.error('img decode', i.src, e); throw e; })));
  if (paint.measure) paint.measure();
  window.seek = (t) => { paint(clamp(t, 0, dur - 1e-6)); };
  window.__DUR__ = dur;
  const fit = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  fit();
  window.addEventListener('resize', fit);
  window.seek(0);
  if (render) return;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) { window.seek(parseFloat(q.get('t')) || 0); return; }
  const bar = h('div', '');
  bar.id = 'scrub';
  document.body.appendChild(bar);
  let start = performance.now(), paused = false, hold = 0;
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { paused = !paused; if (paused) hold = (performance.now() - start) / 1000; else start = performance.now() - hold * 1000; }
    if (e.code === 'ArrowRight') start -= 2000;
    if (e.code === 'ArrowLeft') start += 2000;
  });
  const loop = () => {
    const t = paused ? hold : (((performance.now() - start) / 1000) % dur + dur) % dur;
    window.seek(t);
    bar.style.width = ((t / dur) * 100).toFixed(2) + '%';
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
