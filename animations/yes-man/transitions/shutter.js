// shutter — one hard-edged horizontal bar travels down the frame: the card
// is erased from the top edge downward while the end card is revealed beneath
// it in the same direction, synchronized (sim: the two frames tile, the black
// band between their clip edges IS the bar). Deterministic in (p, q, t).

const SWEEP = 106;   // % of frame the erase edge travels (-3 → 103, exits bottom)
const BAR = 3;       // bar thickness, % of frame height — constant, hard-edged

export default {
  d: 0.18,           // out duration — the sweep; 0.15–0.25s mechanical snap
  beat: 0,           // sim: the end card arrives during the out, no gap
  sim: true,         // frames tile — zero content overlap, ever
  out(el, p) {
    // erase the card from the top down: the top inset grows to 103%, so the
    // card's visible region is the band-bottom → frame-bottom sliver that
    // shrinks to nothing as the bar leaves through the bottom edge
    el.style.clipPath = `inset(${(p * SWEEP - BAR).toFixed(2)}% -2% -2% -2%)`;
  },
  in(ov, q) {
    // reveal the end card from the top down, trailing the erase edge by
    // exactly BAR: its visible region is frame-top → bar-top. p === q here
    // (inDur reuses d and the renderer eases both identically), so the two
    // clip edges stay a constant BAR apart and read as one mechanical bar.
    if (q >= 0.999) { ov.style.clipPath = 'none'; return; }
    ov.style.clipPath = `inset(-2% -2% ${(SWEEP * (1 - q)).toFixed(2)}% -2%)`;
  },
};
