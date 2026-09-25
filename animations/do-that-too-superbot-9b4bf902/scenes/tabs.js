// scene 'tabs': the tab strip explodes with agent apps, then the Superbot mark kills them.
// A deterministic port of tabs-chaos-superbot-6f50ea56: its Chrome (act 1) and its sphere-intro
// (the fibonacci sphere that spins up exponentially, merges, and the tile.svg flip-grow), joined so
// the tabs' own favicons ARE the sphere tiles. render(lt) is a pure function of local time: no
// WAAPI, no CSS animation, no timers; every position below is math on lt.
import { SYMBOLS } from './tabs-assets/icons.js';
import { hubMarkup } from './tabs-assets/hub-markup.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;

// ---------- local helpers (lib.js shapes, kept here so this module has no timing dependency) ----------
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// CSS cubic-bezier(), solved for x by Newton then bisection (the flip's own curve, exact)
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x;
      if (Math.abs(e) < 1e-6) return sy(u);
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    let lo = 0, hi = 1; u = x;
    for (let i = 0; i < 30; i++) { const v = sx(u); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = u; else hi = u; u = (lo + hi) / 2; }
    return sy(u);
  };
}
const flipEase = bezier(0.3, 0.85, 0.3, 1.04); // sphere-intro fv-flip-icon-grow, segment 1
// sphere-intro showFrontend's GLIDE is cubic-bezier(.3,.7,.2,1); it starts at speed, which after the flip's settle
// (and after the drop) reads as a jolt from rest. Same fast settle, zero initial slope:
const GLIDE = bezier(0.45, 0, 0.2, 1);           // the rise to the column head and the glide home
const DROP = bezier(0.34, 1.56, 0.64, 1);        // its per-icon drop (an overshooting ease-out)
const cssEaseOut = bezier(0, 0, 0.58, 1);       // its segment 2 ('ease-out')

