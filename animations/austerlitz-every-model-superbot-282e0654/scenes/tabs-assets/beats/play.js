// Play beat, THE FILM, the finale's first half: Claude Opus 5.5 streams the done line, its two tool chips land
// (rendering, then opening the player), and the film's player window grows in on a brief render card set in the film's
// own title-card grammar (the tracked Cormorant SC caps AUSTERLITZ with its glow, the title card's hairline rule as the
// progress track, its italic EB Garamond subtitle verbatim, the bar stamps' tracked caps for the labels; img/az/theme.css)
// over the dimmed first frame. The frame counter runs to 7,232 (the film is 5:01 at 24 fps, frames 0 to 7231) and the
// chunk counter follows the repo's own renderer (render.mjs renders the film in 10 s chunks of 240 frames: 31 chunks,
// chunk = floor(frame / 240) + 1). The render resolves on the pass clock, then the window plays
// img/film/clip-window.mp4 whole (the sun of Austerlitz: the fog clearing off the Pratzen heights, the film's own
// caption "The sun of Austerlitz / about 9 a.m." bottom left from 0.75 s; 6.500s, 156 frames, 960x540, 24 fps, source
// frames 4258 to 4413) with its closed caption (img/film/subs.json, the one cue the film does not print itself). The chat
// scene ends the moment that clip does, and scenes/clip.js picks this very window up (it measures .play-win on the tabs
// scene's last frame) and grows it to full frame on img/film/clip-montage.mp4, which opens on Rapp's charge (a cut the
// film itself makes into that shot): one picture, one soundtrack.
// The clip is a real <video>, so its clock follows t: want = t - T.v0. A frozen frame (?t= adds body.freeze), a paused
// clock (timeline.js adds body.ad-paused: space, the arrows, __AD.seek) or any t outside the play window pauses it
// and seeks to the middle of the frame t asks for; inside the window it plays and only re-seeks once it has drifted
// past a quarter second. No Date and no rAF state: every moving value in this
// module is written from t, so a frozen frame always renders the same pixels.
// Sound: the <video> stays muted (autoplay policy); it carries data-cue-* (file, start in chat seconds, file offset,
// length), and timeline.js lifts every such tag into window.__AUDIO_CUES__ so the recorder (and any MP4 render) lays
// the clip's own audio under the picture in sync.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Rendered. Austerlitz, 5:01 at 24 fps, 7,232 frames. Press play.';
const CHIPS = [['Rendering austerlitz.mp4', 'Rendered in 41s'], ['Opening the player', 'Playing']];
// the render chip resolves to the pass clock the HUD froze on at this very moment (chat.js hands it in as x.pass:
// the clock starts on the first send and stops at T.chipDone[0]), so the chat and the HUD read the same time
const TITLE = 'austerlitz.mp4';               // the repo's own output name (video/austerlitz.mp4)
const POSTER = 'film/poster-window.jpg';     // the clip's first frame (source frame 4258)
const CLIP = 'film/clip-window.mp4';
const CUE_FILE = 'img/film/clip-window.mp4'; // the same file, from the ad's root (the recorder reads its audio)
// the post's author and its line, quoted verbatim as posted
const CREDIT = { who: '@WinterArc2125', said: 'All code.' };
// the film's opening title card: the title in tracked caps and its italic subtitle, verbatim
const FILM = { title: 'AUSTERLITZ', sub: '2 December 1805 · The Battle of the Three Emperors', length: '5:01' };
const FPS = 24;
const CLIP_FRAMES = 156;
const CLIP_DUR = CLIP_FRAMES / FPS;                  // 6.5s
const CLIP_LAST = (CLIP_FRAMES - 0.5) / FPS;        // the middle of the last frame: a parked seek never lands past it
const SEED_TOL = 0.012; // a frozen or out-of-window frame only moves currentTime when it is off by more than this
                        // (under one 24fps frame, 0.0417s, so a renderer stepping 1/24 re-seeks every frame)
