// The one-ask chat. The ask is typed into the composer and sent, superbot routes it (its routing chips and the
// composer's platform chip follow the model), and the routed model answers with its own beat, each beat a different
// artifact: music.js (soundtrack card), assets.js (mesh list), art.js (image grid), code.js (editor),
// scrape.js (asset sweep), git.js (repo card), play.js (the game). One routing ships (?v=3), and the page plays it
// with or without the query, so the ad is a single honest build of "make a Mario Kart game" (Turbo Kart Rally).
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import assets from './beats/assets.js?v=7aec1';
import code from './beats/code.js?v=7aec1';
import git from './beats/git.js?v=7aec1';
import art from './beats/art.js?v=7aec1';
import music from './beats/music.js?v=7aec1';
import play from './beats/play.js?v=7aec2';
import scrape from './beats/scrape.js?v=7aec1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about: typed once, then superbot carries the rest of the build forward
export const ASK = 'make a Mario Kart game';

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  lyria: { name: 'Lyria 2', logo: brand('gemini-logo.svg'), sub: 'in superbot' }, // Google's music model, Gemini mark
  meshy: { name: 'Meshy', logo: brand('meshy-icon.png'), sub: 'in superbot' },    // text/image to 3D mesh model
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  github: { name: 'GitHub', logo: brand('github-logo.svg'), sub: 'connected' },
};

// the routing chip superbot lands when it sends a request to an app
const CHIP = {
  deepseek: 'Switching to DeepSeek V4 Flash',
  opus: 'Switching to Claude Opus 5.5',
  gemini: 'Switching to Gemini',
  lyria: 'Switching to Lyria 2',
  meshy: 'Switching to Meshy',
  github: 'Connecting to GitHub',
};

// one request: the app that answers, its beat module, the chip that routes to it, and the beat's own options
const step = (app, mod, opts = {}) => ({ app, mod, opts, chips: [[app, CHIP[app]]] });
// only the first request is asked; the rest are superbot carrying the build forward on its own. pace sets where the
// cuts land: hold is the pause after a beat before the next switch (one number, or one per step), chip is how long a
// routing chip spins before it resolves
const variant = (steps, pace = {}) => steps.map((s, i) => ({
  ...s,
  ...(i === 0 ? { ask: ASK } : {}),
  hold: Array.isArray(pace.hold) ? pace.hold[i] || 0 : pace.hold || 0,
  chipDur: pace.chip || 0.28,
}));

// the routing this ad ships: 7 requests, rapid. Opens on Lyria's race soundtrack, then Meshy builds the karts, Gemini
// paints the racer roster, Opus writes the kart physics, DeepSeek scrapes the trackside boards and item icons, GitHub
// takes the repo, and Opus launches Turbo Kart Rally on Palm Cove Circuit. '?v=3' is honoured and is also the
// default, so the page plays the same build either way.
export const VARIANTS = {
  '3': variant([
    step('lyria', music),
    step('meshy', assets),
    step('gemini', art),
    step('opus', code, { set: 'world' }),
    step('deepseek', scrape),
    step('github', git),
    step('opus', play),
  ], { hold: 0, chip: 0.7 }),
};
export const VARIANT_KEY = (() => { const v = new URLSearchParams(location.search).get('v'); return VARIANTS[v] ? v : '3'; })();
export const VARIANT = VARIANTS[VARIANT_KEY];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply.
// The pacing is tight on purpose: a routing chip lands SW_OFF after the previous beat ends, resolves in
// chipDur (0.16-0.28s), and the app answers 0.02s later, so the hand-off from one model to the next is
// ~0.2s of movement instead of a second of dead air. The shipped routing gives each chip 0.7s: its item box
// roulette rolls fast while the chip scrolls into view (0.3s), then ticks its last logos by and lands at done,
// which is also when the composer's platform chip swaps to the app (swap = done).
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
    // each chip lands, moves the platform chip to its app (swap) and resolves (done); the next lands just after
    let at = k.sw;
    k.chips = a.chips.map(([app, label]) => { const done = at + Math.max(0.16, a.chipDur); const c = { app, label, sw: at, swap: done, done }; at = c.done + 0.05; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.02;  // the app answers
    k.T = a.mod.times(k.reply, a.opts);
    s = k.T.end + a.hold;     // the variant's pause before the next switch
    return { k };
  });
}
export const BEATS = timeBeats(VARIANT);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.2;

