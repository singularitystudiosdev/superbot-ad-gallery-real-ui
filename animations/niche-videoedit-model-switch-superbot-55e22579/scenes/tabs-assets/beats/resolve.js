// Resolve beat, the finale: superbot connects to the user's video library, the DaVinci Resolve Media Pool, and exports
// the 5 clips. Its line streams, a connect card lands in the chat ("superbot connected to DaVinci Resolve", the source
// found in the Media Pool: Friday ranked stream.mov, 2:03:41, 1080p60, and "5 clips added to Vertical clips", three
// checks ticking in turn) with a mini window under it; the card holds (CARD_HOLD) and the window opens to full frame
// (GROW), the grammar of the TikTok remake's tiktok.js. Full frame is a real-looking DaVinci Resolve Edit page, dark:
// the top toolbar, the Media Pool on the left (the Streams bin holding the 2:03:41 VOD, the Clips bin filling with the
// 5 new clips), the 9:16 timeline viewer playing clip 1 with its burned-in caption, the Render Queue on the right, the
// vertical 1080x1920 timeline at the bottom (timecode, ruler, red playhead, ST1 caption blocks, V1 with the 5 clips as
// filmstrips, A1 with its green waveform) and the page tabs (Edit active). The clips land one by one in the bin, on
// the timeline and in the queue; the pointer clicks Render All; the 5 jobs render in turn and flip to Complete (the
// 5th one's Complete label is .rv-ready, whose opacity rising from 0 is the instant render.mjs times the chime on);
// then the toast "5 of 5 exported · Ready to post" lands (.rv-toast, the settled probe). On a portrait frame (4:5) the
// page takes its narrow layout: the Media Pool in list view, icon-only toolbars, a shorter timeline scale.
//
// There is ONE Resolve window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes.
// Every picture is a real photo (img/vod.jpg, img/clip-1..5.jpg, img/CREDITS.txt), fetched AND decoded before this
// module finishes loading (top-level await), as is the type, so timeline.js only reports window.__AD.ready once they
// all are. The waveform is UI (bars from a fixed seed). Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';

// ---- the pictures and the type, ready before the spot reports ready ----
const asset = (p) => new URL(`../../../${p}`, import.meta.url).href;
const PICS = ['img/vod.jpg', ...[1, 2, 3, 4, 5].map((i) => `img/clip-${i}.jpg`)].map((p) => { const im = new Image(); im.src = asset(p); return im; });
// TikTok Sans (SIL OFL 1.1, @fontsource/tiktok-sans 5.3.0, vendored under fonts/, fonts/CREDITS.txt): the Resolve UI
// face here and the heavy burned-in caption face (800)
const FACES = [400, 500, 600, 700, 800].map((w) => new FontFace('TikTok Sans', `url("${asset(`fonts/tiktok-sans-latin-${w}-normal.woff2`)}") format("woff2")`, { weight: String(w), style: 'normal', display: 'block' }));
FACES.forEach((f) => document.fonts.add(f));
await Promise.all([...FACES.map((f) => f.load()), ...PICS.map((im) => im.decode())]);

const SAY = 'Found your stream in the Resolve Media Pool. Exporting the 5 clips.';
const SOURCE = { name: 'Friday ranked stream.mov', dur: '2:03:41', fmt: '1080p60' };
const TIMELINE = 'Vertical clips';
// the 5 clips: title, length (s), the burned caption and its one highlighted word, the exported file
const CLIPS = [
  { name: '1v4 clutch', s: 41, cap: 'NO WAY THAT JUST WORKED', hi: 'WORKED', file: 'clip-1-1v4-clutch.mp4' },
  { name: 'Chat picks my loadout', s: 38, cap: 'OKAY CHAT, YOU WIN THIS ONE', hi: 'CHAT,', file: 'clip-2-chat-picks-my-loadout.mp4' },
  { name: 'Boss down, first try', s: 57, cap: "FIRST TRY. I'M NOT JOKING.", hi: 'FIRST', file: 'clip-3-boss-down-first-try.mp4' },
  { name: 'The lag spike', s: 33, cap: 'WHY DID IT FREEZE NOW', hi: 'FREEZE', file: 'clip-4-the-lag-spike.mp4' },
  { name: 'Raid welcome', s: 46, cap: 'WELCOME IN, EVERYONE', hi: 'EVERYONE', file: 'clip-5-raid-welcome.mp4' },
];
const TOTAL = CLIPS.reduce((a, c) => a + c.s, 0); // 215 s on the timeline
const STARTS = CLIPS.reduce((a, c, i) => (a.push(i ? a[i - 1] + CLIPS[i - 1].s : 0), a), []);
const PAGES = ['Media', 'Cut', 'Edit', 'Fusion', 'Color', 'Fairlight', 'Deliver'];

