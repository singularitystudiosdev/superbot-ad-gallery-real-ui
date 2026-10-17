// DreamStudio, the 2023 web app (RETIRED 2026-08-02: dreamstudio.ai now redirects to brandstudio.com, so this records the last
// consumer UI the footage shows). Spec .tmp/clone-9e82faf1/reveal-refs/dreamstudio/spec.json, confidence 0.66; Bilibili
// BV1bX4y167U1 2023-04-19 at 62.83-63.7 s, frames reveal-refs/dreamstudio/frames/g2_* and the sheets. A dark app: a settings column
// at the left (tabs, model, prompt, aspect picker, a purple gradient 'Dream' button) and a large result canvas at the right.
// After Dream is pressed the canvas shows an empty near-black #171717 tile at the target aspect with a continuously shifting
// multi-colour 1-2 px gradient border (magenta/red, orange, green, blue) and a centred #727272 hollow-ring spinner; no text, no
// percentage, no bar. Then the image replaces it, essentially as a hard cut (a faint dark frame first), and the border is gone.
// Adapted to ten images: a 5 x 2 grid of such square tiles (the aspect picker rests on the square) all pending together under
// the prompt caption, then popping to their images one after another in order. The settings are plain controls and the face is
// the system UI stack: none of DreamStudio's wordmark, logo or fonts is drawn or shipped.
import { seg, lerp, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dz';
const H = 244, LEFT = 168, BORDER = 1.5, RING = 18;   // px
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${H}px; border-radius: 10px; background: #151417; color: #c9c9ce; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-top { position: absolute; left: 0; right: 0; top: 0; height: 24px; display: flex; align-items: center; gap: 8px; padding: 0 10px; background: #222124; }
.${P}-top i { display: block; width: 14px; height: 14px; border-radius: 4px; background: #5b5a63; }
.${P}-top b { display: block; height: 5px; width: 44px; border-radius: 3px; background: #3a3940; }
.${P}-top u { display: block; margin-left: auto; width: 26px; height: 12px; border-radius: 6px; background: #3a3940; }
.${P}-top s { display: block; width: 14px; height: 14px; border-radius: 50%; background: #5b5a63; }
.${P}-L { position: absolute; left: 0; top: 24px; bottom: 0; width: ${LEFT}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; padding: 10px; background: #242426; }
.${P}-tabs { display: flex; gap: 6px; font-size: 9px; line-height: 18px; }
.${P}-tabs span { padding: 0 9px; border-radius: 5px; background: #34333a; color: #e4e4e8; }
.${P}-tabs span + span { background: none; color: #77777e; }
.${P}-lb { font-size: 8.5px; line-height: 11px; color: #85858c; }
.${P}-sel { box-sizing: border-box; height: 22px; margin-top: 3px; padding: 0 8px; border-radius: 5px; background: #1b1b1e; font-size: 9px; line-height: 22px; color: #d5d5da; white-space: nowrap; overflow: hidden; }
.${P}-pr { box-sizing: border-box; height: 54px; margin-top: 3px; padding: 6px 8px; border-radius: 5px; background: #1b1b1e; font-size: 8.5px; line-height: 12px; color: #b9b9c0; overflow: hidden; }
.${P}-ar { display: flex; gap: 5px; margin-top: 3px; }
.${P}-ar i { flex: none; width: 22px; height: 16px; border-radius: 4px; background: #1b1b1e; box-shadow: inset 0 0 0 1px #34333a; }
.${P}-ar i:nth-child(3) { width: 16px; background: #34333a; box-shadow: inset 0 0 0 1px #6e5ad8; }
.${P}-dream { margin-top: auto; height: 28px; display: grid; place-items: center; border-radius: 7px; background: linear-gradient(90deg, #5b3be0, #8d47ec); color: #fff; font-size: 11px; font-weight: 700; }
.${P}-R { position: absolute; left: ${LEFT}px; right: 0; top: 24px; bottom: 0; box-sizing: border-box; padding: 10px; }
.${P}-cap { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 16px; margin-bottom: 8px; font-size: 8.5px; line-height: 16px; color: #9d9da4; white-space: nowrap; }
.${P}-cap span { overflow: hidden; text-overflow: ellipsis; }
.${P}-cap i { flex: none; width: 11px; height: 11px; box-sizing: border-box; border-radius: 50%; border: 1.5px solid #6c6c73; }
.${P}-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; visibility: hidden; }
.${P}-in { position: absolute; inset: ${BORDER}px; border-radius: 2px; overflow: hidden; background: #171717; }
.${P}-in img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-sp { position: absolute; left: 50%; top: 50%; width: ${RING}px; height: ${RING}px; margin: -${RING / 2}px 0 0 -${RING / 2}px; box-sizing: border-box; border-radius: 50%; border: 2px solid #727272; border-right-color: rgba(114, 114, 114, .25); }
`;

const PROMPT = 'a legendary meme, studio lighting, high detail';
// the beat in layout seconds from the card's entrance, stretched to the real cardIn .. lastLand window
const REF = 1.84;
const PRESS = [0.04, 0.14];       // the Dream button is pressed
const PEND0 = 0.14, PEND_GAP = 0.01;   // tile i shows its gradient-bordered empty tile from here
const POP_LEN = 0.12, POP0 = 0.55;     // tile i pops in at POP0 + i * step; the last pop ends at REF
const BORDER_S = 1.8, SPIN_S = 1.1;    // seconds per turn of the border gradient and of the spinner
const GRAD = '#cc5c56, #d99a49, #77a992, #6488c2, #9b3c69, #cc5c56';
const gradAt = (deg) => `conic-gradient(from ${deg}deg, ${GRAD})`;

export default {
  id: 'dreamstudio',
  label: 'DreamStudio (2023, retired)',
  source: {
    platform: 'DreamStudio web app (2023, Stable Diffusion v2.1, dark theme), retired 2026-08-02',
    feature: "Result canvas after 'Dream': empty #171717 tiles at the target aspect with an animated multi-colour gradient border and a centred hollow-ring spinner, then the images pop in (adapted to a 5x2 grid of such tiles popping in order)",
    retired: true,
    refs: [
      { url: 'https://www.bilibili.com/video/BV1bX4y167U1', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'dreamstudio');
    const tile = (g, i) => `<div class="${P}-t"><div class="${P}-in"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><i class="${P}-sp"></i></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><i></i><b></b><u></u><s></s></div><div class="${P}-L"><div class="${P}-tabs"><span>Generate</span><span>Edit</span></div><div><div class="${P}-lb">Model</div><div class="${P}-sel">Stable Diffusion v2.1</div></div><div><div class="${P}-lb">Prompt</div><div class="${P}-pr">${x.esc(PROMPT)}</div></div><div><div class="${P}-lb">Aspect ratio</div><div class="${P}-ar"><i></i><i></i><i></i></div></div><div class="${P}-dream">Dream</div></div><div class="${P}-R"><div class="${P}-cap"><span>${x.esc(PROMPT)}</span><i></i></div><div class="${P}-grid">${tiles.map(tile).join('')}</div></div></div>`);
    const dream = root.querySelector(`.${P}-dream`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      el: n, inn: n.querySelector(`.${P}-in`), im: n.querySelector('img'), sp: n.querySelector(`.${P}-sp`), g: tiles[i], vis: null, state: '', bg: '', rot: '',
    }));
    ctx.gate(cells.map((c) => c.im));

    return {
      root,
      render(t) {
        const L = ctx.lastLand - ctx.cardIn, k = L / REF;
        const s = (t - ctx.cardIn) / k;

        // the Dream button dips on the press
        const pp = seg(s, ...PRESS);
        dream.style.transform = pp > 0 && pp < 1 ? `scale(${(1 - 0.05 * Math.sin(Math.PI * pp)).toFixed(4)})` : 'none';
        dream.style.filter = pp > 0 && pp < 1 ? `brightness(${(1 + 0.18 * Math.sin(Math.PI * pp)).toFixed(3)})` : 'none';

        const step = (REF - POP_LEN - POP0) / (cells.length - 1);
        cells.forEach((c, i) => {
          const pend = PEND0 + i * PEND_GAP, land = POP0 + i * step;
          const state = s < pend ? 'hidden' : s < land ? 'pending' : s < land + POP_LEN ? 'pop' : 'done';
          if (state === 'pending') {
            // the empty tile: the gradient border shifts round it, the ring turns
            const bg = gradAt(Math.floor((((t - ctx.cardIn) / BORDER_S) % 1) * 360));
            if (c.bg !== bg) { c.el.style.background = bg; c.bg = bg; }
            const rot = `rotate(${((((t - ctx.cardIn) / SPIN_S) % 1) * 360).toFixed(1)}deg)`;
            if (c.rot !== rot) { c.sp.style.transform = rot; c.rot = rot; }
          }
          if (c.state !== state || state === 'pop') {
            if (c.state !== state) {
              c.state = state;
              if (c.vis !== (state !== 'hidden')) { c.el.style.visibility = state === 'hidden' ? 'hidden' : 'visible'; c.vis = state !== 'hidden'; }
              c.im.style.display = state === 'pop' || state === 'done' ? 'block' : 'none';
              c.sp.style.display = state === 'pending' || state === 'hidden' ? '' : 'none';
              // the finished image carries no border: the gradient goes and the image fills the tile
              c.el.style.background = state === 'pop' || state === 'done' ? 'none' : c.bg;
              c.inn.style.inset = state === 'pop' || state === 'done' ? '0' : '';
              c.inn.style.borderRadius = state === 'pop' || state === 'done' ? '0' : '';
              c.im.style.transform = restTransform(c.g);
              if (state === 'done') { c.inn.style.transform = 'none'; c.im.style.filter = restFilter(c.g); c.im.style.opacity = ''; }
              if (state !== 'pending') { c.bg = ''; c.rot = ''; c.sp.style.transform = ''; }
            }
            if (state === 'pop') {
              // a faint dark frame first, then the image pops to full brightness at its size
              const p = seg(s, land, land + POP_LEN), e = outCubic(p);
              c.inn.style.transform = `scale(${lerp(0.9, 1, e).toFixed(4)})`;
              c.im.style.filter = `${c.g.grade ? `${c.g.grade} ` : ''}brightness(${lerp(0.3, 1, e).toFixed(3)})`;
            }
          }
        });
      },
    };
  },
};
