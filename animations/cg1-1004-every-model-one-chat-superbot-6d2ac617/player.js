// cg1-1004 every model, one chat. Same hook, beats, pacing and 21.241 s length as
// every-model-one-chat-superbot-efa8df82; every frame of the app is the REAL superbot-desktop
// renderer (DOM captured per phase from the running app, its own CSS), and the player only moves
// between those real states: matched boxes glide (eased FLIP), changed boxes cross-dissolve in place,
// new boxes rise in, gone boxes fade. Everything is a pure function of t, so seek(t) is exact.
const SN = window.SB_SNAPS;
const CYCLE = 21.241;
const APP_END = 16.841; // original: tabs scene 0 to 16.841, end card 16.841 to 21.241
const END_DUR = CYCLE - APP_END;
const SCENE_FADE = 0.3;
const DIP = 0.35;

// ---- easing ---------------------------------------------------------------------------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, f) => a + (b - a) * f;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const outQuint = (x) => 1 - Math.pow(1 - x, 5);
const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const rand = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- the story: phases are real captured states, keyframes are the original's beat times ----
const PROMPTS = ['make me a muse meme', 'Scrape reddit and look for more', 'Winning, order me a burger.'];
const PH = {
  idle: { snap: 'p00-idle' },
  type1: { snap: 't1-a-typed', type: [0, 1.6, 1.997] },
  think1: { snap: 't1-b-thinking', fit: 'think:1' },
  sw1: { snap: 't1-c-switching', fit: 'think:1' },
  live1: { snap: 't1-d-live', fitTop: 'pill:1' }, // the image placeholder in view, no overshoot past where the meme will sit
  done1: { snap: 't1-e-done', fit: 'media:1' }, // the answer glides up with the meme whole above the composer
  type2: { snap: 't2-a-typed', type: [1, 5.577, 6.13], fit: 'media:1' },
  think2: { snap: 't2-b-thinking', fit: 'think:2' },
  sw2: { snap: 't2-c-switching', fit: 'think:2' },
  live2a: { snap: 't2-d-live1', fit: 'think:2' },
  live2b: { snap: 't2-d-live2', fit: 'think:2' },
  done2: { snap: 't2-e-done', fit: 'gal:2' },
  type3: { snap: 't3-a-typed', type: [2, 10.41, 10.911], fit: 'gal:2' },
  think3: { snap: 't3-b-thinking', fit: 'think:3' },
  sw3: { snap: 't3-c-switching', fit: 'think:3' },
  live3a: { snap: 't3-d-live1', fit: 'think:3' },
  live3b: { snap: 't3-d-live2', fit: 'think:3' },
  live3c: { snap: 't3-d-live3', fit: 'think:3' },
  done3: { snap: 't3-e-done', fitTop: 'mon:3' }, // the order card arrives burger first
  show3: { snap: 't3-e-done', fit: 'mon:3' },
};
// [start, phase, duration, easing]; a transition always finishes before the next one starts
const KF = [
  [0, 'idle', 0],
  [1.5, 'type1', 0.1, outCubic],
  [2.147, 'think1', 0.34, inOutCubic], // send: the ask lifts into the thread, the composer docks
  [2.497, 'sw1', 0.4, outCubic], // "Switching to Gemini 3 Pro Image"
  [3.147, 'live1', 0.42, outCubic], // switched; Gemini is creating the image
  [3.6, 'done1', 0.8, inOutCubic], // the meme lands
  [5.477, 'type2', 0.1, outCubic],
  [6.28, 'think2', 0.34, inOutCubic],
  [6.63, 'sw2', 0.4, outCubic], // "Switching to DeepSeek Flash"
  [7.06, 'live2a', 0.42, outCubic], // scraping 6 subreddits
  [7.78, 'live2b', 0.36, outCubic], // spotting Muse memes
  [8.36, 'done2', 0.8, inOutCubic], // 3 more found
  [10.31, 'type3', 0.1, outCubic],
  [11.061, 'think3', 0.34, inOutCubic],
  [11.411, 'sw3', 0.4, outCubic], // "Connecting to DoorDash"
  [12.061, 'live3a', 0.38, outCubic], // opening DoorDash
  [12.5, 'live3b', 0.36, outCubic], // picking the restaurant
  [12.93, 'live3c', 0.36, outCubic], // checking out with the saved card
  [13.341, 'done3', 0.7, inOutCubic], // the order card, burger first
  [14.1, 'show3', 0.8, inOutCubic], // down to the tracker: placed, preparing, ETA, held to the end card
];
// camera: [t0, t1, scale, focusX, focusY] in stage px; eased inOutCubic between holds
const CONV = [1.26, 1018, 652]; // the thread column, header cropped, composer on the bottom edge
const CAM = [
  [0, 0, 1.3, 1018, 560],
  [0, 1.95, 1.345, 1018, 560], // pushed in on the greeting and the composer
  [2.147, 3.0, ...CONV], // the ask goes out: ease back to the conversation, then hold it
];

