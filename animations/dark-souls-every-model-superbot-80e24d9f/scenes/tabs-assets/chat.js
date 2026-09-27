// The chat for "make Dark Souls", one model per request, strictly one after another. The ask is typed into the composer
// and sent, superbot routes it (its routing chip and the composer's platform chip follow the model), and the routed
// model answers with its own beat (./beats/{audio,assets,build,art,render,preview,git,play}.js). Coding is always
// Claude Opus 5.5 and always shown as a result card (build.js), never as code. ?v= picks a VARIANTS entry: which models
// run, in what order and how briskly their routing chips land, one ad per variant, all sharing the same ask and hub.
// Each request is routed the moment the previous beat lands: there are no idle holds between beats. A step can
// continue the app the previous step used (cont: no chip, no new header, the beat just follows). The thread is
// bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function of the scene's
// local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outQuint, outBack, inOutCubic, inOutQuint, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import git from './beats/git.js?v=2';
import art from './beats/art.js?v=2';
import play from './beats/play.js?v=1';
import audio from './beats/audio.js?v=3';
import assets from './beats/assets.js?v=2';
import build from './beats/build.js?v=1';
import render from './beats/render.js?v=2';
import preview from './beats/preview.js?v=2';
// v4 beats
import opusLapse from './beats/opus-lapse.js?v=2';
import dsSearch from './beats/ds-search.js?v=2';
import meshy from './beats/meshy.js?v=2';
import hailuo from './beats/hailuo.js?v=2';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about: typed once, then superbot carries the rest of the build forward
export const ASK = 'make Dark Souls';

const APPS = {
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  eleven: { name: 'ElevenLabs', logo: brand('elevenlabs-logo.svg'), sub: 'in superbot' },
  github: { name: 'GitHub', logo: brand('github-logo.svg'), sub: 'connected' },
  meshy: { name: 'Meshy 5', logo: brand('meshy-logo.svg'), sub: 'in superbot' },
  hailuo: { name: 'MiniMax Hailuo 02', logo: brand('minimax-logo.svg'), sub: 'in superbot' },
  superbot: { name: 'Superbot', logo: null, sub: '' }, // drawn as its mark in CSS (SB_MARK, chat.css .sbm), not an image
};

// the routing chip superbot lands when it sends a request to an app
const CHIP = {
  deepseek: 'Switching to DeepSeek V4 Flash',
  opus: 'Switching to Claude Opus 5.5',
  gemini: 'Switching to Gemini',
  eleven: 'Switching to ElevenLabs',
  github: 'Connecting to GitHub',
  meshy: 'Switching to Meshy 5',
  hailuo: 'Switching to MiniMax Hailuo 02',
  superbot: 'Switched to Superbot',
};
// one request: the app that answers, its beat module, the chip that routes to it, and the beat's own options.
// opts.cont = true continues the previous app with no chip and no new reply header.
const step = (app, mod, opts = {}) => ({ app, mod, opts, cont: !!opts.cont, chips: opts.cont ? [] : [{ app, label: CHIP[app] }] });
// only the first request is asked; the rest are superbot carrying the build forward on its own.
// pace = the variant's chip scale: every routing chip's own timings (swap 0.22, done 0.65, gap 0.12) stretch with it,
// so one variant cuts brisk and another deliberate. No step waits after its beat: the next one routes at once.
const variant = (steps, pace) => steps.map((s, i) => ({ ...s, ask: i === 0 ? ASK : undefined, chip: pace }));

