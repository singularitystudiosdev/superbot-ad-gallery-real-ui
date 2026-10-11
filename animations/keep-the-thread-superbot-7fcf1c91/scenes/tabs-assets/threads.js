// keep-the-thread: the ad's two acts, both pure functions of the scene's local time.
//  ACT 1 (lt < SWAP): the searchable chat list. Every agent's chats in one list (the app's own line:
//    "ChatGPT, Claude, Gemini, Grok, Cursor, Copilot, Devin and Hermes are all here"); the user types, the list
//    narrows to the one chat and the pointer opens it.
//  ACT 2 (lt >= SWAP): that chat, carried on. The thread's history is already there (it came from Claude Code),
//    the composer shows the context meter, and the user sends a follow-up which the same thread continues.
// No claim is made that a model remembers anything on its own: what travels is the thread, in superbot's list.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor, press, streamCount } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import continues from './beats/continues.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

const APPS = {
  gpt: { name: 'ChatGPT', logo: brand('openai-logo.svg') },
  claude: { name: 'Claude Code', logo: brand('claude-logo.svg') },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg') },
};

// the models the composer chip can name; the pick is the user's, made on the chip
const MODELS = { claude: { name: 'Claude Opus 5.5', app: 'claude', logo: brand('claude-logo.svg') }, gemini: { name: 'Gemini 3 Pro', app: 'gemini', logo: brand('gemini-logo.svg') } };

// the list: five chats from three different agents, one of them the chat this ad follows
const ROWS = [
  { app: 'gpt', title: 'landing page copy', when: '2h' },
  { app: 'gemini', title: 'kyoto trip, 5 days', when: '3h' },
  { app: 'claude', title: 'auth refactor', when: '2h', target: true },
  { app: 'gpt', title: 'invoice bug repro', when: '1d' },
  { app: 'gemini', title: 'release notes draft', when: '3d' },
];
const QUERY = 'auth';
const TYPE_CPS = 8;                 // chars/s the search box types at
export const T0 = 0.6;              // the list has settled; the search starts
export const TYPE_END = T0 + QUERY.length / TYPE_CPS;
export const TAP = TYPE_END + 0.85; // the pointer presses the row
export const SWAP = TAP + 0.55;     // the list gives way to the thread
export const ASK = 'ship it';       // the follow-up the user types in the thread
export const CTX = 'Context 31k of 1m';

// the thread act's clock, laid out from the moment the list gives way
const TH = (() => {
  const t = {};
  t.hist = 0.1;                        // the history (the ask and its answer) is already in the thread
  t.carry = 0.5;                       // "continuing your Claude Code chat" + the phone
  t.meter = 1.05;                      // the composer's context meter
  t.pick = 1.4;                        // the user taps the composer's model chip: the follow-up goes to Gemini
  t.pickPress = t.pick + 0.28;
  t.type = 1.85;                       // the follow-up starts typing
  t.typeEnd = t.type + ASK.length / 11;
  t.send = t.typeEnd + 0.2;
  t.chip = t.send + 0.32;              // superbot's routing chip
  t.swap = t.chip + 0.24;
  t.chipDone = t.chip + 0.72;
  t.reply = t.chipDone + 0.1;          // the model answers the follow-up
  t.end = t.reply + (continues.times(t.reply).end - t.reply) + 0.5;
  return t;
})();
export const THREAD_END = TH.end;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const PIN = '<svg class="kc-ph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.8V4h6v6.8l2 3.2H7l2-3.2Z"/></svg>';
const PHONE = '<svg class="kc-ph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}"><img src="${APPS[app].logo}" alt=""/></span>`;

const HISTORY = { ask: 'refactor the auth service, then run the tests', say: 'Done. 14 files refactored, 42 tests pass.' };

