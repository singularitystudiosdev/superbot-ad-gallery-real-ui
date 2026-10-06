// Studio beat: superbot uploads the three Shorts from Theo's own YouTube Studio, links each to the full video and
// schedules them. Its line streams and the source's checklist card lands in the chat ("Connected as Theo Outside", the
// three files, the related video, the Fri / Sat / Sun schedule), ticking in turn with a mini window under it; the card
// holds and the window opens to full frame (GROW), the source's connect-card grammar (without the consent card).
// Full frame is YouTube Studio, light theme, on the Content page (Channel content, Videos tab, the long video on top).
// The pointer walks the real flow (YouTube Help 57407 and 14075157, fetched 2026-10-05): Create > Upload videos; three
// vertical files dropped at once (Studio takes up to 15 and lists them, an Edit draft per file); Edit draft on the
// first; Details: Title, then Related video ("a video from your channel that appears as a link in the Shorts player")
// set to the long video; Visibility > Schedule, the date picker (Fri, Oct 9) and the time list (12:00 PM); Schedule.
// The dialog closes on Content, the Shorts tab opens, and the three new rows open on top, Scheduled Fri, Sat, Sun
// 12:00 PM (the chime). The final state holds (READ).
//
// As in the source, ONE Studio client sits on a layer in the scene root (outside the camera): pinned over the card's
// window while the card is in the chat, interpolated to the whole frame by GROW. The client is laid out at a design
// size (the frame divided by APP_SCALE) and scaled to the layer. Pure function of t: every moving value is written
// from t; the pointer reads the live boxes of its targets.
import { lerp, seg, outCubic, inOutCubic, streamCount, press, boxIn } from '../../../lib.js';
import { ms } from './yt-icons.js?v=5c75e467';
import { CHANNEL, VIDEO, MOMENTS, TIME } from './story.js?v=5c75e467';

const SAY = 'Uploading from your own YouTube Studio, as you.';
const M0 = MOMENTS[0];
const STEPS = [
  ['avatar', `Connected as <b>${CHANNEL}</b>`],
  ['youtube', 'Upload videos: <b>3 vertical files</b>'],
  ['link', 'Related video set on all 3 Shorts'],
  ['schedule-outline', `Scheduled <b>Fri, Sat, Sun at ${TIME}</b>`],
];
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content', true], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
const TABS = ['Videos', 'Shorts', 'Live', 'Posts', 'Playlists', 'Podcasts', 'Promotions'];
const MENU = [['upload', 'Upload videos'], ['live-tv-outline', 'Go live'], ['edit-square-outline', 'Create post'], ['playlist-add', 'New playlist'], ['podcasts', 'New podcast']];
// Theo's earlier uploads, newest first: the long video the Shorts point at, then two older ones (and two older Shorts)
const VIDS = [
  { img: 'thumb-carretera', title: VIDEO.title, len: VIDEO.len, desc: VIDEO.desc, date: VIDEO.date, views: VIDEO.viewsN, comments: VIDEO.comments, likes: VIDEO.likes, lk: VIDEO.lk },
  { img: 'thumb-packing', title: 'Packing a bike for 21 days: everything I carried', len: '18:47', desc: 'Every bag, every gram, and the three things I sent home.', date: 'Sep 7, 2026', views: '188,904', comments: '1,122', likes: '97.9%', lk: '7,840 likes' },
  { img: 'thumb-steel', title: 'Why I ride a steel bike', len: '12:30', desc: 'Weight, repairs on the road, and why it is still my pick.', date: 'Aug 24, 2026', views: '96,371', comments: '688', likes: '97.2%', lk: '3,512 likes' },
];
const OLD_SHORTS = [
  { img: 'short-wind', title: 'Patagonian headwind vs. me', len: '0:31', desc: '', date: 'Sep 14, 2026', views: '98,114', comments: '402', likes: '98.2%', lk: '5,610 likes', v: true },
  { img: 'short-steppe', title: 'Golden hour on the steppe', len: '0:24', desc: '', date: 'Sep 3, 2026', views: '61,207', comments: '233', likes: '98.6%', lk: '3,947 likes', v: true },
];
const LINK = 'https://youtube.com/shorts/Kq3vT8xW2pE';
const PICK = [
  { img: 'thumb-carretera', title: VIDEO.title, meta: `${VIDEO.len} · ${VIDEO.date}` },
  { img: 'thumb-packing', title: VIDS[1].title, meta: `${VIDS[1].len} · ${VIDS[1].date}` },
  { img: 'thumb-steel', title: VIDS[2].title, meta: `${VIDS[2].len} · ${VIDS[2].date}` },
];
const STAGES = ['Details', 'Video elements', 'Checks', 'Visibility'];
const TIMES = ['11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM', TIME, '12:15 PM', '12:30 PM'];

