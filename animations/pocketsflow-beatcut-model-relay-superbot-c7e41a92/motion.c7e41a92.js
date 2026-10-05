// motion.mjs: closed-form springs and seeded noise for films that are a pure function of time.
//
// Contract (the API the SKILL.md references):
//   import { spring, track, indicator, swapAlpha, loopT, dampingRatio, PRESETS, mulberry32 }
//     from '/Users/adrianagne/Library/Application Support/Cosmos/builtin-skills/cosmos/skills/motion-reel/lib/motion.mjs'   // or a copy beside index.html
//
//   spring(t, k = 170, d = 26)   unit-mass step response 0 → 1 from rest: the solution of
//                                x'' = k(1 − x) − d·x', x(0) = x'(0) = 0, at time t (seconds).
//                                0 for t ≤ 0, exactly 1 once the envelope is below 1e-300.
//   springVelocity(t, k, d)      dx/dt of the same response (0 for t ≤ 0).
//   track(t, keys, k, d)         keys [[time, value], ...] sorted by time: keys[0][1] plus one
//                                spring per change, Σ (v_i − v_{i−1})·spring(t − t_i). A value
//                                retargeted mid-flight keeps its position AND velocity.
//   indicator(t, stops, opts)    stops [[time, left, right], ...]: a tab indicator whose edge
//                                in the direction of travel rides a stiff spring and whose other
//                                edge rides a soft one, so it stretches as it moves → {left, right}.
//   swapAlpha(t, tIn, tOut)      opacity of content inside a morphing container: enters after
//                                the morph at tIn has started, leaves before the one at tOut.
//   loopT(t, dur)                t wrapped into [0, dur), negatives included.
//   dampingRatio(k, d)           z = d / (2√k): < 1 overshoots, 1 critical, > 1 overdamped.
//   PRESETS                      {snappy, default, heavy, playful} → {k, d}.
//   mulberry32(seed)             deterministic PRNG → () => [0, 1). Never Math.random in a film.
//
// Why closed form: a film rendered by seeking (window.seek(t), frames in any order,
// subframes, re-rendered spans) cannot integrate state frame to frame, so every value must
// be evaluable at any t directly. All three damping regimes are exact here. Popular
// snippets treat z ≥ 1 as critical, which is wrong for the common "heavy" feel (k 90 d 20 is
// z ≈ 1.05). With a = d/2 and q = a² − k, the response is 1 − y where
//   y = e^{−at}·(C(t) + a·S(t)),  C = cos(wt) | cosh(ht),  S = sin(wt)/w | sinh(ht)/h
// (w = √−q, h = √q). C and S are entire functions of q, so they are evaluated through
// sinc/sinhc forms that stay exact as q → 0 (z = 1 ± 1e-9 matches critical to rounding),
// and the overdamped branch folds the exponentials together, e^{−(a−h)t}·[(1 + e^{−2ht})/2
// + a·t·(1 − e^{−2ht})/(2ht)] with a − h = k/(a + h), so it never forms cosh(ht) and cannot
// overflow at large t or large z. springVelocity is k·e^{−at}·S(t) by the same forms.
//
// Pure ESM, zero imports: runs unchanged in a page (<script type="module">) and in Node.

// ---- constants ----------------------------------------------------------------

// Stiffness k (N/m at unit mass) and damping d; z noted for reading, not used.
export const PRESETS = Object.freeze({
  snappy: Object.freeze({ k: 320, d: 30 }), // z ≈ 0.84: a hint of overshoot
  default: Object.freeze({ k: 170, d: 26 }), // z ≈ 1.00: critically damped
  heavy: Object.freeze({ k: 90, d: 20 }), // z ≈ 1.05: overdamped, slow to settle
  playful: Object.freeze({ k: 220, d: 14 }) // z ≈ 0.47: visible bounce
})

// e^{-708} is the smallest normal double; past this decay exponent the residual is
// below 1e-300 times a polynomial in t, i.e. zero in every pixel.
const SETTLED_EXPONENT = 700

// ---- spring ---------------------------------------------------------------------

export function dampingRatio(k, d) {
  return d / (2 * Math.sqrt(k))
}

// sin(u)/u, exact through u = 0.
function sinc(u) {
  const u2 = u * u
  if (u2 < 1e-6) return 1 - (u2 / 6) * (1 - u2 / 20)
  return Math.sin(u) / u
}

// (1 − e^{−v})/v for v ≥ 0, exact through v = 0 (expm1 keeps small v accurate).
function oneMinusExpOver(v) {
  if (v < 1e-8) return 1 - v / 2
  return -Math.expm1(-v) / v
}