export function mountThreads(hub) {
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  // ---- ACT 1: the list panel, over the thread (the composer is hidden while it is open) ----
  const list = el(`<div class="kc-list">
    <div class="kc-head"><b>Chats</b><span class="kc-sub">from every agent you pay for: ChatGPT, Claude, Gemini, Grok, Cursor, Copilot, Devin, Hermes</span></div>
    <div class="kc-search"><svg class="kc-mag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg><span class="kc-q"></span><i class="kc-caret"></i></div>
    <div class="kc-rows"></div>
    <div class="kc-count"></div>
  </div>`);
  hub.querySelector('.main').appendChild(list);
  const rowsEl = list.querySelector('.kc-rows');
  const rowEls = ROWS.map((r) => {
    const n = el(`<div class="kc-row${r.target ? ' kc-target' : ''}">${tile(r.app)}<span class="kc-t">${esc(r.title)}</span><span class="kc-tag">${esc(APPS[r.app].name)}</span><em>${esc(r.when)}</em></div>`);
    rowsEl.appendChild(n);
    return { r, el: n };
  });

  // ---- ACT 2: the thread. The history is seeded at mount; the follow-up is driven by render ----
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const avatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;

  const histU = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(HISTORY.ask)}</div></div></div>`);
  const histR = add(`<div class="msg qc-m kc-hist"><span class="avatar sb"><img src="${sbSrc}" alt=""/></span><div class="m-main"><div class="qc-who">${tile('claude')}<b>${esc(APPS.claude.name)}</b><small>in superbot</small><em class="kc-when">2h ago</em></div><div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(HISTORY.say)}</span></div></div></div>`);
  const histSay = histR.querySelectorAll('.qc-say span');
  const carry = add(`<div class="msg kc-carry"><span class="kc-carry-t">${tile('claude')}<b>Continuing your Claude Code chat</b></span><span class="kc-dev">${PHONE}<span>on your phone too</span></span><span class="kc-dev">${PIN}<span>Pinned context</span></span></div>`);

  const userMsg = add(`<div class="msg qc-u kc-new"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(ASK)}</div></div></div>`);
  const chip = add(`<div class="msg qc-m kc-new">${avatar}<div class="m-main"><span class="qc-sw">${tile('gemini')}<span class="qc-swl">Continuing in Gemini 3 Pro</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
  const reply = add(`<div class="msg qc-m qc-r kc-new">${avatar}<div class="m-main"><div class="qc-who">${tile('gemini')}<b>${esc(MODELS.gemini.name)}</b><small>in superbot</small></div></div></div>`);
  const replyMain = reply.querySelector('.m-main');
  const inst = continues.build({ T: continues.times(TH.reply) }, { el, esc, esc2: esc, esc3: esc, tile, OK, history: HISTORY });
  inst.nodes.forEach((n) => replyMain.appendChild(n));
  const sw = chip.querySelector('.qc-sw'), spin = chip.querySelector('.qc-spin'), ok = chip.querySelector('.qc-st .qc-ok');

  // the composer: SUPER is off, the model chip names Claude, the context meter sits on the right of the row
  const sup = hub.querySelector('.rc-super');
  sup.innerHTML = 'SUPER<i class="ask-tg"><b></b>OFF</i>';
  const plat = hub.querySelector('.rc-plat');
  const pIcon = el(`<span class="qc-pi"><img alt="" src="${MODELS.claude.logo}" data-app="claude"/></span>`);
  const pImg = pIcon.firstElementChild;
  plat.querySelector('.rc-cat').replaceWith(pIcon);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${MODELS.claude.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);
  const row = hub.querySelector('.rc-row');
  const meter = el('<span class="kc-ctx"><i class="kc-ctx-b"></i></span>');
  row.insertBefore(meter, row.querySelector('.rc-computer'));
  const ctxLbl = el(`<span class="kc-ctx-t">${CTX}</span>`);
  meter.appendChild(ctxLbl);
  const ph = hub.querySelector('.rc-ph');
  const send = hub.querySelector('.rc-send');

  return {
    hub, root, pointer, list, rowEls, q: list.querySelector('.kc-q'), count: list.querySelector('.kc-count'),
    feed, inner, histU, histR, histSay, carry, userMsg, chip, reply, inst, sw, spin, ok, meter, ph, send, plat, pImg, pLabel,
    phText: ph.textContent, lastPh: null, lastQ: -1,
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}
const hide = (n) => { n.style.opacity = '0'; n.style.transform = 'none'; };

