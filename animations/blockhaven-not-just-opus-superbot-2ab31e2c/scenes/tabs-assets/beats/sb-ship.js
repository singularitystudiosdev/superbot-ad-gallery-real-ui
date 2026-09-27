// Step 6, Superbot ships it: a Play card for the finished game. Its 16:9 screen shows BlockHaven's own title screen
// (a frame of @kepochnik's video, gen/title.jpg), under it the game's name and a Play button. The cursor comes in and
// clicks Play; the screen cuts to the game's first frame (gen/clip-poster.jpg, the clip scene's first frame) and the
// camera pushes into the screen until it covers the frame (focus: tabs.js, CFG.zoom), where the timeline cuts to the
// clip scene on the same framing. The screen's width is --play-w (tabs.js geo: the widest 16:9 box the thread fits).
import { seg, lerp, inOutCubic, press, pressScale } from '../../../lib.js';
import { sayer, rise, gen } from './kit.js';

const PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6l7.6-4.8z"/></svg>';

export default {
  times(r, c) {
    const p = c.pace || 1;
    const T = { say: r + 0.04, card: r + 0.2 * p };
    T.cur0 = T.card + 0.2 * p;       // the cursor sets off
    T.click = T.card + 0.78 * p;     // Play
    T.cut = T.click + 0.06;          // the screen cuts to the game
    T.a = T.click + 0.12;            // the push
    T.b = T.a + 0.62;
    T.end = T.b - 0.25;              // tabs.js holds 0.25 s past the last beat's end: the scene ends as the push lands
    return T;
  },

  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.ship, 90);
    const card = x.el(`<div class="bh-card">
  <div class="bh-screen"><img class="bh-title" alt="" decoding="sync" src="${gen('title.jpg')}"/><img class="bh-first" alt="" decoding="sync" src="${gen('clip-poster.jpg')}"/></div>
  <div class="bh-foot"><i class="bh-ic" style="background-image:url('${gen('decal/grass_side.png')}')"></i><span class="bh-name"><b>BlockHaven</b><small>Ready to play</small></span><span class="bh-play">${PLAY}<span>Play</span></span></div>
</div>`);
    const screen = card.querySelector('.bh-screen');
    const first = card.querySelector('.bh-first');
    const btn = card.querySelector('.bh-play');
    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      focus: { el: screen, a: T.a, b: T.b },
      render(t) {
        say.render(t, T.say);
        rise(card, seg(t, T.card, T.card + 0.24));
        first.style.opacity = seg(t, T.cut, T.cut + 0.12).toFixed(3);
        btn.style.transform = `scale(${pressScale(t, T.click, 0.08).toFixed(4)})`;
        btn.classList.toggle('is-down', t >= T.click && t < T.click + 0.2);
      },
      pointer(t) {
        if (t < T.cur0 || t > T.a + 0.25) return null;
        const b = x.box(btn);
        const to = { x: b.x + b.w * 0.42, y: b.y + b.h * 0.55 };
        const from = { x: to.x + 260, y: to.y + 190 };
        const f = inOutCubic(seg(t, T.cur0, T.click - 0.06));
        return {
          x: lerp(from.x, to.x, f), y: lerp(from.y, to.y, f),
          p: press(t, T.click),
          v: Math.min(seg(t, T.cur0, T.cur0 + 0.12), 1 - seg(t, T.a, T.a + 0.2)),
        };
      },
    };
  },
};
