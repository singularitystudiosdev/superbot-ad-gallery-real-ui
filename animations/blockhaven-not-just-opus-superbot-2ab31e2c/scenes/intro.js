// Acts 1 and 2, the hook: Noah Wachnik's real X post ("Opus 5.5, The Minecraft Test.", Sep 22 2026, his own video of
// the result playing in it) in dark mode, then the viewer mines it like a Minecraft block.
//   0.0 to 2.3  the post tight in frame (0.90 to 0.95 of its height), its video playing at 1x, the camera pushing in
//   0.5         the HUD comes on: a white crosshair at frame centre
//   1.2 to 2.3  ten hits: Minecraft's destroy_stage_0..9 cracks spreading over the post's video from the
//               crosshair, a jolt on each hit
//   2.3 to 2.7  the post shatters into square particles coloured from the post itself (the video's own frame under
//               the media, the post's dark-mode palette elsewhere), falling under gravity and gone by the hard cut
// The post is laid out at X's own px (600px column, 15px/20px text; ported from pocketsflow-untold's tweet.js) and the
// camera scales it. render(lt) is a pure function of local time: camera, cracks, particles and the clip's frame all
// come from lt. The clip is a real <video> played at 1x from its first frame (the post is up for 2.3 s of its 3.6 s):
// want = min(lt, CLIP_END); a frozen frame (?t= puts body.freeze) pauses and seeks to want, a playing frame plays and
// only re-seeks past DRIFT_TOL.
import { clamp, seg, inOutCubic, outCubic } from '../lib.js';

const H = 1080;
const g = (f) => new URL('../gen/' + f, import.meta.url).href;
const im = (f) => new URL('../img/' + f, import.meta.url).href;

export const INTRO = {
  DUR: 2.7,          // hard cut to the first text card
  HUD: 0.5,          // crosshair on
  MINE: 1.2,         // first hit
  HIT: 0.11,         // one crack stage per hit
  SHATTER: 2.3,      // 1.2 + 10 * 0.11
};
const CLIP_END = 3.55;            // the footage's last frame (gen/noah.mp4 is 3.6 s)
const SEED_TOL = 0.04, DRIFT_TOL = 0.25;
const FIT0 = 0.90, FIT1 = 0.95;   // the post's height as a share of the frame, at the open and the end of the push
const CY = H / 2;                 // the post's centre line: the frame's
const N_PART = 60;
const CRACK_TILES = 5;            // crack texture repeats across the video's width (one texel ~10 frame px)

// the post as it stands on X (counts as X abbreviates them: 5,266 likes shows 5.2K, 500,554 views 500K)
const POST = {
  name: 'Noah Wachnik', handle: '@noahwachnik', ago: 'Sep 22',
  text: 'Opus 5.5, The Minecraft Test.<br><br>By far the most INSANE result I’ve ever seen from an LLM. Almost better than actual Minecraft... But in my browser.<br><br>More below',
  counts: { reply: '122', repost: '157', like: '5.2K', views: '500K' },
};

