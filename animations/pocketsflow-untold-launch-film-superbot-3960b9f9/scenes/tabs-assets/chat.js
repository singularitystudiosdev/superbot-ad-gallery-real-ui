// The chat for "make a launch video for Pocketsflow", one model per request, strictly one after another. The ask is
// typed into the composer and sent; superbot routes each step of the film to the model built for it (its routing chip
// names the model AND the job, and the composer's platform chip follows the model), and the routed model answers with
// a short receipt in the thread while its full output lands in the canvas pane (canvas.js) beside it:
//   Gemini 3.1 Pro    reads pocketsflow.com, writes the brief and the 6-shot script     (beats/brief.js)
//   Nano Banana Pro   one style frame per shot                                           (beats/frames.js)
//   Kling 3.0         animates the frames into the shots                                 (beats/kling.js)
//   ElevenLabs        voices the script, scores it, lays the SFX                         (beats/voice.js)
//   Claude Opus 5.5   cuts it together in Remotion                                       (beats/cut.js)
//   Superbot          renders it and premieres it full frame                             (beats/premiere.js)
// Every output is a piece of the one film (film/film.js). Each request is routed the moment the previous beat lands;
// opts.span is how long a beat holds after its reply, chosen so the chat ends where the source spot's did (36.549 s).
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of the
// scene's local time.
import { clamp, lerp, seg, outQuint, outBack, inOutQuint, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import { mountCanvas, renderCanvas } from './canvas.js?v=1';
import brief from './beats/brief.js?v=1';
import frames from './beats/frames.js?v=1';
import kling from './beats/kling.js?v=1';
import voice from './beats/voice.js?v=1';
import cut from './beats/cut.js?v=1';
import premiere from './beats/premiere.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about: typed once, then superbot carries the film forward
export const ASK = 'make a launch video for Pocketsflow';

// name: the model; job: its step in the canvas stepper; chip: the routing chip (the model and what it is for)
const APPS = {
  gemini: { name: 'Gemini 3.1 Pro', logo: brand('gemini-logo.svg'), sub: 'in superbot', job: 'Brief', chip: 'Switching to Gemini 3.1 Pro for the brief and script' },
  nano: { name: 'Nano Banana Pro', logo: brand('gemini-logo.svg'), sub: 'in superbot', job: 'Frames', chip: 'Switching to Nano Banana Pro for style frames' },
  kling: { name: 'Kling 3.0', logo: brand('kling-logo.svg'), sub: 'in superbot', job: 'Shots', chip: 'Switching to Kling 3.0 to animate the shots' },
  eleven: { name: 'ElevenLabs', logo: brand('elevenlabs-logo.svg'), sub: 'in superbot', job: 'Sound', chip: 'Switching to ElevenLabs for voice and score' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot', job: 'Edit', chip: 'Switching to Claude Opus 5.5 to cut the edit' },
  superbot: { name: 'Superbot', logo: null, sub: '', job: 'Render', chip: 'Switched to Superbot to render' }, // drawn as its mark (chat.css .sbm)
};

const step = (app, mod, opts) => ({ app, mod, opts, chips: [{ app, label: APPS[app].chip }] });
// spans (reply to next route) end the beats at 8.2, 13.3, 18.6, 23.3, 28.0 and 36.249 s, the source spot's clock
export const STEPS = [
  step('gemini', brief, { span: 4.765 }),
  step('nano', frames, { span: 4.31 }),
  step('kling', kling, { span: 4.51 }),
  step('eleven', voice, { span: 3.91 }),
  step('opus', cut, { span: 3.91 }),
  step('superbot', premiere, { span: 7.459 }),
].map((s, i) => ({ ...s, ask: i === 0 ? ASK : undefined }));

// the composer floats over the thread's bottom (chat.css .qc-v4): the newest line stops this far above its top edge
// and everything below dissolves into the .qc-v4fade band
const FADE = 20;

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      k.typeEnd = s + Math.min(0.85, 0.15 + a.ask.length * 0.013);
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.35;   // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.06;        // superbot routes the next request as the last beat lands
    }
    // the chip lands, moves the platform chip to its app (swap) and resolves (done)
    k.chips = a.chips.map((c) => ({ ...c, sw: k.sw, swap: k.sw + 0.22, done: k.sw + 0.65 }));
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.08;
    k.T = a.mod.times(k.reply, a.opts);
    s = k.T.end;
    return { k };
  });
}
export const BEATS = timeBeats(STEPS);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.3;
/** when the canvas pane opens: as the first model starts answering */
export const CANVAS_AT = BEATS[0].k.reply - 0.3;

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
  const chipHtml = (c) => `<span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span>`;
  const mount = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main">${chipHtml(k.chips[0])}</div></div>`);
    const sws = k.chips.map((c, i) => {
      const sw = w.querySelectorAll('.qc-sw')[i];
      return { c, w, sw, spin: sw.querySelector('.qc-spin'), ok: sw.querySelector('.qc-ok') };
    });
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

  // the canvas: one page per beat, live from just before its reply
  const canvas = mountCanvas(hub,
    beats.map(({ k }) => ({ app: k.app, job: APPS[k.app].job, tile: tile(k.app) })),
    beats.map(({ k, inst }) => ({ at: k.reply - 0.05, page: inst.page, file: inst.file, app: k.app, job: APPS[k.app].job })));

  // the composer's platform chip names the model, then follows the routed app
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
  // the composer leaves the flow (chat.css .qc-v4) so the thread runs the whole height of .main and slides under it;
  // this band is the gradient the thread dissolves into, its height written from the composer's own box each frame
  const composer = hub.querySelector('.composer');
  hub.classList.add('qc-v4');
  const fade = el('<div class="qc-v4fade"></div>');
  fade.style.setProperty('--qc-fade', FADE + 'px');
  composer.parentNode.insertBefore(fade, composer);

  const c = {
    hub, pointer, site, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel, canvas,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'superbot',
    composer, fade,
  };
  if (window.__AD) window.__AD.chat = c;
  return c;
}

function appear(n, t, a) {
  const p = outQuint(seg(t, a, a + 0.55));
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
  // the platform chip follows the routed app: the last chip that has swapped wins; before any, it names superbot
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
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const padT = parseFloat(cs.paddingTop);
  let viewH = c.feed.clientHeight - padT - parseFloat(cs.paddingBottom);
  // the composer floats over the thread, so the line the newest content stops on is the composer's top edge minus the
  // fade; the composer is read live (its drop out of the empty state is taken back off so the thread does not ride it)
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
  let y = 0;
  for (const [a, n] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutQuint(seg(t, a, a + 0.8)));
  }
  c.inner.style.transform = `translate3d(0,${(viewH - 8 - y).toFixed(2)}px,0)`;
}

/** how far the canvas is opened over the hub for the premiere (0 docked, 1 full frame) */
export const theaterAt = (c, t) => c.beats.reduce((m, b) => Math.max(m, b.inst.theater ? b.inst.theater(t) : 0), 0);

export function renderChat(c, t, open) {
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
  renderCanvas(c.canvas, t, open, theaterAt(c, t));
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, (p) => p)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
