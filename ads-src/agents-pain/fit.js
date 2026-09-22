'use strict';
// Sizes the two headline rows to the frame: each row is grown until it spans
// TARGET_W of the poster width, then the whole block is scaled down if it
// would take more than TARGET_H of the height. That is what lets one page
// render 4:5, 16:9, 4:3 and 1:1 without a per-ratio stylesheet, and lets a
// long pain word ("hallucinating") sit on the same grid as a short one.
const TARGET_W = 0.9;   // share of the poster width the longest row spans
const TARGET_H = 0.62;  // share of the poster height the text block may take
const L2_OVER_L1 = 1.16; // row 2 reads bigger than row 1, as in the reference art

function fit() {
  const poster = document.querySelector('.poster');
  const rows = [...document.querySelectorAll('.line')];
  if (!poster || rows.length === 0) return;
  const pw = poster.clientWidth, ph = poster.clientHeight;
  const pad = parseFloat(getComputedStyle(poster).paddingLeft) || 0;
  const avail = pw - pad * 2;

  const size = (base, i) => base * (i === 1 ? L2_OVER_L1 : 1);
  const apply = (base) => {
    rows.forEach((r, i) => { r.style.fontSize = `${size(base, i)}px`; });
    // the mark scales with the type, not with the frame. The face fills only
    // the middle ~72% of face.svg's box, so the box is drawn at 2x the row-1
    // size to land the visible cat at the reference art's proportion (about
    // 1.24x the second row's font-size).
    const face = document.querySelector('.face');
    if (face) face.style.width = `${base * 2}px`;
  };
  const widest = () => Math.max(...rows.map(r => r.getBoundingClientRect().width));

  // a probe pass gives px-per-font-unit, then two correction passes land it:
  // scrollWidth on a flex item is clamped by the container, so the first
  // estimate can run wide and the measured width is what settles it
  const PROBE = 100;
  apply(PROBE);
  let base = (avail * TARGET_W) / (widest() / PROBE);
  apply(base);
  for (let i = 0; i < 3; i++) {
    const w = widest();
    if (Math.abs(w - avail * TARGET_W) < 1) break;
    base *= (avail * TARGET_W) / w;
    apply(base);
  }

  // height guard: shrink the whole lockup if the block (rows + face + gaps)
  // would eat more than TARGET_H of the frame
  const block = document.querySelector('.lock');
  if (block) {
    const h = block.scrollHeight;
    const max = ph * TARGET_H + (document.querySelector('.face')?.clientHeight || 0);
    if (h > max) { base *= max / h; apply(base); }
  }
  document.documentElement.dataset.fitted = '1';
}

addEventListener('resize', fit);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
addEventListener('load', fit);
fit();
