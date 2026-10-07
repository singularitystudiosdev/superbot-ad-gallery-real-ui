// Beat 6, Superbot: renders LaunchFilm.tsx and premieres it. Canvas: the render (the frame counter climbing while the
// encoder's frames flash past in the player, the output's specs underneath), then the pane opens to the full 16:9
// frame (theater) and pocketsflow-launch.mp4 plays from the checkout through the dashboard to the lockup, with the
// player chrome showing for a beat and then getting out of the way. theater(t) tells chat.js how far the pane is open.
import { seg, outCubic, inOutCubic, clamp, lerp } from '../../../lib.js';
import { mountFilm, FILM_W } from '../../../film/film.js';
import { sayNode, renderSay, toolsNode, renderTools, fileNode, renderPop } from './kit.js';

const FRAMES = 450, DOCK_W = 732, F0 = 9.35;
const SPECS = [['Codec', 'H.264'], ['Size', '1920x1080'], ['FPS', '30'], ['Audio', 'AAC 320k'], ['File', '11.8 MB']];
const STRIP = [0.9, 3.4, 5.9, 7.0, 9.6, 11.6, 12.4, 14.4]; // the encoder's contact sheet, one frame per 56 rendered
const clock = (s) => `0:${String(Math.floor(clamp(s, 0, 15))).padStart(2, '0')}`;

export default {
  times(r, o) {
    return { r, rn: r + 0.15, rnDone: r + 1.35, file: r + 1.45, open: r + 1.5, opened: r + 2.15, v0: r + 1.95, end: r + o.span };
  },
  build(k, x) {
    const T = k.T;
    const say = sayNode(x, 'Rendered. Here is your launch film.');
    const rows = [{ run: 'Rendering 450 frames', done: 'Rendered in 38s', count: '1080p' }];
    const tools = toolsNode(x, rows);
    const file = fileNode(x, 'superbot', 'pocketsflow-launch.mp4', '15s, 1080p, 30 fps, 11.8 MB');
    const page = x.el(`<div class="pm">
  <div class="pm-pl"><div class="pm-film"></div>
    <div class="pm-rn"><b class="pm-rf">Frame 0 / ${FRAMES}</b><i><b></b></i><span class="pm-rp">0%</span></div>
    <div class="pm-ch"><span class="pm-pp"><i></i></span><b>pocketsflow-launch.mp4</b><span class="pm-tc">0:09 / 0:15</span><i class="pm-sc"><b></b></i></div>
  </div>
  <div class="pm-specs">${SPECS.map(([a, b]) => `<span><em>${a}</em>${b}</span>`).join('')}</div>
  <div class="pm-strip">${STRIP.map((s) => `<div class="pm-cell"><div class="pm-cf"></div><span>${Math.round(s * 30)}</span></div>`).join('')}</div>
</div>`);
    const film = mountFilm(page.querySelector('.pm-film'), DOCK_W);
    const rn = page.querySelector('.pm-rn'), rf = page.querySelector('.pm-rf'), rbar = rn.querySelector('i b'), rp = page.querySelector('.pm-rp');
    const ch = page.querySelector('.pm-ch'), tc = page.querySelector('.pm-tc'), sc = page.querySelector('.pm-sc b');
    const specs = page.querySelector('.pm-specs'), strip = page.querySelector('.pm-strip');
    const cells = [...page.querySelectorAll('.pm-cell')];
    const thumbs = cells.map((c) => mountFilm(c.querySelector('.pm-cf'), 84));
    const theater = (t) => inOutCubic(seg(t, T.open, T.opened));
    let lastW = DOCK_W;

    return {
      nodes: [say, tools, file],
      marks: [[T.rn, tools], [T.file, file]],
      page, file: { name: 'pocketsflow-launch.mp4', by: `${x.tile('superbot')}Superbot` },
      theater,
      render(t) {
        renderSay(say, t, T.r + 0.05, 70);
        renderTools(tools, t, rows, [[T.rn, T.rnDone]]);
        renderPop(file, t, T.file);
        if (t < T.r - 0.6) return;
        const th = theater(t);
        const w = lerp(DOCK_W, FILM_W, th);
        if (Math.abs(w - lastW) > 0.01) { film.fit(w); lastW = w; }
        // rendering: frames flash past in render order while the counter climbs, then the film holds on its first
        // played frame until the pane has opened
        const rp01 = clamp(seg(t, T.rn, T.rnDone));
        const ft = t < T.rnDone ? rp01 * 15 : (t < T.v0 ? F0 : clamp(F0 + (t - T.v0), 0, 15));
        film.render(ft);
        rf.textContent = `Frame ${Math.round(rp01 * FRAMES)} / ${FRAMES}`;
        rbar.style.transform = `scaleX(${rp01.toFixed(3)})`;
        rp.textContent = `${Math.round(rp01 * 100)}%`;
        rn.style.opacity = (seg(t, T.r, T.r + 0.2) * (1 - seg(t, T.rnDone + 0.05, T.rnDone + 0.3))).toFixed(3);
        specs.style.opacity = (seg(t, T.r + 0.15, T.r + 0.45) * (1 - seg(th, 0, 0.4))).toFixed(3);
        strip.style.opacity = (1 - seg(th, 0, 0.4)).toFixed(3);
        cells.forEach((c, i) => { thumbs[i].render(STRIP[i]); c.classList.toggle('on', rp01 >= STRIP[i] / 15); });
        const chrome = seg(t, T.opened - 0.2, T.opened + 0.1) * (1 - seg(t, T.v0 + 1.3, T.v0 + 1.7));
        ch.style.opacity = chrome.toFixed(3);
        ch.style.transform = `translateY(${((1 - outCubic(seg(t, T.opened - 0.2, T.opened + 0.2))) * 12).toFixed(2)}px)`;
        tc.textContent = `${clock(ft)} / 0:15`;
        sc.style.transform = `scaleX(${(ft / 15).toFixed(4)})`;
        page.classList.toggle('pm-th', th > 0.5);
      },
    };
  },
};
