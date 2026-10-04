// ux.js: YouTube's own current screens, rebuilt as layered HTML/CSS for niche-ytx3-model-switch-superbot-7fa164fd.
//
// Pure builders: data in, one DOM element out. No clocks, no timers, no listeners beyond an image's own error
// fallback. Every element the build animates carries a data-ux="..." hook (listed in HOOKS below); every moving value
// is the build's to write. Styles live in ux.css, all scoped under .ytx (light theme by default, the original ad's
// Studio theme; add the class ytx-dark on the root, or pass { theme: 'dark' }, for YouTube's dark theme).
//
// Exports
//   DATA                                  the default content (one channel, its new upload, 6 earlier uploads, the test)
//   studioContent(data, opts)             YouTube Studio > Content > Videos, the new upload's row on top
//   thumbSection(data, opts)              Studio video details > Thumbnail, with its menu (Change ... A/B Testing)
//   testCompare(data, opts)               Studio's A/B Test report dialog: 3 thumbnails, running or result state
//   watchPage(data, opts)                 the desktop watch page: masthead, player, metadata, description, Up next
//   overlay(base, dialog)                 a component with a dialog over it (Studio's scrim, the dialog centred)
//   windowFrame(content, opts)            a plain desktop browser window around any of the above (never full-bleed)
//   HOOKS                                 every data-ux hook, with what it is
//
// Measured from the sources in CREDITS.txt (the live watch page at 1920 x 1080 and 1536 x 864 on 2026-10-03, the
// vidIQ A/B Test report screenshots of July 2026, the Studio Content tab after the June 2026 redesign).
import { MS } from './icons.js';

// asset URLs resolve against this module, so the builders work from any page (preview.html here, the ad's index.html)
const UX = new URL('./', import.meta.url).href;
const IMG = new URL('../img/', import.meta.url).href;

