// Studio beat, the finale: superbot fills in the creator's RATE CARD from YouTube Studio. Its line streams and the
// base's checklist card lands in the chat ("Connected as Sam Rivera", "Read subscribers and average views", "Read top
// countries and ages", "Priced 4 sponsor formats"), ticking in turn, with a mini window under it; the card holds
// (CARD_HOLD) and the window opens (GROW) to a FRAMED window, never full bleed: superbot's dark backdrop shows as a
// margin on every side and a superbot title bar (the superbot mark and name, the YouTube mark, "Filled from your
// YouTube Studio") sits on the frame edge. Inside it, on a light page, is the rate card: a DOCUMENT, not a form (label
// left, value right, hairline row dividers; no input boxes, dropdowns, toggles or Download / Share / Send buttons). Its
// labels are there while the window is small; once it is open the values fill in row by row (stats first, then
// prices), the footnote lands, and the ONE bold moment (the chime): the green-check status line "Rate card attached
// to 3 drafts". Then the ENDING ON THE RATE CARD: the camera pushes in until the card fills most of the frame (the
// frame edge still showing), it holds, and the window eases aside and shrinks a little (the card still fully
// readable) while superbot's lock-up (the mascot, the wordmark and a plain-text line) lands beside it. The scene's
// fade and the loop's dip to black follow.
// Policy guard (X Ads deceptive content): nothing in the window is a control, no times, no time-bound numbers; the
// prices are the creator's own asks (never earnings).
// There is ONE window, on a layer in the scene root (outside the camera). While the checklist card sits in the chat
// the layer is pinned over the card's mini window; GROW interpolates it to the framed rect. The window is laid out at
// the framed rect's size and scaled to the layer, so the mini window and the framed window are the same pixels at two
// sizes; the document inside it is laid out at its close-up size (DOC_W) and scaled (framed, close-up, beside).
// The texts are sponsors.js RATE (the one source). Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount } from '../../../lib.js';
import { makeMark } from '../../../shell.js';
import { ms } from './yt-icons.js?v=d1ee1ada';
import { RATE, CREATOR, CHANNEL } from './sponsors.js?v=d1ee1ada';

const SAY = 'Filling in your rate card from YouTube Studio.';
const FRAME_LABEL = 'Filled from your YouTube Studio';
const CTA = 'Try it at superbot.gg';
const STEPS = [
  ['avatar', `Connected as <b>${CREATOR}</b>`],
  ['analytics-outline', 'Read subscribers and average views'],
  ['dashboard-outline', 'Read top countries and ages'],
  ['attach-money', 'Priced 4 sponsor formats'],
];
// the superbot frame: the dark backdrop shows as this margin around the window, in frame px
const MARGIN = { x: 64, y: 40 };
// the document's scale (its close-up size is 1:1 frame px): framed while it fills in, at most this in the close-up
// (bounded by the window), and beside the lock-up
const S_FRAMED = 0.8;
const S_CLOSE_MAX = 1.04;
const S_BESIDE = 0.68;
const BESIDE_PAD = 34;                           // frame px of light page around the document once beside the lock-up
const MARK = 168;
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const LIST_AT = 0.25;                            // the line streams, then the checklist card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.2; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the window opens to the framed rect
const FILL_AT = 0.2;                             // the window open to the first value
const FILL_STAGGER = 0.22; /* deliberate */      // one value to the next (the brief's ~0.25 s a row, trimmed for the cycle)
const VAL_IN = 0.22;                             // a value fading up into its row
const FOOT_AT = 0.05;                            // the last value starting to the footnote
const DONE_AT = 0.15;                            // the last value landed to the status line (the chime)
const DONE_IN = 0.3;                             // the status line rising in
const PUSH_AT = 0.6; /* deliberate */            // the chime to the push in (the brief: ~0.6 s after the chime)
const PUSH = 0.75; /* deliberate */              // the push in on the rate card
const CLOSE_HOLD = 2.25; /* deliberate */        // the close-up holds, every row readable (the brief: >= 2.2 s)
const BRAND = 0.7; /* deliberate */              // the window eases aside, the lock-up lands beside it
const BRAND_HOLD = 1.15; /* deliberate */         // the last frame: the rate card and superbot, before the fade
const RADIUS = 8;                                // the card's window radius
const FRAME_RADIUS = 14;                         // the superbot frame's radius once open

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const OK = '<svg class="rk-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const VALUES = [...RATE.stats, ...RATE.prices];

