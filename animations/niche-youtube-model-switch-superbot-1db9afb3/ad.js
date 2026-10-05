// niche-youtube-model-switch (3D Short reply), on the REAL superbot desktop app.
// The app is the captured DOM of superbot-desktop main (base.js) under its own stylesheet (app/app.css), in two
// documents: the new-chat window the ask is typed into, and the chat it becomes. The chat is assembled from the
// app's own rows and blocks (thread.js), the in-app browser is docked beside it (pane.js) with the pages the agent
// drives in it (pages.js), and Blender's own window floats over it while Blender works (blender.js).
// One clock (tl.js); render(t) is a pure function of it, so ?t=<s> freezes a frame and ?render=1 hands the clock to
// a frame-by-frame renderer (window.__AD.renderSettled).
import { REGIONS, STATES } from './base.js?v=1db9afb3';
import { T, B, DUR, CARD, ASK, TYPE_CPS, PUSH, seg, lerp, clamp, outCubic, outQuint, inOutCubic } from './tl.js?v=1db9afb3';
import { buildThread } from './thread.js?v=1db9afb3';
import { buildPane } from './pane.js?v=1db9afb3';
import { buildPages } from './pages.js?v=1db9afb3';
import { buildBlender } from './blender.js?v=1db9afb3';
import { Media, makeVideo } from './media.js?v=1db9afb3';

const BASE = new URL('./', import.meta.url);
const APP_W = 1440, APP_H = 810, K = 1920 / APP_W;
const params = new URLSearchParams(location.search);
const frozenAt = params.has('t') ? Number(params.get('t')) : null;
const renderMode = params.get('render') === '1';

const stage = document.getElementById('stage');
const cam = document.getElementById('cam');
const ovl = document.getElementById('ovl');
const frameA = document.getElementById('appA');
const frameB = document.getElementById('appB');
const media = new Media();
media.frozen = renderMode || frozenAt !== null;

// ---------------------------------------------------------------- the app documents
const memo = new Map();
const expand = (s) => s.replace(/<!--R:([a-z0-9]+)-->/g, (_, k) => {
  if (!memo.has(k)) memo.set(k, expand(REGIONS[k]));
  return memo.get(k);
});
const state = (name) => STATES.find((s) => s.name === name);
let CSS = '';
async function loadDoc(frame, name) {
  const s = state(name);
  const attrs = Object.entries(s.htmlAttrs).map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
  frame.srcdoc = `<!doctype html><html ${attrs}><head><meta charset="utf-8"><base href="${BASE.href}"><style>${CSS}</style></head><body>${expand(s.body)}</body></html>`;
  await new Promise((r) => frame.addEventListener('load', r, { once: true }));
  const doc = frame.contentDocument;
  await doc.fonts.ready;
  return doc;
}
function parseState(doc, name) {
  const t = doc.createElement('template');
  t.innerHTML = expand(state(name).body);
  return t.content;
}

// the demo account's chats become the creator's (same rows, same order, new words)
const CHATS = {
  'Cheapest GPUs on RunPod': 'Sponsor read for the mic video',
  'Name ideas for the CLI': 'Title ideas: 12 budget mics',
  'Compare MCP servers': 'Compare XLR interfaces under $100',
  'Rules in Cursor and Claude Code': 'Chapters for the mic video',
  'Plan the product launch': 'Plan the studio tour video',
  'Plan the Lisbon offsite': 'Plan the NAMM trip',
  'New chat': 'New chat',
  'Summarize my inbox': 'Summarize brand deal emails',
  'Weekly standup notes': 'Weekly upload schedule',
  'Draft the changelog': 'Draft the community post',
  'Draft notes offline': 'B-roll shot list',
  'Trip ideas for Kyoto': 'Desk setup ideas',
  'Refactor the ingest pipeline': 'Clean up the captions file',
  'Debug the deploy script': 'Fix the end screen timing',
  'Gemini CLI: refactor a script': 'Gemini CLI: rename footage',
  'Muse onboarding copy': 'Merch store copy',
  'Codex CLI refactor': 'Codex CLI: batch export',
};
function creatorChrome(doc, title) {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const swaps = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    const s = n.textContent.trim();
    if (CHATS[s] && CHATS[s] !== s) swaps.push([n, CHATS[s]]);
    else if (s.startsWith('Cheapest GPUs on RunP')) swaps.push([n, CHATS['Cheapest GPUs on RunPod']]);
    else if (s.startsWith('Rules in Cursor and Claud')) swaps.push([n, CHATS['Rules in Cursor and Claude Code']]);
    else if (s.startsWith('Plan the product l')) swaps.push([n, CHATS['Plan the product launch']]);
    else if (s.startsWith('Here are the three cheapest')) swaps.push([n, 'Here is a 30-second read for the Shure...']);
    else if (s === 'hi@ezo.dev') swaps.push([n, 'sam@samrivera.tv']);
    else if (s === 'H' && n.parentElement && n.parentElement.closest('[data-slot=app-avatar], .hub-rail, .hub-sidebar')) swaps.push([n, 'S']);
    else if (title && s === 'make me a muse meme') swaps.push([n, title]);
  }
  for (const [n, v] of swaps) n.textContent = n.textContent.replace(n.textContent.trim(), v);
}

