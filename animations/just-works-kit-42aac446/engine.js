/* engine.js: the "just works" kit engine. One ad spot is a pure function of t.
   Usage (the ad's index.html does exactly this):
     import run from '../just-works-kit-42aac446/engine.js';
     run(cfg, { data, site });
   Sequence: [gpt, if cfg.gpt] -> [card, if cfg.card] -> hub -> browser -> end.
   Transitions: a 0.3s dip to black across every boundary except hub -> browser, which is a hard cut
   (the browser scene draws the shared-element morph itself); the loop also opens and closes on black.
   Scenes are modules at ./scenes/<id>.js, default export { id, dur(cfg) -> seconds, mount(section, ctx),
   render(lt, ctx) }, mounted once, rendered only while their segment is active. render is pure in lt
   (0..dur) and idempotent; every frame the engine may draw is reachable from t alone.
   Clock: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there, space pauses, arrows step 0.25s,
   R restarts, 60fps quantised. window.AR (assets/ar.js) picks the frame width; an 'archange' event
   re-fits the stage and re-renders against the new ctx.W.
   Globals: window.CYCLE = loop length in seconds; window.__AD = { seek(t), loop, CYCLE, segments, ready }.
   document.title is never touched. */
import { clamp, seg } from './lib.js';

const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
// one query string for every kit asset, so a dev server without cache-control still reloads it
const VER = '42aac446';
const DIP = 0.3;
const FPS = 60;
// the id whose OUTGOING edge is a hard cut: hub -> browser has no dip
const HARD_CUT = 'hub';
const ORDER = ['gpt', 'card', 'hub', 'browser', 'end'];
// durations a scene gets when its module will not load (the spot keeps its shape)
const FALLBACK_DUR = { gpt: 7, card: 2.8, hub: 9, browser: 10, end: 3.4 };

/** new URL(p, document.baseURI): an ad-folder relative path ('./img/x.jpg') as the browser will fetch it. */
const asset = (p) => new URL(p, document.baseURI).href;
/** new URL(p, engine url): a path inside this kit ('./assets/tile.svg'). */
const kit = (p) => new URL(p, import.meta.url).href;

/* ---------- the mascot script (shell.makeMark builds against window.sbMarkLive) ---------- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve(s);
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}
if (typeof window.sbMarkLive !== 'function') {
  try { await loadScript(kit('./assets/sb-mark-live.js')); }
  catch (err) { console.warn('[kit] mascot script unavailable:', err.message); }
}

/**
 * Boot one ad spot.
 * @param {object} cfg  the ad config (see contract: id, title, slug, ask, gpt, card, sources, steps,
 *                      found, build, scroll, hover, click, end, dur)
 * @param {object} env  { data, site } module namespaces from the ad folder
 */
