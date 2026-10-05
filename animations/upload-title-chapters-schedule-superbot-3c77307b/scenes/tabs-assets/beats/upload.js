// Upload beat, the finale: superbot uploads and schedules the video from Sam's own YouTube Studio. Its line streams and
// the base's checklist card lands in the chat ("Connected as Sam Rivera", the upload, the details, the schedule),
// ticking in turn with a mini window under it; the card holds and the window opens to full frame (GROW), the source's
// connect-card grammar without the consent card.
// Full frame is YouTube Studio, light theme, on the Content page (Channel content, Videos tab, the table of earlier
// uploads). The pointer walks the real flow (YouTube Help 57407 and 1270709, fetched 2026-10-05): Create > Upload
// videos; the file dropped on the "Upload videos" dialog; Details (Title, Description with the chapters, Thumbnail,
// Playlists "Desk Setups", Audience "No, it's not made for kids", Show more > Tags) while the upload runs to 100%;
// Video elements (end screen imported from the last video); Checks ("No issues found"); Visibility > Schedule with the
// date picker (Oct 8, 2026) and the time list (5:00 PM); Schedule. The dialog closes on the Content list, where the
// new row opens on top in its Scheduled state and the snackbar says "Video scheduled" (the chime). The final state
// holds (READ).
//
// As in the source, ONE Studio client sits on a layer in the scene root (outside the camera): pinned over the card's
// window while the card is in the chat, interpolated to the whole frame by GROW. The client is laid out at a design
// size (the frame divided by APP_SCALE) and scaled to the layer. Pure function of t: every moving value is written
// from t; the pointer reads the live boxes of its targets.
import { lerp, seg, outCubic, inOutCubic, streamCount, press, boxIn } from '../../../lib.js';
import { ms } from './yt-icons.js?v=3c77307b';
import { CHANNEL, FILE, TITLE, DESC, DESC_P1, TAGS, TAG_CHARS, PLAYLIST, LAST_VIDEO, VIDEO_LINK, SCHEDULE, fmt } from './story.js?v=3c77307b';

const SAY = 'Uploading from your own YouTube Studio, as you.';
const STEPS = [
  ['avatar', `Connected as <b>${CHANNEL}</b>`],
  ['youtube', `Upload videos: <b>${FILE.name}</b>`],
  ['edit-square-outline', 'Title, description, chapters, tags'],
  ['schedule-outline', `Schedule: <b>Thu, Oct 8, ${SCHEDULE.time}</b>`],
];
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content', true], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
const TABS = ['Videos', 'Shorts', 'Live', 'Posts', 'Playlists', 'Podcasts', 'Promotions'];
const MENU = [['upload', 'Upload videos'], ['live-tv-outline', 'Go live'], ['edit-square-outline', 'Create post'], ['playlist-add', 'New playlist'], ['podcasts', 'New podcast']];
// Sam's earlier uploads, newest first (LAST_VIDEO is the source spot's video: 14:32, 1,284 comments)
const ROWS = [
  { img: 'mics-12', title: LAST_VIDEO, len: '14:32', desc: 'Twelve mics, one untreated room, and a blind test at 6:12.', date: 'Sep 24, 2026', views: '48,210', comments: '1,284', likes: '98.1%', lk: '3,904 likes' },
  { img: 'upgrades-10', title: '5 desk upgrades under $10', len: '9:47', desc: 'Five things under $10 that fixed my desk for good.', date: 'Sep 10, 2026', views: '31,775', comments: '642', likes: '97.6%', lk: '2,118 likes' },
  { img: 'monitor-arms', title: 'Cheap monitor arms, ranked', len: '12:05', desc: 'Four arms from $16 to $49, one desk, two weeks each.', date: 'Aug 27, 2026', views: '22,408', comments: '391', likes: '96.9%', lk: '1,467 likes' },
];
const STAGES = ['Details', 'Video elements', 'Checks', 'Visibility'];
const AUTO = ['desk-000', 'desk-340', 'desk-1130'];   // Studio's auto-generated thumbnail suggestions
const TIMES = ['4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM', '5:00 PM', '5:15 PM', '5:30 PM'];
const SNACK = 'Video scheduled';

