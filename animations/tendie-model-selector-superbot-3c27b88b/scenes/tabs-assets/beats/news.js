// Gemini Flash, fast read: 40 articles skimmed at speed (headlines flick past, the count runs), then the site's
// banner types in: "Fed +25 bps, Oct hike odds 67%".
import { seg, outCubic } from '../../../lib.js';
import { sayer, rise, setText } from './kit.js';

const SAY = 'Skimmed 40 articles on today’s Fed decision. Banner is up.';
const SRCS = ['Reuters', 'Bloomberg', 'CNBC', 'WSJ', 'AP', 'FT'];
const HEADS = [
  'Fed raises rates a quarter point',
  'Powell leaves the door open to more hikes',
  'Treasury yields jump after the decision',
  'Bank stocks rally, tech slips',
  'Futures price 67% odds of an October hike',
];
const BANNER = 'Fed +25 bps, Oct hike odds 67%';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.s0 = T.card + 0.25; T.s1 = T.s0 + 1.6;
    T.ban = T.s1 + 0.2;
    T.end = T.ban + 1.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY, 95);
    const card = x.el(`<div class="tt-card nw">
      <div class="nw-skim"><div class="nw-srcs">${SRCS.map((s) => `<span>${s}</span>`).join('')}</div><span class="nw-count"><b>0</b> / 40 articles</span></div>
      <div class="nw-heads"><div class="nw-hin">${HEADS.map((h) => `<div>${x.esc(h)}</div>`).join('')}</div></div>
      <div class="nw-banner"><span class="nw-live"><i></i>LIVE</span><span class="nw-txt"><span>${x.esc(BANNER)}</span></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const srcs = [...card.querySelectorAll('.nw-srcs span')], cnt = $('.nw-count b'), hin = $('.nw-hin');
    const ban = $('.nw-banner'), txt = $('.nw-txt > span'), dot = $('.nw-live i');
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.5), 18);
        const p = seg(t, T.s0, T.s1);
        setText(cnt, String(Math.round(40 * p)));
        const lit = p >= 1 ? -1 : Math.floor(Math.max(0, t - T.s0) * 11) % SRCS.length;
        srcs.forEach((s, i) => s.classList.toggle('on', p > 0 && (p >= 1 || i === lit)));
        // headlines scroll up one row every ~0.32s while skimming
        const hp = Math.min(HEADS.length - 1, Math.max(0, (t - T.s0) / 0.32));
        const step = Math.floor(hp), f = outCubic(Math.min(1, (hp - step) * 3));
        hin.style.transform = `translateY(${(-(step + (step < HEADS.length - 1 ? f : 0)) * 20).toFixed(2)}px)`;
        rise(ban, seg(t, T.ban, T.ban + 0.4), 8, 0.98);
        const ty = seg(t, T.ban + 0.15, T.ban + 0.85);
        txt.style.clipPath = ty >= 1 ? 'none' : `inset(0 ${((1 - ty) * 100).toFixed(1)}% 0 0)`;
        dot.style.opacity = (0.45 + 0.55 * Math.abs(Math.cos((t - T.ban) * 3.2))).toFixed(3);
      },
    };
  },
};
