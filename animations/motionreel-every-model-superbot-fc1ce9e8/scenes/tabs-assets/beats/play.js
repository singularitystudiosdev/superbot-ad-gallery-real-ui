// Play beat, the finale: superbot streams the done line, its one tool chip lands and resolves (Claude Opus 5.5 on Max
// effort renders the reel), and the reel's window springs in playing the post's clip whole: @stephanlivera gave Opus
// 5.5 on Max effort the prompt, and the post's video is the reel it made, 1920x1080 at 60fps, 900 frames (15.000s),
// no audio; see img/mr/CREDITS.txt. The window is 16:9 and breaks out of the reply column to the composer's full width
// (play.css), and the credit rides under it as a caption chip. Neither ever carries a transform: their edges hold still
// and stay on the composer's edges at every t, and chat.js's scroll (which measures transformed boxes) glides on stable
// ground; every entrance move is a clip-path or an inner layer.
// The window's title bar mirrors the reel's own chrome, read from the clip frame on screen: the chapter tag (01 ·
// IDENTITY ... 07 · FIN, flipping on the reel's own chapter frames, each new label decoding in through scrambled glyphs
// as the reel's does, over a mask wipe in that chapter's ground colour), the SMPTE timecode of the clip frame with
// "60 FPS", and the reel's counter, "128 BPM", four beat squares with the current beat filled and "BAR n/8", turning
// over on the reel's own bar frames. The scrub strip under the picture carries the playhead and one keyframe diamond
// per chapter, on the chapter's own frame.
// The clip is a real <video>, so its clock follows t: want = clamp(t - T.v0, 0, CLIP_LEN), played from its first
// frame (at T.v0) to its last (at T.end) at 1.0x. A frozen frame (?t= adds body.freeze) or any t outside the clip
// pauses it and parks it on the MIDDLE of the frame t asks for, so a seek never lands on a frame boundary and a frozen
// frame always shows the same picture; inside the clip it plays and only re-seeks once it has drifted past a quarter
// second. No Date and no rAF state: every moving value in this module is written from t.
import { clamp, lerp, seg, outCubic, inOutCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Rendered on Max effort. 15 seconds, 8 bars at 128 BPM, every frame written in code.';
// [app tile, while it runs, once it is done]
const CHIPS = [['opus', 'Rendering on Claude Opus 5.5 · Max effort', 'Rendered 0:15 · 900 frames']];
const CLIP = 'mr/reel.mp4';
// img/mr/CREDITS.txt: 60 fps, frames 0..899, every frame on n/60, so the clip runs 900/60 = 15.000s
const FPS = 60, FRAMES = 900, LAST_FRAME = FRAMES - 1;
const CLIP_LEN = FRAMES / FPS;
// CREDITS BAR GRID: 128 BPM, a beat is 28.125 frames and a bar 112.5; the reel's counter turns over on the first whole
// frame of each, ceil(k * 28.125) (bars on 0, 113, 225, 338, 450, 563, 675, 788; bar 2's beats on 113, 141, 169, 197),
// so the beat on screen at frame fi is floor(fi / 28.125)
const BEAT_FRAMES = 28.125, BARS = 8;
const BAR_FRAMES = Array.from({ length: BARS }, (_, k) => Math.ceil(k * 4 * BEAT_FRAMES));
// CREDITS CHAPTER MAP: the frame each chapter's label starts decoding on (02's is a one beat pickup, on beat 4 of bar
// 2, readable 18 frames later at 215)
const CHAPTERS = [['01', 'IDENTITY', 0], ['02', 'EASING', 197], ['03', 'MORPHING', 338], ['04', 'SYSTEMS', 450],
  ['05', 'DEPTH', 563], ['06', 'KINETIC TYPE', 675], ['07', 'FIN', 788]];
const LABELS = CHAPTERS.map(([n, name]) => `${n} · ${name}`);
const WIDEST = LABELS.reduce((a, b) => (b.length > a.length ? b : a));
const DECODE = 18; // frames a label takes to decode, left to right (02: 197 to readable at 215)
const SCRAMBLE = '#%&*+/<=>?@\\^01';
// the chapter tag's grounds, each wiped in over the last from its first frame to its last, in the colour the reel's own
// ground turns on that span (CREDITS, what is on screen): 01 opens on ink and red floods it on the bar 2 downbeat
// (113-124, behind a cream disk), the cream diagonal wipe into 02 (205-212), the hard cuts to 03 blue (338), 04 ink
// (450), 05 ink (563), 06 red (675, the first EASE) and 07 red (788) take an 8 frame wipe. The band is the colour that
// rides between the wipe's two fronts (so a wipe onto the same colour, ink onto ink, red onto red, still reads)
const INK = '#0F0F11', RED = '#F04B3A', CREAM = '#F2EFE7', BLUE = '#302FF5';
const GROUNDS = [
  { a: 0, b: 0, bg: 'ink', band: null },
  { a: 113, b: 124, bg: 'red', band: CREAM },
  { a: 205, b: 212, bg: 'cream', band: INK },
  { a: 338, b: 346, bg: 'blue', band: RED },
  { a: 450, b: 458, bg: 'ink', band: RED },
  { a: 563, b: 571, bg: 'ink', band: CREAM },
  { a: 675, b: 683, bg: 'red', band: CREAM },
  { a: 788, b: 796, bg: 'red', band: INK },
];
const TRAIL = 2; // frames the trailing front runs behind the leading one
const PARK_TOL = 0.004; // a parked clip only moves currentTime when it is off the wanted frame's middle by more than this
const DRIFT_TOL = 0.25; // live playback only re-seeks once the element has drifted further than this

// cubic-bezier(x1, y1, x2, y2) as a function of progress, the CSS timing curve: solve x(s) = x for the curve
// parameter (Newton, then bisection if the slope flattens), return y(s)
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
const WIPE = bezier(0.76, 0, 0.24, 1); // the mask fronts: a hard ease in, a long ease out

// the finale's easing, the seventh after the clip's six: a damped spring, in SECONDS since its start (not progress),
// on the constants the reel's own 03 MORPHING readout shows ("SPRING F=2.6 ζ=0.30", frame 420), f = 2.6 Hz and
// damping ratio 0.30. It overshoots by about 37% and has settled to within 0.1% by 1.45s; SPRING_END is where render
// writes the settled value instead
const SPRING_F = 2.6, SPRING_Z = 0.3, SPRING_END = 1.6;
const SW = 2 * Math.PI * SPRING_F, SA = SPRING_Z * SW, SD = SW * Math.sqrt(1 - SPRING_Z * SPRING_Z);
const spring = (s) => (s <= 0 ? 0 : s >= SPRING_END ? 1 : 1 - Math.exp(-SA * s) * (Math.cos(SD * s) + (SA / SD) * Math.sin(SD * s)));

// the entrance, in seconds from T.v0 (the clip starts on its first frame, the ink ground, as the wipe begins). The
// window is revealed by a mask front sweeping left to right with a red panel riding between it and a trailing front,
// the picture springs in, the title rises glyph by glyph out of its baseline mask on the spring, the chapter tag and
// the timecode land, the transport draws in and its seven chapter diamonds spring up one after another
const E = {
  front: [0, 0.34],    // the mask front: nothing of the window is visible right of it
  trail: [0.1, 0.46],  // the trailing front: the red panel spans trail..front
  pic: 0.04,           // the picture's spring (inside the clipped screen, never the window)
  title: 0.28, glyph: 0.022,
  tag: 0.22,
  tc: [0.42, 0.62],
  track: [0.36, 0.9],
  key: 0.6, keyStep: 0.045,
  meter: [0.5, 0.74],
  cap: [0.45, 0.85],
};
const TITLE = 'reel.mp4';

const pad2 = (n) => (n < 10 ? '0' : '') + n;
// SMPTE HH:MM:SS:FF of a clip frame at 60fps (CREDITS TIMING: the reel's own timecode equals the frame exactly)
const tcFields = (fi) => [Math.floor(fi / (FPS * 3600)), Math.floor(fi / (FPS * 60)) % 60, Math.floor(fi / FPS) % 60, fi % FPS].map(pad2);
// the chapter on screen at frame fi, and its label as it decodes: characters resolve left to right over DECODE frames
// from the label's first frame, every one not yet resolved shows a scramble glyph picked from (frame, position), so a
// frozen frame always shows the same glyphs; the space and the middle dot never scramble
const chapterAt = (fi) => { let c = 0; CHAPTERS.forEach(([, , f], i) => { if (fi >= f) c = i; }); return c; };
function labelAt(fi) {
  const c = chapterAt(fi), L = LABELS[c], f0 = CHAPTERS[c][2];
  const done = Math.floor(((fi - f0) * L.length) / DECODE);
  if (done >= L.length) return L;
  let s = '';
  for (let i = 0; i < L.length; i++) {
    const ch = L[i];
    s += i < done || ch === ' ' || ch === '·' ? ch : SCRAMBLE[Math.floor(rand(fi * 31 + i * 7 + c * 101) * SCRAMBLE.length)];
  }
  return s;
}

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22];
    T.chipDone = [r + 0.95];
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
    const grounds = GROUNDS.map((g) => `<span class="play-ch-l play-bg-${g.bg}"></span>`).join('');
    const keys = CHAPTERS.map(() => '<span class="play-key"></span>').join('');
    const card = x.el(`<div class="play-win" data-v0="${T.v0.toFixed(4)}" data-end="${T.end.toFixed(4)}">
      <div class="play-bar"><span class="play-dots"><i></i><i></i><i></i></span><span class="play-ch"><span class="play-ch-l play-ch-size">${x.esc(WIDEST)}</span>${grounds}<span class="play-band"></span></span><b class="play-title"><span class="play-ttl">${glyphs}</span></b><span class="play-tc"><b>00</b><i>:</i><b>00</b><i>:</i><b>00</b><i>:</i><b>00</b><u>60 FPS</u></span><span class="play-meter"><u>128 BPM</u><span class="play-beats"><i></i><i></i><i></i><i></i></span><b>BAR 1/8</b></span></div>
      <div class="play-screen"><video class="play-vid" muted playsinline preload="auto" src="${x.img(CLIP)}"></video></div>
      <div class="play-scrub"><span class="play-trk"></span><span class="play-fill"></span>${keys}<span class="play-head"></span></div>
      <div class="play-panel"></div>
    </div>`);
    // the credit: whose clip this is and what made it (the post's own facts)
    const cap = x.el('<div class="play-cap" style="opacity:0"><b>@stephanlivera</b><span><em>Opus 5.5</em> on Max effort</span></div>');
    const vid = card.querySelector('.play-vid');
    const gls = [...card.querySelectorAll('.play-gl')];
    const ch = card.querySelector('.play-ch');
    const chLs = [...ch.querySelectorAll('.play-ch-l:not(.play-ch-size)')];
    const band = ch.querySelector('.play-band');
    const tc = card.querySelector('.play-tc');
    const tcB = [...tc.querySelectorAll('b')];
    const trk = card.querySelector('.play-trk');
    const fill = card.querySelector('.play-fill');
    const keyEls = [...card.querySelectorAll('.play-key')], head = card.querySelector('.play-head');
    const meter = card.querySelector('.play-meter');
    const beatEls = [...meter.querySelectorAll('.play-beats i')], barEl = meter.querySelector('b');
    const panel = card.querySelector('.play-panel');
    // each chapter's keyframe diamond sits on the frame its label starts on
    keyEls.forEach((kEl, i) => { kEl.style.left = `${((CHAPTERS[i][2] / FRAMES) * 100).toFixed(4)}%`; });
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    vid.muted = true;
    vid.defaultMuted = true;
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chipEls = rows.map((r) => r.firstElementChild);
    let shown = -1, tcShown = ['00', '00', '00', '00'], labelShown = '', beatShown = -1, barShown = 1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // read-only handle for QA: the beat's times, the clip element, the last t it rendered and what the chrome shows
    // for it (clip frame, timecode, bar and beat, chapter label), so a check can hold the clip's currentTime against t
    // while the ad plays on
    const qa = { T, vid, t: NaN, fps: FPS, frames: FRAMES, clipLen: CLIP_LEN, barFrames: BAR_FRAMES, chapters: CHAPTERS,
      frame: 0, tc: '00:00:00:00', bar: 1, beat: 0, chapter: LABELS[0], label: '' };
    // the ask layout's top-edge fade (tabs.css .ask-edge) dissolves the thread as it scrolls under the frame's top.
    // Where the composer-wide window settles under it (16:9: window and caption fill the view from the fold up to the
    // frame's top) it would dim the title bar, so edgeGive() says how far the SETTLED window's top overlaps it, 0 (clear
    // of it) to 1 (overlapping half its height or more). Only sizes feed it (the window-plus-caption stack, the feed's
    // fold, the edge's box), never a scroll position, so reading it before chat.js scrolls this frame is exact and the
    // edge stays a pure function of t. The 8 is chat.js renderScroll's fold gap (the last mark's bottom sits 8px above
    // the feed's content bottom)
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
    const sp0 = (t, a) => spring(t - T.v0 - a);

    return {
      nodes: [say, ...rows, card, cap],
      // as the window lands the fold glides straight to the caption's bottom, so window, caption and composer fill the
      // view once the entrance settles (the say line and the chip scroll up and out); the caption's repeat at
      // T.v0 + 0.7 is a no-op glide that holds the fold there
      marks: [[T.r, say], [T.chipIn[0], rows[0]], [T.v0, card], [T.v0, cap], [T.v0 + 0.7, cap]],
      render(t) {
        qa.t = t;
        if (window.__AD && window.__AD.motionreel !== qa) window.__AD.motionreel = qa;
        const n = streamCount(SAYS, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAYS.slice(0, n); hid.textContent = SAYS.slice(n); shown = n; }

        // the tool chip: lands, spins, then resolves to what it did
        chipEls.forEach((c, i) => {
          rise(rows[i], seg(t, T.chipIn[i], T.chipIn[i] + 0.35), 8);
          const done = t >= T.chipDone[i];
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][2] : CHIPS[i][1];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the entrance: a mask front sweeps the window in left to right with the red panel riding between it and the
        // trailing front. The window's box never moves: the front is a clip-path (outset 64px on the other three
        // sides so the drop shadow, which fades up with the front, is not cut), the panel an inner layer
        const M = WIPE(at0(t, E.front)), N = WIPE(at0(t, E.trail));
        card.style.opacity = t > T.v0 ? '1' : '0';
        if (M < 1) {
          card.style.clipPath = `inset(-64px ${((1 - M) * 100).toFixed(3)}% -64px -64px)`;
          card.style.boxShadow = `inset 0 0 0 1px #2a2a30, 0 18px 44px rgba(0, 0, 0, ${(0.5 * M).toFixed(3)})`;
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
          panel.style.background = smear > 0.5 ? `linear-gradient(90deg, rgba(240, 75, 58, 0), var(--mr-red, ${RED}) ${smear.toFixed(2)}%)` : '';
        } else panel.style.display = 'none';

        // inside the clipped screen the picture springs in from 92% about its centre and holds at exactly 1 once the
        // spring has settled, so the reel's own chrome sits whole inside the window for the rest of the clip
        const ps = sp0(t, E.pic);
        vid.style.transform = ps >= 1 ? '' : `scale(${lerp(0.92, 1, ps).toFixed(4)})`;

        // kinetic type: each glyph of the title rises out of its baseline mask on the spring, one after another
        gls.forEach((g, i) => {
          const q = sp0(t, E.title + i * E.glyph);
          g.style.transform = q >= 1 ? '' : `translateY(${((1 - q) * 110).toFixed(2)}%)`;
        });

        // the clip frame on screen; every readout below is written from it
        const want = clamp(t - T.v0, 0, CLIP_LEN);
        const fi = Math.min(LAST_FRAME, Math.floor(want * FPS + 1e-4));
        qa.frame = fi;

        // the chapter tag springs in, then reads the chapter on screen from the clip frame: its label decodes in on
        // the chapter's own frame, and its grounds wipe in over one another on the reel's own ground changes, each
        // revealed up to the trailing front with the band riding to the leading one
        const cs = sp0(t, E.tag);
        ch.style.opacity = outCubic(seg(t - T.v0 - E.tag, 0, 0.2)).toFixed(3);
        ch.style.transform = cs >= 1 ? '' : `scale(${lerp(0.4, 1, cs).toFixed(4)})`;
        const lab = labelAt(fi);
        if (lab !== labelShown) { chLs.forEach((l) => { l.textContent = lab; }); labelShown = lab; }
        const c = chapterAt(fi);
        qa.chapter = LABELS[c];
        qa.label = lab;
        let bandOn = false;
        GROUNDS.forEach((g, i) => {
          if (i === 0) return;
          const lead = g.b > g.a ? WIPE(seg(fi, g.a, g.b)) : fi >= g.a ? 1 : 0;
          const trail = g.b > g.a ? WIPE(seg(fi, g.a + TRAIL, g.b + TRAIL)) : lead;
          const l = chLs[i];
          l.style.display = lead > 0 ? '' : 'none';
          l.style.clipPath = trail >= 1 ? 'none' : `inset(0 ${((1 - trail) * 100).toFixed(3)}% 0 0)`;
          if (lead > 0 && lead - trail > 0.0005) {
            bandOn = true;
            band.style.left = `${(trail * 100).toFixed(3)}%`;
            band.style.width = `${((lead - trail) * 100).toFixed(3)}%`;
            band.style.background = g.band;
          }
        });
        band.style.display = bandOn ? 'block' : 'none';

        // the timecode readout: the clip frame as HH:MM:SS:FF at 60fps, the reel's own timecode
        const f = tcFields(fi);
        f.forEach((v, i) => { if (tcShown[i] !== v) { tcB[i].textContent = v; tcShown[i] = v; } });
        qa.tc = f.join(':');
        tc.style.opacity = outCubic(at0(t, E.tc)).toFixed(3);

        // the reel's counter: the beat on screen and its bar, turning over on the reel's own frames
        const B = Math.floor(fi / BEAT_FRAMES + 1e-9);
        const bar = Math.min(BARS, Math.floor(B / 4) + 1), beat = B % 4;
        if (beat !== beatShown) { beatEls.forEach((b, i) => b.classList.toggle('on', i === beat)); beatShown = beat; }
        if (bar !== barShown) { barEl.textContent = `BAR ${bar}/${BARS}`; barShown = bar; }
        qa.bar = bar;
        qa.beat = beat;
        meter.style.opacity = outCubic(at0(t, E.meter)).toFixed(3);

        // the scrub bar: the track draws in, the played span fills red, the playhead rides the clip, and each chapter's
        // diamond springs up in turn and lights once the playhead reaches its frame
        const p = want / CLIP_LEN;
        const dq = at0(t, E.track);
        trk.style.transform = dq >= 1 ? 'none' : `scaleX(${outCubic(dq).toFixed(4)})`;
        head.style.opacity = outCubic(seg(dq, 0.3, 1)).toFixed(3);
        head.style.left = `${(p * 100).toFixed(4)}%`;
        fill.style.width = `${(p * 100).toFixed(4)}%`;
        keyEls.forEach((kEl, i) => {
          const a = E.key + i * E.keyStep;
          const kq = sp0(t, a);
          kEl.style.opacity = outCubic(seg(t - T.v0 - a, 0, 0.18)).toFixed(3);
          kEl.style.transform = `translate(-50%, -50%) rotate(45deg) scale(${kq.toFixed(4)})`;
          kEl.classList.toggle('lit', fi >= CHAPTERS[i][2] && t > T.v0);
        });

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
        // frame t asks for (the first frame before T.v0, the last frame from T.end on)
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
