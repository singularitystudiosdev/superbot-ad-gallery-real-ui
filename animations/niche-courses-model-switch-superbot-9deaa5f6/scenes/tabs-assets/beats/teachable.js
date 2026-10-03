// Teachable beat, the finale: superbot launches the course on the user's own Teachable school. Its line streams and a
// Teachable-styled connection sheet lands in the chat as a card (Teachable's own look, chat.css --tc-*: a white card,
// the serif heading, the lemon pill primary with its black label and black hairline, the white secondary pill):
// superbot's tile and Teachable's app mark joined by the dotted connector, "Connect superbot to Teachable", the account
// it connects to ("Signed in as Rosa Lindqvist"), what superbot may do (create and edit courses in the school; upload
// lesson videos and quizzes; publish courses and set prices), Cancel and Connect. The pointer presses Connect, and the
// base's connect-card grammar follows: a checklist card ("Connected to Teachable", "24 lessons uploaded, 3:55:40",
// "4 quizzes added", "Price set, $149") ticking in turn, with a mini window under it; the card holds (CARD_HOLD) and the
// window opens to full frame (GROW).
// Full frame is the Teachable admin, the course's Curriculum page (the creator dashboard as Teachable's own help-center
// captures show it, 2025-11-03: a light page with the dark #222 sidebar). On 16:9 the sidebar: the official Teachable
// wordmark over the school name, the admin's icon rail (Courses, the library glyph, current) and the course column (the
// course image card with the title over it, the lime Setup guide pill, then the course sub-nav in Teachable's own
// order and words: Curriculum current, Design templates, Certificates, Information | Pricing, Sales pages, Embed,
// Coupons, Upsell funnel | Comments, Students, Reports), the user at the foot. The page: the breadcrumb back to Courses;
// the course header (the 16:9 course image, "Sourdough from Scratch", the school, the status badge "Unpublished",
// Bulk edit and Preview); the serif "Curriculum"; the four section cards (drag gutter, serif title, its lesson count,
// Quick actions): Section 1 open with its five lessons and its quiz lesson (Teachable keeps a quiz as a Quiz block in a
// lesson, so the quiz is a lesson row too), each with the outline "Publish" button, then New lesson / Bulk upload;
// Sections 2 to 4 closed with their counts. The rows sweep in one by one (SWEEP, the base's ~1 s). On 16:9 the right
// rail is the sales page preview (the course image, the title, $149, "Enroll now"). The ONE bold moment (the chime,
// window.__AD_MARKS.chime): the badge flips to "Published", every lesson's Publish turns "Published" in a quick cascade,
// and Teachable's dark toast rises: "Sourdough from Scratch is live", "24 lessons, $149". The final state holds (READ).
//
// There is ONE page, on a layer in the scene root (outside the camera). While the checklist card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The page is laid out once at a
// design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full frame are the
// same pixels at two sizes. On a portrait frame (4:5) it drops the sidebar, the breadcrumb, the buttons and the rail,
// adds a dark top bar (the wordmark, the school, the RL avatar), and keeps the course header with its badge, the four
// section rows with their counts, and the toast, at a larger scale. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=9deaa5f6';
import { COURSE } from './edit.js?v=9deaa5f6';

const SAY = 'Launching it on your Teachable school.';
const STEPS = [
  ['account', 'Connected to <b>Teachable</b>'],
  ['upload', `<b>${COURSE.lessons} lessons</b> uploaded, <b>${COURSE.teach}</b>`],
  ['list-checks', `<b>${COURSE.quizzes} quizzes</b> added`],
  ['tag', `Price set, <b>${COURSE.price}</b>`],
];
// the admin icon rail, top to bottom as the 2025-11-03 capture shows it (Dashboard, Users, Site, Sales, Emails, Quick
// links, Settings, then the products: Courses current, Coaching, Digital downloads, Community, Memberships, Bundles, Plan)
const RAIL = ['trending-up', 'users', 'monitor-smartphone', 'circle-dollar-sign', 'mail', 'grid-2x2-plus', 'settings',
  'library', 'calendar', 'file-down', 'messages-square', 'key-round', 'shapes', 'zap'];
