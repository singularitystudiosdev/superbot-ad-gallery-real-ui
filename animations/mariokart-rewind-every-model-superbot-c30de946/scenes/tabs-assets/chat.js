// The one-ask chat. The ask is typed into the composer and sent, and the build follows one plan: Claude Opus 5.5
// answers first with the build plan (plan.js), assigning every part to the model best at it, and superbot then routes
// the thread through that plan in order. Every switch hands the previous model's output to the next, so each routing
// chip names why it switched ("Switching to Meshy to turn the art into karts") and, where the next model builds on
// earlier work, a handoff tray under the chip shows what it was handed (Gemini's portraits, Meshy's karts, ...).
// The beats: plan.js (build plan card), art.js (racer portraits), assets.js (kart meshes), scrape.js (item sprites and
// odds), code.js (the game, set 'kart'), music.js (soundtrack), git.js (repo card), play.js (the game).
// One routing ships (?v=3), and the page plays it with or without the query, so the ad is a single honest build of
// "make a Mario Kart game" (Turbo Kart Rally). The thread is bottom-anchored so every message rises out of the
// composer. renderChat(c, t) is a pure function of the scene's local time. ?v= on the beat imports busts GitHub Pages'
// 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import plan from './beats/plan.js?v=c30d2';
import assets from './beats/assets.js?v=c30d1';
import code from './beats/code.js?v=c30d1';
import git from './beats/git.js?v=c30d1';
import art from './beats/art.js?v=c30d1';
import music from './beats/music.js?v=c30d1';
import play from './beats/play.js?v=c30d1';
import scrape from './beats/scrape.js?v=c30d1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about: typed once, then superbot carries the rest of the build forward
export const ASK = 'make a Mario Kart game';

export const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  lyria: { name: 'Lyria 2', logo: brand('gemini-logo.svg'), sub: 'in superbot' }, // Google's music model, Gemini mark
  meshy: { name: 'Meshy', logo: brand('meshy-icon.png'), sub: 'in superbot' },    // text/image to 3D mesh model
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  github: { name: 'GitHub', logo: brand('github-logo.svg'), sub: 'connected' },
};
// GitHub is an app superbot connects, not a model: it is never counted as one
export const isModel = (app) => app !== 'github' && app !== 'codex';

// the routing chip superbot lands when it sends a request to an app, and what it reads once it has
const CHIP = {
  deepseek: 'Switching to DeepSeek V4 Flash',
  opus: 'Switching to Claude Opus 5.5',
  gemini: 'Switching to Gemini',
  lyria: 'Switching to Lyria 2',
  meshy: 'Switching to Meshy',
  github: 'Connecting to GitHub',
};
const DONE = (app) => (app === 'github' ? 'Connected GitHub' : `Switched to ${APPS[app].name}`);

// the build plan Opus writes: every part after the plan, in the order superbot routes it. The plan card (plan.js)
// and the pinned BUILD PLAN HUD (scenes/tabs.js) both read this list; row i is answered by the chat's step i + 1.
export const PLAN = [
  { app: 'gemini', task: 'Racer portraits, 8 racers', short: 'Racer portraits' },
  { app: 'meshy', task: 'Karts from those portraits', short: 'Karts' },
  { app: 'deepseek', task: 'Item sprites and item odds', short: 'Items and odds' },
  { app: 'opus', task: 'Track, drift physics, rivals, HUD', short: 'Track and physics' },
  { app: 'lyria', task: 'Race soundtrack', short: 'Soundtrack' },
  { app: 'github', task: 'Repo', short: 'Repo' },
  { app: 'opus', task: 'Launch', short: 'Launch' },
].map((p) => ({ ...p, name: APPS[p.app].name, model: isModel(p.app) }));

// a handoff tray: what the next model is handed, as real thumbnails (img/kart) or model tiles, plus its caption
const tray = (cap, imgs = [], tiles = []) => ({ cap, imgs, tiles });

// one request: the app that answers, its beat module, the beat's own options, and the routing chip's reason and tray
const step = (app, mod, opts = {}, via = {}) => ({
  app, mod, opts, chips: [{ app, label: CHIP[app], doneLabel: DONE(app), why: via.why || '', tray: via.tray || null }],
});
// only the first request is asked; the rest are superbot carrying the build forward on its own. pace sets where the
// cuts land: hold is the pause after a beat before the next switch (one number, or one per step), chip is how long a
// routing chip spins before it resolves
const variant = (steps, pace = {}) => steps.map((s, i) => ({
  ...s,
  ...(i === 0 ? { ask: ASK } : {}),
  hold: Array.isArray(pace.hold) ? pace.hold[i] || 0 : pace.hold || 0,
  chipDur: pace.chip || 0.28,
}));

