'use strict';
// Sizes the headline to its column: .head's font-size is grown until the
// widest row spans TARGET_W of the column, then capped so the two rows never
// take more than TARGET_H of the frame. One page therefore renders 4:5, 16:9,
// 4:3 and 1:1 without a per-ratio stylesheet, and a long pain word
// ("compacting") sits on the same grid as a short one ("full").
const TARGET_W = 0.96;  // share of the column width the longest row spans
const TARGET_H = 0.30;  // share of the frame height the two rows may take

function fit() {
  const poster = document.querySelector('.poster');
  const head = document.querySelector('.head');
  const rows = [...document.querySelectorAll('.line')];
  if (!poster || !head || rows.length === 0) return;
  const avail = head.clientWidth;
  const widest = () => Math.max(...rows.map(r => r.getBoundingClientRect().width));

  // a probe pass gives px-per-font-unit, then correction passes land it
  const PROBE = 100;
  head.style.fontSize = `${PROBE}px`;
  let base = (avail * TARGET_W) / (widest() / PROBE);
  head.style.fontSize = `${base}px`;
  for (let i = 0; i < 3; i++) {
    const w = widest();
    if (Math.abs(w - avail * TARGET_W) < 1) break;
    base *= (avail * TARGET_W) / w;
    head.style.fontSize = `${base}px`;
  }

  const max = poster.clientHeight * TARGET_H;
  if (head.scrollHeight > max) {
    base *= max / head.scrollHeight;
    head.style.fontSize = `${base}px`;
  }
  document.documentElement.dataset.fitted = '1';
}

addEventListener('resize', fit);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
addEventListener('load', fit);
fit();
