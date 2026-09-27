// The one-ask chat. The ask is typed into the composer and sent, superbot routes it (its switch chips and the
// composer's platform chip follow the model), and the routed model answers with its own beat, each beat a different
// department of the film: music.js (the score), assets.js (the props), art.js (the location plates), code.js (the
// edit), scrape.js (the archive), git.js (the repository), play.js (the render). One routing ships (?v=3), and the
// page plays it with or without the query, so the ad is a single honest build of "make a high-end netflix style
// documentary about superintelligence for normies", crewed like THE LAST INVENTION itself (ROLES below).
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import assets from './beats/assets.js?v=li13a';
import code from './beats/code.js?v=li13a';
import git from './beats/git.js?v=li13a';
import art from './beats/art.js?v=li13a';
import music from './beats/music.js?v=li13a';
import play from './beats/play.js?v=li13a';
import scrape from './beats/scrape.js?v=li13a';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about: typed once, then superbot carries the rest of the build forward
export const ASK = 'make a high-end netflix style documentary about superintelligence for normies';

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  lyria: { name: 'Lyria 2', logo: brand('gemini-logo.svg'), sub: 'in superbot' }, // Google's music model, Gemini mark
  meshy: { name: 'Meshy', logo: brand('meshy-icon.png'), sub: 'in superbot' },    // text/image to 3D mesh model
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  github: { name: 'GitHub', logo: brand('github-logo.svg'), sub: 'connected' },
};

// one request: the app that answers, its beat module, the department it crews on the film, and the beat's options
const step = (app, mod, role, opts = {}) => ({ app, mod, role, opts, chips: [[app, role.role]] });
// only the first request is asked; the rest are superbot carrying the build forward on its own. pace sets where the
// cuts land: hold is the pause after a beat before the next switch (one number, or one per step), chip is how long a
// switch chip takes from landing to resolved
const variant = (steps, pace = {}) => steps.map((s, i) => ({
  ...s,
  ...(i === 0 ? { ask: ASK } : {}),
  hold: Array.isArray(pace.hold) ? pace.hold[i] || 0 : pace.hold || 0,
  chipDur: pace.chip || 0.28,
}));

// the film's crew, one department per request in routing order. role is the switch chip's lower third caps line;
// caption is the location caption the beat plays under (bottom left, the film's "A DATA CENTRE, SOMEWHERE COLD."
// grammar); the director gets none, the finale is the film itself. The chip's italic sub line is I. J. Good's
// argument, told one domino at a time.
export const ROLES = [
  { role: 'Composer', caption: 'A SCORING STAGE, SOMEWHERE WARM.' },
  { role: 'Props', caption: 'A PROP WORKSHOP, SOMEWHERE DUSTY.' },
  { role: 'Locations', caption: 'THE EMBANKMENT, SOMEWHERE AFTER DARK.' },
  { role: 'Editor', caption: 'AN EDIT SUITE, SOMEWHERE WINDOWLESS.' },
  { role: 'Researcher', caption: 'AN ARCHIVE, SOMEWHERE NEAR BLETCHLEY.' },
  { role: 'Archivist', caption: 'A REPOSITORY, SOMEWHERE PUBLIC.' },
  { role: 'Director', caption: '' },
];
const SUB = (i) => (i === 0 ? 'so it builds a slightly better one' : 'which builds a better one');

