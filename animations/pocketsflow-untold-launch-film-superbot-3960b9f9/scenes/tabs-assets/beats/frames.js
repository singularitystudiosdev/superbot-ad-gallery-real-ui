// Beat 2, Nano Banana Pro: one style frame per shot of Gemini's script, generated on the brand board's palette and
// faces. Canvas: the prompt (it cites launch-brief.md), then six 16:9 frames resolving out of noise in a hero-plus-grid
// contact sheet, each labelled with its shot, and a consistency footer. The frames ARE the film (film/film.js held on
// each shot's key moment), so what Kling animates next is exactly what was approved here.
import { seg, outCubic, outQuint, clamp } from '../../../lib.js';
import { mountFilm, KEY_FRAMES, SHOT_NAMES } from '../../../film/film.js';
import { sayNode, renderSay, toolsNode, renderTools, fileNode, renderPop } from './kit.js';

const PROMPT = 'Six style frames for the Pocketsflow launch film, one per shot in launch-brief.md. Flat product UI on paper white, ink type, one blue accent #2563EB, Satoshi headlines, soft shadows.';
const CHECKS = ['Palette matches brand', 'Satoshi on every headline', 'PF mark on the lockup', 'Same product across shots'];
const SIZES = [484, 233, 233, 236, 236, 236];

export default {
  times(r, o) {
    return { r, gen: r + 0.2, frame0: r + 0.45, step: 0.27, dur: 1.55, genDone: r + 3.05, file: r + 3.2, end: r + o.span };
  },
  build(k, x) {
    const T = k.T;
    const say = sayNode(x, 'Six style frames, one per shot, on the brief’s palette and type.');
    const rows = [{ run: 'Generating 6 frames', done: '6 style frames, 16:9, 2K', count: '16:9, 2K' }];
    const tools = toolsNode(x, rows);
    const file = fileNode(x, 'nano', 'style-frames/', '6 frames, approved for motion');
    const page = x.el(`<div class="nb">
  <div class="nb-pr">${x.tile('nano')}<p><span class="nb-on"></span><span class="nb-off">${x.esc(PROMPT)}</span></p>
    <div class="nb-ps"><span>16:9</span><span>2K</span><span>6 images</span><span class="nb-ref">launch-brief.md</span></div></div>
  <div class="nb-grid">${SHOT_NAMES.map((n, i) => `<div class="nb-f nb-f${i}"><div class="nb-film"></div><i class="nb-noise"></i><i class="nb-scan"></i>
    <span class="nb-lb"><b>0${i + 1}</b>${n}</span><span class="nb-pc">0%</span><span class="nb-ok">${x.OK}</span></div>`).join('')}</div>
  <div class="nb-ft">${CHECKS.map((c) => `<span class="nb-ck">${x.OK}${c}</span>`).join('')}<span class="nb-seed">seed 4417</span></div>
</div>`);
    const cells = [...page.querySelectorAll('.nb-f')];
    const films = cells.map((c, i) => mountFilm(c.querySelector('.nb-film'), SIZES[i]));
    const on = page.querySelector('.nb-on'), off = page.querySelector('.nb-off');
    const checks = [...page.querySelectorAll('.nb-ck')];
    let typed = -1;

    return {
      nodes: [say, tools, file],
      marks: [[T.gen, tools], [T.file, file]],
      page, file: { name: 'style-frames/', by: `${x.tile('nano')}Nano Banana Pro` },
      render(t) {
        renderSay(say, t, T.r + 0.05, 80);
        renderTools(tools, t, rows, [[T.gen, T.genDone]]);
        renderPop(file, t, T.file);
        const n = clamp(Math.floor((t - T.r) * 190), 0, PROMPT.length);
        if (n !== typed) { typed = n; on.textContent = PROMPT.slice(0, n); off.textContent = PROMPT.slice(n); }
        cells.forEach((c, i) => {
          if (t < T.r - 0.5) return;
          films[i].render(KEY_FRAMES[i]);
          const a = T.frame0 + i * T.step, p = seg(t, a, a + T.dur), e = outCubic(p);
          const film = c.firstElementChild;
          film.style.filter = p >= 1 ? 'none' : `blur(${((1 - e) * 16).toFixed(2)}px) saturate(${(0.3 + 0.7 * e).toFixed(3)})`;
          film.style.transform = p >= 1 ? 'none' : `scale(${(1.06 - 0.06 * e).toFixed(4)})`;
          c.querySelector('.nb-noise').style.opacity = (t < a ? 1 : 1 - outQuint(p)).toFixed(3);
          const scan = c.querySelector('.nb-scan');
          scan.style.opacity = p > 0 && p < 1 ? '1' : '0';
          scan.style.transform = `translateY(${(e * 100).toFixed(1)}%)`;
          const pc = c.querySelector('.nb-pc');
          pc.textContent = `${Math.round(p * 100)}%`;
          pc.style.opacity = p > 0 && p < 1 ? '1' : '0';
          const ok = seg(t, a + T.dur, a + T.dur + 0.25);
          c.querySelector('.nb-ok').style.opacity = ok.toFixed(3);
          c.classList.toggle('done', p >= 1);
        });
        checks.forEach((ck, i) => { const p = outQuint(seg(t, T.genDone + 0.05 + i * 0.12, T.genDone + 0.45 + i * 0.12)); ck.style.opacity = (0.25 + 0.75 * p).toFixed(3); ck.classList.toggle('on', p > 0.5); });
      },
    };
  },
};