// ---------- kart theming: every routing chip is the game's item box ----------
// While a chip is live (sw -> done) its item box runs a roulette: a vertical reel of the other models' logos rolls
// past, decelerating, and lands on the routed app exactly at done with a pop and a white flash. Each request is a
// lap (LAP n/7), so a resolved chip wears its lap tag in the game's HUD style. The box art is the clip's real empty
// item box (img/kart/find-3.png); nothing here is drawn by hand.
export const LAPS = BEATS.length;
const ROLL_POOL = ['codex', 'gemini', 'meshy', 'deepseek', 'opus', 'github'];
const ROLL_N = 9;            // logos that roll past before the target lands
const ROLL_FAST = 0.3;       // the reel spins at full speed while the chip scrolls into view (the scroll glide is 0.3s)
const ROLL_IT = 16;          // reel item pitch in design px (the box window is one item tall)
const ROLL_LABEL = 'Rolling the item box';
const LOOK = (app) => (app === 'lyria' ? 'gemini' : app); // Lyria wears the Gemini mark: never roll it next to itself
const doneLabel = (app) => (app === 'github' ? 'Connected GitHub' : `Switched to ${APPS[app].name}`);
const reelFor = (app, n) => {
  const pool = ROLL_POOL.filter((a) => LOOK(a) !== LOOK(app));
  return Array.from({ length: ROLL_N }, (_, j) => pool[(n * 2 + j) % pool.length]).concat(app);
};
// the reel's travel in items over the chip's life p in [0, 1]: constant full speed through the fast phase (share a of
// the life), then a linear slow-down to rest at p = 1, continuous in speed. Scaled so it covers exactly ROLL_N items,
// so the last three or so tick past while the chip is already sitting still in the thread.
const reelPos = (p, a) => {
  const k = 2 / (1 + a);
  if (p <= a) return ROLL_N * k * p;
  const q = (p - a) / (1 - a);
  return ROLL_N * k * (a + (1 - a) * (q - q * q / 2));
};
const reelSpeed = (p, a) => (p <= a ? 1 : Math.max(0, 1 - (p - a) / (1 - a))); // 0..1, for the motion blur
// the race the HUD (scenes/tabs.js) reads: one row per request, the lap starts when its routing chip lands. The race
// clock starts on the first send and stops when the finale's build chip resolves (play.js T.chipDone[0]), and that
// chip reads the same frozen time ("Built in 0:SS.cc"), so the HUD and the chat always agree.
export const RACE = BEATS.map(({ k }) => ({ app: k.app, name: APPS[k.app].name, sw: k.sw }));
export const RACE_T0 = BEATS[0].k.send;
const LAST_T = BEATS[BEATS.length - 1].k;
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
  const boxBg = `background-image:url('${img('kart/find-3.png')}')`;
  // the box's clip is inline as well as in chat.css: a page still holding a cached chat.css must never show the
  // reel as a loose column of logos
  const IB_CLIP = 'position:relative;display:block;flex:none;width:28px;height:28px;overflow:hidden;border-radius:27%';
  const WIN_CLIP = `position:absolute;left:6px;top:6px;width:${ROLL_IT}px;height:${ROLL_IT}px;overflow:hidden`;
  const build = ({ k }, bi) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      const reel = reelFor(c.app, bi).map((app) => tile(app, 'qc-ib-it')).join('');
      const lap = `<span class="qc-lap"><small>LAP</small><b>${bi + 1}</b><em>/${LAPS}</em></span>`;
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw"><span class="qc-ib" style="${boxBg};${IB_CLIP}"><span class="qc-ib-win" style="${WIN_CLIP}"><span class="qc-ib-reel">${reel}</span></span><i class="qc-ib-fl"></i></span><span class="qc-swl">${ROLL_LABEL}</span>${lap}</span></div></div>`);
      return {
        c, w, sw: w.querySelector('.qc-sw'), box: w.querySelector('.qc-ib'), reel: w.querySelector('.qc-ib-reel'),
        fl: w.querySelector('.qc-ib-fl'), lab: w.querySelector('.qc-swl'), lap: w.querySelector('.qc-lap'), doneLab: doneLabel(c.app),
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
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  // the item box that pops behind the mark while it swaps models (the clip's real box art)
  const pBox = el(`<i class="qc-pib" style="${boxBg};position:absolute;opacity:0"></i>`);
  const pImg = el(`<img alt="" src="${APPS.codex.logo}" data-app="codex"/>`);
  pIcon.append(pBox, pImg);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.codex.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  const chat = {
    hub, pointer, feed, inner, beats, scroll,
    plat, pIcon, pBox, pImg, pLabel, swaps: BEATS.flatMap(({ k }) => k.chips.map((ch) => ch.swap)),
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
  // platform chip: the name dips out and back while the mark swaps inside an item box that pops behind it. S is the
  // swap whose window [S - 0.12, S + 0.42] holds t (the swaps are seconds apart, so at most one does)
  const S = c.swaps.find((s) => t >= s - 0.12 && t <= s + 0.42);
  c.pLabel.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  if (S === undefined) {
    c.pBox.style.opacity = '0';
    c.pImg.style.transform = 'none';
  } else {
    // the old mark drops into the box, the box pops, the new mark springs out of it
    const bo = Math.min(seg(t, S - 0.12, S - 0.05), 1 - seg(t, S + 0.24, S + 0.42));
    const bs = lerp(0.4, 1, outBack(seg(t, S - 0.12, S + 0.04))) * (1 + 0.18 * bump(seg(t, S, S + 0.24)));
    c.pBox.style.opacity = bo.toFixed(3);
    c.pBox.style.transform = `translate(-50%,-50%) scale(${bs.toFixed(4)})`;
    const ms = t < S ? 1 - outCubic(seg(t, S - 0.12, S)) : outBack(seg(t, S, S + 0.24));
    c.pImg.style.transform = `scale(${ms.toFixed(4)})`;
  }
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

// the routing chip's item box: lands, rolls its roulette reel (decelerating, a pure function of t), lands on the
// routed app at done with a pop and a white flash, then the chip resolves and wears its LAP tag
function renderSwitch(s, t) {
  const k = s.c;
  const done = t >= k.done;
  s.sw.classList.toggle('qc-done', done);
  const lab = done ? s.doneLab : ROLL_LABEL;
  if (s.lab.textContent !== lab) s.lab.textContent = lab;
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  const p = seg(t, k.sw, k.done);
  const a = Math.min(0.6, ROLL_FAST / Math.max(1e-3, k.done - k.sw));
  s.reel.style.transform = `translateY(${(-reelPos(p, a) * ROLL_IT).toFixed(2)}px)`;
  // a touch of motion blur while the reel is fast, none once it has slowed to a readable tick
  const v = p > 0 && p < 1 ? reelSpeed(p, a) : 0;
  const blur = 0.85 * v * v;
  s.reel.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  s.fl.style.opacity = (done ? 0.95 * (1 - seg(t, k.done, k.done + 0.26)) : 0).toFixed(3);
  const tp = outBack(seg(t, k.sw + 0.02, k.sw + 0.4));
  const pop = 1 + 0.24 * bump(seg(t, k.done, k.done + 0.3));
  s.box.style.transform = `scale(${(lerp(0.5, 1, tp) * pop).toFixed(4)}) rotate(${((1 - tp) * -14).toFixed(2)}deg)`;
  const o = seg(t, k.done + 0.04, k.done + 0.34);
  s.lap.style.opacity = o.toFixed(3);
  s.lap.style.transform = `scale(${lerp(0.4, 1, outBack(o)).toFixed(4)})`;
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