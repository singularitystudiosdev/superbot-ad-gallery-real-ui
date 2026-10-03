// Studio beat, the finale: superbot posts the Short from the creator's own YouTube Studio. Its line streams and the
// base's checklist card lands in the chat ("Connected as Sam Rivera", "Cut a vertical Short from your footage",
// "Captions from the 5-line script", "Posted to your Shorts"), ticking in turn, with a mini window under it; the card
// holds (CARD_HOLD) and the window opens (GROW) to a FRAMED window, never full bleed: superbot's dark backdrop shows as
// a margin on every side and a superbot title bar (the superbot mark and name, the YouTube mark, "Posted from your
// YouTube Studio") sits on the frame edge. Inside it is YouTube Studio, light theme: "Channel content" with "Shorts" as
// a plain bold sub-heading and a simple two-column list (Short, Visibility), two older Shorts already there. The ONE
// bold moment (the chime): the new Short's row slides in at the top with a soft highlight (its thumbnail carries the
// Hook caption, the title and description from script.js SHORT, "Public") and the dark snackbar says "Short published"
// (text only). Then the ENDING ON THE POSTED SHORT: the snackbar leaves, the new row's thumbnail grows into the large
// vertical Short inside the superbot frame while the Studio list eases away behind it; the Short plays its sourced
// stills with a gentle Ken Burns push and burned-in captions that read the script (the Hook, then Line 2, the photo
// crossfading between them), its title and "Public, posted to Sam Rivera's Shorts" sit beside it as plain text, and
// superbot's lock-up (the mascot, the wordmark and a plain-text line) lands beside it too. The scene's fade and the
// loop's dip to black follow.
//
// Policy guard (X Ads deceptive content): no Create button, no search pill, no tabs, no filter bar, no checkboxes, no
// sort control, no hover actions, no pagination, no dates or relative times, no view/like counts on the new Short; the
// visibility is state text (an eye glyph and "Public"); the snackbar has no action; the Short carries no player chrome
// (no play triangle, no progress bar, no action rail, no subscribe, no sound toggle). No left menu either: its Content
// icon carries a play triangle.
//
// There is ONE Studio window, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the framed rect. The window is laid out
// at a design size (the framed rect divided by APP_SCALE) and scaled to the layer, so the mini window and the framed
// window are the same pixels at two sizes. The big Short is its own element in the scene root (frame px): it starts
// exactly on the row's thumbnail (the same markup at the same size) and grows to its frame rect.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount } from '../../../lib.js';
import { makeMark } from '../../../shell.js';
import { ms } from './yt-icons.js?v=3e406642';
import { SCRIPT, SHORT } from './script.js?v=3e406642';

const SAY = 'Posting the Short from your own YouTube Studio, as you.';
const ACCOUNT = 'Sam Rivera';
const FRAME_LABEL = 'Posted from your YouTube Studio';
const POSTED = `Public, posted to ${ACCOUNT}'s Shorts`;
const CTA = 'Try it at superbot.gg';
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['content-cut', 'Cut a vertical Short from your footage'],
  ['closed-caption-outline', 'Captions from the 5-line script'],
  ['youtube', 'Posted to your Shorts'],
];
// the two Shorts already on the channel (thumbnails: sourced photos, img/CREDITS.txt)
const OLDER = [
  { title: 'Pop filter or foam? Quick test', desc: 'Same mic, same sentence, two fixes.', img: 'thumb-pop.jpg' },
  { title: 'My desk setup in one take', desc: 'Arm, mic and light, nothing hidden.', img: 'thumb-desk.jpg' },
];
// the posted Short's stills, one per caption it shows (sourced photos, img/CREDITS.txt)
const STILLS = ['short-hook.jpg', 'short-line2.jpg'];
const CAPS = SCRIPT.slice(0, 2);                 // the Hook, then Line 2
const SNACK = 'Short published';

