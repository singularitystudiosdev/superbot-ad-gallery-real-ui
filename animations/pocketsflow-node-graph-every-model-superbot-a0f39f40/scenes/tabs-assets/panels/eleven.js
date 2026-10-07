// Node 5, ElevenLabs: DeepSeek's script voiced with Eleven v3 (voice Sarah, the [confident] tag read as direction).
// The waveform is the real take's peaks and the words light on the take's own character timestamps (gen-data VO).
import { VO, DS } from '../gen-data.js';
import { el, esc, brand } from './kit.js';
import { clamp, seg, outCubic } from '../../../lib.js';

const GEN = 0.55;            // "Generating" before the take exists
const PLAY0 = 0.75, RATE = VO.dur / 1.85; // playback squeezed into the panel's time
const mmss = (s) => `0:${String(Math.floor(s)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;

export const eleven = {
  key: 'eleven',
  head: 'Text to Speech · Eleven v3',
  meta: `${VO.model} · voice ${VO.voice} · ${VO.dur.toFixed(1)}s take`,
  done: `${VO.dur.toFixed(1)}s VO`,
  thumb: () => `<div class="fg-thumb el-th">${VO.peaks.filter((_, i) => i % 3 === 0).map((v) => `<i style="height:${Math.max(6, v * 100).toFixed(0)}%"></i>`).join('')}</div>`,
  mount(body) {
    body.classList.add('el');
    // the script's words, in the order the take speaks them; the v3 tag is direction, not speech
    let wi = 0;
    const script = DS.vo.map((line) => `<p>${line.split(/\s+/).map((w) => (/^\[.*\]$/.test(w) ? `<i class="el-tag">${esc(w)}</i>` : `<span class="el-w" data-i="${wi++}">${esc(w)}</span>`)).join(' ')}</p>`).join('');
    body.append(el(`<div class="el-main">
      <div class="el-hd"><img src="${brand('elevenlabs-logo.svg')}" alt=""/><b>Text to Speech</b><span class="el-chip">Eleven v3</span></div>
      <div class="el-script">${script}</div>
      <div class="el-player"><span class="el-play"><i></i></span><div class="el-wave">${VO.peaks.map((v) => `<i style="height:${Math.max(4, v * 100).toFixed(1)}%"></i>`).join('')}<b class="el-head"></b></div><span class="el-time">0:00.0 / ${mmss(VO.dur)}</span></div>
      <div class="el-gen"><i></i><span>Generating speech…</span></div>
    </div>`), el(`<div class="el-side">
      <div class="el-cap">Voice</div>
      <div class="el-voice"><i></i><span><b>Sarah</b><small>Mature, Reassuring, Confident</small></span></div>
      <div class="el-cap">Model</div><div class="el-val">Eleven v3</div>
      <div class="el-cap">Stability</div><div class="el-seg"><span>Creative</span><span class="on">Natural</span><span>Robust</span></div>
      <div class="el-cap">Output</div><div class="el-val">MP3 · 44.1 kHz · 128 kbps</div>
    </div>`));
    const q = (sel) => body.querySelector(sel);
    return {
      words: [...body.querySelectorAll('.el-w')], bars: [...body.querySelectorAll('.el-wave i')], head: q('.el-head'),
      time: q('.el-time'), gen: q('.el-gen'), player: q('.el-player'), play: q('.el-play'), lastW: -2,
    };
  },
  render(s, p) {
    const g = seg(p, 0, GEN);
    s.gen.style.opacity = (1 - seg(p, GEN, GEN + 0.15)).toFixed(3);
    s.gen.firstElementChild.style.transform = `scaleX(${outCubic(g).toFixed(4)})`;
    // the waveform draws in left to right as the take lands
    const draw = seg(p, GEN - 0.05, GEN + 0.3);
    s.bars.forEach((b, i) => { b.style.opacity = i / s.bars.length < draw ? '1' : '0.08'; });
    const at = clamp((p - PLAY0) * RATE, 0, VO.dur);
    s.head.style.left = `${((at / VO.dur) * 100).toFixed(2)}%`;
    s.head.style.opacity = seg(p, PLAY0 - 0.1, PLAY0).toFixed(3);
    s.time.textContent = `${mmss(at)} / ${mmss(VO.dur)}`;
    s.play.classList.toggle('on', p >= PLAY0 && at < VO.dur);
    s.bars.forEach((b, i) => b.classList.toggle('el-done', (i + 0.5) / s.bars.length <= at / VO.dur));
    const cur = p < PLAY0 ? -1 : VO.words.reduce((a, w, i) => (at >= w.s ? i : a), -1);
    if (cur !== s.lastW) {
      s.words.forEach((w, i) => { w.classList.toggle('el-said', i < cur); w.classList.toggle('el-now', i === cur); });
      s.lastW = cur;
    }
  },
};
