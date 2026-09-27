// Hailuo beat, the third step of the chain: MiniMax Hailuo 02 animates two of Midjourney's plates into the film's
// motion shots. The card is the real Hailuo video composer: the two reference stills, the prompt they are animated
// with, the generate button, a job progress row, then the two finished portrait clips playing side by side (the walk
// away through the grid room, the 360 spin in the server-hall tunnel). Every clip is a real <video>, so its clock
// follows t the way play.js does: want = clamp(t - T.clip0, 0, dur - 0.06); inside the window it plays and only
// re-seeks once it has drifted past a quarter second, everywhere else (a frozen ?t= frame) it is paused and parked on
// the frame t asks for. No Date, no rAF state, no CSS animation or transition of our own: every moving value here is
// written from t, so a frozen frame always renders the same pixels.
//
// SOURCES AND LICENSES for the media this beat plays (nothing here is hand-drawn):
//   img/esc/motion/walk.mp4 (2.75s, 640x876) + walk.jpg  the grid-room walk-away from @anabology's "18 MONTHS TO
//   img/esc/motion/spin.mp4 (2.96s, 640x740) + spin.jpg  ESCAPE" film (x.com/anabology/status/2103534482930491441),
//                                    muted h264; the tunnel 360 spin from the same film. See img/esc/CREDITS.txt.
//   img/esc/plates/plate-1.jpg, plate-2.jpg   the reference stills: the same two settings as the clips.
//   brand/minimax-logo.svg           the official MiniMax waveform mark from simple-icons (CC0 1.0), recoloured
//                                    white for the dark chip tile; see brand/CREDITS.txt.
// No API key for MiniMax/Hailuo exists on this machine, so the clips are cut from the real film instead of generated.
import { clamp, lerp, seg, outCubic, outBack, streamCount, press } from '../../../lib.js';

