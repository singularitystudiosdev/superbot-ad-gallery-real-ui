// LinkedIn beat, the finale: superbot applies on LinkedIn. Its line streams, a connect card lands in the chat
// ("superbot connected to LinkedIn", "Signed in as Dana Ruiz", "12 verified roles ready to apply", three checks ticking
// in turn) with a mini LinkedIn window under it; the card holds (CARD_HOLD) and the window opens to full frame (GROW),
// the grammar of the Data remake's sheets.js (and the source's play.js). Full frame is a real-looking LinkedIn Jobs
// page, light theme: the top nav, the job search bar with its filter pills (Easy Apply on), the results list with the
// Ledgerline card selected, and the Ledgerline job on the right with Meet the hiring team. The pointer clicks Easy
// Apply (a visible press) and the Easy Apply modal opens over a dim backdrop on "Review your application"; the pointer
// clicks Submit application and the modal swaps to "Your application was sent to Ledgerline!". The modal closes, the
// list cards flip their footer to green "Applied now" one after another, and a toast slides in ("Applied to 12 roles.
// Skipped 9 ghost listings."). LinkedIn's docked messaging window rises with Dana's note to Priya (write.js NOTE); a
// short time skip (the page dims, a clock pill flips to "Monday · 9:14 AM"); then Priya's reply lands (.li-reply, the
// render's chime cue) with quick reply chips, the Ledgerline card turns to "Application viewed" and Notifications
// gets a red 1. The final state holds (READ) before the end card.
//
// There is ONE LinkedIn window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE, so its type reads like LinkedIn at that zoom) and scaled
// to the layer, so the mini window and the full frame are the same pixels at two sizes. On a portrait frame (4:5) it
// takes LinkedIn's mobile-width layout: a compact nav, the job as a single column, a 3-card "More jobs" strip, the
// Easy Apply modal as a bottom sheet and messaging as a full-width panel.
// Pure function of t: every moving value is written from t; pointer targets are measured from the laid-out window.
// Every person, company and message here is made up for the spot (brand/CREDITS.txt).
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { NOTE } from './write.js?v=05fd7f45';

const SAY = 'Applying to the 12 real roles on LinkedIn.';
const REPLY = 'Hi Dana, your Fernway checkout work is exactly what we need. Are you free Thursday at 10 for a call?';
const QUICK = ['Yes, Thursday works', 'Sounds great!'];
const TOAST = 'Applied to 12 roles. Skipped 9 ghost listings.';
const CLOCK = ['10:42 AM', 'Monday  ·  9:14 AM'];
// the results list (made up for the spot): company, logo initials, logo colour, title, location, posted
const JOBS = [
  ['Ledgerline', 'L', '#0f5f4a', 'Senior Product Manager, Payments', 'Chicago, IL (Hybrid)', '3 days ago'],
  ['Paywick', 'P', '#6d28d9', 'Senior Product Manager, Merchant Tools', 'United States (Remote)', '1 week ago'],
  ['Orbiq Pay', 'O', '#c2410c', 'Lead Product Manager, Payments', 'Chicago, IL (On-site)', '5 days ago'],
  ['Talloway', 'T', '#0e7490', 'Staff Product Manager, Risk', 'United States (Remote)', '2 days ago'],
  ['Norvale Software', 'N', '#1d4ed8', 'Senior Product Manager, Billing', 'Chicago, IL (Hybrid)', '4 days ago'],
  ['Halvik', 'H', '#be123c', 'Senior Product Manager, Payouts', 'Chicago, IL (Hybrid)', '6 days ago'],
  ['Tessaro', 'T', '#a16207', 'Senior Product Manager, Platform', 'Chicago, IL (Hybrid)', '1 day ago'],
].map(([co, ini, col, title, loc, ago]) => ({ co, ini, col, title, loc, ago }));
const ABOUT = [
  'Ledgerline is moving checkout to multi-currency, and we are hiring a Senior Product Manager to lead it.',
  'You will own the payments roadmap across cards, wallets and local payment methods in 14 new markets.',
  '5+ years in payments or fintech product, with hands-on checkout, FX or payment orchestration work.',
  'Hybrid in Chicago, three days a week in our West Loop office.',
];