export default {
  times(r) {
    const T = { r };
    T.list = r + LIST_AT;                              // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // the framed window is in place
    T.val = VALUES.map((_, i) => T.full + FILL_AT + i * FILL_STAGGER); // the values fill in, stats then prices
    const last = T.val[VALUES.length - 1];
    T.foot = last + FOOT_AT;
    T.chime = last + VAL_IN + DONE_AT;                 // "Rate card attached to 3 drafts" lands: the chime
    T.push = T.chime + PUSH_AT;                        // the push in on the rate card
    T.close = T.push + PUSH;                           // the close-up is set
    T.brand = T.close + CLOSE_HOLD;                    // the window eases aside, the lock-up lands
    T.branded = T.brand + BRAND;
    T.end = T.branded + BRAND_HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.chime, closeUp: T.close, brand: T.branded });

    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av">S</span>' : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the framed window and the rate card in it ----
    const row = ([label, value]) => `<div class="rk-row"><span class="rk-k">${esc(label)}</span><span class="rk-v">${esc(value)}</span></div>`;
    const dim = x.el('<div class="st-dim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-win">
      <div class="st-sb"><img class="st-sbt" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="st-sbv"></i><img class="st-sby" src="${icon('youtube-icon.svg')}" alt=""/><span>${esc(FRAME_LABEL)}</span></div>
      <div class="st-port"><div class="rk-doc">
        <div class="rk-top"><h2 class="rk-title">${esc(RATE.title)}</h2><div class="rk-sub"><b class="rk-name">${esc(CREATOR)}</b><span class="rk-chan">${esc(CHANNEL)}</span></div></div>
        <div class="rk-cols">
          <section class="rk-col rk-stats"><div class="rk-sh"><b>${esc(RATE.statsHead)}</b><span class="rk-src">${esc(RATE.source)}</span></div>${RATE.stats.map(row).join('')}</section>
          <section class="rk-col rk-prices"><div class="rk-sh"><b>${esc(RATE.pricesHead)}</b></div>${RATE.prices.map(row).join('')}<p class="rk-foot">${esc(RATE.foot)}</p></section>
        </div>
        <div class="rk-done">${OK}<span>${esc(RATE.done)}</span></div>
      </div></div>
    </div></div>`);
    const brand = x.el(`<div class="st-brand" aria-hidden="true"><div class="st-bface"></div><div class="st-bwords"><h1>superbot</h1><p>${esc(CTA)}</p></div></div>`);
    x.root.appendChild(dim);
    x.root.appendChild(layer);
    x.root.appendChild(brand);
    const win = layer.firstElementChild;
    const sb = win.querySelector('.st-sb');
    const doc = win.querySelector('.rk-doc');
    const vals = [...doc.querySelectorAll('.rk-v')];
    const foot = doc.querySelector('.rk-foot'), done = doc.querySelector('.rk-done');
    const face = brand.querySelector('.st-bface'), words = brand.querySelector('.st-bwords');
    const mark = makeMark(MARK);
    face.appendChild(mark.el);
    if (document.fonts && document.fonts.load) ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 40px "GSF"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null;
    let R = { x: 64, y: 40, w: 1792, h: 1000 };

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      R = { x: MARGIN.x, y: MARGIN.y, w: W - 2 * MARGIN.x, h: H - 2 * MARGIN.y };
      shot.style.aspectRatio = `${R.w} / ${R.h}`;
    };
    // the close-up scale: the document fills most of the framed window (never past it)
    const sClose = () => {
      const pw = R.w, ph = R.h - sb.offsetHeight;
      return Math.min(S_CLOSE_MAX, (0.93 * pw) / doc.offsetWidth, (0.93 * ph) / doc.offsetHeight);
    };
    // the window's rect while the lock-up sits beside it (frame px): the document at S_BESIDE plus its page padding,
    // vertically centred, at the frame's left margin
    const beside = () => {
      const w = doc.offsetWidth * S_BESIDE + 2 * BESIDE_PAD;
      const h = sb.offsetHeight + doc.offsetHeight * S_BESIDE + 2 * BESIDE_PAD;
      const H = x.root.offsetHeight;
      return { x: R.x, y: Math.max(R.y, (H - h) / 2), w, h };
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

        // the values fill in row by row, a soft fade up into place; the footnote, then the status line (the chime)
        vals.forEach((v, i) => {
          const f = outCubic(seg(t, T.val[i], T.val[i] + VAL_IN));
          v.style.opacity = f.toFixed(3);
          v.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 10).toFixed(2)}px)`;
        });
        const fo = outCubic(seg(t, T.foot, T.foot + VAL_IN));
        foot.style.opacity = fo.toFixed(3);
        const d = outCubic(seg(t, T.chime, T.chime + DONE_IN));
        done.style.opacity = d.toFixed(3);
        done.style.transform = d >= 1 ? 'none' : `translateY(${((1 - d) * 12).toFixed(2)}px)`;
      },
      // after the camera: lay the window over the card's mini frame, open it to the framed rect, push in on the rate
      // card, then ease it aside for the lock-up
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
        const L = lerp(b.x, tx, g), Tp = lerp(b.y, ty, g), Wd = lerp(b.w, tw, g), Ht = lerp(b.h, th, g);
        const s0 = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = lerp(RADIUS * s0, FRAME_RADIUS, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        // the window's scale: the mini window and the framed one are the same px at two sizes; once open it is laid out
        // at the layer's own size
        const k = g < 1 ? Wd / R.w : 1;
        win.style.width = `${(Wd / k).toFixed(2)}px`;
        win.style.height = `${(Ht / k).toFixed(2)}px`;
        win.style.transform = `scale(${k.toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        // the hub behind gives way to superbot's dark backdrop as the window opens
        dim.style.opacity = g.toFixed(3);

        // the document: framed while it fills, pushed in to the close-up, then a little smaller beside the lock-up
        const p = outCubic(seg(t, T.push, T.close));
        let s = lerp(S_FRAMED, sClose(), p);
        if (e > 0) s = lerp(s, S_BESIDE, e);
        doc.style.transform = `translate(-50%, -50%) scale(${s.toFixed(5)})`;

        // the lock-up lands beside the window: the mascot scales up into place, the wordmark and the line follow
        if (B) {
          const W = x.root.offsetWidth, H = x.root.offsetHeight;
          const right = B.x + B.w;
          brand.style.left = `${((right + W) / 2).toFixed(2)}px`;
          brand.style.top = `${(H / 2).toFixed(2)}px`;
        }
        const lt = t - T.brand;
        const fi = seg(lt, 0.15, 0.65);
        brand.style.opacity = t >= T.brand ? '1' : '0';
        face.style.opacity = fi.toFixed(3);
        face.style.transform = `scale(${lerp(0.5, 1, outQuint(fi)).toFixed(4)})`;
        const wi = outCubic(seg(lt, 0.4, 0.9));
        words.style.opacity = wi.toFixed(3);
        words.style.transform = `translateY(${((1 - wi) * 18).toFixed(2)}px)`;
        mark.render(Math.max(0, lt));
      },
    };
  },
};
