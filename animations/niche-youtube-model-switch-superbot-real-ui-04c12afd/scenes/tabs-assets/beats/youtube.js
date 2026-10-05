// YouTube beat, the finale: superbot posts the replies as the creator, on YouTube itself. Its line streams and Google's
// OAuth consent card lands in the chat (the Google "G", "superbot wants access to your Google Account", the account
// chip "Sam Rivera" with no email address, two scope rows with Google's own consent strings for the YouTube Data API,
// Cancel / Continue). The pointer taps Continue, and the base's connect-card grammar follows: a checklist card
// ("Connected as Sam Rivera", "5 replies posted in your voice", "Hearted all 5 comments", "Pinned @priyanair's
// comment") with a mini window under it: "Connected" ticks on the tap and the other three keep spinning, because they
// are about to happen on the page; the card holds (CARD_HOLD) and the window opens to full frame (GROW).
// Full frame is youtube.com's watch page, light theme, signed in as the creator, scrolled to the comments, laid out at
// the real page's own 1920 x 1080 geometry (youtube.css: every size and colour is read off a headless capture of the
// live page) with YouTube's own icons (yt-real-icons.js). It holds 1:1 so it reads as the real page, then the camera
// inside the layer pushes in on the comments (ZOOM, anchored top-left, so the masthead stays in frame). superbot's
// reply opens under each comment one by one on YouTube's threadline (avatar 24, the creator's handle in the owner
// pill, "2 seconds ago"), each comment's heart turns into the creator heart, and the page scrolls to follow. Under the
// top five the page goes on with other viewers' comments (FILLERS), as a page with 1,284 comments does. The ONE bold
// moment (the chime): the page is back at the top, Priya's comment folds out of its place and opens at the top of the
// list under "Pinned by @samrivera" (a reflow, so nothing overlaps), and a light grey highlight fades. The final state
// holds (READ).
//
// There is ONE watch page, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The page is laid out
// once at the frame's size and scaled to the layer, so the mini window and the full frame are the same pixels at two
// sizes. On a portrait frame (4:5) it drops the right column, as youtube.com does at that width.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ms } from './yt-icons.js?v=04c12afd';
import { yi } from './yt-real-icons.js?v=04c12afd';
import { TOP } from './comments.js?v=04c12afd';
import { REPLIES } from './replies.js?v=04c12afd';

