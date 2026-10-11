// negagg-cost: one thread in the real superbot hub, three asks, and every AI the user already pays for answers inside it.
// Ask 1, "connect my AI accounts": superbot signs in to ChatGPT, Claude and Gemini (ticking steps) and a "Your plans" card
// lists the three plans with a "superbot · Free plan · $0" footer. Ask 2, a poster for a bakery's Saturday sale: the user
// opens the composer's model picker and picks ChatGPT, a routing chip confirms "on your plan", and ChatGPT answers with a
// poster image card (a sourced bakery photo with the type laid over it) and a "0 superbot credits" chip. Ask 3, the
// Instagram caption plus scheduling: the picker picks Claude, the chip confirms, Claude writes the caption and superbot's
// steps open Instagram and schedule it (a scheduled-post card with the poster thumbnail). Every reply is a concrete artifact
// (beats/*.js), nothing is an outline. No complaint, quote, price of another product or error UI appears anywhere.
// renderChat(c, t) is a pure function of the scene's local time. ?v= busts GitHub Pages' module cache.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor, press } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import connect from './beats/connect.js?v=1';
import poster from './beats/poster.js?v=1';
import schedule from './beats/schedule.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 0.7; // the empty state has settled; the first ask starts typing

const APPS = {
  gpt: { name: 'ChatGPT', logo: brand('openai-logo.svg'), sub: '' },
  claude: { name: 'Claude', logo: brand('claude-logo.svg'), sub: '' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: '' },
  // superbot itself (the tool steps of the first ask): drawn with its own mark, never a vendor logo
  sb: { name: 'superbot', logo: null, sub: '' },
};
const START_APP = 'claude'; // the composer's model chip before the first pick

// The story: connect the plans (superbot), then two asks that the user routes by hand in the composer's model picker to
// the plan that does it best; superbot confirms each pick with a routing chip ("on your plan": no superbot credits).
const BEATS_SPEC = [
  { app: 'sb', mod: connect, chips: [], ask: 'connect my AI accounts' },
  { app: 'gpt', mod: poster, pick: 'gpt', chips: [['gpt', 'Switching to ChatGPT', { hold: true, tail: 'on your plan' }]], ask: "make a poster for my bakery's Saturday sale" },
  { app: 'claude', mod: schedule, pick: 'claude', chips: [['claude', 'Switching to Claude', { hold: true, tail: 'on your plan' }]], ask: 'write the Instagram caption and schedule it for Saturday 9am' },
];

// the model picker's timing, relative to the moment the first ask has been typed
const PICK_OPEN = 0.1, PICK_PRESS = 0.82, PICK_LEAVE = 1.02;
const FIRST_TYPE_AT = CHAT_T0 + 0.15;

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s: a === asks[0] ? FIRST_TYPE_AT : s };
    k.typeEnd = k.s + Math.min(0.62, 0.1 + a.ask.length * 0.011);
    if (a.pick) {
      k.pick = { app: a.pick, t0: k.typeEnd + PICK_OPEN, press: k.typeEnd + PICK_OPEN + PICK_PRESS, t1: k.typeEnd + PICK_OPEN + PICK_LEAVE };
      k.send = k.pick.t1 + 0.06;
    } else k.send = k.typeEnd + 0.15;
    k.sw = k.send + 0.3;   // superbot's routing chip lands
    // each chip lands, moves the model chip to its app (swap) and resolves (done); a held chip only confirms
    let at = k.sw;
    k.chips = a.chips.map(([app, label, o]) => { const hold = !!(o && o.hold); const c = { app, label, doneLabel: (o && o.doneLabel) || '', tail: (o && o.tail) || '', hold, sw: at, swap: at + 0.22, done: at + (hold ? 0.5 : 0.6) }; at = c.done + (hold ? 0.04 : 0.1); return c; });
    k.done = k.chips.length ? k.chips[k.chips.length - 1].done : k.send + 0.25;
    k.reply = k.done + 0.06;  // the model answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(BEATS_SPEC);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;
