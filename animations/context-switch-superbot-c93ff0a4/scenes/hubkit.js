// hubkit.js: the landed Superbot window from the tabs intro, rebuilt 1:1 so a story scene can open on the exact
// frame the intro ends on, plus the pieces every story scene shares: agent views (superbot / Claude / ChatGPT)
// laid over the chats column and the thread, a feathered circular reveal that morphs one agent's palette into
// the next, bottom-anchored message stacks that scroll as replies land, a stage-level cursor, and a camera.
// Everything is a pure function of the scene clock: call the setters every frame with that frame's values.
import { clamp, lerp, seg, outCubic, inOutCubic, esc } from '../lib.js';
import { SYMBOLS } from './tabs-assets/icons.js';
import { hubMarkup } from './tabs-assets/hub-markup.js';

const asset = (f) => new URL('./tabs-assets/' + f, import.meta.url).href;
export const own = (f) => new URL('../assets/' + f, import.meta.url).href;

export const DW = 1205; // the site's design width (tabs.js siteGeo)
export function geo(W) {
  const k = Math.min(1.43402, (W - 48) / DW);
  const DH = Math.min(1080 / k, DW * 1.25);
  return { k, L: (W - DW * k) / 2, T: (1080 - DH * k) / 2, DH };
}

/** the same glide the intro uses for cursor travel */
export const ease = inOutCubic;
/** a 0..1 reveal that eases out over d seconds from a */
export const rise = (t, a, d = 0.35) => outCubic(seg(t, a, a + d));

export const icon = (id) => `<svg class="vz-ic"><use href="#tbs-ic-${id}"/></svg>`;
export const CAT = `<svg class="rc-cat" viewBox="0 0 100 100" aria-hidden="true"><g fill="#fff" stroke="none"><path d="M29 32H71A15 15 0 0 1 86 47V71A15 15 0 0 1 71 86H29A15 15 0 0 1 14 71V47A15 15 0 0 1 29 32Z"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="#1a1a1c" stroke="none"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></svg>`;
const CHEV = '<svg class="rc-chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';

export const AGENTS = {
  sb: { name: 'superbot', mark: CAT, tile: `<img src="${asset('tile.svg')}" alt=""/>`, ph: 'How can superbot help you today?' },
  claude: { name: 'Claude', mark: icon('claude'), tile: icon('claude'), ph: 'How can Claude help you today?' },
  gpt: { name: 'ChatGPT', mark: icon('openai'), tile: icon('openai'), ph: 'Ask ChatGPT anything' },
};

/** the real composer (.rc from hub-markup), with the platform chip naming this view's agent and an empty
    top row for the usage-limit notice (Thread.tsx UsageLimitNotice renders in the composer's topRow) */
export function composerHTML(kind) {
  const a = AGENTS[kind];
  return `<div class="vz-comp"><div class="rc"><div class="vz-top"></div><div class="rc-ph"><span class="vz-hint">${esc(a.ph)}</span><span class="vz-draft"></span></div><div class="rc-row"><span class="rc-plus"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></svg></span><span class="rc-seg"><span><svg viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg></span><span><svg viewBox="0 0 24 24"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/></svg></span></span><span class="rc-super">SUPER</span><span class="rc-plat vz-plat k-${kind}">${a.mark}${esc(a.name)}${CHEV}</span><span class="rc-computer"><svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></svg></span><span class="rc-mic"><svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg></span><span class="rc-send"><svg viewBox="0 0 24 24"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg></span></div></div></div>`;
}

