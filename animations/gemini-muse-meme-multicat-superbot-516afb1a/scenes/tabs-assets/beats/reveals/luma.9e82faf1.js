// Luma's Dream Machine board (spec .tmp/clone-9e82faf1/reveal-refs/luma/spec.json, confidence 0.5; frames in reveal-refs/luma/frames/,
// sheet.png, placeholder-sheet.png and reveal-sheet.png; YouTube QWFyOG_fl4M 2025-11-21 at 227.5-236.4s, a single compressed
// capture). A black (#000000) board with a faint violet / teal / amber ambient glow; a generation is a row of portrait 9:16 tiles
// (about 10px radius) of flat near-black (#171717) with NO glyph, spinner, bar, percentage or timer. The only mark is a dim
// bottom-left label: 'Dreaming...' on a tile that is generating, 'Waiting for your turn...' with an underlined 'Cancel' on one
// still queued (three render at once, the rest queue and start as slots free). A tile lands in place: it abruptly shows a bright,
// heavily blurred, low-contrast, low-resolution haze that gains structure and contrast until it is the sharp image (about 3 s in
// the capture), and the label clears. The composer below carries the chip 'IMAGE • PHOTON • 9:16' as plain text.
// Adapted to ten images: a 5 x 2 board of such tiles, three generating at a time and the rest waiting their turn, four waves
// (3 + 3 + 3 + 1) across the beat's window; the capture's seconds-long sharpening is compressed to fit it. The words are plain
// text in the system UI face; the platform's leaf mark, wordmark and fonts are not drawn or shipped.
import { clamp, seg, lerp, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-lm';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 14px 14px 12px; border-radius: 14px; color: #c9cdcc; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden;
  background: radial-gradient(60% 40% at 12% 108%, rgba(120, 78, 150, .30), rgba(0, 0, 0, 0)), radial-gradient(50% 36% at 56% 112%, rgba(54, 128, 126, .24), rgba(0, 0, 0, 0)), radial-gradient(46% 34% at 96% 100%, rgba(150, 118, 58, .24), rgba(0, 0, 0, 0)), #000000; }
.${P}-hd { font-size: 12px; line-height: 17px; color: #b7bbba; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-hd b { font-weight: 700; color: #f2f2f2; letter-spacing: .02em; }
.${P}-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
.${P}-t { position: relative; aspect-ratio: 9 / 16; border-radius: 10px; overflow: hidden; background: #171717; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-lb { position: absolute; left: 7px; right: 5px; bottom: 6px; font-size: 8px; line-height: 11px; color: #a1a8a7; }
.${P}-lb u { margin-left: 4px; color: #6e6e6e; }
.${P}-cm { display: flex; align-items: center; gap: 8px; height: 30px; margin-top: 12px; padding: 0 12px; border-radius: 15px; background: rgba(23, 23, 23, .92); box-shadow: inset 0 0 0 1px #363638; font-size: 10px; line-height: 14px; white-space: nowrap; }
.${P}-cm span:first-child { flex: 1; color: #6e6e6e; }
.${P}-cm span:last-child { color: #a1a8a7; letter-spacing: .03em; }
`;

const WAVE = 3;        // tiles generating at once; the rest wait their turn
const FLAT = 0.42;     // the share of a tile's turn it stays a flat dark tile before the blurred haze shows
const SKEW = 0.03;     // the share of the window by which the tiles of one wave start apart

export default {
  id: 'luma',
  label: 'Luma (Dream Machine)',
  source: {
    platform: 'Luma Dream Machine web board (Image mode), dark theme',
    feature: 'Image batch: near-black 9:16 tiles with no glyph, spinner or bar, a dim bottom-left label (Dreaming... / Waiting for your turn... Cancel), each landing in place as a bright blurred low-res haze that sharpens to the image (adapted to 10: three generating at a time, four waves, the ~3 s sharpening compressed to the beat window)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=QWFyOG_fl4M', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'luma');
    const tile = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-lb">Dreaming...</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><b>MUSE</b> meme, ten takes</div><div class="${P}-grid">${tiles.map(tile).join('')}</div><div class="${P}-cm"><span>What do you want to see...</span><span>IMAGE • PHOTON • 9:16</span></div></div>`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      im: n.querySelector('img'), lb: n.querySelector(`.${P}-lb`), g: tiles[i], img: null, text: 'Dreaming...',
    }));
    ctx.gate(cells.map((c) => c.im));

    return {
      root,
      render(t) {
        // four waves of up to three tiles fill the window; a queued tile starts when the slot of the tile three before it frees
        const S = ctx.seq(0)[0], D = ctx.lastLand - S, skew = SKEW * D, U = (D - (WAVE - 1) * skew) / Math.ceil(cells.length / WAVE);
        cells.forEach((c, i) => {
          const r = S + Math.floor(i / WAVE) * U + (i % WAVE) * skew;   // this tile starts generating
          const b = r + FLAT * U, e = r + U;                             // the haze shows; it is sharp and its label clears
          const shown = t >= b;
          const landed = t >= e;
          if (c.img !== shown) { c.im.style.display = shown ? 'block' : 'none'; c.img = shown; }
          if (landed) {
            // landed: the crop's own CSS exactly
            c.im.style.filter = restFilter(c.g);
            c.im.style.transform = restTransform(c.g);
          } else if (shown) {
            // a bright, heavily blurred, low-contrast haze that gains structure and contrast in place
            const q = outCubic(clamp(seg(t, b, e)));
            c.im.style.filter = `blur(${lerp(14, 0, q).toFixed(2)}px) brightness(${lerp(1.7, 1, q).toFixed(3)}) contrast(${lerp(0.35, 1, q).toFixed(3)}) saturate(${lerp(0.25, 1, q).toFixed(3)}) ${c.g.grade || ''}`.trim();
            c.im.style.transform = restTransform(c.g);
          }
          const text = landed ? '' : i >= WAVE && t < r ? 'wait' : 'dream';
          if (text !== c.text) {
            c.lb.innerHTML = text === 'wait' ? `Waiting for your turn...<u>Cancel</u>` : text === 'dream' ? 'Dreaming...' : '';
            c.text = text;
          }
        });
      },
    };
  },
};
