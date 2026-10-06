// ElevenLabs beat: the player is the app's audio placeholder first ("Creating audio" shimmering in the waveform's
// slot, a spinner in the button), then the waveform grows in and the 4-second voiceover sits ready to play, its
// script under it (the launch page's "Play the ad" button plays it). No two states share the button at once.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Your voiceover, 4 seconds.';
const SCRIPT = '“Mando! Mandarin cream soda. Zero sugar.”';
// speech envelope of the script read aloud (RMS in 44 bins)
const WAVE = [0.89, 0.88, 0.85, 0.73, 0.36, 0.08, 0.11, 0.92, 0.89, 0.85, 0.89, 0.81, 0.57, 0.98, 0.95, 0.45, 0.89, 0.69, 0.48, 0.08, 0.08, 0.62, 0.96, 0.89, 0.67, 0.68, 0.64, 0.69, 0.29, 0.08, 0.11, 0.72, 0.77, 0.67, 1, 0.88, 0.56, 0.88, 0.73, 0.91, 0.7, 0.34, 0.08, 0.08];
const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
const SPIN = '<i class="el-spin"></i>';
// the button holds both states and crossfades them, spinner to play, as the audio lands

export default {
  times(r) {
    const T = { r };
    T.say = r + 0.02;
    T.card = r + 0.1;
    T.w0 = r + 0.14; T.w1 = r + 0.62;
    T.tx = r + 0.5;
    T.landed = T.w1;
    T.end = T.w1 + 0.2;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="el-card"><span class="el-btn">${SPIN}<span class="el-play">${PLAY}</span></span><span class="el-mid"><span class="el-wave">${WAVE.map(() => '<i></i>').join('')}</span><span class="el-make">Creating audio</span></span><span class="el-time"></span></div>`);
    const tx = x.el(`<div class="el-tx">${x.esc(SCRIPT)}</div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const btn = card.querySelector('.el-btn'), bars = [...card.querySelectorAll('.el-wave i')], time = card.querySelector('.el-time');
    const make = card.querySelector('.el-make');
    const spinEl = btn.querySelector('.el-spin'), playEl = btn.querySelector('.el-play');
    time.textContent = '0:04';
    let shown = -1;
    return {
      nodes: [say, card, tx],
      marks: [[T.say, say], [T.card, card], [T.tx, tx]],
      render(t) {
        const n = streamCount(SAY, T.say, 95, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.28));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;
        // creating: the placeholder shimmers in the wave's slot; it clears just before the bars grow in
        make.style.setProperty('--sh', `${(100 - ((t - T.w0) * 140) % 200).toFixed(1)}%`);
        make.style.opacity = (1 - seg(t, T.w1 - 0.1, T.w1)).toFixed(3);
        bars.forEach((b, i) => {
          const g = outCubic(seg(t, T.w1 + i * 0.004, T.w1 + 0.2 + i * 0.004));
          b.style.transform = `scaleY(${(WAVE[i] * g).toFixed(3)})`;
        });
        const x2 = seg(t, T.w1 - 0.1, T.w1 + 0.04);
        spinEl.style.opacity = (1 - x2).toFixed(3);
        spinEl.style.transform = `rotate(${((t - T.w0) * 420).toFixed(1)}deg)`;
        playEl.style.opacity = x2.toFixed(3);
        playEl.style.transform = `scale(${lerp(0.6, 1, outCubic(x2)).toFixed(4)})`;
        time.style.opacity = outCubic(seg(t, T.w1, T.w1 + 0.24)).toFixed(3);
        const o = outCubic(seg(t, T.tx, T.tx + 0.28));
        tx.style.opacity = o.toFixed(3);
        tx.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 6).toFixed(2)}px)`;
      },
    };
  },
};
