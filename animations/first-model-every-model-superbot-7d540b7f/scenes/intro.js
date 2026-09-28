// scenes/intro.js: the opening 4.6s. "THE FIRST MODEL / WITH ALL THE MODELS" rises word by word out of a
// clip (only "ALL" wears the storm gradient + shine and lands with a scale pop), then under it a deck of
// superbot routing pills ("Switching to <Model>", the chat's .qc-sw chip rebuilt at native large size) swipes
// through 14 models on an accelerating cadence and resolves into a grid of every model's tile, each checked.
// render(lt) is a pure function of lt: every style is written from lt alone, nothing animates on its own.
import { clamp, lerp, seg, outCubic, outQuint, inOutCubic } from '../lib.js';

const B = (f) => new URL('../brand/' + f, import.meta.url).href;

// ---------- the roster (deck order; the user's five first) ----------
// k = logo size as a fraction of the tile (marks differ in how much of their box they fill)
const MODELS = [
  { name: 'Gemini', src: B('gemini-logo.svg'), k: 0.62 },
  { name: 'Opus 5.5', src: B('claude-logo.svg'), k: 0.6 },
  { name: 'DeepSeek', src: B('deepseek-logo.svg'), k: 0.64 },
  { name: 'Meshy', src: B('meshy-logo.svg'), k: 0.6 },
  { name: 'MiniMax', src: B('minimax-logo.svg'), k: 0.62 },
  { name: 'ChatGPT', src: B('openai-logo.svg'), k: 0.74 },
  { name: 'Grok', src: B('grok-logo.svg'), k: 0.58 },
  { name: 'ElevenLabs', src: B('elevenlabs-logo.svg'), k: 0.5 },
  { name: 'Kling', src: B('kling-logo.svg'), k: 0.62 },
  { name: 'Suno', src: B('suno-logo.svg'), k: 0.54 },
  { name: 'Runway', src: B('runway-logo.svg'), k: 0.56 },
  { name: 'Midjourney', src: B('midjourney-logo.svg'), k: 0.64 },
  { name: 'Qwen', src: B('qwen-logo.svg'), k: 0.6 },
  { name: 'FLUX', src: B('flux-logo.svg'), k: 0.62 },
];
const N = MODELS.length;

// ---------- timing (seconds, local) ----------
const DUR = 4.6;
const L1 = 0.10, L2 = 0.45, STAG = 0.05, WDUR = 0.62;      // title words
const RISE = 0.62, WBLUR = 12;                              // rise in em, blur px
const SHINE1 = [1.0, 1.5], SHINE2 = [3.3, 4.25];            // shine passes over "ALL"
const GRAD_V = 70;                                          // gradient drift px/s
const DECK_IN = [0.66, 1.06];                               // the deck rises in
const T0 = 0.95;                                            // Gemini is on top from here
// time each card stays on top: slow, accelerating to ~0.12s, the last two decelerating to land
const HOLD = [0.38, 0.31, 0.26, 0.21, 0.17, 0.14, 0.12, 0.12, 0.12, 0.12, 0.13, 0.15, 0.19];
const S = []; { let t = T0; for (const h of HOLD) { t += h; S.push(+t.toFixed(4)); } } // S[k]: card k leaves, k+1 arrives
const A = [T0, ...S];                                       // A[i]: card i reaches the top
const LAST_HOLD = 0.24;                                     // the last card rests, then the grid
const GRID_T = S[S.length - 1] + LAST_HOLD;                 // ~3.61
const GRID_STAG = 0.018, GRID_DUR = 0.34;

// ---------- deck geometry ----------
const DEPTH = [ // depth -> y offset, scale, shade
  { y: 0, s: 1, d: 0 }, { y: 18, s: 0.94, d: 0.72 }, { y: 34, s: 0.88, d: 0.86 }, { y: 46, s: 0.83, d: 1 },
];
// exit time: ~0.55x the card's dwell, capped at 0.2s
const XDUR = (i) => (i < HOLD.length ? Math.min(0.2, HOLD[i] * 0.55) : 0.2);
const XFADE = 0.36;                                         // exiting opacity is ~0 by ~36-45% of the exit
// the arriving card's content waits until the leaving card is below ~0.03 opacity
const GATE = (i) => (i > 0 ? S[i - 1] + XDUR(i - 1) * XFADE * 0.75 : -Infinity);
const GATE_UP = 0.06;
const GRID_TILE = 80, GRID_GAP = 18, GRID_COLS = 7;

// exits accelerate: cubic-bezier(0.3, 0, 1, 1)
function bez(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
    t = clamp(t);
    return sy(t);
  };
}
const exitEase = bez(0.3, 0, 1, 1);
// a gentler overshoot than outBack's default for the rising card
const outBackS = (x, s = 1.25) => { const c3 = s + 1; return 1 + c3 * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };

