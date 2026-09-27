// The intro, the cold open (no Superbot yet): the real @bridgemindai post that started it all, then a VHS rewind
// of its own video back to the title screen, and a CRT power-off into the "One prompt. Every model." card.
//
//   0.0-0.5  the X post card (dark theme, verbatim text, real avatar and stats) rises in on black
//   0.3-3.3  its video plays real footage (img/intro/fwd.mp4, source 37.7-40.7s: Wario's overtake, a boost, side by side)
//   0.9-1.3  the camera pushes in on the first line until it spans ~70% of the frame width (the header may crop)
//   1.3-1.9  a highlighter sweeps under ONE SHOT while it is big; hold to 2.2
//   2.2-3.0  glide down and out: the video fills ~70% of the frame width, the date and action rows still in frame
//   3.3      the video freezes, the VCR OSD flashes a pause glyph
//   3.5-5.4  REWIND: img/intro/rew.mp4 (57 eased frames from source 40.67s back to the title screen at 0.4s), the
//            timecode counts the source time down, the stats roll back to 0, and over 3.8-4.6 the camera zooms until
//            the video fills the frame while the post chrome falls away. VHS look (CSS only, all from lt): tracking
//            bands drifting down, scanlines, a red/cyan channel split and mild desaturation on the video
//   5.4-5.9  STOP on the TURBO KART RALLY title frame, 0:00
//   5.9-6.5  CRT power-off: squash to a bright line, shrink to a dot, black
//
// render(lt) is a pure function of lt. Both videos are real <video>s synced like clip.js: a frozen frame (body.freeze)
// or any lt outside a clip's play window pauses it and seeks to the wanted time; live playback plays and re-seeks
// only on drift. rew.mp4 is all-intra (-g 1) and plays linearly, so live playback and frozen seeks agree.
//
// Coordinates: the post is laid out once at a fixed WORLD size (CW px wide, X's detail view at about 2x) and a
// camera (translate + scale on .ix-world) frames it, so narrower frames only change the camera, never the layout.
// The VCR overlay (OSD, timecode, bands, scanlines) lives in SCREEN space over the video's on-screen rect.
import { clamp, lerp, seg, outCubic, outQuint, inOutCubic, rand } from '../lib.js';

const H = 1080;
const img = (f) => new URL('../img/intro/' + f, import.meta.url).href;

// ---------- the post (verbatim, https://x.com/bridgemindai/status/2102451997395866021) ----------
const PARAS = [
  'Claude Opus 5.5 just <span class="ix-hl">ONE SHOT</span> a Mario Kart game.',
  'The result is way better than Fable 5.1. The attention to detail is on another level.',
  'Opus 5.5 actually created real characters. Mario, Luigi, in the game, playable. Fable 5.1 has never done that.',
  'Insanely impressed. This model is different.',
];
const STATS = { views: 369612, replies: 177, reposts: 220, likes: 3623, bookmarks: 1018 };

// ---------- timing (seconds, local) ----------
const RISE = [0, 0.5];
const FWD_AT = 0.3, FWD_N = 90;                  // fwd.mp4: 90 frames at 30fps, source 37.7 + i/30
const FWD_END = (FWD_N - 1) / 30;                // 2.9667: the last frame (source 40.667s)
const FREEZE = 3.3;
const HL = [1.3, 1.9];
const REW = [3.5, 5.4];
const REW_N = 57, REW_END = (REW_N - 1) / 30;    // rew.mp4: 57 frames, the last one starts at 1.8667
const STATS_ROLL = [3.5, 4.1];
const ZOOM = [3.8, 4.6];
const CHROME_OUT = [3.9, 4.6];
const STOP = 5.4;
const CRT = { squash: [5.9, 6.12], shrink: [6.12, 6.36], fade: [6.3, 6.5] };
const DUR = 6.8;

// the rewind's source times: s_i = S1 - (S1 - S0) * inOutQuad(i / 56), exactly the frames rew.mp4 was built from
const S1 = 37.7 + (FWD_N - 1) / 30, S0 = 0.4;
const inOutQuad = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const srcAt = (i) => S1 - (S1 - S0) * inOutQuad(clamp(i, 0, REW_N - 1) / (REW_N - 1));