// ---------- the apps ----------
// ic: the tile (the rail's tile rules): sym = registry symbol on bg/ink, img = full-bleed art,
// logo = transparent mark at 60% on a ground, let = a letter mark. pg: that app's page in the browser.
const SURF = '#1e1e21';
const SERIF = 'Georgia, "Times New Roman", serif';
const APPS = {
  chatgpt: { t: 'ChatGPT', host: 'chatgpt.com', ic: { sym: 'openai', bg: '#000', ink: '#fff', hair: 1 },
    pg: { bg: '#212121', fg: '#ececec', muted: '#afafaf', comp: '#303030', acc: '#fff', side: { w: 260, bg: '#171717', rows: ['New chat', 'Search chats', 'Library'], chats: ['Trip plan (again)', 'Launch email v3', 'Reddit scraper', 'Weekly digest'] }, greet: 'What can I help with?', gs: 30, ph: 'Ask anything', foot: 1 } },
  claude: { t: 'Claude', host: 'claude.ai', ic: { sym: 'claude', bg: '#d97757', ink: '#fff' },
    pg: { bg: '#262624', fg: '#eeece7', muted: '#a8a49c', comp: '#30302e', acc: '#d97757', cr: 16, gfont: SERIF, gw: 400, gs: 34, mark: 1, greet: 'Good afternoon, Sam', ph: 'How can I help you today?' } },
  gemini: { t: 'Gemini', host: 'gemini.google.com', ic: { sym: 'gemini', bg: '#fff', ink: '#1f1f1f' },
    pg: { bg: '#131314', fg: '#e3e3e3', muted: '#9aa0a6', comp: '#1e1f20', acc: '#4c8df6', side: { w: 280, bg: '#1e1f20', rows: ['New chat', 'Explore Gems'], chats: ['Japan itinerary', 'Email draft', 'Bakery menu'] }, greet: 'Hello, Sam', grad: 'linear-gradient(90deg,#4c8df6,#a97cf0 55%,#d96570)', gs: 40, ph: 'Ask Gemini', foot: 1 } },
  perplexity: { t: 'Perplexity', host: 'perplexity.ai', ic: { let: 'P', bg: '#20808d', ink: '#fff' },
    pg: { bg: '#191a1a', fg: '#e8e8e6', muted: '#8d9191', comp: '#202222', cb: '#20808d', acc: '#20808d', cr: 14, gfont: SERIF, gw: 400, gs: 40, greet: 'perplexity', ph: 'Ask anything' } },
  lovable: { t: 'Lovable', host: 'lovable.dev', ic: { logo: 'lovable.png', bg: '#fff' },
    pg: { bg: 'linear-gradient(180deg,#0b0b12 0%,#16183a 40%,#6b2f8f 75%,#e0613f 100%)', fg: '#fff', muted: '#b9b4c8', comp: '#1c1c1c', acc: '#fff', cr: 20, gs: 44, gw: 600, mark: 1, greet: 'Build something Lovable', ph: 'Ask Lovable to create a web app that...' } },
  cursor: { t: 'Cursor', host: 'cursor.com', ic: { sym: 'cursor', bg: '#000', ink: '#fff', hair: 1 },
    pg: { bg: '#0f0f0f', fg: '#ececec', muted: '#9a9a9a', comp: '#1a1a1a', acc: '#fff', gfont: SERIF, gw: 400, gs: 48, greet: 'The AI Code Editor', btn: 'Download for macOS' } },
  copilot: { t: 'GitHub Copilot', host: 'github.com/copilot', ic: { sym: 'copilot', bg: '#24292f', ink: '#fff', hair: 1 },
    pg: { bg: '#0d1117', fg: '#e6edf3', muted: '#8b949e', comp: '#161b22', acc: '#238636', cr: 12, gs: 32, mark: 1, greet: 'Ask Copilot', ph: 'Ask Copilot anything' } },
  grok: { t: 'Grok', host: 'grok.com', ic: { img: 'grok.png' },
    pg: { bg: '#000', fg: '#f2f2f2', muted: '#8a8a8a', comp: '#161616', acc: '#fff', greet: 'Grok', gs: 44, gw: 700, mark: 1, ph: 'What do you want to know?' } },
  doordash: { t: 'DoorDash', host: 'doordash.com', ic: { sym: 'doordash', bg: '#ff3008', ink: '#fff' },
    pg: { bg: '#191919', fg: '#fff', muted: '#a3a3a3', comp: '#262626', cb: 'rgba(255,255,255,.08)', acc: '#ff3008', gs: 38, gw: 700, mark: 1, greet: 'Your favorites, delivered.', ph: 'Search DoorDash' } },
  youtube: { t: 'YouTube', host: 'youtube.com', ic: { sym: 'youtube', bg: '#ff0033', ink: '#fff' },
    pg: { bg: '#0f0f0f', fg: '#f1f1f1', muted: '#aaa', comp: '#121212', cb: 'rgba(255,255,255,.18)', acc: '#272727', cr: 40, gs: 40, gw: 700, mark: 1, greet: 'YouTube', ph: 'Search' } },
  devin: { t: 'Devin', host: 'app.devin.ai', ic: { img: 'devin.png' },
    pg: { bg: '#0b0e14', fg: '#e6e8ef', muted: '#8c92a8', comp: '#141a26', acc: '#3b82f6', cr: 12, mark: 1, greet: 'Welcome back, Sam', gs: 30, ph: 'Give Devin a task to work on' } },
  replit: { t: 'Replit', host: 'replit.com', ic: { logo: 'replit.png', bg: SURF },
    pg: { bg: '#0e1525', fg: '#f5f9fc', muted: '#9da2a6', comp: '#1c2333', acc: '#f26207', cr: 12, gs: 36, greet: 'What will you build?', ph: 'Describe an app or site you want to create' } },
  bolt: { t: 'Bolt', host: 'bolt.new', ic: { img: 'bolt.png' },
    pg: { bg: '#0a0a0a', fg: '#fff', muted: '#9a9a9a', comp: '#141414', acc: '#1488fc', cr: 14, gs: 40, gw: 700, greet: 'What do you want to build?', ph: 'How can Bolt help you today?' } },
  v0: { t: 'v0', host: 'v0.app', ic: { logo: 'v0.svg', bg: '#000', hair: 1 },
    pg: { bg: '#000', fg: '#ededed', muted: '#a1a1a1', comp: '#0a0a0a', cb: 'rgba(255,255,255,.14)', acc: '#fff', cr: 14, gs: 34, greet: 'What can I help you build?', ph: 'Ask v0 to build a landing page' } },
  windsurf: { t: 'Windsurf', host: 'windsurf.com', ic: { sym: 'windsurf', bg: '#0b100f', ink: '#58e5bb', hair: 1 },
    pg: { bg: '#0b100f', fg: '#e8f4f0', muted: '#8aa39b', comp: '#121a18', acc: '#58e5bb', gs: 40, mark: 1, greet: 'Windsurf', ph: 'Ask Cascade anything' } },
  lechat: { t: 'Le Chat', host: 'chat.mistral.ai', ic: { let: 'M', bg: '#ff7000', ink: '#fff' },
    pg: { bg: '#1a1a1a', fg: '#ececec', muted: '#9a9a9a', comp: '#242424', acc: '#ff7000', cr: 14, mark: 1, greet: 'Le Chat', gs: 34, ph: 'Ask le Chat or @mention an agent' } },
  deepseek: { t: 'DeepSeek', host: 'chat.deepseek.com', ic: { let: 'D', bg: '#4d6bfe', ink: '#fff' },
    pg: { bg: '#212327', fg: '#e6e8ef', muted: '#8c92a8', comp: '#2c2f36', acc: '#4d6bfe', cr: 20, mark: 1, greet: "Hi, I'm DeepSeek.", gs: 28, ph: 'Message DeepSeek' } },
  hermes: { t: 'Hermes', host: 'hermes-agent.nousresearch.com', ic: { img: 'hermes.png' },
    pg: { bg: '#0d0d0d', fg: '#ececec', muted: '#9a9a9a', comp: '#1a1a1a', acc: '#c9a227', mark: 1, greet: 'Hermes Agent', gs: 34, ph: 'Give Hermes a goal' } },
  kiro: { t: 'Kiro', host: 'kiro.dev', ic: { img: 'kiro.ico' },
    pg: { bg: '#0f0a1c', fg: '#ece8f7', muted: '#9d93b8', comp: '#1a1330', acc: '#7c5cff', cr: 12, mark: 1, greet: 'Kiro', gs: 44, gw: 700, ph: 'Spec it, then ship it' } },
  zed: { t: 'Zed', host: 'zed.dev', ic: { sym: 'zed', bg: '#084ccf', ink: '#fff' },
    pg: { bg: '#1f2127', fg: '#dce0e5', muted: '#8b919a', comp: '#2a2d34', acc: '#0751cf', cr: 8, mark: 1, greet: 'Welcome to Zed', gs: 32, ph: 'Ask the agent' } },
  jetbrains: { t: 'JetBrains AI', host: 'jetbrains.com/ai', ic: { logo: 'jetbrains.png', bg: SURF },
    pg: { bg: '#19191c', fg: '#dfe1e5', muted: '#8c8f95', comp: '#25252a', acc: '#fe2857', cr: 10, mark: 1, greet: 'JetBrains AI', gs: 34, ph: 'Ask AI Assistant' } },
  base44: { t: 'Base44', host: 'base44.com', ic: { logo: 'base44.png', bg: SURF },
    pg: { bg: '#161412', fg: '#f6efe7', muted: '#a39a90', comp: '#221f1c', cb: 'rgba(255,255,255,.08)', acc: '#ff6a00', cr: 16, gs: 36, gw: 700, greet: "Let's make your dream a reality", ph: 'Describe the app you want to create' } },
  meta: { t: 'Meta AI', host: 'meta.ai', ic: { let: '∞', bg: '#0866ff', ink: '#fff' },
    pg: { bg: '#1c1e21', fg: '#e4e6eb', muted: '#a8abb0', comp: '#28292c', acc: '#0866ff', mark: 1, greet: 'Ask Meta AI anything', gs: 30, ph: 'Ask Meta AI anything' } },
  poe: { t: 'Poe', host: 'poe.com', ic: { let: 'P', bg: '#7c3aed', ink: '#fff' },
    pg: { bg: '#181818', fg: '#ececec', muted: '#9a9a9a', comp: '#222', acc: '#7c3aed', side: { w: 240, bg: '#111', rows: ['Explore', 'Create bot'], chats: ['Assistant', 'Claude-Sonnet-5', 'GPT-5', 'Gemini'] }, greet: 'Poe', gs: 40, gw: 700, ph: 'Start a new chat' } },
  qwen: { t: 'Qwen', host: 'chat.qwen.ai', ic: { let: 'Q', bg: '#6a4cff', ink: '#fff' },
    pg: { bg: '#151521', fg: '#ececec', muted: '#9a9ab0', comp: '#1e1e2e', acc: '#6a4cff', greet: 'Good afternoon, Sam', gs: 30, ph: 'How can I help you today?' } },
  kimi: { t: 'Kimi', host: 'kimi.com', ic: { let: 'K', bg: '#111', ink: '#fff', hair: 1 },
    pg: { bg: '#141414', fg: '#ececec', muted: '#9a9a9a', comp: '#1e1e1e', acc: '#fff', greet: "Hi, I'm Kimi", gs: 32, ph: 'Ask Kimi anything' } },
  vscode: { t: 'VS Code', host: 'code.visualstudio.com', ic: { sym: 'vscode', bg: '#0078d4', ink: '#fff' },
    pg: { bg: '#1f1f1f', fg: '#cccccc', muted: '#9d9d9d', comp: '#2a2a2a', acc: '#0078d4', mark: 1, greet: 'Visual Studio Code', gs: 36, btn: 'Download for Mac' } },
};
// the strip, left to right. The first three are open before the scene starts (ChatGPT in front);
// the rest open in this order, faster and faster. Repeats are on purpose: nobody closes a ChatGPT tab.
// Every page is dark (DoorDash and Base44 in their dark themes) so the fast cuts never strobe white.
const ORDER = [
  'chatgpt', 'claude', 'gemini',
  'perplexity', 'lovable', 'cursor', 'copilot', 'grok', 'doordash', 'youtube', 'devin', 'base44', 'bolt',
  'v0', 'windsurf', 'chatgpt', 'lechat', 'deepseek', 'hermes', 'kiro', 'claude', 'zed', 'jetbrains',
  'replit', 'meta', 'poe', 'gemini', 'qwen', 'kimi', 'vscode', 'chatgpt', 'youtube', 'claude', 'cursor',
  'perplexity', 'grok', 'lovable', 'copilot', 'windsurf', 'chatgpt',
];
const N = ORDER.length;
const PRE = 3;

