// Editor beat, the finale: superbot works Maya Makes' own YouTube Studio. The "Connecting to YouTube Studio" pill
// checks, and ONE Studio client (light theme, Roboto) opens out of the pill to the full frame on Channel content (the
// channel menu: Dashboard, Content, Analytics, Community, Subtitles, Copyright, Earn, Customization, Audio library), the
// walnut desk upload on top. superbot's dark status bar sits over the search, the connect checklist laid flat:
// "Connected as Maya Makes", the cut, the save, the chapters, each with a spinner that resolves to a check. The pointer
// does it in Studio's own controls (support.google.com/youtube/answer/9057455, Trim & cut):
//   1. the title opens the video's Details (the menu becomes the video's: Details, Analytics, Editor, ...), Editor in
//      the menu opens the Video editor; Trim & cut, New cut, and the red cut region is dragged from 0:06 to 0:31 over the filmstrip (the preview follows the handle
//      through the recap to the hook frame); the check confirms it; Save, and "Changes are being processed";
//   2. Details: the nine chapter timestamps in the Description are swapped for Opus's (green), Save, "Changes saved";
//   3. back in the Editor the recap folds out of the timeline and the length reads 21:53;
//   4. "48 hours later": Analytics > Engagement, the same key-moments card, the new curve drawn over the old one,
//      77% still watching at 0:30 (up from 58%).
// The client is laid out once at a design size (the frame / APP_SCALE) and scaled to the layer, so the opening and the
// full frame are the same pixels at two sizes. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, press } from '../../../lib.js';
import { ms } from './yt-icons.js?v=9b9c1281';
import { CHANNEL, ME, VIDEO, CUT, SHIFT, AFTER_LEN, CHAPTERS, INTRO, RET_BEFORE, RET_AFTER, AT30, at as retAt, ts } from './walnut.js?v=9b9c1281';
import { chart } from './retchart.js?v=9b9c1281';

const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content', true], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
// the video's own menu once it is open (Studio's video page)
const VNAV = [
  ['edit-outline', 'Details'], ['analytics-outline', 'Analytics'], ['movie-edit-outline', 'Editor'], ['comment-outline', 'Comments'],
  ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'], ['attach-money', 'Earn'], ['content-cut', 'Clips'],
];
// Channel content, Videos tab: the walnut desk upload and the two before it
const ROWS = [
  { img: VIDEO.thumb, title: VIDEO.title, desc: 'Hand tools only: a walnut desk from a $212 board.', len: ts(VIDEO.len), date: 'Sep 28, 2026', views: '186,240', cm: '2,317', likes: '98.6%', n: '11,904' },
  { img: 'f-recap2.jpg', title: 'Flattening a Twisted Board by Hand', desc: 'No jointer, no planer: winding sticks and a No. 5.', len: '18:40', date: 'Sep 21, 2026', views: '142,903', cm: '1,488', likes: '98.9%', n: '9,212' },
  { img: 'f-recap1.jpg', title: 'Milling Rough Walnut Without a Jointer', desc: 'From the lumberyard stack to square stock.', len: '16:05', date: 'Sep 14, 2026', views: '121,377', cm: '1,102', likes: '98.4%', n: '7,640' },
];
// the Trim & cut filmstrip: the first minute, in the frames of the video (img/CREDITS.txt)
const XMAX = 60;
const STRIP = [[0, CUT.a, 'f-0000.jpg'], [CUT.a, 18.5, 'f-recap1.jpg'], [18.5, CUT.b, 'f-recap2.jpg'], [CUT.b, 45, 'f-0031.jpg'], [45, 90, 'f-0045.jpg']];
const DESC_TOP = 'Hand tools only: a walnut desk from a $212 board. It almost split on day one.';
const SNACK = 'Changes saved';
const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
const CUR = '<svg class="ed-cur" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z"/></svg>';

