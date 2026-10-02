/* ==========================================================================
   icons.js — item #3: icon orbit-and-merge 3D layer
   Six model tiles (ChatGPT / Gemini / Claude / DeepSeek / Hermes / Grok) orbit a
   ring around the phone, then fly in and fuse into one Superbot tile on the
   phone's screen; the flash at MERGE_ON_AT is the moment the screen powers on.

   Module API (consumed by stage.js, item #2):

     import icons from './icons.js';
     icons.mount(document.getElementById('icons'), { W, H });   // stage px
     icons.render(t);                                           // ad seconds
     icons.TOTAL        // 16.40 — stop calling render past this
     icons.MERGE_ON_AT  // 3.10  — SCREEN POWER-ON instant (unchanged value)
     icons.MERGE_T      // 14.90 — the merge / fusion instant
     icons.PULSES       // routing pulses: [{ t, i, model }]

   Side channel, read by stage.js before it starts the source ad:
     window.__ICONS_FLASH = { t: 3.10, mergeT: 14.90 }

   Timing is anchored to the FILM: screen-on at 3.10, and the merge at ad 14.90,
   which is source t 11.80 + 3.10 — the frame where the source ad's own
   "Switched to Superbot" routing chip settles into the thread. The 3.10 flash is
   the screen powering on; by 14.90 the screen has been live for 11.8s, so the
   merge flash reads as the six models fusing, not as a power-on.

   Geometry: x = R*cos(theta), z = R*sin(theta), y = -110 + 42*sin(2*theta),
   all scaled by K = stageH/1080 so the ring keeps its proportion on any canvas.
   Depth is sold by scale (1 + z/1400) and dimming (opacity .55 at z = -300),
   because this layer is composited above the phone, not inside its stacking
   context. Only transform/opacity are ever written; no layout reads per frame.
   ========================================================================== */

/* ---- timeline (ad seconds) ------------------------------------------------
   The beat is anchored on the source film, not on us: ad time = source t + 3.10.
   The merge lands exactly when the source ad's own "Switched to Superbot"
   routing chip settles in the thread (source t = 11.80, captured frame
   /tmp/ic-ab7049c5/chip/t011.80.png), i.e. ad 14.90. The flash at 3.10 is the
   SCREEN POWER-ON only — by merge time the screen has been live for 11.8s, so
   the merge flash reads as the fusion, not as a power-on.                      */
const SCREEN_ON = 3.10;     // phone screen lights up (exported as MERGE_ON_AT)
const MERGE_T = 14.90;      // "Switched to Superbot" + 3.10
const TOTAL = MERGE_T + 1.5;
const ORBIT_STOP = MERGE_T - 0.95;   // ring stops turning this long before the merge
const ORBIT_EASE = 0.50;             // ... eased to a stop over this window

const T_IN = 0.45;          // first tile starts entering
const IN_DUR = 0.50;        // per-tile entrance duration
const IN_STAG = 0.06;       // per-index entrance stagger
const T_ORBIT = 1.60;       // ring starts turning
const ORBIT_W = 0.34;       // rad/s
const M_STAG = 0.085;       // per-tile merge stagger (front tiles lead)
const M_DUR = 0.85;         // per-tile merge flight
const M_FADE = 0.25;        // fade-out tail inside the flight
const M_END_S = 0.22;       // tile size at the moment it is absorbed
const FLASH_LEAD = 0.07;    // bloom attack
const FLASH_DUR = 0.55;     // bloom decay
const RIPPLE_DUR = 0.70;    // one expanding ring
const SB_IN = MERGE_T;      // superbot tile pops as the first models arrive
const SB_IN_DUR = 0.45;
const SB_BANK = MERGE_T + 0.28;      // ... and banks out once the flash has peaked
const SB_BANK_DUR = 0.50;

/* Routing pulses: the tile whose model the ad is currently routed to leans
   toward the phone screen and lights up. Keyed to the source film's own routing
   moments (source 1.40 and 7.70 → ad 4.50 and 10.80). */
const PULSES = Object.freeze([
  { t: 4.50, i: 1, model: 'Gemini' },
  { t: 10.80, i: 3, model: 'DeepSeek' }
]);
const PULSE_RISE = 0.45;
const PULSE_FALL = 0.60;
const PULSE_LEAN = 34;      // px of lean toward the screen centre at pulse peak
const PULSE_SCALE = 0.08;   // +8% size at pulse peak

