// Play beat, chapter VII · RENDER, the finale's first half: Claude Opus 5.5 streams the done line, its two tool chips
// land (rendering, then opening the player), and the film's player window grows in on a brief render: the frame
// counter runs to 4,093 (the post's clip is 136.433s at 30fps, frames 0 to 4092) while the chapter tag climbs I to
// XVII on the film's real chapter cuts (img/prometheus/chapters.json). The render resolves on the pass clock, then
// the window plays img/prometheus/clip-window.mp4 (the PROMETHEUS title over the flame, STOLE FIRE., WE NEVER GAVE IT
// BACK.: 5.433s, 163 frames, 960x540, 30fps) whole. The chat scene ends the moment that clip does, and scenes/clip.js
// picks this very window up (it measures .play-win on the tabs scene's last frame) and grows it to full frame on
// img/prometheus/clip-montage.mp4, which opens on the source frame right after this clip's last one: one continuous
// picture and one continuous soundtrack.
// The clip is a real <video>, so its clock follows t: want = t - T.v0. A frozen frame (?t= adds body.freeze) or any t
// outside the play window pauses it and seeks to the middle of the frame t asks for; inside the window it plays and
// only re-seeks once it has drifted past a quarter second. No Date and no rAF state: every moving value in this
// module is written from t, so a frozen frame always renders the same pixels.
// Sound: the <video> stays muted (autoplay policy); it carries data-cue-* (file, start in chat seconds, file offset,
// length), and timeline.js lifts every such tag into window.__AUDIO_CUES__ so the MP4 render can lay the clip's own
// audio under the picture in sync.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Rendered. PROMETHEUS II, seventeen chapters in one cut. Press play.';
const CHIPS = [['Rendering prometheus-ii.mp4', 'Rendered in 41s'], ['Opening the player', 'Playing']];
// the render chip resolves to the pass clock the HUD froze on at this very moment (chat.js hands it in as x.pass:
// the clock starts on the first send and stops at T.chipDone[0]), so the chat and the HUD read the same time
const TITLE = 'prometheus-ii.mp4';
const POSTER = 'prometheus/poster.jpg';       // the clip's first frame
const CLIP = 'prometheus/clip-window.mp4';
const CUE_FILE = 'img/prometheus/clip-window.mp4'; // the same file, from the ad's root (the MP4 render reads its audio)
// the post and its line, quoted verbatim (sic: civiization)
const CREDIT = { who: '@IterIntellectus', said: 'holy shit i asked claude to make a video on western civiization' };
const FPS = 30;
const CLIP_FRAMES = 163;
const CLIP_DUR = CLIP_FRAMES / FPS;                  // 5.4333s
const CLIP_LAST = (CLIP_FRAMES - 0.5) / FPS;        // the middle of the last frame: a parked seek never lands past it
const SEED_TOL = 0.012; // a frozen or out-of-window frame only moves currentTime when it is off by more than this
                        // (under one 30fps frame, 0.0333s, so a renderer stepping 1/30 re-seeks every frame)
