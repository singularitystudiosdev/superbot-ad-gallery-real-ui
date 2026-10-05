// Poll beat, the finale: superbot posts the image poll from Maya's own YouTube Studio. A light checklist card lands in
// the chat ("Connected as Maya Makes", "Image poll, 4 options attached", "Posted to @MayaMakes", spinners turning to
// checks). The YouTube Studio window opens out of the card to full frame while the card lifts and floats to the
// bottom-right corner, so Studio plays BEHIND the checklist. Studio (light theme, Dashboard selected in the left menu):
// the Create menu is open on "Create post", the post composer comes up with Image poll selected, the question
// "Which build is next?" types in and the four Nano Banana Pro images fill the option tiles, each with its label; the
// pointer presses Post (the click). The window becomes youtube.com/@MayaMakes on the Posts tab: the poll card is live
// ("Just now"), the toast says "Post published" and the votes count 0 to 1,206 while the bars settle at 41 / 27 / 19 /
// 13 %. The final state holds (READ).
//
// There is ONE app client, on a layer in the scene root (outside the camera), laid out once at a design size (the frame
// divided by APP_SCALE) and scaled to the layer, so the opening window and the full frame are the same pixels at two
// sizes. The floating checklist is a second copy of the chat's card, on the root above the layer. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ms } from './yt-icons.js?v=1a09cce6';
import { OPTIONS } from './images.js?v=1a09cce6';

