// Studio beat, the finale: superbot publishes everything from the creator's own YouTube Studio. Its line streams and the
// base's checklist card lands in the chat ("Connected as Sam Rivera", "5 replies posted in your voice", "Pinned Priya's
// comment", "New thumbnail set on the video", "Community post published"), ticking in turn, with a mini window under
// it; the card holds (CARD_HOLD) and the window opens (GROW) to a FRAMED window, never full bleed: superbot's dark
// backdrop shows as a margin on every side and a superbot title bar (the superbot mark and name, the YouTube mark and a
// label) sits on the frame edge.
//   R1, COMMENTS (label "Posted from your YouTube Studio"): YouTube Studio, light theme, the Community page (left menu
//     dimmed, Community selected, tabs Published / Held, the page narrowed to the latest video, whose row now shows the
//     NEW thumbnail, img/nbp-thumbnail.jpg), the top comments in Studio's row grammar. The rows fill in while the window
//     is small; once it is open superbot's reply opens under each comment one by one (Sam Rivera in YouTube's owner
//     pill) and each comment's heart fills. The ONE bold moment (the chime): Priya's comment moves to the top of the
//     list and gains "Pinned by Sam Rivera", and the dark snackbar says "Comment pinned" (text only).
//   R2, ON THE CHANNEL (label "Published on your channel"): the snackbar leaves and the content cross-slides to the
//     channel as viewers see it (light theme): the video card with the new thumbnail, its title and "Sam Rivera", and
//     the community post (Sam's avatar and name, the post text, the community post image). It holds.
//   ENDING: the window eases aside and shrinks a little (both images stay large) while superbot's lock-up (the mascot,
//     the wordmark and a plain-text line) lands beside it. The scene's fade and the loop's dip to black follow.
//
// Policy guard (X Ads deceptive content): no Create button, no search pill, no sort control, no relative times
// (no "2 hours ago", no "Just now"), no Reply links, no reply toggles, no dislike or more icons, the snackbar has no
// action; the action row is state only (the grey like glyph and count, the red filled heart with the creator avatar).
// The channel view has no views, dates, counts, action rows, tabs or play icons.
//
// There is ONE window, on a layer in the scene root (outside the camera). While the checklist card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it to the framed rect. The window is laid out at a
// design size (the framed rect divided by APP_SCALE) and scaled to the layer, so the mini window and the framed window
// are the same pixels at two sizes. On a portrait frame it drops the left menu and the video column (not rendered for
// this spot, 16:9 only).
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount } from '../../../lib.js';
import { makeMark } from '../../../shell.js';
import { ms } from './yt-icons.js?v=c3159928';
import { TOP, VIDEO } from './watch.js?v=c3159928';
import { REPLY } from './replies.js?v=c3159928';
import { POST, THUMB, COMMUNITY } from './assets.js?v=c3159928';

const SAY = 'Publishing from your own YouTube Studio, as you.';
const ACCOUNT = 'Sam Rivera';
const LABEL_R1 = 'Posted from your YouTube Studio';
const LABEL_R2 = 'Published on your channel';
const CTA = 'Try it at superbot.gg';
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['youtube', '5 replies posted in your voice'],
  ['keep', 'Pinned Priya\'s comment'],
  ['image-outline', 'New thumbnail set on the video'],
  ['article-outline', 'Community post published'],
];
// the list as Studio sorts it before the pin (top comments): Priya's question sits third until superbot pins it
const ORDER = [1, 2, 0, 3, 4];               // indexes into watch.js TOP
const PINNED = 0;                            // TOP[0], Priya
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content'], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community', true], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
const SNACK = 'Comment pinned';

