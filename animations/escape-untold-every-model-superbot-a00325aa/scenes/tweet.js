// Act 1, the hook: a doomscroll. X's dark home timeline, seen whole (left nav, the "For you" / "Following" column,
// the right rail with Search and "What's happening"), scrolling fast with motion blur past four filler posts, then
// decelerating (a damped spring, one slight overshoot) onto a post by a FICTIONAL creator, Nico (@nicoships_), that
// says "I made this in 1 prompt" over a re-shared video "From anabology" (img/esc/tweet-clip.mp4: the "18 MONTHS TO
// ESCAPE THE PERMANENT UNDERCLASS" title card, light trails, the ESCAPE VELOCITY face, the highway). The camera then
// pushes in: first to the post, holding on its line, then on into the video until the film alone fills the frame,
// where the timeline hard-cuts (fadeOut 0) to the next scene. No real person's words are put in anyone's mouth:
// every filler account is fictional and every face is a licensed stock photo (img/tweet/CREDITS.txt).
//
// Everything is laid out at X's own px (a 275px nav, a 600px column, a 350px rail) in one .tw-page, and a camera
// div scales it. The feed scrolls inside the column under the sticky tabs; nav and rail stay put, as on x.com.
//   scroll  0 .. SETTLE: constant flick speed for FLICK s, then a damped spring onto the hero (about 2% overshoot);
//           the feed carries a vertical-only Gaussian blur (an SVG filter) proportional to its speed;
//   push 1  P1: from the whole page to the post (avatar, name, the line, most of the video), a zoom about a fixed
//           point so the post travels in a straight line on screen; then a slow HOLD drift on the line;
//   push 2  P2: on into the video until it covers the frame (COVER x), then a gentle TAIL drift into the film.
// render(lt) is a pure function of lt. The clip is a real <video> slaved to lt like beats/play.js: it plays inside
// the scene and re-seeks only past DRIFT_TOL; a frozen frame (?t= puts body.freeze) pauses it and seeks exactly.
import { clamp, lerp, seg, inOutCubic } from '../lib.js';

const H = 1080;
const DUR = 6.5;
const tw = (f) => new URL('../img/tweet/' + f, import.meta.url).href;
const escImg = (f) => new URL('../img/esc/' + f, import.meta.url).href;

// ---------- the clip ----------
const CLIP = 'tweet-clip.mp4', POSTER = 'tweet-poster.jpg';
const V0 = 0.1;           // X autoplays muted; the clip is already rolling as the hero scrolls in
const CLIP_END = 6.36;    // the trim is 6.42s: never seek onto the very last frame
const PILL_FROM = 306;    // the pill counts down from 5:06, the full film's length (it is a re-share)
const SEED_TOL = 0.04, DRIFT_TOL = 0.25;

// ---------- page geometry (X px) ----------
const NAV_W = 275, COL_W = 600, GAP = 30, RAIL_W = 350;
const COL_X = NAV_W, RAIL_X = NAV_W + COL_W + GAP;
const PAGE_W = RAIL_X + RAIL_W + 10;   // 1265, X's widest layout
const TABS_H = 53;                     // the sticky "For you" / "Following" bar
const PAGE_W_FIT = 1300;               // the open frame's width in page px when the whole page is shown
const COL_VIEW = 640;                  // ...and on narrow ratios, the column plus 20px either side

// ---------- scroll ----------
const START = 36;         // the feed is already scrolled a little at lt 0 (mid-scroll, first post cut by the tabs)
const FLICK = 0.7;        // seconds of constant flick speed before the spring takes over
const K_V = 0.85;         // flick speed as a fraction of the scroll distance per second
const SP_A = 2.75, SP_W = 2.7; // spring decay and angular frequency: ~2.1% overshoot peaking at 1.68s, settled 2.4s
const SP_A0 = 1 - K_V * FLICK, SP_B0 = (SP_A * SP_A0 - K_V) / SP_W;
const BLUR_K = 0.55;      // motion blur sigma = BLUR_K x the per-frame (1/60 s) travel, in page px
const BLUR_MAX = 12;

