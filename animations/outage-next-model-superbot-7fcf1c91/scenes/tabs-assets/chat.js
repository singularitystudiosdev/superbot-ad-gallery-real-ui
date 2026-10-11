// outage-next-model: the chat. A ChatGPT task comes back with the vendor's own capacity error, the user opens the
// composer's model picker and picks Claude, and the same thread finishes the ask on the new model. Each ask is typed
// into the composer and sent, superbot's routing chip lands, and the model answers with its own beat (./beats/*.js).
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of the
// scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor, press } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import fails from './beats/fails.js?v=1';
import answers from './beats/answers.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 0.9; // the empty state has settled; the first ask starts typing

const APPS = {
  gpt: { name: 'GPT-6 Sol', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  claude: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  gemini: { name: 'Gemini 3 Pro', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};
const START_APP = 'gpt'; // the composer's model chip before the user opens the picker

// The story: one ChatGPT task comes back at capacity, the model picker offers the other models, the user picks Claude
// and the same ask finishes on it. The pick is the user's: superbot never switches models on its own.
const BASE = [
  { app: 'gpt', mod: fails, chips: [], ask: 'finish the auth refactor, then run the tests' },
  { app: 'claude', mod: answers, chips: [['claude', 'Ran on Claude Opus 5.5']], ask: 'finish the auth refactor, then run the tests', gap: 2.2 },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    s += a.gap || 0;
    const k = { ...a, s };
    if (a.ask) {
      k.typeEnd = s + Math.min(0.85, 0.15 + a.ask.length * 0.013);
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.35;   // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.2;
    }
    let at = k.sw;
    k.chips = a.chips.map(([app, label, keep]) => { const c = { app, label, keep: !!keep, sw: at, swap: at + 0.22, done: at + 0.65 }; at = c.done + 0.12; return c; });
    k.done = k.chips.length ? k.chips[k.chips.length - 1].done : k.sw - 0.25;
    k.reply = k.done + 0.08;  // the app answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(BASE);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;

// the model picker: the user opens the composer's model chip and picks the next model. It opens after the failed
// turn and closes before the user types the same ask again, so the pick reads as theirs, not superbot's.
export const PICK = { app: 'claude', name: 'Claude Opus 5.5', t0: BEATS[0].k.T.end + 0.3, t1: BEATS[1].k.s - 0.2 };
const PICK_ROWS = [['gpt', 'GPT-6 Sol'], ['claude', 'Claude Opus 5.5'], ['gemini', 'Gemini 3 Pro']];

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHECK = '<svg class="ot-ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${app === 'superbot' ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
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
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.r], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the pick
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS[START_APP].logo}" data-app="${START_APP}"/>`);
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS[START_APP].name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  // the model picker, inside the composer (so it inherits the hub's scale): hidden until PICK.t0
  const pick = el(`<div class="ot-pick" aria-hidden="true"><div class="ot-pick-h">Model</div>${PICK_ROWS.map(([app, name]) => `<div class="ot-opt" data-app="${app}">${tile(app)}<span class="ot-opt-n">${esc(name)}</span><span class="ot-opt-ck">${CHECK}</span></div>`).join('')}</div>`);
  hub.querySelector('.composer').appendChild(pick);
  const rows = PICK_ROWS.map(([app]) => ({ app, el: pick.querySelector(`.ot-opt[data-app="${app}"]`) }));

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, root, pointer, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel, pick, rows,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: START_APP,
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => k.ask && t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = Math.round(b.k.ask.length * seg(t, b.k.s, b.k.typeEnd));
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = c.beats.filter(({ k }) => k.ask).map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

// the model picker: the chip dips as it is opened, the menu rises, the pointer picks Claude, the menu leaves and the
// chip wears the new model. Nothing here switches on its own: every frame is driven by PICK.t0 and the pointer.
function renderPicker(c, t) {
  const k = PICK;
  const open = seg(t, k.t0 - 0.04, k.t0 + 0.34);
  const leave = seg(t, k.t0 + 1.30, k.t0 + 1.46);
  const on = t >= k.t0 - 0.06 && t < k.t0 + 1.5;
  c.pick.style.display = on ? 'block' : 'none';
  const pressPill = press(t, k.t0 - 0.06);
  c.plat.style.setProperty('--ot-press', pressPill.toFixed(3));
  if (!on) return;
  const v = (1 - outCubic(leave));
  c.pick.style.opacity = v.toFixed(3);
  c.pick.style.transform = `translateY(${((1 - outCubic(open)) * 10).toFixed(2)}px) scale(${(0.97 + 0.03 * open).toFixed(4)})`;
  const hot = seg(t, k.t0 + 0.66, k.t0 + 0.88);
  const pr = press(t, k.t0 + 1.04);
  c.rows.forEach((r) => {
    const sel = r.app === k.app;
    r.el.classList.toggle('ot-hot', sel && hot > 0.5);
    r.el.classList.toggle('ot-cur', r.app === START_APP);
    r.el.style.transform = sel && pr > 0 ? `scale(${(1 - 0.035 * pr).toFixed(3)})` : '';
  });
}

function renderRouting(c, t, pick) {
  let app = START_APP, swap = -1;
  if (t >= PICK.t0 + 1.04) app = PICK.app; // the pick in the model picker (the user's)
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (!ch.keep && t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  // the chip dips on the picker press and again on a routing chip's swap
  const dips = [];
  if (pick) dips.push([PICK.t0 - 0.06, PICK.t0 + 1.04]);
  if (swap >= 0) dips.push([swap - 0.14, swap + 0.14]);
  let dip = 0, pop = 0;
  for (const [a, b] of dips) { dip = Math.max(dip, bump(seg(t, a, b))); pop = Math.max(pop, bump(seg(t, b, b + 0.4))); }
  c.plat.style.opacity = (1 - 0.85 * dip).toFixed(3);
  c.plat.style.transform = pop > 0 ? `scale(${(1 + 0.08 * pop).toFixed(4)})` : 'none';
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
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed)
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

// the pointer on the picker: from the send area onto the model chip, then down the menu onto Claude, with the press
function pickPointer(c, t) {
  const k = PICK;
  if (t < k.t0 - 0.35 || t > k.t0 + 1.5) return null;
  const pill = boxIn(c.plat, c.root);
  const rowCl = c.rows.find((r) => r.app === k.app);
  const rowB = rowCl ? boxIn(rowCl.el, c.root) : pill;
  // the tip lands on the chip's chevron and on the row's right side, so the cursor never sits over a label
  const pillPt = { x: pill.x + pill.w - 20, y: pill.cy };
  const row = { x: rowB.x + rowB.w - 34, y: rowB.cy };
  const toMenu = inOutCubic(seg(t, k.t0 + 0.40, k.t0 + 0.92));
  const x = lerp(pillPt.x, row.x, toMenu), y = lerp(pillPt.y, row.y, toMenu);
  const pr = Math.max(press(t, k.t0 - 0.06), press(t, k.t0 + 1.04));
  const v = seg(t, k.t0 - 0.35, k.t0 - 0.12) * (1 - seg(t, k.t0 + 1.34, k.t0 + 1.5));
  return { x, y, p: pr, v };
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  const inPick = t >= PICK.t0 - 0.06 && t < PICK.t0 + 1.5;
  renderRouting(c, t, inPick);
  renderPicker(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
  // the pointer: the picker owns it while it is open; otherwise a beat may hand one back in the section's px
  const pp = pickPointer(c, t);
  const fromBeat = pp ? null : c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, (p) => p)).find(Boolean);
  const pt = pp || fromBeat;
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}