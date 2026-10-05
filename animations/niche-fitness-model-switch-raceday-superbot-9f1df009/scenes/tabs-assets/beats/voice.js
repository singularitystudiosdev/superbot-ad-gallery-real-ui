// Voice beat: ElevenLabs Eleven v3 voices the coach cues superbot wrote off DeepSeek's splits. ElevenLabs' light
// Text to Speech view (voice Sarah, model Eleven v3): four cue rows (plain lines, no audio tags), each generating and
// drawing its waveform, then the first cue playing. The waveforms are the real RMS envelopes and durations of the
// four clips elevenlabs/v3 returned (media/voice/*.mp3, data.9f1df009.js VOICE); the MP4 plays the clip itself.
import { seg, outCubic } from '../../../lib.js';
import { sayLine, rise, land, setText, statusRender, cardHead, withFocus } from './kit.9f1df009.js?v=9f1df009';
import { VOICE } from '../../../media/data.9f1df009.js?v=9f1df009';

const SAY = 'Writing your cues off the splits, then voicing them on Eleven v3.';
const CUES = [['mi3', 'Mile 3'], ['hill', 'Mile 4.6'], ['ocean', 'Mile 7'], ['board', 'Mile 12.8']];
const BARS = 56;
export const PLAY = 'mi3'; // the cue this beat plays (the MP4 mixes media/voice/mi3.mp3 at T.play)
const total = CUES.reduce((a, [c]) => a + VOICE[c].dur, 0);
const FOOT = `4 cues · ${total.toFixed(1)} s · each fires when GPS crosses its mile`;

function wave(peaks) {
  const per = peaks.length / BARS, w = 100 / BARS;
  return Array.from({ length: BARS }, (_, b) => {
    let m = 0; for (let i = Math.floor(b * per); i < Math.floor((b + 1) * per); i++) m = Math.max(m, peaks[i]);
    const h = Math.max(6, m * 100);
    return `<rect x="${(b * w + w * 0.18).toFixed(2)}" y="${((100 - h) / 2).toFixed(1)}" width="${(w * 0.64).toFixed(2)}" height="${h.toFixed(1)}" rx="0.8"/>`;
  }).join('');
}
const fmtDur = (s) => `0:${String(Math.round(s)).padStart(2, '0')}`;

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + 0.14;
    T.rows = CUES.map((_, i) => T.card + 0.24 + i * 0.06);
    T.gen = CUES.map((_, i) => T.card + 0.5 + i * 0.26);    // each cue starts generating
    T.done = T.gen[CUES.length - 1] + 0.5;
    T.play = T.done + 0.12;                                  // the first cue plays
    T.foot = T.done + 0.05;
    return withFocus(T, opts, T.card + 0.36, T.play + 1.5); // the camera pushes in on the output, then glides to the next pill
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY, T.r + 0.05);
    const card = x.el(`<div class="rk-card el-card">
      ${cardHead(x, 'elevenlabs-logo.svg', 'Voicing 4 coach cues', '<b class="rk-n">0</b> / 4 · Eleven v3')}
      <div class="el-app">
        <div class="el-bar"><b>Text to Speech</b><span class="el-pill"><i class="el-av"></i>Sarah</span><span class="el-pill">Eleven v3</span></div>
        ${CUES.map(([c, m]) => `<div class="el-row"><span class="el-mi">${m}</span><span class="el-tx">${x.esc(VOICE[c].text)}</span>
          <span class="el-pl"><i class="el-tri"></i></span>
          <span class="el-wv"><svg class="el-w0" viewBox="0 0 100 100" preserveAspectRatio="none">${wave(VOICE[c].peaks)}</svg>
          <span class="el-cl"><svg class="el-w1" viewBox="0 0 100 100" preserveAspectRatio="none">${wave(VOICE[c].peaks)}</svg></span>
          <i class="el-gen">Generating…</i></span><span class="el-du">${fmtDur(VOICE[c].dur)}</span></div>`).join('')}
      </div>
      <div class="el-ft">${x.OK}<span>${x.esc(FOOT)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const st = $('.rk-st'), n = $('.rk-n'), ft = $('.el-ft'), bar = $('.el-bar');
    const rows = $$('.el-row').map((r, i) => ({ r, c: CUES[i][0], w0: r.querySelector('.el-w0'), cl: r.querySelector('.el-cl'),
      gen: r.querySelector('.el-gen'), du: r.querySelector('.el-du'), pl: r.querySelector('.el-pl') }));
    const pi = CUES.findIndex(([c]) => c === PLAY);
    return {
      nodes: [say.n, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say.n], [T.card, card], [T.foot, ft]],
      render(t) {
        say.render(t);
        rise(card, seg(t, T.card, T.card + 0.36));
        statusRender(st, t, T.card, T.done);
        land(bar, seg(t, T.card + 0.12, T.card + 0.32), 4);
        let made = 0;
        rows.forEach((o, i) => {
          land(o.r, seg(t, T.rows[i], T.rows[i] + 0.2), 5);
          const g = seg(t, T.gen[i], T.gen[i] + 0.12), d = outCubic(seg(t, T.gen[i] + 0.12, T.gen[i] + 0.45));
          o.gen.style.opacity = (g * (1 - d)).toFixed(3);
          o.w0.style.clipPath = `inset(0 ${((1 - d) * 100).toFixed(2)}% 0 0)`;
          o.du.style.opacity = d.toFixed(3);
          if (d >= 1) made++;
          // the playing cue: its played part darkens behind the playhead, in real time from T.play
          const v = VOICE[o.c], pp = i === pi ? seg(t, T.play, T.play + v.dur) : 0;
          o.cl.style.width = `${(pp * 100).toFixed(2)}%`;
          o.pl.classList.toggle('on', i === pi && t >= T.play && pp < 1);
          o.r.classList.toggle('play', i === pi && t >= T.play);
        });
        setText(n, String(made));
        land(ft, seg(t, T.foot, T.foot + 0.22), 4);
      },
    };
  },
};
