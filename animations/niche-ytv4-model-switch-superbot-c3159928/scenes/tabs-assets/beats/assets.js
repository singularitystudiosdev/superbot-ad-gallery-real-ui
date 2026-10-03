// Assets beat: Nano Banana Pro (Google's Gemini 3 Pro Image) makes the two images the ask wanted, and the viewer SEES
// them, large. Its line streams and a card lands in the thread holding a mini window; the window grows to full frame
// (the studio beat's GROW grammar) and becomes the ASSET STAGE, superbot's own dark surface: a quiet header strip (the
// Gemini mark, "Made with Nano Banana Pro", the video title in grey), then
//   Shot A, THE THUMBNAIL: the new thumbnail (img/nbp-thumbnail.jpg, a real Nano Banana Pro generation made from the
//     video's current thumbnail, img/CREDITS.txt) resolves from blur to sharp while it settles from 1.04x, 1440 px wide,
//     captioned "New thumbnail from the blind test at 6:12", and holds;
//   Shot B, BOTH: the thumbnail eases to the left (900 px wide) while the community post card rises in on the right:
//     Sam's letter avatar and name, the post text (POST, the one source for every place the post appears), then the
//     community post image (img/nbp-community.jpg, 700 px square) resolving the same way, captioned
//     "Community post image"; both hold, sharp.
// Then the stage closes back into its card in the thread. The two images are never drawn, retouched or recoloured
// here: they are shown as generated (scaled, rounded corners).
// Policy guard: nothing on the stage is a control. No buttons, tabs, toggles, progress bars, percentages, spinners or
// timers; no like or comment counts and no action row on the post; nothing button-shaped inside the images either.
// Pure function of t: every moving value is written from t; the geometry is constant (design px at 1920 x 1080), so a
// seek never measures layout.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { VIDEO } from './watch.js?v=c3159928';

const SAY = 'Made a new thumbnail around the blind test at 6:12, plus an image for the community post.';
const TITLE = 'Made with Nano Banana Pro';
const ACCOUNT = 'Sam Rivera';
// the community post Sam publishes (his voice): the single source for the stage, the channel view and the ending
export const POST = 'The $29 mic fooled my editor in the blind test. Which one would you buy for your desk?';
export const THUMB = 'nbp-thumbnail.jpg';      // 1920 x 1080, Nano Banana Pro, 16:9
export const COMMUNITY = 'nbp-community.jpg';   // 1440 x 1440, Nano Banana Pro, 1:1
const CAP_A = 'New thumbnail';
const CAP_A2 = 'from the blind test at 6:12';
const CAP_B = 'Community post image';

