// The six-request chat, one model per request. The ask is typed into superbot's composer, superbot routes it
// (routing pills above the answer, the composer's platform chip following the routed model or service), and the
// routed model answers in the thread while its own tool surface fills the output pane on the right (panes.js).
// Model routes read "Switching to X" -> "Switched to X"; service routes read "Connecting to X" -> "Connected to
// X", exactly as the desktop app's provider switch does. Thread is bottom-anchored: every message rises out of
// the composer. renderChat(c, t) is a pure function of the scene's local time.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import deepseek from './beats/deepseek.js?v=1';
import eleven from './beats/eleven.js?v=1';
import gemini from './beats/gemini.js?v=1';
import blender from './beats/blender.js?v=1';
import opus from './beats/opus.js?v=1';
import superbot from './beats/superbot.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const asset = (f) => new URL('../../assets/brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../assets/img/' + f, import.meta.url).href;
const hubAsset = (f) => new URL('./' + f, import.meta.url).href;   // hub tiles (tile.svg = superbot's own tile)
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 0.95; // the empty state has settled; the first ask starts typing

// the camera glyph superbot draws for a site it drives itself (no brand mark shipped for it)
const SITE_GLYPH = `<svg viewBox="0 0 24 24" style="fill:none;stroke:#c7c9d1;stroke-width:2;stroke-linecap:round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.2" style="fill:#c7c9d1;stroke:none"/></svg>`;

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  deepseek: { name: 'DeepSeek V4 Flash', logo: asset('deepseek.svg'), sub: 'in superbot' },
  instagram: { name: 'Instagram', logo: null, glyph: SITE_GLYPH, sub: 'connected' },
  elevenlabs: { name: 'ElevenLabs', logo: asset('elevenlabs.png'), sub: 'in superbot' },
  gemini: { name: 'Gemini', logo: asset('gemini.svg'), sub: 'in superbot' },
  blender: { name: 'Blender', logo: asset('blender.png'), sub: 'connected' },
  opus: { name: 'Claude Opus 5.5', logo: asset('anthropic.png'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm)
};

// One ask each; every following ask is the next thing to do, and superbot routes it to the tool that does it.
// pane = which output surface the answer fills (panes.js).
const ASKS = [
  { app: 'deepseek', mod: deepseek, pane: 'ig', ask: 'make me a toy of my corgi. his insta is @biscuit.loaf',
    chips: [['deepseek', 'Switching to DeepSeek V4 Flash'], ['instagram', 'Connecting to Instagram']] },
  { app: 'elevenlabs', mod: eleven, pane: 'el', ask: 'get his bark off the reels',
    chips: [['elevenlabs', 'Connecting to ElevenLabs']] },
  { app: 'gemini', mod: gemini, pane: 'gem', ask: 'draw the toy from every side',
    chips: [['gemini', 'Switching to Gemini']] },
  { app: 'blender', mod: blender, pane: 'bl', ask: 'get it ready to 3D print',
    chips: [['blender', 'Connecting to Blender']] },
  { app: 'opus', mod: opus, pane: 'code', ask: 'it should bark when you press the paw',
    chips: [['opus', 'Switching to Claude Opus 5.5']] },
  { app: 'superbot', mod: superbot, pane: 'order', ask: 'order two, one for my desk',
    chips: [['superbot', 'Switched to Superbot']] },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    k.typeEnd = s + Math.min(0.8, 0.12 + a.ask.length * 0.013);
    k.send = k.typeEnd + 0.12;
    k.sw = k.send + 0.3;      // superbot's first routing pill lands
    let at = k.sw;
    k.chips = a.chips.map(([app, label]) => { const c = { app, label, sw: at, swap: at + 0.22, done: at + 0.62 }; at = c.done + 0.12; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.08;  // the routed model answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(ASKS);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub, pane) {
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  // the pointer works over both halves of the frame, so it sits above the output pane (a later sibling in the scene)
  root.parentNode.appendChild(pointer);
  pointer.style.zIndex = '9';

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => {
    const a = APPS[app];
    if (app === 'superbot') return `<span class="qc-tile qc-t-superbot ${cls}">${SB_MARK}</span>`;
    const inner = a.logo ? `<img src="${a.logo}" alt=""/>` : `<span class="qc-glyph">${a.glyph}</span>`;
    return `<span class="qc-tile qc-t-${app} ${cls}">${inner}</span>`;
  };
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, asset, sbSrc, pane };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`);
    const sws = k.chips.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [[b.k.send, b.u], ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows whatever superbot routed to
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.codex.logo}" data-app="codex"/>`);
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  const pGlyph = el(`<span class="qc-pi-gl">${SITE_GLYPH}</span>`);
  pIcon.append(pImg, pMark, pGlyph);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.codex.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, pointer, feed, inner, beats, scroll, tile, plat, pIcon, pImg, pMark, pGlyph, pLabel, pane,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'codex',
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = Math.round(b.k.ask.length * seg(t, b.k.s, b.k.typeEnd));
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = c.beats.map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

function renderRouting(c, t) {
  let app = 'codex', swap = -1;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  if (app !== c.lastApp) {
    const a = APPS[app] || APPS.codex;
    c.pImg.style.display = a.logo ? '' : 'none';
    c.pMark.style.display = app === 'superbot' ? 'block' : 'none';
    c.pGlyph.style.display = (a.logo || app === 'superbot') ? 'none' : 'block';
    if (a.logo) c.pImg.src = a.logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = a.name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

function renderSwitch(s, t) {
  const k = s.c;
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.45));
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

// The output pane: opens with the first answer, follows the routed model, keeps its header in step with the
// routing pill, and hard-cuts between tool surfaces at each answer (a tool switch is a hard cut, not a fade).
function renderPane(c, t) {
  const p = c.pane;
  if (!p) return;
  const first = c.beats[0].k, last = c.beats[c.beats.length - 1].k;
  // the pane opens as the first route lands, so the hook already shows where the work will happen
  const open0 = first.chips[0].sw + 0.1;
  const open = outCubic(seg(t, open0, open0 + 0.5));
  p.host.style.opacity = open.toFixed(3);
  p.host.style.transform = `translateX(${(34 * (1 - open)).toFixed(2)}px)`;
  let cur = null;
  c.beats.forEach(({ k }) => { if (t >= k.reply) cur = k; });
  if (!cur) cur = first;
  if (p.current !== cur.pane) p.show(cur.pane);
  // header: the model that owns this surface, and whether its routing pill has resolved
  const done = t >= cur.done;
  const headTile = cur.app === 'superbot'
    ? `<span class="qc-tile qc-t-superbot"><img src="${hubAsset('tile.svg')}" alt=""/></span>`
    : c.tile(cur.app);
  p.head(APPS[cur.app].name, APPS[cur.app].sub, headTile, done);
  // the pane lifts away with the last answer, into the end card
  const out = inOutCubic(seg(t, last.T.end - 0.15, last.T.end + 0.35));
  p.host.style.opacity = (open * (1 - out)).toFixed(3);
  p.host.style.transform = `translate(${(34 * (1 - open) - 30 * out).toFixed(2)}px, ${(-16 * out).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    appear(b.u, t, b.k.send);
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
  renderPane(c, t);
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}