const APP_SCALE = { wide: 1.25, tall: 1.6 };      // full frame: the window's px to frame px
// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const PAGE_HOLD = 0.5;                           // full frame: the job page reads before the pointer sets off
const PTR_MOVE = 0.45;                           // the pointer travelling to Easy Apply
const PRESS_AT = 0.05;                           // arrived, then the press
const MODAL_AT = 0.08;                           // the press, then the modal opens
const MODAL_IN = 0.25;                           // the modal opening over its backdrop
const SUB_AT = 0.45;                             // the modal is open (reading the review), then the pointer moves on
const SUB_MOVE = 0.38;                           // the pointer travelling to Submit application
const SENT_AT = 0.08;                            // the press, then the body swaps to the sent state
const SENT_IN = 0.2;                             // the swap
const SENT_HOLD = 0.5;                           // "Your application was sent to Ledgerline!" reads
const CLOSE = 0.2;                               // the modal closing
const FLIP_AT = 0.1;                             // the modal closing, then the first card flips
const FLIP_STAGGER = 0.12; /* deliberate */      // one card's footer to the next (the brief: ~0.12)
const FLIP = 0.2;                                // one footer flipping over
const TOAST_AT = 0.15, TOAST_IN = 0.3;           // the toast sliding in, from the modal closing
const CHAT_AT = 0.25, CHAT_IN = 0.35;            // the third flip landed, then the messaging window rises (4:5: the
                                                 // strip's three flips read before the panel covers it)
