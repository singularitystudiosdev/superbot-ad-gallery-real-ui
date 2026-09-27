// xfeed: the cold open (11.0s). x.com in dark mode: the For you timeline doomscrolls past real Opus 5.5 one-shot
// flexes (each one's "one shot" gets a marker sweep as it crosses the middle), lands on @bridgemindai's post (its
// real video plays: TURBO KART RALLY's title, then CHOOSE YOUR RACER), the post gets bookmarked, a click opens X's
// media viewer on the race footage, "wanna know how?", the clip pauses on the frame at T (img/tkr/xray.json), and the
// frame is X-rayed: the HUD crops lift off it in 3D, each with a leader line to the model that built that part.
// "it's not just Opus 5.5." Then the pieces settle, the camera pushes into the viewer's "Post your reply" box and the
// box becomes the superbot composer exactly as scenes/tabs.js draws it on its first frame (MATCH below).
//
// Every post shown is real and verbatim (api.fxtwitter.com, fetched 2026-09-27; img/x/CREDITS.txt): handle, name,
// badge, text, date, counts, avatar and video. render(lt) is a pure function of lt; the <video>s follow the clock like
// pdoom-mv's beats/play.js (played while the clock runs, parked on the exact frame whenever it is held).
import { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack, esc, press, placeCursor } from '../lib.js';
import { makeCursor } from '../shell.js';

const U = (p) => new URL(p, import.meta.url).href;
// T and every HUD rect live only in xray.json
const XR = await fetch(U('../img/tkr/xray.json')).then((r) => {
  if (!r.ok) throw new Error('img/tkr/xray.json: HTTP ' + r.status);
  return r.json();
});
const FREEZE_AT = +(XR.T - XR.mainStart).toFixed(3); // T, in seconds into media/tkr-main.mp4 (3.0)
const SRC_W = XR.src.w, SRC_H = XR.src.h;             // the frame the HUD rects are measured in (2098 x 1080)

// ---------------------------------------------------------------- beats (scene-local seconds)
const B = {
  land: 3.0, settle: 3.36,     // the flick decelerates onto @bridgemindai (8px overshoot), then settles
  bookmark: 4.45,              // the bookmark fills
  curIn: 4.35, click: 5.22,    // the cursor comes in and clicks the video
  open0: 5.26, open1: 5.8,     // X's media viewer opens (the video flies from the post into it)
  card1: [5.9, 7.08],          // "wanna know how?"
  pause: 7.2,                  // tkr-main reaches T and freezes
  xray0: 7.3, xray1: 7.66,     // desaturate + blueprint grid
  lift0: 7.4, liftStag: 0.09,  // pieces lift, 90ms apart
  card2: [8.6, 9.98],          // "it's not just Opus 5.5."
  flat0: 10.08, flat1: 10.38,  // pieces settle back flat
  morph0: 10.12, morph1: 10.92, // the push into the reply box, which becomes the superbot composer
};
const MAIN_OFFSET = B.pause - FREEZE_AT; // main clip time = lt - MAIN_OFFSET, so it is at T exactly on B.pause

// ---------------------------------------------------------------- the match target
// scenes/tabs.js at local t=0 on a 1920x1080 stage, measured headlessly (.tmp/tkr-xfeed/capture-row.mjs in the
// gallery root): the composer card .rc, its placeholder and its control row (img/x/match-row.png, same script).
const MATCH16 = {
  // the tabs camera draws the hub at k=2.4: the card is 640x88 design px with a 14px radius and a 1px inset ring, and
  // its placeholder is 11.5px text scaled 2.4x (SF's small optical size, wider than 27.6px text would set)
  k: 2.4,
  rc: { x: 192, y: 523.32, w: 1536, h: 211.2 },
  radius: 14, bg: [26, 26, 28], ring: [44, 69, 150], ringW: 1,
  ph: { x: 218.4, y: 549.72, pad: 2, text: 'How can superbot help you today?', size: 11.5, lh: 16.1, color: 'rgb(142, 142, 147)' },
  row: { x: 204, y: 649, w: 1512, h: 72 },
  pageBg: 'rgb(10, 10, 11)',
};
// the same card at the gallery's other ratios (?ar=), measured the same way at tabs t=0 on a W x 1080 stage by
// .tmp/tkr-ar/capture-row.mjs <ar> --write (gallery root), which also writes img/x/match-row.<ar>.png. At 4:3 the tabs
// camera pushes the 512-wide hub card past both frame edges, so its row image is the part inside the frame.
// At 1:1 and 4:5 the card sits on fractional pixels, where its 1px ring rasterises a shade differently from the tabs
// hub's own; there the landed frame also lays the card itself on top (card: img/x/match-card.<ar>.png, the same
// script with --card, an integer box around the card on the tabs frame's own pixels).
const matchAt = (k, rc, ph, row, img, card) => ({ ...MATCH16, k, rc, ph: { ...MATCH16.ph, ...ph }, row, img, card });
const MATCHES = {
  '16x9': { ...MATCH16, img: 'match-row.png' },
  '4x3': matchAt(2.4, { x: -48, y: 518.02, w: 1536, h: 211.2 }, { x: -21.6, y: 544.42 }, { x: 0, y: 644, w: 1440, h: 72 }, 'match-row.4x3.png'),
  '1x1': matchAt(2.08286, { x: 6.79, y: 512.65, w: 1066.42, h: 183.29 }, { x: 29.7, y: 535.56 }, { x: 18, y: 621, w: 1043, h: 65 }, 'match-row.1x1.png',
    { img: 'match-card.1x1.png', x: 6, y: 512, w: 1068, h: 184 }),
  '4x5': matchAt(1.66629, { x: 5.43, y: 518.12, w: 853.14, h: 146.63 }, { x: 23.76, y: 536.45 }, { x: 17, y: 603, w: 830, h: 54 }, 'match-row.4x5.png',
    { img: 'match-card.4x5.png', x: 5, y: 518, w: 854, h: 147 }),
};

// ---------------------------------------------------------------- the layout per frame ratio
// 16:9 is x.com on a desktop (left nav, timeline, right sidebar; the media viewer with the reply column on the right).
// 4:3 is the same desktop x.com at the width where X drops the right sidebar and folds the nav to its icons; its viewer
// keeps the reply column, narrower. 1:1 and 4:5 are x.com's mobile web layout: one column under a top bar (avatar,
// X logo) and the For you / Following tabs, a bottom tab bar, a tap instead of a pointer, and the mobile media viewer
// (the video full width in the middle, the post and its counts under it, "Post your reply" pinned at the bottom).
// The beats and timings are the same everywhere. chips: each X-ray tag in media px of that layout's media box, and which
// side of it the leader comes in from (l/r/b as 16:9, a = tag above the piece, u = tag under it); chipS scales the tags.
const RATIO_W = { '16x9': 1920, '4x3': 1440, '1x1': 1080, '4x5': 864 };
const arKey = () => { const k = window.AR && window.AR.key; return RATIO_W[k] ? k : '16x9'; };
const LAYOUTS = {
  '16x9': { Z0: 1.56, Z1: 1.62, colW: 525, colZoom: 1.5, say: 1, chipS: 1 },
  '4x3': { narrow: true, Z0: 1.56, Z1: 1.62, colW: 420, colZoom: 1.2, say: 0.9, chipS: 0.8,
    chips: { kart: { x: 640, y: 281, side: 'r' }, item: { x: 412, y: 52, side: 'l' }, standings: { x: 836, y: 126, side: 'l' },
      minimap: { x: 206, y: 402, side: 'r' }, speed: { x: 770, y: 360, side: 'l' }, wave: { x: 470, y: 488, side: 'r' }, board: { x: 20, y: 166, side: 'b' } } },
  '1x1': { mob: true, k: 1.8, say: 0.82, chipS: 0.9,
    chips: { board: { x: 176, y: -24, side: 'a' }, item: { x: 540, y: -24, side: 'a' }, standings: { x: 900, y: -24, side: 'a' },
      minimap: { x: 170, y: 580, side: 'u' }, kart: { x: 540, y: 580, side: 'u' }, speed: { x: 906, y: 580, side: 'u' }, wave: { x: 352, y: 652, side: 'u' } } },
  '4x5': { mob: true, k: 2.0, say: 0.74, chipS: 0.82,
    chips: { board: { x: 140, y: -24, side: 'a' }, item: { x: 432, y: -24, side: 'a' }, standings: { x: 722, y: -24, side: 'a' },
      minimap: { x: 136, y: 469, side: 'u' }, kart: { x: 432, y: 469, side: 'u' }, speed: { x: 728, y: 469, side: 'u' }, wave: { x: 290, y: 534, side: 'u' } } },
};
// the mobile chrome in design px (xfeed.css .xf-mob): feed top bar + tabs, bottom tab bar; viewer top bar and the
// bottom dock (author line, first line of the post, counts row, reply field)
const MOB = { bar: 53, head: 106, foot: 53, vtop: 53, vbot: 24 + 20 + 48 + 52 };
let LY = null, MATCH = MATCH16;

