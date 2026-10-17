// The thumbnail appear of the 'climbing' variant's YouTube results (climb.080da517.js), shared so every image that should
// arrive the same way does (the Gemini beat's 1-image card, Default 10-image grid and 3D card, gemini.9b47fc30.js, and
// the roadtrip variant's map, roadtrip.9bc0f433.js): until
// its landing time the slot is a skeleton with a soft white sweep running across it (.cv-sh / .qc-sk), then over LAND
// seconds (outCubic) the sweep fades out while the image fades in and settles from 1.08x onto its rest scale. Pure
// functions of t.
import { lerp, seg, outCubic } from '../../../lib.9b47fc30.js';

export const LAND = 0.3; // seconds from a thumbnail's landing time to rest
const SWEEPS = 1.4, PHASE = 0.17; // shimmer passes per second, and the offset between neighbouring slots' passes

// eased landing progress of a thumbnail that lands at `at`
export const landing = (t, at) => outCubic(seg(t, at, at + LAND));

// the skeleton's sweep in slot i, running since `since` (the slot's card coming in) and fading out as the image lands (p)
export function shimmer(sh, t, since, i, p) {
  sh.style.opacity = (1 - p).toFixed(3);
  sh.style.transform = `translateX(${lerp(-100, 100, ((t - since) * SWEEPS + i * PHASE) % 1).toFixed(1)}%)`;
}

// the image at landing progress p: fades in and settles from 1.08x onto `zoom`, its resting crop
export function settle(im, p, zoom = 1) {
  im.style.opacity = p.toFixed(3);
  const s = zoom * (p >= 1 ? 1 : lerp(1.08, 1, p));
  im.style.transform = s === 1 ? 'none' : `scale(${s.toFixed(4)})`;
}
