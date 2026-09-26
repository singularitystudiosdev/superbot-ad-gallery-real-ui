// The nine-request chat. Each ask is typed into the composer and sent, superbot picks the model that is best at it
// (its "Switched to <model>" pill with a reason tag, and the composer's model chip follow the pick), and that model
// answers with its own beat (./beats/*.js). The thread is bottom-anchored so every message rises out of the
// composer. renderChat(c, t) is a pure function of the scene's local time. ?v= on the beat imports busts GitHub
// Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import code from './beats/code.js?v=1';
import tag from './beats/tag.js?v=1';
import news from './beats/news.js?v=1';
import design from './beats/design.js?v=1';
import images from './beats/images.js?v=1';
import meme from './beats/meme.js?v=1';
import video from './beats/video.js?v=1';
import launch from './beats/launch.js?v=1';
import doordash from './beats/doordash.js?v=1';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the models superbot routes between; `hue` tints the pill's ring once the switch lands
const APPS = {
  auto: { name: 'Auto', logo: '', sub: '', hue: '' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'Anthropic', hue: '217, 119, 87' },
  haiku: { name: 'Claude Haiku 4.5', logo: brand('claude-logo.svg'), sub: 'Anthropic', hue: '217, 119, 87' },
  sonnet: { name: 'Claude Sonnet 5', logo: brand('claude-logo.svg'), sub: 'Anthropic', hue: '217, 119, 87' },
  flash: { name: 'Gemini Flash', logo: brand('gemini-logo.svg'), sub: 'Google', hue: '77, 139, 246' },
  nano: { name: 'Nano Banana', logo: brand('gemini-logo.svg'), sub: 'Gemini image', hue: '250, 204, 21' },
  gptimg: { name: 'GPT Image', logo: brand('openai-logo.svg'), sub: 'OpenAI', hue: '236, 236, 236' },
  veo: { name: 'Veo 3.1', logo: brand('google-logo.svg'), sub: 'Google video', hue: '52, 168, 83' },
};

const ASKS = [
  { app: 'opus', mod: code, why: 'hard code + architecture', ask: 'Build me a site that tracks WSB ticker mentions against price' },
  { app: 'haiku', mod: tag, why: 'cheap grunt work', ask: 'Tag the last 4,000 comments bullish or bearish' },
  { app: 'flash', mod: news, why: 'fast read', ask: 'Put today’s Fed news in a banner up top' },
  { app: 'opus', mod: design, why: 'design', ask: 'Make it look like a Bloomberg Terminal that found WSB' },
  { app: 'nano', mod: images, why: 'images', ask: 'Need a logo and a share thumbnail, a bull riding a rocket' },
  { app: 'gptimg', mod: meme, why: 'memes', ask: 'Make a meme for the launch post' },
  { app: 'veo', mod: video, why: 'video', ask: 'Make a 6 second launch teaser' },
  { app: 'sonnet', mod: launch, why: 'analysis', ask: 'Shipped it this morning. How’s it doing?' },
  { app: 'haiku', mod: doordash, why: 'quick errand', ask: 'Celebrate. Get me tendies on DoorDash' },
];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply
export const BEATS = (() => {
  let s = CHAT_T0;
  return ASKS.map((a) => {
    const k = { ...a, s };
    k.typeEnd = s + Math.min(1.0, 0.2 + a.ask.length * 0.014);
    k.send = k.typeEnd + 0.18;
    k.sw = k.send + 0.38;     // superbot's model pill lands
    k.swap = k.sw + 0.3;      // the composer's model chip moves to the pick
    k.done = k.sw + 0.78;     // "Switching to" resolves to "Switched to", the reason tag pops
    k.why0 = k.done + 0.02;
    k.reply = k.done + 0.42;  // the model answers
    k.T = a.mod.times(k.reply);
    s = k.T.end;
    return { k };
  });
})();
const LAST = BEATS[BEATS.length - 1].k;
export const CHAT_END = LAST.T.end + 0.3;

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function mountChat(hub) {
  // the pointer lives in the scene section, in its px (the same space placeCursor writes)
  const root = hub.closest('.sbsite').parentNode;
  const pointer = makeCursor();
  root.appendChild(pointer);

  const sbSrc = hub.querySelector('.rail-item.sb img').src;
  APPS.auto.logo = sbSrc;
  const tile = (app, cls = '') => `<span class="qc-tile qc-t-${app} ${cls}"><img src="${app === 'superbot' ? sbSrc : APPS[app].logo}" alt=""/></span>`;
  const feed = hub.querySelector('.feed');
  const inner = document.createElement('div');
  inner.className = 'feed-in';
  while (feed.firstChild) inner.appendChild(feed.firstChild);
  feed.appendChild(inner);
  const add = (html) => { const n = el(html); inner.appendChild(n); return n; };

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const beats = BEATS.map(({ k }) => {
    const a = APPS[k.app];
    const u = add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`);
    const w = add(`<div class="msg qc-m qc-mw">${sbAvatar}<div class="m-main"><span class="qc-sw" style="--mc:${a.hue}">${tile(k.app)}<span class="qc-swl">Switching to <b>${a.name}</b></span><span class="qc-st"><i class="qc-spin"></i>${OK}</span><span class="qc-why">${esc(k.why)}</span></span></div></div>`);
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    const sw = w.querySelector('.qc-sw');
    return { k, u, w, r, who: main.firstElementChild, inst, sw, lab: sw.querySelector('.qc-swl'), why: sw.querySelector('.qc-why'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok'), done: null };
  });

  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const marks = beats.flatMap((b) => [[b.k.send, b.u], [b.k.sw, b.w], [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's model chip starts on Auto, then follows every pick
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.auto.logo}" data-app="auto"/>`);
  pIcon.appendChild(pImg);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.auto.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, pointer, feed, inner, beats, marks, plat, pImg, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'auto',
  };
}