// ---------- world / camera ----------
const CW = 1190;              // the post's world width: 62% of a 16:9 frame
const FIT_MY = 22;            // opening fit: this much black above and below the card at least
const FIT_MX = 0.04;          // and this fraction of W each side
const LINE_W = 0.7;           // the hook shot: the first text line spans this fraction of the frame width
const VID_W = 0.7;            // the video shot: the video spans this fraction of the frame width
const KEEP_BOTTOM = 14;       // the video shot keeps the action row's bottom this far inside the frame (the stats roll there)
const CAM_LINE = [0.9, 1.3];  // fit -> the first line
const CAM_VID = [2.2, 3.0];   // the first line -> the video with its date and action rows
const MEDIA_A = 2098 / 1080;  // the post video's aspect

// sync tolerances (clip.js)
const SEED_TOL = 0.012, DRIFT_TOL = 0.25;

const ICON = {
  x: '<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  badge: '<svg viewBox="0 0 22 22"><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>',
  reply: '<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg>',
  repost: '<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>',
  like: '<svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg>',
};

// X's compact counts: 177, 3.6K, 369.6K, 1K
function fmt(n) {
  n = Math.max(0, Math.round(n));
  if (n < 1000) return String(n);
  if (n < 1e6) return (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'K';
  return (Math.floor(n / 1e5) / 10).toFixed(1).replace(/\.0$/, '') + 'M';
}
// the source timecode, m:ss (the title frame at 0.4s reads 0:00)
const tc = (s) => { const k = Math.max(0, Math.floor(s)); return `${Math.floor(k / 60)}:${String(k % 60).padStart(2, '0')}`; };
const inCubic = (x) => x * x * x;

let el = null;

function muteVid(vid) { vid.muted = true; vid.defaultMuted = true; }
// want: the clip time this frame shows; playing: lt is inside the clip's play window
function sync(vid, want, playing) {
  const live = playing && !document.body.classList.contains('freeze');
  if (live) {
    if (vid.paused) {
      const p = vid.play();
      if (p && p.catch) p.catch((err) => console.error('intro.js: video.play() rejected', err));
    }
    if (Math.abs(vid.currentTime - want) > DRIFT_TOL) vid.currentTime = want;
  } else {
    if (!vid.paused) vid.pause();
    if (Math.abs(vid.currentTime - want) > SEED_TOL) vid.currentTime = want;
  }
}

// layout boxes in world px (offset chains ignore transforms, so the camera and the rise never disturb them)
function measure() {
  const off = (n) => { let x = 0, y = 0; while (n && n !== el.post) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y }; };
  const box = (n) => { const o = off(n); return { x: o.x, y: o.y, w: n.offsetWidth, h: n.offsetHeight }; };
  const ch = el.post.offsetHeight;
  el.g = { ch, media: box(el.media), text: box(el.text), line: box(el.line), key: ch };
}

// a framing is { s, fx, fy }: world point (fx, fy) sits at the frame centre at scale s
function framings(W) {
  const g = el.g, m = g.media;
  const s0 = Math.min((H - 2 * FIT_MY) / g.ch, (W * (1 - 2 * FIT_MX)) / CW);
  const A = { s: s0, fx: CW / 2, fy: g.ch / 2 };
  // the hook: the first line ("Claude Opus 5.5 just ONE SHOT a Mario Kart game.") centred at LINE_W of the frame
  const L = { s: (LINE_W * W) / g.line.w, fx: g.line.x + g.line.w / 2, fy: g.line.y + g.line.h / 2 };
  // the video at VID_W of the frame, centred on video + date + action rows, the action row never leaving the frame
  const sV = (VID_W * W) / m.w;
  const V = { s: sV, fx: m.x + m.w / 2, fy: Math.max((m.y + g.ch) / 2, g.ch - (H / 2 - KEEP_BOTTOM) / sV) };
  // the video fills the frame: cover at 16:9 / 4:3; narrower frames crop at most a third of its width
  const vt = Math.max(W, Math.min(H * MEDIA_A, 1.5 * W));
  const F = { s: vt / m.w, fx: m.x + m.w / 2, fy: m.y + m.h / 2 };
  return { A, L, V, F };
}
const mix = (a, b, e) => ({ s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), e)), fx: lerp(a.fx, b.fx, e), fy: lerp(a.fy, b.fy, e) });

