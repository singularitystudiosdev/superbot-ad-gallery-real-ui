// The one-ask chat, retargeted to the motion reel. The ask (the post's own prompt, verbatim) is typed into the
// composer and sent, superbot routes it, and the routed model answers with its own beat: music.js (waveforms),
// assets.js (asset list), art.js (image grid), code.js (editor), scrape.js (asset sweep), git.js (repo card),
// play.js (the reel). Every routing chip carries the clip's easing tag for that chapter (a tiny curve glyph like the
// clip's 02 EASING thumbnails, plus a mono label such as "01 linear"), and the composer's platform chip swaps from
// one model to the next WITH that easing. The thread is bottom-anchored so every message rises out of the composer.
// renderChat(c, t) is a pure function of the scene's local time. ?v= on the beat imports busts GitHub Pages'
// 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import assets from './beats/assets.js?v=2';
import code from './beats/code.js?v=3';
import git from './beats/git.js?v=3';
import art from './beats/art.js?v=3';
import music from './beats/music.js?v=4';
import play from './beats/play.js?v=3';
import scrape from './beats/scrape.js?v=2';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about, the post's prompt verbatim (img/mr/CREDITS.txt): typed once, then superbot
// carries the rest of the reel forward
export const ASK = "make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.";
// how long the composer takes to type it (the spec caps it at 1.6s; 150 characters want most of that to read)
const TYPE_MAX = 1.45, TYPE_RATE = 0.0088;

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' },
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  lyria: { name: 'Lyria 2', logo: brand('gemini-logo.svg'), sub: 'in superbot' }, // Google's music model, Gemini mark
  meshy: { name: 'Meshy', logo: brand('meshy-icon.png'), sub: 'in superbot' },    // text/image to 3D mesh model
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  github: { name: 'GitHub', logo: brand('github-logo.svg'), sub: 'connected' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the routing chip superbot lands when it sends a request to an app
const CHIP = {
  deepseek: 'Switching to DeepSeek V4 Flash',
  opus: 'Switching to Claude Opus 5.5',
  codex: 'Switching to GPT-5 Codex',
  gemini: 'Switching to Gemini',
  lyria: 'Switching to Lyria 2',
  meshy: 'Switching to Meshy',
  github: 'Connecting to GitHub',
  superbot: 'Switched to Superbot',
};

// the clip's easings (img/mr/ch02.jpg, "Six ways to get from A to B."), exact, p in [0,1] -> progress. spring is the
// finale's (07 FIN, Max effort): a damped spring that overshoots once and settles, forced to exactly 1 at p = 1.
const EASE = {
  linear: (p) => p,
  'ease-in-out': (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),       // easeInOutCubic
  'expo-out': (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),                               // expoOut
  'back-out': (p) => { const c1 = 1.70158, c3 = c1 + 1, q = p - 1; return 1 + c3 * q * q * q + c1 * q * q; }, // backOut(1.70158)
  elastic: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1), // elasticOut
  bounce: (p) => {                                                                           // bounceOut
    const n1 = 7.5625, d1 = 2.75;
    if (p < 1 / d1) return n1 * p * p;
    if (p < 2 / d1) { p -= 1.5 / d1; return n1 * p * p + 0.75; }
    if (p < 2.5 / d1) { p -= 2.25 / d1; return n1 * p * p + 0.9375; }
    p -= 2.625 / d1; return n1 * p * p + 0.984375;
  },
  spring: (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.exp(-6 * p) * (Math.cos(2.4 * Math.PI * p) + (6 / (2.4 * Math.PI)) * Math.sin(2.4 * Math.PI * p))),
};
// each switch's tag: the clip's chapter number and easing (chat rule r1), and the ball colour the clip gives that row
// (ink, blue, red repeating, img/mr/ch02.jpg)
const BALL = ['var(--mr-ink, #0F0F11)', 'var(--mr-blue, #302FF5)', 'var(--mr-red, #F04B3A)'];
const tag = (n, ease) => ({ n: String(n).padStart(2, '0'), ease, ball: BALL[(n - 1) % 3] });
// the glyph: the clip's easing thumbnail at chip size. A square box drawn as two thin axis lines (left, bottom), the
// curve sampled from the exact easing at 1.5px, and the ball resting where the curve ends.
const GLY = { x0: 2, y0: 14, w: 12, h: 9 }; // the curve's box inside a 16x16 viewBox, headroom above for overshoot
function easeGlyph(ease, ball) {
  const f = EASE[ease], N = 40, { x0, y0, w, h } = GLY;
  let d = '';
  for (let i = 0; i <= N; i++) { const p = i / N; d += `${i ? 'L' : 'M'}${(x0 + p * w).toFixed(2)} ${(y0 - f(p) * h).toFixed(2)}`; }
  return `<svg class="qc-ezg" viewBox="0 0 16 16" aria-hidden="true"><path class="qc-ezax" d="M${x0} 1V${y0}H15"/>` +
    `<path class="qc-ezc" d="${d}"/><circle class="qc-ezb" cx="${x0 + w}" cy="${y0 - h}" r="1.7" style="fill:${ball}"/></svg>`;
}
const easeTag = (t) => `<span class="qc-ez">${easeGlyph(t.ease, t.ball)}<span class="qc-ezl"><b>${t.n}</b> ${esc(t.ease)}</span></span>`;

