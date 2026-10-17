// Midjourney's web create feed (observed in the 2025-06-26 walkthrough, .tmp/clone-9e82faf1/reveal-refs/midjourney/progress/;
// no 2026 recording was obtainable): the LIGHT create page; an imagine bar with a '1 queued images' pill under it; a
// 'Today' feed of jobs, each a 2x2 grid of flat grey #e8eaec tiles (no shimmer, no icon) with a 'Queued' capsule on the
// pending job, an 'N% Complete' label under the grid while it runs, a prompt and params column to its right; then ALL
// FOUR tiles of the job flip together to a heavily blurred low-res colour preview that sharpens in place. A real job is
// four images, so ten images are three jobs (4 + 4 + 2) running that sequence in turn, the images landing in order.
// The mark is a plain stand-in square, the face is the system UI stack: nothing of Midjourney's is drawn or shipped.
import { lerp, seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mj';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 12px 14px 12px; border-radius: 14px; background: #fff; color: #2a2a2e; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-bar { display: flex; align-items: center; gap: 9px; height: 26px; padding: 0 10px; box-sizing: border-box; border-radius: 14px; background: #f5f5f6; box-shadow: 0 0 0 1px #ececee; font-size: 12.5px; color: #a3a4aa; }
.${P}-bar i { flex: none; display: block; width: 12px; height: 12px; border-radius: 3px; box-shadow: inset 0 0 0 1.5px #9b9ca3; }
.${P}-qr { display: flex; align-items: center; justify-content: space-between; height: 20px; margin: 6px 0 6px; }
.${P}-q { padding: 0 8px; border-radius: 10px; background: #f1f1f3; font-size: 11px; line-height: 20px; color: #55565c; }
.${P}-td { font-size: 12.5px; font-weight: 500; color: #55565c; }
.${P}-job { display: flex; gap: 14px; margin-bottom: 5px; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(2, 60px); gap: 5px; }
.${P}-t { position: relative; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; background: #e8eaec; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pill { position: absolute; left: 5px; top: 5px; padding: 0 7px; border-radius: 9px; background: rgba(255, 255, 255, .85); font-size: 10px; line-height: 17px; font-weight: 500; color: #e5605a; }
.${P}-lb { height: 15px; margin-top: 4px; font-size: 10.5px; line-height: 15px; font-weight: 500; color: #e5605a; }
.${P}-meta { min-width: 0; padding-top: 2px; }
.${P}-pr { font-size: 12.5px; line-height: 17px; color: #2a2a2e; }
.${P}-ch { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.${P}-ch span { padding: 0 7px; border-radius: 9px; background: #f1f1f3; font-size: 10.5px; line-height: 18px; color: #7b7c82; }
`;

const JOBS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]];   // a job is up to four images
const FLIP = 0.34;                                    // the share of a job's run its tiles stay grey before they flip
const BLUR = 18;                                      // the preview's blur in px, heavy as in the frames

export default {
  id: 'midjourney',
  label: 'Midjourney',
  source: {
    platform: 'Midjourney web (midjourney.com), create feed, light theme',
    feature: 'Create feed: jobs of four flat grey tiles with Queued / N% Complete, then all four flip to a blurred preview that sharpens (adapted to 10 as three jobs, 4 + 4 + 2)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=wxgdENSzYVw', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=MGPMXg6o2ks', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const tile = (i) => `<div class="${P}-t"><img src="${ownSrc(ctx.src, 'midjourney')}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${tiles[i].origin}"/></div>`;
    const job = (ids) => `<div class="${P}-job"><div><div class="${P}-g">${ids.map(tile).join('')}</div><div class="${P}-lb"></div></div><div class="${P}-meta"><div class="${P}-pr">Muse meme, ten variations</div><div class="${P}-ch"><span>ar 1:1</span><span>v 6.1</span></div></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-bar"><i></i>What will you imagine?</div><div class="${P}-qr"><span class="${P}-td">Today</span><span class="${P}-q"></span></div>${JOBS.map(job).join('')}</div>`);
    const queue = root.querySelector(`.${P}-q`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ el: n, im: n.querySelector('img'), g: tiles[i], pill: null, state: '' }));
    const labels = [...root.querySelectorAll(`.${P}-lb`)];
    ctx.gate(cells.map((c) => c.im));
    // the 'Queued' capsule sits on the first tile of each job
    JOBS.forEach((ids) => {
      const c = cells[ids[0]];
      c.pill = x.el(`<span class="${P}-pill">Queued</span>`);
      c.el.append(c.pill);
    });
    const text = { q: null, lb: [] };

    return {
      root,
      render(t) {
        let waiting = 0;
        JOBS.forEach((ids, j) => {
          const A = ctx.seq(ids[0])[0], B = ctx.seq(ids[ids.length - 1])[1], flip = A + FLIP * (B - A);
          const phase = t < A ? 'queued' : t < flip ? 'grey' : 'blur';
          if (t < B) waiting += ids.length;
          ids.forEach((i, k) => {
            const c = cells[i];
            if (c.pill) c.pill.style.display = phase === 'queued' ? '' : 'none';
            if (phase !== 'blur') {
              // flat grey, no image painted
              if (c.state !== 'grey') { c.im.style.visibility = 'hidden'; c.state = 'grey'; }
              return;
            }
            if (c.state !== 'img') { c.im.style.visibility = ''; c.state = 'img'; }
            // all four flip together to a heavy low-res blur, then each sharpens in place, in order, the last one sharp at the
            // job's end (the end of its last ctx.seq window)
            const p = seg(t, flip, flip + (B - flip) * (0.55 + 0.45 * (k + 1) / ids.length));
            if (p >= 1) {
              c.im.style.filter = restFilter(c.g);
              c.im.style.transform = restTransform(c.g);
            } else {
              const e = outCubic(p);
              c.im.style.filter = `blur(${lerp(BLUR, 0, e).toFixed(2)}px) saturate(${lerp(1.25, 1, e).toFixed(3)}) ${c.g.grade}`.trim();
              c.im.style.transform = `scale(${(c.g.zoom * lerp(1.12, 1, e)).toFixed(4)})`;
            }
          });
          // 'N% Complete' under the grid while the job runs (the label is the only progress signal), gone once it flips
          const lb = phase === 'grey' ? `${Math.round(lerp(10, 99, seg(t, A, flip)))}% Complete` : '';
          if (text.lb[j] !== lb) { labels[j].textContent = lb; text.lb[j] = lb; }
        });
        const q = waiting ? `${waiting} queued images` : '';
        if (text.q !== q) { queue.textContent = q; queue.style.display = waiting ? '' : 'none'; text.q = q; }
      },
    };
  },
};
