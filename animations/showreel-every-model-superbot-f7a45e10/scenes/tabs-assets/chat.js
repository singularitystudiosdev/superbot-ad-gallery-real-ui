// Showreel: every model, one chat (showreel-every-model-superbot, forked from a retheme of
// fantasy90s-every-model-superbot ?v=3). Theme: motion design. The one ask ("make a 15-second motion graphics
// showreel. go all out.") is typed into the composer and sent, superbot routes it, and every switch between models is
// a motion-graphics move:
//   - each routing chip is a KEYFRAME EASE: its label, named for an editing transition, sets as kinetic type (every
//     glyph rises out of a baseline mask on a staggered outBack overshoot) while a tiny graph editor rides a keyframe
//     diamond along a cubic-bezier ease curve; at done the diamond lands, fills and hands over to the check;
//   - the composer's platform chip PERFORMS the transition its chip names on the old and new model: a hard cut (one
//     frame of signal-orange underline), a match cut (the icons scale-match), a wipe (a signal-orange bar sweeps left
//     to right), a keyframe (the name pops up from 0.9 with overshoot and a diamond ticks), a whip (horizontal
//     motion blur) or a dissolve;
//   - the thread carries MOTION BLUR: every scroll glide blurs it vertically in proportion to its velocity, and the
//     rows above the playhead dim a little; at the finale the thread and the composer dim and desaturate, so the clip
//     window is the one bright plane.
// The routed models answer with their own beats: music.js (Lyria 2), assets.js (Meshy), art.js (Gemini), code.js
// (Claude Opus 5.5), scrape.js (DeepSeek V4 Flash), git.js (GitHub), play.js (Claude Opus 5.5 and GPT 6 Astra, the
// clip). The thread is bottom-anchored so every message rises out of the composer. renderChat(c, t) is a pure function
// of the scene's local time. ?v= on the beat imports busts GitHub Pages' 10-minute module cache on republish.
import { clamp, lerp, seg, outCubic, outQuint, outBack, inOutCubic, esc, boxIn, placeCursor } from '../../lib.js';
import { makeCursor } from '../../shell.js';
import assets from './beats/assets.js?v=3';
import code from './beats/code.js?v=4';
import git from './beats/git.js?v=4';
import art from './beats/art.js?v=4';
import music from './beats/music.js?v=6';
import play from './beats/play.js?v=4';
import scrape from './beats/scrape.js?v=3';

const brand = (f) => new URL('../../brand/' + f, import.meta.url).href;
const img = (f) => new URL('../../img/' + f, import.meta.url).href;
const bump = (p) => Math.sin(Math.PI * clamp(p));
const inCubic = (x) => x * x * x;
const f2 = (v) => v.toFixed(2);

export const CHAT_T0 = 1.6; // the empty state has settled; the first ask starts typing

// the one ask the whole spot is about: typed once, then superbot carries the rest of the build forward
export const ASK = 'make a 15-second motion graphics showreel. go all out.';
// the source ad typed its 26-character ask at 0.15 + 0.013 s per character. This ask keeps that rate up to the source's
// own 0.85 s cap (54 characters land on it), so the typing reads, and every clock after the send stays as tight
const TYPE_DUR = Math.min(0.85, 0.15 + ASK.length * 0.013);

const APPS = {
  codex: { name: 'GPT-5 Codex', logo: brand('openai-logo.svg'), sub: '' }, // the composer's model before the first route
  gemini: { name: 'Gemini', logo: brand('gemini-logo.svg'), sub: 'in superbot' },
  lyria: { name: 'Lyria 2', logo: brand('gemini-logo.svg'), sub: 'in superbot' }, // Google's music model, Gemini mark
  meshy: { name: 'Meshy', logo: brand('meshy-icon.png'), sub: 'in superbot' },    // text/image to 3D mesh model
  deepseek: { name: 'DeepSeek V4 Flash', logo: brand('deepseek-logo.svg'), sub: 'in superbot' },
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), sub: 'in superbot' },
  astra: { name: 'GPT 6 Astra', logo: brand('openai-logo.svg'), sub: 'in superbot' },
  github: { name: 'GitHub', logo: brand('github-logo.svg'), sub: 'connected' },
};

