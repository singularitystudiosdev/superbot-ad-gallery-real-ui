// Recraft's studio (spec .tmp/clone-9e82faf1/reveal-refs/recraft/spec.json, confidence 0.55; frames in reveal-refs/recraft/frames/,
// sheet.png and sheet-batch.png; YouTube rQe7i3iBMsk 2025-04-27, a single image at 90.2-101.1s and a batch of six at 561-572s).
// Dark chrome (#161616 shell, #222222 side rail) around a large light artboard (#E8EAEC). Generating is a flat, opaque mint block
// (#A7E3DC) over each image slot: no text, icon, spinner, bar, shimmer or gradient, held for the whole generation, and for a
// batch all the slots show it at once on a white board in a 3 x 2 grid. Then each block is replaced by its image in a single step
// (a hard cut, nothing dissolves or wipes).
// Adapted to ten images: two batches in turn on the artboard, a 3 x 2 grid of six and then a 2 x 2 grid of four; a batch's blocks
// all appear together when its turn starts, and its images cut in one after another in reading order. The free-plan badge the
// footage stamps on finished images is a logo and is not drawn; the controls are plain shapes and words in the system UI face.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-rc';
const TW = 76, TH = 90, TG = 6, BP = 8;   // px: tile width and height, the gap between tiles, a board's padding
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; border-radius: 10px; background: #161616; color: #cfcfcf; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-top { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 10px; background: #222222; font-size: 11px; line-height: 16px; color: #a9a9a9; white-space: nowrap; }
.${P}-sp1 { flex: 1; }
.${P}-go { padding: 3px 11px; border-radius: 6px; background: #f26a2e; color: #fff; font-weight: 600; }
.${P}-body { display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; width: 46px; padding: 12px 9px; background: #222222; }
.${P}-rail i { display: block; height: 4px; margin-bottom: 9px; border-radius: 2px; background: #3a3a3a; }
.${P}-rail i:first-child { height: 26px; border-radius: 4px; background: #8d87d8; }
.${P}-art { flex: 1; min-width: 0; display: flex; align-items: flex-start; justify-content: center; gap: 14px; padding: 16px 10px 18px; background: #e8eaec; }
.${P}-b { flex: none; display: grid; gap: ${TG}px; padding: ${BP}px; background: #ffffff; visibility: hidden; }
.${P}-b.${P}-on { visibility: visible; }
.${P}-t { position: relative; width: ${TW}px; height: ${TH}px; overflow: hidden; border-radius: 3px; background: #a7e3dc; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-mint { position: absolute; inset: 0; background: #a7e3dc; }
`;

const BATCHES = [{ ids: [0, 1, 2, 3, 4, 5], cols: 3 }, { ids: [6, 7, 8, 9], cols: 2 }];

export default {
  id: 'recraft',
  label: 'Recraft',
  source: {
    platform: 'Recraft web studio, dark chrome around a light artboard',
    feature: 'Image generation: a flat opaque mint block (#A7E3DC, no text, spinner or bar) over each image slot of a batch grid, then each block hard-cuts to its image (adapted to 10 as two batch grids, 3 x 2 then 2 x 2, in turn)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=rQe7i3iBMsk', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'recraft');
    const tile = (i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${tiles[i].origin}"/><i class="${P}-mint"></i></div>`;
    const board = (b) => `<div class="${P}-b" style="grid-template-columns: repeat(${b.cols}, ${TW}px)">${b.ids.map(tile).join('')}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span>Studio</span><span class="${P}-sp1"></span><span class="${P}-go">Generate</span></div><div class="${P}-body"><div class="${P}-rail"><i></i><i></i><i></i><i></i></div><div class="${P}-art">${BATCHES.map(board).join('')}</div></div></div>`);
    const boards = [...root.querySelectorAll(`.${P}-b`)].map((n) => ({ el: n, on: false }));
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      im: n.querySelector('img'), mint: n.querySelector(`.${P}-mint`), g: tiles[i], landed: null,
    }));
    ctx.gate(cells.map((c) => c.im));

    return {
      root,
      render(t) {
        BATCHES.forEach((b, j) => {
          // a batch's blocks all appear together when its turn starts (the next one as the last of the one before lands)
          const on = t >= ctx.seq(b.ids[0])[0];
          const bd = boards[j];
          if (bd.on !== on) { bd.el.classList.toggle(`${P}-on`, on); bd.on = on; }
          b.ids.forEach((i) => {
            const c = cells[i];
            const landed = seg(t, ...ctx.seq(i)) >= 1;
            if (c.landed !== landed) {
              c.im.style.display = landed ? 'block' : 'none';
              c.mint.style.display = landed ? 'none' : '';
              c.landed = landed;
            }
            // a hard cut: the image rests at its crop's own CSS from the first frame it shows
            c.im.style.filter = restFilter(c.g);
            c.im.style.transform = restTransform(c.g);
          });
        });
      },
    };
  },
};
