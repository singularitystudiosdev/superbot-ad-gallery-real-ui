// escape-untold-every-model-superbot: the second scene, the dramatic beat between the tweet opener and the superbot hub.
// Pure black frame; THEY / WONT / TELL / YOU / HOW stacked as one centred column of stark white Anton caps, one word
// per line at a tight 0.9 leading, the column filling ~70% of the frame height. HOW is pushed out to the column's
// full width (the widest word), so it is the biggest line.
//
// Beat: hard cut in onto 0.25s of pure black, then one word every 0.42s; HOW gets a longer 0.6s pre-beat so it hits
// hardest. Every landing is hard edged (no fades): for one 30fps frame the word shows as a white slab with the word
// knocked out in black at 108% scale, then it is plain white text settling 108% -> 100% by 120ms after the hit, and
// the whole column takes a 2.5px camera jolt that decays to nothing in 150ms. HOW's hit frame inverts the whole frame
// (white ground, black words) at 112%, with a 3.5px jolt. Landed words stay; the full column then holds and the scene
// hard cuts out (fadeIn 0, fadeOut 0). render(lt) is a pure function of local time and the frame width, so ?t= frames
// are stable.
//
// The font (Anton, SIL OFL 1.1, fonts/anton-latin-400.woff2 + fonts/OFL.txt) is loaded by this module's top-level
// await, and timeline.js awaits the module import before it mounts and sets __AD.ready, so no frame is ever drawn
// in a fallback face.
import { lerp, seg, outCubic, rand } from '../lib.js';

const H = 1080;
const FAMILY = 'Wont Anton';
const WORDS = ['THEY', 'WONT', 'TELL', 'YOU', 'HOW'];
const LAST = WORDS.length - 1;

// timing (seconds, scene-local)
const BLACK = 0.25;       // pure black after the hard cut in
const STEP = 0.42;        // one word per beat
const PRE_LAST = 0.6;     // HOW's longer pre-beat
const HOLD = 0.9;         // full column hold after HOW has settled
const FLASH = 1 / 30;     // the hit frame: exactly one frame of the 30fps recording
const SETTLE = 0.12;      // 108% -> 100% is done this long after the hit
const JOLT = 0.15;        // camera jolt decays to 0 over this
const JOLT_PERIOD = 0.075; // jolt shake period (about two 30fps frames per swing)

const LANDS = WORDS.map((_, i) => (i < LAST ? BLACK + i * STEP : BLACK + (LAST - 1) * STEP + PRE_LAST));
const DUR = +(LANDS[LAST] + SETTLE + HOLD).toFixed(2);

// look
const S0 = 1.08, S0_LAST = 1.12;   // scale on the hit frame
const JOLT_PX = 2.5, JOLT_PX_LAST = 3.5;

// layout (px, the 1080-tall stage)
const COL_FRAC = 0.7;     // the column (cap top of THEY to baseline of HOW) fills this much of the frame height
const LEADING = 0.9;      // baseline-to-baseline pitch in font-size units
const MAX_W_FRAC = 0.84;  // no line is wider than this share of the frame width
const LAST_K_MIN = 1.15, LAST_K_MAX = 1.6; // HOW's size over the other lines, set so it spans the column width
const PAD_X = 0.08, PAD_Y = 0.07; // hit-slab padding around a word, in cap heights

// load the face before the module resolves (timeline.js awaits this import)
const FONT_URL = new URL('../fonts/anton-latin-400.woff2', import.meta.url).href;
try {
  const face = new FontFace(FAMILY, `url(${FONT_URL}) format('woff2')`, { weight: '400', style: 'normal', display: 'block' });
  await face.load();
  document.fonts.add(face);
} catch (err) {
  console.error('[escape-untold] wont: Anton failed to load, falling back to the stylesheet face', err);
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
  // ink widths (the slab hugs the letters, not the advance box)
  const widths = WORDS.map((w) => {
    const m = cv.measureText(w);
    const ink = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0);
    return (ink > 0 ? ink : m.width) / 100;
  });
  return { cap, asc, desc, widths };
}

let el = null;