// the routing chip superbot lands when it sends a request to an app: [label, transition]. The label names an editing
// transition onto that model, and the composer's platform chip performs that same transition (renderRouting)
const CHIP = {
  lyria: [`Cut to ${APPS.lyria.name}`, 'cut'],
  meshy: [`Match cut to ${APPS.meshy.name}`, 'match'],
  gemini: [`Wipe to ${APPS.gemini.name}`, 'wipe'],
  opus: [`Keyframe: ${APPS.opus.name}`, 'key'],
  deepseek: [`Whip to ${APPS.deepseek.name}`, 'whip'],
  github: [`Final cut. Handing off to ${APPS.github.name}`, 'final'],
};

// one request: the app that answers, its beat module, the chips that route to it and the beat's own options.
// opts.chips replaces the default chip with several [app, label, transition] triples, landed end to end (the finale
// routes the same prompt to two models); opts.who lists the apps its reply header names
const step = (app, mod, opts = {}) => ({ app, mod, opts, chips: opts.chips || [[app, ...CHIP[app]]] });
// only the first request is asked; the rest are superbot carrying the build forward on its own. pace.hold is the
// pause after a beat before the next switch, pace.chip how long a routing chip works before it resolves
const variant = (steps, pace) => steps.map((s, i) => ({
  ...s,
  ...(i === 0 ? { ask: ASK } : {}),
  hold: pace.hold,
  chipDur: pace.chip,
}));

// the one routing (the source's ?v=3): 7 requests, rapid. Lyria scores the reel, Meshy builds the assets, Gemini
// paints the art, Opus writes the code, DeepSeek scrapes, GitHub takes the push, and the finale sends the same prompt
// to Claude Opus 5.5 and to GPT 6 Astra (a hard cut onto Opus, then a match cut onto Astra: same prompt, same frame)
export const VARIANTS = {
  '3': variant([
    step('lyria', music),
    step('meshy', assets),
    step('gemini', art),
    step('opus', code, { set: 'world' }),
    step('deepseek', scrape),
    step('github', git),
    step('opus', play, {
      chips: [
        ['opus', `Same prompt to ${APPS.opus.name}`, 'cut'],
        ['astra', `Same prompt to ${APPS.astra.name}`, 'match'],
      ],
      who: ['opus', 'astra'],
    }),
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
    k.chips = a.chips.map(([app, label, fx = 'final']) => {
      const c = { app, label, fx: FX[fx] ? fx : 'final', sw: at, swap: at + 0.09, done: at + Math.max(0.16, a.chipDur) };
      at = c.done + 0.05;
      return c;
    });
    k.done = k.chips[k.chips.length - 1].done;
    k.reply = k.done + 0.02;  // the app answers
    k.T = a.mod.times(k.reply, a.opts);
    s = k.T.end + a.hold;     // the pause before the next switch
    return { k };
  });
}

// each transition's window on the composer's platform chip, [before, after] its chip's swap. A hard cut has nothing
// before the swap frame; a keyframe's overshoot settles long after it
const FX = {
  cut: [0, 0.14],
  match: [0.12, 0.12],
  wipe: [0.14, 0.14],
  key: [0.06, 0.34],
  whip: [0.12, 0.12],
  final: [0.14, 0.14],
};

export const BEATS = timeBeats(VARIANT);
export const CHAT_END = BEATS[BEATS.length - 1].k.T.end + 0.2;

