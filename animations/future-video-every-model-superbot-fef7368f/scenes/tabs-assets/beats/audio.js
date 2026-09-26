// Audio beat: the film gets its sound, one model per pass. k.opts.kind = 'voice' is the ElevenLabs narration take:
// the "Generating voiceover" chip lands, the narrator card rises in, its 64-bar waveform fills left to right as the
// take is generated, then a playhead sweeps the take, the bars it has passed light up and the transcript lights word
// by word. 'score' is the Suno track: cover, title and tag pills, and an 80-bar mirrored waveform in the track's own
// purple-to-pink gradient drawn in left to right, then swept. Pure function of t: every moving value is written from
// t, so ?t= freezes a frame.
import { clamp, lerp, seg, outCubic, outBack, streamCount, rand } from '../../../lib.js';

const VOICE = {
  say: 'Recorded the narration.',
  chip: 'Generating voiceover',
  name: 'Narrator',
  meta: 'warm, first person · 0:48',
  secs: 48,                       // the take runs 0:48, so the clock can report a real time as the head crosses it
  line: 'I was born in the autumn of 2026, at the steep part of the curve.',
};
const SCORE = {
  say: 'Scored it. Synthwave, 92 BPM.',
  chip: 'Composing score',
  title: 'The Steep Part (Original Score)',
  cover: 'future/still-152.jpg',
  tags: ['synthwave', '92 BPM', '3:12'],
  secs: 192,                      // 3:12
};
const BARS = { voice: 64, score: 80 };
const VIOLET = '#7c3aed', PINK = '#ec4899';

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const mix = (a, b, f) => '#' + [0, 1, 2].map((i) =>
  Math.round(lerp(parseInt(a.slice(1 + i * 2, 3 + i * 2), 16), parseInt(b.slice(1 + i * 2, 3 + i * 2), 16), f)).toString(16).padStart(2, '0')).join('');

// the narrator's take: speech comes in bursts, so bars cluster around a word and the pause after it stays near the
// floor, over a slow swell that carries the line from its opening to its last word
function speechBars(n) {
  return Array.from({ length: n }, (_, i) => {
    const burst = Math.floor(i / 5.5);                                        // one word takes about five bars
    const speaking = rand(burst * 17.3 + 3) > 0.2;                            // the gap between two words
    const swell = 0.58 + 0.42 * Math.sin(((i + 0.5) / n) * Math.PI * 3.4);
    const amp = speaking ? lerp(0.36, 1, rand(i * 5.7 + 11)) : lerp(0.1, 0.26, rand(i * 2.9 + 4));
    return clamp(amp * swell, 0.08, 1);
  });
}

// the score: denser and louder than speech, a kick on every fourth bar and a swell across the whole track
function scoreBars(n) {
  return Array.from({ length: n }, (_, i) => {
    const swell = 0.5 + 0.5 * Math.sin(((i + 0.5) / n) * Math.PI * 6 - 1.2);
    const kick = i % 4 === 0 ? 0.2 : 0;
    return clamp(0.36 + 0.42 * rand(i * 9.1 + 7) + 0.34 * swell + kick, 0.2, 1);
  });
}

