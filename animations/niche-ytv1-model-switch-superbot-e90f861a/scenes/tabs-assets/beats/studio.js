// Studio beat, the finale: superbot posts the replies from the creator's own YouTube Studio. Its line streams and
// Google's OAuth consent card lands in the chat (the Google "G", "superbot wants access to your Google Account", the
// account chip "Sam Rivera" with no email address, two scope rows with Google's own consent strings for the YouTube
// Data API, Cancel / Continue). The pointer taps Continue within a second of the card settling and the buttons give way
// to a plain "Access allowed" line (no control left standing), and the base's connect-card grammar follows: a checklist
// card ("Connected as Sam Rivera", "5 replies posted in your voice", "Hearted the top 5 comments", "Pinned Priya's
// comment") ticking in turn, with a mini window under it; the card holds (CARD_HOLD) and the window opens (GROW) to a
// FRAMED window, never full bleed: a superbot title bar (the superbot mark and name, the YouTube mark and "Posted from
// your YouTube Studio") around Studio's comments, with superbot's dark backdrop as a margin on every side.
// Inside: YouTube Studio, light theme, the Community page (top bar with the menu glyph, the Studio logo and the "S"
// avatar only; 16:9 keeps a slim, dimmed icon rail with Community selected; the title, the Published / Held tabs and
// the page narrowed to the latest video as plain text), the top comments in Studio's row grammar reduced to state: no
// times, no Reply, no reply toggle, no dislike, no menu; just the grey like count and the hearted badge. The rows fill
// in while the window is small; once it is open superbot's reply opens under each comment one by one (Sam Rivera in
// YouTube's owner pill) and each comment's heart fills. The ONE bold moment (the chime): Priya's comment moves to the
// top of the list and gains "Pinned by Sam Rivera", and the dark snackbar says "Comment pinned" (text only). The final
// state holds (READ).
//
// There is ONE Studio window, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the framed rect. The window is laid
// out once at a design size (the framed rect divided by APP_SCALE) and scaled to the layer, so the mini window and the
// framed window are the same pixels at two sizes. On a portrait frame (4:5) it drops the icon rail and the video column,
// and the chat's composer row leaves while the camera is parked on the "Connecting to YouTube Studio" pill.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ms } from './yt-icons.js?v=e90f861a';
import { TOP, VIDEO } from './comments.js?v=e90f861a';
import { REPLIES } from './replies.js?v=e90f861a';

const SAY = 'Posting from your own YouTube Studio, as you.';
const ACCOUNT = 'Sam Rivera';
// Google's consent strings for the two YouTube Data API scopes, verbatim from
// https://developers.google.com/identity/protocols/oauth2/scopes (fetched 2026-10-03): youtube.force-ssl, youtube
const SCOPES = [
  'See, edit, and permanently delete your YouTube videos, ratings, comments and captions',
  'Manage your YouTube account',
];
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['youtube', '5 replies posted in your voice'],
  ['favorite', 'Hearted the top 5 comments'],
  ['keep', 'Pinned Priya\'s comment'],
];
// superbot's reply to each commenter, from replies.md (replies.js), by first name
const REPLY = Object.fromEntries(REPLIES.split('\n\n').map((b) => {
  const s = b.replace(/\n/g, ' ');
  const i = s.indexOf(': ');
  return [s.slice(0, i), s.slice(i + 2)];
}));
// the list as Studio sorts it before the pin (top comments): Priya's question sits third until superbot pins it
const ORDER = [1, 2, 0, 3, 4];               // indexes into watch.js TOP
const PINNED = 0;                            // TOP[0], Priya
const SHOWN = 3;                             // the page shows the first three, whole (Dee and Tom would be cut at the list's edge)
// the slim icon rail (16:9 only): Studio's collapsed left menu, dimmed, Community selected
const NAV = [
  ['dashboard-outline'], ['video-library-outline'], ['analytics-outline'], ['comment-outline', true],
  ['subtitles-outline'], ['copyright-outline'], ['attach-money'], ['auto-fix'], ['library-music-outline'],
];
const SNACK = 'Comment pinned';
const FRAME_LABEL = 'Posted from your YouTube Studio';

