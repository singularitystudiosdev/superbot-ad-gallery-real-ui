// Lens Lab: every model, one chat (lenslab-every-model-superbot, forked from fantasy90s-every-model-superbot ?v=3).
// Theme: camera focus. The one ask ("build a lens lab that explains camera focus") is typed into the composer and
// sent, superbot routes it, and every switch between models is a camera move:
//   - each routing chip is a FOCUS PULL: its label racks from soft to sharp while a six-blade aperture iris turns and
//     stops down, then opens onto the check;
//   - the composer's platform chip RACK-FOCUSES from the old model to the new one (the old name blurs out as the new
//     one sharpens in);
//   - the thread keeps a DEPTH OF FIELD: the plane of focus sits on the active beat and the rows above it fall
//     progressively soft, the plane easing down the thread at each switch; at the finale everything but the play
//     window defocuses, so the Lens Lab clip is the one sharp plane.
// The routed models answer with their own beats: music.js (Lyria 2), assets.js (Meshy), art.js (Gemini), code.js
// (Claude Opus 5.5), scrape.js (DeepSeek V4 Flash), git.js (GitHub), play.js (Claude Opus 5.5, the clip).
// The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of
// the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
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

// the one ask the whole spot is about: typed once, then superbot carries the rest of the build forward
export const ASK = 'build a lens lab that explains camera focus';
// the source ad's 26-character ask was typed in min(0.85, 0.15 + 26 * 0.013) s. This ask is typed in that same
// window, so the send, every routing chip and every beat after it keep the source's clock exactly.
const TYPE_DUR = Math.min(0.85, 0.15 + 26 * 0.013);

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' }, // the composer's model before the first route
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  lyria: { name: 'Lyria 2', logo: brand('gemini-logo.svg'), sub: 'in superbot' }, // Google's music model, Gemini mark
  meshy: { name: 'Meshy', logo: brand('meshy-icon.png'), sub: 'in superbot' },    // text/image to 3D mesh model
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  github: { name: 'GitHub', logo: brand('github-logo.svg'), sub: 'connected' },
};

// the routing chip superbot lands when it sends a request to an app: a focus pull onto that model, named exactly
const CHIP = {
  lyria: `Focusing on ${APPS.lyria.name}`,
  meshy: `Racking focus to ${APPS.meshy.name}`,
  gemini: `Pulling focus to ${APPS.gemini.name}`,
  opus: `Racking focus to ${APPS.opus.name}`,
  deepseek: `Pulling focus to ${APPS.deepseek.name}`,
  github: `Focus locked. Handing off to ${APPS.github.name}`,
};

// one request: the app that answers, its beat module, the chip that routes to it (opts.chip relabels it, for the
// hand-back), and the beat's own options
const step = (app, mod, opts = {}) => ({ app, mod, opts, chips: [[app, opts.chip || CHIP[app]]] });
// only the first request is asked; the rest are superbot carrying the build forward on its own. pace.hold is the
// pause after a beat before the next switch, pace.chip how long a routing chip works before it resolves
const variant = (steps, pace) => steps.map((s, i) => ({
  ...s,
  ...(i === 0 ? { ask: ASK } : {}),
  hold: pace.hold,
  chipDur: pace.chip,
}));