// ---------- the beats (local seconds) ----------
const T = {
  open0: 0.40, open1: 2.30, openPow: 0.6, // tab 4 opens at 0.40, the 40th at 2.30, each gap shorter
  grow: 0.16,                              // a new tab grows in from zero width
  xfade: 0.001,                            // page swap under a new tab: a clean cut, exactly like Chrome (and tabs-chaos)
  count: 1.0,                              // the "N tabs open" pill
  K: 2.50,                                 // the kill: favicons lift out of the strip onto the sphere
  stagger: 0.28, fly: 0.60,                // lifted from the middle of the strip outward, 0.6s flights
  M: 3.92, merge: 0.45,                    // sphere-intro's MERGE_T and its 450ms accelerating merge window
  flip: 0.92,                              // fv-flip-icon-grow, exact duration (ends 4.84)
  // the rail drop + window build (sphere-intro showFrontend, beats 3a / 3b / 4 and the extend)
  rise: 4.90,                              // 3a: the mark shrinks to the rail tile and rises to the column head, 620ms GLIDE
  drop: 5.52, dropGap: 0.07, dropDur: 0.48,// 3b: the rail's own icons drop from it one by one (-34px, overshoot)
  glide: 6.70, glideDur: 0.64,             // 4: the whole column glides home as one; the window grounds fade in (520ms)
  rest: 0.38,                              // on landing: sidebar, chat lane, selection pill fade in
  msg: 7.62, msgDur: 0.90,                 // the reply streams in, word by word
  dur: 9.4,
};
const LAND = T.glide + T.glideDur;
const openAt = (k) => (k === 0 ? -1 : k < PRE ? -3 + k * 0.5 : T.open0 + (T.open1 - T.open0) * Math.pow((k - PRE) / (N - 1 - PRE), T.openPow));
const SEQ = [...Array(N).keys()].sort((a, b) => openAt(a) - openAt(b)); // opening order (ChatGPT, tab 0, is on top)
const MID = (N - 1) / 2;
const liftAt = (k) => T.K + T.stagger * (Math.abs(k - MID) / MID);

