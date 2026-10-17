// Qwen Chat's text-to-image inside a chat thread (observed in the 2026-10-14 scan of a 1080p screen recording, spec
// .tmp/clone-9e82faf1/reveal-refs/qwen/spec.json, confidence 0.65; frames reveal-refs/qwen/frames/p_025..p_058, sheet.png): the
// dark chat surface (#232225), the prompt as a small right-aligned dark-grey bubble, and in the assistant's turn ONE large
// rounded square tile holding a soft out-of-focus mesh gradient (blue and teal at the top, violet in the middle, magenta at
// the bottom, all muted) that drifts slowly, with a small white sparkle-and-picture glyph dead centre. No spinner, no
// percentage, no 'Generating' text: the tile alone is the pending state, for about 8 s. Then the finished photo is simply
// there in the same footprint (a hard swap between two frames, in place, no layout move) and an action row (share, redo, more) sits under
// it; the composer below reads 'Describe the image you want to generate.' with a 'Create Image' chip.
// Adapted to ten images: the assistant turn holds a 2-column grid of ten of those gradient-and-sparkle tiles, each drifting on
// its own phase; they resolve in place, one at a time in order, so by lastLand the grid is ten photos. The sparkle is a plain
// four-point star of our own (not the platform's picture-and-sparkle mark or logo), the face is the system UI stack.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-qw';
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5C12.9 8 16 11.1 22.5 12 16 12.9 12.9 16 12 22.5 11.1 16 8 12.9 1.5 12 8 11.1 11.1 8 12 1.5Z"/></svg>';
const TILE = 68, GAP = 5;   // a tile's side and the gap, px: two columns, five rows
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 12px 16px 12px; border-radius: 16px; background: #232225; color: #e9e9ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-hd { display: flex; align-items: center; gap: 8px; height: 22px; font-size: 13px; line-height: 18px; color: #f1f1f3; white-space: nowrap; }
.${P}-hd i { flex: none; display: block; width: 16px; height: 16px; border-radius: 5px; background: #6e63d9; }
.${P}-hd em { font-style: normal; font-size: 11.5px; color: #9a99a1; }
.${P}-me { display: flex; justify-content: flex-end; margin-top: 8px; }
.${P}-me span { display: block; padding: 6px 13px; border-radius: 14px; background: #2f2e33; font-size: 12.5px; line-height: 18px; color: #e9e9ec; }
.${P}-g { display: grid; grid-template-columns: repeat(2, ${TILE}px); gap: ${GAP}px; margin-top: 10px; }
.${P}-t { position: relative; width: ${TILE}px; height: ${TILE}px; border-radius: 10px; overflow: hidden; background: #2f2e33; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-mesh { position: absolute; inset: 0; }
.${P}-sp { position: absolute; left: 50%; top: 50%; width: 15px; height: 15px; margin: -7.5px 0 0 -7.5px; }
.${P}-sp svg { display: block; width: 100%; height: 100%; fill: #fff; }
.${P}-act { display: flex; align-items: center; gap: 14px; height: 20px; margin-top: 8px; }
.${P}-act i { display: block; width: 12px; height: 12px; border-radius: 4px; box-shadow: inset 0 0 0 1.5px #8d8c94; }
.${P}-cp { display: flex; align-items: center; gap: 10px; height: 40px; margin-top: 10px; padding: 0 8px 0 12px; box-sizing: border-box; border-radius: 14px; background: #2f2e33; font-size: 12.5px; color: #8b8a92; }
.${P}-cp b { flex: 1; min-width: 0; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-chip { flex: none; padding: 0 9px; height: 22px; border-radius: 11px; font-size: 11.5px; line-height: 22px; color: #a99ff0; background: rgba(169, 159, 240, .12); }
.${P}-go { flex: none; display: block; width: 24px; height: 24px; border-radius: 50%; background: #d8d7dc; }
`;

const FADE = 0.001;   // a hard cut: the 1080p recording shows the photo replacing the gradient between two frames
// the mesh: soft blobs that drift on slow sines over a deep indigo base; every tile has its own phase. The colours are the
// ones probed from the 1080p recording's pending tile across frames p_027..p_051: indigo #3B3568, periwinkle #5D5F91, slate
// teal #3B556B, plum #614673 and a grey lavender #5F5C78
const BASE = '#3b3568';
const BLOBS = [
  { c: [93, 95, 145], x: 0.62, y: 0.4, r: 0.7, sx: 0.31, sy: 0.23 },    // periwinkle
  { c: [59, 85, 107], x: 0.3, y: 0.78, r: 0.62, sx: 0.27, sy: 0.35 },   // slate teal
  { c: [97, 67, 115], x: 0.4, y: 0.2, r: 0.6, sx: 0.37, sy: 0.29 },     // plum
  { c: [95, 92, 120], x: 0.5, y: 0.52, r: 0.55, sx: 0.25, sy: 0.33 },   // grey lavender
];

export default {
  id: 'qwen',
  label: 'Qwen Chat',
  source: {
    platform: 'Qwen Chat (chat.qwen.ai web chat), dark theme, image generation in the thread',
    feature: 'A drifting violet, blue and pink mesh-gradient tile with a centred white sparkle in the assistant turn, which is replaced in place by the finished image (adapted to 10: a 2-column grid of ten such tiles resolving in order)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=Obdqabap6Zw', retrieved: '2026-10-14' },
      { url: 'https://chat.qwen.ai', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'qwen');
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><i></i><span>Qwen Chat</span><em>Qwen3.6-Plus</em></div><div class="${P}-me"><span>Create ten Muse memes</span></div><div class="${P}-g">${tiles.map((g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-mesh"></div><i class="${P}-sp">${STAR}</i></div>`).join('')}</div><div class="${P}-act"><i></i><i></i><i></i></div><div class="${P}-cp"><span class="${P}-chip">Create Image</span><b>Describe the image you want to generate.</b><i class="${P}-go"></i></div></div>`);
    const act = root.querySelector(`.${P}-act`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      im: n.querySelector('img'), mesh: n.querySelector(`.${P}-mesh`), sp: n.querySelector(`.${P}-sp`), g: tiles[i],
      state: '', ph: [0, 1, 2, 3].map((k) => hash(i * 4 + k, 7) * 6.283),
    }));
    ctx.gate(cells.map((c) => c.im));

    const gradient = (c, t) => BLOBS.map((b, k) => {
      const px = (b.x + 0.16 * Math.sin(t * b.sx * 6.283 / 3 + c.ph[k])) * 100;
      const py = (b.y + 0.14 * Math.cos(t * b.sy * 6.283 / 3 + c.ph[(k + 1) % 4])) * 100;
      return `radial-gradient(circle at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgba(${b.c.join(',')}, 1) 0%, rgba(${b.c.join(',')}, 0) ${(b.r * 100).toFixed(0)}%)`;
    }).join(', ');

    return {
      root,
      render(t) {
        const end = ctx.lastLand;
        cells.forEach((c, i) => {
          const done = ctx.seq(i)[1];   // the photo is whole at the end of tile i's window
          const f = seg(t, done - FADE, done);
          const st = f >= 1 ? 'img' : f > 0 ? 'mix' : 'mesh';
          // the image rests in its crop's own CSS
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          c.im.style.opacity = st === 'mix' ? f.toFixed(3) : st === 'img' ? '' : '0';
          if (st !== c.state) {
            c.mesh.style.display = st === 'img' ? 'none' : '';
            c.sp.style.display = st === 'img' ? 'none' : '';
            c.state = st;
          }
          if (st !== 'img') {
            // the mesh drifts with t (every pending tile is gone by lastLand, so the clamp only guards a late seek)
            c.mesh.style.backgroundColor = BASE;
            c.mesh.style.backgroundImage = gradient(c, Math.min(t, end));
            c.sp.style.opacity = (1 - f).toFixed(3);
          }
        });
        // the action row (share, redo, more) shows once the last photo is in
        act.style.visibility = t >= end ? '' : 'hidden';
      },
    };
  },
};
