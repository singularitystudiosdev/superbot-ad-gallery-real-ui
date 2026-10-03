// beehiiv beat, the finale: superbot drafts Issue 87 in the writer's own beehiiv workspace, and she schedules it.
// Its line streams and beehiiv's MCP consent card lands in the chat, modeled on the authorize screen in beehiiv's help
// article "Getting started with the beehiiv MCP" (support article 39255979546263): the app's mark, a check, the beehiiv
// mark; the app's name; "wants to access your workspace: Gravel Letter"; the two permission checkboxes exactly as that
// screen words them; Grant Access / Cancel. The pointer (the writer's) taps Grant Access, and the base's connect-card
// grammar follows: a checklist card ("Connected to beehiiv", "Draft created: Issue 87", "Subject and preview text
// set", "Cover photo and alt text added") ticking in turn, with a mini window under it; the card holds (CARD_HOLD) and
// the window opens to full frame (GROW).
// Full frame is beehiiv's post editor (the 2026 Visual Editor, light): the step bar Compose / Audience / Email / Web /
// Review with Next and Preview, the canvas toolbar with the Draft | Synced status, the word count and the editor's
// icons, the canvas with the draft (masthead, date line, title, subtitle, byline, cover photo, intro, the first story
// headings) and, on a wide frame, the Style > Post panel. The draft's blocks fill in while the window is small. The
// MCP can draft but not schedule (beehiiv publishes and schedules from the app only), so the last step is the
// writer's: beehiiv's "When should this publish?" dialog rises with "Sunday at 7am" typed in, her pointer clicks
// Schedule, and the ONE bold moment (the chime): the status flips Draft -> Scheduled and the toast lands, "Scheduled
// for Sun, Oct 4, 7:00 AM". The final state holds (READ).
//
// There is ONE editor client, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it drops the Style panel and the toolbar's icons.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=80d86619';
import { SUBJECT, PREVIEW, INTRO, SECTIONS } from './issue.js?v=80d86619';

const SAY = 'Drafting it in your beehiiv, as you. You schedule it.';
const WRITER = 'Nora Ellis';
const INITIALS = 'NE';
const PUB = 'Gravel Letter';
// beehiiv's consent screen, its own words (help article 39255979546263, screenshot "Grant Access")
const PERMS = ['Read access to your workspace data.', 'Write access to your workspace data.'];
const CONSENT_NOTE = 'The following permissions are requested by the above app. Please review these and consent if it is OK.';
const STEPS = [
  ['beehiiv', 'Connected to beehiiv'],
  ['file-plus', 'Draft created: <b>Issue 87</b>'],
  ['type', 'Subject and preview text set'],
  ['image', 'Cover photo and alt text added'],
];
const STEPPER = ['Compose', 'Audience', 'Email', 'Web', 'Review'];
const DATE = 'October 4, 2026';
const WHEN = 'Sun, Oct 4, 7:00 AM';
const TYPED = 'Sunday at 7am';
const TOAST = `Scheduled for ${WHEN}`;
const TOAST_SUB = 'Issue 87, 5 stories, 1,140 words';