const APP_SCALE = { wide: 1.25, tall: 1.45 };        // the framed window: its design px to frame px
// the superbot frame: superbot's backdrop shows as this margin around the window, in frame px (policy guard)
const MARGIN = { wide: { x: 64, y: 44 }, tall: { x: 22, y: 38 } };
const FRAME_RADIUS = 14;                         // the window's radius once open
const SWAP = 0.22;                               // the tap to the consent buttons giving way to "Access allowed"
const COMP_FADE = 0.25;                          // 4:5: the composer row fading out as the Studio pill lands
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const CARD_AT = 0.25;                            // the line streams, then the consent card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const TAP_AT = 0.75; /* deliberate */            // the consent card landed to the tap on Continue (it reads first)
const PTR_IN = 0.3;                              // the consent card landed to the pointer appearing
const PTR_MOVE = 0.38;                           // the pointer's travel onto Continue, ending just before the tap
const LIST_AT = 0.25;                            // the tap to the checklist card landing
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const ROWS_AT = 0.15;                            // the checklist landing to the first comment row filling in
const ROW_STAGGER = 0.06;                        // one comment row to the next
const ROW_IN = 0.24;
const CARD_HOLD = 0.2; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the window opens to the framed rect
const REP_AT = 0.15;                             // the window open to the first reply opening
const REP_STAGGER = 0.16;                        // one reply to the next (top to bottom)
const REP_IN = 0.3;                              // a reply's slot opening and its content fading up
const HEART_AT = 0.1;                            // a reply opening to its comment's heart filling
const HEART_IN = 0.2;
const PIN_AT = 0.25; /* deliberate */            // the last reply settled to the pin (the chime)
const MOVE = 0.55;                               // Priya's comment travelling to the top, its pinned label opening
const SNACK_AT = 0.2;                            // the pin to the snackbar rising
const SNACK_IN = 0.3;
const WASH = 1.2;                                // the pinned comment's wash fading back to white
const READ = 1.3; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 8;                                // the card's window radius, eased to FRAME_RADIUS once open

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                              // the consent card lands
    T.tap = T.card + TAP_AT;                           // Continue is tapped
    T.list = T.tap + LIST_AT;                          // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.rows = ORDER.map((_, i) => T.list + ROWS_AT + i * ROW_STAGGER); // the comment rows fill in (display order)
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // full frame
    T.rep = ORDER.map((_, i) => T.full + REP_AT + i * REP_STAGGER); // superbot's replies open, top to bottom
    T.pin = T.rep[SHOWN - 1] + REP_IN + PIN_AT;        // Priya's comment is pinned (the chime)
    T.snack = T.pin + SNACK_AT;                        // the snackbar rises
    T.settle = Math.max(T.pin + MOVE, T.snack + SNACK_IN);
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.pin });

    // ---- the consent card in the chat ----
    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const consent = x.el(`<div class="gc-card">
      <div class="gc-top"><img src="${icon('google-g.svg')}" alt=""/><span>Sign in with Google</span></div>
      <div class="gc-body">
        <div class="gc-title">superbot wants access to your Google Account</div>
        <span class="gc-acct"><i class="gc-av">S</i>${esc(ACCOUNT)}${ms('keyboard-arrow-down', 'gc-dd')}</span>
        <div class="gc-sel">Select what <b>superbot</b> can access</div>
        ${SCOPES.map((txt) => `<div class="gc-row"><img src="${icon('youtube-icon.svg')}" alt=""/><span>${esc(txt)}</span><i class="gc-cb">${ms('check')}</i></div>`).join('')}
        <div class="gc-act"><div class="gc-btns"><span class="gc-cancel">Cancel</span><span class="gc-go">Continue</span></div><div class="gc-done">${CHECK}<span>Access allowed</span></div></div>
      </div>
    </div>`);
    const go = consent.querySelector('.gc-go'), btns = consent.querySelector('.gc-btns'), done1 = consent.querySelector('.gc-done');

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av">S</span>'
      : kind === 'youtube' ? `<span class="gk-ic gk-img"><img src="${icon('youtube-icon.svg')}" alt=""/></span>`
        : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the framed YouTube Studio window ----
    const av = (name, c, cls = '') => `<span class="st-av ${cls}" style="--c: ${c}">${esc(name[0])}</span>`;
    const block = (ti) => {
      const [name, text, likes, , c] = TOP[ti];
      const first = name.split(' ')[0];
      return `<div class="st-blk" data-i="${ti}"><i class="st-wash"></i>
        <div class="st-cm">${av(name, c)}
          <div class="st-body">
            ${ti === PINNED ? `<div class="st-pslot"><div class="st-pinned">${ms('keep', 'st-pi')}<span>Pinned by ${esc(ACCOUNT)}</span></div></div>` : ''}
            <div class="st-meta"><b>${esc(name)}</b></div>
            <div class="st-text">${esc(text)}</div>
            <div class="st-acts"><span class="st-lk">${ms('thumb-up-outline')}<span class="st-n">${likes}</span></span>
              <span class="st-hrt">${ms('favorite-outline', 'st-hf0')}${ms('favorite', 'st-hf1')}<i class="st-hav">S</i></span></div>
            <div class="st-rslot"><div class="st-rep">${av(ACCOUNT, 'var(--yt-me)', 'st-av-s')}
              <div class="st-body"><div class="st-meta"><b class="st-owner">${esc(ACCOUNT)}</b></div>
                <div class="st-text">${esc(REPLY[first])}</div></div></div></div>
          </div>
          <div class="st-vid"><img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/><span>${esc(VIDEO.title)}</span></div>
        </div></div>`;
    };
    const dim = x.el('<div class="st-dim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-win">
      <div class="st-sb">${x.tile('superbot', 'st-sbt')}<b>superbot</b><i class="st-sbv"></i><img class="st-sbp" src="${icon('youtube-icon.svg')}" alt=""/><span class="st-sbu">${esc(FRAME_LABEL)}</span><span class="st-sbr">Signed in as ${esc(ACCOUNT)}</span></div>
      <div class="st-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
        <span class="st-me">S</span>
      </header>
      <div class="st-main">
        <nav class="st-nav">
          <span class="st-mini">S</span>
          ${NAV.map(([ic, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}</div>`).join('')}
        </nav>
        <section class="st-page">
          <h1 class="st-h1">Community</h1>
          <div class="st-tabs"><span class="st-tab st-tab-on">Published</span><span class="st-tab">Held</span></div>
          <div class="st-filter">${ms('filter-list')}<span class="st-chip">Video: ${esc(VIDEO.title)}</span></div>
          <div class="st-list">${ORDER.map(block).join('')}</div>
        </section>
      </div>
      <div class="st-snack">${esc(SNACK)}</div>
      </div>
    </div></div>`);
    x.root.appendChild(dim);
    x.root.appendChild(layer);
    const win = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    // display order: blocks[i] is the comment ORDER[i]
    const blocks = [...layer.querySelectorAll('.st-blk')].map((n) => ({
      n, i: +n.dataset.i,
      rslot: n.querySelector('.st-rslot'), rep: n.querySelector('.st-rep'),
      h1: n.querySelector('.st-hf1'), hav: n.querySelector('.st-hav'), hrt: n.querySelector('.st-hrt'), wash: n.querySelector('.st-wash'),
      rH: '',
    }));
    const pinIdx = blocks.findIndex((b) => b.i === PINNED);
    const pinB = blocks[pinIdx];
    const pslot = $('.st-pslot'), pinned = $('.st-pinned');
    const snack = $('.st-snack');
    // Studio's type is Roboto (vendored, studio.css); the consent card's is Google Sans Flex: ask for every face up front
    // so a seek never measures a slot in the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 16px "GSF"`));
    }

    // 4:5 only (policy guard): the chat composer row (+, SUPER, the platform chip, mic, send) leaves once the
    // "Connecting to YouTube Studio" pill lands. It fades out with the pill's spinner, then, while the camera is parked on
    // the pill (the camera follows the pill's live box, so nothing on screen jumps), its space folds away and the
    // bottom-anchored thread settles lower, giving the consent card and the checklist the freed room. 16:9 untouched.
    const comp = x.hub.querySelector('.composer');
    let tall = false, compSpace = 0, compMb = 0;

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, pH = '';
    let DW = 1493, DH = 827, R = { x: 0, y: 0, w: 1920, h: 1080 };

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
      win.classList.toggle('st-narrow', tall);
      shot.style.aspectRatio = `${R.w} / ${R.h}`;
      card.classList.toggle('gk-tall', tall);
      consent.classList.toggle('gc-tall', tall);
      pH = ''; blocks.forEach((b) => { b.rH = ''; });
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
        // Continue: the press, then the buttons give way to a plain "Access allowed" line (no control left standing)
        const pr = press(t, T.tap);
        go.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        go.classList.toggle('gc-hit', t >= T.tap);
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

        // the comment rows fill in, then superbot's replies open under them one by one and each heart fills
        blocks.forEach((b, i) => {
          const f = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          b.n.style.opacity = f.toFixed(3);
          const g = outCubic(seg(t, T.rep[i], T.rep[i] + REP_IN));
          const h = b.rep.offsetHeight;
          const want = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
          if (want !== b.rH) { b.rslot.style.height = want; b.rH = want; }
          const rf = outCubic(seg(t, T.rep[i] + REP_IN * 0.3, T.rep[i] + REP_IN));
          b.rep.style.opacity = rf.toFixed(3);
          b.rep.style.transform = rf >= 1 ? 'none' : `translateY(${((1 - rf) * -6).toFixed(2)}px)`;
          const hp = outCubic(seg(t, T.rep[i] + HEART_AT, T.rep[i] + HEART_AT + HEART_IN));
          b.h1.style.opacity = hp.toFixed(3);
          b.hav.style.opacity = hp.toFixed(3);
          const pop = Math.sin(Math.PI * seg(t, T.rep[i] + HEART_AT, T.rep[i] + HEART_AT + HEART_IN));
          b.hrt.style.transform = pop > 0 ? `scale(${(1 + 0.18 * pop).toFixed(4)})` : 'none';
        });

        // the pin: Priya's label slot opens and her comment travels to the top while the ones above it step down
        const m = inOutCubic(seg(t, T.pin, T.pin + MOVE));
        const ph = pinned.offsetHeight;
        const pw = m >= 1 ? 'auto' : `${(ph * m).toFixed(2)}px`;
        if (pw !== pH) { pslot.style.height = pw; pH = pw; }
        pinned.style.opacity = outCubic(seg(t, T.pin + MOVE * 0.4, T.pin + MOVE)).toFixed(3);
        const above = blocks.slice(0, pinIdx);
        const upBy = above.reduce((s, b) => s + b.n.offsetHeight, 0);
        const downBy = pinB.n.offsetHeight;
        pinB.n.style.transform = m > 0 ? `translateY(${(-upBy * m).toFixed(2)}px)` : 'none';
        above.forEach((b) => { b.n.style.transform = m > 0 ? `translateY(${(downBy * m).toFixed(2)}px)` : 'none'; });
        pinB.n.classList.toggle('st-moving', m > 0 && m < 1);
        // while it travels it is lifted (Material elevation), so the swap reads as one card passing over the others
        const lift = Math.sin(Math.PI * m);
        pinB.n.style.boxShadow = lift > 0.001 ? `0 ${(6 * lift).toFixed(2)}px ${(16 * lift).toFixed(2)}px rgba(0,0,0,${(0.14 * lift).toFixed(3)})` : '';
        pinB.wash.style.opacity = (t < T.pin ? 0 : 1 - inOutCubic(seg(t, T.pin + MOVE, T.pin + MOVE + WASH))).toFixed(3);

        const sn = outCubic(seg(t, T.snack, T.snack + SNACK_IN));
        snack.style.opacity = sn.toFixed(3);
        snack.style.transform = sn >= 1 ? 'none' : `translateY(${((1 - sn) * 24).toFixed(2)}px)`;
      },
      // after the camera: pin the layer over the card's window, then open it to the framed rect
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
        dim.style.opacity = g.toFixed(3);
      },
    };
  },
};
