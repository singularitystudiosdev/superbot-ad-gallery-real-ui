// Act 1, the hook: X's web home timeline in dark mode, laid out at X's own px (a 275px nav, the 600px
// timeline column, the 350px sidebar, 15/20 text, 40px avatars, 16px-rounded media), with Kai's post
// "I made this in 1 prompt" and the Pocketsflow launch film autoplaying muted in it. Icon paths are X's own.
// render(t) is a pure function of t: the camera, the clip frame, the time-left pill and the like all read it.
import { clamp, lerp, seg, smoother, outBack, outCubic } from './lib.js';

export const X_DUR = 6.2;
const CLIP_T0 = 0.6;            // the clip is already playing when the post comes up (X autoplays muted)
const CLIP_LEN = 15;
const LIKE_AT = 3.35;           // the viewer's like lands
// the post fills the frame with X's sidebar at its right edge; the push ends on the clip
const CAM = { z0: 2.28, z1: 2.72, push: [0, X_DUR], dx0: 96, dx1: 8 };

const P = {
  logo: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  home: 'M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z',
  explore: 'M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z',
  bell: 'M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958zM12 20c-1.306 0-2.417-.835-2.829-2h5.658c-.412 1.165-1.523 2-2.829 2zm-6.866-4l.847-6.698C6.364 6.272 8.941 4 11.996 4s5.627 2.268 6.013 5.295L18.864 16H5.134z',
  mail: 'M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z',
  bookmarks: 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z',
  profile: 'M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z',
  moreNav: 'M3.75 12c0-4.56 3.69-8.25 8.25-8.25s8.25 3.69 8.25 8.25-3.69 8.25-8.25 8.25S3.75 16.56 3.75 12zM12 1.75C6.34 1.75 1.75 6.34 1.75 12S6.34 22.25 12 22.25 22.25 17.66 22.25 12 17.66 1.75 12 1.75zm-4.75 11.5c.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25S6 11.31 6 12s.56 1.25 1.25 1.25zm9.5 0c.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25-1.25.56-1.25 1.25.56 1.25 1.25 1.25zM13.25 12c0 .69-.56 1.25-1.25 1.25s-1.25-.56-1.25-1.25.56-1.25 1.25-1.25 1.25.56 1.25 1.25z',
  badge: 'M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z',
  more: 'M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
  reply: 'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z',
  repost: 'M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z',
  like: 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z',
  liked: 'M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z',
  views: 'M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z',
  bookmark: 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z',
  share: 'M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z',
  search: 'M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z',
};
const ic = (d, cls = 'xi') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const MUTE = '<svg class="xi" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="#fff"/><path d="M15.5 9.5l5 5m0-5l-5 5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';

const act = (k, n, extra = '') => `<div class="x-act x-act-${k}"${extra}><span class="x-act-ic">${ic(P[k])}</span>${n ? `<span class="x-n">${n}</span>` : ''}</div>`;
const actions = (c) => `<div class="x-acts">${act('reply', c.reply)}${act('repost', c.repost)}<div class="x-act x-act-like"><span class="x-act-ic"><span class="x-like-ring"></span>${ic(P.like, 'xi x-like-off')}${ic(P.liked, 'xi x-like-on')}</span><span class="x-n x-like-n">${c.like}</span></div>${act('views', c.views)}<div class="x-act-end">${act('bookmark')}${act('share')}</div></div>`;
const head = (name, handle, ago, verified) =>
  `<div class="x-head"><span class="x-name">${name}</span>${verified ? ic(P.badge, 'x-badge') : ''}<span class="x-handle">${handle}</span><span class="x-dot">·</span><span class="x-ago">${ago}</span>${ic(P.more, 'xi x-more')}</div>`;
