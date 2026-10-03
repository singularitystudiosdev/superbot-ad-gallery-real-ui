// Gmail beat, the finale: superbot sends the emails from the user's own Gmail. Its line streams and Google's OAuth
// consent card lands in the chat (the Google "G", "superbot wants access to your Google Account", the account chip
// "Sam Ortiz", three scope rows with Google's own consent strings, Cancel / Continue). The pointer taps Continue, and
// the source's connect-card grammar follows: a checklist card ("Connected as Sam Ortiz", "40 emails sent from your
// Gmail", "Follow-ups set for Thursday 9:00 AM", "Watching for replies") ticking in turn, with a mini window under it;
// the card holds (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the Discord fork's finale.
// Full frame is Gmail on the web, light theme, the "Cold brew outreach" label view: the 40 sent emails, each with its
// own subject. The ONE bold moment: Maya's reply lands as a new unread row at the top (the chime), then the Calendar
// side panel opens on Thursday's tasting and a snackbar confirms it, and the final state holds (READ).
//
// There is ONE Gmail client, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it takes a narrow layout: the top bar, the label
// header, three-line rows, the Calendar event as a compact card under the list.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ms } from './gm-icons.js?v=a07d6c19';

const SAY = 'Sending from your own Gmail, so the replies come back to you.';
const ACCOUNT = 'Sam Ortiz';
// Google's consent strings for the three scopes, verbatim from developers.google.com (Gmail API scopes page and
// identity/protocols/oauth2/scopes, fetched 2026-10-03): gmail.send, gmail.modify, calendar.events
const SCOPES = [
  ['gmail', 'Send email on your behalf'],
  ['gmail', 'Read, compose, and send emails from your Gmail account'],
  ['calendar', 'View and edit events on all your calendars'],
];
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['gmail', '40 emails sent from your Gmail'],
  ['sched', 'Follow-ups set for Thursday 9:00 AM'],
  ['watch', 'Watching for replies'],
];
const LABEL = 'Cold brew outreach';
const SENT_AT = '9:41 AM';
// the label view: the 40 emails superbot sent, each with its own subject. [subject, snippet]. The first five are the
// shortlist's cafes (research.js), the rest made up for the spot.
const SENT = [
  ['Cold brew for the new patio?', `Hi Maya, saw Juniper Street just opened the patio. Iced drinks are about to be your best sellers`],
  ['For the second shop, day one', 'Hi Dev, congrats on the second Pecan Row. A cold brew on tap from the first morning'],
  ['A brunch drink your regulars will ask for', 'Hi Rosa, weekend brunch at Bluebonnet looks great. Brunch crowds order iced'],
  ['Something cold for the midnight crowd', 'Hi Eli, open till midnight is rare in Austin. A cold brew that holds all night'],
  ['Your reviews keep asking for iced', 'Hi Nora, half of your recent reviews mention iced drinks. We brew a 20-hour batch'],
  ['Cold brew for the study tables', 'Hi Theo, your back room fills up with students every afternoon. A cold brew'],
  ['A summer menu idea for your bar', 'Hi June, your new summer menu is all citrus and tonic. Cold brew tonic fits right in'],
  ['For the dog-friendly porch', 'Hi Marco, the porch looks packed on weekends. Something iced for the people too'],
  ['Iced coffee that travels well', 'Hi Lena, your to-go window is busy from seven. Our cold brew holds for hours'],
  ['A local roast for your local menu', 'Hi Omar, you list every farm on your menu. We roast ten minutes away'],
  ['Cold brew for the lunch line', 'Hi Ana, the line out front at lunch goes around the block. A grab-and-go bottle'],
  ['Something new for the bakery case', 'Hi Ben, your pastry case is the best in town. It needs a cold drink beside it'],
  ['A cold option for your morning regulars', 'Hi Kim, your regulars come in early and stay. Cold brew on the counter'],
  ['For the new late menu', 'Hi Ravi, saw the new late menu. Cold brew works after dark too'],
  ['Cold brew on tap, no extra staff', 'Hi Tess, a keg on tap means no extra prep for your team. Could I bring'],
  ['A tasting for your team this week', 'Hi Cole, I would love to pour a few samples for your baristas'],
  ['Cold brew for game days', 'Hi Jess, your game-day crowd fills every seat. Something iced for halftime'],
];
const REPLY = {
  from: 'Maya, me', n: '2', chip: 'Tasting booked', subject: 'Re: Cold brew for the new patio?',
  snippet: 'Love this. Thursday works, come by around 10?', time: '9:58 AM',
};
const EVENT = ['Cold brew tasting, Juniper Street Cafe', '10:00 AM'];
const DAY = ['THU', '8', 'Thursday, October 8'];
const SNACK = 'Reply sent. Tasting added to Calendar.';
const HOURS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM'];
const NAV = [
  ['inbox-outline', 'Inbox', '3'], ['star-outline', 'Starred'], ['schedule-outline', 'Snoozed'], ['send-outline', 'Sent'],
  ['draft-outline', 'Drafts', '2'], ['schedule-send-outline', 'Scheduled', '38'], ['keyboard-arrow-down', 'More'],
];
const LABELS = [['Roastery'], ['Wholesale'], [LABEL, '40', true]];