// ---------------------------------------------------------------- default content
export const DATA = {
  img: IMG,                           // where the rasters live (AD/img/, the image worker's); a missing file shows the gray fill
  channel: {
    name: 'Sam Rivera',               // the original ad's creator (scenes/tabs-assets/beats/studio.js ACCOUNT)
    initial: 'S',
    color: '#1e8e3e',                 // the original's --yt-me letter-avatar green
    avatar: 'avatar.jpg',             // AD/img/avatar.jpg when it lands; the letter avatar sits under it until then
    subscribers: '214K subscribers',
    verified: true,
  },
  viewer: { initial: 'J', color: '#7b1fa2' }, // the signed-in viewer on the watch page (letter avatar only)
  video: {
    id: 'q8Tz3LkV0pE',
    title: 'I Rebuilt My Desk Setup for $89 (It Beat My $1,200 One)',
    length: '16:42',
    description: 'Every piece on this desk came in under $89 total: a $19 monitor riser, the $25 boom arm from my last video, a $14 light bar and $31 of cable trays. Then I put it head to head with my $1,200 setup.',
    date: 'Oct 3, 2026',
    status: 'Published',
    visibility: 'Public',
    views: '18,406',
    viewsLong: '18,406 views',
    comments: '412',
    likes: '2.4K',
    revenue: '$41.20',
    thumb: 'thumb-b.jpg',             // the winning thumbnail (the image worker's recommended winner, img/models.json)
    frame: 'frame-1.jpg',             // a frame of the video, the player's poster until the build draws frames
    tags: '#desksetup #budgetsetup #homeoffice',
    descLines: [
      'Every piece on this desk came in under $89 total, and in a blind side-by-side it beat the $1,200 setup I used for three years.',
      '',
      '0:00 The $89 desk vs the $1,200 one',
      '1:48 Monitor riser ($19)',
      '4:05 Boom arm ($25) and mic placement',
      '7:30 Light bar ($14) vs a $180 key light',
    ],
  },
  // the channel's earlier uploads, newest first (desk and audio, the original ad's channel)
  videos: [
    { title: 'I tested 12 budget mics under $100', length: '14:32', date: 'Sep 19, 2026', views: '412,806', comments: '1,284', revenue: '$1,912.40', thumb: `${UX}mic-frame.jpg`,
      description: 'Twelve USB and XLR mics, one untreated room, one blind test. The $29 pick surprised me.' },
    { title: 'The $25 Boom Arm That Fixed My Neck Pain', length: '9:48', date: 'Sep 5, 2026', views: '186,240', comments: '612', revenue: '$802.15', thumb: `${UX}ux-boomarm.jpg`,
      description: 'Low-profile arm, mic mounted underneath, eye line back where it should be. Full install in one take.' },
    { title: 'Cable Management Under $40: Before and After', length: '11:15', date: 'Aug 22, 2026', views: '254,117', comments: '731', revenue: '$1,104.62', thumb: `${UX}ux-cables.jpg`,
      description: 'Two trays, a pack of velcro ties and one power strip under the desk. Every cable gone in an afternoon.' },
    { title: 'Do You Actually Need an Audio Interface?', length: '13:06', date: 'Aug 8, 2026', views: '301,559', comments: '1,047', revenue: '$1,388.03', thumb: `${UX}ux-interface.jpg`,
      description: 'USB mic vs a $99 interface and an XLR mic, recorded side by side in the same room.' },
    { title: '5 Desk Lamps Tested for Video Calls', length: '10:21', date: 'Jul 25, 2026', views: '142,903', comments: '388', revenue: '$611.77', thumb: `${UX}ux-lamp.jpg`,
      description: 'Clip-on, monitor bar, ring light, panel and a $12 lamp from the hardware store. One clear winner on camera.' },
    { title: 'Foam vs. Felt: Fixing My Echoey Room for $60', length: '12:54', date: 'Jul 11, 2026', views: '389,442', comments: '1,516', revenue: '$1,736.90', thumb: `${UX}ux-panels.jpg`,
      description: 'Measured the room before and after. Six felt panels did more than forty foam squares.' },
  ],
  // Studio's A/B test (the control is labelled "A/B Testing" in Studio since 2026; earlier name Test & compare)
  test: {
    mode: 'Thumbnail only',
    report: 'A/B Test report',
    thumbs: ['thumb-a.jpg', 'thumb-b.jpg', 'thumb-c.jpg'],
    shares: ['27.1%', '44.6%', '28.3%'],   // watch time share per thumbnail (sums to 100)
    winner: 1,                             // index into thumbs (thumb-b, the image worker's recommended winner)
    headingRunning: 'Test in progress',
    headingResult: 'We have a winner!',
    started: 'Oct 3, 2026 at 9:14 AM',
    ended: 'Oct 6, 2026 at 6:02 PM',
    chip: { running: 'A/B test running', done: 'A/B test finished' },
  },
  watch: {
    current: '4:18',          // the player's time display
    progress: 0.2575,         // played fraction (4:18 of 16:42)
    buffered: 0.41,           // buffered fraction
    chapters: [108, 245, 450, 702, 860], // chapter starts in seconds (the progress bar's gaps)
    upNext: [
      { title: 'I tested 12 budget mics under $100', channel: 'Sam Rivera', verified: true, views: '412K', date: 'Sep 19, 2026', length: '14:32', thumb: `${UX}mic-frame.jpg` },
      { title: 'The $25 Boom Arm That Fixed My Neck Pain', channel: 'Sam Rivera', verified: true, views: '186K', date: 'Sep 5, 2026', length: '9:48', thumb: `${UX}ux-boomarm.jpg` },
      { title: 'Small Desk, Big Setup: 7 Space Savers That Work', channel: 'Nora Lindqvist', verified: false, views: '96K', date: 'Sep 28, 2026', length: '12:07', thumb: `${UX}ux-smalldesk.jpg` },
      { title: 'Foam vs. Felt: Fixing My Echoey Room for $60', channel: 'Sam Rivera', verified: true, views: '389K', date: 'Jul 11, 2026', length: '12:54', thumb: `${UX}ux-panels.jpg` },
      { title: 'The Only 3 Cables You Need Under Your Desk', channel: 'Desk Theory', verified: true, views: '1.1M', date: 'Aug 30, 2026', length: '8:41', thumb: `${UX}ux-undercables.jpg` },
    ],
  },
};