/** one agent view: its chats column and its thread. msgs = [{id, who:'u'|'a'|'raw', text?, html?, cls?}] */
export function viewHTML(kind, o) {
  const a = AGENTS[kind];
  const rows = (o.chats || []).map((c, i) => `<div class="vz-row${i === 0 ? ' on' : ''}" data-row="${i}"><span>${esc(c)}</span></div>`).join('');
  const msgs = (o.msgs || []).map((m) => {
    if (m.who === 'raw') return `<div class="vz-m ${m.cls || ''}" data-m="${m.id}">${m.html}</div>`;
    const body = `<span class="vz-t">${m.html != null ? m.html : words(m.text)}</span>`;
    return `<div class="vz-m ${m.who === 'u' ? 'is-u' : 'is-a'} ${m.cls || ''}" data-m="${m.id}"><div class="vz-b">${body}</div></div>`;
  }).join('');
  return `<div class="vz v-${kind}" data-v="${kind}">
  <aside class="vz-side">
    <div class="vz-sh"><span class="vz-tile t-${kind}">${a.tile}</span><b>${esc(a.name)}</b></div>
    <div class="vz-new"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>New chat</div>
    <div class="vz-lab">Recents</div>
    <div class="vz-rows">${rows}</div>
  </aside>
  <section class="vz-main">
    <header class="vz-head"><span class="vz-title">${esc(o.title || a.name)}${CHEV}</span><span class="vz-share">Share</span></header>
    <div class="vz-feed"><div class="vz-col">${msgs}</div></div>
    ${o.greet || ''}
    ${composerHTML(kind)}
  </section>
</div>`;
}

/** text -> word spans, so a reply is laid out in full from the start and streams without reflowing */
export function words(text) {
  return String(text).split(/(\n)/).map((part) => (part === '\n' ? '<br/>' : part.split(/(\s+)/).map((w) => (/^\s+$/.test(w) || !w ? w : `<span class="w">${esc(w)}</span>`)).join(''))).join('');
}
/** stream a message's word spans: word i lands at t0 + i/wps */
export function streamWords(msgEl, t0, wps, t) {
  const ws = msgEl.__w || (msgEl.__w = [...msgEl.querySelectorAll('.w')]);
  for (let i = 0; i < ws.length; i++) ws[i].style.opacity = seg(t, t0 + i / wps, t0 + i / wps + 0.12).toFixed(3);
  return ws.length ? t0 + (ws.length - 1) / wps + 0.12 : t0;
}

/** mount the landed window into section: returns refs + the geometry for this W */
export function mountHub(section, ctx, views = '') {
  section.classList.add('hbx');
  section.innerHTML = `
<div class="tbs-root">
  <svg class="tbs-defs" aria-hidden="true" width="0" height="0">${SYMBOLS}</svg>
  <div class="cz-cam"><div class="sbsite"><div class="stage"><div class="stage-bar"><i></i><i></i><i></i><span>superbot</span><em class="led"></em></div><div class="body"><div class="arena">${hubMarkup(asset)}</div></div></div></div></div>
  <div class="cz-over"></div>
  <svg class="cz-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z"/></svg>
  <i class="cz-ring"></i>
</div>`;
  const q = (s) => section.querySelector(s);
  const hub = q('.sbsite .hub');
  const R = {
    sec: section, root: q('.tbs-root'), cam: q('.cz-cam'), site: q('.sbsite'), stage: q('.sbsite .stage'), bar: q('.sbsite .stage-bar'),
    hub, rail: hub.querySelector('.rail'), sb: hub.querySelector('.rail-item.sb'), over: q('.cz-over'), cursor: q('.cz-cursor'), ring: q('.cz-ring'),
    views: {}, W: 0, g: null, camS: 1, camFx: 0, camFy: 0,
  };
  // the landed state the intro leaves on its last frame (tabs.js render at T.dur), set once
  R.stage.style.backgroundColor = 'rgba(13,13,13,1)'; R.stage.style.borderColor = 'rgba(38,38,38,1)';
  R.bar.style.opacity = '1';
  Object.assign(hub.style, { opacity: '1', backgroundColor: 'rgba(13,13,13,1)', borderColor: 'rgba(38,38,38,1)', boxShadow: 'none' });
  Object.assign(R.rail.style, { opacity: '1', backgroundColor: 'rgba(0,0,0,1)', borderRightColor: 'rgba(38,38,38,1)' });
  R.sb.style.opacity = '1';
  // the rail's items drop in during the intro; here they have all landed
  R.rail.querySelectorAll(':scope > *').forEach((n) => { n.style.opacity = '1'; n.style.transform = 'none'; });
  hub.querySelectorAll('.inner').forEach((n) => { if (n !== R.rail) n.style.opacity = '1'; });
  const msg = hub.querySelector('[data-k="h-bot"]'); if (msg) msg.style.opacity = '1';
  // the selection bar becomes one element that can travel between rail items
  R.sb.classList.remove('sel');
  R.ind = document.createElement('i'); R.ind.className = 'vz-ind'; R.rail.appendChild(R.ind);
  R.tip = document.createElement('span'); R.tip.className = 'vz-tip'; hub.appendChild(R.tip);
  R.items = { sb: R.sb, gpt: hub.querySelector('.rail-item[data-app="openai"]'), claude: hub.querySelector('.rail-item[data-app="claude"]'), gemini: hub.querySelector('.rail-item[data-app="gemini"]') };
  // the agent views: one layer over the chats column + thread (everything right of the rail)
  R.layer = document.createElement('div'); R.layer.className = 'vz-layer'; R.layer.innerHTML = views; hub.appendChild(R.layer);
  R.layer.querySelectorAll('.vz').forEach((v) => {
    const k = v.dataset.v;
    R.views[k] = {
      el: v, col: v.querySelector('.vz-col'), feed: v.querySelector('.vz-feed'), comp: v.querySelector('.vz-comp'), rc: v.querySelector('.rc'),
      top: v.querySelector('.vz-top'), hint: v.querySelector('.vz-hint'), draft: v.querySelector('.vz-draft'), send: v.querySelector('.rc-send'),
      plat: v.querySelector('.vz-plat'), greet: v.querySelector('.vz-greet'), rows: [...v.querySelectorAll('.vz-row')],
      m: Object.fromEntries([...v.querySelectorAll('[data-m]')].map((n) => [n.dataset.m, n])), heights: null,
    };
  });
  return R;
}