// ---- layers ----------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const sApp = $('s-app'), sEnd = $('s-end'), dip = $('dip'), cam = $('cam');
const LB = $('lb'), LA = $('la'), LM = $('lm');

const bodyCache = new Map();
function bodyOf(snap) {
  if (bodyCache.has(snap)) return bodyCache.get(snap);
  let h = SN.S[snap].b;
  for (let i = 0; i < 12 && h.includes('<x-ref'); i++) h = h.replace(/<x-ref k="(\d+)"><\/x-ref>/g, (_, k) => SN.T[+k]);
  bodyCache.set(snap, h);
  return h;
}
const loaded = (frame) => new Promise((r) => (frame.contentDocument && frame.contentDocument.readyState === 'complete' && frame.contentDocument.querySelector('link') ? r() : frame.addEventListener('load', r, { once: true })));

// Put phase `id` into a layer: the real body, its scroll, eager images; returns the atom index.
function mount(frame, id) {
  const ph = PH[id];
  const doc = frame.contentDocument;
  const s = SN.S[ph.snap];
  const de = doc.documentElement;
  const ghost = de.classList.contains('ad-ghost');
  for (const a of [...de.attributes]) de.removeAttribute(a.name);
  for (const [k, v] of Object.entries(s.html)) de.setAttribute(k, v);
  if (ghost) de.classList.add('ad-ghost');
  for (const a of [...doc.body.attributes]) doc.body.removeAttribute(a.name);
  for (const [k, v] of Object.entries(s.body)) doc.body.setAttribute(k, v);
  doc.body.innerHTML = bodyOf(ph.snap);
  for (const img of doc.images) img.loading = 'eager';
  const sc = doc.querySelector('[data-ad-scroll]');
  if (sc) sc.scrollTop = frame === LM ? s.scrolls.find((x) => x.k === sc.getAttribute('data-ad-scroll'))?.top || 0 : ph.scrollTop || 0;
  const atoms = {};
  for (const el of doc.querySelectorAll('[data-ad-key]')) {
    atoms[el.getAttribute('data-ad-key')] = el;
    el.__base = parseFloat(doc.defaultView.getComputedStyle(el).opacity) || 1;
  }
  const typeSpec = ph.type;
  let typing = null;
  if (typeSpec) {
    const input = doc.querySelector('[data-testid="composer-input"]') || doc.querySelector('.hub-composer [contenteditable]');
    const full = PROMPTS[typeSpec[0]];
    const tw = doc.createTreeWalker(input || doc.body, NodeFilter.SHOW_TEXT);
    let node = null;
    for (let n = tw.nextNode(); n; n = tw.nextNode()) if (n.nodeValue.includes(full.slice(0, 6))) { node = n; break; }
    if (node) {
      const caret = doc.createElement('i');
      caret.className = 'ad-caret';
      node.parentNode.insertBefore(caret, node.nextSibling);
      typing = { node, full, caret };
    }
  }
  frame.__sc = sc;
  frame.__phase = id;
  frame.__plan = null;
  frame.__atoms = atoms;
  frame.__typing = typing;
  frame.__fx = collectFx(doc, id);
  return atoms;
}

// Scroll a phase so one atom sits just above the composer (fit) or just under the header (fitTop).
function settleScroll(doc, ph, prevRects) {
  const sc = doc.querySelector('[data-ad-scroll]');
  if (!sc) return;
  if (ph.anchor && prevRects && prevRects[ph.anchor]) {
    const a = doc.querySelector(`[data-ad-key="${ph.anchor}"]`);
    if (a) sc.scrollTop += a.getBoundingClientRect().top - prevRects[ph.anchor].y;
  }
  const box = (k) => doc.querySelector(`[data-ad-key="${k}"]`)?.getBoundingClientRect();
  const comp = box('composer');
  const head = doc.querySelector('[data-slot="main-head"]')?.getBoundingClientRect();
  if (ph.fit && box(ph.fit) && comp) sc.scrollTop += box(ph.fit).bottom - (comp.top - 20);
  // the conversation camera crops the header: its top edge sits near y = 140 CSS px
  if (ph.fitTop && box(ph.fitTop)) sc.scrollTop += box(ph.fitTop).top - Math.max((head ? head.bottom : 48) + 18, 152);
  ph.scrollTop = sc.scrollTop;
}