// every hook the builders write, for the build worker
export const HOOKS = {
  // studioContent
  'studio': 'the Studio client root',
  'studio-table': 'the videos table (header row + rows)',
  'row-new': 'the new upload\'s row (first row)',
  'row-thumb-slot': 'the new row\'s 120 x 68 thumbnail slot (the winner flies in here); gray fill under the image',
  'row-thumb-img': 'the <img> inside row-thumb-slot (hidden with opts.emptySlot)',
  'row-title': 'the new row\'s title',
  'ab-chip': 'the A/B test status chip in the new row (data-state="running" | "done")',
  'ab-chip-label': 'the chip\'s text span',
  'row-views': 'the new row\'s Views cell',
  'row-comments': 'the new row\'s Comments cell',
  'row': 'each earlier row (data-i = index into data.videos)',
  // thumbSection
  'thumb-section': 'the details page Thumbnail block',
  'thumb-current': 'the current thumbnail tile (its <img> is data-ux="thumb-current-img")',
  'thumb-menu': 'the thumbnail menu (Change, Download, Select from video, A/B Testing)',
  'menu-ab': 'the A/B Testing menu item',
  // testCompare
  'abtest': 'the A/B Test report dialog root (data-state="running" | "result")',
  'ab-heading': 'the dialog heading (Test in progress / We have a winner!)',
  'ab-progress': 'running state: the progress track; its child data-ux="ab-progress-fill" is the fill (width %)',
  'ab-card': 'each option card (data-i 0..2)',
  'ab-slot': 'each card\'s thumbnail slot (data-i 0..2), gray fill under the image',
  'ab-img': 'each slot\'s <img> (data-i 0..2)',
  'ab-share': 'each card\'s watch time share number (data-i 0..2)',
  'ab-winner': 'the Winner chip on the winning card',
  'ab-visible': '"Now visible to all viewers" on the winning card',
  'ab-foot': 'the footer line (started / ran from ... to ...)',
  // watchPage
  'watch': 'the watch page root',
  'player': 'the player box (16:9, black, rounded 12px)',
  'player-media': 'the media slot inside the player, where a frame sequence is drawn (an empty div; put a canvas or img in it)',
  'player-poster': 'the <img> in player-media showing data.video.frame (frame-1.jpg) until the build draws frames',
  'progress': 'the progress bar container (chapter segments)',
  'progress-load': 'the buffered fill (width %)',
  'progress-play': 'the played fill, red (width %)',
  'scrubber': 'the red scrubber dot (left %)',
  'time-current': 'the current time text in the time pill',
  'play-icon': 'the play/pause glyph (data-state="playing" shows pause)',
  'like-count': 'the like count in the like pill',
  'subscribe': 'the Subscribe button',
  'upnext': 'each Up next item (data-i 0..4)',
  // overlay
  'scrim': 'the dim layer over the base component (opacity is the build\'s)',
  'dialog-layer': 'the layer centring the dialog (transform it to move the dialog in)',
  // windowFrame
  'window': 'the browser window root',
  'window-view': 'the viewport inside the window (the component is laid out here, scaled)',
};

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ic = (name, cls = '') => `<svg class="ytx-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${MS[name] || ''}</svg>`;
const src = (data, f) => (f ? (/^([a-z]+:|\/)/.test(f) ? f : `${data.img || ''}${f}`) : '');
// a thumbnail: gray fill always, the image over it when the file exists (a missing file removes itself: the fill shows)
const img = (data, f, hook = '', i = null) => (f
  ? `<img class="ytx-img" src="${esc(src(data, f))}" alt=""${hook ? ` data-ux="${hook}"` : ''}${i !== null ? ` data-i="${i}"` : ''} draggable="false"/>` : '');
