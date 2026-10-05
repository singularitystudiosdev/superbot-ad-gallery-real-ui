// YouTube Studio, where superbot's connection does the upload as Sam: Channel content behind the upload dialog,
// the Details step filled in (title, description with the chapters, the custom thumbnail), Next through Video elements
// and Checks, Visibility > Schedule set to Thursday at 4 PM, Schedule, Studio's own "Video scheduled" dialog, Close,
// and the new row in Channel content. Built in Studio's CSS px under zoom (studio.css). Studio changes panes and
// previews instantly, so this does too (no crossfades); the camera holds one framing and pushes in once, on the payoff.
import { seg, lerp, op, esc, outCubic, inOutCubic, press, el } from './lib.js';
import { ICON } from './icons.js';
import { FILE, VIDEO, DESCRIPTION, THUMB, SCHEDULE } from './data.js';
import { T, CAM, END, ROW } from './timing.js';

const mi = (n, cls = 'mi') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
const setHTML = (n, s) => { if (n.__h !== s) { n.innerHTML = s; n.__h = s; } };
const show = (n, on) => { n.style.visibility = on ? 'visible' : 'hidden'; };
const FILE_TITLE = FILE.name.replace(/\.mp4$/, '');
const DEFAULT = { date: 'Oct 5, 2026', time: '7:30 PM' };
const STEPS = ['Details', 'Video elements', 'Checks', 'Visibility'];
const STEP_X = [139, 370, 600, 831];

