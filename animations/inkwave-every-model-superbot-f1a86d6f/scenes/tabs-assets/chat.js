// The one-ask chat, Inkwave cut. The ask is typed into the composer and sent, superbot routes it, and each routed
// model answers with its own beat: script.js (Claude Opus 5.5 writes the build script), scrape.js (DeepSeek V4 Flash
// sweeps ink references), meshy.js (Meshy 5 models the squid kid), motion.js (HY-Motion 1.0 animates it), sound.js
// (ElevenLabs and Suno v5 score it in parallel), art.js (Nano Banana paints the turf), code.js (Opus 5.5 writes the
// turf war loop), deploy.js (Vercel ships it), play.js (Superbot plays Inkwave).
// The routing chips carry the new switch grammar: a hand-off that carries files wears an attachment pill
// (refs/, juno.glb, assets/), and a chip that dispatches a numbered script section wears that section as an ink
// badge (Script §2). Both are pure functions of t (chat.css), never transitions.
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import script from './beats/script.js?v=2';
import scrape from './beats/scrape.js?v=2';
import meshy from './beats/meshy.js?v=2';
import motion from './beats/motion.js?v=2';
import sound from './beats/sound.js?v=2';
import art from './beats/art.js?v=2';
import code from './beats/code.js?v=2';
import deploy from './beats/deploy.js?v=2';
import play from './beats/play.js?v=2';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the ask starts typing

// the one ask the whole spot is about: typed once, then superbot carries the build forward on its own
export const ASK = 'make a Splatoon game';

