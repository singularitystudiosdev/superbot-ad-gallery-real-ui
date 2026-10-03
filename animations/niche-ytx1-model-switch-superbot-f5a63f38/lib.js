// lib.js: the pure helpers the ytx1 timeline uses. No state, no clock: every value is a function of t.
// Easings are the ones in ../niche-ytv9-model-switch-superbot-3cef8909/lib.js.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, f) => a + (b - a) * f;
/** progress of t through [a, b], clamped to 0..1 */
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const outQuint = (x) => 1 - Math.pow(1 - x, 5);
export const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** deterministic caret blink from t: visible for the first half of each 1.06 s period */
export const blink = (t, period = 1.06) => ((t % period + period) % period) < period / 2;
