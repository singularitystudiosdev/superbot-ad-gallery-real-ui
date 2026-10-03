// Image beat: GPT Image 2.5 turns the club's photo into the community's banner and icon. Its line streams and a card
// rises holding the photo as the club sent it (a tighter shot of the loaves, framed, on an empty canvas). The photo
// extends outward to the canvas edges under the "Extending photo" label, then two crop frames slide over it in turn:
// the wide banner strip, then the round icon, each dimming what it leaves out. The two outputs land under it, labelled
// with Reddit's documented sizes (Reddit Help: "Banner", desktop at least 1072 x 128 px; "Community icon", 300 x 300 px).
// Every pixel is the one real photo (img/club-photo.jpg; img/banner.jpg and img/icon.jpg are crops of the same
// original, img/CREDITS.txt): the "extension" reveals the photo's own surroundings, nothing is drawn. The frames'
// geometry is the crops' own (PHOTO/STAGE/BANNER/ICON below, in original pixels), so what the frames hold is exactly
// what lands. Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Extended the club photo into a banner and cropped the round icon.';
// geometry, in the original photo's pixels (5184 x 3456): the stage shows rows STAGE[0]..STAGE[1] at full width
const PHOTO = { w: 5184, h: 3456 };
const STAGE = [1000, 3456];
const SHOT = { x0: 1800, x1: 3900 };              // the club's own snapshot, before it is extended
const BANNER = { y0: 1743, y1: 2362 };            // full width; 5184 x 619 = 1072:128 (img/banner.jpg)
const ICON = { x: 2035, y: 1150, d: 2000 };       // the round icon (img/icon.jpg)
const OUT = [['Banner', '1072 × 128'], ['Icon', '300 × 300']];
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                     // the reply line streams at this many characters a second
const SAY_AT = 0.048;                // reply start to the line's first character
const CARD = 0.144;                  // reply start to the card rising in
const RISE = 0.36;                   // the card rising in
const EXT_AT = 0.3;                  // the card landing to the photo starting to extend
const EXT = 0.5; /* deliberate */    // the photo extending to the canvas edges
const FRAME_IN = 0.3;                // a crop frame sliding into place
const ICON_AT = 0.36;                // the banner frame starting to the icon frame starting
const OUT_AT = 0.3;                  // the icon frame starting to the first output landing
const OUT_STAGGER = 0.08;            // one output to the next
const OUT_IN = 0.28;                 // an output rising in
const LABEL_OUT = 0.2;               // the "Extending photo" label fading as the photo reaches the edges