// one request: the app that answers, its beat module, the chip that routes to it (opts.chip relabels it), the clip's
// easing tag it carries (opts.ez), and the beat's own options
const step = (app, mod, opts = {}) => ({ app, mod, opts, chips: [[app, opts.chip || CHIP[app], opts.ez || null]] });
// only the first request is asked; the rest are superbot carrying the build forward on its own. pace sets where the
// cuts land: hold is the pause after a beat before the next switch (one number, or one per step), chip is how long a
// routing chip spins before it resolves
const variant = (steps, pace = {}) => steps.map((s, i) => ({
  ...s,
  ...(i === 0 ? { ask: ASK } : {}),
  hold: Array.isArray(pace.hold) ? pace.hold[i] || 0 : pace.hold || 0,
  chipDur: pace.chip || 0.28,
}));

// the one published routing (?v=3, and the default): the motion reel, 7 requests, rapid. Lyria scores it, Meshy
// builds the assets, Gemini paints the frames, Opus codes the motion, DeepSeek sweeps references, GitHub commits,
// and Opus plays the reel at Max effort. Each switch carries the clip's chapter and easing in order (chat rule r1):
// 01 linear, 02 ease-in-out, 03 expo-out, 04 back-out, 05 elastic, 06 bounce, and the finale's 07 spring.
// No switch opens on Claude Opus 5.5, and none uses a plan card.
export const VARIANTS = {
  '3': variant([
    step('lyria', music, { ez: tag(1, 'linear') }),
    step('meshy', assets, { ez: tag(2, 'ease-in-out') }),
    step('gemini', art, { ez: tag(3, 'expo-out') }),
    step('opus', code, { set: 'world', ez: tag(4, 'back-out') }),
    step('deepseek', scrape, { ez: tag(5, 'elastic') }),
    step('github', git, { ez: tag(6, 'bounce') }),
    step('opus', play, { ez: tag(7, 'spring'), chip: 'Switching to Claude Opus 5.5', sub: 'Max effort' }),
  ], { hold: 0, chip: 0.18 }),
};
export const VARIANT_KEY = (() => { const v = new URLSearchParams(location.search).get('v'); return VARIANTS[v] ? v : '3'; })();
export const VARIANT = VARIANTS[VARIANT_KEY];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply.
// The pacing is tight on purpose: a routing chip lands SW_OFF after the previous beat ends, resolves in
// chipDur (0.16-0.28s), and the app answers 0.02s later, so the hand-off from one model to the next is
// ~0.2s of movement instead of a second of dead air.
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      k.typeEnd = s + Math.min(TYPE_MAX, 0.15 + a.ask.length * TYPE_RATE);
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.15;   // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.02;        // superbot carries on without being asked
    }
    // each chip lands, moves the platform chip to its app (swap) and resolves (done); the next lands just after
    let at = k.sw;
    k.chips = a.chips.map(([app, label, ez]) => { const c = { app, label, ez, sw: at, swap: at + 0.09, done: at + Math.max(0.16, a.chipDur) }; at = c.done + 0.05; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.02;  // the app answers
    k.T = a.mod.times(k.reply, a.opts);
    s = k.T.end + a.hold;     // the variant's pause before the next switch
    return { k };
  });
}
export const BEATS = timeBeats(VARIANT);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.2;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
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
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span>${c.ez ? easeTag(c.ez) : ''}<span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return {
        c, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok'),
        ezb: w.querySelector('.qc-ezb'), ezc: w.querySelector('.qc-ezc'),
      };
    });
    // the reply is signed by the model; a step can override the line under its name (the finale's "Max effort")
    const sub = k.opts.sub || a.sub;
    const sign = `${tile(k.app)}<b>${a.name}</b>${sub ? `<small>${esc(sub)}</small>` : ''}`;
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${sign}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app. Its logo and name sit in a clipped
  // viewport (qc-pv) holding two lanes: on each switch the outgoing lane travels out along x and the incoming one
  // travels in, both on that switch's easing, while the viewport's width goes from one name's width to the other's.
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pv = el('<span class="qc-pv"><span class="qc-pl"></span><span class="qc-pl"></span></span>');
  cat.replaceWith(pv);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  if (label) label.remove();
  const [laneA, laneB] = pv.children;

  const ph = hub.querySelector('.rc-ph');
  const chat = {
    hub, pointer, feed, inner, beats, scroll,
    plat, pv, laneA, laneB, laneKey: null,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null,
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

// the platform chip's swap: starts SWAP_LEAD before the chip's swap mark and runs SWAP_DUR on that chip's easing
const SWAP_LEAD = 0.06, SWAP_DUR = 0.35;
const laneHTML = (app) => `<span class="qc-pi">${app === 'superbot' ? `<span class="qc-pi-sb">${SB_MARK}</span>` : `<img alt="" src="${APPS[app].logo}" data-app="${app}"/>`}</span><span class="qc-pn">${esc(APPS[app].name)}</span>`;

function renderRouting(c, t) {
  // which switch the composer is on: the last chip whose swap has started. from/to are the apps either side of it.
  let cur = 'codex', from = 'codex', to = null, ease = 'linear', a0 = 0;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => {
    const a = ch.swap - SWAP_LEAD;
    if (t >= a) { from = cur; to = ch.app; cur = ch.app; ease = ch.ez ? ch.ez.ease : 'linear'; a0 = a; }
  }));
  const p = to === null ? 1 : seg(t, a0, a0 + SWAP_DUR);
  const moving = to !== null && p < 1;
  // the lanes' content only changes when the pair does (a cache of DOM writes, never of state)
  const key = moving ? `${from}>${to}` : `=${cur}`;
  if (key !== c.laneKey) {
    c.laneA.innerHTML = laneHTML(moving ? from : cur);
    if (moving) c.laneB.innerHTML = laneHTML(to);
    c.laneB.style.display = moving ? '' : 'none';
    c.laneKey = key;
  }
  const wA = c.laneA.offsetWidth;
  if (!moving) {
    c.laneA.style.transform = 'none';
    c.pv.style.width = `${wA}px`;
    return;
  }
  // outgoing travels out to the left, incoming travels in from the right, both on the switch's exact easing
  // (back-out, elastic and spring overshoot past the rest mark and settle back; the width takes the clamped value)
  const e = EASE[ease](p);
  const wB = c.laneB.offsetWidth;
  const D = Math.max(wA, wB) + 10;
  c.laneA.style.transform = `translateX(${(-e * D).toFixed(2)}px)`;
  c.laneB.style.transform = `translateX(${((1 - e) * D).toFixed(2)}px)`;
  c.pv.style.width = `${lerp(wA, wB, clamp(e)).toFixed(2)}px`;
}

// the easing tag's ball rides its curve once as the chip lands: x is time, y is the easing, like the clip's graphs
const EZ_RIDE = 0.62;
function renderEase(s, t) {
  if (!s.ezb) return;
  const k = s.c, p = seg(t, k.sw + 0.08, k.sw + 0.08 + EZ_RIDE);
  s.ezb.setAttribute('cx', (GLY.x0 + p * GLY.w).toFixed(2));
  s.ezb.setAttribute('cy', (GLY.y0 - EASE[k.ez.ease](p) * GLY.h).toFixed(2));
}

function renderSwitch(s, t) {
  renderEase(s, t);
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