/** size the site for W (call first each frame); cheap when W is unchanged */
export function place(R, W) {
  if (R.rim) R.rim.style.opacity = '0'; // a reveal/conceal mid-sweep this frame turns it back on
  if (R.W === W) return R.g;
  R.W = W; R.g = geo(W);
  const { k, L, T, DH } = R.g;
  R.site.style.visibility = 'visible';
  R.site.style.width = DW + 'px';
  R.site.style.height = DH.toFixed(3) + 'px';
  R.site.style.transform = `translate(${L.toFixed(3)}px,${T.toFixed(3)}px) scale(${k.toFixed(5)})`;
  return R.g;
}

/** camera: scale s about the design point (fx, fy); fx/fy stay put on screen */
export function camera(R, s, fx, fy) {
  const { k, L, T } = R.g;
  const X = L + k * fx, Y = T + k * fy;
  R.camS = s; R.camFx = X; R.camFy = Y;
  R.cam.style.transform = s === 1 ? 'none' : `translate(${(X * (1 - s)).toFixed(3)}px,${(Y * (1 - s)).toFixed(3)}px) scale(${s.toFixed(5)})`;
}
/** a design-px point (site coords) -> stage px, through the camera */
export function toStage(R, x, y) {
  const { k, L, T } = R.g;
  const X = L + k * x, Y = T + k * y, s = R.camS;
  return { x: R.camFx + (X - R.camFx) * s, y: R.camFy + (Y - R.camFy) * s };
}
/** an element's centre in site design px (layout offsets, immune to the camera and the site scale) */
export function centerOf(R, el, dx = 0, dy = 0) {
  let x = 0, y = 0, n = el;
  while (n && n !== R.site) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x: x + el.offsetWidth / 2 + dx, y: y + el.offsetHeight / 2 + dy, w: el.offsetWidth, h: el.offsetHeight, l: x, t: y };
}

/** the cursor (stage px, tip at x,y), with a press dip p (0..1) and opacity v */
export function cursorAt(R, x, y, p = 0, v = 1) {
  R.cursor.style.opacity = clamp(v).toFixed(3);
  R.cursor.style.transform = `translate(${(x - 5.6).toFixed(2)}px,${(y - 3.6).toFixed(2)}px) scale(${(1 - 0.14 * p).toFixed(3)})`;
}
/** a soft click ring at (x, y) stage px, age = seconds since the click */
export function ringAt(R, x, y, age) {
  const a = seg(age, 0, 0.5);
  if (age < 0 || a >= 1) { R.ring.style.opacity = '0'; return; }
  R.ring.style.opacity = (0.55 * (1 - a)).toFixed(3);
  R.ring.style.transform = `translate(${(x - 20).toFixed(1)}px,${(y - 20).toFixed(1)}px) scale(${lerp(0.35, 1.25, outCubic(a)).toFixed(3)})`;
}
/** a cursor path over keyframes [{t, x, y}] in design px; converted through the camera every frame */
export function pathDesign(R, t, keys) {
  if (t <= keys[0].t) return toStage(R, keys[0].x, keys[0].y);
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) { const f = ease(seg(t, a.t, b.t)); return toStage(R, lerp(a.x, b.x, f), lerp(a.y, b.y, f)); }
  }
  const z = keys[keys.length - 1]; return toStage(R, z.x, z.y);
}

