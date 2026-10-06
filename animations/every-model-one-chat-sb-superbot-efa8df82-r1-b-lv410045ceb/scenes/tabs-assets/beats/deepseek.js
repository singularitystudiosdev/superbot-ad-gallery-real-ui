// DeepSeek beat: scrapes r/Soda (the post count climbs as it reads), names the gap, and quotes the real posts it
// rests on (r/Soda search "flavor", top of the year, read 2026-10-04: two titles and one post body).
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'The gap: mandarin + cream, zero sugar.';
const POSTS = [
  '“Which is the best Orange/Mandarin Soda?”',
  '“What’s the best 0 calorie, 0 sugar soda…”',
  '“I wish it leaned more vanilla cream…”',
];
const COUNT = 50;

export default {
  times(r) {
    const T = { r };
    T.src = r + 0.02; T.srcDone = r + 1.06;
    T.say = r + 1.1;
    T.q = [r + 1.28, r + 1.36, r + 1.44];
    T.landed = r + 1.54;
    T.end = r + 1.64;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const src = x.el(`<div class="ds-src"><span class="ds-ic"><img src="${x.brand('reddit-tile.png')}" alt=""/></span><span class="ds-l"></span><span class="qc-st"><i class="qc-spin"></i>${x.OK}</span></div>`);
    const say = x.el(`<div class="qc-say ds-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const q = x.el(`<div class="ds-q">${POSTS.map((p) => `<span>${x.esc(p)}</span>`).join('')}</div>`);
    const lab = src.querySelector('.ds-l'), spin = src.querySelector('.qc-spin'), ok = src.querySelector('.qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild, rows = [...q.children];
    let shown = -1, lastLab = '', minW = 0;
    return {
      nodes: [src, say, q],
      marks: [[T.src, src], [T.say, say], [T.q[0], q]],
      render(t) {
        const a = outCubic(seg(t, T.src, T.src + 0.24));
        src.style.opacity = a.toFixed(3);
        // the count climbs steadily with the read
        const n = Math.round(COUNT * seg(t, T.src + 0.06, T.srcDone));
        // the chip keeps the width of its longest running label, so finishing never snaps it narrower
        if (!minW) { lab.innerHTML = `Scraping <b>r/Soda</b> · ${COUNT} posts`; minW = lab.offsetWidth; if (minW) lab.style.minWidth = `${minW}px`; lastLab = ''; }
        const l = t >= T.srcDone - 0.05 ? `Scraped <b>r/Soda</b> · ${COUNT} posts` : `Scraping <b>r/Soda</b> · ${n} posts`;
        if (l !== lastLab) { lab.innerHTML = l; lastLab = l; }
        spin.style.opacity = (1 - seg(t, T.srcDone - 0.1, T.srcDone)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.src) * 420).toFixed(1)}deg)`;
        const o = seg(t, T.srcDone - 0.1, T.srcDone);
        ok.style.opacity = o.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, outCubic(o)).toFixed(4)})`;
        const c = streamCount(SAY, T.say, 95, t);
        if (c !== shown) { vis.textContent = SAY.slice(0, c); hid.textContent = SAY.slice(c); shown = c; }
        rows.forEach((row, i) => {
          const p = outCubic(seg(t, T.q[i], T.q[i] + 0.28));
          row.style.opacity = p.toFixed(3);
          row.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
        });
      },
    };
  },
};
