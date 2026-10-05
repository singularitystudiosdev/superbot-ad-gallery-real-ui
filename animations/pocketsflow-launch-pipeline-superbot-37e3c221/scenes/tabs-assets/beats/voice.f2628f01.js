// Beat 4 of 6, ElevenLabs: it voices the six script lines and scores the film to the cuts. The card is a 15s
// multitrack laid on the film's own clock: a ruler with the six shot boundaries, the voice track (one waveform island
// per script line, sitting inside its shot), the music bed with its 112 BPM beat grid, and the six SFX cues placed on
// the moments the film animates (the page whoosh, the Buy tap, the Apple Pay chime, the map pings, the cha-ching, the
// logo hit). Then a preview playhead runs the timeline and the caption follows it word by word. Waveforms are seeded.
import { clamp, lerp, seg, outCubic } from '../../../lib.js';
import { SHOTS, FILM_DUR } from '../../../film/film.f2628f01.js';
import { sayLine, renderSay, toolChip, renderChip, head, cardIn, rise, setText, rnd } from './pf-kit.f2628f01.js';

const SAY = 'Voiced all six lines and scored it to the cuts.';
export const LINES = SHOTS.map((s) => {
  const w = s.vo.split(' ');
  const a = s.t0 + 0.12;
  return { s, w, a, b: Math.min(s.t1 - 0.12, a + w.length * 0.36) };
});
const VOICE_S = LINES.reduce((s, l) => s + (l.b - l.a), 0);
const CUES = [[2.6, 'whoosh'], [5.45, 'tap'], [6.9, 'Apple Pay chime'], [8.1, 'pings'], [10.4, 'cha-ching'], [12.6, 'logo hit']];
const BPM = 112, BARS = 132;
const pct = (s) => `${(s / FILM_DUR * 100).toFixed(2)}%`;

export default {
  times(r) {
    const T = { r };
    T.chip = [r + 0.12, r + 1.5];
    T.card = r + 0.3;
    T.gen = r + 0.55;
    T.play = [r + 1.75, r + 3.7];
    T.end = r + 3.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const chip = toolChip(x, 'Generating 6 voice lines', `6 lines, ${VOICE_S.toFixed(1)}s of voice`);
    const vo = Array.from({ length: BARS }, (_, i) => {
      const tm = (i + 0.5) * FILM_DUR / BARS, li = LINES.findIndex((l) => tm >= l.a && tm <= l.b);
      const h = li < 0 ? 2 : Math.round(6 + 22 * rnd(i + 11) * (0.55 + 0.45 * Math.sin(Math.PI * (tm - LINES[li].a) / (LINES[li].b - LINES[li].a))));
      return `<i data-l="${li}" style="left:${pct(tm)};height:${h}px"></i>`;
    }).join('');
    const mu = Array.from({ length: 96 }, (_, i) => {
      const tm = (i + 0.5) * FILM_DUR / 96, env = 0.35 + 0.65 * (tm / FILM_DUR) + (tm > 12.6 && tm < 13.4 ? 0.3 : 0);
      return `<i style="left:${pct(tm)};height:${Math.round(4 + 13 * env * (0.6 + 0.4 * rnd(i + 90)))}px"></i>`;
    }).join('');
    const ticks = Array.from({ length: Math.floor(FILM_DUR * BPM / 60) }, (_, i) => `<b style="left:${pct(i * 60 / BPM)}"></b>`).join('');
    const card = x.el(`<div class="pfc pfv">
      ${head(x, 'eleven', 'ElevenLabs', 'Eleven v3', '<span class="pfc-meta">Voice: Brian</span>')}
      <div class="pfv-vr"><span class="pfv-av">B</span><div><b>Brian</b><small>Deep, confident narrator</small></div>
        ${['Stability 50%', 'Similarity 75%', 'Style 30%'].map((c) => `<span class="pfb-chip">${c}</span>`).join('')}</div>
      <div class="pfv-tl">
        <div class="pfv-ru"><span></span><div>${SHOTS.map((s, i) => `<em style="left:${pct(s.t0)}">0${i + 1}</em>`).join('')}${[0, 3, 6, 9, 12, 15].map((v) => `<small style="left:${pct(v)}">${v}s</small>`).join('')}</div></div>
        <div class="pfv-tk pfv-vo"><span><b>Voice</b><small>6 lines</small></span><div class="pfv-ln">${vo}</div></div>
        <div class="pfv-tk pfv-mu"><span><b>Score</b><small>Launch bed, ${BPM} BPM</small></span><div class="pfv-ln"><div class="pfv-mw">${mu}</div>${ticks}</div></div>
        <div class="pfv-tk pfv-fx"><span><b>SFX</b><small>6 cues</small></span><div class="pfv-ln">${CUES.map(([s, l]) => `<em style="left:${pct(s)}"><i></i>${x.esc(l)}</em>`).join('')}</div></div>
        <i class="pfv-ph"></i>
      </div>
      <p class="pfv-cap"><span class="pfv-cl">Preview</span><span class="pfv-cw"></span></p>
    </div>`);
    const q = (s) => [...card.querySelectorAll(s)];
    const bars = q('.pfv-vo .pfv-ln i'), cues = q('.pfv-fx em');
    const mw = card.querySelector('.pfv-mw'), ph = card.querySelector('.pfv-ph'), cw = card.querySelector('.pfv-cw');
    const tl = card.querySelector('.pfv-tl');
    let lastCap = '';
    return {
      nodes: [say.n, chip.row, card],
      marks: [[T.r, say.n], [T.chip[0], chip.row], [T.card, card]],
      render(t) {
        renderSay(say, t, T.r + 0.05);
        renderChip(chip, t, T.chip[0], T.chip[1]);
        cardIn(card, t, T.card, T.end);
        bars.forEach((b) => {
          const li = +b.dataset.l;
          const a = T.gen + Math.max(0, li) * 0.16;
          b.style.transform = `scaleY(${li < 0 ? 1 : outCubic(seg(t, a, a + 0.3)).toFixed(3)})`;
        });
        mw.style.clipPath = `inset(0 ${(100 - 100 * outCubic(seg(t, T.gen + 0.1, T.gen + 1.1))).toFixed(2)}% 0 0)`;
        cues.forEach((c, i) => rise(c, seg(t, T.gen + 0.4 + i * 0.1, T.gen + 0.7 + i * 0.1), 5));
        // the preview playhead runs the whole film timeline; the caption follows it word by word
        const ft = FILM_DUR * seg(t, T.play[0], T.play[1]);
        const on = t >= T.play[0];
        ph.style.opacity = on ? '1' : '0';
        ph.style.left = `calc(var(--pfv-lab) + (100% - var(--pfv-lab)) * ${(ft / FILM_DUR).toFixed(4)})`;
        tl.classList.toggle('pfv-on', on);
        const l = LINES.find((m) => ft < m.b + 0.4) || LINES[5];
        const said = on ? clamp(Math.ceil((ft - l.a) / (l.b - l.a) * l.w.length), 0, l.w.length) : 0;
        const cap = on ? l.w.map((w, i) => `<span class="${i < said ? 'pfv-said' : ''}">${x.esc(w)}</span>`).join(' ') : x.esc(LINES[0].s.vo);
        if (cap !== lastCap) { cw.innerHTML = cap; lastCap = cap; }
        bars.forEach((b) => b.classList.toggle('pfv-hot', on && +b.dataset.l === LINES.indexOf(l) && ft >= l.a));
      },
    };
  },
};