const CHANNEL = 'Maya Makes';
const HANDLE = '@MayaMakes';
const INITIAL = 'M';
const QUESTION = 'Which build is next?';
const VOTES = 1206;
const FINAL = [41, 27, 19, 13];              // the settled split, per OPTIONS (sums to 100)
const EARLY = [34, 30, 21, 15];              // the first votes' split, before it settles
const STEPS = [
  ['studio', `Connected as <b>${CHANNEL}</b>`],
  ['image-outline', 'Image poll, 4 options attached'],
  ['youtube', `Posted to <b>${HANDLE}</b>`],
];
const NAV = [
  ['dashboard-outline', 'Dashboard', true], ['video-library-outline', 'Content'], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
const MENU = [['upload', 'Upload videos'], ['sensors', 'Go live'], ['edit-square-outline', 'Create post']];
const TYPES = [['image-outline', 'Image'], ['photo-library-outline', 'Image poll', true], ['list-alt-outline', 'Text poll'],
  ['quiz-outline', 'Quiz'], ['smart-display-outline', 'Video']];
const GUIDE = [['home-outline', 'Home'], ['subscriptions-outline', 'Subscriptions'], ['video-library-outline', 'You'], ['history', 'History']];
const TABS = ['Home', 'Videos', 'Shorts', 'Live', 'Playlists', 'Posts'];
const TOAST = 'Post published';

const APP_SCALE = 1.2;                         // full frame: the client's px to frame px
const FLOAT = { w: 560, right: 28, bottom: 28 }; // the floating checklist, bottom-right (clear of the Create menu, the
                                                 // composer, the poll card and the toast), in frame px
// timing (seconds from the beat start, or from the mark noted), the <7s pace
const CARD_IN = 0.18;                          // the checklist card rising into the thread
const OK0 = 0.12;                              // the card landing to "Connected as Maya Makes" checking
const POP = 0.14;                              // a check popping in
const GROW_AT = 0.2;                           // the card landing to the window opening
const GROW = 0.32; /* deliberate */            // the window opens to full frame
const MENU_HI = 0.08;                          // the window opening to "Create post" highlighting in the Create menu
const DLG_AT = 0.2;                            // the window opening to the composer coming up
const DLG_IN = 0.16;
const Q_AT = 0.06;                             // the composer up to the question typing
const QCPS = 90;
const TILE_AT = 0.08;                          // the composer up to the first image filling its option tile
const TILE_STAGGER = 0.05;
const TILE_IN = 0.14;
const POST_AT = 0.52; /* deliberate */         // the composer up to Post pressed (the composer reads first)
const PTR_IN = 0.16;                           // the composer up to the pointer appearing
const PTR_MOVE = 0.3;                          // the pointer's travel onto Post
const PAGE_AT = 0.1;                           // Post pressed to the channel's Posts tab coming up
const PAGE_IN = 0.14;
const TOAST_AT = 0.06;
const TOAST_IN = 0.18;
const VOTE_AT = 0.06;                          // the Posts tab up to the votes starting to count
const COUNT = 0.7; /* deliberate */            // 0 to 1,206
const READ = 0.18; /* deliberate */            // the final state holds before the scene's fade
// the push-in inside the window, for a phone-sized read: onto the composer, then onto the live poll while it counts
const Z_DLG = 1.25, Z_POST = [1.1, 1.2];
const Z_IN = 0.4;                              // the composer up to the push landing

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r;
    T.grow = T.card + GROW_AT;                        // the window starts opening (the card has just landed)
    T.full = T.grow + GROW;
    T.dlg = T.grow + DLG_AT;                          // the composer comes up
    T.q = T.dlg + Q_AT;
    T.tile = OPTIONS.map((_, i) => T.dlg + TILE_AT + i * TILE_STAGGER);
    T.post = T.dlg + POST_AT;                         // Post pressed (the click)
    T.ok = [T.card + OK0, T.tile[OPTIONS.length - 1] + TILE_IN, T.post + 0.1];
    T.page = T.post + PAGE_AT;                        // youtube.com/@MayaMakes, Posts
    T.toast = T.page + TOAST_AT;
    T.v0 = T.page + VOTE_AT;
    T.v1 = T.v0 + COUNT;
    T.end = T.v1 + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the vote ticks fall where the count crosses each ninth of 1,206 (outCubic: dense first, then easing off)
    const ticks = Array.from({ length: 9 }, (_, i) => T.v0 + COUNT * (1 - Math.cbrt(1 - (i + 1) / 10)));
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { grow: T.grow, post: T.post, toast: T.toast, ticks });

    // ---- the checklist card: one in the chat, one floating over the full-frame layer ----
    const stepIcon = (kind) => (kind === 'studio' ? `<span class="gk-ic gk-av">${INITIAL}</span>`
      : kind === 'youtube' ? `<span class="gk-ic gk-img"><img src="${icon('youtube-icon.svg')}" alt=""/></span>`
        : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const cardHTML = (cls) => `<div class="gk-card ${cls}">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
    </div>`;
    const card = x.el(cardHTML(''));
    const fcard = x.el(cardHTML('gk-float'));
    const checksOf = (n) => [...n.querySelectorAll('.gk-ok')].map((o) => ({ spin: o.querySelector('.gk-spin'), ck: o.querySelector('.gk-ck') }));
    const checks = [checksOf(card), checksOf(fcard)];

    // ---- the app client: YouTube Studio, then youtube.com/@MayaMakes ----
    const av = (cls = '') => `<span class="pl-av ${cls}">${INITIAL}</span>`;
    const layer = x.el(`<div class="st-full pl-full" aria-hidden="true"><div class="st-app pl-app">
      <div class="pl-studio">
        <header class="st-top">
          <span class="st-btn">${ms('menu')}</span>
          <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
          <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
          <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create pl-create">${ms('video-call-outline')}<span>Create</span></span></span>
          ${av('pl-me')}
        </header>
        <div class="st-main">
          <nav class="st-nav">
            <div class="st-chan">${av('pl-av-xl')}<b>Your channel</b><small>${esc(CHANNEL)}</small></div>
            ${NAV.map(([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}
            <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
          </nav>
          <section class="st-page">
            <h1 class="st-h1">Channel dashboard</h1>
            <div class="pl-dash">
              <div class="pl-dc"><b>Channel analytics</b><small>Current subscribers</small><span class="pl-big">284,112</span><i class="pl-ln"></i><small>Summary, last 28 days</small><i class="pl-sk"></i><i class="pl-sk pl-sk2"></i></div>
              <div class="pl-dc"><b>Latest post</b><small>Posts let you share polls, images and updates with your audience</small><span class="pl-btn">Create post</span></div>
              <div class="pl-dc"><b>Creator Insider</b><i class="pl-sk pl-sk3"></i><i class="pl-sk"></i><i class="pl-sk pl-sk2"></i></div>
            </div>
          </section>
        </div>
        <div class="pl-menu">${MENU.map(([ic, label], i) => `<div class="pl-mi${i === MENU.length - 1 ? ' pl-mi-go' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}</div>
        <i class="pl-scrim"></i>
        <div class="pl-dlg">
          <div class="pl-dh"><b>Create post</b><span class="st-btn">${ms('close')}</span></div>
          <div class="pl-acct">${av()}<b>${esc(CHANNEL)}</b><span class="pl-vis">${ms('public')}<span>Public</span>${ms('arrow-drop-down')}</span></div>
          <div class="pl-q"><span class="pl-qt"></span><i class="pl-caret"></i><span class="pl-qph">Ask a question</span></div>
          <div class="pl-opts">
            ${OPTIONS.map(([f, label]) => `<div class="pl-o"><div class="pl-oi"><img src="${x.img('poll/' + f)}" alt=""/><span class="pl-ox">${ms('close')}</span></div><div class="pl-ol">${esc(label)}</div></div>`).join('')}
            <div class="pl-o pl-add"><div class="pl-oi">${ms('add')}</div><div class="pl-ol">Add option</div></div>
          </div>
          <div class="pl-types">${TYPES.map(([ic, label, on]) => `<span class="pl-ty${on ? ' pl-ty-on' : ''}">${ms(ic)}<span>${esc(label)}</span></span>`).join('')}</div>
          <div class="pl-df"><span class="pl-cnt">20/100</span><span class="pl-cancel">Cancel</span><span class="pl-post">Post</span></div>
        </div>
      </div>
      <div class="pl-yt">
        <header class="yt-top">
          <span class="st-btn">${ms('menu')}</span>
          <img class="yt-logo" src="${icon('youtube-logo.svg')}" alt=""/>
          <div class="yt-sbox"><span class="yt-sin">Search</span><span class="yt-sbtn">${ms('search')}</span></div>
          <span class="yt-mic">${ms('mic-outline')}</span>
          <span class="yt-tools"><span class="yt-create">${ms('add')}<span>Create</span></span><span class="st-btn">${ms('notifications-outline')}</span>${av('pl-me')}</span>
        </header>
        <div class="yt-main">
          <nav class="yt-guide">${GUIDE.map(([ic, label]) => `<div class="yt-gi">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}</nav>
          <section class="yt-page">
            <div class="yt-chan">${av('pl-av-ch')}
              <div class="yt-ci"><h1>${esc(CHANNEL)}</h1>
                <div class="yt-meta"><b>${esc(HANDLE)}</b> · 284K subscribers · 212 videos</div>
                <div class="yt-desc">Furniture and small builds from a one-car garage shop. New build every Sunday. <b>...more</b></div>
                <div class="yt-btns"><span>Customize channel</span><span>Manage videos</span></div>
              </div>
            </div>
            <div class="yt-tabs">${TABS.map((tb) => `<span class="yt-tab${tb === 'Posts' ? ' yt-tab-on' : ''}">${tb}</span>`).join('')}<span class="yt-tab yt-ts">${ms('search')}</span></div>
            <div class="yt-post">
              <div class="yt-ph">${av()}<div class="yt-pw"><b>${esc(CHANNEL)}</b><span>Just now</span></div><span class="st-btn">${ms('more-vert')}</span></div>
              <div class="yt-q">${esc(QUESTION)}</div>
              <div class="yt-opts">${OPTIONS.map(([f, label]) => `<div class="yt-o"><div class="yt-oi"><img src="${x.img('poll/' + f)}" alt=""/></div><div class="yt-or"><i class="yt-bar"></i><span class="yt-ol">${esc(label)}</span><b class="yt-pc">0%</b></div></div>`).join('')}</div>
              <div class="yt-votes">0 votes</div>
              <div class="yt-acts"><span class="st-btn">${ms('thumb-up-outline')}</span><span class="st-btn">${ms('thumb-down-outline')}</span><span class="st-btn">${ms('chat-bubble-outline')}</span><span class="st-btn">${ms('share-outline')}</span></div>
            </div>
          </section>
        </div>
      </div>
    </div><div class="st-snack">${esc(TOAST)}</div></div>`);
    x.root.appendChild(layer);
    x.root.appendChild(fcard);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const studio = $('.pl-studio'), yt = $('.pl-yt');
    const menu = $('.pl-menu'), go = $('.pl-mi-go'), create = $('.pl-create'), scrim = $('.pl-scrim'), dlg = $('.pl-dlg');
    const qt = $('.pl-qt'), qcaret = $('.pl-caret'), qph = $('.pl-qph'), cnt = $('.pl-cnt');
    const otiles = [...layer.querySelectorAll('.pl-o:not(.pl-add) .pl-oi')].map((n) => ({ n, img: n.querySelector('img'), x: n.querySelector('.pl-ox') }));
    const olabels = [...layer.querySelectorAll('.pl-o:not(.pl-add) .pl-ol')];
    const post = $('.pl-post');
    const ypost = $('.yt-post'), votes = $('.yt-votes');
    const rows = [...layer.querySelectorAll('.yt-o')].map((n) => ({ bar: n.querySelector('.yt-bar'), pc: n.querySelector('.yt-pc') }));
    const snack = $('.st-snack');
    // Studio and youtube.com are Roboto (vendored, poll.css): ask for every face up front so a seek never measures in
    // the fallback face
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));

    let geo = '', AW = 1600, AH = 900, shownQ = -1, lastVotes = '', lastPc = [], sn = 0;
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      // 16:9 is the cut; a narrower frame (the gallery's other ratios) keeps the 1600-wide desktop layout, scaled down
      AW = Math.max(1600, Math.round(W / APP_SCALE)); AH = Math.round((H * AW) / W);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
    };

    // the pointer: in from below right, onto Post, a press, then away
    const ptr = (t) => {
      const a = T.dlg + PTR_IN, b = T.post - 0.06;
      if (t < a || t > T.post + 0.3) return null;
      const g = x.box(post);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.62;
      const m = inOutCubic(seg(t, a, Math.min(b, a + PTR_MOVE)));
      const leave = outCubic(seg(t, T.post + 0.14, T.post + 0.3));
      return { x: lerp(ex + 220, ex, m) + leave * 40, y: lerp(ey + 160, ey, m) + leave * 30, p: press(t, T.post), v: seg(t, a, a + 0.1) * (1 - leave) };
    };

    const renderChecks = (t) => checks.forEach((list) => list.forEach((c, i) => {
      const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
      c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
      c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
      c.ck.style.opacity = o.toFixed(3);
      c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
    }));

    return {
      nodes: [card],
      marks: [[T.card - 0.12, card]],   // the thread opens room as the card starts to rise, so it has landed by T.grow
      pointer: ptr,
      render(t) {
        layout();
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        renderChecks(t);

        // Studio: the Create menu is open while the window opens ("Create post" highlights), then the composer comes up
        const mh = seg(t, T.grow + MENU_HI, T.grow + MENU_HI + 0.06);
        go.classList.toggle('pl-mi-hi', mh > 0.5);
        create.classList.toggle('pl-create-on', t < T.dlg + DLG_IN);
        menu.style.opacity = (1 - seg(t, T.dlg, T.dlg + 0.08)).toFixed(3);
        const di = outCubic(seg(t, T.dlg, T.dlg + DLG_IN));
        scrim.style.opacity = (di * 0.5).toFixed(3);
        dlg.style.opacity = di.toFixed(3);
        dlg.style.transform = `translate(-50%, -50%) scale(${lerp(0.94, 1, di).toFixed(4)})`;
        const nq = streamCount(QUESTION, T.q, QCPS, t);
        if (nq !== shownQ) { qt.textContent = QUESTION.slice(0, nq); qph.style.display = nq ? 'none' : ''; cnt.textContent = `${nq}/100`; shownQ = nq; }
        qcaret.style.opacity = t < T.post ? '1' : '0';
        otiles.forEach((o, i) => {
          const f = outCubic(seg(t, T.tile[i], T.tile[i] + TILE_IN));
          o.img.style.opacity = f.toFixed(3);
          o.img.style.transform = f >= 1 ? 'none' : `scale(${lerp(1.1, 1, f).toFixed(4)})`;
          o.x.style.opacity = f.toFixed(3);
          olabels[i].style.opacity = lerp(0.25, 1, f).toFixed(3);
        });
        const pr = press(t, T.post);
        post.style.transform = pr ? `scale(${(1 - 0.07 * pr).toFixed(4)})` : 'none';
        post.classList.toggle('pl-post-hit', t >= T.post);

        // youtube.com/@MayaMakes, Posts: the page comes up over Studio, the poll is live and the votes count
        const pg = outCubic(seg(t, T.page, T.page + PAGE_IN));
        yt.style.opacity = pg.toFixed(3);
        studio.style.opacity = (1 - seg(t, T.page + PAGE_IN * 0.5, T.page + PAGE_IN)).toFixed(3);
        ypost.style.transform = pg >= 1 ? 'none' : `translateY(${((1 - pg) * 16).toFixed(2)}px)`;
        const c = outCubic(seg(t, T.v0, T.v1));
        const n = Math.round(VOTES * c);
        const vt = `${fmt(n)} ${n === 1 ? 'vote' : 'votes'}`;
        if (vt !== lastVotes) { votes.textContent = vt; lastVotes = vt; }
        const mix = inOutCubic(seg(t, T.v0 + 0.08, T.v1));
        const fill = outCubic(seg(t, T.v0, T.v0 + 0.3));
        rows.forEach((row, i) => {
          const p = n ? Math.round(lerp(EARLY[i], FINAL[i], mix)) : 0;
          if (p !== lastPc[i]) { row.pc.textContent = `${p}%`; lastPc[i] = p; }
          row.bar.style.width = `${(p * fill).toFixed(2)}%`;
        });
        sn = outCubic(seg(t, T.toast, T.toast + TOAST_IN));
        snack.style.opacity = sn.toFixed(3);
      },
      // after the camera: open the layer out of the card to the whole frame, and float the card's copy over it
      after(t) {
        if (t < T.grow) { layer.style.opacity = '0'; fcard.style.opacity = '0'; card.style.visibility = ''; return; }
        layout();
        const root = x.root;
        const W = root.offsetWidth, H = root.offsetHeight;
        const b = x.box(card);
        const g = inOutCubic(seg(t, T.grow, T.full));
        // the window opens from a 16:9 box centred on the card, to the frame
        const w0 = b.w, h0 = (b.w * H) / W;
        const L = lerp(b.x, 0, g), Tp = lerp(b.y + b.h / 2 - h0 / 2, 0, g), Wd = lerp(w0, W, g), Ht = lerp(h0, H, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(16 * (1 - g)).toFixed(2)}px`;
        layer.style.opacity = seg(t, T.grow, T.grow + 0.08).toFixed(3);
        // the window's own push: centred on the composer, then (across the page change) on the live poll card
        const s = Wd / AW;
        let z = 1, cx = AW / 2, cy = AH / 2;
        if (t < T.page + PAGE_IN * 0.5) {
          const p = outCubic(seg(t, T.dlg, T.dlg + Z_IN));
          z = lerp(1, Z_DLG, p); cy = lerp(AH / 2, AH * 0.51, p);
        } else {
          z = lerp(Z_POST[0], Z_POST[1], outCubic(seg(t, T.page, T.end)));
          cx = ypost.offsetLeft + ypost.offsetWidth / 2; cy = ypost.offsetTop + ypost.offsetHeight / 2 - 40;
        }
        app.style.transform = `scale(${s.toFixed(5)}) translate(${(AW / 2).toFixed(2)}px, ${(AH / 2).toFixed(2)}px) scale(${z.toFixed(5)}) translate(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px)`;
        // the toast sits on the window, not in the pushed page: YouTube's bottom-left corner at the window's scale
        snack.style.left = `${(24 * s).toFixed(2)}px`;
        snack.style.bottom = `${(24 * s).toFixed(2)}px`;
        snack.style.transform = `translateY(${((1 - sn) * 24 * s).toFixed(2)}px) scale(${s.toFixed(5)})`;
        // the card lifts out of the thread and glides to the bottom-right corner, shrinking to FLOAT.w
        card.style.visibility = 'hidden';
        const cw = card.offsetWidth || 1;
        const fw = Math.min(FLOAT.w, W * 0.62);
        const s0 = b.w / cw, s1 = fw / cw;
        const fx = lerp(b.x, W - fw - FLOAT.right, g), fy = lerp(b.y, H - FLOAT.bottom - card.offsetHeight * s1, g);
        fcard.style.width = `${cw}px`;
        fcard.style.opacity = '1';
        fcard.style.transform = `translate(${fx.toFixed(2)}px, ${fy.toFixed(2)}px) scale(${lerp(s0, s1, g).toFixed(5)})`;
      },
    };
  },
};
