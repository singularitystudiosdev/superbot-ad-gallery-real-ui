// Act 1, the hook: an X post in X's dark post-detail layout, "I made this in 1 prompt" by a FICTIONAL creator
// (Jules Park, @julesbuilds: no real person's words are put in anyone's mouth), with the Pocketsflow promo posted
// by @achxvi playing in its video card (img/tweet/pf-clip.mp4: source 2.0s to 8.2s, so the scene opens on "Got
// something to sell?" and "a store in minutes." reads at lt 4.4 to 4.9, just before the crash zoom).
//
// The post is laid out at X's own px (a 600px column, 17px post text, 568px media) and a camera div scales it:
//   open   the whole post (header to action bar) at FIT0 of the frame height, clamped to FITW of the width;
//   push   a continuous push toward the video's centre, gentle start (log scale, f(x) = x - sin(pi x)/pi, whose
//          slope is 0 at the start and 2 at the end), reaching ~2.1x of the open by lt 4.9 on 16x9 / 4x3 (capped
//          on 1x1 / 4x5 so the video is at most PUSH_W of the frame width until the crash);
//   crash  over the last CRASH seconds the push keeps its speed and a cubic term takes the video to nearly filling
//          the frame at lt 5.5, where the timeline hard-cuts (fadeOut 0) to the black word card.
// render(lt) is a pure function of lt. The clip is a real <video> driven like beats/play.js:
// want = clamp(lt - V0, 0, CLIP_END); inside the scene it plays and only re-seeks past DRIFT_TOL of drift;
// a frozen frame (?t= puts body.freeze) pauses it and seeks to want. X's duration pill counts down from 0:15.
import { clamp, lerp, seg, inOutCubic } from '../lib.js';

const H = 1080;
const DUR = 5.5;
const img = (f) => new URL('../img/tweet/' + f, import.meta.url).href;
const CLIP = 'pf-clip.mp4', POSTER = 'pf-poster.jpg', AVATAR = 'avatar-jules.jpg';
const V0 = 0;             // the clip is already playing when the post comes up (X autoplays muted)
const CLIP_END = 6.1;     // the trim is 6.2s: never seek onto the very last frame
const PILL_FROM = 15;     // the pill counts down from 0:15 (the source video's length)
const SEED_TOL = 0.04, DRIFT_TOL = 0.25;

// camera
const FIT0 = 0.62;        // the whole post is this much of the frame height at the open
const FITW = 0.9;         // ...but never wider than this much of the frame width (narrow ratios)
const PUSH0 = 0.1;        // the push starts here
const CRASH = 0.45;       // the crash zoom: the last CRASH seconds
const PUSH_K = 2.5;       // the push reaches PUSH_K x the open scale when the crash starts...
const CRASH_K = 1.25;     // ...unless that leaves the crash less than CRASH_K x to go,
const PUSH_W = 1.05;      // ...and never past the video being PUSH_W of the frame width (so on 1x1 / 4x5 the whole
                          // video, "a store in minutes." included, still reads before the crash crops it)
const END_FILL = 1.0;     // at lt 5.5 the video is END_FILL of the frame (contain) or
const END_COVER = 0.92;   // END_COVER of cover, whichever is larger (portrait ratios crop the video's sides)
const FOCUS = [0.2, 3.6]; // the camera's aim moves from the post's centre to the video's centre

const POST = {
  name: 'Jules Park', handle: '@julesbuilds',
  text: 'I made this in 1 prompt',
  time: '9:41 PM', date: 'Sep 26, 2026', views: '2.4M',
  counts: { reply: '1.2K', repost: '4.8K', like: '31K', bookmark: '2.9K' },
};

