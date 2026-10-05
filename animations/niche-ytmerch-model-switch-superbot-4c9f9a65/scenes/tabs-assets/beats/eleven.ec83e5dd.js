// Link 5, ElevenLabs v3: voices the shoutout for the Short. ElevenLabs' own Text to Speech page (light): the script,
// the settings v3 actually has (the voice, model Eleven v3, its three-step Stability: Creative / Natural / Robust,
// Speaker boost), Generate pressed, then the clip arriving in the player: the REAL waveform of the real render
// (voice.ec83e5dd.js) drawing in, and playing at real speed with each word inking in at its real onset.
import { seg, outCubic, lerp, esc } from '../../../lib.js';
import { ic } from '../icons.ec83e5dd.js?v=4c9f9a65';
import { WORDS, PEAKS, DURATION } from './voice.ec83e5dd.js?v=4c9f9a65';

const WAVE_W = 520, WAVE_H = 92;
const fmt = (s) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

export default {
  times(done) {
    return { end: done + 2.35 };
  },
  build(k, ctx) {
    const step = WAVE_W / PEAKS.length;
    const bars = PEAKS.map((p, i) => {
      const h = Math.max(3, p * WAVE_H);
      return `<rect x="${(i * step).toFixed(2)}" y="${((WAVE_H - h) / 2).toFixed(2)}" width="${(step * 0.62).toFixed(2)}" height="${h.toFixed(2)}" rx="1.4"/>`;
    }).join('');
    const ws = ctx.el(`
<div class="el">
  <div class="el-nav"><span class="el-logo"><img src="${ctx.brand('elevenlabs-logo.svg')}" alt=""/></span>
    <span class="el-ni el-ni-on">${ic('graphic-eq')}Text to Speech</span><span class="el-ni">${ic('record-voice-over-outline')}Voices</span><span class="el-ni">${ic('sync')}Voice Changer</span><span class="el-ni">${ic('bolt')}Sound Effects</span></div>
  <div class="el-main">
    <h3>Text to Speech</h3>
    <div class="el-text">${WORDS.map(([, w]) => `<span>${esc(w)}</span>`).join(' ')}</div>
    <div class="el-chars">86 / 5,000 characters</div>
    <div class="el-player">
      <span class="el-play">${ic('play-arrow')}${ic('pause')}</span>
      <div class="el-wv"><svg viewBox="0 0 ${WAVE_W} ${WAVE_H}" width="${WAVE_W}" height="${WAVE_H}"><defs><clipPath id="el-clip-ec83"><rect class="el-reveal" x="0" y="0" width="0" height="${WAVE_H}"/></clipPath>
        <clipPath id="el-play-ec83"><rect class="el-played" x="0" y="0" width="0" height="${WAVE_H}"/></clipPath></defs>
        <g clip-path="url(#el-clip-ec83)"><g class="el-b0">${bars}</g><g class="el-b1" clip-path="url(#el-play-ec83)">${bars}</g></g></svg>
        <i class="el-head"></i><div class="el-gen"><i></i><span>Generating…</span></div></div>
      <div class="el-meta"><b>shoutout.mp3</b><span class="el-time">0:00 / ${fmt(DURATION)}</span><span class="el-dl">${ic('download')}</span></div>
    </div>
  </div>
  <div class="el-set">
    <div class="el-st"><b>Settings</b><span>History</span></div>
    <label>Voice</label>
    <div class="el-voice"><i class="el-orb"></i><span><b>Sam Rivera</b><small>Professional Voice Clone</small></span>${ic('keyboard-arrow-down')}</div>
    <label>Model</label>
    <div class="el-model"><b>Eleven v3</b>${ic('keyboard-arrow-down')}</div>
    <label>Stability</label>
    <div class="el-stab"><span>Creative</span><span class="el-on">Natural</span><span>Robust</span></div>
    <div class="el-tog"><span>Speaker boost</span><i><b></b></i></div>
    <div class="el-genb">Generate speech</div>
  </div>
</div>`);
    const q = (s) => ws.querySelector(s);
    const words = [...ws.querySelectorAll('.el-text span')];
    const reveal = q('.el-reveal'), played = q('.el-played'), head = q('.el-head'), time = q('.el-time'), gen = q('.el-gen'), genb = q('.el-genb');
    const play = q('.el-play');
    const d = k.done, GEN = d + 0.12, WAVE = d + 0.6, PLAY = d + 1.0;
    let lastT = null;
    return {
      ws,
      head: 'connected · Eleven v3 · your voice clone',
      say: 'Shoutout recorded in your voice: 4 seconds, ready for the Short.',
      chips: ['shoutout.mp3'],
      out: 'shoutout.mp3',
      render(t) {
        const press = Math.sin(Math.PI * seg(t, GEN - 0.1, GEN + 0.12));
        genb.style.transform = press > 0 ? `scale(${(1 - 0.05 * press).toFixed(4)})` : 'none';
        genb.classList.toggle('el-busy', t >= GEN && t < WAVE);
        gen.style.opacity = (seg(t, GEN, GEN + 0.1) * (1 - seg(t, WAVE - 0.05, WAVE + 0.1))).toFixed(3);
        gen.firstElementChild.style.transform = `scaleX(${outCubic(seg(t, GEN, WAVE)).toFixed(4)})`;
        reveal.setAttribute('width', (WAVE_W * outCubic(seg(t, WAVE, WAVE + 0.4))).toFixed(1));
        const a = Math.max(0, Math.min(DURATION, t - PLAY));
        played.setAttribute('width', ((a / DURATION) * WAVE_W).toFixed(1));
        head.style.opacity = (t >= PLAY ? 1 : 0).toString();
        head.style.transform = `translateX(${((a / DURATION) * WAVE_W).toFixed(1)}px)`;
        play.classList.toggle('el-playing', t >= PLAY);
        const tt = `${fmt(a)} / ${fmt(DURATION)}`;
        if (tt !== lastT) { time.textContent = tt; lastT = tt; }
        words.forEach((w, i) => {
          const on = t >= PLAY && a >= WORDS[i][0];
          w.classList.toggle('el-said', on);
          w.classList.toggle('el-now', on && (i === WORDS.length - 1 || a < WORDS[i + 1][0]));
        });
      },
    };
  },
};
