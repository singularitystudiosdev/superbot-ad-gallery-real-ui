// ElevenLabs: what an audio model does. Eleven v3 reads a script written with its own audio tags ([low],
// [hyped], [whispers]); the waveform is generated left to right, then plays with the words lighting as they are
// spoken, and the sound-effects model drops an ollie pop under it. Pure function of t.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Voicing the spot. Eleven v3, plus the pop.';
const STEPS = [
  ['Writing the spot', 'Script · 22 words · 3 audio tags'],
  ['Generating voice · Eleven v3', 'Voice “Brian” · 0:14 · 44.1 kHz'],
  ['Generating sound effects', 'SFX · ollie pop + tail slap'],
];
// the script, tags kept apart so they read as stage directions, not words
const SCRIPT = [
  ['tag', '[low]'], ['w', 'The'], ['w', 'tide'], ['w', 'went'], ['w', 'out.'],
  ['tag', '[hyped]'], ['w', 'LOW'], ['w', 'TIDE'], ['w', 'drops'], ['w', 'tonight.'],
  ['w', 'Seven-ply'], ['w', 'maple,'], ['w', 'fifty-nine'], ['w', 'bucks.'],
  ['tag', '[whispers]'], ['w', 'Don’t'], ['w', 'sleep.'],
];
const BARS = 84, SFX_BARS = 26;
const rnd = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
const level = (i) => {
  // three phrases with gaps between them, like the read
  const u = i / BARS;
  const gap = (u > 0.27 && u < 0.32) || (u > 0.74 && u < 0.78) ? 0.12 : 1;
  return Math.max(0.08, gap * (0.3 + 0.7 * Math.pow(rnd(i), 0.8)) * (0.6 + 0.4 * Math.sin(u * 9.4)));
};

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.step = STEPS.map((_, i) => r + 0.42 + i * 0.3);
    T.card = r + 1.35;
    T.g0 = T.card + 0.1; T.g1 = T.g0 + 0.75;  // generation sweeps the bars in
    T.p0 = T.g1 + 0.15; T.p1 = T.p0 + 2.0;    // playback (the visible 2s of a 0:14 read)
    T.sfx = T.p0 + 0.5;
    T.end = T.p1 + 0.1;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Calling eleven_v3</span><b class="yt-count">text to speech</b></div></div>');
    const rows = STEPS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const bars = (n, cls) => `<div class="el-wave ${cls}">${Array.from({ length: n }, (_, i) => `<i style="--h:${(cls ? 0.35 + 0.65 * rnd(i + 300) : level(i)).toFixed(3)}"></i>`).join('')}<span class="el-head"></span></div>`;
    const card = x.el(`<div class="el-card">
      <div class="el-top">
        <span class="el-play"><svg class="el-i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg><svg class="el-i-pause" viewBox="0 0 24 24"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg></span>
        <span class="el-title"><b>lowtide_spot.mp3</b><small>Eleven v3 · voice “Brian” · stability natural</small></span>
        <span class="el-time">0:00 / 0:14</span>
      </div>
      ${bars(BARS, '')}
      <div class="el-script">${SCRIPT.map(([k2, w]) => `<span class="${k2 === 'tag' ? 'el-tag' : 'el-w'}">${x.esc(w)}</span>`).join(' ')}</div>
      <div class="el-sfx"><span class="el-sfx-l">${x.tile('elevenlabs')}<b>ollie_pop.wav</b><small>Sound effects · 0:02</small></span>${bars(SFX_BARS, 'el-wave-s')}</div>
    </div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t');
    const beats = rows.map((r) => r.firstElementChild);
    const [wave, sfxWave] = card.querySelectorAll('.el-wave');
    const vb = [...wave.querySelectorAll('i')], sb = [...sfxWave.querySelectorAll('i')];
    const head = wave.querySelector('.el-head');
    const words = [...card.querySelectorAll('.el-script > span')];
    const time = card.querySelector('.el-time'), play = card.querySelector('.el-play');
    const sfx = card.querySelector('.el-sfx');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, chip, ...rows, card],
      marks: [[T.r, say], [T.chip, chip], ...rows.map((r, i) => [T.step[i], r]), [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const cd = t >= T.g1;
        spin.classList.toggle('done', cd);
        spin.style.transform = cd ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = cd ? 'eleven_v3 · done' : 'Calling eleven_v3';
        if (clab.textContent !== cl) clab.textContent = cl;
        beats.forEach((c, i) => {
          rise(rows[i], seg(t, T.step[i], T.step[i] + 0.3), 8);
          const done = t >= (i === 2 ? T.sfx : T.step[i] + 0.5);
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.step[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? STEPS[i][1] : STEPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 18).toFixed(2)}px)`;
        // generation: bars rise in from the left; playback: a playhead walks them and lights what it passed
        const g = seg(t, T.g0, T.g1), p = seg(t, T.p0, T.p1);
        vb.forEach((b, i) => {
          const u = i / BARS;
          const grown = outCubic(seg(g, u * 0.8, u * 0.8 + 0.2));
          const live = p > 0 && p < 1 ? 1 + 0.18 * Math.sin(t * 22 + i) * Math.exp(-Math.abs(u - p) * 18) : 1;
          b.style.transform = `scaleY(${Math.max(0.04, grown * live).toFixed(3)})`;
          b.classList.toggle('on', u <= p);
        });
        head.style.left = `${(p * 100).toFixed(2)}%`;
        head.style.opacity = p > 0 && p < 1 ? '1' : '0';
        const sec = Math.floor(p * 14);
        const tt = `0:${String(sec).padStart(2, '0')} / 0:14`;
        if (time.textContent !== tt) time.textContent = tt;
        play.classList.toggle('playing', p > 0 && p < 1);
        // karaoke: the words light in order as the playhead crosses them
        const lit = Math.floor(p * words.length * 1.02);
        words.forEach((w, i) => w.classList.toggle('lit', i < lit));
        const s = seg(t, T.sfx, T.sfx + 0.4);
        rise(sfx, s, 6);
        sb.forEach((b, i) => { b.style.transform = `scaleY(${Math.max(0.04, outCubic(seg(s, i / SFX_BARS * 0.6, i / SFX_BARS * 0.6 + 0.4))).toFixed(3)})`; });
      },
    };
  },
};