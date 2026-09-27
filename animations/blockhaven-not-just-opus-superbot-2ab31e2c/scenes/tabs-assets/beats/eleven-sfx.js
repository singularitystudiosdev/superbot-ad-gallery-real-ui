// Step 4, ElevenLabs: the game's three sound effects, generated one after another. The card is pocketsflow-untold's
// ElevenLabs score card (audio.css .aud-*): a play glyph, the sound's name, its length, and a waveform that records in
// behind a playhead, then a check. The waveforms are the real peak envelopes of the Kenney CC0 clips this folder already
// carries (gen/sfx/peaks.js, 56 peaks each, resampled to BARS): wood chop = chop.ogg, grass step = footstep_grass_000,
// block pop = impactSoft_heavy_000; the lengths are those clips' own.
import { clamp, seg, lerp } from '../../../lib.js';
import SFX from '../../../gen/sfx/peaks.js?v=2';
import { sayer, rise } from './kit.js';

const BARS = 40;
const REC = 0.42;       // one sound recording in
const STAGGER = 0.24;   // the next row starts
const SOUNDS = [
  ['Wood chop', 'chop'],
  ['Grass step', 'footstep_grass_000'],
  ['Block pop', 'impactSoft_heavy_000'],
];
const PLAY = '<svg class="aud-play-i" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.4v9.2l7.4-4.6z"/></svg>';

// 56 peaks down to BARS by taking each bucket's max, normalised to the loudest bar
function bars(peaks) {
  const out = [];
  for (let i = 0; i < BARS; i++) {
    const a = Math.floor((i * peaks.length) / BARS), b = Math.max(a + 1, Math.floor(((i + 1) * peaks.length) / BARS));
    out.push(Math.max(...peaks.slice(a, b)));
  }
  const m = Math.max(...out) || 1;
  return out.map((v) => v / m);
}

export default {
  times(r, c) {
    const p = c.pace || 1;
    const T = { say: r + 0.04, label: r + 0.26 * p, card: r + 0.34 * p };
    T.rows = SOUNDS.map((_, i) => T.card + (0.16 + i * STAGGER) * p);
    T.ok = T.rows.map((a) => a + REC * p + 0.04);
    T.end = T.ok[T.ok.length - 1] + 0.28 * p;
    return T;
  },

  build(k, x) {
    const T = k.T;
    const say = sayer(x, k.cfg.say.sfx, 90);
    const chip = x.el(`<div class="dd-chiprow aud-chiprow"><span class="ch-tool aud-chip">${x.tile('eleven')}<span>Generating 3 sound effects</span></span></div>`);
    const rows = SOUNDS.map(([name, id]) => {
      const s = SFX[id];
      const hs = bars(s.peaks);
      const n = x.el(`<div class="aud-row"><span class="aud-play">${PLAY}</span><span class="aud-t">${x.esc(name)}</span>`
        + `<span class="aud-d">${s.dur.toFixed(2)}s</span><span class="aud-wave"><i class="aud-head"></i>`
        + hs.map((h) => `<i class="aud-bar" style="height:${(3 + h * 19).toFixed(1)}px"></i>`).join('')
        + `</span><span class="aud-tick">${x.OK}</span></div>`);
      return { n, bars: [...n.querySelectorAll('.aud-bar')], head: n.querySelector('.aud-head'), tick: n.querySelector('.aud-tick') };
    });
    const card = x.el('<div class="aud-card"></div>');
    rows.forEach((r) => card.appendChild(r.n));
    return {
      nodes: [say.node, chip, card],
      marks: [[T.label, chip], [T.card, card]],
      render(t) {
        say.render(t, T.say);
        rise(chip, seg(t, T.label, T.label + 0.2));
        rise(card, seg(t, T.card, T.card + 0.22));
        rows.forEach((r, i) => {
          const a = T.rows[i];
          r.n.style.opacity = lerp(0.35, 1, seg(t, a - 0.08, a + 0.06)).toFixed(3);
          const p = seg(t, a, a + REC * (k.cfg.pace || 1));
          r.head.style.left = (p * 100).toFixed(1) + '%';
          r.head.style.opacity = p > 0 && p < 1 ? '1' : '0';
          r.bars.forEach((b, j) => {
            const on = clamp((p * BARS - j) / 1.5, 0, 1);
            b.style.transform = `scaleY(${(0.12 + 0.88 * on).toFixed(3)})`;
            b.style.opacity = (0.35 + 0.65 * on).toFixed(3);
          });
          const ok = seg(t, T.ok[i], T.ok[i] + 0.16);
          r.tick.style.opacity = ok.toFixed(3);
          r.tick.style.transform = `scale(${(0.6 + 0.4 * ok).toFixed(3)})`;
        });
      },
    };
  },
};
