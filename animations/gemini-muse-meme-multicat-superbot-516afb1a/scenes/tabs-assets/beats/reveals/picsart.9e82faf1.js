// Picsart's mobile AI Image Generator, the 2022 app (spec .tmp/clone-9e82faf1/reveal-refs/picsart/spec.json, confidence 0.5; TikTok
// @picsart 7166438682646334762 at 15.0-16.6 s, frames in reveal-refs/picsart/frames/g2_* and spinner-zoom-sheet.png). A LIGHT
// results view: the prompt as a bold quoted title, a 2 x 2 grid of pale #F1ECF0 rounded tiles, each with a centred rotating
// magenta-to-purple gradient ring spinner (an open ring, about three quarters) and, under it, a bookmark outline and a greyed
// 'Remix' pill. No status string, no percentage. The tiles of a job all spin together; then each swaps to its image and its
// Remix pill lights up pink.
// Adapted to ten images: three jobs, 4 + 4 + 2, run in turn. A job is a phone-width results column (title, 2 x 2 grid, Remix row)
// and the three columns sit side by side inside the 560px chat column, each appearing at its turn with its spinners turning,
// then its images landing in reading order. The ring is drawn from render(t), never CSS animation. The ring is a plain gradient
// and the face is the system UI stack: none of Picsart's logo, wordmark or fonts is drawn or shipped.
import { seg, lerp, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ps';
const COL = 170, GAP = 8, RING = 28;   // px: a job column, the grid gap, the spinner's diameter
const CSS = `
.${P} { box-sizing: border-box; display: flex; justify-content: space-between; align-items: flex-start; width: 560px; max-width: 100%; height: 270px; padding: 12px; border-radius: 14px; background: #fff; box-shadow: inset 0 0 0 1px #ece8ec; color: #111; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-job { flex: none; width: ${COL}px; visibility: hidden; }
.${P}-job.${P}-on { visibility: visible; }
.${P}-ti { height: 30px; font-size: 10.5px; line-height: 15px; font-weight: 700; color: #111; overflow: hidden; }
.${P}-g { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: #f1ecf0; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-sp { position: absolute; left: 50%; top: 50%; width: ${RING}px; height: ${RING}px; margin: -${RING / 2}px 0 0 -${RING / 2}px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(212, 141, 212, 0) 0%, rgba(212, 141, 212, 0) 22%, #d48dd4 24%, #b750b1 52%, #9a16a4 78%, #841e82 100%); -webkit-mask: radial-gradient(circle, transparent ${RING / 2 - 4.5}px, #000 ${RING / 2 - 4}px); mask: radial-gradient(circle, transparent ${RING / 2 - 4.5}px, #000 ${RING / 2 - 4}px); }
.${P}-rw { display: flex; align-items: center; justify-content: space-between; height: 22px; margin-bottom: 2px; }
.${P}-bk { width: 11px; height: 11px; fill: none; stroke: #6d6a6d; stroke-width: 1.6; stroke-linejoin: round; }
.${P}-rx { box-sizing: border-box; height: 16px; padding: 0 10px; border-radius: 8px; background: #ebe6ea; color: #b6b1b5; font-size: 8px; line-height: 16px; font-weight: 600; }
.${P}-rx.${P}-live { background: #f9d9f1; color: #a8138f; }
`;

const JOBS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]];   // a job is up to four images
const TITLE = '"funny meme, studio lighting"';
const HOLD = 0.66;                                    // the share of a job's window its tiles spin together before the first lands
const SPIN_S = 0.7;                                   // seconds per spinner turn
const BOOKMARK = '<svg class="' + P + '-bk" viewBox="0 0 12 12"><path d="M3 1.5h6v9L6 8.2 3 10.5z"/></svg>';

export default {
  id: 'picsart',
  label: 'Picsart (app, 2022)',
  source: {
    platform: 'Picsart mobile app, AI Image Generator (2022, light theme)',
    feature: "Results view titled with the quoted prompt: a 2x2 grid of pale tiles, each with a rotating magenta-to-purple gradient ring and a greyed 'Remix' pill, then the images filling in (adapted to 10 as three phone-width jobs, 4 + 4 + 2, in turn)",
    refs: [
      { url: 'https://www.tiktok.com/@picsart/video/7166438682646334762', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'picsart');
    const tile = (i) => `<div><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${tiles[i].origin}"/><i class="${P}-sp"></i></div><div class="${P}-rw">${BOOKMARK}<span class="${P}-rx">Remix</span></div></div>`;
    const job = (ids) => `<div class="${P}-job"><div class="${P}-ti">${x.esc(TITLE)}</div><div class="${P}-g">${ids.map(tile).join('')}</div></div>`;
    const root = x.el(`<div class="${P}">${JOBS.map(job).join('')}</div>`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      im: n.querySelector('img'), sp: n.querySelector(`.${P}-sp`), rx: n.nextElementSibling.querySelector(`.${P}-rx`), g: tiles[i], img: null, rot: '',
    }));
    const jobs = [...root.querySelectorAll(`.${P}-job`)].map((n) => ({ el: n, on: null }));
    ctx.gate(cells.map((c) => c.im));

    return {
      root,
      render(t) {
        JOBS.forEach((ids, j) => {
          // a job opens at its turn (the first opens as the card enters) and runs to the landing of its last image
          const A = j === 0 ? ctx.cardIn : ctx.seq(ids[0])[0], B = ctx.seq(ids[ids.length - 1])[1], D = B - A;
          const jb = jobs[j];
          const on = t >= A;
          if (jb.on !== on) { jb.el.classList.toggle(`${P}-on`, on); jb.on = on; }
          const hold = A + HOLD * D;            // every tile of the job spins together until here
          ids.forEach((i, k) => {
            const c = cells[i];
            // the images land in reading order across the last stretch of the job's window
            const land = lerp(hold, B, k / ids.length) + 0.0001;
            const landed = t >= land;
            if (c.img !== landed) {
              c.im.style.display = landed ? 'block' : 'none';
              c.sp.style.display = landed ? 'none' : '';
              c.rx.classList.toggle(`${P}-live`, landed);
              c.img = landed;
              if (landed) { c.sp.style.transform = ''; c.rot = ''; }
            }
            if (landed) {
              // a short fade in; at rest the tile carries only its crop
              const p = seg(t, land, land + Math.min(0.1, 0.08 * D));
              c.im.style.opacity = p >= 1 ? '' : outCubic(p).toFixed(3);
              c.im.style.filter = restFilter(c.g);
              c.im.style.transform = restTransform(c.g);
            } else if (on) {
              // pending: the open ring turns, its angle read straight off t
              const rot = `rotate(${(((t - A) / SPIN_S) % 1 * 360).toFixed(1)}deg)`;
              if (c.rot !== rot) { c.sp.style.transform = rot; c.rot = rot; }
            }
          });
        });
      },
    };
  },
};