export const OK = '<svg class="qc-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// the routing chip's working indicator: a tiny graph editor. The overshooting ease cubic-bezier(0.34, 1.56, 0.64, 1)
// drawn from its first keyframe (3, 19) to its last (21, 7) with both tangent handles and the value guides; the
// keyframe diamond (.qc-ge-k) is placed per frame by renderSwitch as it rides the curve
const GE = [[3, 19], [9.12, 0.28], [14.52, 7], [21, 7]];
const GRAPH = `<svg class="qc-ge" viewBox="0 0 24 24"><path class="qc-ge-g" d="M1 19H23M1 7H23"/><path class="qc-ge-h" d="M3 19L9.12 0.28M21 7H14.52"/><path class="qc-ge-c" d="M3 19C9.12 0.28 14.52 7 21 7"/><path class="qc-ge-e" d="M3 17.2L4.8 19 3 20.8 1.2 19ZM21 5.2L22.8 7 21 8.8 19.2 7Z"/><path class="qc-ge-k" d="M0 -3.6L3.6 0 0 3.6-3.6 0Z"/></svg>`;
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
let UID = 0; // filter ids stay unique if a page ever mounts two chats

export function mountChat(hub) {
  const uid = ++UID;
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

  // the two directional blurs, each one feGaussianBlur whose stdDeviation is written per frame: the thread's glides
  // blur vertically ("0 s"), the whip horizontally ("s 0"). Zero-size, never display:none (that drops the filter)
  const mbId = `qc-mb-${uid}`, whipId = `qc-whip-${uid}`;
  const defs = el(`<svg class="qc-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
    <filter id="${mbId}" x="-2%" y="-6%" width="104%" height="112%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter>
    <filter id="${whipId}" x="-60%" y="-10%" width="220%" height="120%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter>
  </defs></svg>`);
  hub.appendChild(defs);

  const box = (n) => boxIn(n, root);
  const ctx = { hub, box, tile, OK, esc, el, brand, img, sbSrc };

  // kinetic type: one span per glyph, grouped per word so the spaces stay plain text
  const kin = (s) => s.split(' ').map((w) => `<span class="qc-wd">${[...w].map((g) => `<span class="qc-g">${esc(g)}</span>`).join('')}</span>`).join(' ');

  const sbAvatar = `<span class="avatar sb"><img src="${sbSrc}" alt=""/></span>`;
  const build = ({ k }) => {
    const u = k.ask ? add(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${esc(k.ask)}</div></div></div>`) : null;
    const sws = k.chips.map((c) => {
      // the label box (.qc-swf) is the baseline mask the glyphs rise out of
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw qc-x-${c.fx}">${tile(c.app)}<span class="qc-swf"><span class="qc-swl">${kin(c.label)}</span></span><span class="qc-st">${GRAPH}${OK}</span></span></div></div>`);
      return {
        c, w, sw: w.querySelector('.qc-sw'), gl: [...w.querySelectorAll('.qc-g')],
        ge: w.querySelector('.qc-ge'), key: w.querySelector('.qc-ge-k'), ok: w.querySelector('.qc-st .qc-ok'),
        still: false,
      };
    });
    // the reply header names the app (or apps: the finale's one prompt went to two models)
    const who = (k.opts.who || [k.app]).filter((ap) => APPS[ap]);
    const whoName = who.map((ap) => APPS[ap].name).join(' + ');
    const sub = APPS[who[0]].sub;
    const tiles = who.length > 1 ? `<span class="qc-duo">${who.map((ap) => tile(ap)).join('')}</span>` : tile(who[0]);
    const r = add(`<div class="msg qc-m qc-r">${sbAvatar}<div class="m-main"><div class="qc-who${who.length > 1 ? ' qc-who-duo' : ''}">${tiles}<b>${esc(whoName)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div></div></div>`);
    const main = r.querySelector('.m-main');
    const inst = k.mod.build(k, ctx);
    inst.nodes.forEach((n) => main.appendChild(n));
    // the beats' tool chips speak the routing chip's language: every stock spinner (.ch-tool .spin, which the beat
    // turns with an inline rotate and resolves with .done) becomes the same graph editor, driven in renderSpins
    const spins = [...main.querySelectorAll('.ch-tool .spin')].map((sp) => {
      sp.classList.add('qc-spin');
      sp.innerHTML = GRAPH + OK;
      return { el: sp, key: sp.querySelector('.qc-ge-k') };
    });
    return { k, u, sws, r, who: main.firstElementChild, inst, spins };
  };
  const beats = BEATS.map(build);
  // scroll marks: after each time, the feed's fold glides to that element's bottom
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw, s.w]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the finale's bright plane: the node that holds the clip (a <video>) and anything the beat puts after it (a
  // caption) keep full tone; the nodes before it dim and desaturate once the window starts landing (its first mark)
  const last = beats[beats.length - 1];
  const wi = last.inst.nodes.findIndex((n) => n.matches('video') || !!n.querySelector('video'));
  let fin = null;
  if (wi >= 0) {
    const bright = last.inst.nodes.slice(wi);
    const at = last.inst.marks.filter(([, n]) => bright.includes(n)).map(([a]) => a);
    const a0 = at.length ? Math.min(...at) : last.k.reply;
    fin = { soft: last.inst.nodes.slice(0, wi), a0, a1: Math.max(a0 + 0.35, at.length ? Math.max(...at) : a0) };
  } else console.error('chat.js: the finale beat has no <video> node, so the finale dim is off');

  // the composer's platform chip names the model, then performs each chip's transition onto the routed app: one
  // stacked icon and one stacked name per app (never re-sourced), plus the wipe bar and the cut underline in the name
  // box and the keyframe diamond on the chip, so any frame is a pure function of t
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
  const pWipe = el('<i class="qc-pw" aria-hidden="true"></i>');
  const pCut = el('<i class="qc-pu" aria-hidden="true"></i>');
  pLabel.append(pWipe, pCut);
  const pKey = el('<i class="qc-pk" aria-hidden="true"></i>');
  plat.appendChild(pKey);

  const ph = hub.querySelector('.rc-ph');
  const chat = {
    hub, pointer, feed, inner, beats, scroll, fin,
    plat, pIcon, pLabel, plats, pWipe, pCut, pKey, rc: hub.querySelector('.rc'),
    mbId, mb: defs.querySelector(`#${mbId} feGaussianBlur`),
    whipId, whip: defs.querySelector(`#${whipId} feGaussianBlur`),
    ph, send: hub.querySelector('.rc-send'), phText: ph.textContent, lastPh: null,
  };
  return chat;
}

