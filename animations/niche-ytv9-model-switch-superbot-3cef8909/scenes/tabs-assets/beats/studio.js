// Studio beat (ytv9 cut): superbot posts the replies from the creator's own YouTube Studio and pins the best one, and
// the same finished result OPENS the spot. Forked from the ytv3 variant's policy-guarded Studio beat
// (niche-ytv3-model-switch-superbot-7bd77eac): the base's checklist card lands in the chat ("Connected as Sam Rivera",
// "5 replies posted in your voice", "Hearted the top 5 comments", "Pinned Priya's comment") with a mini window under
// it, and the window opens (GROW) to a FRAMED window, never full bleed: superbot's dark backdrop shows as a margin on
// every side and a superbot title bar (the superbot mark and name, the YouTube mark, "Posted from your YouTube Studio")
// sits on the frame edge. Inside it is YouTube Studio, light theme: the Community page (left menu dimmed, Community
// selected, the page narrowed to the latest video; ytv9: no Published / Held tab row) with the top comments in Studio's row grammar.
// superbot's reply opens under each comment; Priya's comment moves to the top and gains "Pinned
// by Sam Rivera"; the camera pushes in on the pinned thread until Priya's comment, the pinned label and Sam's reply
// fill most of the frame (the CLOSE-UP). In this cut the whole run is a fast glimpse (about 1.15 s from the reply
// start to the close-up) and the close-up is the BOOKEND: the spot opens on it (frame 0 already complete, a slow push
// 1.00 to 1.035, the plain caption line), scales out into the chat, and this beat lands back on the identical frame.
//
// Policy guard (X Ads deceptive content): no Create button, no search pill, no sort control, no relative times
// (no "2 hours ago", no "Just now"), no Reply links, no reply toggles, no dislike or more icons, no snackbar, no
// consent card and no pointer, no menu or filter glyph; every like count (the Studio list and the pinned close-up, the
// open and the bookend) is plain grey text, "2.1K likes", with no thumb glyph and no heart, and the checklist's
// "Hearted" step carries a comment glyph, not a heart. The caption is plain text on superbot's frame, not a pill or a
// button.
//
// There is ONE Studio window, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the framed rect. The window is laid out
// at a design size (the framed rect divided by APP_SCALE) and scaled to the layer, so the mini window and the framed
// window are the same pixels at two sizes. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=3cef8909';
import { TOP, VIDEO } from './watch.js?v=3cef8909';
import { REPLY } from './replies.js?v=3cef8909';

const SAY = 'Posting from your own YouTube Studio, as you.';
const ACCOUNT = 'Sam Rivera';
const FRAME_LABEL = 'Posted from your YouTube Studio';
// the one caption line (the user's own words), on the open and on the bookend
export const CAPTION = 'Top comments answered. Best one pinned.';
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['youtube', '5 replies posted in your voice'],
  ['comment-outline', 'Hearted the top 5 comments'],
  ['keep', 'Pinned Priya\'s comment'],
];
// the list as Studio sorts it before the pin (top comments): Priya's question sits third until superbot pins it
const ORDER = [1, 2, 0, 3, 4];               // indexes into watch.js TOP
const PINNED = 0;                            // TOP[0], Priya
const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content'], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community', true], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];