export default async function run(cfg = {}, env = {}) {
  const data = env.data || {};
  const site = env.site || {};
  const stage = document.getElementById('stage');
  if (!stage) { console.error('[kit] engine: no #stage element in the document'); return; }

  let dip = stage.querySelector('#dip');
  if (!dip) { dip = document.createElement('div'); dip.id = 'dip'; stage.appendChild(dip); }

  // ---------- which segments this spot has ----------
  const ids = ORDER.filter((id) => (id === 'gpt' ? !!cfg.gpt : id === 'card' ? !!cfg.card : true));

  // ---------- load the scene modules (a broken module must not take the spot down) ----------
  const errm = (err) => (err && err.stack ? err.stack : err);
  const MODS = {};
  await Promise.all(ids.map(async (id) => {
    try {
      const mod = (await import(`./scenes/${id}.js?v=${VER}`)).default;
      if (!mod || typeof mod !== 'object' || typeof mod.mount !== 'function' || typeof mod.render !== 'function')
        throw new Error(`scenes/${id}.js has no default { id, dur, mount, render } export`);
      MODS[id] = mod;
    } catch (err) {
      console.error(`[kit] scene "${id}" failed to load:`, errm(err));
      MODS[id] = { id, dur: () => FALLBACK_DUR[id] || 8, broken: true, mount() {}, render() {} };
    }
  }));

  // ---------- lay the timeline ----------
  const durOf = (id) => {
    const ov = cfg.dur && cfg.dur[id];
    if (ov != null && isFinite(ov) && +ov > 0) return +ov;
    const mod = MODS[id];
    try {
      const d = +mod.dur(cfg);
      if (isFinite(d) && d > 0) return d;
    } catch (err) { console.error(`[kit] scene "${id}" dur() threw:`, errm(err)); }
    return FALLBACK_DUR[id] || 8;
  };

  const segs = [];
  let acc = 0;
  for (const id of ids) {
    const dur = Math.max(0.4, durOf(id));
    const sec = document.createElement('section');
    sec.className = `scene s-${id}`;
    sec.id = `s-${id}`;
    stage.insertBefore(sec, dip);
    segs.push({ id, dur, t0: +acc.toFixed(4), t1: +(acc + dur).toFixed(4), sec, mod: MODS[id], broken: !!MODS[id].broken });
    acc += dur;
  }
  const CYCLE = +acc.toFixed(4);
  // fade-in / fade-out seconds per segment. Every boundary dips to black except hub -> browser, and the
  // loop's own ends are black: the first segment fades in, the last one hands off to #dip at CYCLE.
  segs.forEach((s, i) => {
    const prev = segs[i - 1], next = segs[i + 1];
    s.fin = (!prev || prev.id !== HARD_CUT) ? DIP : 0;
    s.fout = (!next || s.id === HARD_CUT) ? 0 : DIP;
  });
  const isLast = (s) => s === segs[segs.length - 1];

  // ---------- mount ----------
  const ctx = {
    cfg, data, site,
    W: W(), H,
    ar: (window.AR && window.AR.key) || '16x9',
    slug: cfg.slug,
    asset, kit,
    /** where a scene publishes geometry another scene reads (hub writes thumb, browser reads it) */
    shared: {},
  };

  const errSeen = new Set();
  function report(s, phase, err) {
    const key = `${s.id}:${phase}:${err && err.message}`;
    if (errSeen.has(key)) return;
    errSeen.add(key);
    console.error(`[kit] scene "${s.id}" threw in ${phase}:`, errm(err));
  }
  function markBroken(s) {
    s.broken = true;
    s.sec.innerHTML = `<div class="scene-err">scene "${s.id}" unavailable</div>`;
  }
  for (const s of segs) {
    if (s.broken) { markBroken(s); continue; }
    try { s.mod.mount(s.sec, ctx); } catch (err) { report(s, 'mount', err); markBroken(s); }
  }

  // ---------- frame ----------
  let active = null;
  function render(t) {
    ctx.W = W();
    ctx.ar = (window.AR && window.AR.key) || '16x9';
    ctx.t = t;
    let cur = segs[segs.length - 1];
    for (const s of segs) if (t >= s.t0 && t < s.t1) { cur = s; break; }
    if (active !== cur) {
      if (active) active.sec.classList.remove('on');
      cur.sec.classList.add('on');
      active = cur;
    }
    const lt = clamp(t - cur.t0, 0, cur.dur);
    const fin = cur.fin ? seg(lt, 0, cur.fin) : 1;
    const fout = cur.fout ? 1 - seg(lt, cur.dur - cur.fout, cur.dur) : 1;
    cur.sec.style.opacity = (fin * fout).toFixed(3);
    if (!cur.broken) {
      try { cur.mod.render(lt, ctx); } catch (err) { report(cur, 'render', err); markBroken(cur); }
    }
    // the loop closes on black: the last segment is covered by #dip over its final DIP seconds
    dip.style.opacity = seg(t, CYCLE - DIP, CYCLE).toFixed(3);
  }

  // prime every scene once at its settled frame while it is laid out but invisible: a scene can measure
  // its own text, and the hub can publish the geometry the browser morph needs, before anything is seen.
  function prime() {
    ctx.t = 0;
    for (const s of segs) {
      s.sec.classList.add('on');
      s.sec.style.opacity = '0';
      if (!s.broken) {
        try { s.mod.render(s.dur, ctx); } catch (err) { report(s, 'prime', err); markBroken(s); }
      }
      s.sec.classList.remove('on');
      s.sec.style.opacity = '0';
    }
  }

  // ---------- fit the stage to the window (assets/ar.js picks the width) ----------
  function fit() {
    const w = W();
    stage.style.width = w + 'px';
    const k = Math.min(innerWidth / w, innerHeight / H);
    stage.style.transform = `translate(-50%, -50%) scale(${k})`;
  }
  fit();

  // ---------- the clock ----------
  const q = new URLSearchParams(location.search);
  const hasT = q.has('t');
  const tArg = hasT ? parseFloat(q.get('t')) : NaN;
  const freeze = hasT && !q.has('play') && isFinite(tArg);
  if (freeze) document.body.classList.add('freeze');
  const wrap = (t) => ((t % CYCLE) + CYCLE) % CYCLE;
  // ?t=<s> always starting point: it freezes on that frame, or with &play=1 plays on from it
  let paused = freeze;
  let offset = hasT && isFinite(tArg) ? tArg : 0;
  let base = performance.now();
  let lastT = 0;
  const clockNow = () => (paused ? offset : offset + (performance.now() - base) / 1000);
  function setTime(t) { offset = t; base = performance.now(); }
  function restart() { setTime(0); paused = false; }

  // Fonts in before the first frame. A scene that measures text (the hub measures its skeleton against the
  // real site) would otherwise measure a fallback face and get a layout that changes a moment later. The
  // await is before window.__AD is published, so __AD / __AD.ready keep exactly the shape above, and the
  // clock, ?t= freeze, ?t=&play=1, space and the arrow keys are untouched.
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (err) { /* no fonts API */ } }
  prime();
  render(wrap(offset));

  function frame() {
    let t = clockNow();
    t = Math.round(wrap(t) * FPS) / FPS;
    if (t >= CYCLE) t = 0;
    render(t);
    lastT = t;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  addEventListener('archange', () => {
    fit();
    render(lastT);
  });
  addEventListener('resize', fit);
  addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (paused) { paused = false; base = performance.now(); }
      else { offset = clockNow(); paused = true; }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      offset = wrap(clockNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25));
      paused = true;
    } else if (e.key === 'r' || e.key === 'R') {
      restart();
    }
  });

  // ---------- what the gallery and the renderer read ----------
  window.CYCLE = CYCLE;
  window.__AD = {
    id: cfg.id,
    seek(t) {
      paused = true;
      offset = t;
      const c = wrap(t);
      render(c);
      lastT = c;
    },
    loop: CYCLE,
    CYCLE,
    segments: segs.map(({ id, t0, t1, dur, fin, fout }) => ({ id, t0, t1, dur, fin, fout })),
    ready: true,
  };
}