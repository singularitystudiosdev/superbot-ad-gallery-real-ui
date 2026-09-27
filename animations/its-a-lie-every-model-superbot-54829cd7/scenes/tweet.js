// Act 1, the cold open: a creator's X post in dark mode, "I MADE THIS IN ONE PROMPT", @noahwachnik's voxel game clip
// playing muted in it, credited the way X credits a reposted video ("From @noahwachnik" under the media). The author is
// the series' fictional persona (Kai, @kaiships), not a real account. The post sits in a slice of the X timeline column.
// The camera opens on the whole post at FIT0 of the frame and pushes in onto its body (the text, the video and the counts)
// while the reply / repost / like / view counts tick up. On the last FREEZE seconds the clip freeze-frames and the
// whole frame glitches (a stepped RGB split and slice displacement, an SVG filter driven from t) into the hard cut to
// "ITS A LIE".
//
// render(lt) is a pure function of local time: the camera, the counts, the pill's countdown, the glitch and the clip's
// frame all come from lt. The clip is a real <video>: want = clamp(lt + CLIP_T0, 0, CLIP_END). A frozen frame (?t= puts
// body.freeze) pauses it and seeks to want; a playing frame plays it and only re-seeks past DRIFT_TOL of drift.
import { clamp, lerp, seg, inOutCubic, outCubic, rand } from '../lib.js';

const H = 1080;
const DUR = 4.2;
const bh = (f) => new URL('../img/bh/' + f, import.meta.url).href;
const img = (f) => new URL('../img/' + f, import.meta.url).href;
const CLIP = 'noah.mp4', POSTER = 'noah-poster.jpg';
const CLIP_LEN = 8;       // the clip's length: X's pill counts down what is left of it
const CLIP_END = 7.9;     // never seek onto the very last frame
const CLIP_T0 = 0.3;      // X autoplays muted: the clip is already running when the post comes up
const SEED_TOL = 0.04, DRIFT_TOL = 0.25;
const FIT0 = 0.8;         // the whole post fills this much of the frame at the open
const FIT1 = 0.9;         // the post's body (text, video, credit, counts) fills this much of the frame at the end
const PUSH = [0.2, 3.0];  // the push-in window (inOutCubic)
const CREEP = 1.02;       // the hold keeps drifting in this much by the end of the scene
const FREEZE = 0.28;      // the closing freeze-frame + glitch
const FRAME = 1 / 60;

const POST = {
  name: 'Kai', handle: '@kaiships', ago: '2h',
  text: 'I MADE THIS IN ONE PROMPT',
  from: '@noahwachnik',
};
// the counts tick from -> to across the scene (X's own short form: 214, 1.1K, 12K, 1.4M)
const COUNTS = { reply: [168, 231], repost: [880, 1340], like: [8120, 12460], views: [912000, 1420000] };