const DRIFT_TOL = 0.25; // live playback only re-seeks once the element has drifted further than this
// the chat scene runs TAIL past T.end (chat.js CHAT_END +0.2, tabs.js dur +0.4), so T.end = T.v0 + CLIP_DUR - TAIL
// puts the scene's end, and the clip scene's start, exactly on this clip's end. The clip keeps playing through the
// first LIVE_TAIL of that tail and then parks on its last frame, so the frame clip.js hands off from is a still,
// seekable frame.
const TAIL = 0.6;
const LIVE_TAIL = 0.5;
// the render: the film's frame count (7,232 frames, 0 to 7231, at 24 fps = 301.333s, 5:01) and the repo renderer's
// chunking (render.mjs: 10 s chunks, 240 frames each, the last one short: 31 chunks)
const FRAMES = 7232;
const CHUNK = 240;
const CHUNKS = Math.ceil(FRAMES / CHUNK);           // 31
const chunkAt = (f) => Math.floor(clamp(f, 0, FRAMES - 1) / CHUNK) + 1;
// the window clip's closed caption, from img/film/subs.json ("clip-window.mp4".cues, FILE seconds, verbatim; only the
// cue the film does not print on screen itself): shown while in <= s < out, its lines set on one line in the
// letterbox bar the way the film sets its own spoken lines there
const SUBS = [
  { in: 0.313, out: 3.793, lines: ['Then the sun breaks through.', 'The fog falls away from the heights:'] },
];
const subAt = (s) => SUBS.findIndex((c) => s >= c.in && s < c.out);
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// a parked seek aims at the middle of the frame s falls in, never a frame boundary (a boundary can show either side);
// s a hair under a boundary (timeline.js keeps 4 decimals) counts as on it
const frameMid = (s) => clamp((Math.floor(s * FPS + 0.01) + 0.5) / FPS, 0.5 / FPS, CLIP_LAST);

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.62];
    T.w0 = r + 0.8;                    // the window grows in on the render
    T.render = [T.w0 + 0.2, r + 2.1];  // the frame counter runs 0 to 7,232
    // the render card has cleared: the clip starts here, on the 24fps grid (the tabs scene opens the ad at 0, so the
    // chat scene then ends, and the clip scene starts, on a frame boundary too: a render stepping 1/24 lands every
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
        <div class="play-cc" aria-live="off"></div>
        <div class="play-rend">
          <span class="play-rend-tag">Rendering <i>·</i> ${x.esc(FILM.length)} <i>·</i> ${FPS} fps</span>
          <span class="play-rend-title">${x.esc(FILM.title)}</span>
          <span class="play-rend-track"><i></i></span>
          <span class="play-rend-sub">${x.esc(FILM.sub)}</span>
          <span class="play-rend-n">Frame <b class="play-rend-f">0</b> of ${commas(FRAMES)} <i>·</i> Chunk <b class="play-rend-c">1</b> of ${CHUNKS}</span>
        </div>
      </div>
      <div class="play-foot"><span class="play-src">${x.esc(CREDIT.who)}</span><span class="play-q">“${x.esc(CREDIT.said)}”</span></div>
    </div>`);
    const vid = card.querySelector('.play-vid');
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    const cc = card.querySelector('.play-cc');
    const rend = card.querySelector('.play-rend');
    const rCount = rend.querySelector('.play-rend-f');
    const rChunk = rend.querySelector('.play-rend-c');
    const rFill = rend.querySelector('.play-rend-track i');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    let shown = -1, shownF = -1, shownSub = -2;
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

        // the render: frames count up, the chunk counter follows render.mjs's 240-frame chunks, the title card's rule
        // fills; it holds complete for a beat after the chip resolves, then clears off the poster (the clip's first frame)
        const f = Math.round(FRAMES * seg(t, T.render[0], T.render[1]));
        if (f !== shownF) {
          rCount.textContent = commas(f);
          rChunk.textContent = String(chunkAt(f));
          rFill.style.width = (100 * f / FRAMES).toFixed(3) + '%';
          shownF = f;
        }
        rend.style.opacity = (1 - seg(t, T.chipDone[0] + 0.08, T.v0)).toFixed(3);

        // the clip follows t: it plays inside the window, and every other time it is parked on the frame t asks for
        const s = t - T.v0;
        const cl = document.body.classList;
        const live = t >= T.v0 && t < T.end + LIVE_TAIL && !cl.contains('freeze') && !cl.contains('ad-paused');
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

        // the closed caption rides the clip's own clock (a parked clip reads the frame it is parked on)
        const si = s < 0 ? -1 : subAt(Math.min(s, CLIP_LAST));
        if (si !== shownSub) {
          cc.innerHTML = si < 0 ? '' : `<span>${x.esc(SUBS[si].lines.join(' '))}</span>`;
          shownSub = si;
        }
      },
    };
  },
};
