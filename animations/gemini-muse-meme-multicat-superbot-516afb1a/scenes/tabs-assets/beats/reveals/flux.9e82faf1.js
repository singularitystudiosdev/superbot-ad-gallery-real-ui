// FLUX playground (spec .tmp/clone-9e82faf1/reveal-refs/flux/spec.json, confidence 0.6; frames in reveal-refs/flux/frames/i1_*
// and i2_*, sheet.png; YouTube iwnum4YEmOw 2025-07-24 at 111.9-113.8s and 5wwOpmXePOI 2025-11-27 at 198-201.2s, the 4K clip). A
// near-black page (#111111) with a rounded prompt card (#212121, a #3E3E3E hairline) and, below it, the submitted prompt echoed
// as one caption line above a row of flat #1F1F1F tiles. Each pending tile is completely static: no shimmer, no sweep, no
// percentage, timer, step count or bar. The only sign of work is one small light-grey (#D6D6D6) three-quarter arc turning slowly
// in its centre. Then the tile is replaced by the finished image in a single frame: a hard swap, no blur, no cross-fade.
// Adapted to ten images: a 5 x 2 grid of such tiles, all pending from the start, landing one after another in reading order,
// each a hard swap. The arc is driven by render(t) (never a CSS animation). The model name and the prompt text are plain
// words in the system UI face; the playground's logo, wordmark and fonts are not drawn or shipped.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-fx';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 14px 14px 16px; border-radius: 10px; background: #111111; color: #d9d9d9; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-card { box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; padding: 11px 12px 10px; border-radius: 10px; background: #212121; box-shadow: inset 0 0 0 1px #3e3e3e; }
.${P}-pr { font-size: 13px; line-height: 19px; color: #ececec; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-ct { display: flex; align-items: center; gap: 8px; height: 26px; font-size: 11px; line-height: 16px; color: #9a9a9a; white-space: nowrap; }
.${P}-pill { padding: 2px 9px; border-radius: 10px; box-shadow: inset 0 0 0 1px #3e3e3e; color: #b9b9b9; }
.${P}-sp1 { flex: 1; }
.${P}-send { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #f1f1f1; }
.${P}-send svg { width: 12px; height: 12px; stroke: #161616; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; fill: none; }
.${P}-cap { margin: 14px 0 8px; font-size: 11px; line-height: 16px; color: #8c8c8c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; border-radius: 4px; overflow: hidden; background: #1f1f1f; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-pd { position: absolute; inset: 0; display: grid; place-items: center; background: #1f1f1f; }
.${P}-ar { box-sizing: border-box; width: 15px; height: 15px; border-radius: 50%; border: 2px solid #d6d6d6; border-right-color: transparent; }
`;

const SPIN_S = 0.85;   // seconds per turn of the arc: slow, as in the footage

export default {
  id: 'flux',
  label: 'FLUX playground',
  source: {
    platform: 'FLUX playground (Black Forest Labs web app), dark theme',
    feature: 'Text-to-image: the prompt echoed above flat #1F1F1F tiles, each with one small slowly turning light-grey arc (no shimmer, percentage, timer or bar), then a hard swap to the finished image (adapted to 10 as a 5 x 2 grid landing one after another)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=iwnum4YEmOw', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=5wwOpmXePOI', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'flux');
    const tile = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-pd"><i class="${P}-ar"></i></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-card"><div class="${P}-pr">A muse meme in ten takes</div><div class="${P}-ct"><span class="${P}-pill">Ultra</span><span class="${P}-pill">9:16</span><span class="${P}-pill">Batch 10</span><span class="${P}-sp1"></span><span class="${P}-send"><svg viewBox="0 0 12 12"><path d="M6 10V2M2.5 5.5L6 2l3.5 3.5"/></svg></span></div></div><div class="${P}-cap">A muse meme in ten takes</div><div class="${P}-grid">${tiles.map(tile).join('')}</div></div>`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      im: n.querySelector('img'), pd: n.querySelector(`.${P}-pd`), ar: n.querySelector(`.${P}-ar`), g: tiles[i], landed: false,
    }));
    ctx.gate(cells.map((c) => c.im));
    // the arc turns in step across the tiles (one clock), as the two clips show tiles turning together

    return {
      root,
      render(t) {
        const rot = `rotate(${(((t / SPIN_S) % 1 + 1) % 1 * 360).toFixed(1)}deg)`;
        cells.forEach((c, i) => {
          const landed = seg(t, ...ctx.seq(i)) >= 1;
          if (c.landed !== landed) {
            c.im.style.display = landed ? 'block' : 'none';
            c.pd.style.display = landed ? 'none' : '';
            c.landed = landed;
          }
          // the arc's angle is a function of t alone, so a hidden arc carries the same style whether the page was seeked or fresh
          c.ar.style.transform = rot;
          // landed (a hard swap) or not, the image rests at its crop's own CSS
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