// the routing this ad ships: 7 requests, rapid, one department of the film each: Lyria 2 scores it, Meshy makes the
// props, Gemini scouts the locations, Opus cuts it, DeepSeek digs the archive, GitHub keeps the repo, and Opus
// directs the render. '?v=3' is honoured and is also the default, so the page plays the same build either way. The
// pace is fantasy90s-every-model-superbot's v3 cadence (hold 0, chip 0.18), the gallery's reference for this family.
export const VARIANTS = {
  '3': variant([
    step('lyria', music, ROLES[0]),
    step('meshy', assets, ROLES[1]),
    step('gemini', art, ROLES[2]),
    step('opus', code, ROLES[3], { set: 'world' }),
    step('deepseek', scrape, ROLES[4]),
    step('github', git, ROLES[5]),
    step('opus', play, ROLES[6]),
  ], { hold: 0, chip: 0.18 }),
};
export const VARIANT_KEY = (() => { const v = new URLSearchParams(location.search).get('v'); return VARIANTS[v] ? v : '3'; })();
export const VARIANT = VARIANTS[VARIANT_KEY];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply.
// The pacing is tight on purpose: a switch chip lands 0.02s after the previous beat ends, the composer's platform
// chip cuts to the app 0.09s later (swap: the tungsten flash), the chip resolves at chipDur (done) and the app
// answers 0.02s after that, so the hand-off from one department to the next is ~0.2s of movement instead of a second
// of dead air. The chip's lower third keeps drawing in (and its domino keeps falling) under the reply.
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      k.typeEnd = s + Math.min(0.85, 0.15 + a.ask.length * 0.013);
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.15;   // superbot's first switch chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.02;        // superbot carries on without being asked
    }
    // each chip lands (sw), cuts the platform chip to its app (swap) and resolves (done); the next lands just after
    let at = k.sw;
    k.chips = a.chips.map(([app, label]) => { const c = { app, label, sw: at, swap: at + 0.09, done: at + Math.max(0.16, a.chipDur) }; at = c.done + 0.05; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.02;  // the app answers
    k.T = a.mod.times(k.reply, a.opts);
    s = k.T.end + a.hold;     // the variant's pause before the next switch
    return { k };
  });
}
export const BEATS = timeBeats(VARIANT);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.2;

// the cuts: every switch chip's swap, when the frame takes the tungsten flash and the grain (scenes/tabs.js)
export const CUTS = BEATS.flatMap(({ k }) => k.chips.map((c) => c.swap));
// the location captions (scenes/tabs.js lays them bottom left in frame px): each rises with its beat's reply and is
// gone by the beat's end, the next switch
export const CAPTIONS = BEATS.map(({ k }) => ({ text: k.role.caption, t0: k.reply, t1: k.T.end })).filter((c) => c.text);

// the run clock the finale's render chip reads (play.js, "Rendered in 0:SS.cc"): it runs from the first send and
// stops when that chip resolves (play.js T.chipDone[0])
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