// ---------------------------------------------------------------- the real posts (verbatim)
const IMG = (f) => U('../img/x/' + f);
const MED = (f) => U('../media/x/' + f);
const POSTS = [
  {
    handle: 'WoahWurdz', name: 'hiraeth', verified: true, date: 'Sep 22', hl: 'ONE SHOTTED',
    text: "Claude Opus 5.5 just ONE SHOTTED this Roblox Anime Super Smash Bros Game.\n\nI'm genuinely blown away by how much detail went into this. It's leagues above Fable.\n\nBuilt Only using toolbox and nothing else.",
    replies: 114, reposts: 209, likes: 3524, views: 448185, bookmarks: 2302,
    media: { video: MED('WoahWurdz.mp4'), poster: IMG('WoahWurdz-thumb.jpg'), w: 1462, h: 1128, dur: 133.47, src0: 24, off: 0.4, live: [0, 1.7] },
  },
  {
    handle: 'oozn', name: 'onur ozcan', verified: true, date: 'Sep 25', hl: 'one shotted',
    text: 'opus 5.5 one shotted this animation of steve jobs life\n\nafter seeing its animating capabilities i got curious and asked it to tell the story of steve jobs as an animation. \n\n2 minutes, one prompt, built entirely in code:\n\n→ remotion + react + svg, ~8.7k lines\n→ jointed character rig with a procedural walk cycle\n→ 23 custom transitions\n→ soundtrack synthesized in node, cuts locked to 120 bpm\n→ 3,570 frames, rendered in under 5 min\n\nimagine how you can monetize this on youtube educational content:\n\n→ history of legendary founders, animated series\n→ how empires were built, nike, lego, ferrari stories\n→ explained for kids, science and history in 2 min animations\n→ book summaries as animated stories\n→ turkish history animated for local audience\n\nwatch the full animation below, its worth the 2 minutes',
    replies: 4, reposts: 11, likes: 190, views: 17608, bookmarks: 254,
    media: { video: MED('oozn.mp4'), poster: IMG('oozn-thumb.jpg'), w: 1920, h: 1080, dur: 119.06, src0: 72, off: 0.2, live: [0, 2.5] },
  },
  {
    handle: 'ConnorPRose', name: 'Connor Rose', verified: true, date: 'Sep 24', hl: 'One-shotted',
    text: 'Opus 5.5 is truly insane. One-shotted this whole video from storyboard to full motion graphics, even the music is AI.',
    replies: 5, reposts: 1, likes: 28, views: 3481, bookmarks: 13,
    media: { video: MED('ConnorPRose.mp4'), poster: IMG('ConnorPRose-thumb.jpg'), w: 1920, h: 1080, dur: 62.85, src0: 16, off: 0.1, live: [0.4, 3.2] },
  },
  {
    handle: 'bridgemindai', name: 'BridgeMind', verified: true, date: 'Sep 22', hl: 'ONE SHOT', hero: true,
    time: '5:36 PM · Sep 22, 2026',
    text: 'Claude Opus 5.5 just ONE SHOT a Mario Kart game.\n\nThe result is way better than Fable 5.1. The attention to detail is on another level.\n\nOpus 5.5 actually created real characters. Mario, Luigi, in the game, playable. Fable 5.1 has never done that.\n\nInsanely impressed. This model is different.',
    replies: 177, reposts: 220, likes: 3623, views: 369641, bookmarks: 1018,
    // its inline video is the same clip trimmed to its first 4.6s (media/tkr-title.mp4)
    media: { video: U('../media/tkr-title.mp4'), poster: U('../img/tkr/title.jpg'), w: XR.clips.title.w, h: XR.clips.title.h, dur: 52.35, src0: 0, off: -0.6, live: [0.6, 5.6], clipEnd: 4.55 },
  },
  {
    handle: 'Deseloper1', name: 'Nidhanshu', verified: false, date: 'Sep 25', hl: null,
    text: "Opus 5.5 one shotted this in 23 minutes\nIt's done for Motion graphic designers\n\nThinking effort used: high\nTotal cost: $7.74\nTotal duration (API): 22m 49s\n\nIt used just about 0.5-1% of my Weekly usage limit ($200 Claude Max subscription)",
    replies: 4, reposts: 0, likes: 0, views: 49, bookmarks: 0,
    media: { poster: IMG('Deseloper1-thumb.jpg'), w: 1920, h: 1080, dur: 30.06 },
  },
];
POSTS.forEach((p) => { p.avatar = IMG(p.handle + '-avatar.jpg'); });
const HERO = POSTS.findIndex((p) => p.hero);
const hero = POSTS[HERO];

