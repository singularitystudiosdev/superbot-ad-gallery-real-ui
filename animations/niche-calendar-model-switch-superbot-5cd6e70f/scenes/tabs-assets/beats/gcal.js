// Google Calendar beat, the finale: superbot books the week in Nina's own Google Calendar. Its line streams and
// Google's OAuth consent card lands in the chat (the Google "G", "superbot wants access to your Google Account", the
// account chip "Nina Alvarez", three scope rows with Google's own consent strings, Cancel / Continue). The pointer taps
// Continue, and the source's connect-card grammar follows: a checklist card ("Connected as Nina Alvarez", "6 client
// calls booked", "2 meetings moved, no overlaps", "Invites sent in each client's time zone") ticking in turn, with a mini
// window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW), the email fork's grammar.
// Full frame is Google Calendar on the web, light theme, Work week view of Mon Oct 5 to Fri Oct 9 2026 (GMT-04). The
// week first reads with both double bookings side by side (Tue: Design review / Dentist, Wed: Podcast recording /
// Invoice review); Design review and Invoice review glide to their new slots while Dentist and Podcast recording widen
// back to the full column; the six client calls drop in one by one; then the ONE bold moment: Google's dark snackbar
// "6 calls booked. Invites sent." lands bottom left on the finished week (the chime), and the final state holds (READ).
//
// There is ONE Calendar client, on a layer in the scene root (outside the camera). While the checklist card sits in
// the chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The client is
// laid out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the
// full frame are the same pixels at two sizes. On a portrait frame (4:5) it takes Google's narrow layout: the sidebar
// collapsed, a compact top bar, the same five-day grid with narrower columns.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ms } from './gm-icons.js?v=5cd6e70f';

const SAY = 'Booking it in your own Google Calendar, so every invite comes from you.';
const ACCOUNT = 'Nina Alvarez';
// Google's consent strings for the three scopes, verbatim from https://developers.google.com/identity/protocols/oauth2/scopes
// (fetched 2026-10-03): calendar.events, calendar.settings.readonly, gmail.readonly
const SCOPES = [
  ['calendar', 'View and edit events on all your calendars'],
  ['calendar', 'View your Calendar settings'],
  ['gmail', 'View your email messages and settings'],
];
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['calendar', '6 client calls booked'],
  ['moved', '2 meetings moved, no overlaps'],
  ['zones', 'Invites sent in each client\'s time zone'],
];
const SNACK = '6 calls booked. Invites sent.';
// the work week on screen: Mon Oct 5 to Fri Oct 9 2026 (today, Sat Oct 3, is not in view)
const DAYS = [['MON', '5'], ['TUE', '6'], ['WED', '7'], ['THU', '8'], ['FRI', '9']];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const G0 = 7.6, G1 = 18.4;                       // the grid's first and last visible hour (8 AM to 6 PM read whole)
// events: [day, start, end, title, time label, calendar]. a = before, b = after the moves (Google lays overlapping
// events side by side: lane of lanes). Times are Google's lowercase start time, never a range.
const NINA = [
  { d: 0, s: 11.5, e: 12.5, title: 'Weekly planning', at: '11:30am' },
  { d: 1, s: 10, e: 11, title: 'Design review', at: '10am', lane: [0, 2], to: { s: 15, e: 16, at: '3pm', lane: [0, 1] } },
  { d: 1, s: 10.5, e: 11.5, title: 'Dentist', at: '10:30am', lane: [1, 2], to: { lane: [0, 1] } },
  { d: 1, s: 12.5, e: 13.5, title: 'Lunch with Sam', at: '12:30pm' },
  { d: 2, s: 15, e: 16, title: 'Podcast recording', at: '3pm', lane: [0, 2], to: { lane: [0, 1] } },
  { d: 2, s: 15.5, e: 16, title: 'Invoice review', at: '3:30pm', lane: [1, 2], to: { s: 16.5, e: 17, at: '4:30pm', lane: [0, 1] } },
  { d: 3, s: 14, e: 15, title: 'Portfolio update', at: '2pm' },
  { d: 4, s: 9, e: 12, title: 'Focus time', at: '9am', focus: true },
];
// the six client calls, in the order they drop in (Clients calendar)
const CALLS = [
  { d: 0, s: 10, e: 10.5, title: 'Harbor & Pine kickoff', at: '10am' },
  { d: 0, s: 14, e: 14.75, title: 'Fernwood Goods brand review', at: '2pm' },
  { d: 1, s: 9, e: 9.5, title: 'Brightwater Cycles kickoff', at: '9am' },
  { d: 2, s: 13, e: 13.75, title: 'Lumen & Tide strategy call', at: '1pm' },
  { d: 3, s: 11, e: 11.5, title: 'Copperleaf Cafe intro call', at: '11am' },
  { d: 4, s: 14, e: 14.5, title: 'Northgate Dental intro call', at: '2pm' },
];
// the mini month, Sunday first (US): Sep 27 to Nov 7 2026; today is Oct 3, the week on screen is Oct 5 to 9
const MINI = Array.from({ length: 42 }, (_, i) => {
  const n = i - 4; // Oct 1 2026 is a Thursday: cell 4
  if (n < 0) return [String(27 + i), 'out'];
  if (n >= 31) return [String(n - 30), 'out'];
  return [String(n + 1), n + 1 === 3 ? 'now' : n + 1 >= 5 && n + 1 <= 9 ? 'sel' : ''];
});
const MY = [['Nina Alvarez', 'nina', true], ['Clients', 'client', true], ['Tasks', '', false], ['Birthdays', '', false]];
const OTHER = [['Holidays in United States', '', false]];