const nav = (k, label, active) => `<div class="x-nav-item${active ? ' on' : ''}">${ic(P[k], 'x-nav-ic')}<span>${label}</span></div>`;
const trend = (meta, name, count) => `<div class="x-trend"><div class="x-trend-meta">${meta}</div><div class="x-trend-name">${name}</div><div class="x-trend-meta">${count}</div>${ic(P.more, 'xi x-more')}</div>`;
const clock = (s) => { const n = Math.max(0, Math.ceil(s - 1e-6)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

let el = null;

export function mountX(section) {
  section.innerHTML = `
<div class="x-cam">
 <div class="x-page">
  <header class="x-nav">
   <div class="x-logo">${ic(P.logo, 'x-logo-ic')}</div>
   ${nav('home', 'Home', true)}${nav('explore', 'Explore')}${nav('bell', 'Notifications')}${nav('mail', 'Messages')}${nav('bookmarks', 'Bookmarks')}${nav('logo', 'Premium')}${nav('profile', 'Profile')}${nav('moreNav', 'More')}
   <div class="x-post-btn">Post</div>
   <div class="x-me"><img src="media/av-kai.jpg" alt=""><div><b>Kai</b><span>@kaiships</span></div>${ic(P.more, 'xi')}</div>
  </header>
  <main class="x-main">
   <div class="x-tabs"><div class="x-tab on"><span>For you</span><i></i></div><div class="x-tab"><span>Following</span></div></div>
   <div class="x-feed">
    <article class="x-post x-post-lena">
     <div class="x-av"><img src="media/av-lena.jpg" alt=""></div>
     <div class="x-body">${head('Lena Ortiz', '@lenabuilds', '1h', true)}
      <div class="x-text">Rebuilt our pricing page over the weekend. Checkout conversion is up 18% and nobody noticed the new font, which is exactly how it should be.</div>
      ${actions({ reply: '41', repost: '23', like: '612', views: '48K' })}</div>
    </article>
    <article class="x-post x-post-kai">
     <div class="x-av"><img src="media/av-kai.jpg" alt=""></div>
     <div class="x-body">${head('Kai', '@kaiships', '2h', true)}
      <div class="x-text">I made this in 1 prompt</div>
      <div class="x-media"><video class="x-vid" muted playsinline preload="auto" src="media/pocketsflow-launch.mp4"></video><span class="x-pill">0:15</span><span class="x-mute">${MUTE}</span></div>
      ${actions({ reply: '486', repost: '2.1K', like: '20K', views: '1.9M' })}</div>
    </article>
    <article class="x-post x-post-theo">
     <div class="x-av"><img src="media/av-theo.jpg" alt=""></div>
     <div class="x-body">${head('Theo Nakamura', '@theoships', '3h', false)}
      <div class="x-text">Day 41 of building in public. First paying customer from Japan today.</div>
      ${actions({ reply: '12', repost: '4', like: '233', views: '9.1K' })}</div>
    </article>
   </div>
  </main>
  <aside class="x-side">
   <div class="x-search">${ic(P.search, 'xi')}<span>Search</span></div>
   <section class="x-box"><h2>What’s happening</h2>
    ${trend('Technology · Trending', 'Kling 3.0', '18.2K posts')}${trend('Business &amp; finance · Trending', 'Pocketsflow', '4,921 posts')}${trend('Trending in United States', '#buildinpublic', '31.6K posts')}${trend('Technology · Trending', 'Lyria 3', '9,204 posts')}
   </section>
  </aside>
 </div>
</div>
<div class="x-shade"></div>`;
  const q = (s) => section.querySelector(s);
  el = {
    cam: q('.x-cam'), page: q('.x-page'), post: q('.x-post-kai'), media: q('.x-post-kai .x-media'), vid: q('.x-vid'), pill: q('.x-pill'), shade: q('.x-shade'),
    like: q('.x-post-kai .x-act-like'), likeN: q('.x-post-kai .x-like-n'), ring: q('.x-post-kai .x-like-ring'), on: q('.x-post-kai .x-like-on'), off: q('.x-post-kai .x-like-off'),
    pillText: '',
  };
  el.vid.muted = true;
  el.vid.defaultMuted = true;
  return el;
}

function rectIn(node) {
  let x = 0, y = 0;
  for (let n = node; n && n !== el.page; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
  return { x, y, w: node.offsetWidth, h: node.offsetHeight };
}

/** The clip's own time at t (seconds into the film). */
export const xClipTime = (t) => clamp(t + CLIP_T0, 0, CLIP_LEN - 0.05);

export function renderX(t, frozen) {
  if (!el) return;
  const post = rectIn(el.post), media = rectIn(el.media);
  // one continuous push: from the whole post to the video, C2-smooth so it never starts or stops with a jolt
  const f = smoother(seg(t, CAM.push[0], CAM.push[1]));
  const z = CAM.z0 * Math.pow(CAM.z1 / CAM.z0, f);
  const cx = lerp(post.x + post.w / 2 + CAM.dx0, media.x + media.w / 2 + CAM.dx1, f);
  const cy = lerp(post.y + post.h / 2, media.y + media.h / 2 + 6, f);
  el.cam.style.transform = `translate(960px, 540px) scale(${z.toFixed(5)}) translate(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px)`;

  // the like: the outline swaps to X's pink fill with its pop and ring, and the count ticks
  const lk = seg(t, LIKE_AT, LIKE_AT + 0.42);
  const on = t >= LIKE_AT;
  el.on.style.opacity = on ? '1' : '0';
  el.off.style.opacity = on ? '0' : '1';
  el.on.style.transform = `scale(${on ? (lk < 0.45 ? lerp(0.2, 1.22, outCubic(lk / 0.45)) : lerp(1.22, 1, outBack((lk - 0.45) / 0.55))).toFixed(3) : 1})`;
  el.ring.style.opacity = on ? (1 - seg(lk, 0.15, 1)).toFixed(3) : '0';
  el.ring.style.transform = `scale(${lerp(0.3, 1.5, outCubic(lk)).toFixed(3)})`;
  el.like.classList.toggle('on', on);

  // the clip follows t; X's pill counts down what is left of it
  const want = xClipTime(t);
  const pill = clock(CLIP_LEN - want);
  if (pill !== el.pillText) { el.pill.textContent = pill; el.pillText = pill; }
  const v = el.vid;
  const live = !frozen && t < X_DUR;
  if (live) {
    if (v.paused) v.play().catch((e) => console.warn('x clip play', e));
    if (Math.abs(v.currentTime - want) > 0.25) v.currentTime = want;
  } else {
    if (!v.paused) v.pause();
    if (Math.abs(v.currentTime - want) > 0.02) v.currentTime = want;
  }
  // the hand-off: the page falls away to black while the push carries on into the clip
  el.shade.style.opacity = smoother(seg(t, X_DUR - 0.75, X_DUR)).toFixed(4);
}

export const xVideo = () => el && el.vid;
