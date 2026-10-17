// Kling's web studio, Image generation tab (spec .tmp/clone-9e82faf1/reveal-refs/kling/spec.json, confidence 0.6; frames in
// reveal-refs/kling/frames/k_001..k_096 and sheet.png, YouTube kkgsXsh_WFI at 62-78s; the green progress bar is corroborated by
// a second clip, 9AXzXPrLtnc). A dark studio (#20212C) with a central panel. After submit a 2x2 block of near-black rounded
// tiles (#181C20, a faint #3E3E44 edge) appears, ALL FOUR pending together: each carries a faint diagonal sheen, a small
// ring spinner and the words 'Generating...' (legible in the frames themselves, though the spec's text pass missed them),
// while a small green bar (#3FBF6F) ticks left to right at the panel's bottom-left. Then the four finished images land in
// reading order, the spinner text and bar clear, and nothing else shows: no percentage, no timer.
// Adapted to ten images: three jobs (4 + 4 + 2), each a block of its own that appears at its turn, pending together with
// its green bar, its images landing in reading order; the jobs run in turn. The spinner is a plain gradient ring, the title is
// plain text in the system UI face: nothing of Kling's logo, wordmark or fonts is drawn or shipped.
import { clamp, seg, lerp, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-kl';
const TILE = 82, GAP = 6, BAR_W = 64;   // px: a block is 2 x 2 tiles; three blocks plus their gaps fill the 560px column
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 12px 12px 14px; border-radius: 14px; background: #20212c; color: #d9dae2; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-hd { height: 22px; font-size: 13px; line-height: 22px; font-weight: 600; letter-spacing: .01em; color: #eceef4; }
.${P}-jobs { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; }
.${P}-job { flex: none; width: ${TILE * 2 + GAP}px; visibility: hidden; }
.${P}-job.${P}-on { visibility: visible; }
.${P}-g { display: grid; grid-template-columns: repeat(2, ${TILE}px); gap: ${GAP}px; }
.${P}-t { position: relative; width: ${TILE}px; height: ${TILE}px; box-sizing: border-box; border-radius: 10px; overflow: hidden; background: #181c20; box-shadow: inset 0 0 0 1px #3e3e44; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-pd { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; background: #181c20; }
.${P}-sh { position: absolute; top: -20%; bottom: -20%; left: 0; width: 46%; background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, .045), rgba(255, 255, 255, 0)); transform: skewX(-24deg); }
.${P}-sp { position: relative; width: 20px; height: 20px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(120, 230, 190, 0) 0%, #7ee6c0 35%, #a98bff 62%, #ff9bd1 85%, rgba(255, 155, 209, 0) 100%); -webkit-mask: radial-gradient(circle, transparent 6.5px, #000 7.5px); mask: radial-gradient(circle, transparent 6.5px, #000 7.5px); }
.${P}-tx { position: relative; font-size: 9px; line-height: 12px; color: #c9cad3; white-space: nowrap; }
.${P}-bar { height: 3px; width: ${BAR_W}px; margin-top: 9px; border-radius: 2px; background: #2c2e3a; overflow: hidden; }
.${P}-bar i { display: block; height: 100%; width: 0; border-radius: 2px; background: #3fbf6f; }
`;

const JOBS = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]];   // a job is up to four images
const HOLD = 0.66;                                    // the share of a job's window its tiles stay pending before the first lands
const STEPS = 14;                                     // the green bar ticks in this many steps
const SHEEN_S = 1.5, SPIN_S = 0.9;                    // seconds per sheen sweep and per spinner turn

export default {
  id: 'kling',
  label: 'Kling',
  source: {
    platform: 'Kling AI web studio (Image generation tab), dark theme',
    feature: 'Image batch: a 2x2 block of near-black tiles pending together (faint sheen, ring spinner, Generating..., a small green progress bar ticking bottom-left), then the four images land in reading order (adapted to 10 as three jobs, 4 + 4 + 2, in turn)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=kkgsXsh_WFI', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=9AXzXPrLtnc', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'kling');
    const tile = (i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${tiles[i].origin}"/><div class="${P}-pd"><i class="${P}-sh"></i><i class="${P}-sp"></i><span class="${P}-tx">Generating...</span></div></div>`;
    const job = (ids) => `<div class="${P}-job"><div class="${P}-g">${ids.map(tile).join('')}</div><div class="${P}-bar"><i></i></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-hd">Kling</div><div class="${P}-jobs">${JOBS.map(job).join('')}</div></div>`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      im: n.querySelector('img'), pd: n.querySelector(`.${P}-pd`), sh: n.querySelector(`.${P}-sh`), sp: n.querySelector(`.${P}-sp`), g: tiles[i], img: false, pend: true, moving: false,
    }));
    const jobs = [...root.querySelectorAll(`.${P}-job`)].map((n) => ({ el: n, fill: n.querySelector(`.${P}-bar i`), bar: n.querySelector(`.${P}-bar`), on: false, barOn: true, w: -1 }));
    ctx.gate(cells.map((c) => c.im));

    return {
      root,
      render(t) {
        JOBS.forEach((ids, j) => {
          const A = ctx.seq(ids[0])[0], B = ctx.seq(ids[ids.length - 1])[1], D = B - A;
          const hold = A + HOLD * D;            // every tile of the job is pending together until here
          const jb = jobs[j];
          const on = t >= A;
          if (jb.on !== on) { jb.el.classList.toggle(`${P}-on`, on); jb.on = on; }
          // the green bar ticks left to right while the job is pending, then clears with the first landing
          const barOn = on && t < hold;
          if (jb.barOn !== barOn) { jb.bar.style.visibility = barOn ? '' : 'hidden'; jb.barOn = barOn; }
          const w = barOn ? (Math.floor(clamp(seg(t, A, hold)) * STEPS) + 1) / (STEPS + 1) : 0;
          if (jb.w !== w) { jb.fill.style.width = `${(w * 100).toFixed(2)}%`; jb.w = w; }
          ids.forEach((i, k) => {
            const c = cells[i];
            // the images land in reading order across the last stretch of the job's window
            const land = lerp(hold, B, k / ids.length) + 0.0001;
            const landed = t >= land;
            if (c.img !== landed) { c.im.style.display = landed ? 'block' : 'none'; c.img = landed; }
            if (c.pend === landed) { c.pd.style.display = landed ? 'none' : ''; c.pend = !landed; }
            if (landed) {
              // a short fade in over the last stretch of the window; at rest the tile carries only its crop
              const p = seg(t, land, land + Math.min(0.14, 0.08 * D));
              c.im.style.opacity = p >= 1 ? '1' : outCubic(p).toFixed(3);
              c.im.style.filter = restFilter(c.g);
              c.im.style.transform = restTransform(c.g);
              if (c.moving) { c.sh.style.left = ''; c.sp.style.transform = ''; c.moving = false; }
            } else if (on) {
              // pending: a faint diagonal sheen sweeps the tile, the ring turns
              const s = ((t - A) / SHEEN_S) % 1;
              c.sh.style.left = `${(lerp(-60, 125, s)).toFixed(2)}%`;
              c.sp.style.transform = `rotate(${(((t - A) / SPIN_S) % 1 * 360).toFixed(1)}deg)`;
              c.moving = true;
            }
          });
        });
      },
    };
  },
};
