// The one-ask chat. The ask is typed into the composer and sent, superbot routes it (its routing chips and the
// composer's platform chip follow the model), and the routed model answers with its own beat, each beat a different
// artifact: music.js (soundtrack card), assets.js (mesh list), art.js (image grid), code.js (editor),
// scrape.js (asset sweep), git.js (repo card), play.js (the render). One routing ships (?v=3), and the page plays it
// with or without the query, so the ad is a single honest build of "make a video on western civilization", told in
// the seven chapters of the PROMETHEUS clip's own HUD (CHAPTERS below).
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import assets from './beats/assets.js?v=0a738q';
import code from './beats/code.js?v=0a738q';
import git from './beats/git.js?v=0a738q';
import art from './beats/art.js?v=0a738q';
import music from './beats/music.js?v=0a738q';
import play from './beats/play.js?v=0a738q';
import scrape from './beats/scrape.js?v=0a738q';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about: typed once, then superbot carries the rest of the build forward
export const ASK = 'make a video on western civilization';

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
// routing chip's fire pass rolls before it lands
const variant = (steps, pace = {}) => steps.map((s, i) => ({
  ...s,
  ...(i === 0 ? { ask: ASK } : {}),
  hold: Array.isArray(pace.hold) ? pace.hold[i] || 0 : pace.hold || 0,
  chipDur: pace.chip || 0.28,
}));

// the routing this ad ships: 7 requests, rapid, one per chapter of the film (CHAPTERS): Lyria 2 scores it, Meshy
// forms the set pieces, Gemini paints the plates, Opus writes the source, DeepSeek sweeps the archive, GitHub takes
// the repo, and Opus renders the film. '?v=3' is honoured and is also the
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
// ~0.2s of movement instead of a second of dead air. The shipped routing gives each chip 0.7s: its fire pass reel
// rolls fast while the chip scrolls into view (0.3s), then ticks its last logos by and lands at done, which is also
// when the composer's platform chip swaps to the app (swap = done) and the HUD turns to the chapter.
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