const APPS = {
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  meshy: { name: 'Meshy 5', logo: brand('meshy-logo.svg'), sub: 'in superbot' },
  hymotion: { name: 'HY-Motion 1.0', logo: brand('hunyuan-logo.png'), sub: 'in superbot' },
  eleven: { name: 'ElevenLabs', logo: brand('elevenlabs-logo.svg'), sub: 'in superbot' },
  suno: { name: 'Suno v5', logo: brand('suno-logo.svg'), sub: 'in superbot' },
  gemini: { name: 'Nano Banana', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  vercel: { name: 'Vercel', logo: brand('vercel-logo.svg'), sub: 'in superbot' },
  github: { name: 'GitHub', logo: brand('github-logo.svg'), sub: 'connected' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the default chip a request to an app lands as; a step can relabel it (a script dispatch, a hand-back, a deploy)
const CHIP = {
  opus: 'Switching to Claude Opus 5.5',
  deepseek: 'Switching to DeepSeek V4 Flash',
  meshy: 'Switching to Meshy 5',
  hymotion: 'Switching to HY-Motion 1.0',
  eleven: 'Switching to ElevenLabs',
  suno: 'Switching to Suno v5',
  gemini: 'Switching to Nano Banana',
  vercel: 'Deploying on Vercel',
  github: 'Connecting to GitHub',
  superbot: 'Switched to Superbot',
};

// one request: the app that answers, its beat module, the chip that routes to it (opts.chip relabels it for a script
// dispatch or a hand-back, opts.carry is the file it hands over), and the beat's own options
const step = (app, mod, opts = {}) => ({ app, mod, opts, chips: [[app, opts.chip || CHIP[app], opts.carry]] });
// one request answered by several models at once: a chip per model, and the reply signed by all of them
const together = (apps, mod, opts = {}) => ({
  app: apps[apps.length - 1], who: apps, mod, opts,
  chips: apps.map((a, i) => [a, (opts.chipLabels && opts.chipLabels[i]) || (i === 0 ? CHIP[a] : `Running ${APPS[a].name} in parallel`)]),
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

// The one published routing. This ad ships a single cut: the nine steps are one build in the order the work happened,
// with the two relays (juno.glb to HY-Motion, 23 assets back to Opus) and the parallel sound fork as its shape, and
// it ends on real Inkwave gameplay trimmed from a bit into the post. There is no second routing to compare against.
export const VARIANTS = {
  '1': variant([
    step('opus', script),
    step('deepseek', scrape, { chip: 'Script §1 → DeepSeek V4 Flash' }),
    step('meshy', meshy, { chip: 'Script §2 → Meshy 5', carry: { name: 'refs/', n: 14 } }),
    step('hymotion', motion, { chip: 'Handing juno.glb to HY-Motion 1.0', carry: { name: 'juno.glb' } }),
    together(['eleven', 'suno'], sound, { chipLabels: ['Script §4 → ElevenLabs', 'Running Suno v5 in parallel'] }),
    step('gemini', art, { chip: 'Script §5 → Nano Banana' }),
    step('opus', code, { chip: 'Back to Claude Opus 5.5 with 23 assets', carry: { name: 'assets/', n: 23 } }),
    step('vercel', deploy),
    step('superbot', play, { say: 'Inkwave is live at inkwave-turf.vercel.app. Ink the plaza.' }),
  ], { hold: 0, chip: 0.2 }),
};
export const VARIANT_KEY = '1';
export const VARIANT = VARIANTS[VARIANT_KEY];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply.
// The pacing is tight on purpose: a routing chip lands SW_OFF after the previous beat ends, resolves in
// chipDur (0.2s), and the app answers 0.02s later, so the hand-off from one model to the next is
// ~0.2s of movement instead of a second of dead air.
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
    k.chips = a.chips.map(([app, label, carry]) => { const c = { app, label, carry, sw: at, swap: at + 0.09, done: at + Math.max(0.16, a.chipDur) }; at = c.done + 0.05; return c; });
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

// A routing chip's label. "Script §2 → Meshy 5" is a script dispatch: the section renders as an ink badge and the
// arrow takes the ad's magenta, so a dispatch never reads like a plain "Switching to X". Anything else is one label.
// ASK_LABEL: /^Script (§\d+) → (.*)$/
const labelParts = (label) => {
  const m = /^Script (§\d+) → (.*)$/.exec(label);
  return m ? { dispatch: true, sec: m[1], text: m[2] } : { dispatch: false, text: label };
};
// the label's markup: shimmering text (chat.css .qc-swl) plus, for a dispatch, the ink badge and the arrow
const labelHtml = (label) => {
  const p = labelParts(label);
  return p.dispatch
    ? `<span class="qc-swl">Script</span><b class="qc-sec">${esc(p.sec)}</b><span class="qc-arrow">→</span><span class="qc-swl">${esc(p.text)}</span>`
    : `<span class="qc-swl">${esc(p.text)}</span>`;
};
// the file a chip hands over: a paper icon, the name, and how many (refs/ (14), juno.glb, assets/ (23))
const FILE_ICON = '<svg class="qc-att-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/></svg>';
const carryHtml = (carry) => carry
  ? `<span class="qc-att">${FILE_ICON}<b class="qc-att-n">${esc(carry.name)}</b>${carry.n ? `<em class="qc-att-c">(${carry.n})</em>` : ''}</span>`
  : '';

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
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${carryHtml(c.carry)}${tile(c.app)}<span class="qc-lb">${labelHtml(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), tile: w.querySelector('.qc-tile'), att: w.querySelector('.qc-att'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    // a parallel request is signed by every model on it: stacked tiles, names joined, "in parallel"
    const who = k.who || [k.app];
    const sign = who.length > 1
      ? `<span class="qc-duo">${who.map((w) => tile(w)).join('')}</span><b>${who.map((w) => APPS[w].name).join(' + ')}</b><small>in parallel</small>`
      : `${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}`;
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
  const pImg = el(`<img alt="" src="${APPS.opus.logo}" data-app="opus"/>`);
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.opus.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  const chat = {
    hub, pointer, feed, inner, beats, scroll,
    plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'opus',
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
  let app = 'opus', swap = -1;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap) { app = ch.app; swap = ch.swap; } }));
  // platform chip: dips out, swaps, comes back
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
  s.tile.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
  // the carried file slides in from the chip's left edge as the chip lands, so the chip reads as a hand-off
  if (s.att) {
    const p = outCubic(seg(t, k.sw + 0.06, k.sw + 0.4));
    s.att.style.opacity = p.toFixed(3);
    s.att.style.transform = `translateX(${((1 - p) * -14).toFixed(2)}px)`;
  }
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