// Twitch beat, the finale: superbot puts the week on the user's own Twitch schedule. Its line streams and Twitch's
// OAuth authorization page (id.twitch.tv/oauth2/authorize) lands in the chat as a card, light, laid out after the
// dialog Twitch's own docs show (dev.twitch.tv/docs/authentication, "authorization-dialog.png"; see brand/CREDITS.txt):
// the Twitch mark (the docs' figure shows the wordmark; the spot never typesets it, so the glitch mark stands in), the
// app name "superbot" over "wants to access your account", the logged-in account (PixelFern's avatar, "not you? log
// out."), "Clicking Authorize below will allow superbot to:", the scope line with Twitch's warning glyph ("Manage a
// channel’s stream schedule.", channel:manage:schedule's documented description), "This application is requesting
// your public twitch account information", "Not owned or operated by Twitch", "Only click Authorize if you trust
// superbot." and the purple Authorize beside Cancel. The pointer presses Authorize. The base's connect-card grammar
// follows: a checklist card ("Connected to PixelFern on Twitch", "Added 5 streams to your schedule", "Set 5 titles and
// categories", "Kept Mon and Wed free") ticking in turn, with a mini window under it; the card holds (CARD_HOLD) and
// the window opens to full frame (GROW). Full frame is the Twitch web channel page for PixelFern, dark, scrolled to the
// schedule as the real page scrolls: the top nav (logged in), the side nav (16:9 only: Followed Channels), the channel
// info row, the channel tabs with Schedule active, the caption, the schedule toolbar (Today, the week arrows, the date
// picker, "Oct 5, 2026 - Oct 11, 2026") and the week grid (EDT, the hour labels across the top, the day rows "Mon"
// "10/5" down the side). The week opens empty; then the five streams land one after another, quicker and quicker, in
// day order (Tue, Thu, Fri, Sat, Sun), each growing from its start time to its end time along the hour axis, its text
// fading in as it lands; Mon and Wed stay empty. The ONE bold moment (the chime, window.__AD_MARKS.chime): the fifth
// stream (Sun) finishes landing and the camera pushes slightly onto the grid, the full week read at once. No toast: no
// source of record shows Twitch raising one when a schedule changes. The final state holds (READ).
//
// There is ONE Twitch client, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it drops the side nav and shows a narrower window
// of hours. Pure function of t: every moving value is written from t (the segment geometry is closed-form in t from the
// cascade's times and the grid measured once per frame size).
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount, press } from '../../../lib.js';
import { ti } from './twitch-icons.js?v=936ae421';

const SAY = 'Putting the week on your Twitch schedule, as you.';
const APP = 'superbot';
const CHANNEL = 'PixelFern';
const FOLLOWERS = '12.4K followers';
// the scope line: channel:manage:schedule's documented description (dev.twitch.tv/docs/authentication/scopes)
const PERM = 'Manage a channel’s stream schedule.';
const STEPS = [
  ['twitch', `Connected to <b>${CHANNEL}</b> on Twitch`],
  ['calendar-plus', 'Added 5 streams to your schedule'],
  ['pencil', 'Set 5 titles and categories'],
  ['calendar-check', 'Kept Mon and Wed free'],
];
// the week (Mon Oct 5 to Sun Oct 11, 2026), in Twitch's own row label format: the weekday over month/day
const DAYS = [['Mon', '10/5'], ['Tue', '10/6'], ['Wed', '10/7'], ['Thu', '10/8'], ['Fri', '10/9'], ['Sat', '10/10'], ['Sun', '10/11']];
// the 5 streams, in day order (the order they land): [row, start hour, end hour, title, category, date line]. The date
// line is Twitch's own segment format (measured: "Monday, October 5, 2026 · 8 AM - 3 PM EDT")
const STREAMS = [
  [1, 19, 23, 'Retro night: 90s platformers until we win', 'Retro', 'Tuesday, October 6, 2026', '7 PM - 11 PM EDT'],
  [3, 19, 23, 'Building my pixel game live: boss fight day', 'Software and Game Development', 'Thursday, October 8, 2026', '7 PM - 11 PM EDT'],
  [4, 20, 23, 'Friday hangout: your clips, your questions', 'Just Chatting', 'Friday, October 9, 2026', '8 PM - 11 PM EDT'],
  [5, 14, 18, 'Drawing the boss sprite, chat picks the colors', 'Art', 'Saturday, October 10, 2026', '2 PM - 6 PM EDT'],
  [6, 18, 21, 'Sunday speedrun practice: 100% attempts', 'Retro', 'Sunday, October 11, 2026', '6 PM - 9 PM EDT'],
];
// the hour window across the top, as the real grid frames a week: from the hour before the earliest start through the
// hour the latest stream ends in (16:9: 1 PM to 11 PM, edge 12 AM; 4:5 narrows to 2 PM to 10 PM, edge 11 PM)
const HOURS = { wide: [13, 24], tall: [14, 23] };
const hourLabel = (h) => `${((h + 11) % 12) + 1} ${h % 24 < 12 ? 'AM' : 'PM'}`;
const CAPTION = 'The next stream is on Tuesday at 7:00 PM EDT.';
const RANGE = 'Oct 5, 2026 - Oct 11, 2026';
// Followed Channels (16:9 only): made up for the spot; avatars are sourced photos (scenes/tabs-assets/photos/CREDITS.txt)
const FOLLOWED = [
  ['cat.jpg', 'cozyquill', 'Art', '1.2K'],
  ['mountain.jpg', 'TideRunner', 'Just Chatting', '842'],
  ['keyboard.jpg', 'marrowbyte', 'Science & Technology', '316'],
  ['teapot.jpg', 'LunaKettle', 'Talk Shows & Podcasts', '128'],
  ['guitar.jpg', 'Slowpoke Sam', null, null],
];
const TABS = ['Home', 'About', 'Clips', 'Videos', 'Schedule'];