/* ---------- ACT 1: the list ---------- */
function renderList(c, lt) {
  const typedN = Math.round(QUERY.length * seg(lt, T0, TYPE_END));
  const q = QUERY.slice(0, typedN);
  if (typedN !== c.lastQ) {
    c.lastQ = typedN;
    c.q.textContent = q;
    c.list.classList.toggle('kc-typing', typedN < QUERY.length);
  }
  const found = typedN >= QUERY.length;
  c.count.textContent = found ? '1 chat' : `${ROWS.length} chats`;
  const hit = c.rowEls.find((x) => x.r.target);
  const narrow = inOutCubic(seg(lt, TYPE_END - 0.34, TYPE_END));
  c.rowEls.forEach((x) => {
    if (x.r.target) return;
    x.el.style.opacity = (1 - 0.94 * narrow).toFixed(3);
    x.el.style.maxHeight = `${(58 + 8) * (1 - narrow)}px`;
    x.el.style.marginBottom = `${8 * (1 - narrow)}px`;
  });
  hit.el.classList.toggle('kc-hit', found);
  const hl = seg(lt, TYPE_END, TYPE_END + 0.32);
  hit.el.style.boxShadow = found ? `inset 0 0 0 1.5px rgba(91,141,255,${(0.45 * hl).toFixed(3)}), 0 10px 30px rgba(0,0,0,.35)` : '';
  const v = 1 - outCubic(seg(lt, SWAP - 0.28, SWAP));
  c.list.style.opacity = v.toFixed(3);
  c.list.style.transform = `translateY(${((1 - outCubic(seg(lt, 0, 0.6))) * 12).toFixed(2)}px)`;
  // the pointer: onto the row's right side, then the press that opens it
  const b = boxIn(hit.el, c.root);
  const to = inOutCubic(seg(lt, TYPE_END + 0.15, TAP - 0.05));
  const x = lerp(b.x + b.w * 0.5, b.x + b.w - 30, to), y = lerp(b.cy + 120, b.cy, to);
  const pr = press(lt, TAP);
  const vis = seg(lt, TYPE_END + 0.05, TYPE_END + 0.25) * (1 - seg(lt, TAP + 0.06, TAP + 0.24));
  return { x, y, p: pr, v: vis };
}

