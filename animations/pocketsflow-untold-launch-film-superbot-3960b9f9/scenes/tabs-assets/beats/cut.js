// Beat 5, Claude Opus 5.5: cuts the film together in Remotion. Canvas: LaunchFilm.tsx being written (real Remotion
// API: AbsoluteFill, Sequence, OffthreadVideo, Audio, staticFile, useVideoConfig), the Studio preview playing the
// dashboard shot beside it, and the Studio timeline underneath: one <Sequence> per Kling shot, the ElevenLabs mix on
// its own track, and each cut sliding onto the nearest beat of the 112 BPM score.
import { seg, outCubic, inOutCubic, clamp } from '../../../lib.js';
import { mountFilm, SHOTS, SHOT_NAMES } from '../../../film/film.js';
import { sayNode, renderSay, toolsNode, renderTools, fileNode, renderPop } from './kit.js';

// one line per entry, pre-tokenised: [class, text] pairs (k keyword, s string, f function, n number, t tag, a attr, c comment, p plain)
const CODE = [
  [['k', 'import'], ['p', ' {AbsoluteFill, Audio, OffthreadVideo,']],
  [['p', '  Sequence, staticFile, useVideoConfig} '], ['k', 'from'], ['s', " 'remotion'"], ['p', ';']],
  [],
  [['c', '// six Kling shots, cut times from launch-brief.md']],
  [['k', 'const'], ['p', ' SHOTS = ['], ['s', "'hook'"], ['p', ', '], ['s', "'upload'"], ['p', ', '], ['s', "'share'"], ['p', ',']],
  [['p', '  '], ['s', "'checkout'"], ['p', ', '], ['s', "'dashboard'"], ['p', ', '], ['s', "'lockup'"], ['p', '];']],
  [['k', 'const'], ['p', ' CUTS = ['], ['n', '0'], ['p', ', '], ['n', '2.4'], ['p', ', '], ['n', '5.0'], ['p', ', '], ['n', '7.6'], ['p', ', '], ['n', '10.2'], ['p', ', '], ['n', '12.8'], ['p', ', '], ['n', '15'], ['p', '];']],
  [['k', 'const'], ['p', ' BEAT = ('], ['n', '60'], ['p', ' / '], ['n', '112'], ['p', ') * '], ['n', '30'], ['p', ';'], ['c', ' // score, in frames']],
  [['k', 'const'], ['f', ' snap'], ['p', ' = (f: '], ['k', 'number'], ['p', ') => Math.'], ['f', 'round'], ['p', '(f / BEAT) * BEAT;']],
  [],
  [['k', 'export const'], ['f', ' LaunchFilm'], ['p', ': React.FC = () => {']],
  [['p', '  '], ['k', 'const'], ['p', ' {fps} = '], ['f', 'useVideoConfig'], ['p', '();']],
  [['p', '  '], ['k', 'const'], ['f', ' at'], ['p', ' = (i: '], ['k', 'number'], ['p', ') => '], ['f', 'snap'], ['p', '(CUTS[i] * fps);']],
  [['p', '  '], ['k', 'return'], ['p', ' (']],
  [['p', '    <'], ['t', 'AbsoluteFill'], ['a', ' style'], ['p', '={{background: '], ['s', "'#fff'"], ['p', '}}>']],
  [['p', '      {SHOTS.'], ['f', 'map'], ['p', '((name, i) => (']],
  [['p', '        <'], ['t', 'Sequence'], ['a', ' key'], ['p', '={name}'], ['a', ' from'], ['p', '={'], ['f', 'at'], ['p', '(i)}']],
  [['a', '          durationInFrames'], ['p', '={'], ['f', 'at'], ['p', '(i + '], ['n', '1'], ['p', ') - '], ['f', 'at'], ['p', '(i)}>']],
  [['p', '          <'], ['t', 'OffthreadVideo'], ['a', ' src'], ['p', '={'], ['f', 'staticFile'], ['p', '(`shots/${name}.mp4`)} />']],
  [['p', '        </'], ['t', 'Sequence'], ['p', '>']],
  [['p', '      ))}']],
  [['p', '      <'], ['t', 'Audio'], ['a', ' src'], ['p', '={'], ['f', 'staticFile'], ['p', '('], ['s', "'launch-mix.wav'"], ['p', ')} />']],
  [['p', '    </'], ['t', 'AbsoluteFill'], ['p', '>']],
  [['p', '  );']],
  [['p', '};']],
];
const BEAT = 60 / 112;
const snapS = (s) => Math.round(s / BEAT) * BEAT;
const pct = (s) => `${((s / 15) * 100).toFixed(3)}%`;
const HUES = ['#3a4a7a', '#2f5d5a', '#5a4a2f', '#5a2f4a', '#2f4a5d', '#3a3a44'];