function appear(n, t, a, dy = 10) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = p.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

function renderComposer(c, t) {
  const b = c.beats.find(({ k }) => t >= k.s && t < k.send);
  let ph;
  if (b) {
    const n = Math.round(b.k.ask.length * seg(t, b.k.s, b.k.typeEnd));
    ph = `<span class="qc-typed">${esc(b.k.ask.slice(0, n))}</span><i class="qc-caret"></i>`;
  } else ph = esc(c.phText);
  if (ph !== c.lastPh) { c.ph.innerHTML = ph; c.lastPh = ph; }
  c.send.classList.toggle('qc-on', !!b);
  const at = c.beats.map(({ k }) => k.send).find((s) => t >= s - 0.12 && t < s + 0.2);
  c.send.style.transform = at === undefined ? 'none' : `scale(${(1 - 0.16 * bump(seg(t, at - 0.12, at + 0.2))).toFixed(4)})`;
}

function renderRouting(c, t) {
  let app = 'auto', swap = -1;
  c.beats.forEach(({ k }) => { if (t >= k.swap) { app = k.app; swap = k.swap; } });
  // model chip: dips out, swaps, pops back with the pick's tint
  if (app !== c.lastApp) {
    c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  c.plat.style.opacity = swap < 0 ? '1' : (1 - 0.85 * bump(seg(t, swap - 0.14, swap + 0.14))).toFixed(3);
  const pb = swap < 0 ? 0 : bump(seg(t, swap, swap + 0.5));
  c.plat.style.transform = pb === 0 ? 'none' : `scale(${(1 + 0.1 * pb).toFixed(4)})`;
  c.plat.style.boxShadow = pb === 0 || !APPS[app].hue ? '' : `0 0 0 ${(1.5 * pb).toFixed(2)}px rgba(${APPS[app].hue}, ${(0.8 * pb).toFixed(3)}), 0 0 ${(18 * pb).toFixed(1)}px rgba(${APPS[app].hue}, ${(0.45 * pb).toFixed(3)})`;
}

function renderSwitch(b, t) {
  const { k } = b;
  const done = t >= k.done;
  if (done !== b.done) {
    b.sw.classList.toggle('qc-done', done);
    b.lab.firstChild.textContent = done ? 'Switched to ' : 'Switching to ';
    b.done = done;
  }
  b.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  b.spin.style.opacity = (1 - seg(t, k.done - 0.08, k.done + 0.06)).toFixed(3);
  b.spin.style.transform = `rotate(${((t - k.sw) * 420).toFixed(1)}deg)`;
  const o = seg(t, k.done, k.done + 0.3);
  b.ok.style.opacity = o.toFixed(3);
  b.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.5));
  b.sw.firstElementChild.style.transform = `scale(${lerp(0.4, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -35).toFixed(2)}deg)`;
  // the landed switch: a tinted ring that flares once and settles, then the reason tag pops in
  const ring = seg(t, k.done, k.done + 0.6);
  b.sw.style.setProperty('--ring', (t < k.done ? 0 : 0.55 + 0.45 * bump(ring)).toFixed(3));
  b.sw.style.transform = `scale(${(1 + 0.05 * bump(ring)).toFixed(4)})`;
  const wy = seg(t, k.why0, k.why0 + 0.4);
  b.why.style.opacity = outCubic(wy).toFixed(3);
  b.why.style.transform = `translateX(${((1 - outCubic(wy)) * -8).toFixed(2)}px) scale(${lerp(0.7, 1, outBack(wy)).toFixed(4)})`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed)
  let y = 0;
  for (const [a, n] of c.marks) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + 0.5)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    appear(b.u, t, b.k.send);
    appear(b.w, t, b.k.sw);
    appear(b.r, t, b.k.reply);
    renderSwitch(b, t);
    b.inst.render(t);
  });
  renderScroll(c, t);
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
