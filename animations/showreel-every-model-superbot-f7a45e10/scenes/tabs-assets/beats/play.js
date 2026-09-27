// Play beat, the finale: superbot streams the done line, its two tool chips land and resolve (one render per model),
// and the showreel window wipes in playing the post's clip whole: @shneural (kirill sh) gave Opus 5.5 Max and GPT 6
// Astra Max the same prompt, and the post's video runs the two reels back to back, 1920x1080 at 60fps, 1910 frames
// (31.833s), no audio; see img/sr/CREDITS.txt. The window is 16:9 and breaks out of the reply column to the
// composer's full width (play.css), and the credit rides under it as a caption chip. Neither ever carries a transform:
// their edges hold still and stay on the composer's edges at every t, and chat.js's scroll (which measures
// transformed boxes) glides on stable ground; every entrance move is a clip-path or an inner layer.
// The title bar carries a model tag that reads the half on screen (it flips on the first GPT 6 Astra Max frame with a
// mask wipe in that half's colour) and an SMPTE timecode of the clip frame; a scrub bar runs along the window's bottom
// edge with a playhead and one keyframe diamond on the model switch.
// The clip is a real <video>, so its clock follows t: want = clamp(t - T.v0, 0, CLIP_LEN), played from its first
// frame (at T.v0) to its last (at T.end) at 1.0x. A frozen frame (?t= adds body.freeze) or any t outside the clip
// pauses it and parks it on the MIDDLE of the frame t asks for, so a seek never lands on a frame boundary and a frozen
// frame always shows the same picture; inside the clip it plays and only re-seeks once it has drifted past a quarter
// second. No Date and no rAF state: every moving value in this module is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Rendered both. Same prompt, two models, one chat.';
// [app tile, while it runs, once it is done]
const CHIPS = [['opus', 'Rendering on Claude Opus 5.5', 'Rendered 0:15'], ['astra', 'Rendering on GPT 6 Astra', 'Rendered 0:15']];
const POSTER = 'sr/poster.jpg';
const CLIP = 'sr/showreel-full.mp4';
// img/sr/CREDITS.txt: 60 fps, frames 0..1909, every frame restamped to n/60, so the clip runs 1910/60 = 31.833s
const FPS = 60, FRAMES = 1910, LAST_FRAME = FRAMES - 1;
const CLIP_LEN = FRAMES / FPS;
// CREDITS PINNED: the last Opus frame is 953, 954 is the black splice frame, the GPT 6 Astra Max card starts at 955
const SWITCH_FRAME = 955;
const SWITCH_AT = SWITCH_FRAME / FPS;
const MODELS = ['Opus 5.5 Max', 'GPT 6 Astra Max'];
const TAG_WIPE = 8 / FPS; // the model tag's mask wipe, in clip seconds from the switch frame
const PARK_TOL = 0.004; // a parked clip only moves currentTime when it is off the wanted frame's middle by more than this
const DRIFT_TOL = 0.25; // live playback only re-seeks once the element has drifted further than this
const PUSH = 1.02;      // the slow push-in on the picture over the whole clip

// cubic-bezier(x1, y1, x2, y2) as a function of progress, the CSS timing curve: solve x(s) = x for the curve
// parameter (Newton, then bisection if the slope flattens), return y(s). y1 or y2 past 1 overshoots
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s, Y = (s) => ((ay * s + by) * s + cy) * s;
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let s = x;
    for (let i = 0; i < 8; i++) {
      const e = X(s) - x, d = dX(s);
      if (Math.abs(e) < 1e-6) return Y(s);
      if (Math.abs(d) < 1e-6) break;
      s -= e / d;
    }
    let lo = 0, hi = 1;
    s = x;
    for (let i = 0; i < 30; i++) {
      const e = X(s) - x;
      if (Math.abs(e) < 1e-6) break;
      if (e > 0) hi = s; else lo = s;
      s = (lo + hi) / 2;
    }
    return Y(s);
  };
}
const WIPE = bezier(0.76, 0, 0.24, 1);   // the entrance panel's fronts: a hard ease in, a long ease out
const POP = bezier(0.34, 1.56, 0.64, 1); // the overshoot the type and the keyframe diamond land on

