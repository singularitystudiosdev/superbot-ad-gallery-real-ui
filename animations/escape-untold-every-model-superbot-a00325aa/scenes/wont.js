// escape-untold-every-model-superbot: the second scene, the dramatic beat between the tweet opener and the superbot hub.
// Pure black frame; THEY / WONT / TELL / YOU / HOW stacked as one centred column of plain white Anton caps, one word
// per line at a tight 0.9 leading, every word the same font size, the column filling ~70% of the frame height (and
// the widest word held within 84% of the frame width on narrow ratios).
//
// Beat: hard cut in onto 0.25s of pure black, then one word every 0.4s (THEY 0.25, WONT 0.65, TELL 1.05, YOU 1.45,
// HOW 1.85). Each word simply appears on its frame, fully there: no fade, no easing, no scale, no slide, no flash, no
// camera move. Earlier words stay exactly where they are. The full column holds 1.0s and the scene hard cuts out
// (fadeIn 0, fadeOut 0). render(lt) is a pure function of local time and the frame width, so ?t= frames are stable.
//
// The font (Anton, SIL OFL 1.1, fonts/anton-latin-400.woff2 + fonts/OFL.txt) is loaded by this module's top-level
// await, and timeline.js awaits the module import before it mounts and sets __AD.ready, so no frame is ever drawn
// in a fallback face.
const H = 1080;
const FAMILY = 'Wont Anton';
const WORDS = ['THEY', 'WONT', 'TELL', 'YOU', 'HOW'];
const LAST = WORDS.length - 1;

// timing (seconds, scene-local)
const BLACK = 0.25; // pure black after the hard cut in
const STEP = 0.4;   // one word per beat
const HOLD = 1.0;   // full column hold after HOW appears

const LANDS = WORDS.map((_, i) => +(BLACK + i * STEP).toFixed(3));
const DUR = +(LANDS[LAST] + HOLD).toFixed(2);

// layout (px, the 1080-tall stage)
const COL_FRAC = 0.7;    // the column (cap top of THEY to baseline of HOW) fills this much of the frame height
const LEADING = 0.9;     // baseline-to-baseline pitch in font-size units
const MAX_W_FRAC = 0.84; // no word is wider than this share of the frame width

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
  const widths = WORDS.map((w) => {
    const m = cv.measureText(w);
    const ink = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0);
    return (ink > 0 ? ink : m.width) / 100;
  });
  return { cap, asc, desc, widths };
}

let el = null;

// the column geometry for a frame width: one font size for every word, each word's span placed on its baseline
function layout(W) {
  if (el.lay && el.lay.W === W) return el.lay;
  const m = el.metrics;
  const units = m.cap + LAST * LEADING; // cap of THEY + pitches down to HOW's baseline
  let fs = (H * COL_FRAC) / units;
  fs = Math.min(fs, (W * MAX_W_FRAC) / Math.max(...m.widths));
  const top0 = (H - units * fs) / 2;
  // the span is line-height 1 (1em tall); its baseline sits half-leading + ascent below its top
  const baseInSpan = (fs - (m.asc + m.desc) * fs) / 2 + m.asc * fs;
  el.words.forEach((w, i) => {
    const base = top0 + m.cap * fs + i * LEADING * fs;
    w.style.fontSize = fs.toFixed(3) + 'px';
    w.style.top = (base - baseInSpan).toFixed(2) + 'px';
  });
  el.lay = { W, fs };
  return el.lay;
}

export default {
  id: 'wont',
  dur: DUR,
  // hard cut in from the tweet, hard cut out into the hub
  fadeIn: 0,
  fadeOut: 0,

  mount(section) {
    section.innerHTML = `<div class="wont-col" aria-label="${WORDS.join(' ')}">${WORDS.map((w) =>
      `<div class="wont-w">${w}</div>`).join('')}</div>`;
    el = {
      words: Array.from(section.querySelectorAll('.wont-w')),
      metrics: measureFont(),
      lay: null,
    };
  },

  render(lt, ctx) {
    if (!el) return;
    layout((ctx && ctx.W) || 1920);
    el.words.forEach((w, i) => { w.style.visibility = lt >= LANDS[i] ? 'visible' : 'hidden'; });
  },
};
