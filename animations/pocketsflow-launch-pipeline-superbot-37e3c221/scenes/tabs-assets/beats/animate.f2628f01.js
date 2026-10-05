// Beat 3 of 6, MiniMax Hailuo 02: it animates the storyboard's checkout frame into a 6s 1080p shot. The card is the
// Hailuo composer: the conditioning frame (storyboard frame 03, the shot's end frame), the motion prompt typed in, the
// option chips and Generate; then the job row, then the clip playing with its scrubber. The clip is the film's own
// checkout shot (film.f2628f01.js, 5.2-7.8s) under a slow camera push, held on its end frame for the rest of the 6s,
// so what Hailuo hands back is exactly the shot the final cut uses.
import { clamp, lerp, seg, outCubic, press, streamCount } from '../../../lib.js';
import { SHOTS, mountFilm } from '../../../film/film.f2628f01.js';
import { sayLine, renderSay, head, cardIn, rise, setText, spin, blinkOn } from './pf-kit.f2628f01.js';

const SAY = 'Animated shot 03, the checkout: 6 seconds at 1080p.';
const PROMPT = 'Phone swings toward camera, Apple Pay sheet slides up, Face ID confirms, slow push-in';
const CHIPS = ['Hailuo 02', '1080p', '6s', '16:9'];
const META = ['Camera: push-in', 'Motion 0.6', 'Seed 4417'];
const STATUS = ['Queued', 'Generating motion', 'Rendering 1080p', 'Ready'];
const SHOT = SHOTS[2], CLIP = 6;

const clock = (s) => `0:0${Math.min(CLIP, s).toFixed(1)}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.25;
    T.type = r + 0.4;
    T.press = r + 1.32;
    T.gen = r + 1.4;
    T.ready = r + 2.2;
    T.clip0 = r + 2.25;
    T.end = r + 4.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const card = x.el(`<div class="pfc pfa">
      ${head(x, 'hailuo', 'MiniMax Hailuo 02', 'video', '<span class="pfc-meta">image to video</span>')}
      <div class="pfa-body">
        <div class="pfa-l">
          <div class="pfa-ref"><div class="pfa-rf"></div><span class="pfa-tag">End frame, storyboard 03</span></div>
          <div class="pfa-pt"><span class="pfa-vis"></span><i class="pfa-caret"></i><span class="pfa-hid"></span></div>
          <div class="pfa-chips">${CHIPS.map((c) => `<span class="pfb-chip">${x.esc(c)}</span>`).join('')}</div>
          <button class="pfa-go" type="button"><span class="pfa-spin"></span><span class="pfa-go-t">Generate</span></button>
        </div>
        <div class="pfa-r">
          <div class="pfa-vid"><div class="pfa-film"></div>
            <svg class="pfa-path" viewBox="0 0 160 90"><rect x="22" y="12" width="116" height="66" rx="3"/><path d="M80 45L44 22M80 45l36-23M80 45l36 23M80 45L44 68"/></svg>
            <span class="pfa-q">Queued</span><span class="pfa-dur">6s</span></div>
          <div class="pfa-pg"><span class="pfa-bar"><i></i></span><span class="pfa-pct">0%</span><span class="pfa-stt">Queued</span></div>
          <div class="pfa-sc"><svg class="pfa-play" viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg><span class="pfa-tc">0:00.0</span>
            <span class="pfa-tr"><i class="pfa-fill"></i><i class="pfa-head"></i></span><span class="pfa-tc">0:06</span></div>
          <div class="pfa-meta">${META.map((c) => `<span>${x.esc(c)}</span>`).join('')}</div>
        </div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const ref = mountFilm($('.pfa-rf')), clip = mountFilm($('.pfa-film'));
    const st = {
      vis: $('.pfa-vis'), hid: $('.pfa-hid'), caret: $('.pfa-caret'), go: $('.pfa-go'), goT: $('.pfa-go-t'), sp: $('.pfa-spin'),
      vid: $('.pfa-film'), path: $('.pfa-path'), q: $('.pfa-q'), bar: $('.pfa-bar i'), pct: $('.pfa-pct'), stt: $('.pfa-stt'),
      tc: card.querySelector('.pfa-tc'), fill: $('.pfa-fill'), head: $('.pfa-head'), pg: $('.pfa-pg'), sc: $('.pfa-sc'), ref: $('.pfa-ref'),
    };
    let shown = -1;
    return {
      nodes: [say.n, card],
      marks: [[T.r, say.n], [T.card, card]],
      render(t) {
        renderSay(say, t, T.r + 0.05);
        cardIn(card, t, T.card, T.end);
        ref.set(SHOT.key);
        rise(st.ref, seg(t, T.card + 0.1, T.card + 0.45), 6);
        const n = streamCount(PROMPT, T.type, 100, t);
        if (n !== shown) { st.vis.textContent = PROMPT.slice(0, n); st.hid.textContent = PROMPT.slice(n); shown = n; }
        st.caret.style.opacity = t >= T.type && n < PROMPT.length && blinkOn(t) ? '1' : '0';
        // generate: pressed, spinning while the job runs, then ready
        const busy = t >= T.gen && t < T.ready;
        st.go.style.transform = `scale(${(1 - 0.06 * press(t, T.press)).toFixed(4)})`;
        st.go.classList.toggle('is-done', t >= T.ready);
        setText(st.goT, t >= T.ready ? 'Done' : busy ? 'Generating' : 'Generate');
        st.sp.style.opacity = busy ? '1' : '0';
        spin(st.sp, t, T.gen);
        const pe = outCubic(seg(t, T.gen, T.ready));
        st.bar.style.width = `${(pe * 100).toFixed(1)}%`;
        setText(st.pct, `${Math.round(pe * 100)}%`);
        setText(st.stt, STATUS[t < T.gen ? 0 : pe >= 1 ? 3 : pe < 0.55 ? 1 : 2]);
        // the clip: the shot's first frame dimmed under the camera path until it is ready, then it plays
        const ct = clamp(t - T.clip0, 0, CLIP);
        const playing = t >= T.clip0;
        clip.set(playing ? Math.min(SHOT.t1 - 0.001, SHOT.t0 + ct) : SHOT.t0 + 0.6);
        st.vid.style.filter = playing ? 'none' : `brightness(${lerp(0.42, 0.75, pe).toFixed(3)}) blur(${((1 - pe) * 2).toFixed(2)}px)`;
        st.vid.style.transform = `scale(${lerp(1, 1.08, ct / CLIP).toFixed(4)})`;
        st.path.style.opacity = playing ? '0' : (0.4 + 0.6 * seg(t, T.card + 0.3, T.card + 0.7)).toFixed(3);
        st.q.style.opacity = playing ? '0' : '1';
        setText(st.q, t < T.gen ? 'Queued' : `${Math.round(pe * 100)}%`);
        st.pg.style.display = playing ? 'none' : 'flex';
        st.sc.style.display = playing ? 'flex' : 'none';
        setText(st.tc, clock(ct));
        st.fill.style.width = `${(ct / CLIP * 100).toFixed(2)}%`;
        st.head.style.left = `${(ct / CLIP * 100).toFixed(2)}%`;
      },
    };
  },
};