// ---------------------------------------------------------------- build
const A = {}, Bd = {};
let thread, pane, pages, blender;
async function build() {
  CSS = (await Promise.all(['app/pane.css', 'app/browser.css', 'app/app.css', 'app/extra.css'].map((f) => fetch(new URL(f, BASE)).then((r) => r.text())))).join('\n');
  const [docA, docB] = await Promise.all([loadDoc(frameA, '01-newchat-typed'), loadDoc(frameB, 't2-list')]);
  A.doc = docA; Bd.doc = docB;

  // the new-chat window: the composer the ask is typed into
  creatorChrome(docA, null);
  A.input = docA.querySelector('[data-slot=composer-input]');
  A.input.textContent = '';
  A.caret = docA.createElement('span');
  A.caret.className = 'ad-caret';
  A.send = docA.querySelector('[data-testid=composer-send]');
  A.greet = docA.querySelector('.chat-hero-greeting');
  A.composer = docA.querySelector('[data-slot=composer]');
  A.group = docA.querySelector('.hub-composer-row') || A.composer;

  // the chat: templates from the captured states, then the thread and the browser
  const tplDocs = Object.fromEntries(['04-t1-live', '06-t1-done', 't2-reading', 't2-list', '18-t3-step3'].map((n) => [n, parseState(docB, n)]));
  const last = (root, sel) => { const all = root.querySelectorAll(sel); return all[all.length - 1]; };
  const live = tplDocs['04-t1-live'], done = tplDocs['06-t1-done'], reading = tplDocs['t2-reading'], list = tplDocs['t2-list'], svc = tplDocs['18-t3-step3'];
  const prosePara = [...list.querySelectorAll('[data-slot=message-row][data-variant=prose] [data-slot=markdown-para]')].pop();
  const tpl = {
    userRow: list.querySelector('[data-slot=message-row][data-variant=bubble]'),
    workingRow: last(svc, '[data-slot=message-row][data-variant=prose]'),
    settledHead: done.querySelector('[data-slot=message-row][data-variant=prose] [data-slot=message-row-turn-head]'),
    modelSwitch: live.querySelector('[data-slot=live-provider-switch]'),
    serviceSwitch: last(svc, '[data-slot=live-provider-switch]'),
    serviceStep: last(svc, '[data-slot=provider-switch-step]'),
    sonar: reading.querySelector('[data-slot=sonar-live-feed]'),
    sonarStep: reading.querySelector('li.sb-sonar-step[data-state=done]'),
    para: prosePara,
    lead: done.querySelector('[data-slot=answer-lead]'),
    list: list.querySelector('[data-slot=markdown-list]'),
    link: list.querySelector('[data-slot=markdown-link]'),
    imageFrame: done.querySelector('[data-slot=image-card-frame]'),
    turnFoot: done.querySelector('[data-slot=turn-foot]'),
    iconButtonSm: docB.querySelector('button[data-slot=icon-button][data-size=sm]'),
  };
  const missing = Object.entries(tpl).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) console.error('ad: missing templates', missing);
  creatorChrome(docB, '3D Short for the top comment');
  const composerB = docB.querySelector('[data-slot=composer-input]');
  if (composerB) composerB.textContent = '';
  pane = buildPane(docB, tpl);
  thread = buildThread(docB, tpl);
  pages = buildPages(pane, media, BASE);
  // the thread's video embeds: the clip plays once it is in the thread, muted, from its first frame
  for (const [kind, at] of [['shockmount', B.blender.back + 4.3], ['short', B.opus.back + 4.5]]) {
    const surf = docB.querySelector(`[data-video=${kind}]`);
    if (!surf) continue;
    const v = makeVideo(docB, kind === 'short' ? 'short' : 'blender-view', BASE);
    v.setAttribute('data-slot', 'embed-media-video');
    v.className = 'absolute inset-0 size-full object-contain bg-card';
    surf.appendChild(v);
    media.add(v, (t) => (t >= at + 0.3 ? t - at - 0.3 : null), 0.05);
  }
  blender = buildBlender(ovl, media, BASE);
  buildCard(docA, docB);
  await pages.ready();
  await media.ready();
}