// ---------- camera ----------
const P1 = [2.4, 3.3];    // push to the post
const P2 = [4.0, 5.1];    // push into the video
const HOLD_DRIFT = Math.log(1.035); // slow creep while the line holds (P1 end .. P2 start)
const TAIL_DRIFT = Math.log(1.05);  // slow creep into the film after P2
const POST_FILL = 0.92;   // the post (avatar through media) is this much of the frame width at the hold...
const POST_MIN = 1.9;     // ...but never less than this scale (1x1 / 4x5 crop in and anchor on the post's left)
const COVER = 1.035;      // the video ends this much past covering the frame (its rounded corners fall outside)
const CTRL_OUT = [4.0, 4.4]; // the pill and mute button fade as the camera leaves the post

const HERO = {
  name: 'Nico', handle: '@nicoships_', time: '3h', av: 'avatar-nico.jpg', badge: true,
  text: 'I made this in 1 prompt',
  from: 'anabology',
  counts: { reply: '1.9K', repost: '11K', like: '96K', views: '2.4M' },
};
// fictional accounts, plausible tech-Twitter posts; faces are licensed stock photos
const ABOVE = [
  { name: 'Mara Voss', handle: '@maravoss', time: '2h', av: 'avatar-mara.jpg',
    text: 'the best part of shipping on a Friday is finding out on Saturday',
    counts: { reply: '38', repost: '104', like: '1.2K', views: '61K' } },
  { name: 'Kai Reyes', handle: '@kaireyes_dev', time: '4h', av: 'avatar-kai.jpg', badge: true,
    text: 'finally finished the new setup. zero excuses left', img: 'feed-desk-1.jpg', ratio: '16 / 10',
    counts: { reply: '96', repost: '212', like: '4.3K', views: '288K' } },
  { name: 'Lena Hart', handle: '@lenahart_ui', time: '1h', av: 'avatar-lena.jpg',
    text: 'hot take: your side project does not need microservices, a message queue and three environments. it needs users.',
    counts: { reply: '211', repost: '540', like: '6.8K', views: '402K' } },
  { name: 'Theo Brandt', handle: '@theobrandt', time: '5h', av: 'avatar-theo.jpg',
    text: 'night shift, day 3 of the rewrite. the coffee is winning', img: 'feed-desk-2.jpg', ratio: '1 / 1',
    counts: { reply: '47', repost: '88', like: '2.1K', views: '97K' } },
];
const BELOW = [
  { name: 'Jules Park', handle: '@julesbuilds', time: '45m', av: 'avatar-jules.jpg',
    text: 'every week there’s a new “best model” and every week I rewrite my prompts',
    counts: { reply: '64', repost: '150', like: '3.3K', views: '120K' } },
];
const ME = { name: 'Jules Park', handle: '@julesbuilds', av: 'avatar-jules.jpg' };
const TRENDS = [
  ['Technology · Trending', 'Opus 5.5', '48.2K posts'],
  ['Trending in Technology', '#buildinpublic', '12.9K posts'],
  ['AI · Trending', 'Midjourney', '31.4K posts'],
  ['Trending', 'Permanent underclass', '22.1K posts'],
  ['Technology · Trending', 'Claude Code', '19.7K posts'],
];