const PLAY = `<span class="audio-play"><i class="audio-tri"></i><i class="audio-pause"><b></b><b></b></i></span>`;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;      // "Generating voiceover" / "Composing score" lands
    T.card = r + 0.34;     // the card rises in
    T.write = r + 0.58;    // the waveform starts filling, left to right
    T.wrote = r + 1.5;     // the audio is rendered; the chip turns to its ready label here
    T.play = r + 1.7;      // the playhead starts its sweep
    T.playEnd = r + 2.65;  // and reaches the last bar
    T.end = r + 2.9;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const isScore = (k.opts || {}).kind === 'score';
    const V = isScore ? SCORE : VOICE;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(V.say)}</span></div>`);
    const gen = x.el(`<div class="dd-chiprow audio-genrow"><span class="ch-tool audio-gen">${x.tile(k.app)}<span class="ch-tool-t">${x.esc(V.chip)}</span></span></div>`);

    const n = BARS[isScore ? 'score' : 'voice'];
    const bars = isScore ? scoreBars(n) : speechBars(n);
    const height = isScore ? (v) => lerp(9, 50, v) : (v) => lerp(7, 30, v);
    const barHtml = bars.map((v, i) => isScore
      ? `<i class="audio-bar" style="height:${height(v).toFixed(1)}px;background:${mix(VIOLET, PINK, i / (n - 1))}"></i>`
      : `<i class="audio-bar" style="height:${height(v).toFixed(1)}px"></i>`).join('');
    const head = `<i class="audio-head"></i>`;

    const card = x.el(isScore
      ? `<div class="audio-card audio-c-score">
          <div class="audio-hd">
            <img class="audio-cover" src="${x.img(SCORE.cover)}" alt="The Steep Part cover art"/>
            <span class="audio-meta"><b>${x.esc(SCORE.title)}</b>
              <span class="audio-tags">${SCORE.tags.map((tg) => `<i class="audio-tag">${x.esc(tg)}</i>`).join('')}</span></span>
            ${PLAY}
          </div>
          <div class="audio-wave audio-wave-s">${barHtml}${head}</div>
        </div>`
      : `<div class="audio-card audio-c-voice">
          <div class="audio-hd">
            ${PLAY}
            <span class="audio-meta"><b>${x.esc(VOICE.name)}</b><small>${x.esc(VOICE.meta)}</small></span>
            <small class="audio-clock">0:00 / ${clock(VOICE.secs)}</small>
          </div>
          <div class="audio-wave audio-wave-v">${barHtml}${head}</div>
          <div class="audio-script">${VOICE.line.split(' ').map((w) => `<span class="audio-w">${x.esc(w)}</span>`).join(' ')}</div>
        </div>`);

    const barEls = [...card.querySelectorAll('.audio-bar')];
    const words = [...card.querySelectorAll('.audio-w')];
    const headEl = card.querySelector('.audio-head');
    const playEl = card.querySelector('.audio-play');
    const tri = card.querySelector('.audio-tri'), pause = card.querySelector('.audio-pause');
    const clockEl = card.querySelector('.audio-clock');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const genT = gen.querySelector('.ch-tool-t');
    const DONE = isScore ? 'Score ready · 3:12' : 'Voiceover ready · 0:48';
    let shown = -1, lit = -1, litWord = -1, lastClock = '', lastLab = '';

    return {
      nodes: [say, gen, card],
      marks: [[T.r, say], [T.chip, gen], [T.card, card]],
      render(t) {
        // the reply streams one line
        const c = streamCount(V.say, T.r + 0.06, 80, t);
        if (c !== shown) { vis.textContent = V.say.slice(0, c); hid.textContent = V.say.slice(c); shown = c; }

        // the generating chip lands and stays; its label turns to the ready line the moment the audio is written
        const ci = outCubic(seg(t, T.chip, T.chip + 0.3));
        gen.style.opacity = ci.toFixed(3);
        gen.style.transform = `translateY(${((1 - ci) * 6).toFixed(2)}px)`;
        const lab = t >= T.wrote ? DONE : V.chip;
        if (lab !== lastLab) { lastLab = lab; genT.textContent = lab; }

        // the card rises in
        const pi = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = pi.toFixed(3);
        card.style.transform = pi >= 1 ? 'none' : `translateY(${((1 - pi) * 14).toFixed(2)}px) scale(${lerp(0.98, 1, pi).toFixed(4)})`;

        // generation: every bar grows in its own turn, left to right
        const w = seg(t, T.write, T.wrote) * barEls.length;
        barEls.forEach((b, i) => { b.style.transform = `scaleY(${outBack(clamp(w - i, 0, 1)).toFixed(4)})`; });

        // playback: the playhead crosses the waveform and everything it has passed lights up
        const p = seg(t, T.play, T.playEnd);
        const live = t >= T.play && t < T.playEnd;
        headEl.style.opacity = t < T.play ? '0' : (1 - seg(t, T.playEnd, T.playEnd + 0.16)).toFixed(3);
        headEl.style.left = `${(p * 100).toFixed(3)}%`;
        const played = Math.floor(p * barEls.length);
        if (played !== lit) { lit = played; barEls.forEach((b, i) => b.classList.toggle('on', i < played)); }
        playEl.classList.toggle('playing', live);
        tri.style.opacity = live ? '0' : '1';
        pause.style.opacity = live ? '1' : '0';

        // karaoke: the transcript lights word by word as the playhead reaches it
        const at = t < T.play ? 0 : clamp(Math.floor(p * (words.length + 0.5)), 0, words.length);
        if (at !== litWord) {
          litWord = at;
          words.forEach((wd, j) => { wd.classList.toggle('on', j < at - 1); wd.classList.toggle('now', j === at - 1); });
        }
        if (clockEl) {
          const ck = `${clock(p * VOICE.secs)} / ${clock(VOICE.secs)}`;
          if (ck !== lastClock) { lastClock = ck; clockEl.textContent = ck; }
        }
      },
    };
  },
};