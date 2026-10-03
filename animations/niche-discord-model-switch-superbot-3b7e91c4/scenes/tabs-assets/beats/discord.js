// Discord beat, the finale: superbot posts the replies. Its line streams, a Discord-styled connect card lands in the
// chat ("superbot connected to Discord", "Signed in as sam", "Posting 3 replies", three checks ticking in turn) with a
// mini Discord window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the
// source's play.js. Full frame is a real-looking Discord desktop client, dark theme: server rail, the Pixel Forge
// channel list, #general with the three mentions of sam (Discord's gold mention highlight), and the member list. sam's
// three replies land one by one under them, each with Discord's reply reference, then superbot's catch-up appears below
// as an ephemeral app message ("Only you can see this"), and the final state holds (READ) before the end card.
//
// There is ONE Discord client, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE, so its type reads like Discord at that zoom) and scaled
// to the layer, so the mini window and the full frame are the same pixels at two sizes. On a portrait frame (4:5) it
// takes Discord's narrow layout: the rail and the chat only.
// Messages that land open their slot (height, from the content's own measured height, which pushes the thread up the
// way Discord does: bottom-anchored) and fade up behind it. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { CATCHUP, REPLIES } from './write.js?v=3b7e91c4';

const SAY = 'Posting your 3 replies in Pixel Forge.';
const SERVER = 'Pixel Forge';
// the thread in #general before superbot posts: [who, time, text, mention?]. Made up for the spot.
const THREAD = [
  ['Ravi', 'Tue 2:05 PM', 'need one more tester for Friday, who is in?'],
  ['Kai', 'Tue 3:40 PM', 'login loop again on 0.9.3, anyone else seeing it?'],
  ['Priya', 'Tue 4:12 PM', 'title screen v2 is almost done, posting tonight'],
  ['Nina', 'Tue 4:58 PM', 'we hit Boost Level 2, custom stickers are live'],
  ['Leo', 'Tue 5:31 PM', 'patch notes for 0.9.4 are up in #dev-log'],
  ['Theo', 'Tue 5:47 PM', 'build server is back up, 0.9.4 is next'],
  ['Maya', 'Tue 6:12 PM', REPLIES[0].quote, true],
  ['Jordan', 'Wed 11:40 AM', REPLIES[1].quote, true],
  ['Priya', 'Yesterday at 9:05 PM', REPLIES[2].quote, true],
];
const NOW = 'Today at 9:41 AM';
// who is who: Discord default-avatar colour and role colour (chat.css --dc-av-* / --dc-role-*)
const PEOPLE = {
  sam: ['grey', null], Leo: ['blurple', 'teal'], Maya: ['pink', 'orange'], Theo: ['green', 'blue'],
  Jordan: ['yellow', 'purple'], Priya: ['red', 'pink'], Nina: ['blurple', 'blue'], Kai: ['grey', 'gold'],
  Ravi: ['green', 'teal'],
};
const MEMBERS = ['superbot', 'Jordan', 'Leo', 'Maya', 'Nina', 'Priya', 'sam', 'Theo'];
const CHANNELS = ['announcements', 'general', 'playtest', 'art', 'dev-log'];
const SERVERS = ['IG', 'LT', 'GJ'];               // the other servers in the rail (initials only)