// the one routing (the source's ?v=3): 7 requests, rapid. Lyria scores the lab, Meshy builds the lens, Gemini paints
// the focus plates, Opus writes the optics, DeepSeek scrapes the glass catalogs, GitHub takes the push, Opus launches.
export const VARIANTS = {
  '3': variant([
    step('lyria', music),
    step('meshy', assets),
    step('gemini', art),
    step('opus', code, { set: 'world' }),
    step('deepseek', scrape),
    step('github', git),
    step('opus', play, { chip: `Back in focus: ${APPS.opus.name}` }),
  ], { hold: 0, chip: 0.18 }),
};
// ?v=3 is the published ad; a missing or unknown v plays it too
export const VARIANT_KEY = (() => { const v = new URLSearchParams(location.search).get('v'); return VARIANTS[v] ? v : '3'; })();
export const VARIANT = VARIANTS[VARIANT_KEY];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply.
// The pacing is tight on purpose: a routing chip lands just after the previous beat ends, resolves in chipDur,
// and the app answers 0.02s later, so the hand-off from one model to the next is ~0.2s of movement.
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    if (a.ask) {
      k.typeEnd = s + TYPE_DUR;
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.15;   // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.02;        // superbot carries on without being asked
    }
    // each chip lands, moves the platform chip to its app (swap) and resolves (done); the next lands just after
    let at = k.sw;
    k.chips = a.chips.map(([app, label]) => { const c = { app, label, sw: at, swap: at + 0.09, done: at + Math.max(0.16, a.chipDur) }; at = c.done + 0.05; return c; });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.02;  // the app answers
    k.T = a.mod.times(k.reply, a.opts);
    s = k.T.end + a.hold;     // the pause before the next switch
    return { k };
  });
}
export const BEATS = timeBeats(VARIANT);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.2;

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// the routing chip's working indicator: a six-blade aperture iris (UI furniture, drawn per frame by irisPaths)
const IRIS = '<svg class="qc-iris" viewBox="-12 -12 24 24"><path class="qc-ir-leaf" fill-rule="evenodd"/><circle class="qc-ir-ring" r="10.5"/><path class="qc-ir-blade"/></svg>';
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
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc };

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      // the label sits in its own box (.qc-swf) so the rack's blur and breathing scale do not fight the shimmer's
      // background-clip:text on .qc-swl
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw">${tile(c.app)}<span class="qc-swf"><span class="qc-swl">${esc(c.label)}</span></span><span class="qc-st">${IRIS}${OK}</span></span></div></div>`);
      return {
        c, w, sw: w.querySelector('.qc-sw'), lf: w.querySelector('.qc-swf'),
        iris: w.querySelector('.qc-iris'), leaf: w.querySelector('.qc-ir-leaf'), blade: w.querySelector('.qc-ir-blade'),
        ok: w.querySelector('.qc-st .qc-ok'),
      };
    });
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who">${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    return { k, u, sws, r, who: main.firstElementChild, inst };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the finale's sharp plane: the node that holds the clip (a <video>) and anything the beat puts after it (a
  // caption) stay in focus; the nodes before it go soft once the window starts landing (its first scroll mark)
  const last = beats[beats.length - 1];
  const wi = last.inst.nodes.findIndex((n) => n.matches('video') || !!n.querySelector('video'));
  let fin = null;
  if (wi >= 0) {
    const sharp = last.inst.nodes.slice(wi);
    const at = last.inst.marks.filter(([, n]) => sharp.includes(n)).map(([a]) => a);
    const a0 = at.length ? Math.min(...at) : last.k.reply;
    fin = { soft: last.inst.nodes.slice(0, wi), a0, a1: Math.max(a0 + 0.35, at.length ? Math.max(...at) : a0) };
  } else console.error('chat.js: the finale beat has no <video> node, so the finale depth of field is off');

  // the composer's platform chip names the model, then racks focus to each routed app: one stacked icon and one
  // stacked name per app, crossfaded (never re-sourced), so any frame is a pure function of t
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pLabel = el('<span class="qc-pl"></span>');
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);
  const apps = [...new Set(['codex', ...BEATS.flatMap(({ k }) => k.chips.map((ch) => ch.app))])];
  const plats = Object.fromEntries(apps.map((app) => {
    const pic = el(`<img alt="" src="${APPS[app].logo}" data-app="${app}"/>`);
    const name = el(`<span>${esc(APPS[app].name)}</span>`);
    pIcon.appendChild(pic);
    pLabel.appendChild(name);
    return [app, { pic, name }];
  }));

  const ph = hub.querySelector('.rc-ph');
  const chat = {
    hub, pointer, feed, inner, beats, scroll, fin,
    plat, pLabel, plats, rc: hub.querySelector('.rc'),
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null,
  };
  return chat;
}

function appear(n, t, a, dy = 10, op = 1) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = (p * op).toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

