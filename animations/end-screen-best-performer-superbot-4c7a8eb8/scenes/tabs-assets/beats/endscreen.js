// End screen beat, the finale: superbot sets it up in Jonah Plays' own YouTube Studio. A light checklist card lands
// in the chat ("Connected as Jonah Plays", the end screen, the info card; spinners turning to checks). The Studio
// window opens out of the card to full frame while the card lifts and floats to the top centre (over Studio's search
// bar, clear of the player, the timeline, Save and the toast), so Studio plays BEHIND the checklist.
// Studio (light theme), the flow YouTube Help documents (answers 6388789 and 6140493, read 2026-10-05): Content (the
// channel menu: Dashboard, Content, Analytics, Community, Subtitles, Copyright, Earn, Customization, Audio library),
// the new video "Hollow Crown 100% Run, Final Boss" (19:02) is opened, its Editor comes up (the video menu). End
// screen > Add element > Video > Choose specific video: the winner's tile and a round Subscribe element land on the
// last 20 s (18:42 to 19:02, both lanes). Then Info cards > Add card > Video at 7:15: the marker lands and the teaser
// "Every Boss Ranked" slides into the player. Save is pressed (the click) and the toast says "Changes saved".
//
// There is ONE app client, on a layer in the scene root (outside the camera), laid out once at a design size (the frame
// divided by APP_SCALE) and scaled to the layer, so the opening window and the full frame are the same pixels at two
// sizes. The window's own push (onto the content row, the player) is written in after(). The floating checklist is a
// second copy of the chat's card, on the root above the layer. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, press, placeCursor } from '../../../lib.js';
import { ms } from './yt-icons.js?v=4c7a8eb8';
import { UPLOADS } from './rank.js?v=4c7a8eb8';