// ---------- the fire pass: every routing chip hands Prometheus' fire to the next model ----------
// While a chip is live (sw -> done) its medallion runs a roulette: a vertical reel of the other models' logos rolls
// through the medallion's window, decelerating, and lands on the routed app exactly at done with a gold flare bloom
// and a two frame red/cyan chromatic split (the clip's cut signature). The medallion is the clip's: a thin gold
// double hairline ring on night holding the clip's own flame (img/prometheus/flame-1.png); nothing is drawn by hand.
// Each request is a chapter of the film, so a resolved chip wears its chapter tag in the clip's HUD lettering.
//
// CHAPTERS is that film's chapter table, one row per request in routing order: the chip's tag, the year the HUD's
// ANNO readout rolls to and the Kardashev reading its K counter ticks to when the chip lands (both read off the
// clip's own frames of that era), and the tempo on the HUD's sub-line (the clip's: 110 through III, 128 through VI,
// 140 from VII on).
export const CHAPTERS = [
  { roman: 'I', tag: 'SCORE', year: -508, k: 0.47, bpm: 110 },   // Lyria 2: democracy
  { roman: 'II', tag: 'FORM', year: 80, k: 0.48, bpm: 110 },     // Meshy: SPQR, the Colosseum
  { roman: 'III', tag: 'PLATES', year: 1163, k: 0.49, bpm: 110 }, // Gemini: the cathedrals
  { roman: 'IV', tag: 'CODE', year: 1492, k: 0.54, bpm: 128 },   // Claude Opus 5.5: the map
  { roman: 'V', tag: 'ARCHIVE', year: 1769, k: 0.58, bpm: 128 }, // DeepSeek V4 Flash: vapor, Watt
  { roman: 'VI', tag: 'REPO', year: 1969, k: 0.681, bpm: 128 },  // GitHub: the moon
  { roman: 'VII', tag: 'RENDER', year: 2026, k: 0.73, bpm: 140 }, // Claude Opus 5.5: now
];
// the clip's era lettering: "508 BC", "AD 1969"
export const eraOf = (year) => (year < 0 ? `${-year} BC` : `AD ${year}`);
const ROLL_POOL = ['codex', 'gemini', 'meshy', 'deepseek', 'opus', 'github'];
const ROLL_N = 9;            // logos that roll past before the target lands
const ROLL_FAST = 0.3;       // the reel spins at full speed while the chip scrolls into view (the scroll glide is 0.3s)
const ROLL_IT = 16;          // reel item pitch in design px (the medallion window is one item tall)
const ROLL_LABEL = 'Passing the fire';
const FLAME = img('prometheus/flame-1.png');
const FLARE = 0.36;          // the landing bloom's life
const SPLIT = 0.066;         // the chromatic split's life: two frames at 30 fps, never a third
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
// the run the HUD (scenes/tabs.js) reads: one row per request, carrying its chapter; the chip lands (sw) and its fire
// pass resolves (land), which is when the HUD turns to that chapter. The run clock starts on the first send and stops
// when the finale's render chip resolves (play.js T.chipDone[0]), and that chip reads the same frozen time
// ("Rendered in 0:SS.cc"), so the finish and the chat always agree.
export const PASSES = BEATS.map(({ k }, i) => ({ app: k.app, name: APPS[k.app].name, sw: k.sw, land: k.done, ...CHAPTERS[Math.min(i, CHAPTERS.length - 1)] }));
export const PASS_T0 = BEATS[0].k.send;
const LAST_T = BEATS[BEATS.length - 1].k;
export const PASS_END = LAST_T.T.chipDone ? LAST_T.T.chipDone[0] : LAST_T.reply;
export const passClock = (s) => {
  const cs = Math.floor(Math.max(0, s) * 100 + 1e-6);
  const m = Math.floor(cs / 6000), sec = Math.floor(cs / 100) % 60, c = cs % 100;
  return `${m}:${String(sec).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
};
// the clock at t: runs from the first send, frozen from the finish on
export const passTime = (t) => passClock(clamp(t, PASS_T0, PASS_END) - PASS_T0);

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
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc, pass: { t0: PASS_T0, end: PASS_END, clock: passClock } };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  // the medallion's clips are inline as well as in chat.css: a page still holding a cached chat.css must never show
  // the reel as a loose column of logos
  const FP_BOX = 'position:relative;display:block;flex:none;width:28px;height:28px';
  const MD_CLIP = 'position:relative;display:block;width:28px;height:28px;overflow:hidden;border-radius:50%';
  const WIN_CLIP = `position:absolute;left:6px;top:6px;width:${ROLL_IT}px;height:${ROLL_IT}px;overflow:hidden;border-radius:50%`;
  const build = ({ k }, bi) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      const reel = reelFor(c.app, bi).map((app) => tile(app, 'qc-md-it')).join('');
      const ch = PASSES[bi];
      const tag = `<span class="qc-ch">${ch.roman} · ${ch.tag}</span>`;
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw"><span class="qc-fp" style="${FP_BOX}"><span class="qc-md" style="${MD_CLIP}"><img class="qc-md-fl" src="${FLAME}" alt=""/><span class="qc-md-win" style="${WIN_CLIP}"><span class="qc-md-reel">${reel}</span></span><i class="qc-md-rg"></i></span><i class="qc-fp-bl"></i></span><span class="qc-swl">${ROLL_LABEL}</span>${tag}</span></div></div>`);
      return {
        c, w, seed: bi, sw: w.querySelector('.qc-sw'), fp: w.querySelector('.qc-fp'), md: w.querySelector('.qc-md'),
        flame: w.querySelector('.qc-md-fl'), reel: w.querySelector('.qc-md-reel'), bl: w.querySelector('.qc-fp-bl'),
        lab: w.querySelector('.qc-swl'), ch: w.querySelector('.qc-ch'), doneLab: doneLabel(c.app), split: false,
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
  // the flame medallion that pops behind the mark while it swaps models (the clip's ring and flame, as on the chips)
  const pBox = el(`<i class="qc-pmd" style="position:absolute;opacity:0"><img alt="" src="${FLAME}"/></i>`);
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
  // platform chip: the name dips out and back while the mark swaps inside a flame medallion that pops behind it. S is
  // the swap whose window [S - 0.12, S + 0.42] holds t (the swaps are seconds apart, so at most one does)
  const S = c.swaps.find((s) => t >= s - 0.12 && t <= s + 0.42);
  c.pLabel.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  if (S === undefined) {
    c.pBox.style.opacity = '0';
    c.pImg.style.transform = 'none';
  } else {
    // the old mark drops into the medallion, the medallion pops, the new mark springs out of its fire
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

// the routing chip's fire pass: the medallion lands, rolls its reel (decelerating, a pure function of t), lands on
// the routed app at done with a gold flare bloom and a two frame chromatic split, then the chip resolves and wears
// its chapter tag
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
  // the medallion springs in as the chip lands and kicks as the fire passes
  const tp = outBack(seg(t, k.sw + 0.02, k.sw + 0.4));
  const pop = 1 + 0.2 * bump(seg(t, k.done, k.done + 0.3));
  s.fp.style.transform = `scale(${(lerp(0.5, 1, tp) * pop).toFixed(4)})`;
  // the flame behind the window: banked low while the reel rolls, surging as the fire passes, then burning steady;
  // its flicker is two fixed sines of t, so a scrubbed frame is always the same frame
  const surge = done ? 1 - outCubic(seg(t, k.done, k.done + 0.5)) : 0;
  const heat = done ? 0.92 : lerp(0.42, 0.62, p);
  const flick = 1 + 0.06 * Math.sin(t * 19 + s.seed * 1.7) + 0.035 * Math.sin(t * 31.4 + s.seed * 0.9);
  s.flame.style.opacity = Math.min(1, heat + 0.3 * surge).toFixed(3);
  s.flame.style.transform = `scale(${(1 + 0.25 * surge).toFixed(4)},${(flick * (1 + 0.35 * surge)).toFixed(4)})`;
  // the gold flare bloom: a faint ignition as the reel settles, then it blooms out from the medallion and dies
  const bp = seg(t, k.done, k.done + FLARE);
  const bo = done ? (bp < 1 ? (1 - bp) ** 1.4 : 0) : 0.28 * seg(t, k.done - 0.09, k.done);
  s.bl.style.opacity = bo.toFixed(3);
  s.bl.style.transform = `scale(${(done ? lerp(0.45, 1.3, outCubic(bp)) : 0.4).toFixed(4)})`;
  // the clip's cut signature: red and cyan copies pulled apart for two frames as it lands, then gone
  const r = done && t < k.done + SPLIT ? 0.6 + 2.4 * (1 - (t - k.done) / SPLIT) : 0;
  if (r > 0) {
    const R = r.toFixed(2);
    s.md.style.filter = `drop-shadow(-${R}px 0 0 rgba(255, 38, 38, .85)) drop-shadow(${R}px 0 0 rgba(0, 226, 255, .8))`;
    s.lab.style.textShadow = `-${R}px 0 0 rgba(255, 38, 38, .8), ${R}px 0 0 rgba(0, 226, 255, .75)`;
    s.split = true;
  } else if (s.split) {
    s.md.style.filter = 'none';
    s.lab.style.textShadow = 'none';
    s.split = false;
  }
  const o = outCubic(seg(t, k.done + 0.04, k.done + 0.34));
  s.ch.style.opacity = o.toFixed(3);
  s.ch.style.transform = o >= 1 ? 'none' : `translateX(${((1 - o) * -6).toFixed(2)}px)`;
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