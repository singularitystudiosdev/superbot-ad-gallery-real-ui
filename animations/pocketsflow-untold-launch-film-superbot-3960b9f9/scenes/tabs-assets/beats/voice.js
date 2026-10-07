// Beat 4, ElevenLabs: voices Gemini's script (Eleven v3) and scores the cut (Eleven Music), with sound effects on
// the film's own actions. Canvas: a mixer. A preview monitor and the two generation settings on top; underneath, the
// 15 s timeline ruled by the six shots: the VO clips with their words, the music bed on its 112 BPM grid, the SFX hits
// pinned to the moments they sound on (the Publish click, the Buy now tap, the Paid chime). Then the playhead runs
// through the checkout line word by word, the caption under the monitor following it.
import { seg, outCubic, outBack, clamp } from '../../../lib.js';
import { mountFilm, SHOTS, SHOT_NAMES } from '../../../film/film.js';
import { sayNode, renderSay, toolsNode, renderTools, fileNode, renderPop } from './kit.js';

export const VO = [
  [0.3, 1.9, 'Got something to sell?'],
  [2.6, 4.6, 'Name it, price it, add the files.'],
  [5.2, 7.3, 'Share one link with everything you sell.'],
  [7.8, 10.0, 'Buyers pay in their own currency. We handle the tax.'],
  [10.5, 11.9, 'You watch it flow.'],
  [12.9, 14.8, 'Pocketsflow. The payment infrastructure that you deserve.'],
];
export const SFX = [[0.85, 'pop'], [2.3, 'whoosh'], [4.7, 'click'], [6.0, 'copy'], [7.3, 'tap'], [9.55, 'chime'], [10.95, 'ding'], [12.8, 'hit']];
const BPM = 112, BEAT = 60 / BPM;
const P0 = 8.5;                  // where the playhead starts: the checkout line
const pct = (s) => `${((s / 15) * 100).toFixed(3)}%`;
const hash = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };

// a filled waveform as an SVG path over [0, w] x [0, h], amplitude from amp(u) with u in 0..1
function wave(w, h, n, amp, seed) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = amp(u) * (0.35 + 0.65 * hash(i + seed)) * h * 0.5;
    top.push(`${(u * w).toFixed(1)} ${(h / 2 - a).toFixed(1)}`);
    bot.push(`${(u * w).toFixed(1)} ${(h / 2 + a).toFixed(1)}`);
  }
  return `M${top.join(' L')} L${bot.reverse().join(' L')} Z`;
}
/** words of VO line i with their [start, end] spread across the clip */
export function words(i) {
  const [a, b, s] = VO[i], w = s.split(' '), d = (b - a) / w.length;
  return w.map((x, j) => [a + j * d, a + (j + 1) * d, x]);
}

