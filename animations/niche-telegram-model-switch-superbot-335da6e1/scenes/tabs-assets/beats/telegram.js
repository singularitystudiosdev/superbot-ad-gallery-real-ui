// Telegram beat, the finale: superbot adds the bot to the group. Its line streams and a Telegram-styled sheet lands in
// the chat (Telegram Web A's light sheet: Roboto, its blue). Three panes slide in turn, Telegram's own slide: "Add
// Harbor Lane FAQ to a group" with the group row selected; "Admin Rights" ("What can this admin do?", Delete Messages
// and Pin Messages switched on, Add New Admins left off) and the "Add bot as admin" button pressed by the pointer; then
// the checklist ticks (Bot created in BotFather, Added to Harbor Lane Run Club as admin, Webhook connected, 12 answers
// live). The card holds (CARD_HOLD) and opens to full frame (GROW), the grammar of the 3b7e91c4 fork's connect beat.
// Full frame is Telegram Web A in its default light theme, as Sam sees it: the chat list (Harbor Lane Run Club
// selected) and the group chat over the default wallpaper's gradient colours (no pattern), the earlier messages
// already there, the service line "Sam added Harbor Lane FAQ". Then the one bold moment: Priya's question slides in,
// the header flips to "Harbor Lane FAQ is typing...", and the bot's reply lands under it as a Telegram reply (a quote
// strip of her message on top) within a second, and that final state holds (READ) before the end card. (Priya's
// optional thank-you closer is left out: it would push the spot past its 26.5 s ceiling.)
//
// There is ONE Telegram client, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's pane box (and transparent); GROW fades it up as it opens from there to the whole
// frame. The client is laid out once at a design size (the frame divided by APP_SCALE, so its type reads like Telegram
// Web at that zoom) and scaled to the layer. On a portrait frame (4:5) it takes Telegram's narrow layout: the chat
// pane alone, with its back arrow.
// Messages that land open their slot (height, from the content's own measured height, which pushes the thread up the
// way Telegram does: bottom-anchored) and slide up behind it. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';

const SAY = 'Added Harbor Lane FAQ to Harbor Lane Run Club as an admin.';
const GROUP = 'Harbor Lane Run Club';
const BOT = 'Harbor Lane FAQ';
const MEMBERS = '1,248 members';
const SUB = `${MEMBERS}, 87 online`;
const TYPING = `${BOT} is typing`;
const ASKQ = 'Hi all, new here. What time is the Saturday long run, and where do we meet?';
const ANSWER = 'Saturdays at 7:00 AM at the Harbor Lane boathouse. Pace groups run 9, 10 and 11 min/mile. Rain or shine, only lightning cancels.';
const NOW = '7:42';
// people: [name colour, letter-avatar gradient] (chat.css --tg-n-* / --tg-a-*: Telegram's own peer palette)
const PEOPLE = {
  Elena: 'pink', Tom: 'green', Priya: 'purple', [BOT]: 'orange', [GROUP]: 'blue',
  Jonas: 'sea', Maya: 'red', Nora: 'orange', Leo: 'green', 'Saturday Coffee': 'purple', 'Race Team 2026': 'red',
};
// the thread before the bold moment: [who, time, text]. Made up for the spot.
const THREAD = [
  ['Elena', '7:31', "Bridge loop Thursday, who's in?"],
  ['Tom', '7:33', 'Me! 6 PM at the boathouse?'],
  ['Elena', '7:34', 'Yes, see you there'],
];
// the chat list: [title, time, preview, unread, muted]
const CHATS = [
  [GROUP, NOW, null, 0, false],
  ['Elena', '7:15', 'See you at the track!', 0, false],
  ['Saturday Coffee', '6:50', 'Tom: Oat milk this time please', 3, true],
  ['Race Team 2026', 'Tue', 'Nora: Intervals moved to 6 PM', 2, false],
  ['Jonas', 'Mon', 'Running late, start without me', 0, false],
  ['Maya', 'Sun', 'Thanks for the shoe tip', 0, false],
  ['Leo', 'Sat', 'Nice pace today', 0, false],
];
// the group row's preview follows the thread: [from t-key, sender, text]
const PREVIEW = [
  [null, 'Sam', `added ${BOT}`],
  ['ask', 'Priya', ASKQ],
  ['reply', BOT, ANSWER],
];
const CHECKS = ['Bot created in BotFather', `Added to ${GROUP} as admin`, 'Webhook connected', '12 answers live'];
// the admin rights panel (Telegram's own wording: Web A fallback.strings / Android strings.xml): [label, on at the end, flips on]
const RIGHTS = [
  ['Change Group Info', false],
  ['Delete Messages', true],
  ['Pin Messages', true],
  ['Add New Admins', false],
];

