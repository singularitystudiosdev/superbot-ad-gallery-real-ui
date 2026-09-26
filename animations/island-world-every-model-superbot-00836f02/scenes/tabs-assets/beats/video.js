// Video beat: Veo renders a flythrough preview of the island. The line streams, the render chip counts the job up in
// percent and frames, and the 16:9 preview card resolves top to bottom under a moving beam: a blurred, darkened poster
// sits underneath while the sharp frame is clipped in from the top, and the beam rides that reveal edge with a
// progress bar filling along the card's bottom. When the last frame lands the chip reads "Rendered 4s at 1080p" and
// the real <video> takes over, its clock driven from t exactly like play.js: it plays inside the preview window, and
// every other time it is a paused element parked on the frame t asks for, re-seeked only once it is off by more than
// one frame. Pure function of t (no Date, no rAF state), so ?t= freezes any frame and renders the same pixels.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Rendering a flythrough of the island.';
const POSTER = 'island/flythrough-poster.jpg';  // the clip's first frame
const CLIP = 'island/flythrough-4s.mp4';        // 4.0s of the island clip, 960w, no audio
const FRAMES = 96;      // 4.0s at 24 fps: the frame counter the chip counts up
const CLIP_END = 3.95;   // last frame of the clip (95 / 24), so a seek never lands past the end
const SEEK_TOL = 1 / 24; // one frame at 24 fps: a seek lands on a frame boundary, so a tighter tolerance re-seeks every frame

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.20;      // the render chip lands
    T.card = r + 0.42;      // the preview card rises in
    T.ren0 = r + 0.70;      // the render starts: the beam begins its pass down the card
    T.ren1 = r + 2.80;      // ... and the last frame is written here
    T.done = r + 2.86;      // the chip resolves to what it made
    T.v0 = r + 2.90;        // the clip takes over and its clock starts following t
    T.end = r + 5.60;       // 2.7s of the flythrough plays before the next cut: it is v3's opening hook
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow vid-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Rendering preview</span><b class="vid-pct">0%</b><b class="vid-fr">0/96</b></div></div>');
    const card = x.el(`<div class="vid-card">
      <div class="vid-stage">
        <div class="vid-poster" style="background-image:url('${x.img(POSTER)}')"></div>
        <div class="vid-sharp" style="background-image:url('${x.img(POSTER)}')"></div>
        <i class="vid-scan" aria-hidden="true"></i>
        <i class="vid-beam" aria-hidden="true"></i>
        <video class="vid-el" muted playsinline preload="auto" poster="${x.img(POSTER)}" src="${x.img(CLIP)}"></video>
      </div>
      <div class="vid-track"><i class="vid-fill"></i></div>
    </div>`);
    const meta = x.el('<div class="vid-meta"><span>1920x1080</span><span>24 fps</span><span>4.0s</span></div>');
    const vid = card.querySelector('.vid-el');
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    const poster = card.querySelector('.vid-poster');
    const sharp = card.querySelector('.vid-sharp');
    const scan = card.querySelector('.vid-scan');
    const beam = card.querySelector('.vid-beam');
    const fill = card.querySelector('.vid-fill');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), cpct = chipEl.querySelector('.vid-pct'), cfr = chipEl.querySelector('.vid-fr');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, shownPct = -1, shownFr = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, chip, card, meta],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.card + 0.35, meta]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const p = seg(t, T.ren0, T.ren1), e = outCubic(p);
        const done = t >= T.done;

        // the render chip: spinner and the two live counters while the job runs, then the result in place of both
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('vid-done', done);
        const cl = done ? 'Rendered 4s at 1080p' : 'Rendering preview';
        if (clab.textContent !== cl) clab.textContent = cl;
        const pct = Math.min(100, Math.floor(p * 100));
        const fr = Math.min(FRAMES, Math.floor(p * FRAMES));
        if (pct !== shownPct) { cpct.textContent = `${pct}%`; shownPct = pct; }
        if (fr !== shownFr) { cfr.textContent = `${fr}/${FRAMES}`; shownFr = fr; }

        // the card rises in, then keeps a slow push for as long as it is on screen
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        const push = lerp(1, 1.02, seg(t, T.v0, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 20).toFixed(2)}px) scale(${(lerp(0.95, 1, ci) * push).toFixed(4)})`;
        meta.style.opacity = (ci * 0.9).toFixed(3);

        // the render pass: the sharp frame is clipped in from the top, the beam rides that edge, and the blurred
        // poster stays underneath until the beam has passed the row
        const edge = (1 - e) * 100;
        sharp.style.clipPath = e >= 1 ? 'none' : `inset(0 0 ${edge.toFixed(2)}% 0)`;
        sharp.style.opacity = e > 0 ? '1' : '0';
        beam.style.top = `${(e * 100).toFixed(2)}%`;
        beam.style.opacity = p > 0 && p < 1 ? '1' : '0';
        scan.style.opacity = (1 - seg(t, T.v0, T.v0 + 0.35)).toFixed(3);
        scan.style.backgroundPositionY = `${(((t - T.ren0) * 90) % 6).toFixed(1)}px`;
        poster.style.opacity = (1 - seg(t, T.v0, T.v0 + 0.35) * 0.35).toFixed(3);
        fill.style.width = `${(e * 100).toFixed(2)}%`;
        fill.classList.toggle('vid-done', done);

        // the clip: parked on its first frame while the render runs, then its clock follows t
        const vo = seg(t, T.v0, T.v0 + 0.22);
        vid.style.opacity = vo.toFixed(3);
        const want = clamp(t - T.v0, 0, CLIP_END);
        const live = t >= T.v0 && t <= T.end && vo > 0.5 && !document.body.classList.contains('freeze');
        if (live) {
          if (vid.paused) {
            const pr = vid.play();
            if (pr && pr.catch) pr.catch((err) => console.error('video.js: video.play() rejected', err));
          }
          if (Math.abs(vid.currentTime - want) > SEEK_TOL) vid.currentTime = want;
        } else {
          if (!vid.paused) vid.pause();
          if (Math.abs(vid.currentTime - want) > SEEK_TOL) vid.currentTime = want;
        }
      },
    };
  },
};