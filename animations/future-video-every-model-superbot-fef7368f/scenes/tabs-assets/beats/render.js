// Render beat, the opener of variant 1: Veo 3 renders the film's first shot. Its line streams, the "Rendering shot 01"
// tool chip lands and stays, and the shot card rises in behind it: the shot's header, the one-line prompt it was given,
// and a large 16:9 preview of the film's title frame that resolves out of the dark. The frame comes up through a grid
// of 8x4 blocks, each clearing on its own diagonal delay with a little per-frame noise so it reads as rendering rather
// than a wipe, a blurred copy of the frame lifts as the blocks clear, film grain dies down, and a thin light band rides
// the diagonal frontier across the shot. A frame counter counts 0 to 192 and a progress bar fills along the bottom of
// the preview; when the last block clears the counter reads 192 / 192, a green check and "Done" pill stamp the top
// right of the preview, the chip turns to "Shot 01 rendered", and the frame keeps a slow t-driven ken-burns push so
// the finished shot reads as moving footage.
// Pure function of t: every moving value is written from t in render, so ?t= freezes any frame. No Date, no rAF, no
// CSS transitions or animations. The chip row reuses the shared .dd-chiprow / .ch-tool markup from chat.css, exactly
// as shots.js does, and the .qc-ok check is chat.css's green check.
import { clamp, lerp, seg, outCubic, outBack, streamCount, rand } from '../../../lib.js';