// the course sub-nav, Teachable's own groups and words
const SUBNAV = [['Curriculum', 'Design templates', 'Certificates', 'Information'], ['Pricing', 'Sales pages', 'Embed', 'Coupons', 'Upsell funnel'], ['Comments', 'Students', 'Reports']];

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
const SWEEP_AT = 0.35; /* deliberate */         // full frame (Unpublished, no rows yet) to the first row
const SWEEP = 0.9; /* deliberate */             // first row to the last row starting (16:9: 10 rows 0.1 apart; 4:5: 4 rows 0.3 apart)
const ROW_IN = 0.22;                            // a row rising in
const BOLD_AT = 0.25;                           // the last row in to the status flipping (the chime)
const BOLD_IN = 0.34;                           // the badge crossing to Published, the toast rising in
const PUB_STEP = 0.035;                         // one lesson's Publish turning Published to the next
const READ = 1.5; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 9.6;                             // the card's window radius (Teachable's medium radius .6rem), eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="sk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const avatar = (cls = '') => `<span class="tc-av ${cls}">${COURSE.initials}</span>`;
const count = (n) => `${n} lessons, 1 quiz`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the connect sheet lands
    T.tap = T.card + TAP_AT;                           // Connect is pressed
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame: Unpublished, the rows not in yet
    T.sweep = T.full + SWEEP_AT;                       // the first row sweeps in
    T.swept = T.sweep + SWEEP + ROW_IN;                // all rows in
    T.bold = T.swept + BOLD_AT;                        // Published, the lessons, the toast (the chime)
    T.settle = T.bold + BOLD_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.bold });
    const logo = x.brand('teachable-logo.svg');
    const mark = x.brand('teachable-mark.png');
    const img = x.img('course-image.jpg');
    const icon = (cls = '') => `<span class="tc-mk ${cls}"><img src="${mark}" alt=""/></span>`;

    // ---- the connection sheet in the chat (Teachable's light look) ----
    const say = x.el(`<div class="qc-say sk-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const sheet = x.el(`<div class="sc-card">
      <div class="sc-logos">${x.tile('superbot', 'sc-sb')}<i class="sc-dots"></i>${icon('sc-tc')}</div>
      <div class="sc-title">Connect superbot to Teachable</div>
      <div class="sc-acct">${avatar('sc-av')}<span>Signed in as <b>${esc(COURSE.creator)}</b></span></div>
      <div class="sc-perm">
        <div class="sc-row">${lc('book-open')}<span>Create and edit courses in ${esc(COURSE.school)}</span></div>
        <div class="sc-row">${lc('upload')}<span>Upload lesson videos and quizzes</span></div>
        <div class="sc-row">${lc('circle-dollar-sign')}<span>Publish courses and set prices</span></div>
      </div>
      <div class="sc-btns"><span class="tc-btn tc-sec">Cancel</span><span class="tc-btn tc-pri sc-go">Connect</span></div>
    </div>`);
    const go = sheet.querySelector('.sc-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'account' ? icon('sk-tc') : `<span class="sk-ic">${lc(kind)}</span>`);
    const card = x.el(`<div class="sk-card">
      ${STEPS.map(([kind, txt]) => `<div class="sk-step">${stepIcon(kind)}<span class="sk-tx">${txt}</span><span class="sk-ok"><i class="sk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="sk-shot"></div>
    </div>`);
    const shot = card.querySelector('.sk-shot');
    const checks = [...card.querySelectorAll('.sk-ok')].map((n) => ({ spin: n.querySelector('.sk-spin'), ck: n.querySelector('.sk-ck') }));

    // ---- the full-frame Teachable admin, the course's Curriculum page ----
    const grip = `<span class="tc-grip">${lc('grip-vertical')}</span>`;
    const kebab = `<span class="tc-keb">${lc('ellipsis-vertical')}</span>`;
    const pubBtn = `<span class="tc-psw"><span class="tc-pb tc-pb-un">Publish</span><span class="tc-pb tc-pb-on">Published${lc('chevron-down')}</span></span>`;
    const lesson = (title) => `<div class="tc-ls tc-sw">${grip}<span class="tc-lt">${esc(title)}</span>${pubBtn}${kebab}</div>`;
    const secHead = (i, name, n) => `<div class="tc-sh"><h3>Section ${i + 1}: ${esc(name)}</h3><small>${count(n)}</small>
      <span class="tc-qa tc-wide">Quick actions${lc('chevron-down')}</span>${kebab}</div>`;
    const [s1, ...rest] = COURSE.sections;
    const layer = x.el(`<div class="tc-full" aria-hidden="true"><div class="tc-app">
      <header class="tc-top tc-tall">
        <img class="tc-logo" src="${logo}" alt=""/><b class="tc-top-sch">${esc(COURSE.school)}</b>${avatar('tc-av-top')}
      </header>
      <div class="tc-body">
        <nav class="tc-side tc-wide">
          <div class="tc-side-hd"><img class="tc-logo" src="${logo}" alt=""/><b>${esc(COURSE.school)}</b></div>
          <div class="tc-side-mid">
            <div class="tc-rail">${RAIL.map((g) => `<span class="tc-ri${g === 'library' ? ' on' : ''}">${lc(g)}</span>`).join('')}</div>
            <div class="tc-sub">
              <span class="tc-ccard"><img src="${img}" alt=""/><b>${esc(COURSE.title)}</b></span>
              <span class="tc-setup">Setup guide${lc('chevron-right')}</span>
              ${SUBNAV.map((g) => `<div class="tc-grp">${g.map((l) => `<span class="tc-sn${l === 'Curriculum' ? ' on' : ''}">${l}</span>`).join('')}</div>`).join('')}
            </div>
          </div>
          <div class="tc-side-ft">${avatar('tc-av-s')}<span>${esc(COURSE.creator)}</span>${lc('ellipsis-vertical')}</div>
        </nav>
        <main class="tc-main">
          <div class="tc-crumb tc-wide"><u>Courses</u><i>|</i><span>${esc(COURSE.title)}</span></div>
          <div class="tc-head">
            <img class="tc-cimg" src="${img}" alt=""/>
            <div class="tc-hm">
              <div class="tc-h1row"><h1>${esc(COURSE.title)}</h1>
                <span class="tc-stat"><span class="tc-badge tc-un">Unpublished</span><span class="tc-badge tc-pub">Published</span></span></div>
              <span class="tc-school">${esc(COURSE.school)}</span>
            </div>
            <span class="tc-acts tc-wide"><span class="tc-ob">Bulk edit</span><span class="tc-ob">Preview</span></span>
          </div>
          <div class="tc-cols">
            <div class="tc-cur">
              <h2>Curriculum</h2>
              <section class="tc-sec tc-open"><div class="tc-gut">${grip}</div><div class="tc-sb">
                <div class="tc-sw tc-sw-h">${secHead(0, s1[0], s1[1])}</div>
                ${COURSE.s1.map(lesson).join('')}${lesson('Section 1 quiz')}
                <div class="tc-sf tc-sw-f"><span>${lc('square-plus')}New lesson</span><span>${lc('copy-plus')}Bulk upload</span></div>
              </div></section>
              ${rest.map(([name, n], i) => `<section class="tc-sec tc-sw tc-sw-c"><div class="tc-gut">${grip}</div><div class="tc-sb">${secHead(i + 1, name, n)}</div></section>`).join('')}
            </div>
            <aside class="tc-rail-r tc-wide">
              <section class="tc-sale">
                <div class="tc-sale-h"><b>Sales page</b>${lc('external-link')}</div>
                <img src="${img}" alt=""/>
                <div class="tc-sale-b"><b class="tc-sale-t">${esc(COURSE.title)}</b><small>${esc(COURSE.school)}</small>
                  <span class="tc-price">${esc(COURSE.price)}</span><span class="tc-enroll">Enroll now</span></div>
              </section>
            </aside>
          </div>
        </main>
      </div>
      <span class="tc-help tc-wide"><img src="${mark}" alt=""/></span>
      <div class="tc-toast">${lc('circle-check')}<span><b>${esc(COURSE.title)} is live</b><small>${COURSE.lessons} lessons, ${esc(COURSE.price)}</small></span></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    // the sweep: the open section's header and its six lesson rows, then the three closed sections (the open
    // section's footer rides with its last lesson); on 4:5 the lesson rows are hidden, so its four section rows sweep
    const sweepAll = [...layer.querySelectorAll('.tc-sw')];
    const foot = $('.tc-sw-f');
    const pubs = [...layer.querySelectorAll('.tc-ls .tc-psw')].map((n) => ({ un: n.querySelector('.tc-pb-un'), on: n.querySelector('.tc-pb-on') }));
    const un = $('.tc-un'), pub = $('.tc-pub'), toast = $('.tc-toast');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, rows = sweepAll;
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
      app.classList.toggle('tc-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('sk-tall', tall);
      sheet.classList.toggle('sc-tall', tall);
      rows = tall ? sweepAll.filter((n) => !n.classList.contains('tc-ls')) : sweepAll;
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
        go.classList.toggle('tc-hit', t >= T.tap);

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

        // the sweep: each visible row rises in, SWEEP / (n - 1) apart; the open section's footer rides with the row
        // before it
        const m = rows.length;
        const at = (i) => T.sweep + (m > 1 ? (SWEEP * i) / (m - 1) : 0);
        rows.forEach((row, i) => {
          const o = outCubic(seg(t, at(i), at(i) + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
          if (row.nextElementSibling === foot) { foot.style.opacity = row.style.opacity; foot.style.transform = row.style.transform; }
        });

        // the bold moment: the badge crosses to Published, the lessons publish in a quick cascade, the toast rises
        const b = outCubic(seg(t, T.bold, T.bold + BOLD_IN));
        un.style.opacity = (1 - outCubic(seg(t, T.bold, T.bold + BOLD_IN * 0.45))).toFixed(3);
        const pi = outCubic(seg(t, T.bold + BOLD_IN * 0.3, T.bold + BOLD_IN));
        pub.style.opacity = pi.toFixed(3);
        pub.style.transform = pi >= 1 ? 'none' : `scale(${lerp(0.8, 1, pi).toFixed(4)})`;
        pubs.forEach((o, i) => {
          const d = T.bold + i * PUB_STEP;
          o.un.style.opacity = (1 - outCubic(seg(t, d, d + 0.12))).toFixed(3);
          const q = outCubic(seg(t, d + 0.08, d + 0.26));
          o.on.style.opacity = q.toFixed(3);
          o.on.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.85, 1, q).toFixed(4)})`;
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