// sample a depth table at fractional depth
function depthAt(d) {
  const i = clamp(Math.floor(d), 0, DEPTH.length - 2), f = d - i;
  const a = DEPTH[i], b = DEPTH[i + 1];
  if (d < 0) { // overshoot above the top slot: extrapolate the 0->1 slope (transform only)
    return { y: a.y + (b.y - a.y) * d, s: a.s + (b.s - a.s) * d, d: 0 };
  }
  return { y: lerp(a.y, b.y, clamp(f)), s: lerp(a.s, b.s, clamp(f)), d: lerp(a.d, b.d, clamp(f)) };
}

const CHECK = '<svg class="ok" viewBox="0 0 24 24"><path d="M5 12.6l4.4 4.4L19 7.4"/></svg>';
const tileHTML = (m, cls) => `<div class="${cls}"><img src="${m.src}" alt="" decoding="sync" style="width:${(m.k * 100).toFixed(0)}%;height:${(m.k * 100).toFixed(0)}%"></div>`;

export default {
  id: 'intro',
  dur: DUR,
  ready: null,
  mount(sec) {
    const lines = [['THE', 'FIRST', 'MODEL'], ['WITH', 'ALL', 'THE', 'MODELS']];
    const ttl = lines.map((ws, li) => `<span class="ln">${ws.map((w) =>
      li === 1 && w === 'ALL'
        ? `<span class="wm"><span class="w wall"><span class="gt">ALL</span></span></span>`
        : `<span class="wm"><span class="w">${w}</span></span>`).join('')}</span>`).join('');
    const cards = MODELS.map((m, i) => `<div class="pc" data-i="${i}">${tileHTML(m, 'tl')}
      <div class="tx"><span class="t1">Switching to ${m.name}</span><span class="t2">Switching to ${m.name}</span></div>
      <div class="st"><i class="spin"></i>${CHECK}</div><i class="shade"></i><i class="rim"></i><i class="dim"></i></div>`).join('');
    const grid = MODELS.map((m, i) => `<div class="gc" data-i="${i}">${tileHTML(m, 'gt2')}<i class="gk">${CHECK}</i></div>`).join('');
    sec.innerHTML = `<div class="bg"></div><div class="glow"></div><div class="glow2"></div>
      <h1 class="ttl">${ttl}</h1>
      <div class="deck">${cards}</div>
      <div class="grid">${grid}</div>`;
    const q = (s) => [...sec.querySelectorAll(s)];
    const lns = q('.ttl .ln');
    this.el = {
      sec, ttl: sec.querySelector('.ttl'), glow: sec.querySelector('.glow'), glow2: sec.querySelector('.glow2'),
      words: lns.map((ln) => [...ln.querySelectorAll('.w')]),
      all: sec.querySelector('.wall'), gt: sec.querySelector('.gt'),
      deck: sec.querySelector('.deck'),
      cards: q('.pc').map((c) => ({ c, t1: c.querySelector('.t1'), t2: c.querySelector('.t2'), spin: c.querySelector('.spin'),
        ok: c.querySelector('.ok'), okp: c.querySelector('.ok path'), shade: c.querySelector('.shade'), dim: c.querySelector('.dim') })),
      grid: sec.querySelector('.grid'),
      tiles: q('.gc').map((g) => ({ g, k: g.querySelector('.gk') })),
    };
    this.fit = null;
    const imgs = [...sec.querySelectorAll('img')];
    this.ready = Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      ...imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve())),
    ]).then(() => { this.fit = null; });
  },

  // fit the title to the frame width (48px side margins), cached per width + font state
  measure(W) {
    const e = this.el;
    const key = W + '|' + (document.fonts ? document.fonts.status : '');
    if (this.fit && this.fit.key === key) return;
    e.ttl.style.fontSize = '100px';
    const widest = Math.max(...[...e.ttl.querySelectorAll('.ln')].map((l) => l.scrollWidth));
    const fs = Math.min(W >= 1400 ? 104 : 96, Math.floor(100 * (W - 96) / Math.max(1, widest) * 10) / 10);
    e.ttl.style.fontSize = fs + 'px';
    const gw = e.gt.offsetWidth;
    this.fit = { key, fs, gw };
  },

  render(lt, ctx) {
    const e = this.el;
    const W = (ctx && ctx.W) || 864;
    this.measure(W);

    // ---------- title ----------
    e.words.forEach((ws, li) => ws.forEach((w, wi) => {
      const a = (li === 0 ? L1 : L2) + wi * STAG;
      const p = outQuint(seg(lt, a, a + WDUR));
      const isAll = w === e.all;
      let tf = p >= 1 ? '' : `translateY(${((1 - p) * RISE).toFixed(4)}em)`;
      if (isAll) {
        // the pop: overshoot on scale only, landing with the shine
        const s = lerp(0.78, 1, outBackS(seg(lt, a + 0.04, a + 0.6), 2.2));
        tf += ` scale(${s.toFixed(4)})`;
      }
      w.style.transform = tf || 'none';
      w.style.opacity = clamp(p * 1.35).toFixed(3);
      const bl = (1 - p) * WBLUR;
      if (isAll) {
        // a soft storm glow under the word once it has landed
        const g = outCubic(seg(lt, a + 0.35, a + 0.9));
        w.style.filter = `${bl > 0.01 ? `blur(${bl.toFixed(2)}px) ` : ''}drop-shadow(0 0 ${(22 * g).toFixed(1)}px rgb(150 80 255 / ${(0.38 * g).toFixed(3)}))`;
      } else {
        w.style.filter = bl > 0.01 ? `blur(${bl.toFixed(2)}px)` : 'none';
      }
    }));
    // the gradient on "ALL": a seamless storm tile drifting left, under a white shine band
    {
      const gw = this.fit.gw || 200;
      const P = Math.round(gw * 2.3);
      const drift = ((lt * GRAD_V) % P + P) % P;
      const band = gw * 0.62;
      const f1 = inOutCubic(seg(lt, SHINE1[0], SHINE1[1]));
      const f2 = inOutCubic(seg(lt, SHINE2[0], SHINE2[1]));
      const f = lt < (SHINE1[1] + SHINE2[0]) / 2 ? f1 : f2;
      const sx = lerp(-band, gw + band * 0.1, f);
      e.gt.style.backgroundSize = `${band.toFixed(1)}px 100%, ${P}px 100%`;
      e.gt.style.backgroundPosition = `${sx.toFixed(1)}px 0, ${(-drift).toFixed(1)}px 0`;
    }
    // the whole title breathes forward very slightly across the scene
    e.ttl.style.transform = `translateY(-50%) scale(${lerp(1, 1.018, inOutCubic(seg(lt, 0.8, DUR))).toFixed(4)})`;

    // ---------- glow ----------
    const din = seg(lt, DECK_IN[0], DECK_IN[1]);
    const gIn = outCubic(seg(lt, 0.3, 1.3));
    e.glow.style.opacity = (gIn * (0.85 + 0.15 * Math.sin(lt * 1.7))).toFixed(3);
    e.glow.style.transform = `translate(-50%, -50%) scale(${lerp(0.8, 1, gIn).toFixed(4)}) rotate(${(lt * 9).toFixed(2)}deg)`;
    e.glow2.style.opacity = (outCubic(seg(lt, 0.2, 1.2)) * 0.9).toFixed(3);

    // ---------- the deck ----------
    const dIn = outCubic(din);
    e.deck.style.opacity = dIn.toFixed(3);
    e.deck.style.transform = `translateY(${((1 - outQuint(din)) * 46).toFixed(2)}px)`;
    // the peek: the back cards fan out from behind the top one as the deck lands (overshoot on transform)
    const spread = lerp(0, 1, outBackS(seg(lt, DECK_IN[0] + 0.12, DECK_IN[1] + 0.2), 1.6));
    // P: how many cards have left the top (fractional). Pb overshoots (transform), Pc does not (shade)
    let Pb = 0, Pc = 0;
    for (let k = 0; k < S.length; k++) {
      const hin = clamp(HOLD[k + 1 < HOLD.length ? k + 1 : k] * 1.6, 0.2, 0.34);
      const f = seg(lt, S[k], S[k] + hin);
      Pb += outBackS(f, 1.3); Pc += outCubic(f);
    }
    // the grid takeover: the last pill drops away
    const gOut = exitEase(seg(lt, GRID_T - 0.1, GRID_T + 0.06));
    e.cards.forEach((C, i) => {
      const c = C.c;
      const depthB = i - Pb, depthC = i - Pc;
      const leave = i < S.length ? S[i] : Infinity;
      const xdur = XDUR(i);
      const ex = lt >= leave ? exitEase(seg(lt, leave, leave + xdur)) : 0;
      if (depthC > 3.02 || ex >= 1 || (i === N - 1 && gOut >= 1) || lt < DECK_IN[0]) { c.style.visibility = 'hidden'; return; }
      c.style.visibility = 'visible';
      c.style.zIndex = String(100 - i);
      if (ex > 0) {
        // leaves up and away: 3D tilt back, shrink, motion blur, fade (accelerating)
        c.style.transform = `translate(-50%, -50%) translateY(${(-ex * 120).toFixed(2)}px) translateZ(${(-ex * 90).toFixed(1)}px) rotateX(${(ex * 52).toFixed(2)}deg) scale(${lerp(1, 0.92, ex).toFixed(4)})`;
        const raw = seg(lt, leave, leave + xdur);
        c.style.opacity = (1 - outCubic(seg(raw, 0, XFADE))).toFixed(3);
        c.style.filter = `blur(${Math.min(8, raw * 22 + ex * 4).toFixed(2)}px)`; // motion blur from the first frame
        C.shade.style.opacity = '0'; C.dim.style.opacity = '0';
      } else {
        const dB = depthAt(Math.max(depthB, -0.6)), dC = depthAt(Math.max(depthC, 0));
        const y = dB.y * spread, s = lerp(1, dB.s, spread);
        let tf = `translate(-50%, -50%) translateY(${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
        let op = depthC > 2 ? clamp(3 - depthC) : 1;
        if (depthC > 0.02) op *= clamp(spread * 4);
        if (i === N - 1 && gOut > 0) {
          tf += ` scale(${lerp(1, 0.9, gOut).toFixed(4)})`;
          op *= 1 - gOut;
          c.style.filter = `blur(${(gOut * 4).toFixed(2)}px)`;
        } else c.style.filter = 'none';
        c.style.transform = tf;
        c.style.opacity = op.toFixed(3);
        // back cards: content hidden under a flat face, the rim stays crisp, the whole card dims with depth
        const dd = Math.max(depthC, 0);
        // the arriving card's text + logo hold at 0.15 until the leaving card has faded, then come up fast
        const g0 = GATE(i), gate = lerp(0.15, 1, outCubic(seg(lt, g0, g0 + GATE_UP)));
        C.shade.style.opacity = Math.max(clamp((dd - 0.5) * 2.2), 1 - gate).toFixed(3);
        C.dim.style.opacity = clamp(dd * 0.14).toFixed(3);
      }
      // pill state: spinner + shimmer until the check lands; the fast cards arrive already checked
      const top = A[i], hold = i < HOLD.length ? HOLD[i] : LAST_HOLD;
      const fast = hold < 0.2;
      const okAt = fast ? -1 : top + (i === N - 1 ? 0.07 : Math.min(hold * 0.5, 0.2));
      const k = fast ? 1 : seg(lt, okAt, okAt + 0.16);
      C.t2.style.opacity = outCubic(fast ? 1 : seg(lt, okAt - 0.02, okAt + 0.12)).toFixed(3);
      C.t1.style.backgroundPosition = `${(100 - (((lt - top + 0.6) * 170) % 250)).toFixed(1)}% 0`;
      C.spin.style.opacity = (1 - clamp(k * 3)).toFixed(3);
      C.spin.style.transform = `rotate(${((lt * 760) % 360).toFixed(1)}deg)`;
      C.ok.style.opacity = clamp(k * 3).toFixed(3);
      C.ok.style.transform = `scale(${lerp(0.55, 1, outBackS(k, 2)).toFixed(4)})`;
      C.okp.style.strokeDashoffset = (22 * (1 - outCubic(k))).toFixed(2);
    });

    // ---------- the grid: every model at once, each checked ----------
    const cols = GRID_COLS, rows = Math.ceil(N / cols);
    const pitch = GRID_TILE + GRID_GAP;
    let any = false;
    e.tiles.forEach((T, i) => {
      const r = Math.floor(i / cols), cI = i % cols;
      const tx = (cI - (cols - 1) / 2) * pitch, ty = (r - (rows - 1) / 2) * (pitch + 6);
      // a burst from the deck's centre outward: the middle column first
      const a = GRID_T + (Math.abs(cI - (cols - 1) / 2) * 2 + r) * GRID_STAG;
      const f = seg(lt, a, a + GRID_DUR);
      if (f <= 0) { T.g.style.visibility = 'hidden'; return; }
      any = true;
      T.g.style.visibility = 'visible';
      const m = outBackS(f, 1.35), mp = outQuint(f);
      // each tile expands out of the pill's footprint into its slot (overshoot on transform only)
      const k0 = 0.5;
      T.g.style.transform = `translate(-50%, -50%) translate(${(tx * lerp(k0, 1, m)).toFixed(2)}px, ${(ty * lerp(k0, 1, m)).toFixed(2)}px) scale(${lerp(0.6, 1, m).toFixed(4)})`;
      T.g.style.opacity = outCubic(clamp(f * 2.6)).toFixed(3);
      T.g.style.filter = f < 0.5 ? `blur(${((1 - f * 2) * 5).toFixed(2)}px)` : 'none';
      const kf = seg(lt, a + GRID_DUR * 0.55, a + GRID_DUR * 0.55 + 0.22);
      T.k.style.opacity = clamp(kf * 3).toFixed(3);
      T.k.style.transform = `scale(${lerp(0.4, 1, outBackS(kf, 2.2)).toFixed(4)})`;
    });
    e.grid.style.visibility = any ? 'visible' : 'hidden';
  },
};
