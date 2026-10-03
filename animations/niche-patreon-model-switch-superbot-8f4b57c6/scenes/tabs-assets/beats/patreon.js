// Patreon beat, the finale: superbot fills October's post in the creator's own Patreon editor, and she publishes it.
// Patreon's API v2 can read a campaign and its tiers but has no endpoint to create or publish a post (docs.patreon.com
// scopes: identity, campaigns, campaigns.posts is read-only), so superbot connects through Patreon's OAuth sheet to read
// the tiers, fills the post in her signed-in patreon.com editor, and the CREATOR clicks Publish. superbot never
// publishes by itself.
// Its line streams and the authorize sheet lands in the chat: the superbot tile, a check and the Patreon mark; the app's
// name; "wants to access your Patreon account" for the page Heronfield Ink; "Signed in as Juno Hale"; two read
// permissions worded after Patreon's own scope descriptions (identity: "read access to data about the user",
// campaigns: "read access to basic campaign data", tiers included); Deny / Allow. The pointer (the creator's) taps Allow
// within a second of the sheet settling and the buttons give way to a plain "Access allowed" line. The base's
// connect-card grammar follows: a checklist card ("Connected to Patreon", "Read your 3 tiers", "Post filled in on
// patreon.com", "Ready for you to publish") ticking in turn, with a mini window under it; the card holds (CARD_HOLD)
// and the window opens (GROW) to a FRAMED window: a superbot title bar (the superbot mark and name, the Patreon mark and
// patreon.com, who is signed in) around Patreon's post editor, with the dimmed hub showing as a margin on every side,
// never a full-bleed native page (policy guard 1).
// The editor (Patreon's 2026 post editor, light, after the help center's screenshots): the left navigation rail, the
// top bar with the close control, the Draft status, Preview post (small, dimmed) and Publish; the canvas with the lead
// sketch photo, the title, the intro, the strip of 8 pages and the 5 clips with their timecodes (no play glyphs); on a
// wide frame the Settings panel as plain text only (Audience, "Paid-only access, all 3 tiers", the three tier names; no
// radio, checkbox, dropdown or toggle shapes, policy guard 2). The
// post's blocks fill in while the window is small. Publish appears as the window lands; the creator's pointer clicks it
// within a second, the button is REPLACED by a plain "Published" status with the date, and the ONE bold moment (the
// chime) lands: the toast "Published for paid members", "8 pages, 5 clips, 480 words". The final state holds (READ).
//
// There is ONE editor window, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the framed rect. The window is laid out
// once at a design size (the framed rect divided by APP_SCALE) and scaled to the layer, so the mini window and the
// framed editor are the same pixels at two sizes. On a portrait frame (4:5) it drops the rail, the Settings panel,
// Preview post and the clips row. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=8f4b57c6';
import { TITLE, INTRO } from './post.js?v=8f4b57c6';
import { CLIPS } from './process.js?v=8f4b57c6';

const SAY = 'Filling it in on your Patreon, as you. You publish it.';
const CREATOR = 'Juno Hale';
const INITIALS = 'JH';
const PAGE = 'Heronfield Ink';
// the two read permissions, worded after Patreon's scope descriptions (docs.patreon.com, APIv2 scopes)
const PERMS = ['Read access to your profile', 'Read access to your campaign and tiers'];
const STEPS = [
  ['patreon', 'Connected to Patreon'],
  ['layers', 'Read your <b>3 tiers</b>'],
  ['file-text', 'Post filled in on patreon.com'],
  ['circle-check', 'Ready for you to publish'],
];
// the page's three tiers (made up for the spot), all selected: Patreon selects every tier by default
const TIERS = ['Sketch Club', 'Process Pass', 'Page of the Month'];
const DATE = 'Oct 3, 2026';
const TOAST = 'Published for paid members';
const TOAST_SUB = '8 pages, 5 clips, 480 words';
const PAGES = 8;

