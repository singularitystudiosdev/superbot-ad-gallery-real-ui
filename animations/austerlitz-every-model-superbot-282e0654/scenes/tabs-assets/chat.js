// The one-ask chat. The ask is typed into the composer and sent, superbot routes it (its switch chips and the
// composer's platform chip follow the model), and the routed model answers with its own beat, each beat a different
// department of the film: music.js (the score), assets.js (the soldiers), art.js (the painting), code.js (the
// engine), scrape.js (the hills), git.js (the dispatch), play.js (the film). One routing ships (?v=3), and the page
// plays it with or without the query, so the ad is a single honest build of the post's prompt, "Create a 4-5 minute
// cinematic video about the Battle of Austerlitz (1805), built entirely in code.", crewed through the film's own day
// (ROLES below): every switch is one of the film's location captions, at its hour, with the sun where it truly stood.
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import assets from './beats/assets.js?v=az13';
import code from './beats/code.js?v=az13';
import git from './beats/git.js?v=az13';
import art from './beats/art.js?v=az13';
import music from './beats/music.js?v=az13';
import play from './beats/play.js?v=az13';
import scrape from './beats/scrape.js?v=az13';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about: typed once, then superbot carries the rest of the build forward
// (the post's prompt verbatim, its en dash in "4-5" set as a hyphen: no en or em dash is shown anywhere in the ad)
export const ASK = 'Create a 4-5 minute cinematic video about the Battle of Austerlitz (1805), built entirely in code.';

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

// the film's crew, one department per request in routing order, walked through the film's own day from the night
// of 1 December to the ponds at sunset. role is the switch chip's caps line (the film's bar stamp grammar); caption
// is the film's location caption the beat plays under (web/film.js lowerThird(name, sub) verbatim, curly apostrophes
// and all), set bottom left in the film's own grammar; THE FILM gets none, the finale window carries the film's own.
// hour is the chip's plate (img/az/plate-hour-<n>.jpg, a crop of the post's clip at that caption) and sun its italic
// line: the caption's second line, then where the sun truly stood over Austerlitz (49.128 N, 16.763 E) on
// 2 December 1805 at local mean time (NOAA/Meeus solar position, apparent altitude, to the degree; the table and the
// basis for the two captions the film gives no clock hour are in the spec's 'Facts settled by C'). pos is where
// the band crops the 16:9 plate, and bloom the warm light the cut blooms from (a point in the plate, a film colour).
export const ROLES = [
  { role: 'THE SCORE', caption: { name: 'Moravia', sub: 'The night of 1 December 1805' },
    sun: 'The night of 1 December 1805, the sun below the horizon', pos: '50% 70%', bloom: ['50%', '72%', '--az-torch', '#cc8f5a'] },
  { role: 'THE SOLDIERS', caption: { name: 'Telnitz', sub: '7 a.m.' },
    sun: '7 a.m., the sun at 117°, 6° below the horizon', pos: '50% 65%', bloom: ['55%', '35%', '--az-fog', '#b6a196'] },
  { role: 'THE PAINTING', caption: { name: 'The Zuran hill', sub: 'Napoleon’s command post' },
    sun: 'Napoleon’s command post, the sun at 131°, 5° up', pos: '50% 20%', bloom: ['77%', '19%', '--az-sun-zuran', '#d1c1af'] },
  { role: 'THE ENGINE', caption: { name: 'The sun of Austerlitz', sub: 'about 9 a.m.' },
    sun: 'about 9 a.m., the sun at 141°, 10° up', pos: '50% 45%', bloom: ['52%', '35%', '--az-sun', '#e1ccae'] },
  { role: 'THE HILLS', caption: { name: 'The Pratzen', sub: 'late morning' },
    sun: 'late morning, the sun at 168°, 18° up', pos: '50% 50%', bloom: ['60%', '15%', '--az-sun', '#e1ccae'] },
  { role: 'THE DISPATCH', caption: { name: 'The Russian Imperial Guard', sub: 'about 1 p.m.' },
    sun: 'about 1 p.m., the sun at 197°, 17° up', pos: '50% 60%', bloom: ['60%', '25%', '--az-sun', '#e1ccae'] },
  { role: 'THE FILM', caption: null,
    sun: 'about 4 p.m., the sun at 235°, on the horizon', pos: '50% 45%', bloom: ['34%', '38%', '--az-sunset', '#eab488'] },
];

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
// chip cuts to the app 0.09s later (swap: the sunlight bloom), the chip resolves at chipDur (done) and the app
// answers 0.02s after that, so the hand-off from one department to the next is ~0.2s of movement instead of a second
// of dead air. The chip's caption keeps drawing on (its hairline and its lines) under the reply.
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

// the cuts: every switch chip's swap, when the frame takes the sunlight bloom and the grain (scenes/tabs.js)
export const CUTS = BEATS.flatMap(({ k }) => k.chips.map((c) => c.swap));
// the colour each cut blooms the frame with, the same film colour as its plate's (ROLES bloom): [css var, fallback]
export const CUT_LIGHT = BEATS.flatMap(({ k }) => k.chips.map(() => k.role.bloom.slice(2)));
// the location captions (scenes/tabs.js sets them bottom left in frame px, the film's hairline, name and italic
// line): each rises with its beat's reply and is gone by the beat's end, the next switch
export const CAPTIONS = BEATS.filter(({ k }) => k.role.caption).map(({ k }) => ({ ...k.role.caption, t0: k.reply, t1: k.T.end }));

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