const SAY = 'Posting the replies on YouTube, as you.';
const ACCOUNT = 'Sam Rivera';
const HANDLE = '@samrivera';
// Google's consent strings for the two YouTube Data API scopes, verbatim from
// https://developers.google.com/identity/protocols/oauth2/scopes (fetched 2026-10-03): youtube.force-ssl, youtube
const SCOPES = [
  'See, edit, and permanently delete your YouTube videos, ratings, comments and captions',
  'Manage your YouTube account',
];
// the first ticks on the tap; the rest spin on into the page, where they happen
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['youtube', 'Posting 5 replies in your voice'],
  ['favorite', 'Hearting all 5 comments'],
  ['keep', `Pinning <b>${TOP[0][0]}</b>'s comment`],
];
// the list as YouTube sorts it before the pin (Top comments): Priya's question sits second, under Marco's, until
// superbot pins it
const ORDER = [1, 0, 2, 3, 4];               // indexes into comments.js TOP
const PINNED = 0;                            // TOP[0], Priya
const AGE = ['2 hours ago', '3 hours ago', '2 hours ago', '1 hour ago', '3 hours ago']; // by TOP index
const COUNT = '1,284';
const REPLY_AGE = '2 seconds ago';
// other viewers' comments under the top five: [handle, comment, likes, age, avatar colour, replies toggle or null
// ([replier letter, colour, count])]; made up for the spot
const FILLERS = [
  ['@jonnykaudio', 'Would love a follow-up running the same mics through a cheap interface instead of straight USB.', '312', '1 hour ago', '#0b8043', ['A', '#e37400', 4]],
  ['@audiobyalex', 'Your editor deserves a raise for that blind test edit.', '288', '2 hours ago', '#5e35b1', null],
  ['@kevmakesthings', 'Any thoughts on the Fifine K688 at that price?', '201', '1 hour ago', '#c2185b', ['R', '#00838f', 2]],
  ['@sarapodcasts', 'Ordered the $49 one after this. My room sounds way better already.', '167', '58 minutes ago', '#6d4c41', null],
];
// the right column: related videos (Pexels photos, img/CREDITS.txt; titles, channels and counts made up for the spot)
const RELATED = [
  ['rel-4319926.jpg', 'Stop buying condenser mics for streaming', 'Audio Desk', '412K', '8mo ago', '11:46'],
  ['rel-11884525.jpg', 'PodMic 2 vs MV7+: the blind test nobody asked for', 'Nora Park', '231K', '5mo ago', '16:20'],
  ['rel-33231527.jpg', 'My $60 podcast setup that sounds like $600', 'Two Mic Show', '1.2M', '2y ago', '13:58'],
  ['rel-16530090.jpg', 'Three years with a $50 USB mic', 'Desk Setup Lab', '98K', '1y ago', '9:03'],
  ['rel-10933701.jpg', 'Do you actually need a pop filter?', 'Studio Notes', '64K', '3w ago', '7:41'],
  ['rel-6892700.jpg', 'Best headsets for streaming in 2026', 'Kit Check', '305K', '2mo ago', '12:12'],
];
// the creator heart's red fill: the inner contour of YouTube's own heart outline (YI.heart), so the white ring sits on it
const HEART_FILL = '<path d="M16.25 4.5c2.623 0 4.75 2.239 4.75 5 0 7.089-9 11-9 11s-9-3.911-9-11c0-2.761 2.127-5 4.75-5a4.58 4.58 0 012.922 1.058A5 5 0 0112 7.265a5 5 0 011.328-1.707A4.58 4.58 0 0116.25 4.5Z"/>';
// youtube.com's own layout at each of the gallery's frame widths (1080 tall), measured on the live page (work dir
// ref/ref.json, ref4.json): the search pill [left, width], the voice button's left, the comments column's width, the
// right column's left (null: below 1016 px YouTube drops it under the comments, out of this view) and its thumbnail
// [w, h]; zoom is the push-in on the comments (the page's px to frame px): just enough that the right column leaves the
// frame whole (no strip of cropped thumbnails) while the comments column still fits; 1 at 864, where it already fills
const LAYOUTS = [
  { w: 1920, pill: [642, 536], voice: 1258, pri: 1344, sec: 1376, th: [330, 186], zoom: 1.4 },
  { w: 1440, pill: [402, 536], voice: 1018, pri: 931, sec: 963, th: [288, 162], zoom: 1.5 },
  { w: 1080, pill: [261, 458], voice: 799, pri: 686, sec: 718, th: [216, 121], zoom: 1.51 },
  { w: 864, pill: [245, 258], voice: 583, pri: 832, sec: null, th: null, zoom: 1 },
];
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                            // the line streams, then the consent card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const TAP_AT = 0.6; /* deliberate */             // the consent card landed to the tap on Continue (it reads first)
const PTR_IN = 0.28;                             // the consent card landed to the pointer appearing
const PTR_MOVE = 0.36;                           // the pointer's travel onto Continue, ending just before the tap
const LIST_AT = 0.25;                            // the tap to the checklist card landing
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const POP = 0.16;                                // a check popping in
const ROWS_AT = 0.15;                            // the checklist landing to the page fading up in its window
const CARD_HOLD = 0.5; /* deliberate */          // "Connected" ticked, the card holds (the three in-progress rows read) before it opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const SEE = 0.35; /* deliberate */               // full frame at 1:1: it reads as youtube.com before the push
const PUSH = 0.5;                                // the push-in on the comments (inOutCubic)
const REP_AT = 0.15;                             // the push starting to the first reply opening
const REP_STAGGER = 0.24;                        // one reply to the next (top to bottom)
const REP_IN = 0.3;                              // a reply's slot opening and its content fading up
const HEART_AT = 0.12;                           // a reply opening to its comment's heart turning
const HEART_IN = 0.2;
const FOLLOW = 0.36;                             // the page scrolling to keep the newest reply in view
const BACK_AT = 0.12;                            // the last reply settled to the page scrolling back up
const BACK = 0.36;                               // the scroll back to the top (inOutCubic)
const PIN_AT = 0.05;                             // back at the top to the pin (the chime)
const MOVE = 0.5;                                // Priya's comment travelling to the top, its pinned label opening
const WASH = 1.1;                                // the pinned comment's light grey highlight fading back to white
const READ = 1.0; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the consent card lands
    T.tap = T.card + TAP_AT;                           // Continue is tapped
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = T.list + CHECK_AT;                          // "Connected" ticks
    T.page = T.list + ROWS_AT;                         // the page fades up in the mini window
    T.grow = T.ok + POP + CARD_HOLD;                   // the window starts opening
    T.full = T.grow + GROW;                            // full frame, 1:1
    T.push = T.full + SEE;                             // the camera starts in on the comments
    T.rep = ORDER.map((_, i) => T.push + REP_AT + i * REP_STAGGER); // superbot's replies open, top to bottom
    T.back = T.rep[ORDER.length - 1] + REP_IN + BACK_AT; // the page scrolls back to the top
    T.pin = T.back + BACK + PIN_AT;                    // Priya's comment is pinned (the chime)
    T.settle = T.pin + MOVE;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.pin });
    // ---- the consent card in the chat ----
    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="gc-card">
      <div class="gc-top"><img src="${icon('google-g.svg')}" alt=""/><span>Sign in with Google</span></div>
      <div class="gc-body">
        <div class="gc-title">superbot wants access to your Google Account</div>
        <span class="gc-acct"><i class="gc-av">S</i>${esc(ACCOUNT)}${ms('keyboard-arrow-down', 'gc-dd')}</span>
        <div class="gc-sel">Select what <b>superbot</b> can access</div>
        ${SCOPES.map((txt) => `<div class="gc-row"><img src="${icon('youtube-icon.svg')}" alt=""/><span>${esc(txt)}</span><i class="gc-cb">${ms('check')}</i></div>`).join('')}
        <div class="gc-btns"><span class="gc-cancel">Cancel</span><span class="gc-go">Continue</span></div>
      </div>
    </div>`);
    const go = consent.querySelector('.gc-go');
    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av">S</span>'
      : kind === 'youtube' ? `<span class="gk-ic gk-img"><img src="${icon('youtube-icon.svg')}" alt=""/></span>`
        : `<span class="gk-ic gk-ms${kind === 'favorite' ? ' gk-heart' : ''}">${ms(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));
    // ---- the full-frame watch page ----
    const av = (letter, c, cls = '') => `<span class="yw-av ${cls}" style="--c: ${c}">${esc(letter)}</span>`;
    const heartOn = `<span class="yw-hon">${av('S', '#1e8e3e', 'yw-av24')}<span class="yw-hrt"><svg class="yi yw-hf" viewBox="0 0 24 24" aria-hidden="true">${HEART_FILL}</svg>${yi('heart', 'yw-hl')}</span></span>`;
    const tools = (likes, heart) => `<div class="yw-tb"><span class="yw-b32">${yi('like')}</span>${likes ? `<span class="yw-ct">${likes}</span>` : ''}<span class="yw-b32">${yi('dislike')}</span>${heart ? `<span class="yw-hb">${yi('heart', 'yw-h0')}${heartOn}</span>` : ''}<span class="yw-rb">Reply</span></div>`;
    // a top-five thread; pinned: the copy that opens at the top of the list, already answered, hearted and pinned
    const thread = (ti, pinned = false) => {
      const [name, text, likes, , c] = TOP[ti];
      return `<div class="yw-th${pinned ? ' yw-done' : ''}"${pinned ? '' : ` data-i="${ti}"`}><i class="yw-wash"></i>
        <div class="yw-cm">${av(name[1].toUpperCase(), c)}<i class="yw-line"></i>
          <div class="yw-main">
            ${pinned ? `<div class="yw-pin">${yi('pin')}<span>Pinned by ${esc(HANDLE)}</span></div>` : ''}
            <div class="yw-hd"><span class="yw-au">${esc(name)}</span><span class="yw-tm">${AGE[ti]}</span></div>
            <div class="yw-tx">${esc(text)}</div>
            ${tools(likes, true)}
          </div>
        </div>
        <div class="yw-rslot"><div class="yw-rp"><i class="yw-conn"></i>${av('S', '#1e8e3e', 'yw-av24')}
          <div class="yw-main"><div class="yw-hd"><span class="yw-own">${esc(HANDLE)}</span><span class="yw-tm">${REPLY_AGE}</span></div>
            <div class="yw-tx">${esc(REPLIES[ti])}</div>${tools('', false)}</div></div></div>
      </div>`;
    };
    const filler = ([name, text, likes, age, c, more]) => `<div class="yw-th yw-fill">
        <div class="yw-cm">${av(name[1].toUpperCase(), c)}${more ? '<i class="yw-line"></i>' : ''}
          <div class="yw-main"><div class="yw-hd"><span class="yw-au">${esc(name)}</span><span class="yw-tm">${age}</span></div>
            <div class="yw-tx">${esc(text)}</div>${tools(likes, true)}</div></div>
        ${more ? `<div class="yw-more"><i class="yw-conn"></i>${av(more[0], more[1], 'yw-av24')}<span class="yw-mb"><span class="yw-dot">·</span>${more[2]} ${more[2] === 1 ? 'reply' : 'replies'}${yi('chevron')}</span></div>` : ''}
      </div>`;
    const lockup = ([img, title, channel, views, age, len]) => `<div class="yw-lk"><span class="yw-thm"><img src="${x.img(img)}" alt=""/><i class="yw-dur">${len}</i></span>
      <div class="yw-meta"><h3 class="yw-lt">${esc(title)}</h3><div class="yw-lc">${esc(channel)}</div><div class="yw-ls">${yi('views')}<span>${views}</span><span>${age}</span></div></div></div>`;
    const layer = x.el(`<div class="yw-full" aria-hidden="true"><div class="yw-app">
      <div class="yw-scroll">
        <div class="yw-pri">
          <div class="yw-ch"><h2>${COUNT} Comments</h2><span class="yw-sort">${yi('sort')}<span>Sort by</span></span></div>
          <div class="yw-sbox">${av('S', '#1e8e3e', 'yw-av24')}<span class="yw-ph">Add a comment...</span></div>
          <div class="yw-list"><div class="yw-pinslot">${thread(PINNED, true)}</div>${ORDER.map((ti) => thread(ti)).join('')}${FILLERS.map(filler).join('')}</div>
        </div>
        <div class="yw-sec">${RELATED.map(lockup).join('')}</div>
      </div>
      <header class="yw-top">
        <span class="yw-ib yw-guide">${yi('guide')}</span>
        <span class="yw-logo">${yi('logo')}</span>
        <div class="yw-search"><span class="yw-in">Search</span><span class="yw-sb">${yi('search')}</span></div>
        <span class="yw-ib yw-mic">${yi('mic')}</span>
        <div class="yw-end"><span class="yw-create">${ms('add-rounded')}Create</span><span class="yw-ib">${ms('notifications-outline')}</span>${av('S', '#1e8e3e', 'yw-me')}</div>
      </header>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const scroller = $('.yw-scroll'), pri = $('.yw-pri');
    // display order: blocks[i] is the comment ORDER[i]
    const blocks = [...layer.querySelectorAll('.yw-th[data-i]')].map((n) => ({
      n, i: +n.dataset.i,
      rslot: n.querySelector('.yw-rslot'), rep: n.querySelector('.yw-rp'), line: n.querySelector('.yw-line'),
      h0: n.querySelector('.yw-h0'), hon: n.querySelector('.yw-hon'), hb: n.querySelector('.yw-hb'), wash: n.querySelector('.yw-wash'),
      rH: '', need: 0,
    }));
    const pinB = blocks.find((b) => b.i === PINNED);
    const pinSlot = $('.yw-pinslot'), pinCopy = pinSlot.firstElementChild, pinWash = pinCopy.querySelector('.yw-wash');
    // the page's type is Roboto (vendored, youtube.css); the consent card's is Google Sans Flex: ask for every face up
    // front so a seek never measures a slot in the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 16px "GSF"`));
    }
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, pH = '', oH = '';
    let AW = 1920, AH = 1080, ZOOM = 1.4;
    // the page is laid out at the frame's own size, in youtube.com's layout for the nearest measured width. Each reply's scroll target is
    // measured here once, with every reply open: a thread's bottom then is where it sits when its own reply opens,
    // since only the replies above it have opened by then.
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}:${document.fonts ? document.fonts.status : ''}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      AW = W; AH = H;
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      const L = LAYOUTS.reduce((a, b) => (Math.abs(b.w - W) < Math.abs(a.w - W) ? b : a));
      ZOOM = L.zoom;
      const v = { '--pill-l': L.pill[0], '--pill-w': L.pill[1], '--voice-l': L.voice, '--pri-w': L.pri };
      if (L.sec) Object.assign(v, { '--sec-l': L.sec, '--sec-w': AW - 16 - L.sec, '--th-w': L.th[0], '--th-h': L.th[1] });
      Object.entries(v).forEach(([k2, val]) => app.style.setProperty(k2, `${val}px`));
      app.classList.toggle('yw-narrow', !L.sec);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('gc-tall', tall);
      blocks.forEach((b) => { b.rslot.style.height = 'auto'; });
      const view = AH / ZOOM;
      blocks.forEach((b) => { b.need = Math.max(0, pri.offsetTop + b.n.offsetTop + b.n.offsetHeight + 24 - view); });
      pH = ''; oH = ''; blocks.forEach((b) => { b.rH = ''; });
    };
    // the page's scroll: it follows each reply as it opens, then glides back to the top for the pin
    const scrollAt = (t) => {
      let s = 0;
      blocks.forEach((b, i) => { s = lerp(s, b.need, inOutCubic(seg(t, T.rep[i], T.rep[i] + FOLLOW))); });
      return lerp(s, 0, inOutCubic(seg(t, T.back, T.back + BACK)));
    };
    // the pointer: in from below right, onto Continue, a press, then away
    const ptr = (t) => {
      const a = T.card + PTR_IN, b = T.tap - 0.08;
      if (t < a || t > T.tap + 0.45) return null;
      const g = x.box(go);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
      const m = inOutCubic(seg(t, a, a + PTR_MOVE > b ? b : a + PTR_MOVE));
      const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
      return {
        x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30,
        p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave),
      };
    };
    return {
      nodes: [say, consent, card],
      marks: [[T.r, say], [T.card, consent], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        consent.style.opacity = ci.toFixed(3);
        consent.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Continue: the press, then it stays in its pressed (state-layer) tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('gc-hit', t >= T.tap);
        const li = outCubic(seg(t, T.list, T.list + CARD_IN));
        card.style.opacity = li.toFixed(3);
        card.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 14).toFixed(2)}px)`;
        // "Connected" resolves to its check; the three actions keep spinning, they happen on the page
        checks.forEach((c, i) => {
          const o = i === 0 ? outCubic(seg(t, T.ok, T.ok + POP)) : 0;
          c.spin.style.opacity = (i === 0 ? 1 - seg(t, T.ok - 0.06, T.ok + 0.04) : 1).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        app.style.opacity = outCubic(seg(t, T.page, T.page + 0.25)).toFixed(3);
        // superbot's replies open under the comments one by one; each comment's heart turns into the creator heart
        blocks.forEach((b, i) => {
          const g = outCubic(seg(t, T.rep[i], T.rep[i] + REP_IN));
          const h = b.rep.offsetHeight;
          const want = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
          if (want !== b.rH) { b.rslot.style.height = want; b.rH = want; }
          const rf = outCubic(seg(t, T.rep[i] + REP_IN * 0.3, T.rep[i] + REP_IN));
          b.rep.style.opacity = rf.toFixed(3);
          b.rep.style.transform = rf >= 1 ? 'none' : `translateY(${((1 - rf) * -6).toFixed(2)}px)`;
          b.line.style.opacity = g.toFixed(3);
          const hp = outCubic(seg(t, T.rep[i] + HEART_AT, T.rep[i] + HEART_AT + HEART_IN));
          b.hon.style.opacity = hp.toFixed(3);
          b.h0.style.opacity = (1 - hp).toFixed(3);
          const pop = Math.sin(Math.PI * seg(t, T.rep[i] + HEART_AT, T.rep[i] + HEART_AT + HEART_IN));
          b.hon.style.transform = pop > 0 ? `scale(${(1 + 0.18 * pop).toFixed(4)})` : 'none';
        });
        // the pin, as a reflow (nothing overlaps): Priya's comment folds out of its place while its pinned copy opens at
        // the top of the list and fades up, so everything between them moves down one comment in step
        const m = inOutCubic(seg(t, T.pin, T.pin + MOVE));
        const oh = pinB.n.scrollHeight;
        const ow = m <= 0 ? '' : `${(oh * (1 - m)).toFixed(2)}px`;
        if (ow !== oH) {
          pinB.n.style.height = ow;
          pinB.n.style.overflow = ow ? 'hidden' : '';
          pinB.n.style.marginBottom = ow ? `${(16 * (1 - m)).toFixed(2)}px` : '';
          oH = ow;
        }
        pinB.n.style.opacity = (1 - seg(t, T.pin, T.pin + MOVE * 0.4)).toFixed(3);
        const ph = pinCopy.offsetHeight + 16;
        const pw = m >= 1 ? 'auto' : `${(ph * m).toFixed(2)}px`;
        if (pw !== pH) { pinSlot.style.height = pw; pH = pw; }
        pinCopy.style.opacity = outCubic(seg(t, T.pin + MOVE * 0.35, T.pin + MOVE)).toFixed(3);
        pinWash.style.opacity = (t < T.pin ? 0 : 1 - inOutCubic(seg(t, T.pin + MOVE, T.pin + MOVE + WASH))).toFixed(3);
        scroller.style.transform = `translateY(${(-scrollAt(t)).toFixed(2)}px)`;
      },
      // after the camera: pin the layer over the card's window, open it to the whole frame, then push in on the comments
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        const z = lerp(1, ZOOM, inOutCubic(seg(t, T.push, T.push + PUSH)));
        app.style.transform = `scale(${((Wd / AW) * z).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