export default {
  times(r, o) {
    return { r, code: r + 0.1, line: 0.052, wr: r + 0.15, wrDone: r + 1.5, sn: r + 1.55, snDone: r + 2.45, file: r + 2.6, play: r + 1.45, end: r + o.span };
  },
  build(k, x) {
    const T = k.T;
    const say = sayNode(x, 'Cut it together in Remotion: six sequences on the score, the mix underneath.');
    const rows = [{ run: 'Writing LaunchFilm.tsx', done: 'LaunchFilm.tsx, 25 lines', count: 'Remotion' }, { run: 'Snapping cuts to the beat', done: '6 cuts on the beat' }];
    const tools = toolsNode(x, rows);
    const file = fileNode(x, 'opus', 'LaunchFilm.tsx', '1920x1080, 30 fps, 450 frames');
    const cuts = SHOTS.slice(1, -1);
    const page = x.el(`<div class="ct">
  <div class="ct-top">
    <div class="ct-ed"><div class="ct-tabs"><span class="on">LaunchFilm.tsx</span><span>Root.tsx</span><span>beats.ts</span></div>
      <div class="ct-code">${CODE.map((ln, i) => `<div class="ct-ln"><em>${i + 1}</em><code>${ln.map(([c, s]) => `<span class="ct-${c}">${x.esc(s)}</span>`).join('')}</code></div>`).join('')}<i class="ct-caret"></i></div></div>
    <div class="ct-st"><div class="ct-sh"><b>Remotion Studio</b><span>LaunchFilm</span></div><div class="ct-film"></div>
      <div class="ct-props"><span><em>Size</em>1920x1080</span><span><em>FPS</em>30</span><span><em>Frames</em>450</span><span><em>Frame</em><b class="ct-fr">0</b></span></div></div>
  </div>
  <div class="ct-tl">
    <div class="ct-row ct-ru"><span class="ct-lab"></span><div class="ct-lane">${Array.from({ length: Math.floor(15 / BEAT) + 1 }, (_, i) => `<i class="${i % 4 ? '' : 'ct-b4'}" style="left:${pct(i * BEAT)}"></i>`).join('')}</div></div>
    <div class="ct-row"><span class="ct-lab">Video</span><div class="ct-lane">${SHOT_NAMES.map((n, i) => `<span class="ct-seq" style="background:${HUES[i]}"><b>&lt;Sequence&gt;</b>${n}</span>`).join('')}${cuts.map(() => '<i class="ct-cut"></i>').join('')}</div></div>
    <div class="ct-row"><span class="ct-lab">Audio</span><div class="ct-lane"><span class="ct-au"><b>&lt;Audio&gt;</b>launch-mix.wav</span></div></div>
    <div class="ct-pl"></div>
  </div>
</div>`);
    const film = mountFilm(page.querySelector('.ct-film'), 318);
    const lines = [...page.querySelectorAll('.ct-ln')];
    const caret = page.querySelector('.ct-caret');
    const seqs = [...page.querySelectorAll('.ct-seq')], cutEls = [...page.querySelectorAll('.ct-cut')];
    const fr = page.querySelector('.ct-fr'), pl = page.querySelector('.ct-pl');

    return {
      nodes: [say, tools, file],
      marks: [[T.wr, tools], [T.file, file]],
      page, file: { name: 'LaunchFilm.tsx', by: `${x.tile('opus')}Claude Opus 5.5` },
      render(t) {
        renderSay(say, t, T.r + 0.05, 80);
        renderTools(tools, t, rows, [[T.wr, T.wrDone], [T.sn, T.snDone]]);
        renderPop(file, t, T.file);
        if (t < T.r - 0.6) return;
        let lastOn = -1;
        lines.forEach((l, i) => { const a = T.code + i * T.line, p = seg(t, a, a + 0.12); l.style.opacity = p.toFixed(3); if (p > 0) lastOn = i; });
        const ln = lines[Math.max(0, lastOn)];
        caret.style.top = `${(ln.offsetTop + 2).toFixed(1)}px`;
        caret.style.left = `${(ln.offsetLeft + ln.offsetWidth + 2).toFixed(1)}px`;
        caret.style.opacity = t < T.code + CODE.length * T.line + 0.3 ? (Math.sin(t * 18) > -0.3 ? '1' : '0') : '0';
        const ft = t < T.play ? 10.35 : clamp(10.35 + (t - T.play), 0, 15);
        film.render(ft);
        fr.textContent = String(Math.round(ft * 30));
        pl.style.left = `calc(56px + (100% - 56px - 10px) * ${(ft / 15).toFixed(4)})`;
        pl.style.opacity = seg(t, T.play - 0.3, T.play).toFixed(3);
        // the cuts slide from their script times onto the nearest beat
        const sn = inOutCubic(seg(t, T.sn + 0.1, T.sn + 0.8));
        const at = SHOTS.map((s, i) => (i === 0 || i === SHOTS.length - 1 ? s : s + (snapS(s) - s) * sn));
        seqs.forEach((s, i) => {
          const p = outCubic(seg(t, T.code + (16 + i * 0.5) * T.line, T.code + (16 + i * 0.5) * T.line + 0.35));
          s.style.left = pct(at[i]); s.style.width = `calc(${pct(at[i + 1] - at[i])} - 2px)`;
          s.style.opacity = p.toFixed(3); s.style.transform = p >= 1 ? 'none' : `scaleX(${(0.6 + 0.4 * p).toFixed(3)})`;
        });
        cutEls.forEach((c, i) => {
          c.style.left = pct(at[i + 1]);
          const flash = seg(t, T.sn + 0.8 + i * 0.04, T.sn + 1.1 + i * 0.04);
          c.style.opacity = (seg(t, T.sn, T.sn + 0.2) * (flash > 0 && flash < 1 ? 1 : 0.75)).toFixed(3);
          c.classList.toggle('snap', sn >= 1);
        });
        page.querySelector('.ct-au').style.clipPath = `inset(0 ${((1 - outCubic(seg(t, T.code + 22 * T.line, T.code + 22 * T.line + 0.5))) * 100).toFixed(1)}% 0 0)`;
      },
    };
  },
};