// the entrance, in seconds from T.v0 (the clip starts on its first frame, pure black, as the wipe begins). The window
// is revealed by a mask front sweeping left to right with a signal-orange panel riding between it and a trailing front,
// then the picture scales in with an overshoot, the title rises glyph by glyph out of its baseline mask, the model tag
// and the timecode land, and the scrub bar draws in with its keyframe
const E = {
  front: [0, 0.34],    // the mask front: nothing of the window is visible right of it
  trail: [0.1, 0.46],  // the trailing front: the orange panel spans trail..front
  pic: [0.04, 0.64],   // the picture's scale-in (inside the clipped screen, never the window)
  title: 0.28, glyph: 0.022, rise: 0.36,
  tag: [0.22, 0.58],
  tc: [0.42, 0.62],
  track: [0.36, 0.9],
  key: [0.6, 0.95],
  cap: [0.45, 0.85],
};
const TITLE = 'showreel.mp4';

const pad2 = (n) => (n < 10 ? '0' : '') + n;
// SMPTE HH:MM:SS:FF of a clip frame at 60fps
const tcFields = (fi) => [Math.floor(fi / (FPS * 3600)), Math.floor(fi / (FPS * 60)) % 60, Math.floor(fi / FPS) % 60, fi % FPS].map(pad2);

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.78];
    T.chipDone = [r + 0.62, r + 1.28];
    T.v0 = r + 1.3;             // the window wipes in and the clip starts here, on its first frame
    T.end = T.v0 + CLIP_LEN;    // the clip's last frame; chat.js's CHAT_END and the scene tail hold it after this
    return T;
  },
  build(k, x) {
    const T = k.T;
    const SAYS = (k.opts && k.opts.say) || SAY; // a variant can give the finale its own line
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAYS)}</span></div>`);
    const rows = CHIPS.map(([app, run]) => x.el(`<div class="dd-chiprow play-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span>${x.tile(app)}<span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const glyphs = [...TITLE].map((ch) => `<span class="play-gl">${x.esc(ch)}</span>`).join('');
    const tagL = (m, i) => `<span class="play-tag-l play-tag-${i ? 'astra' : 'opus'}"><i></i>${x.esc(m)}</span>`;
    const card = x.el(`<div class="play-win" data-v0="${T.v0.toFixed(4)}" data-end="${T.end.toFixed(4)}">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><span class="play-tag" data-model="opus">${MODELS.map(tagL).join('')}</span><b class="play-title"><span class="play-ttl">${glyphs}</span></b><span class="play-tc"><b>00</b><i>:</i><b>00</b><i>:</i><b>00</b><i>:</i><b>00</b></span></div>
      <div class="play-screen"><video class="play-vid" muted playsinline preload="auto" poster="${x.img(POSTER)}" src="${x.img(CLIP)}"></video></div>
      <div class="play-scrub"><span class="play-rail"><span class="play-trk"></span><span class="play-fill play-fill-o"></span><span class="play-fill play-fill-g"></span><span class="play-key"></span><span class="play-head"></span></span></div>
      <div class="play-panel"></div>
    </div>`);
    // the credit: whose clip this is and what it shows (the post's own facts)
    const cap = x.el('<div class="play-cap" style="opacity:0"><b>@shneural</b><span>same prompt</span><span><em class="play-o">Opus 5.5 Max</em> vs <em class="play-g">GPT 6 Astra Max</em></span></div>');
    const vid = card.querySelector('.play-vid');
    const gls = [...card.querySelectorAll('.play-gl')];
    const tag = card.querySelector('.play-tag');
    const tagG = card.querySelector('.play-tag-astra');
    const tc = card.querySelector('.play-tc');
    const tcB = [...tc.querySelectorAll('b')];
    const trk = card.querySelector('.play-trk');
    const fillO = card.querySelector('.play-fill-o'), fillG = card.querySelector('.play-fill-g');
    const key = card.querySelector('.play-key'), head = card.querySelector('.play-head');
    const panel = card.querySelector('.play-panel');
    // the keyframe diamond and the split between the two fills sit on the switch frame
    const S = SWITCH_AT / CLIP_LEN;
    key.style.left = `${(S * 100).toFixed(4)}%`;
    fillG.style.left = `${(S * 100).toFixed(4)}%`;
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    let shown = -1, tcShown = ['00', '00', '00', '00'], modelShown = 0;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // read-only handle for QA: the beat's times, the clip element, the last t it rendered and what the title bar
    // shows for it (clip frame, timecode, model tag), so a check can hold the clip's currentTime against t while the
    // ad plays on
    const qa = { T, vid, t: NaN, fps: FPS, frames: FRAMES, clipLen: CLIP_LEN, switchFrame: SWITCH_FRAME, frame: 0, tc: '00:00:00:00', model: MODELS[0] };
    // the ask layout's top-edge fade (tabs.css .ask-edge) dissolves the thread as it scrolls under the frame's top.
    // Where the composer-wide window settles under it (16:9: window and caption fill the view from the fold up to the
    // frame's top) it would dim the title bar, so edgeGive() says how far the SETTLED window's top overlaps it, 0 (clear
    // of it, as at 4:5 and 9:16, where it keeps dissolving the soft thread above) to 1 (overlapping half its height or
    // more). Only sizes feed it (the window-plus-caption stack, the feed's fold, the edge's box), never a scroll
    // position, so reading it before chat.js scrolls this frame is exact and the edge stays a pure function of t.
    // The 8 is chat.js renderScroll's fold gap (the last mark's bottom sits 8px above the feed's content bottom)
    let edge = null;
    const edgeGive = () => {
      const feed = card.closest('.feed');
      if (!feed) return 0;
      const fr = feed.getBoundingClientRect(), sy = fr.height / (feed.offsetHeight || fr.height) || 1;
      const cs = getComputedStyle(feed), padT = parseFloat(cs.paddingTop);
      const viewH = feed.clientHeight - padT - parseFloat(cs.paddingBottom);
      const stack = (cap.getBoundingClientRect().bottom - card.getBoundingClientRect().top) / sy;
      const top = fr.top + (padT + viewH - 8 - stack) * sy;
      const er = edge.getBoundingClientRect();
      return er.height > 0 ? clamp((er.bottom - top) / (0.5 * er.height), 0, 1) : 0;
    };
    const at0 = (t, [a, b]) => seg(t, T.v0 + a, T.v0 + b);

    return {
      nodes: [say, ...rows, card, cap],
      // as the window lands the fold glides straight to the caption's bottom, so window, caption and composer fill the
      // view once the entrance settles (the say line and chips scroll up and out). The window's own mark at T.v0 is how
      // chat.js finds the bright plane, and the caption's repeat at T.v0 + 0.7 (a no-op glide) keeps chat.js dimming
      // the rest of the thread over those 0.7s
      marks: [[T.r, say], [T.chipIn[0], rows[0]], [T.chipIn[1], rows[1]], [T.v0, card], [T.v0, cap], [T.v0 + 0.7, cap]],
      render(t) {
        qa.t = t;
        if (window.__AD && window.__AD.showreel !== qa) window.__AD.showreel = qa;
        const n = streamCount(SAYS, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAYS.slice(0, n); hid.textContent = SAYS.slice(n); shown = n; }

        // the two tool chips: land, spin, then resolve to what they did
        chipEls.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][2] : CHIPS[i][1];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the entrance: a mask front sweeps the window in left to right with the orange panel riding between it and
        // the trailing front. The window's box never moves: the front is a clip-path (outset 64px on the other three
        // sides so the drop shadow, which fades up with the front, is not cut), the panel an inner layer
        const M = WIPE(at0(t, E.front)), N = WIPE(at0(t, E.trail));
        card.style.opacity = t > T.v0 ? '1' : '0';
        if (M < 1) {
          card.style.clipPath = `inset(-64px ${((1 - M) * 100).toFixed(3)}% -64px -64px)`;
          card.style.boxShadow = `inset 0 0 0 1px #29272d, 0 18px 44px rgba(0, 0, 0, ${(0.5 * M).toFixed(3)})`;
        } else {
          card.style.clipPath = '';
          card.style.boxShadow = '';
        }
        const pw = M - N;
        if (pw > 0.0005) {
          // directional motion blur: the panel's trailing edge smears by how far the trailing front moved this frame
          // (three quarters of a frame of travel, a wide shutter's blur, never more than a fifth of the panel)
          const vN = N - WIPE(seg(t - 1 / FPS, T.v0 + E.trail[0], T.v0 + E.trail[1]));
          const smear = clamp((vN * 0.75) / pw, 0, 0.2) * 100;
          panel.style.display = 'block';
          panel.style.left = `${(N * 100).toFixed(3)}%`;
          panel.style.width = `${(pw * 100).toFixed(3)}%`;
          panel.style.background = smear > 0.5 ? `linear-gradient(90deg, rgba(252, 89, 31, 0), #fc591f ${smear.toFixed(2)}%)` : '';
        } else panel.style.display = 'none';

        // inside the clipped screen the picture scales in with an overshoot, then keeps pushing in for as long as the
        // clip runs
        const push = lerp(1, PUSH, seg(t, T.v0, T.end));
        vid.style.transform = `scale(${(lerp(0.9, 1, outBack(at0(t, E.pic))) * push).toFixed(4)})`;

        // kinetic type: each glyph of the title rises out of its baseline mask on an overshoot, one after another
        gls.forEach((g, i) => {
          const a = T.v0 + E.title + i * E.glyph;
          const q = seg(t, a, a + E.rise);
          g.style.transform = q >= 1 ? '' : `translateY(${((1 - POP(q)) * 110).toFixed(2)}%)`;
        });

        // the model tag pops in, then reads the half on screen from the clip frame
        const want = clamp(t - T.v0, 0, CLIP_LEN);
        const fi = Math.min(LAST_FRAME, Math.floor(want * FPS + 1e-4));
        const tq = at0(t, E.tag);
        tag.style.opacity = outCubic(seg(tq, 0, 0.35)).toFixed(3);
        tag.style.transform = tq >= 1 ? '' : `scale(${lerp(0.4, 1, POP(tq)).toFixed(4)})`;
        const m = fi >= SWITCH_FRAME ? 1 : 0;
        if (m !== modelShown) { tag.dataset.model = m ? 'astra' : 'opus'; modelShown = m; }
        // the switch: the lime layer is wiped over the orange one, left to right, from the first GPT 6 Astra Max frame
        const w = m ? outCubic(seg(want, SWITCH_AT, SWITCH_AT + TAG_WIPE)) : 0;
        // (play.css hides the layer by default, so the settled state is an explicit 'none', never a cleared style)
        tagG.style.clipPath = w >= 1 ? 'none' : `inset(0 ${((1 - w) * 100).toFixed(3)}% 0 0)`;
        qa.frame = fi;
        qa.model = MODELS[m];

        // the timecode readout: the clip frame as HH:MM:SS:FF at 60fps
        const f = tcFields(fi);
        f.forEach((v, i) => { if (tcShown[i] !== v) { tcB[i].textContent = v; tcShown[i] = v; } });
        qa.tc = f.join(':');
        tc.style.opacity = outCubic(at0(t, E.tc)).toFixed(3);

        // the scrub bar: the track draws in, the played span fills orange up to the switch keyframe and lime after
        // it, the playhead rides the clip, the diamond pops in and lights up once the playhead crosses it
        const p = want / CLIP_LEN;
        const dq = at0(t, E.track);
        trk.style.transform = dq >= 1 ? 'none' : `scaleX(${outCubic(dq).toFixed(4)})`;
        head.style.opacity = outCubic(seg(dq, 0.3, 1)).toFixed(3);
        head.style.left = `${(p * 100).toFixed(4)}%`;
        fillO.style.width = `${(Math.min(p, S) * 100).toFixed(4)}%`;
        fillG.style.width = `${(Math.max(0, p - S) * 100).toFixed(4)}%`;
        const kq = at0(t, E.key);
        key.style.opacity = outCubic(seg(kq, 0, 0.3)).toFixed(3);
        key.style.transform = `translate(-50%, -50%) rotate(${(45 - 90 * (1 - kq)).toFixed(2)}deg) scale(${(kq >= 1 ? 1 : POP(kq)).toFixed(4)})`;
        key.classList.toggle('lit', m === 1);

        // the credit wipes in under it the same way, later, in place (it is the fold's anchor, so it must not travel)
        const cq = WIPE(at0(t, E.cap));
        cap.style.opacity = cq > 0 ? '1' : '0';
        cap.style.clipPath = cq >= 1 ? '' : `inset(-2px ${((1 - cq) * 100).toFixed(3)}% -2px -2px)`;
        // the top-edge fade gives way in step with the fold's glide to the caption (same span, same easing), by as
        // much as the settled window would sit under it; before the window lands the edge is left as tabs.css has it
        if (!edge) { const sc = card.closest('#s-tabs'); edge = sc && sc.querySelector('.ask-edge'); }
        if (edge) {
          const give = t > T.v0 ? edgeGive() * inOutCubic(seg(t, T.v0, T.v0 + 0.3)) : 0;
          edge.style.opacity = give > 0.001 ? (1 - give).toFixed(3) : '';
        }

        // the clip follows t: it plays inside [T.v0, T.end), and every other time it is parked on the middle of the
        // frame t asks for (the last frame from T.end on)
        const at = (fi + 0.5) / FPS;
        const live = t >= T.v0 && t < T.end && !document.body.classList.contains('freeze');
        if (live) {
          if (vid.paused) {
            const pr = vid.play();
            if (pr && pr.catch) pr.catch((e) => console.error('play.js: video.play() rejected', e));
          }
          if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = at;
        } else {
          if (!vid.paused) vid.pause();
          if (Math.abs(vid.currentTime - at) > PARK_TOL) vid.currentTime = at;
        }
      },
    };
  },
};