const APP_SCALE = { wide: 1.3, tall: 1.2 };       // full frame: the client px to frame px (the source used 1.2; the dialog reads larger)
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
  create: 0.3, menu: 0.34, upv: 0.62, dlg: 0.68, grab: 0.92, drop: 1.34, det: 1.42,
  title: 1.62, titleEnd: 1.98, desc: 2.06, descEnd: 2.32, thumb: 2.42, scroll1: 2.54, scroll1End: 2.8,
  list: 2.9, kids: 3.1, more: 3.28, scroll2: 3.32, scroll2End: 3.58, tag0: 3.62, tagStep: 0.02, upDone: 3.84,
  next1: 4.12, imp: 4.42, next2: 4.74, chk: 5.04, next3: 5.32, sched: 5.6, dateF: 5.8, day8: 6.06, timeF: 6.24,
  t5pm: 6.44, go: 6.74, close: 6.8, row: 6.96, snack: 7.1,
};
const MOVE = 0.3;                // the pointer's travel onto its next target (or less, if the gap is shorter)
const SNACK_IN = 0.3;
const ROW_IN = 0.36;
const WASH = 1.1;
const READ = 1.05; /* deliberate */ // the final state holds, readable, before the scene's fade
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
    T.w = Object.fromEntries(Object.entries(W_).map(([k, v]) => [k, k === 'tagStep' ? v : F + v]));
    T.tags = TAGS.map((_, i) => T.w.tag0 + i * W_.tagStep);
    T.settle = T.w.snack + SNACK_IN;
    T.end = Math.max(T.settle, T.w.row + ROW_IN) + READ;
    return T;
  },
  build(k, x) {
    const T = k.T, w = T.w;
    const icon = (f) => x.brand(f);
    const img = (f) => x.img(f);
    // the renderer reads the sound marks from here (scene-local time; the tabs scene starts the spot at 0)
    const PRESSES = ['create', 'upv', 'title', 'desc', 'thumb', 'list', 'kids', 'more', 'next1', 'imp', 'next2', 'next3', 'sched', 'dateF', 'day8', 'timeF', 't5pm', 'go'];
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, {
      chime: w.snack, grow: T.grow, drop: w.drop, upDone: w.upDone, checks: T.ok.slice(), clicks: PRESSES.map((p) => w[p]),
      tags: T.tags.filter((_, i) => i % 3 === 0),
    });

    // ---- the checklist card in the chat ----
    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av">S</span>'
      : kind === 'youtube' ? `<span class="gk-ic gk-img"><img src="${icon('youtube-icon.svg')}" alt=""/></span>`
        : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame YouTube Studio client ----
    const row = (o, cls = '') => `<div class="ct-row ${cls}"><i class="ct-wash"></i><i class="ct-cb"></i>
      <div class="ct-v"><span class="ct-th"><img src="${img(`thumbs/${o.img}.jpg`)}" alt=""/><i>${o.len}</i></span>
        <div class="ct-tx"><b>${esc(o.title)}</b><small>${esc(o.desc)}</small></div></div>
      <div class="ct-vis">${o.sched ? `${ms('schedule-outline')}<span><span>Scheduled</span><small>${esc(SCHEDULE.date)}, ${SCHEDULE.time}</small></span>` : `${ms('visibility-outline')}<span>Public</span>`}</div>
      <div class="ct-res">None</div>
      <div class="ct-date"><span>${esc(o.date)}</span><small>${o.sched ? 'Uploaded' : 'Published'}</small></div>
      <div class="ct-num">${o.views}</div><div class="ct-num">${o.comments}</div>
      <div class="ct-lk">${o.sched ? '<span>&ndash;</span>' : `<span>${o.likes}</span><small>${o.lk}</small><i class="ct-bar"><i style="width: ${o.likes}"></i></i>`}</div>
    </div>`;
    const NEW = { img: 'desk-89', title: TITLE, len: FILE.len, desc: DESC_P1, date: 'Oct 5, 2026', views: '0', comments: '0', sched: true };
    const lines = (s) => s.split('\n').map((l) => `<div>${l ? esc(l) : '&nbsp;'}</div>`).join('');
    const cal = () => {
      const cells = [];
      for (let i = 0; i < 4; i++) cells.push('<i></i>');    // Oct 1, 2026 is a Thursday
      for (let d = 1; d <= 31; d++) cells.push(`<i class="cal-d${d < 5 ? ' cal-past' : ''}${d === 5 ? ' cal-today' : ''}" data-d="${d}">${d}</i>`);
      return cells.join('');
    };
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
        <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}<span>Create</span></span></span>
        <span class="st-me">S</span>
      </header>
      <div class="st-main">
        <nav class="st-nav">
          <div class="st-chan"><span class="st-big">S</span><b>Your channel</b><small>${esc(CHANNEL)}</small></div>
          ${NAV.map(([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}
          <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
        </nav>
        <section class="st-page">
          <h1 class="st-h1">Channel content</h1>
          <div class="st-tabs">${TABS.map((l, i) => `<span class="st-tab${i ? '' : ' st-tab-on'}">${l}</span>`).join('')}</div>
          <div class="st-filter">${ms('filter-list')}<span class="ct-fl">Filter</span></div>
          <div class="ct-head"><i class="ct-cb"></i><span class="ct-v">Video</span><span class="ct-vis">Visibility</span><span class="ct-res">Restrictions</span>
            <span class="ct-date">Date${ms('arrow-upward', 'ct-sort')}</span><span class="ct-num">Views</span><span class="ct-num">Comments</span><span class="ct-lk">Likes (vs. dislikes)</span></div>
          <div class="ct-slot">${row(NEW, 'ct-new')}</div>
          ${ROWS.map((o) => row(o)).join('')}
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
        <div class="up-b">
          <div class="up-hd"><b class="up-ttl">${esc(FILE.base)}</b><span class="up-saved">Saved as private</span><span class="up-hi">${ms('close')}</span></div>
          <div class="up-steps"><i class="up-line"></i>${STAGES.map((l, i) => `<div class="up-st" data-i="${i}"><span>${l}</span><i class="up-dot">${ms('check')}</i></div>`).join('')}</div>
          <div class="up-body">
            <div class="up-left">
              <div class="up-pane up-p0"><div class="up-scroll">
                <div class="up-h2row"><h2>Details</h2><span class="up-reuse">Reuse details</span></div>
                <div class="up-field up-f-title"><label>Title (required)</label><div class="up-in"><span class="up-tv">${esc(FILE.base)}</span><i class="up-caret"></i></div><span class="up-cnt">${FILE.base.length}/100</span></div>
                <div class="up-field up-f-desc"><label>Description</label><div class="up-in up-ta"><div class="up-ph">Tell viewers about your video (type @ to mention a channel)</div><div class="up-dv"></div></div><span class="up-cnt">0/5,000</span></div>
                <h3>Thumbnail</h3><p class="up-sub">Set a thumbnail that stands out and draws viewers' attention. <u>Learn more</u></p>
                <div class="up-thumbs"><span class="up-tile up-upl">${ms('add-photo-alternate-outline')}<span>Upload file</span><img class="up-89" src="${img('thumbs/desk-89.jpg')}" alt=""/></span>${AUTO.map((f) => `<span class="up-tile"><img src="${img(`frames/${f}.jpg`)}" alt=""/></span>`).join('')}</div>
                <h3 class="up-h-pl">Playlists</h3><p class="up-sub">Add your video to one or more playlists to organize your content for viewers. <u>Learn more</u></p>
                <div class="up-dd"><label>Playlists</label><span class="up-ddv">Select</span>${ms('arrow-drop-down')}</div>
                <h3>Audience</h3><p class="up-q">Is this video made for kids? (required)</p>
                <p class="up-sub">Regardless of your location, you're legally required to comply with the Children's Online Privacy Protection Act (COPPA) and/or other laws. You're required to tell us whether your videos are made for kids. <u>What's content made for kids?</u></p>
                <div class="up-radio up-r-yes"><i class="up-rb"></i><span>Yes, it's made for kids</span></div>
                <div class="up-radio up-r-no"><i class="up-rb"></i><span>No, it's not made for kids</span></div>
                <div class="up-age"><span>Age restriction (advanced)</span>${ms('expand-more')}</div>
                <div class="up-more"><b class="up-mb">Show more</b><small>Paid promotion, tags, subtitles, and more</small></div>
                <div class="up-adv">
                  <h3>Paid promotion</h3><div class="up-cbrow"><i class="up-cbx"></i><span>My video contains paid promotion like a product placement, sponsorship, or endorsement</span></div>
                  <h3 class="up-h-tags">Tags</h3><p class="up-sub">Tags can be useful if content in your video is commonly misspelled. Otherwise, tags play a minimal role in helping viewers find your video. <u>Learn more</u></p>
                  <div class="up-field up-f-tags"><div class="up-chips">${TAGS.map((g) => `<span class="up-chip">${esc(g)}${ms('close')}</span>`).join('')}</div><span class="up-cnt">0/500</span></div>
                  <p class="up-sub up-tip">Enter a comma after each tag</p>
                </div>
              </div></div>
              <div class="up-pane up-p1">
                <h2>Video elements</h2><p class="up-sub">Use cards and an end screen to show viewers related videos, websites, and calls to action. <u>Learn more</u></p>
                <div class="ve-row">${ms('subtitles-outline')}<div class="ve-tx"><b>Add subtitles</b><small>Reach a broader audience by adding subtitles to your video</small></div><span class="ve-btn">Add</span></div>
                <div class="ve-row ve-end">${ms('call-to-action-outline')}<div class="ve-tx"><b>Add an end screen</b><small class="ve-s0">Promote related content at the end of your video</small><small class="ve-s1">${ms('check-circle')}<span>Imported from "${esc(LAST_VIDEO)}"</span></small></div><span class="ve-btn ve-imp">Import from video</span><span class="ve-btn ve-add">Add</span></div>
                <div class="ve-row">${ms('web-asset')}<div class="ve-tx"><b>Add cards</b><small>Promote related content during your video</small></div><span class="ve-btn">Add</span></div>
              </div>
              <div class="up-pane up-p2">
                <h2>Checks</h2><p class="up-sub">We'll check your video for issues that may restrict its visibility and then you will have the opportunity to fix issues before publishing your video. <u>Learn more</u></p>
                <div class="ck-row"><b>Copyright</b><span class="ck-st"><i class="ck-spin"></i>${ms('check-circle', 'ck-ok')}</span><span class="ck-tx"><span class="ck-t0">Checking</span><span class="ck-t1">No issues found</span></span></div>
                <p class="up-sub ck-note">Remember: These check results aren't final. Issues may come up in the future that impact your video. <u>Learn more</u></p>
              </div>
              <div class="up-pane up-p3">
                <h2>Visibility</h2><p class="up-sub">Choose when to publish and who can see your video</p>
                <div class="vi-card vi-save"><i class="up-rb"></i><div><b>Save or publish</b><small>Make your video public, unlisted, or private</small></div></div>
                <div class="vi-card vi-sched"><i class="up-rb"></i><div class="vi-main"><b>Schedule</b><small>Select a date to make your video public.</small>
                  <div class="vi-exp"><div class="vi-in">
                    <div class="vi-fields"><span class="vi-dd vi-date"><span class="vi-dv">Oct 5, 2026</span>${ms('arrow-drop-down')}</span><span class="vi-dd vi-time"><span class="vi-tv">7:00 PM</span>${ms('arrow-drop-down')}</span><span class="vi-dd vi-tz"><span>${SCHEDULE.zone}</span>${ms('arrow-drop-down')}</span></div>
                    <small class="vi-note">Video will be private before publishing</small>
                  </div></div></div></div>
                <div class="vi-cal"><div class="cal-hd"><b>October 2026</b><span>${ms('chevron-left')}${ms('chevron-right')}</span></div>
                  <div class="cal-g">${'SMTWTFS'.split('').map((d) => `<i class="cal-w">${d}</i>`).join('')}${cal()}</div></div>
                <div class="vi-times">${TIMES.map((l) => `<span class="vi-ti${l === SCHEDULE.time ? ' vi-t5' : ''}">${l}</span>`).join('')}</div>
              </div>
            </div>
            <div class="up-right"><div class="vc">
              <div class="vc-pv"><img src="${img('frames/desk-000.jpg')}" alt=""/><span class="vc-play"></span>
                <div class="vc-up"><span>Uploading video...</span><b class="vc-pct">0%</b><i class="vc-bar"><i></i></i></div></div>
              <div class="vc-meta">
                <small>Video link</small><div class="vc-link"><span>${esc(VIDEO_LINK)}</span>${ms('content-copy-outline')}</div>
                <small>Filename</small><div class="vc-fn">${esc(FILE.name)}</div>
                <small>Video quality</small><div class="vc-q"><b class="vc-sd">SD</b><b class="vc-hd">HD</b></div>
              </div>
            </div></div>
          </div>
          <div class="up-ft"><span class="up-ics">${ms('upload', 'up-i0')}${ms('hd-outline', 'up-i1')}${ms('check-circle', 'up-i2')}</span><span class="up-stat"></span>
            <span class="up-back">Back</span><span class="up-next">Next</span></div>
        </div>
      </div>
      <div class="up-ghost">${ms('video-file-outline')}<span>${esc(FILE.name)}</span><small>${FILE.size}</small></div>
      <div class="st-snack">${esc(SNACK)}</div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const $$ = (s) => [...layer.querySelectorAll(s)];
    const n = {
      create: $('.st-create'), menu: $('.cm-menu'), upv: $('.cm-up'), scrim: $('.up-scrim'), dlg: $('.up-dlg'),
      a: $('.up-a'), b: $('.up-b'), circ: $('.up-circ'), drop: $('.up-drop'), ghost: $('.up-ghost'),
      ttl: $('.up-ttl'), tv: $('.up-tv'), caret: $('.up-caret'), tField: $('.up-f-title'), tCnt: $('.up-f-title .up-cnt'),
      dField: $('.up-f-desc'), dv: $('.up-dv'), dph: $('.up-ph'), dCnt: $('.up-f-desc .up-cnt'),
      upl: $('.up-upl'), u89: $('.up-89'), scroll: $('.up-scroll'), hPl: $('.up-h-pl'), hTags: $('.up-h-tags'),
      dd: $('.up-dd'), ddv: $('.up-ddv'), rNo: $('.up-r-no'), more: $('.up-more'), mb: $('.up-mb'), adv: $('.up-adv'),
      chips: $$('.up-chip'), gCnt: $('.up-f-tags .up-cnt'),
      panes: $$('.up-pane'), st: $$('.up-st'),
      imp: $('.ve-imp'), add: $('.ve-add'), ve0: $('.ve-s0'), ve1: $('.ve-s1'),
      ckSpin: $('.ck-spin'), ckOk: $('.ck-ok'), ck0: $('.ck-t0'), ck1: $('.ck-t1'),
      vSched: $('.vi-sched'), vRb: $('.vi-sched .up-rb'), vExp: $('.vi-exp'), vIn: $('.vi-in'), vDate: $('.vi-date'), vDv: $('.vi-dv'), vTime: $('.vi-time'), vTv: $('.vi-tv'),
      cal: $('.vi-cal'), p3: $('.up-p3'), d8: $('.cal-d[data-d="8"]'), times: $('.vi-times'), t5: $('.vi-t5'),
      vcUp: $('.vc-up'), vcPct: $('.vc-pct'), vcBar: $('.vc-bar i'), vcPlay: $('.vc-play'), vcHd: $('.vc-hd'),
      stat: $('.up-stat'), i0: $('.up-i0'), i2: $('.up-i2'), back: $('.up-back'), next: $('.up-next'),
      slot: $('.ct-slot'), newRow: $('.ct-new'), wash: $('.ct-new .ct-wash'), snack: $('.st-snack'),
    };
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((wt) => document.fonts.load(`${wt} 14px "Roboto GM"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, slotH = '', expH = '', scr = null;
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
      slotH = ''; expH = ''; scr = null;
    };
    // the two scroll stops of the Details pane: Playlists near the top, then the Tags field in view
    const scrollStops = () => {
      if (scr) return scr;
      const s1 = Math.max(0, n.hPl.offsetTop - 12);
      const s2 = Math.max(s1, n.hTags.offsetTop - 150);
      scr = [s1, s2];
      return scr;
    };

    // ---- the pointer: one target after another, each a live box (or a fixed point for the file pick-up) ----
    const at = (node, fx = 0.5, fy = 0.5) => () => { const b = x.box(node); return b.w ? { x: b.x + b.w * fx, y: b.y + b.h * fy } : null; };
    const fixed = (fx, fy) => () => ({ x: x.root.offsetWidth * fx, y: x.root.offsetHeight * fy });
    const PATH = [
      [w.create, at(n.create, 0.42, 0.55), true],
      [w.upv, at(n.upv, 0.3, 0.55), true],
      [w.grab, fixed(0.13, 0.9), false],
      [w.drop, at(n.circ, 0.55, 0.55), false],
      [w.title, at(n.tField, 0.62, 0.55), true],
      [w.desc, at(n.dField, 0.7, 0.4), true],
      [w.thumb, at(n.upl, 0.5, 0.55), true],
      [w.list, at(n.dd, 0.45, 0.55), true],
      [w.kids, at(n.rNo, 0.06, 0.5), true],
      [w.more, at(n.mb, 0.5, 0.6), true],
      [w.next1, at(n.next, 0.5, 0.55), true],
      [w.imp, at(n.imp, 0.5, 0.55), true],
      [w.next2, at(n.next, 0.5, 0.55), true],
      [w.next3, at(n.next, 0.5, 0.55), true],
      [w.sched, at(n.vRb, 0.5, 0.5), true],
      [w.dateF, at(n.vDate, 0.4, 0.55), true],
      [w.day8, at(n.d8, 0.5, 0.55), true],
      [w.timeF, at(n.vTime, 0.4, 0.55), true],
      [w.t5pm, at(n.t5, 0.35, 0.55), true],
      [w.go, at(n.next, 0.5, 0.55), true],
    ];
    const last = { x: 0, y: 0 };
    const ptr = (t) => {
      if (t < T.full || t > w.close + 0.45) return null;
      let i = PATH.findIndex(([a]) => t < a);
      if (i < 0) i = PATH.length;
      const prev = i > 0 ? PATH[i - 1] : null, next = i < PATH.length ? PATH[i] : null;
      const pp = prev ? prev[1]() : fixed(0.62, 0.58)();
      let pos = pp || last;
      if (next) {
        const np = next[1]() || pos;
        const a0 = prev ? prev[0] : T.full;
        const mv = Math.min(MOVE, next[0] - a0 - 0.08);
        const m = inOutCubic(seg(t, next[0] - mv, next[0] - 0.02));
        pos = { x: lerp(pos.x, np.x, m), y: lerp(pos.y, np.y, m) };
      } else {
        const lv = outCubic(seg(t, w.go + 0.12, w.close + 0.45));
        pos = { x: pos.x + lv * 60, y: pos.y + lv * 50 };
      }
      last.x = pos.x; last.y = pos.y;
      const pr = PATH.reduce((s, [a, , p]) => Math.max(s, p ? press(t, a) : 0), 0);
      const v = seg(t, T.full, T.full + 0.12) * (1 - seg(t, w.close + 0.2, w.close + 0.45));
      return { x: pos.x, y: pos.y, p: pr, v };
    };
    const pressed = (node, t, a) => { const p = press(t, a); node.style.transform = p ? `scale(${(1 - 0.05 * p).toFixed(4)})` : ''; };

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
        const dg = outCubic(seg(t, w.dlg, w.dlg + 0.2)) * (1 - inOutCubic(seg(t, w.close, w.close + 0.22)));
        fade(n.dlg, dg);
        fade(n.scrim, dg);
        n.dlg.style.transform = `translate(-50%, -50%) scale(${lerp(0.96, 1, dg).toFixed(4)})`;
        // the file: picked up bottom left, dragged onto the circle, dropped
        const gv = seg(t, w.grab - 0.06, w.grab + 0.04) * (1 - seg(t, w.drop, w.drop + 0.08));
        fade(n.ghost, gv);
        if (gv > 0) {
          const p = ptr(t);
          if (p) n.ghost.style.transform = `translate(${(p.x / (x.root.offsetWidth / AW) + 14).toFixed(1)}px, ${(p.y / (x.root.offsetHeight / AH) + 10).toFixed(1)}px)`;
        }
        n.drop.classList.toggle('up-over', t >= w.drop - 0.18 && t < w.det);
        const sw = seg(t, w.det - 0.06, w.det + 0.12);
        fade(n.a, 1 - sw);
        fade(n.b, sw);

        // ---- the stages ----
        const stage = t < w.next1 ? 0 : t < w.next2 ? 1 : t < w.next3 ? 2 : 3;
        const sAt = [w.det, w.next1, w.next2, w.next3];
        n.panes.forEach((p, i) => { fade(p, i === stage ? seg(t, sAt[i] + 0.02, sAt[i] + 0.16) : 0); });
        n.st.forEach((s, i) => { s.classList.toggle('on', i === stage); s.classList.toggle('done', i < stage); });
        fade(n.back, stage > 0 ? 1 : 0);
        setText(n.next, t >= w.sched ? 'Schedule' : stage === 3 ? 'Save' : 'Next');
        pressed(n.next, t, [w.next1, w.next2, w.next3, w.go].find((a) => Math.abs(t - a) < 0.25) || -9);

        // Details: the title (Studio prefills the file name; superbot selects it and types the title)
        const nt = Math.round(TITLE.length * seg(t, w.title + 0.06, w.titleEnd));
        const tv = t < w.title + 0.06 ? FILE.base : TITLE.slice(0, nt);
        setText(n.tv, tv);
        setText(n.ttl, tv || FILE.base);
        n.tv.classList.toggle('up-selall', t >= w.title && t < w.title + 0.06);
        n.caret.style.display = t >= w.title && t < w.desc ? '' : 'none';
        setText(n.tCnt, `${tv.length}/100`);
        n.tField.classList.toggle('up-focus', t >= w.title && t < w.desc);
        // the description
        const nd = Math.round(DESC.length * seg(t, w.desc + 0.04, w.descEnd));
        const dtext = DESC.slice(0, nd);
        if (n.dv.dataset.n !== String(nd)) { n.dv.innerHTML = lines(dtext); n.dv.dataset.n = String(nd); }
        n.dph.style.display = nd ? 'none' : '';
        setText(n.dCnt, `${fmt(nd)}/5,000`);
        n.dField.classList.toggle('up-focus', t >= w.desc && t < w.thumb);
        // the thumbnail: the "$89" file goes into the upload slot, selected
        const th = outCubic(seg(t, w.thumb + 0.04, w.thumb + 0.2));
        fade(n.u89, th);
        n.upl.classList.toggle('up-picked', t >= w.thumb + 0.04);
        // scroll to Playlists / Audience, then to Tags
        const [s1, s2] = scrollStops();
        const y = s1 * inOutCubic(seg(t, w.scroll1, w.scroll1End)) + (s2 - s1) * inOutCubic(seg(t, w.scroll2, w.scroll2End));
        n.scroll.style.transform = `translateY(${(-y).toFixed(2)}px)`;
        setText(n.ddv, t >= w.list + 0.06 ? PLAYLIST : 'Select');
        n.dd.classList.toggle('up-set', t >= w.list + 0.06);
        n.rNo.classList.toggle('on', t >= w.kids);
        setText(n.mb, t >= w.more ? 'Show less' : 'Show more');
        fade(n.adv, seg(t, w.more, w.more + 0.18));
        let gc = 0;
        n.chips.forEach((c, i) => {
          const o = outCubic(seg(t, T.tags[i], T.tags[i] + 0.14));
          c.style.opacity = o.toFixed(3);
          c.style.transform = o >= 1 ? 'none' : `scale(${(0.85 + 0.15 * o).toFixed(4)})`;
          if (t >= T.tags[i]) gc += TAGS[i].length + (i ? 1 : 0);
        });
        setText(n.gCnt, `${t >= T.tags[TAGS.length - 1] ? TAG_CHARS : gc}/500`);
        // the upload: 0 to 100% from the drop
        const up = seg(t, w.det, w.upDone);
        const pct = Math.round(up * 100);
        setText(n.vcPct, `${pct}%`);
        n.vcBar.style.transform = `scaleX(${up.toFixed(4)})`;
        fade(n.vcUp, 1 - seg(t, w.upDone + 0.05, w.upDone + 0.25));
        fade(n.vcPlay, seg(t, w.upDone + 0.05, w.upDone + 0.25));
        n.vcHd.classList.toggle('on', t >= w.chk);
        const left = pct < 40 ? '3 minutes left' : pct < 75 ? '2 minutes left' : pct < 96 ? '1 minute left' : 'a few seconds left';
        setText(n.stat, t < w.upDone ? `Uploading ${pct}% ... ${left}` : t < w.chk ? 'Upload complete ... Processing will begin shortly' : 'Checks complete. No issues found.');
        n.i0.classList.toggle('on', t >= w.upDone);
        n.i2.classList.toggle('on', t >= w.chk);

        // Video elements: the end screen imported from the last video
        const im = t >= w.imp + 0.06;
        pressed(n.imp, t, w.imp);
        n.ve0.style.display = im ? 'none' : '';
        n.ve1.style.display = im ? '' : 'none';
        n.imp.style.visibility = im ? 'hidden' : '';
        setText(n.add, im ? 'Edit' : 'Add');
        // Checks: the copyright check resolves
        const cd = outCubic(seg(t, w.chk, w.chk + 0.18));
        fade(n.ckSpin, 1 - seg(t, w.chk - 0.06, w.chk + 0.04));
        n.ckSpin.style.transform = `rotate(${((t - w.next2) * 420).toFixed(1)}deg)`;
        fade(n.ckOk, cd);
        n.ckOk.style.transform = `scale(${lerp(0.4, 1, cd).toFixed(4)})`;
        fade(n.ck0, 1 - cd);
        fade(n.ck1, cd);
        // Visibility: Schedule opens; the date picker; the time list
        n.vSched.classList.toggle('on', t >= w.sched);
        const ex = inOutCubic(seg(t, w.sched + 0.02, w.sched + 0.2));
        const eh = n.vIn.offsetHeight;
        const want = ex >= 1 ? 'auto' : `${(eh * ex).toFixed(2)}px`;
        if (want !== expH) { n.vExp.style.height = want; expH = want; }
        const co = outCubic(seg(t, w.dateF + 0.04, w.dateF + 0.14)) * (1 - seg(t, w.day8 + 0.1, w.day8 + 0.18));
        fade(n.cal, co);
        // the two pop-ups hang under their fields (pane px)
        if (co > 0 || seg(t, w.timeF, w.t5pm + 0.2) > 0) {
          const db = boxIn(n.vDate, n.p3), tb = boxIn(n.vTime, n.p3);
          n.cal.style.left = `${db.x.toFixed(1)}px`; n.cal.style.top = `${(db.y + db.h + 4).toFixed(1)}px`;
          n.times.style.left = `${tb.x.toFixed(1)}px`; n.times.style.top = `${(tb.y + tb.h + 4).toFixed(1)}px`;
        }
        n.d8.classList.toggle('cal-sel', t >= w.day8);
        n.d8.classList.toggle('cal-hov', t >= w.day8 - 0.15);
        setText(n.vDv, t >= w.day8 ? SCHEDULE.date : 'Oct 5, 2026');
        n.vDate.classList.toggle('up-focus', t >= w.dateF && t < w.day8 + 0.18);
        const to = outCubic(seg(t, w.timeF + 0.04, w.timeF + 0.14)) * (1 - seg(t, w.t5pm + 0.1, w.t5pm + 0.18));
        fade(n.times, to);
        n.t5.classList.toggle('vi-hov', t >= w.t5pm - 0.15);
        setText(n.vTv, t >= w.t5pm ? SCHEDULE.time : '7:00 PM');
        n.vTime.classList.toggle('up-focus', t >= w.timeF && t < w.t5pm + 0.18);

        // ---- the Content list: the new row on top, Scheduled; the snackbar ----
        const rw = inOutCubic(seg(t, w.row, w.row + ROW_IN));
        const rh = n.newRow.offsetHeight;
        const sh = rw >= 1 ? 'auto' : `${(rh * rw).toFixed(2)}px`;
        if (sh !== slotH) { n.slot.style.height = sh; slotH = sh; }
        fade(n.newRow, seg(t, w.row + ROW_IN * 0.3, w.row + ROW_IN));
        fade(n.wash, t < w.row ? 0 : 1 - inOutCubic(seg(t, w.row + ROW_IN, w.row + ROW_IN + WASH)));
        const sn = outCubic(seg(t, w.snack, w.snack + SNACK_IN));
        fade(n.snack, sn);
        n.snack.style.transform = sn >= 1 ? 'none' : `translateY(${((1 - sn) * 24).toFixed(2)}px)`;
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
