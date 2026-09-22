// blink — the simplest transition that can possibly exist.
// The card is there, then one black blink, then the end card is there.
// Non-sim: the card leaves (d), one pure-black beat (beat), THEN the end
// card arrives (inDur) — nothing ever overlaps, so the leaving card can
// never let the end card show through it. out and in touch opacity only.
// Every phase ≤ 0.25s; all three tiny, so at 30/60fps this reads as a
// single frame of black between two shots. Deterministic in (p/q, t):
// no Math.random, no CSS transition/animation — the renderer runs every
// frame. p and q arrive already eased (easeInOutSine in timeline.js);
// on this scale easing is indistinguishable from linear, which is the point.

export default {
  d: 0.05,       // the card layer drops out — near-instant
  beat: 0.06,    // the blink: pure black, nothing on screen
  inDur: 0.06,   // the end card arrives, same near-instant drop

  out(el, p, t) {
    // p already eased 0→1; opacity only — the card is there, then it isn't
    el.style.opacity = (1 - p).toFixed(3);
  },

  in(ov, q, t) {
    // q already eased 0→1; opacity only — the end card is there, then it is
    ov.style.opacity = q.toFixed(3);
  },
};
