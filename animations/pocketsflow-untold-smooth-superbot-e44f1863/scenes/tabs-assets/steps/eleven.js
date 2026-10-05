// Step 4, ElevenLabs Music: the score. ElevenLabs' music panel (near-black, white, Inter): the prompt, then the track
// it composed, drawn from the REAL generated bed (img/gen/bed-peaks.json: 120 RMS bars of the 15.05s Eleven Music
// render, whose kick lands every 0.5s, so 120 BPM). The bars stream in left to right as it generates, then the
// playhead sweeps and lights what it has played. render(lt) is a pure function of lt.
import { seg, outExpo, inOutSine, rise } from '../../../lib.js';
import { clock, shimmer } from './media.js';

const PROMPT = 'Upbeat product launch jingle, 120 BPM, minimal electronic pop with a marimba lead, a lift at 5 seconds, instrumental';
const GEN = [0.45, 1.75], PLAY = 1.95, LEN = 15;

export default {
  id: 'eleven', app: 'eleven', model: 'ElevenLabs Music', chip: 'ElevenLabs', logo: 'elevenlabs-logo.svg', dur: 3.4,
  summary: 'launch-bed.mp3, 0:15, 120 BPM, instrumental',

  build({ img, brand, el, esc }) {
    const n = el(`<div class="el">
  <div class="el-hd"><span class="el-lg"><img src="${brand('elevenlabs-logo.svg')}" alt=""/></span><b>ElevenLabs</b><span class="el-crumb">Music</span></div>
  <div class="el-prompt">${esc(PROMPT)}</div>
  <div class="el-track">
    <span class="el-play"><svg viewBox="0 0 24 24"><path class="el-tri" d="M8 5.5v13l10.5-6.5z"/><path class="el-pause" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg></span>
    <div class="el-meta"><b>Pocketsflow launch</b><small><span class="el-gen">Composing</span><span class="el-info">0:15 · 120 BPM · Instrumental</span></small></div>
    <div class="el-wave"></div>
    <span class="el-time">0:00</span>
  </div>
</div>`);
    const wave = n.querySelector('.el-wave');
    const ui = { gen: n.querySelector('.el-gen'), info: n.querySelector('.el-info'), time: n.querySelector('.el-time'), tri: n.querySelector('.el-tri'), pause: n.querySelector('.el-pause'), lastT: '' };
    let bars = [];
    const ready = fetch(img('gen/bed-peaks.json')).then((r) => r.json()).then((d) => {
      wave.innerHTML = d.bars.map(() => '<i></i>').join('');
      bars = [...wave.children].map((b, i) => ({ b, v: d.bars[i] }));
    }).catch((e) => console.error('eleven.js: peaks failed', e));
    return {
      el: n, ready,
      render(lt) {
        if (lt < -0.2 || lt > 5) return;
        const N = bars.length || 1;
        const head = Math.max(0, lt - PLAY) / LEN;       // real-time playhead: the share of the 15s bed played
        bars.forEach(({ b, v }, i) => {
          const at = GEN[0] + (i / N) * (GEN[1] - GEN[0]);
          const g = outExpo(seg(lt, at, at + 0.35));
          b.style.transform = `scaleY(${Math.max(0.04, v * g).toFixed(3)})`;
          b.style.opacity = (0.25 + 0.75 * g).toFixed(3);
          b.classList.toggle('on', i / N < head);
        });
        const r = inOutSine(seg(lt, GEN[1], GEN[1] + 0.3));
        ui.gen.style.setProperty('--sh', shimmer(lt));
        ui.gen.style.opacity = (1 - r).toFixed(3);
        ui.info.style.opacity = r.toFixed(3);
        const playing = lt >= PLAY;
        ui.tri.style.opacity = playing ? '0' : '1';
        ui.pause.style.opacity = playing ? '1' : '0';
        const tc = clock(head * LEN);
        if (tc !== ui.lastT) { ui.time.textContent = tc; ui.lastT = tc; }
      },
    };
  },
};
