// The output: under Opus's reply (a continuation, once the code card has folded away) the ride's window opens: a
// browser bar (localhost, Live) over a 16:9 screen showing the clip's first frame (gen/clip-poster.jpg). The camera
// then pushes into the screen (focus, tabs.js) until it lands on the clip scene's opening framing, and the timeline
// hard-cuts to the footage. The screen's width is --play-w (tabs.js geo: the widest 16:9 box the thread shows whole).
import { seg } from '../../../lib.js';
import { sayer, rise, gen } from './kit.js';

export const PUSH = 0.55; // the push into the screen ends the scene

export default {
  times(r, next, c) {
    const p = c.pace || 1;
    const T = { say: r + 0.02, card: r + 0.08 * p };
    T.live = T.card + 0.2;
    T.b = next;
    T.a = next - PUSH;
    T.end = next;
    return T;
  },

  build(k, x) {
    const T = k.T;
    const say = sayer(x, 'Your ride is live.', 110);
    say.node.classList.add('ow-say');
    const card = x.el(`<div class="ow">
  <div class="ow-bar"><i></i><i></i><i></i><span class="ow-url">localhost:5173</span><em class="ow-live">Live</em></div>
  <div class="ow-screen"><img alt="" decoding="sync" src="${gen('clip-poster.jpg')}"/></div>
</div>`);
    const screen = card.querySelector('.ow-screen');
    const live = card.querySelector('.ow-live');
    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      focus: { el: screen, a: T.a, b: T.b },
      render(t) {
        say.render(t, T.say);
        rise(card, seg(t, T.card, T.card + 0.3), 18, 0.94);
        live.classList.toggle('on', t >= T.live);
      },
    };
  },
};