const APP_SCALE = { wide: 1.1, tall: 1.0 };       // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                 // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                           // the line streams, then the authorization page lands
const CARD_IN = 0.3;                            // a card rising into the thread
const AUTH_AT = 1.0; /* deliberate */           // the page landed to the press on Authorize (it reads first)
const PTR_IN = 0.3;                             // the card landed to the pointer appearing
const PTR_MOVE = 0.45;                          // the pointer's travel onto the button, ending just before the press
const LIST_AT = 0.3;                            // the press to the checklist card landing
const CHECK_AT = 0.3;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.12;                     // one check to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */              // the window opens to full frame
const CAS_AT = 0.4; /* deliberate */            // full frame to the first stream landing (the empty week reads first)
const CAS_GAPS = [0.4, 0.32, 0.25, 0.2]; /* deliberate */ // quicker and quicker
const GROW_SEG = [0.42, 0.38, 0.34, 0.3, 0.28]; /* deliberate */ // a stream growing from its start to its end time
const TEXT_IN = 0.18;                           // a stream's text fading in as it lands
const PUSH_AT = 0.12; /* deliberate */          // the fifth stream landed, then the payoff push starts
const PUSH_IN = 0.5; /* deliberate */           // chat.js PUSH: the payoff push, outQuint
const PUSH = { wide: 1.06, tall: 1.03 };        // the payoff push, per orientation: the scale, about the grid
const READ = 1.4; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 10;                              // the card's window radius (the hub card's), eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the authorization page lands
    T.tap = T.card + AUTH_AT;                          // Authorize is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    // the streams land in day order, quicker and quicker; T.flip[i] is stream i's start, T.land[i] its landing
    T.flip = [T.full + CAS_AT];
    CAS_GAPS.forEach((g) => T.flip.push(T.flip[T.flip.length - 1] + g));
    T.land = T.flip.map((f, i) => f + GROW_SEG[i]);
    T.zero = T.land[STREAMS.length - 1];               // the fifth stream lands: the full week (the chime)
    T.push = T.zero + PUSH_AT;                         // the payoff push starts
    T.settle = T.push + PUSH_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });
    const photo = (f) => new URL('../photos/' + f, import.meta.url).href;
    const fern = photo('fern.jpg');

    // ---- the authorization page in the chat (Twitch's own, light) ----
    const say = x.el(`<div class="qc-say tc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="tc-card">
      <div class="tc-mk">${ti('twitch')}</div>
      <div class="tc-h"><b>${APP}</b><span>wants to access your account</span></div>
      <div class="tc-who"><img class="tc-av" src="${fern}" alt=""/><span class="tc-wn"><b>${CHANNEL}</b><span class="tc-lk">not you? log out.</span></span></div>
      <i class="tc-hr"></i>
      <div class="tc-allow">Clicking Authorize below will allow ${APP} to:</div>
      <div class="tc-perm">${ti('triangle-alert', 'tc-warn')}<span>${esc(PERM)}</span></div>
      <div class="tc-pub">This application is requesting your public twitch account information</div>
      <i class="tc-hr"></i>
      <div class="tc-meta">${ti('ban', 'tc-mi')}<span>Not owned or operated by Twitch</span></div>
      <i class="tc-hr"></i>
      <div class="tc-trust">Only click Authorize if you trust ${APP}.</div>
      <div class="tc-btns"><span class="tc-b tc-go">Authorize</span><span class="tc-b tc-no">Cancel</span></div>
    </div>`);
    const auth = consent.querySelector('.tc-go');

    // ---- the checklist card (superbot's own, in the hub's greys) ----
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([ic, txt]) => `<div class="gk-step"><span class="gk-ic${ic === 'twitch' ? ' gk-tw' : ''}">${ti(ic)}</span><span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame Twitch client: PixelFern's channel page, Schedule tab ----
    const layer = x.el(`<div class="tw-full" aria-hidden="true"><div class="tw-app">
      <header class="tw-nav">
        <span class="tw-logo">${ti('twitch')}</span>
        <span class="tw-nl">Following</span><span class="tw-nl">Browse</span>${ti('ellipsis-vertical', 'tw-more')}
        <span class="tw-search"><span class="tw-in">Search</span><span class="tw-sb">${ti('search')}</span></span>
        <span class="tw-nr">${ti('inbox', 'tw-ni')}${ti('message-square', 'tw-ni')}<img class="tw-me" src="${fern}" alt=""/></span>
      </header>
      <div class="tw-body">
        <aside class="tw-side">
          <div class="tw-sh"><b>Followed Channels</b>${ti('arrow-left-to-line', 'tw-sc')}</div>
          ${FOLLOWED.map(([img, name, cat, n]) => `<div class="tw-sr${n ? '' : ' tw-off'}"><img src="${photo(img)}" alt=""/><span class="tw-st"><b>${esc(name)}</b>${cat ? `<span>${esc(cat)}</span>` : ''}</span>${n ? `<span class="tw-sv"><i></i>${esc(n)}</span>` : '<span class="tw-sv">Offline</span>'}</div>`).join('')}
        </aside>
        <main class="tw-main">
          <div class="tw-info"><img class="tw-av" src="${fern}" alt=""/><span class="tw-id"><h1>${CHANNEL}</h1><span>${FOLLOWERS}</span></span></div>
          <nav class="tw-tabs">${TABS.map((n) => `<span class="tw-tab${n === 'Schedule' ? ' on' : ''}">${n}</span>`).join('')}<span class="tw-tab">${ti('arrow-up-right', 'tw-ext')}Chat</span></nav>
          <div class="tw-cap">${esc(CAPTION)}</div>
          <div class="tw-bar"><span class="tw-today">Today</span><span class="tw-arw">${ti('chevron-left')}</span><span class="tw-arw">${ti('chevron-right')}</span><span class="tw-pick">${ti('calendar')}</span><span class="tw-range">${esc(RANGE)}</span></div>
          <div class="tw-grid">
            <div class="tw-times"><span class="tw-tz">EDT</span><span class="tw-hrs"></span></div>
            <div class="tw-rows">
              <div class="tw-week">${DAYS.map(([d, md]) => `<div class="tw-dn"><b>${d}</b><b>${md}</b></div>`).join('')}</div>
              <div class="tw-days">${STREAMS.map(([, , , title, cat, date, time]) => `<div class="tw-seg"><div class="tw-sg"><div class="tw-tx">
                <strong>${esc(title)}</strong><span class="tw-cat">${esc(cat)}</span><span class="tw-dt"><i></i><span>${esc(date)} · ${esc(time)}</span></span>
              </div></div></div>`).join('')}</div>
            </div>
          </div>
        </main>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const hrs = $('.tw-hrs'), days = $('.tw-days'), cap = $('.tw-cap'), grid = $('.tw-grid');
    const segs = [...layer.querySelectorAll('.tw-seg')].map((n, i) => ({ n, sg: n.firstElementChild, tx: n.querySelector('.tw-tx'), s: STREAMS[i] }));
    const edges = [...layer.querySelectorAll('.tw-nav, .tw-side')];

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null;
    let AW = 1745, AH = 982, pushS = PUSH.wide, edgeOut = null;
    // measured once per frame size (design px): the hour column width, the window's first hour, the row height
    let G = null;

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
      app.classList.toggle('tw-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('tc-tall', tall);
      pushS = tall ? PUSH.tall : PUSH.wide;
      edgeOut = null;
      // the hour labels for this window, then the geometry in the app's own px (offset* are untransformed)
      const [h0, h1] = tall ? HOURS.tall : HOURS.wide;
      hrs.innerHTML = Array.from({ length: h1 - h0 }, (_, i) => `<span>${hourLabel(h0 + i)}</span>`).join('');
      const colW = days.offsetWidth / (h1 - h0);
      [...hrs.children].forEach((n) => { n.style.width = `${colW.toFixed(3)}px`; });
      const rowH = layer.querySelector('.tw-dn').offsetHeight;
      G = { h0, colW, rowH };
      segs.forEach((g) => {
        const [row, a, b] = g.s;
        const w = (b - a) * colW;
        g.w = w;
        g.n.style.left = `${((a - h0) * colW).toFixed(2)}px`;
        g.n.style.top = `${(row * rowH + 6).toFixed(2)}px`;
        g.tx.style.width = `${(w - 2 - 16).toFixed(2)}px`;
      });
      // the push's focus, in design px: just past the grid's bottom right corner, so the whole week (its right edge, its
      // last row) stays in frame while the camera closes in on it
      let gx = 0, gy = 0;
      for (let n = grid; n && n !== app; n = n.offsetParent) { gx += n.offsetLeft; gy += n.offsetTop; }
      // (portrait: the grid's centre across instead, so both edges of the narrow frame keep a margin)
      G.fx = tall ? gx + grid.offsetWidth / 2 : Math.min(AW, gx + grid.offsetWidth + 16);
      G.fy = Math.min(AH, gy + grid.offsetHeight + 8);
    };

    // the pointer: in the chat, onto Authorize and a press, then away
    const ptr = (t) => {
      if (t >= T.card + PTR_IN && t <= T.tap + 0.45) {
        const a = T.card + PTR_IN, b = T.tap - 0.08;
        const g = x.box(auth);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
        const m = inOutCubic(seg(t, a, Math.min(a + PTR_MOVE, b)));
        const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
        return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave) };
      }
      return null;
    };

    return {
      nodes: [say, consent, card],
      marks: [[T.r, say], [T.card, consent], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        consent.style.opacity = ci.toFixed(3);
        consent.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // the press, then Authorize stays in its pressed tone
        const p = press(t, T.tap);
        auth.style.transform = p ? `scale(${(1 - 0.06 * p).toFixed(4)})` : 'none';
        auth.classList.toggle('tc-hit', t >= T.tap);

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

        // the week: each stream grows from its start time to its end time, its text fading in as it lands
        if (!G) return;
        segs.forEach((g, i) => {
          const m = outCubic(seg(t, T.flip[i], T.land[i]));
          g.n.style.width = `${(g.w * m).toFixed(2)}px`;
          g.n.style.visibility = m > 0 ? '' : 'hidden';
          const o = outCubic(seg(t, T.land[i] - TEXT_IN * 0.6, T.land[i] + TEXT_IN * 0.4));
          g.tx.style.opacity = o.toFixed(3);
        });
        // the caption names the next stream once Tuesday's is on the schedule
        cap.style.opacity = outCubic(seg(t, T.land[0] - 0.05, T.land[0] + 0.2)).toFixed(3);
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        const k0 = Wd / AW;
        // the payoff push: just after the fifth stream lands, the frame closes in on the week (scaled about the grid's
        // bottom right corner, so the whole week stays in frame)
        const pz = g >= 1 ? outQuint(seg(t, T.push, T.push + PUSH_IN)) : 0;
        const ps = lerp(1, pushS, pz);
        const fx = G ? G.fx : 0, fy = G ? G.fy : 0;
        app.style.transform = pz > 0 ? `translate(${(k0 * fx * (1 - ps)).toFixed(2)}px, ${(k0 * fy * (1 - ps)).toFixed(2)}px) scale(${(k0 * ps).toFixed(5)})` : `scale(${k0.toFixed(5)})`;
        if (g >= 1 && !edgeOut && G) {
          // in design px: what the pushed frame would only half show fades out with the push
          const lo = fx - fx / pushS, hi = fx + (AW - fx) / pushS, top = fy - fy / pushS;
          const ar = app.getBoundingClientRect(), k = ar.width / AW / (pz > 0 ? ps : 1);
          edgeOut = edges.filter((n) => {
            const r = n.getBoundingClientRect();
            const l = (r.left - ar.left) / k, rr = (r.right - ar.left) / k, tt = (r.top - ar.top) / k;
            return r.width > 0 && (l < lo - 1 || rr > hi + 1 || tt < top - 1);
          });
        }
        edges.forEach((n) => { n.style.opacity = edgeOut && edgeOut.includes(n) ? (1 - pz).toFixed(3) : ''; });
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
