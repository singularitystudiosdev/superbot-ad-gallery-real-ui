// M/V clip: "클로드 CLAUDE 'UPPING MY P(DOOM)' OFFICIAL M/V", posted by Donald Jewkes (@donaldjewkes),
// https://x.com/donaldjewkes/status/2102801274173587569, made with one prompt using Claude Opus 5.5 (see img/CREDITS.txt).
// Play beat, the finale and the payoff of the whole spot: Opus 5.5 streams its done line, its two tool chips land and
// resolve (rendering, then exporting), and the M/V player window grows in playing the real clip: 10 seconds of it,
// source 0:19 to 0:29 of 2:21 (img/pdoom/mv-excerpt.mp4, 1280x720, 30fps, 300 frames, with audio), shown FULL 16:9 and
// never cropped, so the P(DOOM) meter (top-left), the LIVE date stamp (top-right) and the lyric captions (bottom-left)
// all stay in frame. Under the picture a thin player bar: a speaker icon, the 2:21 progress track and the ticking time.
//
// The clip is a real <video>, so its clock follows t: want = clamp(t - T.c0, 0, CLIP_END).
// Held (a ?t= frame adds body.freeze, window.__AD.seek pauses the clock, or the clock has simply stopped), or any t
// outside the window: the video is paused and seeked to exactly want. Live inside the window: it plays and re-seeks only
// once it has drifted past DRIFT_TOL. So export/QA frames are seek-exact and never depend on audio or on wall time.
// Sound: muted by default (autoplay policy, gallery tiles); a click/tap anywhere on the window toggles it and the speaker.
//
// Layout follows the frame (window.AR, re-measured on 'archange'): the window is sized in JS so the whole thing (title
// bar, 16:9 picture, player bar) fits between the top veil and the fold, as wide as the thread allows. At 4:5 and 1:1
// that is the thread's full content width (it steps out of the reply's avatar indent) and it lands bottom-anchored on
// the fold like the source play window; at 16:9 and 4:3 the height binds first, so it grows as large as fits and centres.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Rendered it. Upping My P(doom) is out, turn it up.';
const CHIPS = [['Rendering the cut', 'Rendered 2:21'], ['Exporting M/V', 'Playing']];
const TITLE = '클로드 CLAUDE ‘UPPING MY P(DOOM)’ OFFICIAL M/V';
const POSTER = 'pdoom/mv-excerpt-poster.jpg'; // the excerpt's first frame
const CLIP = 'pdoom/mv-excerpt.mp4';
const SRC0 = 19;          // the excerpt starts 0:19 into the M/V
const SRC_LEN = 141;      // the M/V runs 2:21
const CLIP_LEN = 10;      // the excerpt is 10.0s (source 19.0s to 29.0s)
const CLIP_END = 9.97;    // inside the last frame (pts 9.9667): a seek never lands past the end
const SEED_TOL = 0.002;   // a held frame re-seeks whenever it is off at all (only skips re-writing the same value)
const DRIFT_TOL = 0.2;    // live playback only re-seeks once the element has drifted further than this
const PUSH = 1.02;        // the slow push-in while the clip runs; the fit leaves room for it

// Is the scene clock held? window.__AD.seek (export/QA) pauses the timeline without body.freeze, so the beat marks every
// seek and holds until t moves away from where the seek left it (the clock was resumed). The timeline re-renders a
// paused clock every rAF at t rounded to 1/60, so "moved" means more than a 60th and change.
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