function appear(n, t, a, dy = 10, op = 1) {
  const p = outCubic(seg(t, a, a + 0.42));
  n.style.opacity = (p * op).toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * dy).toFixed(2)}px)`;
}

// the finale's dim: desaturate and darken by g (0 to 1); none at 0, so a full-tone row carries no filter at all
function tone(n, g) {
  if (n) n.style.filter = g > 0.005 ? `grayscale(${(0.85 * g).toFixed(3)}) brightness(${(1 - 0.32 * g).toFixed(3)})` : 'none';
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

// one stacked app on the platform chip: its name and icon opacity (n, i), transforms (nt, it), filters (nf, if) and
// the icon's clip (ic). Everything not given is reset, so the chip carries nothing from an earlier frame (the clip
// resets to '' rather than 'none' so a mark's own CSS clip, GPT 6 Astra's circle, stands when no wipe is cutting it)
function stage(p, o = {}) {
  const n = clamp(o.n || 0), i = clamp(o.i == null ? n : o.i);
  p.name.style.visibility = n > 0.001 ? 'visible' : 'hidden';
  p.pic.style.visibility = i > 0.001 ? 'visible' : 'hidden';
  p.name.style.opacity = n.toFixed(3);
  p.pic.style.opacity = i.toFixed(3);
  p.name.style.transform = o.nt || 'none';
  p.pic.style.transform = o.it || 'none';
  p.name.style.filter = o.nf || 'none';
  p.pic.style.filter = o.if || 'none';
  p.pic.style.clipPath = o.ic || '';
}

// the transitions, as performed on the platform chip
const CUT_FLASH = 1 / 30;       // the hard cut's underline holds one frame (at 30 fps; two at 60)
const MATCH_SCALE = 0.3;        // the match cut: the old icon grows to this, the new one lands at it and settles
const WHIP_ICON = 7, WHIP_K = 0.22, WHIP_MAX = 8, WHIP_GAP = 14; // whip: icon travel, blur per px/frame, cap
const KEY_FROM = 0.9, KEY_TICK = 0.16, KEY_HOLD = 0.42, KEY_OUT = 0.6;
const WIDTH_CUT = 0.14, FEATHER = 10;
function renderRouting(c, t) {
  // the last chip whose transition has begun moves the chip from the app before it to its own
  let from = 'codex', to = 'codex', ch = null;
  c.beats.forEach(({ k }) => k.chips.forEach((q) => { if (t >= q.swap - FX[q.fx][0]) { from = to; to = q.app; ch = q; } }));
  const live = !!ch && from !== to;
  const fx = live ? ch.fx : null;
  const swap = ch ? ch.swap : -1;
  const u = live ? seg(t, swap - FX[fx][0], swap + FX[fx][1]) : 1;
  const P = c.plats[to], F = c.plats[from];
  for (const p of Object.values(c.plats)) if (p !== P && p !== F) stage(p);
  let bar = 0, whip = 0;
  if (!live) stage(P, { n: 1 });
  else if (fx === 'cut') {
    // a hard cut: the new model is simply there on the swap frame
    stage(F);
    stage(P, { n: 1 });
  } else if (fx === 'match') {
    // a match cut: the old icon swells to the new one's framing, the cut lands on the matched frame, and the new icon
    // settles out of that same scale (the names cut with it)
    const pre = u < 0.5;
    const m = pre ? inCubic(u * 2) : 1 - outCubic((u - 0.5) * 2);
    const st = { n: 1, it: `scale(${(1 + MATCH_SCALE * m).toFixed(4)})`, nt: m > 0.001 ? `scale(${(1 + 0.05 * m).toFixed(4)})` : 'none' };
    stage(pre ? F : P, st);
    stage(pre ? P : F);
  } else if (fx === 'wipe') {
    // a wipe: the bar grows from the left edge over the old name, the names swap under it, and it exits right; the
    // icons wipe across on the same eased edge
    const cover = u < 0.5;
    bar = cover ? inOutCubic(u * 2) : 1 - inOutCubic((u - 0.5) * 2);
    c.pWipe.style.transformOrigin = cover ? 'left center' : 'right center';
    const X = inOutCubic(u) * 100;
    stage(F, { n: cover ? 1 : 0, i: X < 99.9 ? 1 : 0, ic: X > 0.1 ? `inset(0 0 0 ${f2(X)}%)` : 'none' });
    stage(P, { n: cover ? 0 : 1, i: X > 0.1 ? 1 : 0, ic: X < 99.9 ? `inset(0 ${f2(100 - X)}% 0 0)` : 'none' });
  } else if (fx === 'key') {
    // a keyframe: the old name drops out on the frame before, the new one is set and pops up from KEY_FROM on an
    // outBack overshoot (the diamond ticks below)
    const out = 1 - seg(t, swap - FX.key[0], swap);
    stage(F, { n: out, nt: out < 1 ? `scale(${(1 - 0.04 * (1 - out)).toFixed(4)})` : 'none' });
    if (t >= swap) {
      const q = seg(t, swap, swap + FX.key[1]);
      const s = lerp(KEY_FROM, 1, outBack(q)), o = seg(t, swap, swap + 0.08);
      const tr = q < 1 ? `scale(${s.toFixed(4)})` : 'none';
      stage(P, { n: o, nt: tr, it: tr });
    } else stage(P);
  } else if (fx === 'whip') {
    // a whip: the old name accelerates out to the left, the new one decelerates in from the right, and both carry
    // a horizontal blur proportional to their speed (px per 60 fps frame)
    const [pre, post] = FX.whip;
    if (t < swap) {
      const q = seg(t, swap - pre, swap), L = F.name.offsetWidth + WHIP_GAP;
      const e = inCubic(q);
      whip = Math.min(WHIP_MAX, WHIP_K * (3 * L * q * q / pre) / 60);
      const bl = whip > 0.05 ? `url(#${c.whipId})` : 'none';
      stage(F, { n: 1, i: 1 - e, nt: `translateX(${f2(-L * e)}px)`, it: `translateX(${f2(-WHIP_ICON * e)}px)`, nf: bl, if: bl });
      stage(P);
    } else {
      const q = seg(t, swap, swap + post), L = P.name.offsetWidth + WHIP_GAP;
      const e = 1 - outCubic(q);
      whip = Math.min(WHIP_MAX, WHIP_K * (3 * L * (1 - q) * (1 - q) / post) / 60);
      const bl = whip > 0.05 ? `url(#${c.whipId})` : 'none';
      stage(P, { n: 1, i: 1 - e, nt: e > 0.0005 ? `translateX(${f2(L * e)}px)` : 'none', it: e > 0.0005 ? `translateX(${f2(WHIP_ICON * e)}px)` : 'none', nf: bl, if: bl });
      stage(F);
    }
  } else {
    // the final cut: a dissolve
    const e = inOutCubic(u);
    stage(F, { n: 1 - e });
    stage(P, { n: e });
  }
  c.whip.setAttribute('stdDeviation', `${f2(whip)} 0`);
  c.pWipe.style.opacity = bar > 0.001 ? '1' : '0';
  c.pWipe.style.transform = `scaleX(${bar.toFixed(4)})`;
  // the hard cut's one frame of signal-orange underline
  const flash = !!ch && ch.fx === 'cut' && from !== to && t >= swap && t < swap + CUT_FLASH;
  c.pCut.style.opacity = flash ? '1' : '0';
  // the keyframe's diamond: it ticks in (a square turning onto its point with an outBack pop), holds, and fades
  const d = ch && ch.fx === 'key' && from !== to ? t - swap : -1;
  if (d >= 0 && d < KEY_OUT) {
    const q = seg(d, 0, KEY_TICK);
    c.pKey.style.opacity = (1 - seg(d, KEY_HOLD, KEY_OUT)).toFixed(3);
    c.pKey.style.transform = `rotate(${(45 * outCubic(q)).toFixed(2)}deg) scale(${Math.max(0, outBack(q)).toFixed(4)})`;
  } else { c.pKey.style.opacity = '0'; c.pKey.style.transform = 'scale(0)'; }
  // the names are stacked in one grid cell, so the chip's width is set explicitly: it eases from the old name's width
  // to the new one's over the transition instead of jumping (a hard cut snaps in behind its frame). It leads when the
  // chip widens and lags when it narrows, so whichever name is the wider one has its room while it is on screen
  const wFrom = F.name.offsetWidth, wTo = P.name.offsetWidth;
  const x = !live ? 1 : fx === 'cut' ? seg(t, swap, swap + WIDTH_CUT) : u;
  const ease = fx === 'cut' ? outQuint : outCubic;
  const ew = wTo >= wFrom ? ease(x) : 1 - ease(1 - x);
  c.pLabel.style.width = `${lerp(wFrom, wTo, ew).toFixed(2)}px`;
  // the name box clips at that width (chat.css), so the wider name never runs under the chevron; under a dissolve or
  // a whip its right edge feathers out instead of cutting the moving glyphs hard
  const fe = live && (fx === 'final' || fx === 'whip') ? FEATHER * bump(x) : 0;
  const mask = fe > 0.05 ? `linear-gradient(90deg, #000 calc(100% - ${fe.toFixed(2)}px), transparent)` : 'none';
  c.pLabel.style.webkitMaskImage = c.pLabel.style.maskImage = mask;
  const pop = swap < 0 ? 1 : 1 + 0.05 * bump(seg(t, swap, swap + 0.4));
  c.plat.style.transform = pop === 1 ? 'none' : `scale(${pop.toFixed(4)})`;
}