// geometry (stage px; the browser is drawn at design px and zoomed Z, full bleed like tabs-chaos)
const Z = 1.25, BH = 864;
const STRIP_L = 80, STRIP_R = 44 + 34;
const TILE = 64, R = 240, PERSP = 1500, MARK = 300;
// sphere-intro's spin: omega 0.35 -> 21 rad/s along x^1.55; started warmer here since it runs 1.4s, not 4s
const W0 = 1.2, WMAX = 21;
const omega = (tau) => W0 * Math.exp(Math.log(WMAX / W0) * Math.pow(seg(tau, T.K, T.M), 1.55));
function spinAngle(t) {
  if (t <= T.K) return 0;
  const end = Math.min(t, T.M), h = 1 / 480;
  let a = 0, tau = T.K;
  while (tau + h <= end) { a += h * 0.5 * (omega(tau) + omega(tau + h)); tau += h; }
  a += (end - tau) * 0.5 * (omega(tau) + omega(end));
  if (t > T.M) a += (t - T.M) * WMAX;
  return a;
}
const FIB = Array.from({ length: N }, (_, i) => {
  const y = 1 - (2 * i + 1) / N;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const th = 2.399963 * i;
  return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
});

// ---------- markup ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function tile(ic) {
  let cls = 'tl', inner = '';
  const style = `background:${ic.bg || '#000'};color:${ic.ink || '#fff'}`;
  if (ic.sym) inner = `<svg><use href="#tbs-ic-${ic.sym}"/></svg>`;
  else if (ic.img) { cls += ' bleed'; inner = `<img src="${asset(ic.img)}" alt=""/>`; }
  else if (ic.logo) { cls += ' logo'; inner = `<img src="${asset(ic.logo)}" alt=""/>`; }
  else inner = `<b>${esc(ic.let)}</b>`;
  if (ic.hair || ic.img || ic.logo) cls += ' hair';
  return `<span class="${cls}" style="${style}">${inner}</span>`;
}
function page(app) {
  const p = app.pg;
  const vars = `--p-bg:${p.bg};--p-fg:${p.fg};--p-muted:${p.muted};--p-comp:${p.comp};--p-acc:${p.acc};--p-side:${p.side ? p.side.w : 0}px;--p-side-bg:${p.side ? p.side.bg : 'transparent'};--p-gs:${p.gs || 30}px;--p-gw:${p.gw || 600};--p-gfont:${p.gfont || 'inherit'};--p-cr:${p.cr || 28}px;--p-cb:${p.cb || 'rgba(255,255,255,.08)'};--p-grad:${p.grad || 'none'}`;
  const side = p.side ? `<div class="side">${p.side.rows.map((r, k) => `<div class="r${k === 0 ? ' on' : ''}"><i></i>${esc(r)}</div>`).join('')}<div class="cap">Chats</div>${p.side.chats.map((c) => `<div class="c">${esc(c)}</div>`).join('')}</div>` : '';
  const mk = p.mark ? `<span class="mk">${tile(app.ic)}</span>` : '';
  const greet = `<div class="greet${p.grad ? ' grad' : ''}">${mk}<span>${esc(p.greet)}</span></div>`;
  const comp = p.btn ? `<span class="btn">${esc(p.btn)}</span>` : `<div class="comp"><span class="ph">${esc(p.ph)}</span><span class="go${p.cr && p.cr < 20 ? ' sq' : ''}"></span></div>`;
  const foot = p.foot ? `<div class="foot">${esc(app.t)} can make mistakes. Check important info.</div>` : '';
  return `<div class="pg${p.side ? ' has-side' : ''}" style="${vars}">${side}<div class="mid">${greet}${comp}</div>${foot}</div>`;
}