export default {
  times(r, o) {
    return { r, vo: r + 0.18, voDone: r + 1.55, mu: r + 0.55, muDone: r + 2.4, file: r + 2.55, play: r + 2.2, end: r + o.span };
  },
  build(k, x) {
    const T = k.T;
    const say = sayNode(x, 'Voiced the script and scored it, with a hit on every cut.');
    const rows = [
      { run: 'Voicing the script', done: 'Voiceover, 39 words, Eleven v3', count: 'Eleven v3' },
      { run: 'Scoring at 112 BPM', done: 'Score and 8 SFX, on the cuts', count: 'Eleven Music' },
    ];
    const tools = toolsNode(x, rows);
    const file = fileNode(x, 'eleven', 'launch-mix.wav', 'VO, score, SFX, -14 LUFS');
    const beats = Array.from({ length: Math.floor(15 / BEAT) }, (_, i) => i * BEAT);
    const page = x.el(`<div class="vx">
  <div class="vx-top">
    <div class="vx-mon"><div class="vx-film"></div><p class="vx-cap"></p></div>
    <div class="vx-gen">
      <div class="vx-card"><div class="vx-ch">${x.tile('eleven')}<b>Voice</b><span>Eleven v3</span></div>
        <p class="vx-desc">Warm, mid thirties, conversational. Smiles on the last line.</p>
        ${[['Stability', 0.46], ['Similarity', 0.82], ['Style', 0.3]].map(([n, v]) => `<div class="vx-sl"><span>${n}</span><i><b data-v="${v}"></b></i><em>${v.toFixed(2)}</em></div>`).join('')}</div>
      <div class="vx-card"><div class="vx-ch">${x.tile('eleven')}<b>Music</b><span>Eleven Music</span></div>
        <p class="vx-desc">Bright minimal synth pop, plucked bass, claps on two and four. 112 BPM, F major, 15 s, a hit on every cut.</p></div>
    </div>
  </div>
  <div class="vx-tl">
    <div class="vx-ruler"><span class="vx-lab"></span><div class="vx-lane">${SHOTS.slice(0, -1).map((a, i) => `<span class="vx-shot" style="left:${pct(a)};width:${pct(SHOTS[i + 1] - a)}">0${i + 1} ${SHOT_NAMES[i]}</span>`).join('')}${[0, 3, 6, 9, 12, 15].map((s) => `<i class="vx-tick" style="left:${pct(s)}">${s}s</i>`).join('')}</div></div>
    <div class="vx-tr vx-tr-vo"><span class="vx-lab">VO</span><div class="vx-lane">${VO.map(([a, b], i) => `<div class="vx-clip" style="left:${pct(a)};width:${pct(b - a)}"><svg viewBox="0 0 100 30" preserveAspectRatio="none"><path d="${wave(100, 30, 40, (u) => Math.sin(Math.PI * u) ** 0.35, i * 50)}"/></svg><span class="vx-w">${words(i).map(([, , w]) => `<i>${x.esc(w)}</i>`).join(' ')}</span></div>`).join('')}</div></div>
    <div class="vx-tr vx-tr-mu"><span class="vx-lab">Music</span><div class="vx-lane"><div class="vx-bed">${beats.map((b, i) => `<i class="vx-bt${i % 4 === 0 ? ' vx-bar' : ''}" style="left:${pct(b)}"></i>`).join('')}<svg viewBox="0 0 600 40" preserveAspectRatio="none"><path d="${wave(600, 40, 220, (u) => 0.55 + 0.35 * Math.abs(Math.sin(u * Math.PI * 28)) * (u > 0.85 ? 0.6 : 1), 900)}"/></svg></div></div></div>
    <div class="vx-tr vx-tr-fx"><span class="vx-lab">SFX</span><div class="vx-lane">${SFX.map(([a, n]) => `<span class="vx-fx" style="left:${pct(a)}"><i></i>${n}</span>`).join('')}</div></div>
    <div class="vx-ph"><b></b></div>
    <div class="vx-mtr"><i><b></b></i><i><b></b></i><span>-14.0<br/>LUFS</span></div>
  </div>
</div>`);
    const film = mountFilm(page.querySelector('.vx-film'), 336);
    const clips = [...page.querySelectorAll('.vx-clip')];
    const bed = page.querySelector('.vx-bed');
    const fx = [...page.querySelectorAll('.vx-fx')];
    const ph = page.querySelector('.vx-ph'), cap = page.querySelector('.vx-cap');
    const meters = [...page.querySelectorAll('.vx-mtr b')];
    const sl = [...page.querySelectorAll('.vx-sl b')];
    const W = VO.map((_, i) => words(i));
    let capKey = '';

    return {
      nodes: [say, tools, file],
      marks: [[T.vo, tools], [T.file, file]],
      page, file: { name: 'launch-mix.wav', by: `${x.tile('eleven')}ElevenLabs` },
      render(t) {
        renderSay(say, t, T.r + 0.05, 80);
        renderTools(tools, t, rows, [[T.vo, T.voDone], [T.mu, T.muDone]]);
        renderPop(file, t, T.file);
        if (t < T.r - 0.6) return;
        const ft = t < T.play ? P0 : clamp(P0 + (t - T.play), 0, 15);
        film.render(ft);
        sl.forEach((b, i) => { b.style.transform = `scaleX(${(+b.dataset.v * outCubic(seg(t, T.r + 0.2 + i * 0.1, T.r + 0.7 + i * 0.1))).toFixed(3)})`; });
        clips.forEach((c, i) => {
          const p = outCubic(seg(t, T.vo + i * 0.2, T.vo + 0.5 + i * 0.2));
          c.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(1)}% 0 0)`;
          c.querySelectorAll('.vx-w i').forEach((w, j) => { const [a, b] = W[i][j]; w.classList.toggle('on', t >= T.play && ft >= a && ft < b + 0.05); w.classList.toggle('past', t >= T.play && ft >= b); });
        });
        bed.style.clipPath = `inset(0 ${((1 - outCubic(seg(t, T.mu, T.mu + 1.6))) * 100).toFixed(1)}% 0 0)`;
        fx.forEach((f, i) => { const p = outBack(seg(t, T.mu + 1.2 + i * 0.07, T.mu + 1.45 + i * 0.07)); f.style.opacity = clamp(p).toFixed(3); f.style.transform = `translateX(-50%) scale(${(0.6 + 0.4 * p).toFixed(3)})`; });
        const shown = seg(t, T.play - 0.3, T.play);
        ph.style.opacity = shown.toFixed(3);
        ph.style.left = `calc(66px + (100% - 66px - 46px) * ${(ft / 15).toFixed(4)})`;
        // caption: the VO line under the playhead, its current word lit
        const li = VO.findIndex(([a, b]) => ft >= a - 0.2 && ft <= b + 0.3);
        const key = t >= T.play && li >= 0 ? `${li}:${W[li].findIndex(([a, b]) => ft >= a && ft < b + 0.05)}` : 'none';
        if (key !== capKey) {
          capKey = key;
          if (key === 'none') cap.innerHTML = '';
          else { const on = +key.split(':')[1]; cap.innerHTML = W[li].map(([, , w], j) => `<span class="${j === on ? 'on' : j < on ? 'past' : ''}">${x.esc(w)}</span>`).join(' '); }
        }
        const lv = t >= T.play ? 0.62 + 0.3 * Math.abs(Math.sin(t * 17)) * Math.abs(Math.sin(t * 5.3)) : 0.1 * seg(t, T.mu, T.mu + 1);
        meters.forEach((m, i) => { m.style.transform = `scaleY(${clamp(lv - i * 0.04).toFixed(3)})`; });
      },
    };
  },
};