const APP_SCALE = { wide: 1.2, tall: 1.2 };     // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the consent card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */            // the consent card landed to the tap on Continue (it reads first)
const PTR_IN = 0.3;                              // the consent card landed to the pointer appearing
const PTR_MOVE = 0.38;                           // the pointer's travel onto Continue, ending just before the tap
const LIST_AT = 0.25;                            // the tap to the checklist card landing
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const MOVE_AT = 0.55; /* deliberate */           // full frame to the moves: the week reads with both overlaps first
const MOVE = 0.6;                                // the two meetings gliding to their new slots
const DROP_AT = 0.15;                            // the moves landed to the first client call dropping in
const DROP_STAGGER = 0.16;                       // one call to the next
const DROP = 0.3;                                // a call dropping into its slot
const SNACK_AT = 0.12;                           // the last call landed to the snackbar rising (the chime)
const SNACK_IN = 0.3;
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const hourLabel = (h) => `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the consent card lands
    T.tap = T.card + TAP_AT;                           // Continue is tapped
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.mv = T.full + MOVE_AT;                           // the two meetings start gliding
    T.drop = CALLS.map((_, i) => T.mv + MOVE + DROP_AT + i * DROP_STAGGER);
    T.snack = T.drop[CALLS.length - 1] + DROP + SNACK_AT; // the snackbar rises (the chime)
    T.settle = T.snack + SNACK_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.snack });

    // ---- the consent card in the chat ----
    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="gc-card">
      <div class="gc-top"><img src="${icon('google-g.svg')}" alt=""/><span>Sign in with Google</span></div>
      <div class="gc-body">
        <div class="gc-title">superbot wants access to your Google Account</div>
        <span class="gc-acct"><i class="gc-av">N</i>${esc(ACCOUNT)}${ms('keyboard-arrow-down', 'gc-dd')}</span>
        <div class="gc-sel">Select what <b>superbot</b> can access</div>
        ${SCOPES.map(([app, txt]) => `<div class="gc-row"><img src="${icon(app === 'gmail' ? 'gmail-logo.svg' : 'google-calendar.svg')}" alt=""/><span>${esc(txt)}</span><i class="gc-cb">${ms('check')}</i></div>`).join('')}
        <div class="gc-btns"><span class="gc-cancel">Cancel</span><span class="gc-go">Continue</span></div>
      </div>
    </div>`);
    const go = consent.querySelector('.gc-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av">N</span>'
      : kind === 'calendar' ? `<span class="gk-ic gk-img"><img src="${icon('google-calendar.svg')}" alt=""/></span>`
        : `<span class="gk-ic gk-ms">${ms(kind === 'moved' ? 'event-repeat-outline' : 'public')}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame Google Calendar client ----
    const chip = (ev, cal) => `<div class="gx-ev gx-${cal}${ev.e - ev.s <= 0.5 ? ' gx-short' : ''}">${ev.focus ? ms('headphones', 'gx-fi') : ''}<b>${esc(ev.title)}</b><span class="gx-at">${esc(ev.at)}</span>${ev.to && ev.to.at ? `<span class="gx-at gx-at2">${esc(ev.to.at)}</span>` : ''}</div>`;
    const box = (on, cal) => `<i class="gx-cb${on ? ` gx-cb-on gx-${cal}` : ''}">${on ? ms('check') : ''}</i>`;
    const calItem = ([label, cal, on]) => `<div class="gx-ci">${box(on, cal)}<span>${esc(label)}</span></div>`;
    const layer = x.el(`<div class="gx-full" aria-hidden="true"><div class="gx-app">
      <header class="gx-top">
        <span class="gx-btn">${ms('menu')}</span>
        <span class="gx-logo"><img src="${icon('google-calendar.svg')}" alt=""/><span>Calendar</span></span>
        <span class="gx-today">Today</span>
        <span class="gx-nav"><span class="gx-btn gx-sm">${ms('chevron-left')}</span><span class="gx-btn gx-sm">${ms('chevron-right')}</span></span>
        <span class="gx-title">October 2026</span>
        <span class="gx-tools"><span class="gx-btn">${ms('search')}</span><span class="gx-btn">${ms('help-outline')}</span><span class="gx-btn">${ms('settings-outline')}</span>
          <span class="gx-view">Week${ms('arrow-drop-down')}</span><span class="gx-btn">${ms('apps')}</span></span>
        <span class="gx-me">N</span>
      </header>
      <div class="gx-main">
        <nav class="gx-side">
          <span class="gx-create">${ms('add')}<span>Create</span></span>
          <div class="gx-mm">
            <div class="gx-mmh"><b>October 2026</b><span class="gx-btn gx-xs">${ms('chevron-left')}</span><span class="gx-btn gx-xs">${ms('chevron-right')}</span></div>
            <div class="gx-mmg">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<small>${d}</small>`).join('')}${MINI.map(([n, c]) => `<i class="${c ? `gx-${c}` : ''}">${n}</i>`).join('')}</div>
          </div>
          <div class="gx-sh"><span>My calendars</span>${ms('keyboard-arrow-up')}</div>
          ${MY.map(calItem).join('')}
          <div class="gx-sh"><span>Other calendars</span><span class="gx-shi">${ms('add')}${ms('keyboard-arrow-up')}</span></div>
          ${OTHER.map(calItem).join('')}
        </nav>
        <section class="gx-week">
          <div class="gx-head"><span class="gx-tz">GMT-04</span>${DAYS.map(([d, n]) => `<div class="gx-day"><small>${d}</small><b>${n}</b></div>`).join('')}</div>
          <div class="gx-grid">
            <div class="gx-gut">${HOURS.map((h) => `<small data-h="${h}">${hourLabel(h)}</small>`).join('')}</div>
            <div class="gx-cols">
              ${HOURS.map((h) => `<i class="gx-hl" data-h="${h}"></i>`).join('')}
              ${DAYS.map(() => '<div class="gx-col"></div>').join('')}
            </div>
          </div>
        </section>
        <nav class="gx-rail"><span class="gx-ra"><img src="${icon('google-keep.svg')}" alt=""/></span><span class="gx-ra"><img src="${icon('google-tasks.svg')}" alt=""/></span>
          <span class="gx-ra"><img src="${icon('google-contacts.svg')}" alt=""/></span><i class="gx-rsep"></i><span class="gx-ra gx-radd">${ms('add')}</span></nav>
      </div>
      <div class="gx-snack">${esc(SNACK)}</div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const cols = [...layer.querySelectorAll('.gx-col')];
    const grid = $('.gx-cols');
    const hLines = [...layer.querySelectorAll('.gx-hl')], hLabels = [...layer.querySelectorAll('.gx-gut small')];
    const mk = (ev, cal) => { const n = x.el(chip(ev, cal)); cols[ev.d].appendChild(n); return { ev, n, at2: n.querySelector('.gx-at2'), at1: n.querySelector('.gx-at:not(.gx-at2)') }; };
    const nina = NINA.map((ev) => mk(ev, 'nina'));
    const calls = CALLS.map((ev) => mk(ev, 'client'));
    const snack = $('.gx-snack');
    // the client's type is Google Sans Flex + Roboto (vendored, gcal.css): ask for every face it uses up front so a
    // seek never measures in the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 16px "GSF"`));
    }

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tall = false;
    let AW = 1600, AH = 900, HPX = 60, CW = 200;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('gx-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('gc-tall', tall);
      // the grid's hour scale: the visible hours G0..G1 fill the grid's height
      HPX = grid.clientHeight / (G1 - G0);
      CW = cols[0].clientWidth;
      hLines.forEach((n) => { n.style.top = `${((+n.dataset.h - G0) * HPX).toFixed(2)}px`; });
      hLabels.forEach((n) => { n.style.top = `${((+n.dataset.h - G0) * HPX).toFixed(2)}px`; });
    };

    // one event's box at move progress m: start/end and lane interpolate from a (before) to b (after)
    const GAP_R = () => (tall ? 4 : 12); // Google keeps a strip free on the right of every day for click-to-create
    const place = (o, m) => {
      const ev = o.ev, to = ev.to || {};
      const la = ev.lane || [0, 1], lb = to.lane || la;
      const s = lerp(ev.s, to.s ?? ev.s, m), e = lerp(ev.e, to.e ?? ev.e, m);
      const w = CW - GAP_R();
      const L = lerp(la[0] * (w / la[1]), lb[0] * (w / lb[1]), m), Wd = lerp(w / la[1], w / lb[1], m);
      o.n.style.top = `${((s - G0) * HPX + 1).toFixed(2)}px`;
      o.n.style.height = `${((e - s) * HPX - 2).toFixed(2)}px`;
      o.n.style.left = `${L.toFixed(2)}px`;
      o.n.style.width = `${Wd.toFixed(2)}px`;
      // the start time follows the move once it is past halfway; a half-width short event in the narrow layout shows
      // its title only (Google shows what fits)
      const after = m >= 0.5;
      if (o.at2) { o.at1.style.display = after ? 'none' : ''; o.at2.style.display = after ? '' : 'none'; }
      o.n.classList.toggle('gx-half', Wd < w * 0.75);
    };

    // the pointer: in from below right, onto Continue, a press, then away
    const ptr = (t) => {
      const a = T.card + PTR_IN, b = T.tap - 0.08;
      if (t < a || t > T.tap + 0.45) return null;
      const g = x.box(go);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
      const m = inOutCubic(seg(t, a, a + PTR_MOVE > b ? b : a + PTR_MOVE));
      const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
      return {
        x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30,
        p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave),
      };
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
        // Continue: the press, then it stays in its pressed (state-layer) tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('gc-hit', t >= T.tap);

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

        // the week: the two moves glide (inOutCubic), the overlapped pair widens with them
        const m = inOutCubic(seg(t, T.mv, T.mv + MOVE));
        nina.forEach((o) => place(o, m));
        // the client calls drop in one by one: down a few px into their slot while they fade up
        calls.forEach((o, i) => {
          place(o, 0);
          const q = outCubic(seg(t, T.drop[i], T.drop[i] + DROP));
          o.n.style.opacity = q.toFixed(3);
          o.n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * -12).toFixed(2)}px)`;
        });
        const sn = outCubic(seg(t, T.snack, T.snack + SNACK_IN));
        snack.style.opacity = sn.toFixed(3);
        snack.style.transform = sn >= 1 ? 'none' : `translateY(${((1 - sn) * 24).toFixed(2)}px)`;
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
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
