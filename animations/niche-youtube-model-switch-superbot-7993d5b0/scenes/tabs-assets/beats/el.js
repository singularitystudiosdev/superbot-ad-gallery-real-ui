// Eleven v4 beat, the second hand-off: DeepSeek's hook becomes the trailer's voiceover. The window is ElevenLabs'
// own Text to Speech page, light theme: the left nav (Text to Speech on), the script with Eleven v4's inline audio
// tags ([whispering], [excited], [laughs]) shown as tags, the Settings panel (voice River, model Eleven v4, the
// stability, similarity and style controls), and the player bar. Generate is pressed, the waveform draws in from the
// audio file's own peaks (vo-peaks.js), and playback runs at real speed with the words lighting up as they are said
// (Eleven v4 returns word timestamps). Under the script a sound effect is made for the trailer's cut to the logo.
// Hand-off: trailer-vo.mp3 and hit.mp3 go to Blender, which cuts the trailer to the voice.
import { seg, outCubic, lerp, press } from '../../../lib.js';
import { windowTimes, sayLine, rise, windowCard } from './kit.js?v=7993d5b0';
import { VO } from './vo-peaks.js?v=7993d5b0';

const SAY = 'Turning the hook into a voiceover for the trailer.';
// the script, as Eleven v4 takes it: tags in brackets, words in between
const SCRIPT = '[whispering] Ten headsets. Not one over a hundred bucks. [excited] And the best mic of the lot... costs thirty-nine dollars. [laughs] Premieres Friday, six PM.';
const SFX = 'Trailer whoosh into a sub-bass hit';
const NAV = ['Home', 'Voices', 'Text to Speech', 'Voice Changer', 'Sound Effects', 'Studio', 'Dubbing'];

const HOLD = 3.4; /* deliberate */
const TAG_AT = 0.05, TAG_STAGGER = 0.14;
const GEN_AT = 0.55;                 // Generate is pressed
const WAVE_AT = 0.95, WAVE_IN = 0.5; // the waveform draws in
const PLAY_AT = 1.55, PLAY_FOR = 1.7;// real-speed playback
const SFX_AT = 2.35;                 // the sound effect is generated

// word start times (s) across the take: spoken words share the length by their letters, a tag or a full stop is a pause
function wordTimes(text, dur) {
  const parts = text.split(/(\[[^\]]+\])/).filter(Boolean);
  const toks = [];
  parts.forEach((p) => {
    if (p.startsWith('[')) { toks.push({ tag: p }); return; }
    p.trim().split(/\s+/).filter(Boolean).forEach((w) => toks.push({ w, wt: w.length + (/[.,]$/.test(w) ? 3 : 1) }));
  });
  const total = toks.reduce((s, x) => s + (x.tag ? 4 : x.wt), 0);
  let acc = 0;
  toks.forEach((x) => { x.at = (acc / total) * dur; acc += x.tag ? 4 : x.wt; });
  return toks;
}