// the three published routings, one ad each (?v=1..3). They differ in the first model and first card, in how many
// switches they take, in the cards shown and in pace:
// v1, three fast switches: ElevenLabs voices the boss, Opus builds the whole game, Superbot plays it.
// v2, five even switches: Gemini paints the Gatewarden, Opus builds the boss fight and flags a missing texture,
//     Gemini paints that texture, GitHub takes the push, Superbot renders a trailer and then plays.
// v3, seven deliberate switches: Opus builds combat against its tests, DeepSeek lists the assets, ElevenLabs scores
//     it, Gemini paints the world, Opus puts up a live preview, GitHub takes the push, Superbot plays.
export const VARIANTS = {
  '1': variant([
    step('eleven', audio, { kind: 'voice' }),
    step('opus', build, {
      say: 'Built Dark Souls around that voice.', title: 'Dark Souls',
      rows: [['Combat', 'stamina, roll, parry'], ['Gatewarden, the Last Oath', 'three phases, voiced'], ['The Outer Ward', 'bonfires and respawns']],
      files: 38, tests: 41, stagger: 0.17,
    }),
    step('superbot', play),
  ], 0.7),

  '2': variant([
    step('gemini', art, { lead: 'ds/art-2.jpg' }),
    step('opus', build, {
      say: 'Built the Gatewarden fight.', title: 'Gatewarden, the Last Oath', mono: true,
      rows: [['boss-fsm.ts', 'three phases'], ['telegraph.ts', 'greatsword arcs'], ['bridge.ts', "Warden's Bridge"], ['fog-gate.ts', 'texture missing', true]],
      files: 4, tests: 18, stagger: 0.2,
    }),
    step('gemini', art, { single: { src: 'ds/art-4.jpg', cap: 'Fog gate texture', say: 'Painted the fog gate texture.' } }),
    step('github', git),
    step('superbot', render),
    step('superbot', play, { cont: true }),
  ], 1),

  '3': variant([
    step('opus', build, {
      say: 'Built stamina and roll. Tests pass.', title: 'Combat', mono: true,
      rows: [['stamina.ts', 'drain on roll, regen'], ['roll.ts', '12 i-frames'], ['parry.ts', 'riposte window']],
      files: 3, tests: 3, bar: true, stagger: 0.26,
    }),
    step('deepseek', assets),
    step('eleven', audio),
    step('gemini', art),
    step('opus', preview),
    step('github', git),
    step('superbot', play),
  ], 1.2),

  // v4, the remake: Opus cooks through the codebase as a timelapse, DeepSeek searches for reference assets, Meshy turns
  // them into real 3D meshes, MiniMax Hailuo animates the characters, ElevenLabs scores it, GitHub, Superbot plays.
  '4': variant([
    step('opus', opusLapse),
    step('deepseek', dsSearch),
    step('meshy', meshy),
    step('hailuo', hailuo),
    // markRows: at the tight v4 frame the score card's own rows are the smallest thing on screen; without a scroll stop
    // per row, rows 2 and 3 land below the composer and wait there for the git beat. v1-v3 never pass it.
    step('eleven', audio, { markRows: true }),
    step('github', git),
    step('superbot', play),
  ], 1),
};
export const VARIANT_KEY = (() => { const v = new URLSearchParams(location.search).get('v'); return VARIANTS[v] ? v : '1'; })();
export const VARIANT = VARIANTS[VARIANT_KEY];

// v4 (this remake) is the only variant that takes the longer motion eases; every other variant runs exactly the code
// path it shipped with, so v1-v3 frames are untouched. v4 used to punch the camera in on every model switch; that is
// gone, and the switch is read off the camera's one steady, tighter frame instead (tabs.js geo, W/2).
const V4 = VARIANT_KEY === '4';

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply. W = the
// variant's chip scale: the chip's own beats (swap, done, and the gap before the next chip) all stretch with it.
// A continue step has no chip at all, so its beat simply follows the previous one.
function timeBeats(asks) {
  let s = CHAT_T0;
  return asks.map((a) => {
    const k = { ...a, s };
    const W = a.chip;
    if (a.ask) {
      k.typeEnd = s + Math.min(0.85, 0.15 + a.ask.length * 0.013);
      k.send = k.typeEnd + 0.15;
      k.sw = k.send + 0.35;   // superbot's first routing chip lands
    } else {
      k.typeEnd = k.send = s;
      k.sw = s + 0.06;        // superbot routes the next request as the last beat lands
    }
    // the chip lands, moves the platform chip to its app (swap) and resolves (done)
    k.chips = a.chips.map((c) => ({ ...c, sw: k.sw, swap: k.sw + 0.22 * W, done: k.sw + 0.65 * W }));
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
  // one routing chip: its app tile, the label, and the spinner that resolves into a check
  const chipHtml = (c) => `<span class="qc-sw">${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${OK}</span></span>`;
  const mount = ({ k }) => {
    const a = APPS[k.app];
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    let sws = [];
    if (k.chips.length) {
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main">${chipHtml(k.chips[0])}</div></div>`);
      sws = k.chips.map((c, i) => {
        const sw = w.querySelectorAll('.qc-sw')[i];
        return { c, w, sw, spin: sw.querySelector('.qc-spin'), ok: sw.querySelector('.qc-ok') };
      });
    }
    // the reply header: the app that answered, then the beat's own nodes
    const who = `${tile(k.app)}<b>${a.name}</b>${a.sub ? `<small>${a.sub}</small>` : ''}`;
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
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span>${APPS.superbot.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);

  const ph = hub.querySelector('.rc-ph');
  return {
    hub, pointer, site, feed, inner, beats, scroll, plat, pIcon, pImg, pMark, pLabel,
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null, lastApp: 'superbot',
  };
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
  const head = s.sw.firstElementChild;
  head.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
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