const el = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  const n = t.content.firstElementChild;
  n.querySelectorAll('img.ytx-img').forEach((m) => m.addEventListener('error', () => { m.style.visibility = 'hidden'; }, { once: true }));
  return n;
};
const theme = (opts) => (opts && opts.theme === 'dark' ? ' ytx-dark' : '');
const avatar = (data, size, cls = '') => {
  const c = data.channel;
  return `<span class="ytx-av ${cls}" style="--c:${esc(c.color)};--s:${size}px"><b>${esc(c.initial)}</b>${c.avatar ? img(data, c.avatar) : ''}</span>`;
};
// the Notices column's empty value: Studio writes "None" when a video has no notices
const NONE = '<span class="ytx-none">None</span>';
const VERIFIED = '<svg class="ytx-ver" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.6 14.2-4.2-4.2 1.4-1.4 2.8 2.8 5.8-5.8 1.4 1.4-7.2 7.2z"/></svg>';
// YouTube's A/B Testing glyph in the thumbnail menu (a frame split in two with a swap), drawn as a 24 x 24 outline
const AB = '<svg class="ytx-i" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 5h7v2H6v10h5v2H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9-2h2v18h-2zm4 2h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3v-2h2V7h-2z"/><path fill="currentColor" d="M7.5 9.5 10 12l-2.5 2.5z"/></svg>';
const SPARK = '<svg class="ytx-i" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c.5 4.9 2.6 7.5 10 10-7.4 2.5-9.5 5.1-10 10-.5-4.9-2.6-7.5-10-10 7.4-2.5 9.5-5.1 10-10z"/></svg>';

// ---------------------------------------------------------------- Studio shell (top bar + left menu), shared
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content'], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community'], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
const studioTop = (data) => `<header class="ytx-st-top">
    <span class="ytx-btn">${ic('menu')}</span>
    <span class="ytx-st-logo"><img src="${UX}youtube-studio-logo.svg" alt="" draggable="false"/></span>
    <div class="ytx-st-search">${ic('search')}<span>Search across your channel</span></div>
    <span class="ytx-st-tools"><span class="ytx-btn">${ic('help-outline')}</span><span class="ytx-st-create">${ic('video-call-outline')}<span>Create</span></span></span>
    ${avatar(data, 32, 'ytx-st-me')}
  </header>`;
const studioNav = (data, active) => `<nav class="ytx-st-nav">
    <div class="ytx-st-chan">${avatar(data, 112, 'ytx-st-big')}<b>Your channel</b><small>${esc(data.channel.name)}</small></div>
    ${NAV.map(([i, l]) => `<div class="ytx-nv${l === active ? ' ytx-on' : ''}">${ic(i)}<span>${esc(l)}</span></div>`).join('')}
    <div class="ytx-nfoot"><div class="ytx-nv">${ic('settings-outline')}<span>Settings</span></div><div class="ytx-nv">${ic('feedback-outline')}<span>Send feedback</span></div></div>
  </nav>`;