/** the rail's selection bar at the item for key, blending from -> to by f */
export function railSel(R, from, to, f, a = 1) {
  const y = (k) => R.items[k].offsetTop + R.items[k].offsetHeight / 2;
  const e = inOutCubic(clamp(f));
  // the bar shrinks a touch mid-flight, like the app's own indicator
  const h = 26 - 10 * Math.sin(Math.PI * e);
  R.ind.style.opacity = clamp(a).toFixed(3);
  R.ind.style.height = h.toFixed(2) + 'px';
  R.ind.style.transform = `translateY(${(lerp(y(from), y(to), e) - h / 2).toFixed(2)}px)`;
}
/** hover lift on a rail item plus its name tip */
export function railHover(R, key, h, label) {
  const it = R.items[key];
  it.style.transform = h > 0 ? `scale(${(1 + 0.06 * h).toFixed(3)})` : '';
  it.style.filter = h > 0 ? `brightness(${(1 + 0.12 * h).toFixed(3)})` : '';
  if (label != null) {
    R.tip.textContent = label;
    R.tip.style.opacity = h.toFixed(3);
    R.tip.style.transform = `translate(${(it.offsetLeft + it.offsetWidth + 10 + 4 * (1 - h)).toFixed(1)}px,${(it.offsetTop + it.offsetHeight / 2 - 11).toFixed(1)}px)`;
  }
}

/** show view k fully (p=1), hidden (p=0), or mid-reveal: a feathered circle grows from (cx, cy) in view px */
export function reveal(R, k, p, cx = 0, cy = 0) {
  const v = R.views[k].el;
  if (p <= 0) { v.style.visibility = 'hidden'; return; }
  v.style.visibility = 'visible';
  if (p >= 1) { v.style.webkitMaskImage = v.style.maskImage = 'none'; return; }
  const far = Math.hypot(Math.max(cx, v.offsetWidth - cx), Math.max(cy, v.offsetHeight - cy)) + 140;
  const r = far * p, f = 64;
  const m = `radial-gradient(circle at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, #000 ${Math.max(0, r - f).toFixed(1)}px, transparent ${r.toFixed(1)}px)`;
  v.style.webkitMaskImage = m; v.style.maskImage = m;
  rim(R, cx, cy, r - f / 2, p);
}
/** the wave front of a switch: a thin storm-gradient ring riding the mask's edge, brightest mid-sweep */
function rim(R, cx, cy, r, p) {
  if (!R.rim) { R.rim = document.createElement('i'); R.rim.className = 'vz-rim'; R.layer.appendChild(R.rim); }
  const a = Math.sin(Math.PI * clamp(p)) * 0.9;
  R.rim.style.opacity = a.toFixed(3);
  R.rim.style.width = R.rim.style.height = (2 * Math.max(0, r)).toFixed(1) + 'px';
  R.rim.style.transform = `translate(${(cx - r).toFixed(1)}px,${(cy - r).toFixed(1)}px)`;
}
/** a point in site design px -> view-local px (the layer sits right of the rail inside the hub) */
export function viewPoint(R, x, y) {
  const c = centerOf(R, R.layer);
  return { x: x - c.l, y: y - c.t };
}

/** measure a view's messages once it is laid out (heights in design px) */
function measure(V) {
  if (V.heights || !V.col.offsetHeight) return !!V.heights;
  V.heights = {};
  const gap = parseFloat(getComputedStyle(V.col).rowGap) || 0;
  for (const [id, n] of Object.entries(V.m)) V.heights[id] = n.offsetHeight + gap;
  return true;
}
/** lay out the thread: e = {id: 0..1 reveal}; the stack sits on the feed's bottom edge and rises as messages land.
    Messages with no entry are treated as shown (1). */