// the Superbot window's placement for a stage width W, and where its rail slot lands (design px measured
// with offsetLeft/Top, which transforms never touch; converted to stage px by the site's own scale)
function siteGeo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  const DW = 1205, k = Math.min(1.43402, (W - 48) / DW);
  const DH = Math.min(1080 / k, DW * 1.25);
  const L = (W - DW * k) / 2, Tp = (1080 - DH * k) / 2;
  el.site.style.width = DW + 'px';
  el.site.style.height = DH.toFixed(3) + 'px';
  el.site.style.transform = `translate(${L.toFixed(3)}px,${Tp.toFixed(3)}px) scale(${k.toFixed(5)})`;
  if (!el.sb.offsetWidth) return null; // not laid out (scene hidden): measure on a later frame
  const off = (n) => { let x = 0, y = 0; while (n && n !== el.site) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y }; };
  const s = off(el.sb), lastEl = el.drops[el.drops.length - 1], l = off(lastEl);
  const slotDx = s.x + el.sb.offsetWidth / 2, slotDy = s.y + el.sb.offsetHeight / 2;
  const span = l.y + lastEl.offsetHeight / 2 - slotDy;
  el.geo = { W, k, L, T: Tp, slotDx, slotDy, span, slotX: L + k * slotDx, slotY: Tp + k * slotDy };
  return el.geo;
}

let el = null; // mounted DOM refs

