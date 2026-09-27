// The chat for "make me minecraft in the browser", forked from pocketsflow-untold-every-model-superbot's v4 chat.
// The ask is typed into the composer and sent once; superbot then routes every subtask to a different model, strictly
// one after another, and each routed model answers with its own beat (./beats/*.js):
//   DeepSeek V4 Flash   ds-search.js  crawls block, crafting and biome references; results stream in
//   Nano Banana         atlas.js      generates the block textures; the atlas fills in tile by tile
//   Meshy 5             voxel.js      meshes the grass block: clay, wireframe, textured, on a turntable
//   ElevenLabs          audio.js      block break, footsteps, block place (SFX)
//   Suno                audio.js      the ambient loop
//   Claude Opus 5.5     opus-lapse.js writes the engine: terrain, chunk mesher, crafting, as a code-lapse
// Each request is routed the moment the previous beat lands: the routing chip ("Switching to X") lands in the thread,
// the composer's platform chip swaps to that model's mark and name, and the chip resolves into a check. The thread is
// bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of the scene's
// local time.
import { clamp, lerp, seg, outBack, outQuint, inOutQuint, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import dsSearch from './beats/ds-search.js?v=1';
import atlas from './beats/atlas.js?v=1';
import voxel from './beats/voxel.js?v=1';
import audio from './beats/audio.js?v=1';
import opusLapse from './beats/opus-lapse.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 0.3; // the scene hard-cuts in on the empty state; the ask starts typing almost at once

// the one ask the whole spot is about: typed once, then superbot carries the rest of the build forward
export const ASK = 'make me minecraft in the browser';

// Model marks: every one is the official mark already shipped in this series (brand/CREDITS.txt). Nano Banana is
// Google's Gemini image model and wears the Gemini mark, as it does in inkwave-every-model-superbot-53035443.
const APPS = {
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  nano: { name: 'Nano Banana', logo: brand('gemini-logo.svg'), sub: 'Gemini image' },
  meshy: { name: 'Meshy 5', logo: brand('meshy-logo.svg'), sub: 'in superbot' },
  eleven: { name: 'ElevenLabs', logo: brand('elevenlabs-logo.svg'), sub: 'in superbot' },
  suno: { name: 'Suno', logo: brand('suno-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the routing chip superbot lands when it sends a request to a model
const CHIP = {
  deepseek: 'Switching to DeepSeek V4 Flash',
  nano: 'Switching to Nano Banana',
  meshy: 'Switching to Meshy 5',
  eleven: 'Switching to ElevenLabs',
  suno: 'Switching to Suno',
  opus: 'Switching to Claude Opus 5.5',
};
// one request: the model that answers, its beat module, the chip that routes to it, and the beat's own options
const step = (app, mod, opts = {}) => ({ app, mod, opts, cont: false, chips: [{ app, label: CHIP[app] }] });
// the chip scale: every routing chip's own timings (swap 0.22, done 0.65) stretch with it
const PACE = 0.55;

const ROUTING = [
  step('deepseek', dsSearch),
  step('nano', atlas),
  step('meshy', voxel),
  step('eleven', audio, {
    say: 'Recorded the block sounds.', label: 'Generating 3 sound effects',
    tracks: [['Block break, oak wood (SFX)', '0:01', 11], ['Footsteps on grass (SFX)', '0:02', 23], ['Block place, stone (SFX)', '0:01', 37]],
    rec: 0.36, stagger: 0.14,
  }),
  step('suno', audio, {
    say: 'Wrote the ambient loop.', label: 'Composing 1 track',
    tracks: [['BlockHaven ambient loop, calm piano (72 BPM)', '2:40', 53]],
    rec: 0.42, stagger: 0.14, wide: true,
  }),
  step('opus', opusLapse),
];
const VARIANT = ROUTING.map((s, i) => ({ ...s, ask: i === 0 ? ASK : undefined, chip: PACE }));

// the composer floats over the thread's bottom (chat.css .qc-v4): the newest line stops this far above the composer's
// top edge and everything below it dissolves into a gradient (the .qc-v4fade band)
const FADE = 20;

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    const W = a.chip;
    if (a.ask) {
      k.typeEnd = s + Math.min(0.7, 0.15 + a.ask.length * 0.013);
      k.send = k.typeEnd + 0.12;
      k.sw = k.send + 0.3;    // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.06;        // superbot routes the next request as the last beat lands
    }
    // the chip lands, moves the platform chip to its model (swap) and resolves (done)
    k.chips = a.chips.map((c) => ({ ...c, sw: k.sw, swap: k.sw + 0.22 * W, done: k.sw + 0.65 * W }));
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.08;
    k.T = a.mod.times(k.reply, a.opts);
    s = k.T.end;              // no hold: the next request is routed the moment this beat lands
    return { k };
  });
}
export const BEATS = timeBeats(VARIANT);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.15;

const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const site = hub.closest('.sbsite');
  const root = site.parentNode;
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
  // one routing chip: its model tile, the label, and the spinner that resolves into a check
  const chipHtml = (c) => `<span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span>`;
  const mount = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main">${chipHtml(k.chips[0])}</div></div>`);
    const sws = k.chips.map((c, i) => {
      const sw = w.querySelectorAll('.qc-sw')[i];
      return { c, w, sw, spin: sw.querySelector('.qc-spin'), ok: sw.querySelector('.qc-ok') };
    });
    // the reply header: the model that answered, then the beat's own nodes
    const who = `${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}`;
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${who}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst };
  };
  const beats = BEATS.map(mount);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who || b.r], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed model
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el('<img alt="" data-app="superbot" style="display:none"/>');
  const pMark = el(`<span class="qc-pi-sb" style="display:block">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.superbot.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');

  // the composer leaves the flow (chat.css .qc-v4) so the thread runs the whole height of .main and slides under it,
  // and this band is the gradient the thread dissolves into where it leaves view
  const composer = hub.querySelector('.composer');
  hub.classList.add('qc-v4');
  const fade = el('<div class="qc-v4fade"></div>');
  fade.style.setProperty('--qc-fade', FADE + 'px');
  composer.parentNode.insertBefore(fade, composer);

  const c = {
    hub, pointer, site, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'superbot',
    composer, fade,
  };
  if (window.__AD) window.__AD.chat = c;
  return c;
}

function appear(n, t, a) {
  const p = outQuint(seg(t, a, a + 0.5));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translate3d(0,${((1 - p) * 14).toFixed(2)}px,0)`;
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
  // the platform chip follows the routed model: the last chip that has swapped wins; before any, it names superbot
  let app = 'superbot', swap = -1;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  // platform chip: dips out, swaps, comes back with a pop
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pop = swap < 0 ? 1 : 1 + 0.1 * bump(seg(t, swap, swap + 0.4));
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
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.4));
  const head = s.sw.firstElementChild;
  head.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const padT = parseFloat(cs.paddingTop);
  let viewH = c.feed.clientHeight - padT - parseFloat(cs.paddingBottom);
  // the composer floats over the thread, so the line the newest content stops on is the composer's top edge minus
  // the fade, read live (while the composer is still gliding down out of the empty state its transform is taken off)
  const fb = c.feed.getBoundingClientRect(), cb = c.composer.getBoundingClientRect();
  if (fb.height > 0) {
    const k = c.feed.clientHeight / fb.height;
    const ct = getComputedStyle(c.composer).transform;
    const m42 = ct && ct !== 'none' ? new DOMMatrix(ct).m42 : 0;
    viewH = (cb.top - fb.top) * k - m42 - padT + 8 - FADE;
    const under = Math.max(0, (fb.bottom - cb.top) * k + m42);
    const h = (under + FADE).toFixed(2) + 'px';
    if (c.fadeH !== h) { c.fadeH = h; c.fade.style.height = h; }
    const clip = `inset(0px 0px ${under.toFixed(2)}px 0px)`;
    if (c.feedClip !== clip) { c.feedClip = clip; c.feed.style.clipPath = clip; }
  }
  // bottom-anchored like a live chat: the newest landed line sits just above the composer. The glide is short here
  // (the beats are brisk), long-tailed, on the compositor.
  const dur = 0.55;
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutQuint(seg(t, a, a + dur)));
  }
  c.inner.style.transform = `translate3d(0,${(viewH - 8 - y).toFixed(2)}px,0)`;
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
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