// timing (seconds from the reply start, or from the mark named)
const CPS_SAY = 80;                  // the reply line streams
const SAY_AT = 0.05;
const CARD_AT = 0.25;                // reply start to the card landing in the thread
const CARD_IN = 0.3;                 // the card rising in
const GROW_AT = 0.2; /* deliberate */ // the card landed, then the window opens
const GROW = 0.5; /* deliberate */   // the mini window opening to full frame (and, at the end, closing back)
const A_AT = 0.1;                    // full frame to the thumbnail starting to resolve
const REVEAL = 0.7; /* deliberate */ // blur to sharp, 1.04x to 1x (no progress bar, no spinner, no timer)
const CAP_AT = 0.35;                 // the reveal starts, then its caption rises
const CAP_IN = 0.3;
const HOLD_A = 2.4; /* deliberate */ // Shot A holds fully sharp (the brief: >= 2.2 s)
const MOVE = 0.6; /* deliberate */   // the thumbnail easing to the left, inOutCubic
const POST_AT = 0.15;                // the move starts, then the post card rises in
const POST_IN = 0.45;
const IMG_AT = 0.4;                  // the move starts, then the post image starts to resolve
const CAPB_AT = 0.7;                 // the move starts, then the post caption rises
const HOLD_B = 2.6; /* deliberate */ // Shot B holds, both images fully visible and sharp (the brief: >= 2.4 s)
const BLUR = 36;                     // px of blur an image resolves from
const RADIUS = 10;                   // the mini window's radius (the card's), eased to 0 at full frame
// stage geometry, in the stage's own px (1920 x 1080 at 16:9; the stage is laid out at the frame size)
const HEAD = 84;
const SHOT_A = { x: 240, y: 145, w: 1440, h: 810 };     // the thumbnail alone, centred under the header
const SHOT_B = { x: 104, y: 277, w: 900, h: 506.25 };   // the thumbnail beside the post card
const CARD_B = { x: 1076, y: 116, w: 740 };             // the post card (its image is 700 px square)
const CAP_GAP = 22;                                      // the thumbnail's bottom to its caption

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const px = (v) => `${v.toFixed(2)}px`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.grow = T.card + CARD_IN + GROW_AT;
    T.full = T.grow + GROW;
    T.a0 = T.full + A_AT;                 // the thumbnail starts to resolve
    T.a1 = T.a0 + REVEAL;                 // ...and is sharp: Shot A holds
    T.b0 = T.a1 + HOLD_A;                 // the thumbnail eases left, the post card rises
    T.b1 = T.b0 + IMG_AT + REVEAL;        // the post image is sharp: Shot B holds
    T.shrink = T.b1 + HOLD_B;             // the stage closes back into its card
    T.small = T.shrink + GROW;
    T.end = T.small;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el('<div class="as-card"><div class="as-shot"></div></div>');
    const shot = card.firstElementChild;
    const layer = x.el(`<div class="as-full" aria-hidden="true"><div class="as-app">
      <header class="as-hd"><span class="as-mk"><img src="${x.brand('gemini-logo.svg')}" alt=""/></span><b>${esc(TITLE)}</b><span class="as-vt">${esc(VIDEO.title)}</span></header>
      <div class="as-th"><img class="as-img" src="${x.img(THUMB)}" width="1920" height="1080" alt=""/></div>
      <div class="as-cap as-cap-a"><b>${esc(CAP_A)}</b> <span>${esc(CAP_A2)}</span></div>
      <div class="as-post">
        <div class="as-ph"><span class="as-av">S</span><b>${esc(ACCOUNT)}</b></div>
        <div class="as-pt">${esc(POST)}</div>
        <div class="as-pi"><img class="as-img" src="${x.img(COMMUNITY)}" width="1440" height="1440" alt=""/></div>
      </div>
      <div class="as-cap as-cap-b">${esc(CAP_B)}</div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => app.querySelector(s);
    const th = $('.as-th'), thImg = th.firstElementChild, capA = $('.as-cap-a');
    const post = $('.as-post'), pi = $('.as-pi'), piImg = pi.firstElementChild, capB = $('.as-cap-b');
    if (document.fonts && document.fonts.load) ['400', '600'].forEach((w) => document.fonts.load(`${w} 32px "GSF"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let said = -1, geo = '', feed = null;
    let AW = 1920, AH = 1080;
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      AW = W; AH = H;
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      shot.style.aspectRatio = `${W} / ${H}`;
      post.style.left = px(CARD_B.x); post.style.top = px(CARD_B.y); post.style.width = px(CARD_B.w);
    };
    // an image resolving: blur to sharp and 1.04x to 1x over REVEAL from a0
    const resolve = (img, a0, t) => {
      const e = seg(t, a0, a0 + REVEAL);
      const b = BLUR * (1 - outCubic(e));
      img.style.opacity = outCubic(seg(e, 0, 0.45)).toFixed(3);
      img.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
      img.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.04, 1, outCubic(e)).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        layout();
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // Shot A: the thumbnail resolves in place; Shot B: it eases left while the post card rises in beside it
        resolve(thImg, T.a0, t);
        const m = inOutCubic(seg(t, T.b0, T.b0 + MOVE));
        const R = { x: lerp(SHOT_A.x, SHOT_B.x, m), y: lerp(SHOT_A.y, SHOT_B.y, m), w: lerp(SHOT_A.w, SHOT_B.w, m), h: lerp(SHOT_A.h, SHOT_B.h, m) };
        th.style.left = px(R.x); th.style.top = px(R.y); th.style.width = px(R.w); th.style.height = px(R.h);
        const ca = outCubic(seg(t, T.a0 + CAP_AT, T.a0 + CAP_AT + CAP_IN));
        capA.style.left = px(R.x);
        capA.style.top = px(R.y + R.h + CAP_GAP + (1 - ca) * 12);
        capA.style.opacity = ca.toFixed(3);

        const pc = outCubic(seg(t, T.b0 + POST_AT, T.b0 + POST_AT + POST_IN));
        post.style.opacity = pc.toFixed(3);
        post.style.transform = pc >= 1 ? 'none' : `translateY(${((1 - pc) * 60).toFixed(2)}px)`;
        resolve(piImg, T.b0 + IMG_AT, t);
        const cb = outCubic(seg(t, T.b0 + CAPB_AT, T.b0 + CAPB_AT + CAP_IN));
        capB.style.left = px(CARD_B.x);
        capB.style.top = px(CARD_B.y + post.offsetHeight + 14 + (1 - cb) * 12);
        capB.style.opacity = cb.toFixed(3);
      },
      // after the camera: lay the stage over the card's mini window, open it to full frame, close it back at the end
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const W = x.root.offsetWidth, H = x.root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full)) * (1 - inOutCubic(seg(t, T.shrink, T.small)));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = RADIUS * s * (1 - g);
        layer.style.left = px(L);
        layer.style.top = px(Tp);
        layer.style.width = px(Wd);
        layer.style.height = px(Ht);
        layer.style.borderRadius = px(rad);
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while it sits in the thread it is clipped to the feed, like the card around it
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