const NOTE_HOLD = 0.55;                          // Dana's note reads in the messaging window
const DIM_IN = 0.15, CLOCK_FLIP = 0.22, CLOCK_HOLD = 0.3, DIM_OUT = 0.15; // the time skip (~0.8 s)
const REPLY_IN = 0.3;                            // Priya's reply sliding in (.li-reply opacity 0 -> 1)
const QR_AT = 0.15, QR_STAGGER = 0.08, QR_IN = 0.2; // the quick reply chips
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = '') => `<svg class="li-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  search: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>'),
  home: svg('<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h4.5v-5.5h3V20H18V9.5"/>'),
  net: svg('<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.5 14.4c2.6-.4 4.6 1.2 5 4.6"/>'),
  jobs: svg('<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17"/>'),
  msg: svg('<path d="M4 5.5h16v11H9.5L5 20v-3.5H4z"/><path d="M8 10h8M8 13h5"/>'),
  bell: svg('<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  grid: svg('<rect x="4" y="4" width="4" height="4" class="li-fl"/><rect x="10" y="4" width="4" height="4" class="li-fl"/><rect x="16" y="4" width="4" height="4" class="li-fl"/><rect x="4" y="10" width="4" height="4" class="li-fl"/><rect x="10" y="10" width="4" height="4" class="li-fl"/><rect x="16" y="10" width="4" height="4" class="li-fl"/><rect x="4" y="16" width="4" height="4" class="li-fl"/><rect x="10" y="16" width="4" height="4" class="li-fl"/><rect x="16" y="16" width="4" height="4" class="li-fl"/>'),
  caret: svg('<path d="M7 10l5 5 5-5z" class="li-fl"/>', 'li-caret'),
  pin: svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  shield: svg('<path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z" class="li-fl"/><path d="m8.8 12 2.2 2.2 4.2-4.4" class="li-wk"/>', 'li-shield'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'li-ck'),
  eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>', 'li-ck'),
  money: svg('<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/>'),
  bldg: svg('<path d="M4.5 20.5V5.5l8-2v17M12.5 9.5h7v11M3 20.5h18M7.5 8.5h2M7.5 12h2M7.5 15.5h2M15.5 13h1.5M15.5 16.5h1.5"/>'),
  bag: svg('<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/>'),
  send: svg('<path d="M4 12 20 4l-4.5 16-3.5-6.5z"/><path d="m12 13.5 8-9.5"/>'),
  x: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  min: svg('<path d="M6 12h12"/>'),
  dots: svg('<circle cx="6" cy="12" r="1.6" class="li-fl"/><circle cx="12" cy="12" r="1.6" class="li-fl"/><circle cx="18" cy="12" r="1.6" class="li-fl"/>'),
  edit: svg('<path d="M4.5 19.5h4l10-10-4-4-10 10z"/><path d="m13 7 4 4"/>'),
  bigck: '<svg class="li-bigck" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22"/><path d="M14 24.5l7 7 13-14"/></svg>',
};
const NAV = [['home', 'Home'], ['net', 'My Network'], ['jobs', 'Jobs'], ['msg', 'Messaging'], ['bell', 'Notifications']];

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // connected, signed in, ready: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame: the LinkedIn Jobs page
    T.ptr = T.full + PAGE_HOLD;                       // the pointer sets off for Easy Apply
    T.p1 = T.ptr + PTR_MOVE + PRESS_AT;               // the press on Easy Apply
    T.modal = T.p1 + MODAL_AT;                        // the modal opens
    T.sub = T.modal + MODAL_IN + SUB_AT;              // the pointer moves on to Submit application
    T.p2 = T.sub + SUB_MOVE + PRESS_AT;               // the press on Submit application
    T.sent = T.p2 + SENT_AT;                          // "Your application was sent to Ledgerline!"
    T.close = T.sent + SENT_IN + SENT_HOLD;           // the modal closes
    T.flip = JOBS.map((_, i) => T.close + FLIP_AT + i * FLIP_STAGGER); // each card's footer flips to Applied now
    T.toast = T.close + TOAST_AT;                     // "Applied to 12 roles. Skipped 9 ghost listings."
    T.chat = T.flip[2] + FLIP + CHAT_AT;              // the messaging window rises with Dana's note
    T.skip = T.chat + CHAT_IN + NOTE_HOLD;            // the time skip: dim, the clock pill flips
    T.flipC = T.skip + DIM_IN;
    T.undim = T.flipC + CLOCK_FLIP + CLOCK_HOLD;
    T.reply = T.undim + DIM_OUT;                      // Priya's reply lands (.li-reply opacity rises from 0)
    T.qr = QUICK.map((_, i) => T.reply + QR_AT + i * QR_STAGGER);
    T.settle = Math.max(T.reply + REPLY_IN, T.qr[T.qr.length - 1] + QR_IN, T.flip[T.flip.length - 1] + FLIP);
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('linkedin-logo.svg');
    const inm = (cls = '') => `<img class="li-in ${cls}" src="${mark}" alt=""/>`;
    const logo = (j, cls = '') => `<span class="li-lg ${cls}" style="--c:${j.col}">${esc(j.ini)}</span>`;
    const dot = '<i class="li-dot">·</i>';

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say li-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="li-ct-i li-ct-s">${inm()}</span>`, '<b>superbot connected to LinkedIn</b>'],
      ['<span class="li-ct-i li-ct-d">DR</span>', 'Signed in as <b>Dana Ruiz</b>'],
      ['<span class="li-ct-i li-ct-n">12</span>', '<b>12</b> verified roles ready to apply'],
    ];
    const card = x.el(`<div class="li-card-c">
      ${steps.map(([icon, txt]) => `<div class="li-step">${icon}<span class="li-tx">${txt}</span><span class="li-ok"><i class="li-spin"></i>${I.check}</span></div>`).join('')}
      <div class="li-shot"></div>
    </div>`);
    const shot = card.querySelector('.li-shot');
    const checks = [...card.querySelectorAll('.li-ok')].map((n) => ({ spin: n.querySelector('.li-spin'), ck: n.querySelector('.li-ck') }));

    // ---- the full-frame LinkedIn window (built by layout(), once the frame's shape is known) ----
    const layer = x.el('<div class="li-full" aria-hidden="true"><div class="li-app"></div></div>');
    x.root.appendChild(layer);
    const app = layer.firstElementChild;

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, G = null;
    let AW = 1536, AH = 864;

    // a results card: logo tile, title, company, location, Verified, and the footer's three states stacked
    const jobCard = (j, i, tall) => `<div class="li-jc${i === 0 && !tall ? ' li-sel' : ''}">
      ${logo(j)}
      <div class="li-jb">
        <b class="li-jt">${esc(j.title)}</b>
        ${tall ? `<span class="li-jco">${esc(j.co)}${dot}${esc(j.loc)}</span>` : `<span class="li-jco">${esc(j.co)}</span><span class="li-jl">${esc(j.loc)}</span>`}
        <span class="li-ver">${I.shield}Verified</span>
        <span class="li-jf">
          <span class="li-f0">${esc(j.ago)}${dot}${inm()}Easy Apply</span>
          <span class="li-f1">${I.check}Applied now</span>
          <span class="li-f2">${I.eye}Application viewed</span>
        </span>
      </div>
    </div>`;
    const navHTML = (tall) => tall
      ? `<header class="li-nav"><div class="li-navin">
          <span class="li-logo">${inm()}</span>
          <span class="li-search">${I.search}<span>Search</span></span>
          <span class="li-ni li-bell">${I.bell}<i class="li-badge">1</i></span>
          <i class="li-av li-av-dr li-me">DR</i>
        </div></header>`
      : `<header class="li-nav"><div class="li-navin">
          <span class="li-logo">${inm()}</span>
          <span class="li-search">${I.search}<span>Search</span></span>
          <nav class="li-items">
            ${NAV.map(([ic, lab]) => `<span class="li-ni${ic === 'jobs' ? ' li-on' : ''}${ic === 'bell' ? ' li-bell' : ''}">${I[ic]}${ic === 'bell' ? '<i class="li-badge">1</i>' : ''}<span>${lab}</span></span>`).join('')}
            <span class="li-ni li-meni"><i class="li-av li-av-dr">DR</i><span>Me${I.caret}</span></span>
            <i class="li-vsep"></i>
            <span class="li-ni">${I.grid}<span>For Business${I.caret}</span></span>
          </nav>
        </div></header>`;
    const detailHTML = (tall) => `<section class="li-detail">
      <div class="li-dco">${logo(JOBS[0], 'li-lg-s')}<b>Ledgerline</b></div>
      <h1 class="li-h1">Senior Product Manager, Payments</h1>
      <div class="li-meta">Chicago, IL${dot}3 days ago${dot}48 applicants</div>
      <div class="li-tags"><span>${I.money}$185K to $215K/yr</span><span>${I.bldg}Hybrid</span><span>${I.bag}Full-time</span></div>
      <div class="li-acts">
        <span class="li-ea">${inm('li-in-w')}Easy Apply</span><span class="li-save">Save</span>
        <span class="li-applied"><span class="li-a1">${I.check}Applied now${dot}<u>See application</u></span><span class="li-a2">${I.eye}Application viewed</span></span>
      </div>
      <div class="li-team"><h3>Meet the hiring team</h3>
        <div class="li-tm"><i class="li-av li-av-ps">PS</i><div class="li-tmb"><div><b>Priya Shah</b><span class="li-poster">Job poster</span></div><small>Director of Product, Payments</small></div><span class="li-mbtn">${I.send}Message</span></div>
      </div>
      ${tall ? '' : `<div class="li-about"><h3>About the job</h3>${ABOUT.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`}
    </section>`;
    const modalHTML = () => `<div class="li-mw"><div class="li-bk"></div><div class="li-modal">
      <div class="li-mh"><b>Apply to Ledgerline</b><span class="li-x">${I.x}</span></div>
      <div class="li-mbs">
        <div class="li-mb li-review">
          <div class="li-prog"><i><b></b></i><span>100%</span></div>
          <h2>Review your application</h2>
          <div class="li-sec"><h4>Contact info</h4>
            <div class="li-ci"><i class="li-av li-av-dr li-av-l">DR</i><div><b>Dana Ruiz</b><small>Senior Product Manager</small><small>Chicago, Illinois</small></div></div>
            <div class="li-fld"><label>Mobile phone number</label><span>+1 312 555 0148</span></div>
          </div>
          <div class="li-sec"><h4>Resume</h4>
            <div class="li-res"><span class="li-pdf">PDF</span><div><b>Dana_Ruiz_Resume_Ledgerline.pdf</b><small>Tailored for this role</small></div><span class="li-rck">${I.check}</span></div>
          </div>
          <div class="li-follow"><i class="li-cbx">${I.check}</i>Follow Ledgerline</div>
        </div>
        <div class="li-mb li-sent">${I.bigck}<b>Your application was sent to Ledgerline!</b></div>
      </div>
      <div class="li-mf"><span class="li-back">Back</span><span class="li-submit">Submit application</span><span class="li-done">Done</span></div>
    </div></div>`;
    const chatHTML = () => `<div class="li-chat">
      <div class="li-chh"><span class="li-avw"><i class="li-av li-av-ps">PS</i><i class="li-pres"></i></span><b>Priya Shah</b><span class="li-chi">${I.dots}${I.min}${I.x}</span></div>
      <div class="li-chb">
        <div class="li-cm li-mine"><i class="li-av li-av-dr">DR</i><div class="li-cmb"><div class="li-cmh"><b>Dana Ruiz</b>${dot}<small>10:42 AM</small></div><p>${esc(NOTE)}</p></div></div>
        <div class="li-day"><span>Monday</span></div>
        <div class="li-cm li-reply"><i class="li-av li-av-ps">PS</i><div class="li-cmb"><div class="li-cmh"><b>Priya Shah</b>${dot}<small>9:14 AM</small></div><p>${esc(REPLY)}</p></div></div>
        <div class="li-qr">${QUICK.map((q) => `<span>${esc(q)}</span>`).join('')}</div>
      </div>
      <div class="li-chc"><span>Write a message...</span>${I.send}</div>
    </div>`;

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes the mobile layout
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
      app.className = `li-app ${tall ? 'li-tall' : 'li-wide'}`;
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('li-tallc', tall);
      const list = tall
        ? `<div class="li-more"><div class="li-mt"><b>More jobs</b><small>11 more verified roles</small></div>${JOBS.slice(1, 4).map((j, i) => jobCard(j, i + 1, true)).join('')}</div>`
        : '';
      app.innerHTML = `${navHTML(tall)}
        ${tall ? '' : `<div class="li-sbar"><div class="li-sbin">
          <span class="li-field">${I.search}<b>Senior Product Manager</b></span>
          <span class="li-field">${I.pin}<b>Chicago, Illinois</b></span>
          <i class="li-vsep"></i>
          <span class="li-pill li-pon">Easy Apply</span><span class="li-pill">Date posted${I.caret}</span><span class="li-pill">Experience level${I.caret}</span><span class="li-pill">Remote${I.caret}</span>
        </div></div>`}
        <main class="li-main">${tall
          ? `<div class="li-col">${detailHTML(true)}${list}</div>`
          : `<div class="li-split"><section class="li-list"><div class="li-lh"><b>Senior Product Manager in Chicago</b><small>12 results</small></div>${JOBS.map((j, i) => jobCard(j, i, false)).join('')}</section>${detailHTML(false)}</div>`}
        </main>
        <div class="li-toast"><i class="li-tst"></i>${I.check}<span>${esc(TOAST)}</span>${I.x}</div>
        ${chatHTML()}
        <div class="li-dim"></div>
        <div class="li-clock"><span class="li-cl0">${esc(CLOCK[0])}</span><span class="li-cl1">${esc(CLOCK[1])}</span></div>
        ${modalHTML()}`;
      const q = (sel) => app.querySelector(sel);
      const qa = (sel) => [...app.querySelectorAll(sel)];
      // the cards that flip, in order: wide, the list (Ledgerline first); tall, the detail's status line, then the strip
      const cards = qa('.li-jc').map((n) => ({ f0: n.querySelector('.li-f0'), f1: n.querySelector('.li-f1'), f2: n.querySelector('.li-f2') }));
      G = {
        tall, cards,
        ea: q('.li-ea'), save: q('.li-save'), applied: q('.li-applied'), a1: q('.li-a1'), a2: q('.li-a2'),
        mw: q('.li-mw'), bk: q('.li-bk'), modal: q('.li-modal'), review: q('.li-review'), sent: q('.li-sent'),
        back: q('.li-back'), submit: q('.li-submit'), done: q('.li-done'), bigck: q('.li-bigck'),
        toast: q('.li-toast'), chat: q('.li-chat'), reply: q('.li-reply'), day: q('.li-day'), qr: qa('.li-qr span'),
        dim: q('.li-dim'), clock: q('.li-clock'), cl0: q('.li-cl0'), cl1: q('.li-cl1'), badge: q('.li-badge'),
      };
    };

    // a node's centre in the window's own px (transform-free: the window's rect divided by its current scale)
    const ptOf = (n, fx = 0.5, fy = 0.55) => {
      const a = app.getBoundingClientRect(), b = n.getBoundingClientRect();
      const sc = a.width / AW || 1;
      return { x: (b.left - a.left + b.width * fx) / sc, y: (b.top - a.top + b.height * fy) / sc };
    };
    const flipTo = (a, b, t, at) => {
      // a footer flips over: a turns away, b turns in (rotateX), over FLIP
      const p = seg(t, at, at + FLIP);
      const pa = Math.min(1, p * 2), pb = Math.max(0, p * 2 - 1);
      a.style.opacity = p < 0.5 ? '1' : '0';
      a.style.transform = p > 0 && p < 0.5 ? `rotateX(${(pa * 90).toFixed(1)}deg)` : '';
      b.style.opacity = p >= 0.5 ? '1' : '0';
      b.style.transform = p >= 0.5 && p < 1 ? `rotateX(${((1 - pb) * -90).toFixed(1)}deg)` : '';
    };
    const fade = (n, o, dy = 0) => {
      n.style.opacity = o.toFixed(3);
      n.style.transform = dy && o < 1 ? `translateY(${((1 - o) * dy).toFixed(2)}px)` : '';
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        checks.forEach((c, i) => {
          const p = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = p.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, p).toFixed(4)})`;
        });
        layout();
        if (!G) return;

        // ---- Easy Apply: the press, the modal over its backdrop, Submit, the sent state, the close ----
        const pr1 = press(t, T.p1), pr2 = press(t, T.p2);
        G.ea.style.transform = pr1 > 0 ? `scale(${(1 - 0.05 * pr1).toFixed(4)})` : '';
        G.ea.style.backgroundColor = pr1 > 0 ? `rgb(${Math.round(lerp(10, 0, pr1))}, ${Math.round(lerp(102, 65, pr1))}, ${Math.round(lerp(194, 130, pr1))})` : '';
        G.submit.style.transform = pr2 > 0 ? `scale(${(1 - 0.05 * pr2).toFixed(4)})` : '';
        G.submit.style.backgroundColor = pr2 > 0 ? `rgb(${Math.round(lerp(10, 0, pr2))}, ${Math.round(lerp(102, 65, pr2))}, ${Math.round(lerp(194, 130, pr2))})` : '';
        const mo = outCubic(seg(t, T.modal, T.modal + MODAL_IN)) * (1 - seg(t, T.close, T.close + CLOSE));
        G.mw.style.display = mo > 0 ? 'block' : 'none';
        G.bk.style.opacity = mo.toFixed(3);
        const mp = outCubic(seg(t, T.modal, T.modal + MODAL_IN));
        const mc = seg(t, T.close, T.close + CLOSE);
        G.modal.style.opacity = (G.tall ? 1 : mp * (1 - mc)).toFixed(3);
        G.modal.style.transform = G.tall
          ? `translateY(${(((1 - mp) + inOutCubic(mc)) * 100).toFixed(2)}%)`
          : `translate(-50%, -50%) scale(${(lerp(0.96, 1, mp) - 0.03 * mc).toFixed(4)})`;
        const sw = outCubic(seg(t, T.sent, T.sent + SENT_IN));
        G.review.style.opacity = (1 - sw).toFixed(3);
        G.sent.style.opacity = sw.toFixed(3);
        G.bigck.style.transform = `scale(${lerp(0.6, 1, sw).toFixed(4)})`;
        G.back.style.opacity = (1 - sw).toFixed(3);
        G.submit.style.opacity = (1 - sw).toFixed(3);
        G.done.style.opacity = sw.toFixed(3);
        G.done.style.visibility = sw > 0 ? '' : 'hidden';
        G.submit.style.visibility = sw < 1 ? '' : 'hidden';

        // ---- after: the detail's status, each card's footer flipping to Applied now, the toast ----
        const ap = seg(t, T.close, T.close + 0.2);
        G.ea.style.opacity = (1 - ap).toFixed(3);
        G.save.style.opacity = (1 - ap).toFixed(3);
        G.applied.style.opacity = ap.toFixed(3);
        flipTo(G.a1, G.a2, t, T.reply);
        G.cards.forEach((c, i) => {
          // card i flips at T.flip[i] (wide: Ledgerline first; tall: the strip, as the detail's status line lands)
          const at = T.flip[i];
          if (t < at + FLIP) { flipTo(c.f0, c.f1, t, at); c.f2.style.opacity = '0'; c.f2.style.transform = ''; }
          else if (!G.tall && i === 0) { c.f0.style.opacity = '0'; c.f0.style.transform = ''; flipTo(c.f1, c.f2, t, T.reply); }
          else { c.f0.style.opacity = '0'; c.f0.style.transform = ''; c.f1.style.opacity = '1'; c.f1.style.transform = ''; c.f2.style.opacity = '0'; }
        });
        const to = outCubic(seg(t, T.toast, T.toast + TOAST_IN)) * (1 - seg(t, T.skip, T.skip + DIM_IN));
        G.toast.style.opacity = to.toFixed(3);
        G.toast.style.transform = `translate${G.tall ? 'Y' : 'X'}(${((1 - outCubic(seg(t, T.toast, T.toast + TOAST_IN))) * (G.tall ? -24 : -40)).toFixed(2)}px)`;

        // ---- messaging: the window rises with Dana's note, the time skip, Priya's reply ----
        const cu = outCubic(seg(t, T.chat, T.chat + CHAT_IN));
        G.chat.style.opacity = cu > 0 ? '1' : '0';
        G.chat.style.transform = `translateY(${((1 - cu) * 105).toFixed(2)}%)`;
        const dm = seg(t, T.skip, T.skip + DIM_IN) * (1 - seg(t, T.undim, T.undim + DIM_OUT));
        G.dim.style.opacity = (dm * 0.5).toFixed(3);
        G.clock.style.opacity = dm.toFixed(3);
        G.clock.style.transform = `translate(-50%, -50%) scale(${lerp(0.92, 1, outCubic(seg(t, T.skip, T.skip + DIM_IN))).toFixed(4)})`;
        flipTo(G.cl0, G.cl1, t, T.flipC);
        const rp = outCubic(seg(t, T.reply, T.reply + REPLY_IN));
        G.reply.style.opacity = rp.toFixed(3);
        G.reply.style.transform = rp >= 1 ? '' : `translateY(${((1 - rp) * 14).toFixed(2)}px)`;
        fade(G.day, rp);
        G.qr.forEach((n, i) => fade(n, outCubic(seg(t, T.qr[i], T.qr[i] + QR_IN)), 8));
        const bd = outCubic(seg(t, T.reply, T.reply + 0.2));
        G.badge.style.opacity = bd.toFixed(3);
        G.badge.style.transform = `scale(${lerp(0.3, 1, bd).toFixed(4)})`;
      },
      // the pointer: it sets off from the page for Easy Apply, presses it, moves on to Submit application, presses
      // it, and fades as the modal swaps. In the section's px (the full-frame window is the whole section by then).
      pointer(t) {
        if (!G || t < T.ptr - 0.15 || t > T.sent + 0.45) return null;
        const W = x.root.offsetWidth, s = W / AW;
        const ea = ptOf(G.ea), sb = ptOf(G.submit);
        const from = { x: ea.x + (G.tall ? 120 : 260), y: ea.y + (G.tall ? 190 : 230) };
        let p;
        if (t < T.sub) { const m = inOutCubic(seg(t, T.ptr, T.p1 - PRESS_AT)); p = { x: lerp(from.x, ea.x, m), y: lerp(from.y, ea.y, m) }; }
        else { const m = inOutCubic(seg(t, T.sub, T.p2 - PRESS_AT)); p = { x: lerp(ea.x, sb.x, m), y: lerp(ea.y, sb.y, m) }; }
        const v = seg(t, T.ptr - 0.15, T.ptr) * (1 - seg(t, T.sent + 0.2, T.sent + 0.45));
        return { x: p.x * s, y: p.y * s, p: Math.max(press(t, T.p1), press(t, T.p2)), v };
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