const PROMPT = 'She walks away through the white grid room; then a slow 360 spin in the backlit server tunnel, handheld';
const REFS = ['esc/plates/plate-1.jpg', 'esc/plates/plate-2.jpg'];  // the stills the generation was conditioned on
const TITLE = 'MiniMax Hailuo 02';
const CHIPS = ['Hailuo 02', '1080p', '6s', 'image to video'];
const SEED_TOL = 0.05;   // a frozen frame only moves currentTime when it is off by more than this
const DRIFT_TOL = 0.25;  // live playback only re-seeks once the element has drifted further than this
const CLIPS = [
  { src: 'esc/motion/walk.mp4', poster: 'esc/motion/walk.jpg', cap: 'grid room, walk away', dur: 2.75 },
  { src: 'esc/motion/spin.mp4', poster: 'esc/motion/spin.jpg', cap: 'server tunnel, 360 spin', dur: 2.96 },
];
const STATUS = ['Uploading 2 references', 'Generating motion', 'Rendering 2 clips', '2 clips ready'];

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.08;                        // the composer lands
    T.type = r + 0.4;                         // the prompt starts typing
    T.press = r + 2.2;                        // the generate button goes down
    T.gen = r + 2.34;                         // the job starts
    T.prog1 = r + 3.4;                        // the job finishes
    T.grid = r + 3.46;                        // the two clips land
    T.clip0 = r + 3.58;                       // both start moving together, like one batch
    T.end = r + 5.3;                          // ~1.7s of the clips playing, then the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;
    const logo = x.brand('minimax-logo.svg');
    // the clips are parsed in this document, not through x.el's <template>: a <video> born in a template's inert
    // document keeps the load it attempted there, which Chrome rejects ("Media load rejected by URL safety check")
    const mainEl = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
    const clips = CLIPS.map((c) => mainEl(`<figure class="qc-hl-c">
      <video class="qc-hl-v" muted playsinline preload="auto" poster="${x.img(c.poster)}" src="${x.img(c.src)}"></video>
      <figcaption class="qc-hl-cap">${x.esc(c.cap)}</figcaption>
      <span class="qc-hl-dur">${c.dur.toFixed(1)}s</span>
    </figure>`));
    const card = x.el(`<div class="qc-hl">
      <div class="qc-hl-hd"><span class="qc-hl-mk"><img src="${logo}" alt=""/></span><b>${x.esc(TITLE)}</b><span class="qc-hl-badge">video</span></div>
      <div class="qc-hl-pa">
        <div class="qc-hl-refs">${REFS.map((f) => `<div class="qc-hl-ref"><img src="${x.img(f)}" alt=""/></div>`).join('')}<span class="qc-hl-ref-t">2 refs</span></div>
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
    const caret = card.querySelector('.qc-hl-caret');
    const pct = card.querySelector('.qc-hl-pct'), st = card.querySelector('.qc-hl-st');
    const bar = card.querySelector('.qc-hl-bar i');
    const go = card.querySelector('.qc-hl-go'), goT = card.querySelector('.qc-hl-go-t'), spin = card.querySelector('.qc-hl-spin');
    const refs = card.querySelector('.qc-hl-refs');
    let shown = -1, lastSt = -1;

    return {
      nodes: [card],
      // the composer lands, then the results grid lands under it
      marks: [[T.r, card], [T.grid, card]],
      render(t) {
        // the card rises in and the camera creeps in on it for as long as the job runs
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        const push = lerp(1, 1.02, seg(t, T.card, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 20).toFixed(2)}px) scale(${(lerp(0.96, 1, ci) * push).toFixed(4)})`;

        // the prompt types itself into the composer, its caret blinking while it lands
        const n = streamCount(PROMPT, T.type, 64, t);
        if (n !== shown) { vis.textContent = PROMPT.slice(0, n); hid.textContent = PROMPT.slice(n); shown = n; }
        const typing = t >= T.type && n < PROMPT.length;
        caret.style.opacity = typing ? (((t % 1.06) < 0.53) ? '1' : '0') : '0';

        // the reference stills are what the generation is conditioned on: they lift as the prompt lands on them
        refs.style.transform = `translateY(${((1 - outCubic(seg(t, T.type, T.type + 0.5))) * 6).toFixed(2)}px)`;

        // the generate button: down under the press, then a spinner while the job runs, then done
        const pe = outCubic(seg(t, T.gen, T.prog1));
        const busy = t >= T.gen && t < T.prog1;
        go.style.transform = `scale(${(1 - 0.06 * press(t, T.press)).toFixed(4)})`;
        go.classList.toggle('is-done', t >= T.prog1);
        const gl = t >= T.prog1 ? 'Done' : busy ? 'Generating' : 'Generate';
        if (goT.textContent !== gl) goT.textContent = gl;
        spin.style.opacity = (seg(t, T.gen, T.gen + 0.12) * (1 - seg(t, T.prog1 - 0.12, T.prog1))).toFixed(3);
        spin.style.transform = `rotate(${(((t - T.gen) * 420) % 360).toFixed(1)}deg)`;

        // the job row: the bar fills, the percent counts, the line says what the job is doing
        bar.style.width = `${(pe * 100).toFixed(1)}%`;
        const p = Math.round(pe * 100);
        if (pct.textContent !== `${p}%`) pct.textContent = `${p}%`;
        const si = t < T.gen ? 0 : pe >= 1 ? 3 : pe < 0.3 ? 0 : pe < 0.7 ? 1 : 2;
        if (si !== lastSt) { st.textContent = STATUS[si]; lastSt = si; }

        // the grid only takes layout space once the job has finished, so the card is short while it renders; then
        // every clip plays: inside its window it runs live, otherwise it is parked on frame t
        grid.style.display = t >= T.grid ? 'grid' : 'none';
        const gi = outCubic(seg(t, T.grid, T.grid + 0.42));
        grid.style.opacity = gi.toFixed(3);
        clips.forEach((f, i) => {
          const a = outBack(seg(t, T.grid + i * 0.09, T.grid + i * 0.09 + 0.4));
          f.style.opacity = clamp(a).toFixed(3);
          f.style.transform = `translateY(${((1 - clamp(a)) * 14).toFixed(2)}px)`;
          const v = vids[i], end = CLIPS[i].dur - 0.06;
          const want = clamp(t - T.clip0, 0, end);
          const live = t >= T.clip0 && t - T.clip0 < end && !document.body.classList.contains('freeze');
          if (live) {
            if (v.paused) {
              const pr = v.play();
              if (pr && pr.catch) pr.catch((e) => { if (!(e && e.name === 'AbortError')) console.error('hailuo.js: video.play() rejected', e); });
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
