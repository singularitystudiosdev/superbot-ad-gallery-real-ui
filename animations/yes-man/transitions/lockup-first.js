// lockup-first — the logo sting: the WORDMARK lands before the mascot.
// The card leaves in a plain fast fade (d), one short pure-black beat, then
// the end card snaps on over black and the lockup assembles in two stages:
// the wordmark settles FIRST (opacity + blur→sharp + a tracking squeeze,
// ~0.25s), and ~0.25s later the mascot drops in beneath it (+12px → 0 with
// a slight overshoot, ~0.3s). snap: true — the base drift is skipped so this
// two-beat assembly is the only motion on the lockup. Non-sim: exit → black
// beat → arrival, so the fading card can never let the end card show
// through it (the end card only exists at/after OUT_AT). Every phase
// ≤ 0.6s. Deterministic in (s): no Math.random, no CSS transition/animation
// — every frame recomputes from s, so freeze-frames and arrow-stepping land
// exactly. botFx APPENDS to the base transform string, never replaces it.

const WORD_DUR = 0.25;   // the wordmark settle (opacity + blur + tracking)
const BOT_AT = 0.25;     // the mascot holds back this long after arrival
const BOT_DUR = 0.3;     // the mascot drop, +12px → overshoot → 0
const BOT_DROP = 12;     // px below rest at the start of the drop

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const easeOutQuint = (p) => 1 - Math.pow(1 - p, 5);
const easeOutBack = (p) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2);

export default {
  d: 0.35,       // the card layer leaves in a plain fast fade
  beat: 0.12,    // a short pure-black beat before the lockup assembles
  inDur: 0.08,   // the end card layer itself lands near-instantly over black
  snap: true,    // the lockup lands on this transition's terms, not the drift's

  out(el, p, t) {
    // p already eased 0→1; plain fade, opacity only — the card is an opaque
    // black layer, so its own transparency only ever reveals black
    el.style.opacity = (1 - p).toFixed(3);
  },

  in(ov, q, t) {
    // q already eased 0→1 over inDur: snap the frame on over the black beat;
    // all the softness belongs to the wordmark and the mascot below
    ov.style.opacity = q.toFixed(3);
  },

  wordFx(s, word, shift) {
    // stage 1 — the wordmark arrives FIRST: opacity 0→1, blur 5px→sharp and
    // a tracking squeeze (0.08em → 0) across WORD_DUR, easeOutQuint
    const e = easeOutQuint(clamp(s / WORD_DUR, 0, 1));
    word.style.opacity = e.toFixed(3);
    word.style.filter = e < 1 ? `blur(${(5 * (1 - e)).toFixed(2)}px)` : 'none';
    word.style.letterSpacing = `${(0.08 * (1 - e)).toFixed(4)}em`;
  },

  botFx(s, bot, base) {
    // stage 2 — the mascot drops in beneath the settled wordmark: hidden
    // until BOT_AT, then +12px → slight overshoot → 0 across BOT_DUR.
    // APPEND ONLY: base is the renderer's computed transform string.
    const u = clamp((s - BOT_AT) / BOT_DUR, 0, 1);
    if (u <= 0) {
      bot.style.opacity = '0';
      bot.style.transform = `${base} translateY(${BOT_DROP.toFixed(2)}px)`;
      return;
    }
    const e = easeOutBack(u);
    const y = BOT_DROP * (1 - e);            // 12 → ~-1.2 (overshoot) → 0
    bot.style.opacity = clamp(u / 0.4, 0, 1).toFixed(3);   // fades in on the way down
    bot.style.transform = `${base} translateY(${y.toFixed(2)}px)`;
  },
};