export default {
  id: 'tabs',
  dur: T.dur,

  mount(section, ctx) {
    const tabs = ORDER.map((id, k) => `<span class="tab" data-k="${k}"><span class="in"><span class="fav">${tile(APPS[id].ic)}</span><span class="tt">${esc(APPS[id].t)}</span></span><span class="x"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></span><i class="sep"></i></span>`).join('');
    section.innerHTML = `
<div class="tbs-root">
  <svg class="tbs-defs" aria-hidden="true" width="0" height="0">${SYMBOLS}</svg>
  <div class="cam">
    <div class="browser">
      <div class="strip">
        <span class="lights"><i></i><i></i><i></i></span>
        ${tabs}
        <span class="newtab"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>
        <span class="tabsearch"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span>
      </div>
      <div class="toolbar">
        <span class="tb"><svg viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg></span>
        <span class="tb dim"><svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
        <span class="tb"><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg></span>
        <span class="omni"><span class="site"><svg viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="9" cy="18" r="2" fill="currentColor"/></svg></span><span class="url"></span><span class="star"><svg viewBox="0 0 24 24"><path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9Z"/></svg></span></span>
        <span class="tb"><svg viewBox="0 0 24 24"><path d="M14 4h3a2 2 0 0 1 2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 1-2 2h-3a2 2 0 1 0-4 0H7a2 2 0 0 1-2-2v-3a2 2 0 1 0 0-4V6a2 2 0 0 1 2-2h3a2 2 0 1 1 4 0Z"/></svg></span>
        <span class="tb profile">S</span>
        <span class="tb"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></span>
      </div>
      <div class="pane">${ORDER.map((id) => page(APPS[id])).join('')}</div>
      <div class="tabcount"><b>3</b> tabs open</div>
    </div>
  </div>
  <div class="sbsite"><div class="stage"><div class="stage-bar"><i></i><i></i><i></i><span>superbot</span><em class="led"></em></div><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div>
  <div class="glow"></div>
  <div class="orb">${ORDER.map((id) => tile(APPS[id].ic)).join('')}</div>
  <img class="mark" src="${asset('tile.svg')}" alt="" draggable="false"/>
</div>`;
    const q = (s) => section.querySelector(s);
    const qa = (s) => [...section.querySelectorAll(s)];
    el = {
      root: q('.tbs-root'), cam: q('.cam'), browser: q('.browser'), url: q('.url'), newtab: q('.newtab'),
      count: q('.tabcount'), countN: q('.tabcount b'),
      tabs: qa('.strip .tab'), pages: qa('.pane .pg'), orb: qa('.orb .tl'), glow: q('.glow'), mark: q('.mark'),
    };
    // the hub (tabs-chaos's #hub, verbatim): the rail, its superbot slot, the dropping icons, the rest of the window
    const hub = q('.sbsite .hub');
    el.site = q('.sbsite'); el.stage = q('.sbsite .stage'); el.bar = q('.sbsite .stage-bar'); el.hub = hub;
    el.rail = hub.querySelector('.rail'); el.sb = hub.querySelector('.rail-item.sb');
    el.drops = [...el.rail.children].filter((n) => n !== el.sb);
    el.rest = [...hub.querySelectorAll('.inner')].filter((n) => n !== el.rail);
    el.msg = hub.querySelector('[data-k="h-bot"]');
    const txt = hub.querySelector('[data-k="h-text"]');
    txt.innerHTML = txt.textContent.trim().split(/\s+/).map((w) => `<span class="w">${esc(w)}</span>`).join(' ');
    el.words = [...txt.querySelectorAll('.w')];
    el.geo = null;
    el.tabParts = el.tabs.map((t) => ({ fav: t.querySelector('.fav'), tt: t.querySelector('.tt'), x: t.querySelector('.x'), sep: t.querySelector('.sep') }));
    el.last = { url: '', count: '', W: 0, act: -1 };
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, Math.min(T.dur, lt));
    const W = (ctx && ctx.W) || 1920, H = 1080;
    const cx = W / 2, cy = H / 2;
    const BW = W / Z;

    // ---- the browser: full bleed, a slow push-in while the tabs pile up, then it falls away ----
    if (el.last.W !== W) {
      el.last.W = W;
      el.browser.style.width = BW + 'px';
      el.browser.classList.toggle('narrow', BW < 1000);
    }
    const kill = seg(t, T.K, T.K + 0.8);
    // push-in about the top edge (toward the strip), fall-away about the centre. The push is capped so
    // each side edge moves out at most 8 stage px: the traffic lights (16px in) and the tab-search
    // chevron (15px in) stay fully inside the frame at every aspect ratio.
    const push = Math.min(0.018, 8 / cx);
    const s1 = 1 + push * inOutCubic(seg(t, 0.3, T.K)), s2 = lerp(1, 0.9, outCubic(kill));
    const cam = s1 * s2, offX = cx + (cx * (1 - s1) - cx) * s2, offY = cy - cy * s2;
    el.cam.style.transform = `translate(${offX.toFixed(3)}px,${offY.toFixed(3)}px) scale(${cam.toFixed(5)})`;
    el.cam.style.opacity = (1 - outCubic(seg(t, T.K + 0.1, T.K + 0.62))).toFixed(4);

    // ---- which tabs are open, the strip's layout (Chrome shares the width, max 240 each) ----
    const avail = BW - STRIP_L - STRIP_R;
    const o = new Array(N);
    let sum = 0, act = 0, actAt = -Infinity, open = 0;
    for (let k = 0; k < N; k++) {
      const s = openAt(k);
      o[k] = s < 0 ? 1 : outCubic(seg(t, s, s + T.grow));
      sum += o[k];
      if (t >= s) { open++; if (s > actAt) { actAt = s; act = k; } }
    }
    const wFull = Math.min(240, avail / Math.max(sum, 1e-6));
    const xs = new Array(N), ws = new Array(N);
    let x = STRIP_L;
    for (let k = 0; k < N; k++) { xs[k] = x; ws[k] = o[k] * wFull; x += ws[k]; }
    const stripEnd = x;

    for (let k = 0; k < N; k++) {
      const tab = el.tabs[k], p = el.tabParts[k], w = ws[k];
      const isOpen = t >= openAt(k);
      const on = k === act;
      tab.style.display = isOpen || o[k] > 0 ? '' : 'none';
      if (!(isOpen || o[k] > 0)) continue;
      tab.style.transform = `translateX(${xs[k].toFixed(2)}px)`;
      tab.style.width = w.toFixed(2) + 'px';
      tab.classList.toggle('on', on);
      const favL = Math.min(12, (w - 16) / 2);
      p.fav.style.transform = `translateX(${favL.toFixed(2)}px)`;
      p.tt.style.transform = `translateX(${(favL + 24).toFixed(2)}px)`;
      p.tt.style.width = Math.max(0, w - favL - 24 - (on ? 28 : 8)).toFixed(1) + 'px';
      p.tt.style.opacity = clamp01((w - 52) / 28).toFixed(3);
      p.x.style.opacity = on ? clamp01((w - 64) / 24).toFixed(3) : '0';
      // Chrome's separator: after an inactive tab that is not followed by the active one
      const nextOn = k + 1 === act, nextOpen = k + 1 < N && t >= openAt(k + 1);
      p.sep.style.opacity = !on && !nextOn && nextOpen ? (0.999 * o[k + 1]).toFixed(3) : '0';
      // the kill: the favicon leaves (its sphere tile takes over in the same frame), the tab dies
      const lift = liftAt(k);
      p.fav.style.visibility = t >= lift ? 'hidden' : '';
      tab.style.opacity = (1 - seg(t, lift, lift + 0.18)).toFixed(3);
    }
    el.newtab.style.transform = `translateX(${(stripEnd + 6).toFixed(2)}px)`;

    // ---- the pages: each new tab brings its page in over a 0.08s crossfade (stacked in opening order) ----
    const pos = SEQ.indexOf(act);
    let covered = false;
    for (let j = SEQ.length - 1; j >= 0; j--) {
      const k = SEQ[j], pg = el.pages[k];
      let a = 0;
      if (j <= pos && !covered) {
        const s = openAt(k);
        a = s < 0 ? 1 : seg(t, s, s + T.xfade);
        if (a >= 1) covered = true;
      }
      if (a <= 0) { if (pg.style.display !== 'none') pg.style.display = 'none'; continue; }
      pg.style.display = '';
      pg.style.zIndex = String(j + 1);
      pg.style.opacity = a >= 1 ? '1' : a.toFixed(3);
    }
    const host = APPS[ORDER[act]].host;
    if (el.last.url !== host) { el.last.url = host; el.url.innerHTML = `<b>${esc(host)}</b>`; }
    const cnt = String(open);
    if (el.last.count !== cnt) { el.last.count = cnt; el.countN.textContent = cnt; }
    const cp = seg(t, T.count, T.count + 0.3);
    el.count.style.opacity = (cp * (1 - seg(t, T.K - 0.05, T.K + 0.2))).toFixed(3);
    el.count.style.transform = `translateY(${((1 - outCubic(cp)) * -8).toFixed(2)}px)`;

    // ---- the sphere (sphere-intro's frame(), re-expressed on lt) with the tabs' favicons as its tiles ----
    const ang = spinAngle(t);
    const mergeT = Math.pow(seg(t, T.M - T.merge, T.M), 1.7);
    const blurT = seg(t, T.K + 0.62 * (T.M - T.K), T.M);
    const tileFade = 1 - seg(t, T.M, T.M + 0.22);
    const favS = 16 * Z * cam; // a favicon's size on stage
    for (let k = 0; k < N; k++) {
      const tl = el.orb[k], lift = liftAt(k);
      if (t < lift || tileFade <= 0) { if (tl.style.visibility !== 'hidden') tl.style.visibility = 'hidden'; continue; }
      tl.style.visibility = '';
      // where the favicon sits right now (it rides the falling browser)
      const fx = offX + Z * (xs[k] + Math.min(12, (ws[k] - 16) / 2) + 8) * cam;
      const fy = offY + Z * 23 * cam;
      // where its sphere slot is right now
      const d = FIB[k], ca = Math.cos(ang), sa = Math.sin(ang);
      const vx = d.x * ca + d.z * sa, vy = d.y, vz = -d.x * sa + d.z * ca;
      const rz = lerp(R, 10, mergeT);
      const sx3 = lerp(vx * R, 0, mergeT), sy3 = lerp(vy * R, 0, mergeT), sz3 = vz * rz;
      const ps = PERSP / (PERSP - sz3);
      const depth = (vz * (rz / R) * 175 + 190) / 380;
      const sOp = Math.min(1, 0.16 + 0.84 * depth);
      const sBlur = (Math.pow(blurT, 2) * 3.6 + (depth < 0.5 ? (0.5 - depth) * 3 : 0)) * (TILE / 54);
      // the flight: a yank out of the strip, easing onto the moving slot
      const e = outCubic(seg(t, lift, lift + T.fly));
      const px = lerp(fx, cx + sx3 * ps, e), py = lerp(fy, cy + sy3 * ps, e);
      const size = lerp(favS, TILE * ps, e);
      const sc = size / TILE;
      tl.style.transform = `translate3d(${(px - size / 2).toFixed(2)}px,${(py - size / 2).toFixed(2)}px,0) scale(${sc.toFixed(4)})`;
      tl.style.opacity = (lerp(1, sOp, e) * tileFade).toFixed(3);
      const b = e * sBlur;
      tl.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
      tl.style.zIndex = String(1000 + Math.round(lerp(R + 60, sz3, e)));
    }

    // ---- the Superbot window's geometry (tabs-chaos draws its stage at 1205 design px, 1.434x at 16:9) ----
    const G = siteGeo(W);
    const pRise = GLIDE(seg(t, T.rise, T.rise + 0.62));
    const pGl = GLIDE(seg(t, T.glide, LAND));
    const colY = G ? cy - (G.span / 2) * G.k : cy; // the column head: the rail stood up centred in the frame

    // ---- the mark: fv-flip-icon-grow, exact curve, from the merged tile's size; then it becomes the rail's head ----
    const u = (t - T.M) / T.flip;
    const mOp = seg(t, T.M - 0.03, T.M + 0.06);
    if (mOp <= 0 || t >= LAND || !G) {
      el.mark.style.visibility = 'hidden';
    } else {
      el.mark.style.visibility = 'visible';
      const s0 = (TILE * PERSP / (PERSP - 10)) / MARK;
      let rot, sc, br;
      if (u < 0.76) { const p = flipEase(clamp01(u / 0.76)); rot = 180 * (1 - p); sc = lerp(s0, 1.05, p); br = lerp(0.5, 1, p); }
      else { const p = cssEaseOut(clamp01((u - 0.76) / 0.24)); rot = 0; sc = lerp(1.05, 1, p); br = 1; }
      // 3a: shrink to the rail tile (44 design px) and rise to the column head; 4: ride the slot home
      sc *= lerp(1, (44 * G.k) / MARK, pRise);
      const mx = lerp(cx, G.slotX, pGl);
      const my = lerp(lerp(cy, colY, pRise), G.slotY, pGl);
      el.mark.style.left = (mx - MARK / 2).toFixed(2) + 'px';
      el.mark.style.top = (my - MARK / 2).toFixed(2) + 'px';
      el.mark.style.transform = `perspective(${(MARK * 3.6).toFixed(0)}px) rotateY(${rot.toFixed(3)}deg) scale(${sc.toFixed(5)})`;
      el.mark.style.filter = br < 0.999 ? `brightness(${br.toFixed(3)})` : 'none';
      el.mark.style.opacity = mOp.toFixed(3);
    }
    // a calm storm glow settles in behind it, and clears as the mark heads for the rail
    const g = outCubic(seg(t, T.M + 0.3, T.M + 1.0)) * (1 - outCubic(seg(t, T.rise, T.rise + 0.5)));
    el.glow.style.left = cx + 'px';
    el.glow.style.opacity = (0.55 * g).toFixed(3);
    el.glow.style.transform = `translate(-50%,-50%) scale(${lerp(0.85, 1, g).toFixed(4)})`;

    // ---- 3b / 4 / extend: the REAL rail stands under the mark, its icons drop, it glides home, the window builds ----
    if (!G || t < T.drop) {
      if (el.site.style.visibility !== 'hidden') el.site.style.visibility = 'hidden';
      return;
    }
    el.site.style.visibility = 'visible';
    const rx = (cx - G.L) / G.k - G.slotDx, ry = (colY - G.T) / G.k - G.slotDy; // design px: slot under the column head
    el.rail.style.transform = `translate(${(rx * (1 - pGl)).toFixed(3)}px,${(ry * (1 - pGl)).toFixed(3)}px)`;
    el.drops.forEach((n, i) => {
      const e = DROP(seg(t, T.drop + i * T.dropGap, T.drop + i * T.dropGap + T.dropDur));
      n.style.opacity = clamp01(e).toFixed(3);
      n.style.transform = e >= 1 ? 'none' : `translateY(${(-34 * (1 - e)).toFixed(3)}px)`;
    });
    // the window's grounds grow in around the gliding column (tabs-chaos: a 520ms ease-out transition; eased in
    // and out here, so the large dark ground starts from rest with the glide instead of stepping on)
    const a = inOutCubic(seg(t, T.glide, T.glide + 0.56));
    const A = a.toFixed(3);
    el.stage.style.backgroundColor = `rgba(13,13,13,${A})`;
    el.stage.style.borderColor = `rgba(38,38,38,${A})`;
    el.bar.style.opacity = A;
    el.hub.style.opacity = '1';
    el.hub.style.backgroundColor = `rgba(13,13,13,${A})`;
    el.hub.style.borderColor = `rgba(38,38,38,${A})`;
    el.hub.style.boxShadow = 'none';
    el.rail.style.opacity = '1';
    el.rail.style.backgroundColor = `rgba(0,0,0,${A})`;
    el.rail.style.borderRightColor = `rgba(38,38,38,${A})`;
    // landed: the slot draws the same tile.svg at the same pixel, so it takes over in the same frame
    el.sb.style.opacity = t >= LAND ? '1' : '0';
    const r = cssEaseOut(seg(t, LAND, LAND + T.rest));
    el.sb.style.setProperty('--sel-a', r.toFixed(3));
    el.rest.forEach((n) => { n.style.opacity = r.toFixed(3); });
    // the reply streams in, a word at a time (laid out in full from the start, so nothing reflows)
    el.msg.style.opacity = '1';
    const nw = el.words.length;
    el.words.forEach((w, i) => {
      const s = T.msg + (T.msgDur * i) / nw;
      w.style.opacity = seg(t, s, s + 0.1).toFixed(3);
    });
  },
};