// Shared core: returns { y, s } with y = 1 − x(t) and s = e^{−at}·S(t), so that
// x = 1 − y and x' = k·s. Caller guarantees t > 0 and finite.
function springCore(t, k, d) {
  const a = d / 2
  const q = a * a - k
  if (q < 0) {
    // underdamped (and undamped when d = 0): C = cos(wt), S = t·sinc(wt)
    if (a * t > SETTLED_EXPONENT) return { y: 0, s: 0 }
    const w = Math.sqrt(-q)
    const env = Math.exp(-a * t)
    const S = t * sinc(w * t)
    return { y: env * (Math.cos(w * t) + a * S), s: env * S }
  }
  if (q === 0) {
    if (a * t > SETTLED_EXPONENT) return { y: 0, s: 0 }
    const env = Math.exp(-a * t)
    return { y: env * (1 + a * t), s: env * t }
  }
  // overdamped: fold e^{−at}cosh(ht) and e^{−at}sinh(ht)/h into the slow mode
  const h = Math.sqrt(q)
  const slow = k / (a + h) // = a − h without cancellation at large z
  if (slow * t > SETTLED_EXPONENT) return { y: 0, s: 0 }
  const env = Math.exp(-slow * t)
  const fast = Math.exp(-2 * h * t)
  const S = t * oneMinusExpOver(2 * h * t) // e^{(a−h)t}·e^{−at}·sinh(ht)/h = (1 − e^{−2ht})/(2h)
  return { y: env * ((1 + fast) / 2 + a * S), s: env * S }
}

export function spring(t, k = PRESETS.default.k, d = PRESETS.default.d) {
  if (t <= 0) return 0
  if (t === Infinity) return 1
  return 1 - springCore(t, k, d).y
}

export function springVelocity(t, k = PRESETS.default.k, d = PRESETS.default.d) {
  if (t <= 0 || t === Infinity) return 0
  return k * springCore(t, k, d).s
}

// ---- composition ----------------------------------------------------------------

export function track(t, keys, k = PRESETS.default.k, d = PRESETS.default.d) {
  let v = keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const delta = keys[i][1] - keys[i - 1][1]
    if (delta !== 0) v += delta * spring(t - keys[i][0], k, d)
  }
  return v
}

const INDICATOR_LEAD = PRESETS.snappy
const INDICATOR_TRAIL = Object.freeze({ k: 140, d: 22 }) // z ≈ 0.93: softer, no bounce

// Each move picks, per edge, the stiff spring when that edge faces the direction of
// travel (the centre's move) and the soft one otherwise. A move that only resizes (centre
// fixed) takes the stiff spring on both edges.
export function indicator(t, stops, opts = {}) {
  const lead = opts.lead ?? INDICATOR_LEAD
  const trail = opts.trail ?? INDICATOR_TRAIL
  let left = stops[0][1]
  let right = stops[0][2]
  for (let i = 1; i < stops.length; i++) {
    const [ti, l1, r1] = stops[i]
    const [, l0, r0] = stops[i - 1]
    const dir = Math.sign(l1 + r1 - (l0 + r0))
    const leftP = dir > 0 ? trail : lead
    const rightP = dir < 0 ? trail : lead
    if (l1 !== l0) left += (l1 - l0) * spring(t - ti, leftP.k, leftP.d)
    if (r1 !== r0) right += (r1 - r0) * spring(t - ti, rightP.k, rightP.d)
  }
  return { left: Math.min(left, right), right: Math.max(left, right) }
}

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smooth = (x) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}

// The container starts morphing at tIn: content waits SWAP_DELAY so it never draws into
// the old shape, then fades in over SWAP_IN. It is fully gone SWAP_LEAD before the next
// morph at tOut, fading over SWAP_OUT. Smoothstep ramps, so alpha has no velocity kink.
const SWAP_DELAY = 0.06
const SWAP_IN = 0.14
const SWAP_LEAD = 0.06
const SWAP_OUT = 0.1

export function swapAlpha(t, tIn, tOut = Infinity) {
  const fadeIn = smooth((t - tIn - SWAP_DELAY) / SWAP_IN)
  const fadeOut = tOut === Infinity ? 1 : smooth((tOut - SWAP_LEAD - t) / SWAP_OUT)
  return Math.min(fadeIn, fadeOut)
}

export function loopT(t, dur) {
  return ((t % dur) + dur) % dur
}

// ---- noise ------------------------------------------------------------------------

// mulberry32: 32-bit state, one add and three xorshift-multiplies per draw.
export function mulberry32(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let z = state
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }
}
