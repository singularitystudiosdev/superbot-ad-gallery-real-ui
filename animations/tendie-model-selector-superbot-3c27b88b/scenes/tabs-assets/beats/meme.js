// GPT Image, memes: the launch meme (a stylized gain screenshot) resolves out of a blur. Real GPT Image output (gen/).
import { seg } from '../../../lib.js';
import { sayer, rise, reveal, gen } from './kit.js';

const SAY = 'Launch post meme, ready to post.';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.25;
    T.w0 = T.card + 0.2; T.w1 = T.w0 + 1.4;
    T.end = T.w1 + 1.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const card = x.el(`<div class="qc-img gm"><img src="${gen('meme-gpt-image.jpg')}" alt="Launch meme"/><i class="qc-gen"></i><span class="qc-genl">${x.tile('gptimg')}Creating image</span></div>`);
    const im = card.querySelector('img'), g = card.querySelector('.qc-gen'), l = card.querySelector('.qc-genl');
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.45), 14, 0.96);
        reveal(im, g, l, t, T.w0, T.w1);
      },
    };
  },
};
