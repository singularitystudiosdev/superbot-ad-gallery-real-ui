// Studio beat, the finale: superbot posts the replies as the creator and pins the best one in YouTube Studio. Its line
// streams and Google's OAuth consent card lands in the chat (the Google "G", "superbot wants access to your Google
// Account", the account chip "Sam Rivera", the two YouTube Data API scope rows in Google's own consent strings, Cancel /
// Continue). The pointer taps Continue and the checklist card follows ("Connected as Sam Rivera", "5 replies posted as
// @SamRivera", then "Pinning Priya's comment in Studio" still spinning: the Data API can post replies (comments.insert)
// but has no pin, so that last step is done by hand in Studio) with a mini window under it, which opens to full frame.
//
// Full frame is YouTube Studio as it looks in 2026, dark theme, on the video's own Comments page (Help 9482367: Pin is
// only offered when viewing an individual video's comments): the header (menu, the Studio logo, "Search across your
// channel", the Inspiration / help / notifications buttons, "Ask Studio" and "Create" pills, the avatar), the video
// menu (Channel content, the thumbnail, Your video, Details / Analytics / Editor / Comments / Languages / Earn / Claims /
// Clips, Settings, Send feedback), "Video comments" with the Published / Most relevant / Search chips, and Studio's
// comment rows (checkbox, avatar, @handle, age, subscriber badge, the text, Reply pill, replies toggle, like / dislike /
// heart / more, the reply suggestions). Layout and colours are measured from 2026 Studio screenshots (brand/CREDITS.txt).
// The rows sit in Studio's "Most relevant" order, which here is the like order Gemini ranked by: Priya, Marco, Kai,
// Lena, Dee (each with its like count).
//
// Once it is full frame each posted reply lands under its comment, one by one (the suggestions give way to "1 reply"
// and @SamRivera's answer in the owner pill, its age counting up from the moment it posted). Then the pointer does the pin by hand: Priya's more button, the menu (Pin,
// Remove, Report, Hide user from channel), "Pin", YouTube's "Pin this comment?" dialog, "Pin". The ONE bold moment (the
// chime): Priya's comment, already first, gains "Pinned by @SamRivera" and its row flares. The final state holds (READ).
//
// There is ONE Studio client, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it drops the video menu and the header tools.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press, path } from '../../../lib.js';
import { ms } from './yt-icons.js?v=0b34d5a7';
import { si } from './st-icons.js?v=0b34d5a7';
import { TOP, VIDEO } from './watch.js?v=0b34d5a7';
import { REPLIES } from './replies.js?v=0b34d5a7';

const SAY = 'Posting as you. Pins aren\'t in the API, so I\'ll pin it in Studio.';
const ACCOUNT = 'Sam Rivera';
const HANDLE = '@SamRivera';
// Google's consent strings for the two YouTube Data API scopes, verbatim from
// https://developers.google.com/identity/protocols/oauth2/scopes (fetched 2026-10-03): youtube.force-ssl, youtube
const SCOPES = [
  'See, edit, and permanently delete your YouTube videos, ratings, comments and captions',
  'Manage your YouTube account',
];
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['youtube', `Posting 5 replies as ${HANDLE}`],
  ['keep', 'Pinning Priya\'s comment in Studio'],
];
// Studio's "Most relevant" order (indexes into watch.js TOP): the like order Gemini ranked by, Priya first; each
// comment's age
const ORDER = [0, 1, 2, 3, 4];
const AGE = ['12 days ago', '11 days ago', '3 days ago', '9 days ago', '6 days ago']; // by TOP index
const PINNED = 0;                                // TOP[0], Priya
const NAV = [
  ['edit', 'Details'], ['analytics', 'Analytics'], ['editor', 'Editor'], ['comments', 'Comments', true],
  ['languages', 'Languages'], ['earn', 'Earn'], ['claims', 'Claims'], ['clips', 'Clips'],
];
const MENU = [['pin', 'Pin'], ['delete', 'Remove'], ['flag', 'Report'], ['hide-user', 'Hide user from channel']];
// the reply suggestions Studio offers under an unanswered comment (2026 Studio), by TOP index
const SUGGEST = [['Great question!', 'Thanks for asking!'], ['Thanks, Marco!', 'Glad you liked it!'], ['Good question!', 'Let me check'],
  ['Thanks, Lena!', 'Glad you like it!'], ['Noted!', 'Coming soon!']];

