// Hailuo beat, the fourth step of ?v=4: MiniMax Hailuo 02 animates the Dark Souls casts it was handed.
// The card is the real Hailuo video composer: a reference still, the prompt it is animated with, the generate
// button, a job progress row, then the four finished clips playing in a 2x2 grid. Every clip is a real <video>,
// so its clock follows t the way play.js does: want = clamp(t - T.clip0, 0, DUR - 0.06); inside the window it
// plays and only re-seeks once it has drifted past a quarter second, everywhere else (a frozen ?t= frame) it is
// paused and parked on the frame t asks for. No Date, no rAF state, no CSS animation or transition of our own:
// every moving value here is written from t, so a frozen frame always renders the same pixels.
//
// SOURCES AND LICENSES for the media this beat plays (nothing here is hand-drawn):
//   img/v4/hailuo/clip-1.mp4 (2.6s)  crop of the official Dark Souls: Remastered launch trailer, 118.6s: a knight
//                                    steps out to the boss in the sunlit courtyard. Trailer (c) FromSoftware /
//                                    Bandai Namco Entertainment, "Dark Souls: Remastered - Launch Trailer | PS4",
//                                    https://www.youtube.com/watch?v=Woe0PYZPxRw, pulled with yt-dlp
//                                    --download-sections, cropped, no audio, h264 mp4.
//   img/v4/hailuo/clip-2.mp4 (2.6s)  same trailer, 84.2s: the knight and the wolf at the gravestone.
//   img/v4/hailuo/clip-3.mp4 (2.6s)  same trailer, 88.6s: the burning boss.
//   img/v4/hailuo/clip-4.mp4 (2.6s)  the ad's own footage, img/ds/ds-clip.mp4 (video by @The_Alex,
//                                    https://x.com/The_Alex/status/2102440678282412195, see img/CREDITS.txt),
//                                    0.6s: the remake's knight advancing through the castle.
//   img/v4/hailuo/poster-*.jpg       first frame of each clip, used as the video poster.
//   brand/minimax-logo.svg           the official MiniMax waveform mark from simple-icons (CC0 1.0),
//                                    https://cdn.jsdelivr.net/npm/simple-icons/icons/minimax.svg, recoloured
//                                    white for the dark chip tile; see brand/CREDITS.txt.
// The reference still in the composer is the ad's own art: img/ds/art-2.jpg (the Gatewarden, same @The_Alex
// source as above). No API key for MiniMax/Hailuo, fal.ai or Replicate exists on this machine, so the clips are
// cut from real Dark Souls footage instead of generated; see img/v4/hailuo/CREDITS.txt.
import { clamp, lerp, seg, outCubic, outBack, streamCount, press } from '../../../lib.js';