const NAV = [['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content', true], ['analytics-outline', 'Analytics'],
  ['group-outline', 'Community'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Content detection'], ['paid-outline', 'Earn'],
  ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library']];

// Sam's channel: the new upload on top once it is scheduled, the mic video from the source spot under it
const ROWS = [
  { img: THUMB.img, dur: VIDEO.length, title: VIDEO.title, sub: DESCRIPTION[0], vis: ['schedule-outline', 'Scheduled'], date: SCHEDULE.date, state: 'Scheduled', views: '0', comments: '0', likes: '–', fresh: true },
  { img: 'img/old-mics.jpg', dur: '14:32', title: 'I tested 12 budget mics under $100', sub: 'One $49 dynamic mic beat the rest in an untreated room.', vis: ['public', 'Public'], date: 'Oct 1, 2026', state: 'Published', views: '48,213', comments: '1,284', likes: '98.4%' },
  { img: 'img/old-arm.jpg', dur: '11:05', title: 'Cheap boom arms vs a $120 one', sub: 'Six arms, one desk, one winner.', vis: ['public', 'Public'], date: 'Sep 17, 2026', state: 'Published', views: '31,870', comments: '642', likes: '97.9%' },
  { img: 'img/old-webcam.jpg', dur: '13:48', title: 'Cheap vs pro webcam: can you tell?', sub: 'A $25 webcam against a $200 one, blind.', vis: ['public', 'Public'], date: 'Sep 3, 2026', state: 'Published', views: '57,402', comments: '1,103', likes: '98.8%' },
  { img: 'img/old-desk.jpg', dur: '16:21', title: 'My whole streaming desk for $300', sub: 'Every piece, with what I paid for it.', vis: ['public', 'Public'], date: 'Aug 20, 2026', state: 'Published', views: '88,950', comments: '2,317', likes: '99.0%' },
];

function page() {
  const rows = ROWS.map((r) => `<div class="s-tr2" data-k="${r.fresh ? 'row-new' : 'row'}"><span class="s-cb"></span>
    <span class="s-vt"><span class="s-th0"><img src="${r.img}" alt=""><i>${r.dur}</i></span><span><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></span></span>
    <span class="s-vis"><span class="cv">${mi(r.vis[0])}${r.vis[1]}</span></span><span class="s-num">None</span>
    <span class="s-dt"><span class="cv">${r.date}<small>${r.state}</small></span></span><span class="s-num r">${r.views}</span><span class="s-num r">${r.comments}</span><span class="s-num r">${r.likes}</span></div>`).join('');
  return `<header class="s-top">${mi('menu')}<img class="s-logo" src="brand/youtube-studio-logo.svg" alt="">
      <div class="s-search">${mi('search')}<span>Search across your channel</span></div>
      <div class="s-tr">${mi('chat-bubble-outline')}${mi('help-outline')}<span class="s-bell">${mi('notifications-outline')}<i></i></span>
        <span class="s-create">${mi('video-call-outline')}Create</span><span class="s-av">S</span></div></header>
    <nav class="s-nav"><div class="s-av">S</div><div class="s-yc">Your channel</div><div class="s-cn">${VIDEO.channel}</div>
      <div class="s-items">${NAV.map(([ic, l, on]) => `<div class="s-it${on ? ' on' : ''}">${mi(ic)}${l}</div>`).join('')}
      <div class="s-sep"></div><div class="s-it">${mi('settings-outline')}Settings</div><div class="s-it">${mi('feedback-outline')}Send feedback</div></div></nav>
    <main class="s-main"><h1 class="s-h">Channel content</h1>
      <div class="s-tabs">${['Inspiration', 'Videos', 'Shorts', 'Live', 'Posts', 'Playlists', 'Podcasts', 'Promotions'].map((x) => `<span class="${x === 'Videos' ? 'on' : ''}">${x}</span>`).join('')}</div>
      <div class="s-rule"></div><div class="s-filter">${mi('filter-list')}Filter</div>
      <div class="s-table"><div class="s-th"><span class="s-cb"></span><span>Video</span><span>Visibility</span><span>Restrictions</span>
        <span style="display:flex;align-items:center;gap:4px;color:#0f0f0f">Date${mi('arrow-downward', 'mi sm')}</span><span class="r">Views</span><span class="r">Comments</span><span class="r">Likes (vs. dislikes)</span></div>${rows}</div>
    </main><div class="s-scrim" data-k="scrim"></div>`;
}

const elementRow = (icon, title, sub, btns) => `<div class="s-ve">${mi(icon)}<span class="s-vet"><b>${title}</b><small>${sub}</small></span>
  <span class="s-veb">${btns.map((b) => `<span class="s-btn">${b}</span>`).join('')}</span></div>`;

function uploadDialog() {
  const steps = STEPS.map((s, i) => `<span class="s-sl" data-k="sl" style="left:${STEP_X[i]}px">${s}</span>`).join('')
    + `<span class="s-line" style="width:${STEP_X[3] - STEP_X[0]}px"><span class="s-lf" data-k="lf"></span></span>`
    + STEP_X.map((x) => `<span class="s-dot" data-k="dot" style="left:${x}px"><i></i><b></b><u>${mi('check')}</u></span>`).join('');
  const details = `<div class="s-pane" data-k="pane"><div class="s-l">
      <div class="s-ph"><h3 class="s-h">Details</h3><span class="s-reuse">Reuse details</span></div>
      <div class="s-fld s-title" data-k="f-title"><label>Title (required)</label><div class="v" data-k="v-title"></div><span class="cnt" data-k="c-title"></span></div>
      <div class="s-fld s-desc" data-k="f-desc"><label>Description</label><div class="vw" data-k="vw-desc"><div class="v" data-k="v-desc"></div></div><span class="s-dsb" data-k="dsb"><i data-k="dsbt"></i></span></div>
      <div class="s-tl">Thumbnail</div>
      <div class="s-ts">Set a thumbnail that stands out and draws viewers' attention. <a>Learn more</a></div>
      <div class="s-tiles" style="position:relative">
        <div class="s-tile" data-k="t-up">${mi('add-photo-alternate-outline')}Upload file</div><div class="s-tile">${mi('auto-awesome-outline')}Auto-generated</div><div class="s-tile">${mi('analytics-outline')}Test &amp; compare</div>
        <div class="s-tile img" data-k="t-img" style="position:absolute;left:0;top:0"><img src="${THUMB.img}" alt=""><span class="s-ring" data-k="t-ring"></span></div>
      </div>
      <div class="s-tl">Playlists</div>
      <div class="s-ts">Add your video to one or more playlists to organize your content for viewers. <a>Learn more</a></div>
      <div class="s-box s-pl">Select${mi('expand-more')}</div>
      <div class="s-tl">Audience</div>
      <div class="s-aq">Is this video made for kids? (required)</div>
      <div class="s-ts">Regardless of your location, you're legally required to comply with the Children's Online Privacy Protection Act (COPPA) and/or other laws. You're required to tell us whether your videos are made for kids. <a>What's content made for kids?</a></div>
      <div class="s-rad"><i></i>Yes, it's made for kids</div>
      <div class="s-rad" data-k="aud-no"><i></i>No, it's not made for kids</div>
      </div></div>`;
  const elements = `<div class="s-pane" data-k="pane"><div class="s-l">
      <div class="s-ph"><h3 class="s-h">Video elements</h3></div>
      <p class="s-sub" style="margin-top:-4px">Use cards and an end screen to show viewers related videos, websites, and calls to action. <a class="s-a">Learn more</a></p>
      ${elementRow('subtitles-outline', 'Add subtitles', 'Reach a broader audience by adding subtitles to your video', ['Add'])}
      ${elementRow('web-asset', 'Add an end screen', 'Promote related content at the end of your video', ['Import from video', 'Add'])}
      ${elementRow('info-outline', 'Add cards', 'Promote related content during your video', ['Add'])}
    </div></div>`;
  const checks = `<div class="s-pane" data-k="pane"><div class="s-l">
      <div class="s-ph"><h3 class="s-h">Checks</h3></div>
      <p class="s-sub" style="margin-top:-4px">We'll check your video for issues that may restrict its visibility and then you will have the opportunity to fix issues before publishing your video. <a class="s-a">Learn more</a></p>
      <div class="s-ckr"><b>Copyright</b><span>No issues found</span>${mi('check-circle', 'mi s-gk')}</div>
      <p class="s-sub s-note">Remember: These check results aren't final. Issues may come up in the future that impact your video. <a class="s-a">Learn more</a></p>
    </div></div>`;
  const vis = `<div class="s-pane" data-k="pane"><div class="s-l">
      <div class="s-ph"><h3 class="s-h">Visibility</h3></div>
      <p class="s-sub" style="margin-top:-4px">Choose when to publish and who can see your video</p>
      <div class="s-card s-sp"><div class="s-ct">Save or publish</div><div class="s-cs">Make your video <b>public</b>, <b>unlisted</b>, or <b>private</b></div>${mi('expand-more')}</div>
      <div class="s-card s-sc sel"><div class="s-ct">Schedule</div><div class="s-cs">Select a date to make your video <b>public</b>.</div>
        <div class="s-sap">Schedule as public</div>
        <div class="s-row"><div class="s-box s-date" data-k="b-date"><span data-k="v-date">${DEFAULT.date}</span>${mi('expand-more')}</div>
          <div class="s-box s-time" data-k="b-time"><span data-k="v-time">${DEFAULT.time}</span></div><span class="s-tz">Time zone</span>${mi('help-outline', 'mi s-help')}</div>
        <div class="s-priv">Video will be <b>private</b> before publishing</div>
        <div class="s-chk"><i></i>Set as Premiere${mi('help-outline', 'mi s-help')}</div></div>
      <div class="s-bp"><b>Before you publish, check the following:</b><p>Do kids appear in this video?</p></div>
    </div></div>`;
  const right = `<div class="s-r"><div class="s-prev" data-k="prev"><span data-k="prev-l">Uploading video...</span>
      <img data-k="prev-a" src="${FILE.poster}" alt=""><img data-k="prev-b" src="${THUMB.img}" alt="">
      <span class="s-pv" data-k="prev-bar">${mi('play-arrow')}<span>0:00 / ${VIDEO.length}</span></span></div>
    <div class="s-info"><div class="t1" data-k="r-title" style="display:none"></div><div class="s-k">Video link</div><div class="s-lnk"><span data-k="r-link"></span>${mi('content-copy-outline')}</div>
      <div class="s-k">Filename</div><div class="s-fn">${esc(FILE.name)}</div></div></div>`;
  return `<div class="s-dlg s-up" data-k="up">
    <div class="s-hd"><h2 data-k="h-title"></h2><span class="s-chip" data-k="chip">Saving...</span>${mi('feedback-outline')}${mi('close')}</div>
    <div class="s-step">${steps}</div>
    <div class="s-body">${details}${elements}${checks}${vis}${right}</div>
    <div class="s-ft"><span class="s-fi"><span data-k="fi">${mi('upload')}</span><span class="s-sd" data-k="fi"><b data-k="sdhd">SD</b></span><span data-k="fi">${mi('check-circle-outline')}</span></span>
      <span class="s-ftx" data-k="ftx"></span>
      <span class="s-btn s-back" data-k="b-back">Back</span><span class="s-nextw"><span class="s-btn pri" data-k="b-next">Next</span></span></div>
  </div>`;
}

const doneDialog = () => `<div class="s-dlg s-done" data-k="done">
    <div class="dh"><h2>Video scheduled</h2>${mi('close')}</div>
    <p class="dp">Your video will be set to <b>public</b> on <b>${SCHEDULE.long}</b></p>
    <div class="s-gc"><span class="s-th0"><img src="${THUMB.img}" alt=""><i>${VIDEO.length}</i></span><span><b>${esc(VIDEO.title)}</b><small>${SCHEDULE.uploaded}</small></span></div>
    <div class="s-gl"><div class="s-k">Video link</div><div class="s-lnk s-a">${VIDEO.link}</div>${mi('content-copy-outline')}</div>
    <div class="s-dft"><span class="s-btn" data-k="b-close">Close</span></div>
  </div>`;

// Oct 2026 starts on a Thursday; days before today (Mon Oct 5) are disabled, today is outlined
function datePopover() {
  const cells = ['', '', '', '', ...Array.from({ length: 31 }, (_, i) => i + 1)];
  return `<div class="s-pop s-cal" data-k="cal"><div class="s-calh"><b>October 2026</b>${mi('expand-more', 'mi s-cl')}${mi('expand-more', 'mi s-cr')}</div>
    <div class="s-calg">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<i class="wd">${d}</i>`).join('')}
    ${cells.map((d) => `<i class="${!d ? 'nil' : d < 5 ? 'off' : d === 5 ? 'today' : ''}" ${d === SCHEDULE.day ? 'data-k="cal-pick"' : ''}>${d}</i>`).join('')}</div></div>`;
}
const TIMES = Array.from({ length: 18 }, (_, i) => { const m = 915 + 15 * i; return `${Math.floor(m / 60) - 12}:${String(m % 60).padStart(2, "0")} PM`; });   // 3:15 PM to 7:30 PM
const timeList = () => `<div class="s-pop s-tl2" data-k="tlist"><div class="tl-in" data-k="tlin">${TIMES.map((x) => `<i ${x === SCHEDULE.time ? 'data-k="t-pick"' : x === DEFAULT.time ? 'data-k="t-cur"' : ''}>${x}</i>`).join('')}</div></div>`;

export function mountStudio(root) {
  const sec = el(`<section id="studio" class="scene"><div class="s-cam" data-k="cam"><div class="s-page">${page()}${uploadDialog()}${doneDialog()}${datePopover()}${timeList()}</div></div>
    <i class="s-ringx" data-k="ring0"></i><i class="s-ringx" data-k="ring1"></i>
    <div class="sb-chip" data-k="sbchip"><span class="sb-cat"><img src="brand/mark-clean.svg" alt=""></span><span class="sb-t" data-k="sbt">superbot is uploading in YouTube Studio</span><span class="sb-s"><i class="spin"></i><svg class="ok" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span></div>
    <svg class="cursor" data-k="sptr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z"/></svg></section>`);
  root.appendChild(sec);
  const q = (k) => sec.querySelector(`[data-k="${k}"]`);
  const qa = (k) => [...sec.querySelectorAll(`[data-k="${k}"]`)];
  return {
    sec, cam: q('cam'), up: q('up'), done: q('done'), scrim: q('scrim'), rowNew: q('row-new'), visNew: sec.querySelector('[data-k="row-new"] .s-vis'),
    hTitle: q('h-title'), chip: q('chip'), sl: qa('sl'), lf: q('lf'), dots: qa('dot'), panes: qa('pane'),
    fTitle: q('f-title'), vTitle: q('v-title'), cTitle: q('c-title'), fDesc: q('f-desc'), vDesc: q('v-desc'), vwDesc: q('vw-desc'),
    tImg: q('t-img'), tRing: q('t-ring'), tUp: q('t-up'), dsb: q('dsb'), dsbt: q('dsbt'),
    prevL: q('prev-l'), prevA: q('prev-a'), prevB: q('prev-b'), prevBar: q('prev-bar'), rTitle: q('r-title'), rLink: q('r-link'),
    fi: qa('fi'), sdhd: q('sdhd'), ftx: q('ftx'), bBack: q('b-back'), bNext: q('b-next'), bClose: q('b-close'),
    bDate: q('b-date'), vDate: q('v-date'), bTime: q('b-time'), vTime: q('v-time'),
    cal: q('cal'), calPick: q('cal-pick'), tlist: q('tlist'), tPick: q('t-pick'),
    bg: [...sec.querySelectorAll('.s-top, .s-nav, .s-main')], ptr: q('sptr'), tCur: q('t-cur'), sbchip: q('sbchip'), sbt: q('sbt'), ring0: q('ring0'), ring1: q('ring1'), audNo: q('aud-no'), sl0: sec.querySelector('[data-k="pane"] .s-l'), sr: sec.querySelector('.s-r'),
    cellVis: sec.querySelector('[data-k="row-new"] .s-vis .cv'), cellDate: sec.querySelector('[data-k="row-new"] .s-dt .cv'), tlin: sec.querySelector('[data-k="tlin"]'), pane0: sec.querySelector('[data-k="pane"]'), body: sec.querySelector('.s-body'),
  };
}

function camKey(t) {
  if (t >= T.push[0]) {   // the payoff: from the whole page into the new row
    const k = inOutCubic(seg(t, T.push[0], T.push[1]));
    return [lerp(END[0], ROW[0], k), lerp(END[1], ROW[1], k), lerp(END[2], ROW[2], k)];
  }
  if (t >= T.pull[0]) {   // out to the whole page: the new row glides while the scale eases (no clamp jumps)
    const k = inOutCubic(seg(t, T.pull[0], T.pull[1])), [ax, ay] = [900, 344], B = CAM[CAM.length - 1], E = END;
    const s = lerp(B[3], E[2], k);
    const sx = lerp((ax - B[1]) * B[3], (ax - E[0]) * E[2], k), sy = lerp((ay - B[2]) * B[3], (ay - E[1]) * E[2], k);
    return [ax - sx / s, ay - sy / s, s];
  }
  let k = CAM[0];
  for (let i = 1; i < CAM.length; i++) {
    const a = CAM[i - 1], b = CAM[i];
    if (t < a[0]) break;
    if (b[4] === 'cut') { k = t >= b[0] ? b : a; continue; }   // an edit: hold, then jump on the Studio action
    const f = inOutCubic(seg(t, a[0], b[0]));
    k = [t, lerp(a[1], b[1], f), lerp(a[2], b[2], f), lerp(a[3], b[3], f)];
  }
  // keep the frame inside the page: the focus point is clamped so no edge ever shows
  const s = k[3], fx = Math.min(1920 - 960 / s, Math.max(960 / s, k[1])), fy = Math.min(1080 - 540 / s, Math.max(540 / s, k[2]));
  return [fx, fy, s];
}
function camAt(t) {
  const [fx, fy, s] = camKey(t);
  return `translate(${(960 - fx * s).toFixed(2)}px, ${(540 - fy * s).toFixed(2)}px) scale(${s.toFixed(5)})`;
}

const LIST_TOP = 32 * 12;   // the time list's scroll when it opens on 7:30 PM (13th of 18 rows, 6 visible)
// the pointer's script: [arrival time, target, click time or null]; it travels (eased) from the previous target
const PATH = [
  [T.title[0] - 0.15, 'title', T.title[0] - 0.1],
  [T.title[0] + 0.25, 'park1', null],
  [T.desc[0] - 0.15, 'desc', T.desc[0] - 0.1],
  [T.desc[0] + 0.3, 'park2', null],
  [T.thumbIn - 0.1, 'tile', T.thumbIn - 0.05],
  [T.audNo - 0.1, 'audNo', T.audNo],
  [T.nexts[0] - 0.05, 'next', T.nexts[0]],
  [T.nexts[1] - 0.05, 'next', T.nexts[1]],
  [T.nexts[2] - 0.05, 'next', T.nexts[2]],
  [T.datePop[0] - 0.05, 'date', T.datePop[0]],
  [T.datePop[2] - 0.1, 'day', T.datePop[2] - 0.05],
  [T.timePop[0] - 0.05, 'time', T.timePop[0]],
  [T.timePop[1] + 0.08, 'four', T.timePop[2] - 0.02],
  [T.schedule - 0.05, 'next', T.schedule],
  [T.doneClose - 0.05, 'close', T.doneClose],
];

/** every pointer target's centre in page-frame px (the page at zoom, before the camera), measured once */
function measureTargets(n) {
  const keep = [n.sec.style.transform, n.cam.style.transform, n.sl0.style.transform, n.sr.style.transform, n.up.style.display];
  n.sec.style.transform = n.cam.style.transform = n.sl0.style.transform = n.sr.style.transform = 'none';
  n.up.style.display = '';
  const chatCam = document.querySelector('#chat [data-k="cam"]'), chatKeep = chatCam.style.transform; chatCam.style.transform = 'none';
  const descKeep = n.vDesc.innerHTML; n.vDesc.innerHTML = DESCRIPTION.map(esc).join('\n'); n.vDesc.__h = null;
  n.tlin.style.transform = 'none';
  const at = (el, fx = 0.5, fy = 0.5) => { const r = el.getBoundingClientRect(); return [r.left + r.width * fx, r.top + r.height * fy]; };
  const q = (k) => n.sec.querySelector(`[data-k="${k}"]`);
  const z = 4 / 3;
  // how far the Details pane scrolls (CSS px): the tiles clear the footer, then the audience radios do
  const body = n.body.getBoundingClientRect(), bot = (el) => el.getBoundingClientRect().bottom;
  n.scr = { tiles: Math.max(0, (bot(q('t-up')) - body.bottom + 14) / z), aud: Math.max(0, (bot(n.audNo) - body.bottom + 18) / z) };
  const aud = at(n.audNo.querySelector('i')), tile = at(q('t-up'));
  n.tg = {
    title: at(n.fTitle, 0.3, 0.55), desc: at(n.fDesc, 0.35, 0.3), park1: at(n.fTitle, 1.08, 0.7), park2: at(n.fDesc, 1.08, 0.5), tile: [tile[0], tile[1] - n.scr.tiles * z], rest: [tile[0] + 420, tile[1] - n.scr.tiles * z + 60],
    audNo: [aud[0], aud[1] - n.scr.aud * z], next: at(n.bNext), date: at(n.bDate, 0.4), day: at(n.calPick), time: at(n.bTime, 0.4),
    four: at(n.tPick, 0.3), close: at(n.bClose),
  };
  [n.sec.style.transform, n.cam.style.transform, n.sl0.style.transform, n.sr.style.transform, n.up.style.display] = keep;
  chatCam.style.transform = chatKeep;
  n.vDesc.innerHTML = descKeep; n.vDesc.__h = null;
  // the anchor the closing pull-out keeps gliding: the new upload's row
  n.anchor = [900, 430];
}

function renderPointer(n, t) {
  if (!n.tg) measureTargets(n);
  let from = [1500, 900], to = from, a = T.ptrIn - 0.3, b = T.ptrIn, click = null;
  for (let i = 0; i < PATH.length; i++) {
    const [arr, key, ck] = PATH[i];
    const prevArr = i ? PATH[i - 1][0] : T.ptrIn - 0.3;
    if (t >= prevArr) { from = i ? n.tg[PATH[i - 1][1]] : [1500, 900]; to = n.tg[key]; a = i ? Math.max(prevArr, (PATH[i - 1][2] ?? prevArr) + 0.05) : prevArr; b = arr; click = ck; }
  }
  const k = inOutCubic(seg(t, a, b));
  const px = lerp(from[0], to[0], k), py = lerp(from[1], to[1], k);
  // page-frame px to frame px through the camera
  const [fx, fy, s] = camKey(t);
  const x = (px - fx) * s + 960, y = (py - fy) * s + 540;
  const pr = Math.max(...PATH.map((p) => (p[2] == null ? 0 : press(t, p[2], 0.06, 0.06, 0.12))));
  const v = outCubic(seg(t, T.ptrIn - 0.3, T.ptrIn)) * (1 - seg(t, T.doneClose + 0.08, T.doneClose + 0.2));
  n.ptr.style.opacity = v.toFixed(3);
  n.ptr.style.transform = `translate(${(x - 17).toFixed(1)}px, ${(y - 11).toFixed(1)}px) scale(${(1 - 0.12 * pr).toFixed(3)})`;
}

/** which step the dialog is on: 0 Details, 1 Video elements, 2 Checks, 3 Visibility (each Next switches instantly) */
const stepAt = (t) => T.panes.filter((x) => t >= x).length;

function renderDetails(n, t) {
  // the title: Studio pre-fills the filename, superbot replaces it
  const tk = seg(t, T.title[0], T.title[1]);
  const typed = tk > 0 ? VIDEO.title : FILE_TITLE;   // pasted whole (Claude already wrote it)
  const caretT = t >= T.title[0] && t < T.title[1] + 0.15, selT = t >= T.title[0] - 0.12 && t < T.title[0];
  setHTML(n.vTitle, selT ? `<span class="selx">${esc(FILE_TITLE)}</span>` : `${esc(typed)}${caretT ? '<i class="s-caret"></i>' : ''}`);
  n.vTitle.style.opacity = tk > 0 ? outCubic(seg(t, T.title[0], T.title[0] + 0.12)).toFixed(3) : '1';
  setText(n.cTitle, `${typed.length}/100`);
  setText(n.hTitle, tk > 0 ? typed || FILE_TITLE : FILE_TITLE);
  setText(n.rTitle, tk >= 1 ? VIDEO.title : '');
  n.fTitle.classList.toggle('focus', t >= T.title[0] - 0.12 && t < T.desc[0] - 0.1);
  // the description goes in line by line (Claude's text, chapters included), as plain text the way the field shows it
  const lines = t >= T.desc[0] ? DESCRIPTION.length : 0;   // pasted whole
  setHTML(n.vDesc, lines > 0
    ? DESCRIPTION.slice(0, lines).map(esc).join('\n') + (t < T.desc[1] + 0.15 ? '<i class="s-caret"></i>' : '')
    : '<span class="ph2">Tell viewers about your video (type @ to mention a channel)</span>');
  n.fDesc.classList.toggle('focus', t >= T.desc[0] - 0.1 && t < T.desc[1] + 0.3);
  n.vDesc.style.opacity = lines > 0 ? outCubic(seg(t, T.desc[0], T.desc[0] + 0.14)).toFixed(3) : '1';

  setText(n.chip, t >= T.title[0] && t < T.desc[1] + 0.4 ? 'Saving...' : 'Saved as private');
  // the custom thumbnail lands in the Upload file slot and is selected
  const ti = outCubic(seg(t, T.thumbIn, T.thumbIn + 0.3));
  op(n.tImg, ti);
  n.tImg.style.transform = ti >= 1 ? 'none' : `scale(${lerp(0.9, 1, ti).toFixed(4)})`;
  n.tUp.style.visibility = t >= T.thumbIn ? 'hidden' : 'visible';
  op(n.tRing, outCubic(seg(t, T.thumbSel, T.thumbSel + 0.18)));
  // the preview swaps instantly, as Studio's does: uploading, the processed first frame, then the custom thumbnail
  show(n.prevL, t < T.processed);
  show(n.prevA, t >= T.processed);   // the preview plays the video itself; the custom thumbnail lives in its tile
  show(n.prevB, false);
  show(n.prevBar, t >= T.processed);
  [n.prevA, n.prevB, n.prevBar].forEach((x) => { x.style.opacity = '1'; });
  setText(n.rLink, t >= T.title[0] ? VIDEO.link : 'Creating link...');
  n.rLink.classList.toggle('s-a', t >= T.title[0]);
}

function renderFooter(n, t, step) {
  const pct = Math.round(lerp(84, 100, seg(t, T.grow[0], T.upDone)));
  const txt = t < T.upDone ? `Uploading ${pct}% ... 1 minute left`
    : t < T.processed + 0.5 ? 'Upload complete ... Processing will begin shortly'
      : t < T.panes[1] ? 'Processing up to HD ... 1 minute left'
        : 'Checks complete. No issues found.';
  setText(n.ftx, txt);
  n.fi[0].classList.toggle('on', t >= T.upDone);
  n.fi[1].classList.toggle('on', t >= T.processed + 0.5);
  setText(n.sdhd, 'SD');
  n.fi[2].classList.toggle('on', t >= T.panes[1]);
  // Back appears from the second step on; the primary button reads Schedule once Schedule is the chosen visibility
  show(n.bBack, step >= 1);
  setText(n.bNext, step >= 3 ? 'Schedule' : 'Next');
  const pr = Math.max(...T.nexts.map((x) => press(t, x, 0.07, 0.08, 0.14)), press(t, T.schedule, 0.07, 0.08, 0.14));
  n.bNext.classList.toggle('hit', pr > 0.3);
  n.bNext.style.transform = `scale(${(1 - 0.08 * pr).toFixed(4)})`;
}

function renderStepper(n, t, step) {
  // each step passed completes with a filled check (the upload has finished and checks found no issues);
  // the current step is the ringed dot
  n.lf.style.transform = `scaleX(${[0, 231 / 692, 461 / 692, 1][step].toFixed(4)})`;
  const state = [
    step === 0 ? 'cur' : 'done',
    step === 0 ? 'todo' : step === 1 ? 'cur' : 'done',
    step < 2 ? 'todo' : step === 2 ? 'cur' : 'done',
    step < 3 ? 'todo' : 'cur',
  ];
  n.dots.forEach((d, i) => {
    const [ring, cur, done] = d.children;
    op(ring, state[i] === 'todo' || state[i] === 'seen' ? 1 : 0);
    ring.style.borderColor = state[i] === 'seen' ? '#0f0f0f' : '#909090';
    op(cur, state[i] === 'cur' ? 1 : 0);
    op(done, state[i] === 'done' ? 1 : 0);
    n.sl[i].classList.toggle('on', state[i] !== 'todo' && state[i] !== 'seen');
  });
}

function renderVisibility(n, t) {
  // the date picker opens, Thu 8 is picked, it closes; then the time list opens on 4:00 PM
  const [d0, d1, d2] = T.datePop, [m0, m1, m2] = T.timePop;
  const pop = (node, a, b) => {
    const vis = t >= a && t < b + 0.08, k = outCubic(seg(t, a, a + 0.12));
    show(node, vis);
    op(node, 1);   // opaque from the first frame: no ghost of the card under it
    node.style.transform = `scale(${lerp(0.96, 1, k).toFixed(4)})`;
  };
  pop(n.cal, d0, d2);
  pop(n.tlist, m0, m2);
  n.calPick.classList.toggle('pick', t >= d1);
  // the list opens scrolled to the current value, highlighted, then scrolls up to 4:00 PM
  const ls = inOutCubic(seg(t, m0 + 0.1, m1));
  n.tlin.style.transform = `translateY(${(-LIST_TOP * (1 - ls)).toFixed(2)}px)`;
  n.tCur.classList.toggle('pick', t >= m0 && t < m1);
  n.tPick.classList.toggle('pick', t >= m1);
  setText(n.vDate, t >= d2 ? SCHEDULE.date : DEFAULT.date);
  setText(n.vTime, t >= m2 ? SCHEDULE.time : DEFAULT.time);
  n.bDate.classList.toggle('focus', t >= d0 && t < d2 + 0.1);
  n.bTime.classList.toggle('focus', t >= m0 && t < m2 + 0.25);
}

export function renderStudio(n, t) {
  const on = t >= T.shotIn && t < T.endIn + 0.4;
  n.sec.style.visibility = on ? 'visible' : 'hidden';
  if (!on) return;
  // the bridge: Studio grows out of the YouTube icon on the checklist's "Started the upload in YouTube Studio" row to
  // the full frame (opaque the whole way, so white never passes through grey); the end card dissolves in over it
  if (!n.origin || t < T.grow[0]) {
    const cc = document.querySelector('#chat [data-k="cam"]'), ck = cc.style.transform; cc.style.transform = 'none';
    const r = document.querySelector('[data-k="pshot"]').getBoundingClientRect();
    cc.style.transform = ck;
    n.origin = { x: r.left + r.width / 2, y: r.top + r.height / 2, s: r.width / 1920 };
  }
  const gk = inOutCubic(seg(t, T.grow[0], T.grow[1]));
  const sc = lerp(n.origin.s, 1, gk), cx = lerp(n.origin.x, 960, gk), cy = lerp(n.origin.y, 540, gk);
  n.sec.style.transform = sc >= 1 ? 'none' : `translate(${(cx - 960).toFixed(2)}px, ${(cy - 540).toFixed(2)}px) scale(${sc.toFixed(5)})`;
  n.sec.style.borderRadius = sc >= 1 ? '0' : `${(10 / sc).toFixed(2)}px`;
  n.sec.style.boxShadow = sc >= 1 ? 'none' : `0 0 0 ${(2 / sc).toFixed(2)}px #e3e3e3`;
  // the live shot appears in the white card (white on white, so a short fade never greys)
  n.sec.style.opacity = outCubic(seg(t, T.shotIn, T.shotIn + 0.2)).toFixed(3);
  n.cam.style.transform = camAt(t);
  const step = stepAt(t);
  n.panes.forEach((p, i) => show(p, i === step));
  // Schedule closes the upload dialog, then "Video scheduled" rises over the settled list
  // (the upload dialog goes at once, as Studio's does: a fade would ghost its form over the list)
  n.up.style.display = t < T.close ? '' : 'none';
  const blur = t < T.doneClose + 0.06 ? 'blur(3px)' : 'none';
  n.bg.forEach((x) => { x.style.filter = blur; });   // display, not visibility: its panes set their own visibility
  // "Video scheduled": a 180 ms scale-in from 0.96 (Studio's dialog entrance), a 120 ms fade out on Close
  const din = outCubic(seg(t, T.doneIn[0], T.doneIn[1])), dout = seg(t, T.doneOut[0], T.doneOut[1]);
  n.done.style.opacity = (din * (1 - dout)).toFixed(3);
  n.done.style.transform = din >= 1 ? 'none' : `scale(${lerp(0.96, 1, din).toFixed(4)})`;
  show(n.done, t >= T.doneIn[0] && t < T.doneClose + 0.06);
  n.bClose.style.transform = `scale(${(1 - 0.08 * press(t, T.doneClose, 0.07, 0.08, 0.14)).toFixed(4)})`;
  // the page dims under a dialog and clears with the last one
  op(n.scrim, t >= T.doneClose + 0.06 ? 0 : 1);
  // the new upload's row is in the list from the moment it is scheduled; once the list is clear it takes the
  // hover state, the way it looks under the pointer
  n.rowNew.style.height = t >= T.close ? '85px' : '0px';
  n.rowNew.style.backgroundColor = `rgba(0,0,0,${(0.05 * outCubic(seg(t, T.rowHi[0], T.rowHi[1]))).toFixed(4)})`;

  // the Details pane scrolls down to Audience (both columns, as Studio's dialog body scrolls) and back on the next step
  if (!n.tg) measureTargets(n);
  const sc2 = step === 0 ? -lerp(n.scr.tiles * inOutCubic(seg(t, T.tilesScroll[0], T.tilesScroll[1])), n.scr.aud, inOutCubic(seg(t, T.aud[0], T.aud[1]))) : 0;
  n.sl0.style.transform = n.sr.style.transform = sc2 ? `translateY(${sc2.toFixed(2)}px)` : 'none';
  n.audNo.classList.toggle('on', t >= T.audNo);
  renderPointer(n, t);
  // superbot's status chip: it is superbot's pointer; once Schedule lands it reports the result
  const win = (a, b) => outCubic(seg(t, a, a + 0.25)) * (1 - outCubic(seg(t, b - 0.2, b)));
  const ck = Math.max(win(T.chipIn, T.camMid), win(T.pull[1], T.endIn));
  n.sbchip.style.opacity = ck.toFixed(3);
  n.sbchip.style.transform = `translateY(${((1 - ck) * 16).toFixed(2)}px)`;
  const doneS = t >= T.schedule;
  n.sbchip.classList.toggle('done', doneS);
  setText(n.sbt, doneS ? 'Scheduled · Thu Oct 8, 4:00 PM' : 'superbot is filling in the upload details');
  const sp = n.sbchip.querySelector('.spin');
  sp.style.transform = `rotate(${(t * 380 % 360).toFixed(1)}deg)`;
  renderDetails(n, t);
  renderFooter(n, t, step);
  renderStepper(n, t, step);
  renderVisibility(n, t);
  renderRings(n, t);
}

/** the payoff: rings around the new row's Scheduled cell and its date (an overlay; Studio's cells stay as they are) */
function renderRings(n, t) {
  const rk = outCubic(seg(t, T.rowHi[0], T.rowHi[1]));
  [[n.cellVis, n.ring0], [n.cellDate, n.ring1]].forEach(([c, ring]) => {
    c.style.transform = 'none';
    const r = c.getBoundingClientRect(), pad = 12;
    ring.style.left = `${(r.left - pad).toFixed(1)}px`; ring.style.top = `${(r.top - pad).toFixed(1)}px`;
    ring.style.width = `${(r.width + 2 * pad).toFixed(1)}px`; ring.style.height = `${(r.height + 2 * pad).toFixed(1)}px`;
    ring.style.opacity = rk.toFixed(3);
    ring.style.transform = `scale(${lerp(1.25, 1, rk).toFixed(4)})`;
  });
}