const APP_SCALE = { wide: 1.4, tall: 1.2 };     // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.2;                             // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const SEL_AT = 0.24;                             // the card landing to the group row being picked
const SLIDE = 0.32;                              // a pane sliding in (Telegram's slide)
const P2_AT = 0.2;                               // the pick to the Admin Rights pane
const TOG_AT = [0.3, 0.42];                      // the pane in to each right switching on
const TOG = 0.16;                                // a switch flipping
const CLICK_AT = 0.74;                           // the pane in to the button press
const P3_AT = 0.18;                              // the press to the checklist pane
const CHECK_AT = 0.22;                           // the checklist in to its first check
const CHECK_STAGGER = 0.13;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the card opens to full frame
const ASK_AT = 0.4;                              // full frame to Priya's question landing
const TYPE_AT = 0.22;                            // her question landing to the header's typing line
const TYPE_FOR = 0.42; /* deliberate */          // the typing line (the brief: ~0.4 s); the reply lands as it ends
const LAND = 0.3;                                // a message's slot opening and its content sliding up
const READ = 1.5; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 12;                               // the card's radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Material Design Icons (Pictogrammers, Apache 2.0), paths verbatim from the Iconify API (api.iconify.design, mdi set)
const mdi = (d, cls = '') => `<svg class="tg-i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const I = {
  menu: mdi('M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z'),
  search: mdi('M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5l-1.5 1.5l-5-5v-.79l-.27-.27A6.52 6.52 0 0 1 9.5 16A6.5 6.5 0 0 1 3 9.5A6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14S14 12 14 9.5S12 5 9.5 5'),
  dots: mdi('M12 16a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2'),
  back: mdi('M20 11v2H8l5.5 5.5l-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5L8 11z'),
  close: mdi('M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z'),
  clip: mdi('M16.5 6v11.5a4 4 0 0 1-4 4a4 4 0 0 1-4-4V5A2.5 2.5 0 0 1 11 2.5A2.5 2.5 0 0 1 13.5 5v10.5a1 1 0 0 1-1 1a1 1 0 0 1-1-1V6H10v9.5a2.5 2.5 0 0 0 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5V5a4 4 0 0 0-4-4a4 4 0 0 0-4 4v12.5a5.5 5.5 0 0 0 5.5 5.5a5.5 5.5 0 0 0 5.5-5.5V6z', 'tg-clip'),
  smile: mdi('M12 17.5c2.33 0 4.3-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5M8.5 11A1.5 1.5 0 0 0 10 9.5A1.5 1.5 0 0 0 8.5 8A1.5 1.5 0 0 0 7 9.5A1.5 1.5 0 0 0 8.5 11m7 0A1.5 1.5 0 0 0 17 9.5A1.5 1.5 0 0 0 15.5 8A1.5 1.5 0 0 0 14 9.5a1.5 1.5 0 0 0 1.5 1.5M12 20a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8m0-18C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2'),
  mic: mdi('M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3m7 9c0 3.53-2.61 6.44-6 6.93V21h-2v-3.07c-3.39-.49-6-3.4-6-6.93h2a5 5 0 0 0 5 5a5 5 0 0 0 5-5z'),
  check: mdi('M21 7L9 19l-5.5-5.5l1.41-1.41L9 16.17L19.59 5.59z', 'tg-ck'),
  mute: mdi('M12 4L9.91 6.09L12 8.18M4.27 3L3 4.27L7.73 9H3v6h4l5 5v-6.73l4.25 4.26c-.67.51-1.42.93-2.25 1.17v2.07c1.38-.32 2.63-.95 3.68-1.81L19.73 21L21 19.73l-9-9M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.9 8.9 0 0 0 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71m-2.5 0c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.05-.2.05-.42.05-.63', 'tg-mute'),
};
// the bubble's tail: a plain curve under the bubble's square bottom-left corner (UI furniture)
const TAIL = '<svg class="tg-tail" viewBox="0 0 9 17" aria-hidden="true"><path d="M9 0v17H1.6c-.9 0-1.3-1.1-.6-1.7C5.2 11.6 8.4 6.6 9 0z"/></svg>';

// Telegram's letter avatar: the first letters of the first two words
const letters = (s) => s.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.sel = T.card + SEL_AT;                          // the group row is picked
    T.p2 = T.sel + P2_AT;                             // Admin Rights slides in
    T.tog = TOG_AT.map((d) => T.p2 + d);              // Delete Messages, Pin Messages switch on
    T.click = T.p2 + CLICK_AT;                        // "Add bot as admin" pressed
    T.p3 = T.click + P3_AT;                           // the checklist slides in
    T.ok = CHECKS.map((_, i) => T.p3 + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[CHECKS.length - 1] + POP + CARD_HOLD; // the card starts opening
    T.full = T.grow + GROW;                           // full frame
    T.ask = T.full + ASK_AT;                          // Priya's question lands
    T.typ = T.ask + TYPE_AT;                          // "Harbor Lane FAQ is typing..."
    T.reply = T.typ + TYPE_FOR;                       // the bot's reply lands (T.reply - T.ask < 1.0 s)
    T.settle = T.reply + LAND;                        // the last visible change: the reply settled
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('telegram-logo.svg');
    const av = (who, cls = 'tg-av') => `<span class="${cls}" style="--g: var(--tg-a-${PEOPLE[who]})">${esc(letters(who))}</span>`;
    const nameColor = (who) => `var(--tg-n-${PEOPLE[who]})`;

    // ---- the connect sheet in the chat: three panes that slide ----
    const say = x.el(`<div class="qc-say tc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const groups = [[GROUP, MEMBERS], ['Saturday Coffee', '6 members'], ['Race Team 2026', '24 members']];
    const card = x.el(`<div class="tc-card"><div class="tc-vp">
      <div class="tc-pane">
        <div class="tc-hd">${I.close}<b>Add ${esc(BOT)} to a group</b></div>
        <div class="tc-search">${I.search}<span>Search</span></div>
        ${groups.map(([g, m], i) => `<div class="tc-grp${i === 0 ? ' tc-pick' : ''}">${av(g, 'tc-av')}<span class="tc-gt"><b>${esc(g)}</b><small>${esc(m)}</small></span><span class="tc-radio">${i === 0 ? I.check : ''}</span></div>`).join('')}
      </div>
      <div class="tc-pane">
        <div class="tc-hd">${I.back}<b>Admin Rights</b></div>
        <div class="tc-sec">What can this admin do?</div>
        ${RIGHTS.map(([l, on]) => `<div class="tc-right${on ? ' tc-flip' : ''}"><span>${esc(l)}</span><i class="tc-sw"><i></i></i></div>`).join('')}
        <div class="tc-btn">Add bot as admin</div>
      </div>
      <div class="tc-pane">
        <div class="tc-hd tc-hd-tg"><span class="tc-mark"><img src="${mark}" alt=""/></span><b>Connected to Telegram</b></div>
        ${CHECKS.map((c) => `<div class="tc-step"><span class="tc-ok"><i class="tc-spin"></i><i class="tc-done">${I.check}</i></span><span>${esc(c)}</span></div>`).join('')}
      </div>
    </div></div>`);
    const vp = card.querySelector('.tc-vp');
    const panes = [...card.querySelectorAll('.tc-pane')];
    const pick = card.querySelector('.tc-pick'), radio = pick.querySelector('.tc-radio');
    const flips = [...card.querySelectorAll('.tc-flip')];
    const btn = card.querySelector('.tc-btn');
    const steps = [...card.querySelectorAll('.tc-step')].map((n) => ({ spin: n.querySelector('.tc-spin'), ok: n.querySelector('.tc-done') }));

    // ---- the full-frame Telegram Web client ----
    const bubble = (who, time, text, cls = '', quote = null) => `<div class="tg-msg ${cls}">${av(who)}
      <div class="tg-bub">${TAIL}<b class="tg-nm" style="color: ${nameColor(who)}">${esc(who)}</b>
        ${quote ? `<div class="tg-quote" style="--q: ${nameColor(quote[0])}"><b>${esc(quote[0])}</b><span>${esc(quote[1])}</span></div>` : ''}
        <div class="tg-tx">${esc(text)}<span class="tg-meta">${esc(time)}</span></div></div></div>`;
    const chatRow = ([title, time, prev, unread, muted], i) => `<div class="tg-row${i === 0 ? ' tg-sel' : ''}">${av(title, 'tg-rav')}
      <div class="tg-rm"><div class="tg-r1"><b>${esc(title)}</b>${muted ? I.mute : ''}<time>${esc(time)}</time></div>
        <div class="tg-r2"><span class="tg-pv">${prev ? esc(prev).replace(/^([A-Z][a-z]+):/, '<em>$1:</em>') : ''}</span>${unread ? `<i class="tg-badge${muted ? ' tg-muted' : ''}">${unread}</i>` : ''}</div></div></div>`;
    const layer = x.el(`<div class="tg-full" aria-hidden="true"><div class="tg-app">
      <aside class="tg-left">
        <div class="tg-lh">${I.menu}<div class="tg-search">${I.search}<span>Search</span></div></div>
        <div class="tg-chats">${CHATS.map(chatRow).join('')}</div>
      </aside>
      <main class="tg-chat">
        <div class="tg-wall"></div>
        <header class="tg-top">${I.back}${av(GROUP, 'tg-hav')}
          <div class="tg-ti"><b>${esc(GROUP)}</b><span class="tg-sub"><span class="tg-sub-a">${esc(SUB)}</span><span class="tg-sub-b">${esc(TYPING)}<i>.</i><i>.</i><i>.</i></span></span></div>
          <span class="tg-tools">${I.search}${I.dots}</span></header>
        <div class="tg-scroll"><div class="tg-list">
          <div class="tg-svc"><span>Today</span></div>
          ${THREAD.map(([w, tm, tx]) => bubble(w, tm, tx)).join('')}
          <div class="tg-svc"><span>Sam added ${esc(BOT)}</span></div>
          <div class="tg-slot">${bubble('Priya', NOW, ASKQ)}</div>
          <div class="tg-slot tg-bot">${bubble(BOT, NOW, ANSWER, '', ['Priya', ASKQ])}</div>
        </div></div>
        <div class="tg-comp"><div class="tg-input">${I.smile}<span>Message</span>${I.clip}</div><span class="tg-micb">${I.mic}</span></div>
      </main>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const slots = [...layer.querySelectorAll('.tg-slot')].map((s) => ({ s, c: s.firstElementChild, h: '' }));
    const subA = layer.querySelector('.tg-sub-a'), subB = layer.querySelector('.tg-sub-b');
    const dots = [...subB.querySelectorAll('i')];
    const pv = layer.querySelector('.tg-sel .tg-pv');
    // the client's type is Roboto (vendored, telegram.css): ask for every weight up front so a seek never measures a
    // slot in the fallback face
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 16px "Roboto TG"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, lastPv = -1;
    let AW = 1536, AH = 864;

    // the client's design size from the frame: W x H over APP_SCALE; a portrait frame takes the narrow layout
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
      app.classList.toggle('tg-narrow', tall);
    };

    // the pointer's way to the button: from below-right, onto it, pressed, away with the pane
    const pointerAt = (t) => {
      if (t < T.click - 0.5 || t > T.p3 + 0.12) return null;
      const b = x.box(btn);
      const m = inOutCubic(seg(t, T.click - 0.46, T.click - 0.06));
      const v = seg(t, T.click - 0.5, T.click - 0.36) * (1 - seg(t, T.p3 - 0.02, T.p3 + 0.12));
      return { x: lerp(b.x + b.w * 0.5 + 70, b.x + b.w * 0.62, m), y: lerp(b.y + b.h + 46, b.y + b.h * 0.55, m), p: press(t, T.click), v };
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      pointer: pointerAt,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // the panes: picker -> Admin Rights -> checklist, each a full-width slide
        const cur = inOutCubic(seg(t, T.p2, T.p2 + SLIDE)) + inOutCubic(seg(t, T.p3, T.p3 + SLIDE));
        panes.forEach((p, i) => {
          const d = i - cur;
          p.style.transform = `translateX(${(d * 100).toFixed(3)}%)`;
          p.style.visibility = Math.abs(d) >= 1 ? 'hidden' : '';
        });
        // the group row picked: its radio fills Telegram blue with the check
        const sp = outCubic(seg(t, T.sel, T.sel + 0.18));
        pick.classList.toggle('tc-on', t >= T.sel);
        radio.style.transform = `scale(${(t >= T.sel ? lerp(0.6, 1, sp) : 1).toFixed(4)})`;
        // the rights switch on in turn
        flips.forEach((f, i) => {
          const q = inOutCubic(seg(t, T.tog[i], T.tog[i] + TOG));
          f.style.setProperty('--on', q.toFixed(4));
          f.classList.toggle('tc-is-on', q >= 0.5);
        });
        const pb = press(t, T.click);
        btn.style.transform = pb ? `scale(${(1 - 0.04 * pb).toFixed(4)})` : '';
        btn.style.filter = pb ? `brightness(${(1 - 0.12 * pb).toFixed(3)})` : '';
        // the checklist: a spinner each, resolving to a check in turn
        steps.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.p3) * 420).toFixed(1)}deg)`;
          c.ok.style.opacity = o.toFixed(3);
          c.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the client: Priya's question, then the bot's reply, each opening its slot (bottom-anchored)
        const at = [T.ask, T.reply];
        slots.forEach((m, i) => {
          const g = outCubic(seg(t, at[i], at[i] + LAND));
          const h = m.c.offsetHeight + parseFloat(getComputedStyle(m.c).marginTop || 0);
          const want = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
          if (want !== m.h) { m.s.style.height = want; m.h = want; }
          const f = outCubic(seg(t, at[i] + LAND * 0.2, at[i] + LAND));
          m.c.style.opacity = f.toFixed(3);
          m.c.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 14).toFixed(2)}px)`;
        });
        // the header: members and online, flipped to the bot typing (Telegram blue, the three dots stepping) while it writes
        const typing = t >= T.typ && t < T.reply;
        subA.style.display = typing ? 'none' : '';
        subB.style.display = typing ? '' : 'none';
        if (typing) dots.forEach((d, i) => { d.style.opacity = ((t - T.typ) * 7.5) % 3 >= i ? '1' : '0.25'; });
        // the chat list's preview follows the thread
        const keyT = { ask: T.ask, reply: T.reply };
        let pi = 0;
        PREVIEW.forEach(([kk], i) => { if (kk && t >= keyT[kk]) pi = i; });
        if (pi !== lastPv) {
          const [, who, txt] = PREVIEW[pi];
          pv.innerHTML = pi === 0 ? `${esc(who)} ${esc(txt)}` : `<em>${esc(who)}:</em> ${esc(txt)}`;
          lastPv = pi;
        }
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
        app.style.transform = `translate(${((Wd - AW * sc) / 2).toFixed(2)}px, ${((Ht - AH * sc) / 2).toFixed(2)}px) scale(${sc.toFixed(5)})`;
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