const APP_SCALE = { wide: 1.3, tall: 1.2 };       // full frame: the client px to frame px (the dialog reads larger)
// timing (seconds from the reply start; W_ marks are seconds from the full frame)
const CPS = 80;
const LIST_AT = 0.22;            // the line streams, then the checklist card lands
const CARD_IN = 0.3;
const CHECK_AT = 0.25;           // the checklist landing to the first check
const CHECK_STAGGER = 0.13;
const POP = 0.16;
const CARD_HOLD = 0.2; /* deliberate */ // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */      // the window opens to full frame
const W_ = {
  create: 0.22, menu: 0.26, upv: 0.46, dlg: 0.5, grab: 0.56, drop: 0.9, list: 0.96, edit: 1.24, det: 1.3,
  title: 1.42, titleEnd: 1.76, rel: 1.88, pop: 1.92, pick: 2.14, vis: 2.4, sched: 2.56, dateF: 2.7, day: 2.86,
  timeF: 3.0, noon: 3.16, go: 3.34, close: 3.4, shorts: 3.58, rows: 3.66,
};
const UP = [1.0, 1.25, 1.5];     // each file's upload, from the drop to 100% (seconds)
const MOVE = 0.3;                // the pointer's travel onto its next target (or less, if the gap is shorter)
const ROW_STAGGER = 0.09;
const ROW_IN = 0.34;
const WASH = 1.1;
const READ = 0.55; /* deliberate */ // the final state holds, readable, before the phone rises
const RADIUS = 8;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
const fade = (n, o) => { n.style.opacity = Math.max(0, Math.min(1, o)).toFixed(3); };