// ---------------------------------------------------------------- studioContent
// opts: { theme: 'light' | 'dark', ab: 'running' | 'done' | null (the chip in the new row; default 'running'),
//         emptySlot: false (true hides the new row's thumbnail image so the winner can fly into an empty slot),
//         revenue: false (true adds the Est. revenue column, which Studio shows to YouTube Partner Program channels) }
export function studioContent(data = DATA, opts = {}) {
  const v = data.video;
  const ab = opts.ab === undefined ? 'running' : opts.ab;
  const rev = !!opts.revenue;
  const head = `<div class="ytx-tr ytx-th">
      <span class="ytx-c ytx-c-cb"><i class="ytx-cb"></i></span>
      <span class="ytx-c ytx-c-video">Video</span>
      <span class="ytx-c ytx-c-not">Notices</span>
      <span class="ytx-c ytx-c-vis">Visibility</span>
      <span class="ytx-c ytx-c-date ytx-sorted">Date${ic('arrow-downward')}</span>
      <span class="ytx-c ytx-c-num">Views</span>
      ${rev ? '<span class="ytx-c ytx-c-num ytx-c-rev">Est. revenue</span>' : ''}
      <span class="ytx-c ytx-c-num">Comments</span>
    </div>`;
  const cells = (r, hooks = {}) => `
      <span class="ytx-c ytx-c-not">${NONE}</span>
      <span class="ytx-c ytx-c-vis">${ic('public')}<span>${esc(r.visibility || 'Public')}</span></span>
      <span class="ytx-c ytx-c-date"><span>${esc(r.date)}</span><small>${esc(r.status || 'Published')}</small></span>
      <span class="ytx-c ytx-c-num"${hooks.views ? ` data-ux="${hooks.views}"` : ''}>${esc(r.views)}</span>
      ${rev ? `<span class="ytx-c ytx-c-num ytx-c-rev">${esc(r.revenue || '')}</span>` : ''}
      <span class="ytx-c ytx-c-num"${hooks.comments ? ` data-ux="${hooks.comments}"` : ''}>${esc(r.comments)}</span>`;
  const chip = ab ? `<span class="ytx-abchip" data-ux="ab-chip" data-state="${ab}">${ab === 'done' ? ic('check-circle') : AB}<span data-ux="ab-chip-label">${esc(data.test.chip[ab])}</span></span>` : '';
  const newRow = `<div class="ytx-tr ytx-row ytx-row-new" data-ux="row-new">
      <span class="ytx-c ytx-c-cb"><i class="ytx-cb"></i></span>
      <span class="ytx-c ytx-c-video">
        <span class="ytx-st-thumb" data-ux="row-thumb-slot">${img(data, v.thumb, 'row-thumb-img')}<i class="ytx-len">${esc(v.length)}</i></span>
        <span class="ytx-st-meta"><b data-ux="row-title">${esc(v.title)}</b><small>${esc(v.description)}</small>${chip}</span>
      </span>${cells(v, { views: 'row-views', comments: 'row-comments' })}
    </div>`;
  const rows = data.videos.map((r, i) => `<div class="ytx-tr ytx-row" data-ux="row" data-i="${i}">
      <span class="ytx-c ytx-c-cb"><i class="ytx-cb"></i></span>
      <span class="ytx-c ytx-c-video">
        <span class="ytx-st-thumb">${img(data, r.thumb)}<i class="ytx-len">${esc(r.length)}</i></span>
        <span class="ytx-st-meta"><b>${esc(r.title)}</b><small>${esc(r.description)}</small></span>
      </span>${cells(r)}
    </div>`).join('');
  const n = el(`<div class="ytx ytx-studio${theme(opts)}${rev ? ' ytx-rev' : ''}" data-ux="studio">
    ${studioTop(data)}
    <div class="ytx-st-main">
      ${studioNav(data, 'Content')}
      <section class="ytx-st-page">
        <h1 class="ytx-h1">Channel content</h1>
        <div class="ytx-tabs">${['Videos', 'Shorts', 'Live', 'Posts', 'Playlists', 'Podcasts', 'Promotions'].map((t, i) => `<span class="ytx-tab${i ? '' : ' ytx-tab-on'}">${t}</span>`).join('')}</div>
        <div class="ytx-filter">${ic('filter-list')}<span>Filter</span></div>
        <div class="ytx-table" data-ux="studio-table">${head}${newRow}${rows}</div>
      </section>
    </div>
  </div>`);
  if (opts.emptySlot) n.querySelector('[data-ux="row-thumb-img"]')?.style.setProperty('opacity', '0');
  return n;
}