const APP_SCALE = { wide: 1.25, tall: 1.2 };    // full frame: the window's px to frame px
// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const ADD_AT = 0.2, ADD_STAGGER = 0.12, ADD_IN = 0.26; // full frame to the clips landing in the bin, timeline and queue
const PTR_AT = 0.72;                             // full frame: the page reads, then the pointer sets off for Render All
const PTR_MOVE = 0.45;                           // the pointer travelling to Render All
const PRESS_AT = 0.06;                           // arrived, then the press
const JOB_AT = 0.12, JOB = 0.42;                 // the press to the first job rendering; one job's render
const FLIP = 0.15;                               // a job's Complete label coming in
const TOAST_AT = 0.12, TOAST_IN = 0.26;          // the 5th job complete to the toast landing
const CAP_AT = 0.3, CAP_WORD = 0.16;             // clip 1 in the viewer to its caption words popping in, one by one
const READ = 1.8; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = '') => `<svg class="rv-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const st = (d) => svg(d, 'rv-st');
const fl = (d) => svg(d, 'rv-fl');
const I = {
  pool: st('<rect x="3.5" y="5" width="7" height="6" rx="1"/><rect x="13.5" y="5" width="7" height="6" rx="1"/><rect x="3.5" y="14" width="7" height="6" rx="1"/><rect x="13.5" y="14" width="7" height="6" rx="1"/>'),
  fx: st('<path d="M12 3.5 14 9l5.5 2-5.5 2-2 5.5-2-5.5-5.5-2L10 9z"/>'),
  index: st('<path d="M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.5M4 12h.5M4 17.5h.5"/>'),
  sound: st('<path d="M9 17.5V6l11-2.5v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15" r="2.5"/>'),
  mixer: st('<path d="M6 4v16M12 4v16M18 4v16"/><rect x="4" y="13" width="4" height="3" rx=".5"/><rect x="10" y="7" width="4" height="3" rx=".5"/><rect x="16" y="11" width="4" height="3" rx=".5"/>'),
  meta: st('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
  insp: st('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  folder: st('<path d="M3.5 6.5a1 1 0 0 1 1-1h4.8l2 2h8.2a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/>'),
  chev: st('<path d="m9 6 6 6-6 6"/>'),
  down: st('<path d="m6 9 6 6 6-6"/>'),
  play: fl('<path d="M8 5.5v13l10.5-6.5z"/>'),
  back: fl('<path d="M16 5.5v13L5.5 12z"/>'),
  stop: fl('<rect x="6.5" y="6.5" width="11" height="11" rx="1"/>'),
  prev: fl('<path d="M6 5.5h2v13H6zM19 5.5v13L9 12z"/>'),
  next: fl('<path d="M16 5.5h2v13h-2zM5 5.5v13L15 12z"/>'),
  loop: st('<path d="M5 11V9a3 3 0 0 1 3-3h11l-3-3M19 13v2a3 3 0 0 1-3 3H5l3 3"/>'),
  arrow: fl('<path d="M6 3.5v15l4.2-4 2.8 6.2 2.4-1.1-2.8-6.1H18z"/>'),
  blade: st('<path d="M5 19 19 5M14 5h5v5"/>'),
  snap: st('<path d="M7 4v8a5 5 0 0 0 10 0V4M7 8h3M14 8h3"/>'),
  link: st('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  lock: st('<rect x="5.5" y="11" width="13" height="9" rx="1.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>'),
  eye: st('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
  spk: st('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/>'),
  cc: st('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M10.5 10.2a2.2 2.2 0 1 0 0 3.6M17 10.2a2.2 2.2 0 1 0 0 3.6"/>'),
  home: st('<path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5v-6h-6v6H4a.5.5 0 0 1-.5-.5z"/>'),
  gear: st('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
  video: st('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m10 9.2 4.8 2.8-4.8 2.8z"/>'),
  list: st('<path d="M9 6.5h11M9 12h11M9 17.5h11M4 6.5h.5M4 12h.5M4 17.5h.5"/>'),
  check: '<svg class="rv-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  okc: '<svg class="rv-okc" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
  // the seven page buttons (Resolve's bottom bar), as simple glyphs
  pMedia: st('<rect x="3.5" y="6" width="17" height="12" rx="1.5"/><path d="M3.5 9.5h17"/>'),
  pCut: st('<circle cx="6.5" cy="7" r="2.5"/><circle cx="6.5" cy="17" r="2.5"/><path d="M8.5 8.5 20 17M8.5 15.5 20 7"/>'),
  pEdit: st('<rect x="3.5" y="5" width="7" height="5" rx="1"/><rect x="8.5" y="13" width="12" height="5" rx="1"/><path d="M13 7.5h7.5"/>'),
  pFusion: st('<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>'),
  pColor: st('<circle cx="8.5" cy="9" r="4.5"/><circle cx="15.5" cy="9" r="4.5"/><circle cx="12" cy="15" r="4.5"/>'),
  pFair: st('<path d="M3 12h2l2-5 3 10 3-13 3 11 2-3h3"/>'),
  pDeliver: st('<path d="M12 3.5v12M7 10.5l5 5 5-5M4 19.5h16"/>'),
};
const PAGE_ICONS = ['pMedia', 'pCut', 'pEdit', 'pFusion', 'pColor', 'pFair', 'pDeliver'];
const clipDur = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
// timeline timecode at 60 fps, from the timeline start 01:00:00:00
const tc60 = (sec) => {
  const f = Math.max(0, Math.floor(sec * 60 + 1e-6));
  const ff = f % 60, s = Math.floor(f / 60);
  return `01:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
};
// the caption as burned in: bold white uppercase, the one highlighted word yellow
const capHTML = (c, cls = '') => c.cap.split(' ').map((w) => `<span class="${w === c.hi ? 'rv-hi ' : ''}${cls}">${esc(w)}</span>`).join(' ');
// A1's waveform: bars from a fixed seed, louder where the clip's peaks are (UI, not footage)
function wave(seed0, n) {
  let seed = seed0;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let d = '';
  for (let i = 0; i < n; i++) {
    const env = 0.35 + 0.4 * Math.abs(Math.sin(i * 0.37 + seed0)) + 0.25 * rnd();
    const h = Math.min(0.96, env) * 14;
    d += `M${i * 2 + 1} ${(16 - h).toFixed(2)}V${(16 + h).toFixed(2)}`;
  }
  return `<svg class="rv-wv" viewBox="0 0 ${n * 2} 32" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // connected, source found, clips added
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame: the Resolve Edit page
    T.add = CLIPS.map((_, i) => T.full + ADD_AT + i * ADD_STAGGER); // the clips land: bin, timeline, queue
    T.ptr = T.full + PTR_AT;                          // the pointer sets off for Render All
    T.arrive = T.ptr + PTR_MOVE;
    T.press = T.arrive + PRESS_AT;                    // the press on Render All
    T.j0 = CLIPS.map((_, i) => T.press + JOB_AT + i * JOB); // each job starts rendering...
    T.j1 = T.j0.map((a) => a + JOB);                  // ...and flips to Complete (T.j1[4]: .rv-ready, the chime)
    T.ready = T.j1[4];
    T.toast = T.ready + TOAST_AT;                     // "5 of 5 exported · Ready to post" (.rv-toast)
    T.settle = T.toast + TOAST_IN;                    // the last visible change
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('davinciresolve.svg');
    const vod = x.img('vod.jpg');
    const cimg = (i) => x.img(`clip-${i + 1}.jpg`);

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say rv-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="rv-ct rv-ct-dr"><img class="rv-mark" src="${mark}" alt=""/></span>`, '<b>superbot connected to DaVinci Resolve</b>'],
      [`<span class="rv-ct rv-ct-th"><img src="${vod}" alt=""/></span>`, `<b>${esc(SOURCE.name)}</b><i>&middot;</i>${SOURCE.dur}<i>&middot;</i>${SOURCE.fmt}`],
      [`<span class="rv-ct">${I.list}</span>`, `5 clips added to <b>${esc(TIMELINE)}</b>`],
    ];
    const card = x.el(`<div class="rv-card">
      ${steps.map(([icon, txt]) => `<div class="rv-step">${icon}<span class="rv-tx">${txt}</span><span class="rv-ok"><i class="rv-spin"></i>${I.check}</span></div>`).join('')}
      <div class="rv-shot"></div>
    </div>`);
    const shot = card.querySelector('.rv-shot');
    const checks = [...card.querySelectorAll('.rv-ok')].map((n) => ({ spin: n.querySelector('.rv-spin'), ck: n.querySelector('.rv-ck') }));

    // ---- the Resolve Edit page ----
    const tool = (i, label, on) => `<span class="rv-tb${on ? ' on' : ''}">${I[i]}<b>${label}</b></span>`;
    const top = `<header class="rv-top">
      <div class="rv-tbs">${tool('pool', 'Media Pool', true)}${tool('fx', 'Effects')}${tool('index', 'Edit Index')}${tool('sound', 'Sound Library')}</div>
      <div class="rv-proj"><b>Friday ranked stream</b><span>Edited</span></div>
      <div class="rv-tbs rv-tbs-r">${tool('mixer', 'Mixer')}${tool('meta', 'Metadata')}${tool('insp', 'Inspector')}</div>
    </header>`;
    const item = (src, name, dur, cls = '', vert = false) => `<div class="rv-mi ${cls}">
      <span class="rv-mth${vert ? ' rv-v' : ''}"><img src="${src}" alt=""/><i>${dur}</i></span>
      <span class="rv-mn"><b>${esc(name)}</b><s>${dur}</s></span></div>`;
    const pool = `<section class="rv-pool rv-pan">
      <div class="rv-ph"><b>Media Pool</b><span class="rv-ph-r">${I.list}${I.pool}</span></div>
      <div class="rv-pb">
        <nav class="rv-bins">
          <span class="rv-bin rv-bin-m">${I.down}${I.folder}<b>Master</b></span>
          <span class="rv-bin">${I.folder}<b>Streams</b></span>
          <span class="rv-bin on">${I.folder}<b>Clips</b></span>
          <span class="rv-bin">${I.folder}<b>Timelines</b></span>
        </nav>
        <div class="rv-pc">
          <div class="rv-grp"><span class="rv-gh">${I.folder}<b>Streams</b><s>1 clip</s></span>
            <div class="rv-grid">${item(vod, SOURCE.name, SOURCE.dur, 'rv-src')}</div></div>
          <div class="rv-grp"><span class="rv-gh">${I.folder}<b>Clips</b><s class="rv-nclips">0 clips</s></span>
            <div class="rv-grid">${CLIPS.map((c, i) => item(cimg(i), c.name, clipDur(c.s), 'rv-new', true)).join('')}</div></div>
        </div>
      </div>
    </section>`;
    const viewer = `<section class="rv-view rv-pan">
      <div class="rv-vh"><span class="rv-vn"><b>${esc(TIMELINE)}</b>${I.down}</span><span class="rv-fit">Fit</span><span class="rv-vtc">01:00:00:00</span></div>
      <div class="rv-vb">
        <div class="rv-frame"><img class="rv-fimg" src="${cimg(0)}" alt=""/><i class="rv-shade"></i>
          <div class="rv-cap">${capHTML(CLIPS[0], 'rv-w')}</div></div>
      </div>
      <div class="rv-tr">
        <div class="rv-scrub"><i class="rv-scrub-f"></i></div>
        <div class="rv-ctl"><span class="rv-ctl-l">${I.loop}</span><span class="rv-ctl-c">${I.prev}${I.back}${I.stop}${I.play}${I.next}</span><span class="rv-ctl-r">1080 x 1920</span></div>
      </div>
    </section>`;
    const job = (c, i) => `<div class="rv-job">
      <span class="rv-jth"><img src="${cimg(i)}" alt=""/></span>
      <div class="rv-jm"><span class="rv-jt"><b>Job ${i + 1}</b><s>${esc(TIMELINE)}</s></span><span class="rv-jf">${esc(c.file)}</span>
        <span class="rv-jbar"><i></i></span></div>
      <span class="rv-js"><span class="rv-jq">Queued</span><span class="rv-jr">Rendering <b>0%</b></span><span class="rv-jd${i === 4 ? ' rv-ready' : ''}">${I.okc}Complete</span></span>
    </div>`;
    const queue = `<section class="rv-queue rv-pan">
      <div class="rv-ph"><b>Render Queue</b><span class="rv-qn">0 jobs</span></div>
      <div class="rv-jobs">${CLIPS.map(job).join('')}</div>
      <div class="rv-qf"><span class="rv-qpath">${I.folder}<span>Exports/Vertical</span><i>&middot;</i><span>H.264</span></span><span class="rv-btn">Render All</span></div>
    </section>`;
    // the timeline: ruler marks every 30 s (wide) and every 60 s (narrow, CSS hides the odd ones)
    const marks = [];
    for (let s = 0; s <= 210; s += 30) marks.push(`<span class="rv-mk${s % 60 ? ' rv-mk-odd' : ''}" style="left:${(s / TOTAL * 100).toFixed(3)}%"><b>${tc60(s).slice(0, 8)}:00</b></span>`);
    const pos = (i) => `left:${(STARTS[i] / TOTAL * 100).toFixed(3)}%;width:${(CLIPS[i].s / TOTAL * 100).toFixed(3)}%`;
    const words = (c) => { const w = c.cap.split(' '); const h = Math.ceil(w.length / 2); return [w.slice(0, h).join(' '), w.slice(h).join(' ')]; };
    const tl = `<section class="rv-tl rv-pan">
      <div class="rv-tlh"><span class="rv-tltc">01:00:00:00</span><span class="rv-tlname">${esc(TIMELINE)}</span>
        <span class="rv-tlt">${I.arrow}${I.blade}${I.snap}${I.link}</span><span class="rv-tlfmt">1080 x 1920 &middot; 60 fps</span></div>
      <div class="rv-tlb">
        <div class="rv-hds">
          <span class="rv-ruler-h"></span>
          <span class="rv-hd rv-hd-st"><b>ST1</b><span>Subtitle 1</span>${I.lock}${I.cc}</span>
          <span class="rv-hd rv-hd-v"><b>V1</b><span>Video 1</span>${I.lock}${I.eye}</span>
          <span class="rv-hd rv-hd-a"><b>A1</b><span>Audio 1</span>${I.lock}${I.spk}</span>
        </div>
        <div class="rv-lanes">
          <div class="rv-ruler">${marks.join('')}</div>
          <div class="rv-lane rv-lane-st">${CLIPS.map((c, i) => { const [a, b] = words(c); const w = CLIPS[i].s / TOTAL * 100, l = STARTS[i] / TOTAL * 100;
            return `<span class="rv-sub rv-c${i}" style="left:${l.toFixed(3)}%;width:${(w * 0.46).toFixed(3)}%"><b>${esc(a)}</b></span><span class="rv-sub rv-c${i}" style="left:${(l + w * 0.5).toFixed(3)}%;width:${(w * 0.46).toFixed(3)}%"><b>${esc(b)}</b></span>`; }).join('')}</div>
          <div class="rv-lane rv-lane-v">${CLIPS.map((c, i) => `<span class="rv-clip rv-c${i}" style="${pos(i)}"><span class="rv-clh"><b>${esc(c.name)}</b>${I.okc}</span><span class="rv-film" style="background-image:url('${cimg(i)}')"></span></span>`).join('')}</div>
          <div class="rv-lane rv-lane-a">${CLIPS.map((c, i) => `<span class="rv-aclip rv-c${i}" style="${pos(i)}"><span class="rv-clh"><b>${esc(c.name)}</b></span>${wave(11 + i * 7, Math.round(c.s * 2.2))}</span>`).join('')}</div>
          <i class="rv-play"><i></i></i>
        </div>
      </div>
    </section>`;
    const pages = `<footer class="rv-pages">
      <span class="rv-brand"><img class="rv-mark" src="${mark}" alt=""/><b>DaVinci Resolve</b></span>
      <nav class="rv-pg">${PAGES.map((p, i) => `<span class="rv-pgi${p === 'Edit' ? ' on' : ''}">${I[PAGE_ICONS[i]]}<b>${p}</b></span>`).join('')}</nav>
      <span class="rv-pgr">${I.home}${I.gear}</span>
    </footer>`;
    const toast = `<div class="rv-toast">${I.okc}<b>5 of 5 exported</b><i>&middot;</i><span>Ready to post</span></div>`;

    const layer = x.el(`<div class="rv-full" aria-hidden="true"><div class="rv-app">${top}<div class="rv-up">${pool}${viewer}${queue}</div>${tl}${pages}${toast}</div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => app.querySelector(s);
    const $$ = (s) => [...app.querySelectorAll(s)];
    const btn = $('.rv-btn'), toastEl = $('.rv-toast');
    const news = $$('.rv-new'), nclips = $('.rv-nclips'), qn = $('.rv-qn');
    const jobs = $$('.rv-job').map((n) => ({ n, q: n.querySelector('.rv-jq'), r: n.querySelector('.rv-jr'), pct: n.querySelector('.rv-jr b'), d: n.querySelector('.rv-jd'), bar: n.querySelector('.rv-jbar i'), s: '' }));
    const per = (cls) => CLIPS.map((_, i) => $$(`.${cls}.rv-c${i}`));
    const subs = per('rv-sub'), vclips = per('rv-clip'), aclips = per('rv-aclip');
    const frame = $('.rv-frame'), fimg = $('.rv-fimg'), capWords = $$('.rv-w');
    const vtc = $('.rv-vtc'), tltc = $('.rv-tltc'), play = $('.rv-play'), scrub = $('.rv-scrub-f');
    let lastTc = '';

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tallMode = false;
    let AW = 1536, AH = 864;

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes the narrow layout
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tallMode = W < H;
      const s = tallMode ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('rv-narrow', tallMode);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('rv-tall', tallMode);
    };

    // Render All's centre in the window's own px (transform-free: the window's rect over its current scale)
    const btnPt = () => {
      const a = app.getBoundingClientRect(), b = btn.getBoundingClientRect();
      const sc = a.width / AW || 1;
      return { x: (b.left - a.left + b.width * 0.42) / sc, y: (b.top - a.top + b.height * 0.58) / sc };
    };
    const rise = (n, q, dy = 8) => { n.style.opacity = q.toFixed(3); n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // ---- the clips land: the Clips bin fills, V1 / ST1 / A1 fill, the queue lists them ----
        let landed = 0;
        CLIPS.forEach((_, i) => {
          const q = outCubic(seg(t, T.add[i], T.add[i] + ADD_IN));
          if (t >= T.add[i]) landed = i + 1;
          rise(news[i], q);
          [...subs[i], ...vclips[i], ...aclips[i]].forEach((m) => rise(m, q, -10));
          rise(jobs[i].n, q, 10);
        });
        const nc = `${landed} clip${landed === 1 ? '' : 's'}`;
        if (nclips.textContent !== nc) nclips.textContent = nc;
        const nj = `${landed} job${landed === 1 ? '' : 's'}`;
        if (qn.textContent !== nj) qn.textContent = nj;

        // ---- the viewer: clip 1 comes up as it lands and plays (a slow push), its caption words pop in ----
        const v0 = T.add[0];
        const vf = outCubic(seg(t, v0, v0 + ADD_IN));
        frame.style.setProperty('--on', vf.toFixed(3));
        fimg.style.transform = `scale(${(1.02 + 0.05 * seg(t, v0, v0 + 8)).toFixed(4)})`;
        capWords.forEach((w, j) => {
          const a = v0 + CAP_AT + j * CAP_WORD;
          const p = seg(t, a, a + 0.12);
          w.style.opacity = p > 0 ? '1' : '0';
          w.style.transform = p > 0 && p < 1 ? `scale(${(1.2 - 0.2 * outCubic(p)).toFixed(3)})` : 'none';
        });
        // the playhead plays clip 1 in real time from its landing; the timecodes run with it
        const ph = Math.max(0, t - v0);
        play.style.setProperty('--p', (ph / TOTAL).toFixed(5));
        scrub.style.transform = `scaleX(${(ph / CLIPS[0].s).toFixed(4)})`;
        const c = tc60(ph);
        if (c !== lastTc) { vtc.textContent = c; tltc.textContent = c; lastTc = c; }

        // ---- Render All: the press, then the jobs render in turn and flip to Complete ----
        const pr = press(t, T.press);
        btn.style.transform = pr > 0 ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : '';
        btn.classList.toggle('on', t >= T.press);
        jobs.forEach((j, i) => {
          const a = T.j0[i], b = T.j1[i];
          const p = seg(t, a, b);
          const state = t >= b ? 'd' : t >= a ? 'r' : 'q';
          j.n.classList.toggle('rv-run', state === 'r');
          j.n.classList.toggle('rv-done', state === 'd');
          j.q.style.display = state === 'q' ? '' : 'none';
          j.r.style.display = state === 'r' ? '' : 'none';
          j.d.style.display = state === 'd' ? '' : 'none';
          j.d.style.opacity = outCubic(seg(t, b, b + FLIP)).toFixed(3);
          const pc = `${Math.min(99, Math.floor(p * 100))}%`;
          if (pc !== j.s) { j.pct.textContent = pc; j.s = pc; }
          j.bar.style.transform = `scaleX(${p.toFixed(4)})`;
          vclips[i].forEach((m) => m.classList.toggle('rv-exp', t >= b));
        });
        // the toast: "5 of 5 exported · Ready to post", and the queue footer reads done
        const to = outCubic(seg(t, T.toast, T.toast + TOAST_IN));
        toastEl.style.opacity = to.toFixed(3);
        toastEl.style.transform = `translate(-50%, ${((1 - to) * -14).toFixed(2)}px)`;
        app.classList.toggle('rv-all', t >= T.ready);
      },
      // the pointer: it sets off from the viewer for Render All, presses it, and fades as the jobs run.
      // In the section's px (the full-frame window is the whole section by then).
      pointer(t) {
        if (t < T.ptr - 0.15 || t > T.press + 0.8) return null;
        const W = x.root.offsetWidth, s = W / AW;
        const bp = btnPt();
        const from = { x: bp.x - (tallMode ? 230 : 420), y: bp.y - (tallMode ? 260 : 200) };
        const m = inOutCubic(seg(t, T.ptr, T.arrive));
        const v = seg(t, T.ptr - 0.15, T.ptr) * (1 - seg(t, T.press + 0.5, T.press + 0.8));
        return { x: lerp(from.x, bp.x, m) * s, y: lerp(from.y, bp.y, m) * s, p: press(t, T.press), v };
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1; // the camera's scale on the card
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is (it lands
        // while the thread is still gliding up), so it never draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