// ---------------------------------------------------------------- the X-ray (pieces over the frame at T)
const BRAND = (f) => U('../brand/' + f);
const M = {
  opus: { name: 'Claude Opus 5.5', logo: BRAND('claude-logo.svg'), tile: 'opus' },
  gemini: { name: 'Gemini', logo: BRAND('gemini-logo.svg'), tile: 'gem' },
  deepseek: { name: 'DeepSeek V4 Flash', logo: BRAND('deepseek-logo.svg'), tile: 'ds' },
  codex: { name: 'GPT-5 Codex', logo: BRAND('openai-logo.svg'), tile: 'codex' },
  lyria: { name: 'Lyria 2', logo: BRAND('gemini-logo.svg'), tile: 'gem' },
  eleven: { name: 'ElevenLabs', logo: BRAND('elevenlabs-logo.svg'), tile: 'eleven' },
  nano: { name: 'Nano Banana Pro', logo: BRAND('gemini-logo.svg'), tile: 'gem' },
};
// media box in the viewer (stage px): the left column, fit to the clip's aspect, centred vertically (16:9: 1395 wide;
// setLayout sizes it per ratio). KS: source px -> media box px. PERSP and every lift distance scale with the box, so a
// smaller box shows the same teardown, smaller.
let MB = null, KS = 1, PERSP = 1400;
// chip: the leader's far end in media px, and which side of it the chip sits on
const PIECES = [
// dx/dy: a drift toward the middle while lifting, so the perspective growth keeps edge pieces inside the media
  { key: 'kart', z: 140, rx: 9, ry: -7, dx: 0, dy: 0, who: ['opus'], job: 'drift physics', chip: { x: 860, y: 385, side: 'r' } },
  { key: 'item', z: 110, rx: -8, ry: 6, dx: 0, dy: 14, who: ['deepseek'], job: 'item odds research', chip: { x: 575, y: 80, side: 'l' } },
  { key: 'standings', z: 95, rx: 6, ry: -14, dx: -70, dy: 16, who: ['gemini'], job: '8-racer roster', chip: { x: 1150, y: 150, side: 'l' } },
  { key: 'minimap', z: 120, rx: 10, ry: 12, dx: 44, dy: -40, who: ['opus'], job: 'procedural track', chip: { x: 290, y: 545, side: 'r' } },
  { key: 'speed', z: 85, rx: 10, ry: -10, dx: -64, dy: -40, who: ['codex'], job: 'playtest at 60fps', chip: { x: 1050, y: 505, side: 'l' } },
  { key: 'wave', z: 100, rx: 8, ry: 4, dx: 0, dy: 0, who: ['lyria', 'eleven'], job: 'score + SFX', float: { x: 470, y: 628, w: 150, h: 58 }, chip: { x: 660, y: 657, side: 'r' } },
  { key: 'board', z: 110, rx: -6, ry: 10, dx: 0, dy: 0, who: ['nano'], job: 'portraits + logo', float: { x: 26, y: 146, w: 280, h: 45 }, chip: { x: 36, y: 238, side: 'b' } },
];
PIECES.forEach((p, i) => {
  p.i = i;
  p.src = p.key === 'wave' ? null : p.key === 'board' ? U('../img/tkr/' + XR.crops.board.file) : U('../img/tkr/' + XR.hudImg[p.key]);
  p.s0 = B.lift0 + i * B.liftStag;
});

/** pick the layout for frame ratio `key`: the media box, the pieces and tags in it, the match target */
function setLayout(key) {
  const base = LAYOUTS[key];
  const W = RATIO_W[key];
  const L = { ...base, key, W };
  const mbH = (w) => Math.round((w * XR.clips.main.h) / XR.clips.main.w);
  if (L.mob) {
    // the video full width, centred between the viewer's top bar and its bottom dock
    L.DW = W / L.k; L.DH = 1080 / L.k;
    const h = mbH(W), top = MOB.vtop * L.k, bot = 1080 - MOB.vbot * L.k;
    L.MB = { x: 0, y: Math.round((top + bot) / 2 - h / 2), w: W, h };
    L.Z0 = L.Z1 = L.k;
  } else {
    const w = W - L.colW, h = mbH(w);
    L.MB = { x: 0, y: Math.round((1080 - h) / 2), w, h };
  }
  L.f = L.MB.w / 1395; // 1 at 16:9
  L.say1 = { x: L.MB.x + L.MB.w / 2, y: L.MB.y + L.MB.h / 2 };
  L.say2 = { x: L.say1.x, y: L.MB.y + (L.MB.h * (420 - 181)) / 718 };
  LY = L; MB = L.MB; KS = MB.w / SRC_W; PERSP = 1400 * L.f; MATCH = MATCHES[key];
  PIECES.forEach((p) => {
    if (p.float) p.rect = L.f === 1 ? p.float : { x: p.float.x * L.f, y: p.float.y * L.f, w: p.float.w * L.f, h: p.float.h * L.f };
    else { const r = XR.hud[p.key]; p.rect = { x: r.x * KS, y: r.y * KS, w: r.w * KS, h: r.h * KS }; }
    p.c = (L.chips && L.chips[p.key]) || p.chip;
  });
  return L;
}

// ---------------------------------------------------------------- helpers
const ICON = (n) => U('../img/x/icons/' + n + '.svg');
const ic = (n, cls = '') => `<i class="xf-ic ${cls}" style="--m:url('${ICON(n)}')"></i>`;
/** x.com's compact count: 177, 3.6K, 17K, 369K, 1.2M (truncated, never rounded up); 0 shows nothing */
function fmt(n) {
  if (!n) return '';
  if (n < 1000) return String(n);
  if (n < 1e4) { const v = Math.floor(n / 100) / 10; return (Number.isInteger(v) ? v : v.toFixed(1)) + 'K'; }
  if (n < 1e6) return Math.floor(n / 1000) + 'K';
  const v = Math.floor(n / 1e5) / 10; return (Number.isInteger(v) ? v : v.toFixed(1)) + 'M';
}
const mmss = (s) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/** the timeline shows a long post's first 280 characters (cut at a word) and a Show more link */
function feedText(s) {
  if (s.length <= 280) return { text: s, more: false };
  let cut = s.slice(0, 281);
  const sp = cut.search(/\s\S*$/);
  if (sp > 200) cut = cut.slice(0, sp);
  return { text: cut.replace(/\s+$/, ''), more: true };
}
function textHTML(s, hl) {
  const i = hl ? s.indexOf(hl) : -1;
  if (i < 0) return esc(s);
  const w = esc(hl);
  return `${esc(s.slice(0, i))}<span class="xf-hl">${w}<span class="xf-hlc" aria-hidden="true">${w}</span></span>${esc(s.slice(i + hl.length))}`;
}
const tileHTML = (k) => `<span class="xf-tile xf-t-${M[k].tile}"><img src="${M[k].logo}" alt=""/></span>`;
const mix = (a, b, f) => a.map((v, i) => Math.round(lerp(v, b[i], f)));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
const lerpR = (a, b, f) => ({ x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), w: lerp(a.w, b.w, f), h: lerp(a.h, b.h, f) });

// ---------------------------------------------------------------- markup
function actHTML(p, big) {
  const a = (icon, n, cls) => `<span class="xf-a ${cls}">${ic(icon)}<span class="xf-n">${fmt(n)}</span></span>`;
  return `${a('lucide-message-circle', p.replies, 'rp')}${a('lucide-repeat-2', p.reposts, 'rt')}${a('lucide-heart', p.likes, 'lk')}${big ? '' : a('lucide-chart-no-axes-column', p.views, 'vw')}`
    + `<span class="xf-ar"><span class="xf-a xf-bm"><span class="xf-bmi">${ic('lucide-bookmark', 'xf-bmo')}${ic('ri-bookmark-fill', 'xf-bmf')}</span><span class="xf-n">${fmt(p.bookmarks)}</span></span>${big ? '' : `<span class="xf-a">${ic('lucide-share')}</span>`}</span>`;
}
function postHTML(p, i) {
  const ft = feedText(p.text);
  const m = p.media;
  const vid = m.video ? `<video class="xf-v" muted playsinline preload="auto" poster="${m.poster}" src="${m.video}"></video>` : `<img class="xf-v" src="${m.poster}" alt=""/>`;
  return `<article class="xf-post${p.hero ? ' xf-hero' : ''}" data-i="${i}">
  <img class="xf-av" src="${p.avatar}" alt=""/>
  <div class="xf-pb">
    <div class="xf-ph"><b class="xf-nm">${esc(p.name)}</b>${p.verified ? ic('material-symbols-verified', 'xf-badge') : ''}<span class="xf-hd">@${esc(p.handle)}</span><span class="xf-dot">·</span><span class="xf-dt">${p.date}</span><span class="xf-more">${ic('lucide-ellipsis')}</span></div>
    <div class="xf-tx">${textHTML(ft.text, p.hl)}${ft.more ? '<span class="xf-sm">Show more</span>' : ''}</div>
    <div class="xf-md" style="aspect-ratio:${m.w}/${m.h}">${vid}<span class="xf-dur">${mmss(m.dur)}</span><span class="xf-mute">${ic('ri-volume-mute-fill')}</span></div>
    <div class="xf-act">${actHTML(p, false)}</div>
  </div>
</article>`;
}
const NAV = [['ri-home-7-fill', 'Home', 1], ['ri-search-line', 'Explore'], ['ri-notification-3-line', 'Notifications'], ['ri-mail-line', 'Messages'],
  ['ri-bookmark-line', 'Bookmarks'], ['ri-group-line', 'Communities'], ['ri-twitter-x-fill', 'Premium'], ['ri-user-line', 'Profile'], ['lucide-circle-ellipsis', 'More']];