// a defocus of b px (none when sharp, so a sharp row carries no filter at all)
function focus(n, b) {
  if (n) n.style.filter = b > 0.005 ? `blur(${b.toFixed(2)}px)` : 'none';
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

// the platform chip's rack focus runs over the source's swap window, swap - RACK to swap + RACK
const RACK = 0.14;
const RACK_NAME_BLUR = 3, RACK_ICON_BLUR = 2, RACK_BREATH = 0.04, RACK_FEATHER = 10;
function renderRouting(c, t) {
  // the last chip whose rack has begun racks from the app before it to its own
  let from = 'codex', to = 'codex', swap = -1;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => { if (t >= ch.swap - RACK) { from = to; to = ch.app; swap = ch.swap; } }));
  const e = swap < 0 || from === to ? 1 : inOutCubic(seg(t, swap - RACK, swap + RACK));
  for (const [app, p] of Object.entries(c.plats)) {
    const isTo = app === to, isFrom = app === from && from !== to;
    const op = isTo ? e : isFrom ? 1 - e : 0;
    const soft = isTo ? 1 - e : isFrom ? e : 1; // 0 is in focus, 1 fully defocused
    const vis = op > 0.001 ? 'visible' : 'hidden';
    p.pic.style.visibility = p.name.style.visibility = vis;
    p.pic.style.opacity = p.name.style.opacity = op.toFixed(3);
    focus(p.pic, RACK_ICON_BLUR * soft);
    focus(p.name, RACK_NAME_BLUR * soft);
    p.name.style.transform = soft > 0.001 && op > 0.001 ? `scale(${(1 + RACK_BREATH * soft).toFixed(4)})` : 'none';
  }
  // the names are stacked in one grid cell, so the chip's width is set explicitly: it eases from the old name's
  // width to the new one's over the same rack instead of jumping. It leads when the chip widens and lags when it
  // narrows, so whichever name is the wider one has its room while it is the more visible
  const wFrom = c.plats[from].name.offsetWidth, wTo = c.plats[to].name.offsetWidth;
  const x = swap < 0 || from === to ? 1 : seg(t, swap - RACK, swap + RACK);
  const ew = wTo >= wFrom ? outCubic(x) : 1 - outCubic(1 - x);
  c.pLabel.style.width = `${lerp(wFrom, wTo, ew).toFixed(2)}px`;
  // the name box clips at that width (chat.css), so the wider name never runs under the chevron; while the rack runs
  // its right edge feathers out instead of cutting the blurred glyphs hard
  const fe = swap < 0 || from === to ? 0 : RACK_FEATHER * bump(x);
  const mask = fe > 0.05 ? `linear-gradient(90deg, #000 calc(100% - ${fe.toFixed(2)}px), transparent)` : 'none';
  c.pLabel.style.webkitMaskImage = c.pLabel.style.maskImage = mask;
  const pop = swap < 0 ? 1 : 1 + 0.05 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

// the iris: six straight blade edges, each running from one corner of the hexagonal aperture (circumradius a) along
// the next side out to the barrel ring; the leaves are the ring with the aperture cut out of it
const IRIS_R = 10.5, IRIS_OPEN = 7.4, IRIS_STOP = 2.6;
const f2 = (v) => v.toFixed(2);
function irisPaths(a, rot) {
  const V = [];
  for (let i = 0; i < 6; i++) { const th = rot + (i * Math.PI) / 3; V.push([a * Math.cos(th), a * Math.sin(th)]); }
  let blade = '', hole = '';
  V.forEach(([x, y], i) => {
    const [nx, ny] = V[(i + 1) % 6];
    const L = Math.hypot(nx - x, ny - y) || 1, dx = (nx - x) / L, dy = (ny - y) / L;
    const b = x * dx + y * dy, s = -b + Math.sqrt(Math.max(0, b * b - (x * x + y * y - IRIS_R * IRIS_R)));
    blade += `M${f2(x)} ${f2(y)}L${f2(x + s * dx)} ${f2(y + s * dy)}`;
    hole += `${i ? 'L' : 'M'}${f2(x)} ${f2(y)}`;
  });
  const R = IRIS_R;
  return { blade, leaf: `M${R} 0A${R} ${R} 0 1 0 ${-R} 0A${R} ${R} 0 1 0 ${R} 0Z${hole}Z` };
}