const APP_SCALE = { wide: 1.2, tall: 1.2 };      // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                            // the line streams, then the consent card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const TAP_AT = 0.7; /* deliberate */             // the consent card landed to the tap on Continue (it reads first)
const PTR_IN = 0.28;                             // the consent card landed to the pointer appearing
const PTR_MOVE = 0.36;                           // the pointer's travel onto Continue, ending just before the tap
const LIST_AT = 0.25;                            // the tap to the checklist card landing
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.18;                      // one check to the next
const POP = 0.16;                                // a check popping in
const ROWS_AT = 0.15;                            // the checklist landing to the first comment row filling in
const ROW_STAGGER = 0.06;                        // one comment row to the next
const ROW_IN = 0.24;
const CARD_HOLD = 0.3; /* deliberate */          // the second check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the window opens to full frame
const REP_AT = 0.15;                             // full frame to the first reply opening
const REP_STAGGER = 0.26; /* deliberate */       // one reply to the next (top to bottom): each post is seen landing
const REP_IN = 0.32;                             // a reply's slot opening and its content fading up
const PTR2_AT = 0.1;                             // the last reply opening to the pointer coming in
const TO_MORE = 0.42;                            // the pointer's travel onto Priya's more button
const MENU_IN = 0.16;                            // the menu opening
const TO_ITEM = 0.3;                             // the pointer's travel onto "Pin"
const DLG_AT = 0.1;                              // "Pin" tapped to the dialog opening
const DLG_IN = 0.2;
const TO_OK = 0.36;                              // the pointer's travel onto the dialog's Pin (the dialog reads)
const DLG_OUT = 0.14;
const PIN_AT = 0.1;                              // the dialog closing to the pin landing (the chime)
const MOVE = 0.45;                               // Priya's pinned label opening above her comment
const WASH = 1.2;                                // the pinned comment's wash fading out
const READ = 2.2; /* deliberate */               // the pinned result holds, readable, before the scene's fade
const RADIUS = 10;                               // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the consent card lands
    T.tap = T.card + TAP_AT;                           // Continue is tapped
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = [T.list + CHECK_AT];                        // only the connection ticks in the chat; posting and pinning run on
    T.rows = ORDER.map((_, i) => T.list + ROWS_AT + i * ROW_STAGGER); // the comment rows fill in (display order)
    T.grow = T.ok[0] + CHECK_STAGGER + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.rep = ORDER.map((_, i) => T.full + REP_AT + i * REP_STAGGER); // the posted replies open, top to bottom
    T.ptr = T.rep[ORDER.length - 1] + PTR2_AT;         // the pointer comes in
    T.more = T.ptr + TO_MORE;                          // Priya's more button is tapped, the menu opens
    T.item = T.more + MENU_IN + TO_ITEM;               // "Pin" is tapped
    T.dlg = T.item + DLG_AT;                           // the dialog opens
    T.okTap = T.dlg + DLG_IN + TO_OK;                  // the dialog's Pin is tapped
    T.pin = T.okTap + DLG_OUT + PIN_AT;                // Priya's comment is pinned (the chime)
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
        : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame YouTube Studio client (dark) ----
    const av = (name, c, cls = '') => `<span class="st-av ${cls}" style="--c: ${c}">${esc(name[0])}</span>`;
    const block = (ti) => {
      const cm = TOP[ti];
      return `<div class="st-blk" data-i="${ti}"><i class="st-wash"></i>
        <span class="st-cb">${si('checkbox')}</span>${av(cm.name, cm.c)}
        <div class="st-body">
          ${ti === PINNED ? `<div class="st-pslot"><div class="st-pinned">${si('pin')}<span>Pinned by ${HANDLE}</span></div></div>` : ''}
          <div class="st-meta"><span>${esc(cm.handle)}</span><span class="st-dot">•</span><span>${AGE[ti]}</span><span class="st-subs"><b>${cm.subs}</b> subscribers</span></div>
          <div class="st-text">${esc(cm.text)}</div>
          <div class="st-acts"><span class="st-rb">Reply</span>
            <span class="st-tog"><span class="st-tog0">0 replies</span><span class="st-tog1">1 reply</span>${si('chev-down', 'st-tc0')}${si('chev-up', 'st-tc1')}</span>
            <span class="st-ib st-lk">${si('like')}</span><span class="st-n">${cm.likes}</span><span class="st-ib">${si('dislike')}</span><span class="st-ib">${si('heart')}</span><span class="st-ib st-more">${si('more-vert')}</span></div>
          <div class="st-sg">${SUGGEST[ti].map((s) => `<span class="st-chip-o">${esc(s)}</span>`).join('')}<span class="st-ib st-sgm">${si('more-vert')}</span></div>
          <div class="st-rslot"><div class="st-rep">${av(ACCOUNT, '#1e8e3e', 'st-av-s')}
            <div class="st-rbody"><div class="st-meta"><span class="st-owner">${HANDLE}</span><span class="st-dot">•</span><span class="st-age">1 second ago</span></div>
              <div class="st-text">${esc(REPLIES[cm.handle])}</div>
              <div class="st-racts"><span class="st-ib st-ib-s">${si('like')}</span><span class="st-ib st-ib-s">${si('dislike')}</span><span class="st-ib st-ib-s">${si('heart')}</span><span class="st-ib st-ib-s">${si('more-vert')}</span></div></div></div></div>
        </div></div>`;
    };
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-app">
      <svg width="0" height="0" style="position: absolute"><defs><linearGradient id="st-spark-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e65ab4"/><stop offset=".55" stop-color="#a35ee0"/><stop offset="1" stop-color="#5b7cf0"/></linearGradient></defs></svg>
      <header class="st-top">
        <span class="st-btn">${si('menu')}</span>
        <span class="st-logo"><img src="${icon('youtube-studio-logo-dark.svg')}" alt=""/></span>
        <div class="st-search">${si('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${si('comment-spark')}</span><span class="st-btn">${si('help')}</span><span class="st-btn st-bell">${si('bell')}<i></i></span>
          <span class="st-pill st-ask">${si('spark', 'st-spark')}<span>Ask Studio</span></span><span class="st-pill">${si('video-call')}<span>Create</span></span></span>
        <span class="st-me">S</span>
      </header>
      <div class="st-main">
        <nav class="st-nav">
          <div class="st-back">${si('arrow-back')}<span>Channel content</span></div>
          <div class="st-vthumb"><img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/><i>${VIDEO.len}</i></div>
          <div class="st-yv"><b>Your video</b><span>${esc(VIDEO.title)}</span></div>
          ${NAV.map(([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${si(ic)}<span>${esc(label)}</span></div>`).join('')}
          <div class="st-nfoot"><div class="st-nv">${si('settings')}<span>Settings</span></div><div class="st-nv">${si('feedback')}<span>Send feedback</span></div></div>
        </nav>
        <section class="st-page">
          <h1 class="st-h1">Video comments</h1>
          <div class="st-filter"><span class="st-fi">${si('filter')}</span>
            <span class="st-chip">Published${si('chev-down')}</span><span class="st-chip">Most relevant${si('chev-down')}</span>
            <span class="st-chip">${si('search-spark', 'st-spark-m')}Search${si('chev-down')}</span><span class="st-fph">Filter</span></div>
          <div class="st-thead"><span class="st-cb">${si('checkbox')}</span><span>Comment</span></div>
          <div class="st-list">${ORDER.map(block).join('')}</div>
        </section>
      </div>
      <div class="st-menu">${MENU.map(([ic, label]) => `<div class="st-mi">${si(ic)}<span>${esc(label)}</span></div>`).join('')}</div>
      <div class="st-scrim"></div>
      <div class="st-dlg"><div class="st-dt">Pin this comment?</div><div class="st-dd">If you already pinned a comment, this will replace it.</div>
        <div class="st-db"><span class="st-dbtn">Cancel</span><span class="st-dbtn st-dok">Pin</span></div></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    // display order: blocks[i] is the comment ORDER[i]
    const blocks = [...layer.querySelectorAll('.st-blk')].map((n) => ({
      n, i: +n.dataset.i,
      rslot: n.querySelector('.st-rslot'), rep: n.querySelector('.st-rep'), tog: n.querySelector('.st-tog'),
      sg: n.querySelector('.st-sg'), wash: n.querySelector('.st-wash'), age: n.querySelector('.st-age'), rH: '', sH: '', aT: '',
    }));
    const pinIdx = blocks.findIndex((b) => b.i === PINNED);
    const pinB = blocks[pinIdx];
    const more = pinB.n.querySelector('.st-more');
    const pslot = $('.st-pslot'), pinned = $('.st-pinned');
    const menu = $('.st-menu'), pinItem = menu.firstElementChild, scrim = $('.st-scrim'), dlg = $('.st-dlg'), dok = $('.st-dok');
    // Studio's type is Roboto and YouTube Sans (vendored, studio.css); the consent card's is Google Sans Flex: ask for
    // every face up front so a seek never measures a slot in the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 16px "GSF"`));
      document.fonts.load('700 32px "YouTube Sans"');
    }

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, pH = '';
    let AW = 1600, AH = 900;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('st-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('gc-tall', tall);
      pH = ''; blocks.forEach((b) => { b.rH = ''; b.sH = ''; });
    };
    // the menu opens under the more button, right-aligned to it (in the app's own px); like YouTube's own menus it
    // opens upward instead when there is no room under the button
    const placeMenu = () => {
      const a = app.getBoundingClientRect(), m = more.getBoundingClientRect();
      const k2 = a.width / AW || 1;
      const below = (m.bottom - a.top) / k2 + 2, mh = menu.offsetHeight;
      const up = below + mh > AH - 8;
      menu.style.left = `${((m.right - a.left) / k2 - menu.offsetWidth + 8).toFixed(1)}px`;
      menu.style.top = `${(up ? (m.top - a.top) / k2 - 2 - mh : below).toFixed(1)}px`;
      menu.style.transformOrigin = up ? '100% 100%' : '100% 0';
    };

    // the pointer: first onto Continue in the chat; then, at full frame, onto Priya's more button, "Pin", the
    // dialog's Pin, and away
    const at = (n, fx = 0.5, fy = 0.55) => { const b = x.box(n); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
    const ptr = (t) => {
      const a = T.card + PTR_IN, b = T.tap - 0.08;
      if (t >= a && t <= T.tap + 0.45) {
        const g = x.box(go);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
        const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
        const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
        return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave) };
      }
      if (t < T.ptr || t > T.pin + 0.5) return null;
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      // the menu and the dialog keep their layout while hidden (visibility, not display), so their boxes are there
      // to aim at before they open and after they close (past the pin only the last leg, from the dialog, is in use)
      const m0 = at(more), it = at(pinItem, 0.3, 0.5), ok = at(dok);
      const keys = [
        { t: T.ptr, x: m0.x + W * 0.12, y: m0.y + H * 0.16 },
        { t: T.more - 0.06, ...m0 },
        { t: T.more + MENU_IN, ...m0 },
        { t: T.item - 0.06, ...it },
        { t: T.dlg + DLG_IN, ...it },
        { t: T.okTap - 0.06, ...ok },
        { t: T.okTap + 0.2, ...ok },
        { t: T.pin + 0.5, x: ok.x + 60, y: ok.y + 90 },
      ];
      const q = path(t, keys);
      const p = Math.max(press(t, T.more), press(t, T.item), press(t, T.okTap));
      return { x: q.x, y: q.y, p, v: seg(t, T.ptr, T.ptr + 0.12) * (1 - seg(t, T.pin + 0.15, T.pin + 0.5)) };
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
        checks.forEach((c, i) => {
          // posting ticks when the last reply has landed, pinning at the pin: both still turning when the window opens
          const done = i === 0 ? T.ok[0] : i === 1 ? T.rep[ORDER.length - 1] + REP_IN : T.pin;
          const o = outCubic(seg(t, done, done + POP));
          c.spin.style.opacity = (1 - seg(t, done - 0.06, done + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the comment rows fill in; at full frame each posted reply opens under its comment, top to bottom, and the
        // reply suggestions under that comment give way to it
        blocks.forEach((b, i) => {
          const f = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          b.n.style.opacity = f.toFixed(3);
          const g = inOutCubic(seg(t, T.rep[i], T.rep[i] + REP_IN));
          const h = b.rep.offsetHeight;
          const want = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
          if (want !== b.rH) { b.rslot.style.height = want; b.rH = want; }
          const sh = b.sg.scrollHeight;
          const sw = g <= 0 ? 'auto' : `${(sh * (1 - g)).toFixed(2)}px`;
          if (sw !== b.sH) { b.sg.style.height = sw; b.sH = sw; }
          b.sg.style.opacity = (1 - outCubic(seg(t, T.rep[i], T.rep[i] + REP_IN * 0.5))).toFixed(3);
          const rf = outCubic(seg(t, T.rep[i] + REP_IN * 0.35, T.rep[i] + REP_IN));
          b.rep.style.opacity = rf.toFixed(3);
          b.rep.style.transform = rf >= 1 ? 'none' : `translateY(${((1 - rf) * -6).toFixed(2)}px)`;
          b.tog.classList.toggle('st-open', t >= T.rep[i] + REP_IN * 0.3);
          // the reply's age counts up from the moment it was posted, as YouTube writes it
          const sec = Math.max(1, Math.floor(t - T.rep[i]));
          const aT = `${sec} second${sec === 1 ? '' : 's'} ago`;
          if (aT !== b.aT) { b.age.textContent = aT; b.aT = aT; }
        });

        // the pin by hand: the more button lit under the pointer, the menu, "Pin" lit, the dialog
        more.classList.toggle('st-hov', t >= T.more - 0.1 && t < T.item);
        const mo = t >= T.more && t < T.item + 0.08;
        menu.style.visibility = mo ? 'visible' : 'hidden';
        if (t >= T.full && t < T.pin) placeMenu();
        const e = outCubic(seg(t, T.more, T.more + MENU_IN));
        menu.style.opacity = mo ? e.toFixed(3) : '0';
        menu.style.transform = `scale(${lerp(0.94, 1, e).toFixed(4)})`;
        pinItem.classList.toggle('st-hov', t >= T.item - 0.12);
        const dIn = outCubic(seg(t, T.dlg, T.dlg + DLG_IN)) * (1 - seg(t, T.okTap + 0.04, T.okTap + 0.04 + DLG_OUT));
        dlg.style.visibility = dIn > 0 ? 'visible' : 'hidden';
        scrim.style.visibility = dlg.style.visibility;
        dlg.style.opacity = dIn.toFixed(3);
        dlg.style.transform = `translate(-50%, -50%) scale(${lerp(0.96, 1, dIn).toFixed(4)})`;
        scrim.style.opacity = dIn.toFixed(3);
        dok.classList.toggle('st-hov', t >= T.okTap - 0.12);

        // the pin: Priya's comment is already first ("Most relevant", the most liked), so nothing reorders; her
        // "Pinned by" label opens above her handle and the row's wash flares and fades
        const m = inOutCubic(seg(t, T.pin, T.pin + MOVE));
        const ph = pinned.offsetHeight;
        const pw = m >= 1 ? 'auto' : `${(ph * m).toFixed(2)}px`;
        if (pw !== pH) { pslot.style.height = pw; pH = pw; }
        pinned.style.opacity = outCubic(seg(t, T.pin + MOVE * 0.3, T.pin + MOVE)).toFixed(3);
        pinB.wash.style.opacity = (t < T.pin ? 0 : outCubic(seg(t, T.pin, T.pin + 0.2)) * (1 - inOutCubic(seg(t, T.pin + MOVE, T.pin + MOVE + WASH)))).toFixed(3);
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
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
        // the window keeps its rounded corners until late in the open (1 - g^3), so it reads as a window growing
        const rad = RADIUS * s * (1 - g * g * g);
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