// X's own 24x24 icon paths (badge: 22x22)
const P = {
  badge: 'M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z',
  more: 'M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
  reply: 'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z',
  repost: 'M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z',
  like: 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.910-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.870-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z',
  views: 'M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z',
  bookmark: 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z',
  share: 'M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z',
};
const icon = (d, cls = 'tw-ic', vb = 24) => `<svg class="${cls}" viewBox="0 0 ${vb} ${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
// X's muted-video toggle: a speaker with a cross, white on the dark disc
const MUTE = '<svg class="tw-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="#fff"/><path d="M15.5 9.5l5 5m0-5l-5 5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';

const act = (k, withN = true) => `<div class="tw-act tw-act-${k}">${icon(P[k])}${withN ? '<span class="tw-n"></span>' : ''}</div>`;
// m:ss, what X's pill shows (the time left in the clip)
const clock = (s) => { const n = Math.max(0, Math.ceil(s - 1e-6)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
// X's short counts: 231, 1.3K, 12K, 1.4M
const short = (n) => {
  if (n < 1000) return String(Math.round(n));
  if (n < 10000) return (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'K';
  if (n < 1e6) return Math.floor(n / 1000) + 'K';
  return (Math.floor(n / 1e5) / 10).toFixed(1).replace(/\.0$/, '') + 'M';
};

// the closing glitch: a channel split plus a horizontal slice displacement, all attributes written from t
const GLITCH = `<svg class="tw-defs" width="0" height="0" aria-hidden="true"><filter id="tw-glitch" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
  <feTurbulence class="g-turb" type="fractalNoise" baseFrequency="0 0.06" numOctaves="1" seed="1" result="n"/>
  <feComponentTransfer in="n" result="nd"><feFuncR type="discrete" tableValues="0.5 0.5 0.1 0.9 0.5 0.3 0.5 0.8 0.5"/><feFuncG type="table" tableValues="0.5 0.5"/></feComponentTransfer>
  <feDisplacementMap class="g-disp" in="SourceGraphic" in2="nd" scale="0" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
  <feOffset class="g-r" in="r" dx="0" dy="0" result="ro"/>
  <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/>
  <feOffset class="g-gb" in="gb" dx="0" dy="0" result="gbo"/>
  <feBlend in="ro" in2="gbo" mode="screen"/>
</filter></svg>`;

let el = null;

// the post's geometry in the camera's design px (offsets ignore the camera transform)
function measure() {
  const off = (n) => { let x = 0, y = 0; while (n && n !== el.cam) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y }; };
  const p = off(el.post), m = off(el.main);
  return {
    post: { x: p.x, y: p.y, w: el.post.offsetWidth, h: el.post.offsetHeight },
    // the push lands on the post's body column: the text, the video, the credit and the ticking counts
    media: { x: m.x, y: m.y, w: el.main.offsetWidth, h: el.main.offsetHeight },
  };
}

export default {
  id: 'tweet',
  dur: DUR,

  mount(section) {
    section.innerHTML = `${GLITCH}
<div class="tw-fx">
<div class="tw-cam">
  <div class="tw-col">
    <article class="tw-post">
      <div class="tw-av"><img src="${img('avatar-kai.jpg')}" alt="" decoding="sync"/></div>
      <div class="tw-main">
        <div class="tw-head">
          <span class="tw-name">${POST.name}</span>${icon(P.badge, 'tw-badge', 22)}
          <span class="tw-handle">${POST.handle}</span><span class="tw-dot">·</span><span class="tw-ago">${POST.ago}</span>
          ${icon(P.more, 'tw-ic tw-more')}
        </div>
        <div class="tw-text">${POST.text}</div>
        <div class="tw-media">
          <video class="tw-vid" muted playsinline preload="auto" poster="${bh(POSTER)}" src="${bh(CLIP)}"></video>
          <span class="tw-pill">${clock(CLIP_LEN)}</span>
          <span class="tw-mute">${MUTE}</span>
        </div>
        <div class="tw-from">From <span class="tw-from-h">${POST.from}</span></div>
        <div class="tw-acts">
          ${act('reply')}${act('repost')}${act('like')}${act('views')}
          <div class="tw-act-end">${act('bookmark', false)}${act('share', false)}</div>
        </div>
      </div>
    </article>
  </div>
