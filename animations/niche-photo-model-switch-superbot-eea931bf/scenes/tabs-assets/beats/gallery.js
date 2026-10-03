// Gallery beat, the finale: superbot delivers the wedding to the client in Pixieset Client Gallery. Its line streams,
// a connect card lands in the chat ("superbot connected to Pixieset", "Created "Emma & James" collection", then three
// checks ticking in turn: "Uploading 624 photos to 4 sets", "Cover set to first-look-0412.jpg", "Client email drafted")
// with a mini Pixieset window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW), the
// grammar of the template finale (and the source's play.js). Full frame is superbot's connected view of Pixieset: a
// thin superbot strip across the top ("superbot", "connected to Pixieset") over Pixieset's photographer dashboard,
// light theme, on the collection page (modeled on the help centre's screenshots of the real UI): the top bar (the
// Pixieset wordmark and the "Client Gallery" product switcher), the collection header ("Emma & James", "September 26,
// 2026", the DRAFT status pill, More, Preview, the teal Share split button), the left panel (the cover photo, the four
// panel tabs, PHOTOS with the four sets and their counts) and the set's photo grid, filling in as the uploads land
// while a progress line climbs to "624 of 624 uploaded". The pointer clicks Share; the Share Collection dialog opens
// over a scrim (the composer on the left, the email preview on the right): the recipient chip "Emma Hale", the
// subject and a two-line message land, Send turns active and is clicked, the dialog closes, the status pill reads
// PUBLISHED and the snackbar "Gallery sent to Emma" rises in the empty band under the grid. It gives way to the
// payoff in the same band: superbot's job-done summary ("Done in one prompt", three checked lines: "3,412 photos
// culled to 624", "Edited to one look", "Gallery sent to Emma Hale"), .px-note; the final state holds (READ) on it
// before the end card. Only the pointer presses controls (Share, Send), and each one visibly does something.
//
// There is ONE Pixieset window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) Pixieset takes its narrow layout: the left panel
// collapses to its icon strip, the cover becomes a banner over the set tabs, the grid drops to four columns, the
// dialog to its composer and the summary stacks its lines. The landing (the window reaching full frame, T.full) is
// marked by .px-land: opacity 0 before, 1 from T.full on, the element the render's chime bisect reads; .px-note (the
// summary) is the last element to settle: its opacity reaches 1 as its last line lands. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, outBack, streamCount, press } from '../../../lib.js';