// the routing this ad ships: one ask, Opus plans it, then each part goes to the model the plan assigned, in an order
// where every model builds on what came before it. '?v=3' is honoured and is also the default.
export const VARIANTS = {
  '3': variant([
    step('opus', plan, { rows: PLAN }, { why: 'to plan the build' }),
    step('gemini', art, {}, { why: 'for the racer art' }),
    step('meshy', assets, {}, {
      why: 'to turn the art into karts',
      tray: tray('4 portraits from Gemini', ['kart/art-1.jpg', 'kart/art-2.jpg', 'kart/art-3.jpg', 'kart/art-4.jpg']),
    }),
    step('deepseek', scrape, {}, { why: 'for item sprites and odds' }),
    step('opus', code, { set: 'kart' }, {
      why: 'to write the game',
      tray: tray('karts from Meshy, sprites and odds from DeepSeek', ['kart/mesh-1.jpg', 'kart/mesh-2.jpg', 'kart/find-1.png', 'kart/find-2.png']),
    }),
    step('lyria', music, {}, { why: 'to score the race', tray: tray('a capture of the build', ['kart/poster.jpg']) }),
    step('github', git, {}, { why: 'to ship the repo', tray: tray('work from 5 models', [], ['gemini', 'meshy', 'deepseek', 'opus', 'lyria']) }),
    step('opus', play, {}, { why: 'to launch it' }),
  ], { hold: 0, chip: 0.45 }),
};
export const VARIANT_KEY = (() => { const v = new URLSearchParams(location.search).get('v'); return VARIANTS[v] ? v : '3'; })();
export const VARIANT = VARIANTS[VARIANT_KEY];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply. A routing chip
// lands (sw) right after the previous beat ends, spins for chipDur while its handoff tray fills, and resolves (done),
// which is also when the composer's platform chip swaps to the app (swap = done); the app answers 0.02s later.
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      k.typeEnd = s + Math.min(0.85, 0.15 + a.ask.length * 0.013);
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.15;   // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.02;        // superbot carries on without being asked
    }
    let at = k.sw;
    k.chips = a.chips.map((ch) => { const done = at + Math.max(0.16, a.chipDur); const c = { ...ch, sw: at, swap: done, done }; at = c.done + 0.05; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.02;  // the app answers
    k.T = a.mod.times(k.reply, a.opts);
    s = k.T.end + a.hold;     // the variant's pause before the next switch
    return { k };
  });
}
export const BEATS = timeBeats(VARIANT);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.2;

// the plan beat, and each plan row's window: it is current from its step's routing chip until the next step's chip
// lands, and the last row (Launch) checks off when the finale's launch chip resolves
export const PLAN_K = (BEATS.find(({ k }) => k.mod === plan) || BEATS[0]).k;
const PLAN_AT = BEATS.findIndex(({ k }) => k === PLAN_K);
const LAST_T = BEATS[BEATS.length - 1].k;
const lastDone = (k) => (k.T.chipDone ? k.T.chipDone[k.T.chipDone.length - 1] : k.reply + 0.6);
export const PLAN_STEPS = PLAN.map((p, i) => {
  const b = BEATS[PLAN_AT + 1 + i], nx = BEATS[PLAN_AT + 2 + i];
  if (!b || b.k.app !== p.app) console.error(`chat.js: plan row ${i + 1} (${p.app}) does not match routed step`, b && b.k.app);
  const k = b ? b.k : LAST_T;
  return { ...p, sw: k.sw, done: nx ? nx.k.sw : lastDone(k) };
});
// the distinct models used so far: [when the count reaches n, n], one entry per first use (at the chip's swap)
export const MODEL_UP = (() => {
  const seen = new Set(), out = [];
  BEATS.forEach(({ k }) => k.chips.forEach((c) => {
    if (isModel(c.app) && !seen.has(c.app)) { seen.add(c.app); out.push({ t: c.swap, n: seen.size, app: c.app }); }
  }));
  return out;
})();

