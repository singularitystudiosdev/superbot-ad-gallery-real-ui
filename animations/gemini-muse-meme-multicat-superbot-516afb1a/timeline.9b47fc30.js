// Gemini-only spot: "make me a muse meme" in the superbot hub. The spot is a pure function of t, like the source
// engine: ?t=<s> freezes a frame, ?t=<s>&play=1 plays on from there, space pauses, arrows step 0.25s, R restarts;
// a 60fps quantised clock. The one scene (scenes/tabs.js) plays once and holds its last frame: no loop. Space after
// the end replays it from the start.
import * as lib from './lib.9b47fc30.js';
import tabs from './scenes/tabs.9b47fc30.js?v=16';
import { settled } from './loads.9e82faf1.js';
// the same module instance the tabs scene uses (the full URL, query included, keys an instance)
import { BEATS, typeShift } from './scenes/tabs-assets/chat.9b47fc30.js?v=23';
import { variant } from './variant.9e82faf1.js?v=3';

const { seg } = lib;
const H = 1080;
const W = () => (window.AR && window.AR.w) || 1920;
const stage = document.getElementById('stage');
const SCENE_FADE = 0.3;
// the run length follows the variant (tabs.dur is a getter), so it is read per frame
const cycle = () => tabs.dur;

// the scene section, mounted once; it is shown only while its opacity is above zero
const section = document.createElement('section');
section.className = 'scene';
section.id = 's-tabs';
stage.prepend(section);
tabs.mount(section);

// one frame: fade the section in at the start (no closing fade: the last frame is held, not faded to black), then
// draw the scene at its local time
function render(t) {
  const o = seg(t, 0, SCENE_FADE);
  section.style.opacity = o.toFixed(3);
  section.classList.toggle('on', o > 0);
  tabs.render(t, { W: W(), H });
}

// ---------- fit the stage to the window (assets/ar.js sets the width) ----------
function fit() {
  const w = W();
  stage.style.width = w + 'px';
  stage.style.height = H + 'px';
  const k = Math.min(innerWidth / w, innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${k})`;
}
addEventListener('resize', fit);
addEventListener('archange', fit);
fit();

// ---------- the clock ----------
// time = base + (performance.now() - started) * rate while playing; base alone while paused, so seeks and pauses are exact.
// rate is the playback speed (?speed=, the Speed pill in variant-select.9e82faf1.js, ',' and '.' keys); changing it rebases
// first, so the frame never jumps.
const q = new URLSearchParams(location.search);
const hasT = q.has('t'), freeze = hasT && !q.has('play');
if (freeze) document.body.classList.add('freeze');
const FPS = 60;
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const asSpeed = (v) => { const n = Number(v); return SPEEDS.find((s) => Math.abs(s - n) < 1e-6); };
let rate = asSpeed(q.get('speed')) || 1;
let paused = freeze, base = hasT ? parseFloat(q.get('t')) || 0 : 0, started = performance.now();
const now = () => (paused ? base : base + (performance.now() - started) / 1000 * rate);

// pick a preset (anything else is ignored), persist it in ?speed= like the variant, and tell the pill
function setSpeed(r) {
  const v = asSpeed(r);
  if (v === undefined || v === rate) return;
  base = now(); started = performance.now();
  rate = v;
  const u = new URL(location.href);
  if (v === 1) u.searchParams.delete('speed'); else u.searchParams.set('speed', String(v));
  history.replaceState(null, '', u);
  dispatchEvent(new CustomEvent('speedchange', { detail: v }));
}

// the clock held inside [0, CYCLE] (it runs once, then stays on the last frame) and quantised to whole frames
function timeNow() {
  const t = Math.min(Math.max(now(), 0), cycle());
  return Math.min(Math.round(t * FPS) / FPS, cycle());
}
// past the end, the clock stops there, so space replays from the start rather than resuming a finished run
const ended = () => base >= cycle();

addEventListener('keydown', (e) => {
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target && e.target.tagName)) return;
  if (e.key === ',' || e.key === '<' || e.key === '.' || e.key === '>') {
    const i = SPEEDS.indexOf(rate) + (e.key === ',' || e.key === '<' ? -1 : 1);
    setSpeed(SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, i))]);
  }
  else if (e.key === ' ') {
    e.preventDefault();
    if (paused) { if (ended()) base = 0; paused = false; started = performance.now(); }
    else { base = now(); paused = true; }
  }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { base = Math.min(cycle(), Math.max(0, timeNow() + (e.key === 'ArrowRight' ? 0.25 : -0.25))); paused = true; }
  else if (e.key === 'r' || e.key === 'R') { base = 0; started = performance.now(); paused = false; }
});

function frame() {
  // the run is over: stop the clock on its last frame
  if (!paused && now() >= cycle()) { base = cycle(); paused = true; }
  render(timeNow());
  requestAnimationFrame(frame);
}
render(timeNow());
requestAnimationFrame(frame);

// frame-exact QA: pause the clock and draw t now; ready once every tracked asset (loads.9e82faf1.js) is in
window.__AD = {
  get CYCLE() { return cycle(); },
  get ready() { return settled(); },
  seek(t) { paused = true; base = t; started = performance.now(); render(timeNow()); },
  // play on from t (a variant or appear pick skips the wait and shows its animation)
  play(t) { paused = false; base = t; started = performance.now(); render(timeNow()); },
  // the moment the reply to the ask starts streaming: every variant's art begins here or just after
  // (a variant that types its ask longer starts it that much later: chat.9b47fc30.js typing)
  get ART() { return BEATS[0].k.T.r + typeShift(variant()); },
  // playback speed: a multiplier of real time, one of SPEEDS
  SPEEDS,
  get speed() { return rate; },
  setSpeed,
  // the spot's clock now, held at the end once the run is over (read-only)
  get now() { return timeNow(); },
  // whether the clock is running (false while paused, stepped, frozen or held on the last frame); a beat's audio follows it
  get playing() { return !paused; },
};