export default {
  id: 'intro',
  dur: DUR,

  mount(section) {
    const stat = (k, icon) => `<span class="ix-act ix-${k}"><i class="ix-ico">${ICON[icon]}</i><b data-k="${k}"></b></span>`;
    section.innerHTML = `
<div class="ix-crt">
  <div class="ix-world">
    <article class="ix-post">
      <header class="ix-head">
        <img class="ix-av" src="${img('avatar.jpg')}" alt="" decoding="sync">
        <div class="ix-who">
          <div class="ix-name">BridgeMind<i class="ix-badge">${ICON.badge}</i></div>
          <div class="ix-handle">@bridgemindai</div>
        </div>
        <i class="ix-x">${ICON.x}</i>
      </header>
      <div class="ix-text">${PARAS.map((p, i) => `<p>${i ? p : `<span class="ix-l1">${p}</span>`}</p>`).join('<p class="ix-blank"></p>')}</div>
      <div class="ix-media">
        <video class="ix-vid ix-fwd" muted playsinline preload="auto" poster="${img('fwd-poster.jpg')}" src="${img('fwd.mp4')}"></video>
        <video class="ix-vid ix-rew" muted playsinline preload="auto" src="${img('rew.mp4')}"></video>
      </div>
      <div class="ix-meta">5:36 PM · Sep 22, 2026 · <b data-k="views"></b> Views</div>
      <div class="ix-acts">${stat('replies', 'reply')}${stat('reposts', 'repost')}${stat('likes', 'like')}${stat('bookmarks', 'bookmark')}<span class="ix-act ix-share"><i class="ix-ico">${ICON.share}</i></span></div>
    </article>
  </div>
  <div class="ix-scr">
    <div class="ix-lines"></div>
    <div class="ix-band"></div><div class="ix-band"></div><div class="ix-band"></div>
    <div class="ix-osd"><span class="ix-glyph"></span><span class="ix-word"></span></div>
    <div class="ix-tc"></div>
  </div>
  <div class="ix-flash"></div>
</div>
<div class="ix-glow"></div>
<svg class="ix-defs" width="0" height="0" aria-hidden="true"><filter id="ix-rgb" x="-2%" y="0" width="104%" height="100%" color-interpolation-filters="sRGB">
  <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
  <feOffset in="r" dx="0" dy="0" result="ro"/>
  <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/>
  <feOffset in="gb" dx="0" dy="0" result="gbo"/>
  <feBlend in="ro" in2="gbo" mode="screen"/>
</filter></svg>`;
    const q = (s) => section.querySelector(s);
    const offs = section.querySelectorAll('#ix-rgb feOffset');
    el = {
      section, crt: q('.ix-crt'), world: q('.ix-world'), post: q('.ix-post'),
      head: q('.ix-head'), text: q('.ix-text'), media: q('.ix-media'), meta: q('.ix-meta'), acts: q('.ix-acts'),
      hl: q('.ix-hl'), line: q('.ix-l1'), fwd: q('.ix-fwd'), rew: q('.ix-rew'),
      scr: q('.ix-scr'), bands: [...section.querySelectorAll('.ix-band')], osd: q('.ix-osd'), glyph: q('.ix-glyph'),
      word: q('.ix-word'), tc: q('.ix-tc'), flash: q('.ix-flash'), glow: q('.ix-glow'),
      offR: offs[0], offGB: offs[1],
      nums: Object.fromEntries([...section.querySelectorAll('[data-k]')].map((n) => [n.dataset.k, n])),
      g: null, last: {},
    };
    muteVid(el.fwd); muteVid(el.rew);
    // text metrics change when the web fonts settle: measure again then
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (el) el.g = null; });
  },

  render(lt, ctx) {
    if (!el) return;
    const W = (ctx && ctx.W) || 1920;
    if (!el.g || el.post.offsetHeight !== el.g.key) measure();
    const g = el.g;

    // ---- the post rises in ----
    const r = outQuint(seg(lt, RISE[0], RISE[1]));
    el.post.style.opacity = clamp(r * 1.15).toFixed(3);
    el.post.style.transform = r >= 1 ? 'none' : `translateY(${((1 - r) * 18).toFixed(2)}px)`;
    el.post.style.filter = r >= 1 ? 'none' : `blur(${((1 - r) * 8).toFixed(2)}px)`;

    // ---- camera: fit -> the first line (the hook) -> the video with its stats -> the video fills the frame ----
    const { A, L, V, F } = framings(W);
    const zoomE = inOutCubic(seg(lt, ZOOM[0], ZOOM[1]));
    let cam;
    if (lt >= ZOOM[0]) cam = mix(V, F, zoomE);
    else if (lt >= CAM_VID[0]) cam = mix(L, V, inOutCubic(seg(lt, CAM_VID[0], CAM_VID[1])));
    else cam = mix(A, L, inOutCubic(seg(lt, CAM_LINE[0], CAM_LINE[1])));
    const tx = W / 2 - cam.s * cam.fx, ty = H / 2 - cam.s * cam.fy;
    el.world.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${cam.s.toFixed(5)})`;

    // ---- ONE SHOT highlighter ----
    const h = inOutCubic(seg(lt, HL[0], HL[1]));
    el.hl.style.setProperty('--hl', h.toFixed(4));

    // ---- stats: live, then rolling back to 0 in step with the rewind ----
    const roll = 1 - inOutQuad(seg(lt, STATS_ROLL[0], STATS_ROLL[1]));
    for (const k in STATS) {
      const v = fmt(STATS[k] * roll);
      if (el.last[k] !== v) { el.nums[k].textContent = v; el.last[k] = v; }
    }

    // ---- the post chrome falls away as the video takes the frame ----
    const c = inOutCubic(seg(lt, CHROME_OUT[0], CHROME_OUT[1]));
    const up = `translateY(${(-60 * c).toFixed(2)}px)`, down = `translateY(${(60 * c).toFixed(2)}px)`;
    for (const [n, tr] of [[el.head, up], [el.text, up], [el.meta, down], [el.acts, down]]) {
      n.style.opacity = (1 - c).toFixed(3);
      n.style.transform = c > 0 ? tr : 'none';
    }
    el.post.style.setProperty('--edge', (1 - c).toFixed(3));

    // ---- the videos ----
    const rewOn = lt >= REW[0];
    sync(el.fwd, clamp(lt - FWD_AT, 0, FWD_END), lt >= FWD_AT && lt < FWD_AT + FWD_END);
    sync(el.rew, clamp(lt - REW[0], 0, REW_END), lt >= REW[0] && lt < REW[0] + REW_END);
    el.fwd.style.opacity = rewOn ? '0' : '1';
    el.rew.style.opacity = rewOn ? '1' : '0';
    const fi = clamp(Math.floor((lt - REW[0]) * 30 + 1e-6), 0, REW_N - 1);   // the rewind frame on screen
    const src = lt < REW[0] ? S1 : srcAt(fi);

    // ---- the video's rect on screen (the post has finished rising by now) ----
    const rx = tx + cam.s * g.media.x, ry = ty + cam.s * (g.media.y + (r >= 1 ? 0 : (1 - r) * 18));
    const rw = cam.s * g.media.w, rh = cam.s * g.media.h;
    const vx0 = Math.max(0, rx), vy0 = Math.max(0, ry), vx1 = Math.min(W, rx + rw), vy1 = Math.min(H, ry + rh);
    const vw = Math.max(0, vx1 - vx0), vh = Math.max(0, vy1 - vy0);

    // ---- VHS: from the freeze to the power-off ----
    const vhs = seg(lt, FREEZE, FREEZE + 0.15);
    const rewinding = lt >= REW[0] && lt < STOP;
    const split = vhs * (rewinding ? 5 + 3 * rand(fi + 11) : 2.5);   // screen px
    const dxw = (split / cam.s).toFixed(2);
    el.offR.setAttribute('dx', dxw);
    el.offGB.setAttribute('dx', (-split / cam.s).toFixed(2));
    const vf = vhs > 0 ? `url(#ix-rgb) saturate(${(1 - 0.28 * vhs).toFixed(3)}) contrast(${(1 + 0.06 * vhs).toFixed(3)})` : 'none';
    el.fwd.style.filter = vf;
    el.rew.style.filter = vf;
    // tracking jitter: the picture slips sideways a few px on some rewind frames
    const jit = rewinding && rand(fi * 7 + 3) > 0.6 ? (rand(fi + 5) - 0.5) * 10 : 0;
    el.rew.style.transform = jit ? `translateX(${(jit / cam.s).toFixed(2)}px)` : 'none';

    const s = el.scr.style;
    s.display = vhs > 0 && vw > 0 && vh > 0 ? 'block' : 'none';
    if (vhs > 0) {
      s.left = vx0.toFixed(2) + 'px'; s.top = vy0.toFixed(2) + 'px';
      s.width = vw.toFixed(2) + 'px'; s.height = vh.toFixed(2) + 'px';
      s.borderRadius = `${(cam.s * 32 * (1 - zoomE)).toFixed(2)}px`;
      // the OSD reads as burned into the picture: sized off the visible picture's height
      const u = clamp(vh / 1080, 0.3, 1);
      s.setProperty('--osd', (64 * u).toFixed(2) + 'px');
      // inset clear of the game's own HUD: the OSD under the lap counter, the counter above the speedometer
      s.setProperty('--padx', (0.05 * vw).toFixed(2) + 'px');
      s.setProperty('--pady', (0.155 * vh).toFixed(2) + 'px');
      s.setProperty('--padb', (0.255 * vh).toFixed(2) + 'px');
      el.scr.querySelector('.ix-lines').style.opacity = (0.9 * vhs).toFixed(3);
      // two or three tracking bands drifting down (the third only while rewinding)
      const BANDS = [{ v: 260, p: 0.1, h: 0.07 }, { v: 410, p: 0.55, h: 0.035 }, { v: 170, p: 0.8, h: 0.12 }];
      el.bands.forEach((b, i) => {
        const B = BANDS[i], bh = B.h * vh;
        const y = ((lt * B.v + B.p * (vh + bh)) % (vh + bh)) - bh;
        const on = i < 2 ? 1 : (rewinding ? 1 : 0);
        b.style.top = y.toFixed(2) + 'px';
        b.style.height = bh.toFixed(2) + 'px';
        b.style.opacity = (on * vhs * (lt >= STOP ? 0.45 : 1)).toFixed(3);
      });

      // OSD: PAUSE with its glyph flashing at the freeze, REWIND with the glyph blinking at 4Hz, then STOP
      let mode = 'pause';
      if (lt >= STOP) mode = 'stop'; else if (lt >= REW[0]) mode = 'rew';
      const blink4 = (((lt - (mode === 'rew' ? REW[0] : FREEZE)) * 4) % 1) < 0.5;
      if (el.last.mode !== mode) {
        el.glyph.className = 'ix-glyph ix-g-' + mode;
        el.word.textContent = mode === 'pause' ? 'PAUSE' : mode === 'rew' ? 'REWIND' : 'STOP';
        el.last.mode = mode;
      }
      el.glyph.style.visibility = mode !== 'stop' && !blink4 ? 'hidden' : 'visible';
      const code = tc(lt >= STOP ? S0 : src);
      if (el.last.tc !== code) { el.tc.textContent = code; el.last.tc = code; }
    }

    // ---- CRT power-off ----
    const a = seg(lt, CRT.squash[0], CRT.squash[1]);
    const b = seg(lt, CRT.shrink[0], CRT.shrink[1]);
    const f = seg(lt, CRT.fade[0], CRT.fade[1]);
    const sy = lerp(1, 0.004, inCubic(a) * 0.35 + outCubic(a) * 0.65);
    const sx = lerp(1, 0.004, inCubic(b));
    el.crt.style.transform = a > 0 ? `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})` : 'none';
    el.crt.style.filter = a > 0 ? `brightness(${(1 + 1.8 * a).toFixed(3)})` : 'none';
    el.crt.style.opacity = (1 - f).toFixed(3);
    el.flash.style.opacity = (0.92 * seg(a, 0.5, 1)).toFixed(3);
    // the glow of the collapsing line and the dot, in screen space
    const gOn = seg(lt, CRT.squash[1] - 0.06, CRT.squash[1]) * (1 - f);
    el.glow.style.opacity = gOn.toFixed(3);
    el.glow.style.width = Math.max(10, W * sx).toFixed(2) + 'px';
    el.glow.style.left = ((W - Math.max(10, W * sx)) / 2).toFixed(2) + 'px';
    el.glow.style.height = lerp(6, 10, b).toFixed(2) + 'px';
  },
};