const CHANNEL = 'Jonah Plays';
const INITIAL = 'J';
const VIDEO = 'Hollow Crown 100% Run, Final Boss';
const LENGTH = 19 * 60 + 2;                    // 19:02, the new video
const ES0 = 18 * 60 + 42;                      // the end screen runs 18:42 to the end
const CARD_AT_S = 7 * 60 + 15;                 // the info card, 7:15 (where the video mentions the ranking)
const PICK = UPLOADS[0];                       // Every Boss in Hollow Crown, Ranked
const TEASER = 'Every Boss Ranked';
const STEPS = [
  ['studio', `Connected as <b>${CHANNEL}</b>`],
  ['smart-display-outline', 'End screen: <b>Every Boss, Ranked</b> + Subscribe, 18:42 to 19:02'],
  ['info-outline', 'Info card: <b>Video at 7:15</b>, teaser on'],
];
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content', true], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
const VNAV = [
  ['edit-outline', 'Details'], ['analytics-outline', 'Analytics'], ['movie-outline', 'Editor', true],
  ['comment-outline', 'Comments'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['content-cut', 'Clips'],
];
const TABS = ['Inspiration', 'Videos', 'Shorts', 'Live', 'Posts', 'Playlists', 'Podcasts', 'Promotions'];
// the Content list: [thumbnail, title, duration, date, views, comments, likes]; the new video first, then the three
// Gemini ranked (rank.js UPLOADS: 2.1M, 880K, 640K views)
const ROWS = [
  ['final-boss.jpg', VIDEO, '19:02', 'Oct 4, 2026', '12,408', '386', '98.9%'],
  [UPLOADS[2][0], UPLOADS[2][1], '16:09', 'Sep 21, 2026', '640,925', '2,114', '98.1%'],
  [UPLOADS[1][0], UPLOADS[1][1], '31:45', 'Sep 7, 2026', '880,317', '4,870', '98.6%'],
  [UPLOADS[0][0], UPLOADS[0][1], '24:18', 'Aug 17, 2026', '2,108,442', '9,532', '98.8%'],
];
const ELEMENTS = [['dashboard-customize-outline', 'Apply template'], ['smart-display-outline', 'Video'], ['playlist-play', 'Playlist'],
  ['person-add-outline', 'Subscribe'], ['account-box-outline', 'Channel'], ['link', 'Link']];
const VIDEO_OPTS = ['Most recent upload', 'Best for viewer', 'Choose specific video'];
const CARDS = [['smart-display-outline', 'Video'], ['playlist-play', 'Playlist'], ['account-box-outline', 'Channel'], ['link', 'Link']];
const LANES = [['blur-on', 'Blur'], ['music-note', 'Audio'], ['smart-display-outline', 'End screen', 'es'], ['info-outline', 'Info cards', 'ic']];
const TOAST = 'Changes saved';

const APP_SCALE = 1.2;                         // full frame: the client's px to frame px
const FLOAT = { w: 520, top: 22 };             // the floating checklist, top centre, in frame px
// timing (seconds from the beat start), the <10s pace
const CARD_IN = 0.18;                          // the checklist card rising into the thread
const OK0 = 0.12;                              // the card landing to "Connected as Jonah Plays" checking
const POP = 0.14;                              // a check popping in
const GROW_AT = 0.2;                           // the card landing to the window opening
const GROW = 0.32; /* deliberate */            // the window opens to full frame (Content)
const ROW_HI = 0.36;                           // the new video's row lighting under the pointer
const ROW_CLICK = 0.54;                        // ...and clicked
const ED_AT = 0.62, ED_IN = 0.14;              // its Editor coming up
const ADD = 0.78;                              // End screen's + pressed: the Add element menu opens
const VID_HI = 0.86;                           // "Video" highlighting
const SUB = 0.92;                              // the Video options opening beside it
const CHOOSE = 1.02;                           // "Choose specific video" clicked
const EL = 1.1, EL_IN = 0.2;                   // the winner's tile landing on the player
const SUBS = 1.18;                             // the Subscribe element landing
const BARS = 0.28;                             // both lanes filling 18:42 to 19:02
const JUMP = 1.82, JUMP_IN = 0.28;             // the timeline zooming out, the playhead travelling to 7:15
const CADD = 2.12;                             // Info cards' + pressed: the Add card menu opens
const CVID = 2.28;                             // "Video" clicked
const MARK = 2.34, MARK_IN = 0.16;             // the card's marker landing at 7:15
const TEASE = 2.42, TEASE_IN = 0.24;           // the teaser sliding into the player
const SAVE = 3.1;                              // Save pressed (the click)
const TOAST_AT = 0.08, TOAST_IN = 0.18;
const READ = 0.42; /* deliberate */            // the final state holds before the scene's fade
// the window's push: [at, dur, zoom, focus], inOutCubic between. Focus 'row' (the new video in Content), 'es' (the
// player AND the lanes, so the end screen's 18:42 to 19:02 bars fill in view), 'player' (the teaser), 'all' (Save)
const ES_Z = 1.1;                              // the 'es' push: the player and every lane in view
const ES_CLEAR = 118;                          // ...with the player's top this far (app px) under the window's top,
                                               // below the floating checklist
const PUSH = [
  [0.28, 0.26, 1.2, 'row'],
  [ED_AT, 0.3, ES_Z, 'es'],
  [JUMP, JUMP_IN, 1, 'all'],
  [2.36, 0.3, 1.4, 'player'],
  [2.78, 0.26, 1, 'all'],
];
const VIEW_ES = [17 * 60 + 42, LENGTH];        // the timeline's window while the end screen is set (the last 80 s)
const VIEW_ALL = [0, LENGTH];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.card = r;
    T.grow = T.card + GROW_AT;
    T.full = T.grow + GROW;
    const at = (d) => r + GROW_AT + d;         // the marks below run from the window starting to open
    Object.assign(T, {
      rowHi: at(ROW_HI), rowClick: at(ROW_CLICK), ed: at(ED_AT), add: at(ADD), vidHi: at(VID_HI), sub: at(SUB),
      choose: at(CHOOSE), el: at(EL), subs: at(SUBS), jump: at(JUMP), cadd: at(CADD), cvid: at(CVID), mark: at(MARK),
      tease: at(TEASE), save: at(SAVE),
    });
    T.push = PUSH.map(([a, d, z, f]) => [at(a), d, z, f]);
    T.ok = [T.card + OK0, T.el + EL_IN, T.mark + MARK_IN];
    T.toast = T.save + TOAST_AT;
    T.end = T.toast + TOAST_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, {
      grow: T.grow, clicks: [T.rowClick, T.add, T.choose, T.cadd, T.cvid], save: T.save, toast: T.toast,
      lands: [T.el, T.subs, T.mark], tease: T.tease, jump: T.jump,
    });
    const icon = (f) => x.brand(f);
    const thumb = (f) => x.img('thumbs/' + f);

    // ---- the checklist card: one in the chat, one floating over the full-frame layer ----
    const stepIcon = (kind) => (kind === 'studio' ? `<span class="gk-ic gk-av">${INITIAL}</span>` : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const cardHTML = (cls) => `<div class="gk-card ${cls}">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
    </div>`;
    const card = x.el(cardHTML(''));
    const fcard = x.el(cardHTML('gk-float'));
    const checksOf = (n) => [...n.querySelectorAll('.gk-ok')].map((o) => ({ spin: o.querySelector('.gk-spin'), ck: o.querySelector('.gk-ck') }));
    const checks = [checksOf(card), checksOf(fcard)];

    // ---- the app client: YouTube Studio, Content then the video's Editor ----
    const av = (cls = '') => `<span class="pl-av ${cls}">${INITIAL}</span>`;
    const navItem = ([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`;
    const layer = x.el(`<div class="st-full es-full" aria-hidden="true"><div class="st-app es-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
        <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}<span>Create</span></span></span>
        ${av('pl-me')}
      </header>
      <div class="st-main">
        <div class="es-navs">
          <nav class="st-nav es-nav-ch">
            <div class="st-chan">${av('pl-av-xl')}<b>Your channel</b><small>${esc(CHANNEL)}</small></div>
            ${NAV.map(navItem).join('')}
            <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
          </nav>
          <nav class="st-nav es-nav-v">
            <div class="es-back">${ms('arrow-back')}<span>Channel content</span></div>
            <div class="es-yv"><span class="es-yv-th"><img src="${thumb('final-boss.jpg')}" alt=""/><i>19:02</i></span><small>Your video</small><b>${esc(VIDEO)}</b></div>
            ${VNAV.map(navItem).join('')}
          </nav>
        </div>
        <section class="st-page es-content">
          <h1 class="st-h1">Channel content</h1>
          <div class="es-tabs">${TABS.map((tb) => `<span class="es-tab${tb === 'Videos' ? ' es-tab-on' : ''}">${tb}</span>`).join('')}</div>
          <div class="es-filter">${ms('filter-list')}<span>Filter</span></div>
          <div class="es-tr es-th"><span class="es-cb">${ms('check-box-outline-blank')}</span><span>Video</span><span>Visibility</span><span>Restrictions</span><span>Date</span><span class="es-num">Views</span><span class="es-num">Comments</span><span class="es-num">Likes (vs. dislikes)</span></div>
          ${ROWS.map(([f, title, dur, date, views, cm, likes], i) => `<div class="es-tr es-row${i === 0 ? ' es-new' : ''}">
            <span class="es-cb">${ms('check-box-outline-blank')}</span>
            <span class="es-vid"><span class="es-vth"><img src="${thumb(f)}" alt=""/><i>${dur}</i></span><span class="es-vt"><b>${esc(title)}</b><small>Hollow Crown · Jonah Plays</small></span></span>
            <span class="es-vis">${ms('public')}Public</span><span>None</span><span class="es-date">${date}<small>Published</small></span>
            <span class="es-num">${views}</span><span class="es-num">${cm}</span><span class="es-num">${likes}</span>
          </div>`).join('')}
        </section>
        <section class="st-page es-editor">
          <div class="es-eh"><h1 class="st-h1">Video editor</h1><span class="es-discard">Discard changes</span><span class="es-save">Save</span></div>
          <div class="es-body">
            <div class="es-player">
              <img class="es-fr es-fr-end" src="${x.img('frames/end-1842.jpg')}" alt=""/>
              <img class="es-fr es-fr-715" src="${x.img('frames/at-715.jpg')}" alt=""/>
              <div class="es-el es-el-vid"><img src="${thumb(PICK[0])}" alt=""/><span class="es-el-t">${esc(PICK[1])}</span></div>
              <div class="es-el es-el-sub"><span class="es-sub-av">${INITIAL}</span></div>
              <div class="es-teaser"><span>${esc(TEASER)}</span><i>${ms('info-outline')}</i></div>
              <div class="es-ctl"><span>${ms('play-arrow')}</span><span>${ms('skip-next')}</span><span>${ms('volume-up-outline')}</span><b class="es-time">18:42 / 19:02</b><span class="es-ctl-r">${ms('closed-caption-outline')}${ms('settings-outline')}${ms('fullscreen')}</span></div>
            </div>
            <div class="es-side">
              <div class="es-pane es-pane-es">
                <b class="es-ph">End screen</b><small class="es-psub es-count">0 of 4 elements</small>
                <div class="es-it es-it-vid">${ms('smart-display-outline')}<span class="es-itx"><b>Video</b><small>Choose specific video</small><span class="es-pickrow"><img src="${thumb(PICK[0])}" alt=""/>${esc(PICK[1])}</span></span><span class="es-times"><i>18:42</i><i>19:02</i></span></div>
                <div class="es-it es-it-sub">${ms('person-add-outline')}<span class="es-itx"><b>Subscribe</b><small>${esc(CHANNEL)}</small></span><span class="es-times"><i>18:42</i><i>19:02</i></span></div>
              </div>
              <div class="es-pane es-pane-ic">
                <b class="es-ph">Info cards</b><small class="es-psub">1 of 5 cards</small>
                <div class="es-it">${ms('smart-display-outline')}<span class="es-itx"><b>Video</b><span class="es-pickrow"><img src="${thumb(PICK[0])}" alt=""/>${esc(PICK[1])}</span></span><span class="es-times"><i>7:15</i></span></div>
                <div class="es-field"><small>Teaser text</small><span>${esc(TEASER)}</span><em>${TEASER.length}/30</em></div>
              </div>
            </div>
          </div>
          <div class="es-tl">
            <div class="es-tbar">${ms('undo')}${ms('redo')}<b class="es-tread">18:42 / 19:02</b><span class="es-zoom">${ms('zoom-out')}<i></i>${ms('zoom-in')}</span></div>
            <div class="es-lane es-ruler"><span class="es-ll"></span><span class="es-track es-ticks"></span></div>
            <div class="es-lane es-lv"><span class="es-ll">${ms('content-cut')}<span>Trim &amp; cut</span></span><span class="es-track"><i class="es-strip" style="background-image:url('${x.img('frames/strip.jpg')}')"></i></span></div>
            ${LANES.map(([ic, label, key]) => `<div class="es-lane${key ? ' es-l-' + key : ''}"><span class="es-ll">${ms(ic)}<span>${esc(label)}</span><span class="es-plus">${ms('add')}</span></span><span class="es-track">${
              key === 'es' ? `<i class="es-bar es-bar-v">${ms('smart-display-outline')}<span>Video</span></i><i class="es-bar es-bar-s">${ms('person-add-outline')}<span>Subscribe</span></i>`
                : key === 'ic' ? `<i class="es-mk">${ms('info-outline')}<span>Video</span></i>` : ''}</span></div>`).join('')}
            <i class="es-head"></i>
          </div>
          <div class="es-menu es-menu-el">${ELEMENTS.map(([ic, label]) => `<div class="es-mi">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}</div>
          <div class="es-menu es-menu-vid">${VIDEO_OPTS.map((label) => `<div class="es-mi"><span>${esc(label)}</span></div>`).join('')}</div>
          <div class="es-menu es-menu-card">${CARDS.map(([ic, label]) => `<div class="es-mi">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}</div>
        </section>
      </div>
    </div><div class="st-snack">${esc(TOAST)}</div></div>`);
    x.root.appendChild(layer);
    x.root.appendChild(fcard);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const $$ = (s) => [...layer.querySelectorAll(s)];
    const nav = { ch: $('.es-nav-ch'), v: $('.es-nav-v') };
    const content = $('.es-content'), editor = $('.es-editor'), newRow = $('.es-new'), newTitle = $('.es-new .es-vt b');
    const frEnd = $('.es-fr-end'), fr715 = $('.es-fr-715'), player = $('.es-player');
    const elVid = $('.es-el-vid'), elSub = $('.es-el-sub'), teaser = $('.es-teaser');
    const time = $('.es-time'), tread = $('.es-tread'), ticks = $('.es-ticks'), strip = $('.es-strip'), head = $('.es-head');
    const barV = $('.es-bar-v'), barS = $('.es-bar-s'), mk = $('.es-mk');
    const plusES = $('.es-l-es .es-plus'), plusIC = $('.es-l-ic .es-plus');
    const menuEl = $('.es-menu-el'), menuVid = $('.es-menu-vid'), menuCard = $('.es-menu-card');
    const miVideo = menuEl.children[1], miChoose = menuVid.children[2], miCard = menuCard.children[0];
    const paneES = $('.es-pane-es'), paneIC = $('.es-pane-ic'), itVid = $('.es-it-vid'), itSub = $('.es-it-sub');
    const save = $('.es-save'), snack = $('.st-snack'), count = $('.es-count');
    const track = $('.es-l-es .es-track'), tl = $('.es-tl');
    const pointerEl = x.root.querySelector('.cursor');
    // Studio is Roboto (vendored, endscreen.css): ask for every face up front so a seek never measures in the fallback
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));

    let geo = '', AW = 1600, AH = 900, sn = 0, lastTicks = '', lastTime = '', lastCount = '';
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
    // a node's centre in the app's own px (the app's transform is scale + translate only, so it divides out)
    const inApp = (n) => {
      const a = app.getBoundingClientRect(), b = n.getBoundingClientRect();
      const k = a.width / AW || 1;
      return { x: (b.left - a.left + b.width / 2) / k, y: (b.top - a.top + b.height / 2) / k };
    };
    const focusOf = (f) => (f === 'row' ? { x: AW * 0.52, y: inApp(newRow).y + 40 } : f === 'player' ? inApp(player)
      : f === 'es' ? { x: AW - AW / 2 / ES_Z, y: inApp(player).y - player.offsetHeight / 2 - ES_CLEAR + AH / 2 / ES_Z } : { x: AW / 2, y: AH / 2 });

    // the timeline's window [v0, v1] in seconds of the video, and a time's x in a track's px
    const view = (t) => {
      const p = inOutCubic(seg(t, T.jump, T.jump + JUMP_IN));
      return [lerp(VIEW_ES[0], VIEW_ALL[0], p), lerp(VIEW_ES[1], VIEW_ALL[1], p)];
    };
    const renderTimeline = (t) => {
      const [v0, v1] = view(t), span = v1 - v0, tw = track.offsetWidth || 1;
      const X = (s) => ((s - v0) / span) * tw;
      // the ruler: 15 s steps on the last 80 s, 2 min steps on the whole video
      const step = span <= 120 ? 15 : span <= 300 ? 30 : span <= 600 ? 60 : 120;
      let html = '';
      for (let s = Math.ceil(v0 / step) * step; s <= v1; s += step) if (X(s) >= 18 && X(s) <= tw - 18) html += `<i style="left:${X(s).toFixed(1)}px">${mmss(s)}</i>`;
      if (html !== lastTicks) { ticks.innerHTML = html; lastTicks = html; }
      const bw = (tw * LENGTH) / span;
      strip.style.width = `${bw.toFixed(1)}px`;
      strip.style.transform = `translateX(${(-(v0 / LENGTH) * bw).toFixed(1)}px)`;
      // both end screen lanes fill from 18:42 to 19:02
      const f = outCubic(seg(t, T.el, T.el + BARS));
      const f2 = outCubic(seg(t, T.subs, T.subs + BARS));
      barV.style.left = barS.style.left = `${X(ES0).toFixed(1)}px`;
      barV.style.width = `${Math.max(0, (X(LENGTH) - X(ES0)) * f).toFixed(1)}px`;
      barS.style.width = `${Math.max(0, (X(LENGTH) - X(ES0)) * f2).toFixed(1)}px`;
      barV.style.opacity = seg(t, T.el, T.el + 0.06).toFixed(3);
      barS.style.opacity = seg(t, T.subs, T.subs + 0.06).toFixed(3);
      const m = outCubic(seg(t, T.mark, T.mark + MARK_IN));
      mk.style.left = `${X(CARD_AT_S).toFixed(1)}px`;
      mk.style.opacity = m.toFixed(3);
      mk.style.transform = `translateX(-50%) scale(${lerp(0.6, 1, m).toFixed(4)})`;
      // the playhead: at 18:42, then travelling to 7:15 as the view opens out
      const ph = lerp(ES0, CARD_AT_S, inOutCubic(seg(t, T.jump, T.jump + JUMP_IN)));
      head.style.left = `${(track.offsetLeft + X(ph)).toFixed(1)}px`;
      const tx = `${mmss(ph)} / 19:02`;
      if (tx !== lastTime) { time.textContent = tx; tread.textContent = tx; lastTime = tx; }
    };

    // the pointer's stops, in order: [arrive by, node, press at]; it glides between them and leaves after Save
    const STOPS = [
      [T.rowHi, newTitle, T.rowClick], [T.add - 0.04, plusES, T.add - 0.04], [T.vidHi, miVideo, null], [T.choose, miChoose, T.choose],
      [T.cadd - 0.04, plusIC, T.cadd - 0.04], [T.cvid, miCard, T.cvid], [T.save, save, T.save],
    ];
    const ptr = (t) => {
      if (t < T.full - 0.08 || t > T.save + 0.4 || !pointerEl) return null;
      const pos = (n) => { const b = x.box(n); return { x: b.x + b.w * 0.5, y: b.y + b.h * 0.6 }; };
      let i = STOPS.findIndex(([a]) => t < a);
      if (i < 0) i = STOPS.length - 1;
      const to = pos(STOPS[i][1]);
      const from = i === 0 ? { x: to.x + 240, y: to.y + 180 } : pos(STOPS[i - 1][1]);
      const a0 = i === 0 ? T.full - 0.08 : STOPS[i - 1][0] + 0.06;
      const m = inOutCubic(seg(t, a0, Math.max(a0 + 0.01, STOPS[i][0])));
      const leave = outCubic(seg(t, T.save + 0.14, T.save + 0.4));
      const p = STOPS.reduce((acc, [, , at]) => Math.max(acc, at === null ? 0 : press(t, at)), 0);
      return { x: lerp(from.x, to.x, m) + leave * 50, y: lerp(from.y, to.y, m) + leave * 40, p, v: seg(t, T.full - 0.08, T.full) * (1 - leave) };
    };

    // the menus open up and to the right of a lane's + (the lanes sit low on the page); the Video options open beside
    // "Video". Placed in the editor's own px, every frame (cheap, and right on any ratio)
    const placeMenus = () => {
      const eb = editor.getBoundingClientRect(), k = eb.width / (editor.offsetWidth || 1) || 1;
      const rel = (n) => { const b = n.getBoundingClientRect(); return { x: (b.left - eb.left) / k, y: (b.top - eb.top) / k, w: b.width / k, h: b.height / k }; };
      const at = (menu, plus) => {
        const p = rel(plus);
        menu.style.left = `${(p.x + p.w + 6).toFixed(1)}px`;
        menu.style.top = `${(p.y + p.h - menu.offsetHeight).toFixed(1)}px`;
      };
      at(menuEl, plusES);
      at(menuCard, plusIC);
      const m = rel(menuEl), v = rel(miVideo);
      menuVid.style.left = `${(m.x + m.w + 4).toFixed(1)}px`;
      menuVid.style.top = `${(v.y - 8).toFixed(1)}px`;
    };

    const renderChecks = (t) => checks.forEach((list) => list.forEach((c, i) => {
      const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
      c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
      c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
      c.ck.style.opacity = o.toFixed(3);
      c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
    }));
    const pop = (n, t, a, d = 0.16, s0 = 0.92) => {
      const p = outCubic(seg(t, a, a + d));
      n.style.opacity = p.toFixed(3);
      n.style.transform = p >= 1 ? 'none' : `scale(${lerp(s0, 1, p).toFixed(4)})`;
      return p;
    };

    return {
      nodes: [card],
      marks: [[T.card - 0.12, card]],   // the thread opens room as the card starts to rise, so it has landed by T.grow
      render(t) {
        layout();
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        renderChecks(t);

        // Content, then the new video's Editor (the menu swaps from the channel's to the video's)
        newRow.classList.toggle('es-hi', t >= T.rowHi);
        const e = outCubic(seg(t, T.ed, T.ed + ED_IN));
        editor.style.opacity = e.toFixed(3);
        content.style.opacity = (1 - e).toFixed(3);
        nav.v.style.opacity = e.toFixed(3);
        nav.ch.style.opacity = (1 - e).toFixed(3);

        // End screen: Add element > Video > Choose specific video, the tile and Subscribe land, the lanes fill
        menuEl.style.opacity = (seg(t, T.add, T.add + 0.06) * (1 - seg(t, T.choose + 0.04, T.choose + 0.1))).toFixed(3);
        miVideo.classList.toggle('es-mi-hi', t >= T.vidHi);
        menuVid.style.opacity = (seg(t, T.sub, T.sub + 0.06) * (1 - seg(t, T.choose + 0.04, T.choose + 0.1))).toFixed(3);
        miChoose.classList.toggle('es-mi-hi', t >= T.choose - 0.05);
        plusES.classList.toggle('es-plus-on', t >= T.add - 0.04 && t < T.choose + 0.1);
        const end = 1 - seg(t, T.jump + 0.08, T.jump + 0.2);
        const v = pop(elVid, t, T.el, EL_IN, 0.6);
        elVid.style.opacity = (v * end).toFixed(3);
        const s = pop(elSub, t, T.subs, EL_IN, 0.5);
        elSub.style.opacity = (s * end).toFixed(3);
        frEnd.style.opacity = end.toFixed(3);
        fr715.style.opacity = (1 - end).toFixed(3);
        pop(itVid, t, T.el);
        pop(itSub, t, T.subs);
        const nEl = `${(t >= T.el ? 1 : 0) + (t >= T.subs ? 1 : 0)} of 4 elements`;
        if (nEl !== lastCount) { count.textContent = nEl; lastCount = nEl; }

        // Info cards: Add card > Video, the marker lands at 7:15, the teaser slides into the player
        const ic = seg(t, T.jump + 0.08, T.jump + 0.2);
        paneES.style.opacity = (1 - ic).toFixed(3);
        paneIC.style.opacity = seg(t, T.mark, T.mark + 0.14).toFixed(3);
        menuCard.style.opacity = (seg(t, T.cadd, T.cadd + 0.06) * (1 - seg(t, T.cvid + 0.04, T.cvid + 0.1))).toFixed(3);
        miCard.classList.toggle('es-mi-hi', t >= T.cvid - 0.06);
        plusIC.classList.toggle('es-plus-on', t >= T.cadd - 0.04 && t < T.cvid + 0.1);
        const te = outCubic(seg(t, T.tease, T.tease + TEASE_IN));
        teaser.style.opacity = seg(t, T.tease, T.tease + 0.08).toFixed(3);
        teaser.style.transform = `translateX(${((1 - te) * 110).toFixed(2)}%)`;
        renderTimeline(t);
        placeMenus();

        // Save enables with the first change, is pressed, and the toast rises
        save.classList.toggle('es-save-on', t >= T.el);
        const pr = press(t, T.save);
        save.style.transform = pr ? `scale(${(1 - 0.07 * pr).toFixed(4)})` : 'none';
        save.classList.toggle('es-save-hit', t >= T.save);
        sn = outCubic(seg(t, T.toast, T.toast + TOAST_IN));
        snack.style.opacity = sn.toFixed(3);
      },
      // after the camera: open the layer out of the card to the whole frame, float the card's copy over it, push
      // the window onto what is happening, and place the pointer on the pushed window
      after(t) {
        if (t < T.grow) { layer.style.opacity = '0'; fcard.style.opacity = '0'; card.style.visibility = ''; return; }
        layout();
        const root = x.root;
        const W = root.offsetWidth, H = root.offsetHeight;
        const b = x.box(card);
        const g = inOutCubic(seg(t, T.grow, T.full));
        const w0 = b.w, h0 = (b.w * H) / W;
        const L = lerp(b.x, 0, g), Tp = lerp(b.y + b.h / 2 - h0 / 2, 0, g), Wd = lerp(w0, W, g), Ht = lerp(h0, H, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(16 * (1 - g)).toFixed(2)}px`;
        layer.style.opacity = seg(t, T.grow, T.grow + 0.08).toFixed(3);
        // the window's own push, move by move
        const sc = Wd / AW;
        let cam = { z: 1, x: AW / 2, y: AH / 2 };
        for (const [a, d, z, f] of T.push) {
          if (t < a) break;
          const p = inOutCubic(seg(t, a, a + d)), to = focusOf(f);
          cam = { z: lerp(cam.z, z, p), x: lerp(cam.x, to.x, p), y: lerp(cam.y, to.y, p) };
        }
        // never push past the window's edges
        const hw = AW / 2 / cam.z, hh = AH / 2 / cam.z;
        cam.x = Math.min(AW - hw, Math.max(hw, cam.x)); cam.y = Math.min(AH - hh, Math.max(hh, cam.y));
        app.style.transform = `scale(${sc.toFixed(5)}) translate(${(AW / 2).toFixed(2)}px, ${(AH / 2).toFixed(2)}px) scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(2)}px, ${(-cam.y).toFixed(2)}px)`;
        // the toast sits on the window, not in the pushed page: YouTube's bottom-left corner at the window's scale
        snack.style.left = `${(24 * sc).toFixed(2)}px`;
        snack.style.bottom = `${(24 * sc).toFixed(2)}px`;
        snack.style.transform = `translateY(${((1 - sn) * 24 * sc).toFixed(2)}px) scale(${sc.toFixed(5)})`;
        // the card lifts out of the thread and glides to the top centre, shrinking to FLOAT.w
        card.style.visibility = 'hidden';
        const cw = card.offsetWidth || 1;
        const fw = Math.min(FLOAT.w, W * 0.62);
        const s0 = b.w / cw, s1 = fw / cw;
        const fx = lerp(b.x, (W - fw) / 2, g), fy = lerp(b.y, FLOAT.top, g);
        fcard.style.width = `${cw}px`;
        fcard.style.opacity = '1';
        fcard.style.transform = `translate(${fx.toFixed(2)}px, ${fy.toFixed(2)}px) scale(${lerp(s0, s1, g).toFixed(5)})`;
        const pt = ptr(t);
        if (pt) placeCursor(pointerEl, pt.x, pt.y, pt.p, pt.v);
      },
    };
  },
};
