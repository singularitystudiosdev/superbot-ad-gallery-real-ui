// Gemini beat (r1-e v5): Gemini renders the meme the user describes (the concept Claude wrote, carried over in the
// user's own message). As in the source spot, the line comes first ("Here’s your Muse meme."), then the image card
// lands as an empty frame under its "Creating image" pill; a blurred preview comes up in it while the card scrolls
// into view, the picture resolves over it top to bottom once it is in view, and the pill leaves when it is complete.
// muse-meme.jpg is the source spot's Gemini meme cut to its top two panels (img/CREDITS.txt). The tabs scene's camera
// reads T.note and T.whole for its last two framings. Pure function of t (the tabs scene's local time).
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Here’s your Muse meme.';

export default {
  times(r) {
    const T = { r };
    T.say = r + 0.05;
    T.card = r + 0.35;
    T.pre = [r + 0.55, r + 1.05];       // the blurred preview comes up while the card scrolls in
    T.w0 = r + 1.1; T.w1 = T.w0 + 0.9;  // the resolve, once the card is in view
    T.done = T.w1 + 0.2;                // the pill has left
    T.note = [T.done, T.done + 0.65];         // camera: in on the note, to read the joke
    T.whole = [T.done + 1.65, T.done + 2.25]; // camera: back out to the whole meme under its header, held to the cut
    T.end = T.done + 3.05;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const src = x.img('muse-meme.jpg');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="qc-img"><img class="qc-pre" src="${src}" alt=""/><img class="qc-full" src="${src}" width="1740" height="1366" alt="Muse meme"/><span class="qc-genl">${x.tile('gemini')}Creating image</span></div>`);
    // room under the card, so the thread's bottom fade never reaches the picture
    const pad = x.el('<div class="qc-pad"></div>');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const pre = card.querySelector('.qc-pre'), im = card.querySelector('.qc-full'), genl = card.querySelector('.qc-genl');
    let shown = -1;
    return {
      nodes: [say, card, pad],
      marks: [[T.say, say], [T.card, pad]],
      render(t) {
        const n = streamCount(SAY, T.say, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.35));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 10).toFixed(2)}px) scale(${lerp(0.98, 1, ci).toFixed(4)})`;
        pre.style.opacity = (0.85 * outCubic(seg(t, T.pre[0], T.pre[1]))).toFixed(3);
        // the resolve: a soft-edged scan, top to bottom, over the preview; nothing tints the image
        const e = outCubic(seg(t, T.w0, T.w1));
        const edge = lerp(-14, 100, e);
        const mask = e >= 1 ? 'none' : `linear-gradient(to bottom, #000 ${edge.toFixed(2)}%, transparent ${(edge + 14).toFixed(2)}%)`;
        im.style.webkitMaskImage = mask; im.style.maskImage = mask;
        genl.style.opacity = (1 - seg(t, T.w1, T.done)).toFixed(3);
      },
    };
  },
};
