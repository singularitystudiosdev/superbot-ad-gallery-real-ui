// Veo 3.1, video: the 6 second teaser generates (a blurred first frame under the band), then plays: tickers flying
// through a green candle tunnel. The frames are the real Veo 3.1 clip at 12 fps (gen/veo/f001..f072.jpg); every
// frame is stacked and one is shown per t, so a seek always lands on the right frame.
import { lerp, seg, outCubic } from '../../../lib.js';
import { sayer, rise, gen, setText } from './kit.js';

const SAY = 'Your 6 second teaser.';
const N = 72, PLAY = 5.0;
const PLAYIC = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.25;
    T.g0 = T.card + 0.15; T.g1 = T.g0 + 1.3;
    T.p0 = T.g1 + 0.1; T.p1 = T.p0 + PLAY;
    T.end = T.p1 + 0.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const frames = Array.from({ length: N }, (_, i) => `<img src="${gen(`veo/f${String(i + 1).padStart(3, '0')}.jpg`)}" alt=""/>`).join('');
    const card = x.el(`<div class="vo">
      <div class="vo-screen">${frames}<i class="qc-gen"></i><span class="qc-genl">${x.tile('veo')}Generating video</span><span class="vo-badge">1280 x 720, 6s</span></div>
      <div class="vo-bar"><span class="vo-play">${PLAYIC}</span><span class="vo-track"><i></i></span><span class="vo-time">0:00 / 0:06</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const imgs = [...card.querySelectorAll('.vo-screen > img')], g = $('.qc-gen'), l = $('.qc-genl'), fill = $('.vo-track i'), time = $('.vo-time'), badge = $('.vo-badge');
    let cur = -1;
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.45), 16);
        const p = seg(t, T.p0, T.p1);
        const f = Math.min(N - 1, Math.floor(p * N));
        if (f !== cur) { imgs.forEach((im, i) => { im.style.visibility = i === f ? 'visible' : 'hidden'; }); cur = f; }
        const gp = seg(t, T.g0, T.g1), e = outCubic(gp);
        const im = imgs[f];
        im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 16).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
        im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
        g.style.transform = `translateX(${lerp(-110, 110, (Math.max(0, t - T.g0) * 1.6) % 1).toFixed(1)}%)`;
        g.style.opacity = (gp >= 1 ? 0 : 1 - seg(gp, 0.8, 1)).toFixed(3);
        l.style.opacity = (1 - seg(t, T.g1 - 0.25, T.g1)).toFixed(3);
        badge.style.opacity = seg(t, T.g1 - 0.1, T.g1 + 0.3).toFixed(3);
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        setText(time, `0:0${Math.min(6, Math.floor(p * 6.001))} / 0:06`);
        card.classList.toggle('vo-on', t >= T.p0 && t < T.p1);
      },
    };
  },
};