const SAY = 'Delivering the gallery in Pixieset.';
const COLL = 'Emma & James';
const DATE = 'September 26, 2026';
const COVER = 'first-look-0412.jpg';
const STUDIO = 'Marlow Studio';                  // the photographer's own brand, on the email preview (made up)
// the four sets and their photo counts (they sum to TOTAL)
const SETS = [['Getting Ready', 96], ['Ceremony', 168], ['Portraits', 152], ['Reception', 208]];
const TOTAL = SETS.reduce((a, [, n]) => a + n, 0); // 624
// the set's grid: fifteen distinct frames of the day (p01 is the cover)
const GRID = ['p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16'].map((f) => `${f}.jpg`);
const TO = 'Emma Hale';
const SUBJ = 'Your wedding gallery is ready';
const MSG = ['Hi Emma, your photos from September 26 are ready to view.', 'Favorite the ones you love and share them with family.'];
// the payoff: superbot's summary of the whole ask, one checked line per hand-off
const SUM = ['3,412 photos culled to 624', 'Edited to one look', 'Gallery sent to Emma Hale'];
const LOGO = 'pixieset-logo.svg';                // the sourced Pixieset wordmark (brand/CREDITS.txt), never redrawn
const MARK = 'pixieset-mark.png';                // Pixieset's own square mark (its touch icon), the card's tile

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
const UP_AT = 0.15;                              // the card landing to the uploads starting (in the mini window)
const UP_TAIL = 1.1;                             // full frame to the last upload landing ("624 of 624 uploaded")
const TILE_IN = 0.2;                             // a grid photo fading in as its upload lands
const PAGE_HOLD = 0.35;                          // uploads done: the page reads before the pointer sets off
const PTR_MOVE = 0.45;                           // the pointer travelling to a target
const PRESS_AT = 0.05;                           // arrived, then the press
const DLG_AT = 0.1;                              // the press on Share, then the dialog opens
const DLG_IN = 0.22;                             // the scrim and the dialog fading and scaling in
const TO_AT = 0.3;                               // the dialog opening to the recipient chip popping in
const SUBJ_AT = 0.15;                            // the chip to the subject streaming
const TYPE_CPS = 110;                            // the drafted subject and message stream in
const MSG_GAP = 0.08;                            // one streamed line to the next
const READY_AT = 0.1;                            // the message in, then Send turns active
const DONE_LEAD = 0.4;                           // the pointer sets off for Send this long before it turns active
const DONE_PRESS = 0.12;                         // Send active, then the press
const CLOSE_AT = 0.08;                           // the press, then the dialog closes
const DLG_OUT = 0.18;                            // the dialog and scrim fading out
const SENT_AT = 0.05;                            // closing, then sent: PUBLISHED and the snackbar
const SNACK_IN = 0.2;                            // the snackbar rising in
const SUM_AT = 0.9;                              // sent, then superbot's summary takes the band (the snackbar gives way)
const SUM_IN = 0.5;                              // the summary fading and rising in (.px-note reaches 1 at its end)
const LINE_AT = 0.1, LINE_STAGGER = 0.12;        // the summary's three checks popping in turn, inside SUM_IN
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = '') => `<svg class="px-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  back: svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
  caret: svg('<path d="m7 10 5 5 5-5"/>'),
  search: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 4.5 4.5"/>'),
  help: svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.6a2.4 2.4 0 0 1 4.6.8c0 1.6-2.3 2-2.3 3.5"/><circle cx="12" cy="16.9" r=".55" class="px-fl"/>'),
  bell: svg('<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10.2 20a2 2 0 0 0 3.6 0"/>'),
  photo: svg('<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="m4.5 16.5 4.5-4.5 3.5 3.5 2.5-2.5 4.5 4.5"/><circle cx="15.5" cy="9.5" r="1.3"/>'),
  brush: svg('<path d="M19.5 4.5 11 13l-2-2 8.5-8.5"/><path d="M9 11a3 3 0 0 0-3 3c0 1.8-1 3-2 3.5 2.6 1 6.5.6 7.5-2.5L13 13"/>'),
  gear: svg('<circle cx="12" cy="12" r="2.6"/><path d="M10.6 3.8h2.8l.5 2.3 1.6.9 2.2-.8 1.4 2.4-1.7 1.6v1.6l1.7 1.6-1.4 2.4-2.2-.8-1.6.9-.5 2.3h-2.8l-.5-2.3-1.6-.9-2.2.8-1.4-2.4 1.7-1.6v-1.6L4.8 8.6l1.4-2.4 2.2.8 1.6-.9z"/>'),
  feed: svg('<path d="M5.5 5.5a13 13 0 0 1 13 13M5.5 10.5a8 8 0 0 1 8 8"/><circle cx="6.5" cy="17.5" r="1.4" class="px-fl"/>'),
  plus: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8.5v7M8.5 12h7"/>'),
  sort: svg('<path d="M7 5v14M4 16l3 3 3-3M13 7h7M13 11h5.5M13 15h4"/>'),
  grid: svg('<rect x="4.5" y="4.5" width="15" height="15" rx="1"/><path d="M12 4.5v15M4.5 12h15"/>'),
  drag: svg('<path d="M5 10h14M5 14h14"/>'),
  more: svg('<circle cx="6" cy="12" r="1.3" class="px-fl"/><circle cx="12" cy="12" r="1.3" class="px-fl"/><circle cx="18" cy="12" r="1.3" class="px-fl"/>'),
  mail: svg('<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4 6.5 8 6.5 8-6.5"/>'),
  link: svg('<path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"/>'),
  user: svg('<circle cx="12" cy="9" r="3.5"/><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/>'),
  close: svg('<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>'),
  collapse: svg('<path d="m12 6.5-5.5 5.5 5.5 5.5M18 6.5 12.5 12l5.5 5.5"/>'),
  expand: svg('<path d="m6 6.5 5.5 5.5L6 17.5M12 6.5l5.5 5.5-5.5 5.5"/>'),
  check: svg('<circle cx="12" cy="12" r="9" class="px-fl"/><path d="m7.8 12.3 2.8 2.8 5.6-5.6" class="px-wk"/>'),
  tick: svg('<path d="m6 12.5 4 4 8-9"/>'),
  ck: '<svg class="px-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
const TABS = ['photo', 'brush', 'gear', 'feed'];
// an element's position in the window's own px, transform-free (offsets up to the window)
const offIn = (el, root) => {
  let px = 0, py = 0, n = el;
  while (n && n !== root) { px += n.offsetLeft; py += n.offsetTop; n = n.offsetParent; }
  return { x: px, y: py, w: el.offsetWidth, h: el.offsetHeight };
};
// the uploads: n of TOTAL landed at progress u (eased, so the count starts brisk and settles on 624)
const upCount = (u) => Math.round(TOTAL * (u < 1 ? 1 - Math.pow(1 - u, 1.6) : 1));

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // uploading, cover, email: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame: the collection page (the chime: .px-land)
    T.up = T.card + UP_AT;                            // the uploads start, in the mini window
    T.upEnd = T.full + UP_TAIL;                       // "624 of 624 uploaded"
    T.ptr1 = T.upEnd + PAGE_HOLD;                     // the pointer sets off for Share
    T.arr1 = T.ptr1 + PTR_MOVE;
    T.press1 = T.arr1 + PRESS_AT;
    T.dlg = T.press1 + DLG_AT;                        // the Share Collection dialog opens over its scrim
    T.to = T.dlg + TO_AT;                             // the recipient chip "Emma Hale"
    T.subj = T.to + SUBJ_AT;                          // the subject streams
    T.msg = [];                                       // the two message lines stream
    let e = T.subj + SUBJ.length / TYPE_CPS;
    MSG.forEach((m) => { T.msg.push(e + MSG_GAP); e = e + MSG_GAP + m.length / TYPE_CPS; });
    T.ready = e + READY_AT;                           // the draft is in: Send turns active
    T.ptr2 = T.ready - DONE_LEAD;                     // the pointer sets off for Send
    T.arr2 = T.ptr2 + PTR_MOVE;
    T.press2 = T.ready + DONE_PRESS;
    T.close = T.press2 + CLOSE_AT;                    // the dialog closes
    T.sent = T.close + SENT_AT;                       // PUBLISHED, "Gallery sent to Emma"
    T.sum = T.sent + SUM_AT;                          // superbot's summary takes the band (.px-note)
    T.line = SUM.map((_, i) => T.sum + LINE_AT + i * LINE_STAGGER); // its three checks pop in turn
    T.note = T.sum;
    T.settle = Math.max(T.sum + SUM_IN, T.line[2] + POP);
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const im = (f, cls = '') => `<img class="${cls}" src="${x.img(f)}" alt="" decoding="sync"/>`;
    const sbMark = `<span class="px-sbm"><img src="${x.sbSrc}" alt=""/></span>`;

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say px-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      ['<span class="px-ct-i px-ct-n">624</span>', 'Uploading <b>624</b> photos to <b>4</b> sets'],
      [`<span class="px-ct-i px-ct-v">${im('p01.jpg')}</span>`, `Cover set to <b>${esc(COVER)}</b>`],
      [`<span class="px-ct-i px-ct-m">${I.mail}</span>`, 'Client email drafted'],
    ];
    const card = x.el(`<div class="px-card">
      <div class="px-ch">
        <span class="px-ct-l"><img src="${x.brand(MARK)}" alt=""/></span>
        <div class="px-ct-h"><b>superbot connected to Pixieset</b><span>Created <b>"${esc(COLL)}"</b> collection</span></div>
      </div>
      ${steps.map(([icon, txt]) => `<div class="px-step">${icon}<span class="px-tx">${txt}</span><span class="px-ok"><i class="px-spin"></i>${I.ck}</span></div>`).join('')}
      <div class="px-shot"></div>
    </div>`);
    const shot = card.querySelector('.px-shot');
    const checks = [...card.querySelectorAll('.px-ok')].map((n) => ({ spin: n.querySelector('.px-spin'), ck: n.querySelector('.px-ck') }));

    // ---- the full-frame window: superbot's strip over Pixieset's collection page in Client Gallery ----
    const layer = x.el(`<div class="px-full" aria-hidden="true"><div class="px-app">
      <div class="px-sb">${sbMark}<b>superbot</b><span class="px-sbd"></span><span>connected to Pixieset</span><span class="px-sbl"><i></i>Live</span></div>
      <header class="px-top">
        <img class="px-logo" src="${x.brand(LOGO)}" alt=""/>
        <span class="px-prod">Client Gallery${I.caret}</span>
        <div class="px-tr">${I.search}${I.help}${I.bell}<span class="px-av">M</span></div>
      </header>
      <div class="px-head">
        <span class="px-back">${I.back}</span>
        <div class="px-ttl"><b>${esc(COLL)}</b><span>${esc(DATE)}</span></div>
        <span class="px-st"><span class="px-st1">Draft</span><span class="px-st2">Published</span>${I.caret}</span>
        <span class="px-hsp"></span>
        <span class="px-more">More${I.caret}</span>
        <span class="px-prev">Preview</span>
        <span class="px-share"><b>Share</b><i></i>${I.caret}</span>
      </div>
      <div class="px-body">
        <aside class="px-side">
          <div class="px-cov">${im('p01.jpg')}</div>
          <div class="px-tabs">${TABS.map((ic, i) => `<span class="px-tab${i === 0 ? ' on' : ''}">${I[ic]}</span>`).join('')}</div>
          <div class="px-sh"><span>Photos</span><span class="px-add">${I.plus}Add Set</span></div>
          ${SETS.map(([s], i) => `<div class="px-set${i === 0 ? ' on' : ''}">${I.drag}<span>${esc(s)} (<b class="px-sn">0</b>)</span>${i === 0 ? I.more : ''}</div>`).join('')}
          <span class="px-col">${I.collapse}</span>
        </aside>
        <nav class="px-rail">${TABS.map((ic, i) => `<span class="px-tab${i === 0 ? ' on' : ''}">${I[ic]}</span>`).join('')}<span class="px-col">${I.expand}</span></nav>
        <main class="px-main">
          <div class="px-banner">${im('p01.jpg')}</div>
          <div class="px-stabs">${SETS.map(([s], i) => `<span class="px-stab${i === 0 ? ' on' : ''}">${esc(s)} <b class="px-sn">0</b></span>`).join('')}</div>
          <div class="px-mh"><h1>${esc(SETS[0][0])}</h1><span class="px-ic">${I.sort}${I.grid}</span><span class="px-addm">${I.plus}Add Media</span></div>
          <div class="px-prog"><span class="px-pi"><i class="px-pspin"></i>${I.check}</span><span class="px-pt"><b class="px-pn">0</b> of ${TOTAL} uploaded</span><i class="px-pbar"><b></b></i></div>
          <div class="px-grid">${GRID.map((f) => `<div class="px-cell">${im(f)}</div>`).join('')}</div>
          <div class="px-foot">
            <span class="px-snack">${I.check}Gallery sent to Emma</span>
            <div class="px-sum px-note">
              <div class="px-sumh">${sbMark}<b>Done in one prompt</b></div>
              <div class="px-suml">${SUM.map((l) => `<span class="px-sl"><span class="px-slc">${I.check}</span>${esc(l)}</span>`).join('')}</div>
            </div>
          </div>
        </main>
      </div>
      <div class="px-scrim"></div>
      <div class="px-dw"><div class="px-dlg">
        <div class="px-dh"><span class="px-dx">${I.close}</span><h3>Share Collection</h3><span class="px-dsp"></span><span class="px-dl">${I.link}Direct link</span></div>
        <div class="px-db">
          <div class="px-cmp">
            <div class="px-to"><span class="px-tl">To:</span><span class="px-chip">${I.user}<b>${esc(TO)}</b></span></div>
            <div class="px-subj"><span class="px-v"></span><span class="px-h">${esc(SUBJ)}</span></div>
            <div class="px-msg">${MSG.map((m) => `<p><span class="px-v"></span><span class="px-h">${esc(m)}</span></p>`).join('')}</div>
            <div class="px-sp"></div>
            <div class="px-df">
              <div class="px-inc"><span>Include collection info:</span><span class="px-cb">${I.tick}</span><span>Download PIN</span></div>
              <span class="px-send"><b>Send</b><i></i>${I.caret}</span>
            </div>
          </div>
          <div class="px-pvw"><div class="px-em">
            <span class="px-emb">${esc(STUDIO)}</span>
            <span class="px-emt">${esc(COLL)}</span>
            <div class="px-emc">${im('p01.jpg')}</div>
            <span class="px-emv">View gallery</span>
          </div></div>
        </div>
      </div></div>
      <i class="px-land"></i>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const q = (s) => app.querySelector(s), qa = (s) => [...app.querySelectorAll(s)];
    const strm = (n) => ({ v: n.querySelector('.px-v'), h: n.querySelector('.px-h'), text: n.querySelector('.px-h').textContent, shown: -1 });
    const E = {
      share: q('.px-share'), st: q('.px-st'), st1: q('.px-st1'), st2: q('.px-st2'),
      sn: qa('.px-side .px-sn'), stn: qa('.px-stabs .px-sn'),
      cells: qa('.px-cell img'),
      pn: q('.px-pn'), pbar: q('.px-pbar b'), pspin: q('.px-pspin'), pchk: q('.px-pi .px-i'), prog: q('.px-prog'),
      snack: q('.px-snack'), sum: q('.px-sum'), lines: qa('.px-slc'),
      scrim: q('.px-scrim'), dlg: q('.px-dlg'), chip: q('.px-chip'),
      subj: strm(q('.px-subj')), msg: qa('.px-msg p').map(strm), send: q('.px-send'), land: q('.px-land'),
    };
    // the window's UI type is Figtree (vendored, gallery.css): ask for every weight it uses up front
    if (document.fonts && document.fonts.load) ['400', '500', '600'].forEach((w) => document.fonts.load(`${w} 14px "Figtree PX"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tall = false;
    let AW = 1280, AH = 720;
    let tgt = null;                                  // the pointer's targets (Share, Send) in the window's px

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes Pixieset's narrow layout
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
      app.classList.toggle('px-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('px-tall', tall);
      tgt = null;
      return true;
    };
    // a target's centre in the window's px
    const ctr = (el, fx = 0.5, fy = 0.5) => { const b = offIn(el, app); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
    const op = (n, v) => { n.style.opacity = v.toFixed(3); };
    const pop = (n, t, a) => { const o = outCubic(seg(t, a, a + POP)); op(n, o); n.style.transform = o >= 1 ? '' : `scale(${lerp(0.4, 1, o).toFixed(4)})`; };
    const streamTo = (s, t0, t) => {
      const n = streamCount(s.text, t0, TYPE_CPS, t);
      if (n !== s.shown) { s.v.textContent = s.text.slice(0, n); s.h.textContent = s.text.slice(n); s.shown = n; }
    };
    const setText = (n, v) => { const s = String(v); if (n.textContent !== s) n.textContent = s; };
    // the pointer's targets, measured with the dialog laid out (it is display:none while closed); kept per frame size
    const targets = () => {
      if (tgt) return tgt;
      const dw = E.dlg.parentNode, was = dw.style.display;
      dw.style.display = '';
      tgt = { share: ctr(E.share.firstElementChild, 0.5, 0.6), send: ctr(E.send.firstElementChild, 0.5, 0.6) };
      dw.style.display = was;
      return tgt;
    };

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
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          pop(c.ck, t, T.ok[i]);
        });
        if (!ok) return;

        // the landing marker (the chime): 0 before full frame, 1 from it
        E.land.style.opacity = t >= T.full ? '1' : '0';

        // the uploads: the count climbs to 624, the sets fill in order, the grid's photos land one by one
        const got = upCount(seg(t, T.up, T.upEnd));
        setText(E.pn, got);
        E.pbar.style.transform = `scaleX(${(got / TOTAL).toFixed(4)})`;
        let left = got;
        SETS.forEach(([, c], i) => { const v = Math.max(0, Math.min(c, left)); left -= v; setText(E.sn[i], v); setText(E.stn[i], v); });
        E.prog.classList.toggle('px-done', t >= T.upEnd);
        E.pspin.style.opacity = t >= T.upEnd ? '0' : '1';
        E.pspin.style.transform = `rotate(${((t - T.up) * 400).toFixed(1)}deg)`;
        pop(E.pchk, t, T.upEnd);
        const nc = E.cells.length;
        E.cells.forEach((c, i) => {
          // the grid's photos land across the upload, in order, the last one just before "624 of 624"
          const a = lerp(T.up + 0.1, T.upEnd - TILE_IN, i / (nc - 1));
          const v = outCubic(seg(t, a, a + TILE_IN));
          op(c, v);
          c.style.transform = v >= 1 ? '' : `scale(${lerp(0.94, 1, v).toFixed(4)})`;
        });

        // Share: hover tint while the pointer is on it, the press
        const hov = seg(t, T.arr1 - 0.08, T.arr1) * (1 - seg(t, T.dlg, T.dlg + 0.15));
        const p1 = press(t, T.press1);
        E.share.style.filter = hov > 0 ? `brightness(${(1 - 0.08 * hov - 0.06 * p1).toFixed(3)})` : '';
        E.share.style.transform = p1 > 0 ? `scale(${(1 - 0.04 * p1).toFixed(4)})` : '';

        // the dialog: scrim and card in, the draft lands (chip, subject, message), Send turns active and is pressed
        const din = outCubic(seg(t, T.dlg, T.dlg + DLG_IN)) * (1 - seg(t, T.close, T.close + DLG_OUT));
        const open = t >= T.dlg && t < T.close + DLG_OUT;
        E.scrim.style.display = open ? '' : 'none';
        E.dlg.parentNode.style.display = open ? '' : 'none';
        E.scrim.style.opacity = din.toFixed(3);
        E.dlg.style.opacity = din.toFixed(3);
        const ds = t < T.close ? lerp(0.96, 1, outCubic(seg(t, T.dlg, T.dlg + DLG_IN))) : lerp(1, 0.98, seg(t, T.close, T.close + DLG_OUT));
        E.dlg.style.transform = ds >= 1 ? '' : `scale(${ds.toFixed(4)})`;
        const cp = seg(t, T.to, T.to + 0.22);
        E.chip.style.opacity = cp.toFixed(3);
        E.chip.style.transform = cp >= 1 ? '' : `scale(${lerp(0.7, 1, outBack(cp)).toFixed(4)})`;
        streamTo(E.subj, T.subj, t);
        E.msg.forEach((m, i) => streamTo(m, T.msg[i], t));
        E.send.classList.toggle('on', t >= T.ready);
        const p2 = press(t, T.press2);
        E.send.style.transform = p2 > 0 ? `scale(${(1 - 0.05 * p2).toFixed(4)})` : '';

        // sent: the status pill reads PUBLISHED, the snackbar rises in the band under the grid
        E.st.classList.toggle('px-pub', t >= T.sent);
        const sp = seg(t, T.sent, T.sent + 0.2);
        E.st1.style.opacity = (1 - sp).toFixed(3);
        E.st2.style.opacity = sp.toFixed(3);
        const si = outCubic(seg(t, T.sent, T.sent + SNACK_IN)) * (1 - seg(t, T.sum - 0.15, T.sum + 0.05));
        E.snack.style.opacity = si.toFixed(3);
        E.snack.style.transform = `translateY(${((1 - outCubic(seg(t, T.sent, T.sent + SNACK_IN))) * 14).toFixed(2)}px)`;

        // the payoff: superbot's summary takes the band (.px-note), its three checks pop in turn
        const su = outCubic(seg(t, T.sum, T.sum + SUM_IN));
        E.sum.style.opacity = t >= T.settle ? '1' : Math.min(su, 0.999).toFixed(3); // exactly 1 from T.settle (the bisect)
        E.sum.style.transform = su >= 1 ? '' : `translateY(${((1 - su) * 12).toFixed(2)}px)`;
        E.lines.forEach((c, i) => pop(c, t, T.line[i]));
      },
      // the pointer: from the page to Share (press), to the dialog's Send (press), then it fades. In the section's
      // px (the full-frame window is the whole section by then).
      pointer(t) {
        if (!geo || t < T.ptr1 - 0.15 || t > T.press2 + 0.5) return null;
        const s = x.root.offsetWidth / AW;
        const { share, send } = targets();
        let p = { x: share.x - (tall ? 170 : 300), y: share.y + (tall ? 300 : 260) };
        const go = (to, a, b) => { const m = inOutCubic(seg(t, a, b)); p = { x: lerp(p.x, to.x, m), y: lerp(p.y, to.y, m) }; };
        go(share, T.ptr1, T.arr1);
        go(send, T.ptr2, T.arr2);
        const v = seg(t, T.ptr1 - 0.15, T.ptr1) * (1 - seg(t, T.press2 + 0.25, T.press2 + 0.5));
        const pr = Math.max(press(t, T.press1), press(t, T.press2));
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
