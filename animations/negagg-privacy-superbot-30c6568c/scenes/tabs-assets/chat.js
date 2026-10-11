// negagg-privacy: one thread in the real superbot hub. The first ask is typed into the composer and routed to
// ChatGPT, which answers it. The user then opens the composer's model picker and picks the local model,
// superbot-omni, which runs on this computer; the model chip wears LOCAL, and the same thread carries on: the
// follow-up is typed and answered on this device, with everything above it still in context (beats/second.js).
// No complaint, quote, count or error state appears anywhere on screen: the spot shows the solution.
// renderChat(c, t) is a pure function of the scene's local time. ?v= busts GitHub Pages' module cache.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor, press } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import first from './beats/first.js?v=1';
import second from './beats/second.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

const APPS = {
  gpt: { name: 'ChatGPT', logo: brand('openai-logo.svg'), sub: '' },
  claude: { name: 'Claude', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  // the house model that runs on the user's own computer (superbot.gg/models: superbot-omni, "Superbot agent,
  // run on your computer"). Drawn with superbot's own mark, never a vendor logo.
  local: { name: 'superbot-omni', logo: null, sub: 'on this device' },
};
const START_APP = 'gpt'; // the composer's model chip before the picker opens

// The story: one ask answered in the hub, then the user picks the local model in the composer's model picker and the
// same thread keeps going on the machine. The pick is the user's: superbot never switches models on its own.
const BEATS_SPEC = [
  { app: 'gpt', mod: first, chips: [['gpt', 'Asking ChatGPT']], ask: "Draft the notes for Monday's one on one." },
  { app: 'local', mod: second, chips: [['local', 'Ran on this device']], ask: 'Add the salary band numbers to point two.', gap: 2.0 },
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
      k.sw = s + 0.2;         // superbot carries on without being asked
    }
    // each chip lands, moves the model chip to its app (swap) and resolves (done); the next lands just after
    let at = k.sw;
    k.chips = a.chips.map(([app, label]) => { const c = { app, label, sw: at, swap: at + 0.22, done: at + 0.65 }; at = c.done + 0.12; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.08;  // the app answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(BEATS_SPEC);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;

// the model picker: the user opens the composer's model chip and picks the local model. It opens after the first
// reply and closes just before the follow-up is typed, so the choice reads as theirs, not superbot's.
export const PICK = { app: 'local', t0: BEATS[0].k.T.end + 0.3, t1: BEATS[1].k.s - 0.2 };
const PICK_ROWS = [['gpt', 'ChatGPT'], ['claude', 'Claude'], ['local', 'superbot-omni']];

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHECK = '<svg class="pv-ck" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}">${APPS[app].logo ? `<img src="${APPS[app].logo}" alt=""/>` : SB_MARK}</span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, sbSrc, send: null };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    const dev = k.app === 'local' ? '<i class="qc-dev">LOCAL</i>' : '';
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}${dev}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's model chip names the model, then follows the pick
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
  // the LOCAL pill the chip wears once the local model is picked
  const pDev = el('<i class="pv-chip-dev">LOCAL</i>');
  pDev.style.display = 'none';
  const chev = plat.querySelector('.rc-chev');
  plat.insertBefore(pDev, chev || null);

  // the model picker, inside the composer (so it inherits the hub's scale): hidden until PICK.t0
  const pick = el(`<div class="pv-pick" aria-hidden="true"><div class="pv-pick-h">Model</div>${PICK_ROWS.map(([app, name]) => `<div class="pv-opt" data-app="${app}">${tile(app)}<span class="pv-opt-n">${esc(name)}</span>${app === 'local' ? '<span class="pv-dev">ON THIS DEVICE</span>' : ''}<span class="pv-opt-ck">${CHECK}</span></div>`).join('')}</div>`);
  hub.querySelector('.composer').appendChild(pick);
  const rows = PICK_ROWS.map(([app]) => ({ app, el: pick.querySelector(`.pv-opt[data-app="${app}"]`) }));

  const sendEl = hub.querySelector('.rc-send');
  ctx.send = sendEl;  // beats may aim the pointer at the send button of the turn they send

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, root, pointer, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel, pDev, pick, rows,
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

// the model picker: the chip dips as it is opened, the menu rises, the pointer picks the local model, the menu
// leaves and the chip wears the new model plus the LOCAL pill.
function renderPicker(c, t) {
  const k = PICK;
  const open = seg(t, k.t0 - 0.04, k.t0 + 0.34);
  const leave = seg(t, k.t1 - 0.16, k.t1);
  const on = t >= k.t0 - 0.06 && t < k.t1;
  c.pick.style.display = on ? 'block' : 'none';
  if (!on) return;
  const v = (1 - outCubic(leave));
  c.pick.style.opacity = v.toFixed(3);
  c.pick.style.transform = `translateY(${((1 - outCubic(open)) * 10).toFixed(2)}px) scale(${(0.97 + 0.03 * open).toFixed(4)})`;
  const hot = seg(t, k.t0 + 0.66, k.t0 + 0.88);
  const pr = press(t, k.t0 + 1.04);
  c.rows.forEach((r) => {
    const sel = r.app === k.app;
    r.el.classList.toggle('pv-hot', sel && hot > 0.5);
    r.el.classList.toggle('pv-cur', r.app === START_APP);
    r.el.style.transform = sel && pr > 0 ? `scale(${(1 - 0.035 * pr).toFixed(3)})` : '';
  });
}

function renderRouting(c, t, pick) {
  let app = START_APP, swap = -1;
  if (t >= PICK.t0 + 1.04) app = PICK.app; // the pick in the model picker (the user's)
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  if (app !== c.lastApp) {
    const isLocal = app === 'local';
    c.pImg.style.display = isLocal ? 'none' : '';
    c.pMark.style.display = isLocal ? 'block' : 'none';
    if (!isLocal) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.pDev.style.display = isLocal ? 'inline-flex' : 'none';
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
  // While the thread is shorter than the feed it is CENTRED in the message area, so a short thread never leaves a
  // band of empty frame above or below it (the 4:5 lesson). Once it is taller than the feed this is exactly the
  // bottom-anchored scroll the reference used.
  c.inner.style.transform = `translateY(${Math.min((viewH - y) / 2, viewH - 8 - y).toFixed(2)}px)`;
}

// the pointer on the picker: from the send area onto the model chip, then down the menu onto the local row
function pickPointer(c, t) {
  const k = PICK;
  if (t < k.t0 - 0.35 || t > k.t1 + 0.1) return null;
  const pill = boxIn(c.plat, c.root);
  const rowCl = c.rows.find((r) => r.app === k.app);
  const rowB = rowCl ? boxIn(rowCl.el, c.root) : pill;
  // the tip lands on the chip's chevron and on the row's right side, so the cursor never sits over a label
  const pillPt = { x: pill.x + pill.w - 20, y: pill.cy };
  const row = { x: rowB.x + rowB.w - 34, y: rowB.cy };
  const toMenu = inOutCubic(seg(t, k.t0 + 0.40, k.t0 + 0.92));
  const x = lerp(pillPt.x, row.x, toMenu), y = lerp(pillPt.y, row.y, toMenu);
  const pr = Math.max(press(t, k.t0 - 0.06), press(t, k.t0 + 1.04));
  const v = seg(t, k.t0 - 0.35, k.t0 - 0.12) * (1 - seg(t, k.t1 - 0.16, k.t1 + 0.1));
  return { x, y, p: pr, v };
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  const inPick = t >= PICK.t0 - 0.06 && t < PICK.t1;
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