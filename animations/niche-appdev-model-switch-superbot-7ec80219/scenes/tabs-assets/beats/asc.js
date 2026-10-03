// App Store Connect beat, the finale: superbot connects to App Store Connect and puts the build in front of testers.
// Its line streams and an App Store Connect styled sheet lands in the chat (Apple's light web neutrals, the system font
// stack): the App Store mark and "App Store Connect" on top, the app row (the Steadyloop icon, "Steadyloop", "iOS App,
// Version 1.0"), then a checklist that ticks (App record created, Build 1.0 (1) uploaded, Export compliance
// information provided, Internal testers invited (4): Apple's own terms from App Store Connect Help). The card holds
// (CARD_HOLD) and opens to full frame (GROW), the grammar of the niche forks' connect beat.
// Full frame (16:9) is App Store Connect's TestFlight tab, light, as Sam sees it: the top bar, the app header and its
// tab row with TestFlight selected, the sidebar (Builds > iOS selected, Feedback, Internal Testing, External Testing)
// and the iOS builds table with Apple Help's own columns (Build, Status, Groups, Invites, Installs, Sessions, Crashes,
// Feedback) and one row, 1.0 (1), "Testing" with its green dot (Apple's status for a build at least one group is
// testing), Installs 0. Beside it, on a calm neutral backdrop, an iPhone (a CSS device frame: dark bezel, Dynamic
// Island) on its Lock Screen. Then the one bold moment: a TestFlight banner drops in ("Steadyloop 1.0 (1)", "New build
// available to test"), it is tapped (a simulator-style touch circle) and the Steadyloop app opens out of the banner
// (an iOS-like zoom) on its Today screen; that instant the table's Installs flips 0 -> 1 (the chime, render.mjs). The
// closer: a tap on "Read 10 pages" fills its ring and its streak ticks 31 -> 32, and that final state holds (READ).
// On a portrait frame (4:5) the sidebar and the page go; a compact TestFlight card sits on top (icon, Steadyloop, build
// 1.0 (1), the status and Installs) and the iPhone stands large under it.
//
// There is ONE full-frame client, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's pane box (and transparent); GROW fades it up as it opens from there to the whole
// frame. The client is laid out once at a design size (the frame divided by APP_SCALE) and scaled to the layer; the
// phone is laid out at iPhone points (393 x 852) and scaled into its pane. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ico } from './ui-icons.js?v=7ec80219';

const SAY = 'Connected to App Store Connect and invited your 4 testers.';
const APP = 'Steadyloop';
const BUILD = '1.0 (1)';
const CHECKS = ['App record created', `Build ${BUILD} uploaded`, 'Export compliance information provided', 'Internal testers invited (4)'];
const DATE = 'Saturday, October 3';
// the Today screen's habits: [name, streak before, done today, ticks on the closer's tap]
const HABITS = [
  ['Drink water', 12, true, false],
  ['Read 10 pages', 31, false, true],
  ['Walk 8,000 steps', 6, false, false],
  ['Stretch', 3, true, false],
];
// App Store Connect's sections (App Store Connect Help, "App Store Connect sections") and the app's tab row
const NAV = ['Apps', 'Trends', 'Reports', 'Business', 'Users and Access'];
const TABS = ['Distribution', 'TestFlight', 'Xcode Cloud', 'Analytics'];
// the builds table: Apple Help's "View build status and metrics" columns
const COLS = ['Build', 'Status', 'Groups', 'Invites', 'Installs', 'Sessions', 'Crashes', 'Feedback'];
// the Build Uploads section under it (Apple Help, "View builds and metadata": a build's version and build number,
// upload status and creation date; Version & Build column, Complete status)
const UPCOLS = ['Version & Build', 'Status', 'Created'];
const UPROW = ['1.0 (1)', 'Complete', 'Oct 3, 2026 at 9:32 AM'];