export default {
  times(r) {
    const T = { r };
    T.list = r + LIST_AT;
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    const F = T.full;
    T.w = Object.fromEntries(Object.entries(W_).map(([k, v]) => [k, F + v]));
    T.rows = MOMENTS.map((_, i) => T.w.rows + i * ROW_STAGGER);
    T.end = T.rows[MOMENTS.length - 1] + ROW_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T, w = T.w;
    const icon = (f) => x.brand(f);
    const img = (f) => x.img(f);
    // the renderer reads the sound marks from here (scene-local time; the tabs scene starts the spot at 0)
    const PRESSES = ['create', 'upv', 'edit', 'title', 'rel', 'pick', 'vis', 'sched', 'dateF', 'day', 'timeF', 'noon', 'go', 'shorts'];
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, {
      studio: { list: T.list, grow: T.grow, full: T.full, drop: w.drop, checks: T.ok.slice(), clicks: PRESSES.map((p) => w[p]), rows: T.rows.slice(), upDone: UP.map((u) => w.drop + u) },
      chime: T.rows[MOMENTS.length - 1],
    });

    // ---- the checklist card in the chat ----
    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av">T</span>'
      : kind === 'youtube' ? `<span class="gk-ic gk-img"><img src="${icon('youtube-icon.svg')}" alt=""/></span>`
        : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame YouTube Studio client ----
    const th = (o) => `<span class="ct-th${o.v ? ' ct-thv' : ''}"><img src="${img(`${o.img}.jpg`)}" alt=""/><i>${o.len}</i></span>`;
    const row = (o, cls = '') => `<div class="ct-row ${cls}"><i class="ct-wash"></i><i class="ct-cb"></i>
      <div class="ct-v">${th(o)}<div class="ct-tx"><b>${esc(o.title)}</b>${o.desc ? `<small>${esc(o.desc)}</small>` : ''}</div></div>
      <div class="ct-vis">${o.sched ? `${ms('schedule-outline')}<span><span>Scheduled</span><small>${o.day}, ${o.date}, ${TIME}</small></span>` : `${ms('visibility-outline')}<span>Public</span>`}</div>
      <div class="ct-res">None</div>
      <div class="ct-date"><span>${esc(o.dateL || o.date)}</span><small>${o.sched ? 'Uploaded' : 'Published'}</small></div>
      <div class="ct-num">${o.sched ? '0' : o.views}</div><div class="ct-num">${o.sched ? '0' : o.comments}</div>
      <div class="ct-lk">${o.sched ? '<span>&ndash;</span>' : `<span>${o.likes}</span><small>${o.lk}</small><i class="ct-bar"><i style="width: ${o.likes}"></i></i>`}</div>
    </div>`;
    const NEW = MOMENTS.map((m) => ({ img: `short-${m.img}`, title: m.title, len: m.len, v: true, sched: true, day: m.day, date: m.date, dateL: 'Oct 5, 2026' }));
    const cal = () => {
      const cells = [];
      for (let i = 0; i < 4; i++) cells.push('<i></i>');    // Oct 1, 2026 is a Thursday
      for (let d = 1; d <= 31; d++) cells.push(`<i class="cal-d${d < 5 ? ' cal-past' : ''}${d === 5 ? ' cal-today' : ''}" data-d="${d}">${d}</i>`);
      return cells.join('');
    };
    const head = (first) => `<div class="ct-head"><i class="ct-cb"></i><span class="ct-v">${first}</span><span class="ct-vis">Visibility</span><span class="ct-res">Restrictions</span>
      <span class="ct-date">Date${ms('arrow-upward', 'ct-sort')}</span><span class="ct-num">Views</span><span class="ct-num">Comments</span><span class="ct-lk">Likes (vs. dislikes)</span></div>`;
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
        <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}<span>Create</span></span></span>
        <span class="st-me">T</span>
      </header>
      <div class="st-main">
        <nav class="st-nav">
          <div class="st-chan"><span class="st-big">T</span><b>Your channel</b><small>${esc(CHANNEL)}</small></div>
          ${NAV.map(([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}
          <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
        </nav>
        <section class="st-page">
          <h1 class="st-h1">Channel content</h1>
          <div class="st-tabs">${TABS.map((l, i) => `<span class="st-tab${i ? '' : ' st-tab-on'}" data-i="${i}">${l}</span>`).join('')}</div>
          <div class="st-filter">${ms('filter-list')}<span class="ct-fl">Filter</span></div>
          <div class="ct-pg ct-pv">${head('Video')}${VIDS.map((o) => row(o)).join('')}</div>
          <div class="ct-pg ct-ps">${head('Short')}${NEW.map((o) => `<div class="ct-slot">${row(o, 'ct-new')}</div>`).join('')}${OLD_SHORTS.map((o) => row(o)).join('')}</div>
        </section>
      </div>
      <div class="cm-menu">${MENU.map(([ic, l], i) => `<div class="cm-it${i ? '' : ' cm-up'}">${ms(ic)}<span>${l}</span></div>`).join('')}</div>
      <div class="up-scrim"></div>
      <div class="up-dlg">
        <div class="up-a">
          <div class="up-hd"><b>Upload videos</b><span class="up-hi">${ms('feedback-outline')}${ms('close')}</span></div>
          <div class="up-drop"><span class="up-circ">${ms('upload')}</span><b>Drag and drop video files to upload</b>
            <small>Your videos will be private until you publish them.</small><span class="up-sel">Select files</span></div>
          <div class="up-legal">By submitting your videos to YouTube, you acknowledge that you agree to YouTube's <u>Terms of Service</u> and <u>Community Guidelines</u>.<br/>Please make sure that you do not violate others' copyright or privacy rights.</div>
        </div>
        <div class="up-m">
          <div class="up-hd"><b class="um-h">Uploading 3 videos</b><span class="up-hi">${ms('close')}</span></div>
          <div class="um-list">${MOMENTS.map((m) => `<div class="um-row">
            <span class="um-th"><img src="${img(`short-${m.img}.jpg`)}" alt=""/></span>
            <div class="um-tx"><b>${esc(m.file)}</b><small class="um-st">Uploading 0%</small><i class="um-bar"><i></i></i></div>
            <span class="um-ed">${ms('edit-square-outline')}<span>Edit draft</span></span>
          </div>`).join('')}</div>
          <div class="um-ft">${ms('info-outline')}<span>Click Edit draft to add each video's details</span></div>
        </div>
        <div class="up-b">
          <div class="up-hd"><b class="up-ttl">${esc(M0.file)}</b><span class="up-saved">Saved as private</span><span class="up-hi">${ms('close')}</span></div>
          <div class="up-steps"><i class="up-line"></i>${STAGES.map((l, i) => `<div class="up-st" data-i="${i}"><span>${l}</span><i class="up-dot">${ms('check')}</i></div>`).join('')}</div>
          <div class="up-body">
            <div class="up-left">
              <div class="up-pane up-p0">
                <div class="up-h2row"><h2>Details</h2><span class="up-reuse">Reuse details</span></div>
                <div class="up-field up-f-title"><label>Title (required)</label><div class="up-in"><span class="up-tv">${esc(M0.file)}</span><i class="up-caret"></i></div><span class="up-cnt">${M0.file.length}/100</span></div>
                <div class="up-field up-f-desc"><label>Description</label><div class="up-in up-ta"><div class="up-ph">Tell viewers about your video (type @ to mention a channel)</div></div><span class="up-cnt">0/5,000</span></div>
                <h3>Related video</h3><p class="up-sub">A video from your channel that appears as a link in the Shorts player. <u>Learn more</u></p>
                <div class="rv-dd"><span class="rv-0">${ms('link')}<span>Select a video</span></span>
                  <span class="rv-1"><span class="rv-th"><img src="${img('thumb-carretera.jpg')}" alt=""/><i>${VIDEO.len}</i></span><span class="rv-tx"><b>${esc(VIDEO.title)}</b><small>${CHANNEL} · ${VIDEO.date}</small></span></span>
                  ${ms('arrow-drop-down', 'rv-ar')}</div>
                <div class="rv-pop"><div class="rv-ph">Select a related video</div>${PICK.map((p, i) => `<div class="rv-it${i ? '' : ' rv-pk'}"><span class="rv-th"><img src="${img(`${p.img}.jpg`)}" alt=""/></span><span class="rv-tx"><b>${esc(p.title)}</b><small>${p.meta}</small></span></div>`).join('')}</div>
              </div>
              <div class="up-pane up-p3">
                <h2>Visibility</h2><p class="up-sub">Choose when to publish and who can see your video</p>
                <div class="vi-card vi-save"><i class="up-rb"></i><div><b>Save or publish</b><small>Make your video public, unlisted, or private</small></div></div>
                <div class="vi-card vi-sched"><i class="up-rb"></i><div class="vi-main"><b>Schedule</b><small>Select a date to make your video public.</small>
                  <div class="vi-exp"><div class="vi-in">
                    <div class="vi-fields"><span class="vi-dd vi-date"><span class="vi-dv">Oct 5, 2026</span>${ms('arrow-drop-down')}</span><span class="vi-dd vi-time"><span class="vi-tv">7:00 PM</span>${ms('arrow-drop-down')}</span><span class="vi-dd vi-tz"><span>GMT-3 Santiago</span>${ms('arrow-drop-down')}</span></div>
                    <small class="vi-note">Video will be private before publishing</small>
                  </div></div></div></div>
                <div class="vi-cal"><div class="cal-hd"><b>October 2026</b><span>${ms('chevron-left')}${ms('chevron-right')}</span></div>
                  <div class="cal-g">${'SMTWTFS'.split('').map((d) => `<i class="cal-w">${d}</i>`).join('')}${cal()}</div></div>
                <div class="vi-times">${TIMES.map((l) => `<span class="vi-ti${l === TIME ? ' vi-noon' : ''}">${l}</span>`).join('')}</div>
              </div>
            </div>
            <div class="up-right"><div class="vc">
              <div class="vc-pv"><img src="${img(`short-${M0.img}.jpg`)}" alt=""/><span class="vc-play"></span>
                <div class="vc-up"><span>Uploading video...</span><b class="vc-pct">0%</b><i class="vc-bar"><i></i></i></div></div>
              <div class="vc-meta">
                <small>Video link</small><div class="vc-link"><span>${esc(LINK)}</span>${ms('content-copy-outline')}</div>
                <small>Filename</small><div class="vc-fn">${esc(M0.file)}.mp4</div>
                <small>Video quality</small><div class="vc-q"><b class="vc-sd">SD</b><b class="vc-hd">HD</b></div>
              </div>
            </div></div>
          </div>
          <div class="up-ft"><span class="up-ics">${ms('upload', 'up-i0')}${ms('hd-outline', 'up-i1')}${ms('check-circle', 'up-i2')}</span><span class="up-stat"></span>
            <span class="up-back">Back</span><span class="up-next">Next</span></div>
        </div>
      </div>
      <div class="up-ghost">${ms('video-file-outline')}<span>${esc(M0.file)}.mp4</span><b class="ug-n">3</b></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const $$ = (s) => [...layer.querySelectorAll(s)];
    const n = {
      create: $('.st-create'), menu: $('.cm-menu'), upv: $('.cm-up'), scrim: $('.up-scrim'), dlg: $('.up-dlg'),
      a: $('.up-a'), m: $('.up-m'), b: $('.up-b'), circ: $('.up-circ'), drop: $('.up-drop'), ghost: $('.up-ghost'),
      umH: $('.um-h'), umRows: $$('.um-row').map((r) => ({ st: r.querySelector('.um-st'), bar: r.querySelector('.um-bar i'), ed: r.querySelector('.um-ed') })),
      ttl: $('.up-ttl'), tv: $('.up-tv'), caret: $('.up-caret'), tField: $('.up-f-title'), tCnt: $('.up-f-title .up-cnt'),
      rv: $('.rv-dd'), rv0: $('.rv-0'), rv1: $('.rv-1'), pop: $('.rv-pop'), pk: $('.rv-pk'),
      panes: [$('.up-p0'), $('.up-p3')], st: $$('.up-st'),
      vSched: $('.vi-sched'), vRb: $('.vi-sched .up-rb'), vExp: $('.vi-exp'), vIn: $('.vi-in'), vDate: $('.vi-date'), vDv: $('.vi-dv'), vTime: $('.vi-time'), vTv: $('.vi-tv'),
      cal: $('.vi-cal'), p3: $('.up-p3'), d9: $(`.cal-d[data-d="${M0.dd}"]`), times: $('.vi-times'), noon: $('.vi-noon'),
      vcUp: $('.vc-up'), vcPct: $('.vc-pct'), vcBar: $('.vc-bar i'), vcPlay: $('.vc-play'), vcHd: $('.vc-hd'),
      stat: $('.up-stat'), i0: $('.up-i0'), i2: $('.up-i2'), back: $('.up-back'), next: $('.up-next'),
      tabV: $('.st-tab[data-i="0"]'), tabS: $('.st-tab[data-i="1"]'), pv: $('.ct-pv'), ps: $('.ct-ps'),
      slots: $$('.ct-slot'), newRows: $$('.ct-new'), washes: $$('.ct-new .ct-wash'),
    };
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((wt) => document.fonts.load(`${wt} 14px "Roboto GM"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, expH = '';
    const slotH = MOMENTS.map(() => '');
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
      expH = ''; slotH.fill('');
    };

    // ---- the pointer: one target after another, each a live box (or a fixed point for the file pick-up) ----
    const at = (node, fx = 0.5, fy = 0.5) => () => { const b = x.box(node); return b.w ? { x: b.x + b.w * fx, y: b.y + b.h * fy } : null; };
    const fixed = (fx, fy) => () => ({ x: x.root.offsetWidth * fx, y: x.root.offsetHeight * fy });
    const PATH = [
      [w.create, at(n.create, 0.42, 0.55), true],
      [w.upv, at(n.upv, 0.3, 0.55), true],
      [w.grab, fixed(0.14, 0.88), false],
      [w.drop, at(n.circ, 0.55, 0.55), false],
      [w.edit, at(n.umRows[0].ed, 0.5, 0.55), true],
      [w.title, at(n.tField, 0.62, 0.55), true],
      [w.rel, at(n.rv, 0.5, 0.5), true],
      [w.pick, at(n.pk, 0.4, 0.5), true],
      [w.vis, at(n.st[3], 0.5, 0.35), true],
      [w.sched, at(n.vRb, 0.5, 0.5), true],
      [w.dateF, at(n.vDate, 0.4, 0.55), true],
      [w.day, at(n.d9, 0.5, 0.55), true],
      [w.timeF, at(n.vTime, 0.4, 0.55), true],
      [w.noon, at(n.noon, 0.35, 0.55), true],
      [w.go, at(n.next, 0.5, 0.55), true],
      [w.shorts, at(n.tabS, 0.5, 0.6), true],
    ];
    const last = { x: 0, y: 0 };
    const END_PTR = w.shorts + 0.5;
    const ptr = (t) => {
      if (t < T.full || t > END_PTR) return null;
      let i = PATH.findIndex(([a]) => t < a);
      if (i < 0) i = PATH.length;
      const prev = i > 0 ? PATH[i - 1] : null, next = i < PATH.length ? PATH[i] : null;
      const pp = prev ? prev[1]() : fixed(0.62, 0.58)();
      let pos = pp || last;
      if (next) {
        const np = next[1]() || pos;
        const a0 = prev ? prev[0] : T.full;
        const mv = Math.min(MOVE, next[0] - a0 - 0.06);
        const m = inOutCubic(seg(t, next[0] - mv, next[0] - 0.02));
        pos = { x: lerp(pos.x, np.x, m), y: lerp(pos.y, np.y, m) };
      } else {
        const lv = outCubic(seg(t, w.shorts + 0.12, END_PTR));
        pos = { x: pos.x + lv * 60, y: pos.y + lv * 50 };
      }
      last.x = pos.x; last.y = pos.y;
      const pr = PATH.reduce((s, [a, , p]) => Math.max(s, p ? press(t, a) : 0), 0);
      const v = seg(t, T.full, T.full + 0.12) * (1 - seg(t, w.shorts + 0.25, END_PTR));
      return { x: pos.x, y: pos.y, p: pr, v };
    };
    const pressed = (node, t, a) => { const p = press(t, a); node.style.transform = p ? `scale(${(1 - 0.05 * p).toFixed(4)})` : ''; };
    const upPct = (i, t) => seg(t, w.drop + 0.06, w.drop + UP[i]);
    const upLine = (p) => {
      const pct = Math.round(p * 100);
      const left = pct < 40 ? '3 minutes left' : pct < 75 ? '2 minutes left' : pct < 96 ? '1 minute left' : 'a few seconds left';
      return p >= 1 ? 'Upload complete ... Processing will begin shortly' : `Uploading ${pct}% ... ${left}`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const ns = streamCount(SAY, T.r + 0.05, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const li = outCubic(seg(t, T.list, T.list + CARD_IN));
        card.style.opacity = li.toFixed(3);
        card.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // ---- Create > Upload videos ----
        n.create.classList.toggle('st-hit', t >= w.create && t < w.dlg);
        pressed(n.create, t, w.create);
        const mo = outCubic(seg(t, w.menu, w.menu + 0.12)) * (1 - seg(t, w.dlg, w.dlg + 0.1));
        fade(n.menu, mo);
        n.menu.style.transform = `translateY(${((1 - Math.min(1, mo * 2)) * -6).toFixed(2)}px)`;
        n.upv.classList.toggle('cm-hov', t >= w.upv - 0.2);
        const dg = outCubic(seg(t, w.dlg, w.dlg + 0.2)) * (1 - inOutCubic(seg(t, w.close, w.close + 0.2)));
        fade(n.dlg, dg);
        fade(n.scrim, dg);
        n.dlg.style.transform = `translate(-50%, -50%) scale(${lerp(0.96, 1, dg).toFixed(4)})`;
        // the three files: picked up bottom left, dragged onto the circle, dropped
        const gv = seg(t, w.grab - 0.06, w.grab + 0.04) * (1 - seg(t, w.drop, w.drop + 0.08));
        fade(n.ghost, gv);
        if (gv > 0) {
          const p = ptr(t);
          if (p) n.ghost.style.transform = `translate(${(p.x / (x.root.offsetWidth / AW) + 14).toFixed(1)}px, ${(p.y / (x.root.offsetHeight / AH) + 10).toFixed(1)}px)`;
        }
        n.drop.classList.toggle('up-over', t >= w.drop - 0.18 && t < w.list);
        // the dialog's three faces: the drop zone, the upload list, the first file's details
        const sm = seg(t, w.list - 0.06, w.list + 0.1), sb = seg(t, w.det - 0.06, w.det + 0.12);
        fade(n.a, 1 - sm);
        fade(n.m, sm * (1 - sb));
        fade(n.b, sb);
        // the upload list: three rows, each its own speed
        const all = UP.every((_, i) => upPct(i, t) >= 1);
        setText(n.umH, all ? 'Uploads complete' : 'Uploading 3 videos');
        n.umRows.forEach((r, i) => {
          const p = upPct(i, t);
          setText(r.st, upLine(p));
          r.bar.style.transform = `scaleX(${p.toFixed(4)})`;
        });
        n.umRows[0].ed.classList.toggle('um-hit', t >= w.edit - 0.12);
        pressed(n.umRows[0].ed, t, w.edit);

        // ---- the details of Short 1 ----
        const stage = t < w.vis ? 0 : 1;
        fade(n.panes[0], stage === 0 ? 1 : 0);
        fade(n.panes[1], stage === 1 ? seg(t, w.vis + 0.02, w.vis + 0.16) : 0);
        n.st.forEach((s, i) => { s.classList.toggle('on', stage ? i === 3 : i === 0); s.classList.toggle('done', stage ? i < 3 : false); });
        fade(n.back, stage ? 1 : 0);
        setText(n.next, t >= w.sched ? 'Schedule' : 'Next');
        pressed(n.next, t, w.go);
        pressed(n.st[3], t, w.vis);
        // the title: Studio prefills the file name; superbot selects it and types the title
        const nt = Math.round(M0.title.length * seg(t, w.title + 0.06, w.titleEnd));
        const tv = t < w.title + 0.06 ? M0.file : M0.title.slice(0, nt);
        setText(n.tv, tv);
        setText(n.ttl, tv || M0.file);
        n.tv.classList.toggle('up-selall', t >= w.title && t < w.title + 0.06);
        n.caret.style.display = t >= w.title && t < w.rel ? '' : 'none';
        setText(n.tCnt, `${tv.length}/100`);
        n.tField.classList.toggle('up-focus', t >= w.title && t < w.rel);
        // Related video: the picker opens, the long video is picked, the field shows it
        const po = outCubic(seg(t, w.pop, w.pop + 0.12)) * (1 - seg(t, w.pick + 0.06, w.pick + 0.16));
        fade(n.pop, po);
        // the picker opens upward from the field (the dialog's footer is right under it)
        if (po > 0) {
          const fb = boxIn(n.rv, n.panes[0]);
          n.pop.style.left = `${fb.x.toFixed(1)}px`;
          n.pop.style.top = `${(fb.y - n.pop.offsetHeight - 6).toFixed(1)}px`;
        }
        n.pop.style.transform = `translateY(${((1 - Math.min(1, po * 2)) * 6).toFixed(2)}px)`;
        n.pk.classList.toggle('rv-hov', t >= w.pick - 0.16);
        const set = t >= w.pick + 0.06;
        n.rv0.style.display = set ? 'none' : '';
        n.rv1.style.display = set ? '' : 'none';
        n.rv.classList.toggle('up-focus', t >= w.rel && t < w.pick + 0.06);
        n.rv.classList.toggle('rv-set', set);
        n.rv.style.boxShadow = set ? `inset 0 0 0 ${(1 + inOutCubic(1 - seg(t, w.pick + 0.06, w.pick + 0.7))).toFixed(2)}px ${t < w.pick + 0.7 ? 'var(--yt-blue)' : '#ccc'}` : '';
        // the upload of the first file, in the video card and the footer
        const up = upPct(0, t);
        setText(n.vcPct, `${Math.round(up * 100)}%`);
        n.vcBar.style.transform = `scaleX(${up.toFixed(4)})`;
        fade(n.vcUp, 1 - seg(t, w.drop + UP[0] + 0.05, w.drop + UP[0] + 0.25));
        fade(n.vcPlay, seg(t, w.drop + UP[0] + 0.05, w.drop + UP[0] + 0.25));
        n.vcHd.classList.toggle('on', t >= w.vis);
        setText(n.stat, t < w.vis ? upLine(up) : 'Checks complete. No issues found.');
        n.i0.classList.toggle('on', up >= 1);
        n.i2.classList.toggle('on', t >= w.vis);

        // Visibility: Schedule opens; the date picker; the time list
        n.vSched.classList.toggle('on', t >= w.sched);
        const ex = inOutCubic(seg(t, w.sched + 0.02, w.sched + 0.18));
        const eh = n.vIn.offsetHeight;
        const want = ex >= 1 ? 'auto' : `${(eh * ex).toFixed(2)}px`;
        if (want !== expH) { n.vExp.style.height = want; expH = want; }
        const co = outCubic(seg(t, w.dateF + 0.03, w.dateF + 0.12)) * (1 - seg(t, w.day + 0.08, w.day + 0.16));
        fade(n.cal, co);
        if (co > 0 || seg(t, w.timeF, w.noon + 0.2) > 0) {
          const db = boxIn(n.vDate, n.p3), tb = boxIn(n.vTime, n.p3);
          n.cal.style.left = `${db.x.toFixed(1)}px`; n.cal.style.top = `${(db.y + db.h + 4).toFixed(1)}px`;
          n.times.style.left = `${tb.x.toFixed(1)}px`; n.times.style.top = `${(tb.y + tb.h + 4).toFixed(1)}px`;
        }
        n.d9.classList.toggle('cal-sel', t >= w.day);
        n.d9.classList.toggle('cal-hov', t >= w.day - 0.14);
        setText(n.vDv, t >= w.day ? `${M0.date}, 2026` : 'Oct 5, 2026');
        n.vDate.classList.toggle('up-focus', t >= w.dateF && t < w.day + 0.16);
        const to = outCubic(seg(t, w.timeF + 0.03, w.timeF + 0.12)) * (1 - seg(t, w.noon + 0.08, w.noon + 0.16));
        fade(n.times, to);
        n.noon.classList.toggle('vi-hov', t >= w.noon - 0.14);
        setText(n.vTv, t >= w.noon ? TIME : '7:00 PM');
        n.vTime.classList.toggle('up-focus', t >= w.timeF && t < w.noon + 0.16);

        // ---- Content > Shorts: the three new rows open on top, Scheduled Fri, Sat, Sun ----
        const sh = t >= w.shorts;
        n.tabV.classList.toggle('st-tab-on', !sh);
        n.tabS.classList.toggle('st-tab-on', sh);
        pressed(n.tabS, t, w.shorts);
        n.pv.style.display = sh ? 'none' : '';
        n.ps.style.display = sh ? '' : 'none';
        n.slots.forEach((s, i) => {
          const rw = inOutCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          const rh = n.newRows[i].offsetHeight;
          const hh = rw >= 1 ? 'auto' : `${(rh * rw).toFixed(2)}px`;
          if (hh !== slotH[i]) { s.style.height = hh; slotH[i] = hh; }
          fade(n.newRows[i], seg(t, T.rows[i] + ROW_IN * 0.3, T.rows[i] + ROW_IN));
          fade(n.washes[i], t < T.rows[i] ? 0 : 1 - inOutCubic(seg(t, T.rows[i] + ROW_IN, T.rows[i] + ROW_IN + WASH)));
        });
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const W = x.root.offsetWidth, H = x.root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