const APP_SCALE = { wide: 1.3, tall: 1.7 };      // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                            // the line streams, then the consent card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */            // the consent card landed to the tap on Grant Access (it reads first)
const PTR_IN = 0.3;                              // the consent card landed to the pointer appearing
const PTR_MOVE = 0.38;                           // the pointer's travel onto the button, ending just before the tap
const LIST_AT = 0.25;                            // the tap to the checklist card landing
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const ROWS_AT = 0.15;                            // the checklist landing to the first draft block filling in
const ROW_STAGGER = 0.06;                        // one block to the next
const ROW_IN = 0.24;
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const MODAL_AT = 0.35;                           // full frame to the schedule dialog rising
const MODAL_IN = 0.25;
const PTR2_IN = 0.15;                            // the dialog up to the writer's pointer appearing
const PTR2_MOVE = 0.42;                          // its travel onto Schedule
const CLICK_AT = 0.95; /* deliberate */          // the dialog rising to the click on Schedule (the chime)
const OUT = 0.2;                                 // the dialog closing after the click
const TOAST_IN = 0.3;                            // the toast rising
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// the canvas blocks, in the order they fill in
const BLOCKS = ['mast', 'date', 'title', 'sub', 'by', 'cover', 'intro', 'h0', 'h1', 'h2'];

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the consent card lands
    T.tap = T.card + TAP_AT;                           // Grant Access is tapped
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.rows = BLOCKS.map((_, i) => T.list + ROWS_AT + i * ROW_STAGGER); // the draft's blocks fill in
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.modal = T.full + MODAL_AT;                       // "When should this publish?" rises
    T.bold = T.modal + CLICK_AT;                       // the writer clicks Schedule (the chime)
    T.settle = T.bold + Math.max(OUT, TOAST_IN);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.bold });

    // ---- the consent card in the chat ----
    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="gc-card">
      <div class="gc-top"><img src="${icon('beehiiv-mark.png')}" alt=""/><span>Connect superbot to beehiiv</span></div>
      <div class="gc-body">
        <div class="gc-logos">${x.tile('superbot', 'gc-app')}<i class="gc-ln"></i><span class="gc-mid">${lc('check')}</span><i class="gc-ln"></i><img class="gc-bh" src="${icon('beehiiv-mark.png')}" alt=""/></div>
        <div class="gc-title">superbot</div>
        <div class="gc-ws">wants to access your workspace: <b>${esc(PUB)}</b></div>
        <span class="gc-acct"><i class="gc-av">${INITIALS}</i>Signed in as ${esc(WRITER)}</span>
        <div class="gc-sel">${esc(CONSENT_NOTE)}</div>
        ${PERMS.map((txt, i) => `<div class="gc-row"><i class="gc-cb${i ? ' gc-cb-on' : ''}">${lc('check')}</i><span>${esc(txt)}</span></div>`).join('')}
        <div class="gc-btns"><span class="gc-go">Grant Access</span><span class="gc-cancel">Cancel</span></div>
      </div>
    </div>`);
    const go = consent.querySelector('.gc-go');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'beehiiv' ? `<span class="gk-ic gk-img"><img src="${icon('beehiiv-mark.png')}" alt=""/></span>`
      : `<span class="gk-ic gk-ms">${lc(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the full-frame beehiiv post editor ----
    const row = (label, val, unit = '') => `<div class="bh-f"><span>${label}</span><span class="bh-in">${unit ? `${val}<i>${unit}</i>` : `<b class="bh-sw"></b>${val}${lc('chevron-down')}`}</span></div>`;
    const layer = x.el(`<div class="bh-full" aria-hidden="true"><div class="bh-app">
      <header class="bh-top">
        <span class="bh-back">${lc('arrow-left')}<span>Posts</span></span>
        <nav class="bh-steps">${STEPPER.map((s, i) => `${i ? '<i class="bh-dash"></i>' : ''}<span class="bh-step${i === 0 ? ' bh-on' : ''}">${s}</span>`).join('')}</nav>
        <span class="bh-acts"><span class="bh-next">Next</span><span class="bh-prev">${lc('maximize')}<span>Preview</span><i class="bh-sep"></i>${lc('chevron-down')}</span></span>
      </header>
      <div class="bh-bar">
        <span class="bh-status"><span class="bh-st">Draft</span><i></i><span>Synced</span><b class="bh-dot"></b></span>
        <span class="bh-words">${lc('letter-text')}<span>1,140 words</span></span>
        <span class="bh-tools"><i class="bh-vr"></i>${lc('search')}${lc('undo-2')}${lc('redo-2', 'bh-dim')}<i class="bh-vr"></i>${lc('message-circle')}${lc('link')}${lc('save')}<i class="bh-vr"></i><span class="bh-more">${lc('sliders-vertical')}${lc('chevron-down', 'bh-cd')}</span></span>
        <span class="bh-me">${INITIALS}</span>
      </div>
      <div class="bh-main">
        <section class="bh-canvas"><div class="bh-post">
          <div class="bh-b bh-mast" data-b="mast">${esc(PUB)}</div>
          <div class="bh-b bh-date" data-b="date">${DATE}<i>|</i><u>Read online</u></div>
          <h1 class="bh-b bh-title" data-b="title">${esc(SUBJECT)}</h1>
          <p class="bh-b bh-subt" data-b="sub">${esc(PREVIEW)}</p>
          <div class="bh-b bh-by" data-b="by"><span class="bh-av">${INITIALS}</span><span><u>${esc(WRITER)}</u><small>${DATE}</small></span></div>
          <div class="bh-b bh-cover" data-b="cover"><img src="${x.img('cover.jpg')}" width="1280" height="720" alt=""/></div>
          <p class="bh-b bh-intro" data-b="intro">${esc(INTRO)}</p>
          ${SECTIONS.map((s, i) => `<h2 class="bh-b bh-h2" data-b="h${i}">${i + 1}. ${esc(s)}</h2>`).join('')}
        </div></section>
        <aside class="bh-panel">
          <div class="bh-ph"><span>Style <b>&gt; Post</b></span><i class="bh-pt"></i></div>
          <div class="bh-grp"><div class="bh-gh"><i class="bh-gi"></i>Fill${lc('chevron-down', 'bh-up')}</div>${row('Canvas', '#FFFFFF')}${row('Post', '#FFFFFF')}${row('Post border', '#D6D1C8').replace('bh-in', 'bh-in bh-off')}</div>
          <div class="bh-grp"><div class="bh-gh"><i class="bh-gi"></i>Spacing${lc('chevron-down', 'bh-up')}</div>${row('Margin', '0', 'px')}${row('Padding', '15', 'px')}</div>
          <div class="bh-grp"><div class="bh-gh"><i class="bh-gi"></i>Outline${lc('chevron-down', 'bh-up')}</div>${row('Corner radius', '10', 'px')}<i class="bh-sl"><b style="width: 18%"></b></i>${row('Border width', '0', 'px')}<i class="bh-sl"><b style="width: 0%"></b></i></div>
        </aside>
      </div>
      <div class="bh-scrim"></div>
      <div class="bh-modal">
        <div class="bh-mt">When should this publish?</div>
        <div class="bh-opt bh-sel"><span class="bh-oi">${lc('calendar')}</span><span class="bh-ot"><b>Pick a specific time...</b><small>Use natural language or calendar</small></span>${lc('check', 'bh-ok')}</div>
        <div class="bh-inw"><span class="bh-input"><span>${TYPED}</span>${lc('calendar')}</span></div>
        <div class="bh-opt"><span class="bh-oi">${lc('zap')}</span><span class="bh-ot"><b>Publish now</b><small>Goes live immediately</small></span></div>
        <div class="bh-opt bh-when"><span class="bh-oi">${lc('clock')}</span><span class="bh-ot"><b>${WHEN}</b><small>Email and web</small></span></div>
        <div class="bh-mf"><span class="bh-rep">${lc('repeat')}Repeat</span><span class="bh-cancel">Cancel</span><span class="bh-sched">${lc('calendar')}Schedule</span></div>
      </div>
      <div class="bh-toast">${lc('circle-check')}<span><b>${esc(TOAST)}</b><small>${esc(TOAST_SUB)}</small></span></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const blocks = BLOCKS.map((b) => layer.querySelector(`[data-b="${b}"]`));
    const steps = [...layer.querySelectorAll('.bh-step')];
    const status = $('.bh-status'), stLabel = $('.bh-st');
    const scrim = $('.bh-scrim'), modal = $('.bh-modal'), sched = $('.bh-sched'), toast = $('.bh-toast');
    // beehiiv's surfaces are set in Inter (the open substitute, beehiiv.css), the post's headings in Lora: ask for
    // every face up front so a seek never measures in the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 14px "Inter BH"`));
      ['400', '500', '600'].forEach((w) => document.fonts.load(`${w} 16px "Lora BH"`));
    }

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, lastSt = '';
    let AW = 1600, AH = 900;

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
      app.classList.toggle('bh-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('gc-tall', tall);
    };

    // the pointer: onto Grant Access in the chat, a press, then away; later the writer's pointer onto Schedule in the
    // full-frame dialog, a press, then away
    const ptr = (t) => {
      if (t >= T.card + PTR_IN && t <= T.tap + 0.45) {
        const a = T.card + PTR_IN, b = T.tap - 0.08;
        const g = x.box(go);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
        const m = inOutCubic(seg(t, a, a + PTR_MOVE > b ? b : a + PTR_MOVE));
        const leave = outCubic(seg(t, T.tap + 0.2, T.tap + 0.45));
        return { x: lerp(ex + 150, ex, m) + leave * 40, y: lerp(ey + 110, ey, m) + leave * 30, p: press(t, T.tap), v: seg(t, a, a + 0.12) * (1 - leave) };
      }
      const a = T.modal + PTR2_IN, b = T.bold - 0.08;
      if (t >= a && t <= T.bold + 0.5) {
        const g = x.box(sched);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.55, ey = g.y + g.h * 0.6;
        const m = inOutCubic(seg(t, a, Math.min(b, a + PTR2_MOVE)));
        const leave = outCubic(seg(t, T.bold + 0.25, T.bold + 0.5));
        return { x: lerp(ex + 190, ex, m) + leave * 50, y: lerp(ey + 150, ey, m) + leave * 40, p: press(t, T.bold), v: seg(t, a, a + 0.12) * (1 - leave) };
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
        // Grant Access: the press, then it stays in its pressed tone
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.05 * pr).toFixed(4)})` : 'none';
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

        // the draft lands: its blocks fill in, top to bottom
        blocks.forEach((b, i) => {
          const f = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          b.style.opacity = f.toFixed(3);
          b.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 8).toFixed(2)}px)`;
        });

        // the writer's step: the dialog rises (the step bar moves to Review, where beehiiv schedules), Schedule is
        // clicked, the dialog closes, the status flips and the toast lands
        const rev = t >= T.modal;
        steps.forEach((s, i) => s.classList.toggle('bh-on', rev ? i === STEPPER.length - 1 : i === 0));
        const mi = outCubic(seg(t, T.modal, T.modal + MODAL_IN));
        const mo = 1 - seg(t, T.bold + 0.06, T.bold + 0.06 + OUT);
        const mv = mi * mo;
        scrim.style.opacity = mv.toFixed(3);
        modal.style.opacity = mv.toFixed(3);
        modal.style.transform = `translate(-50%, -50%) translateY(${((1 - mi) * 12).toFixed(2)}px) scale(${(t > T.bold ? lerp(0.98, 1, mo) : lerp(0.97, 1, mi)).toFixed(4)})`;
        const sp = press(t, T.bold);
        sched.style.transform = sp ? `scale(${(1 - 0.05 * sp).toFixed(4)})` : 'none';
        const done = t >= T.bold;
        const st = done ? 'Scheduled' : 'Draft';
        if (st !== lastSt) { stLabel.textContent = st; lastSt = st; }
        status.classList.toggle('bh-sch', done);
        const ti = outCubic(seg(t, T.bold, T.bold + TOAST_IN));
        toast.style.opacity = ti.toFixed(3);
        toast.style.transform = ti >= 1 ? 'none' : `translateY(${((1 - ti) * 20).toFixed(2)}px)`;
      },
      // after the camera: lay the layer over the card's window, then open it to the whole frame
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