const FOLLOW = [3, 1, 0]; // who-to-follow: accounts already in this feed
function appHTML() {
  return `<div class="xf-app">
  <nav class="xf-nav">
    <div class="xf-logo">${ic('ri-twitter-x-fill')}</div>
    ${NAV.map(([i, l, on]) => `<div class="xf-ni${on ? ' on' : ''}">${ic(i)}<span>${l}</span></div>`).join('')}
    <div class="xf-postbtn">${LY.narrow ? ic('ri-quill-pen-line') : 'Post'}</div>
  </nav>
  <main class="xf-main">
    <div class="xf-scroll">
      <div class="xf-compose"><img class="xf-av" src="${IMG('default-avatar.png')}" alt=""/><div class="xf-cin"><div class="xf-cph">What’s happening?</div>
        <div class="xf-ctools">${['ri-image-line', 'ri-file-gif-line', 'ri-list-unordered', 'ri-emotion-line', 'ri-map-pin-line'].map((n) => ic(n)).join('')}<span class="xf-cpost">Post</span></div></div></div>
      ${POSTS.map(postHTML).join('')}
    </div>
    <div class="xf-head"><div class="xf-tab on">For you</div><div class="xf-tab">Following</div></div>
  </main>
  <aside class="xf-side">
    <div class="xf-search">${ic('ri-search-line')}<span>Search</span></div>
    <div class="xf-card"><h2>Subscribe to Premium</h2><p>Subscribe to unlock new features and if eligible, receive a share of revenue.</p><span class="xf-sub">Subscribe</span></div>
    <div class="xf-card xf-wtf"><h2>Who to follow</h2>${FOLLOW.map((k) => { const p = POSTS[k]; return `<div class="xf-fr"><img class="xf-av" src="${p.avatar}" alt=""/><div class="xf-fn"><b>${esc(p.name)}${p.verified ? ic('material-symbols-verified', 'xf-badge') : ''}</b><span>@${esc(p.handle)}</span></div><span class="xf-fb">Follow</span></div>`; }).join('')}</div>
  </aside>
</div>`;
}
// x.com's mobile web timeline (1:1, 4:5): top bar (avatar, X logo) over the tabs, one column of posts, the compose
// button and the bottom tab bar. The posts are the same markup as the desktop timeline.
const MNAV = ['ri-home-7-fill', 'ri-search-line', 'ri-group-line', 'ri-notification-3-line', 'ri-mail-line'];
function mobHTML() {
  return `<div class="xf-app" style="width:${LY.DW.toFixed(3)}px;height:${LY.DH.toFixed(3)}px">
  <main class="xf-main">
    <div class="xf-scroll">${POSTS.map(postHTML).join('')}</div>
  </main>
  <div class="xf-head xf-mhead">
    <div class="xf-mtop"><img class="xf-av" src="${IMG('default-avatar.png')}" alt=""/><span class="xf-mlogo">${ic('ri-twitter-x-fill')}</span></div>
    <div class="xf-mtabs"><div class="xf-tab on">For you</div><div class="xf-tab">Following</div></div>
  </div>
  <div class="xf-fab">${ic('ri-quill-pen-line')}</div>
  <nav class="xf-mfoot">${MNAV.map((n) => `<span>${ic(n)}</span>`).join('')}</nav>
</div>`;
}
function viewerHTML() {
  const p = hero;
  const c16 = LY.key === '16x9';
  const chips = PIECES.map((pc) => `<div class="xf-chip xf-side-${pc.c.side}" data-k="${pc.key}"><span class="xf-tiles">${pc.who.map(tileHTML).join('')}</span><span class="xf-cn"><b>${pc.who.map((k) => M[k].name).join(' + ')}</b><small>${esc(pc.job)}</small></span></div>`).join('');
  const pieces = PIECES.map((pc) => `<div class="xf-pc xf-pc-${pc.key}" style="left:${pc.rect.x.toFixed(2)}px;top:${pc.rect.y.toFixed(2)}px;width:${pc.rect.w.toFixed(2)}px;height:${pc.rect.h.toFixed(2)}px">${pc.src ? `<img src="${pc.src}" alt=""/>` : `<span class="xf-wave">${ic('lucide-audio-waveform')}${ic('lucide-audio-waveform')}${ic('lucide-audio-waveform')}</span>`}</div>`).join('');
  // off 16:9 the blueprint grid, the lift's perspective and the cards follow the media box
  const f = LY.f, gs = (116.25 * f).toFixed(3), gm = (23.25 * f).toFixed(3);
  const gridSt = c16 ? '' : ` style="background-size:${gs}px ${gs}px,${gs}px ${gs}px,${gm}px ${gm}px,${gm}px ${gm}px"`;
  const liftSt = c16 ? '' : ` style="perspective:${PERSP.toFixed(2)}px"`;
  const sayAt = (s, fs) => (c16 ? '' : ` style="left:${s.x.toFixed(1)}px;top:${s.y.toFixed(1)}px;font-size:${(fs * LY.say).toFixed(1)}px"`);
  const media = `<div class="xf-vmedia" style="left:${MB.x}px;top:${MB.y}px;width:${MB.w}px;height:${MB.h}px">
    <div class="xf-frame">
      <video class="xf-vt" muted playsinline preload="auto" src="${p.media.video}"></video>
      <video class="xf-vm" muted playsinline preload="auto" src="${U('../' + XR.clips.main.file)}"></video>
      <img class="xf-fz" src="${U('../img/tkr/' + XR.freezeImg.full)}" alt=""/>
      <div class="xf-grid"${gridSt}></div>
    </div>
    <div class="xf-lift"${liftSt}>${pieces}</div>
    <svg class="xf-leads" width="${MB.w}" height="${MB.h}" viewBox="0 0 ${MB.w} ${MB.h}">${PIECES.map(() => '<g><line pathLength="1"/><circle r="4.5"/></g>').join('')}</svg>
    <div class="xf-chips">${chips}</div>
    <div class="xf-pause">${ic('ri-pause-fill')}</div>
  </div>`;
  const reply = `<div class="xf-reply"><img class="xf-av" src="${IMG('default-avatar.png')}" alt=""/><span class="xf-rph">Post your reply</span><span class="xf-rbtn">Reply</span></div>`;
  const says = `<div class="xf-say xf-say1"${sayAt(LY.say1, 92)}><span class="xf-w">wanna</span> <span class="xf-w">know</span> <span class="xf-w">how?</span></div>
  <div class="xf-say xf-say2"${sayAt(LY.say2, 84)}><span class="xf-w">it’s</span> <span class="xf-w">not</span> <span class="xf-w">just</span> <span class="xf-w">Opus</span> <span class="xf-w">5.5.</span></div>`;
  if (LY.mob) {
    // X's mobile media viewer: close and menu on top, the video full width, the post and its counts under it and the
    // reply field pinned to the bottom (the chrome is design px under zoom --kc, like the timeline)
    const kz = `zoom:${LY.k};width:${LY.DW.toFixed(3)}px`;
    return `<div class="xf-viewer" style="width:${LY.W}px">
  <div class="xf-vbg" style="width:${LY.W}px"></div>
  <div class="xf-vclose xf-mvtop" style="${kz}">${ic('lucide-x')}<span class="xf-more">${ic('lucide-ellipsis')}</span></div>
  <div class="xf-vcol xf-mvbot" style="width:${LY.W}px"><div class="xf-z" style="${kz}">
    <div class="xf-mcap"><img class="xf-av" src="${p.avatar}" alt=""/><b>${esc(p.name)}</b>${ic('material-symbols-verified', 'xf-badge')}<span class="xf-hd">@${esc(p.handle)}</span></div>
    <div class="xf-mcapt">${esc(p.text.split('\n')[0])}</div>
    <div class="xf-vbar">${actHTML(p, false)}</div>
    ${reply}
  </div></div>
  ${media}
  ${says}
</div>`;
  }
  const colSt = c16 ? '' : ` style="left:${MB.w}px;width:${LY.colW}px"`;
  const zSt = c16 ? '' : ` style="zoom:${LY.colZoom}"`;
  const vbarW = Math.min(900, MB.w - 60);
  const vbarSt = c16 ? `left:${MB.x + (MB.w - 900) / 2}px` : `left:${MB.x + (MB.w - vbarW) / 2}px;width:${vbarW}px`;
  return `<div class="xf-viewer"${c16 ? '' : ` style="width:${LY.W}px"`}>
  <div class="xf-vbg"${c16 ? '' : ` style="width:${LY.W}px"`}></div>
  ${media}
  <div class="xf-vclose">${ic('lucide-x')}</div>
  <div class="xf-vbar" style="${vbarSt}">${actHTML(p, false)}</div>
  <div class="xf-vcol"${colSt}><div class="xf-z"${zSt}>
    <div class="xf-dhead"><img class="xf-av" src="${p.avatar}" alt=""/><div class="xf-dn"><b>${esc(p.name)}${ic('material-symbols-verified', 'xf-badge')}</b><span>@${esc(p.handle)}</span></div><span class="xf-more">${ic('lucide-ellipsis')}</span></div>
    <div class="xf-dtx">${esc(p.text)}</div>
    <div class="xf-dtime">${p.time} · <b>${fmt(p.views)}</b> Views</div>
    <div class="xf-dact">${actHTML(p, true)}<span class="xf-a">${ic('lucide-share')}</span></div>
    ${reply}
  </div></div>
  ${says}
</div>`;
}
function morphHTML() {
  return `<div class="xf-mbg"></div>
<div class="xf-morph">
  <div class="xf-mx"><img class="xf-av" src="${IMG('default-avatar.png')}" alt=""/><span class="xf-rph">Post your reply</span><span class="xf-rbtn">Reply</span></div>
</div>
<div class="xf-msb" style="font-size:${MATCH.ph.size}px;line-height:${MATCH.ph.lh}px;color:${MATCH.ph.color};padding-left:${MATCH.ph.pad}px">${esc(MATCH.ph.text)}</div>
<img class="xf-mrow" src="${IMG(MATCH.img)}" alt="" style="width:${MATCH.row.w}px;height:${MATCH.row.h}px"/>${MATCH.card ? `
<img class="xf-mrow xf-mcard" src="${IMG(MATCH.card.img)}" alt="" style="width:${MATCH.card.w}px;height:${MATCH.card.h}px;transform:translate(${MATCH.card.x}px,${MATCH.card.y}px)"/>` : ''}`;
}