// X's own 24x24 icon paths (the web client's), the X logo, and the verified badge (22x22)
const P = {
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  home: 'M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913H9.14c.51 0 .929-.41.929-.913v-7.075h3.909v7.075c0 .502.417.913.928.913h6.165c.511 0 .929-.41.929-.913V7.904c0-.301-.158-.584-.408-.758z',
  explore: 'M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z',
  notif: 'M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958zM12 20c-1.306 0-2.417-.835-2.829-2h5.658c-.412 1.165-1.523 2-2.829 2zm-6.866-4l.847-6.698C6.364 6.272 8.941 4 11.996 4s5.627 2.268 6.013 5.295L18.864 16H5.134z',
  msg: 'M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v2.764l8 3.638 8-3.636V5.5c0-.276-.224-.5-.5-.5h-15zm15.5 5.463l-8 3.636-8-3.638V18.5c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5v-8.037z',
  profile: 'M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z',
  moreNav: 'M3.75 12c0-4.56 3.69-8.25 8.25-8.25s8.25 3.69 8.25 8.25-3.69 8.25-8.25 8.25S3.75 16.56 3.75 12zM12 1.75C6.34 1.75 1.75 6.34 1.75 12S6.34 22.25 12 22.25 22.25 17.66 22.25 12 17.66 1.75 12 1.75zm-4.75 11.5c.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25S6 11.31 6 12s.56 1.25 1.25 1.25zm9.5 0c.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25-1.25.56-1.25 1.25.56 1.25 1.25 1.25zM13.25 12c0 .69-.56 1.25-1.25 1.25s-1.25-.56-1.25-1.25.56-1.25 1.25-1.25 1.25.56 1.25 1.25z',
  more: 'M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z',
  reply: 'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z',
  repost: 'M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z',
  like: 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z',
  views: 'M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z',
  bookmark: 'M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z',
  share: 'M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z',
  mute: 'M15 1.06v21.88L6.68 17H2V7h4.68L15 1.06zM4 9v6h3.32L13 18.94V5.06L7.32 9H4zm16.19 3l2.4 2.41-1.41 1.42L18.77 13.4l-2.41 2.43-1.42-1.42L17.35 12l-2.41-2.4 1.42-1.42 2.41 2.4 2.4-2.4 1.41 1.42L20.19 12z',
  badge: 'M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z',
};
const icon = (d, cls = 'tw-ic', vb = 24) => `<svg class="${cls}" viewBox="0 0 ${vb} ${vb}" aria-hidden="true"><path d="${d}"/></svg>`;
const BADGE = icon(P.badge, 'tw-badge', 22);
// m:ss, what X's pill shows (the time left)
const clock = (s) => { const n = Math.max(0, Math.ceil(s - 1e-6)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };

function acts(c) {
  const a = (k, n) => `<div class="tw-act tw-act-${k}">${icon(P[k])}<span class="tw-n">${n}</span></div>`;
  return `<div class="tw-acts">${a('reply', c.reply)}${a('repost', c.repost)}${a('like', c.like)}${a('views', c.views)}` +
    `<div class="tw-act-end">${icon(P.bookmark)}${icon(P.share)}</div></div>`;
}
function cell(p, media = '') {
  return `<article class="tw-cell">
  <div class="tw-av"><img src="${tw(p.av)}" alt="" decoding="sync"/></div>
  <div class="tw-body">
    <div class="tw-head"><span class="tw-name">${p.name}</span>${p.badge ? BADGE : ''}<span class="tw-handle">${p.handle}</span><span class="tw-dot">·</span><span class="tw-time">${p.time}</span>${icon(P.more, 'tw-ic tw-more')}</div>
    <div class="tw-text">${p.text}</div>
    ${media || (p.img ? `<div class="tw-media" style="aspect-ratio:${p.ratio}"><img src="${tw(p.img)}" alt="" decoding="sync"/></div>` : '')}
    ${acts(p.counts)}
  </div>
</article>`;
}
const navItem = (d, label, extra = '') => `<div class="tw-nav-i${extra}"><span class="tw-nav-ic">${icon(d)}</span><span class="tw-nav-l">${label}</span></div>`;

// the scroll's shape for a distance of 1: flick at K_V for FLICK s, then the spring, C1 at the seam
function scrollShape(t) {
  if (t <= FLICK) return K_V * Math.max(0, t);
  const u = t - FLICK;
  return 1 - Math.exp(-SP_A * u) * (SP_A0 * Math.cos(SP_W * u) + SP_B0 * Math.sin(SP_W * u));
}
function scrollSpeed(t) { // d(shape)/dt
  if (t <= FLICK) return K_V;
  const u = t - FLICK, e = Math.exp(-SP_A * u), c = Math.cos(SP_W * u), s = Math.sin(SP_W * u);
  return e * ((SP_A * SP_A0 - SP_B0 * SP_W) * c + (SP_A * SP_B0 + SP_A0 * SP_W) * s);
}
// a slope-0 start easing for the tail drift: f(0) = 0, f(1) = 1, f'(0) = 0
const easeIn1 = (x) => x - Math.sin(Math.PI * x) / Math.PI;
// the aim at scale s on a zoom about the fixed point that takes (af, sf) to (at, st): the target travels straight
const zoomAim = (af, sf, at, st, s) => (Math.abs(st - sf) < 1e-6 ? at : af + (at - af) * (1 - sf / s) / (1 - sf / st));

let el = null;

// an element's box in .tw-page layout px (transforms ignored; the feed's scroll translate is added by the caller)
function box(n) {
  const w = n.offsetWidth, h = n.offsetHeight;
  let x = 0, y = 0;
  while (n && n !== el.page) {
    x += n.offsetLeft; y += n.offsetTop;
    const p = n.offsetParent;
    if (p && p !== el.page) { x += p.clientLeft; y += p.clientTop; }
    n = p;
  }
  return { x, y, w, h };
}

export default {
  id: 'tweet',
  dur: DUR,
  fadeIn: 0,
  fadeOut: 0,

  mount(section) {
    const heroMedia = `<div class="tw-media tw-vcard">
      <video class="tw-vid" muted playsinline preload="auto" poster="${escImg(POSTER)}" src="${escImg(CLIP)}"></video>
      <span class="tw-pill">${clock(PILL_FROM)}</span>
      <span class="tw-mute">${icon(P.mute)}</span>
    </div>
    <div class="tw-from">From <span class="tw-from-n">${HERO.from}</span></div>`;
    section.innerHTML = `
<svg class="tw-defs" width="0" height="0" aria-hidden="true"><filter id="tw-mblur" x="0" y="-2%" width="100%" height="104%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0" edgeMode="none"/></filter></svg>
<div class="tw-cam">
  <div class="tw-page">
    <nav class="tw-nav">
      <div class="tw-logo">${icon(P.x)}</div>
      ${navItem(P.home, 'Home', ' is-on')}
      ${navItem(P.explore, 'Explore')}
      ${navItem(P.notif, 'Notifications', ' has-dot')}
      ${navItem(P.msg, 'Messages')}
      ${navItem(P.bookmark, 'Bookmarks')}
      ${navItem(P.x, 'Premium')}
      ${navItem(P.profile, 'Profile')}
      ${navItem(P.moreNav, 'More')}
      <div class="tw-postbtn">Post</div>
      <div class="tw-me">
        <div class="tw-av"><img src="${tw(ME.av)}" alt="" decoding="sync"/></div>
        <div class="tw-me-who"><span class="tw-name">${ME.name}</span><span class="tw-handle">${ME.handle}</span></div>
        ${icon(P.more, 'tw-ic tw-more')}
      </div>
    </nav>
    <main class="tw-col">
      <div class="tw-feed">
        ${ABOVE.map((p) => cell(p)).join('')}
        <div class="tw-hero">${cell(HERO, heroMedia)}</div>
        ${BELOW.map((p) => cell(p)).join('')}
      </div>
      <div class="tw-tabs"><div class="tw-tab is-on"><span>For you</span></div><div class="tw-tab"><span>Following</span></div></div>
    </main>
    <aside class="tw-rail">
      <div class="tw-search">${icon(P.explore)}<span>Search</span></div>
      <section class="tw-box tw-prem">
        <h2>Subscribe to Premium</h2>
        <p>Subscribe to unlock new features and if eligible, receive a share of revenue.</p>
        <span class="tw-sub">Subscribe</span>
      </section>
      <section class="tw-box tw-trends">
        <h2>What’s happening</h2>
        ${TRENDS.map(([m, topic, n]) => `<div class="tw-tr"><div class="tw-tr-m"><span>${m}</span>${icon(P.more, 'tw-ic tw-more')}</div><div class="tw-tr-t">${topic}</div><div class="tw-tr-n">${n}</div></div>`).join('')}
        <div class="tw-showmore">Show more</div>
      </section>
    </aside>
  </div>
</div>`;
    const q = (s) => section.querySelector(s);
    el = {
      sec: section, cam: q('.tw-cam'), page: q('.tw-page'), feed: q('.tw-feed'), blur: q('#tw-mblur feGaussianBlur'),
      hero: q('.tw-hero .tw-cell'), heroAv: q('.tw-hero .tw-av'), heroHead: q('.tw-hero .tw-head'), heroMedia: q('.tw-hero .tw-vcard'),
      vid: q('.tw-vid'), pill: q('.tw-pill'), mute: q('.tw-mute'),
      pillText: '', ph: 0, blurOn: false, sig: '',
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

    // the page is exactly one viewport tall at the open scale; nav and rail are sized to it. 16x9 / 4x3 see the
    // whole page (nav, column, rail); 1x1 / 4x5 are too narrow to read it whole, so they open on the column alone
    // (the nav's labels end well left of it and the rail starts right of it: no cut words at the frame edges)
    const s0 = W >= PAGE_W_FIT ? W / PAGE_W_FIT : W / COL_VIEW;
    const PH = H / s0;
    if (Math.abs(el.ph - PH) > 0.01) { el.page.style.height = PH.toFixed(2) + 'px'; el.ph = PH; }

    // measured every frame (transform-free offsets, cheap): the stylesheet is linked, not awaited, by timeline.js
    const hero = box(el.hero), av = box(el.heroAv), head = box(el.heroHead), media = box(el.vid);
    if (!hero.h || !media.w) return;

    // ---- scroll: the hero settles centred in the visible feed (or 12px under the tabs when it is taller) ----
    const heroTop = TABS_H + Math.max(12, (PH - TABS_H - hero.h) / 2);
    const SE = hero.y + TABS_H - heroTop;        // final scroll (hero.y is measured with the feed at top 0)
    const S0 = Math.min(START, SE);
    const D = SE - S0;
    const scroll = S0 + D * scrollShape(t);
    const feedY = TABS_H - scroll;               // the feed's translate; feed-space y maps to page y + feedY
    el.feed.style.transform = `translate3d(0,${feedY.toFixed(2)}px,0)`;
    const sigma = Math.min(BLUR_MAX, Math.abs(D * scrollSpeed(t)) / 60 * BLUR_K);
    const sig = sigma < 0.35 ? '' : sigma.toFixed(2);
    if (sig !== el.sig) {
      if (sig) el.blur.setAttribute('stdDeviation', `0 ${sig}`);
      el.feed.style.filter = sig ? 'url(#tw-mblur)' : 'none';
      el.sig = sig;
    }

    // ---- camera ----
    const oy = feedY;
    const postL = av.x, postR = media.x + media.w, postCx = (postL + postR) / 2;
    const A0 = { x: W >= PAGE_W_FIT ? PAGE_W / 2 : COL_X + COL_W / 2, y: PH / 2 };
    const s1 = Math.max(W * POST_FILL / (postR - postL), POST_MIN, s0 * 1.3);
    const A1 = { x: Math.min(postCx, postL - 16 + W / s1 / 2), y: head.y + oy - 24 + H / s1 / 2 };
    const s2 = Math.max(W / media.w, H / media.h) * COVER;
    const A2 = { x: media.x + media.w / 2, y: media.y + oy + media.h / 2 };
    const L0 = Math.log(s0), L1 = Math.log(s1), L2 = Math.log(s2);
    let s, ax, ay;
    if (t < P2[0]) {
      const e1 = inOutCubic(seg(t, P1[0], P1[1]));
      const sBase = Math.exp(lerp(L0, L1, e1));
      s = sBase * Math.exp(HOLD_DRIFT * seg(t, P1[1], P2[0]));
      ax = zoomAim(A0.x, s0, A1.x, s1, sBase); ay = zoomAim(A0.y, s0, A1.y, s1, sBase);
    } else {
      const s1d = s1 * Math.exp(HOLD_DRIFT);
      const e2 = inOutCubic(seg(t, P2[0], P2[1]));
      const sBase = Math.exp(lerp(Math.log(s1d), L2, e2));
      s = sBase * Math.exp(TAIL_DRIFT * easeIn1(seg(t, P2[1], DUR)));
      ax = zoomAim(A1.x, s1d, A2.x, s2, sBase); ay = zoomAim(A1.y, s1d, A2.y, s2, sBase);
    }
    el.cam.style.transform = `translate(${(W / 2).toFixed(2)}px,${H / 2}px) scale(${s.toFixed(5)}) translate(${(-ax).toFixed(2)}px,${(-ay).toFixed(2)}px)`;

    // X's video controls fade as the camera leaves the post, so the film ends up alone
    const cv = (1 - seg(t, CTRL_OUT[0], CTRL_OUT[1])).toFixed(3);
    el.pill.style.opacity = cv; el.mute.style.opacity = cv;

    // ---- the clip follows t: it plays while the scene runs, and a frozen frame parks it on the frame t asks for ----
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
