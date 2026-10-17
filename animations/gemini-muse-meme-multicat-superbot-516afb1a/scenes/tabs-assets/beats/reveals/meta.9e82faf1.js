// Meta AI's create / Imagine grid as it renders in the current web app (observed in the 2026-02-10 desktop walkthrough,
// .tmp/clone-9e82faf1/reveal-refs/meta/m1/, 60 fps): a WHITE page where every job is pre-laid in its final 2x2 grid of
// 16:9 flat light-grey (#EEF2F1) rounded tiles with a ~9 px gap, the prompt as plain text beside it, and under the feed the
// resting composer ('Describe your image…', '+', chips Create / Image / 16:9 / Aesthetics, a mic, a blue round send).
// NOTHING moves while it generates: no spinner, shimmer, percentage, timer or status text (per-frame difference over the
// whole wait never passed 2/255). Completion swaps EVERY tile of a job to its sharp image in one frame, then the tiles
// settle for about 0.1 s. A real job is four images, so ten images are three pre-laid jobs (4 + 4 + 2) stacked in the feed,
// each swapping all its tiles at once in turn, the images landing in order.
// The composer glyphs are plain shapes of our own and the face is the system UI stack: nothing of Meta's is drawn or shipped.
import { lerp, seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mt';
const CHEV = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const MIC = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="1.5" width="5" height="8" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3 8c0 2.8 2.2 5 5 5s5-2.2 5-5M8 13v2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
const UP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3.5M3.8 7.5 8 3.3l4.2 4.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 12px 14px 12px; border-radius: 14px; background: #fff; color: #1c1e21; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-day { height: 20px; margin-bottom: 8px; font-size: 12.5px; line-height: 20px; font-weight: 500; color: #1c1e21; }
.${P}-job { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(2, 126px); gap: 9px; }
.${P}-t { position: relative; width: 126px; height: 71px; border-radius: 10px; overflow: hidden; background: #eef2f1; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: #eef2f1; }
.${P}-pr { min-width: 0; padding-top: 1px; font-size: 12px; line-height: 17px; color: #5b6168; }
.${P}-cp { margin-top: 4px; padding: 10px 12px 8px; box-sizing: border-box; border-radius: 18px; background: #f4f6f6; box-shadow: 0 0 0 1px #e8ecec; }
.${P}-in { height: 22px; font-size: 13px; line-height: 22px; color: #6b7178; }
.${P}-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.${P}-pl { flex: none; display: block; position: relative; width: 22px; height: 22px; }
.${P}-pl::before, .${P}-pl::after { content: ''; position: absolute; left: 50%; top: 50%; background: #3a3f45; border-radius: 1px; transform: translate(-50%, -50%); }
.${P}-pl::before { width: 11px; height: 1.5px; }
.${P}-pl::after { width: 1.5px; height: 11px; }
.${P}-chip { flex: none; display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 6px; font-size: 12px; color: #1c1e21; }
.${P}-chip svg { display: block; width: 9px; height: 9px; color: #6b7178; }
.${P}-chip i { display: block; width: 11px; height: 11px; border-radius: 3px; box-shadow: inset 0 0 0 1.4px #3a3f45; }
.${P}-sp { flex: 1; }
.${P}-mic { flex: none; display: block; width: 16px; height: 16px; color: #3a3f45; }
.${P}-mic svg { display: block; width: 100%; height: 100%; }
.${P}-go { flex: none; display: block; width: 26px; height: 26px; margin-left: 4px; border-radius: 50%; background: #0d63e2; }
.${P}-go svg { display: block; width: 100%; height: 100%; }
`;

const JOBS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]];   // a job is up to four images
const SETTLE = 0.1;                                   // the short settle after a job's swap, in s
const SETTLE_FROM = 0.82;                             // the image's visibility at the swap, rising to 1 over SETTLE

export default {
  id: 'meta',
  label: 'Meta AI',
  source: {
    platform: 'Meta AI web (meta.ai), create / Imagine grid, light theme',
    feature: 'Create grid: pre-laid flat grey 16:9 tiles with no spinner or text, every tile of a job swapping to its image in one frame (adapted to 10 as three jobs, 4 + 4 + 2)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=ddF3XM1IbEo', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=YrgA65OSfBo', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const tile = (i) => `<div class="${P}-t"><img src="${ownSrc(ctx.src, 'meta')}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${tiles[i].origin}"/><i class="${P}-cv"></i></div>`;
    const job = (ids) => `<div class="${P}-job"><div class="${P}-g">${ids.map(tile).join('')}</div><div class="${P}-pr">a Muse meme, ten variations</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-day">Today</div>${JOBS.map(job).join('')}<div class="${P}-cp"><div class="${P}-in">Describe your image…</div><div class="${P}-row"><i class="${P}-pl"></i><span class="${P}-chip">Create</span><span class="${P}-chip"><i></i>Image${CHEV}</span><span class="${P}-chip">16:9${CHEV}</span><span class="${P}-chip">Aesthetics${CHEV}</span><span class="${P}-sp"></span><i class="${P}-mic">${MIC}</i><i class="${P}-go">${UP}</i></div></div></div>`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), g: tiles[i], on: null, op: null }));
    ctx.gate(cells.map((c) => c.im));

    return {
      root,
      render(t) {
        JOBS.forEach((ids) => {
          // every tile of a job swaps in the same frame, when the job's last image is due; the tiles are flat grey until then
          const B = ctx.seq(ids[ids.length - 1])[1];
          const on = t >= B;
          // the ~0.1 s settle: a grey cover over the new image eases away (the image itself never carries an opacity)
          const op = on && t < B + SETTLE ? lerp(1 - SETTLE_FROM, 0, outCubic(seg(t, B, B + SETTLE))).toFixed(3) : '';
          ids.forEach((i) => {
            const c = cells[i];
            if (on !== c.on) {
              c.im.style.visibility = on ? '' : 'hidden';
              c.on = on;
            }
            if (op !== c.op) { c.cv.style.opacity = op; c.cv.style.display = op === '' ? 'none' : ''; c.op = op; }
            // the image rests in its crop's own CSS
            c.im.style.filter = restFilter(c.g);
            c.im.style.transform = restTransform(c.g);
          });
        });
      },
    };
  },
};