const APP_SCALE = 1.2;                           // the framed window: its design px to frame px
// the superbot frame: the dark backdrop shows as this margin around the window (frame px); the bottom margin carries
// the caption line
const MARGIN = { x: 64, top: 36, bottom: 132 };
// timing (seconds from the reply start): the glimpse, compressed from the ytv3 beat
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const LIST_AT = 0.05;                            // the line starts, then the checklist card lands
const CARD_IN = 0.2;                             // a card rising into the thread
const CHECK_AT = 0.08;                           // the checklist landing to the first check
const CHECK_STAGGER = 0.04;                      // one check to the next
const POP = 0.1;                                 // a check popping in
const ROWS_AT = 0.05;                            // the checklist landing to the first comment row filling in
const ROW_STAGGER = 0.03;                        // one comment row to the next
const ROW_IN = 0.15;
const GROW = 0.3; /* deliberate */               // the window opens to the framed rect
const REP_AT = 0.1;                              // the window starting to open to the first reply opening
const REP_STAGGER = 0.03;                        // one reply to the next (top to bottom)
const REP_IN = 0.15;                             // a reply's slot opening and its content fading up
const MOVE = 0.3;                                // Priya's comment travelling to the top, its pinned label opening
const WASH = 0.6;                                // the pinned comment's wash fading back to white
const PUSH_AT = 0.2;                             // the pin to the push in on the pinned thread
const PUSH = 0.3; /* deliberate */               // the push in (the Studio page zooms, the close-up resolves over it)
const ZOOM = 2.1;                                // how far the Studio page zooms on the pinned thread under the close-up
const HOLD = 0.2;                                // the close-up holds at full before the scene's fade to the end card
const CAP_IN = 0.15;                             // the caption settling on the bookend, ending at the close-up
// the open (spot seconds): the close-up is on screen complete from frame 0, pushes 1.00 -> 1.035 over the hold, then
// scales out and fades to the chat thread
const OPEN_PUSH = 0.035;
const OUT_SCALE = 0.88;                          // where the scale-out heads as it fades
const RADIUS = 8;                                // the card's window radius
const FRAME_RADIUS = 14;                         // the superbot frame's radius once open

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// a gentle ease in and out for the slow push (no hitch at either end)
const sine = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);

