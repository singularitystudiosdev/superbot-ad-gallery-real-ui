// Beat 6 of 6, Superbot: it renders the cut, mixes the voice and the score, and plays the launch film. The window is
// a real player: title bar, the film (film.f2628f01.js, the same component the X post opened on), burned-in captions
// from the script, and a control bar with the clock, a scrubber marked at each of the six cuts, CC and a level meter.
// It plays film time START..START+WIN at 1x, which lands the tax map, the payouts week and the full logo lockup.
import { clamp, lerp, seg, outCubic } from '../../../lib.js';
import { SHOTS, FILM_DUR, shotAt, mountFilm } from '../../../film/film.f2628f01.js';
import { LINES } from './voice.f2628f01.js';
import { sayLine, renderSay, toolChip, renderChip, setText, rnd } from './pf-kit.f2628f01.js';

const SAY = 'Rendered it: pocketsflow-launch.mp4, 15s at 1080p, voice and score mixed.';
const START = 8.4, WIN = 6.0;
const clock = (s) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.22, r + 0.66];
    T.chipDone = [r + 0.6, r + 1.1];
    T.v0 = r + 1.2;
    T.end = T.v0 + WIN;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chips = [toolChip(x, 'Rendering 450 frames', 'Rendered in 38s'), toolChip(x, 'Mixing voice and score', 'Mixed at -14 LUFS')];
    const card = x.el(`<div class="pfp">
      <div class="pfp-bar"><span class="play-dots"><i></i><i></i><i></i></span><b>pocketsflow-launch.mp4</b><span class="pfc-meta">1080p</span><span class="pfc-meta">voice + score</span></div>
      <div class="pfp-screen"><div class="pfp-film"></div><p class="pfp-cc"><span></span></p></div>
      <div class="pfp-ctl"><svg class="pfp-ic" viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg><span class="pfp-tc">0:08 / 0:15</span>
        <span class="pfp-tr">${SHOTS.slice(1).map((s) => `<b style="left:${(s.t0 / FILM_DUR * 100).toFixed(2)}%"></b>`).join('')}<i class="pfp-fill"></i><i class="pfp-head"></i></span>
        <span class="pfp-cc-b">CC</span><svg class="pfp-ic" viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/></svg><span class="pfp-lv"><i></i><i></i><i></i><i></i><i></i></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const film = mountFilm($('.pfp-film'));
    const st = { cc: $('.pfp-cc span'), ccBox: $('.pfp-cc'), tc: $('.pfp-tc'), fill: $('.pfp-fill'), head: $('.pfp-head'), lv: [...card.querySelectorAll('.pfp-lv i')] };
    return {
      nodes: [say.n, ...chips.map((c) => c.row), card],
      marks: [[T.r, say.n], [T.chipIn[0], chips[0].row], [T.chipIn[1], chips[1].row], [T.v0, card], [T.v0 + 0.55, card]],
      render(t) {
        renderSay(say, t, T.r + 0.05);
        chips.forEach((c, i) => renderChip(c, t, T.chipIn[i], T.chipDone[i]));
        const ci = outCubic(seg(t, T.v0, T.v0 + 0.55));
        const push = lerp(1, 1.03, seg(t, T.v0, T.end));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = `translateY(${((1 - ci) * 22).toFixed(2)}px) scale(${(lerp(0.94, 1, ci) * push).toFixed(4)})`;
        const ft = START + clamp(t - T.v0, 0, WIN);
        film.set(ft);
        setText(st.tc, `${clock(ft)} / 0:15`);
        st.fill.style.width = `${(ft / FILM_DUR * 100).toFixed(2)}%`;
        st.head.style.left = `${(ft / FILM_DUR * 100).toFixed(2)}%`;
        // captions: the script line of the shot on screen while its voice line runs (voice.f2628f01.js LINES); the logo
        // shot carries none, its tagline is already on screen
        const i = shotAt(ft), s = SHOTS[i];
        const show = i < 5 && ft > LINES[i].a && ft < LINES[i].b + 0.15;
        setText(st.cc, s.vo);
        st.ccBox.style.opacity = show ? '1' : '0';
        // the level meter: seeded per twelfth of a second, louder on the logo hit
        const step = Math.floor(ft * 12), loud = ft > 12.6 && ft < 13.3 ? 1 : 0.75;
        st.lv.forEach((n, i) => { n.style.transform = `scaleY(${(0.25 + 0.75 * loud * rnd(step * 5 + i)).toFixed(3)})`; });
      },
    };
  },
};
