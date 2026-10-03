// Studio beat, the AFTER (ytv10, forked from niche-ytv3-model-switch-superbot-7bd77eac's policy-guarded finale):
// superbot posts the replies from the creator's own YouTube Studio. Its line streams and the base's checklist card
// lands in the chat ("Connected as Sam Rivera", "5 replies posted in your voice", "Hearted the top 5 comments",
// "Pinned Priya's comment"), the checks landing 0.35 s apart, with a mini window under it; the card holds (>= 1.0 s
// after the last check) and the window opens (GROW) to the SAME superbot-framed Studio page as the BEFORE
// (studio-page.js), title bar label "After, posted from your YouTube Studio", header state "1,284 comments, top 5
// answered". As it opens superbot's reply opens under each top comment (Sam Rivera in YouTube's owner pill, the reply in
// full); each comment's filled heart (state, never the outline heart button) has landed with the "Hearted" check. The answered page holds, then the ONE bold moment (the chime, window.__AD_MARKS.chime):
// Priya's comment moves to the top and gains "Pinned by Sam Rivera", and the dark snackbar says "Comment pinned" (text
// only), leaving 1.4 s later. The CALM READ: the camera pushes gently into the page and drifts down the answered list
// (Priya pinned and Marco, then Lena, then Dee and Tom), each pair readable in turn. The ENDING ON THE ANSWERED
// COMMENTS: the page eases back up to the pinned top while the window eases left and shrinks a little (pinned Priya,
// Marco and Lena with their replies still readable) and superbot's lock-up (the mascot, the wordmark and a plain-text
// line) lands beside it. The scene's fade and the loop's dip to black follow.
//
// Policy guard (X Ads deceptive content): no consent card, no Create button, no search pill, no sort control, no
// relative times, no Reply links, no reply toggles, no dislike or more icons, the snackbar has no action; the action
// row is state only (the grey like glyph and count, the red filled heart with the creator avatar).
//
// There is ONE Studio window, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the framed rect. The window is laid out
// at a design size (the framed rect divided by SC) and scaled to the layer, so the mini window and the framed window are
// the same pixels at two sizes. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount } from '../../../lib.js';
import { makeMark } from '../../../shell.js';
import { ms } from './yt-icons.js?v=ce37f243';
import { SC, ACCOUNT, windowMarkup, topRow, esc } from './studio-page.js?v=ce37f243';

const SAY = 'Posting from your own YouTube Studio, as you.';
const LABEL = '<b class="st-sbk">After</b>, posted from your YouTube Studio';
const STATE = '1,284 comments, top 5 answered';
const CTA = 'Try it at superbot.gg';
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['youtube', '5 replies posted in your voice'],
  ['favorite', 'Hearted the top 5 comments'],
  ['keep', 'Pinned Priya\'s comment'],
];
// the list as Studio sorts it before the pin (top comments): Priya's question sits third until superbot pins it
const ORDER = [1, 2, 0, 3, 4];               // indexes into watch.js TOP
const PINNED = 0;                            // TOP[0], Priya
const SNACK = 'Comment pinned';