// X's own 24x24 icon paths (badge: 22x22)
const P = {
  badge: 'M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z',
  more: 'M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
  reply: 'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.130 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z',
  repost: 'M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.140 1.364-1.460 2.068 1.930V8c0-1.1-.896-2-2-2z',
  like: 'M16.697 5.5c-1.222-.06-2.679.51-3.890 2.160l-.805 1.090-.806-1.090C9.984 6.010 8.526 5.440 7.304 5.500c-1.243.070-2.349.780-2.910 1.910-.552 1.120-.633 2.780.479 4.820 1.074 1.970 3.257 4.270 7.129 6.610 3.870-2.340 6.052-4.640 7.126-6.610 1.111-2.040 1.030-3.700.477-4.820-.561-1.130-1.666-1.840-2.908-1.910zm4.187 7.690c-1.351 2.480-4.001 5.120-8.379 7.670l-.503.300-.504-.300c-4.379-2.550-7.029-5.190-8.382-7.670-1.360-2.500-1.410-4.860-.514-6.670.887-1.790 2.647-2.910 4.601-3.010 1.651-.090 3.368.560 4.798 2.010 1.429-1.450 3.146-2.100 4.796-2.010 1.954.100 3.714 1.220 4.601 3.010.896 1.810.846 4.170-.514 6.670z',
  views: 'M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z',
  bookmark: 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z',
  share: 'M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z',
};
const icon = (d, cls = 'tw-ic', vb = 24) => `<svg class="${cls}" viewBox="0 0 ${vb} ${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
const MUTE = '<svg class="tw-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="#fff"/><path d="M15.5 9.5l5 5m0-5l-5 5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
const act = (k, n) => `<div class="tw-act tw-act-${k}">${icon(P[k])}${n ? `<span class="tw-n">${n}</span>` : ''}</div>`;

// deterministic noise: the same particle and the same jolt on every render of the same lt
const hash = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

let el = null;

function measure() {
  const off = (n) => { let x = 0, y = 0; while (n && n !== el.cam) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y }; };
  const p = off(el.post), m = off(el.media);
  return {
    post: { x: p.x, y: p.y, w: el.post.offsetWidth, h: el.post.offsetHeight },
    media: { x: m.x, y: m.y, w: el.media.offsetWidth, h: el.media.offsetHeight },
  };
}

// the camera at lt: scale s and the post-space point (fx, fy) that sits at frame (W/2, CY)
function camera(lt, W, gm) {
  const fit = (k) => k * Math.min(H / gm.post.h, W / gm.post.w);
  const f = inOutCubic(seg(lt, 0, INTRO.SHATTER));
  const s = fit(FIT0) * Math.pow(fit(FIT1) / fit(FIT0), f);
  return { s, fx: gm.post.x + gm.post.w / 2, fy: gm.post.y + gm.post.h / 2 };
}

// particle colours: under the media from the clip's own last frame (gen/noah-last.png, 64x36), elsewhere from the
// post's dark-mode palette in the proportions the post shows (background, body text, secondary grey, the badge blue)
function paint(gm) {
  const cols = [];
  const pal = ['#000000', '#0b0c0e', '#16181c', '#000000', '#0b0c0e', '#16181c', '#e7e9ea', '#e7e9ea', '#e7e9ea', '#e7e9ea',
    '#71767b', '#71767b', '#2f3336', '#2f3336', '#e7e9ea', '#1d9bf0'];
  for (let i = 0; i < N_PART; i++) {
    const u = (i % 10 + hash(i, 1)) / 10, v = (Math.floor(i / 10) + hash(i, 2)) / Math.ceil(N_PART / 10);
    const px = gm.post.x + u * gm.post.w, py = gm.post.y + v * gm.post.h;
    const mu = (px - gm.media.x) / gm.media.w, mv = (py - gm.media.y) / gm.media.h;
    let c = pal[Math.floor(hash(i, 3) * pal.length)];
    if (mu >= 0 && mu < 1 && mv >= 0 && mv < 1 && el.sample) {
      const sx = Math.floor(mu * 64), sy = Math.floor(mv * 36), d = el.sample;
      const o = (sy * 64 + sx) * 4;
      c = `rgb(${d[o]},${d[o + 1]},${d[o + 2]})`;
    }
    cols.push({ u, v, c });
  }
  return cols;
}

export default {
  id: 'intro',
  dur: INTRO.DUR,

  mount(section) {
    const c = POST.counts;
    // the ten destroy stages, laid inside the video's rounded rect (the block the crosshair is on), so the post's
    // text stays clean until the shatter. They tile at block size (CRACK_TILES across the video, one tile centred on
    // the crosshair) so each line is one thin texel, and a radial mask spreads them out from the crosshair per hit
    const cracks = Array.from({ length: 10 }, (_, i) => `<i class="in-crack" data-i="${i}" style="background-image:url('${g('crack/destroy_stage_' + i + '.png')}')"></i>`).join('');
    section.innerHTML = `