// the label's focus pull. The chip row rises out from behind the composer on the scroll glide (sw to sw + 0.3) and
// is fully clear of it PULL_CLEAR after it lands (measured: about half visible at sw + 0.13, whole at sw + 0.18), so
// the label holds full defocus while it rises, then pulls sharp over PULL_CLEAR to done + PULL_END: eased in (the
// squared clock), snapping through focus with outBack's hunt past it, and settling. The check still resolves at done.
const PULL_BLUR = 2.4, PULL_SCALE = 0.02, PULL_CLEAR = 0.18, PULL_END = 0.25;
function renderSwitch(s, t) {
  const k = s.c;
  s.sw.classList.toggle('qc-done', t >= k.done);
  s.sw.style.setProperty('--sh', `${(100 - ((t - k.sw) * 140) % 200).toFixed(1)}%`);
  const q = seg(t, k.sw + PULL_CLEAR, k.done + PULL_END);
  const pull = 1 - outBack(q * q); // 1 = fully defocused, 0 = in focus; slightly negative on the hunt
  s.lf.style.filter = Math.abs(pull) > 0.002 ? `blur(${(PULL_BLUR * Math.abs(pull)).toFixed(2)}px)` : 'none';
  s.lf.style.transform = Math.abs(pull) > 0.002 ? `scale(${(1 + PULL_SCALE * pull).toFixed(4)})` : 'none';
  // working: the iris turns and stops down; at done it opens wide onto the check and fades (the source spinner's
  // fade window)
  const open = seg(t, k.done - 0.08, k.done + 0.06);
  const a = lerp(lerp(IRIS_OPEN, IRIS_STOP, outCubic(seg(t, k.sw, k.done))), IRIS_R, inOutCubic(open));
  const ip = irisPaths(a, ((t - k.sw) * 300 - 90) * (Math.PI / 180));
  s.leaf.setAttribute('d', ip.leaf);
  s.blade.setAttribute('d', ip.blade);
  s.iris.style.opacity = (1 - open).toFixed(3);
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.45));
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

// the thread's depth of field. The plane of focus is an eased beat index: it steps down the thread at each switch
// (a routing chip landing) over FOCUS_MOVE of t. A row d beats above the plane is defocused by min(1.4, 0.6 d) px and
// dimmed to max(0.7, 1 - 0.1 d); the active beat (the one being read) is always sharp. At the finale (fin 0 to 1)
// everything but the play window racks out to FIN_BLUR, so the clip is the one sharp plane.
const FOCUS_MOVE = 0.35, DOF_STEP = 0.6, DOF_MAX = 1.4, DOF_DIM = 0.1, DOF_FLOOR = 0.7, FIN_BLUR = 2, FIN_DIM = 0.8;
function planeAt(c, t) {
  let p = 0;
  for (let i = 1; i < c.beats.length; i++) { const a = c.beats[i].k.sw; p += outCubic(seg(t, a, a + FOCUS_MOVE)); }
  return p;
}
function dof(d, fin) {
  return {
    blur: lerp(Math.min(DOF_MAX, DOF_STEP * d), FIN_BLUR, fin),
    op: Math.min(Math.max(DOF_FLOOR, 1 - DOF_DIM * d), lerp(1, FIN_DIM, fin)),
  };
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
  const plane = planeAt(c, t);
  const fin = c.fin ? inOutCubic(seg(t, c.fin.a0, c.fin.a1)) : 0;
  const lastJ = c.beats.length - 1;
  c.beats.forEach((b, j) => {
    const f = dof(Math.max(0, plane - j), fin);
    if (b.u) { appear(b.u, t, b.k.send, 10, f.op); focus(b.u, f.blur); }
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw, 10, f.op); focus(s.w, f.blur); renderSwitch(s, t); });
    if (j === lastJ && c.fin) {
      // the finale's reply holds the sharp plane, so it is not blurred as a row: its signature and the nodes before
      // the window go soft one by one (after the beat renders, and only while fin > 0, so the beat's own styles
      // stand everywhere else; the flag lets a backward seek hand the filter back)
      appear(b.r, t, b.k.reply);
      focus(b.r, 0);
      b.who.style.opacity = f.op.toFixed(3);
      focus(b.who, f.blur);
      c.fin.soft.forEach((n) => { if (n.dataset.qcFin) { n.style.filter = ''; delete n.dataset.qcFin; } });
      b.inst.render(t);
      if (fin > 0) c.fin.soft.forEach((n) => { focus(n, f.blur); n.dataset.qcFin = '1'; });
    } else {
      appear(b.r, t, b.k.reply, 10, f.op);
      focus(b.r, f.blur);
      b.inst.render(t);
    }
  });
  focus(c.rc, FIN_BLUR * fin);
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
