// snap — the reference "extremely simple" transition: a 0.1s hard snap to
// the mascot, then the superbot.gg wordmark extends out of it to the right.
// No easing flourishes: the mascot just lands, the word slides out once.
export default {
  d: 0.1,           // the card vanishes in a tenth of a second
  beat: 0,          // no black gap — the snap lands straight on the mascot
  inDur: 0.1,       // the end card snaps in just as fast
  snap: true,       // logo lockup lands instantly — no drift
  out: (el, p) => { el.style.opacity = (1 - p).toFixed(3); },
  in: (ov, q) => { ov.style.opacity = q.toFixed(3); },
  // the wordmark extends from behind the mascot: a hard-edged reveal,
  // left → right, after a beat
  wordFx: (s, word) => {
    const q = Math.min(1, Math.max(0, (s - 0.18) / 0.45));
    word.style.opacity = q > 0.02 ? '1' : '0';
    word.style.clipPath = `inset(-5% ${(105 - 107 * q).toFixed(2)}% -5% -2%)`;
    word.style.filter = 'none';
  },
};