// the routing chip. Its label sets as kinetic type: glyph i rises out of the label box's baseline mask from RISE_AT +
// i * STAG after the chip lands, over RISE on outBack (so each glyph carries just past its baseline and settles), and a
// highlight runs along the glyphs while the chip works. The graph editor's keyframe diamond rides the ease curve by
// its bezier parameter from sw to done (so it visibly overshoots the last keyframe's value and settles onto it), then
// lands: it fills (chat.css, .qc-done), swells and fades with the graph as the check pops in (the source spinner's
// fade window)
const RISE_AT = 0.04, RISE = 0.3, STAG = 0.011, RISE_DY = 110, SHIM = 0.2, SHIM_RATE = 70;
const bez = (u, i) => { const v = 1 - u; return v * v * v * GE[0][i] + 3 * v * v * u * GE[1][i] + 3 * v * u * u * GE[2][i] + u * u * u * GE[3][i]; };
function renderSwitch(s, t) {
  const k = s.c;
  s.sw.classList.toggle('qc-done', t >= k.done);
  const n = s.gl.length;
  const end = Math.max(k.sw + RISE_AT + (n - 1) * STAG + RISE, k.done + SHIM);
  if (t >= end) {
    // settled: the glyphs carry no inline style (cleared once, and again after any backward seek)
    if (!s.still) { s.gl.forEach((g) => { g.style.transform = ''; g.style.opacity = ''; }); s.still = true; }
  } else {
    s.still = false;
    const work = 1 - seg(t, k.done, k.done + SHIM);
    const head = (t - k.sw) * SHIM_RATE - 4;
    s.gl.forEach((g, i) => {
      const a = k.sw + RISE_AT + i * STAG;
      const q = seg(t, a, a + RISE);
      g.style.transform = q >= 1 ? '' : `translateY(${((1 - outBack(q)) * RISE_DY).toFixed(2)}%)`;
      const hl = Math.exp(-((i - head) ** 2) / 5);
      g.style.opacity = work > 0.001 ? (1 - work * 0.5 * (1 - hl)).toFixed(3) : '';
    });
  }
  const u = seg(t, k.sw, k.done);
  const land = outCubic(seg(t, k.done, k.done + 0.14));
  s.key.setAttribute('transform', `translate(${f2(bez(u, 0))} ${f2(bez(u, 1))}) scale(${(1 + 0.6 * land).toFixed(3)})`);
  s.ge.style.opacity = (1 - seg(t, k.done + 0.02, k.done + 0.16)).toFixed(3);
  const o = seg(t, k.done, k.done + 0.3);
  s.ok.style.opacity = o.toFixed(3);
  s.ok.style.transform = `scale(${lerp(0.3, 1, outBack(o)).toFixed(4)})`;
  const tp = outBack(seg(t, k.sw + 0.05, k.sw + 0.45));
  s.sw.firstElementChild.style.transform = `scale(${lerp(0.5, 1, tp).toFixed(4)}) rotate(${((1 - tp) * -25).toFixed(2)}deg)`;
}