// the build clock the HUD (scenes/tabs.js) reads: it starts on the first send and stops when the finale's build chip
// resolves (play.js T.chipDone[0]), and that chip reads the same frozen time ("Built in 0:SS.cc"), so the HUD and
// the chat always agree
export const RACE_T0 = BEATS[0].k.send;
export const RACE_END = LAST_T.T.chipDone ? LAST_T.T.chipDone[0] : LAST_T.reply;
export const raceClock = (s) => {
  const cs = Math.floor(Math.max(0, s) * 100 + 1e-6);
  const m = Math.floor(cs / 6000), sec = Math.floor(cs / 100) % 60, c = cs % 100;
  return `${m}:${String(sec).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
};
// the clock at t: runs from the first send, frozen from the finish on
export const raceTime = (t) => raceClock(clamp(t, RACE_T0, RACE_END) - RACE_T0);

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}"><img src="${APPS[app].logo}" alt=""/></span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc, race: { t0: RACE_T0, end: RACE_END, clock: raceClock } };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  // the handoff tray under a chip: an elbow arrow, the thumbnails of what the next model is handed, and the caption
  const trayHtml = (tr) => (tr ? `<div class="qc-tray"><span class="qc-tray-a">↳</span><span class="qc-tray-th">${
    tr.imgs.map((f) => `<span class="qc-th"><img src="${img(f)}" alt=""/></span>`).join('')}${
    tr.tiles.map((a) => tile(a, 'qc-th qc-th-t')).join('')}</span><span class="qc-tray-c">${esc(tr.cap)}</span></div>` : '');
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      const why = c.why ? `<span class="qc-why">${esc(c.why)}</span>` : '';
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span>${why}<span class="qc-st"><i class="qc-spin"></i>${OK}</span></span>${trayHtml(c.tray)}</div></div>`);
      const tr = w.querySelector('.qc-tray');
      return {
        c, w, sw: w.querySelector('.qc-sw'), tile: w.querySelector('.qc-sw > .qc-tile'), lab: w.querySelector('.qc-swl'),
        spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok'),
        tray: tr, arrow: tr && tr.querySelector('.qc-tray-a'), thumbs: tr ? [...tr.querySelectorAll('.qc-th')] : [], cap: tr && tr.querySelector('.qc-tray-c'),
      };
    });
    // the reply is signed by the one app that answered it
    const sign = `${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}`;
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${sign}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom (a chip's message holds its tray)
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.codex.logo}" data-app="codex"/>`);
  pIcon.append(pImg);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.codex.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  const chat = {
    hub, pointer, feed, inner, beats, scroll,
    plat, pIcon, pImg, pLabel, swaps: BEATS.flatMap(({ k }) => k.chips.map((ch) => ch.swap)),
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'codex',
  };
  return chat;
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

function renderRouting(c, t) {
  let app = 'codex', swap = -1;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  if (app !== c.lastApp) {
    c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  // platform chip: the name dips out and back while the mark shrinks away and springs back as the new app. S is the
  // swap whose window [S - 0.12, S + 0.3] holds t (the swaps are seconds apart, so at most one does)
  const S = c.swaps.find((s) => t >= s - 0.12 && t <= s + 0.3);
  c.pLabel.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  if (S === undefined) c.pImg.style.transform = 'none';
  else {
    const ms = t < S ? 1 - 0.8 * outCubic(seg(t, S - 0.12, S)) : lerp(0.2, 1, outBack(seg(t, S, S + 0.24)));
    c.pImg.style.transform = `scale(${ms.toFixed(4)})`;
  }
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

// the routing chip: its tile springs in, "Switching to X" shimmers beside its reason while the spinner turns, the
// handoff tray fills (thumbs staggering in, then the caption), and at done the label settles and the spinner resolves
// to a check
function renderSwitch(s, t) {
  const k = s.c;
  const done = t >= k.done;
  s.sw.classList.toggle('qc-done', done);
  const lab = done ? k.doneLabel : k.label;
  if (s.lab.textContent !== lab) s.lab.textContent = lab;
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  s.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  s.spin.style.transform = `rotate(${(((t - k.sw) * 420) % 360).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.04, k.sw + 0.4));
  s.tile.style.transform = tp >= 1 ? 'none' : `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
  if (!s.tray) return;
  const ai = outCubic(seg(t, k.sw + 0.08, k.sw + 0.3));
  s.arrow.style.opacity = ai.toFixed(3);
  s.arrow.style.transform = ai >= 1 ? 'none' : `translateX(${((1 - ai) * -6).toFixed(2)}px)`;
  s.thumbs.forEach((th, i) => {
    const a = k.sw + 0.12 + i * 0.06;
    const p = seg(t, a, a + 0.28);
    th.style.opacity = outCubic(seg(t, a, a + 0.14)).toFixed(3);
    th.style.transform = p >= 1 ? 'none' : `translateY(${((1 - outCubic(p)) * 5).toFixed(2)}px) scale(${lerp(0.55, 1, outBack(p)).toFixed(4)})`;
  });
  const ca = k.sw + 0.12 + s.thumbs.length * 0.06;
  const cp = outCubic(seg(t, ca, ca + 0.3));
  s.cap.style.opacity = cp.toFixed(3);
  s.cap.style.transform = cp >= 1 ? 'none' : `translateX(${((1 - cp) * -6).toFixed(2)}px)`;
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
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.3)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw); renderSwitch(s, t); });
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
