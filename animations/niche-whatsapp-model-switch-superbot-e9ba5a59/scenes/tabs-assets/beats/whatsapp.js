// WhatsApp beat, the finale: superbot answers every customer from the shop's own WhatsApp Business number and sends
// the weekend sale. Its line streams and Meta's permissions review card lands in the chat (Embedded Signup for the
// WhatsApp Business Platform, the screen "Review what you'll share with <app>": the Meta mark, the WhatsApp Business
// account "Kettle Hill Cycles", the permission lines, Back / Confirm). The pointer taps Confirm, and the source's
// connect-card grammar follows: a checklist card ("Connected as Kettle Hill Cycles", "38 replies sent", "9 Saturday
// slots booked", "Weekend sale sent to 212 regulars") ticking in turn, with a mini window under it; the card holds
// (CARD_HOLD) and the window opens to full frame (GROW), the grammar of the Discord and Instagram forks' finales.
// RESULT A, full frame: WhatsApp Web (the 2025 design, light), a WhatsApp Business account. The customer rows flip in
// a quick stagger from their unread state (bold preview, green time, green unread badge) to the reply that was sent
// (blue double ticks, the reply's first words), and the open thread is Lucía's: her voice note with its transcript,
// then the reply sent as the shop (the light green bubble, blue double ticks).
// RESULT B: the thread pushes to the broadcast list "Weekend regulars" (212 recipients), which moves to the top of
// the list: the sale goes out (the workshop photo with the sale under it), the Message info panel opens with Delivered
// and Read climbing (212, then 147), and two regulars' replies pop into the chat list. The ONE bold moment: the toast
// "Weekend sale sent to 212 regulars" (the chime); the final state holds (READ) before the end card.
//
// There is ONE full-frame layer, in the scene root (outside the camera). While the checklist card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The app is laid out once at a
// design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full frame are the
// same pixels at two sizes. On a portrait frame (4:5) it takes a narrow layout: the chat list over a compact thread,
// then the broadcast bubble over the Message info counters. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ms } from './wa-icons.js?v=e9ba5a59';
import { DANA, SALE } from './replies.js?v=e9ba5a59';

const SAY = 'Sending from your own WhatsApp Business number. The app on your phone keeps working too.';
const SHOP = 'Kettle Hill Cycles';
const OWNER_AV = 'avatar-marco.jpg';
// Meta's permissions review screen (Embedded Signup, Facebook Login for Business), strings verbatim from Meta's own
// screenshot of it (brand/CREDITS.txt) with the app named "superbot". Of the three "will be able to" lines the two
// that carry the scopes whatsapp_business_management and whatsapp_business_messaging are shown.
const CONSENT = {
  title: "Review what you'll share with superbot",
  sub: "Here's what superbot will be able to access and do with your current and previous connections.",
  req: 'superbot is requesting access to',
  asset: 'WhatsApp Business account',
  able: 'superbot will be able to',
  perms: ['Manage your WhatsApp accounts', 'Manage and access conversations in WhatsApp'],
  fine: 'By confirming, superbot will receive ongoing access to the information you share and Meta will record when superbot accesses it. <u>Learn more</u> about this sharing and the settings you have.',
  legal: "superbot's <u>Privacy Policy</u> and <u>Terms of Service</u>",
  back: 'Back', go: 'Confirm',
};
const STEPS = [
  ['wa', `Connected as <b>${SHOP}</b>`],
  ['done-all', '38 replies sent'],
  ['schedule-outline', '9 Saturday slots booked'],
  ['campaign-outline', 'Weekend sale sent to 212 regulars'],
];
// the customers: [name, avatar (null: WhatsApp's default avatar), unread kind ('mic' | 'photo' | null), the unread
// message, unread count, when it came in, the reply superbot sent]
const ROWS = [
  ['Lucía Ortega', 'avatar-lucia.jpg', 'mic', '0:14', 1, '9:41 AM', '¡Hola Lucía! Sí, tu bici ya está lista. Cambiamos la cadena: $45.'],
  ['Dana Kim', null, 'mic', '0:21', 2, '9:38 AM', DANA.replace(/\n/g, ' ')],
  ['João Pereira', 'avatar-joao.jpg', 'mic', '0:09', 1, '9:35 AM', 'Oi João! Temos sim, câmara de ar 700x28 por $9.'],
  ['Priya Shah', 'avatar-priya.jpg', 'photo', 'Photo', 1, '9:30 AM', 'Hi Priya, that is a pinch flat. Tube swap is $18, ready in an hour.'],
  ['Tom Becker', 'avatar-tom.jpg', 'photo', 'Photo', 3, '9:22 AM', 'Hi Tom, your rear wheel is out of true. Truing is $35, done Friday.'],
  ['Ama Owusu', null, null, 'How much is a tune-up?', 1, '9:14 AM', 'Hi Ama! A full tune-up is $60, and you can book any day.'],
  ['Leo Martins', null, null, 'Is my bike ready yet?', 2, '8:57 AM', 'Hi Leo, yes! It is ready for pickup today until 7 pm.'],
  ['Grace Liu', null, null, 'Do you do bike fittings?', 1, '8:40 AM', 'Hi Grace, we do. A fitting is 45 minutes, $50.'],
];
const BROADCAST = 'Weekend regulars';
const RECIPIENTS = '212 recipients';
// the regulars' replies to the sale, popping into the chat list: [name, message]
const INCOMING = [['Nora Patel', 'Saturday 9am please!'], ['Ben Okafor', 'Can I bring two bikes?']];
const LUCIA_IN = 'Hola, ¿mi bici ya está lista? La dejé el martes.';
const LUCIA_OUT = '¡Hola Lucía! Sí, tu bici ya está lista. Cambiamos la cadena: $45. Abrimos hasta las 7 pm. Marco';
const READ_N = 147, DELIVERED_N = 212;
const TOAST = 'Weekend sale sent to 212 regulars';
const BARS = 30;