// X's own 24x24 icon paths
const P = {
  back: 'M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z',
  more: 'M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
  reply: 'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z',
  repost: 'M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z',
  like: 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z',
  bookmark: 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z',
  share: 'M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z',
  mute: 'M15 1.06v21.88L6.68 17H2V7h4.68L15 1.06zM4 9v6h3.32L13 18.94V5.06L7.32 9H4zm16.19 3l2.4 2.41-1.41 1.42L18.77 13.4l-2.41 2.43-1.42-1.42L17.35 12l-2.41-2.4 1.42-1.42 2.41 2.4 2.4-2.4 1.41 1.42L20.19 12z',
};
const icon = (d, cls = 'tw-ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const act = (k, n) => `<div class="tw-act tw-act-${k}">${icon(P[k])}${n ? `<span class="tw-n">${n}</span>` : ''}</div>`;
// m:ss, what X's pill shows (the time left)
const clock = (s) => { const n = Math.max(0, Math.ceil(s - 1e-6)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

// the push's shape: slope 0 at x = 0, slope 2 at x = 1, f(0) = 0, f(1) = 1
const pushF = (x) => x - Math.sin(Math.PI * x) / Math.PI;

let el = null;

function measure() {
  const off = (n) => { let x = 0, y = 0; while (n && n !== el.cam) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y }; };
  const p = off(el.post), m = off(el.media);
  return {
    post: { x: p.x, y: p.y, w: el.post.offsetWidth, h: el.post.offsetHeight },
    media: { x: m.x, y: m.y, w: el.media.offsetWidth, h: el.media.offsetHeight },
  };
}

// log scale of the camera at lt: the push (C1-continuous) into the crash
function camScale(lt, W, g) {
  const s0 = Math.min(FIT0 * H / g.post.h, FITW * W / g.post.w);
  const contain = Math.min(W / g.media.w, H / g.media.h);
  const cover = Math.max(W / g.media.w, H / g.media.h);
  const sE = Math.max(END_FILL * contain, END_COVER * cover);
  const s1 = Math.max(s0 * 1.2, Math.min(PUSH_K * s0, sE / CRASH_K, PUSH_W * W / g.media.w));
  const L0 = Math.log(s0), L1 = Math.log(s1), LE = Math.log(sE);
  const tc = DUR - CRASH, span = tc - PUSH0;
  if (lt <= tc) return Math.exp(L0 + (L1 - L0) * pushF(seg(lt, PUSH0, tc)));
  // the crash: keep the push's end speed v and add a cubic so it lands on LE at DUR
  const v = (L1 - L0) * 2 / span, d = lt - tc;
  const c = Math.max(0, (LE - L1 - v * CRASH) / (CRASH * CRASH * CRASH));
  return Math.exp(L1 + v * d + c * d * d * d);
}

export default {
  id: 'tweet',
  dur: DUR,
  fadeIn: 0.2,
  fadeOut: 0,

  mount(section) {
    const c = POST.counts;
    section.innerHTML = `
<div class="tw-cam">
  <div class="tw-col">
    <div class="tw-post">
      <div class="tw-bar">${icon(P.back, 'tw-ic tw-back')}<span class="tw-bar-t">Post</span></div>
      <article class="tw-art">
        <div class="tw-head">
          <div class="tw-av"><img src="${img(AVATAR)}" alt="" decoding="sync"/></div>
          <div class="tw-who"><span class="tw-name">${POST.name}</span><span class="tw-handle">${POST.handle}</span></div>
          ${icon(P.more, 'tw-ic tw-more')}
        </div>
        <div class="tw-text">${POST.text}</div>
        <div class="tw-media">
          <video class="tw-vid" muted playsinline preload="auto" poster="${img(POSTER)}" src="${img(CLIP)}"></video>
          <span class="tw-pill">${clock(PILL_FROM)}</span>
          <span class="tw-mute">${icon(P.mute)}</span>
        </div>
        <div class="tw-meta"><span>${POST.time}</span><span class="tw-dot">·</span><span>${POST.date}</span><span class="tw-dot">·</span><span><b>${POST.views}</b> Views</span></div>
        <div class="tw-acts">${act('reply', c.reply)}${act('repost', c.repost)}${act('like', c.like)}${act('bookmark', c.bookmark)}${act('share')}</div>
      </article>
    </div>
  </div>
</div>`;
    const q = (s) => section.querySelector(s);
    el = { sec: section, cam: q('.tw-cam'), post: q('.tw-post'), media: q('.tw-media'), vid: q('.tw-vid'), pill: q('.tw-pill'), pillText: '' };
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
    // measured every frame (transform-free offsets, cheap): the stylesheet is linked, not awaited, by timeline.js,
    // so a geometry cached at mount could predate it
    const g = measure();
    if (!g.post.h || !g.media.w) return;

    // camera: translate the aim point to the frame centre, then scale about it
    const s = camScale(t, W, g);
    const f = inOutCubic(seg(t, FOCUS[0], FOCUS[1]));
    const fx = lerp(g.post.x + g.post.w / 2, g.media.x + g.media.w / 2, f);
    const fy = lerp(g.post.y + g.post.h / 2, g.media.y + g.media.h / 2, f);
    el.cam.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${s.toFixed(5)}) translate(${(-fx).toFixed(2)}px,${(-fy).toFixed(2)}px)`;

    // the clip follows t: it plays while the scene runs, and a frozen frame parks it on the frame t asks for
    const want = clamp(t - V0, 0, CLIP_END);
    const pill = clock(PILL_FROM - want);
    if (pill !== el.pillText) { el.pill.textContent = pill; el.pillText = pill; }
    const vid = el.vid;
    const live = lt >= V0 && lt < DUR && !document.body.classList.contains('freeze');
    if (live) {
      if (vid.paused) {
        const p = vid.play();
        if (p && p.catch) p.catch((e) => console.error('tweet.js: video.play() rejected', e));
      }
      if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
    } else {
      if (!vid.paused) vid.pause();
      if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
    }
  },
};