// ---------------------------------------------------------------- video clock (pdoom-mv beats/play.js)
// Played while the timeline clock is really running; parked on exactly the frame lt asks for whenever it is held
// (?t= adds body.freeze, window.__AD.seek pauses the clock, or the clock has simply stopped advancing).
const SEED_TOL = 0.002, DRIFT_TOL = 0.2;
const HOLD = { on: false, fresh: false, t: NaN };
function hookSeek() {
  const ad = window.__AD;
  if (!ad || ad.__xfHold) return;
  const wrap = (f) => (typeof f === 'function' ? function (...a) { HOLD.on = true; HOLD.fresh = true; return f.apply(this, a); } : f);
  let wrapped = wrap(ad.seek);
  Object.defineProperty(ad, 'seek', { configurable: true, enumerable: true, get: () => wrapped, set: (f) => { wrapped = wrap(f); } });
  Object.defineProperty(ad, '__xfHold', { value: true });
}
const clk = { t: NaN, at: 0 };
function clockRunning(t) {
  const now = performance.now();
  if (t !== clk.t) { clk.t = t; clk.at = now; }
  hookSeek();
  if (HOLD.on) {
    if (HOLD.fresh) { HOLD.t = t; HOLD.fresh = false; } else if (Math.abs(t - HOLD.t) > 0.02) HOLD.on = false;
  }
  return !document.body.classList.contains('freeze') && !HOLD.on && now - clk.at < 150;
}
function drive(v, want, live, run) {
  if (!v) return;
  if (live && run) {
    if (v.paused) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
    if (Math.abs(v.currentTime - want) > DRIFT_TOL) v.currentTime = want;
  } else {
    if (!v.paused) v.pause();
    if (Math.abs(v.currentTime - want) > SEED_TOL) v.currentTime = want;
  }
}

// ---------------------------------------------------------------- scene state (DOM refs + cached layout)
let el = null;
// feed camera: design px -> stage px (1280x720 x.com at ~1.6; the mobile layouts hold their own k, LAYOUTS)
const COL_CX = 287 + 300;             // the timeline column's centre (design px)
const HEAD_H = 53;                    // the sticky For you / Following header
const zoomAt = (t) => lerp(LY.Z0, LY.Z1, inOutCubic(seg(t, 2.2, 4.4)));

function measure() {
  const st = el.scroll;
  const off = (n, anc) => { let x = 0, y = 0; while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x, y }; };
  const g = {};
  g.posts = el.posts.map((a) => ({ y: off(a, st).y, h: a.offsetHeight }));
  g.marks = el.posts.map((a) => { const m = a.querySelector('.xf-hl'); if (!m) return null; const o = off(m, st); return { y: o.y + m.offsetHeight / 2 }; });
  const hp = g.posts[HERO];
  const md = el.heroMedia;
  const mo = off(md, st);
  // the visible timeline in design px: its top (under the header), bottom, and where scroll y 0 sits
  let top, bot, s0;
  if (!LY.mob) {
    const vis = 1080 / LY.Z1;
    const room = vis - HEAD_H;
    g.target = hp.y - (hp.h <= room ? (room - hp.h) / 2 : 10);
    g.heroMedia = { x: 287 + 1 + mo.x, y: HEAD_H + mo.y, w: md.offsetWidth, h: md.offsetHeight };
    top = HEAD_H; s0 = HEAD_H;
  } else {
    // the top bar has slid away by the time the flick lands (only the tabs stay); the hero is centred in what is left
    // of the screen, or, when it is taller than that, parked with its header just under the tabs, scrolled on only as
    // far as it takes to keep at least 90% of its video above the bottom tab bar
    top = MOB.head - MOB.bar; bot = LY.DH - MOB.foot; s0 = MOB.head;
    const room = bot - top;
    const mb = mo.y + md.offsetHeight * 0.9;
    g.target = hp.h <= room ? s0 + hp.y - top - (room - hp.h) / 2 : Math.max(s0 + hp.y - top - 4, s0 + mb - bot);
    g.heroMedia = { x: mo.x, y: s0 + mo.y, w: md.offsetWidth, h: md.offsetHeight };
  }
  g.s0 = s0;
  // when each marked phrase crosses the middle of the visible timeline
  g.hlAt = g.marks.map((m, i) => {
    if (!m) return null;
    for (let t = 0; t <= B.settle; t += 1 / 240) {
      const y = s0 + m.y - scrollAt(t, g) - 16;
      const mid = LY.mob ? top + (bot - top) / 2 : HEAD_H + (1080 / zoomAt(t) - HEAD_H) / 2;
      if (y <= mid) return Math.max(0.12, t);
    }
    return null;
  });
  // the viewer's reply row, in stage px (viewer and its reply column untransformed)
  const vt = el.viewer.style.transform, ct = el.vcol.style.transform;
  el.viewer.style.transform = 'none';
  el.vcol.style.transform = 'none';
  const rb = el.reply.getBoundingClientRect(), rr = el.root.getBoundingClientRect();
  const k = rr.width / el.root.offsetWidth || 1;
  g.reply = { x: (rb.left - rr.left) / k, y: (rb.top - rr.top) / k, w: rb.width / k, h: rb.height / k };
  el.viewer.style.transform = vt;
  el.vcol.style.transform = ct;
  g.fonts = document.fonts ? document.fonts.status : 'loaded';
  el.g = g;
  return g;
}