// Every phase measured once: atom rects (viewport CSS px, after that phase's scroll) and a
// signature, so a transition knows what moved, what changed and what came or went.
const R = {};
async function measureAll() {
  let prev = null;
  for (const id of Object.keys(PH)) {
    window.__AD.boot = `measure ${id}`;
    mount(LM, id);
    await imagesReady(LM.contentDocument);
    settleScroll(LM.contentDocument, PH[id], prev && R[prev]);
    const sc = LM.contentDocument.querySelector('[data-ad-scroll]');
    PH[id].scrollTop = sc ? sc.scrollTop : 0;
    prev = id;
    const out = {};
    for (const [k, el] of Object.entries(LM.__atoms)) {
      const r = el.getBoundingClientRect();
      const html = el.outerHTML;
      let h = 0;
      for (let i = 0; i < html.length; i++) h = (h * 31 + html.charCodeAt(i)) | 0;
      out[k] = { x: r.left, y: r.top, w: r.width, h: r.height, sig: `${html.length}:${h}`, rides: Boolean(el.closest('[data-ad-scroll]')) };
    }
    R[id] = out;
  }
}
function imagesReady(doc) {
  const one = (img) => (img.naturalWidth ? img.decode().catch((e) => console.warn('decode', img.src.slice(-60), e.message)) : undefined);
  return Promise.all([...doc.images].map((img) => (img.complete ? one(img) : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }).then(() => one(img)))));
}

// ---- per-phase flourishes (on real elements, never new UI) -------------------------------
function collectFx(doc, id) {
  const q = (s) => doc.querySelector(s);
  const qa = (s) => [...doc.querySelectorAll(s)];
  return {
    memeImg: q('[data-ad-key="media:1"] img'),
    genClock: q('[data-ad-key="nest:1"] [data-testid="provider-switch-generating"]') ? clockNode(q('[data-ad-key="nest:1"] [data-testid="provider-switch-generating"]')) : null,
    tiles: qa('[data-ad-key="gal:2"] [data-slot="embed-gallery-grid"] > *'),
    hero: q('[data-ad-key="mon:3"] img'),
    bar: q('[data-ad-key="mon:3"] [data-slot="embed-monitor-progress"] > *, [data-ad-key="mon:3"] [role="progressbar"] > *'),
    clocks: liveClocks(doc),
  };
}
// "Thinking · 8s" / "working on a muse meme · 3s": the seconds a live turn has run
function liveClocks(doc) {
  const out = [];
  for (const root of doc.querySelectorAll('[data-ad-key^="think:"], [data-ad-key^="sonar:"]')) {
    const tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const m = /^(.*?)(\d+)s\s*$/.exec(n.nodeValue);
      if (m && (/·\s*$/.test(m[1]) || /·/.test(n.previousSibling?.textContent || '') || m[1].trim() === '')) out.push({ node: n, pre: m[1], base: +m[2] });
    }
  }
  return out;
}
function clockNode(root) {
  const tw = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) if (/^\s*\d+:\d\d\s*$/.test(n.nodeValue)) return n;
  return null;
}
const START = Object.fromEntries(KF.map(([t, id]) => [id, t]));
function applyFx(frame, t) {
  const fx = frame.__fx;
  if (!fx) return;
  const id = frame.__phase;
  for (const c of fx.clocks) c.node.nodeValue = c.pre + (c.base + Math.max(0, Math.floor(t - (START[id] ?? t)))) + 's';
  if (fx.genClock) fx.genClock.nodeValue = `0:${String(Math.max(1, Math.floor(t - START.live1) + 1)).padStart(2, '0')}`;
  if (fx.memeImg) {
    // the generated image resolves: soft focus to sharp, settling from a hair larger
    const e = outCubic(seg(t, START.done1 + 0.25, START.done1 + 1.25));
    fx.memeImg.style.filter = e < 1 ? `blur(${(1 - e) * 14}px) saturate(${0.7 + 0.3 * e})` : '';
    fx.memeImg.style.transform = e < 1 ? `scale(${1.035 - 0.035 * e})` : '';
  }
  if (fx.tiles.length) {
    fx.tiles.forEach((tile, i) => {
      const e = outCubic(seg(t, START.done2 + 0.3 + i * 0.09, START.done2 + 0.85 + i * 0.09));
      tile.style.opacity = e.toFixed(3);
      tile.style.transform = e < 1 ? `translateY(${(1 - e) * 10}px) scale(${0.965 + 0.035 * e})` : '';
    });
  }
  if (fx.hero) {
    const e = outCubic(seg(t, START.done3, START.done3 + 1.6));
    fx.hero.style.transform = e < 1 ? `scale(${1.05 - 0.05 * e})` : '';
  }
}

