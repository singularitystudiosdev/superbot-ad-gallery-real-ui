// Liquid Glass, the finale and the payoff the whole spot was for. Opus renders "Liquid Glass", the 16s motion
// reel from the X post (@motion_conquest, https://x.com/motion_conquest/status/2103510103622308152, see
// img/CREDITS.txt), and the ad's END OUTPUT is that clip: img/lg/liquid-glass-16s.mp4 (864x864, 30 fps, no audio,
// 16.0s; poster img/lg/poster.jpg). Fork of the Splatoon spot's game beat: same say line and tool chip, but where
// that one opened an 8s gameplay window, this one
//   1. answers "Rendered: Liquid Glass, 8 scenes, 16.0s" with a glass render card (progress 0..960 frames,
//      "960 frames at 60 fps", echoing the reel's own "Render complete" notification),
//   2. opens a glass player window titled "Liquid Glass" over the reply, and on the next 120 BPM beat morphs it
//      (outBack, corners easing out) into the whole 864x1080 frame: the square clip at full width, the band above
//      and below filled with the clip's own current frame, blown up and blurred over the pastel field, so it reads as
//      one pastel field. The clip then plays WHOLE and unobstructed for 16.0s, with a small caption chip in the band;
//   3. frosts the finished clip over (a glass dissolve: blur, a frosted glass pane, FROST = 0.9s) while timeline.js
//      fades the end card in over it, so the hand-off from clip to end card is a dissolve, not a cut.
// The clip is a real <video>, so its clock follows t. When the ad clock is running (timeline.js sets
// window.__AD.live) and t is inside the play window, the element plays and only re-seeks once it has drifted past a
// quarter second. Every other time (a ?t= freeze, a paused clock, window.__AD.seek frame-by-frame recording, any t
// outside the window) it is paused and parked on the exact middle of frame floor((t - T.v0) * 30), clamped to
// 0..479, so each recorded frame shows the clip frame t asks for; timeline.js seek() awaits that seek. No Date and no
// rAF state: every moving value in this module is written from t, so a frozen frame always renders the same pixels. The player window is appended to
// #s-tabs .ask-root rather than to the reply: its geometry is in FRAME px, because it becomes the frame. The reply
// only holds the render card and the invisible slot the window opens over (measured with lib boxIn each frame, the
// same way chat.js measures its scroll targets).
import { clamp, lerp, seg, outCubic, outBack, streamCount, boxIn } from '../../../lib.js';