// the timeline's scroll offset (design px): an inertial flick that decelerates into an 8px overshoot, then settles
const FLICK_K = 1.0;
function scrollAt(t, g) {
  const A = g.target + 8;
  if (t <= 0) return 0;
  if (t < B.land) return (A * (1 - Math.exp(-FLICK_K * t))) / (1 - Math.exp(-FLICK_K * B.land));
  return lerp(A, g.target, inOutCubic(seg(t, B.land, B.settle)));
}

function renderWords(ws, t, a, b) {
  const out = inOutCubic(seg(t, b - 0.24, b));
  ws.forEach((w, i) => {
    const p = outQuint(seg(t, a + i * 0.06, a + i * 0.06 + 0.5));
    w.style.opacity = (clamp(p * 1.15) * (1 - out)).toFixed(3);
    w.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 22).toFixed(2)}px)`;
    w.style.filter = p >= 1 ? 'none' : `blur(${((1 - p) * 9).toFixed(2)}px)`;
  });
  return seg(t, a, a + 0.1) * (1 - out);
}

export default {
  id: 'xfeed',
  dur: 11.0,

  mount(section) { build(section); },

  render(lt, ctx) {
    if (!el) return;
    // an unlocked ratio can change under a resized window (ar.js 'archange'): rebuild for the new frame
    if (el.key !== arKey()) build(el.section);
    renderAt(lt, ctx);
  },
};

function build(section) {
  const key = arKey();
  setLayout(key);
  const c16 = key === '16x9';
  const cls = LY.mob ? ' xf-v2 xf-mob' : LY.narrow ? ' xf-v2 xf-nar' : '';
  const rootSt = c16 ? '' : ` style="width:${LY.W}px;--kc:${LY.mob ? LY.k : LY.colZoom}"`;
  const camSt = LY.mob ? ` style="width:${LY.DW.toFixed(3)}px;height:${LY.DH.toFixed(3)}px"` : '';
  {
    section.innerHTML = `<div class="xf-root${cls}"${rootSt}>
  <svg class="xf-defs" width="0" height="0" aria-hidden="true"><filter id="xf-mb" x="0" y="-5%" width="100%" height="110%"><feGaussianBlur in="SourceGraphic" stdDeviation="0 0"/></filter></svg>
  <div class="xf-cam"${camSt}>${LY.mob ? mobHTML() : appHTML()}</div>
  ${viewerHTML()}
  ${morphHTML()}${LY.mob ? '\n  <div class="xf-tap"><i class="xf-tapr"></i><i class="xf-tapd"></i></div>' : ''}