// ---- typing ------------------------------------------------------------------------------
function applyTyping(frame, t) {
  const ty = frame.__typing;
  if (!ty) return;
  const [, t0, t1] = PH[frame.__phase].type;
  const n = ty.full.length;
  // human cadence: each key lands on an evenly spaced beat nudged by a fixed jitter
  let shown = 0;
  for (let i = 0; i < n; i++) {
    const at = t0 + ((i + 0.35 * (rand(i + 7 * n) - 0.5)) / Math.max(1, n - 1)) * (t1 - t0);
    if (t >= at) shown = i + 1;
  }
  ty.node.nodeValue = ty.full.slice(0, shown);
  ty.caret.style.visibility = t < t1 + 0.25 ? 'visible' : 'hidden';
}

// ---- deterministic CSS animations (spinners, shimmers): paused and set from t -------------
function syncAnims(doc, t) {
  for (const a of doc.getAnimations()) {
    if (a.playState !== 'paused') a.pause();
    const ct = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
    a.currentTime = ct && ct.iterations === Infinity ? t * 1000 : ct ? ct.endTime : 0;
  }
}

// ---- the transition -----------------------------------------------------------------------
function phaseAt(t) {
  let i = 0;
  while (i + 1 < KF.length && KF[i + 1][0] <= t) i++;
  const [t0, id, dur, ease] = KF[i];
  const e = dur > 0 ? (ease || outCubic)(seg(t, t0, t0 + dur)) : 1;
  return { id, prev: i > 0 ? KF[i - 1][1] : null, e };
}
const setT = (el, x, y) => { el.style.transform = x || y ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)` : ''; };
const setO = (el, o) => { el.style.opacity = o >= 0.999 ? '' : (o * el.__base).toFixed(3); };

// Boxes that change sides of another box (the location row passes the composer on send) swap
// by fading instead of gliding through it.
const SWAP = new Set(['ctx']);

// A changed box only cross-dissolves where it really differs: walk both copies in step and keep
// the smallest differing pieces (the composer's text, its model chip, a pill's label), so the
// unchanged frame around them never doubles.
function diffLeaves(a, b, out) {
  if (a.outerHTML === b.outerHTML) return out;
  const ka = a.children, kb = b.children;
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('');
  if (a.tagName !== b.tagName || ka.length !== kb.length || ka.length === 0 || ownText(a) !== ownText(b) || a.tagName === 'svg') {
    out.push([a, b]);
    return out;
  }
  for (let i = 0; i < ka.length; i++) diffLeaves(ka[i], kb[i], out);
  return out;
}

// For one transition: each changed pair's leaves, and for each box that exists on one side only
// the matched neighbour it travels with (the nearest box both phases share, on the same scroll).
const plans = new Map();
function planFor(prev, id) {
  const key = `${prev}>${id}`;
  if (LA.__plan === key && LB.__plan === key) return plans.get(key);
  const or = R[prev], nr = R[id];
  const leaves = {};
  for (const [k, bEl] of Object.entries(LB.__atoms)) {
    const aEl = LA.__atoms[k];
    if (aEl && or[k] && nr[k] && or[k].sig !== nr[k].sig && !SWAP.has(k)) leaves[k] = diffLeaves(aEl, bEl, []);
  }
  const gap = (p, q) => Math.max(0, Math.max(p.y, q.y) - Math.min(p.y + p.h, q.y + q.h));
  // only thread content leads: the docked composer and the header move for their own reasons
  const FLOW = /^(hero|date|ask|sonar|pill|nest|think|head|lead|para|media|gal|mon|foot)\b/;
  const shared = Object.keys(nr).filter((k) => or[k] && !SWAP.has(k) && FLOW.test(k));
  const near = (rects, k, side) => {
    let best = null, bestGap = Infinity;
    for (const m of shared) {
      if (rects[m].rides !== rects[k].rides) continue;
      const g = gap(rects[m], rects[k]);
      if (g < bestGap) { bestGap = g; best = m; }
    }
    return best === null ? 0 : side === 'new' ? or[best].y - nr[best].y : nr[best].y - or[best].y;
  };
  const rideNew = {}, rideOld = {};
  for (const k of Object.keys(nr)) if (!or[k] || SWAP.has(k)) rideNew[k] = near(nr, k, 'new');
  for (const k of Object.keys(or)) if (!nr[k] || SWAP.has(k)) rideOld[k] = near(or, k, 'old');
  const plan = { leaves, rideNew, rideOld };
  plans.set(key, plan);
  LA.__plan = LB.__plan = key;
  return plan;
}

// A picture that finishes loading after a mount changes the feed's height, and the browser may
// clamp the scroll before it does: every frame re-pins each layer to its phase's measured offset.
function pinScroll(frame) {
  const sc = frame.__sc, want = PH[frame.__phase].scrollTop || 0;
  if (sc && Math.abs(sc.scrollTop - want) > 0.5) sc.scrollTop = want;
}

function renderApp(t) {
  const { id, prev, e } = phaseAt(t);
  if (LB.__phase !== id) mount(LB, id);
  const live = prev && e < 1;
  if (live && LA.__phase !== prev) mount(LA, prev);
  pinScroll(LB);
  if (live) pinScroll(LA);
  LA.style.visibility = live ? 'visible' : 'hidden';
  const nr = R[id], or = live ? R[prev] : null;
  const plan = live ? planFor(prev, id) : null;
  const fadeIn = outCubic(seg(e, 0.32, 0.9)), fadeOut = 1 - seg(e, 0, 0.32);
  const swapOut = 1 - seg(e, 0, 0.32), swapIn = seg(e, 0.32, 0.8);
  for (const [k, el] of Object.entries(LB.__atoms)) {
    const n = nr[k], o = or && or[k];
    el.style.visibility = '';
    if (!live || !n) { setT(el, 0, 0); setO(el, 1); continue; }
    if (o && !SWAP.has(k)) {
      setT(el, (o.x - n.x) * (1 - e), (o.y - n.y) * (1 - e));
      setO(el, 1);
      for (const [, bLeaf] of plan.leaves[k] || []) bLeaf.style.opacity = swapIn.toFixed(3);
    } else {
      setT(el, 0, plan.rideNew[k] * (1 - e) + (1 - fadeIn) * 12);
      setO(el, o ? swapIn : fadeIn);
    }
  }
  if (live) {
    for (const [k, el] of Object.entries(LA.__atoms)) {
      const o = or[k], n = nr[k];
      if (n && !SWAP.has(k)) {
        // the box itself is drawn by the entered layer; only its differing pieces fade out here
        const leaves = plan.leaves[k] || [];
        el.style.visibility = 'hidden';
        setT(el, (n.x - o.x) * e, (n.y - o.y) * e);
        setO(el, 1);
        for (const [aLeaf] of leaves) { aLeaf.style.visibility = 'visible'; aLeaf.style.opacity = swapOut.toFixed(3); }
        continue;
      }
      el.style.visibility = 'visible';
      setT(el, 0, plan.rideOld[k] * e - 6 * e);
      setO(el, n ? swapOut : fadeOut);
    }
    applyTyping(LA, t);
    syncAnims(LA.contentDocument, t);
  } else if (LB.__plan) {
    // a finished transition leaves no faded piece behind
    const p = plans.get(LB.__plan);
    if (p) for (const leaves of Object.values(p.leaves)) for (const [, bLeaf] of leaves) bLeaf.style.opacity = '';
    LB.__plan = null;
  }
  applyTyping(LB, t);
  applyFx(LB, t);
  syncAnims(LB.contentDocument, t);
  renderCam(t);
}

function renderCam(t) {
  let s = CAM[0][2], fx = CAM[0][3], fy = CAM[0][4];
  for (let i = 1; i < CAM.length; i++) {
    const [a, b, s1, x1, y1] = CAM[i];
    if (t < a) break;
    const f = inOutCubic(seg(t, a, b));
    s = lerp(s, s1, f); fx = lerp(fx, x1, f); fy = lerp(fy, y1, f);
  }
  const tx = clamp(960 - fx * s, 1920 - 1920 * s, 0);
  const ty = clamp(540 - fy * s, 1080 - 1080 * s, 0);
  cam.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`;
}

