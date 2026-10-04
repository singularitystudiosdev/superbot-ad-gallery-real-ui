// preview-timeline.js: the creator video clip used by the previews, and a reusable scrub-then-play mapping.
//
// scrubThenPlay(sec, opts) -> { time, scrubbing } maps ad seconds onto the player: the scrubber is grabbed at `from`,
// dragged past the target (seek previews flick by), eased back onto `to` (7:40), released, then the video plays at
// `rate` from there. Pure.

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outCubic = (x) => 1 - Math.pow(1 - x, 3);

export function scrubThenPlay(sec, {
  from = 192, overshoot = 590, to = 460, dragOut = 0.5, dragBack = 0.3, rate = 1,
} = {}) {
  if (sec < dragOut) return { time: from + (overshoot - from) * inOutCubic(clamp(sec / dragOut)), scrubbing: true };
  const s2 = sec - dragOut;
  if (s2 < dragBack) return { time: overshoot + (to - overshoot) * outCubic(clamp(s2 / dragBack)), scrubbing: true };
  return { time: to + (s2 - dragBack) * rate, scrubbing: false };
}

const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const rate = Number(q.get('rate') || 2);
const dur = Number(q.get('dur') || 2.8);
export const clip = {
  N: Math.round(dur * 30),
  at: (sec) => scrubThenPlay(sec, { rate }),
};
