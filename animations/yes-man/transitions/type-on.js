// type-on — the terminal transition.
// The card snaps out in 0.1s (opacity only — there, then gone), one frame
// of nothing, and the end card lands instantly (snap: the lockup plants,
// no drift). Then the "superbot.gg" wordmark TYPES ON left-to-right: a
// stepped clip-path inset that jumps in character-sized chunks, no
// easing between steps — it reads like a terminal printing the domain.
// Deterministic in (s): the step index is Math.floor of elapsed time over
// the chunk count, never Math.random; every frame recomputes from s so
// freeze-frames (?t=) and arrow-stepping land exactly on a step edge.
// Non-sim: exit (d) → zero-length pure-black beat (beat: 0, allowed) →
// arrival (inDur). Nothing overlaps, so the leaving card can never let
// the end card show through it. wordFx only ever sets word.style
// opacity/clipPath/filter — the wordmark element is styled, never
// restructured. Every phase ≤ 0.5s. No CSS transition/animation
// properties anywhere: the renderer runs every frame.

const OUT_D = 0.1;        // the card layer vanishes — near-instant snap
const IN_D = 0.1;         // the end card lands just as fast
const TYPE_AT = 0.2;      // seconds after arrival before the first glyph lands
const TYPE_DUR = 0.5;     // the whole wordmark types on in half a second
const STEPS = 11;         // "superbot.gg" = 11 characters → 11 hard jumps
const FLICK = 0.35;       // brightness kick on the frame a glyph lands

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default {
  d: OUT_D,      // out duration
  beat: 0,       // no gap — the mascot lands on the very next frame
  inDur: IN_D,   // arrival duration
  snap: true,    // the logo lockup lands instantly: no drift, no settle

  out(el, p, t) {
    // p already eased 0→1; opacity only — the card is there, then it isn't
    el.style.opacity = (1 - p).toFixed(3);
  },

  in(ov, q, t) {
    // q already eased 0→1; opacity only, no transform — the end card
    // arrives planted, exactly where it will stay
    ov.style.opacity = q.toFixed(3);
  },

  wordFx(s, word, shift) {
    // s = seconds since arrival. Pure step function of s:
    //   u < 0      → fully hidden (inset from the right 100%)
    //   0 ≤ u < 1  → hard clip inset, left edge advancing STEPS times
    //   u ≥ 1      → clip removed, wordmark fully on
    const u = clamp((s - TYPE_AT) / TYPE_DUR, 0, 1);
    if (u <= 0) {
      word.style.opacity = '1';   // clipPath owns visibility, not opacity
      word.style.clipPath = 'inset(-2% 100% -2% 0)';
      word.style.filter = 'none';
      return;
    }
    if (u >= 1) {
      word.style.opacity = '1';
      word.style.clipPath = 'none';
      word.style.filter = 'none';
      return;
    }
    const k = u * STEPS;
    const step = Math.floor(k) / STEPS;           // character-sized chunks
    const right = ((1 - step) * 100).toFixed(2);
    word.style.opacity = '1';
    word.style.clipPath = `inset(-2% ${right}% -2% 0)`;
    // each glyph lands at full brightness and decays flat before the next
    // one pops — a sawtooth of s, so it stays a pure step-and-flash read
    const frac = k - Math.floor(k);
    const kick = 1 + FLICK * (1 - frac);
    word.style.filter = `brightness(${kick.toFixed(3)})`;
  },
};
