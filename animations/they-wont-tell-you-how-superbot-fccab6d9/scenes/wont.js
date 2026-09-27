// they-wont-tell-you-how-superbot: the second scene, the dramatic beat between the tweet opener and the superbot hub.
// Pure black frame; THEY / WONT / TELL / YOU / HOW stacked as one centred column of stark white Anton caps, one word
// per line, each word slamming in on its own beat (opacity 0 -> 1 inside two frames, scale 1.18 -> 1 over 0.2s
// outQuint, a 2px vertical settle). HOW lands last with a heavier hit (a bigger start scale and a short undershoot).
// Landed words carry transform: none, so they are perfectly still. The column then holds and the scene hard cuts
// both ways (fadeIn 0, fadeOut 0). render(lt) is a pure function of local time and the frame width.
//
// The font (Anton, SIL OFL 1.1, fonts/anton-latin-400.woff2 + fonts/OFL.txt) is loaded by this module's top-level
// await, and timeline.js awaits the module import before it mounts and sets __AD.ready, so no frame is ever drawn
// in a fallback face.
import { clamp, lerp, seg, outQuint, outCubic } from '../lib.js';

const H = 1080;
const FAMILY = 'Wont Anton';
const WORDS = ['THEY', 'WONT', 'TELL', 'YOU', 'HOW'];

// timing (seconds, scene-local)
const FIRST = 0.15;     // THEY lands
const STEP = 0.36;      // one word every STEP
const SNAP = 2 / 60;    // opacity 0 -> 1 within two 60fps frames
const SCALE_DUR = 0.2;  // scale settle, outQuint
const S0 = 1.18;        // start scale of a word
const S0_LAST = 1.3;    // HOW hits harder
const DIP = 0.035;      // HOW's undershoot below 1 after it lands
const DIP_A = 0.12, DIP_B = 0.34; // undershoot window, relative to HOW's land time
const SETTLE_PX = 2;    // vertical settle: a word drops the last 2px into place

// layout (px, the 1080-tall stage)
const COL_FRAC = 0.76;  // the column (cap top of THEY to baseline of HOW) fills this much of the frame height
const GAP_FRAC = 0.13;  // gap between lines as a fraction of the cap height (tight leading)
const MAX_W_FRAC = 0.84; // the widest word never exceeds this share of the frame width

const landAt = (i) => FIRST + i * STEP;

// load the face before the module resolves (timeline.js awaits this import)
const FONT_URL = new URL('../fonts/anton-latin-400.woff2', import.meta.url).href;
try {
  const face = new FontFace(FAMILY, `url(${FONT_URL}) format('woff2')`, { weight: '400', style: 'normal', display: 'block' });
  await face.load();
  document.fonts.add(face);
} catch (err) {
  console.error('[they-wont] wont: Anton failed to load, falling back to the stylesheet face', err);
  try { await document.fonts.load(`400 100px "${FAMILY}"`); } catch (e) { /* keep the fallback stack */ }
}

// font metrics per 1px of font-size, measured once in the loaded face
function measureFont() {
  const cv = document.createElement('canvas').getContext('2d');
  cv.font = `400 100px "${FAMILY}"`;
  const caps = cv.measureText('THEYWONTTELLYOUHOW');
  const cap = (caps.actualBoundingBoxAscent || 73) / 100;
  const asc = (caps.fontBoundingBoxAscent || 117) / 100;
  const desc = (caps.fontBoundingBoxDescent || 33) / 100;
  const widths = WORDS.map((w) => cv.measureText(w).width / 100);
  return { cap, asc, desc, widest: Math.max(...widths) };
}

let el = null;

// the column geometry for a frame width: font size, and each word's box top so its caps sit on the grid
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const m = el.metrics;
  const n = WORDS.length;
  // column height in cap units: n caps + (n - 1) gaps
  const units = n + (n - 1) * GAP_FRAC;
  let fs = (H * COL_FRAC) / (units * m.cap);
  fs = Math.min(fs, (W * MAX_W_FRAC) / m.widest);
  const cap = m.cap * fs, gap = GAP_FRAC * cap;
  const colH = n * cap + (n - 1) * gap;
  const top0 = (H - colH) / 2;
  // a word box is font-size tall (line-height 1); its baseline sits at half-leading + ascent from the box top
  const baseInBox = (fs - (m.asc + m.desc) * fs) / 2 + m.asc * fs;
  const capMidInBox = baseInBox - cap / 2;
  const tops = WORDS.map((_, i) => top0 + i * (cap + gap) + cap - baseInBox);
  el.words.forEach((w, i) => {
    w.style.fontSize = fs.toFixed(3) + 'px';
    w.style.top = tops[i].toFixed(3) + 'px';
    w.style.transformOrigin = `50% ${capMidInBox.toFixed(3)}px`;
  });
  el.lay = { W, fs, cap, gap, colH, top0 };
  return el.lay;
}

function renderWord(w, i, lt) {
  const at = landAt(i);
  if (lt < at) {
    w.style.opacity = '0';
    w.style.transform = 'none';
    return;
  }
  const last = i === WORDS.length - 1;
  const o = seg(lt, at, at + SNAP);
  const p = outQuint(seg(lt, at, at + SCALE_DUR));
  let s = lerp(last ? S0_LAST : S0, 1, p);
  if (last) s -= DIP * Math.sin(Math.PI * seg(lt, at + DIP_A, at + DIP_B));
  const y = -SETTLE_PX * (1 - outCubic(seg(lt, at, at + SCALE_DUR)));
  w.style.opacity = clamp(o).toFixed(3);
  const still = p >= 1 && (!last || lt >= at + DIP_B);
  w.style.transform = still ? 'none' : `translateY(${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
}

export default {
  id: 'wont',
  dur: 3.4,
  // hard cut in from the tweet, hard cut out into the hub
  fadeIn: 0,
  fadeOut: 0,

  mount(section) {
    section.innerHTML = `<div class="wont-col" aria-label="${WORDS.join(' ')}">${WORDS.map((w) => `<div class="wont-w">${w}</div>`).join('')}</div>`;
    el = {
      words: Array.from(section.querySelectorAll('.wont-w')),
      metrics: measureFont(),
      lay: null,
    };
  },

  render(lt, ctx) {
    if (!el) return;
    const W = (ctx && ctx.W) || 1920;
    layout(W);
    el.words.forEach((w, i) => renderWord(w, i, lt));
  },
};