// the framed window (frame px): the dark superbot margin around it
const R = { x: 64, y: 40, w: 1792, h: 1000 };
// the calm read: how far the camera pushes into the page (design px to frame px becomes SC x READ_Z)
const READ_Z = 1.25;
// the ending: the window's scale beside the lock-up (a share of SC), its left edge, the white kept right of the reply
// column and under Lena's reply (design px), and the lock-up's mascot size
const BRAND_SCALE = 0.93;
const BRAND_X = 48;
const COL_PAD = 30, FOOT_PAD = 6;
const MARK = 160;
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const LIST_AT = 0.25;                            // the line streams, then the checklist card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.35; /* deliberate */     // one check to the next (calm)
const POP = 0.16;                                // a check popping in
const ROWS_AT = 0.15;                            // the checklist landing to the first comment row filling in
const ROW_STAGGER = 0.08;                        // one comment row to the next
const ROW_IN = 0.24;
const CARD_HOLD = 1.0; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.75; /* deliberate */              // the window opens to the framed rect (calm)
const REP_AT = 0.15;                             // the window starts opening to the first reply opening
const REP_STAGGER = 0.14;                        // one reply to the next (top to bottom)
const REP_IN = 0.3;                              // a reply's slot opening and its content fading up
const HEART_STAGGER = 0.05;                      // the "Hearted the top 5 comments" check to each heart filling, top to bottom
const HEART_IN = 0.2;
const PIN_AT = 1.0; /* deliberate */             // the last reply settled, the answered page holds, then the pin (the chime)
const MOVE = 0.7;                                // Priya's comment travelling to the top, its pinned label opening
const SNACK_AT = 0.25;                           // the pin to the snackbar rising
const SNACK_IN = 0.3;
const SNACK_OUT_AT = 1.4; /* deliberate */       // the pin to the snackbar leaving
const SNACK_OUT = 0.3;
const WASH = 1.2;                                // the pinned comment's wash fading back to white
const READ_AT = 1.25; /* deliberate */           // the pin to the calm read's push into the page
const READ_IN = 0.7;                             // the push in onto Priya pinned and Marco, inOutSine
const READ_HOLD = 0.5;                           // ...holds
const DRIFT = 1.8; /* deliberate */              // the slow drift down to Dee and Tom (Lena passes the centre), inOutSine
const DRIFT_HOLD = 0.5;                          // ...holds on Dee and Tom
const BRAND = 1.0; /* deliberate */              // back up to the pinned top, the window eases aside, the lock-up lands
const BRAND_HOLD = 2.25; /* deliberate */        // the final composition holds (>= 2.0 s after the line lands) before the fade
const RADIUS = 8;                                // the card's window radius
const FRAME_RADIUS = 14;                         // the superbot frame's radius once open

const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const inOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