const APP_SCALE = { wide: 1.2, tall: 1.2 };      // the framed window: its design px to frame px
// the superbot frame: the dark backdrop shows as this margin around the window, in frame px
const MARGIN = { wide: { x: 64, y: 40 }, tall: { x: 24, y: 64 } };
// the ending: the channel content's width (design px, studio.css .st-ch-in), its padding inside the window once beside
// the lock-up, the window's scale then (a share of APP_SCALE: 1.2 x 0.7 = 0.84, so the thumbnail stays 662 px wide and
// the post image 460 px tall), and the lock-up's mascot size
const CH_W = 1408;
const CH_TOP = 64;                               // the channel view's top bar
const BRAND_PAD = 28;
const BRAND_SCALE = 0.7;
const MARK = 168;
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const LIST_AT = 0.25;                            // the line streams, then the checklist card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const ROWS_AT = 0.15;                            // the checklist landing to the first comment row filling in
const ROW_STAGGER = 0.06;                        // one comment row to the next
const ROW_IN = 0.24;
const CARD_HOLD = 0.35; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the window opens to the framed rect
const REP_AT = 0.15;                             // the window open to the first reply opening
const REP_STAGGER = 0.16;                        // one reply to the next (top to bottom)
const REP_IN = 0.3;                              // a reply's slot opening and its content fading up
const HEART_AT = 0.1;                            // a reply opening to its comment's heart filling
const HEART_IN = 0.2;
const PIN_AT = 0.45; /* deliberate */            // the last reply settled to the pin (the chime)
const MOVE = 0.55;                               // Priya's comment travelling to the top, its pinned label opening
const SNACK_AT = 0.2;                            // the pin to the snackbar rising
const SNACK_IN = 0.3;
const SNACK_OUT_AT = 0.6; /* deliberate */       // the pin to the snackbar leaving (the brief: ~0.6 s after the chime)
const SNACK_OUT = 0.25;
const WASH = 1.2;                                // the pinned comment's wash fading back to white
const SLIDE_AT = 0.75; /* deliberate */          // the pin to the cross-slide to the channel (the snackbar gone)
const SLIDE = 0.6; /* deliberate */              // Studio slides out left, the channel slides in from the right
const CH_HOLD = 2.6; /* deliberate */            // the channel view holds (the brief: >= 2.2 s)
const BRAND = 0.8; /* deliberate */              // the window eases aside, the lock-up lands beside it
const BRAND_HOLD = 1.9; /* deliberate */         // the last frames: both images and superbot, before the fade
const RADIUS = 8;                                // the card's window radius
const FRAME_RADIUS = 14;                         // the superbot frame's radius once open

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.list = r + LIST_AT;                              // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.rows = ORDER.map((_, i) => T.list + ROWS_AT + i * ROW_STAGGER); // the comment rows fill in (display order)
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // the framed window is in place
    T.rep = ORDER.map((_, i) => T.full + REP_AT + i * REP_STAGGER); // superbot's replies open, top to bottom
    T.pin = T.rep[ORDER.length - 1] + REP_IN + PIN_AT; // Priya's comment is pinned (the chime)
    T.snack = T.pin + SNACK_AT;                        // the snackbar rises
    T.snackOut = T.pin + SNACK_OUT_AT;                 // ...and leaves
    T.slide = T.pin + SLIDE_AT;                        // the cross-slide to the channel
    T.ch = T.slide + SLIDE;                            // the channel view is set
    T.brand = T.ch + CH_HOLD;                          // the window eases aside, the lock-up lands
    T.branded = T.brand + BRAND;
    T.end = T.branded + BRAND_HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.pin, channel: T.ch, brand: T.branded });

    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

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

    // ---- the framed window: YouTube Studio (R1), then the channel (R2) ----
    const av = (name, c, cls = '') => `<span class="st-av ${cls}" style="--c: ${c}">${esc(name[0])}</span>`;
    const heart = `<span class="st-hrt">${ms('favorite-outline', 'st-hf0')}${ms('favorite', 'st-hf1')}<i class="st-hav">S</i></span>`;
    const block = (ti) => {
      const [name, text, likes, , c] = TOP[ti];
      const first = name.split(' ')[0];
      return `<div class="st-blk" data-i="${ti}"><i class="st-wash"></i>
        <div class="st-cm">${av(name, c)}
          <div class="st-body">
            ${ti === PINNED ? `<div class="st-pslot"><div class="st-pinned">${ms('keep', 'st-pi')}<span>Pinned by ${esc(ACCOUNT)}</span></div></div>` : ''}
            <div class="st-meta"><b>${esc(name)}</b></div>
            <div class="st-text">${esc(text)}</div>
            <div class="st-acts">${ms('thumb-up-outline', 'st-lg')}<span class="st-n">${likes}</span>${heart}</div>
            <div class="st-rslot"><div class="st-rep">${av(ACCOUNT, 'var(--yt-me)', 'st-av-s')}
              <div class="st-body"><div class="st-meta"><b class="st-owner">${esc(ACCOUNT)}</b></div>
                <div class="st-text">${esc(REPLY[first])}</div></div></div></div>
          </div>
          <div class="st-vid"><img src="${x.img(THUMB)}" width="1920" height="1080" alt=""/><span>${esc(VIDEO.title)}</span></div>
        </div></div>`;
    };
    const dim = x.el('<div class="st-dim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-win">
      <div class="st-sb"><img class="st-sbt" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="st-sbv"></i><img class="st-sby" src="${icon('youtube-icon.svg')}" alt=""/><span class="st-lbs"><span class="st-lb st-lb1">${esc(LABEL_R1)}</span><span class="st-lb st-lb2">${esc(LABEL_R2)}</span></span></div>
      <div class="st-port"><div class="st-app">
        <header class="st-top">
          <span class="st-btn">${ms('menu')}</span>
          <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
          <span class="st-me">S</span>
        </header>
        <div class="st-main">
          <nav class="st-nav">
            <div class="st-chan"><span class="st-big">S</span><b>Your channel</b><small>${esc(ACCOUNT)}</small></div>
            ${NAV.map(([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}
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
      <div class="st-ch">
        <header class="st-top st-ch-top">
          <span class="st-btn">${ms('menu')}</span>
          <span class="st-logo"><img class="st-ytm" src="${icon('youtube-icon.svg')}" alt=""/></span>
          <span class="st-me">S</span>
        </header>
        <div class="st-ch-body"><div class="st-ch-in">
          <div class="st-ch-v">
            <div class="st-ch-th"><img src="${x.img(THUMB)}" width="1920" height="1080" alt=""/></div>
            <div class="st-ch-t">${esc(VIDEO.title)}</div>
            <div class="st-ch-n">${esc(ACCOUNT)}</div>
          </div>
          <div class="st-ch-p">
            <div class="st-ch-ph">${av(ACCOUNT, 'var(--yt-me)', 'st-ch-av')}<b>${esc(ACCOUNT)}</b></div>
            <div class="st-ch-pt">${esc(POST)}</div>
            <div class="st-ch-pi"><img src="${x.img(COMMUNITY)}" width="1440" height="1440" alt=""/></div>
          </div>
        </div></div>
      </div></div>
    </div></div>`);
    const brand = x.el(`<div class="st-brand" aria-hidden="true"><div class="st-bface"></div><div class="st-bwords"><h1>superbot</h1><p>${esc(CTA)}</p></div></div>`);
    x.root.appendChild(dim);
    x.root.appendChild(layer);
    x.root.appendChild(brand);
    const win = layer.firstElementChild;
    const app = win.querySelector('.st-app');
    const ch = win.querySelector('.st-ch'), chIn = ch.querySelector('.st-ch-in');
    const sb = win.querySelector('.st-sb');
    const lb1 = sb.querySelector('.st-lb1'), lb2 = sb.querySelector('.st-lb2');
    const face = brand.querySelector('.st-bface'), words = brand.querySelector('.st-bwords');
    const mark = makeMark(MARK);
    face.appendChild(mark.el);
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
    // Studio's type is Roboto (vendored, studio.css): ask for every face up front so a seek never measures a slot in the
    // fallback face
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, pH = '';
    let DW = 1493, DH = 833, AH = 793, R = { x: 64, y: 40, w: 1792, h: 1000 }, sc = 1.2, tall = false;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tall = W < H;
      sc = tall ? APP_SCALE.tall : APP_SCALE.wide;
      const m = tall ? MARGIN.tall : MARGIN.wide;
      R = { x: m.x, y: m.y, w: W - 2 * m.x, h: H - 2 * m.y };
      DW = Math.round(R.w / sc); DH = Math.round(R.h / sc);
      AH = DH - sb.offsetHeight;
      app.style.width = `${DW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('st-narrow', tall);
      shot.style.aspectRatio = `${R.w} / ${R.h}`;
      card.classList.toggle('gk-tall', tall);
      pH = ''; blocks.forEach((b) => { b.rH = ''; });
    };
    // the window's rect while the lock-up sits beside it (frame px): the channel content plus its padding and its top
    // bar, at the smaller scale, vertically centred, at the frame's left margin
    const beside = () => {
      const s2 = sc * BRAND_SCALE;
      const w = (CH_W + 2 * BRAND_PAD) * s2;
      const h = (sb.offsetHeight + CH_TOP + chIn.offsetHeight + 2 * BRAND_PAD) * s2;
      const H = x.root.offsetHeight;
      return { x: R.x, y: Math.max(R.y, (H - h) / 2), w, h, s: s2 };
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.list, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

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

        const sn = outCubic(seg(t, T.snack, T.snack + SNACK_IN)) * (1 - outCubic(seg(t, T.snackOut, T.snackOut + SNACK_OUT)));
        snack.style.opacity = sn.toFixed(3);
        snack.style.transform = sn >= 1 ? 'none' : `translateY(${((1 - sn) * 24).toFixed(2)}px)`;
      },
      // after the camera: lay the window over the card's mini frame, open it to the framed rect, cross-slide to the
      // channel, then ease it aside for the lock-up
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; dim.style.opacity = '0'; brand.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(t, T.grow, T.full));
        // the ending: e = 0 framed, 1 beside the lock-up
        const e = inOutCubic(seg(t, T.brand, T.branded));
        const B = e > 0 ? beside() : null;
        const tx = B ? lerp(R.x, B.x, e) : R.x, ty = B ? lerp(R.y, B.y, e) : R.y;
        const tw = B ? lerp(R.w, B.w, e) : R.w, th = B ? lerp(R.h, B.h, e) : R.h;
        const s = B ? lerp(sc, B.s, e) : sc;
        const L = lerp(b.x, tx, g), Tp = lerp(b.y, ty, g), Wd = lerp(b.w, tw, g), Ht = lerp(b.h, th, g);
        const s0 = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = lerp(RADIUS * s0, FRAME_RADIUS, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        // the window's scale: the mini window and the framed one are the same design px; beside the lock-up the window
        // narrows to the channel content (its design box shrinks; the channel view centres itself in it)
        const k = g < 1 ? Wd / DW : s;
        win.style.width = `${(Wd / k).toFixed(2)}px`;
        win.style.height = `${(Ht / k).toFixed(2)}px`;
        win.style.transform = `scale(${k.toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        // the hub behind gives way to superbot's dark backdrop as the window opens: the margin reads as superbot's
        // frame and nothing of the chat shows around the window on a held frame
        dim.style.opacity = g.toFixed(3);

        // the cross-slide: Studio leaves to the left, the channel arrives from the right; the frame label follows
        const c = inOutCubic(seg(t, T.slide, T.ch));
        const portW = Wd / k;
        app.style.transform = c > 0 ? `translateX(${(-0.35 * portW * c).toFixed(2)}px)` : 'none';
        app.style.opacity = (1 - seg(c, 0, 0.6)).toFixed(3);
        app.style.visibility = c >= 1 ? 'hidden' : '';
        ch.style.transform = c < 1 ? `translateX(${(0.35 * portW * (1 - c)).toFixed(2)}px)` : 'none';
        ch.style.opacity = seg(c, 0.3, 1).toFixed(3);
        ch.style.visibility = c <= 0 ? 'hidden' : 'visible';
        const lc = seg(t, T.slide + SLIDE * 0.25, T.slide + SLIDE * 0.75);
        lb1.style.opacity = (1 - lc).toFixed(3);
        lb2.style.opacity = lc.toFixed(3);

        // the lock-up lands beside the window: the mascot scales up into place, the wordmark and the line follow
        if (B) {
          const W = x.root.offsetWidth, H = x.root.offsetHeight;
          const right = B.x + B.w;
          brand.style.left = `${((right + W) / 2).toFixed(2)}px`;
          brand.style.top = `${(H / 2).toFixed(2)}px`;
        }
        const lt = t - T.brand;
        const fi = seg(lt, 0.2, 0.7);
        brand.style.opacity = t >= T.brand ? '1' : '0';
        face.style.opacity = fi.toFixed(3);
        face.style.transform = `scale(${lerp(0.5, 1, outQuint(fi)).toFixed(4)})`;
        const wi = outCubic(seg(lt, 0.45, 0.95));
        words.style.opacity = wi.toFixed(3);
        words.style.transform = `translateY(${((1 - wi) * 18).toFixed(2)}px)`;
        mark.render(Math.max(0, lt));
      },
    };
  },
};