const PICKS = BEATS.filter(({ k }) => k.pick).map(({ k }) => k.pick);
const PICK_ROWS = [['gpt', 'ChatGPT', 'On your plan'], ['claude', 'Claude', 'On your plan'], ['gemini', 'Gemini', 'On your plan']];

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

  const ctx = { hub, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span>${c.tail ? `<span class="qc-swt">${esc(c.tail)}</span>` : ''}</span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), lab: w.querySelector('.qc-swl'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
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
  pIcon.append(pImg);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS[START_APP].name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);
  // the model picker, inside the composer (so it inherits the hub's scale): hidden until a pick's t0
  const pick = el(`<div class="pv-pick" aria-hidden="true"><div class="pv-pick-h">Model</div>${PICK_ROWS.map(([app, name, sub]) => `<div class="pv-opt" data-app="${app}">${tile(app)}<span class="pv-opt-t"><span class="pv-opt-l"><span class="pv-opt-n">${esc(name)}</span></span>${sub ? `<span class="pv-opt-s">${esc(sub)}</span>` : ''}</span><span class="pv-opt-ck">${CHECK}</span></div>`).join('')}</div>`);
  const composer = hub.querySelector('.composer');
  composer.appendChild(pick);
  const rows = PICK_ROWS.map(([app]) => ({ app, el: pick.querySelector(`.pv-opt[data-app="${app}"]`) }));
  const ph = hub.querySelector('.rc-ph');
  return {
    hub, root, pointer, feed, inner, beats, scroll, plat, pIcon, pImg, pLabel, pick, rows,
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

// the model picker: the chip dips as it is opened, the menu rises, the pointer picks the row, the menu
// leaves and the chip wears the new model.
function renderPicker(c, t) {
  const k = PICKS.find((p) => t >= p.t0 - 0.06 && t < p.t1);
  c.pick.style.display = k ? 'block' : 'none';
  if (!k) return;
  const open = seg(t, k.t0 - 0.04, k.t0 + 0.34);
  const leave = seg(t, k.t1 - 0.16, k.t1);
  const v = (1 - outCubic(leave));
  c.pick.style.opacity = v.toFixed(3);
  c.pick.style.transform = `translateY(${((1 - outCubic(open)) * 10).toFixed(2)}px) scale(${(0.97 + 0.03 * open).toFixed(4)})`;
  const hot = seg(t, k.t0 + 0.66, k.t0 + 0.88);
  const pr = press(t, k.press);
  const cur = pickedBefore(k);
  c.rows.forEach((r) => {
    const sel = r.app === k.app;
    r.el.classList.toggle('pv-hot', sel && hot > 0.5);
    r.el.classList.toggle('pv-cur', r.app === cur);
    r.el.style.transform = sel && pr > 0 ? `scale(${(1 - 0.035 * pr).toFixed(3)})` : '';
  });
}
// the model the composer shows just before a pick lands
function pickedBefore(k) {
  const i = PICKS.indexOf(k);
  return i > 0 ? PICKS[i - 1].app : START_APP;
}

function renderRouting(c, t) {
  let app = START_APP, swap = -1;
  PICKS.forEach((p) => { if (t >= p.press) { app = p.app; swap = p.press; } }); // the picks in the model picker (the user's)
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (!ch.hold && t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  if (app !== c.lastApp) {
    c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  // the model chip dips as the pick lands and comes back with a pop
  let dip = 0, pop = 0;
  if (swap >= 0) { dip = bump(seg(t, swap - 0.14, swap + 0.14)); pop = bump(seg(t, swap, swap + 0.4)); }
  c.plat.style.opacity = (1 - 0.85 * dip).toFixed(3);
  c.plat.style.transform = pop > 0 ? `scale(${(1 + 0.08 * pop).toFixed(4)})` : 'none';
}

function renderSwitch(s, t) {
  const k = s.c;
  s.sw.classList.toggle('qc-done', t >= k.done);
  if (k.doneLabel) { const l = t >= k.done ? k.doneLabel : k.label; if (s.lab.textContent !== l) s.lab.textContent = l; }
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
  // up out of it. While the thread is shorter than the feed it is CENTRED in the message area, so a short thread
  // never leaves a band of empty frame above or below it (the 4:5 lesson), until it overflows and scrolls.
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45)));
  }
  c.inner.style.transform = `translateY(${Math.min((viewH - y) / 2, viewH - 8 - y).toFixed(2)}px)`;
}

// the pointer on the picker: from the model chip down onto the picked row (the menu opens above the bottom-docked composer)
function pickPointer(c, t) {
  const k = PICKS.find((p) => t >= p.t0 - 0.35 && t <= p.t1 + 0.1);
  if (!k) return null;
  const pill = boxIn(c.plat, c.root);
  const rowCl = c.rows.find((r) => r.app === k.app);
  const rowB = rowCl ? boxIn(rowCl.el, c.root) : pill;
  // the tip lands on the chip's chevron and on the row's right side, so the cursor never sits over a label
  const pillPt = { x: pill.x + pill.w - 20, y: pill.cy };
  const row = { x: rowB.x + rowB.w - 34, y: rowB.cy };
  const toMenu = inOutCubic(seg(t, k.t0 + 0.40, k.t0 + 0.92));
  const x = lerp(pillPt.x, row.x, toMenu), y = lerp(pillPt.y, row.y, toMenu);
  const pr = Math.max(press(t, k.t0 - 0.06), press(t, k.press));
  const v = seg(t, k.t0 - 0.35, k.t0 - 0.12) * (1 - seg(t, k.t1 - 0.16, k.t1 + 0.1));
  return { x, y, p: pr, v };
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  renderPicker(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
  const pp = pickPointer(c, t);
  if (pp) placeCursor(c.pointer, pp.x, pp.y, pp.p, pp.v); else c.pointer.style.opacity = '0';
}
