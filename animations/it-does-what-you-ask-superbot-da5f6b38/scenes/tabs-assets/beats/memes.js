// Gemini, a batch at once: superbot carries straight on to Gemini, which makes more Muse memes. Each tile resolves
// out of a blur under its own sweeping band, a beat after the one before. The images are user-supplied Muse edits
// (img/muse-*.jpg, see img/CREDITS.txt); they are shown whole, with no caption strip.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

export const MEMES = [
  { img: 'muse-office.jpg', cap: '', title: 'Muse pulling an all-nighter at Facebook' },
  { img: 'muse-distracted.jpg', cap: '', title: 'me ignoring my terminal for Muse' },
  { img: 'muse-forehead.jpg', cap: '', title: 'the bond between me and Muse' },
  { img: 'muse-coat.jpg', cap: '', title: 'bundled up to go touch grass with Muse' },
  { img: 'muse-device.jpg', cap: '', title: 'the only Meta device I need' },
];
// the first meme (beats/gemini.js), the one posted on its own in beats/reddit.js
export const HERO = { img: 'muse-meme.png', title: 'Muse really said check your messages' };

export const memeHTML = (x, m, cls = '') => `<span class="mm ${cls}">${m.cap ? `<span class="mm-cap">${x.esc(m.cap)}</span>` : ''}<span class="mm-pic"><img src="${x.img(m.img)}" alt=""/></span></span>`;

const N = MEMES.length;
const SAY = `Made ${N} more.`;

export default {
  times(r) {
    const T = { r };
    T.grid = r + 0.2;
    T.w = MEMES.map((_, i) => [r + 0.3 + i * 0.2, r + 1.0 + i * 0.2]);
    T.end = T.w[MEMES.length - 1][1] + 0.55;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const grid = x.el(`<div class="mm-grid" style="--n:${N}">${MEMES.map((m) => `<span class="mm-cell">${memeHTML(x, m, 'mm-fit')}<i class="qc-gen"></i></span>`).join('')}</div>`);
    const genl = x.el(`<div class="mm-genl">${x.tile('gemini')}<span>Creating ${N} images</span><b class="mm-n">0/${N}</b></div>`);
    const cells = [...grid.children].map((c) => ({ c, mm: c.querySelector('.mm'), gen: c.querySelector('.qc-gen') }));
    const vis = say.firstElementChild, hid = say.lastElementChild, n5 = genl.querySelector('.mm-n'), glab = genl.querySelector('span:not(.qc-tile)');
    let shown = -1;
    return {
      nodes: [say, genl, grid],
      marks: [[T.r, say], [T.grid, grid]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const gi = outCubic(seg(t, T.grid - 0.1, T.grid + 0.35));
        genl.style.opacity = gi.toFixed(3);
        const gl = t >= T.w[N - 1][1] ? `Created ${N} images` : `Creating ${N} images`;
        if (glab.textContent !== gl) glab.textContent = gl;
        grid.style.opacity = gi.toFixed(3);
        let done = 0;
        cells.forEach(({ c, mm, gen }, i) => {
          const [a, b] = T.w[i];
          const ci = outCubic(seg(t, a - 0.2, a + 0.2));
          c.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px) scale(${lerp(0.94, 1, ci).toFixed(4)})`;
          c.style.opacity = ci.toFixed(3);
          const p = seg(t, a, b), e = outCubic(p);
          mm.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 10).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
          mm.style.opacity = lerp(0.35, 1, e).toFixed(3);
          gen.style.transform = `translateX(${lerp(-110, 110, (p * 2) % 1).toFixed(1)}%)`;
          gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
          if (t >= b) done++;
        });
        const lab = `${done}/${N}`;
        if (n5.textContent !== lab) n5.textContent = lab;
      },
    };
  },
};