export default {
  // opts.open = [hold end, transition end] in scene seconds: the close-up holds from 0 to open[0] and leaves by open[1]
  times(r, opts = {}) {
    const T = { r };
    T.list = r + LIST_AT;                              // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.rows = ORDER.map((_, i) => T.list + ROWS_AT + i * ROW_STAGGER); // the comment rows fill in (display order)
    T.grow = T.ok[STEPS.length - 1] + POP;             // the window starts opening
    T.full = T.grow + GROW;                            // the framed window is in place
    T.rep = ORDER.map((_, i) => T.grow + REP_AT + i * REP_STAGGER); // superbot's replies open, top to bottom
    T.pin = T.full;                                    // Priya's comment is pinned
    T.push = T.pin + PUSH_AT;                          // the push in on the pinned thread
    T.close = T.push + PUSH;                           // the close-up is set: the bookend frame
    T.end = T.close + HOLD;
    T.open = opts.open || [0, 0];
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { pin: T.pin, closeUp: T.close, open: T.open });

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
            <div class="st-acts"><span class="st-n">${likes} likes</span></div>
            <div class="st-rslot"><div class="st-rep">${av(ACCOUNT, 'var(--yt-me)', 'st-av-s')}
              <div class="st-body"><div class="st-meta"><b class="st-owner">${esc(ACCOUNT)}</b></div>
                <div class="st-text">${esc(REPLY[first])}</div></div></div></div>
          </div>
          <div class="st-vid"><img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/><span>${esc(VIDEO.title)}</span></div>
        </div></div>`;
    };
    const [pName, pText, pLikes, , pC] = TOP[PINNED];
    const dim = x.el('<div class="st-dim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-win">
      <div class="st-sb"><img class="st-sbt" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="st-sbv"></i><img class="st-sby" src="${icon('youtube-icon.svg')}" alt=""/><span>${esc(FRAME_LABEL)}</span></div>
      <div class="st-port"><div class="st-app">
        <header class="st-top">
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
            <div class="st-filter"><span class="st-chip">Video: ${esc(VIDEO.title)}</span></div>
            <div class="st-list">${ORDER.map(block).join('')}</div>
          </section>
        </div>
      </div></div>
      <div class="st-cu"><div class="st-cu-in">
        <div class="st-cu-pin">${ms('keep', 'st-cu-pi')}<span>Pinned by ${esc(ACCOUNT)}</span></div>
        <div class="st-cu-cm">${av(pName, pC, 'st-cu-av')}
          <div class="st-cu-body">
            <div class="st-cu-name">${esc(pName)}</div>
            <div class="st-cu-text st-cu-ctext">${esc(pText)}</div>
            <div class="st-cu-acts"><span class="st-n">${pLikes} likes</span></div>
            <div class="st-cu-rep">${av(ACCOUNT, 'var(--yt-me)', 'st-cu-avs')}
              <div class="st-cu-body"><div class="st-cu-name"><b class="st-owner">${esc(ACCOUNT)}</b></div>
                <div class="st-cu-text st-cu-rtext">${esc(REPLY[pName.split(' ')[0]])}</div></div></div>
          </div>
        </div>
      </div></div>
    </div></div>`);
    const cap = x.el(`<div class="st-cap" aria-hidden="true">${esc(CAPTION)}</div>`);
    x.root.appendChild(dim);
    x.root.appendChild(layer);
    x.root.appendChild(cap);
    const win = layer.firstElementChild;
    const app = win.querySelector('.st-app');
    const sb = win.querySelector('.st-sb');
    const cu = win.querySelector('.st-cu'), cuIn = cu.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    // display order: blocks[i] is the comment ORDER[i]
    const blocks = [...layer.querySelectorAll('.st-blk')].map((n) => ({
      n, i: +n.dataset.i,
      rslot: n.querySelector('.st-rslot'), rep: n.querySelector('.st-rep'),
      wash: n.querySelector('.st-wash'),
      rH: '',
    }));
    const pinIdx = blocks.findIndex((b) => b.i === PINNED);
    const pinB = blocks[pinIdx];
    const pslot = $('.st-pslot'), pinned = $('.st-pinned');
    // Studio's type is Roboto, the caption's Google Sans Flex (vendored, studio.css): ask for every face up front so a
    // seek never measures a slot in the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      document.fonts.load('500 40px "GSF"');
    }

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, pH = '';
    let DW = 1493, AH = 793, R = { x: 64, y: 36, w: 1792, h: 912 }, capY = 1014;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      R = { x: MARGIN.x, y: MARGIN.top, w: W - 2 * MARGIN.x, h: H - MARGIN.top - MARGIN.bottom };
      DW = Math.round(R.w / APP_SCALE);
      const DH = Math.round(R.h / APP_SCALE);
      AH = DH - sb.offsetHeight;
      app.style.width = `${DW}px`; app.style.height = `${AH}px`;
      shot.style.aspectRatio = `${R.w} / ${R.h}`;
      // the caption sits centred in the bottom margin
      capY = R.y + R.h + MARGIN.bottom / 2;
      cap.style.left = `${(W / 2).toFixed(2)}px`;
      pH = ''; blocks.forEach((b) => { b.rH = ''; });
    };
    // the time the Studio window shows: during the open it already stands at the close-up (the bookend)
    const winT = (t) => (t < T.open[1] ? T.close : t);

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

        // inside the window (the open shows it at the close-up)
        const w = winT(t);
        blocks.forEach((b, i) => {
          const f = outCubic(seg(w, T.rows[i], T.rows[i] + ROW_IN));
          b.n.style.opacity = f.toFixed(3);
          const g = outCubic(seg(w, T.rep[i], T.rep[i] + REP_IN));
          const h = b.rep.offsetHeight;
          const want = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
          if (want !== b.rH) { b.rslot.style.height = want; b.rH = want; }
          const rf = outCubic(seg(w, T.rep[i] + REP_IN * 0.3, T.rep[i] + REP_IN));
          b.rep.style.opacity = rf.toFixed(3);
          b.rep.style.transform = rf >= 1 ? 'none' : `translateY(${((1 - rf) * -6).toFixed(2)}px)`;
        });

        // the pin: Priya's label slot opens and her comment travels to the top while the ones above it step down
        const m = inOutCubic(seg(w, T.pin, T.pin + MOVE));
        const ph = pinned.offsetHeight;
        const pw = m >= 1 ? 'auto' : `${(ph * m).toFixed(2)}px`;
        if (pw !== pH) { pslot.style.height = pw; pH = pw; }
        pinned.style.opacity = outCubic(seg(w, T.pin + MOVE * 0.4, T.pin + MOVE)).toFixed(3);
        const above = blocks.slice(0, pinIdx);
        const upBy = above.reduce((s, b) => s + b.n.offsetHeight, 0);
        const downBy = pinB.n.offsetHeight;
        pinB.n.style.transform = m > 0 ? `translateY(${(-upBy * m).toFixed(2)}px)` : 'none';
        above.forEach((b) => { b.n.style.transform = m > 0 ? `translateY(${(downBy * m).toFixed(2)}px)` : 'none'; });
        pinB.n.classList.toggle('st-moving', m > 0 && m < 1);
        const lift = Math.sin(Math.PI * m);
        pinB.n.style.boxShadow = lift > 0.001 ? `0 ${(6 * lift).toFixed(2)}px ${(16 * lift).toFixed(2)}px rgba(0,0,0,${(0.14 * lift).toFixed(3)})` : '';
        pinB.wash.style.opacity = (w < T.pin ? 0 : 1 - inOutCubic(seg(w, T.pin + MOVE, T.pin + MOVE + WASH))).toFixed(3);
      },
      // after the camera: lay the window over the card's mini frame, open it to the framed rect, push in on the pinned
      // thread; on the open, hold the close-up, push slowly, then scale out to the chat
      after(t) {
        const opening = t < T.open[1];
        if (!opening && t < T.list) {
          layer.style.opacity = '0'; dim.style.opacity = '0'; cap.style.opacity = '0'; layer.style.transform = 'none';
          return;
        }
        layout();
        const w = winT(t);
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(w, T.grow, T.full));
        const L = lerp(b.x, R.x, g), Tp = lerp(b.y, R.y, g), Wd = lerp(b.w, R.w, g), Ht = lerp(b.h, R.h, g);
        const s0 = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = lerp(RADIUS * s0, FRAME_RADIUS, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        const k = g < 1 ? Wd / DW : APP_SCALE;
        win.style.width = `${(Wd / k).toFixed(2)}px`;
        win.style.height = `${(Ht / k).toFixed(2)}px`;
        win.style.transform = `scale(${k.toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';

        // the push in: the Studio page zooms on the pinned thread while the close-up of it resolves over the page
        const p = outCubic(seg(w, T.push, T.close));
        if (p > 0) {
          const upBy = blocks.slice(0, pinIdx).reduce((sum, o) => sum + o.n.offsetHeight, 0);
          const cx = pinB.n.offsetLeft + Math.min(pinB.n.offsetWidth, 700) / 2;
          const cy = pinB.n.offsetTop - upBy + pinB.n.offsetHeight / 2;
          const z = lerp(1, ZOOM, p);
          app.style.transformOrigin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
          app.style.transform = `translate(${((DW / 2 - cx) * p).toFixed(2)}px, ${((AH / 2 - cy) * p).toFixed(2)}px) scale(${z.toFixed(4)})`;
        } else { app.style.transform = 'none'; }
        // a zoom-through, never two layers of text at once: the zooming page fades to Studio's white first, then the
        // close-up settles in
        const u = seg(w, T.push, T.close);
        app.style.opacity = (1 - seg(u, 0.15, 0.45)).toFixed(3);
        const c = outCubic(seg(u, 0.45, 1));
        cu.style.opacity = c.toFixed(3);
        cuIn.style.transform = c >= 1 ? 'none' : `scale(${lerp(0.9, 1, c).toFixed(4)})`;

        if (opening) {
          // the open: complete on frame 0, a slow push over the hold, then a fast scale-out and fade to the chat
          const push = 1 + OPEN_PUSH * sine(seg(t, 0, T.open[0]));
          const o = seg(t, T.open[0], T.open[1]);
          const sc = lerp(push, OUT_SCALE, outCubic(o));
          // the window and caption leave first, over superbot's dark backdrop, then the backdrop lifts off the thread,
          // so two layers of text never sit on top of each other
          const a = (1 - inOutCubic(seg(o, 0, 0.64))).toFixed(3);
          const ad = (1 - inOutCubic(seg(o, 0.4, 1))).toFixed(3);
          layer.style.transformOrigin = `${(R.w / 2).toFixed(1)}px ${(R.h / 2).toFixed(1)}px`;
          layer.style.transform = `scale(${sc.toFixed(5)})`;
          // the caption rides the same push about the frame's centre
          const cy0 = R.y + R.h / 2;
          cap.style.top = `${(cy0 + (capY - cy0) * sc).toFixed(2)}px`;
          cap.style.transform = `translate(-50%, -50%) scale(${sc.toFixed(5)})`;
          layer.style.opacity = a; cap.style.opacity = a; dim.style.opacity = ad;
        } else {
          layer.style.transform = 'none';
          cap.style.top = `${capY.toFixed(2)}px`;
          cap.style.transform = 'translate(-50%, -50%)';
          layer.style.opacity = card.style.opacity;
          // the hub behind gives way to superbot's dark backdrop as the window opens
          dim.style.opacity = g.toFixed(3);
          // the caption settles on the bookend as the close-up does
          cap.style.opacity = outCubic(seg(t, T.close - CAP_IN, T.close)).toFixed(3);
        }
      },
    };
  },
};
