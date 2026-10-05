// Beat 5 of 6, Claude Opus 5.5: it builds the film in Remotion and cuts every sequence on its voice line. The card is
// the project as it lands (nine files, each with the lines it wrote; timing.ts comes from ElevenLabs' alignment) beside
// a Studio view: the live preview (the film itself, film.f2628f01.js) scrubbed end to end once it compiles, the six
// sequences on the timeline with the voice islands under them, and the render line. No code is shown, only the result.
import { seg, lerp, outCubic } from '../../../lib.js';
import { SHOTS, FILM_DUR, mountFilm } from '../../../film/film.f2628f01.js';
import { LINES } from './voice.f2628f01.js';
import { sayLine, renderSay, head, cardIn, rise, setText, spin } from './pf-kit.f2628f01.js';

const SAY = 'Built the film in Remotion, every cut on its voice line.';
const FILES = [
  ['src/Root.tsx', 18], ['src/Launch.tsx', 64], ['src/timing.ts', 31], ['scenes/Hook.tsx', 72], ['scenes/ProductPage.tsx', 118],
  ['scenes/Checkout.tsx', 141], ['scenes/GlobalTax.tsx', 96], ['scenes/Payouts.tsx', 104], ['scenes/Lockup.tsx', 58],
];
const FPS = 30, FRAMES = FILM_DUR * FPS;
const pct = (s) => `${(s / FILM_DUR * 100).toFixed(2)}%`;

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.25;
    T.file = FILES.map((_, i) => r + 0.45 + i * 0.13);
    T.built = r + 1.7;
    T.scrub = [r + 1.75, r + 3.55];
    T.end = r + 3.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const card = x.el(`<div class="pfc pfo">
      ${head(x, 'opus', 'Claude Opus 5.5', 'Remotion', '<span class="pfc-meta">pocketsflow-launch/</span>')}
      <div class="pfo-body">
        <div class="pfo-files">${FILES.map(([f, n]) => `<div class="pfo-f"><span class="pfo-st"><i class="pfo-sp"></i>${x.OK}</span><code>${x.esc(f)}</code><b>+${n}</b></div>`).join('')}
          <div class="pfo-sum"><b>9 files</b><span>+${FILES.reduce((s, f) => s + f[1], 0)} lines</span></div></div>
        <div class="pfo-studio">
          <div class="pfo-pv"><div class="pfo-film"></div><span class="pfo-cmp">Compiling</span><span class="pfo-fr">frame 0 / ${FRAMES}</span></div>
          <div class="pfo-tl">
            <div class="pfo-seq">${SHOTS.map((s) => `<span style="flex:${(s.t1 - s.t0).toFixed(1)}"><b>${x.esc(s.name)}</b></span>`).join('')}</div>
            <div class="pfo-vo">${LINES.map((l) => `<i style="left:${pct(l.a)};width:${pct(l.b - l.a)}"></i>`).join('')}</div>
            <i class="pfo-ph"></i>
          </div>
        </div>
      </div>
      <div class="pfo-ft"><span class="pfo-ok">${x.OK}tsc passed</span><span class="pfo-ok">${x.OK}${FRAMES} frames at ${FPS} fps</span><code>npx remotion render Launch out/pocketsflow-launch.mp4</code></div>
    </div>`);
    const q = (s) => [...card.querySelectorAll(s)];
    const rows = q('.pfo-f'), sps = q('.pfo-sp'), oks = q('.pfo-st .qc-ok'), seqs = q('.pfo-seq span'), vos = q('.pfo-vo i');
    const film = mountFilm(card.querySelector('.pfo-film'));
    const $ = (s) => card.querySelector(s);
    const cmp = $('.pfo-cmp'), fr = $('.pfo-fr'), ph = $('.pfo-ph'), pv = $('.pfo-film'), ft = $('.pfo-ft'), sum = $('.pfo-sum');
    return {
      nodes: [say.n, card],
      marks: [[T.r, say.n], [T.card, card]],
      render(t) {
        renderSay(say, t, T.r + 0.05);
        cardIn(card, t, T.card, T.end);
        rows.forEach((n, i) => {
          const a = T.file[i];
          rise(n, seg(t, a, a + 0.25), 5);
          const d = t >= a + 0.3;
          sps[i].style.opacity = d ? '0' : '1';
          spin(sps[i], t, a);
          oks[i].style.opacity = d ? '1' : '0';
        });
        rise(sum, seg(t, T.built - 0.1, T.built + 0.2), 4);
        // each sequence lands on the timeline as its scene file is written (files 3.. are the six scenes)
        seqs.forEach((n, i) => { const p = outCubic(seg(t, T.file[i + 3], T.file[i + 3] + 0.3)); n.style.opacity = p.toFixed(3); n.style.transform = `scaleX(${lerp(0.6, 1, p).toFixed(3)})`; });
        vos.forEach((n, i) => { n.style.opacity = outCubic(seg(t, T.file[2] + i * 0.05, T.file[2] + 0.3 + i * 0.05)).toFixed(3); });
        // compiled: the preview scrubs the whole film once, the playhead riding the timeline
        const f = seg(t, T.scrub[0], T.scrub[1]);
        const ftm = lerp(SHOTS[0].key, FILM_DUR - 0.05, f);
        film.set(t < T.built ? SHOTS[0].key : ftm);
        pv.style.filter = t < T.built ? `brightness(.45) blur(${(2 * (1 - seg(t, T.card, T.built))).toFixed(2)}px)` : 'none';
        cmp.style.opacity = t < T.built ? '1' : '0';
        setText(fr, t < T.built ? `frame 0 / ${FRAMES}` : `frame ${Math.round(ftm * FPS)} / ${FRAMES}`);
        ph.style.opacity = t >= T.scrub[0] ? '1' : '0';
        ph.style.left = `${(f * 100).toFixed(2)}%`;
        rise(ft, seg(t, T.scrub[1] - 0.4, T.scrub[1]), 4);
      },
    };
  },
};