// the column geometry for a frame width: per-line font size and the slab box each line sits in
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const m = el.metrics;
  const widest = Math.max(...m.widths.slice(0, LAST));
  const k = Math.min(LAST_K_MAX, Math.max(LAST_K_MIN, widest / m.widths[LAST]));
  // column height = cap of THEY + pitches down to HOW's baseline; the last pitch is measured in HOW's size
  // cap*fs + (LAST - 1) * LEADING*fs + LEADING*k*fs  (HOW's baseline sits one of its own pitches below YOU's)
  const units = m.cap + (LAST - 1) * LEADING + LEADING * k;
  let fs = (H * COL_FRAC) / units;
  fs = Math.min(fs, (W * MAX_W_FRAC) / Math.max(widest, m.widths[LAST] * k));
  const colH = units * fs;
  const top0 = (H - colH) / 2;
  let base = top0 + m.cap * fs; // THEY's baseline
  const lines = WORDS.map((_, i) => {
    const f = i === LAST ? fs * k : fs;
    if (i === LAST) base += LEADING * f;
    else if (i > 0) base += LEADING * fs;
    const cap = m.cap * f, ww = m.widths[i] * f;
    const px = PAD_X * cap, py = PAD_Y * cap;
    const box = { x: (W - ww) / 2 - px, y: base - cap - py, w: ww + 2 * px, h: cap + 2 * py };
    // the text span is line-height 1 (1em tall); its baseline sits half-leading + ascent below its top
    const baseInSpan = (f - (m.asc + m.desc) * f) / 2 + m.asc * f;
    return { f, box, spanTop: py + cap - baseInSpan };
  });
  el.lines.forEach((ln, i) => {
    const L = lines[i];
    ln.style.left = L.box.x.toFixed(2) + 'px';
    ln.style.top = L.box.y.toFixed(2) + 'px';
    ln.style.width = L.box.w.toFixed(2) + 'px';
    ln.style.height = L.box.h.toFixed(2) + 'px';
    el.words[i].style.fontSize = L.f.toFixed(3) + 'px';
    el.words[i].style.top = L.spanTop.toFixed(2) + 'px';
  });
  el.lay = { W, fs, k };
  return el.lay;
}

function renderLine(ln, i, lt) {
  const d = lt - LANDS[i];
  if (d < 0) {
    ln.style.visibility = 'hidden';
    ln.classList.remove('hit');
    ln.style.transform = 'none';
    return;
  }
  ln.style.visibility = 'visible';
  const hit = d < FLASH;
  ln.classList.toggle('hit', hit && i !== LAST);
  if (d >= SETTLE) { ln.style.transform = 'none'; return; }
  const s0 = i === LAST ? S0_LAST : S0;
  const s = hit ? s0 : lerp(s0, 1, outCubic(seg(d, FLASH, SETTLE)));
  ln.style.transform = `scale(${s.toFixed(4)})`;
}

// the camera jolt from the most recent hit: a decaying shake along a per-word fixed direction
function jolt(lt) {
  for (let i = LAST; i >= 0; i--) {
    const d = lt - LANDS[i];
    if (d < 0) continue;
    if (d >= JOLT) return null;
    const e = Math.pow(1 - d / JOLT, 2);
    const a = rand(i + 7) * Math.PI * 2;
    const amp = (i === LAST ? JOLT_PX_LAST : JOLT_PX) * e * Math.cos((2 * Math.PI * d) / JOLT_PERIOD);
    return { x: amp * Math.cos(a), y: amp * Math.sin(a) };
  }
  return null;
}

export default {
  id: 'wont',
  dur: DUR,
  // hard cut in from the tweet, hard cut out into the hub
  fadeIn: 0,
  fadeOut: 0,

  mount(section) {
    section.innerHTML = `<div class="wont-col" aria-label="${WORDS.join(' ')}">${WORDS.map((w, i) =>
      `<div class="wont-line${i === LAST ? ' wont-last' : ''}"><span class="wont-w">${w}</span></div>`).join('')}</div>`;
    el = {
      sec: section,
      col: section.querySelector('.wont-col'),
      lines: Array.from(section.querySelectorAll('.wont-line')),
      words: Array.from(section.querySelectorAll('.wont-w')),
      metrics: measureFont(),
      lay: null,
    };
  },

  render(lt, ctx) {
    if (!el) return;
    const W = (ctx && ctx.W) || 1920;
    layout(W);
    el.lines.forEach((ln, i) => renderLine(ln, i, lt));
    const dLast = lt - LANDS[LAST];
    el.sec.classList.toggle('wont-inv', dLast >= 0 && dLast < FLASH);
    const j = jolt(lt);
    el.col.style.transform = j ? `translate(${j.x.toFixed(2)}px, ${j.y.toFixed(2)}px)` : 'none';
  },
};