const APP_SCALE = 1.1;                  // full frame: the client's px to frame px
const LANE_W = 1245;                    // the Trim & cut lane's width (app px): the first minute
const px = (s) => (s / XMAX) * LANE_W;
// timing (seconds from the reply start, or from the step named)
const GROW = 0.3; /* deliberate */      // the window opens out of the pill to the full frame
const OPEN_W = 420;                     // the window's width (frame px) as it leaves the pill
const BAR_AT = -0.06, BAR_IN = 0.18;    // full frame to the status bar landing
const CLICK_ROW = 0.16;                 // full frame to the click on the upload
const TO_EDITOR = 0.2;                 // its Details opening to the click on Editor in the menu
const FADE = 0.07;                      // a page swap (Studio swaps pages at once; a four-frame dissolve, no ghosting)
const TRIM = 0.26;                      // the Editor open to the click on Trim & cut
const NEWCUT = 0.24;                    // ...to New cut
const DRAG0 = 0.14, DRAG = 0.5; /* deliberate */ // New cut to the drag, and the drag itself (0:06 to 0:31)
const CONFIRM = 0.12;                   // the drag ending to the check
const SAVE = 0.22;                      // the check to Save
const DETAILS = 0.22;                   // Save to the click on Details
const SWAP0 = 0.18, SWAP_STEP = 0.03, SWAP_IN = 0.12; // Details open to the first chapter swapped, one to the next
const DSAVE = 0.16;                     // the last chapter swapped to Save
const BACK = 0.2;                      // Save to the click on Editor
const COL0 = 0.16, COL = 0.36;          // the Editor back to the recap folding out of the timeline
const RESULT = 0.45; /* deliberate */    // the trimmed timeline holds
const L0 = 0.2, LDRAW = 0.55;           // "48 hours later" to the new curve drawing
const LATER = 0.62; /* deliberate */     // the 48-hour card holds before the scene's fade
const RADIUS = 12;                      // the window's radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="sb-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.g0 = r - 0.02;
    T.full = T.g0 + GROW;
    T.bar = T.full + BAR_AT;
    T.clkRow = T.full + CLICK_ROW;
    T.det1 = T.clkRow + 0.04;
    T.clkEd = T.det1 + TO_EDITOR;
    T.open = T.clkEd + 0.04;
    T.clkTrim = T.open + TRIM;
    T.clkNew = T.clkTrim + NEWCUT;
    T.drag0 = T.clkNew + DRAG0;
    T.drag1 = T.drag0 + DRAG;
    T.clkOk = T.drag1 + CONFIRM;
    T.clkSave = T.clkOk + SAVE;
    T.clkDet = T.clkSave + DETAILS;
    T.det = T.clkDet + 0.04;
    T.swap = CHAPTERS.map((_, i) => T.det + SWAP0 + i * SWAP_STEP);
    T.clkDsave = T.swap[T.swap.length - 1] + SWAP_IN + DSAVE;
    T.snack = T.clkDsave + 0.06;
    T.clkBack = T.clkDsave + BACK;
    T.back = T.clkBack + 0.04;
    T.col0 = T.back + COL0;
    T.col1 = T.col0 + COL;
    T.later = T.col1 + RESULT;
    T.l0 = T.later + L0;
    T.l1 = T.l0 + LDRAW;
    T.ok = [T.full + 0.06, T.clkOk + 0.06, T.clkSave + 0.1, T.clkDsave + 0.08];
    T.end = T.l1 + LATER;
    T.clicks = [T.clkRow, T.clkEd, T.clkTrim, T.clkNew, T.clkOk, T.clkSave, T.clkDet, T.clkDsave, T.clkBack];
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { editor: {
      g0: T.g0, full: T.full, clicks: T.clicks, drag0: T.drag0, drag1: T.drag1, swap: T.swap, snack: T.snack, col0: T.col0, col1: T.col1,
      later: T.later, l0: T.l0, l1: T.l1, ok: T.ok,
    } });
    return T;
  },
  build(k, x) {
    const T = k.T;
    const pills = x.hub.querySelectorAll('.qc-sw');
    const pill = pills[pills.length - 1];
    const say = x.el(`<div class="qc-say"><span class="qc-vis">Editing your video as ${esc(CHANNEL)}.</span></div>`);
    const step = (ic, html) => `<span class="sb-step">${ic}<span class="sb-tx">${html}</span><span class="sb-ok"><i class="sb-spin"></i>${CHECK}</span></span>`;
    const nv = (ic, label, on, cls = '') => `<div class="st-nv${on ? ' st-on' : ''}${cls}">${ms(ic)}<span>${esc(label)}</span></div>`;
    const foot = `<div class="st-nfoot">${nv('settings-outline', 'Settings')}${nv('feedback-outline', 'Send feedback')}</div>`;
    const row = (rw, i) => `<div class="ed-crow${i === 0 ? ' ed-crow-1' : ''}"><span class="ed-cv"><span class="ed-th"><img src="${x.img(rw.img)}" alt=""/><i>${rw.len}</i></span>
        <span class="ed-ct"><b>${esc(rw.title)}</b><small>${esc(rw.desc)}</small></span></span>
        <span class="ed-cc">${ms('visibility-outline')}Public</span><span class="ed-cc">None</span><span class="ed-cc ed-cd">${rw.date}<small>Published</small></span>
        <span class="ed-cc ed-cn">${rw.views}</span><span class="ed-cc ed-cn">${rw.cm}</span><span class="ed-cc ed-cn">${rw.likes}<small>${rw.n} likes</small></span></div>`;
    const strip = STRIP.map(([a, b, f], i) => `<span class="ed-seg${i === 1 || i === 2 ? ' ed-rec' : ''}${i >= 3 ? ' ed-aft' : ''}" style="width:${px(b - a).toFixed(1)}px;background-image:url('${x.img(f)}')"></span>`).join('');
    const ticks = Array.from({ length: XMAX / 5 + 1 }, (_, i) => i * 5).map((s) => `<span class="ed-tk${s % 10 ? '' : ' ed-tk-l'}" style="left:${px(s).toFixed(1)}px">${s % 10 ? '' : `<i>${ts(s)}</i>`}</span>`).join('');
    const lane = (ic, label, cls = '') => `<div class="ed-ll${cls}">${ms(ic)}<span>${label}</span></div>`;
    const descRow = (ch) => `<div class="ed-dl"><span class="ed-dt"><span class="ed-o">${ch.old}</span><span class="ed-n">${ch.now}</span></span> ${esc(ch.name)}</div>`;
    const big = chart(1000, 300, { pad: { l: 8, r: 52, t: 12, b: 28 } });

    const layer = x.el(`<div class="st-full ed-full" aria-hidden="true"><div class="st-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${x.brand('youtube-studio-logo.svg')}" alt=""/></span>
        <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}<span>Create</span></span></span>
        <span class="st-me">${ME}</span>
      </header>
      <div class="st-main">
        <div class="ed-navs">
          <nav class="st-nav ed-navc">
            <div class="st-chan"><span class="st-big">${ME}</span><b>Your channel</b><small>${esc(CHANNEL)}</small></div>
            ${NAV.map(([ic, l, on]) => nv(ic, l, on)).join('')}${foot}
          </nav>
          <nav class="st-nav ed-navv">
            <div class="ed-vh"><span class="ed-th ed-th-l"><img src="${x.img(VIDEO.thumb)}" alt=""/><i class="ed-vlen">${ts(VIDEO.len)}</i><i class="ed-vlen ed-vlen2">${ts(AFTER_LEN)}</i></span>
              <small>Your video</small><b>${esc(VIDEO.title)}</b></div>
            ${VNAV.map(([ic, l]) => nv(ic, l, false, ` ed-v-${l.toLowerCase()}`)).join('')}${foot}
          </nav>
        </div>
        <div class="ed-pages">
          <section class="st-page ed-pg ed-content">
            <h1 class="st-h1">Channel content</h1>
            <div class="st-tabs">${['Videos', 'Shorts', 'Live', 'Posts', 'Playlists', 'Podcasts', 'Promotions'].map((l, i) => `<span class="st-tab${i ? '' : ' st-tab-on'}">${l}</span>`).join('')}</div>
            <div class="st-filter">${ms('filter-list')}<span class="ed-fl">Filter</span></div>
            <div class="ed-chead"><span class="ed-cv">Video</span><span class="ed-cc">Visibility</span><span class="ed-cc">Restrictions</span><span class="ed-cc ed-cd">Date ${ms('arrow-downward')}</span><span class="ed-cc ed-cn">Views</span><span class="ed-cc ed-cn">Comments</span><span class="ed-cc ed-cn">Likes (vs. dislikes)</span></div>
            ${ROWS.map(row).join('')}
          </section>
          <section class="st-page ed-pg ed-editor">
            <div class="ed-hdr"><h1 class="st-h1">Video editor</h1><span class="ed-sp"></span><span class="ed-tb ed-disc">Discard changes</span><span class="ed-save">Save</span></div>
            <div class="ed-banner"><i class="ed-bspin"></i><span>Changes are being processed</span></div>
            <div class="ed-body">
              <div class="ed-player">
                <div class="ed-screen">${['f-0006.jpg', 'f-recap1.jpg', 'f-recap2.jpg', 'f-0031.jpg'].map((f) => `<img src="${x.img(f)}" alt=""/>`).join('')}</div>
                <div class="ed-ctl">${ms('play-arrow')}<span class="ed-time"><b class="ed-now">0:06</b> / <span class="ed-len">${ts(VIDEO.len)}</span></span><span class="ed-sp"></span>${ms('volume-up-outline')}${ms('fullscreen')}</div>
              </div>
              <div class="ed-panel">
                <div class="ed-ph"><b>Trim &amp; cut</b>${ms('close')}</div>
                <p>Remove parts of your video. The rest stays live with its views and comments.</p>
                <span class="ed-new">${ms('add')}<span>New cut</span></span>
                <div class="ed-cut"><span class="ed-f"><small>Start</small><b>0:06</b></span><span class="ed-dash">–</span><span class="ed-f"><small>End</small><b class="ed-end">0:06</b></span>
                  <span class="ed-ib ed-okb">${ms('check')}</span><span class="ed-ib">${ms('delete-outline')}</span></div>
              </div>
            </div>
            <div class="ed-tl">
              <div class="ed-tools">${ms('undo')}${ms('redo')}<span class="ed-sp"></span><span class="ed-dur">Duration <b class="ed-d0">${ts(VIDEO.len)}</b><b class="ed-d1">${ts(AFTER_LEN)}</b></span><span class="ed-zoom">${ms('zoom-out')}<i><b></b></i>${ms('zoom-in')}</span></div>
              <div class="ed-grid">
                <div class="ed-labels"><div class="ed-rl"></div>${lane('content-cut', 'Trim &amp; cut', ' ed-ll-trim')}${lane('blur-on', 'Blur')}${lane('music-note', 'Audio')}${lane('video-label-outline', 'End screen')}${lane('info-outline', 'Info cards')}</div>
                <div class="ed-lanes" style="width:${LANE_W}px">
                  <div class="ed-ruler">${ticks}</div>
                  <div class="ed-strip">${strip}<span class="ed-join" style="left:${(px(CUT.a) - 1.5).toFixed(1)}px"></span><span class="ed-region"><i class="ed-h ed-h0"></i><i class="ed-h ed-h1"></i><em class="ed-rlab">0:06 – <b class="ed-rend">0:06</b></em></span></div>
                  <div class="ed-lane"></div><div class="ed-lane"></div><div class="ed-lane"></div><div class="ed-lane"></div>
                  <span class="ed-play"><i></i></span>
                </div>
              </div>
            </div>
          </section>
          <section class="st-page ed-pg ed-details">
            <div class="ed-hdr"><h1 class="st-h1">Video details</h1><span class="ed-sp"></span><span class="ed-tb">Undo changes</span><span class="ed-save ed-dsave">Save</span></div>
            <div class="ed-dbody">
              <div class="ed-dcol">
                <div class="ed-field"><small>Title (required)</small><div>${esc(VIDEO.title)}</div></div>
                <div class="ed-field ed-desc"><small>Description</small><div>${esc(DESC_TOP)}</div><div class="ed-gap"></div>
                  <div class="ed-dl"><span class="ed-dt"><span>0:00</span></span> ${esc(INTRO)}</div>${CHAPTERS.map(descRow).join('')}</div>
              </div>
              <div class="ed-dside"><span class="ed-th ed-th-xl"><img src="${x.img(VIDEO.thumb)}" alt=""/></span>
                <div class="ed-dmeta"><small>Visibility</small><b>Public</b><small>Filename</small><span>walnut_desk_final_v3.mp4</span></div></div>
            </div>
          </section>
          <section class="st-page ed-pg ed-an">
            <div class="ed-hdr"><h1 class="st-h1">Video analytics</h1></div>
            <div class="st-tabs">${['Overview', 'Reach', 'Engagement', 'Audience'].map((l) => `<span class="st-tab${l === 'Engagement' ? ' st-tab-on' : ''}">${l}</span>`).join('')}</div>
            <div class="ed-kc">
              <div class="ed-kh"><b>Key moments for audience retention</b><span class="ed-kt"><i class="on">Intro</i><i>Top moments</i><i>Spikes</i><i>Dips</i></span></div>
              <div class="ed-ks"><b class="ed-kp">${AT30.before}%</b><span>of viewers are still watching at 0:30</span><em class="ed-up">${ms('arrow-upward')}from ${AT30.before}%</em></div>
              <div class="ed-kch"><svg viewBox="0 0 1000 300" width="1000" height="300">
                <defs><clipPath id="ed-clip"><rect class="ed-clipr" x="0" y="0" width="0" height="300"/></clipPath></defs>
                ${big.axes}
                <path class="ed-oline" d="${big.d(RET_BEFORE)}"/>
                <path class="ed-area" d="${big.area(RET_AFTER)}" clip-path="url(#ed-clip)"/>
                <path class="ed-nline" d="${big.d(RET_AFTER)}" pathLength="1"/>
                <line class="ed-30" x1="${big.X(30).toFixed(1)}" x2="${big.X(30).toFixed(1)}" y1="${big.Y(AT30.before).toFixed(1)}" y2="${big.Y(AT30.after).toFixed(1)}"/>
                <circle class="ed-d58" cx="${big.X(30).toFixed(1)}" cy="${big.Y(AT30.before).toFixed(1)}" r="6"/>
                <circle class="ed-d77" cx="${big.X(30).toFixed(1)}" cy="${big.Y(AT30.after).toFixed(1)}" r="7"/>
              </svg>
                <span class="ed-lg ed-lg-old" style="left:${(big.X(46)).toFixed(1)}px;top:${(big.Y(retAt(RET_BEFORE, 46)) + 10).toFixed(1)}px">Before the trim</span>
                <span class="ed-lg ed-lg-new" style="left:${(big.X(46)).toFixed(1)}px;top:${(big.Y(retAt(RET_AFTER, 46)) - 34).toFixed(1)}px">After the trim</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div class="st-snack">${esc(SNACK)}</div>
      <div class="sb-bar">
        <span class="sb-tile">${SB_MARK}</span>
        ${step(`<span class="sb-av">${ME}</span>`, `Connected as <b>${esc(CHANNEL)}</b>`)}
        ${step(`<span class="sb-ms">${ms('content-cut')}</span>`, `Cut <b>${ts(CUT.a)}–${ts(CUT.b)}</b>`)}
        ${step(`<span class="sb-ms">${ms('movie-edit-outline')}</span>`, '<b>Saved</b> <span class="ed-dim">· processing</span>')}
        ${step(`<span class="sb-ms">${ms('edit-outline')}</span>`, `<b>${CHAPTERS.length} chapters</b> updated`)}
      </div>
      <div class="ed-later"><span>48 hours later</span></div>
      ${CUR}
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const $$ = (s) => [...layer.querySelectorAll(s)];
    const pages = { content: $('.ed-content'), editor: $('.ed-editor'), details: $('.ed-details'), an: $('.ed-an') };
    const navc = $('.ed-navc'), navv = $('.ed-navv');
    const vn = { editor: $('.ed-v-editor'), details: $('.ed-v-details'), analytics: $('.ed-v-analytics') };
    const crow = $('.ed-crow-1'), crowT = crow.querySelector('.ed-ct b');
    const llTrim = $('.ed-ll-trim'), panel = $('.ed-panel'), btnNew = $('.ed-new'), cutRow = $('.ed-cut'), cutEnd = $('.ed-end'), okb = $('.ed-okb');
    const region = $('.ed-region'), h1 = $('.ed-h1'), rend = $('.ed-rend'), join = $('.ed-join');
    const segs = $$('.ed-seg'), play = $('.ed-play'), now = $('.ed-now'), len = $('.ed-len');
    const shots = [...$('.ed-screen').children];
    const save = $('.ed-editor .ed-save'), banner = $('.ed-banner'), d0 = $('.ed-d0'), d1 = $('.ed-d1');
    const vlen = $('.ed-vlen'), vlen2 = $('.ed-vlen2');
    const dls = $$('.ed-details .ed-dl').slice(1).map((n) => ({ n, o: n.querySelector('.ed-o'), w: n.querySelector('.ed-n') }));
    const dsave = $('.ed-dsave'), snack = $('.st-snack');
    const later = $('.ed-later'), kp = $('.ed-kp'), up = $('.ed-up'), clipr = $('.ed-clipr'), newLine = $('.ed-nline');
    const d58 = $('.ed-d58'), d77 = $('.ed-d77'), l30 = $('.ed-30'), lgNew = $('.ed-lg-new'), lgOld = $('.ed-lg-old');
    const cur = $('.ed-cur');
    const bar = $('.sb-bar');
    const oks = $$('.sb-ok').map((n) => ({ spin: n.querySelector('.sb-spin'), ck: n.querySelector('.sb-ck') }));
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
    let geo = '', AW = 1745, AH = 982, nowTxt = '', endTxt = '', kpTxt = '';

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      AW = Math.round(W / APP_SCALE); AH = Math.round(H / APP_SCALE);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
    };
    // a node's point in app px (fx, fy: where in its box)
    const pt = (n, fx = 0.5, fy = 0.5) => {
      const a = n.getBoundingClientRect(), b = app.getBoundingClientRect(), s = b.width / AW || 1;
      return { x: (a.left - b.left + a.width * fx) / s, y: (a.top - b.top + a.height * fy) / s };
    };
    // a page shown over [in, out) spans, crossfaded at each edge
    const show = (n, spans, t) => { n.style.opacity = spans.reduce((m, [a, b]) => Math.max(m, seg(t, a, a + FADE) * (1 - seg(t, b, b + FADE))), 0).toFixed(3); };
    // the pointer's moves: [start moving, arrive, target node, fx, fy]
    const moves = () => [
      [T.full - 0.1, T.clkRow - 0.03, crowT, 0.3, 0.55],
      [T.det1 + 0.02, T.clkEd - 0.03, vn.editor, 0.3, 0.5],
      [T.open + 0.04, T.clkTrim - 0.03, llTrim, 0.4, 0.5],
      [T.clkTrim + 0.06, T.clkNew - 0.03, btnNew, 0.45, 0.55],
      [T.clkNew + 0.04, T.drag0, h1, 0.5, 0.5],
      [T.drag0, T.drag1, h1, 0.5, 0.5],
      [T.drag1 + 0.01, T.clkOk - 0.03, okb, 0.5, 0.55],
      [T.clkOk + 0.05, T.clkSave - 0.03, save, 0.5, 0.55],
      [T.clkSave + 0.05, T.clkDet - 0.03, vn.details, 0.3, 0.5],
      [T.det + 0.2, T.clkDsave - 0.03, dsave, 0.5, 0.55],
      [T.clkDsave + 0.05, T.clkBack - 0.03, vn.editor, 0.3, 0.5],
      [T.col1, T.later, vn.analytics, 0.3, 0.5],
    ];
    const pointer = (t) => {
      const M = moves();
      let p = pt(M[0][2], M[0][3], M[0][4]);
      p = { x: p.x + 160, y: p.y + 120 };
      for (const [a, b, n, fx, fy] of M) {
        if (t < a) break;
        const q = pt(n, fx, fy);
        const f = inOutCubic(seg(t, a, b));
        p = { x: lerp(p.x, q.x, f), y: lerp(p.y, q.y, f) };
      }
      const dn = t >= T.drag0 - 0.02 && t <= T.drag1 + 0.02 ? 1 : T.clicks.reduce((m, c) => Math.max(m, press(t, c)), 0);
      const v = seg(t, T.full - 0.12, T.full) * (1 - seg(t, T.later - 0.1, T.later + 0.1));
      cur.style.opacity = v.toFixed(3);
      cur.style.transform = `translate(${(p.x - 5).toFixed(1)}px, ${(p.y - 3).toFixed(1)}px) scale(${(1 - 0.14 * dn).toFixed(3)})`;
    };

    return {
      nodes: [say],
      marks: [[T.r, say]],
      render(t) {
        layout();
        say.style.opacity = outCubic(seg(t, T.r, T.r + 0.2)).toFixed(3);
        const bi = outCubic(seg(t, T.bar, T.bar + BAR_IN));
        bar.style.opacity = bi.toFixed(3);
        bar.style.transform = `translateX(-50%)${bi >= 1 ? '' : ` translateY(${((1 - bi) * -10).toFixed(2)}px)`}`;
        oks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + 0.16));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.bar) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the pages: Channel content, the video's Details, the Editor, Details again, the Editor again, Analytics; the
        // menu becomes the video's as the title is clicked
        pages.content.style.opacity = (1 - seg(t, T.det1, T.det1 + FADE)).toFixed(3);
        show(pages.editor, [[T.open, T.det], [T.back, T.later]], t);
        show(pages.details, [[T.det1, T.open], [T.det, T.back]], t);
        pages.an.style.opacity = seg(t, T.later, T.later + FADE).toFixed(3);
        navc.style.opacity = (1 - seg(t, T.det1, T.det1 + FADE)).toFixed(3);
        navv.style.opacity = seg(t, T.det1, T.det1 + FADE).toFixed(3);
        vn.editor.classList.toggle('st-on', (t >= T.open && t < T.det) || (t >= T.back && t < T.later));
        vn.details.classList.toggle('st-on', (t < T.open) || (t >= T.det && t < T.back));
        vn.analytics.classList.toggle('st-on', t >= T.later);
        crow.classList.toggle('ed-hover', t >= T.clkRow - 0.12 && t < T.det1 + FADE);

        // 1. the Editor: Trim & cut, New cut, the region dragged 0:06 to 0:31, the check, Save
        llTrim.classList.toggle('ed-on', t >= T.clkTrim);
        const pi = outCubic(seg(t, T.clkTrim, T.clkTrim + 0.18));
        panel.style.opacity = pi.toFixed(3);
        panel.style.transform = pi >= 1 ? 'none' : `translateX(${((1 - pi) * 24).toFixed(2)}px)`;
        btnNew.style.filter = `brightness(${(1 - 0.12 * press(t, T.clkNew)).toFixed(3)})`;
        const ci = outCubic(seg(t, T.clkNew, T.clkNew + 0.14));
        cutRow.style.opacity = ci.toFixed(3);
        region.style.opacity = ci.toFixed(3);
        const dg = inOutCubic(seg(t, T.drag0, T.drag1));
        const e = lerp(CUT.a, CUT.b, dg);
        const et = mmss(e);
        if (et !== endTxt) { cutEnd.textContent = et; rend.textContent = et; endTxt = et; }
        region.classList.toggle('ed-set', t >= T.clkOk);
        okb.classList.toggle('ed-on', t >= T.clkOk);
        save.classList.toggle('ed-live', t >= T.clkOk && t < T.clkSave + 0.12);
        save.style.transform = `scale(${(1 - 0.06 * press(t, T.clkSave)).toFixed(4)})`;
        const bn = outCubic(seg(t, T.clkSave + 0.04, T.clkSave + 0.2)) * (1 - seg(t, T.col0, T.col0 + 0.2));
        banner.style.opacity = bn.toFixed(3);

        // 3. back in the Editor: the recap folds out of the timeline, the hook butts against 0:06, 21:53
        const cf = inOutCubic(seg(t, T.col0, T.col1));
        const w0 = px(18.5 - CUT.a), w1 = px(CUT.b - 18.5);
        segs[1].style.width = `${(w0 * (1 - cf)).toFixed(2)}px`;
        segs[2].style.width = `${(w1 * (1 - cf)).toFixed(2)}px`;
        const rw = (px(e) - px(CUT.a)) * (1 - cf);
        region.style.left = `${px(CUT.a).toFixed(2)}px`;
        region.style.width = `${rw.toFixed(2)}px`;
        if (cf > 0) region.style.opacity = (ci * (1 - seg(t, T.col0 + COL * 0.6, T.col1))).toFixed(3);
        join.style.opacity = seg(t, T.col1 - 0.06, T.col1 + 0.12).toFixed(3);
        const swapLen = t >= T.col0 + COL * 0.5;
        d0.classList.toggle('ed-was', swapLen);
        d1.style.opacity = seg(t, T.col0 + COL * 0.5, T.col0 + COL * 0.5 + 0.12).toFixed(3);
        if (len.textContent !== (swapLen ? ts(AFTER_LEN) : ts(VIDEO.len))) len.textContent = swapLen ? ts(AFTER_LEN) : ts(VIDEO.len);
        vlen.style.opacity = swapLen ? '0' : '1';
        vlen2.style.opacity = swapLen ? '1' : '0';
        // the playhead rides the drag, then sits on the join; the preview shows the frame under it
        const ph = t < T.col0 ? e : CUT.a;
        play.style.transform = `translateX(${px(ph).toFixed(2)}px)`;
        const shot = t >= T.col0 ? 3 : e >= CUT.b - 0.01 ? 3 : e >= 18.5 ? 2 : e > CUT.a + 0.4 ? 1 : 0;
        shots.forEach((n, i) => { n.style.opacity = i === shot ? '1' : '0'; });
        const nt = mmss(ph);
        if (nt !== nowTxt) { now.textContent = nt; nowTxt = nt; }

        // 2. Details: each chapter's old time gives way to Opus's (green), Save, the snackbar
        dls.forEach((d, i) => {
          const a = T.swap[i];
          const f = seg(t, a, a + SWAP_IN);
          d.o.style.opacity = (1 - f).toFixed(3);
          d.w.style.opacity = f.toFixed(3);
          d.n.style.setProperty('--ed-g', (f * (1 - 0.7 * seg(t, a + 0.3, a + 0.9))).toFixed(3));
        });
        dsave.classList.toggle('ed-live', t >= T.swap[0] && t < T.clkDsave + 0.12);
        dsave.style.transform = `scale(${(1 - 0.06 * press(t, T.clkDsave)).toFixed(4)})`;
        const sn = outCubic(seg(t, T.snack, T.snack + 0.2)) * (1 - seg(t, T.later - 0.05, T.later + 0.1));
        snack.style.opacity = sn.toFixed(3);
        snack.style.transform = sn >= 1 ? 'none' : `translateY(${((1 - Math.min(1, seg(t, T.snack, T.snack + 0.2))) * 16).toFixed(2)}px)`;

        // 4. 48 hours later: the new curve over the old one, 58% to 77% at 0:30
        const li = outCubic(seg(t, T.later - 0.04, T.later + 0.2));
        later.style.opacity = li.toFixed(3);
        later.style.transform = `translateX(-50%) scale(${lerp(0.92, 1, li).toFixed(4)})`;
        const lp = inOutCubic(seg(t, T.l0, T.l1));
        newLine.style.strokeDashoffset = (1 - lp).toFixed(4);
        clipr.setAttribute('width', (lp * 1000).toFixed(1));
        const kv = `${Math.round(lerp(AT30.before, AT30.after, seg(t, T.l0 + LDRAW * 0.3, T.l1)))}%`;
        if (kv !== kpTxt) { kp.textContent = kv; kpTxt = kv; }
        const ua = outCubic(seg(t, T.l1 - 0.05, T.l1 + 0.18));
        up.style.opacity = ua.toFixed(3);
        d58.style.opacity = seg(t, T.l0, T.l0 + 0.15).toFixed(3);
        l30.style.opacity = ua.toFixed(3);
        d77.style.opacity = ua.toFixed(3);
        d77.style.transform = `scale(${lerp(0.3, 1, ua).toFixed(4)})`;
        lgNew.style.opacity = ua.toFixed(3);
        lgOld.style.opacity = seg(t, T.l0, T.l0 + 0.15).toFixed(3);
        pointer(t);
      },
      // after the camera: the window opens out of the pill to the whole frame
      after(t) {
        if (t < T.g0) { layer.style.opacity = '0'; return; }
        layout();
        const W = x.root.offsetWidth, H = x.root.offsetHeight;
        const p = pill ? x.box(pill) : { x: W / 2, y: H / 2, w: 0, h: 0 };
        const w0 = OPEN_W, h0 = (OPEN_W * H) / W;
        const x0 = p.x + p.w / 2 - w0 / 2, y0 = p.y + p.h / 2 - h0 / 2;
        const g = inOutCubic(seg(t, T.g0, T.full));
        const L = lerp(x0, 0, g), Tp = lerp(y0, 0, g), Wd = lerp(w0, W, g), Ht = lerp(h0, H, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        layer.style.opacity = outCubic(seg(t, T.g0, T.g0 + GROW * 0.45)).toFixed(3);
      },
    };
  },
};