// ---- end card (the original lock-up: cat mark + EVERY MODEL. ONE CHAT.) ----------------------
let endMark = null, endFace = null, endSlide = null;
// the original spot's makeMark (shell.js): the assets/sb-mark-live mascot frozen off the wall clock,
// its CSS loops paused and seeked to t, blinking on a fixed schedule
function makeMark(size) {
  const host = document.createElement('span');
  host.className = 'sbx-markhost';
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') return { el: host, seek() {} };
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null;
  return {
    el: host,
    seek(t) {
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const an of anims) { an.pause(); an.currentTime = Math.max(0, t) * 1000; }
      const k = Math.floor(t / 3.6), ph = t - k * 3.6;
      const shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}
function buildEnd() {
  sEnd.innerHTML = '<div class="lock ask-end"><div class="words"><div class="end-slide"><h1>EVERY MODEL.<br> ONE CHAT.</h1></div></div><div class="face"></div></div>';
  endFace = sEnd.querySelector('.face');
  endSlide = sEnd.querySelector('.end-slide');
  endMark = makeMark(220);
  endFace.appendChild(endMark.el);
}
function renderEnd(lt) {
  const f = outBack(seg(lt, 0, 0.5));
  endFace.style.opacity = seg(lt, 0, 0.5).toFixed(3);
  endFace.style.transform = `scale(${lerp(0.5, 1, f).toFixed(4)})`;
  const w = seg(lt, 0.3, 1.0);
  endSlide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  endSlide.style.opacity = w.toFixed(3);
  endMark.seek(lt);
}

// ---- render / clock -----------------------------------------------------------------------
function render(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  const inApp = t < APP_END;
  sApp.classList.toggle('on', inApp);
  sEnd.classList.toggle('on', !inApp);
  if (inApp) {
    sApp.style.opacity = (seg(t, 0, SCENE_FADE) * (1 - seg(t, APP_END - SCENE_FADE, APP_END))).toFixed(3);
    sEnd.style.opacity = '0';
    renderApp(t);
  } else {
    sEnd.style.opacity = '1';
    sApp.style.opacity = '0';
    renderEnd(t - APP_END);
  }
  dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
}

function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit);
fit();