const SPEAKER = `<svg class="play-snd" viewBox="0 0 24 24" aria-hidden="true">
  <path class="play-snd-b" d="M4 9.2h3.6L12.4 5v14l-4.8-4.2H4z"/>
  <g class="play-snd-on"><path d="M15.4 9.1a4.2 4.2 0 0 1 0 5.8"/><path d="M17.9 6.6a7.8 7.8 0 0 1 0 10.8"/></g>
  <g class="play-snd-off"><path d="M15.6 9.4l5 5.2"/><path d="M20.6 9.4l-5 5.2"/></g>
</svg>`;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.78];
    T.chipDone = [r + 0.62, r + 1.28];
    T.v0 = r + 1.3;               // the window grows in (0.55s)
    T.c0 = T.v0 + 0.25;           // the clip starts rolling once the window is mostly in
    T.end = T.c0 + CLIP_LEN + 0.05; // the WHOLE 10s excerpt plays (to 0:29) before the chat hands over to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const SAYS = (k.opts && k.opts.say) || SAY; // a variant can give the finale its own line
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAYS)}</span></div>`);
    const rows = CHIPS.map(([run]) => x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="play-win play-muted" role="button" tabindex="-1" aria-label="Toggle sound">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><b class="play-title">${x.esc(TITLE)}</b></div>
      <div class="play-screen"><video class="play-vid" muted playsinline preload="auto" poster="${x.img(POSTER)}" src="${x.img(CLIP)}"></video></div>
      <div class="play-ctl">${SPEAKER}<span class="play-track"><i class="play-fill"></i><i class="play-knob"></i></span><span class="play-time">${mmss(SRC0)} / ${mmss(SRC_LEN)}</span></div>
    </div>`);
    const vid = card.querySelector('.play-vid');
    const fill = card.querySelector('.play-fill'), knob = card.querySelector('.play-knob'), time = card.querySelector('.play-time');
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;

    // sound: a click/tap on the player flips muted and the speaker; nothing else (seek, export) ever reads it
    const setMuted = (m) => { vid.muted = m; card.classList.toggle('play-muted', m); card.setAttribute('aria-pressed', String(!m)); };
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      setMuted(!vid.muted);
      // an unmute during live playback keeps playing (the click is the user gesture that allows audio)
      if (!vid.muted && playing && vid.paused) start();
    });
    let playing = false;
    const start = () => {
      const p = vid.play();
      if (p && p.catch) p.catch((e) => {
        // unmuted autoplay refused (no user gesture yet): fall back to muted, which is always allowed
        if (e && e.name === 'NotAllowedError' && !vid.muted) { setMuted(true); vid.play().catch(() => {}); }
        else if (!(e && e.name === 'AbortError')) console.error('play.js: video.play() rejected', e);
      });
    };

    hookSeek();
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    let shown = -1, lastTime = '', geoKey = '';
    const clk = { t: NaN, at: 0 };
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    // the fit: as wide as the thread's content box, no taller than the room between the top veil and the fold
    // (renderScroll parks the window's bottom at viewH - 8 once its marks have landed)
    const fit = () => {
      const feed = card.closest('.feed'), main = card.parentNode;
      if (!feed || !main) return;
      // re-fit whenever the frame, the feed box or the camera over it changes ('archange' re-renders the scene)
      const fr = feed.getBoundingClientRect();
      const ar = (window.AR && window.AR.key) || '';
      const key = `${ar}|${feed.clientWidth}x${feed.clientHeight}|${fr.top.toFixed(1)}|${fr.width.toFixed(1)}`;
      if (key === geoKey) return;
      geoKey = key;
      const cs = getComputedStyle(feed);
      const padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0;
      const padT = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
      const contentW = feed.clientWidth - padL - padR;
      const viewH = feed.clientHeight - padT - padB;
      // screen px per layout px (the hub is scaled by the camera and the stage fit)
      const s = feed.offsetWidth ? fr.width / feed.offsetWidth : 1;
      // how far the reply column (after the avatar) is indented from the feed's content box
      const indent = (main.getBoundingClientRect().left - fr.left) / s - padL;
      // the top veil fades the frame's top edge to the background: keep the window's title bar below it
      const edge = document.querySelector('#s-tabs .ask-edge');
      let top = 0;
      if (edge) { const er = edge.getBoundingClientRect(); top = Math.max(0, (er.bottom - fr.top) / s - padT); }
      const room = viewH - 8 - top - 6;
      const chrome = card.offsetHeight - card.querySelector('.play-screen').offsetHeight;
      const w = Math.floor(Math.max(200, Math.min(contentW, ((room / PUSH) - chrome) * 16 / 9)));
      card.style.width = `${w}px`;
      card.style.maxWidth = 'none';
      card.style.marginLeft = `${((contentW - w) / 2 - indent).toFixed(2)}px`;
    };

    return {
      nodes: [say, ...rows, card],
      // the last two marks put the window in view as it lands and then settle it once it has finished growing
      marks: [[T.r, say], [T.chipIn[0], rows[0]], [T.chipIn[1], rows[1]], [T.v0, card], [T.v0 + 0.55, card]],
      render(t) {
        fit();
        const n = streamCount(SAYS, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAYS.slice(0, n); hid.textContent = SAYS.slice(n); shown = n; }

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

        // the window grows in, then the camera keeps pushing in on it (from its bottom edge) while the clip runs
        const ci = outCubic(seg(t, T.v0, T.v0 + 0.55));
        const push = lerp(1, PUSH, seg(t, T.c0, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 22).toFixed(2)}px) scale(${(lerp(0.94, 1, ci) * push).toFixed(4)})`;

        // the player bar: 0:19 -> 0:29 of 2:21, written from t
        const pos = clamp(t - T.c0, 0, CLIP_LEN);
        const f = ((SRC0 + pos) / SRC_LEN) * 100;
        fill.style.width = `${f.toFixed(3)}%`;
        knob.style.left = `${f.toFixed(3)}%`;
        const tt = `${mmss(SRC0 + pos)} / ${mmss(SRC_LEN)}`;
        if (tt !== lastTime) { time.textContent = tt; lastTime = tt; }

        // the clip follows t: it plays inside the window only while the clock is really running, and every other
        // time it is parked on exactly the frame t asks for
        const now = performance.now();
        if (t !== clk.t) { clk.t = t; clk.at = now; }
        if (!window.__AD || !window.__AD.__playHold) hookSeek();
        if (HOLD.on) {
          if (HOLD.fresh) { HOLD.t = t; HOLD.fresh = false; } else if (Math.abs(t - HOLD.t) > 0.02) HOLD.on = false;
        }
        const running = !document.body.classList.contains('freeze') && !HOLD.on && now - clk.at < 150;
        const want = clamp(t - T.c0, 0, CLIP_END);
        const live = running && t >= T.c0 && t < T.end;
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
    };
  },
};