// ---------------------------------------------------------------- the end card
// Drawn inside the chat document so the app's own mascot keeps its stylesheet: the new-chat greeting's mascot,
// the greeting's face for the line, the domain under it (the live-UI spot's card, same anatomy).
let endCard = null;
function buildCard(docA, docB) {
  const hs = getComputedStyle(A.greet);
  const bodyFont = getComputedStyle(docA.body).fontFamily;
  const c = docB.createElement("div");
  c.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:var(--color-bg, #0e0e10);opacity:0;pointer-events:none";
  const stack = docB.createElement("div");
  stack.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:22px";
  // the app's own icon (the mascot outside its hero does not keep its stylesheet)
  const icon = docB.createElement("img");
  icon.src = "app/superbot-app-icon-y3N9pe0j.png";
  icon.alt = "";
  icon.style.cssText = "width:116px;height:116px;display:block;border-radius:26px";
  stack.appendChild(icon);
  const h1 = docB.createElement("h1");
  h1.style.cssText = `margin:0;text-align:center;font-family:${hs.fontFamily};font-weight:${hs.fontWeight};color:${hs.color};letter-spacing:${hs.letterSpacing};font-size:57px;line-height:1.08`;
  h1.innerHTML = "<span style=\"display:block\">Every model.</span><span style=\"display:block\">One chat.</span>";
  const url = docB.createElement("div");
  url.textContent = "superbot.gg";
  url.style.cssText = `font:500 26px ${bodyFont};color:${hs.color};opacity:.82`;
  stack.append(h1, url);
  c.appendChild(stack);
  docB.documentElement.appendChild(c);
  endCard = c;
}

// ---------------------------------------------------------------- camera
// rest: the whole window. Every hand-off pushes in on its pill (PUSH / HOLD / PULL), and each tool's work gets
// its own push onto where it happens (FOCUS).
const ZOOM = 2.0, FILL_W = 0.84;
function rectIn(doc, node) {
  if (!node) return null;
  const r = node.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}
function focusList() {
  const d = Bd.doc;
  const R = (n) => rectIn(d, n);
  const union = (...ns) => () => {
    const rs = ns.map((n) => (typeof n === 'function' ? n() : R(n))).filter((r) => r && r.w);
    if (!rs.length) return null;
    const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
    const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  // the page in the browser (host box), optionally a band of it
  const page = (y0 = 0, h = 692) => () => { const r = R(pane.host); return r && { x: r.x, y: r.y + y0, w: r.w, h: Math.min(h, r.h - y0) }; };
  const k = B, bl = thread.blocks;
  return [
    // DeepSeek: its pill, its tool lines and the page it is reading, together
    { from: k.deepseek.back + 0.3, to: k.deepseek.back + 3.3, box: () => { const p = page(0, 560)(), tr = R(thread.nodes.turn); return p && tr && { x: tr.x - 14, y: p.y, w: p.x + p.w - tr.x + 14, h: p.h }; }, fill: 0.99, fillH: 1.25 },
    // ...then its answer, headline to script
    { from: k.deepseek.back + 3.8, to: k.deepseek.end + 0.05, box: union(bl.deepseek.lead, bl.deepseek.script), fill: 0.9, fillH: 0.94, max: 2.0 },
    // Blender works in its own window
    { from: k.blender.back + 0.55, to: k.blender.back + 4.15, box: () => blender.box, fill: 0.99, fillH: 0.97 },
    { from: k.blender.back + 4.35, to: k.blender.end + 0.05, box: () => R(bl.blender.video), fill: 0.6, fillH: 0.9, max: 1.9 },
    // Eleven v3: the voice plays in its row
    { from: k.eleven.back + 0.7, to: k.eleven.end + 0.05, box: () => R(bl.eleven.audio), fill: 0.9, fillH: 0.9, max: 2.6 },
    // Opus: the settled composition (imports, captions), then Studio, then the render
    { from: k.opus.back + 0.85, to: k.opus.back + 2.25, box: () => R(bl.opus.code.node), fill: 0.86, fillH: 0.95, ay: 0, max: 2.0 },
    { from: k.opus.back + 2.1, to: k.opus.back + 4.95, box: page(0, 692), fill: 0.66, fillH: 1.35, ay: 0.42 },
    { from: k.opus.back + 5.05, to: k.opus.end + 0.05, box: () => R(bl.opus.video), fill: 0.6, fillH: 0.92, max: 1.9 },
    // Gemini 3 Pro Image: the thumbnail and its line
    { from: k.nano.back + 0.35, to: k.nano.end + 0.05, box: union(bl.nano.lead, bl.nano.image), fill: 0.8, fillH: 0.92, max: 2.2 },
    // YouTube: the Short, live; then the pinned comment and the reply
    { from: k.youtube.back + 0.3, to: k.youtube.back + 2.75, box: page(56, 620), fill: 0.62, fillH: 1.3, ay: 0.44 },
    { from: k.youtube.back + 2.8, to: k.youtube.back + 4.7, box: page(56, 470), fill: 0.66, fillH: 1.2, ay: 0.45 },
  ];
}
let FOCUS = [];
const pushOf = (a, landed, pull, back, t) => outQuint(seg(t, a, landed)) * (1 - inOutCubic(seg(t, pull, back)));

function camera(t) {
  let cx = APP_W / 2, cy = APP_H / 2, z = 1;
  // the new chat: pushed in on the greeting and the composer, easing out as the ask is sent
  const drop = inOutCubic(seg(t, T.send, T.send + 0.7));
  if (drop < 1) {
    const g = rectIn(A.doc, A.greet), c = rectIn(A.doc, A.composer);
    if (g && c) {
      const x0 = Math.min(g.x, c.x), x1 = Math.max(g.x + g.w, c.x + c.w), y0 = g.y, y1 = c.y + c.h;
      const zg = Math.min((1920 * 0.8) / ((x1 - x0) * K), (1080 * 0.8) / ((y1 - y0) * K));
      const f = 1 - drop;
      cx = lerp(cx, (x0 + x1) / 2, f); cy = lerp(cy, (y0 + y1) / 2, f); z = lerp(1, zg, f);
    }
  }
  for (const id of Object.keys(B)) {
    const b = B[id];
    const f = pushOf(b.sw, b.landed, b.pull, b.back, t);
    if (f <= 0) continue;
    let r = rectIn(Bd.doc, thread.blocks[id].pill);
    if (!r) continue;
    if (id === 'deepseek') {
      // the first hand-off: the ask and the pill that answers it, together
      const u = rectIn(Bd.doc, thread.nodes.user);
      if (u && u.w) { const x0 = Math.min(r.x, u.x), x1 = Math.max(r.x + r.w, u.x + u.w), y0 = Math.min(r.y, u.y), y1 = Math.max(r.y + r.h, u.y + u.h); r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }
    }
    const zp = Math.min(ZOOM, (1920 * FILL_W) / (r.w * K));
    cx = lerp(cx, r.x + r.w / 2, f); cy = lerp(cy, r.y + r.h / 2, f); z = lerp(z, zp, f);
  }
  for (const m of FOCUS) {
    const f = pushOf(m.from, m.from + 0.6, m.to - 0.55, m.to, t);
    if (f <= 0) continue;
    const r = m.box();
    if (!r || !r.w) continue;
    const zw = (1920 * (m.fill || 0.9)) / (r.w * K);
    const zh = (1080 * (m.fillH || 0.92)) / (r.h * K);
    const zp = clamp(Math.min(zw, zh), 1, m.max || 3);
    const ay = m.ay === undefined ? 0.5 : m.ay;
    // a block anchored at its bottom (ay 1) frames its newest lines
    const fy = ay === 1 ? Math.max(r.y + r.h / 2, r.y + r.h - APP_H / (2 * zp) + 30) : r.y + r.h * ay;
    cx = lerp(cx, r.x + r.w / 2, f); cy = lerp(cy, fy, f); z = lerp(z, zp, f);
  }
  const hw = APP_W / (2 * z), hh = APP_H / (2 * z);
  cx = clamp(cx, hw, APP_W - hw); cy = clamp(cy, hh, APP_H - hh);
  cam.style.transform = `translate(960px, 540px) scale(${(K * z).toFixed(5)}) translate(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px)`;
}

// ---------------------------------------------------------------- render
function renderA(t) {
  const n = clamp(Math.floor((t - T.type) * TYPE_CPS), 0, ASK.length);
  const text = ASK.slice(0, n);
  if (A.input.__t !== text) {
    A.input.textContent = text;
    A.input.appendChild(A.caret);
    A.input.__t = text;
  }
  A.caret.style.opacity = t < T.send && (t < T.type || Math.floor(t * 2) % 2 === 0 || n < ASK.length) ? '1' : '0';
  const dip = Math.sin(Math.PI * seg(t, T.send - 0.12, T.send + 0.2));
  A.send.style.transform = dip > 0 ? `scale(${(1 - 0.14 * dip).toFixed(4)})` : '';
}

// The app's own CSS animations (the switch shimmer and check pop, the spinners, the sonar mark, the step dots) run
// on the spot's clock: each is paused and set from the moment it was first seen, so a seek lands on its frame.
function drive(doc, t) {
  if (!doc) return;
  for (const a of doc.getAnimations()) {
    if (a.__t0 === undefined) {
      const el = a.effect && a.effect.target;
      const host = el && el.closest ? el.closest('[data-t0]') : null;
      a.__t0 = host ? Number(host.dataset.t0) : t;
    }
    if (a.playState !== 'paused') a.pause();
    a.currentTime = Math.max(0, (t - a.__t0) * 1000);
  }
}

export function render(t) {
  t = clamp(t, 0, DUR);
  const fadeIn = outCubic(seg(t, 0, T.open));
  const swap = seg(t, T.swap, T.swap + 0.22);
  frameA.style.opacity = (fadeIn * (1 - swap)).toFixed(3);
  frameB.style.opacity = (fadeIn * swap).toFixed(3);
  frameA.style.visibility = swap >= 1 ? 'hidden' : 'visible';
  frameB.style.visibility = swap <= 0 ? 'hidden' : 'visible';
  renderA(t);
  pane.render(t);
  thread.render(t);
  pages.render(t);
  blender.render(t);
  media.sync(t);
  drive(A.doc, t);
  drive(Bd.doc, t);
  camera(t);
  if (endCard) endCard.style.opacity = outCubic(seg(t, CARD, CARD + 0.5)).toFixed(3);
}

async function renderSettled(t) {
  render(t);
  await media.settled();
  await new Promise((r) => requestAnimationFrame(() => r()));
  render(t);
}

function fit() { stage.style.setProperty('--fit', String(Math.min(innerWidth / 1920, innerHeight / 1080))); }

const ready = (async () => {
  fit();
  addEventListener('resize', fit);
  await build();
  FOCUS = focusList();
  await renderSettled(frozenAt ?? 0);
})();
window.__AD = { DUR, render: (t) => render(t), renderSettled, ready, ratio: '16x9', segments: [{ name: 'short-reply', start: 0, end: DUR }] };

if (!renderMode && frozenAt === null) {
  ready.then(() => {
    const start = performance.now();
    const tick = (now) => {
      render(((now - start) / 1000) % DUR);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