</div>`;
    const q = (s) => section.querySelector(s);
    const qa = (s) => [...section.querySelectorAll(s)];
    const root = q('.xf-root');
    const cursor = makeCursor();
    root.appendChild(cursor);
    const posts = qa('.xf-post');
    el = {
      key, section, root, cursor, posts,
      mcard: q('.xf-mcard'), mhead: q('.xf-mhead'), fab: q('.xf-fab'), tap: q('.xf-tap'), tapd: q('.xf-tapd'), tapr: q('.xf-tapr'),
      mdim: qa('.xf-mvtop, .xf-mcap, .xf-mcapt, .xf-mvbot .xf-vbar'),
      cam: q('.xf-cam'), scroll: q('.xf-scroll'), blur: q('#xf-mb feGaussianBlur'),
      pvids: posts.map((a) => a.querySelector('video.xf-v')),
      durs: posts.map((a) => a.querySelector('.xf-dur')),
      hls: posts.map((a) => a.querySelector('.xf-hlc')),
      heroMedia: posts[HERO].querySelector('.xf-md'),
      heroBm: posts[HERO].querySelector('.xf-bm'),
      viewer: q('.xf-viewer'), vbg: q('.xf-vbg'), vmedia: q('.xf-vmedia'), frame: q('.xf-frame'),
      vt: q('.xf-vt'), vm: q('.xf-vm'), fz: q('.xf-fz'), grid: q('.xf-grid'),
      pcs: qa('.xf-pc'), leads: qa('.xf-leads g'), chips: qa('.xf-chip'), pause: q('.xf-pause'),
      vclose: q('.xf-vclose'), vbar: q('.xf-vbar'), vcol: q('.xf-vcol'), reply: q('.xf-vcol .xf-reply'),
      vbm: q('.xf-vcol .xf-bm'), vbarBm: q('.xf-vbar .xf-bm'),
      say1: q('.xf-say1'), say2: q('.xf-say2'), w1: qa('.xf-say1 .xf-w'), w2: qa('.xf-say2 .xf-w'),
      mbg: q('.xf-mbg'), morph: q('.xf-morph'), mx: q('.xf-mx'), msb: q('.xf-msb'), mrow: q('.xf-mrow'),
      g: null,
    };
    // muted as a property too (the attribute alone does not set it), and load() once attached: Chrome can refuse a
    // media load that started while the element was being parsed outside the document (finale worker, play.js)
    for (const v of [...el.pvids, el.vt, el.vm]) if (v) { v.muted = true; v.defaultMuted = true; v.load(); }
    // the viewer and the main clip already show the bookmark the post gets at B.bookmark
    el.vbm.classList.add('on');
    el.vbarBm.classList.add('on');
  }
}

function renderAt(lt, ctx) {
  {
    const t = clamp(lt, 0, 11.0);
    const W = (ctx && ctx.W) || 1920;
    el.root.style.left = (LY.key === '16x9' ? (W - 1920) / 2 : 0).toFixed(1) + 'px';
    const g = el.g && el.g.fonts === (document.fonts ? document.fonts.status : 'loaded') ? el.g : measure();
    const run = clockRunning(lt);

    // ---------------- the feed: camera, flick, marker sweeps, bookmark
    const Z = zoomAt(t);
    const S = scrollAt(t, g);
    const camX = LY.mob ? 0 : LY.W / 2 - COL_CX * Z;
    el.cam.style.transform = `translate(${camX.toFixed(2)}px,0px) scale(${Z.toFixed(5)})`;
    el.scroll.style.transform = `translateY(${(-S).toFixed(2)}px)`;
    // mobile: the top bar slides up with the first 53px of scroll, the tabs stay pinned
    // (the compose button fades with it, so the landed post is not covered)
    if (el.mhead) {
      const hide = Math.min(Math.max(S, 0), MOB.bar);
      el.mhead.style.transform = `translateY(${(-hide).toFixed(2)}px)`;
      el.fab.style.opacity = (1 - hide / MOB.bar).toFixed(3);
    }
    const v = (scrollAt(t + 1 / 60, g) - S) * 60; // design px per second
    const blur = t < B.land ? clamp((Math.abs(v) - 700) / 700, 0, 3.2) : 0;
    el.blur.setAttribute('stdDeviation', `0 ${blur.toFixed(2)}`);
    el.scroll.style.filter = blur > 0.05 ? 'url(#xf-mb)' : 'none';
    el.hls.forEach((h, i) => {
      if (!h) return;
      const a = g.hlAt[i];
      const p = a == null ? 0 : outCubic(seg(t, a, a + 0.12));
      h.style.clipPath = `inset(-2px ${((1 - p) * 100).toFixed(2)}% -2px 0)`;
    });
    const bm = seg(t, B.bookmark, B.bookmark + 0.3);
    el.heroBm.classList.toggle('on', t >= B.bookmark);
    el.heroBm.firstElementChild.style.transform = bm > 0 && bm < 1 ? `scale(${(1 + 0.35 * Math.sin(Math.PI * bm)).toFixed(3)})` : '';

    // feed videos (the hero's inline clip is TURBO KART RALLY's title, then CHOOSE YOUR RACER)
    POSTS.forEach((p, i) => {
      const vid = el.pvids[i];
      const m = p.media;
      if (!vid) return;
      const end = m.clipEnd || 4.95;
      const want = clamp(t + m.off, 0, end);
      drive(vid, want, t >= m.live[0] && t < m.live[1], run);
      const left = mmss(m.dur - m.src0 - want);
      if (el.durs[i].textContent !== left) el.durs[i].textContent = left;
    });

    // ---------------- the cursor: in, onto the video, click
    const hm = g.heroMedia;
    const toStage = (x, y) => ({ x: camX + x * Z, y: (y - (y >= g.s0 ? S : 0)) * Z });
    const mc = toStage(hm.x + hm.w * 0.56, hm.y + hm.h * 0.55);
    if (!LY.mob) {
      const cIn = inOutCubic(seg(t, B.curIn, B.click - 0.08));
      const cx = lerp(LY.W - 380, mc.x, cIn), cy = lerp(1130, mc.y, cIn) + Math.sin(cIn * Math.PI) * -40;
      const cVis = seg(t, B.curIn, B.curIn + 0.15) * (1 - seg(t, B.click + 0.18, B.click + 0.38));
      placeCursor(el.cursor, cx, cy, press(t, B.click), cVis);
    } else {
      // a phone has no pointer: a finger taps the video (a touch dot that presses, and a ripple off the tap)
      el.cursor.style.opacity = '0';
      const tv = seg(t, B.click - 0.16, B.click - 0.1) * (1 - seg(t, B.click + 0.12, B.click + 0.3));
      const rp = seg(t, B.click, B.click + 0.4);
      el.tap.style.visibility = tv > 0 || (rp > 0 && rp < 1) ? 'visible' : 'hidden';
      el.tap.style.transform = `translate(${mc.x.toFixed(1)}px,${mc.y.toFixed(1)}px)`;
      el.tapd.style.opacity = tv.toFixed(3);
      el.tapd.style.transform = `translate(-50%,-50%) scale(${(1 - 0.18 * press(t, B.click)).toFixed(3)})`;
      el.tapr.style.opacity = (rp > 0 ? 0.7 * (1 - outCubic(rp)) : 0).toFixed(3);
      el.tapr.style.transform = `translate(-50%,-50%) scale(${lerp(0.6, 2.4, outCubic(rp)).toFixed(3)})`;
    }

    // ---------------- the media viewer
    const open = outCubic(seg(t, B.open0, B.open1));
    const vOn = t >= B.open0;
    el.viewer.style.visibility = vOn ? 'visible' : 'hidden';
    // off 16:9 the push into the reply field barely scales the viewer, so the timeline would ghost through it as it
    // fades: the timeline is gone once the viewer has opened over it (opacity, not visibility: the filled bookmark
    // sets its own visibility and would stay behind)
    if (LY.key !== '16x9') el.cam.style.opacity = t >= B.open1 ? '0' : '1';
    el.heroMedia.style.visibility = vOn ? 'hidden' : 'visible';
    el.vbg.style.opacity = seg(t, B.open0, B.open0 + 0.25).toFixed(3);
    const chrome = seg(t, B.open0 + 0.12, B.open1);
    el.vcol.style.opacity = chrome.toFixed(3);
    el.vcol.style.transform = chrome >= 1 ? 'none' : LY.mob ? `translateY(${((1 - outCubic(chrome)) * 40).toFixed(2)}px)` : `translateX(${((1 - outCubic(chrome)) * 60).toFixed(2)}px)`;
    if (LY.mob) {
      // the X-ray takes the stage: the chrome around it (not the reply field) dims under the tags
      const dim = lerp(1, 0.22, inOutCubic(seg(t, B.xray0, B.xray1)));
      el.mdim.forEach((n) => { n.style.opacity = (n === el.vclose ? chrome * dim : dim).toFixed(3); });
    } else {
      el.vclose.style.opacity = chrome.toFixed(3);
      el.vbar.style.opacity = chrome.toFixed(3);
    }
    // the video flies from the post into the viewer (FLIP from its inline rect at this frame)
    const a0 = toStage(hm.x, hm.y);
    const from = { x: a0.x, y: a0.y, w: hm.w * Z, h: hm.h * Z };
    const r = lerpR(from, MB, open);
    const sc = r.w / MB.w;
    el.vmedia.style.transform = open >= 1 ? 'none' : `translate(${(r.x - MB.x).toFixed(2)}px,${(r.y - MB.y).toFixed(2)}px) scale(${sc.toFixed(5)})`;
    el.frame.style.borderRadius = open >= 1 ? '0' : `${((16 * Z * (1 - open)) / sc).toFixed(2)}px`;
    // title clip (the post's inline video) hands over to the race: tkr-main runs to T and holds there
    const heroM = hero.media;
    const tWant = clamp(t + heroM.off, 0, heroM.clipEnd);
    drive(el.vt, tWant, vOn && t < B.open1, run);
    const mainWant = clamp(t - MAIN_OFFSET, 0, FREEZE_AT);
    drive(el.vm, mainWant, t >= B.open0 && t < B.pause, run);
    el.vm.style.opacity = seg(t, B.open0 + 0.14, B.open1 - 0.06).toFixed(3);
    const frozen = t >= B.pause;
    el.fz.style.visibility = frozen ? 'visible' : 'hidden';

    // X-ray: desaturate + blueprint grid, pieces lift, leaders draw, chips land
    const xr = inOutCubic(seg(t, B.xray0, B.xray1));
    el.fz.style.filter = xr > 0 ? `saturate(${lerp(1, 0.35, xr).toFixed(3)}) brightness(${lerp(1, 0.78, xr).toFixed(3)})` : 'none';
    el.grid.style.opacity = xr.toFixed(3);
    const flat = inOutCubic(seg(t, B.flat0, B.flat1));
    const pulse = seg(t, B.pause, B.pause + 0.55);
    el.pause.style.opacity = (seg(pulse, 0, 0.15) * (1 - seg(pulse, 0.55, 1))).toFixed(3);
    el.pause.style.transform = `scale(${lerp(0.7, 1, outBack(seg(pulse, 0, 0.45))).toFixed(4)})`;
    const lineOut = 1 - seg(t, B.flat0 - 0.08, B.flat0 + 0.18);
    PIECES.forEach((pc, i) => {
      const n = el.pcs[i];
      const L = outCubic(seg(t, pc.s0, pc.s0 + 0.5)) * (1 - flat);
      const fl = pc.float ? outCubic(seg(t, pc.s0, pc.s0 + 0.4)) * (1 - flat) : 1;
      const shown = t >= B.xray0 && (pc.float ? fl > 0.001 : t < B.morph1);
      n.style.visibility = shown ? 'visible' : 'hidden';
      // off 16:9 every lift distance scales with the media box (LY.f, exactly 1 at 16:9)
      const s = LY.f, pdx = pc.dx * s, pdy = pc.dy * s;
      const bob = L * 5 * s * Math.sin(2.1 * (t - pc.s0) + i * 1.3);
      const z = pc.z * s * L + bob;
      n.style.opacity = pc.float ? fl.toFixed(3) : '1';
      n.style.transform = `translate3d(${(pdx * L).toFixed(2)}px,${(pdy * L).toFixed(2)}px,${z.toFixed(2)}px) rotateX(${(pc.rx * L).toFixed(2)}deg) rotateY(${(pc.ry * L).toFixed(2)}deg)`;
      n.style.filter = L > 0.002 ? `drop-shadow(0 ${(L * 20 * s).toFixed(1)}px ${(L * 22 * s).toFixed(1)}px rgba(0,0,0,${(0.25 + 0.5 * L).toFixed(3)}))` : 'none';
      n.classList.toggle('lit', L > 0.02);
      // leader: from the piece's projected edge to the chip
      const f = PERSP / (PERSP - z);
      const ox = MB.w / 2, oy = MB.h / 2;
      const pr = { x: ox + (pc.rect.x + pdx * L - ox) * f, y: oy + (pc.rect.y + pdy * L - oy) * f, w: pc.rect.w * f, h: pc.rect.h * f };
      const c = pc.c;
      const ax = c.side === 'r' ? pr.x + pr.w : c.side === 'l' ? pr.x : c.side === 'a' || c.side === 'u' ? pr.x + pr.w / 2 : pr.x + Math.min(pr.w / 2, 60);
      const ay = c.side === 'b' || c.side === 'u' ? pr.y + pr.h : c.side === 'a' ? pr.y : pr.y + pr.h / 2;
      const D = outCubic(seg(t, pc.s0 + 0.28, pc.s0 + 0.58)) * lineOut;
      const [ln, dot] = el.leads[i].children;
      ln.setAttribute('x1', ax.toFixed(1)); ln.setAttribute('y1', ay.toFixed(1));
      ln.setAttribute('x2', c.x.toFixed(1)); ln.setAttribute('y2', c.y.toFixed(1));
      ln.style.strokeDashoffset = (1 - D).toFixed(4);
      ln.style.opacity = D > 0 ? lineOut.toFixed(3) : '0';
      dot.setAttribute('cx', ax.toFixed(1)); dot.setAttribute('cy', ay.toFixed(1));
      dot.style.opacity = (seg(t, pc.s0 + 0.28, pc.s0 + 0.36) * lineOut).toFixed(3);
      const C = seg(t, pc.s0 + 0.5, pc.s0 + 0.85);
      const ch = el.chips[i];
      const cs = lerp(0.7, 1, outBack(C));
      const base = c.side === 'l' ? 'translate(-100%,-50%)' : c.side === 'r' ? 'translate(0,-50%)' : c.side === 'a' ? 'translate(-50%,-100%)' : c.side === 'u' ? 'translate(-50%,0)' : 'translate(0,0)';
      ch.style.left = c.x.toFixed(1) + 'px'; ch.style.top = c.y.toFixed(1) + 'px';
      ch.style.transform = `${base} scale(${(cs * LY.chipS).toFixed(4)})`;
      ch.style.opacity = (clamp(C * 2.2) * lineOut).toFixed(3);
    });

    // the cards (tweet voice over the media)
    el.say1.style.opacity = renderWords(el.w1, t, B.card1[0], B.card1[1]).toFixed(3);
    el.say2.style.opacity = renderWords(el.w2, t, B.card2[0], B.card2[1]).toFixed(3);

    // ---------------- match cut: push into the reply box; it becomes the superbot composer
    const m = inOutCubic(seg(t, B.morph0, B.morph1));
    const mOn = t >= B.morph0;
    const R0 = g.reply, R1 = MATCH.rc;
    const mr = lerpR(R0, R1, m);
    const zc = mr.w / R0.w;
    const tx = mr.x + mr.w / 2 - (R0.x + R0.w / 2) * zc, ty = mr.y + mr.h / 2 - (R0.y + R0.h / 2) * zc;
    el.viewer.style.transform = mOn ? `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${zc.toFixed(5)})` : 'none';
    el.viewer.style.opacity = (1 - seg(m, 0.28, 0.72)).toFixed(3);
    el.reply.style.visibility = mOn ? 'hidden' : 'visible';
    el.mbg.style.opacity = seg(m, 0.2, 0.7).toFixed(3);
    el.morph.style.visibility = mOn ? 'visible' : 'hidden';
    // the box is laid out in the tabs hub's design px and scaled by its k, so on the last frame it rasterises
    // exactly like the tabs composer card (radius, 1px ring and all)
    const K = MATCH.k;
    el.morph.style.transform = `translate(${mr.x.toFixed(3)}px,${mr.y.toFixed(3)}px) scale(${K})`;
    el.morph.style.width = (mr.w / K).toFixed(3) + 'px'; el.morph.style.height = (mr.h / K).toFixed(3) + 'px';
    el.morph.style.borderRadius = (MATCH.radius * m).toFixed(3) + 'px';
    el.morph.style.background = rgb(mix([0, 0, 0], MATCH.bg, m));
    el.morph.style.boxShadow = `inset 0 0 0 ${(MATCH.ringW * clamp(m * 1.5)).toFixed(3)}px ${rgb(MATCH.ring, seg(m, 0.15, 0.85))}`;
    el.mx.style.width = R0.w.toFixed(2) + 'px'; el.mx.style.height = R0.h.toFixed(2) + 'px';
    el.mx.style.transform = `scale(${(zc / K).toFixed(5)})`;
    el.mx.style.opacity = (1 - seg(m, 0.25, 0.55)).toFixed(3);
    // the superbot placeholder and control row ride the box, landing on the tabs frame's own pixels
    const ks = mr.w / R1.w;
    const at = (x, y) => `translate(${(mr.x + (x - R1.x) * ks).toFixed(3)}px,${(mr.y + (y - R1.y) * ks).toFixed(3)}px)`;
    el.msb.style.visibility = el.mrow.style.visibility = mOn ? 'visible' : 'hidden';
    el.msb.style.transform = `${at(MATCH.ph.x, MATCH.ph.y)} scale(${(K * ks).toFixed(5)})`;
    el.msb.style.opacity = seg(m, 0.45, 0.85).toFixed(3);
    el.mrow.style.transform = m >= 1 ? `translate(${MATCH.row.x}px,${MATCH.row.y}px)` : `${at(MATCH.row.x, MATCH.row.y)} scale(${ks.toFixed(5)})`;
    el.mrow.style.opacity = seg(m, 0.55, 0.95).toFixed(3);
    if (el.mcard) el.mcard.style.visibility = m >= 1 ? 'visible' : 'hidden';
  }
}