// the beats' tool chips, after the beat has rendered: a tool's run has no known length, so its graph editor LOOPS the
// keyframe ride like a playback loop. One pass is one turn of the angle the beat wrote for its stock spinner (itself a
// pure function of t), and that rotation is then taken back off so the graph stays upright; .done lands the diamond on
// the last keyframe and chat.css swaps the graph for the check, exactly as the routing chip resolves
function renderSpins(b) {
  for (const s of b.spins) {
    const m = /rotate\((-?[\d.]+)deg\)/.exec(s.el.style.transform || '');
    const u = s.el.classList.contains('done') ? 1 : m ? (((parseFloat(m[1]) % 360) + 360) % 360) / 360 : 0;
    s.el.style.transform = 'none';
    s.key.setAttribute('transform', `translate(${f2(bez(u, 0))} ${f2(bez(u, 1))})`);
  }
}

// the playhead: an eased beat index that steps down the thread at each switch (a routing chip landing) over HEAD_MOVE
// of t. A row d beats above it is dimmed to max(HEAD_FLOOR, 1 - HEAD_DIM d); the active beat is always at full
// strength. At the finale (fin 0 to 1) everything but the play window dims to FIN_DIM and desaturates (tone), so the
// clip is the one bright plane.
const HEAD_MOVE = 0.35, HEAD_DIM = 0.1, HEAD_FLOOR = 0.7, FIN_DIM = 0.6;
function headAt(c, t) {
  let p = 0;
  for (let i = 1; i < c.beats.length; i++) { const a = c.beats[i].k.sw; p += outCubic(seg(t, a, a + HEAD_MOVE)); }
  return p;
}
const shade = (d, fin) => Math.min(Math.max(HEAD_FLOOR, 1 - HEAD_DIM * d), lerp(1, FIN_DIM, fin));

// bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows up out of
// it (the shift is negative while the thread is shorter than the feed). Each mark glides the fold over GLIDE on
// inOutCubic, and the thread carries a VERTICAL motion blur proportional to the glide's speed: the fold is evaluated
// at t and one 60 fps frame earlier on this frame's layout, and MB_K of that per-frame travel is the blur's
// stdDeviation (capped at MB_MAX). Standing still, the thread carries no filter at all.
const GLIDE = 0.3, MB_DT = 1 / 60, MB_K = 0.12, MB_MAX = 3.5;
function renderScroll(c, t) {
  const memo = new Map();
  const bottom = (n) => {
    let v = memo.get(n);
    if (v === undefined) { const b = boxIn(n, c.inner); v = b.y + b.h; memo.set(n, v); }
    return v;
  };
  const fold = (tt) => {
    let y = 0;
    for (const [a, n] of c.scroll) {
      if (tt <= a) break;
      y = lerp(y, bottom(n), inOutCubic(seg(tt, a, a + GLIDE)));
    }
    return y;
  };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const y = fold(t);
  const s = Math.min(MB_MAX, MB_K * Math.abs(y - fold(t - MB_DT)));
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
  if (s > 0.05) {
    c.mb.setAttribute('stdDeviation', `0 ${f2(s)}`);
    c.inner.style.filter = `url(#${c.mbId})`;
  } else c.inner.style.filter = 'none';
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  const head = headAt(c, t);
  const fin = c.fin ? inOutCubic(seg(t, c.fin.a0, c.fin.a1)) : 0;
  const lastJ = c.beats.length - 1;
  c.beats.forEach((b, j) => {
    const op = shade(Math.max(0, head - j), fin);
    if (b.u) { appear(b.u, t, b.k.send, 10, op); tone(b.u, fin); }
    b.sws.forEach((s) => { appear(s.w, t, s.c.sw, 10, op); tone(s.w, fin); renderSwitch(s, t); });
    if (j === lastJ && c.fin) {
      // the finale's reply holds the bright plane, so it is not dimmed as a row: its header and the nodes before the
      // window dim one by one (after the beat renders, and only while fin > 0, so the beat's own styles stand
      // everywhere else; the flag lets a backward seek hand the filter back)
      appear(b.r, t, b.k.reply);
      tone(b.r, 0);
      b.who.style.opacity = op.toFixed(3);
      tone(b.who, fin);
      c.fin.soft.forEach((n) => { if (n.dataset.qcFin) { n.style.filter = ''; delete n.dataset.qcFin; } });
      b.inst.render(t);
      renderSpins(b);
      if (fin > 0) c.fin.soft.forEach((n) => { tone(n, fin); n.dataset.qcFin = '1'; });
    } else {
      appear(b.r, t, b.k.reply, 10, op);
      tone(b.r, fin);
      b.inst.render(t);
      renderSpins(b);
    }
  });
  tone(c.rc, fin);
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}