const params = new URLSearchParams(location.search);
const tParam = params.get('t');
let paused = tParam !== null, offset = tParam !== null ? parseFloat(tParam) || 0 : 0, base = performance.now(), lastT = 0;
if (paused) document.body.classList.add('freeze');

function frameLoop(now) {
  if (!paused) render((lastT = offset + (now - base) / 1000));
  requestAnimationFrame(frameLoop);
}

window.__AD = {
  CYCLE,
  _R: R,
  _PH: PH,
  segments: [{ kind: 'app', id: 'thread', t0: 0, t1: APP_END }, { kind: 'end', id: 'end', t0: APP_END, t1: CYCLE }],
  ready: false,
  seek(t) { paused = true; offset = t; render(t); lastT = t; },
  // resolves once every picture in the visible layers is decoded (the renderer awaits it per frame)
  settle() {
    return Promise.all([imagesReady(LB.contentDocument), LA.style.visibility === 'visible' ? imagesReady(LA.contentDocument) : 0])
      .then(() => { pinScroll(LB); if (LA.style.visibility === 'visible') pinScroll(LA); })
      .then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  },
};

addEventListener('keydown', (ev) => {
  if (ev.code === 'Space') { ev.preventDefault(); if (paused) { paused = false; base = performance.now(); } else { paused = true; offset = lastT; } }
  else if (ev.code === 'ArrowRight' || ev.code === 'ArrowLeft') { paused = true; offset = lastT + (ev.code === 'ArrowRight' ? 1 / 30 : -1 / 30); render(offset); lastT = offset; }
  else if (ev.code === 'KeyR') { paused = false; offset = 0; base = performance.now(); }
});

(async () => {
  window.__AD.boot = 'frames';
  await Promise.all([loaded(LB), loaded(LA), loaded(LM)]);
  window.__AD.boot = 'fonts';
  LA.contentDocument.documentElement.classList.add('ad-ghost');
  await LB.contentDocument.fonts.ready;
  await measureAll();
  buildEnd();
  render(offset);
  window.__AD.ready = true;
  base = performance.now();
  requestAnimationFrame(frameLoop);
})().catch((err) => { console.error('player boot failed', err); throw err; });
