// Spotify beat, the finale: superbot publishes episode 42 on the user's own Spotify for Creators account. Its line
// streams and a Spotify-styled account connection sheet lands in the chat as a card (Spotify's dark consent look,
// Encore s4c-dark values, chat.css --sp-d-*): superbot's tile and the Spotify icon joined by the dotted connector,
// "Connect superbot to Spotify for Creators", the account it connects to ("Signed in as Maya Ortiz"), what superbot may
// do (upload and edit episodes of the show; add show notes and chapters; publish episodes to Spotify), Cancel and
// Spotify's green Connect with its black label. The pointer presses Connect, and the base's connect-card grammar
// follows: a checklist card ("Connected to Spotify for Creators", "Episode 42 uploaded, 56:32", "Show notes and 7
// chapters added", "Episode art added") ticking in turn, with a mini window under it; the card holds (CARD_HOLD) and
// the window opens to full frame (GROW).
// Full frame is the Spotify for Creators episode page, Details tab (creators.spotify.com, the light s4c theme the
// dashboard app ships, chat.css --sp-*): the white top bar (the official Spotify for Creators lockup, the MO avatar)
// over a hairline; on 16:9 the left sidebar (the show's cover art and name, Home, Episodes as the current item,
// Analytics, Settings); the breadcrumb back to Episodes; the episode header (the episode art, Audio + "Episode 42", the
// title, the show, the date and runtime, and the status pill: "Processing"); the page tabs (Details current, Analytics,
// Monetize: the app's own labels); Details: the description (clamped to 3 lines) and the Chapters card, whose seven
// "(MM:SS) Title" rows sweep in one by one, ROW_STEP apart; and on 16:9 the right rail (the episode preview card and
// the Distribution card: Spotify and the RSS feed). The ONE bold moment (the chime, window.__AD_MARKS.chime): the
// status flips to "Published" in Spotify green, Distribution reads Spotify "Live" and RSS feed "Updated", and a
// Spotify-style toast rises: "Episode 42 is live on Spotify", "56:32, 7 chapters". The final state holds (READ).
//
// There is ONE episode page, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The page is laid out
// once at a design size (the frame divided by APP_SCALE, so the dashboard's 14 px body reads at video size) and
// scaled to the layer, so the mini window and the full frame are the same pixels at two sizes. On a portrait frame
// (4:5) it drops the sidebar and the right rail, the breadcrumb and the description, and keeps the top bar, the
// episode header with its status pill, the tabs, the seven chapters and the toast, at a larger scale. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=b26eacf4';
import { EP } from './edit.js?v=b26eacf4';

const SAY = 'Publishing it on your Spotify for Creators account.';
const N = EP.chapters.length;
const STEPS = [
  ['account', 'Connected to <b>Spotify for Creators</b>'],
  ['upload', `Episode ${EP.number} uploaded, <b>${EP.runtime}</b>`],
  ['list-ordered', `Show notes and <b>${N} chapters</b> added`],
  ['image', '<b>Episode art</b> added'],
];
// Distribution (16:9 rail): Spotify publishes the show itself; the RSS feed carries the episode to any platform the
// show was submitted to (support.spotify.com/us/creators/article/distributing-your-show-to-other-platforms/: Spotify
// for Creators does NOT submit to Apple Podcasts or others itself, so no such row is shown)
const DIST = [['spotify', 'Spotify', 'Live'], ['rss', 'RSS feed', 'Updated']];

