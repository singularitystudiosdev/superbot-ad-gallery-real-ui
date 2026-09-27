// Play beat, the finale: superbot streams the done line, its two tool chips land and resolve (rendering, then
// playing), the escape-velocity.mp4 window grows in, the film starts rolling in it, and the picture then opens out to
// fill the whole frame and plays the film to its last frame WITH its sound: img/esc/film.mp4, 23.33s of @anabology's
// "18 MONTHS TO ESCAPE" film (source 167.333s to 190.667s: FEEL THE AGI, ESCAPE VELOCITY..., IT'S SO OVER?, WE'RE SO
// BACK!, the highway split-flap boards, the 11.2 KM/S eye), 1280x720 h264 + AAC; see img/esc/CREDITS.txt.
//
// Full frame: the <video> lives in its own layer (.play-full) in the scene root (.ask-root), outside the scaled hub, so
// it can grow past the thread. Its box is laid over the window's screen every frame (after the thread has scrolled,
// chat.js calls inst.after) and eases out to the whole root between T.full0 and T.full1.
//
// The clip's clock follows t: want = clamp(t - T.c0, 0, CLIP_END). Held (a ?t= frame adds body.freeze, window.__AD.seek
// pauses the clock, or the clock has simply stopped), or any t outside the window: the video is paused and seeked to
// exactly want. Live inside the window: it plays and re-seeks only once it has drifted past DRIFT_TOL. So export/QA
// frames are seek-exact and never depend on audio or on wall time.
// Sound: the film tries to play unmuted; a browser that refuses (autoplay policy, no user gesture yet) falls back to
// muted, and the first pointer/key/touch on the page, or a {type: 'unmute'} message from the gallery, unmutes it.
import { clamp, lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Rendered it. 18 Months to Escape, 23s, 1080p.';
const CHIPS = [['Rendering escape-velocity.mp4', 'Rendered in 41s'], ['Opening escape-velocity.mp4', 'Playing']];
const TITLE = 'escape-velocity.mp4';
const POSTER = 'esc/film-poster.jpg';  // the clip's first frame
const CLIP = 'esc/film.mp4';
const CLIP_LEN = 23.33;   // 560 frames at 24fps
const CLIP_END = 23.29;   // inside the last frame: a seek never lands past the end
const SEED_TOL = 0.002;   // a held frame re-seeks whenever it is off at all (only skips re-writing the same value)
const DRIFT_TOL = 0.25;   // live playback only re-seeks once the element has drifted further than this

// Is the scene clock held? window.__AD.seek (export/QA) pauses the timeline without body.freeze, so the beat marks every
// seek and holds until t moves away from where the seek left it (the clock was resumed). Ported from the pdoom-mv ad.
const HOLD = { on: false, fresh: false, t: NaN };
const mainEl = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
function hookSeek() {
  const ad = window.__AD;
  if (!ad || ad.__playHold) return !!ad;
  const wrap = (f) => (typeof f === 'function' ? function (...a) { HOLD.on = true; HOLD.fresh = true; return f.apply(this, a); } : f);
  let raw = ad.seek, wrapped = wrap(raw);
  Object.defineProperty(ad, 'seek', { configurable: true, enumerable: true, get: () => wrapped, set: (f) => { raw = f; wrapped = wrap(f); } });
  Object.defineProperty(ad, '__playHold', { value: true });
  return true;
}

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.78];
    T.chipDone = [r + 0.62, r + 1.28];
    T.v0 = r + 1.3;             // the window grows in (0.55s)
    T.c0 = T.v0 + 0.3;          // the film starts rolling in the window
    T.full0 = T.v0 + 0.8;       // ...and opens out to the whole frame
    T.full1 = T.full0 + 0.8;
    // the beat ends 0.7s before the film does: chat.js adds 0.3s (CHAT_END) and tabs.js 0.4s (its dur), so the scene
    // ends on the film's last frame (the 11.2 KM/S eye) and the whole 23.3s plays
    T.end = T.c0 + CLIP_LEN - 0.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="play-win">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><b class="play-title">${x.esc(TITLE)}</b></div>
      <div class="play-screen"></div>
    </div>`);
    const screen = card.querySelector('.play-screen');
    // the film's own layer, mounted into the scene root on the first render (the card is not in the DOM yet here). It is
    // parsed in this document, not through x.el's <template>: a <video> born in a template's inert document keeps the
    // load it attempted there, which Chrome rejects ("Media load rejected by URL safety check"), and never plays.
    const full = mainEl(`<div class="play-full"><video class="play-vid" playsinline preload="auto" poster="${x.img(POSTER)}" src="${x.img(CLIP)}"></video></div>`);
    const vid = full.querySelector('.play-vid');

    // sound: try unmuted; a refusal falls back to muted until the page gets a gesture or the gallery says unmute
    let wantSound = true, playing = false;
    const setMuted = (m) => { vid.muted = m; vid.defaultMuted = m; };
    setMuted(false);
    const start = () => {
      const p = vid.play();
      if (p && p.catch) p.catch((e) => {
        if (e && e.name === 'NotAllowedError' && !vid.muted) { setMuted(true); vid.play().catch(() => {}); }
        else if (!(e && e.name === 'AbortError')) console.error('play.js: video.play() rejected', e);
      });
    };
    const unmute = () => {
      if (!wantSound || !vid.muted) return;
      setMuted(false);
      if (playing && vid.paused) start();
    };
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, unmute, { passive: true });
    window.addEventListener('message', (e) => { if (e.data && e.data.type === 'unmute') unmute(); });
    window.addEventListener('message', (e) => { if (e.data && e.data.type === 'mute') { wantSound = false; setMuted(true); } });

    hookSeek();
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    let shown = -1, lastBox = '', composer = null;
    const clk = { t: NaN, at: 0 };
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, ...rows, card],
      // the last two marks put the card in view as it lands and then settle it once it has finished growing
      marks: [[T.r, say], [T.chipIn[0], rows[0]], [T.chipIn[1], rows[1]], [T.v0, card], [T.v0 + 0.55, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the two tool chips: land, spin, then resolve to what they did
        chipEls.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][1] : CHIPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the window grows in
        const ci = outCubic(seg(t, T.v0, T.v0 + 0.55));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 22).toFixed(2)}px) scale(${lerp(0.94, 1, ci).toFixed(4)})`;

        // the film follows t: it plays inside the window only while the clock is really running, and every other time it
        // is parked on exactly the frame t asks for
        const now = performance.now();
        if (t !== clk.t) { clk.t = t; clk.at = now; }
        if (!window.__AD || !window.__AD.__playHold) hookSeek();
        if (HOLD.on) {
          if (HOLD.fresh) { HOLD.t = t; HOLD.fresh = false; } else if (Math.abs(t - HOLD.t) > 0.02) HOLD.on = false;
        }
        const running = !document.body.classList.contains('freeze') && !HOLD.on && now - clk.at < 150;
        const want = clamp(t - T.c0, 0, CLIP_END);
        const live = running && t >= T.c0 && t - T.c0 < CLIP_END;
        if (live) {
          playing = true;
          if (vid.paused) start();
          if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
        } else {
          playing = false;
          if (!vid.paused) vid.pause();
          if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
        }
      },
      // after the thread has scrolled this frame (chat.js renderChat): lay the film's layer over the window's screen,
      // then ease it out to the whole frame
      after(t) {
        if (!full.isConnected) {
          const root = card.closest('.ask-root');
          if (!root) return;
          root.appendChild(full);
        }
        const root = full.parentNode;
        const ci = outCubic(seg(t, T.v0, T.v0 + 0.55));
        const on = t >= T.v0;
        const o = on ? ci.toFixed(3) : '0';
        if (full.style.opacity !== o) full.style.opacity = o;
        if (!on) return;
        const b = x.box(screen);
        const W = root.offsetWidth, H = root.offsetHeight;
        const e = inOutCubic(seg(t, T.full0, T.full1));
        const r = [lerp(b.x, 0, e), lerp(b.y, 0, e), lerp(b.w, W, e), lerp(b.h, H, e)].map((v) => v.toFixed(2));
        // while the window still sits in the thread, the layer is cut where the thread is (at the composer's top edge),
        // so a window rising out of the composer never paints over it; the cut lets go as the picture opens out
        const comp = composer || (composer = card.closest('.hub') && card.closest('.hub').querySelector('.composer'));
        const cut = comp ? Math.max(0, +r[1] + +r[3] - x.box(comp).y) * (1 - e) : 0;
        const key = r.join(',') + '|' + cut.toFixed(2);
        if (key === lastBox) return;
        lastBox = key;
        full.style.left = r[0] + 'px';
        full.style.top = r[1] + 'px';
        full.style.width = r[2] + 'px';
        full.style.height = r[3] + 'px';
        full.style.clipPath = cut > 0 ? `inset(0px 0px ${cut.toFixed(2)}px 0px)` : 'none';
        full.classList.toggle('is-full', e >= 1);
      },
    };
  },
};
