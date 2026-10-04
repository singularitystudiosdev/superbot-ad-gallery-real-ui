// mark.js: the real superbot mark (../../assets/sb-mark-live.{css,js}), posed as a pure function of t.
// The markup is the asset's own verbatim svg: sbMarkLive() is asked for it once on a detached host (its .html is the
// MARK_SVG string) and that instance is destroyed at once, so its random blink timer and pointer tracking never run.
// Every copy gets its own mask id. The mark's CSS animations (bob, breath, ear wiggle, the two glitch layers) keep
// their verbatim keyframes from sb-mark-live.css; poseMark() pauses them and sets their clock to t, so a seek always
// draws the same pixels. Blinks are scheduled from t too (BLINKS), never from Math.random.
let SVG = null;
let seq = 0;

function markSvg() {
  if (SVG) return SVG;
  if (typeof window.sbMarkLive !== 'function') throw new Error('mark.js: ../../assets/sb-mark-live.js is not loaded');
  const host = document.createElement('div');
  const inst = window.sbMarkLive(host, { size: 0, interactive: false });
  SVG = inst.html;
  inst.destroy();
  return SVG;
}

/** append a mark of `size` px to host -> handle for poseMark */
export function makeMark(host, size) {
  const uid = `ghx2-mark-${++seq}`;
  const wrap = document.createElement('span');
  wrap.className = 'mark-wrap';
  wrap.innerHTML = markSvg().split('sb-gate-mark').join(uid);
  const svg = wrap.querySelector('svg.sb-mark');
  svg.style.width = `${size}px`;
  svg.style.height = `${size}px`;
  svg.style.cursor = 'default';
  host.appendChild(wrap);
  const eyes = [...svg.querySelectorAll('.mark-eye')];
  return { wrap, svg, eyes, ry: eyes.map((e) => +e.getAttribute('ry')) };
}

// both eyes shut for 4 frames at these global times (s): one blink in the hook, one on the end card
const BLINKS = [0.42, 6.36];
const BLINK_LEN = 4 / 30;

/** draw the mark as it is at global time t (seconds) */
export function poseMark(m, t) {
  const ms = Math.max(0, t) * 1000;
  for (const a of m.wrap.getAnimations({ subtree: true })) {
    if (a.playState !== 'paused') a.pause();
    a.currentTime = ms;
  }
  const shut = BLINKS.some((b) => t >= b && t < b + BLINK_LEN);
  m.eyes.forEach((e, i) => e.setAttribute('ry', shut ? '1' : String(m.ry[i])));
}