/* ---------- ACT 2: the thread ---------- */
function renderThread(c, lt) {
  const t = Math.max(0, lt - SWAP);
  // history: already there, rising in once (it came from Claude Code)
  appear(c.histU, t, TH.hist, 14);
  histSaySet(c, t);
  appear(c.histR, t, TH.hist + 0.12, 14);
  appear(c.carry, t, TH.carry, 10);
  c.carry.style.transform = t < TH.carry ? c.carry.style.transform : 'none';
  // the context meter in the composer
  const m = outCubic(seg(t, TH.meter, TH.meter + 0.4));
  c.meter.style.opacity = m.toFixed(3);
  c.meter.style.transform = `translateY(${((1 - m) * 6).toFixed(2)}px)`;
  // the follow-up: typed, sent, routed, answered
  const typing = t >= TH.type && t < TH.send;
  const n = typing ? Math.round(ASK.length * seg(t, TH.type, TH.typeEnd)) : 0;
  const ph = typing ? `<span class="qc-typed">${esc(ASK.slice(0, n))}</span><i class="qc-caret"></i>` : esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', typing);
  c.send.style.transform = `scale(${(1 - 0.16 * bump(seg(t, TH.send - 0.12, TH.send + 0.2))).toFixed(4)})`;
  [c.userMsg, c.chip, c.reply].forEach((x) => { if (t < TH.send) hide(x); });
  appear(c.userMsg, t, TH.send, 12);
  appear(c.chip, t, TH.chip, 10);
  c.sw.classList.toggle('qc-done', t >= TH.chipDone);
  c.sw.style.setProperty('--sh', `${(100 - ((t - TH.chip) * 140) % 200).toFixed(1)}%`);
  c.spin.style.opacity = (1 - seg(t, TH.chipDone - 0.08, TH.chipDone + 0.06)).toFixed(3);
  c.spin.style.transform = `rotate(${((t - TH.chip) * 420).toFixed(1)}deg)`;
  const o = seg(t, TH.chipDone, TH.chipDone + 0.3);
  c.ok.style.opacity = o.toFixed(3);
  c.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, TH.chip + 0.05, TH.chip + 0.45));
  c.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
  // the user's model pick: the pointer presses the composer's chip, and the chip wears the model the follow-up
  // goes to (the pick is theirs; superbot does not switch a model on its own)
  const picked = t >= TH.pickPress;
  if (picked !== c.picked) {
    c.picked = picked;
    if (picked) { c.pImg.src = MODELS.gemini.logo; c.pImg.dataset.app = 'gemini'; c.pLabel.textContent = MODELS.gemini.name; }
  }
  // the chip dips under the press and pops as it wears the new model, so the pick reads as deliberate
  const dip = bump(seg(t, TH.pickPress - 0.16, TH.pickPress + 0.16));
  const pop = bump(seg(t, TH.pickPress, TH.pickPress + 0.4));
  c.plat.style.opacity = (1 - 0.7 * dip).toFixed(3);
  c.plat.style.transform = pop > 0 ? `scale(${(1 + 0.09 * pop).toFixed(4)})` : 'none';
  const bp = boxIn(c.plat, c.root), sb = boxIn(c.send, c.root);
  const to = inOutCubic(seg(t, TH.pick, TH.pick + 0.3));
  const pt = {
    x: lerp(sb.cx, bp.x + bp.w - 16, to), y: lerp(sb.cy, bp.cy, to),
    p: press(t, TH.pickPress - 0.06),
    v: seg(t, TH.pick - 0.1, TH.pick + 0.08) * (1 - seg(t, TH.pickPress + 0.06, TH.pickPress + 0.26)),
  };
  appear(c.reply, t, TH.reply, 10);
  c.inst.render(t);
  renderScroll(c, t);
  return pt;
}

function histSaySet(c, t) {
  const txt = HISTORY.say;
  const n = streamCount(txt, TH.hist + 0.18, 60, t);
  const shown = `${txt.slice(0, n)}|${txt.slice(n)}`;
  if (shown !== c.lastSay) { c.lastSay = shown; c.histSay[0].textContent = txt.slice(0, n); c.histSay[1].textContent = txt.slice(n); }
}

// bottom-anchored like a live chat: the newest landed line sits just above the composer
function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const marks = [[0, c.histU], [0.12, c.histR], [TH.carry, c.carry], [TH.send, c.userMsg], [TH.chip, c.chip], [TH.reply, c.reply], ...c.inst.marks.map(([a, n]) => [Math.max(0, a - SWAP + 0), n])]
    .filter(([a]) => Number.isFinite(a)).sort((x, y) => x[0] - y[0]);
  let y = 0;
  for (const [a, n] of marks) { if (t <= a) break; y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.45))); }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderThreads(c, lt) {
  if (!c) return;
  const listPhase = lt < SWAP;
  c.hub.classList.toggle('kc-listphase', listPhase);
  if (listPhase) {
    const pt = renderList(c, lt);
    if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
  } else {
    c.list.style.opacity = '0';
    c.list.style.display = 'none';
    const pt = renderThread(c, lt);
    if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
  }
}