export default {
  times(r) {
    const T = { r };
    T.list = r + LIST_AT;                              // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.rows = ORDER.map((_, i) => T.list + ROWS_AT + i * ROW_STAGGER); // the comment rows fill in (display order)
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // the framed window is in place
    T.rep = ORDER.map((_, i) => T.grow + REP_AT + i * REP_STAGGER); // superbot's replies open, top to bottom
    T.answered = Math.max(T.full, T.rep[ORDER.length - 1] + REP_IN);
    T.pin = T.answered + PIN_AT;                       // Priya's comment is pinned (the chime)
    T.snack = T.pin + SNACK_AT;                        // the snackbar rises
    T.snackOut = T.pin + SNACK_OUT_AT;                 // ...and leaves
    T.read = T.pin + READ_AT;                          // the calm read: push in
    T.read1 = T.read + READ_IN;                        // ...on Priya pinned and Marco
    T.drift = T.read1 + READ_HOLD;                     // the drift down
    T.drift1 = T.drift + DRIFT;                        // ...on Dee and Tom
    T.brand = T.drift1 + DRIFT_HOLD;                   // back up, the window eases aside, the lock-up lands
    T.branded = T.brand + BRAND;
    T.end = T.branded + BRAND_HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.pin, brand: T.branded });

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

    // ---- the framed YouTube Studio window (the AFTER) ----
    const dim = x.el('<div class="st-dim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="st-full st-after" aria-hidden="true">${windowMarkup({
      sbSrc: x.sbSrc, brand: icon, label: LABEL, state: esc(STATE),
      list: ORDER.map((ti) => topRow(ti, 'after', x.img, ti === PINNED)).join(''), snack: SNACK,
    })}</div>`);
    const brand = x.el(`<div class="st-brand" aria-hidden="true"><div class="st-bface"></div><div class="st-bwords"><h1>superbot</h1><p>${esc(CTA)}</p></div></div>`);
    x.root.appendChild(dim);
    x.root.appendChild(layer);
    x.root.appendChild(brand);
    const win = layer.firstElementChild;
    const app = win.querySelector('.st-app');
    const sb = win.querySelector('.st-sb');
    const list = win.querySelector('.st-list');
    const face = brand.querySelector('.st-bface'), words = brand.querySelector('.st-bwords');
    const mark = makeMark(MARK);
    face.appendChild(mark.el);
    const $ = (s) => layer.querySelector(s);
    // display order: blocks[i] is the comment ORDER[i]
    const blocks = [...layer.querySelectorAll('.st-blk')].map((n) => ({
      n, i: +n.dataset.k.slice(1),
      rslot: n.querySelector('.st-rslot'), rep: n.querySelector('.st-rep'),
      h1: n.querySelector('.st-hf1'), hav: n.querySelector('.st-hav'), hrt: n.querySelector('.st-hrt'), wash: n.querySelector('.st-wash'),
      body: n.querySelector('.st-body'), vid: n.querySelector('.st-vid'),
      rH: '',
    }));
    const pinIdx = blocks.findIndex((b) => b.i === PINNED);
    const pinB = blocks[pinIdx];
    const pslot = $('.st-pslot'), pinned = $('.st-pinned');
    const snack = $('.st-snack');
    // Studio's type is Roboto (vendored, studio.css): ask for every face up front so a seek never measures a slot in the
    // fallback face
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 15px "Roboto GM"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, pH = '';
    let DW = R.w / SC, DH = R.h / SC, AH = DH - 32;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      DW = R.w / SC; DH = R.h / SC;
      AH = DH - sb.offsetHeight;
      app.style.width = `${DW.toFixed(2)}px`; app.style.minHeight = `${AH.toFixed(2)}px`;
      shot.style.aspectRatio = `${R.w} / ${R.h}`;
      pH = ''; blocks.forEach((b) => { b.rH = ''; });
    };
    // the blocks' tops in the app's px as they stand after the pin (Priya first, then the display order without her)
    const pinnedTops = () => {
      const top0 = list.offsetTop;
      const seq = [pinB, ...blocks.filter((b) => b !== pinB)];
      const tops = new Map();
      let y = top0;
      seq.forEach((b) => { tops.set(b, y); y += b.n.offsetHeight; });
      return { tops, bottom: y, seq };
    };
    // the calm read's views, in the app's px: { y: the app row at the port's top, z: the push over the page scale }
    const views = () => {
      const { tops, seq } = pinnedTops();
      const PH = AH / READ_Z;                          // the page height the port shows while pushed in
      const v1 = { y: tops.get(seq[0]) - 10, z: READ_Z };            // Priya pinned + Marco
      const lastB = seq[seq.length - 1];
      const bottom = tops.get(lastB) + lastB.n.offsetHeight + 10;
      const v2 = { y: Math.max(v1.y, Math.min(tops.get(seq[3]) - 10, bottom - PH)), z: READ_Z }; // Dee + Tom
      const v3 = { y: tops.get(seq[0]), z: 1 };                       // back at the pinned top (the ending)
      const lena = seq[2];
      v3.h = tops.get(lena) + lena.n.offsetHeight + FOOT_PAD - v3.y;  // the page height the ending shows
      return { v1, v2, v3 };
    };
    // the window's rect beside the lock-up (frame px): the reply column plus its padding, at the smaller scale,
    // vertically centred
    const beside = (v3) => {
      const s2 = SC * BRAND_SCALE;
      const colR = pinB.body.getBoundingClientRect(), appR = app.getBoundingClientRect();
      const kNow = appR.width / app.offsetWidth || 1;
      const right = (colR.right - appR.left) / kNow + COL_PAD; // the reply column's right edge in app px
      const w = right * s2;
      const h = (sb.offsetHeight + v3.h) * s2;
      const H = x.root.offsetHeight;
      return { x: BRAND_X, y: Math.max(24, (H - h) / 2), w, h, s: s2 };
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

        // the comment rows fill in, each filled heart lands with the "Hearted" check, then the replies open one by one
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
          // the hearts fill in the mini window as the "Hearted the top 5 comments" check lands (no heart before that)
          const h0 = T.ok[2] + i * HEART_STAGGER;
          const hp = outCubic(seg(t, h0, h0 + HEART_IN));
          b.h1.style.opacity = hp.toFixed(3);
          b.hav.style.opacity = hp.toFixed(3);
          const pop = Math.sin(Math.PI * seg(t, h0, h0 + HEART_IN));
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
      // after the camera: lay the window over the card's mini frame, open it to the framed rect, the calm read, then
      // ease it aside for the lock-up
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; dim.style.opacity = '0'; brand.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(t, T.grow, T.full));
        // the calm read and the ending's page view (app px at the port's top, push over the page scale)
        const V = t >= T.read ? views() : null;
        let vy = 0, vz = 1;
        if (V) {
          const a = inOutSine(seg(t, T.read, T.read1));
          const d = inOutSine(seg(t, T.drift, T.drift1));
          const e2 = inOutSine(seg(t, T.brand, T.branded));
          const y1 = lerp(lerp(0, V.v1.y, a), V.v2.y, d), z1 = lerp(1, V.v1.z, a);
          vy = lerp(y1, V.v3.y, e2); vz = lerp(z1, V.v3.z, e2);
        }
        // the ending: e = 0 framed, 1 beside the lock-up
        const e = inOutSine(seg(t, T.brand, T.branded));
        const B = e > 0 ? beside(V.v3) : null;
        const tx = B ? lerp(R.x, B.x, e) : R.x, ty = B ? lerp(R.y, B.y, e) : R.y;
        const tw = B ? lerp(R.w, B.w, e) : R.w, th = B ? lerp(R.h, B.h, e) : R.h;
        const s = B ? lerp(SC, B.s, e) : SC;
        const L = lerp(b.x, tx, g), Tp = lerp(b.y, ty, g), Wd = lerp(b.w, tw, g), Ht = lerp(b.h, th, g);
        const s0 = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = lerp(RADIUS * s0, FRAME_RADIUS, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        // the window's scale: the mini window and the framed one are the same design px; beside the lock-up the window
        // narrows to the reply column (its design box shrinks, the page keeps its own width and is clipped)
        const kk = g < 1 ? Wd / DW : s;
        win.style.width = `${(Wd / kk).toFixed(2)}px`;
        win.style.height = `${(Ht / kk).toFixed(2)}px`;
        win.style.transform = `scale(${kk.toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        // the hub behind gives way to superbot's dark backdrop as the window opens: the margin reads as superbot's
        // frame and nothing of the chat shows around the window on a held frame
        dim.style.opacity = g.toFixed(3);
        // the ending keeps only the pinned top: the video column and the rows under Lena fade as the window narrows
        const keep = new Set([pinB, blocks[0], blocks[1]].filter(Boolean));
        blocks.forEach((o) => {
          o.vid.style.opacity = e > 0 ? (1 - seg(e, 0, 0.5)).toFixed(3) : '';
          if (!keep.has(o) && t >= T.brand) o.n.style.opacity = (1 - seg(e, 0, 0.5)).toFixed(3);
        });
        // the page inside the port: pushed in (vz) and scrolled (vy), anchored at the page's left edge
        app.style.transformOrigin = '0 0';
        app.style.transform = vy || vz !== 1 ? `scale(${vz.toFixed(5)}) translateY(${(-vy).toFixed(2)}px)` : 'none';

        // the lock-up lands beside the window: the mascot scales up into place, the wordmark and the line follow
        if (B) {
          const W = x.root.offsetWidth, H = x.root.offsetHeight;
          const right = B.x + B.w;
          brand.style.left = `${((right + W) / 2).toFixed(2)}px`;
          brand.style.top = `${(H / 2).toFixed(2)}px`;
        }
        const lt = t - T.brand;
        // each lands only once the narrowing window has cleared its place (no overlap on any frame)
        const fi = seg(lt, 0.6, 1.0);
        brand.style.opacity = t >= T.brand ? '1' : '0';
        face.style.opacity = fi.toFixed(3);
        face.style.transform = `scale(${lerp(0.5, 1, outQuint(fi)).toFixed(4)})`;
        const wi = outCubic(seg(lt, 0.78, 1.2));
        words.style.opacity = wi.toFixed(3);
        words.style.transform = `translateY(${((1 - wi) * 18).toFixed(2)}px)`;
        mark.render(Math.max(0, lt));
      },
    };
  },
};