const APP_SCALE = { wide: 1.3, tall: 1.7 };      // the framed editor: the window's design px to frame px
// the superbot frame: the hub shows as this margin around the window, in frame px (policy guard 1)
const MARGIN = { wide: { x: 64, y: 44 }, tall: { x: 24, y: 64 } };
// policy guard: the close control is dimmed (wide) or dropped (tall), the Settings panel is dimmed, Preview post leaves
// before the Published status arrives; see patreon.css
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                            // the line streams, then the authorize sheet lands
const CARD_IN = 0.3;                             // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */            // the sheet landed to the tap on Allow (it reads first; under 1 s)
const PTR_IN = 0.3;                              // the sheet landed to the pointer appearing
const PTR_MOVE = 0.38;                           // the pointer's travel onto the button, ending just before the tap
const SWAP = 0.18;                               // the tap to the buttons giving way to "Access allowed"
const LIST_AT = 0.25;                            // the tap to the checklist card landing
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const ROWS_AT = 0.15;                            // the checklist landing to the first post block filling in
const ROW_STAGGER = 0.07;                        // one block to the next
const ROW_IN = 0.24;
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the window opens to the framed rect
const PUB_AT = 0.05;                             // the window landed to Publish appearing
const PUB_IN = 0.2;
const PTR2_IN = 0.2;                             // Publish up to the creator's pointer appearing
const PTR2_MOVE = 0.42;                          // its travel onto Publish
const CLICK_AT = 0.85; /* deliberate */          // Publish appearing to the click (the chime; under 1 s)
const OUT = 0.16;                                // Publish giving way to the plain status
const TOAST_IN = 0.3;                            // the toast rising
const READ = 1.7; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 8;                                // the card's window radius in the chat
const FRAME_RADIUS = 14;                         // the superbot frame's radius once open

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// the post's blocks, in the order they fill in
const BLOCKS = ['lead', 'title', 'intro', 'aud', 'pages', 'clips'];

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the authorize sheet lands
    T.tap = T.card + TAP_AT;                           // Allow is tapped
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.rows = BLOCKS.map((_, i) => T.list + ROWS_AT + i * ROW_STAGGER); // the post's blocks fill in
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // the framed editor is in place
    T.pub = T.full + PUB_AT;                           // Publish appears
    T.bold = T.pub + CLICK_AT;                         // the creator clicks Publish (the chime)
    T.settle = T.bold + Math.max(OUT, TOAST_IN);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.bold });

    // ---- the authorize sheet in the chat ----
    const say = x.el(`<div class="qc-say pt-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="gc-card">
      <div class="gc-top"><img src="${icon('patreon-mark.svg')}" alt=""/><span>patreon.com</span></div>
      <div class="gc-body">
        <div class="gc-logos">${x.tile('superbot', 'gc-app')}<i class="gc-ln"></i><span class="gc-mid">${lc('check')}</span><i class="gc-ln"></i><span class="gc-pt"><img src="${icon('patreon-mark.svg')}" alt=""/></span></div>
        <div class="gc-title">superbot</div>
        <div class="gc-ws">wants to access your Patreon account for <b>${esc(PAGE)}</b></div>
        <span class="gc-acct"><i class="gc-av">${INITIALS}</i>Signed in as ${esc(CREATOR)}</span>
        <div class="gc-sel">This will allow superbot to:</div>
        ${PERMS.map((txt) => `<div class="gc-row"><i class="gc-cb">${lc('check')}</i><span>${esc(txt)}</span></div>`).join('')}
        <div class="gc-act"><div class="gc-btns"><span class="gc-deny">Deny</span><span class="gc-go">Allow</span></div><div class="gc-done">${lc('circle-check')}<span>Access allowed</span></div></div>
      </div>
    </div>`);
    const go = consent.querySelector('.gc-go'), btns = consent.querySelector('.gc-btns'), done1 = consent.querySelector('.gc-done');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'patreon' ? `<span class="gk-ic gk-img"><img src="${icon('patreon-mark.svg')}" alt=""/></span>`
      : `<span class="gk-ic gk-ms">${lc(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the framed Patreon post editor ----
    const rail = ['house', 'users', 'layers', 'banknote', 'inbox', 'bell', 'settings'];
    const dim = x.el('<div class="pt-dim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="pt-full" aria-hidden="true"><div class="pt-win">
      <div class="pt-sb">${x.tile('superbot', 'pt-sbt')}<b>superbot</b><i class="pt-sbv"></i><img class="pt-sbp" src="${icon('patreon-mark.svg')}" alt=""/><span class="pt-sbu">patreon.com</span><span class="pt-sbr">Signed in as ${esc(CREATOR)}</span></div>
      <div class="pt-app">
        <nav class="pt-rail"><img class="pt-rm" src="${icon('patreon-mark.svg')}" alt=""/>${rail.map((n) => `<i class="pt-ri">${lc(n)}</i>`).join('')}<i class="pt-ri pt-ron">${lc('square-pen')}</i><span class="pt-rav">${INITIALS}</span></nav>
        <div class="pt-main">
          <header class="pt-top">
            <span class="pt-x">${lc('x')}</span>
            <span class="pt-acts">
              <span class="pt-draft">Draft</span>
              <span class="pt-prev">${lc('eye')}<span>Preview post</span></span>
              <span class="pt-slot"><span class="pt-pub">Publish</span><span class="pt-done">${lc('circle-check')}<b>Published</b><span>${DATE}</span></span></span>
            </span>
          </header>
          <div class="pt-body">
            <section class="pt-canvas"><div class="pt-post">
              <div class="pt-b pt-lead" data-b="lead"><img src="${x.img('lead.jpg')}" width="1280" height="720" alt=""/></div>
              <h1 class="pt-b pt-title" data-b="title">${esc(TITLE)}</h1>
              <p class="pt-b pt-intro" data-b="intro">${esc(INTRO)}</p>
              <div class="pt-b pt-aud" data-b="aud">${lc('lock')}<span>Paid-only access, all 3 tiers</span></div>
              <div class="pt-b pt-pages" data-b="pages">${Array.from({ length: PAGES }, (_, i) => `<span class="pt-pg"><img src="${x.img(`page-${i + 1}.jpg`)}" width="240" height="300" alt=""/></span>`).join('')}</div>
              <div class="pt-b pt-clips" data-b="clips">${CLIPS.map((tc, i) => `<span class="pt-clip"><img src="${x.img(`clip-${i + 1}.jpg`)}" width="320" height="180" alt=""/><i>${tc}</i></span>`).join('')}</div>
            </div></section>
            <aside class="pt-panel">
              <div class="pt-ph">Settings</div>
              <div class="pt-grp">
                <div class="pt-gh">Audience</div>
                <div class="pt-al">Paid-only access, all 3 tiers</div>
                ${TIERS.map((n) => `<div class="pt-tier">${esc(n)}</div>`).join('')}
              </div>
            </aside>
          </div>
          <div class="pt-toast">${lc('circle-check')}<span><b>${esc(TOAST)}</b><small>${esc(TOAST_SUB)}</small></span></div>
        </div>
      </div>
    </div></div>`);
    x.root.appendChild(dim);
    x.root.appendChild(layer);
    const win = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const blocks = BLOCKS.map((b) => layer.querySelector(`[data-b="${b}"]`));
    const draft = $('.pt-draft'), prev = $('.pt-prev'), pub = $('.pt-pub'), pubDone = $('.pt-done'), toast = $('.pt-toast');
    // Patreon's surfaces are set in Inter (the open substitute, patreon.css): ask for every weight up front so a seek
    // never measures in the fallback face
    if (document.fonts && document.fonts.load) ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 14px "Inter PT"`));

    // 4:5 only (policy guard 2): the chat composer row (+, SUPER, the platform chip, mic, send) leaves once the
    // "Connecting to Patreon" pill lands. It fades out with the pill's spinner, then, while the camera is parked on the
    // pill (the camera follows the pill's live box, so nothing on screen jumps), its space folds away and the
    // bottom-anchored thread settles lower, giving the authorize sheet and the checklist the freed room. 16:9 untouched.
    const comp = x.hub.querySelector('.composer');
    let tall = false, compSpace = 0, compMb = 0;
    const COMP_FADE = 0.25;

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null;
    let DW = 1400, DH = 760, R = { x: 0, y: 0, w: 1920, h: 1080 };

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tall = W < H;
      if (comp) {
        // the composer's own footprint, measured from the stylesheet (not from a frame this beat already folded)
        comp.style.marginBottom = '';
        comp.style.opacity = '';
        const cs = getComputedStyle(comp);
        compMb = parseFloat(cs.marginBottom) || 0;
        compSpace = comp.offsetHeight + (parseFloat(cs.marginTop) || 0) + compMb;
      }
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      const m = tall ? MARGIN.tall : MARGIN.wide;
      R = { x: m.x, y: m.y, w: W - 2 * m.x, h: H - 2 * m.y };
      DW = Math.round(R.w / s); DH = Math.round(R.h / s);
      win.style.width = `${DW}px`; win.style.height = `${DH}px`;
      win.classList.toggle('pt-narrow', tall);
      shot.style.aspectRatio = `${R.w} / ${R.h}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('gc-tall', tall);
    };

    // the pointer: onto Allow in the chat, a press, then away; later the creator's pointer onto Publish in the framed
    // editor, a press, then away
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
      const a = T.pub + PTR2_IN, b = T.bold - 0.08;
      if (t >= a && t <= T.bold + 0.5) {
        const g = x.box(pub.parentNode);
        if (!g.w) return null;
        const ex = g.x + g.w * 0.5, ey = g.y + g.h * 0.6;
        const m = inOutCubic(seg(t, a, Math.min(b, a + PTR2_MOVE)));
        const leave = outCubic(seg(t, T.bold + 0.25, T.bold + 0.5));
        return { x: lerp(ex - 160, ex, m) - leave * 50, y: lerp(ey + 170, ey, m) + leave * 50, p: press(t, T.bold), v: seg(t, a, a + 0.12) * (1 - leave) };
      }
      return null;
    };

    return {
      nodes: [say, consent, card],
      marks: [[T.r, say], [T.card, consent], [T.list, card]],
      pointer: ptr,
      render(t) {
        layout();
        if (tall && comp) {
          const fo = outCubic(seg(t, k.sw, k.sw + COMP_FADE));
          const fold = inOutCubic(seg(t, k.landed + 0.1, k.pull - 0.1));
          comp.style.opacity = (1 - fo).toFixed(3);
          comp.style.visibility = fo >= 1 ? 'hidden' : '';
          comp.style.marginBottom = fold > 0 ? `${(compMb - compSpace * fold).toFixed(2)}px` : '';
        }
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        consent.style.opacity = ci.toFixed(3);
        consent.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Allow: the press, then the buttons give way to a plain "Access allowed" line (no control left standing)
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.05 * pr).toFixed(4)})` : 'none';
        const sw = outCubic(seg(t, T.tap + 0.06, T.tap + SWAP));
        btns.style.opacity = (1 - sw).toFixed(3);
        btns.style.visibility = sw >= 1 ? 'hidden' : '';
        done1.style.opacity = sw.toFixed(3);

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

        // the post lands: its blocks fill in, top to bottom
        blocks.forEach((b, i) => {
          const f = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          b.style.opacity = f.toFixed(3);
          b.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 8).toFixed(2)}px)`;
        });

        // the creator's step: Publish appears as the window lands, is clicked within a second, and is replaced by the
        // plain Published status; the Draft pill and Preview post step aside for it; the toast lands
        const pi = outCubic(seg(t, T.pub, T.pub + PUB_IN));
        const po = 1 - seg(t, T.bold + 0.06, T.bold + 0.06 + OUT);
        pub.style.opacity = (pi * po).toFixed(3);
        pub.style.visibility = po <= 0 || pi <= 0 ? 'hidden' : 'visible';
        const sp = press(t, T.bold);
        pub.style.transform = sp ? `scale(${(1 - 0.05 * sp).toFixed(4)})` : (pi < 1 ? `translateY(${((1 - pi) * 6).toFixed(2)}px)` : 'none');
        const di = outCubic(seg(t, T.bold + 0.1, T.bold + 0.1 + OUT));
        pubDone.style.opacity = di.toFixed(3);
        draft.style.opacity = (1 - di).toFixed(3);
        // Preview post clears out BEFORE Published fades in, so the two never share a frame
        const pv = 1 - seg(t, T.bold, T.bold + 0.1);
        prev.style.opacity = (0.55 * pv).toFixed(3);
        prev.style.visibility = pv <= 0 ? 'hidden' : 'visible';
        const ti = outCubic(seg(t, T.bold, T.bold + TOAST_IN));
        toast.style.opacity = ti.toFixed(3);
        toast.style.transform = `translateX(-50%) translateY(${((1 - ti) * 20).toFixed(2)}px)`;
      },
      // after the camera: lay the layer over the card's window, then open it to the framed rect
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; dim.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, R.x, g), Tp = lerp(b.y, R.y, g), Wd = lerp(b.w, R.w, g), Ht = lerp(b.h, R.h, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = lerp(RADIUS * s, FRAME_RADIUS, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        win.style.transform = `scale(${(Wd / DW).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        // the hub behind fades to superbot's dark backdrop as the window opens: the margin reads as superbot's frame and
        // nothing of the chat (cards, composer controls) shows around or under the window on a held frame
        // (fully opaque once open: at 0.96 the chat's text ghosted through the 4:5 margins)
        dim.style.opacity = g.toFixed(3);
      },
    };
  },
};
