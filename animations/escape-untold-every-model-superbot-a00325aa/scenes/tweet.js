// Act 1, the hook: three seconds framed tight on one X post. Only its line, "I made this in 1 prompt", and its
// video card fill the frame (the re-share line "From anabology" sits under the card, as on X). The post's author
// is FICTIONAL (the line is nobody's real words); the video is @anabology's "18 MONTHS TO ESCAPE" film
// (img/esc/tweet-clip.mp4), opening on its title card and playing muted, with X's time-left pill and mute button.
// It keeps X's dark post look ("Lights out" black, X's text colour, the 16px-radius card with its 1px rule), seen
// at the zoom K, so it still reads as a post someone scrolled to.
//
//   push    the whole block creeps in about its centre, x1.00 to x1.05 across the scene (constant rate in log scale);
//   marker  "1 prompt" (those two words only) gets a solid yellow highlighter box that wipes in left to right over
//           MARK (outCubic on its width); the letters under the box turn dark exactly where the box has reached,
//           a clipped dark copy on top of a complementary-clipped light copy. It stays on to the hard cut.
// Nothing else moves. The block is laid out in frame px: X's own post px times K (K is set by the frame width, so
// the text line plus video is about 88% of the height on 16x9 and about 90% of the width on narrow ratios); the
// line itself is set at FONT px so it reads big.
// render(lt) is a pure function of lt. The clip is a real <video> slaved to lt like beats/play.js: it plays inside
// the scene and re-seeks only past DRIFT_TOL; a frozen frame (?t= puts body.freeze) pauses it and seeks exactly.
import { clamp, seg, outCubic } from '../lib.js';

const H = 1080;
const DUR = 3.0;
const escImg = (f) => new URL('../img/esc/' + f, import.meta.url).href;

// ---------- the clip ----------
const CLIP = 'tweet-clip.mp4', POSTER = 'tweet-poster.jpg';
const V0 = 0;             // the clip starts on its first frame (the "18 MONTHS TO ESCAPE" title card) at lt 0
const CLIP_END = 6.36;    // the trim is 6.42s: never seek onto the very last frame
const PILL_FROM = 306;    // the pill counts down from 5:06, the full film's length (it is a re-share)
const SEED_TOL = 0.04, DRIFT_TOL = 0.25;

// ---------- framing ----------
const MEDIA_W = 516;      // the video card's width on X (a 600px column's body), in X px
const POST_H = 32 + MEDIA_W * 9 / 16; // X px under the line: 12 gap, the 16:9 card, 4 + 16 for the From line
const FILL_H = 0.88;      // the block's height as a fraction of the frame (wide ratios)...
const FILL_W = 0.90;      // ...or its width (narrow ratios), whichever binds first
const FONT_WIDE = 56, FONT_NARROW = 52; // the line's px in the frame (16x9 / 4x3, then 1x1 / 4x5)
const LINE = 1.3;         // its line height, in em

// ---------- motion ----------
const ZOOM = [1.0, 1.05]; // the push-in across the whole scene
const MARK = [0.55, 0.8]; // the highlighter's wipe
const MARK_PAD = 0.12;    // the box's side padding, in em

const POST = { text: 'I made this in', hl: '1 prompt', from: 'anabology' };

// X's own 24x24 mute icon path (the web client's)
const MUTE = 'M15 1.06v21.88L6.68 17H2V7h4.68L15 1.06zM4 9v6h3.32L13 18.94V5.06L7.32 9H4zm16.19 3l2.4 2.41-1.41 1.42L18.77 13.4l-2.41 2.43-1.42-1.42L17.35 12l-2.41-2.4 1.42-1.42 2.41 2.4 2.4-2.4 1.41 1.42L20.19 12z';
const icon = (d, cls = 'tw-ic', vb = 24) => `<svg class="${cls}" viewBox="0 0 ${vb} ${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
// m:ss, what X's pill shows (the time left)
const clock = (s) => { const n = Math.max(0, Math.ceil(s - 1e-6)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

let el = null;

export default {
  id: 'tweet',
  dur: DUR,
  fadeIn: 0,
  fadeOut: 0,

  mount(section) {
    section.innerHTML = `
