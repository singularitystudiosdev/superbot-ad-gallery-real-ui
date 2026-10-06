// Play beat, the finale: Claude Opus 5.5 says "Press play.", the game lands in the chat as a card and starts rolling,
// then the card opens to full frame (GROW, deliberate) and the real clip plays out with its own sound: ~3 s on screen
// in all (rolls in the card CARD_HOLD 0.3 s, opens over GROW 0.4 s, full frame until c0 + ON_SCREEN), then the end card.
// The clip is img/bike/ride.mp4 (3.4 s, 1280x720 @60, one shot: the side view of the red bike in the golden paddy,
// source 177.50-180.90; see img/CREDITS.txt). The file runs 0.4 s past ON_SCREEN so the scene's 0.3 s fade to the end
// card still has picture under it.
//
// There is ONE <video>, on a layer in the scene root (outside the camera). While the card sits in the chat that layer
// is pinned over the card's picture frame; GROW interpolates it from there to the whole frame. So nothing is ever
// swapped or doubled, and the sound comes from one element.
// The clip's clock follows t: want = clamp(t - T.c0, 0, end). Held (a ?t= frame adds body.freeze, window.__AD.seek
// pauses the clock, or the clock has stopped), or any t outside the run: the video is paused and seeked to exactly
// want. Live inside the run: it plays and re-seeks only once it has drifted past DRIFT_TOL. So export/QA frames are
// seek-exact and never depend on audio or wall time.
// Sound: it tries to play with sound; where the browser refuses autoplay with sound it plays muted, and a click or tap
// anywhere on the full-frame layer toggles the sound.
import { clamp, lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Press play.';
const POSTER = 'bike/poster.jpg';
const CLIP = 'bike/ride.mp4';
const CLIP_LEN = 3.4; /* deliberate */ // ride.mp4's length
const ON_SCREEN = 3.0; /* deliberate */ // clip start to the scene's fade to the end card (the brief's ~3 s ending)
// titles cut (chat.js passes opts.titles): the ride is held full frame longer and slowed, so three title cards can
// hard-cut in under it. 3.4 s of footage at 0.52x spans ~6.5 s, matching TITLES_ON.
const TITLES_ON = 6.6; /* deliberate */
const TITLE_RATE = 0.52; /* deliberate */
const CARDS = ['ONE ASK.', 'FOUR MODELS.', 'ONE RIDE.'];
const TITLE_HOLD = 1.5, TITLE_GAP = 0.35, TITLE_FADE = 0.22; // per card, from T.full
const CLIP_END = CLIP_LEN - 0.05;     // inside the last frame: a seek never lands past the end
const CPS = 80;
const CARD_AT = 0.25;                  // "Press play." streams, then the card lands
const CARD_IN = 0.3;                   // the card rising into the thread
const CARD_HOLD = 0.3; /* deliberate */ // the card sits in the chat, playing, before it opens
const GROW = 0.4; /* deliberate */     // the card opens to full frame
const RADIUS = 10;                     // the card's corner radius (the hub's card radius), eased to 0 at full frame
const SEED_TOL = 0.002;                // a held frame re-seeks whenever it is off at all
const DRIFT_TOL = 0.2;                 // live playback only re-seeks once the element has drifted further than this
const PLAY = '<svg class="play-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

// Is the scene clock held? window.__AD.seek (export/QA) pauses the timeline without body.freeze, so the beat marks every
// seek and holds until t moves away from where the seek left it (the clock was resumed).
const HOLD = { on: false, fresh: false, t: NaN };
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
  times(r, opts = {}) {
    const T = { r, titles: !!opts.titles };
    T.card = r + CARD_AT;              // the card lands in the chat, the poster under a play glyph
    T.c0 = T.card + CARD_IN;           // ...and once it has landed the clip starts rolling in it
    T.grow = T.c0 + CARD_HOLD;         // the card starts opening
    T.full = T.grow + GROW;            // full frame
    T.end = T.c0 + (T.titles ? TITLES_ON : ON_SCREEN); // then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say play-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="play-card">
      <div class="play-shot"><img class="play-poster" src="${x.img(POSTER)}" alt="The ride, running in the browser"/></div>
      <div class="play-cap"><b>ride</b><small>index.html</small></div>
    </div>`);
    const shot = card.querySelector('.play-shot');
    // the full-frame layer: the one <video>, outside the camera, in the scene root's px
    const layer = x.el(`<div class="play-full" aria-hidden="true"><video class="play-vid" playsinline preload="auto" poster="${x.img(POSTER)}" src="${x.img(CLIP)}"></video><span class="play-btn">${PLAY}</span></div>`);
    x.root.appendChild(layer);
    const vid = layer.querySelector('video'), btn = layer.querySelector('.play-btn');
    const titles = !!(k.opts && k.opts.titles);
    let tcards = [];
    if (titles) {
      vid.playbackRate = TITLE_RATE;   // slowed, so the 3.4 s clip spans TITLES_ON
      const wrap = document.createElement('div');
      wrap.className = 'play-titles';
      tcards = CARDS.map((c) => { const d = document.createElement('div'); d.className = 'play-title'; d.textContent = c; wrap.appendChild(d); return d; });
      layer.appendChild(wrap);         // inside the full-frame layer, so the cards sit over the ride and clip with it
    }
    vid.muted = true; // the muted content attribute does not set the IDL property; start muted, unmute on the first live play
    vid.defaultMuted = true;

    let wantSound = true, playing = false;
    layer.addEventListener('click', (e) => {
      e.stopPropagation();
      wantSound = vid.muted;
      vid.muted = !wantSound;
      if (playing && vid.paused) start();
    });
    const start = () => {
      vid.muted = !wantSound;
      const p = vid.play();
      if (p && p.catch) p.catch((e) => {
        // sound refused (no user gesture yet): play muted, which is always allowed
        if (e && e.name === 'NotAllowedError' && !vid.muted) { vid.muted = true; wantSound = false; vid.play().catch(() => {}); }
        else if (!(e && e.name === 'AbortError')) console.error('play.js: video.play() rejected', e);
      });
    };

    hookSeek();
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const clk = { t: NaN };
    let clkAt = 0;
    let feed = null; // the thread's viewport (the card's clip), found once the card is mounted

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // the play glyph presses as the clip starts, then leaves the picture to the clip
        btn.style.opacity = (1 - seg(t, T.c0 + 0.1, T.c0 + 0.3)).toFixed(3);

        // the clip follows t: it plays only while the clock is really running, and is otherwise parked on exactly t
        const now = performance.now();
        if (t !== clk.t) { clk.t = t; clkAt = now; }
        if (!window.__AD || !window.__AD.__playHold) hookSeek();
        if (HOLD.on) {
          if (HOLD.fresh) { HOLD.t = t; HOLD.fresh = false; } else if (Math.abs(t - HOLD.t) > 0.02) HOLD.on = false;
        }
        const running = !document.body.classList.contains('freeze') && !HOLD.on && now - clkAt < 150;
        const rate = titles ? TITLE_RATE : 1;
        const len = Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration - 0.05 : CLIP_END;
        const clip = Math.min(CLIP_END, len);             // the clip's own length (footage seconds)
        const want = clamp((t - T.c0) * rate, 0, clip);   // slowed to `rate`, so currentTime tracks t * rate
        // live through the scene's fade to the end card too (the file runs past T.end), so the fade is not a stepped seek
        const live = running && t >= T.c0 && t < T.c0 + clip / rate;
        if (live) {
          playing = true;
          if (vid.paused) start();
          if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
        } else {
          playing = false;
          if (!vid.paused) vid.pause();
          if (vid.readyState >= 1 && Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
        }
        // the titles cut: three cards hard-cut in under the ride, in the lower third
        if (titles) {
          const start = T.full + 0.15;
          tcards.forEach((el, i) => {
            const a = start + i * (TITLE_HOLD + TITLE_GAP);
            const o = seg(t, a, a + TITLE_FADE) * (1 - seg(t, a + TITLE_HOLD, a + TITLE_HOLD + TITLE_FADE));
            el.style.opacity = o.toFixed(3);
          });
        }
      },
      // after the camera: pin the layer over the card's picture, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; layer.style.pointerEvents = 'none'; return; }
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        // the card's radius is in the hub's design px; b.w / shot.offsetWidth is the camera's scale on it
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px ${(RADIUS * s * (1 - g)).toFixed(2)}px 0 0`;
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is: the card
        // lands while the thread is still gliding up (and the camera is still pulling back from the code), so part
        // of it is below the fold for a moment and must not draw over the composer. Released as the card opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0)` : '';
        layer.style.opacity = card.style.opacity;
        layer.style.pointerEvents = g >= 1 ? 'auto' : 'none';
      },
    };
  },
};
