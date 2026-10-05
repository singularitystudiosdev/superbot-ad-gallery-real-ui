// Voice beat: ElevenLabs reads the voiceover. The card names the model and the voice (eleven_v3, "Sam", cloned from the
// creator), shows the script line, and a waveform that first BUILDS (the bars rise left to right as the take is
// generated) and then PLAYS with a playhead sweeping it while the words light one by one. Footer: the take's format
// (0:06, 48 kHz, 1 take). The waveform is a fixed amplitude envelope (a data plot, not art); no transport of any kind:
// no play/pause glyph, no scrubber, no download. Pure function of t: every value is written from t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Voiced the script in your voice.';
const SCRIPT = 'Meet the mic that beat a $1,200 studio favourite.';
const VOICE = 'eleven_v3 · Sam (your voice)';
const FOOT = '0:06 · 48 kHz · 1 take';
const N = 46;
// the amplitude envelope: deterministic, spiky like speech, tallest in the middle of the phrase
const H = Array.from({ length: N }, (_, i) => {
  const x = i / (N - 1);
  const env = Math.sin(Math.PI * x) ** 0.6;
  return 0.16 + 0.84 * env * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + (i % 3) * 0.4)));
});
const WORDS = SCRIPT.split(' ');

const CPS = 95;
const SAY_AT = 0.05;
const CARD = 0.08;
const CARD_IN = 0.24;
const GEN0 = 0.3, GEN = 0.6;         // the waveform builds
const PLAY0 = GEN0 + GEN;            // ...then plays
const DUR = 0.95;                    // the 6 s read, compressed
const FOOT_AT = PLAY0 + DUR + 0.06;
const FOOT_IN = 0.18;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.gen0 = r + GEN0; T.gen1 = r + GEN0 + GEN;
    T.p0 = r + PLAY0; T.p1 = r + PLAY0 + DUR;
    T.foot = r + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    // word spans light in turn: word i covers the slice [i, i+1) of the read
    const card = x.el(`<div class="vn2-card">
      <div class="vn2-hd"><b>Voice</b><span class="vn2-v">${x.esc(VOICE)}</span><span class="vn2-len">0:06</span></div>
      <div class="vn2-script">${WORDS.map((w) => `<span>${x.esc(w)}</span>`).join(' ')}</div>
      <div class="vn2-wave">${H.map((h) => `<i style="--h: ${(h * 100).toFixed(1)}%"><u></u></i>`).join('')}<b class="vn2-head"></b></div>
      <div class="vn2-ft">${x.OK}<span>${x.esc(FOOT)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const bars = [...card.querySelectorAll('.vn2-wave i')];
    const words = [...card.querySelectorAll('.vn2-script span')];
    const head = $('.vn2-head'), ft = $('.vn2-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lit = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.p0, $('.vn2-wave')], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the waveform builds left to right, then plays: bar i lights over its own slice of the read
        const build = seg(t, T.gen0, T.gen1);
        const play = seg(t, T.p0, T.p1) * N;
        bars.forEach((b, i) => {
          const born = Math.min(1, Math.max(0, build * N - i));
          const hh = H[i] * 100 * born;
          b.style.height = `${hh.toFixed(1)}%`;
          const o = Math.min(1, Math.max(0, play - i));
          const u = b.firstElementChild;
          u.style.opacity = o.toFixed(3);
          b.classList.toggle('on', play > i);
        });
        head.style.left = `${(seg(t, T.p0, T.p1) * 100).toFixed(2)}%`;
        head.style.opacity = (t < T.p0 ? 0 : t <= T.p1 ? 1 : (1 - seg(t, T.p1, T.p1 + 0.14))).toFixed(3);
        // the words: the one being spoken marks, spoken ones stay bright, the rest dim
        const wp = seg(t, T.p0, T.p1) * WORDS.length;
        const nl = Math.round(wp);
        if (nl !== lit) { words.forEach((w, i) => w.classList.toggle('vn2-said', i < nl)); lit = nl; }
        words.forEach((w, i) => w.classList.toggle('vn2-now', wp >= i && wp < i + 1 && t < T.p1));
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};