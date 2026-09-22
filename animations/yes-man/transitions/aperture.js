// aperture — the frame collapses to a horizontal line and the end card
// opens from that same line: one synchronized squash-and-open, a shutter
// closing into and reopening out of a single slit. Sim: both phases run
// inside one 0.18s window. The card reaches the line just before the end
// card leaves it (a ~55/45 split of the same window), so the handoff
// happens AT the line and the two frames never share readable content —
// at the crossover both layers are a ~2% sliver, which reads as the line
// itself. Pure geometry: scaleY about the center, nothing else moves.
// Deterministic in (p/q, t) — no Math.random, no CSS transition/animation;
// p and q arrive already eased (easeInOutSine in timeline.js), and both
// ramps are linear maps of that same eased progress, so the whole event
// carries one identical easing and reads as a single continuous flick.
// Each phase ≤ 0.3s.

export default {
  d: 0.18,       // the card collapses to the line
  beat: 0,       // no gap — the end card is already waiting at the line
  inDur: 0.18,   // the end card opens from the line, same duration
  sim: true,     // both phases share the window; the line is the handoff

  out(el, p, t) {
    // p already eased 0→1; squash the whole card layer into a horizontal
    // line — full height to ~2%, centered. At the line by 55% of the
    // window, then it holds there while the end card opens over it.
    const c = Math.min(p / 0.55, 1);
    el.style.transformOrigin = 'center';
    el.style.transform = `scaleY(${(1 - 0.98 * c).toFixed(4)})`;
  },

  in(ov, q, t) {
    // q already eased 0→1; hold closed at the line while the card
    // collapses into it, then open from that line to full height.
    const o = Math.max(0, (q - 0.45) / 0.55);
    const s = o === 0 ? 0.001 : 0.02 + 0.98 * o;
    ov.style.transformOrigin = 'center';
    ov.style.transform = `scaleY(${s.toFixed(4)})`;
  },
};
