// The Blender render of the MANDO can: 71 Cycles frames (-14..+14 deg, 0.4 deg apart) plus four raw low-sample
// passes at 0 deg, decoded before the first frame (top-level await) and drawn into a canvas so every frame is
// synchronous. A pose between two rendered angles cross-fades its neighbours, so the slow sway never steps.
import { clamp } from '../../../lib.js';

const N = 71, A0 = -14, STEP = 0.4, AMP = 13, PERIOD = 6;
const src = (f) => new URL(`../../../img/can/${f}`, import.meta.url).href;
const load = (f) => { const im = new Image(); im.src = src(f); return im.decode().then(() => im); };

const [frames, noisy] = await Promise.all([
  Promise.all(Array.from({ length: N }, (_, i) => load(`c${String(i).padStart(3, '0')}.webp`))),
  Promise.all([1, 2, 4, 8].map((n) => load(`n${n}.webp`))),
]);

// angle in degrees at time t once the clean render landed at t0: it starts square to the camera (where the raw
// passes were rendered) and sways gently either side
export const canAngle = (t, t0) => (t <= t0 ? 0 : AMP * Math.sin((2 * Math.PI * (t - t0)) / PERIOD));

export function makeCan(cls) {
  const cv = document.createElement('canvas');
  cv.width = 560; cv.height = 720;
  cv.className = cls;
  const g = cv.getContext('2d');
  let last = '';
  return {
    node: cv,
    // stage: 0..3 shows the raw passes (1, 2, 4, 8 samples) as Cycles refines them, 3..4 blends the last into the
    // denoised frame; 4 or more, the denoised can sways
    render(t, t0, stage = 5) {
      if (stage < 4) {
        const k = clamp(Math.floor(stage), 0, 3), mix = k === 3 ? stage - 3 : 0;
        const key = `n${k}:${mix.toFixed(3)}`;
        if (key !== last) {
          g.clearRect(0, 0, 560, 720); g.globalAlpha = 1; g.drawImage(noisy[k], 0, 0);
          // the last raw pass resolves into the denoised frame (square to the camera, where the passes were rendered)
          if (mix > 0) { g.globalAlpha = mix; g.drawImage(frames[Math.round(-A0 / STEP)], 0, 0); g.globalAlpha = 1; }
          last = key;
        }
        return;
      }
      const f = clamp((canAngle(t, t0) - A0) / STEP, 0, N - 1);
      const i0 = Math.floor(f), i1 = Math.min(N - 1, i0 + 1), w = f - i0;
      const key = `${i0}:${w.toFixed(3)}`;
      if (key === last) return;
      g.clearRect(0, 0, 560, 720);
      g.globalAlpha = 1; g.drawImage(frames[i0], 0, 0);
      if (w > 0.001) { g.globalAlpha = w; g.drawImage(frames[i1], 0, 0); }
      g.globalAlpha = 1;
      last = key;
    },
  };
}