const PROMPT = 'Gatewarden steps through the fog gate, greatsword raised, slow push-in';
const REF = 'ds/art-2.jpg';           // the still the generation was conditioned on
const TITLE = 'MiniMax Hailuo 02';
const CHIPS = ['Hailuo 02', '1080p', '6s', '16:9'];
const DUR = 2.6;         // every clip is 2.6s long
const SEED_TOL = 0.05;   // a frozen frame only moves currentTime when it is off by more than this
const DRIFT_TOL = 0.25;  // live playback only re-seeks once the element has drifted further than this
const CLIPS = [
  { src: 'v4/hailuo/clip-1.mp4', poster: 'v4/hailuo/poster-1.jpg', cap: 'the knight steps out to the boss' },
  { src: 'v4/hailuo/clip-2.mp4', poster: 'v4/hailuo/poster-2.jpg', cap: 'the knight at the great gravestone' },
  { src: 'v4/hailuo/clip-3.mp4', poster: 'v4/hailuo/poster-3.jpg', cap: 'the boss burns in the kiln' },
  { src: 'v4/hailuo/clip-4.mp4', poster: 'v4/hailuo/poster-4.jpg', cap: 'the knight walks the outer ward' },
];
const STATUS = ['Uploading reference', 'Generating motion', 'Rendering 4 clips', '4 clips ready'];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.08;                        // the composer lands
    T.type = r + 0.4;                         // the prompt starts typing
    T.press = r + 1.86;                       // the generate button goes down
    T.gen = r + 2.0;                          // the job starts
    T.prog1 = r + 3.15;                       // the job finishes
    T.grid = r + 3.22;                        // the four clips land
    T.clip0 = r + 3.34;                       // all four start moving together, like one batch
    T.end = r + 6.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const logo = x.brand('minimax-logo.svg');
    const clips = CLIPS.map((c) => x.el(`<figure class="qc-hl-c">
      <video class="qc-hl-v" muted playsinline preload="auto" poster="${x.img(c.poster)}" src="${x.img(c.src)}"></video>
      <figcaption class="qc-hl-cap">${x.esc(c.cap)}</figcaption>
      <span class="qc-hl-dur">2.6s</span>
    </figure>`));
    const card = x.el(`<div class="qc-hl">
      <div class="qc-hl-hd"><span class="qc-hl-mk"><img src="${logo}" alt=""/></span><b>${x.esc(TITLE)}</b><span class="qc-hl-badge">video</span></div>
      <div class="qc-hl-pa">
        <div class="qc-hl-ref"><img src="${x.img(REF)}" alt=""/><span class="qc-hl-ref-t">reference</span></div>
        <div class="qc-hl-pm">
          <div class="qc-hl-pt"><span class="qc-hl-vis"></span><i class="qc-hl-caret"></i><span class="qc-hl-hid"></span></div>
          <div class="qc-hl-chips">${CHIPS.map((c) => `<span class="qc-hl-chip">${x.esc(c)}</span>`).join('')}</div>
          <button class="qc-hl-go" type="button"><span class="qc-hl-spin"></span><span class="qc-hl-go-t">Generate</span></button>
        </div>
      </div>
      <div class="qc-hl-pg">
        <span class="qc-hl-bar"><i></i></span><span class="qc-hl-pct">0%</span><span class="qc-hl-st">${x.esc(STATUS[0])}</span>
      </div>
      <div class="qc-hl-grid"></div>
    </div>`);
    const vids = clips.map((f) => f.querySelector('.qc-hl-v'));
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vids.forEach((v) => { v.muted = true; v.defaultMuted = true; });
    const grid = card.querySelector('.qc-hl-grid');
    clips.forEach((f) => grid.appendChild(f));
    const vis = card.querySelector('.qc-hl-vis'), hid = card.querySelector('.qc-hl-hid');
    const pct = card.querySelector('.qc-hl-pct'), st = card.querySelector('.qc-hl-st');
    const bar = card.querySelector('.qc-hl-bar i');
    const go = card.querySelector('.qc-hl-go'), goT = card.querySelector('.qc-hl-go-t'), spin = card.querySelector('.qc-hl-spin');
    const ref = card.querySelector('.qc-hl-ref');
    let shown = -1, lastSt = -1;

    return {
      nodes: [card],
      // the composer lands, then the results grid lands under it
      marks: [[T.r, card], [T.grid, card]],
      render(t) {
        // the card rises in and the camera creeps in on it for as long as the job runs
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        const push = lerp(1, 1.025, seg(t, T.card, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 20).toFixed(2)}px) scale(${(lerp(0.96, 1, ci) * push).toFixed(4)})`;

        // the prompt types itself into the composer, its caret blinking while it lands
        const n = streamCount(PROMPT, T.type, 56, t);
        if (n !== shown) { vis.textContent = PROMPT.slice(0, n); hid.textContent = PROMPT.slice(n); shown = n; }
        const typing = t >= T.type && n < PROMPT.length;
        card.querySelector('.qc-hl-caret').style.opacity = typing ? (((t % 1.06) < 0.53) ? '1' : '0') : '0';

        // the reference still is what the generation is conditioned on: it lifts as the prompt lands on it
        ref.style.transform = `translateY(${((1 - outCubic(seg(t, T.type, T.type + 0.5))) * 6).toFixed(2)}px)`;

        // the generate button: down under the press, then a spinner while the job runs, then done
        const pe = outCubic(seg(t, T.gen, T.prog1));
        const busy = t >= T.gen && t < T.prog1;
        go.style.transform = `scale(${(1 - 0.06 * press(t, T.press)).toFixed(4)})`;
        go.classList.toggle('is-done', t >= T.prog1);
        goT.textContent = t >= T.prog1 ? 'Done' : busy ? 'Generating' : 'Generate';
        spin.style.opacity = (seg(t, T.gen, T.gen + 0.12) * (1 - seg(t, T.prog1 - 0.12, T.prog1))).toFixed(3);
        spin.style.transform = `rotate(${(((t - T.gen) * 420) % 360).toFixed(1)}deg)`;

        // the job row: the bar fills, the percent counts, the line says what the job is doing
        bar.style.width = `${(pe * 100).toFixed(1)}%`;
        const p = Math.round(pe * 100);
        if (pct.textContent !== `${p}%`) pct.textContent = `${p}%`;
        const si = t < T.gen ? 0 : pe >= 1 ? 3 : pe < 0.3 ? 0 : pe < 0.7 ? 1 : 2;
        if (si !== lastSt) { st.textContent = STATUS[si]; lastSt = si; }

        // the grid lands, then every clip plays: inside its window it runs live, otherwise it is parked on frame t
        // the grid only takes layout space once the job has finished, so the card is short while it renders
        grid.style.display = t >= T.grid ? 'grid' : 'none';
        const gi = outCubic(seg(t, T.grid, T.grid + 0.42));
        grid.style.opacity = gi.toFixed(3);
        clips.forEach((f, i) => {
          const a = outBack(seg(t, T.grid + i * 0.09, T.grid + i * 0.09 + 0.4));
          f.style.opacity = clamp(a).toFixed(3);
          f.style.transform = `translateY(${((1 - clamp(a)) * 14).toFixed(2)}px)`;
          const v = vids[i];
          const want = clamp(t - T.clip0, 0, DUR - 0.06);
          const live = t >= T.clip0 && t - T.clip0 < DUR - 0.06 && !document.body.classList.contains('freeze');
          if (live) {
            if (v.paused) {
              const pr = v.play();
              if (pr && pr.catch) pr.catch((e) => console.error('hailuo.js: video.play() rejected', e));
            }
            if (Math.abs(v.currentTime - want) > DRIFT_TOL) v.currentTime = want;
          } else {
            if (!v.paused) v.pause();
            if (Math.abs(v.currentTime - want) > SEED_TOL) v.currentTime = want;
          }
        });
      },
    };
  },
};