const APP_SCALE = { wide: 1.2, tall: 1.2 };         // full frame: the client's px to frame px
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
const REPLY_AT = 0.3;                            // full frame to the reply row landing (the chime)
const LAND = 0.45;                               // the reply row's slot opening and its content fading up
const TINT = 1.2;                                // the new row's blue wash fading back to unread white
const PANEL_AT = 0.45;                           // the reply landed to the Calendar panel opening
const PANEL = 0.4;                               // the panel opening
const EVENT_AT = 0.2;                            // the panel opening to the event popping in
const EVENT_IN = 0.25;
const SNACK_AT = 0.1;                            // the event to the snackbar rising
const SNACK_IN = 0.3;
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame
const PANEL_W = 312;                             // the Calendar panel's slot in the wide layout (296 + 16 gap)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the consent card lands
    T.tap = T.card + TAP_AT;                           // Continue is tapped
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.rep = T.full + REPLY_AT;                         // the reply row lands (the chime)
    T.panel = T.rep + LAND + PANEL_AT;                 // the Calendar panel opens
    T.ev = T.panel + EVENT_AT;                         // the event pops in
    T.snack = T.ev + EVENT_IN + SNACK_AT;              // the snackbar rises
    T.settle = Math.max(T.snack + SNACK_IN, T.rep + TINT);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.rep });

    // ---- the consent card in the chat ----
    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="gc-card">
      <div class="gc-top"><img src="${icon('google-g.svg')}" alt=""/><span>Sign in with Google</span></div>
      <div class="gc-body">
        <div class="gc-title">superbot wants access to your Google Account</div>
        <span class="gc-acct"><i class="gc-av">S</i>${esc(ACCOUNT)}${ms('keyboard-arrow-down', 'gc-dd')}</span>
        <div class="gc-sel">Select what <b>superbot</b> can access</div>
        ${SCOPES.map(([app, txt]) => `<div class="gc-row"><img src="${icon(app === 'gmail' ? 'gmail-logo.svg' : 'google-calendar.svg')}" alt=""/><span>${esc(txt)}</span><i class="gc-cb">${ms('check')}</i></div>`).join('')}
        <div class="gc-btns"><span class="gc-cancel">Cancel</span><span class="gc-go">Continue</span></div>
      </div>
    </div>`);
    const go = consent.querySelector('.gc-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av">S</span>'
      : kind === 'gmail' ? `<span class="gk-ic gk-img"><img src="${icon('gmail-logo.svg')}" alt=""/></span>`
        : `<span class="gk-ic gk-ms">${ms(kind === 'sched' ? 'schedule-send-outline' : 'mail-outline')}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame Gmail client ----
    const row = (s, i) => `<div class="gm-row"><span class="gm-ck">${ms('check-box-outline-blank')}</span><span class="gm-star">${ms('star-outline')}</span>
      <span class="gm-from">me</span><span class="gm-txt"><b>${esc(s[0])}</b><span class="gm-snip">${esc(s[1])}</span></span><time>${SENT_AT}</time></div>`;
    const reply = `<div class="gm-slot"><div class="gm-row gm-unread gm-new"><i class="gm-wash"></i><span class="gm-ck">${ms('check-box-outline-blank')}</span><span class="gm-star">${ms('star-outline')}</span>
      <span class="gm-from">${esc(REPLY.from)} <small>${REPLY.n}</small></span><span class="gm-txt"><span class="gm-chip">${esc(REPLY.chip)}</span><b>${esc(REPLY.subject)}</b><span class="gm-snip">${esc(REPLY.snippet)}</span></span><time>${REPLY.time}</time></div></div>`;
    const navItem = ([ic, label, n]) => `<div class="gm-nv">${ms(ic)}<span>${esc(label)}</span>${n ? `<small>${n}</small>` : ''}</div>`;
    const labelItem = ([label, n, on]) => `<div class="gm-nv${on ? ' gm-on' : ''}">${ms(on ? 'label' : 'label-outline')}<span>${esc(label)}</span>${n ? `<small>${n}</small>` : ''}</div>`;
    const layer = x.el(`<div class="gm-full" aria-hidden="true"><div class="gm-app">
      <header class="gm-top">
        <span class="gm-btn">${ms('menu')}</span>
        <span class="gm-logo"><img src="${icon('gmail-logo.svg')}" alt=""/><span>Gmail</span></span>
        <div class="gm-search"><span class="gm-btn gm-sbtn">${ms('search')}</span><span>Search mail</span></div>
        <span class="gm-tools"><span class="gm-btn">${ms('help-outline')}</span><span class="gm-btn">${ms('settings-outline')}</span><span class="gm-btn">${ms('apps')}</span></span>
        <span class="gm-me">S</span>
      </header>
      <div class="gm-main">
        <nav class="gm-nav">
          <span class="gm-compose">${ms('edit-outline')}<span>Compose</span></span>
          ${NAV.map(navItem).join('')}
          <div class="gm-lbh"><span>Labels</span>${ms('add')}</div>
          ${LABELS.map(labelItem).join('')}
        </nav>
        <section class="gm-list">
          <div class="gm-bar"><span class="gm-btn gm-sm">${ms('check-box-outline-blank')}</span>${ms('arrow-drop-down', 'gm-dd')}<span class="gm-btn gm-sm">${ms('refresh')}</span><span class="gm-btn gm-sm">${ms('more-vert')}</span>
            <span class="gm-pg"><span class="gm-btn gm-sm">${ms('chevron-left')}</span><span class="gm-btn gm-sm">${ms('chevron-right')}</span></span></div>
          <div class="gm-lh">${ms('label')}<b>${esc(LABEL)}</b><small>40</small></div>
          <div class="gm-rows">${reply}${SENT.map(row).join('')}</div>
          <div class="gm-cslot"><div class="gm-ccard"><img src="${icon('google-calendar.svg')}" alt=""/><div class="gm-cc-main"><small>${esc(DAY[2])}</small>
            <div class="gm-ev gm-ev-c"><b>${esc(EVENT[0])}</b><span>${esc(EVENT[1])}</span></div></div></div></div>
        </section>
        <aside class="gm-panel"><div class="gm-pin">
          <div class="gm-ph"><b>Calendar</b><span class="gm-btn gm-sm">${ms('close')}</span></div>
          <div class="gm-pnav"><span class="gm-today">Today</span><span class="gm-btn gm-sm">${ms('chevron-left')}</span><span class="gm-btn gm-sm">${ms('chevron-right')}</span><span class="gm-pd">Thu, Oct 8</span></div>
          <div class="gm-pday"><small>${DAY[0]}</small><b>${DAY[1]}</b></div>
          <div class="gm-grid">${HOURS.map((h) => `<div class="gm-hr"><small>${h}</small><i></i></div>`).join('')}
            <div class="gm-ev gm-ev-p"><b>${esc(EVENT[0])}</b><span>${esc(EVENT[1])}</span></div></div>
        </div></aside>
        <nav class="gm-rail"><span class="gm-ra gm-ra-cal"><img src="${icon('google-calendar.svg')}" alt=""/></span><span class="gm-ra"><img src="${icon('google-keep.svg')}" alt=""/></span>
          <span class="gm-ra"><img src="${icon('google-tasks.svg')}" alt=""/></span><span class="gm-ra"><img src="${icon('google-contacts.svg')}" alt=""/></span><i class="gm-rsep"></i><span class="gm-ra gm-radd">${ms('add')}</span></nav>
      </div>
      <div class="gm-snack">${esc(SNACK)}</div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const slot = $('.gm-slot'), newRow = slot.firstElementChild, wash = $('.gm-wash');
    const panel = $('.gm-panel'), evP = $('.gm-ev-p'), raCal = $('.gm-ra-cal');
    const cslot = $('.gm-cslot'), ccard = cslot.firstElementChild, evC = $('.gm-ev-c');
    const snack = $('.gm-snack');
    // the client's type is Google Sans Flex + Roboto (vendored, gmail.css): ask for every face it uses up front so a
    // seek never measures a slot in the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 16px "GSF"`));
    }

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tall = false, slotH = '', cH = '';
    let AW = 1536, AH = 864;

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
      app.classList.toggle('gm-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('gc-tall', tall);
      slotH = ''; cH = '';
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

        // the reply row: its slot opens (pushing the label view down), the row fades up behind it, and its blue wash
        // fades back to unread white
        const g = outCubic(seg(t, T.rep, T.rep + LAND));
        const h = newRow.offsetHeight;
        const want = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
        if (want !== slotH) { slot.style.height = want; slotH = want; }
        const f = outCubic(seg(t, T.rep + LAND * 0.3, T.rep + LAND));
        newRow.style.opacity = f.toFixed(3);
        newRow.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * -10).toFixed(2)}px)`;
        wash.style.opacity = (t < T.rep ? 1 : 1 - inOutCubic(seg(t, T.rep + LAND, T.rep + TINT))).toFixed(3);

        // the Calendar: the side panel opens (wide) or the compact card opens under the list (narrow)
        const p = inOutCubic(seg(t, T.panel, T.panel + PANEL));
        panel.style.width = `${(PANEL_W * p).toFixed(2)}px`;
        raCal.classList.toggle('gm-ra-on', p > 0.5);
        const ch = ccard.offsetHeight;
        const cw = p >= 1 ? 'auto' : `${(ch * p).toFixed(2)}px`;
        if (cw !== cH) { cslot.style.height = cw; cH = cw; }
        ccard.style.opacity = p.toFixed(3);
        const e = outCubic(seg(t, T.ev, T.ev + EVENT_IN));
        [evP, evC].forEach((ev) => {
          ev.style.opacity = e.toFixed(3);
          ev.style.transform = e >= 1 ? 'none' : `scale(${lerp(0.92, 1, e).toFixed(4)})`;
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