const APP_SCALE = { wide: 1.5, tall: 1.2 };      // the framed window: its design px to frame px
// the superbot frame: the dark backdrop shows as this margin around the window, in frame px
const MARGIN = { wide: { x: 64, y: 40 }, tall: { x: 24, y: 64 } };
// the posted Short at full size (frame px): 9:16, 80% of the frame's height, and its left edge
const SH_W = 486, SH_H = 864, SH_X = 250;
const TH_W = 54;                                 // the row thumbnail's width (design px; 9:16)
const MARK = 168;                                // the lock-up's mascot
const META_GAP = 70;                             // the title block to the lock-up below it (frame px)
// timing (seconds from the reply start, or from the mark named)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const LIST_AT = 0.25;                            // the line streams, then the checklist card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const ROWS_AT = 0.15;                            // the checklist landing to the first Studio row filling in
const ROW_STAGGER = 0.06;                        // one row to the next
const ROW_IN = 0.24;
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the window opens to the framed rect
const NEW_AT = 0.5; /* deliberate */             // the framed Studio list reads, then the new Short lands (the chime)
const MOVE = 0.5;                                // the new row's slot opening, the older rows stepping down
const SLIDE = 0.4;                               // the new row sliding in from the left as its slot opens
const SNACK_AT = 0.12;                           // the chime to the snackbar rising
const SNACK_IN = 0.2;
const SNACK_OUT_AT = 0.6; /* deliberate */       // the chime to the snackbar leaving (the brief: ~0.6 s after the chime)
const SNACK_OUT = 0.25;
const WASH = 1.0;                                // the new row's highlight fading back to white
const PUSH_AT = 0.6; /* deliberate */            // the chime to the thumbnail starting to grow into the Short
const PUSH = 0.8; /* deliberate */               // the thumbnail growing into the big Short, the list easing away
const HOOK_HOLD = 2.0; /* deliberate */          // the Short at full size with the Hook caption
const XFADE = 0.3;                               // the photo and the caption crossfading to Line 2
const L2_HOLD = 2.15; /* deliberate */           // Line 2 on screen, through the lock-up landing, to the scene's end
const META_AT = 0.45;                            // the push starting to the title block landing beside the Short
const META_IN = 0.4;
const BRAND_AT = 0.5;                            // Line 2 landed, then the lock-up lands beside the Short
const BRAND = 0.7; /* deliberate */
const KB = 0.1;                                  // the Ken Burns push on each still (scale gained over its time)
const RADIUS = 8;                                // the card's window radius
const FRAME_RADIUS = 14;                         // the superbot frame's radius once open
const SH_R = 24;                                 // the big Short's corner radius (frame px)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.list = r + LIST_AT;                              // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.rows = OLDER.map((_, i) => T.list + ROWS_AT + i * ROW_STAGGER); // the older Shorts fill in
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // the framed window is in place
    T.post = T.full + NEW_AT;                           // the new Short lands (the chime)
    T.snack = T.post + SNACK_AT;                        // the snackbar rises
    T.snackOut = T.post + SNACK_OUT_AT;                 // ...and leaves
    T.push = T.post + PUSH_AT;                          // the thumbnail grows into the Short
    T.close = T.push + PUSH;                           // the Short is at full size, the Hook caption reading
    T.meta = T.push + META_AT;                         // its title lands beside it
    T.l2 = T.close + HOOK_HOLD;                        // the crossfade to Line 2
    T.l2in = T.l2 + XFADE;
    T.brand = T.l2in + BRAND_AT;                       // the lock-up lands beside the Short
    T.branded = T.brand + BRAND;
    T.end = T.l2in + L2_HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.post, shortFull: T.close, line2: T.l2in, brand: T.branded });

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

    // ---- the Short (the same markup in the row's thumbnail and as the big frame): stills, burned-in captions ----
    const shortHtml = (cls) => `<div class="sh-frame ${cls}">
      ${STILLS.map((f, i) => `<img class="sh-ph" data-i="${i}" src="${x.img(f)}" width="720" height="1280" alt=""/>`).join('')}
      <i class="sh-shade"></i>
      ${CAPS.map((c, i) => `<div class="sh-cap" data-i="${i}">${esc(c.text)}</div>`).join('')}
    </div>`;

    // ---- the framed YouTube Studio window ----
    const vis = `<span class="st-vis">${ms('visibility-outline')}<span>Public</span></span>`;
    const rowHtml = (o, isNew) => `<div class="st-row${isNew ? ' st-new' : ''}"><i class="st-wash"></i>
        <div class="st-c1">${isNew ? `<span class="st-th st-th-new">${shortHtml('sh-mini')}</span>` : `<span class="st-th"><img src="${x.img(o.img)}" width="270" height="480" alt=""/></span>`}
          <div class="st-tt"><div class="st-ttl">${esc(o.title)}</div><div class="st-ds">${esc(o.desc)}</div></div></div>
        <div class="st-c2">${vis}</div>
      </div>`;
    const dim = x.el('<div class="st-dim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-win">
      <div class="st-sb"><img class="st-sbt" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="st-sbv"></i><img class="st-sby" src="${icon('youtube-icon.svg')}" alt=""/><span>${esc(FRAME_LABEL)}</span></div>
      <div class="st-port"><div class="st-app">
        <header class="st-top">
          <span class="st-btn">${ms('menu')}</span>
          <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
          <span class="st-me">S</span>
        </header>
        <section class="st-page">
          <h1 class="st-h1">Channel content</h1>
          <h2 class="st-h2">Shorts</h2>
          <div class="st-cols"><span class="st-c1">Short</span><span class="st-c2">Visibility</span></div>
          <div class="st-list">
            <div class="st-nslot">${rowHtml({ title: SHORT.title, desc: SHORT.desc }, true)}</div>
            ${OLDER.map((o) => rowHtml(o, false)).join('')}
          </div>
        </section>
        <div class="st-snack">${esc(SNACK)}</div>
      </div><i class="st-veil"></i></div>
    </div></div>`);
    const big = x.el(`<div class="sh-big" aria-hidden="true">${shortHtml('sh-full')}</div>`);
    const meta = x.el(`<div class="sh-meta" aria-hidden="true"><div class="sh-mt">${esc(SHORT.title)}</div><div class="sh-mp">${esc(POSTED)}</div></div>`);
    const brand = x.el(`<div class="st-brand" aria-hidden="true"><div class="st-bface"></div><div class="st-bwords"><h1>superbot</h1><p>${esc(CTA)}</p></div></div>`);
    x.root.appendChild(dim);
    x.root.appendChild(layer);
    x.root.appendChild(big);
    x.root.appendChild(meta);
    x.root.appendChild(brand);
    const win = layer.firstElementChild;
    const app = win.querySelector('.st-app');
    const sb = win.querySelector('.st-sb');
    const veil = win.querySelector('.st-veil');
    const face = brand.querySelector('.st-bface'), words = brand.querySelector('.st-bwords');
    const mark = makeMark(MARK);
    face.appendChild(mark.el);
    const $ = (s) => layer.querySelector(s);
    const rows = [...layer.querySelectorAll('.st-row:not(.st-new)')];
    const nslot = $('.st-nslot'), nrow = $('.st-new'), nwash = nrow.querySelector('.st-wash');
    const thumb = $('.st-th-new'), mini = thumb.firstElementChild;
    const snack = $('.st-snack');
    const bigF = big.firstElementChild;
    const parts = (root) => ({ ph: [...root.querySelectorAll('.sh-ph')], cap: [...root.querySelectorAll('.sh-cap')] });
    const P = { mini: parts(mini), big: parts(bigF) };
    // Studio's type is Roboto (vendored, studio.css), the captions Google Sans Flex: ask for every face up front so a
    // seek never measures a slot in the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      ['500', '700', '800'].forEach((w) => document.fonts.load(`${w} 40px "GSF"`));
    }

    const sv = say.firstElementChild, sh = say.lastElementChild;
    let shown = -1, geo = '', feed = null, nH = '';
    let DW = 1195, DH = 667, AH = 627, R = { x: 64, y: 40, w: 1792, h: 1000 }, sc = 1.5, tall = false;

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
      mini.style.transform = `scale(${(TH_W / SH_W).toFixed(5)})`;
      nH = '';
    };
    // the Short's rect at full size (frame px): vertically centred in the frame below its title bar
    const shortRect = () => {
      const W = x.root.offsetWidth;
      const top = R.y + sb.offsetHeight * sc, bottom = R.y + R.h;
      const h = Math.min(SH_H, (bottom - top) - 40);
      const w = h * SH_W / SH_H;
      const xx = tall ? (W - w) / 2 : SH_X;
      return { x: xx, y: top + (bottom - top - h) / 2, w, h };
    };
    // the stills' Ken Burns and the caption crossfade, the same on the thumbnail and on the big frame
    const paintShort = (p, t) => {
      const c = seg(t, T.l2, T.l2in);
      const k0 = 1 + KB * seg(t, T.post, T.l2in);
      const k1 = 1 + KB * 0.8 * seg(t, T.l2, T.end);
      p.ph[0].style.transform = `scale(${k0.toFixed(4)})`;
      p.ph[1].style.transform = `scale(${k1.toFixed(4)})`;
      p.ph[1].style.opacity = c.toFixed(3);
      p.cap[0].style.opacity = (1 - c).toFixed(3);
      p.cap[1].style.opacity = c.toFixed(3);
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.list, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { sv.textContent = SAY.slice(0, n); sh.textContent = SAY.slice(n); shown = n; }

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

        // the older Shorts fill in while the window is small
        rows.forEach((b, i) => { b.style.opacity = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN)).toFixed(3); });

        // the bold moment: the new row's slot opens at the top (the older rows step down) and the row slides in
        const m = inOutCubic(seg(t, T.post, T.post + MOVE));
        const h = nrow.offsetHeight;
        const want = m >= 1 ? 'auto' : `${(h * m).toFixed(2)}px`;
        if (want !== nH) { nslot.style.height = want; nH = want; }
        const sl = outCubic(seg(t, T.post + 0.05, T.post + 0.05 + SLIDE));
        nrow.style.opacity = sl.toFixed(3);
        nrow.style.transform = sl >= 1 ? 'none' : `translateX(${((1 - sl) * -40).toFixed(2)}px)`;
        nwash.style.opacity = (t < T.post ? 0 : 1 - inOutCubic(seg(t, T.post + MOVE, T.post + MOVE + WASH))).toFixed(3);
        paintShort(P.mini, t);

        const sn = outCubic(seg(t, T.snack, T.snack + SNACK_IN)) * (1 - outCubic(seg(t, T.snackOut, T.snackOut + SNACK_OUT)));
        snack.style.opacity = sn.toFixed(3);
        snack.style.transform = sn >= 1 ? 'none' : `translateY(${((1 - sn) * 24).toFixed(2)}px)`;
      },
      // after the camera: lay the window over the card's mini frame, open it to the framed rect, then grow the new
      // row's thumbnail into the posted Short and land the title and the lock-up beside it
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; dim.style.opacity = '0'; big.style.opacity = '0'; meta.style.opacity = '0'; brand.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, R.x, g), Tp = lerp(b.y, R.y, g), Wd = lerp(b.w, R.w, g), Ht = lerp(b.h, R.h, g);
        const s0 = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = lerp(RADIUS * s0, FRAME_RADIUS, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        // the window's scale: the mini window and the framed one are the same design px
        const kk = g < 1 ? Wd / DW : sc;
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

        // the grow: the big Short starts exactly on the row's thumbnail and grows to its frame rect; the Studio list
        // eases away to the right under superbot's dark surface
        const p = inOutCubic(seg(t, T.push, T.close));
        if (t >= T.push) {
          const a = x.box(thumb);
          const F = shortRect();
          const bx = lerp(a.x, F.x, p), by = lerp(a.y, F.y, p), bw = lerp(a.w, F.w, p);
          const s = bw / SH_W;
          big.style.opacity = '1';
          big.style.transform = `translate(${bx.toFixed(2)}px, ${by.toFixed(2)}px) scale(${s.toFixed(5)})`;
          const r0 = (a.w > 0 ? (6 * sc) / (a.w / SH_W) : SH_R);
          bigF.style.borderRadius = `${lerp(r0, SH_R / (F.w / SH_W), p).toFixed(2)}px`;
          thumb.style.opacity = '0';
          paintShort(P.big, t);
        } else { big.style.opacity = '0'; thumb.style.opacity = '1'; }
        const away = inOutCubic(seg(t, T.push, T.push + PUSH * 0.75));
        app.style.transform = away > 0 ? `translateX(${(away * 120).toFixed(2)}px)` : 'none';
        veil.style.opacity = away.toFixed(3);

        // beside the Short: the title block, then the lock-up below it (the title block steps up to make room)
        const F = shortRect();
        const cx = (F.x + F.w + R.x + R.w) / 2;
        const midY = F.y + F.h / 2;
        const mh = meta.offsetHeight, bh = brand.offsetHeight;
        const e = inOutCubic(seg(t, T.brand, T.branded));
        const stackTop = midY - (mh + META_GAP + bh) / 2;
        const mY = lerp(midY - mh / 2, stackTop, e);
        const mi = outCubic(seg(t, T.meta, T.meta + META_IN));
        meta.style.opacity = mi.toFixed(3);
        meta.style.left = `${cx.toFixed(2)}px`;
        meta.style.top = `${(mY + (1 - mi) * 16).toFixed(2)}px`;
        brand.style.left = `${cx.toFixed(2)}px`;
        brand.style.top = `${(stackTop + mh + META_GAP + bh / 2).toFixed(2)}px`;
        const lt = t - T.brand;
        const fi = seg(lt, 0.1, 0.55);
        brand.style.opacity = t >= T.brand ? '1' : '0';
        face.style.opacity = fi.toFixed(3);
        face.style.transform = `scale(${lerp(0.5, 1, outQuint(fi)).toFixed(4)})`;
        const wi = outCubic(seg(lt, 0.3, 0.7));
        words.style.opacity = wi.toFixed(3);
        words.style.transform = `translateY(${((1 - wi) * 18).toFixed(2)}px)`;
        mark.render(Math.max(0, lt));
      },
    };
  },
};