export default {
  times(r, opts) {
    const T = windowTimes(r, opts, HOLD);
    T.gen = T.c0 + GEN_AT;
    T.wave = T.c0 + WAVE_AT;
    T.play = T.c0 + PLAY_AT;
    T.sfx = T.c0 + SFX_AT;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const toks = wordTimes(SCRIPT, VO.dur);
    const words = toks.map((tk) => (tk.tag ? `<span class="el-tag">${x.esc(tk.tag)}</span>` : `<span class="el-w">${x.esc(tk.w)}</span>`)).join(' ');
    const bars = VO.peaks.map((v) => `<i style="height:${(8 + v * 92).toFixed(0)}%"></i>`).join('');
    const sfxBars = Array.from({ length: 44 }, (_, i) => {
      const e = i < 26 ? Math.pow(i / 26, 2) * 0.7 : Math.max(0.08, Math.exp(-(i - 26) / 6));
      return `<i style="height:${(10 + e * 90).toFixed(0)}%"></i>`;
    }).join('');
    const app = `<div class="el">
      <nav class="el-nav"><span class="el-brand"><img class="el-logo" src="${x.brand('elevenlabs-logo.svg')}" alt=""/><b>ElevenLabs</b></span>
        ${NAV.map((n) => `<span class="el-ni${n === 'Text to Speech' ? ' el-on' : ''}">${n}</span>`).join('')}</nav>
      <section class="el-main">
        <div class="el-h">Text to Speech</div>
        <div class="el-ed">${words}</div>
        <div class="el-meta"><span>${SCRIPT.length} / 5,000 characters</span><span class="el-gen"><i class="el-spin"></i><b>Generate speech</b></span></div>
        <div class="el-sfx"><span class="el-sfx-l"><b>Sound effect</b>${x.esc(SFX)} · 3.0s</span><span class="el-sw">${sfxBars}</span></div>
      </section>
      <aside class="el-set">
        <div class="el-st"><b>Settings</b><span>History</span></div>
        <div class="el-lab">Voice</div><div class="el-voice"><i class="el-orb"></i><b>River</b><span>Narration</span></div>
        <div class="el-lab">Model</div><div class="el-model"><b>Eleven v4</b><span>Most expressive</span></div>
        <div class="el-lab">Stability</div><div class="el-seg"><span>Creative</span><span class="el-on">Natural</span><span>Robust</span></div>
        <div class="el-lab">Similarity</div><div class="el-sl"><i style="width:75%"></i></div>
        <div class="el-lab">Style exaggeration</div><div class="el-sl"><i style="width:30%"></i></div>
      </aside>
      <div class="el-player"><span class="el-pb">▶</span><span class="el-time"><b>0:00</b> / 0:${String(Math.round(VO.dur)).padStart(2, '0')}</span>
        <span class="el-wave">${bars}<b class="el-head"></b></span><span class="el-dl">⤓</span></div>
    </div>`;
    const w = windowCard(x, 'kc-el', app, {
      ins: [{ logo: x.brand('deepseek-logo.svg'), file: 'hook.txt' }],
      outs: ['trailer-vo.mp3', 'hit.mp3'],
      next: { logo: x.brand('blender-logo.svg'), name: 'Blender' },
    });
    const $ = (s) => w.card.querySelector(s);
    const tags = [...w.card.querySelectorAll('.el-tag')];
    const wEls = [...w.card.querySelectorAll('.el-w')];
    const spoken = toks.filter((tk) => !tk.tag);
    const bEls = [...w.card.querySelectorAll('.el-wave i')];
    const sEls = [...w.card.querySelectorAll('.el-sw i')];
    const gen = $('.el-gen'), spin = $('.el-spin'), head = $('.el-head'), time = $('.el-time b'), pb = $('.el-pb'), sfx = $('.el-sfx');
    let lastTime = '', lastW = -2, lastB = -1, lastS = -1;

    return {
      nodes: [say.node, w.card],
      marks: [[T.r, say.node], [T.card, w.card]],
      focus: w.card,
      render(t) {
        say.render(t, T.r);
        rise(w.card, t, T.card);
        tags.forEach((n, i) => {
          const p = outCubic(seg(t, T.c0 + TAG_AT + i * TAG_STAGGER, T.c0 + TAG_AT + i * TAG_STAGGER + 0.2));
          n.style.background = `rgba(124, 58, 237, ${(0.06 + 0.1 * p).toFixed(3)})`;
          n.style.color = p > 0.5 ? '#6d28d9' : '#8b8b93';
        });
        const pr = press(t, T.gen);
        gen.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        const busy = t >= T.gen && t < T.wave + 0.1;
        gen.classList.toggle('el-busy', busy);
        spin.style.transform = `rotate(${((t - T.gen) * 480).toFixed(1)}deg)`;
        // the waveform draws in, left to right
        const nb = Math.round(bEls.length * outCubic(seg(t, T.wave, T.wave + WAVE_IN)));
        if (nb !== lastB) { bEls.forEach((b, i) => { b.style.opacity = i < nb ? '1' : '0'; }); lastB = nb; }
        // real-speed playback: playhead, clock, and the word being said
        const pt = t < T.play ? 0 : Math.min(PLAY_FOR, t - T.play);
        const playing = t >= T.play && t < T.play + PLAY_FOR;
        pb.textContent = playing ? '❚❚' : '▶';
        head.style.opacity = t >= T.play ? '1' : '0';
        head.style.left = `${(pt / VO.dur * 100).toFixed(2)}%`;
        bEls.forEach((b, i) => b.classList.toggle('el-past', t >= T.play && i / bEls.length < pt / VO.dur));
        const ts = `0:${String(Math.floor(pt)).padStart(2, '0')}`;
        if (ts !== lastTime) { time.textContent = ts; lastTime = ts; }
        let wi = -1;
        if (t >= T.play) spoken.forEach((tk, i) => { if (pt >= tk.at) wi = i; });
        if (wi !== lastW) { wEls.forEach((n, i) => { n.classList.toggle('el-said', i <= wi); n.classList.toggle('el-now', i === wi); }); lastW = wi; }
        // the sound effect
        sfx.style.opacity = lerp(0.35, 1, seg(t, T.sfx - 0.2, T.sfx)).toFixed(3);
        const ns = Math.round(sEls.length * outCubic(seg(t, T.sfx, T.sfx + 0.35)));
        if (ns !== lastS) { sEls.forEach((b, i) => { b.style.opacity = i < ns ? '1' : '0'; }); lastS = ns; }
        w.renderIO(t, T.out);
      },
    };
  },
};
