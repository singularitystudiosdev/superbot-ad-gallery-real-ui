// Beat 3, Kling 3.0: animates each approved style frame into its shot. Canvas: the shot player opens on shot 03
// (Share) with the motion plan drawn over it, the moves the script asked for (the phone rising, the page scrolling,
// the tap on Buy now and the push into checkout), while the six image-to-video jobs render in the strip below; then the
// overlay clears and the shot plays for real, straight through the Buy now push into the checkout.
import { seg, outCubic, inOutCubic, clamp } from '../../../lib.js';
import { mountFilm, KEY_FRAMES, SHOT_NAMES, SHOTS } from '../../../film/film.js';
import { sayNode, renderSay, toolsNode, renderTools, fileNode, renderPop } from './kit.js';

const HOLD = 6.9;                // the frame the motion plan is drawn on (shot 03, page scrolled to Buy now)
// motion plan, in film px (1280x720): [svg path, label, label x, label y, right-aligned]
const PLAN = [
  ['M64 222 L64 468', 'Words rise, 70ms apart', 64, 132],
  ['M1126 600 C1146 530 1146 450 1126 380', 'Scroll 150px', 1262, 614, true],
  ['M916 524 m-54 0 a54 54 0 1 0 108 0 a54 54 0 1 0 -108 0', 'Tap Buy now', 650, 508, true],
  ['M670 388 H1162 V660 H670 Z', 'Push in 2.6x to checkout', 670, 352],
];
const CLIP = [2.4, 2.6, 2.6, 2.6, 2.6, 2.2];
const fmt = (s) => `0:${String(Math.floor(s)).padStart(2, '0')}.${String(Math.floor((s % 1) * 10))}`;

export default {
  times(r, o) {
    return { r, run: r + 0.2, job0: r + 0.25, jobStep: 0.17, jobDur: 1.2, v0: r + 1.62, runDone: r + 2.45, file: r + 2.6, end: r + o.span };
  },
  build(k, x) {
    const T = k.T;
    const say = sayNode(x, 'Animated every frame into its shot, with the camera moves the script calls for.');
    const rows = [{ run: 'Animating 6 shots', done: '6 shots, 15.0s, 24 fps', count: '1080p, 24 fps' }];
    const tools = toolsNode(x, rows);
    const file = fileNode(x, 'kling', 'shots/', '6 clips, image to video');
    const page = x.el(`<div class="kl">
  <div class="kl-pl"><div class="kl-film"></div>
    <svg class="kl-plan" viewBox="0 0 1280 720">${PLAN.map(([d]) => `<path pathLength="1" d="${d}"/>`).join('')}<defs><marker id="kl-ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs></svg>
    ${PLAN.map(([, l, lx, ly, ra]) => `<span class="kl-tag${ra ? ' kl-tag-r' : ''}" style="left:${(lx / 12.8).toFixed(2)}%;top:${(ly / 7.2).toFixed(2)}%">${l}</span>`).join('')}
    <span class="kl-mode"><i></i><b class="kl-mode-t">Motion plan</b></span>
    <div class="kl-bar"><b class="kl-tc">0:05.7</b><div class="kl-sc">${SHOTS.slice(0, -1).map((a, i) => `<i style="flex:${(SHOTS[i + 1] - a).toFixed(2)}"></i>`).join('')}<em class="kl-ph"></em></div><span class="kl-dur">0:15.0</span></div>
  </div>
  <div class="kl-meta"><span>${x.tile('kling')}Kling 3.0</span><span>Image to video</span><span>1080p</span><span>24 fps</span><span>Camera from script</span><span class="kl-src">style-frames/</span></div>
  <div class="kl-strip">${SHOT_NAMES.map((n, i) => `<div class="kl-j"><div class="kl-jf"><div class="kl-jfilm"></div><i class="kl-jbar"><b></b></i><span class="kl-jd">${CLIP[i].toFixed(1)}s</span></div><span class="kl-jl"><b>0${i + 1}</b>${n}</span></div>`).join('')}</div>
</div>`);
    const film = mountFilm(page.querySelector('.kl-film'), 728);
    const jobs = [...page.querySelectorAll('.kl-j')];
    const thumbs = jobs.map((j) => mountFilm(j.querySelector('.kl-jfilm'), 113));
    const paths = [...page.querySelectorAll('.kl-plan path')].slice(0, PLAN.length);
    const tags = [...page.querySelectorAll('.kl-tag')];
    const plan = page.querySelector('.kl-plan'), mode = page.querySelector('.kl-mode'), modeT = page.querySelector('.kl-mode-t');
    const tc = page.querySelector('.kl-tc'), ph = page.querySelector('.kl-ph');
    paths[1].setAttribute('marker-end', 'url(#kl-ar)');

    return {
      nodes: [say, tools, file],
      marks: [[T.run, tools], [T.file, file]],
      page, file: { name: 'shots/03-share.mp4', by: `${x.tile('kling')}Kling 3.0` },
      render(t) {
        renderSay(say, t, T.r + 0.05, 80);
        renderTools(tools, t, rows, [[T.run, T.runDone]]);
        renderPop(file, t, T.file);
        if (t < T.r - 0.6) return;
        const ft = t < T.v0 ? HOLD : clamp(HOLD + (t - T.v0), 0, 15);
        film.render(ft);
        tc.textContent = fmt(ft);
        ph.style.left = `${((ft / 15) * 100).toFixed(2)}%`;
        const draw = (i) => outCubic(seg(t, T.r + 0.2 + i * 0.22, T.r + 0.75 + i * 0.22));
        const clear = 1 - seg(t, T.v0 - 0.25, T.v0 + 0.05);
        paths.forEach((p, i) => { p.style.strokeDashoffset = (1 - draw(i)).toFixed(3); });
        plan.style.opacity = clear.toFixed(3);
        tags.forEach((g, i) => { const p = seg(t, T.r + 0.5 + i * 0.22, T.r + 0.8 + i * 0.22); g.style.opacity = (p * clear).toFixed(3); g.style.transform = `translate(${g.classList.contains('kl-tag-r') ? '-100%' : '0'}, ${((1 - p) * 6).toFixed(2)}px)`; });
        const playing = t >= T.v0;
        mode.classList.toggle('play', playing);
        const label = playing ? 'Playing shot 03 to 04' : 'Motion plan';
        if (modeT.textContent !== label) modeT.textContent = label;
        jobs.forEach((j, i) => {
          thumbs[i].render(KEY_FRAMES[i]);
          const a = T.job0 + i * T.jobStep, p = inOutCubic(seg(t, a, a + T.jobDur));
          j.querySelector('.kl-jbar b').style.transform = `scaleX(${p.toFixed(3)})`;
          j.classList.toggle('done', p >= 1);
          j.classList.toggle('live', playing && ((i === 2 && ft < 7.6) || (i === 3 && ft >= 7.6)));
          j.querySelector('.kl-jfilm').style.opacity = (0.35 + 0.65 * p).toFixed(3);
        });
      },
    };
  },
};