const DRIFT_TOL = 0.25; // live playback only re-seeks once the element has drifted further than this
// the chat scene runs TAIL past T.end (chat.js CHAT_END +0.2, tabs.js dur +0.4), so T.end = T.v0 + CLIP_DUR - TAIL
// puts the scene's end, and the clip scene's start, exactly on this clip's end. The clip keeps playing through the
// first LIVE_TAIL of that tail and then parks on its last frame, so the frame clip.js hands off from is a still,
// seekable frame.
const TAIL = 0.6;
const LIVE_TAIL = 0.5;
// the render: the source's frame count, and the frame each tagged chapter opens on (chapters.json start_frame; the
// untagged prologue renders as part of I, the untagged finale from frame 3788 as part of XVII)
const FRAMES = 4093;
const CHAPTERS = [
  [0, 'I', 'HELLAS'], [655, 'II', 'ROMA'], [1048, 'III', 'TENEBRAE'], [1179, 'IV', 'CATHEDRALIS'],
  [1404, 'V', 'RINASCITA'], [1741, 'VI', 'MARE INCOGNITVM'], [1966, 'VII', 'MVSICA'], [2120, 'VIII', 'LVX'],
  [2275, 'IX', 'VAPOR'], [2429, 'X', 'VITA'], [2583, 'XI', 'LIBERTAS'], [2635, 'XII', 'MAGNA OPERA'],
  [2686, 'XIII', 'ATOMVS'], [2738, 'XIV', 'T-MINUS'], [2834, 'XV', 'COSMOS'], [3122, 'XVI', 'SILICON'],
  [3458, 'XVII', 'KARDASHEV'],
];
const chapterAt = (f) => { let c = CHAPTERS[0]; for (const k of CHAPTERS) if (f >= k[0]) c = k; return c; };
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// a parked seek aims at the middle of the frame s falls in, never a frame boundary (a boundary can show either side);
// s a hair under a boundary (timeline.js keeps 4 decimals) counts as on it
const frameMid = (s) => clamp((Math.floor(s * FPS + 0.01) + 0.5) / FPS, 0.5 / FPS, CLIP_LAST);

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.62];
    T.w0 = r + 0.8;                    // the window grows in on the render
    T.render = [T.w0 + 0.2, r + 2.1];  // the frame counter runs 0 to 4,093
    // the render overlay has cleared: the clip starts here, on the 30fps grid (the tabs scene opens the ad at 0, so the
    // chat scene then ends, and the clip scene starts, on a frame boundary too: a render stepping 1/30 lands every
    // frame of both clips exactly, down to the montage's last)
    T.v0 = Math.ceil((r + 2.4) * FPS - 1e-6) / FPS;
    T.chipDone = [T.render[1], T.v0];
    T.end = T.v0 + CLIP_DUR - TAIL;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const SAYS = (k.opts && k.opts.say) || SAY; // a variant can give the finale its own line
    const labels = CHIPS.map((c) => c.slice());
    if (x.pass) labels[0][1] = `Rendered in ${x.pass.clock(T.chipDone[0] - x.pass.t0)}`;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAYS)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="play-win">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><b class="play-title">${x.esc(TITLE)}</b></div>
      <div class="play-screen"><video class="play-vid" muted playsinline preload="auto" poster="${x.img(POSTER)}" src="${x.img(CLIP)}"
        data-cue-file="${CUE_FILE}" data-cue-at="${T.v0.toFixed(4)}" data-cue-from="0" data-cue-dur="${CLIP_DUR.toFixed(4)}"></video>
        <div class="play-rend">
          <span class="play-rend-tag">Rendering chapter <b>I</b> of XVII</span>
          <span class="play-rend-n"><b>0</b><span>/ ${commas(FRAMES)}</span></span>
          <span class="play-rend-track"><i></i><u></u></span>
          <span class="play-rend-name">HELLAS</span>
        </div>
      </div>
      <div class="play-foot"><span class="play-src">${x.esc(CREDIT.who)}</span><span class="play-q">“${x.esc(CREDIT.said)}”</span></div>
    </div>`);
    const vid = card.querySelector('.play-vid');
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    const rend = card.querySelector('.play-rend');
    const rNum = rend.querySelector('.play-rend-tag b');
    const rCount = rend.querySelector('.play-rend-n b');
    const rFill = rend.querySelector('.play-rend-track i');
    const rHead = rend.querySelector('.play-rend-track u');
    const rName = rend.querySelector('.play-rend-name');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    let shown = -1, shownF = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows, card],
      // the last two marks put the window in view as it lands and then settle it once it has finished growing
      marks: [[T.r, say], [T.chipIn[0], rows[0]], [T.chipIn[1], rows[1]], [T.w0, card], [T.w0 + 0.55, card]],
      render(t) {
        const n = streamCount(SAYS, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAYS.slice(0, n); hid.textContent = SAYS.slice(n); shown = n; }

        // the two tool chips: land, spin, then resolve to what they did
        chipEls.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? labels[i][1] : labels[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the window grows in, then the camera keeps pushing in on it for as long as it holds
        const ci = outCubic(seg(t, T.w0, T.w0 + 0.55));
        const push = lerp(1, 1.03, seg(t, T.w0, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 22).toFixed(2)}px) scale(${(lerp(0.94, 1, ci) * push).toFixed(4)})`;

        // the render: frames count up, the chapter tag follows the film's own cuts, the gold track fills; it holds
        // complete for a beat after the chip resolves, then clears off the poster (the clip's first frame)
        const f = Math.round(FRAMES * seg(t, T.render[0], T.render[1]));
        if (f !== shownF) {
          const c = chapterAt(f);
          rNum.textContent = c[1];
          rName.textContent = c[2];
          rCount.textContent = commas(f);
          const pct = (100 * f / FRAMES).toFixed(3) + '%';
          rFill.style.width = pct;
          rHead.style.left = pct;
          shownF = f;
        }
        rend.style.opacity = (1 - seg(t, T.chipDone[0] + 0.08, T.v0)).toFixed(3);

        // the clip follows t: it plays inside the window, and every other time it is parked on the frame t asks for
        const s = t - T.v0;
        const live = t >= T.v0 && t < T.end + LIVE_TAIL && !document.body.classList.contains('freeze');
        if (live) {
          if (vid.paused) {
            const p = vid.play();
            if (p && p.catch) p.catch((e) => console.error('play.js: video.play() rejected', e));
          }
          if (Math.abs(vid.currentTime - s) > DRIFT_TOL) vid.currentTime = clamp(s, 0, CLIP_LAST);
        } else {
          const want = frameMid(s);
          if (!vid.paused) vid.pause();
          if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
        }
      },
    };
  },
};
