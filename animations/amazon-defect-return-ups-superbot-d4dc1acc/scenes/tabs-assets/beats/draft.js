// Claude Opus 5.5 writes the comment the Amazon return form asks for; it types out, and the clip's chip is ticked as
// attached once the text says so.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { COMMENT, CLIP } from './returns.js';
import { clipThumbHTML } from './clip.js';

const SAY = 'Wrote the comment for your return.';
const CPS = 82;
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.ty0 = T.card + 0.3;
    T.ty1 = T.ty0 + COMMENT.length / CPS;
    T.att = T.ty0 + (COMMENT.indexOf('Video attached') + 14) / CPS;
    T.end = T.ty1 + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="cd-card">
      <div class="cd-h"><img src="${x.brand('claude-logo.svg')}" alt=""/><b>Return comment</b><small>for Amazon</small></div>
      <div class="cd-txt"><span class="cd-vis"></span><i class="cd-caret"></i><span class="cd-hid">${x.esc(COMMENT)}</span></div>
      <div class="cd-att"><span class="vc-mini">${clipThumbHTML(x.img, 'vc-m')}</span><b>${x.esc(CLIP.file)}</b><span>${CLIP.len}</span><em class="cd-ok">${TICK}Video attached</em></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const cv = $('.cd-vis'), ch = $('.cd-hid'), caret = $('.cd-caret'), ok = $('.cd-ok'), att = $('.cd-att');
    let shown = -1, typedN = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.42));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const tn = streamCount(COMMENT, T.ty0, CPS, t);
        if (tn !== typedN) { cv.textContent = COMMENT.slice(0, tn); ch.textContent = COMMENT.slice(tn); typedN = tn; }
        caret.style.opacity = t >= T.ty0 - 0.1 && (t < T.ty1 + 0.1 || Math.floor(t * 3.4) % 2 === 0) && t < T.ty1 + 0.6 ? '1' : '0';
        const a = seg(t, T.att, T.att + 0.32);
        att.style.setProperty('--on', outCubic(a).toFixed(3));
        ok.style.opacity = outCubic(a).toFixed(3);
        ok.style.transform = `scale(${lerp(0.6, 1, outBack(a)).toFixed(4)})`;
      },
    };
  },
};
