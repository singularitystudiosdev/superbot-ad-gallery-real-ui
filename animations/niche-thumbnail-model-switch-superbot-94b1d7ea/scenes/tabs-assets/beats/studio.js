// Studio beat, the finale: superbot takes the three thumbnails to YouTube Studio and sets up an A/B test. Its line
// streams, a connect card lands in the chat ("superbot connected to YouTube Studio", "Opened "I Camped 3 Nights on a
// Glacier"", "Uploading 3 thumbnails to an A/B test", three checks ticking in turn) with a mini Studio window under it;
// the card holds (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the template finale (and the source's
// play.js). Full frame is YouTube Studio's video Details page, light theme: the top bar, the video's left nav, Title
// and Description, the Thumbnail section with its three options (Upload file, Auto-generated, A/B Testing) and the
// video preview card. The pointer clicks "A/B Testing"; the dialog opens over a scrim ("Thumbnail only" picked) and
// thumbnails A, B and C drop into its three slots, one thin upload bar each; "Done" turns blue and is clicked. The
// Thumbnail section now holds the three thumbnails with an "A/B test running" chip, Save turns blue, the pointer
// clicks it and the snackbar reads "Changes saved". A "6 days later" pill, then the results: each thumbnail's watch
// time share (A 24.1%, B 51.3% with the green Winner badge and border, C 24.6%) and "Winner now shown to all
// viewers"; the final state holds (READ) before the end card.
//
// There is ONE Studio window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) Studio takes its narrow layout: the left nav
// collapses to its icon rail, the search field to its icon, and the preview card stacks under the form, compact.
// The landing (the window reaching full frame, T.full) is marked by .yt-land: opacity 0 before, 1 from T.full on, the
// element the render's chime bisect reads. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, outBack, streamCount, press } from '../../../lib.js';

const SAY = 'Setting up the A/B test in YouTube Studio.';
const VIDEO = 'I Camped 3 Nights on a Glacier';
const FILE = 'iceland_vlog_final.mp4';
const LINK = 'https://youtu.be/q7Lk2mV9xRc';
const DESC = ['Three nights in a tent on an Icelandic glacier.', 'Ice caves, a storm, and the night the ice cracked.'];
const HELP = 'Set a thumbnail that stands out and draws viewers’ attention.';
// the three test thumbnails: letter, image, watch time share (sums to 100), the winner
const THUMBS = [['A', 'thumb-a.jpg', 24.1], ['B', 'thumb-b.jpg', 51.3, true], ['C', 'thumb-c.jpg', 24.6]];
const CHOICES = ['Title only', 'Thumbnail only', 'Title and thumbnail'];
const CHOICE_ON = 1;
const NAV = [['details', 'Details'], ['analytics', 'Analytics'], ['editor', 'Editor'], ['comments', 'Comments'],
  ['subtitles', 'Subtitles'], ['copyright', 'Copyright'], ['earn', 'Earn'], ['clips', 'Clips']];
// the YouTube mark: Simple Icons' "youtube" path (CC0, brand/youtube-raw.svg), in YouTube red
const YT_PATH = 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z';
const YT_MARK = `<svg class="yt-mk" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF0000" d="${YT_PATH}"/></svg>`;

const APP_SCALE = { wide: 1.5, tall: 1.4 };       // full frame: the window's px to frame px

// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const PAGE_HOLD = 0.45;                          // full frame: the Details page reads before the pointer sets off
const PTR_MOVE = 0.45;                           // the pointer travelling to a target
const PRESS_AT = 0.05;                           // arrived, then the press
const DLG_AT = 0.1;                              // the press on "A/B Testing", then the dialog opens
const DLG_IN = 0.22;                             // the scrim and the dialog fading and scaling in
const SLOT_AT = 0.3;                             // the dialog opening to the first thumbnail dropping in
const SLOT_STAGGER = 0.35;                       // one slot to the next (the brief: about 0.35)
const DROP = 0.22;                               // a thumbnail dropping into its slot
const UPLOAD = 0.3;                              // its thin upload bar filling
const DONE_LEAD = 0.4;                           // the pointer sets off for "Done" this long before it turns blue
const DONE_PRESS = 0.12;                         // "Done" turned blue, then the press
const CLOSE_AT = 0.08;                           // the press, then the dialog closes
const DLG_OUT = 0.18;                            // the dialog and scrim fading out
const RUN_AT = 0.05;                             // closing, then the Thumbnail section shows the test
const RUN_IN = 0.25, RUN_STAGGER = 0.06;         // the three test cards fading in
const CHIP_AT = 0.15;                            // "A/B test running" pops after the cards
const SAVE_PTR = 0.1;                            // closing, then the pointer sets off for Save
const SAVED_AT = 0.08;                           // the press on Save, then saved (the snackbar)
const SNACK_IN = 0.2;                            // the snackbar rising in
const SKIP_AT = 0.7;                             // saved, then the "6 days later" pill
const SKIP_IN = 0.15, SKIP_HOLD = 0.6;           // the pill fading in, holding, fading out
const RES_AT = 0.75;                             // the pill landing to the results (while it fades out)
const COUNT = 0.5;                               // the watch time shares counting up, their bars growing
const WIN_AT = 0.5, WIN_IN = 0.25;               // the Winner badge and border on B
const NOTE_AT = 0.7, NOTE_IN = 0.2;              // "Winner now shown to all viewers"
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = '') => `<svg class="yt-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  menu: svg('<path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17"/>'),
  search: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.7"/><circle cx="12" cy="17.2" r=".6" class="yt-fl"/>'),
  create: svg('<rect x="3" y="6" width="12.5" height="12" rx="2"/><path d="m15.5 10.5 5-3v9l-5-3M9.25 9.5v5M6.75 12h5"/>'),
  back: svg('<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>'),
  more: svg('<circle cx="12" cy="5.5" r="1.6" class="yt-fl"/><circle cx="12" cy="12" r="1.6" class="yt-fl"/><circle cx="12" cy="18.5" r="1.6" class="yt-fl"/>'),
  details: svg('<path d="M4 20h4.2L19 9.2 14.8 5 4 15.8z"/><path d="m12.8 7 4.2 4.2"/>'),
  analytics: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8 16.5v-4M12 16.5v-9M16 16.5v-6"/>'),
  editor: svg('<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9h17M3.5 15h17M8 5v4M12 5v4M16 5v4M8 15v4M12 15v4M16 15v4"/>'),
  comments: svg('<path d="M4 4.5h16v11.5H8.5L4 20z"/><path d="M8 9h8M8 12.5h5"/>'),
  subtitles: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10.5 10.2a2.2 2.2 0 1 0 0 3.6M17 10.2a2.2 2.2 0 1 0 0 3.6"/>'),
  copyright: svg('<circle cx="12" cy="12" r="9"/><path d="M14.6 9.6a3.4 3.4 0 1 0 0 4.8"/>'),
  earn: svg('<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.4-.9-1.5-1.5-2.8-1.5-1.6 0-2.8.8-2.8 2.1 0 2.9 5.8 1.5 5.8 4.4 0 1.3-1.3 2.1-3 2.1-1.4 0-2.6-.7-3-1.7M12 6v1.7M12 16.3V18"/>'),
  clips: svg('<circle cx="6.5" cy="6.5" r="2.8"/><circle cx="6.5" cy="17.5" r="2.8"/><path d="M8.6 8.4 20 18.5M8.6 15.6 20 5.5"/>'),
  upload: svg('<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 15v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3"/>'),
  auto: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 16 5-5 4 4 2.5-2.5 5.5 5.5"/><circle cx="15.5" cy="9" r="1.5"/>'),
  ab: svg('<rect x="2.5" y="6" width="8.5" height="12" rx="1.5"/><rect x="13" y="6" width="8.5" height="12" rx="1.5"/><path d="m5 14.5 1.75-5 1.75 5M5.6 12.8h2.3M15.5 9.5v5h1.6a1.25 1.25 0 0 0 0-2.5h-1.6 1.3a1.25 1.25 0 0 0 0-2.5z"/>'),
  close: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
  play: svg('<path d="M8 5.5v13l10.5-6.5z" class="yt-fl"/>'),
  vol: svg('<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" class="yt-fl"/><path d="M15.5 9a4 4 0 0 1 0 6"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"/>'),
  full: svg('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'),
  copy: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  trophy: svg('<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5a3 3 0 0 0 3 4.5M16.5 6h3a3 3 0 0 1-3 4.5M12 13.5v3M8.5 20h7l-1-3.5h-5z"/>'),
  check: svg('<circle cx="12" cy="12" r="9" class="yt-fl"/><path d="m7.8 12.3 2.8 2.8 5.6-5.6" class="yt-wk"/>'),
  caret: svg('<path d="M7 10l5 5 5-5z" class="yt-fl"/>'),
  ck: '<svg class="yt-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
const pct = (v) => `${v.toFixed(1)}%`;
// an element's position in the window's own px, transform-free (offsets up to the window)
const offIn = (el, root) => {
  let px = 0, py = 0, n = el;
  while (n && n !== root) { px += n.offsetLeft; py += n.offsetTop; n = n.offsetParent; }
  return { x: px, y: py, w: el.offsetWidth, h: el.offsetHeight };
};

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // connected, opened, uploading: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame: the Details page (the chime: .yt-land)
    T.ptr1 = T.full + PAGE_HOLD;                      // the pointer sets off for the "A/B Testing" tile
    T.arr1 = T.ptr1 + PTR_MOVE;
    T.press1 = T.arr1 + PRESS_AT;
    T.dlg = T.press1 + DLG_AT;                        // the dialog opens over its scrim
    T.slot = THUMBS.map((_, i) => T.dlg + SLOT_AT + i * SLOT_STAGGER); // A, B, C drop into their slots
    T.ready = T.slot[2] + UPLOAD;                     // the last upload done: "Done" turns blue
    T.ptr2 = T.ready - DONE_LEAD;                     // the pointer sets off for "Done"
    T.arr2 = T.ptr2 + PTR_MOVE;
    T.press2 = T.ready + DONE_PRESS;
    T.close = T.press2 + CLOSE_AT;                    // the dialog closes
    T.run = T.close + RUN_AT;                         // the Thumbnail section shows the test; Save turns blue
    T.chip = T.run + CHIP_AT;                         // "A/B test running"
    T.ptr3 = T.close + SAVE_PTR;                      // the pointer sets off for Save
    T.arr3 = T.ptr3 + PTR_MOVE;
    T.press3 = T.arr3 + PRESS_AT;
    T.saved = T.press3 + SAVED_AT;                    // "Changes saved"
    T.skip = T.saved + SKIP_AT;                       // "6 days later"
    T.skipOut = T.skip + SKIP_IN + SKIP_HOLD;         // ...fading out from here
    T.res = T.skip + RES_AT;                          // the results: the shares count up
    T.win = T.res + WIN_AT;                           // the Winner badge on B
    T.note = T.res + NOTE_AT;                         // "Winner now shown to all viewers"
    T.settle = Math.max(T.res + COUNT, T.win + WIN_IN, T.note + NOTE_IN, T.skipOut + SKIP_IN);
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say yt-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="yt-ct-i yt-ct-s">${YT_MARK}</span>`, '<b>superbot connected to YouTube Studio</b>'],
      [`<span class="yt-ct-i yt-ct-v"><img src="${x.img('raw-a.jpg')}" alt=""/></span>`, `Opened <b>"${esc(VIDEO)}"</b>`],
      ['<span class="yt-ct-i yt-ct-n">3</span>', 'Uploading <b>3</b> thumbnails to an A/B test'],
    ];
    const card = x.el(`<div class="yt-card">
      ${steps.map(([icon, txt]) => `<div class="yt-step">${icon}<span class="yt-tx">${txt}</span><span class="yt-ok"><i class="yt-spin"></i>${I.ck}</span></div>`).join('')}
      <div class="yt-shot"></div>
    </div>`);
    const shot = card.querySelector('.yt-shot');
    const checks = [...card.querySelectorAll('.yt-ok')].map((n) => ({ spin: n.querySelector('.yt-spin'), ck: n.querySelector('.yt-ck') }));

    // ---- the full-frame YouTube Studio window: the video's Details page ----
    const im = (f, cls = '') => `<img class="${cls}" src="${x.img(f)}" alt="" decoding="sync"/>`;
    const layer = x.el(`<div class="yt-full" aria-hidden="true"><div class="yt-app">
      <header class="yt-top">
        <span class="yt-hb">${I.menu}</span>
        <span class="yt-logo">${YT_MARK}<b>Studio</b></span>
        <div class="yt-search">${I.search}<span>Search across your channel</span></div>
        <span class="yt-sic">${I.search}</span>
        <div class="yt-tr"><span class="yt-help">${I.help}</span><span class="yt-create">${I.create}<b>Create</b></span><span class="yt-av">M</span></div>
      </header>
      <div class="yt-body">
        <nav class="yt-nav">
          <div class="yt-back">${I.back}<span>Channel content</span></div>
          <div class="yt-vid">
            <div class="yt-vth">${im('raw-a.jpg')}${im('thumb-b.jpg', 'yt-vth-b')}<span class="yt-dur">18:42</span></div>
            <span class="yt-vl">Your video</span><span class="yt-vt">${esc(VIDEO)}</span>
          </div>
          <ul class="yt-items">${NAV.map(([ic, lab], i) => `<li class="${i === 0 ? 'on' : ''}">${I[ic]}<span>${lab}</span></li>`).join('')}</ul>
        </nav>
        <main class="yt-main">
          <div class="yt-head"><h1>Video details</h1><div class="yt-acts"><span class="yt-undo">Undo changes</span><span class="yt-save">Save</span><span class="yt-more">${I.more}</span></div></div>
          <div class="yt-cols">
            <div class="yt-form">
              <div class="yt-field"><label>Title (required)</label><div class="yt-val">${esc(VIDEO)}</div><span class="yt-cnt">${VIDEO.length}/100</span></div>
              <div class="yt-field yt-f-desc"><label>Description</label><div class="yt-val">${DESC.map(esc).join('<br>')}</div></div>
              <section class="yt-thumb">
                <div class="yt-th-h"><h2>Thumbnail</h2><span class="yt-chip"><i class="yt-dot"></i><span class="yt-c1">A/B test running</span><span class="yt-c2">${I.check}A/B test complete</span></span></div>
                <p class="yt-hlp">${esc(HELP)}</p>
                <div class="yt-area">
                  <div class="yt-opts">
                    <div class="yt-opt">${I.upload}<span>Upload file</span></div>
                    <div class="yt-opt yt-auto"><span class="yt-af">${im('sw-0955.jpg')}${im('sw-1230.jpg')}${im('sw-0712.jpg')}</span><span>Auto-generated</span></div>
                    <div class="yt-opt yt-abt">${I.ab}<span>A/B Testing</span></div>
                  </div>
                  <div class="yt-test">
                    <div class="yt-tcs">${THUMBS.map(([l, f, v, w]) => `<div class="yt-tc${w ? ' yt-tc-w' : ''}">
                      <div class="yt-tci">${im(f)}${w ? `<span class="yt-win">${I.trophy}Winner</span>` : ''}<i class="yt-ring"></i></div>
                      <div class="yt-tcr">
                        <div class="yt-r1"><b class="yt-rn">Thumbnail ${l}</b><span class="yt-rs">Testing</span></div>
                        <div class="yt-r2"><span class="yt-pl"><i class="yt-tl">${l}</i><b class="yt-pct">${pct(v)}</b></span><span class="yt-rs">Watch time share</span></div>
                      </div>
                      <i class="yt-bar"><b></b></i>
                    </div>`).join('')}</div>
                    <div class="yt-note">${I.check}<span>Winner now shown to all viewers</span></div>
                  </div>
                </div>
              </section>
              <section class="yt-pl-s">
                <h2>Playlists</h2>
                <p class="yt-hlp">Add your video to one or more playlists to organize your content for viewers.</p>
                <div class="yt-sel"><span>Select</span>${I.caret}</div>
              </section>
            </div>
            <aside class="yt-side"><div class="yt-pv">
              <div class="yt-player">${im('raw-a.jpg')}<div class="yt-ctl"><i class="yt-prog"><b></b></i><div class="yt-cb">${I.play}${I.vol}<span>0:00 / 18:42</span><span class="yt-sp"></span>${I.gear}${I.full}</div></div></div>
              <div class="yt-meta">
                <div class="yt-mr"><div><label>Video link</label><span class="yt-link">${esc(LINK)}</span></div>${I.copy}</div>
                <div class="yt-mr"><div><label>Filename</label><span>${esc(FILE)}</span></div></div>
              </div>
            </div></aside>
          </div>
        </main>
      </div>
      <div class="yt-snack">Changes saved</div>
      <div class="yt-scrim"></div>
      <div class="yt-dw"><div class="yt-dlg">
        <div class="yt-dh"><h3>A/B Testing</h3><span class="yt-dx">${I.close}</span></div>
        <div class="yt-db">
          <div class="yt-ch">${CHOICES.map((c, i) => `<div class="yt-co${i === CHOICE_ON ? ' on' : ''}"><i class="yt-rad"></i><span>${c}</span></div>`).join('')}</div>
          <p class="yt-dp">Upload up to 3 thumbnails to test.</p>
          <div class="yt-slots">${THUMBS.map(([l, f]) => `<div class="yt-slot">
            <div class="yt-sf"><div class="yt-se">${I.upload}</div>${im(f, 'yt-si')}</div>
            <i class="yt-up"><b></b></i>
            <span class="yt-sl">Thumbnail ${l}</span>
          </div>`).join('')}</div>
        </div>
        <div class="yt-df"><span class="yt-dc">Cancel</span><span class="yt-done">Done</span></div>
      </div></div>
      <div class="yt-sw"><span class="yt-skip">${I.clock}6 days later</span></div>
      <i class="yt-land"></i>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const q = (s) => app.querySelector(s), qa = (s) => [...app.querySelectorAll(s)];
    const E = {
      abt: q('.yt-abt'), area: q('.yt-area'), opts: q('.yt-opts'), test: q('.yt-test'), save: q('.yt-save'), undo: q('.yt-undo'),
      chip: q('.yt-chip'), dot: q('.yt-dot'), c1: q('.yt-c1'), c2: q('.yt-c2'), note: q('.yt-note'),
      tcs: qa('.yt-tc').map((n) => ({ n, r1: n.querySelector('.yt-r1'), r2: n.querySelector('.yt-r2'), pct: n.querySelector('.yt-pct'), bar: n.querySelector('.yt-bar b'), win: n.querySelector('.yt-win'), ring: n.querySelector('.yt-ring') })),
      vthB: q('.yt-vth-b'), snack: q('.yt-snack'), scrim: q('.yt-scrim'), dlg: q('.yt-dlg'), done: q('.yt-done'),
      slots: qa('.yt-slot').map((n) => ({ img: n.querySelector('.yt-si'), se: n.querySelector('.yt-se'), up: n.querySelector('.yt-up'), bar: n.querySelector('.yt-up b'), sf: n.querySelector('.yt-sf') })),
      skip: q('.yt-skip'), land: q('.yt-land'),
    };
    // the window's UI type is Roboto (vendored, studio.css): ask for every weight it uses up front
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto YT"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tall = false;
    let AW = 1280, AH = 720;

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes Studio's narrow layout
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return false;
      const key = `${W}x${H}`;
      if (key === geo) return true;
      geo = key;
      tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('yt-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('yt-tall', tall);
      return true;
    };
    // a target's centre in the window's px
    const ctr = (el, fx = 0.5, fy = 0.5) => { const b = offIn(el, app); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
    const op = (n, v) => { n.style.opacity = v.toFixed(3); };
    const upY = (n, v, dy) => { n.style.transform = v >= 1 ? '' : `translateY(${((1 - v) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ok = layout();
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
        if (!ok) return;

        // the landing marker (the chime): 0 before full frame, 1 from it
        E.land.style.opacity = t >= T.full ? '1' : '0';

        // the "A/B Testing" tile: hover tint while the pointer is on it, the press
        const hov = seg(t, T.arr1 - 0.08, T.arr1) * (1 - seg(t, T.dlg, T.dlg + 0.15));
        const p1 = press(t, T.press1);
        E.abt.style.backgroundColor = hov > 0 ? `rgba(6, 95, 212, ${(0.05 * hov + 0.08 * p1).toFixed(3)})` : '';
        E.abt.style.borderColor = hov > 0 ? `rgba(6, 95, 212, ${(0.6 * hov).toFixed(3)})` : '';
        E.abt.style.transform = p1 > 0 ? `scale(${(1 - 0.03 * p1).toFixed(4)})` : '';

        // the dialog: scrim and card in, the three slots fill, "Done" turns blue and is pressed, then out
        const din = outCubic(seg(t, T.dlg, T.dlg + DLG_IN)) * (1 - seg(t, T.close, T.close + DLG_OUT));
        const open = t >= T.dlg && t < T.close + DLG_OUT;
        E.scrim.style.display = open ? '' : 'none';
        E.dlg.parentNode.style.display = open ? '' : 'none';
        E.scrim.style.opacity = din.toFixed(3);
        E.dlg.style.opacity = din.toFixed(3);
        const ds = t < T.close ? lerp(0.96, 1, outCubic(seg(t, T.dlg, T.dlg + DLG_IN))) : lerp(1, 0.98, seg(t, T.close, T.close + DLG_OUT));
        E.dlg.style.transform = ds >= 1 ? '' : `scale(${ds.toFixed(4)})`;
        E.slots.forEach((s, i) => {
          const a = T.slot[i];
          const d = outCubic(seg(t, a, a + DROP));
          op(s.img, d);
          s.img.style.transform = d >= 1 ? '' : `scale(${lerp(1.12, 1, d).toFixed(4)})`;
          s.se.style.opacity = (1 - d).toFixed(3);
          s.sf.classList.toggle('on', t >= a);
          const u = seg(t, a, a + UPLOAD);
          s.bar.style.transform = `scaleX(${u.toFixed(4)})`;
          s.up.style.opacity = t < a ? '0' : (1 - seg(t, a + UPLOAD + 0.05, a + UPLOAD + 0.2)).toFixed(3);
        });
        E.done.classList.toggle('on', t >= T.ready);
        const p2 = press(t, T.press2);
        E.done.style.transform = p2 > 0 ? `scale(${(1 - 0.05 * p2).toFixed(4)})` : '';

        // the Thumbnail section: the three options give way to the test (crossfade), the chip pops
        const ri = outCubic(seg(t, T.run, T.run + RUN_IN));
        E.opts.style.opacity = (1 - ri).toFixed(3);
        E.opts.style.visibility = ri >= 1 ? 'hidden' : '';
        E.test.style.visibility = t >= T.run ? '' : 'hidden';
        // the section grows from the options' height to the test's as they swap (the page below moves with it)
        // (the note's row is only made room for as the note lands with the results)
        const noteH = (E.note.offsetHeight + E.note.offsetTop - E.note.previousElementSibling.offsetTop - E.note.previousElementSibling.offsetHeight) * (1 - inOutCubic(seg(t, T.note - 0.1, T.note + NOTE_IN)));
        const ah = lerp(E.opts.offsetHeight, E.test.offsetHeight - noteH, inOutCubic(seg(t, T.run, T.run + RUN_IN)));
        E.area.style.height = `${ah.toFixed(2)}px`;
        E.tcs.forEach((c, i) => {
          const v = outCubic(seg(t, T.run + i * RUN_STAGGER, T.run + i * RUN_STAGGER + RUN_IN));
          op(c.n, v); upY(c.n, v, 8);
        });
        const cp = seg(t, T.chip, T.chip + 0.22);
        E.chip.style.opacity = cp.toFixed(3);
        E.chip.style.transform = cp >= 1 ? '' : `scale(${lerp(0.7, 1, outBack(cp)).toFixed(4)})`;
        const done = seg(t, T.res, T.res + 0.2);
        E.c1.style.opacity = (1 - done).toFixed(3);
        E.c2.style.opacity = done.toFixed(3);
        E.chip.classList.toggle('yt-chip-ok', t >= T.res);
        E.dot.style.opacity = t >= T.res ? '0' : (0.55 + 0.45 * Math.cos((t - T.chip) * Math.PI * 2.2)).toFixed(3);

        // Save: blue while there are unsaved changes, the press, back to grey when saved; the snackbar
        const dirty = t >= T.run && t < T.saved;
        E.save.classList.toggle('on', dirty);
        E.undo.classList.toggle('on', dirty);
        const p3 = press(t, T.press3);
        E.save.style.transform = p3 > 0 ? `scale(${(1 - 0.05 * p3).toFixed(4)})` : '';
        const si = outCubic(seg(t, T.saved, T.saved + SNACK_IN)) * (1 - seg(t, T.skip - 0.15, T.skip));
        E.snack.style.opacity = si.toFixed(3);
        E.snack.style.transform = `translateY(${((1 - outCubic(seg(t, T.saved, T.saved + SNACK_IN))) * 16).toFixed(2)}px)`;

        // "6 days later"
        const ki = outCubic(seg(t, T.skip, T.skip + SKIP_IN)) * (1 - seg(t, T.skipOut, T.skipOut + SKIP_IN));
        E.skip.style.opacity = ki.toFixed(3);
        E.skip.style.transform = `scale(${lerp(0.9, 1, outCubic(seg(t, T.skip, T.skip + SKIP_IN))).toFixed(4)})`;

        // the results: the shares count up and their bars grow, B's Winner badge and border, the note
        const cn = outCubic(seg(t, T.res, T.res + COUNT));
        const w = outCubic(seg(t, T.win, T.win + WIN_IN));
        E.tcs.forEach((c, i) => {
          const v = THUMBS[i][2];
          c.r1.style.opacity = (1 - done).toFixed(3);
          c.r2.style.opacity = done.toFixed(3);
          const txt = pct(t >= T.res + COUNT ? v : v * cn);
          if (c.pct.textContent !== txt) c.pct.textContent = txt;
          c.bar.style.transform = `scaleX(${((v / 100) * cn).toFixed(4)})`;
          c.bar.parentNode.style.opacity = done.toFixed(3);
          if (c.win) {
            c.win.style.opacity = w.toFixed(3);
            c.win.style.transform = w >= 1 ? '' : `scale(${lerp(0.6, 1, outBack(w)).toFixed(4)})`;
            c.ring.style.opacity = w.toFixed(3);
            c.n.classList.toggle('yt-won', t >= T.win);
          }
        });
        const ni = outCubic(seg(t, T.note, T.note + NOTE_IN));
        op(E.note, ni); upY(E.note, ni, 6);
        // the winner is now the video's thumbnail: the nav's thumbnail swaps to B with the note
        E.vthB.style.opacity = ni.toFixed(3);
      },
      // the pointer: from the page to the "A/B Testing" tile (press), to the dialog's "Done" (press), to Save (press),
      // then it fades. In the section's px (the full-frame window is the whole section by then).
      pointer(t) {
        if (!geo || t < T.ptr1 - 0.15 || t > T.press3 + 0.5) return null;
        const s = x.root.offsetWidth / AW;
        const tile = ctr(E.abt, 0.5, 0.55), done = ctr(E.done, 0.45, 0.6), save = ctr(E.save, 0.45, 0.6);
        let p = { x: Math.min(AW - 60, tile.x + (tall ? 140 : 260)), y: tile.y - (tall ? 230 : 250) };
        const go = (to, a, b) => { const m = inOutCubic(seg(t, a, b)); p = { x: lerp(p.x, to.x, m), y: lerp(p.y, to.y, m) }; };
        go(tile, T.ptr1, T.arr1);
        go(done, T.ptr2, T.arr2);
        go(save, T.ptr3, T.arr3);
        const v = seg(t, T.ptr1 - 0.15, T.ptr1) * (1 - seg(t, T.press3 + 0.25, T.press3 + 0.5));
        const pr = Math.max(press(t, T.press1), press(t, T.press2), press(t, T.press3));
        return { x: p.x * s, y: p.y * s, p: pr, v };
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame (play.js)
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