// ---------- the switch chip: the film's location caption, with its hour ----------
// Each switch is one of the film's location captions (web/film.js lowerThird, img/az/theme.css .az-caption) set
// small in the thread: a hairline that draws on above the name as it fades up, the model's name in Cormorant SC 500
// tracked .1765em, the department's caps line under it in the film's bar stamp grammar, and the caption's EB Garamond
// italic second line with the sun where it truly stood at that hour. Beside it a small letterboxed plate that reads as
// the same film: the hour's plate (img/az/plate-hour-<n>.jpg, a crop of the post's clip) in a 2.341:1 picture band
// between the film's black bars (12% of a 16:9 frame each), under a faint grain. The cut (swap) blooms the plate from
// the warm light already in it (the torches, the fog, the sun) and bursts the grain.
const PLATE = (i) => img(`az/plate-hour-${i + 1}.jpg`);
const HAIR0 = 60 / 34; // the film's hairline starts 60px wide under a 34px name and grows to the name's width
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
      // the hour's plate, cropped to the band where its light sits, and the bloom's point and film colour
      const R = k.role, [bx, by, bv, bc] = R.bloom;
      const w0 = add(`<div class="msg qc-m qc-ltm">${sbAvatar}<div class="m-main"><span class="qc-lt">`
        + `<span class="az-plate"><span class="az-pic"><img class="az-pic-im" alt="" src="${PLATE(bi)}" style="object-position:${R.pos}"/>`
        + `<i class="az-pic-gr" style="background-image:${GRAIN.replace(/"/g, "'")}"></i>`
        + `<i class="az-pic-bl" style="--az-bx:${bx};--az-by:${by};--az-bc:var(${bv}, ${bc})"></i></span></span>`
        + `<span class="qc-ltx"><span class="az-nmw"><i class="az-hair"></i><b class="qc-nm">${esc(APPS[c.app].name)}</b></span>`
        + `<span class="qc-role">${esc(c.label)}</span><em class="qc-sub">${esc(R.sun)}</em></span>`
        + `</span></div></div>`);
      const q = (s) => w0.querySelector(s);
      return {
        c, w: w0, seed: bi, plate: q('.az-plate'), im: q('.az-pic-im'), gr: q('.az-pic-gr'), bl: q('.az-pic-bl'),
        hair: q('.az-hair'), nm: q('.qc-nm'), role: q('.qc-role'), sub: q('.qc-sub'), last: {},
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
  // the sunlight bloom that pops behind the mark on the cut (a CSS radial glow, tabs chat.css .qc-pmd)
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
  // platform chip: the name dips out and back while the mark swaps inside a sunlight bloom that pops behind it. S is
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

// the switch chip: the plate cuts up out of black and settles, the cut blooms it with its own warm light under a
// burst of grain, and the caption comes up in the film's order: the hairline draws on, the name fades up, the
// department tracks in, the italic line follows
function renderSwitch(s, t) {
  const k = s.c;
  // the plate: rises from 0.9 as the chip lands and breathes out a touch on the cut; the picture comes up out of the
  // bars' black in 0.2s, like the film's own cuts from black
  const pin = outCubic(seg(t, k.sw, k.sw + 0.3));
  const kick = 1 + 0.035 * bump(seg(t, k.swap, k.swap + 0.26));
  put(s, s.plate, 'transform', `scale(${(lerp(0.9, 1, pin) * kick).toFixed(4)})`);
  put(s, s.im, 'opacity', outCubic(seg(t, k.sw, k.sw + 0.2)).toFixed(3));
  // the cut: the warm light swells out of its point in the plate over a tenth of a second and ebbs over half a
  // second, and the grain bursts with it before settling to the plate's faint film grain
  const fp = seg(t, k.swap - 0.02, k.swap + 0.6);
  const bloom = t < k.swap - 0.02 ? 0 : fp < 0.16 ? outCubic(fp / 0.16) : (1 - (fp - 0.16) / 0.84) ** 2;
  put(s, s.bl, 'opacity', clamp(bloom).toFixed(3));
  const burst = t < k.swap ? 0 : 1 - outCubic(seg(t, k.swap, k.swap + 0.6));
  put(s, s.gr, 'opacity', (0.2 + 0.42 * burst).toFixed(3));
  put(s, s.gr, 'backgroundPosition', grainAt(t, s.seed));
  // the caption, all of it in by sw + 0.48 (at 16:9 the beat's content starts pushing the chip up the thread from
  // ~sw + 0.75): the film's hairline fades up with the name and draws from 60/34 of the name size to its full width
  const np = outCubic(seg(t, k.sw + 0.04, k.sw + 0.36));
  put(s, s.hair, 'opacity', np.toFixed(3));
  put(s, s.hair, 'width', np >= 1 ? '100%' : `min(100%, calc(${HAIR0.toFixed(4)}em + ${(np * 100).toFixed(2)}%))`);
  put(s, s.nm, 'opacity', np.toFixed(3));
  put(s, s.nm, 'transform', np >= 1 ? 'none' : `translateY(${((1 - np) * 4).toFixed(2)}px)`);
  const cp = outCubic(seg(t, k.sw + 0.12, k.sw + 0.44));
  put(s, s.role, 'opacity', cp.toFixed(3));
  put(s, s.role, 'letterSpacing', `${lerp(0.34, 0.154, cp).toFixed(4)}em`);
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
