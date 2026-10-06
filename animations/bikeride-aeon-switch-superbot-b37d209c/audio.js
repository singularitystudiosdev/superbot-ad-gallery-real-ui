// audio.js: the spot's soundtrack. A looping music bed plus one-shot spoken lines, both driven by the ad clock.
// Browsers refuse sound before a gesture, so nothing plays until the first pointer/key (the Record button counts as
// one), and a frozen ?t= frame (export/QA) stays silent and never fires a cue. window.__AUDIO exposes the state.
const file = (n) => new URL('./audio/' + n, import.meta.url).href;

const state = { armed: false, bed: null, volume: 0.34, voice: 0.95, mute: false };

const make = (src, { loop = false, volume = 1 } = {}) => {
  const a = new Audio(src);
  a.loop = loop; a.preload = 'auto'; a.volume = volume;
  return a;
};

export function arm() {
  if (state.armed) return;
  state.armed = true;
  if (!state.bed) state.bed = make(file('bed.m4a'), { loop: true, volume: state.volume });
  const p = state.bed.play();
  if (p && p.catch) p.catch(() => {});
}

// keep the bed in step with the clock: pause when the clock stops, rewind on the loop. Called every frame.
export function syncBed(running, wrapped) {
  if (!state.armed) return;
  if (!state.bed) state.bed = make(file('bed.m4a'), { loop: true, volume: state.volume });
  if (!running) { if (!state.bed.paused) state.bed.pause(); return; }
  if (wrapped) { try { state.bed.currentTime = 0; } catch (e) { /* not seekable yet */ } }
  if (state.bed.paused) { const p = state.bed.play(); if (p && p.catch) p.catch(() => {}); }
}

export function say(name, volume = state.voice) {
  if (!state.armed || state.mute) return;
  const a = make(file(name + '.m4a'), { volume });
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
}

if (typeof window !== 'undefined') {
  window.__AUDIO = state;
  const go = () => { arm(); window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go); };
  window.addEventListener('pointerdown', go);
  window.addEventListener('keydown', go);
  arm(); // try immediately: works when the page already had a gesture
}