/* ---- geometry ------------------------------------------------------------ */
const RING = 6;
const TILE = 92;            // px at K = 1
const R_ORBIT = 432;
const R_ENTER = 220;        // radial overshoot each tile starts from
const Y_BASE = -110;
const Y_WAVE = 42;
const BOB = 6;
const DEPTH_Z = 1400;
const DIM_Z = 300;
const DIM_MIN = 0.55;
const TH0_BASE = Math.PI / 2 - 0.55;   // ring phase offset: no two tiles ever share a slot
const TH0 = Array.from({ length: RING }, (_, i) => TH0_BASE + i * (Math.PI * 2) / RING);

/* ---- easing -------------------------------------------------------------- */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, p) => a + (b - a) * p;
const outCubic = p => 1 - Math.pow(1 - p, 3);
const outQuint = p => 1 - Math.pow(1 - p, 5);
function outBack(p) {
  const c1 = 1.70158, c3 = c1 + 1;
  const q = p - 1;
  return 1 + c3 * q * q * q + c1 * q * q;
}
const deg = r => r * 180 / Math.PI;

/* ---- assets -------------------------------------------------------------- */
const SRC = (() => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return new URL('../every-model-one-chat-superbot-efa8df82/', import.meta.url).href;
    }
  } catch (e) { /* not a module context — fall back to the document-relative path */ }
  return '../every-model-one-chat-superbot-efa8df82/';
})();

// Claude mark: path copied verbatim out of <symbol id="tbs-ic-claude"> in
// scenes/tabs-assets/icons.js of the source ad (that file is not edited).
const CLAUDE_PATH = 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z';

const MODELS = [
  { label: 'ChatGPT',  src: SRC + 'brand/openai-logo.svg',            accent: '#10a37f' },
  { label: 'Gemini',   src: SRC + 'brand/gemini-logo.svg',            accent: '#4d8bff' },
  { label: 'Claude',   svgPath: CLAUDE_PATH, accent: '#d97757',       markFill: '#f4efe9' },
  { label: 'DeepSeek', src: SRC + 'brand/deepseek-logo.svg',          accent: '#4d6bfe' },
  { label: 'Hermes',   src: SRC + 'scenes/tabs-assets/hermes.png',    accent: '#e0b27c' },
  { label: 'Grok',     src: SRC + 'scenes/tabs-assets/grok.png',      accent: '#d7deea' }
];
const SUPERBOT_SRC = SRC + 'scenes/tabs-assets/tile.svg';

/* ---- stylesheet self-attach --------------------------------------------- */
/* index.html (item #2) is not required to link icons.css, so this module makes
   sure its own stylesheet is present — once, and never twice. */