<div class="tw-post">
  <div class="tw-text">${POST.text} <span class="tw-hl"><span class="tw-mk"></span><span class="tw-hl-t">${POST.hl}</span><span class="tw-hl-t tw-hl-on" aria-hidden="true">${POST.hl}</span></span></div>
  <div class="tw-media tw-vcard">
    <video class="tw-vid" muted playsinline preload="auto" poster="${escImg(POSTER)}" src="${escImg(CLIP)}"></video>
    <span class="tw-pill">${clock(PILL_FROM)}</span>
    <span class="tw-mute">${icon(MUTE)}</span>
  </div>
  <div class="tw-from">From <span class="tw-from-n">${POST.from}</span></div>
</div>`;
    const q = (s) => section.querySelector(s);
    const [light, dark] = section.querySelectorAll('.tw-hl-t');
    el = {
      sec: section, post: q('.tw-post'), hl: q('.tw-hl'), mk: q('.tw-mk'), light, dark,
      vid: q('.tw-vid'), pill: q('.tw-pill'),
      pillText: '', w: 0,
    };
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    el.vid.muted = true;
    el.vid.defaultMuted = true;
    // the timeline renders only the active scene: once it moves on, park the clip instead of decoding it off screen
    new MutationObserver(() => { if (!section.classList.contains('on') && !el.vid.paused) el.vid.pause(); })
      .observe(section, { attributes: true, attributeFilter: ['class'] });
  },

  render(lt, ctx) {
    if (!el) return;
    const t = clamp(lt, 0, DUR);
    const W = (ctx && ctx.W) || 1920;

    // ---- layout, only when the frame width changes: K is X px to frame px, FONT the line's size ----
    if (W !== el.w) {
      const font = W >= 1400 ? FONT_WIDE : FONT_NARROW;
      const k = Math.min(W * FILL_W / MEDIA_W, (H * FILL_H - font * LINE) / POST_H);
      el.sec.style.setProperty('--k', k.toFixed(4));
      el.sec.style.setProperty('--f', font + 'px');
      el.w = W;
    }

    // ---- the push-in, about the block's centre ----
    const z = Math.exp(Math.log(ZOOM[0]) + (Math.log(ZOOM[1]) - Math.log(ZOOM[0])) * (t / DUR));
    el.post.style.transform = `translate(-50%,-50%) scale(${z.toFixed(5)})`;

    // ---- the highlighter: the box's right edge in the words' own px, the dark letters clipped to it ----
    const hw = el.hl.offsetWidth;
    const pad = parseFloat(getComputedStyle(el.hl).fontSize) * MARK_PAD;
    const p = outCubic(seg(t, MARK[0], MARK[1]));
    const full = hw + 2 * pad;
    const edge = -pad + full * p;               // x of the box's leading edge, 0 = the "1"'s left side
    el.mk.style.width = (full * p).toFixed(2) + 'px';
    el.mk.style.visibility = p > 0 ? 'visible' : 'hidden';
    const cut = clamp(edge, 0, hw);
    el.dark.style.clipPath = `inset(0 ${(hw - cut).toFixed(2)}px 0 0)`;
    el.light.style.clipPath = `inset(0 0 0 ${cut.toFixed(2)}px)`;

    // ---- the clip follows t: it plays while the scene runs, and a frozen frame parks it on the frame t asks for ----
    const want = clamp(t - V0, 0, CLIP_END);
    const pill = clock(PILL_FROM - want);
    if (pill !== el.pillText) { el.pill.textContent = pill; el.pillText = pill; }
    const vid = el.vid;
    const live = lt >= V0 && lt < DUR && !document.body.classList.contains('freeze');
    if (live) {
      if (vid.paused) {
        const pr = vid.play();
        if (pr && pr.catch) pr.catch((e) => console.error('tweet.js: video.play() rejected', e));
      }
      if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
    } else {
      if (!vid.paused) vid.pause();
      if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
    }
  },
};