const SAY = 'Rendering your first shot: the steep part of the curve.';
const PROMPT = '"neon synthwave city at night, a glowing curve rising past 2026, slow push in"';
const POSTER = 'future/poster.jpg';    // the film's title frame, the model's first render
const FRAMES = 192;                    // an 8s shot at 24fps, the counter the overlay reports
const FPS = 24;                        // the render UI's own frame clock: the grain jitter steps on this beat
const COLS = 8, ROWS = 4;              // the block grid the frame resolves through
const BDUR = 0.55;                     // seconds one block takes to clear
const CHIP = ['Rendering shot 01', 'Shot 01 rendered'];
const VID = '<svg class="render-vid" viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="12.5" height="13" rx="2.6"/>'
  + '<path d="M15 10.4l5.5-2.9v9l-5.5-2.9z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;      // the "Rendering shot 01" chip lands
    T.card = r + 0.30;      // the shot card rises in
    T.gen = T.card + 0.22;  // the first blocks start clearing
    T.end = r + 3.6;        // this variant lingers on the first shot
    T.shot = T.end - 0.9;   // the whole frame has resolved and the shot lands
    T.chipDone = T.shot + 0.06; // the chip turns to "Shot 01 rendered"
    return T;
  },
  build(k, x) {
    const T = k.T;
    const RDUR = T.shot - T.gen;                 // the shot's whole render window
    const span = Math.max(0.2, RDUR - BDUR);     // the delay range the blocks start across, so the last clears at T.shot
    // one entry per grid cell, row-major, with the diagonal delay the render UI clears it on
    const blocks = [];
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
      const diag = (col / (COLS - 1) + row / (ROWS - 1)) / 2;
      blocks.push({ diag, a: T.gen + diag * span, seed: row * COLS + col });
    }

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow render-genrow"><span class="ch-tool render-gen">${x.tile(k.app)}<span class="ch-tool-t">Rendering shot 01</span></span></div>`);
    const genT = gen.querySelector('.ch-tool-t');
    const card = x.el(`<div class="render-card">
      <div class="render-hd"><i class="render-ic">${VID}</i><b>Shot 01 · The steep part</b><span class="render-hd-m">8s · 1080p · 24fps</span></div>
      <div class="render-pr">${x.esc(PROMPT)}</div>
      <div class="render-vp">
        <img class="render-img" src="${x.img(POSTER)}" alt="Shot 01 of The Steep Part"/>
        <img class="render-veil" src="${x.img(POSTER)}" alt="" aria-hidden="true"/>
        <span class="render-blks">${blocks.map(() => '<i class="render-blk"></i>').join('')}</span>
        <i class="render-grain" aria-hidden="true"></i>
        <i class="render-band" aria-hidden="true"></i>
        <span class="render-obar"><span class="render-fr">frame 0 / ${FRAMES}</span>
          <span class="render-track"><i class="render-bar"></i></span></span>
        <span class="render-done">${x.OK}<span class="render-done-l">Done</span></span>
      </div>
    </div>`);

    const img = card.querySelector('.render-img');
    const veil = card.querySelector('.render-veil');
    const blkEls = [...card.querySelectorAll('.render-blk')];
    const grain = card.querySelector('.render-grain');
    const band = card.querySelector('.render-band');
    const frEl = card.querySelector('.render-fr');
    const track = card.querySelector('.render-track');
    const bar = card.querySelector('.render-bar');
    const done = card.querySelector('.render-done');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, chipLab = '', lastFr = '';

    return {
      nodes: [say, gen, card],
      marks: [[T.r, say], [T.chip, gen], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Rendering shot 01" chip: lands with the ask and stays, its label turning to the rendered line as the
        // last block clears
        const li = outCubic(seg(t, T.chip, T.chip + 0.3));
        gen.style.opacity = li.toFixed(3);
        gen.style.transform = `translateY(${((1 - li) * 6).toFixed(2)}px)`;
        const lab = t >= T.chipDone ? CHIP[1] : CHIP[0];
        if (lab !== chipLab) { chipLab = lab; genT.textContent = lab; }

        // the shot card rises in as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        const p = seg(t, T.gen, T.shot);   // the render's own progress
        const q = outCubic(p);
        const landed = t >= T.shot;

        // ken burns: a slow push that keeps travelling to the end of the beat, so a rendered shot reads as moving
        // footage. Both copies of the frame carry it so the blurred one stays registered under the sharp one.
        const push = seg(t, T.gen, T.end);
        const kb = `translate(${lerp(-7, 7, push).toFixed(2)}px, ${lerp(4, -4, push).toFixed(2)}px) scale(${lerp(1.05, 1.15, push).toFixed(4)})`;
        img.style.transform = kb;
        veil.style.transform = kb;

        // where the frontier sits at t: the diagonal at which a block is half cleared. The blurred copy of the frame,
        // the light band and the clearing blocks all ride this one line, so the shot has a single clean render edge.
        const frt = clamp((t - T.gen - BDUR / 2) / span, -0.4, 1.4);

        // the blurred copy of the frame: its mask slides with the frontier, so past the edge the shot is already
        // sharp, and it only fades out entirely as the last block clears
        veil.style.filter = `brightness(${lerp(0.55, 0.95, q).toFixed(3)}) saturate(${lerp(0.5, 0.95, q).toFixed(3)}) blur(${lerp(11, 3, q).toFixed(2)}px)`;
        veil.style.opacity = (0.96 * (1 - seg(q, 0.86, 1))).toFixed(3);
        const mpos = `${(frt * 100).toFixed(2)}% ${(frt * 100).toFixed(2)}%`;
        veil.style.setProperty('-webkit-mask-position', mpos);
        veil.style.setProperty('mask-position', mpos);

        // the blocks clear along the diagonal, each with its own per-frame noise so the frame reads as resolving
        // rather than wiping; a cleared block is fully out of the way
        const f = Math.floor(t * FPS);
        for (let i = 0; i < blkEls.length; i++) {
          const b = blocks[i];
          const e = outCubic(seg(t, b.a, b.a + BDUR));
          if (e >= 1) { blkEls[i].style.opacity = '0'; continue; }
          const noise = 0.86 + 0.14 * rand(b.seed * 5.3 + f);
          blkEls[i].style.opacity = (noise * (1 - e)).toFixed(3);
        }

        // film grain: strongest while the frame is thin, gone once it is resolved
        grain.style.opacity = ((1 - q) * 0.5).toFixed(3);

        // the light band riding the frontier, on the same diagonal the blocks clear on
        const d = lerp(-0.14, 1.14, frt);
        band.style.transform = `translate(${((d - 0.5) * 100).toFixed(2)}%, ${((d - 0.5) * 100).toFixed(2)}%)`;
        band.style.opacity = (seg(frt, -0.3, -0.05) * (1 - seg(frt, 1.05, 1.3))).toFixed(3);

        // the frame counter counts up and the bar fills; the instant the shot lands the counter reads the full count
        // and the bar goes green
        const fr = Math.round(clamp(p) * FRAMES);
        const ft = `frame ${fr} / ${FRAMES}`;
        if (ft !== lastFr) { frEl.textContent = ft; lastFr = ft; }
        bar.style.width = (q * 100).toFixed(1) + '%';
        track.classList.toggle('render-on', landed);

        // the done pill stamps the top right of the preview as the shot lands
        const fo = outBack(seg(t, T.shot, T.shot + 0.34));
        done.style.opacity = seg(t, T.shot, T.shot + 0.2).toFixed(3);
        done.style.transform = fo <= 0 ? 'scale(0.3)' : `scale(${fo.toFixed(4)})`;
      },
    };
  },
};