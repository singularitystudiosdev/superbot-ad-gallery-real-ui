// The chat for "make Splatoon" (Superbot builds Inkwave): seven requests, strictly one after another, each typed into
// the composer by the user, routed by superbot (its routing chip and the composer's platform chip follow the model),
// and answered by the routed model with its own beat module (./beats/<name>.js). A together() step runs two models side
// by side: two routing chips land one after the other, the reply header signs both ("A + B, in parallel") and the beat
// draws the parallel lanes. There is one routing (no ?v= needed); VARIANT_KEY is kept for the tooling that reads it.
// Each request is routed the moment the previous beat lands: there are no idle holds between beats. The thread is
// bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of the scene's local
// time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outQuint, outBack, inOutCubic, inOutQuint, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import script from './beats/script.js?v=2';
import scrape from './beats/scrape.js?v=2';
import meshy from './beats/meshy.js?v=2';
import motion from './beats/motion.js?v=2';
import sound from './beats/sound.js?v=2';
import opusLapse from './beats/opus-lapse.js?v=2';
import play from './beats/play.js?v=2';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.25; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about: the first request typed into the composer
export const ASK = 'make Splatoon';

// logo: null = no official mark on disk; the tile then carries the app's initial on the kit's dark tile (.qc-gen).
// Every app in this routing has its real mark: HY-Motion's and Suno's were sourced by their beats (img/ink/<beat>/).
// Versions as shipped on 2026-09-26: Meshy 7 (meshy.ai: "Meshy 7 is live"), Suno v6 (released 9 Sep 2026).
const APPS = {
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  deepseek: { name: 'DeepSeek V4', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  meshy: { name: 'Meshy 7', logo: brand('meshy-logo.svg'), sub: 'in superbot' },
  motion: { name: 'HY-Motion', logo: img('ink/motion/hy-motion-logo.png'), sub: 'by Tencent Hunyuan' },
  eleven: { name: 'ElevenLabs', logo: brand('elevenlabs-logo.svg'), sub: 'in superbot' },
  suno: { name: 'Suno', logo: img('ink/sound/suno.svg'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the routing chip superbot lands when it sends a request to an app
const CHIP = {
  opus: 'Switching to Claude Opus 5.5',
  deepseek: 'Switching to DeepSeek V4',
  meshy: 'Switching to Meshy 7',
  motion: 'Switching to HY-Motion',
  eleven: 'Switching to ElevenLabs',
  suno: 'Switching to Suno',
  superbot: 'Switched to Superbot',
};
// one request: the app that answers, its beat module, the user's prompt for it (opts.ask), the chip that routes to it,
// and the beat's own options. opts.cont = true continues the previous app with no chip and no new reply header.
const step = (app, mod, opts = {}) => ({ app, mod, opts, ask: opts.ask, cont: !!opts.cont, chips: opts.cont ? [] : [{ app, label: CHIP[app] }] });
// two (or more) models on one request, side by side (ported from fantasy90s-every-model-superbot's together()): one
// routing chip per model, landing one after the other; the first says "Switching to", the rest "Running X in
// parallel". k.app is the last model (the platform chip ends on it), k.who lists them all for the reply header.
const together = (apps, mod, opts = {}) => ({
  app: apps[apps.length - 1], who: apps, mod, opts, ask: opts.ask, cont: false,
  chips: apps.map((a, i) => ({ app: a, label: i === 0 ? CHIP[a] : `Running ${APPS[a].name} in parallel` })),
});
// pace = the chip scale: every routing chip's own timings (swap 0.22, done 0.65, gap 0.12) stretch with it.
const variant = (steps, pace) => steps.map((s, i) => ({ ...s, ask: s.ask || (i === 0 ? ASK : undefined), chip: pace }));

// the Inkwave routing, one ad: Opus writes the script, DeepSeek scrapes Inkipedia, Meshy models the cast, HY-Motion
// animates it, ElevenLabs and Suno do the sound together, Opus builds it, Superbot plays it. After the first, every
// prompt echoes the job the Opus script handed that agent (beats/script.js CHIPS), so the thread reads as the script
// being worked down, one handoff chip per request.
export const VARIANTS = {
  '1': variant([
    step('opus', script, { ask: ASK }),
    step('deepseek', scrape, { ask: 'scrape Inkipedia: weapon stats and turf rules' }),
    step('meshy', meshy, { ask: 'model the squid kid, Splattershot and pier props' }),
    step('motion', motion, { ask: 'animate it: swim, super jump, strafe, splat' }),
    together(['eleven', 'suno'], sound, { ask: 'the 9 SFX and the Turf War track, together', markRows: true }),
    step('opus', opusLapse, { ask: 'build the game' }),
    step('superbot', play, { ask: 'play it' }),
  ], 1),
};
export const VARIANT_KEY = (() => { const v = new URLSearchParams(location.search).get('v'); return VARIANTS[v] ? v : '1'; })();
export const VARIANT = VARIANTS[VARIANT_KEY];

// the tight frame (the kit's v4 layout: tabs.js geo DW = W/2, composer floating over the thread, longer eases) is the
// only layout this ad uses.
const V4 = true;

// the composer floats over the thread's bottom (chat.css .qc-v4): the newest line stops this far above the composer's
// top edge and everything below it dissolves into a gradient (the .qc-v4fade band, chat.css) instead of being sliced.
const FADE = 20;

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply. W = the
// variant's chip scale: the chip's own beats (swap, done, and the gap before the next chip) all stretch with it.
// A continue step has no chip at all, so its beat simply follows the previous one.
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    const W = a.chip;
    // pacing (integration pass): the spot runs ~50.5s. The time is taken out of the composer (typing ~95 chars/s,
    // capped at 0.7s, and a tighter send and route), never out of the routing chips: each switch keeps its full
    // swap and resolve, so every agent change reads.
    if (a.ask) {
      k.typeEnd = s + Math.min(0.7, 0.14 + a.ask.length * 0.0105);
      k.send = k.typeEnd + 0.12;
      k.sw = k.send + 0.28;   // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.06;        // superbot routes the next request as the last beat lands
    }
    // the chip lands, moves the platform chip to its app (swap) and resolves (done)
    // several chips (a together() step) land one after another, each gap 0.12 * W after the previous one resolves
    let at = k.sw;
    k.chips = a.chips.map((c) => { const ch = { ...c, sw: at, swap: at + 0.22 * W, done: at + 0.65 * W }; at = ch.done + 0.12 * W; return ch; });
    if (k.chips.length) { k.done = k.chips[k.chips.length - 1].done; k.reply = k.done + 0.08; }
    else { k.sw = s; k.done = s; k.reply = s + 0.12; }  // cont: no chip, the beat just follows
    k.T = a.mod.times(k.reply, a.opts);
    s = k.T.end;              // no hold: the next request is routed the moment this beat lands
    return { k };
  });
}
export const BEATS = timeBeats(VARIANT);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const site = hub.closest('.sbsite');   // the camera element: tabs.js puts the base transform on it (ask.css keeps
                                         // .sbsite.ask at transform-origin 0 0, which that transform's math assumes)
  const root = site.parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  const tile = (app, cls = '') => {
    if (app === 'superbot') return `<span class="qc-tile qc-t-${app} ${cls}">${SB_MARK}</span>`;
    const a = APPS[app];
    if (!a.logo) return `<span class="qc-tile qc-t-${app} qc-gen ${cls}"><b>${esc(a.name[0])}</b></span>`;
    return `<span class="qc-tile qc-t-${app} ${cls}"><img src="${a.logo}" alt=""/></span>`;
  };
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc, apps: APPS };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  // one routing chip: its app tile, the label, and the spinner that resolves into a check
  const chipHtml = (c) => `<span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span>`;
  const mount = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    // one superbot message per routing chip, so each chip rises on its own clock (a together() step has two)
    const sws = k.chips.map((c) => {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main">${chipHtml(c)}</div></div>`);
      const sw = w.querySelector('.qc-sw');
      return { c, w, sw, spin: sw.querySelector('.qc-spin'), ok: sw.querySelector('.qc-ok') };
    });
    // the reply header: the app that answered (a parallel request is signed by every model on it: stacked tiles, names
    // joined, "in parallel"), then the beat's own nodes
    const who = k.who && k.who.length > 1
      ? `<span class="qc-duo">${k.who.map((w) => tile(w)).join('')}</span><b>${k.who.map((w) => APPS[w].name).join(' + ')}</b><small>in parallel</small>`
      : `${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}`;
    const r = add(`<div class="msg qc-m qc-r${k.cont ? ' qc-cont' : ''}">${sbAvatar}<div class="m-main">${k.cont ? '' : `<div class="qc-who">${who}</div>`}</div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: k.cont ? null : main.firstElementChild, inst };
  };
  const beats = BEATS.map(mount);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who || b.r], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el('<img alt="" data-app="superbot" style="display:none"/>');
  const pMark = el(`<span class="qc-pi-sb" style="display:block">${SB_MARK}</span>`);
  const pGen = el('<b class="qc-pi-gen" style="display:none"></b>');   // an app with no logo on disk: its initial
  pIcon.append(pImg, pMark, pGen);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.superbot.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');

  // v4 only: the composer leaves the flow (chat.css .qc-v4) so the thread runs the whole height of .main and slides
  // under it, and this band is the gradient the thread dissolves into where it leaves view. It sits under the composer
  // (z-index 2 vs 3) and its height is written from the composer's own box in renderScroll, so the fade always ends
  // exactly where the composer's top edge is, however tall the composer measures.
  const composer = hub.querySelector('.composer');
  let fade = null;
  if (V4) {
    hub.classList.add('qc-v4');
    fade = el('<div class="qc-v4fade"></div>');
    fade.style.setProperty('--qc-fade', FADE + 'px');
    composer.parentNode.insertBefore(fade, composer);
  }

  const c = {
    hub, pointer, site, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pGen, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'superbot',
    composer, fade,
  };
  // tooling: the same frozen-frame harness that publishes window.__AD can read the mounted thread (its scroll marks and
  // beats) without the page telling it. Assignment only: nothing here changes what any variant renders.
  if (window.__AD) window.__AD.chat = c;
  return c;
}

function appear(n, t, a, dy = 10) {
  // v4: a longer, longer-tailed rise on a 3D translate (its own compositor layer), so a row appended into the tight
  // v4 frame has no 1px snap; v1-v3 keep the shipped motion byte for byte.
  const d = V4 ? 14 : dy, dur = V4 ? 0.55 : 0.42, ease = V4 ? outQuint : outCubic;
  const p = ease(seg(t, a, a + dur));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : (V4 ? `translate3d(0,${((1 - p) * d).toFixed(2)}px,0)` : `translateY(${((1 - p) * d).toFixed(2)}px)`);
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
  // the platform chip follows the routed app: the last chip that has swapped wins; before any, it names superbot
  let app = 'superbot', swap = -1;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  // platform chip: dips out, swaps, comes back
  if (app !== c.lastApp) {
    const isMark = app === 'superbot', gen = !isMark && !APPS[app].logo;
    c.pImg.style.display = isMark || gen ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    c.pGen.style.display = gen ? 'block' : 'none';
    if (gen) c.pGen.textContent = APPS[app].name[0];
    else if (!isMark) c.pImg.src = APPS[app].logo;
    // the app rides every variant of the chip (logo, initial tile, mark), so per-app css never misses a logo-less app
    c.pImg.dataset.app = app;
    c.pGen.dataset.app = app;
    c.plat.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.08 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
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
  const head = s.sw.firstElementChild;
  head.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const padT = parseFloat(cs.paddingTop);
  let viewH = c.feed.clientHeight - padT - parseFloat(cs.paddingBottom);
  // v4: the composer floats over the thread (chat.css .qc-v4), so the line the newest content stops on is the composer's
  // top edge minus the fade it dissolves into, not the feed's own bottom (which is now the bottom of the frame). The
  // composer is read live, never assumed: its own height grows with the platform chip, and while it is still gliding
  // up out of the empty state its transform is taken back off so the thread does not ride the drop.
  if (V4 && c.composer && c.fade) {
    const fb = c.feed.getBoundingClientRect(), cb = c.composer.getBoundingClientRect();
    if (fb.height > 0) {
      const k = c.feed.clientHeight / fb.height;                       // the feed's own px per screen px
      const ct = getComputedStyle(c.composer).transform;
      const m42 = ct && ct !== 'none' ? new DOMMatrix(ct).m42 : 0;     // the drop, in the composer's px
      viewH = (cb.top - fb.top) * k - m42 - padT + 8 - FADE;           // anchor = composer top - FADE
      const under = Math.max(0, (fb.bottom - cb.top) * k + m42);      // feed px from the composer's top to the feed's bottom
      const h = (under + FADE).toFixed(2) + 'px';
      if (c.fadeH !== h) { c.fadeH = h; c.fade.style.height = h; }
      // the thread itself stops painting at the composer's top edge: without this clip, content sliding under the
      // composer showed again beside it and in the frame's last pixel row, where the band's anti-aliased bottom edge and
      // the feed's own overflow edge meet. The clip edge sits where the band is already solid, so the band covers it.
      const clip = `inset(0px 0px ${under.toFixed(2)}px 0px)`;
      if (c.feedClip !== clip) { c.feedClip = clip; c.feed.style.clipPath = clip; }
    }
  }
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed). v4 gives the glide a longer,
  // longer-tailed ease so a big card appending (a 3D render, a video) never snaps the thread, and drives it on the
  // compositor with a 3D translate.
  const dur = V4 ? 0.8 : 0.45, ease = V4 ? inOutQuint : inOutCubic;
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), ease(seg(t, a, a + dur)));
  }
  const Y = (viewH - 8 - y).toFixed(2);
  c.inner.style.transform = V4 ? `translate3d(0,${Y}px,0)` : `translateY(${Y}px)`;
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