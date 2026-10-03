// Vercel beat, the finale: superbot deploys the site to the user's Vercel account. Its line streams, a connect card
// lands in the chat ("superbot connected to Vercel", "Imported maple-street-bakery", "Deploying to production", three
// checks ticking in turn) with a mini browser window under it; the card holds (CARD_HOLD) and the window opens to full
// frame (GROW), the grammar of the data remake's sheets.js (and the source's play.js). Full frame is a real-looking
// light Chrome window. Phase A, tab "maple-street-bakery · Vercel": the Vercel deployment page in Geist (the team and
// project breadcrumb, the project tabs, "Deployment" with Visit, a preview of the site, Status, Environment, Duration,
// Domains and Source, and the Build Logs streaming line by line); the status flips from Building (amber) to Ready
// (green) as the last log line lands, the preview swaps from its placeholder to the live page and Duration stops at
// 32s. Phase B: the pointer clicks Visit, a new tab opens on https://maple-street-bakery.vercel.app, it loads (the
// tab's spinner) and the bakery's landing page fills the window; a slow scroll brings Today's bakes up and settles.
// The deploy stays marked Ready to the last frame: the Vercel tab keeps its place in the strip and the Vercel Toolbar
// pill (Production, Ready) sits bottom-right of the page, as Vercel shows it to the team on its own deployments. The
// final state holds (READ) before the end card.
//
// There is ONE browser window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) everything takes its tablet-width layout: the
// deployment's details stack under the preview, the bakery page goes single column.
// The bakery page is ONE markup (siteHTML) used twice: inside the deployment preview (laid out at desktop width and
// scaled down, as Vercel's preview is a capture of the page) and in the page tab at the window's width.
// Pure function of t: every moving value is written from t; the only measuring is of laid-out boxes (the Visit button
// for the pointer, the bakes section for the scroll), which do not move with t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';

const SAY = 'Deploying it to your Vercel account.';
const PROJECT = 'maple-street-bakery';
const DOMAIN = 'maple-street-bakery.vercel.app';
const TEAM = "Sam's projects";
const DASH_URL = 'vercel.com/sams-projects/maple-street-bakery/F4tR9xQe2';
const SITE_TITLE = 'Maple Street Bakery';
const DURATION = 32;                               // seconds, the build's own clock (first log line to the last)
// the build log as Vercel prints it: timestamp, line (the last one is the deploy landing)
const LOGS = [
  ['21:14:02.118', 'Running build in Washington, D.C., USA (East), iad1'],
  ['21:14:02.904', 'Cloning github.com/sam/maple-street-bakery (Branch: main, Commit: a1c9f2e)'],
  ['21:14:05.372', 'Running "npm run build"'],
  ['21:14:09.630', '✓ Compiled successfully in 3.1s'],
  ['21:14:10.451', '✓ Generating static pages (4/4)'],
  ['21:14:12.286', 'Build Completed in /vercel/output [10s]'],
  ['21:14:13.020', 'Deploying outputs...'],
  ['21:14:34.118', 'Deployment completed'],
];
// the bakery's menu today: photo, name, price, line
const BAKES = [
  ['sourdough.jpg', 'Country sourdough', '$9', '36-hour ferment, crackling crust'],
  ['croissant.jpg', 'Butter croissant', '$4.50', 'Cultured butter, laminated by hand'],
  ['cinnamon-knot.jpg', 'Cinnamon knot', '$5', 'Cardamom, cinnamon, pearl sugar'],
  ['galette.jpg', 'Seasonal galette', '$6', 'Local apples, flaky all-butter crust'],
];
const PROJECT_TABS = ['Overview', 'Deployments', 'Analytics', 'Speed Insights', 'Logs', 'Observability', 'Firewall', 'Storage', 'Settings'];

// design metrics (px of the window, before the scale to the frame)
const APP_SCALE = { wide: 1.5, tall: 1.2 };        // full frame: the window's px to frame px
const PREVIEW_W = 1280;                            // the deployment preview is the page laid out at this width

// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const LOG_AT = 0.2;                              // full frame, then the first build log line
const LOG_STAGGER = 0.17;                        // one log line to the next
const LOG_IN = 0.12;                             // a log line landing
const READY_AT = 0.12;                           // the last log line in, then Building flips to Ready
const FLIP = 0.15;                               // the status label crossfading
const PREVIEW_IN = 0.3;                          // the preview's placeholder giving way to the page
const PTR_AT = 0.45;                             // Ready, then the pointer sets off for Visit
const PTR_MOVE = 0.45;                           // the pointer travelling to Visit
const PRESS_AT = 0.05;                           // arrived, then the press
const OPEN_AT = 0.1;                             // the press, then the new tab opens on the site's URL
const TAB_IN = 0.16;                             // the new tab growing into the strip
const LOAD = 0.45;                               // the tab's spinner: the site loading
const PAGE_IN = 0.2;                             // the page painting in
const TOOL_AT = 0.3;                             // the page is in, then the Vercel Toolbar pill
const TOOL_IN = 0.25;
const SCROLL_AT = 0.5;                           // the page is in, then the slow scroll to Today's bakes
const SCROLL = 1.1;                              // the scroll, inOutCubic
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = 'cr-i', vb = '0 0 24 24') => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true">${d}</svg>`;
const I = {
  back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  fwd: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  reload: svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9"/><path d="M19.5 4v5h-5"/>'),
  tune: svg('<path d="M4 8h9M17 8h3M4 16h3M11 16h9"/><circle cx="15" cy="8" r="2"/><circle cx="9" cy="16" r="2"/>'),
  star: svg('<path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>'),
  kebab: svg('<circle cx="12" cy="5.5" r="1.4" class="cr-f"/><circle cx="12" cy="12" r="1.4" class="cr-f"/><circle cx="12" cy="18.5" r="1.4" class="cr-f"/>'),
  close: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  caret: svg('<path d="M8 10l4 4 4-4"/>', 'vd-i'),
  updown: svg('<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>', 'vd-i'),
  bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>', 'vd-i'),
  more: svg('<circle cx="6" cy="12" r="1.4" class="vd-f"/><circle cx="12" cy="12" r="1.4" class="vd-f"/><circle cx="18" cy="12" r="1.4" class="vd-f"/>', 'vd-i'),
  ext: svg('<path d="M14 5h5v5M19 5l-8 8"/><path d="M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/>', 'vd-i'),
  branch: svg('<circle cx="7" cy="6" r="2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="8" r="2"/><path d="M7 8v8M17 10c0 4-4 4-8.5 6"/>', 'vd-i'),
  commit: svg('<circle cx="12" cy="12" r="3.2"/><path d="M3 12h5.8M15.2 12H21"/>', 'vd-i'),
  chev: svg('<path d="M9 6l6 6-6 6"/>', 'vd-i'),
  rollback: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', 'vd-i'),
  check: '<svg class="vd-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 'msb-i'),
  globe: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17"/>', 'vc-gi'),
  ok: '<svg class="vc-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
// Vercel's slanted breadcrumb separator
const SLASH = '<svg class="vd-sl" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.88 3.55 7.12 20.45"/></svg>';

// ---- the bakery's landing page (one markup, used for the preview and for the page tab) ----
function siteHTML(img, narrow) {
  return `<div class="msb${narrow ? ' msb-narrow' : ''}">
    <header class="msb-nav">
      <span class="msb-logo"><i class="msb-fav">M</i><b>Maple Street Bakery</b></span>
      <nav class="msb-links"><span>Menu</span><span>Our story</span><span>Visit</span></nav>
      <span class="msb-btn msb-sm">Order for pickup</span>${narrow ? I.menu : ''}
    </header>
    <section class="msb-hero">
      <div class="msb-copy">
        <span class="msb-kick">Neighborhood bakery on Maple Street</span>
        <h1>Baked before sunrise. Gone by noon.</h1>
        <p>Sourdough, croissants and seasonal pastries, made from scratch every morning on Maple Street.</p>
        <div class="msb-ctas"><span class="msb-btn">Order for pickup</span><span class="msb-btn msb-ghost">See today's menu</span></div>
        <small>Open daily 7am to 3pm  ·  214 Maple Street</small>
      </div>
      <figure class="msb-hp"><img src="${img('hero.jpg')}" alt=""/></figure>
    </section>
    <section class="msb-bakes">
      <div class="msb-bh"><h2>Today's bakes</h2><span>Out of the oven at 7am. When they're gone, they're gone.</span></div>
      <div class="msb-grid">${BAKES.map(([f, name, price, line]) => `<article class="msb-card">
        <figure><img src="${img(f)}" alt=""/></figure>
        <div class="msb-ct"><b>${esc(name)}</b><span>${esc(price)}</span></div>
        <p>${esc(line)}</p>
      </article>`).join('')}</div>
    </section>
    <section class="msb-story">
      <h2>Our story</h2>
      <p>Three bakers, one wood-fired oven and a starter we have fed every day since 2014. Everything on the counter is made here, overnight, from flour milled down the road.</p>
    </section>
  </div>`;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // connected, imported, deploying: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame, the deployment building
    T.log = LOGS.map((_, i) => T.full + LOG_AT + i * LOG_STAGGER); // each build log line lands
    T.ready = T.log[LOGS.length - 1] + READY_AT;      // Building flips to Ready (.vd-ready opacity rises from 0)
    T.ptr = T.ready + PTR_AT;                         // the pointer sets off for Visit
    T.arrive = T.ptr + PTR_MOVE;
    T.press = T.arrive + PRESS_AT;
    T.open = T.press + OPEN_AT;                       // the new tab opens on the site's URL
    T.land = T.open + LOAD;                           // the page paints in (.msb-live opacity rises from 0)
    T.tool = T.land + TOOL_AT;                        // the Vercel Toolbar pill
    T.scroll = T.land + SCROLL_AT;                    // the slow scroll to Today's bakes
    T.settle = Math.max(T.scroll + SCROLL, T.tool + TOOL_IN);
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const vMark = x.brand('vercel-logo.svg'), vBlack = x.brand('vercel-logo-black.svg'), ghMark = x.brand('github-logo.svg');

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say vc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="vc-ct-i vc-ct-v"><img src="${vMark}" alt=""/></span>`, '<b>superbot connected to Vercel</b>'],
      [`<span class="vc-ct-i vc-ct-g"><img src="${ghMark}" alt=""/></span>`, `Imported <b>${esc(PROJECT)}</b>`],
      [`<span class="vc-ct-i vc-ct-d">${I.globe}</span>`, 'Deploying to <b>production</b>'],
    ];
    const card = x.el(`<div class="vc-cc">
      ${steps.map(([icon, txt]) => `<div class="vc-step">${icon}<span class="vc-tx">${txt}</span><span class="vc-ok"><i class="vc-spin"></i>${I.ok}</span></div>`).join('')}
      <div class="vc-shot"></div>
    </div>`);
    const shot = card.querySelector('.vc-shot');
    const checks = [...card.querySelectorAll('.vc-ok')].map((n) => ({ spin: n.querySelector('.vc-spin'), ck: n.querySelector('.vc-ck') }));

    // ---- the full-frame browser window (the two page bodies are built by layout(), once the frame's shape is known) ----
    const field = (label, body, cls = '') => `<div class="vd-f ${cls}"><label>${label}</label><div class="vd-fv">${body}</div></div>`;
    const layer = x.el(`<div class="vc-full" aria-hidden="true"><div class="cr-app">
      <div class="cr-strip">
        <span class="cr-lights"><i></i><i></i><i></i></span>
        <span class="cr-tab cr-t1"><img class="cr-fav" src="${vBlack}" alt=""/><span class="cr-tt">${esc(PROJECT)} · Vercel</span>${I.close}</span>
        <span class="cr-tab cr-t2"><span class="cr-favw"><i class="cr-tspin"></i><i class="cr-sfav">M</i></span><span class="cr-tt cr-tt2"></span>${I.close}</span>
        <span class="cr-new">${I.plus}</span>
      </div>
      <div class="cr-bar">
        ${I.back}${I.fwd}${I.reload}
        <span class="cr-omni">${I.tune}<span class="cr-url"></span>${I.star}</span>
        <span class="cr-av">S</span>${I.kebab}
      </div>
      <div class="cr-vp">
        <div class="vd">
          <header class="vd-top">
            <img class="vd-logo" src="${vBlack}" alt=""/>${SLASH}
            <span class="vd-crumb"><i class="vd-tav"></i><b>${esc(TEAM)}</b><span class="vd-badge">Hobby</span>${I.updown}</span>${SLASH}
            <span class="vd-crumb"><i class="vd-pav"></i><b>${esc(PROJECT)}</b>${I.updown}</span>
            <span class="vd-tr"><span class="vd-fb">Feedback</span>${I.bell}<i class="vd-av"></i></span>
          </header>
          <nav class="vd-sub">${PROJECT_TABS.map((n) => `<span${n === 'Deployments' ? ' class="on"' : ''}>${n}</span>`).join('')}</nav>
          <main class="vd-main">
            <div class="vd-hrow"><h1>Deployment</h1><span class="vd-btns"><span class="vd-b vd-rb">${I.rollback}Instant Rollback</span><span class="vd-b vd-ib">${I.more}</span><span class="vd-b vd-pri vd-visit">Visit</span></span></div>
            <section class="vd-card">
              <div class="vd-prev"><div class="vd-ph"><i class="vd-pspin"></i><span>Building</span></div><div class="vd-pimg"></div></div>
              <div class="vd-fields">
                ${field('Status', '<span class="vd-status"><span class="vd-bld"><i></i>Building</span><span class="vd-ready"><i></i>Ready</span></span>')}
                ${field('Environment', 'Production<span class="vd-cur">Current</span>')}
                ${field('Duration', '<b class="vd-dur">0s</b><span class="vd-mut">just now</span>')}
                ${field('Domains', `<span class="vd-dom">${esc(DOMAIN)}</span>${I.ext}`)}
                ${field('Source', `<span class="vd-src">${I.branch}<b>main</b></span><span class="vd-src">${I.commit}<b class="vd-mono">a1c9f2e</b><span>Bakery landing page</span></span>`, 'vd-wide')}
              </div>
            </section>
            <section class="vd-logs">
              <div class="vd-lh">${I.chev}<b>Build Logs</b><span class="vd-lt">0s</span><span class="vd-lst"><i class="vd-lspin"></i>${I.check}</span></div>
              <div class="vd-lb"><div class="vd-ll">${LOGS.map(([ts, line]) => `<div class="vd-l"><i>${ts}</i><span>${esc(line)}</span></div>`).join('')}</div></div>
            </section>
          </main>
        </div>
        <div class="cr-blank"></div>
        <div class="cr-site"></div>
        <div class="vt-pill"><img src="${vMark}" alt=""/><span>Production</span><i class="vt-sep"></i><span class="vt-ok"><i></i>Ready</span></div>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => app.querySelector(s);
    const t1 = $('.cr-t1'), t2 = $('.cr-t2'), tt2 = $('.cr-tt2'), tspin = $('.cr-tspin'), sfav = $('.cr-sfav'), url = $('.cr-url');
    const dash = $('.vd'), blank = $('.cr-blank'), siteBox = $('.cr-site'), pill = $('.vt-pill');
    const bld = $('.vd-bld'), ready = $('.vd-ready'), cur = $('.vd-cur'), dur = $('.vd-dur'), lt = $('.vd-lt');
    const lspin = $('.vd-lspin'), lck = $('.vd-lst .vd-ck'), ph = $('.vd-ph'), pspin = $('.vd-pspin'), pimg = $('.vd-pimg');
    const visit = $('.vd-visit');
    const logs = [...app.querySelectorAll('.vd-l')];
    // the window's faces are vendored (vercel.css): ask for every weight up front, and warm the photos
    if (document.fonts && document.fonts.load) {
      ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 14px "Geist VC"`));
      ['400', '500'].forEach((w) => document.fonts.load(`${w} 13px "Geist Mono VC"`));
      ['400', '600', '700'].forEach((w) => document.fonts.load(`${w} 40px "Fraunces MSB"`));
    }
    ['hero.jpg', ...BAKES.map(([f]) => f)].forEach((f) => { const im = new Image(); im.src = x.img(f); });

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, G = null, lastUrl = '', lastTitle = '';
    let AW = 1280, AH = 720;

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes the tablet layouts
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
      app.classList.toggle('cr-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('vc-tall', tall);
      // the page tab at the window's width; the preview at desktop width, scaled into its frame by CSS from --pw
      siteBox.innerHTML = siteHTML(x.img, tall);
      pimg.innerHTML = siteHTML(x.img, false);
      const prev = pimg.firstElementChild;
      prev.style.width = `${PREVIEW_W}px`;
      G = { tall, site: siteBox.firstElementChild, prev, bakes: siteBox.querySelector('.msb-bakes') };
    };

    // Visit's centre in the window's own px (transform-free: the window's rect divided by its current scale)
    const visitPt = () => {
      const a = app.getBoundingClientRect(), b = visit.getBoundingClientRect();
      const sc = a.width / AW || 1;
      return { x: (b.left - a.left + b.width * 0.5) / sc, y: (b.top - a.top + b.height * 0.55) / sc };
    };
    const setTxt = (n, s) => { if (n.textContent !== s) n.textContent = s; };

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
        if (!G) return;

        // ---- phase A: the deployment builds, then Ready ----
        logs.forEach((l, i) => {
          const q = outCubic(seg(t, T.log[i], T.log[i] + LOG_IN));
          l.style.display = t >= T.log[i] ? '' : 'none';
          l.style.opacity = q.toFixed(3);
        });
        const isReady = t >= T.ready;
        const secs = Math.round(DURATION * seg(t, T.card, T.ready));
        setTxt(dur, `${secs}s`);
        setTxt(lt, `${secs}s`);
        bld.style.opacity = (1 - seg(t, T.ready - 0.05, T.ready + FLIP * 0.6)).toFixed(3);
        ready.style.opacity = seg(t, T.ready, T.ready + FLIP).toFixed(3);
        // the Ready dot's one soft ring as it lands
        const ring = seg(t, T.ready, T.ready + 0.6);
        ready.style.setProperty('--ring', ring > 0 && ring < 1 ? `0 0 0 ${(7 * ring).toFixed(2)}px rgba(34, 168, 97, ${(0.35 * (1 - ring)).toFixed(3)})` : 'none');
        cur.style.opacity = seg(t, T.ready + 0.1, T.ready + 0.3).toFixed(3);
        lspin.style.opacity = isReady ? '0' : '1';
        lspin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const lc = outCubic(seg(t, T.ready, T.ready + POP));
        lck.style.opacity = lc.toFixed(3);
        lck.style.transform = `scale(${lerp(0.4, 1, lc).toFixed(4)})`;
        pspin.style.transform = `rotate(${((t - T.card) * 360).toFixed(1)}deg)`;
        const pv = inOutCubic(seg(t, T.ready, T.ready + PREVIEW_IN));
        ph.style.opacity = (1 - pv).toFixed(3);
        pimg.style.opacity = pv.toFixed(3);
        // the preview capture: the desktop page scaled to its frame's width
        const pw = pimg.offsetWidth;
        if (pw) G.prev.style.transform = `scale(${(pw / PREVIEW_W).toFixed(5)})`;
        const pr = press(t, T.press);
        visit.style.transform = pr > 0 ? `scale(${(1 - 0.04 * pr).toFixed(4)})` : '';
        visit.style.backgroundColor = pr > 0 ? `rgb(${Math.round(lerp(23, 64, pr))}, ${Math.round(lerp(23, 64, pr))}, ${Math.round(lerp(23, 64, pr))})` : '';

        // ---- phase B: Visit opens the site in a new tab, it loads, the page scrolls to Today's bakes ----
        const open = t >= T.open, landed = t >= T.land;
        const tw = outCubic(seg(t, T.open - 0.02, T.open - 0.02 + TAB_IN));
        t2.style.display = open ? '' : 'none';
        t2.style.maxWidth = `${(236 * tw).toFixed(1)}px`;
        t2.style.opacity = tw.toFixed(3);
        t1.classList.toggle('on', !open);
        t2.classList.toggle('on', open);
        const u = open ? `<span class="cr-sch">https://</span>${esc(DOMAIN)}` : esc(DASH_URL);
        if (u !== lastUrl) { url.innerHTML = u; lastUrl = u; }
        const ti = landed ? SITE_TITLE : DOMAIN;
        if (ti !== lastTitle) { tt2.textContent = ti; lastTitle = ti; }
        tspin.style.display = landed ? 'none' : '';
        tspin.style.transform = `rotate(${((t - T.open) * 540).toFixed(1)}deg)`;
        sfav.style.display = landed ? '' : 'none';
        dash.style.display = open ? 'none' : '';
        blank.style.display = open ? '' : 'none';
        const pi = seg(t, T.land, T.land + PAGE_IN);
        siteBox.style.display = landed ? '' : 'none';
        siteBox.style.opacity = pi.toFixed(3);
        siteBox.classList.toggle('msb-live', landed);
        // the scroll: Today's bakes up to the top of the window, clamped to the page's end
        const vpH = siteBox.offsetHeight, top = G.bakes ? G.bakes.offsetTop - (G.tall ? 12 : 8) : 0;
        const maxY = Math.max(0, G.site.offsetHeight - vpH);
        const y = Math.min(maxY, Math.max(0, top)) * inOutCubic(seg(t, T.scroll, T.scroll + SCROLL));
        G.site.style.transform = y > 0 ? `translateY(${(-y).toFixed(2)}px)` : 'none';
        // the Vercel Toolbar pill, bottom-right, from the page's landing to the last frame
        const tp = outCubic(seg(t, T.tool, T.tool + TOOL_IN));
        pill.style.opacity = tp.toFixed(3);
        pill.style.transform = tp >= 1 ? 'none' : `translateY(${((1 - tp) * 10).toFixed(2)}px)`;
      },
      // the pointer: it sets off from the deployment's details for Visit, presses it, and fades as the new tab opens.
      // In the section's px (the full-frame window is the whole section by then).
      pointer(t) {
        if (!G || t < T.ptr - 0.15 || t > T.open + 0.35) return null;
        const W = x.root.offsetWidth, s = W / AW;
        const vp = visitPt();
        const from = { x: vp.x - (G.tall ? 180 : 330), y: vp.y + (G.tall ? 300 : 250) };
        const m = inOutCubic(seg(t, T.ptr, T.arrive));
        const v = seg(t, T.ptr - 0.15, T.ptr) * (1 - seg(t, T.open + 0.05, T.open + 0.35));
        return { x: lerp(from.x, vp.x, m) * s, y: lerp(from.y, vp.y, m) * s, p: press(t, T.press), v };
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