const CSS_URL = (() => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return new URL('./icons.css', import.meta.url).href;
    }
  } catch (e) { /* noop */ }
  return './icons.css';
})();
function ensureStyles() {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.querySelector('link[href*="icons.css"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  link.setAttribute('data-icons-css', '');
  link.addEventListener('load', () => { S.rectOk = false; S.measureTries = 0; measure(); });
  document.head.appendChild(link);
}

/* ---- reduced motion ------------------------------------------------------ */
let REDUCED = false;
try {
  if (typeof window !== 'undefined' && window.matchMedia) {
    REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
} catch (e) { /* noop */ }

/* ---- state --------------------------------------------------------------- */
const S = {
  layer: null, mounted: false, hidden: false, wiped: false,
  ctx: { W: 1920, H: 1080 }, K: 1, R: R_ORBIT,
  rect: { left: 0, top: 0, scale: 1 }, rectOk: false, measureTries: 0,
  tiles: [], sb: null, bloom: null, ripple: null,
  rank: null, frames: 0
};

/* ---- helpers ------------------------------------------------------------- */
/* The layer sits LAYER_Z px in front of the phone's plane (see icons.css). #rig's
   perspective magnifies anything at positive z, so a naive translateZ would move
   every icon outward by that factor. measure() reads the magnification back off
   the element itself and cancels it with a matching scale — self-calibrating, so
   it works whatever perspective the stage page happens to use (and degrades to a
   no-op when there is no perspective at all, since the rect then stays W wide). */
const LAYER_Z = 200;
const LAYER_T = 'translateZ(' + LAYER_Z + 'px)';

function measure() {
  if (!S.layer) return;
  const el = S.layer;
  const W = S.ctx.W, H = S.ctx.H;
  try {
    /* 1. the layer's box with no z lift — its width is the stage scale (#stage
          may be centred + scaled by the host page), which must NOT be cancelled. */
    el.style.transform = 'translateZ(0px)';
    const r0 = el.getBoundingClientRect();
    /* 2. ... and with the lift, which is the perspective magnification we DO cancel. */
    el.style.transform = LAYER_T;
    const r1 = el.getBoundingClientRect();
    let inv = 1;
    if (r0.width > 1 && r1.width > 1) inv = clamp(r0.width / r1.width, 0.5, 2);
    el.style.transform = LAYER_T + ' scale(' + inv.toFixed(6) + ')';
    const r = el.getBoundingClientRect();
    if (r.width > 1) {
      S.rect = { left: r.left, top: r.top, scale: r.width / W };
    } else {
      S.rect = { left: 0, top: 0, scale: 1 };
    }
    /* Sane only once this file's own stylesheet is live: then #icons is a
       stage-shaped box. Until then (module eval runs before the injected <link>
       finishes loading, and then #icons is an unstyled static div) the rect is
       garbage, so render() keeps re-measuring. */
    const ratio = r.width > 1 ? r.height / r.width : 0;
    S.rectOk = r.height > 40 && Math.abs(ratio - H / W) < 0.06;
  } catch (e) {
    S.rect = { left: 0, top: 0, scale: 1 };
    S.rectOk = false;
  }
}

/* world position of the phone-screen centre, expressed relative to the layer
   centre, in stage px. __PHONE.screenRect() is the host's own getBoundingClientRect
   in screen px, so it is mapped back through the stage scale we measure here. */
function targetPoint() {
  const W = S.ctx.W, H = S.ctx.H;
  const p = (typeof window !== 'undefined') ? window.__PHONE : null;
  if (p && typeof p.screenRect === 'function') {
    try {
      const r = p.screenRect();
      if (r && isFinite(r.x) && isFinite(r.y)) {
        const sc = S.rect.scale || 1;
        const stx = (r.x + (r.w || 0) / 2 - S.rect.left) / sc;
        const sty = (r.y + (r.h || 0) / 2 - S.rect.top) / sc;
        return { x: stx - W / 2, y: sty - H / 2, live: true };
      }
    } catch (e) { /* host not ready — use the fallback below */ }
  }
  return { x: 0, y: -140 * S.K, live: false };
}

function tiltOf() {
  const p = (typeof window !== 'undefined') ? window.__PHONE : null;
  if (p && typeof p.tilt === 'function') {
    try {
      const q = p.tilt();
      if (q) return { rx: +q.rx || 0, ry: +q.ry || 0 };
    } catch (e) { /* noop */ }
  }
  return { rx: 0, ry: 0 };
}

/* Orbit angle: constant 0.34 rad/s from T_ORBIT until ORBIT_STOP (mergeT-0.95),
   with the last ORBIT_EASE seconds eased to a dead stop so the ring settles into
   the pre-merge hold instead of snapping. Continuous and non-decreasing. */
function orbitAt(t) {
  const u = Math.min(Math.max(t, 0), ORBIT_STOP);
  if (u <= T_ORBIT) return 0;
  const linear = Math.max(0, Math.min(u, ORBIT_STOP - ORBIT_EASE) - T_ORBIT);
  let a = ORBIT_W * linear;
  if (u > ORBIT_STOP - ORBIT_EASE) {
    const q = (u - (ORBIT_STOP - ORBIT_EASE)) / ORBIT_EASE;   // 0..1
    a += ORBIT_W * ORBIT_EASE * (1 - Math.pow(1 - q, 3)) / 3;
  }
  return a;
}

/* Routing pulse envelope: outCubic in over PULSE_RISE, eased back over
   PULSE_FALL. 1 at the peak, 0 outside [t0, t0+1.05]. */
function pulseAt(t, i) {
  let p = 0;
  for (let k = 0; k < PULSES.length; k++) {
    const P = PULSES[k];
    if (P.i !== i || t <= P.t) continue;
    const rise = outCubic(clamp((t - P.t) / PULSE_RISE, 0, 1));
    const fall = outCubic(clamp((t - (P.t + PULSE_RISE)) / PULSE_FALL, 0, 1));
    const v = rise * (1 - fall);
    if (v > p) p = v;
  }
  return p;
}

function snapshotRank() {
  const zs = TH0.map((base, i) => ({ i, z: Math.sin(base + orbitAt(MERGE_T)) }));
  zs.sort((a, b) => (b.z - a.z) || (a.i - b.i));
  const rank = new Array(RING);
  zs.forEach((o, k) => { rank[o.i] = k; });
  S.rank = rank;
}

function setHidden(hide) {
  if (!S.layer) return;
  S.layer.style.opacity = hide ? '0' : '1';
  if (hide) {
    for (let i = 0; i < S.tiles.length; i++) S.tiles[i].el.style.opacity = '0';
    if (S.sb) S.sb.style.opacity = '0';
    if (S.bloom) S.bloom.style.opacity = '0';
    if (S.ripple) S.ripple.style.opacity = '0';
  }
}

/* ---- build --------------------------------------------------------------- */
const NS = 'http://www.w3.org/2000/svg';

function build() {
  const layer = S.layer;
  const K = S.K;
  const T = TILE * K;
  const half = T / 2;

  layer.textContent = '';
  S.tiles = [];

  MODELS.forEach((m, i) => {
    const el = document.createElement('div');
    el.className = 'is-tile';
    el.style.width = T + 'px';
    el.style.height = T + 'px';
    el.style.margin = (-half) + 'px 0 0 ' + (-half) + 'px';
    el.style.setProperty('--accent', m.accent);
    el.style.opacity = '0';

    const glow = document.createElement('div');
    glow.className = 'is-tile__glow';

    const face = document.createElement('div');
    face.className = 'is-tile__face';

    let mark;
    if (m.svgPath) {
      mark = document.createElementNS(NS, 'svg');
      mark.setAttribute('viewBox', '0 0 24 24');
      mark.setAttribute('class', 'is-tile__mark');
      mark.setAttribute('fill', m.markFill || 'currentColor');
      mark.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', m.svgPath);
      mark.appendChild(path);
    } else {
      mark = document.createElement('img');
      mark.className = 'is-tile__mark';
      mark.src = m.src;
      mark.alt = m.label;
      mark.draggable = false;
      mark.decoding = 'async';
      mark.addEventListener('error', () => {
        console.error('[icons] asset failed to load: ' + m.src);
      });
    }

    face.appendChild(mark);
    el.appendChild(glow);
    el.appendChild(face);
    layer.appendChild(el);
    S.tiles.push({ el, glow, mark });
  });

  /* ---- superbot tile ---- */
  const sb = document.createElement('div');
  sb.className = 'is-sb';
  sb.style.width = T + 'px';
  sb.style.height = T + 'px';
  sb.style.margin = (-half) + 'px 0 0 ' + (-half) + 'px';
  sb.style.opacity = '0';
  const halo = document.createElement('div');
  halo.className = 'is-sb__halo';
  const sbImg = document.createElement('img');
  sbImg.className = 'is-sb__img';
  sbImg.src = SUPERBOT_SRC;
  sbImg.alt = 'Superbot';
  sbImg.draggable = false;
  sbImg.decoding = 'async';
  sbImg.addEventListener('error', () => {
    console.error('[icons] asset failed to load: ' + SUPERBOT_SRC);
  });
  sb.appendChild(halo);
  sb.appendChild(sbImg);
  layer.appendChild(sb);
  S.sb = sb;

  /* ---- flash: bloom + one ripple ---- */
  const SIZE = 560 * K;
  const bloom = document.createElement('div');
  bloom.className = 'is-bloom';
  bloom.style.width = bloom.style.height = SIZE + 'px';
  bloom.style.margin = (SIZE / -2) + 'px 0 0 ' + (SIZE / -2) + 'px';
  bloom.style.opacity = '0';
  layer.appendChild(bloom);
  S.bloom = bloom;

  const ripple = document.createElement('div');
  ripple.className = 'is-ripple';
  ripple.style.width = ripple.style.height = SIZE + 'px';
  ripple.style.margin = (SIZE / -2) + 'px 0 0 ' + (SIZE / -2) + 'px';
  ripple.style.opacity = '0';
  layer.appendChild(ripple);
  S.ripple = ripple;
}

/* ---- mount --------------------------------------------------------------- */
function mount(layer, ctx) {
  if (!layer || typeof document === 'undefined') return api;
  if (S.mounted && S.layer === layer) return api;

  ensureStyles();

  S.layer = layer;
  S.ctx = {
    W: (ctx && +ctx.W) || layer.clientWidth || 1920,
    H: (ctx && +ctx.H) || layer.clientHeight || 1080
  };
  S.K = clamp(S.ctx.H / 1080, 0.5, 2);
  S.R = Math.min(R_ORBIT * S.K, S.ctx.W / 2 - TILE * S.K * 0.75);
  S.mounted = true;
  S.hidden = false;
  S.rank = null;
  S.wiped = false;
  S.rectOk = false;
  S.measureTries = 0;

  build();
  measure();
  setHidden(false);

  window.__ICONS_FLASH = { t: SCREEN_ON, mergeT: MERGE_T };
  window.__ICONS_LAYER = api;

  window.addEventListener('resize', measure);
  try {
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const on = () => { REDUCED = mq.matches; };
      if (mq.addEventListener) mq.addEventListener('change', on);
      else if (mq.addListener) mq.addListener(on);
    }
  } catch (e) { /* noop */ }

  return api;
}

/* ---- render -------------------------------------------------------------- */
function render(t) {
  if (!S.mounted || !S.layer) return;
  if (typeof t !== 'number' || !isFinite(t)) t = 0;
  if (t < 0) t = 0;
  if (t >= TOTAL) {
    if (!S.wiped) { setHidden(true); S.wiped = true; }
    return;
  }
  if (S.wiped) { S.wiped = false; setHidden(false); }
  /* re-measure until the stylesheet is live and the layer is a stage-shaped box
     (bounded, so a page that never loads icons.css cannot cause a per-frame
     getBoundingClientRect forever) */
  if (!S.rectOk && S.measureTries < 40) { S.measureTries++; measure(); }
  S.frames++;

  const K = S.K;
  const R = S.R;
  const orb = REDUCED ? 0 : orbitAt(t);
  const tp = targetPoint();
  const tilt = tiltOf();

  if (t >= MERGE_T && !S.rank) snapshotRank();

  /* ---- six orbiting tiles ---- */
  for (let i = 0; i < RING; i++) {
    const slot = S.tiles[i];
    if (!slot) continue;
    const el = slot.el;

    const e = REDUCED ? 1 : outCubic(clamp((t - (T_IN + i * IN_STAG)) / IN_DUR, 0, 1));
    if (e <= 0) {
      if (el.style.opacity !== '0') el.style.opacity = '0';
      continue;
    }

    const th = TH0[i] + orb;
    const thD = deg(th);
    const dist = R + R_ENTER * K * (1 - e);

    let x = dist * Math.cos(th);
    let z = dist * Math.sin(th);
    let y = (Y_BASE + Y_WAVE * Math.sin(2 * th)) * K;
    if (!REDUCED) y += BOB * K * Math.sin(t * 2 + i);

    /* routing pulse: lean toward the screen centre and light up */
    let pulse = 0;
    if (t < MERGE_T && !REDUCED) {
      pulse = pulseAt(t, i);
      if (pulse > 0) {
        const dx = tp.x - x, dy = tp.y - y;
        const dl = Math.sqrt(dx * dx + dy * dy) || 1;
        const lean = PULSE_LEAN * K * pulse;
        x += dx / dl * lean;
        y += dy / dl * lean;
      }
    }

    let mp = 0;
    let fade = 1;
    if (t >= MERGE_T) {
      const d = MERGE_T + M_STAG * (S.rank ? S.rank[i] : i);
      mp = outQuint(clamp((t - d) / M_DUR, 0, 1));
      fade = 1 - clamp((t - (d + M_DUR - M_FADE)) / M_FADE, 0, 1);
      x = lerp(x, tp.x, mp);
      y = lerp(y, tp.y, mp);
      z = lerp(z, 0, mp);
    }
    if (fade <= 0) {
      if (el.style.opacity !== '0') el.style.opacity = '0';
      continue;
    }

    const ds = clamp(1 + z / DEPTH_Z, 0.55, 1.4);
    const dOp = 1 - (1 - DIM_MIN) * clamp(-z / DIM_Z, 0, 1);
    const sIn = lerp(0.55, 1, e) * ds * (1 + PULSE_SCALE * pulse);
    const scale = lerp(sIn, M_END_S, mp);

    /* yaw the tile out of the screen plane so the ring reads as 3D: it is exact
       at the front (0deg, dead-on to camera) and eased toward edge-on at the
       sides, with the phone's own tilt counter-rotated out. Damped to 0 as the
       tile lands so it meets the screen face-on. */
    const yawOut = clamp(-(thD - 90) * 0.72, -62, 62);
    const ry = lerp(yawOut - tilt.ry * 0.6, 0, mp);
    const rx = -tilt.rx * 0.6 * (1 - mp);
    const rz = REDUCED ? 0 : lerp(-18, 0, e);

    el.style.opacity = (e * dOp * fade).toFixed(3);
    el.style.transform =
      'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,' + z.toFixed(2) + 'px) ' +
      'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) ' +
      'rotateZ(' + rz.toFixed(2) + 'deg) scale(' + scale.toFixed(4) + ')';

    const g = slot.glow;
    g.style.opacity = (0.5 + 0.5 * mp + 0.55 * pulse).toFixed(3);
    g.style.transform = 'scale(' + (1 + 0.55 * mp + 0.5 * pulse).toFixed(3) + ')';
  }

  /* ---- superbot tile: the single tile everything fuses into ---- */
  const sb = S.sb;
  if (sb) {
    if (t < SB_IN) {
      if (sb.style.opacity !== '0') sb.style.opacity = '0';
    } else if (t >= SB_BANK + SB_BANK_DUR) {
      if (sb.style.opacity !== '0') sb.style.opacity = '0';
    } else {
      const pin = clamp((t - SB_IN) / SB_IN_DUR, 0, 1);
      let s = lerp(0.5, 1, outBack(pin));
      let o = 1;
      if (t > SB_BANK) {
        const bp = clamp((t - SB_BANK) / SB_BANK_DUR, 0, 1);
        s *= lerp(1, 0.35, bp);
        o = 1 - bp;
      }
      sb.style.opacity = o.toFixed(3);
      sb.style.transform =
        'translate3d(' + tp.x.toFixed(2) + 'px,' + tp.y.toFixed(2) + 'px,0px) scale(' + s.toFixed(4) + ')';
    }
  }

  /* ---- merge flash at MERGE_T (the fusion, not the power-on) ---- */
  const g = t - MERGE_T;
  const bloom = S.bloom, ripple = S.ripple;
  if (bloom) {
    if (g < 0 || g > FLASH_DUR) {
      if (bloom.style.opacity !== '0') bloom.style.opacity = '0';
    } else {
      const gp = clamp(g / FLASH_DUR, 0, 1);
      const rise = clamp(g / FLASH_LEAD, 0, 1);
      bloom.style.opacity = (0.9 * Math.min(rise, 1 - gp)).toFixed(3);
      bloom.style.transform = 'translate3d(' + tp.x.toFixed(2) + 'px,' + tp.y.toFixed(2) + 'px,0px) scale(' +
        lerp(0.55, 1.35, gp).toFixed(3) + ')';
    }
  }
  if (ripple) {
    if (g < 0 || g > RIPPLE_DUR) {
      if (ripple.style.opacity !== '0') ripple.style.opacity = '0';
    } else {
      const rp = clamp(g / RIPPLE_DUR, 0, 1);
      ripple.style.opacity = (0.5 * (1 - rp)).toFixed(3);
      ripple.style.transform = 'translate3d(' + tp.x.toFixed(2) + 'px,' + tp.y.toFixed(2) + 'px,0px) scale(' +
        lerp(0.2, 1.6, rp).toFixed(3) + ')';
    }
  }
}

/* ---- public API ----------------------------------------------------------
   MERGE_ON_AT keeps its original value/meaning for the host page: the instant
   the phone screen powers on (3.10). The merge itself is later and is exported
   separately as MERGE_T, so stage.js is never silently re-pointed. */
const api = { mount, render, TOTAL, MERGE_ON_AT: SCREEN_ON, MERGE_T, SCREEN_ON, PULSES };

if (typeof window !== 'undefined') {
  /* available from module evaluation on, so the stage can read it at PHONE_IN
     (0.35s) even if that lands before mount() */
  window.__ICONS_FLASH = { t: SCREEN_ON, mergeT: MERGE_T };
  window.__ICONS_LAYER = api;
}

export default api;