const APP_SCALE = { wide: 1.25, tall: 1.2 };    // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const REPLY_AT = 0.25;                           // full frame to sam's first reply landing
const REPLY_STAGGER = 0.35; /* deliberate */     // one reply to the next (the brief: ~0.35 s apart)
const LAND = 0.35;                               // a message's slot opening and its content fading up
const EPH_AT = 0.15;                             // the last reply landed to superbot's catch-up landing
const EPH_IN = 0.45;                             // the catch-up's slot opening
const LINE_AT = 0.12, LINE_STAGGER = 0.05, LINE_IN = 0.2; // the catch-up's embed lines cascading in
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius (--dc-radius), eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Discord renders a channel mention as a blurple pill
const rich = (s) => esc(s).replace(/#([a-z][\w-]*)/g, '<span class="dx-chl">#$1</span>');
const svg = (d, cls = '') => `<svg class="dx-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  hash: svg('<path d="M10 3 8 21M16 3l-2 18M4 8.5h17M3 15.5h17"/>', 'dx-st'),
  speaker: svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>', 'dx-st'),
  chev: svg('<path d="m6 9 6 6 6-6"/>', 'dx-st'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', 'dx-st'),
  head: svg('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>', 'dx-st'),
  gear: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>', 'dx-st'),
  thread: svg('<path d="M5 5h14v10H9l-4 4z"/>', 'dx-st'),
  bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/>', 'dx-st'),
  pin: svg('<path d="M9 3h6l-1 6 3 3v2H7v-2l3-3zM12 14v7"/>', 'dx-st'),
  people: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>', 'dx-st'),
  search: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>', 'dx-st'),
  plus: svg('<circle cx="12" cy="12" r="10" class="dx-fill"/><path d="M12 7v10M7 12h10" class="dx-ink"/>'),
  gift: svg('<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M2.5 9h19M12 9v11M12 9c-1.5-4-6-4-6-1.5S12 9 12 9zm0 0c1.5-4 6-4 6-1.5S12 9 12 9z"/>', 'dx-st'),
  gif: svg('<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M10 10H8v4h2v-2M13 10v4M16 14v-4h2.5M16 12h2"/>', 'dx-st'),
  smile: svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>', 'dx-st'),
  eye: svg('<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 'dx-st'),
  check: '<svg class="dx-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // connected, signed in, posting: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame
    T.rep = REPLIES.map((_, i) => T.full + REPLY_AT + i * REPLY_STAGGER); // sam's replies land
    T.eph = T.rep[REPLIES.length - 1] + LAND + EPH_AT;  // superbot's catch-up lands
    T.lines = Array.from({ length: CATCHUP.bullets.length + 3 }, (_, j) => T.eph + LINE_AT + j * LINE_STAGGER);
    T.settle = T.lines[T.lines.length - 1] + LINE_IN; // the last visible change
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('discord-logo.svg');
    const av = (who, cls = 'dx-av') => who === 'superbot'
      ? `<span class="${cls} dx-sb"><img src="${x.sbSrc}" alt=""/></span>`
      : `<span class="${cls}" style="--c: var(--dc-av-${PEOPLE[who][0]})"><img src="${mark}" alt=""/></span>`;
    const nameColor = (who) => (PEOPLE[who] && PEOPLE[who][1] ? `var(--dc-role-${PEOPLE[who][1]})` : 'var(--dc-head)');
    const name = (who) => `<b class="dx-nm" style="color: ${nameColor(who)}">${esc(who)}</b>`;

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say dx-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="dx-ct dx-ct-dc"><img src="${mark}" alt=""/></span>`, `<b>superbot connected to Discord</b>`],
      [av('sam', 'dx-ct'), `Signed in as <b>sam</b>`],
      [`<span class="dx-ct dx-ct-n">3</span>`, `Posting 3 replies in <b>#general</b>`],
    ];
    const card = x.el(`<div class="dx-card">
      ${steps.map(([icon, txt]) => `<div class="dx-step">${icon}<span class="dx-tx">${txt}</span><span class="dx-ok"><i class="dx-spin"></i>${I.check}</span></div>`).join('')}
      <div class="dx-shot"></div>
    </div>`);
    const shot = card.querySelector('.dx-shot');
    const checks = [...card.querySelectorAll('.dx-ok')].map((n) => ({ spin: n.querySelector('.dx-spin'), ck: n.querySelector('.dx-ck') }));

    // ---- the full-frame Discord client ----
    const msg = ([who, time, text, ment]) => `<div class="dx-msg${ment ? ' dx-ment' : ''}">${av(who)}
      <div class="dx-hd">${name(who)}<time>${esc(time)}</time></div><div class="dx-ct-t">${rich(text)}</div></div>`;
    const reply = (r) => `<div class="dx-slot"><div class="dx-msg dx-rep">
      <div class="dx-ref"><i class="dx-spine"></i>${av(r.to, 'dx-mav')}<b style="color: ${nameColor(r.to)}">${esc(r.to)}</b><span>${rich(r.quote)}</span></div>
      ${av('sam')}<div class="dx-hd">${name('sam')}<time>${NOW}</time></div><div class="dx-ct-t">${rich(r.text)}</div></div></div>`;
    const eph = `<div class="dx-slot"><div class="dx-msg dx-eph">${av('superbot')}
      <div class="dx-hd"><b class="dx-nm" style="color: var(--dc-head)">superbot</b><span class="dx-tag">APP</span><time>${NOW}</time></div>
      <div class="dx-emb">
        <div class="dx-ln dx-emb-t">${rich(CATCHUP.title)}</div>
        <div class="dx-ln dx-emb-s">${esc(CATCHUP.sub)}</div>
        <ul>${CATCHUP.bullets.map((b) => `<li class="dx-ln">${rich(b)}</li>`).join('')}</ul>
        <div class="dx-ln dx-emb-f"><span class="dx-fav dx-sb"><img src="${x.sbSrc}" alt=""/></span>${esc(CATCHUP.foot)}</div>
      </div>
      <div class="dx-only">${I.eye}<span>Only you can see this</span><i>&middot;</i><a>Dismiss message</a></div></div></div>`;
    const layer = x.el(`<div class="dx-full" aria-hidden="true"><div class="dx-app">
      <nav class="dx-rail">
        <span class="dx-srv dx-home"><img src="${mark}" alt=""/></span><i class="dx-sep"></i>
        <span class="dx-srv dx-on"><i class="dx-pill"></i>PF</span>
        ${SERVERS.map((s) => `<span class="dx-srv">${s}</span>`).join('')}
        <span class="dx-srv dx-add">${I.plus}</span>
      </nav>
      <aside class="dx-side">
        <header class="dx-sv">${esc(SERVER)}${I.chev}</header>
        <div class="dx-chans">
          <div class="dx-cat">${I.chev}Text Channels</div>
          ${CHANNELS.map((c) => `<div class="dx-chan${c === 'general' ? ' dx-sel' : ''}${c === 'dev-log' ? ' dx-unread' : ''}">${I.hash}<span>${c}</span></div>`).join('')}
          <div class="dx-cat">${I.chev}Voice Channels</div>
          <div class="dx-chan">${I.speaker}<span>Lounge</span></div>
        </div>
        <footer class="dx-user"><span class="dx-uav">${av('sam')}<i class="dx-dot"></i></span><span class="dx-un"><b>sam</b><small>Online</small></span><span class="dx-uic">${I.mic}${I.head}${I.gear}</span></footer>
      </aside>
      <main class="dx-chat">
        <header class="dx-top">${I.hash}<b>general</b><i class="dx-div"></i><span class="dx-topic">Pixel Forge studio chat. Build, playtest, ship.</span>
          <span class="dx-tools">${I.thread}${I.bell}${I.pin}${I.people}<span class="dx-search">Search${I.search}</span></span></header>
        <div class="dx-scroll"><div class="dx-list">${THREAD.map(msg).join('')}${REPLIES.map(reply).join('')}${eph}</div></div>
        <div class="dx-comp">${I.plus}<span>Message #general</span><span class="dx-cic">${I.gift}${I.gif}${I.smile}</span></div>
      </main>
      <aside class="dx-mem">
        <div class="dx-cat">Online &middot; ${MEMBERS.length}</div>
        ${MEMBERS.map((m) => `<div class="dx-mb"><span class="dx-uav">${av(m)}<i class="dx-dot"></i></span><b style="color: ${nameColor(m)}">${esc(m)}</b>${m === 'superbot' ? '<span class="dx-tag">APP</span>' : ''}</div>`).join('')}
      </aside>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const slots = [...layer.querySelectorAll('.dx-slot')].map((s) => ({ s, c: s.firstElementChild, h: -1 }));
    const lines = [...layer.querySelectorAll('.dx-eph .dx-ln')];
    const only = layer.querySelector('.dx-only');
    // the client's type is Noto Sans (vendored, discord.css): ask for every weight it uses up front so a seek never
    // measures a slot in the fallback face
    if (document.fonts && document.fonts.load) ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 16px "Noto Sans DC"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null;
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
      app.classList.toggle('dx-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('dx-tall', tall);
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
        // the three steps: a spinner each, resolving to a green check in turn
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the client: sam's replies, then superbot's catch-up, each opening its slot (bottom-anchored: the thread rises)
        const at = [...T.rep, T.eph];
        slots.forEach((m, i) => {
          const dur = i < REPLIES.length ? LAND : EPH_IN;
          const g = outCubic(seg(t, at[i], at[i] + dur));
          // the content's own height plus its top margin (held inside the slot, which clips while it opens)
          const h = m.c.offsetHeight + parseFloat(getComputedStyle(m.c).marginTop || 0);
          const want = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
          if (want !== m.h) { m.s.style.height = want; m.h = want; }
          const f = outCubic(seg(t, at[i] + dur * 0.35, at[i] + dur));
          m.c.style.opacity = f.toFixed(3);
          m.c.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 10).toFixed(2)}px)`;
        });
        lines.forEach((l, j) => {
          const f = outCubic(seg(t, T.lines[j], T.lines[j] + LINE_IN));
          l.style.opacity = f.toFixed(3);
          l.style.transform = f >= 1 ? 'none' : `translateX(${((1 - f) * -6).toFixed(2)}px)`;
        });
        only.style.opacity = seg(t, T.lines[T.lines.length - 1], T.settle).toFixed(3);
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
