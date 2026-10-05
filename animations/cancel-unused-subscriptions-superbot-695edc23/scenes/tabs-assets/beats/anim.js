// the easing helpers the beats share (re-exported from lib.js, plus the 0 to 1 to 0 bump the presses and flashes use)
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

export { clamp, lerp, seg, outCubic, outBack, inOutCubic };
export const bump = (p) => Math.sin(Math.PI * clamp(p));
