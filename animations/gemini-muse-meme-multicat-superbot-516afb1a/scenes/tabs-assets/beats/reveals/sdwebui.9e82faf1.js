// A Stable Diffusion web UI's txt2img page (a Gradio light theme, as in the 2022 screen recording under
// .tmp/clone-9e82faf1/reveal-refs/sdwebui, spec confidence 0.82): a tab row, a left column of generation controls, and a
// right results column that holds a thick blue progress bar (a white 'n%' riding in its filled part) over ONE square output
// tile, with a gallery strip and four buttons under it. The tile stays a flat near-white placeholder until the first live
// preview at 14%; the preview then changes only in steps (the sampler hands one over every few steps), each step a hard
// swap, from a heavy smear through a silhouette to detail, until the full decode replaces it at 100% (no fade at all)
// while the bar moves continuously. Ten images: Gradio's gallery fills one image at a time, the bar starting over for each.
// Everything is drawn here from plain CSS and the system UI stack: no Gradio or Stability markup, theme or asset.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-sd';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 8px 10px 10px; border-radius: 10px; background: #f8f8f8; color: #374151; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px #e5e7eb; }
.${P}-tabs { display: flex; gap: 14px; height: 24px; border-bottom: 1px solid #e5e7eb; font-size: 11px; line-height: 22px; color: #6b7280; white-space: nowrap; }
.${P}-tabs span.on { color: #ea580c; font-weight: 600; box-shadow: 0 2px 0 #f97316; }
.${P}-body { display: grid; grid-template-columns: 216px minmax(0, 1fr); gap: 12px; margin-top: 8px; }
.${P}-ctl { display: flex; flex-direction: column; gap: 7px; }
.${P}-gen { display: grid; place-items: center; height: 30px; border-radius: 7px; background: #f97316; color: #fff; font-size: 12px; font-weight: 600; }
.${P}-sel, .${P}-sh { display: flex; align-items: center; justify-content: space-between; font-size: 10px; line-height: 14px; }
.${P}-sel b { flex: 1; margin-left: 8px; height: 20px; padding: 0 6px; border-radius: 5px; background: #fff; box-shadow: 0 0 0 1px #d1d5db; font-weight: 400; font-size: 10px; line-height: 20px; }
.${P}-sh b { min-width: 30px; height: 17px; padding: 0 5px; box-sizing: border-box; border-radius: 4px; background: #fff; box-shadow: 0 0 0 1px #d1d5db; font-weight: 400; font-size: 10px; line-height: 17px; text-align: right; font-variant-numeric: tabular-nums; }
.${P}-sl i { display: block; position: relative; height: 4px; margin: 5px 0 1px; border-radius: 2px; background: #e5e7eb; }
.${P}-sl u { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: #f97316; }
.${P}-sl u::after { content: ""; position: absolute; right: -4px; top: -3px; width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px #d1d5db; }
.${P}-note { font-size: 9px; line-height: 12px; color: #9ca3af; }
.${P}-res { min-width: 0; }
.${P}-prog { position: relative; height: 10px; border-radius: 4px; background: #b3bfca; overflow: hidden; }
.${P}-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; border-radius: 4px; background: #0160de; overflow: hidden; }
.${P}-fill b { position: absolute; right: 4px; top: 0; font-size: 8px; line-height: 10px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; white-space: nowrap; }
.${P}-tile { position: relative; aspect-ratio: 1; margin-top: 5px; background: #f0f0f0; overflow: hidden; box-shadow: 0 0 0 1px #e5e7eb; }
.${P}-tile img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-gal { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 3px; margin-top: 6px; }
.${P}-th { position: relative; aspect-ratio: 1; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.${P}-th img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-th.sel { box-shadow: 0 0 0 2px #f97316; }
.${P}-btns { display: grid; grid-template-columns: repeat(4, auto); gap: 4px; margin-top: 6px; }
.${P}-btns span { height: 20px; padding: 0 3px; border-radius: 5px; background: #eceef1; font-size: 8.5px; line-height: 20px; text-align: center; white-space: nowrap; color: #374151; }
`;

// the live preview's refreshes: [reached at fraction, blur px, saturation, brightness]. Before the first the tile is empty.
// The refresh points are uneven and each holds until the next, so the picture changes in steps while the bar runs on
const PREVIEWS = [
  [0.14, 22, 0.45, 0.55],   // a smeared black-and-pale mass
  [0.26, 17, 0.6, 0.72],    // a first soft silhouette
  [0.38, 13, 0.75, 0.86],   // limbs and ground separate
  [0.52, 10, 0.8, 0.92],
  [0.68, 7, 0.9, 0.96],     // detail resolving
  [0.84, 4, 0.95, 1],
  [0.94, 2, 1, 1],
];
const SLIDERS = [['Sampling steps', '20', 20], ['Width', '512', 50], ['Height', '512', 50], ['Batch count', '10', 100], ['Batch size', '1', 0], ['CFG Scale', '7', 30]];
const BTNS = ['Save', 'Send to img2img', 'Send to inpaint', 'Send to extras'];

export default {
  id: 'sdwebui',
  label: 'Stable Diffusion WebUI',
  source: {
    platform: 'AUTOMATIC1111 stable-diffusion-webui (Gradio web UI, txt2img tab)',
    feature: 'Live previews: blue progress bar with a percentage over one output tile that shows stepped previews until the full decode lands (adapted to a batch of 10)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=_4rY0oPbUYA', retrieved: '2026-10-14' },
      { url: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui/blob/master/modules/shared_options.py', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles, count } = ctx;
    const src = ownSrc(ctx.src, 'sdwebui');
    const tabs = ['txt2img', 'img2img', 'Extras', 'PNG Info', 'Checkpoint Merger', 'Settings'].map((n, k) => `<span${k === 0 ? ' class="on"' : ''}>${n}</span>`).join('');
    const sliders = SLIDERS.map(([n, v, w]) => `<div class="${P}-sl"><div class="${P}-sh"><span>${n}</span><b>${v}</b></div><i><u style="width:${w}%"></u></i></div>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-tabs">${tabs}</div><div class="${P}-body"><div class="${P}-ctl"><div class="${P}-gen">Generate</div><div class="${P}-sel"><span>Sampling method</span><b>Euler a</b></div>${sliders}<div class="${P}-note">Restore faces · Tiling · Hires. fix</div></div><div class="${P}-res"><div class="${P}-prog"><div class="${P}-fill"><b></b></div></div><div class="${P}-tile"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme preview"/></div><div class="${P}-gal">${tiles.map((g, i) => `<div class="${P}-th"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/></div>`).join('')}</div><div class="${P}-btns">${BTNS.map((n) => `<span>${n}</span>`).join('')}</div></div></div></div>`);
    const prog = root.querySelector(`.${P}-prog`), fill = root.querySelector(`.${P}-fill`), pct = fill.querySelector('b');
    const big = root.querySelector(`.${P}-tile img`);
    const ths = [...root.querySelectorAll(`.${P}-th`)].map((n) => ({ n, im: n.querySelector('img'), shown: false }));
    ctx.gate([big, ...ths.map((c) => c.im)]);

    let bigIdx = -1, bigOn = null, pctText = null, selected = false;
    return {
      root,
      render(t) {
        // how many images have landed (each window is the next image's whole run: the bar starts over at each)
        let landed = 0;
        while (landed < count && seg(t, ...ctx.seq(landed)) >= 1) landed++;
        const done = landed === count;
        const cur = done ? count - 1 : landed;
        const p = done ? 1 : seg(t, ...ctx.seq(cur));
        const g = tiles[cur];
        ths.forEach((c, i) => {
          const on = i < landed;
          if (c.shown !== on) { c.im.style.display = on ? 'block' : 'none'; c.shown = on; }
          c.im.style.filter = restFilter(tiles[i]);
          c.im.style.transform = restTransform(tiles[i]);
        });
        if (bigIdx !== cur) { big.style.transformOrigin = g.origin; bigIdx = cur; }
        let state = 'blank';
        if (done || p >= 1) {
          // the full decode: a hard swap, the crop's own resting CSS
          state = 'full';
          big.style.filter = restFilter(g);
        } else {
          let step = null;
          for (const s of PREVIEWS) if (p >= s[0]) step = s;
          if (step) { state = 'prev'; big.style.filter = `blur(${step[1]}px) saturate(${step[2]}) brightness(${step[3]}) ${g.grade}`.trim(); }
        }
        big.style.transform = restTransform(g);
        const on = state !== 'blank';
        if (bigOn !== on) { big.style.display = on ? 'block' : 'none'; bigOn = on; }
        // the bar: continuous, with its percentage riding in the filled part; gone (space kept) once the batch is done
        const n = done ? 100 : Math.floor(p * 100);
        fill.style.width = `${(p * 100).toFixed(2)}%`;
        const txt = n > 0 ? `${n}%` : '';
        if (txt !== pctText) { pct.textContent = txt; pctText = txt; }
        prog.style.visibility = done ? 'hidden' : '';
        if (done !== selected) { ths[count - 1].n.classList.toggle('sel', done); selected = done; }
      },
    };
  },
};
