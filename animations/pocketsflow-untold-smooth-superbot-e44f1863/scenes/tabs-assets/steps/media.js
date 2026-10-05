// Shared helpers for the step cards: a <video> slaved to the timeline, and a shimmer offset.
import { clamp } from '../../../lib.js';

const SEED_TOL = 0.04, DRIFT_TOL = 0.25;

export function video(src, cls = '') {
  const v = document.createElement('video');
  v.className = cls;
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
  v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
  v.src = src;
  return v;
}

/** play v at clip time `want` while `on`; park it (paused, seeked) otherwise. A frozen frame (?t=) only seeks. */
export function sync(v, want, on, len = 5.9) {
  const w = clamp(want, 0, len);
  const live = on && !document.body.classList.contains('freeze');
  if (live) {
    if (v.paused) { const p = v.play(); if (p && p.catch) p.catch((e) => console.error('steps/media.js: play() rejected', e)); }
    if (Math.abs(v.currentTime - w) > DRIFT_TOL) v.currentTime = w;
  } else {
    if (!v.paused) v.pause();
    if (Math.abs(v.currentTime - w) > SEED_TOL) v.currentTime = w;
  }
}

/** a shimmer band position for a gradient text sweep, as a background-position percentage */
export const shimmer = (lt, speed = 120) => `${(100 - ((lt * speed) % 200 + 200) % 200).toFixed(1)}%`;

/** m:ss */
export const clock = (s) => { const n = Math.max(0, Math.floor(s + 1e-6)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
