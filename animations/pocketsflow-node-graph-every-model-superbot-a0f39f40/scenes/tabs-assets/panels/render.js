// Node 6, Superbot: every upstream output lands on one timeline, laid out on the film's own shot list, and the cut
// renders. The monitor plays the film at the playhead (scenes/film.js), the same film that then fills the frame.
import { VO, NBP } from '../gen-data.js';
import { el, gen, tile } from './kit.js';
import { mountFilm, fitFilm, renderFilm, FILM_DUR, FILM_VO_AT } from '../../film.js';
import { clamp, seg, outCubic, inOutCubic } from '../../../lib.js';

const pct = (t) => `${((t / FILM_DUR) * 100).toFixed(3)}%`;
const clip = (a, b, cls, inner, app) => `<div class="rn-clip ${cls}" style="left:${pct(a)};width:${pct(b - a)}">${tile(app, 'rn-ct')}${inner}</div>`;
const TRACKS = [
  { name: 'V1 Stills', app: 'nbp', clips: [[0, 2.05, 'studio'], [3.3, 5.05, 'flatlay'], [5.05, 6.0, 'notify'], [6.0, 6.75, 'street']].map(([a, b, k]) => clip(a, b, 'rn-img', `<img src="${gen(k + '-sm.jpg')}" alt=""/>`, 'nbp')) },
  { name: 'V2 UI', app: 'opus', clips: [clip(2.05, 3.3, 'rn-ui', '<span>BuyPage.tsx</span>', 'opus')] },
  { name: 'V3 3D', app: 'blender', clips: [clip(6.75, FILM_DUR, 'rn-3d', `<img src="${gen('blender/cycles-hero.webp')}" alt=""/>`, 'blender')] },
  { name: 'T1 Titles', app: 'deepseek', clips: [[0.3, 2.02, '4.7% + $0.30'], [3.32, 5.02, 'No monthly fees'], [5.45, 6.72, 'Pay when you sell']].map(([a, b, s]) => clip(a, b, 'rn-txt', `<span>${s}</span>`, 'deepseek')) },
  { name: 'A1 VO', app: 'eleven', clips: [clip(FILM_VO_AT, FILM_VO_AT + VO.dur, 'rn-vo', `<span class="rn-wv">${VO.peaks.filter((_, i) => i % 2 === 0).map((v) => `<i style="height:${Math.max(8, v * 100).toFixed(0)}%"></i>`).join('')}</span>`, 'eleven')] },
];
const SCRUB0 = 0.85, SCRUB1 = 2.45; // the render pass, in panel seconds

export const render = {
  key: 'render',
  head: 'pocketsflow-launch.mp4',
  meta: `1920×1080 · 30 fps · H.264 · ${FILM_DUR.toFixed(1)}s`,
  done: `${FILM_DUR.toFixed(1)}s film`,
  thumb: () => `<div class="fg-thumb rn-th"><img src="${gen('studio-sm.jpg')}" alt=""/></div>`,
  mount(body) {
    body.classList.add('rn');
    body.append(el(`<div class="rn-top">
      <div class="rn-mon"><div class="rn-film"></div><span class="rn-tc">00:00:00</span></div>
      <div class="rn-job">
        <div class="rn-file"><b>pocketsflow-launch.mp4</b><small>1920×1080 · 30 fps · H.264 · ${FILM_DUR.toFixed(1)} s</small></div>
        <div class="rn-ins">
          <span>${tile('opus')}BuyPage.tsx<em>2 states</em></span>
          <span>${tile('nbp')}Nano Banana Pro<em>${NBP.length} stills</em></span>
          <span>${tile('blender')}Cycles turntable<em>36 frames</em></span>
          <span>${tile('deepseek')}fees.json + script<em>3 titles</em></span>
          <span>${tile('eleven')}vo.mp3<em>${VO.dur.toFixed(1)} s</em></span>
        </div>
        <div class="rn-prog"><i></i></div><div class="rn-st"><span>Rendering</span><em>0%</em></div>
      </div>
    </div>`), el(`<div class="rn-tl">
      <div class="rn-ruler">${Array.from({ length: 9 }, (_, i) => `<span style="left:${pct(i)}">0:0${i}</span>`).join('')}</div>
      ${TRACKS.map((tr) => `<div class="rn-tr"><b>${tr.name}</b><div class="rn-lane">${tr.clips.join('')}</div></div>`).join('')}
      <div class="rn-ph"></div>
    </div>`));
    const q = (sel) => body.querySelector(sel);
    const film = mountFilm(q('.rn-film'));
    return {
      film, mon: q('.rn-mon'), filmBox: q('.rn-film'), tc: q('.rn-tc'), lanes: [...body.querySelectorAll('.rn-tr')],
      ph: q('.rn-ph'), bar: q('.rn-prog i'), st: q('.rn-st span'), pc: q('.rn-st em'), ins: [...body.querySelectorAll('.rn-ins span')],
    };
  },
  render(s, p) {
    fitFilm(s.film, s.filmBox.offsetWidth || 400);
    s.lanes.forEach((l, i) => {
      const a = outCubic(seg(p, 0.05 + i * 0.12, 0.45 + i * 0.12));
      l.style.opacity = a.toFixed(3);
      l.lastElementChild.style.transform = `translateX(${((1 - a) * 40).toFixed(2)}px)`;
    });
    s.ins.forEach((n, i) => { n.style.opacity = outCubic(seg(p, 0.1 + i * 0.1, 0.4 + i * 0.1)).toFixed(3); });
    const r = inOutCubic(seg(p, SCRUB0, SCRUB1));
    const ft = r * FILM_DUR;
    // rendered: the monitor cues back to the first frame, ready to play
    renderFilm(s.film, p >= SCRUB1 + 0.15 ? 0 : ft);
    s.mon.classList.toggle('rn-cued', p >= SCRUB1 + 0.15);
    s.ph.style.left = `calc(72px + (100% - 80px) * ${(ft / FILM_DUR).toFixed(4)})`;
    s.ph.style.opacity = seg(p, SCRUB0 - 0.2, SCRUB0).toFixed(3);
    s.bar.style.transform = `scaleX(${r.toFixed(4)})`;
    const done = p >= SCRUB1;
    s.st.textContent = done ? 'Rendered' : 'Rendering';
    s.pc.textContent = done ? '✓ 100%' : `${Math.round(r * 100)}%`;
    s.mon.classList.toggle('rn-done', done);
    const fr = Math.floor(clamp(ft, 0, FILM_DUR) * 30);
    s.tc.textContent = `00:0${Math.floor(fr / 30)}:${String(fr % 30).padStart(2, '0')}`;
  },
};