export function thread(R, k, e, extra = 0) {
  const V = R.views[k];
  if (!measure(V)) return;
  let hidden = 0;
  const ids = Object.keys(V.m);
  // everything after the first not-fully-revealed message is pushed below the fold by its unrevealed share
  for (const id of ids) { const f = e[id] == null ? 1 : clamp(e[id]); hidden += (1 - outCubic(f)) * V.heights[id]; }
  V.ty = hidden - extra; // callers add this to a message's layout y to find where it is drawn
  V.col.style.transform = `translateY(${V.ty.toFixed(2)}px)`;
  for (const id of ids) {
    const f = e[id] == null ? 1 : clamp(e[id]);
    const n = V.m[id];
    n.style.opacity = outCubic(f).toFixed(3);
    n.style.transform = f >= 1 ? '' : `translateY(${((1 - outCubic(f)) * 10).toFixed(2)}px)`;
  }
}

/** the composer draft: typed text with a caret, the send button lit while there is a draft */
export function draft(R, k, text, o = {}) {
  const V = R.views[k];
  const has = text.length > 0;
  V.draft.innerHTML = esc(text) + (has && o.caret !== false ? '<i class="vz-caret"></i>' : (o.caretIdle ? '<i class="vz-caret"></i>' : ''));
  V.hint.style.display = has ? 'none' : '';
  V.send.classList.toggle('on', has);
  V.send.style.transform = o.press ? `scale(${(1 - 0.14 * o.press).toFixed(3)})` : '';
}

/** h:mm:ss for the usage countdown */
export function hms(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** the inverse of reveal: a feathered HOLE grows through view k from (cx, cy), uncovering whatever lies beneath */
export function conceal(R, k, p, cx = 0, cy = 0) {
  const v = R.views[k].el;
  if (p >= 1) { v.style.visibility = 'hidden'; return; }
  v.style.visibility = 'visible';
  if (p <= 0) { v.style.webkitMaskImage = v.style.maskImage = 'none'; return; }
  const far = Math.hypot(Math.max(cx, v.offsetWidth - cx), Math.max(cy, v.offsetHeight - cy)) + 140;
  const r = far * p, f = 64;
  const m = `radial-gradient(circle at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, transparent ${Math.max(0, r - f).toFixed(1)}px, #000 ${r.toFixed(1)}px)`;
  v.style.webkitMaskImage = m; v.style.maskImage = m;
  rim(R, cx, cy, r - f / 2, p);
}
/** a stage-px point -> site design px, through the camera (inverse of toStage) */
export function fromStage(R, X, Y) {
  const { k, L, T } = R.g, s = R.camS;
  const x = R.camFx + (X - R.camFx) / s, y = R.camFy + (Y - R.camFy) / s;
  return { x: (x - L) / k, y: (y - T) / k };
}
/** rename the native hub's open chat (its header and its Recents row) */
export function nativeTitle(R, text) {
  const head = R.hub.querySelector('.chat-head b');
  if (head) head.textContent = text;
  const row = R.hub.querySelector('.row.chat.on .t');
  if (row) row.textContent = text;
}

/** a superbot tool line: spinner while running, green check once done */
export const toolHTML = (label) => `<span class="vz-tool"><span class="sp"><i></i><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><span class="lb">${label}</span></span>`;
/** drive a tool line: spins from t0, checks at done (label swaps to doneLabel when given) */
export function tool(el, t, t0, done, doneLabel) {
  const ring = el.querySelector('.sp i'), ok = el.querySelector('.sp svg');
  const d = seg(t, done, done + 0.2);
  ring.style.transform = `rotate(${(((t - t0) * 400) % 360).toFixed(1)}deg)`;
  ring.style.opacity = (1 - d).toFixed(3);
  ok.style.opacity = d.toFixed(3);
  ok.style.transform = `scale(${lerp(0.6, 1, outCubic(d)).toFixed(3)})`;
  if (doneLabel != null) {
    const lb = el.querySelector('.lb');
    if (!lb.__run) lb.__run = lb.innerHTML;
    const want = t >= done ? doneLabel : lb.__run;
    if (lb.innerHTML !== want) lb.innerHTML = want;
  }
}