const APP_SCALE = { wide: 1.4, tall: 1.1 };    // full frame: the client's px to frame px
const PHONE = { w: 393, h: 852 };               // iPhone points
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.2;                             // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.42;                           // the card landing to its first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.35; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the card opens to full frame
const BAN_AT = 0.45;                             // full frame to the banner dropping in
const BAN_IN = 0.35;                             // the banner sliding down (outCubic, no overshoot)
const TAP_AT = 0.75;                             // the banner starting in to the tap
const OPEN_AT = 0.08;                            // the tap to the app starting to open
const OPEN = 0.42; /* deliberate */              // the app zooming out of the banner to full screen
const RING_AT = 0.55;                            // the app open to the closer's tap on "Read 10 pages"
const FILL = 0.35;                               // its ring filling
const READ = 1.3; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 12;                               // the card's radius, eased to 0 at full frame
// the banner's box on the phone screen (points) the app opens out of
const BAN = { x: 9, y: 56, w: 375, h: 82, r: 24 };
const SCREEN_R = 54;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a streak ring: track and arc (circumference 2*pi*17), the arc's dashoffset written from t
const RING_C = 2 * Math.PI * 17;
const ring = () => `<svg class="ip-ring" viewBox="0 0 44 44" aria-hidden="true"><circle class="ip-rt" cx="22" cy="22" r="17"/><circle class="ip-ra" cx="22" cy="22" r="17" style="stroke-dasharray: ${RING_C.toFixed(3)}"/></svg>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.ok = CHECKS.map((_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[CHECKS.length - 1] + POP + CARD_HOLD; // the card starts opening
    T.full = T.grow + GROW;                           // full frame
    T.ban = T.full + BAN_AT;                          // the TestFlight banner drops in
    T.tap = T.ban + TAP_AT;                           // it is tapped
    T.open = T.tap + OPEN_AT;                         // the app starts opening out of it
    T.inst = T.open + OPEN;                           // the app is open: Installs flips 0 -> 1 (the chime)
    T.ring = T.inst + RING_AT;                        // the closer's tap on "Read 10 pages"
    T.settle = T.ring + FILL + 0.1;                   // the last visible change: the ring full, 31 -> 32
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('appstore-logo.svg');
    const apple = x.brand('apple-logo.svg');
    const icon = x.brand('steadyloop-icon.svg');

    // ---- the connect sheet in the chat ----
    const say = x.el(`<div class="qc-say ac-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ac-card"><div class="ac-vp">
      <div class="ac-hd"><span class="ac-mark"><img src="${mark}" alt=""/></span><b>App Store Connect</b></div>
      <div class="ac-app-row"><img class="ac-ic" src="${icon}" alt=""/><span class="ac-at"><b>${esc(APP)}</b><small>iOS App, Version 1.0</small></span></div>
      ${CHECKS.map((c) => `<div class="ac-step"><span class="ac-ok"><i class="ac-spin"></i><i class="ac-done">${ico('f7_checkmark_alt', 'ui-i')}</i></span><span>${esc(c)}</span></div>`).join('')}
    </div></div>`);
    const vp = card.querySelector('.ac-vp');
    const steps = [...card.querySelectorAll('.ac-step')].map((n) => ({ n, spin: n.querySelector('.ac-spin'), ok: n.querySelector('.ac-done') }));

    // ---- the full-frame client: App Store Connect + the iPhone ----
    const status = '<span class="as-stat"><i class="as-dot"></i>Testing</span>';
    const inst = '<span class="as-inst"><span class="as-i0">0</span><span class="as-i1">1</span></span>';
    const row = [`<span class="as-bld"><img src="${icon}" alt=""/>${BUILD}</span>`, status, 'Team', '4', inst, '0', '0', '0'];
    const habit = ([name, n, done, tick]) => `<div class="ip-h${done ? ' ip-done' : ''}${tick ? ' ip-tick' : ''}">${ring()}<span class="ip-hn">${esc(name)}</span><span class="ip-hc"><b>${n}</b><b class="ip-hc2">${n + 1}</b> days</span></div>`;
    const doneN = HABITS.filter((h) => h[2]).length;
    const layer = x.el(`<div class="ac-full" aria-hidden="true"><div class="ac-client">
      <section class="as-page">
        <header class="as-top"><img class="as-apple" src="${apple}" alt=""/><b>App Store Connect</b>
          <nav>${NAV.map((n, i) => `<span${i === 0 ? ' class="on"' : ''}>${esc(n)}</span>`).join('')}</nav>
          <span class="as-me">${ico('f7_person_crop_circle', 'ui-i')}Sam</span></header>
        <div class="as-apph"><img src="${icon}" alt=""/><b>${esc(APP)}</b></div>
        <div class="as-tabs">${TABS.map((n) => `<span${n === 'TestFlight' ? ' class="on"' : ''}>${esc(n)}</span>`).join('')}</div>
        <div class="as-body">
          <aside class="as-side">
            <div class="as-sh">Builds</div><div class="as-si on">iOS</div>
            <div class="as-sh">Feedback</div><div class="as-si">Crashes</div><div class="as-si">Screenshots</div>
            <div class="as-sh">Internal Testing${ico('f7_plus', 'ui-i as-plus')}</div><div class="as-si">Team</div>
            <div class="as-sh">External Testing${ico('f7_plus', 'ui-i as-plus')}</div>
          </aside>
          <main class="as-main">
            <h2>iOS Builds</h2>
            <div class="as-tbl">
              <div class="as-tr as-th">${COLS.map((c) => `<span>${c}</span>`).join('')}</div>
              <div class="as-ver">${ico('f7_chevron_down', 'ui-i')}<b>Version 1.0</b></div>
              <div class="as-tr as-row">${row.map((c) => `<span>${c}</span>`).join('')}</div>
            </div>
            <div class="as-up">${ico('f7_chevron_down', 'ui-i')}<b>Build Uploads</b></div>
            <div class="as-tbl as-tbl2">
              <div class="as-tr2 as-th">${UPCOLS.map((c) => `<span>${c}</span>`).join('')}</div>
              <div class="as-tr2 as-row">${UPROW.map((c) => `<span>${c}</span>`).join('')}</div>
            </div>
          </main>
        </div>
      </section>
      <section class="as-tcard">
        <div class="as-tc-top"><img class="as-apple" src="${apple}" alt=""/><b>App Store Connect</b><span>TestFlight</span></div>
        <div class="as-tc-app"><img src="${icon}" alt=""/><span><b>${esc(APP)}</b><small>iOS Builds</small></span></div>
        <div class="as-tc-stats">
          <span><small>Build</small><b>${BUILD}</b></span>
          <span><small>Status</small><b>${status}</b></span>
          <span><small>Installs</small><b>${inst}</b></span>
        </div>
      </section>
      <section class="as-dev"><div class="ip">
        <div class="ip-screen">
          <div class="ip-lock"><div class="ip-date">${esc(DATE)}</div><div class="ip-clock">9:41</div></div>
          <div class="ip-app">
            <div class="ip-in">
              <h1>Today</h1><div class="ip-sub">${esc(DATE)}</div>
              <div class="ip-list">${HABITS.map(habit).join('')}</div>
              <div class="ip-foot"><span class="ip-f0">${doneN} of ${HABITS.length} done today</span><span class="ip-f1">${doneN + 1} of ${HABITS.length} done today</span></div>
            </div>
          </div>
          <div class="ip-ban"><span class="ip-tf">${ico('f7_airplane', 'ui-i')}</span>
            <span class="ip-bt"><span class="ip-b1"><b>TestFlight</b><time>now</time></span><b class="ip-b2">${esc(APP)} ${BUILD}</b><span class="ip-b3">New build available to test</span></span></div>
          <div class="ip-sb"><b class="ip-time">9:41</b><span class="ip-sbi">${ico('ms_signal_cellular_alt', 'ui-i ip-sig')}${ico('f7_wifi', 'ui-i')}${ico('f7_battery_100', 'ui-i ip-bat')}</span></div>
          <div class="ip-touch"></div>
          <div class="ip-home"></div>
        </div>
        <div class="ip-island"></div>
      </div></section>
    </div></div>`);
    x.root.appendChild(layer);
    const $ = (s) => layer.querySelector(s);
    const client = layer.firstElementChild;
    const dev = $('.as-dev'), phone = $('.ip'), screen = $('.ip-screen');
    const lock = $('.ip-lock'), appEl = $('.ip-app'), ban = $('.ip-ban'), sb = $('.ip-sb'), touch = $('.ip-touch'), home = $('.ip-home');
    const insts = [...layer.querySelectorAll('.as-inst')].map((n) => ({ a: n.firstElementChild, b: n.lastElementChild }));
    const tick = $('.ip-tick'), tickArc = tick.querySelector('.ip-ra'), tickRing = tick.querySelector('.ip-ring');
    const tickC = [tick.querySelector('.ip-hc b'), tick.querySelector('.ip-hc2')];
    const foot = [$('.ip-f0'), $('.ip-f1')];
    // the rings of the habits already done today are closed; the others wait open
    layer.querySelectorAll('.ip-h').forEach((h) => { if (!h.classList.contains('ip-tick')) h.querySelector('.ip-ra').style.strokeDashoffset = h.classList.contains('ip-done') ? '0' : RING_C.toFixed(3); });
    // the Apple surfaces' fallback face is Inter (vendored, chat.css): ask for every weight up front so a seek never
    // measures in a face that is still loading
    if (document.fonts && document.fonts.load) ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 16px "Inter SB"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null;
    let AW = 1536, AH = 864;

    // the client's design size from the frame: W x H over APP_SCALE; a portrait frame takes the compact layout. The
    // phone is scaled into its pane (laid out in design px, so offsetWidth/Height ignore the transforms above it)
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      client.style.width = `${AW}px`; client.style.height = `${AH}px`;
      client.classList.toggle('ac-tall', tall);
      const pw = dev.clientWidth, ph = dev.clientHeight;
      const k = Math.min((pw * (tall ? 0.9 : 0.8)) / PHONE.w, (ph * (tall ? 0.94 : 0.88)) / PHONE.h);
      phone.style.transform = `translate(-50%, -50%) scale(${k.toFixed(4)})`;
    };

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
        // the checklist: a spinner each, resolving to a check in turn
        steps.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ok.style.opacity = o.toFixed(3);
          c.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        if (t < T.grow) return; // the client is hidden until the card opens

        // ---- the phone ----
        // the banner drops in from above the screen, is tapped, and the app opens out of it
        const bi = outCubic(seg(t, T.ban, T.ban + BAN_IN));
        const g = inOutCubic(seg(t, T.open, T.open + OPEN));
        ban.style.transform = `translateY(${((1 - bi) * -(BAN.y + BAN.h + 10)).toFixed(2)}px) scale(${(1 - 0.04 * press(t, T.tap)).toFixed(4)})`;
        ban.style.opacity = (bi * (1 - seg(t, T.open, T.open + OPEN * 0.45))).toFixed(3);
        ban.style.visibility = t < T.ban || g >= 1 ? 'hidden' : 'visible';
        // the app: from the banner's box to the whole screen (scale from the banner's centre, corner radius with it)
        if (t < T.open) appEl.style.visibility = 'hidden';
        else {
          appEl.style.visibility = 'visible';
          const L = lerp(BAN.x, 0, g), Tp = lerp(BAN.y, 0, g), Wd = lerp(BAN.w, PHONE.w, g), Ht = lerp(BAN.h, PHONE.h, g);
          appEl.style.clipPath = g >= 1 ? '' : `inset(${Tp.toFixed(2)}px ${(PHONE.w - L - Wd).toFixed(2)}px ${(PHONE.h - Tp - Ht).toFixed(2)}px ${L.toFixed(2)}px round ${lerp(BAN.r, SCREEN_R, g).toFixed(2)}px)`;
          // the content follows the box: it starts at the banner's width, its top on the box's top, and settles to full size
          const sc = lerp(BAN.w / PHONE.w, 1, g);
          appEl.firstElementChild.style.transform = g >= 1 ? 'none' : `translate(${((PHONE.w * (1 - sc)) / 2).toFixed(2)}px, ${(Tp - 60 * sc * (1 - g)).toFixed(2)}px) scale(${sc.toFixed(4)})`;
          appEl.style.opacity = outCubic(seg(t, T.open, T.open + OPEN * 0.35)).toFixed(3);
        }
        lock.style.opacity = (1 - 0.5 * g).toFixed(3);
        lock.style.visibility = g >= 1 ? 'hidden' : '';
        // the status bar and the home indicator turn dark over the light app
        const dark = g >= 0.5;
        sb.classList.toggle('ip-dark', dark);
        home.classList.toggle('ip-dark', dark);
        // the touch circles: on the banner, then on "Read 10 pages" (its ring; phone points, .ip-in is the offset parent)
        const tAt = t < T.inst ? T.tap : T.ring;
        const pos = t < T.inst ? { x: BAN.x + BAN.w * 0.5, y: BAN.y + BAN.h * 0.55 }
          : { x: tick.offsetLeft + tickRing.offsetLeft + tickRing.offsetWidth / 2, y: tick.offsetTop + tick.offsetHeight / 2 };
        const tv = seg(t, tAt - 0.2, tAt - 0.08) * (1 - seg(t, tAt + 0.12, tAt + 0.3));
        touch.style.opacity = tv.toFixed(3);
        touch.style.transform = `translate(${(pos.x - 22).toFixed(2)}px, ${(pos.y - 22).toFixed(2)}px) scale(${(1 - 0.18 * press(t, tAt) + 0.12 * seg(t, tAt + 0.12, tAt + 0.3)).toFixed(4)})`;
        // the closer: the ring fills, its streak and the footer tick on
        const f = inOutCubic(seg(t, T.ring, T.ring + FILL));
        tickArc.style.strokeDashoffset = (RING_C * (1 - f)).toFixed(3);
        const ticked = t >= T.ring + FILL;
        tick.classList.toggle('ip-done', ticked);
        const q = outCubic(seg(t, T.ring + FILL, T.ring + FILL + 0.2));
        tickC[0].style.display = ticked ? 'none' : '';
        tickC[1].style.display = ticked ? 'inline' : 'none';
        tickC[1].style.opacity = q.toFixed(3);
        foot[0].style.display = ticked ? 'none' : '';
        foot[1].style.display = ticked ? 'inline' : 'none';

        // ---- App Store Connect: Installs flips 0 -> 1 as the app opens ----
        const iq = outCubic(seg(t, T.inst, T.inst + 0.22));
        insts.forEach((o) => {
          const on = t >= T.inst;
          o.a.style.display = on ? 'none' : 'inline';
          o.b.style.display = on ? 'inline' : 'none';
          o.b.style.opacity = iq.toFixed(3);
          o.b.style.transform = iq >= 1 ? 'none' : `translateY(${((1 - iq) * 6).toFixed(2)}px)`;
        });
      },
      // after the camera: pin the layer over the card's pane box, then open it to the whole frame
      after(t) {
        if (t < T.grow) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(vp);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = vp.offsetWidth ? b.w / vp.offsetWidth : 1; // the camera's scale on the card
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        // the client covers the box whatever its aspect on the way (the sheet is squarer than the frame), centred
        const sc = Math.max(Wd / AW, Ht / AH);
        client.style.transform = `translate(${((Wd - AW * sc) / 2).toFixed(2)}px, ${((Ht - AH * sc) / 2).toFixed(2)}px) scale(${sc.toFixed(5)})`;
        // while it sits over the card the layer is cut to the feed's viewport, so it never draws over the composer
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        // a quick dissolve from the sheet to the client as the box starts to open (no long double exposure)
        layer.style.opacity = outCubic(seg(t, T.grow, T.grow + 0.12)).toFixed(3);
      },
    };
  },
};