// ---------------------------------------------------------------- thumbSection
// The video details page's Thumbnail block (light: white page), its current thumbnail selected (dashed outline),
// Get suggestions, and the thumbnail menu open with A/B Testing (verbatim from Studio, vidIQ screenshot July 2026).
// opts: { theme, menu: true (show the menu), hot: 'A/B Testing' (the highlighted item, or null) }
export function thumbSection(data = DATA, opts = {}) {
  const menu = opts.menu !== false;
  const hot = opts.hot === undefined ? 'A/B Testing' : opts.hot;
  const items = [['add-photo-alternate-outline', 'Change'], ['download', 'Download'], ['image-outline', 'Select from video'], ['ab', 'A/B Testing']];
  return el(`<div class="ytx ytx-thsec${theme(opts)}" data-ux="thumb-section">
    <div class="ytx-thsec-h">Thumbnail</div>
    <div class="ytx-thsec-sub">Set a thumbnail that stands out and draws viewers' attention.</div>
    <div class="ytx-thsec-row">
      <span class="ytx-thsec-cur" data-ux="thumb-current">${img(data, data.video.thumb, 'thumb-current-img')}</span>
      ${menu ? `<div class="ytx-menu" data-ux="thumb-menu">${items.map(([i, l]) => `<div class="ytx-mi${l === hot ? ' ytx-mi-hot' : ''}"${l === 'A/B Testing' ? ' data-ux="menu-ab"' : ''}>${i === 'ab' ? AB : ic(i)}<span>${l}</span></div>`).join('')}</div>` : ''}
    </div>
    <span class="ytx-suggest">${SPARK}<span>Get suggestions</span></span>
  </div>`);
}

// ---------------------------------------------------------------- testCompare
// Studio's A/B Test report dialog (verbatim from the July 2026 vidIQ screenshots: "Thumbnail only" over "A/B Test
// report", the feedback and close glyphs, one card per option with the thumbnail and its duration, the title, the
// channel, the watch time share, "Winner" and "Now visible to all viewers" on the winner, "Test finished. Ran from ..."
// with New test / Done). The running state (heading, progress track, "Test started ...") is a reconstruction: no
// source screenshot of a test in progress was found (CREDITS.txt).
// opts: { theme, state: 'running' | 'result' (default 'running'), buttons: true }
export function testCompare(data = DATA, opts = {}) {
  const t = data.test, v = data.video;
  const state = opts.state === 'result' ? 'result' : 'running';
  const res = state === 'result';
  const cards = t.thumbs.map((f, i) => {
    const win = res && i === t.winner;
    return `<div class="ytx-ab-card${win ? ' ytx-ab-win' : ''}" data-ux="ab-card" data-i="${i}">
        <span class="ytx-ab-th" data-ux="ab-slot" data-i="${i}">${img(data, f, 'ab-img', i)}<i class="ytx-len">${esc(v.length)}</i></span>
        <div class="ytx-ab-meta"><b>${esc(v.title)}</b><small>${esc(data.channel.name)}</small>${win ? '<span class="ytx-ab-vis" data-ux="ab-visible">Now visible to all viewers</span>' : ''}</div>
        <div class="ytx-ab-num"><b data-ux="ab-share" data-i="${i}">${esc(t.shares[i])}</b><small>Watch time share</small>${win ? '<span class="ytx-ab-chip" data-ux="ab-winner">Winner</span>' : ''}</div>
      </div>`;
  }).join('');
  const foot = res ? `Test finished. Ran from ${esc(t.ended ? `${t.started} to ${t.ended}` : t.started)}.` : `Test started ${esc(t.started)}.`;
  const btns = opts.buttons === false ? '' : `<span class="ytx-ab-btns">${res ? '<span class="ytx-pill ytx-pill-tonal">New test</span>' : ''}<span class="ytx-pill ytx-pill-strong">Done</span></span>`;
  return el(`<div class="ytx ytx-ab${theme(opts)}" data-ux="abtest" data-state="${state}">
    <div class="ytx-ab-head">
      <div class="ytx-ab-ttl"><small>${esc(t.mode)}</small><b>${esc(t.report)}</b></div>
      <span class="ytx-ab-icons"><span class="ytx-btn">${ic('feedback-outline')}</span><span class="ytx-btn">${ic('close')}</span></span>
    </div>
    <div class="ytx-ab-body">
      <h2 class="ytx-ab-h" data-ux="ab-heading">${esc(res ? t.headingResult : t.headingRunning)}${res ? '' : ic('help-outline', 'ytx-ab-q')}</h2>
      ${res ? '' : '<div class="ytx-ab-prog" data-ux="ab-progress"><i data-ux="ab-progress-fill"></i></div>'}
      <div class="ytx-ab-list">${cards}</div>
    </div>
    <div class="ytx-ab-foot"><span data-ux="ab-foot">${foot}</span>${btns}</div>
  </div>`);
}