const APP_SCALE = { wide: 1.2, tall: 1.2 };   // full frame: the app's px to frame px
const ROW_H = { wide: 72, tall: 64 };          // a chat-list row, in app px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.2;                             // the line streams, then the permissions card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const TAP_AT = 0.7; /* deliberate */             // the card landed to the tap on Confirm (it reads first)
const PTR_IN = 0.3;                              // the card landed to the pointer appearing
const PTR_MOVE = 0.4;                            // the pointer's travel onto Confirm, ending just before the tap
const LIST_AT = 0.2;                             // the tap to the checklist card landing
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.14;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.25; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const OUT_AT = 0.25;                             // full frame to the reply bubble rising into Lucía's thread
const OUT_IN = 0.35;
const BLUE_AT = 0.45;                            // the bubble in, then its ticks turn blue (read)
const FLIP_AT = 0.3;                             // full frame to the first chat row flipping
const FLIP_STAGGER = 0.1;                        // one row to the next
const FLIP = 0.28;                               // a row's preview rolling over to the reply
const A_READ = 3.05; /* deliberate */             // full frame to the push to the broadcast (result A reads >= 3 s)
const PUSH = 0.4; /* deliberate */              // Lucía's thread out to the left, Weekend regulars in from the right
const MOVE = 0.3;                                // a chat-list reorder (the broadcast to the top, a reply popping in)
const SEND_AT = 0.1;                             // the broadcast thread in to the sale bubble rising
const SEND_IN = 0.35;
const INFO_AT = 0.25;                            // the sale bubble starts rising to the Message info panel opening
const INFO_IN = 0.3;
const DLV_AT = 0.1;                              // the panel open to Delivered counting up
const DLV = 0.5;
const READ_AT = 0.2;                             // the panel open to Read counting up
const READ_RUN = 0.8;
const IN1_AT = 0.2, IN2_AT = 0.45;              // the panel open to each regular's reply popping into the list
const TOAST_AT = 0.5;                           // the panel open to the toast (the bold moment, the chime)
const TOAST_IN = 0.3;
const READ = 1.8; /* deliberate */               // the toast in, the final state holds, readable, before the scene's fade
// (result B reads from the push's end: (SEND_AT + INFO_AT + INFO_IN + TOAST_AT) + TOAST_IN + READ = 3.25 s >= 3 s)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const fmt = (n) => String(Math.round(n));

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the permissions card lands
    T.tap = T.card + TAP_AT;                           // Confirm is tapped
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame: the chat list and Lucía's thread
    T.out = T.full + OUT_AT;                           // the reply rises into Lucía's thread
    T.blue = T.out + BLUE_AT;
    T.flip = ROWS.map((_, i) => T.full + FLIP_AT + i * FLIP_STAGGER);
    T.push = T.full + A_READ;                          // the push to the broadcast
    T.b = T.push + PUSH;                               // Weekend regulars is open
    T.send = T.b + SEND_AT;                            // the sale goes out
    T.info = T.send + INFO_AT;               // Message info opens
    T.open = T.info + INFO_IN;
    T.dlv = T.open + DLV_AT;
    T.read = T.open + READ_AT;
    T.in = [T.open + IN1_AT, T.open + IN2_AT];
    T.toast = T.open + TOAST_AT;                       // the bold moment: the chime
    T.chime = T.toast;
    T.end = T.toast + TOAST_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.chime });
    const brand = (f) => x.brand(f);
    const av = (photo, cls = '') => (photo ? `<img class="wa-av ${cls}" src="${x.img(photo)}" alt=""/>` : `<span class="wa-av wa-def ${cls}">${ms('person')}</span>`);
    const ticks = (cls = '') => `<span class="wa-tk ${cls}">${ms('done-all')}</span>`;
    const wave = (seed) => `<span class="wa-wave">${Array.from({ length: BARS }, (_, j) => `<b style="height:${(16 + 84 * (0.3 + 0.7 * Math.abs(Math.sin(seed * 12.9898 + j * 78.233) * 43758.5453 % 1)) * (0.5 + 0.5 * Math.sin((j / BARS) * Math.PI))).toFixed(0)}%"></b>`).join('')}<i></i></span>`;

    // ---- Meta's permissions review card in the chat ----
    const say = x.el(`<div class="qc-say wa-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="fb-card">
      <div class="fb-band"><img class="fb-meta" src="${brand('meta-logo.svg')}" alt=""/>${ms('swap-horiz', 'fb-swap')}${x.tile('superbot', 'fb-app')}
        <span class="fb-me"><img src="${x.img(OWNER_AV)}" alt=""/>${ms('keyboard-arrow-down')}</span></div>
      <div class="fb-body">
        <h4>${esc(CONSENT.title)}</h4>
        <p class="fb-sub">${esc(CONSENT.sub)}</p>
        <h5>${esc(CONSENT.req)}</h5>
        <div class="fb-asset"><span class="fb-ai"><img src="${brand('whatsapp-dark.svg')}" alt=""/></span><span><b>${esc(CONSENT.asset)}</b><small>${esc(SHOP)}</small></span></div>
        <h5>${esc(CONSENT.able)}</h5>
        <ul>${CONSENT.perms.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      </div>
      <div class="fb-foot">
        <p class="fb-fine">${CONSENT.fine}</p>
        <div class="fb-act"><span class="fb-legal">${CONSENT.legal}</span><span class="fb-back">${esc(CONSENT.back)}</span><span class="fb-go">${esc(CONSENT.go)}</span></div>
      </div>
    </div>`);
    const go = consent.querySelector('.fb-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'wa' ? `<span class="gk-ic gk-wa"><img src="${brand('whatsapp-logo.svg')}" alt=""/></span>` : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- WhatsApp Web ----
    const unread = (kind, msg) => (kind === 'mic' ? `<span class="wa-pk">${ms('mic')}</span>${esc(msg)}` : kind === 'photo' ? `<span class="wa-pk">${ms('image-outline')}</span>${esc(msg)}` : esc(msg));
    const row = ([name, photo, kind, msg, n, when, rep], i) => `<div class="wa-row wa-cust${i === 0 ? ' wa-sel' : ''}">${av(photo)}
      <div class="wa-rt"><div class="wa-r1"><b>${esc(name)}</b><time class="wa-ta">${when}</time><time class="wa-tb">9:52 AM</time></div>
        <div class="wa-r2"><span class="wa-pa"><span class="wa-pt">${unread(kind, msg)}</span><i class="wa-badge">${n}</i></span>
        <span class="wa-pb">${ticks('wa-blue')}<span class="wa-pt">${esc(rep)}</span></span></div></div></div>`;
    const bcAv = `<span class="wa-av wa-bc">${ms('campaign')}</span>`;
    const bcRow = `<div class="wa-row wa-bcrow">${bcAv}
      <div class="wa-rt"><div class="wa-r1"><b>${esc(BROADCAST)}</b><time class="wa-ta">Tuesday</time><time class="wa-tb">9:55 AM</time></div>
        <div class="wa-r2"><span class="wa-pa"><span class="wa-pt">${ticks()}Thanks for riding with us this month!</span></span>
        <span class="wa-pb">${ticks()}<span class="wa-pk">${ms('image-outline')}</span><span class="wa-pt">${esc(SALE.replace(/\n/g, ' '))}</span></span></div></div></div>`;
    const inRow = ([name, msg]) => `<div class="wa-row wa-new">${av(null)}
      <div class="wa-rt"><div class="wa-r1"><b>${esc(name)}</b><time class="wa-ta wa-green">9:56 AM</time></div>
        <div class="wa-r2"><span class="wa-pa wa-unread"><span class="wa-pt">${esc(msg)}</span><i class="wa-badge">1</i></span></div></div></div>`;
    const rail = (name, cls = '') => `<span class="wa-ri ${cls}">${ms(name)}</span>`;
    const composer = `<div class="wa-comp">${ms('add')}<span class="wa-cbox">${ms('mood-outline')}<span class="wa-cph">Type a message</span></span>${ms('mic-outline')}</div>`;
    const app = `<div class="wa-app">
      <nav class="wa-rail">
        ${rail('chat', 'wa-on')}${rail('radio-button-checked-outline')}${rail('forum-outline')}${rail('groups-outline')}
        <i class="wa-rsep"></i>${rail('storefront-outline')}${rail('campaign-outline')}
        <span class="wa-rgap"></span>${rail('settings-outline')}<span class="wa-ri wa-me"><img src="${x.img(OWNER_AV)}" alt=""/></span>
      </nav>
      <section class="wa-list">
        <header class="wa-lh"><b>WhatsApp</b><span class="wa-lhi">${ms('add-comment-outline')}${ms('more-vert')}</span></header>
        <div class="wa-search">${ms('search')}<span>Search or start a new chat</span></div>
        <div class="wa-chips"><b>All</b><span>Unread</span><span>Favourites</span><span>Groups</span></div>
        <div class="wa-rows">${INCOMING.map(inRow).join('')}${ROWS.map(row).join('')}${bcRow}</div>
      </section>
      <section class="wa-pane">
        <div class="wa-th wa-th-a">
          <header class="wa-hd">${av(ROWS[0][1])}<span class="wa-hn"><b>${esc(ROWS[0][0])}</b><small>online</small></span><span class="wa-hi">${ms('videocam-outline')}${ms('search')}${ms('more-vert')}</span></header>
          <div class="wa-msgs">
            <div class="wa-day">Today</div>
            <div class="wa-in wa-vn"><div class="wa-vp">${av(ROWS[0][1], 'wa-vav')}<span class="wa-vbtn"><svg viewBox="0 0 24 24"><path d="M8 5.2v13.6L19 12z"/></svg></span>${wave(3)}</div>
              <div class="wa-vm"><span>0:14</span><span>9:41 AM</span></div>
              <div class="wa-vt"><small>Transcript</small>${esc(LUCIA_IN)}</div></div>
            <div class="wa-out"><p>${esc(LUCIA_OUT)}<span class="wa-mt">9:52 AM${ticks('wa-tko')}</span></p></div>
          </div>
          ${composer}
        </div>
        <div class="wa-th wa-th-b">
          <header class="wa-hd">${bcAv}<span class="wa-hn"><b>${esc(BROADCAST)}</b><small>${RECIPIENTS}</small></span><span class="wa-hi">${ms('search')}${ms('more-vert')}</span></header>
          <div class="wa-msgs">
            <div class="wa-day">Today</div>
            <div class="wa-note">You created a broadcast list with 212 recipients</div>
            <div class="wa-out wa-sale"><div class="wa-sb"><img src="${x.img('workshop.jpg')}" alt=""/><p>${esc(SALE)}<span class="wa-mt">9:55 AM${ticks('wa-tks')}</span></p></div></div>
          </div>
          ${composer}
        </div>
      </section>
      <aside class="wa-info">
        <header class="wa-ih">${ms('close')}<b>Message info</b></header>
        <div class="wa-ib">
          <div class="wa-iprev"><div class="wa-sb"><img src="${x.img('workshop.jpg')}" alt=""/><p>${esc(SALE)}<span class="wa-mt">9:55 AM${ticks()}</span></p></div></div>
          <div class="wa-istat">
            <div class="wa-irow">${ticks('wa-blue')}<b>Read</b><span class="wa-n wa-nr">0</span><small>of 212</small></div>
            <div class="wa-irow">${ticks()}<b>Delivered</b><span class="wa-n wa-nd">0</span><small>of 212</small></div>
          </div>
        </div>
      </aside>
      <div class="wa-toast">${ms('check-circle')}<span>${esc(TOAST)}</span></div>
    </div>`;
    const layer = x.el(`<div class="wa-full" aria-hidden="true">${app}</div>`);
    x.root.appendChild(layer);
    const $ = (s) => layer.querySelector(s);
    const $$ = (s) => [...layer.querySelectorAll(s)];
    const waApp = $('.wa-app'), list = $('.wa-list'), thA = $('.wa-th-a'), thB = $('.wa-th-b'), info = $('.wa-info'), toast = $('.wa-toast');
    const cust = $$('.wa-cust').map((n) => ({ n, a: n.querySelector('.wa-pa'), b: n.querySelector('.wa-pb'), ta: n.querySelector('.wa-ta'), tb: n.querySelector('.wa-tb') }));
    const bc = $('.wa-bcrow'), bcA = bc.querySelector('.wa-pa'), bcB = bc.querySelector('.wa-pb'), bcTa = bc.querySelector('.wa-ta'), bcTb = bc.querySelector('.wa-tb');
    const news = $$('.wa-new');
    const outA = thA.querySelector('.wa-out p'), tkA = thA.querySelector('.wa-tko');
    const sale = thB.querySelector('.wa-sale .wa-sb'), tkS = thB.querySelector('.wa-tks');
    const nR = $('.wa-nr'), nD = $('.wa-nd');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tall = false, lastR = '', lastD = '';
    let AW = 1600, AH = 900;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      waApp.style.width = `${AW}px`; waApp.style.height = `${AH}px`;
      waApp.classList.toggle('wa-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('fb-tall', tall);
    };

    // the pointer: in from below right, onto Confirm, a press, then away
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
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, consent, card],
      marks: [[T.r, say], [T.card, consent], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(consent, seg(t, T.card, T.card + CARD_IN), 14);
        // Confirm: the press, then it stays in its pressed tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('fb-hit', t >= T.tap);

        rise(card, seg(t, T.list, T.list + CARD_IN), 14);
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // RESULT A: the reply rises into Lucía's thread, its ticks turn blue; the rows flip, top to bottom
        const o = outCubic(seg(t, T.out, T.out + OUT_IN));
        outA.style.opacity = o.toFixed(3);
        outA.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 18).toFixed(2)}px) scale(${lerp(0.96, 1, o).toFixed(4)})`;
        tkA.classList.toggle('wa-blue', t >= T.blue);
        cust.forEach((r, i) => {
          const q = inOutCubic(seg(t, T.flip[i], T.flip[i] + FLIP));
          r.a.style.opacity = (1 - q).toFixed(3);
          r.a.style.transform = q > 0 ? `translateY(${(-q * 10).toFixed(2)}px)` : 'none';
          r.b.style.opacity = q.toFixed(3);
          r.b.style.transform = q < 1 ? `translateY(${((1 - q) * 10).toFixed(2)}px)` : 'none';
          r.ta.style.opacity = (1 - q).toFixed(3);
          r.tb.style.opacity = q.toFixed(3);
          r.n.classList.toggle('wa-unread', q < 0.5);
        });

        // the chat list's order: the broadcast moves to the top as the sale goes out, then each regular's reply pops
        // in above it; a row's slot is its index times the row height
        const rh = tall ? ROW_H.tall : ROW_H.wide;
        const mB = inOutCubic(seg(t, T.send, T.send + MOVE));
        const m1 = inOutCubic(seg(t, T.in[0], T.in[0] + MOVE)), m2 = inOutCubic(seg(t, T.in[1], T.in[1] + MOVE));
        const place = (node, idx) => { node.style.transform = `translateY(${(idx * rh).toFixed(2)}px)`; };
        cust.forEach((r, i) => place(r.n, i + mB + m1 + m2));
        place(bc, lerp(ROWS.length, 0, mB) + m1 + m2);
        place(news[0], m2);
        place(news[1], 0);
        news[0].style.opacity = m1.toFixed(3);
        news[1].style.opacity = m2.toFixed(3);
        // the selection follows the open chat: Lucía, then the broadcast
        cust[0].n.classList.toggle('wa-sel', t < T.b);
        bc.classList.toggle('wa-sel', t >= T.b);
        const qb = inOutCubic(seg(t, T.send, T.send + 0.3));
        bcA.style.opacity = (1 - qb).toFixed(3); bcB.style.opacity = qb.toFixed(3);
        bcTa.style.opacity = (1 - qb).toFixed(3); bcTb.style.opacity = qb.toFixed(3);

        // the push: Lucía's thread out to the left, Weekend regulars in from the right (in 4:5 the chat list folds up
        // too, so the broadcast and its counters own the frame)
        const p = inOutCubic(seg(t, T.push, T.b));
        thA.style.transform = p > 0 ? `translateX(${(-100 * p).toFixed(3)}%)` : 'none';
        thB.style.transform = `translateX(${(100 * (1 - p)).toFixed(3)}%)`;
        thA.style.visibility = p < 1 ? 'visible' : 'hidden';
        thB.style.visibility = p > 0 ? 'visible' : 'hidden';
        if (tall) list.style.height = `${lerp(0.52, 0, p) * 100}%`; else list.style.height = '';

        // RESULT B: the sale goes out, Message info opens, the counters climb, the toast lands
        const sq = outCubic(seg(t, T.send, T.send + SEND_IN));
        sale.style.opacity = sq.toFixed(3);
        sale.style.transform = sq >= 1 ? 'none' : `translateY(${((1 - sq) * 22).toFixed(2)}px) scale(${lerp(0.96, 1, sq).toFixed(4)})`;
        tkS.classList.toggle('wa-one', t < T.send + SEND_IN + 0.15);
        const ip = inOutCubic(seg(t, T.info, T.open));
        if (tall) { info.style.width = ''; info.style.height = `${(ip * 44).toFixed(3)}%`; } else { info.style.height = ''; info.style.width = `${(ip * 400).toFixed(2)}px`; }
        info.style.visibility = ip > 0 ? 'visible' : 'hidden';
        const r = fmt(READ_N * outCubic(seg(t, T.read, T.read + READ_RUN)));
        const d = fmt(DELIVERED_N * outCubic(seg(t, T.dlv, T.dlv + DLV)));
        if (r !== lastR) { nR.textContent = r; lastR = r; }
        if (d !== lastD) { nD.textContent = d; lastD = d; }
        const tq = outCubic(seg(t, T.toast, T.toast + TOAST_IN));
        toast.style.opacity = tq.toFixed(3);
        toast.style.transform = `${tall ? 'translateX(-50%) ' : ''}translateY(${((1 - tq) * 24).toFixed(2)}px)`;
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
        waApp.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