<div class="tw-cam">
  <div class="tw-col">
    <article class="tw-post">
      <div class="tw-av"><img src="${im('noah-avatar.jpg')}" alt="" decoding="sync"/></div>
      <div class="tw-main">
        <div class="tw-head">
          <span class="tw-name">${POST.name}</span>${icon(P.badge, 'tw-badge', 22)}
          <span class="tw-handle">${POST.handle}</span><span class="tw-dot">·</span><span class="tw-ago">${POST.ago}</span>
          ${icon(P.more, 'tw-ic tw-more')}
        </div>
        <div class="tw-text">${POST.text}</div>
        <div class="tw-media">
          <video class="tw-vid" muted playsinline preload="auto" poster="${g('noah-poster.jpg')}" src="${g('noah.mp4')}"></video>
          <div class="in-cracks">${cracks}</div>
          <span class="tw-mute">${MUTE}</span>
        </div>
        <div class="tw-acts">
          ${act('reply', c.reply)}${act('repost', c.repost)}${act('like', c.like)}${act('views', c.views)}
          <div class="tw-act-end">${act('bookmark')}${act('share')}</div>
        </div>
      </div>
    </article>
  </div>
  <div class="in-parts">${Array.from({ length: N_PART }, () => '<i></i>').join('')}</div>