// ---------------------------------------------------------------- watchPage
// opts: { theme, playing: true (the pause glyph shows; false shows play) }
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const secs = (mmss) => mmss.split(':').reduce((a, b) => a * 60 + +b, 0);
export function watchPage(data = DATA, opts = {}) {
  const v = data.video, w = data.watch, c = data.channel;
  const playing = opts.playing !== false;
  const len = secs(v.length);
  // the progress bar is split at the chapter starts: YouTube's 2 px gaps, cut through track, buffer and played fill
  // alike by one mask, so progress-load and progress-play stay single elements the build sizes by width
  const pct = (f) => `${(f * 100).toFixed(3)}%`;
  const stops = w.chapters.filter((s) => s > 0 && s < len).map((s) => pct(s / len));
  const mask = `linear-gradient(to right, ${stops.map((p) => `#000 calc(${p} - 1px), transparent calc(${p} - 1px), transparent calc(${p} + 1px), #000 calc(${p} + 1px)`).join(', ') || '#000, #000'})`;
  const up = w.upNext.map((u, i) => `<div class="ytx-up" data-ux="upnext" data-i="${i}">
      <span class="ytx-up-th">${img(data, u.thumb)}<i class="ytx-len">${esc(u.length)}</i></span>
      <span class="ytx-up-meta"><b>${esc(u.title)}</b><small>${esc(u.channel)}${u.verified ? VERIFIED : ''}</small><small>${ic('play-arrow-outline')}${esc(u.views)}<i class="ytx-dot"></i>${esc(u.date)}</small></span>
    </div>`).join('');
  return el(`<div class="ytx ytx-watch${theme(opts)}" data-ux="watch">
    <header class="ytx-mh">
      <span class="ytx-btn">${ic('menu')}</span>
      <span class="ytx-mh-logo"><img src="${UX}youtube-logo.svg" alt="" draggable="false"/></span>
      <div class="ytx-mh-mid">
        <div class="ytx-mh-search"><span>Search</span></div><span class="ytx-mh-sbtn">${ic('search')}</span>
        <span class="ytx-mh-mic">${ic('mic')}</span>
      </div>
      <span class="ytx-mh-right">
        <span class="ytx-mh-create">${ic('video-call-outline')}<span>Create</span></span>
        <span class="ytx-btn">${ic('notifications-outline')}</span>
        <span class="ytx-av ytx-mh-me" style="--c:${esc(data.viewer.color)};--s:32px"><b>${esc(data.viewer.initial)}</b></span>
      </span>
    </header>
    <div class="ytx-wp">
      <div class="ytx-wp-primary">
        <div class="ytx-player" data-ux="player">
          <div class="ytx-media" data-ux="player-media">${img(data, v.frame || v.thumb, 'player-poster')}</div>
          <div class="ytx-pl-shade"></div>
          <div class="ytx-pl-bottom">
            <div class="ytx-prog" data-ux="progress">
              <div class="ytx-prog-bars" style="-webkit-mask-image:${mask};mask-image:${mask}">
                <div class="ytx-prog-load" data-ux="progress-load" style="width:${pct(w.buffered)}"></div>
                <div class="ytx-prog-play" data-ux="progress-play" style="width:${pct(w.progress)}"></div>
              </div>
              <span class="ytx-prog-dot" data-ux="scrubber" style="left:${pct(w.progress)}"></span>
            </div>
            <div class="ytx-ctl">
              <span class="ytx-ctl-l">
                <span class="ytx-cb-round" data-ux="play-icon" data-state="${playing ? 'playing' : 'paused'}">${ic('pause', 'ytx-pause')}${ic('play-arrow', 'ytx-play')}</span>
                <span class="ytx-cb-round">${ic('volume-up')}</span>
                <span class="ytx-ctl-time"><span data-ux="time-current">${esc(w.current)}</span> / ${esc(v.length)}</span>
              </span>
              <span class="ytx-ctl-r">
                <span class="ytx-autoplay"><i></i></span>
                ${ic('closed-caption-outline')}${ic('settings')}${ic('crop-landscape-outline')}${ic('fullscreen')}
              </span>
            </div>
          </div>
        </div>
        <h1 class="ytx-wt">${esc(v.title)}</h1>
        <div class="ytx-own">
          ${avatar(data, 40)}
          <span class="ytx-own-n"><b>${esc(c.name)}${c.verified ? VERIFIED : ''}</b><small>${esc(c.subscribers)}</small></span>
          <span class="ytx-sub" data-ux="subscribe">Subscribe</span>
          <span class="ytx-acts">
            <span class="ytx-like"><span class="ytx-like-l">${ic('thumb-up-outline')}<span data-ux="like-count">${esc(v.likes)}</span></span><i></i><span class="ytx-like-d">${ic('thumb-down-outline')}</span></span>
            <span class="ytx-act">${ic('share-outline')}<span>Share</span></span>
            <span class="ytx-act">${ic('bookmark-outline')}<span>Save</span></span>
            <span class="ytx-act ytx-act-ic">${ic('more-horiz')}</span>
          </span>
        </div>
        <div class="ytx-desc">
          <div class="ytx-desc-info"><b>${esc(v.viewsLong)}</b><b>${esc(v.date)}</b><span class="ytx-tags">${esc(v.tags)}</span></div>
          <div class="ytx-desc-txt">${v.descLines.slice(0, 3).map((l) => (l ? `<div>${esc(l)}</div>` : '<div class="ytx-gap"></div>')).join('')}<span class="ytx-more">...more</span></div>
        </div>
      </div>
      <aside class="ytx-wp-side">${up}</aside>
    </div>
  </div>`);
}