const SAY = 'Rendered: Liquid Glass, 8 scenes, 16.0s';
const CHIP = ['Rendering Liquid Glass', 'Rendered in 3.2 s'];
const POSTER = 'lg/poster.jpg';            // the reel's own last frame (08/08), the field the clip sits on
const CLIP = 'lg/liquid-glass-16s.mp4';
const CLIP_LEN = 16.0;                     // the clip is 16.0s long
const CLIP_FPS = 30;                       // the file's own frame rate: 480 frames, 0..479
const LAST_FRAME = 479;                    // a parked clip never seeks past its last frame
const FRAMES = 960;                        // 16.0s at 60 fps, the reel's own render count
const PARK_TOL = 0.002;   // a parked clip re-seeks whenever it is not on the exact middle of the frame t asks for
const DRIFT_TOL = 0.25;   // live playback only re-seeks once the element has drifted further than this
const FROST = 0.9;        // the glass dissolve after the last frame: the clip frosts over while the end card fades in
const BGW = 36;           // the band canvas is this many px wide: the downscale is most of its blur
const RAD = 18;           // the window's rounded corner at the reply, easing out to 0 as it takes the frame
const DROP = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 3.6c3.5 4.1 5.6 6.7 5.6 9.4a5.6 5.6 0 0 1-11.2 0c0-2.7 2.1-5.3 5.6-9.4z"/></svg>';
const clock = (s) => `00:${String(Math.floor(clamp(s, 0, 59))).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.chipIn = r + 0.1;
    T.done = r + 0.95;        // the chip resolves as the render finishes
    T.card0 = r + 0.2;        // the render card lands in the reply
    T.prog0 = r + 0.35;       // the reel renders: 0 -> 960 frames
    T.prog1 = r + 1.45;
    T.open = r + 1.5;         // the player window opens over the reply
    T.expand0 = r + 2.0;      // ... and takes the whole frame on the next 120 BPM beat
    T.expand1 = r + 2.5;
    T.v0 = T.expand1;         // frame 0 of the clip, the moment the window IS the frame
    T.clipEnd = T.v0 + CLIP_LEN;
    // the chat scene runs to T.end + 0.6 (chat.js CHAT_END = T.end + 0.2, tabs.js dur = CHAT_END + 0.4), so this
    // puts the scene's last frame 0.4s after the clip's last frame, 0.4s into the frost. timeline.js then fades the
    // end card in over the still-frosting clip for its first 0.5s: the dissolve is FROST = 0.9s, no black between.
    T.end = T.clipEnd - 0.2;
    T.frost1 = T.clipEnd + FROST;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const SAYS = (k.opts && k.opts.say) || SAY; // a variant can give the finale its own line
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAYS)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(CHIP[0])}</span></div></div>`);
    const card = x.el(`<div class="lg-card" style="opacity:0">
      <div class="lg-head"><span class="lg-ic">${DROP}</span><span class="lg-lab">LIQUID GLASS</span><span class="lg-tag">16.0s</span></div>
      <div class="lg-ttl">Rendering Liquid Glass</div>
      <div class="lg-meta">960 frames at 60 fps</div>
      <div class="lg-track"><i class="lg-bar"></i></div>
      <div class="lg-count">0 / 960</div>
    </div>`);
    const slot = x.el('<div class="lg-slot"></div>');
    // the window lives in the frame's own space, not in the thread: #s-tabs .ask-root is the only box that is the
    // frame (no camera transform), so left/top/width/height written there are frame px
    const frame = x.hub.closest('.scene') || x.hub.closest('.ask-root') || x.hub;
    const root = x.hub.closest('.ask-root') || x.hub;
    const win = x.el(`<div class="lg-win">
      <div class="lg-field"><img class="lg-fill" src="${x.img(POSTER)}" alt=""/><canvas class="lg-bgc" width="${BGW}" height="${BGW}"></canvas></div>
      <video class="lg-vid" muted playsinline preload="auto" poster="${x.img(POSTER)}" src="${x.img(CLIP)}"></video>
      <div class="lg-frost"></div>
      <div class="lg-winbar"><span class="lg-dots"><i></i><i></i><i></i></span><b class="lg-title">Liquid Glass</b><span class="lg-time">00:00 / 00:16</span></div>
      <div class="lg-cap"><i class="lg-cap-dot"></i><b>@motion_conquest</b><span>made with Opus 5.5</span></div>
    </div>`);
    root.appendChild(win);
    const cardEl = card;
    const vid = win.querySelector('.lg-vid'), bar =win.querySelector('.lg-winbar'), cap = win.querySelector('.lg-cap');
    const bgc = win.querySelector('.lg-bgc'), frost = win.querySelector('.lg-frost');
    const g2d = bgc.getContext('2d', { alpha: false });
    // the band above and below the square clip is the clip itself, redrawn from the element's current frame at
    // BGW px wide and blown up under a CSS blur. Which frame the element holds is set from t below, so the band is
    // a function of t too; timeline.js re-renders once a seek has landed, so a recorded frame draws the new frame.
    const drawBand = (rw, rh) => {
      if (vid.readyState < 2) return false;
      const ch = Math.max(1, Math.round((BGW * rh) / Math.max(1, rw)));
      if (bgc.height !== ch) bgc.height = ch;
      const side = Math.max(BGW, ch); // cover: the square clip scaled to the canvas's long side, centred
      g2d.drawImage(vid, (BGW - side) / 2, (ch - side) / 2, side, side);
      return true;
    };
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    const ttl = card.querySelector('.lg-ttl'), count = card.querySelector('.lg-count'), barFill = card.querySelector('.lg-bar');
    const timeEl = win.querySelector('.lg-time');
    const chSp = chip.firstElementChild, chSp2 = chSp.querySelector('.spin'), chLab = chSp.lastElementChild;
    const vis = say.firstElementChild, hid = say.lastElementChild;
    // only write a style when the value really changed: the window is the frame for 16s and must not churn layout
    const last = new WeakMap();
    const set = (el, prop, val) => {
      let m = last.get(el); if (!m) last.set(el, m = new Map());
      const v = String(val);
      if (m.get(prop) === v) return;
      m.set(prop, v); el.style[prop] = v;
    };
    const txt = (el, s) => { if (el.textContent !== s) el.textContent = s; };
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    if (window.__AD) window.__AD.liquidGlass = { r: T.r, card: [T.card0, T.prog1], open: T.open, expand: [T.expand0, T.expand1], clip: [T.v0, T.clipEnd], frost: [T.clipEnd, T.frost1], end: T.end, clipLen: CLIP_LEN };

    return {
      nodes: [say, chip, card, slot],
      // the last two marks put the card and then the slot (where the window opens) in view, so the reply's own
      // bottom is the thing the feed glides to before the window takes over
      marks: [[T.r, say], [T.chipIn, chip], [T.card0, card], [T.card0 + 0.5, slot]],
      render(t) {
        const n = streamCount(SAYS, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAYS.slice(0, n); hid.textContent = SAYS.slice(n); shown = n; }

        // the tool chip: lands, spins, then resolves to what it did
        rise(chip, seg(t, T.chipIn, T.chipIn + 0.35), 8);
        const done = t >= T.done;
        chSp2.classList.toggle('done', done);
        chSp2.style.transform = done ? '' : `rotate(${(((t - T.chipIn) * 450) % 360).toFixed(1)}deg)`;
        txt(chLab, done ? CHIP[1] : CHIP[0]);

        // the render card: 0 -> 960 frames, then it reads the reel's own notification
        const ci = outCubic(seg(t, T.card0, T.card0 + 0.5));
        set(cardEl, 'opacity', ci.toFixed(3));
        set(cardEl, 'transform', ci >= 1 ? '' : `translateY(${((1 - ci) * 12).toFixed(2)}px)`);
        const frames = Math.round(FRAMES * seg(t, T.prog0, T.prog1));
        const rendered = t >= T.prog1;
        txt(ttl, rendered ? 'Render complete' : 'Rendering Liquid Glass');
        txt(count, `${frames} / ${FRAMES}`);
        set(barFill, 'width', ((frames / FRAMES) * 100).toFixed(2) + '%');

        // the window: it opens over the reply's slot, then the beat takes the whole frame. Both the rect and the
        // corner radius are pure functions of t; outBack is the spring, so the rect pops a little past the frame
        // and is clipped by .lg-win's overflow.
        const fw = frame.clientWidth || 1920, fh = frame.clientHeight || 1080;
        const s = boxIn(slot, frame);
        const grow = lerp(0.94, 1, outBack(seg(t, T.open, T.open + 0.45)));
        const e = outBack(seg(t, T.expand0, T.expand1));
        const shw = s.w * grow, shh = s.h * grow;
        const rx = lerp(s.cx - shw / 2, 0, e), ry = lerp(s.cy - shh / 2, 0, e);
        const rw = lerp(shw, fw, e), rh = lerp(shh, fh, e);
        set(win, 'opacity', seg(t, T.open, T.open + 0.28).toFixed(3));
        set(win, 'left', rx.toFixed(2) + 'px');
        set(win, 'top', ry.toFixed(2) + 'px');
        set(win, 'width', rw.toFixed(2) + 'px');
        set(win, 'height', rh.toFixed(2) + 'px');
        set(win, 'borderRadius', lerp(RAD, 0, clamp(e)).toFixed(2) + 'px');
        // the clip keeps its square in every window size: the square is the short side, centred
        const vs = Math.min(rw, rh);
        set(vid, 'left', ((rw - vs) / 2).toFixed(2) + 'px');
        set(vid, 'top', ((rh - vs) / 2).toFixed(2) + 'px');
        set(vid, 'width', vs.toFixed(2) + 'px');
        set(vid, 'height', vs.toFixed(2) + 'px');

        // the clip follows t: it plays while the ad clock runs inside the play window, and every other time it is
        // parked on the exact middle of the frame t asks for (half a frame in, so float rounding can never show
        // the frame before it)
        const want = clamp(t - T.v0, 0, CLIP_LEN);
        const fi = Math.min(LAST_FRAME, Math.floor(want * CLIP_FPS + 1e-4));
        const running = !!(window.__AD && window.__AD.live) && !document.body.classList.contains('freeze');
        if (running && t >= T.v0 && t < T.clipEnd) {
          if (vid.paused) {
            const p = vid.play();
            if (p && p.catch) p.catch((e2) => console.error('play.js: video.play() rejected', e2));
          }
          if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
        } else {
          if (!vid.paused) vid.pause();
          const at = (fi + 0.5) / CLIP_FPS;
          if (Math.abs(vid.currentTime - at) > PARK_TOL) vid.currentTime = at;
        }
        txt(timeEl, `${clock(want)} / 00:16`);
        // the band: the clip's current frame, once the window is on screen (the poster under it until then)
        if (t >= T.open - 0.1 && t < T.frost1 + 0.6 && drawBand(rw, rh)) set(bgc, 'opacity', '1');

        // the hand-off, a glass dissolve: from the clip's last frame the whole field frosts over (the clip blurs
        // and swells a touch under a frosted glass pane), and timeline.js fades the end card in over the frost
        const fr = outCubic(seg(t, T.clipEnd, T.clipEnd + 0.6));
        set(vid, 'filter', fr > 0 ? `blur(${(fr * 26).toFixed(2)}px) saturate(${(1 + 0.35 * fr).toFixed(3)})` : 'none');
        set(vid, 'transform', fr > 0 ? `scale(${(1 + 0.05 * fr).toFixed(4)})` : 'none');
        set(frost, 'opacity', fr.toFixed(3));
        // the bar carries the title while the window opens, then recedes during the expand so nothing covers the clip
        const barOp = seg(t, T.open, T.open + 0.25) * (1 - seg(t, T.expand0, T.expand0 + 0.35));
        set(bar, 'opacity', barOp.toFixed(3));
        // the caption chip lives in a band beside the clip, never over it: centred in the band below it (4:5,
        // 9:16), in the bottom-left of a side band (16:9), or, with no band at all (1:1), gone before the clip plays
        const bandV = (rh - vs) / 2, bandH = (rw - vs) / 2;
        const inV = bandV >= 56, inH = !inV && bandH >= 240;
        set(cap, 'left', inV ? '50%' : '22px');
        set(cap, 'bottom', inV ? `${Math.max(12, (bandV - 26) / 2).toFixed(2)}px` : '22px');
        set(cap, 'transform', inV ? 'translateX(-50%)' : 'none');
        const capOn = inV || inH ? 1 : 1 - seg(t, T.expand0, T.expand0 + 0.3);
        set(cap, 'opacity', (seg(t, T.open, T.open + 0.4) * capOn * (1 - fr)).toFixed(3));
      },
    };
  },
};