</div>
<div class="in-xhair"></div>`;
    const q = (s) => section.querySelector(s);
    el = {
      sec: section, cam: q('.tw-cam'), col: q('.tw-col'), post: q('.tw-post'), media: q('.tw-media'), vid: q('.tw-vid'),
      crackBox: q('.in-cracks'), cracks: [...section.querySelectorAll('.in-crack')], parts: [...section.querySelectorAll('.in-parts i')],
      xhair: q('.in-xhair'), sample: null, cols: null, lastStage: -2,
    };
    el.vid.muted = true;
    el.vid.defaultMuted = true;
    new MutationObserver(() => { if (!section.classList.contains('on') && !el.vid.paused) el.vid.pause(); })
      .observe(section, { attributes: true, attributeFilter: ['class'] });
    // the clip's last frame, read once for the particle colours
    const s = new Image();
    s.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 36;
      const x = cv.getContext('2d');
      x.drawImage(s, 0, 0, 64, 36);
      el.sample = x.getImageData(0, 0, 64, 36).data;
      el.cols = null;
    };
    s.src = g('noah-last.png');
  },

  render(lt, ctx) {
    if (!el) return;
    const t = clamp(lt, 0, INTRO.DUR);
    const W = (ctx && ctx.W) || 1920;
    const gm = measure();
    if (!gm.post.h || !gm.media.w) return;
    const cam = camera(Math.min(t, INTRO.SHATTER), W, gm);

    // a jolt on every hit: a small offset and a scale punch that die out in 60 ms
    const hit = t >= INTRO.MINE && t < INTRO.SHATTER ? Math.floor((t - INTRO.MINE) / INTRO.HIT) : -1;
    let jx = 0, jy = 0, js = 1;
    if (hit >= 0) {
      const age = t - (INTRO.MINE + hit * INTRO.HIT);
      const d = Math.exp(-age / 0.03);
      jx = (hash(hit, 7) - 0.5) * 16 * d;
      jy = (hash(hit, 8) - 0.5) * 12 * d;
      js = 1 - 0.012 * d;
    }
    const s = cam.s * js;
    el.cam.style.transform = `translate(${(W / 2 + jx).toFixed(2)}px,${(CY + jy).toFixed(2)}px) scale(${s.toFixed(5)}) translate(${(-cam.fx).toFixed(2)}px,${(-cam.fy).toFixed(2)}px)`;

    // cracks: stage n from hit n, until the post breaks
    const gone = t >= INTRO.SHATTER;
    const stage = gone ? -1 : hit;
    if (stage !== el.lastStage) {
      el.cracks.forEach((n) => { n.style.visibility = +n.dataset.i === stage ? 'visible' : 'hidden'; });
      if (stage >= 0) {
        // the crosshair's point inside the video (frame centre -> post px -> media px), one tile centred on it
        const mx = gm.post.x + gm.post.w / 2 - gm.media.x;
        const my = gm.post.y + gm.post.h / 2 + (H / 2 - CY) / cam.s - gm.media.y;
        const T = gm.media.w / CRACK_TILES;
        const pos = `${(mx - T / 2).toFixed(2)}px ${(my - T / 2).toFixed(2)}px`;
        el.cracks.forEach((n) => { n.style.backgroundSize = `${T.toFixed(2)}px ${T.toFixed(2)}px`; n.style.backgroundPosition = pos; });
        // the cracked area grows out from the crosshair with each hit: solid inside r0, gone by r1
        const r1 = gm.media.w * (0.18 + 0.045 * stage), r0 = r1 * 0.4; // stage 9 still thins out at the video's sides
        const m = `radial-gradient(circle at ${mx.toFixed(1)}px ${my.toFixed(1)}px, #000 ${r0.toFixed(1)}px, transparent ${r1.toFixed(1)}px)`;
        el.crackBox.style.webkitMaskImage = m;
        el.crackBox.style.maskImage = m;
      }
      el.lastStage = stage;
    }
    el.col.style.visibility = gone ? 'hidden' : 'visible';

    // crosshair
    el.xhair.style.opacity = seg(t, INTRO.HUD, INTRO.HUD + 0.15).toFixed(3);

    // particles: square chips of the post thrown out from where they sat, then gravity; they shrink and go
    const pt = t - INTRO.SHATTER;
    if (gone && !el.cols) el.cols = paint(gm);
    el.parts.forEach((n, i) => {
      if (!gone || pt > 0.4) { n.style.visibility = 'hidden'; return; }
      const c = el.cols[i];
      const x0 = gm.post.x + c.u * gm.post.w, y0 = gm.post.y + c.v * gm.post.h;
      const cx = gm.post.x + gm.post.w / 2, cy = gm.post.y + gm.post.h / 2;
      const vx = (x0 - cx) * (1.5 + hash(i, 4) * 1.5) + (hash(i, 5) - 0.5) * 220;
      const vy = (y0 - cy) * (1.1 + hash(i, 6) * 1.0) - 520 - hash(i, 9) * 340;
      const x = x0 + vx * pt, y = y0 + vy * pt + 0.5 * 4400 * pt * pt;
      const life = 0.26 + hash(i, 10) * 0.1; // every chip gone by 0.36 s, before the hard cut at 2.7
      const k = 1 - outCubic(seg(pt, life * 0.5, life));
      const sz = (14 + hash(i, 11) * 16) * k;
      n.style.visibility = k > 0.01 ? 'visible' : 'hidden';
      n.style.background = c.c;
      n.style.transform = `translate(${(x - sz / 2).toFixed(1)}px,${(y - sz / 2).toFixed(1)}px)`;
      n.style.width = n.style.height = sz.toFixed(1) + 'px';
    });

    // the clip follows t
    const want = clamp(t, 0, CLIP_END);
    const vid = el.vid;
    const live = lt >= 0 && lt < INTRO.SHATTER && !document.body.classList.contains('freeze');
    if (live) {
      vid.playbackRate = 1;
      if (vid.paused) {
        const p = vid.play();
        if (p && p.catch) p.catch((e) => { if (e.name !== 'AbortError') console.error('intro.js: video.play() rejected', e); });
      }
      if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
    } else {
      if (!vid.paused) vid.pause();
      if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
    }
  },
};