const APP_SCALE = { wide: 1.4, tall: 1.7 };     // full frame: the page's px to frame px (4:5 larger: >= 22 px text)
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the connect sheet lands
const CARD_IN = 0.3;                            // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */           // the sheet landed to the press on Connect (it reads first)
const PTR_IN = 0.3;                             // the sheet landed to the pointer appearing
const PTR_MOVE = 0.4;                           // the pointer's travel onto the button, ending just before the press
const LIST_AT = 0.25;                           // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.12;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */              // the window opens to full frame
const SWEEP_AT = 0.35; /* deliberate */         // full frame (Processing, no chapters yet) to the first chapter row
const ROW_STEP = 0.14; /* deliberate */         // one chapter row to the next (7 rows in the base's 4-row sweep time)
const ROW_IN = 0.22;                            // a chapter row rising in
const BOLD_AT = 0.25;                           // the last chapter in to the status flipping (the chime)
const BOLD_IN = 0.34;                           // the status pill crossing to Published, the toast rising in
const DIST_STEP = 0.1;                          // Spotify Live, then RSS feed Updated
const READ = 1.5; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 6;                               // the card's window radius (Encore --encore-corner-radius-larger), eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="sk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const avatar = (cls = '') => `<span class="sp-av ${cls}">${EP.initials}</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the connect sheet lands
    T.tap = T.card + TAP_AT;                           // Connect is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame: Processing, the chapters not in yet
    T.rows = EP.chapters.map((_, i) => T.full + SWEEP_AT + i * ROW_STEP); // each chapter row sweeps in
    T.swept = T.rows[N - 1] + ROW_IN;                  // all seven in
    T.bold = T.swept + BOLD_AT;                        // Published, Live, the toast (the chime)
    T.dist = DIST.map((_, i) => T.bold + i * DIST_STEP);
    T.settle = T.bold + BOLD_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.bold });
    const lockup = x.brand('spotify-for-creators-logo.svg');
    const mark = x.brand('spotify-mark.svg');
    const icon = (cls = '') => `<span class="sp-ic ${cls}"><img src="${mark}" alt=""/></span>`;
    // the show's cover art: the photograph with the show's name set over a scrim (composition, not a drawn image)
    const cover = (cls = '') => `<span class="sp-cover ${cls}"><img src="${x.img('show-cover.jpg')}" alt=""/><b>${esc(EP.show)}</b></span>`;

    // ---- the account connection sheet in the chat (Spotify's dark consent look) ----
    const say = x.el(`<div class="qc-say sk-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const sheet = x.el(`<div class="sc-card">
      <div class="sc-logos">${x.tile('superbot', 'sc-sb')}<i class="sc-dots"></i>${icon('sc-sp')}</div>
      <div class="sc-title">Connect superbot to Spotify for Creators</div>
      <div class="sc-acct">${avatar('sc-av')}<span>Signed in as <b>${esc(EP.host)}</b></span></div>
      <div class="sc-perm">
        <div class="sc-row">${lc('upload')}<span>Upload and edit episodes of ${esc(EP.show)}</span></div>
        <div class="sc-row">${lc('file-text')}<span>Add show notes and chapters</span></div>
        <div class="sc-row">${lc('play')}<span>Publish episodes to Spotify</span></div>
      </div>
      <div class="sc-btns"><span class="sp-btn sp-sec">Cancel</span><span class="sp-btn sp-pri sc-go">Connect</span></div>
    </div>`);
    const go = sheet.querySelector('.sc-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'account' ? icon('sk-sp') : `<span class="sk-ic">${lc(kind)}</span>`);
    const card = x.el(`<div class="sk-card">
      ${STEPS.map(([kind, txt]) => `<div class="sk-step">${stepIcon(kind)}<span class="sk-tx">${txt}</span><span class="sk-ok"><i class="sk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="sk-shot"></div>
    </div>`);
    const shot = card.querySelector('.sk-shot');
    const checks = [...card.querySelectorAll('.sk-ok')].map((n) => ({ spin: n.querySelector('.sk-spin'), ck: n.querySelector('.sk-ck') }));

    // ---- the full-frame Spotify for Creators episode page ----
    const nav = [['house', 'Home'], ['list-ordered', 'Episodes'], ['chart-column', 'Analytics'], ['settings', 'Settings']];
    const layer = x.el(`<div class="sp-full" aria-hidden="true"><div class="sp-app">
      <header class="sp-top">
        <img class="sp-logo" src="${lockup}" alt=""/>
        ${avatar('sp-av-top')}
      </header>
      <div class="sp-body">
        <nav class="sp-side sp-wide">
          <div class="sp-show">${cover('sp-cv-s')}<span><b>${esc(EP.show)}</b><small>${esc(EP.host)}</small></span></div>
          ${nav.map(([g, l]) => `<span class="sp-nav${l === 'Episodes' ? ' on' : ''}">${lc(g)}${l}</span>`).join('')}
        </nav>
        <main class="sp-main">
          <div class="sp-crumb sp-wide">${lc('chevron-left')}Episodes</div>
          <div class="sp-head">
            <img class="sp-art" src="${x.img('ep42-art.jpg')}" alt=""/>
            <div class="sp-hm">
              <span class="sp-eyebrow"><span class="sp-tag">Audio</span>Episode ${EP.number}</span>
              <h1>${esc(EP.title)}</h1>
              <span class="sp-meta"><span>${esc(EP.show)}</span><span>${esc(EP.date)}</span><span>${esc(EP.runtime)}</span></span>
            </div>
            <span class="sp-stat"><span class="sp-pill sp-proc"><i class="sp-spin"></i>Processing</span><span class="sp-pill sp-pub">${lc('check')}Published</span></span>
          </div>
          <div class="sp-tabs"><span class="on">Details</span><span>Analytics</span><span>Monetize</span></div>
          <div class="sp-cols">
            <div class="sp-det">
              <section class="sp-card sp-desc sp-wide"><h2>Description</h2><p>${esc(EP.summary)}</p></section>
              <section class="sp-card sp-chap">
                <div class="sp-ch-h"><h2>Chapters</h2><small class="sp-chn">0 chapters</small><span class="sp-edit">${lc('pencil')}Edit</span></div>
                <ol>${EP.chapters.map(([ts, name]) => `<li><span class="sp-ts">(${ts})</span><span>${esc(name)}</span></li>`).join('')}</ol>
              </section>
            </div>
            <aside class="sp-rail sp-wide">
              <section class="sp-prev"><img src="${x.img('ep42-art.jpg')}" alt=""/>
                <div class="sp-pv-t"><b>${esc(EP.title)}</b><small>${esc(EP.show)}</small></div>
                <div class="sp-pv-bar"><span class="sp-play">${lc('play')}</span><i></i></div>
                <div class="sp-pv-time"><span>0:00</span><span>${esc(EP.runtime)}</span></div>
              </section>
              <section class="sp-card sp-dist"><h2>Distribution</h2>
                ${DIST.map(([k2, l, ok]) => `<div class="sp-drow">${k2 === 'spotify' ? icon('sp-d-ic') : `<span class="sp-d-ic sp-d-gl">${lc('rss')}</span>`}<span class="sp-dl">${l}</span>
                  <span class="sp-dsw"><span class="sp-pill sp-wait">Pending</span><span class="sp-pill sp-live">${ok}</span></span></div>`).join('')}
              </section>
            </aside>
          </div>
        </main>
      </div>
      <div class="sp-toast">${lc('circle-check')}<span><b>Episode ${EP.number} is live on Spotify</b><small>${esc(EP.runtime)}, ${N} chapters</small></span></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const rows = [...layer.querySelectorAll('.sp-chap li')];
    const dist = [...layer.querySelectorAll('.sp-drow')].map((n) => ({ w: n.querySelector('.sp-wait'), l: n.querySelector('.sp-live') }));
    const proc = $('.sp-proc'), pub = $('.sp-pub'), spin = $('.sp-proc .sp-spin'), toast = $('.sp-toast'), chn = $('.sp-chn');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, nShown = -1;
    let AW = 1371, AH = 771;

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
      app.classList.toggle('sp-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('sk-tall', tall);
      sheet.classList.toggle('sc-tall', tall);
    };

    // the pointer: in the chat, onto Connect and a press, then away
    const ptr = (t) => {
      if (t < T.card + PTR_IN || t > T.tap + 0.45) return null;
      const a = T.card + PTR_IN, b = T.tap - 0.08;
      const g = x.box(go);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
      const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
      const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
      return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave) };
    };

    return {
      nodes: [say, sheet, card],
      marks: [[T.r, say], [T.card, sheet], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        sheet.style.opacity = ci.toFixed(3);
        sheet.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Connect: the press, then it stays in its pressed tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('sp-hit', t >= T.tap);

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

        // the sweep: each chapter row rises in, the card's count follows
        let landed = 0;
        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
          if (t >= T.rows[i]) landed = i + 1;
        });
        if (landed !== nShown) { chn.textContent = `${landed} chapter${landed === 1 ? '' : 's'}`; nShown = landed; }

        // the bold moment: Processing crosses to Published, Distribution flips, the toast rises
        spin.style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
        const b = outCubic(seg(t, T.bold, T.bold + BOLD_IN));
        proc.style.opacity = (1 - outCubic(seg(t, T.bold, T.bold + BOLD_IN * 0.45))).toFixed(3);
        const pi = outCubic(seg(t, T.bold + BOLD_IN * 0.3, T.bold + BOLD_IN));
        pub.style.opacity = pi.toFixed(3);
        pub.style.transform = pi >= 1 ? 'none' : `scale(${lerp(0.8, 1, pi).toFixed(4)})`;
        dist.forEach((o, i) => {
          const d = T.dist[i];
          o.w.style.opacity = (1 - outCubic(seg(t, d, d + 0.12))).toFixed(3);
          const q = outCubic(seg(t, d + 0.08, d + 0.26));
          o.l.style.opacity = q.toFixed(3);
          o.l.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.8, 1, q).toFixed(4)})`;
        });
        toast.style.opacity = b.toFixed(3);
        toast.style.transform = `translateX(-50%)${b >= 1 ? '' : ` translateY(${((1 - b) * 22).toFixed(2)}px) scale(${lerp(0.94, 1, b).toFixed(4)})`}`;
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; return; }
        layout();
        const bx = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(bx.x, 0, g), Tp = lerp(bx.y, 0, g), Wd = lerp(bx.w, W, g), Ht = lerp(bx.h, H, g);
        const s = shot.offsetWidth ? bx.w / shot.offsetWidth : 1;
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