</div>
</div>`;
    const q = (s) => section.querySelector(s);
    el = {
      sec: section, fx: q('.tw-fx'), cam: q('.tw-cam'), post: q('.tw-post'), main: q('.tw-main'), media: q('.tw-media'), vid: q('.tw-vid'),
      pill: q('.tw-pill'), pillText: '',
      n: Object.fromEntries(Object.keys(COUNTS).map((k) => [k, q(`.tw-act-${k} .tw-n`)])), nText: {},
      turb: q('.g-turb'), disp: q('.g-disp'), gr: q('.g-r'), ggb: q('.g-gb'), fxOn: null,
    };
    // the muted content attribute does not set the muted IDL property, and an unmuted video cannot start on its own
    el.vid.muted = true;
    el.vid.defaultMuted = true;
    // the timeline only renders the active scene: once it moves on, park the clip instead of decoding it off screen
    new MutationObserver(() => { if (!section.classList.contains('on') && !el.vid.paused) el.vid.pause(); })
      .observe(section, { attributes: true, attributeFilter: ['class'] });
  },

  render(lt, ctx) {
    if (!el) return;
    const t = clamp(lt, 0, DUR);
    const W = (ctx && ctx.W) || 1920;
    const g = measure();
    if (!g.post.h || !g.media.w) return;

    // camera: the whole post at FIT0 of the frame, pushing in until the post's body column is FIT1 of the frame; scale eases geometrically so the push reads as one steady move
    const s0 = FIT0 * Math.min(W / g.post.w, H / g.post.h);
    const s1 = FIT1 * Math.min(W / g.media.w, H / g.media.h);
    const f = inOutCubic(seg(t, PUSH[0], PUSH[1]));
    const s = s0 * Math.pow(s1 / s0, f) * lerp(1, CREEP, seg(t, PUSH[1], DUR));
    const fx = lerp(g.post.x + g.post.w / 2, g.media.x + g.media.w / 2, f);
    const fy = lerp(g.post.y + g.post.h / 2, g.media.y + g.media.h / 2, f);
    el.cam.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${s.toFixed(5)}) translate(${(-fx).toFixed(2)}px,${(-fy).toFixed(2)}px)`;

    // the counts tick up (eased, so the first second moves fastest)
    const c = outCubic(seg(t, 0, DUR - FREEZE));
    for (const k of Object.keys(COUNTS)) {
      const [a, b] = COUNTS[k];
      const txt = short(lerp(a, b, c));
      if (el.nText[k] !== txt) { el.n[k].textContent = txt; el.nText[k] = txt; }
    }

    // the clip follows t, and freeze-frames for the glitch
    const fz = DUR - FREEZE;
    const want = clamp(Math.min(t, fz) + CLIP_T0, 0, CLIP_END);
    const pill = clock(CLIP_LEN - want);
    if (pill !== el.pillText) { el.pill.textContent = pill; el.pillText = pill; }
    const vid = el.vid;
    const live = lt >= 0 && t < fz && !document.body.classList.contains('freeze');
    if (live) {
      if (vid.paused) {
        const p = vid.play();
        if (p && p.catch) p.catch((e) => { if (e && e.name !== 'AbortError') console.error('tweet.js: video.play() rejected', e); });
      }
      if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
    } else {
      if (!vid.paused) vid.pause();
      if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
    }

    // the glitch: stepped every 2 frames, growing into the cut (a still frame keeps its own step)
    const on = t >= fz;
    if (on !== el.fxOn) { el.fx.style.filter = on ? 'url(#tw-glitch)' : 'none'; el.fxOn = on; }
    if (on) {
      const k = Math.floor((t - fz) / (2 * FRAME));
      const amp = lerp(0.35, 1, seg(t, fz, DUR));
      const r = rand(k * 13 + 5), r2 = rand(k * 29 + 11);
      el.turb.setAttribute('seed', String(1 + (k % 9)));
      el.turb.setAttribute('baseFrequency', `0 ${(0.02 + 0.05 * r).toFixed(3)}`);
      el.disp.setAttribute('scale', (amp * (60 + 90 * r2)).toFixed(1));
      const d = amp * (8 + 14 * r);
      el.gr.setAttribute('dx', d.toFixed(1));
      el.ggb.setAttribute('dx', (-d).toFixed(1));
      el.fx.style.transform = `translate(${((r2 - 0.5) * 30 * amp).toFixed(1)}px, ${((r - 0.5) * 10 * amp).toFixed(1)}px) scale(${(1 + 0.03 * amp).toFixed(4)})`;
    } else if (el.fx.style.transform) el.fx.style.transform = '';
  },
};