// ---------------------------------------------------------------- overlay
// base (e.g. studioContent) with Studio's modal scrim over it and the dialog (e.g. testCompare) centred above.
// Returns base itself, with the two layers appended.
export function overlay(base, dialog) {
  base.appendChild(el('<div class="ytx-scrim" data-ux="scrim"></div>'));
  const layer = el('<div class="ytx-dlayer" data-ux="dialog-layer"></div>');
  layer.appendChild(dialog);
  base.appendChild(layer);
  return base;
}

// ---------------------------------------------------------------- windowFrame
// A plain desktop browser window (one tab, the address bar) holding a component at a design size and scaling it up,
// so YouTube is always shown inside a framed screen, never full-bleed. The window fills its parent; the component is
// laid out at (viewport / scale) CSS px and scaled by `scale`.
// opts: { url, tab, favicon: 'youtube-icon.svg' | 'youtube-studio-logo.svg' | url, scale: 1.2, width, height (px of
//         the window; default: fill the parent), theme }
export function windowFrame(content, opts = {}) {
  const scale = opts.scale || 1.2;
  const fav = opts.favicon || `${UX}youtube-icon.svg`;
  const n = el(`<div class="ytx ytx-win${theme(opts)}" data-ux="window"${opts.width ? ` style="width:${opts.width}px;height:${opts.height}px"` : ''}>
    <div class="ytx-win-bar">
      <span class="ytx-lights"><i></i><i></i><i></i></span>
      <span class="ytx-win-tab"><img src="${esc(fav)}" alt="" draggable="false"/><span>${esc(opts.tab || 'YouTube')}</span></span>
    </div>
    <div class="ytx-win-url"><span class="ytx-win-omni">${ic('info-outline')}<span>${esc(opts.url || 'youtube.com')}</span></span></div>
    <div class="ytx-win-view" data-ux="window-view"><div class="ytx-win-fit" style="--k:${scale}"></div></div>
  </div>`);
  n.querySelector('.ytx-win-fit').appendChild(content);
  return n;
}