// ---------- the switch chip: the film's lower third, with its domino ----------
// Each switch is one domino in I. J. Good's chain: the film's own domino shot (img/li/domino-sprite.png, 24 cells of
// 360x270 at 24 fps, cut from the post clip) set in a small 4:3 plate that steps up in size with every department
// (DOM_GROW per step, 1 to 7), and tips over as the chip lands. Beside it the film's lower third as it letters I. J.
// "Jack" Good: a short brass rule drawing in from the left, the model's name in Instrument Serif, the department in
// Inter caps tracked .25em, and under them an italic line of the argument. The cut (swap) hits the plate with a
// tungsten flash and a burst of grain.
const SPRITE = img('li/domino-sprite.png');
const SPRITE_N = 24, SPRITE_FPS = 30; // the film's 24 fps shot, run a quarter fast so it falls while the chip is in view
const DOM_W = 46, DOM_H = 34.5; // step 1's plate in design px (the sprite's 4:3)
const DOM_GROW = 1.13;         // each domino 13% bigger than the last: step 7 is 2.08x step 1
// film grain as CSS: a procedural noise tile (feTurbulence, no drawn shapes) shifted to a new offset every 24th of a
// second, so a scrubbed frame is always the same frame
export const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.6 -.45"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>')}")`;
export const grainAt = (t, seed = 0) => {
  const f = Math.floor(Math.max(0, t) * 24) + seed * 7;
  return `${(f * 73) % 160}px ${(f * 151 + 37) % 160}px`;
};

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
  const build = ({ k }, bi) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      // the plate's size is inline as well as its sprite, so the step reads right even from a cached chat.css
      const g = DOM_GROW ** bi, w = +(DOM_W * g).toFixed(2), h = +(DOM_H * g).toFixed(2);
      const w0 = add(`<div class="msg qc-m qc-ltm">${sbAvatar}<div class="m-main"><span class="qc-lt">`
        + `<span class="qc-dom" style="width:${w}px;height:${h}px"><i class="qc-dom-sp" style="background-image:url('${SPRITE}')"></i><i class="qc-dom-gr" style="background-image:${GRAIN.replace(/"/g, "'")}"></i><i class="qc-dom-fl"></i></span>`
        + `<span class="qc-ltx"><i class="qc-rule"></i><b class="qc-nm">${esc(APPS[c.app].name)}</b><span class="qc-role">${esc(c.label)}</span><em class="qc-sub">${esc(SUB(bi))}</em></span>`
        + `</span></div></div>`);
      const q = (s) => w0.querySelector(s);
      return {
        c, w: w0, seed: bi, dom: q('.qc-dom'), sp: q('.qc-dom-sp'), gr: q('.qc-dom-gr'), fl: q('.qc-dom-fl'),
        rule: q('.qc-rule'), nm: q('.qc-nm'), role: q('.qc-role'), sub: q('.qc-sub'), last: {},
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
  // the tungsten bloom that pops behind the mark on the cut (a CSS radial glow, tabs chat.css .qc-pmd)
  const pBox = el('<i class="qc-pmd" style="position:absolute;opacity:0"></i>');
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
  // platform chip: the name dips out and back while the mark swaps inside a tungsten bloom that pops behind it. S is
  // the swap whose window [S - 0.12, S + 0.42] holds t (the swaps are seconds apart, so at most one does)
  const S = c.swaps.find((s) => t >= s - 0.12 && t <= s + 0.42);
  c.pLabel.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  if (S === undefined) {
    c.pBox.style.opacity = '0';
    c.pImg.style.transform = 'none';
  } else {
    // the old mark drops into the bloom, the bloom pops, the new mark springs out of it
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

// write a style value only when it changed (the thread holds seven of these, every frame)
const put = (s, n, prop, v) => { const key = prop + (n.className || ''); if (s.last[key] !== v) { n.style[prop] = v; s.last[key] = v; } };

// the switch chip: the plate pops in and its domino tips (the sprite runs once from the landing at 24 fps and holds
// its last frame), the cut flashes it tungsten under a burst of grain, and the lower third letters in the film's
// order: the rule draws from the left, the name rises, the department tracks in, the italic line follows
function renderSwitch(s, t) {
  const k = s.c;
  const lt = t - k.sw;
  // the plate: springs up from 0.86 as the chip lands and gives a small kick on the cut
  const pin = outBack(seg(t, k.sw, k.sw + 0.34));
  const kick = 1 + 0.06 * bump(seg(t, k.swap, k.swap + 0.22));
  put(s, s.dom, 'transform', `scale(${(lerp(0.86, 1, pin) * kick).toFixed(4)})`);
  // the domino tips: one pass of the sprite, frame 0 before the landing, the last frame after
  const f = Math.min(SPRITE_N - 1, Math.max(0, Math.floor(lt * SPRITE_FPS)));
  put(s, s.sp, 'backgroundPosition', `${((f / (SPRITE_N - 1)) * 100).toFixed(4)}% 0`);
  // the cut: a tungsten flash that blooms and dies over half a second, and the grain bursting with it before settling to the
  // plate's own faint film grain
  const fp = seg(t, k.swap - 0.02, k.swap + 0.55);
  const flash = t < k.swap - 0.02 ? 0 : fp < 0.14 ? fp / 0.14 : (1 - (fp - 0.14) / 0.86) ** 2;
  put(s, s.fl, 'opacity', clamp(flash).toFixed(3));
  const burst = t < k.swap ? 0 : 1 - outCubic(seg(t, k.swap, k.swap + 0.6));
  put(s, s.gr, 'opacity', (0.32 + 0.5 * burst).toFixed(3));
  put(s, s.gr, 'backgroundPosition', grainAt(t, s.seed));
  // the lower third: the rule draws in, the name rises, the department tracks in from wide, the italic line follows,
  // all of it in by sw + 0.48 (at 16:9 the beat's content starts pushing the chip up the thread from ~sw + 0.75)
  const rp = outCubic(seg(t, k.sw + 0.04, k.sw + 0.34));
  put(s, s.rule, 'transform', `scaleX(${rp.toFixed(4)})`);
  const np = outCubic(seg(t, k.sw + 0.06, k.sw + 0.34));
  put(s, s.nm, 'opacity', np.toFixed(3));
  put(s, s.nm, 'transform', np >= 1 ? 'none' : `translateY(${((1 - np) * 5).toFixed(2)}px)`);
  const cp = outCubic(seg(t, k.sw + 0.12, k.sw + 0.44));
  put(s, s.role, 'opacity', cp.toFixed(3));
  put(s, s.role, 'letterSpacing', `${lerp(0.42, 0.25, cp).toFixed(4)}em`);
  const sp = outCubic(seg(t, k.sw + 0.18, k.sw + 0.48));
  put(s, s.sub, 'opacity', sp.toFixed(3));
  put(s, s.sub, 'transform', sp >= 1 ? 'none' : `translateY(${((1 - sp) * 4).toFixed(2)}px)`);
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
