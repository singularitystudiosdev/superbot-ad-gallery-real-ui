// The one-ask chat. The ask is typed into the composer and sent, superbot routes it (its routing chips and the
// composer's platform chip follow the model), and the routed model answers with its own beat, each beat a different
// artifact: music.js (waveforms), assets.js (mesh list), art.js (image grid), code.js (work readout), scrape.js
// (reference sweep), git.js (repo card), play.js (the reel). There is one routing (VARIANTS['3']); every ?v maps to it.
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
export const ASK = 'make a Liquid Glass motion reel, 120 BPM';

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

// one request: the app that answers, its beat module, the chip that routes to it (opts.chip relabels it, for a
// hand-back), and the beat's own options
const step = (app, mod, opts = {}) => ({ app, mod, opts, chips: [[app, opts.chip || CHIP[app]]] });
// one request answered by several models at once: a chip per model, and the reply signed by all of them
const together = (apps, mod, opts = {}) => ({
  app: apps[apps.length - 1], who: apps, mod, opts,
  chips: apps.map((a, i) => [a, i === 0 ? CHIP[a] : `Running ${APPS[a].name} in parallel`]),
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

// the one published routing: 7 requests, one per model. It builds a Liquid Glass motion reel (after @motion_conquest's
// 16s reel) and ends on the real clip. It opens on Lyria's 120 BPM track, then Meshy's glass orb and lens meshes,
// Gemini's frames, Opus's refraction code, DeepSeek scraping references, GitHub, and Opus plays the reel. It keeps
// the key '3' it had in the three-routing fork it came from; ?v= of any value (or none) plays it.
// It does not open on Claude Opus 5.5, and it uses no plan card.
export const VARIANTS = {
  '3': variant([
    step('lyria', music),
    step('meshy', assets),
    step('gemini', art),
    step('opus', code, { set: 'glass' }),
    step('deepseek', scrape),
    step('github', git),
    step('opus', play),
  ], { hold: 0, chip: 0.5 }),
};
export const VARIANT_KEY = '3';
export const VARIANT = VARIANTS[VARIANT_KEY];

// every beat's clock, laid end to end from CHAT_T0; each beat module owns everything after its reply.
// Every hand-off is one 120 BPM beat: a routing chip lands as a glass droplet just after the previous beat ends,
// springs wide into its capsule, a lens rolls across its label and becomes the check, and it resolves chipDur
// (0.5s) later; the composer's platform chip swaps model at the half-beat, and the app answers 0.02s after done.
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
    k.chips = a.chips.map(([app, label]) => { const c = { app, label, sw: at, swap: at + a.chipDur * 0.5, done: at + Math.max(0.16, a.chipDur) }; at = c.done + 0.05; return c; });
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
// the routing chip's own check: drawn on (pathLength 1) inside the blue glass droplet the lens becomes
const CHK = '<svg class="qc-chk" viewBox="0 0 24 24"><path pathLength="1" d="M5.5 12.5l4.2 4.2L18.5 7.8"/></svg>';
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
      // a routing chip is one liquid-glass capsule: specular rim, the app tile, the label, the status slot (glass
      // ring spinner, ripple, check droplet) and the refraction lens that rolls across the label while it spins
      const w = add(`<div class="msg qc-m">${sbAvatar}<div class="m-main"><span class="qc-sw"><i class="qc-spec"></i>${tile(c.app)}<span class="qc-swl">${esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i><i class="qc-rip"></i><span class="qc-drop">${CHK}</span></span><span class="qc-lens"><span class="qc-lens-in">${esc(c.label)}</span></span></span></div></div>`);
      const q = (sel) => w.querySelector(sel);
      return {
        c, w, sw: q('.qc-sw'), tile: q('.qc-sw > .qc-tile'), lab: q('.qc-swl'), st: q('.qc-st'), spin: q('.qc-spin'),
        rip: q('.qc-rip'), drop: q('.qc-drop'), chk: q('.qc-chk path'), lens: q('.qc-lens'), lensIn: q('.qc-lens-in'),
      };
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
  // scroll marks: after each time, the feed's fold glides to that element's bottom (over 0.3s, or the mark's own
  // third entry). A routing chip's row opens 0.1s before it lands, quicker, so its droplet springs up in view
  // instead of under the composer
  const scroll = beats.flatMap((b) => [...(b.u ? [[b.k.send, b.u]] : []), ...b.sws.map((s) => [s.c.sw - 0.1, s.w, 0.24]), [b.k.reply, b.who], ...b.inst.marks]).sort((x, y) => x[0] - y[0]);

  // the composer's platform chip names the model, then follows the routed app
  const plat = hub.querySelector('.rc-plat');
  const cat = plat.querySelector('.rc-cat');
  const pIcon = el('<span class="qc-pi"></span>');
  cat.replaceWith(pIcon);
  const pImg = el(`<img alt="" src="${APPS.codex.logo}" data-app="codex"/>`);
  const pMark = el(`<span class="qc-pi-sb">${SB_MARK}</span>`);
  pIcon.append(pImg, pMark);
  const label = [...plat.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  const pLabel = el(`<span class="qc-pl">${APPS.codex.name}</span>`);
  if (label) label.replaceWith(pLabel); else plat.insertBefore(pLabel, pIcon.nextSibling);
  // the glass lens that passes over the platform chip when the model swaps
  const pLens = el('<i class="qc-plens"></i>');
  plat.classList.add('qc-glass');
  plat.appendChild(pLens);

  const ph = hub.querySelector('.rc-ph');
  const chat = {
    hub, pointer, feed, inner, beats, scroll,
    plat, pIcon, pImg, pMark, pLabel, pLens,
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

const PLENS_W = 0.24; // half-window of the composer lens pass, centred on each swap (the half-beat of its chip)

function renderRouting(c, t) {
  let app = 'codex', near = null;
  c.beats.forEach(({ k }) => k.chips.forEach((ch) => {
    if (t >= ch.swap) app = ch.app;
    if (Math.abs(t - ch.swap) < PLENS_W) near = ch.swap;
  }));
  if (app !== c.lastApp) {
    const isMark = app === 'superbot';
    c.pImg.style.display = isMark ? 'none' : '';
    c.pMark.style.display = isMark ? 'block' : 'none';
    if (!isMark) c.pImg.src = APPS[app].logo;
    c.pImg.dataset.app = app;
    c.pLabel.textContent = APPS[app].name;
    c.lastApp = app;
  }
  // platform chip: a glass lens slides over it left to right; as it arrives the old model is magnified and smeared
  // out under the glass, the swap happens with the lens dead centre, and the new model springs back to size behind it
  let sc = 1, bl = 0, op = 1;
  if (near !== null) {
    const p = seg(t, near - PLENS_W, near + PLENS_W);
    if (p < 0.5) { const e = Math.pow(p * 2, 2); sc = 1 + 0.32 * e; bl = 2.6 * e; op = 1 - 0.45 * e; }
    else { const q = (p - 0.5) * 2; sc = lerp(1.32, 1, outBack(q)); bl = 2.6 * (1 - outCubic(q)); op = lerp(0.55, 1, outCubic(q)); }
    const W = c.plat.offsetWidth, H = c.plat.offsetHeight, d = H + 6;
    const x = lerp(-d, W, inOutCubic(p));
    const li = seg(p, 0, 0.18) * (1 - seg(p, 0.82, 1));
    c.pLens.style.opacity = li.toFixed(3);
    c.pLens.style.transform = `translate(${x.toFixed(2)}px, ${((H - d) / 2).toFixed(2)}px) scale(${lerp(0.6, 1, outBack(clamp(li))).toFixed(4)})`;
    c.pLens.style.width = c.pLens.style.height = `${d}px`;
  } else c.pLens.style.opacity = '0';
  const tf = sc === 1 ? 'none' : `scale(${sc.toFixed(4)})`;
  const fl = bl < 0.01 ? 'none' : `blur(${bl.toFixed(2)}px)`;
  for (const n of [c.pIcon, c.pLabel]) { n.style.transform = tf; n.style.filter = fl; n.style.opacity = op.toFixed(3); }
}

// one routing chip, one beat (k.sw to k.done):
//   droplet:  a small glass bead springs up where the tile sits (outBack), then springs wide into the capsule
//             (clip-path reveal, the overshoot stretches it a touch wider and flatter, like the reel's orb to pill)
//   spinning: the glass ring turns in the status slot, and a refraction lens rolls across the label, magnifying a
//             copy of it; the label's specular band rides under the lens
//   done:     the lens shrinks onto the status slot and pops into a blue glass droplet (outBack wobble), a ripple
//             ring spreads from it and the check draws on; the capsule's rim flares once
function renderSwitch(s, t) {
  const k = s.c, sw = s.sw;
  const live = t >= k.sw + 0.04;
  s.w.style.opacity = live ? '1' : '0';
  s.w.style.transform = 'none';
  if (!live) return;
  const done = t >= k.done;
  sw.classList.toggle('qc-done', done);

  // droplet to capsule
  const d = outBack(seg(t, k.sw + 0.04, k.sw + 0.24));
  const mr = seg(t, k.sw + 0.13, k.sw + 0.42);
  const m = outBack(mr), mc = clamp(m), over = Math.max(0, m - 1);
  sw.style.clipPath = mc >= 1 ? 'none' : `inset(0 calc((100% - 34px) * ${(1 - mc).toFixed(4)}) 0 0 round 17px)`;
  const base = lerp(0.25, 1, d);
  const sx = base * (1 + 0.55 * over), sy = base * (1 - 0.07 * bump(mr) - 0.45 * over);
  sw.style.transform = Math.abs(sx - 1) < 1e-4 && Math.abs(sy - 1) < 1e-4 ? 'none' : `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  sw.style.setProperty('--spec', (0.7 + 0.3 * bump(seg(t, k.done, k.done + 0.4))).toFixed(3));

  const tp = outBack(seg(t, k.sw + 0.08, k.sw + 0.32));
  s.tile.style.transform = `scale(${lerp(0.4, 1, tp).toFixed(4)})`;
  const lp = outCubic(seg(t, k.sw + 0.18, k.sw + 0.36));
  const ltx = (1 - lp) * -8;
  s.lab.style.opacity = lp.toFixed(3);
  s.lab.style.transform = lp >= 1 ? 'none' : `translateX(${ltx.toFixed(2)}px)`;

  // glass ring spinner
  s.spin.style.opacity = (seg(t, k.sw + 0.14, k.sw + 0.22) * (1 - seg(t, k.done - 0.1, k.done))).toFixed(3);
  s.spin.style.transform = `rotate(${((t - k.sw) * 540).toFixed(1)}deg)`;

  // refraction lens: rolls from the label's start to the status slot, shrinking onto it at the end
  const H = sw.offsetHeight, L = s.lab.offsetLeft, LT = s.lab.offsetTop;
  const ST = s.st.offsetLeft + s.st.offsetWidth / 2;
  const lin = seg(t, k.sw + 0.18, k.sw + 0.3);
  const lo = clamp(lin) * (1 - seg(t, k.done, k.done + 0.05));
  if (lo > 0) {
    const size = lerp(30, 18, inOutCubic(seg(t, k.done - 0.16, k.done)));
    const cx = lerp(L + 8, ST, inOutCubic(seg(t, k.sw + 0.2, k.done - 0.02)));
    const lx = cx - size / 2, ly = (H - size) / 2;
    s.lens.style.opacity = lo.toFixed(3);
    s.lens.style.left = `${lx.toFixed(2)}px`;
    s.lens.style.top = `${ly.toFixed(2)}px`;
    s.lens.style.width = s.lens.style.height = `${size.toFixed(2)}px`;
    s.lens.style.transform = `scale(${lerp(0.3, 1, outBack(lin)).toFixed(4)})`;
    // the copy inside sits exactly over the label, magnified about the lens centre
    const ix = L + ltx - lx, iy = LT - ly;
    s.lensIn.style.left = `${ix.toFixed(2)}px`;
    s.lensIn.style.top = `${iy.toFixed(2)}px`;
    s.lensIn.style.opacity = lp.toFixed(3);
    s.lensIn.style.transformOrigin = `${(cx - L - ltx).toFixed(2)}px ${(H / 2 - LT).toFixed(2)}px`;
    s.lensIn.style.transform = 'scale(1.38)';
    sw.style.setProperty('--lp', `${(cx - L - ltx).toFixed(1)}px`);
  } else {
    s.lens.style.opacity = '0';
    sw.style.setProperty('--lp', '-60px');
  }

  // the check droplet: pops with a wobble, a ripple spreads, the check draws on
  const pp = seg(t, k.done - 0.02, k.done + 0.3);
  const ds = outBack(pp), wob = Math.sin(pp * Math.PI * 2) * (1 - pp) * 0.16;
  s.drop.style.opacity = pp > 0 ? '1' : '0';
  s.drop.style.transform = `scale(${(ds * (1 + wob)).toFixed(4)}, ${(ds * (1 - wob)).toFixed(4)})`;
  s.chk.style.strokeDashoffset = (1 - outCubic(seg(t, k.done + 0.04, k.done + 0.24))).toFixed(4);
  const rp = seg(t, k.done, k.done + 0.45);
  s.rip.style.opacity = rp > 0 && rp < 1 ? (0.85 * (1 - rp)).toFixed(3) : '0';
  s.rip.style.transform = `scale(${lerp(1, 2.4, outCubic(rp)).toFixed(4)})`;
}

function renderScroll(c, t) {
  const bottom = (n) => { const b = boxIn(n, c.inner); return b.y + b.h; };
  const cs = getComputedStyle(c.feed);
  const viewH = c.feed.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  // bottom-anchored like a live chat: the newest landed line sits just above the composer, so the thread grows
  // up out of it (the shift is negative while the thread is shorter than the feed)
  let y = 0;
  for (const [a, n, d = 0.3] of c.scroll) {
    if (t <= a) break;
    y = lerp(y, bottom(n), inOutCubic(seg(t, a, a + d)));
  }
  c.inner.style.transform = `translateY(${(viewH - 8 - y).toFixed(2)}px)`;
}

export function renderChat(c, t) {
  if (!c) return;
  renderComposer(c, t);
  renderRouting(c, t);
  c.beats.forEach((b) => {
    if (b.u) appear(b.u, t, b.k.send);
    b.sws.forEach((s) => renderSwitch(s, t)); // the chip row enters as its own glass droplet, not a fade
    appear(b.r, t, b.k.reply);
    b.inst.render(t);
  });
  renderScroll(c, t);
  // the pointer: beats hand back targets in the section's px (x.box), the same space placeCursor writes
  const toScr = (p) => p;
  const pt = c.beats.map((b) => b.inst.pointer && b.inst.pointer(t, toScr)).find(Boolean);
  if (pt) placeCursor(c.pointer, pt.x, pt.y, pt.p, pt.v); else c.pointer.style.opacity = '0';
}