const sw = STAGE[1] - STAGE[0];
const pct = (v) => `${(v * 100).toFixed(3)}%`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.x0 = T.card + EXT_AT;                          // the photo starts extending
    T.x1 = T.x0 + EXT;                               // ...and fills the canvas
    T.b0 = T.x1;                                     // the banner frame slides in
    T.i0 = T.b0 + ICON_AT;                           // the icon frame slides in
    T.out = OUT.map((_, i) => T.i0 + OUT_AT + i * OUT_STAGGER); // the outputs land
    // the beat's last visible change: the last output settled, or the line's last character
    T.end = Math.max(T.out[OUT.length - 1] + OUT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    // the photo's box inside the stage (the stage is the photo's rows STAGE[0]..STAGE[1], full width)
    const imgTop = -STAGE[0] / sw, imgH = PHOTO.h / sw;
    const card = x.el(`<div class="im-card">
      <div class="im-stage" style="aspect-ratio: ${PHOTO.w} / ${sw}">
        <span class="im-ph" style="top: ${pct(imgTop)}; height: ${pct(imgH)}"><img src="${x.img('club-photo.jpg')}" width="1600" height="1067" alt=""/></span>
        <i class="im-edge im-edge-l"></i><i class="im-edge im-edge-r"></i>
        <i class="im-orig" style="left: ${pct(SHOT.x0 / PHOTO.w)}; width: ${pct((SHOT.x1 - SHOT.x0) / PHOTO.w)}"></i>
        <i class="im-fr im-fr-b" style="top: ${pct((BANNER.y0 - STAGE[0]) / sw)}; height: ${pct((BANNER.y1 - BANNER.y0) / sw)}"><b>Banner</b></i>
        <i class="im-fr im-fr-i" style="left: ${pct(ICON.x / PHOTO.w)}; top: ${pct((ICON.y - STAGE[0]) / sw)}; width: ${pct(ICON.d / PHOTO.w)}; height: ${pct(ICON.d / sw)}"><b>Icon</b></i>
        <span class="im-genl">${x.tile('gptimage')}Extending photo</span>
      </div>
      <div class="im-outs">
        <figure class="im-out im-out-b"><span class="im-ob"><img src="${x.img('banner.jpg')}" width="2144" height="256" alt=""/></span>
          <figcaption><b>${OUT[0][0]}</b>${OUT[0][1]}</figcaption></figure>
        <figure class="im-out im-out-i"><span class="im-oi"><img src="${x.img('icon.jpg')}" width="300" height="300" alt=""/></span>
          <figcaption><b>${OUT[1][0]}</b>${OUT[1][1]}</figcaption></figure>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const ph = $('.im-ph'), eL = $('.im-edge-l'), eR = $('.im-edge-r'), orig = $('.im-orig'), genl = $('.im-genl');
    const fb = $('.im-fr-b'), fi = $('.im-fr-i');
    const outs = [...card.querySelectorAll('.im-out')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const L0 = SHOT.x0 / PHOTO.w, R0 = 1 - SHOT.x1 / PHOTO.w;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the extension: the photo's clip opens from the club's shot to the whole canvas, a soft light edge riding
        // each side while it moves; the shot's own frame fades once the photo fills the canvas
        const p = seg(t, T.x0, T.x1), e = inOutCubic(p);
        const l = L0 * (1 - e), rr = R0 * (1 - e);
        ph.style.clipPath = e >= 1 ? 'none' : `inset(0 ${pct(rr)} 0 ${pct(l)})`;
        const moving = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
        eL.style.left = pct(l); eR.style.right = pct(rr);
        eL.style.opacity = eR.style.opacity = (0.9 * moving).toFixed(3);
        orig.style.opacity = (1 - seg(t, T.x1 - 0.1, T.x1 + 0.2)).toFixed(3);
        genl.style.opacity = (seg(t, T.card + 0.1, T.card + 0.3) * (1 - seg(t, T.x1 - LABEL_OUT, T.x1))).toFixed(3);

        // the crop frames: the banner strip slides down into place, then the icon circle slides in from the right;
        // each dims what it leaves out while it is the active frame (the icon takes over from the banner)
        const b = outCubic(seg(t, T.b0, T.b0 + FRAME_IN)), ic = outCubic(seg(t, T.i0, T.i0 + FRAME_IN));
        const hand = inOutCubic(seg(t, T.i0, T.i0 + FRAME_IN));
        fb.style.opacity = (b * (1 - hand)).toFixed(3);
        fb.style.transform = b >= 1 ? 'none' : `translateY(${((1 - b) * -60).toFixed(2)}%)`;
        fb.style.setProperty('--dim', (0.55 * b * (1 - hand)).toFixed(3));
        fi.style.opacity = ic.toFixed(3);
        fi.style.transform = ic >= 1 ? 'none' : `translateX(${((1 - ic) * 40).toFixed(2)}%)`;
        fi.style.setProperty('--dim', (0.55 * hand).toFixed(3));

        // the outputs land under the stage
        outs.forEach((o, i) => {
          const q = outCubic(seg(t, T.out[i], T.out[i] + OUT_IN));
          o.style.opacity = q.toFixed(3);
          o.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 10).toFixed(2)}px)`;
        });
      },
    };
  },
};
