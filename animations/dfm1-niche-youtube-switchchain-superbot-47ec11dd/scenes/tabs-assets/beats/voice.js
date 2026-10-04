// Voice beat (ElevenLabs): Sam's three trailer VO lines voiced in his Professional Voice Clone on Eleven v4, and a
// lo-fi bed scored with Eleven Music v2.5. The line streams, then a card in ElevenLabs' own monochrome studio look
// rises: the voice row (the gradient voice orb, "Sam (your voice)", "Professional Voice Clone", the model "Eleven v4"),
// the script (the three VO lines with their in-points on the trailer timeline; each word lights as the VO lane's
// draw head passes its spoken time), then two lanes on one 0:30 ruler drawing left to right: the VO (0:28) and the
// music bed (0:30). No transport of any kind (no play or pause glyph, no scrubber knob, no download control): the
// lanes are a render filling in, with their lengths counting up as text. No audio tags are shown (the Eleven v4 docs
// list them for v4 Turbo, not v4) and no voice-setting sliders.
// The bar heights and word times come from beats/voice-peaks.js (baked by audio/bake-voice-peaks.mjs; provenance in
// audio/CREDITS.txt). Pure function of t: every value on screen is written from t.
import { lerp, seg, outCubic, clamp, streamCount } from '../../../lib.js';
import { PEAKS } from './voice-peaks.js?v=47ec11dd';

const SAY = 'Voiced it in your cloned voice and scored it. 0:28 of voiceover, 0:30 of music.';
const RULER = 30;            // both lanes share one 0:30 ruler (the trailer's length)

const CPS = 90;              // the line streams
const SAY_AT = 0.05;         // reply start to the line's first character
const CARD_AT = 0.12;        // reply start to the card rising
const CARD_IN = 0.3;         // the card rising in
const VO_AT = 0.4;           // reply start to the VO lane starting to draw
const VO_LEN = 1.35;         // the VO lane's draw (slowed over speech, quick over the silences)
const MU_AT = 0.55;          // reply start to the music lane starting to draw
const MU_LEN = 1.3;          // the music lane's draw (linear)
const HOLD = 0.6; /* deliberate */ // the finished card holds, all three lines and both lanes legible

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// the VO draw head: audio time tau as a function of draw progress p. Speech weighs 1, silence 0.22, so the head
// lingers where words are and the highlighted word stays readable for a few frames.
const WORDS = PEAKS.lines.flatMap((l) => l.words);
const speaking = (tau) => WORDS.some(([, a, b]) => tau >= a && tau < b);
const GRID = 560;
const CUM = (() => {
  const c = [0];
  for (let i = 0; i < GRID; i++) c.push(c[i] + (speaking(((i + 0.5) / GRID) * PEAKS.voDur) ? 1 : 0.22));
  return c.map((v) => v / c[GRID]);
})();
function headAt(p) {
  if (p <= 0) return 0;
  if (p >= 1) return PEAKS.voDur;
  let i = 0;
  while (i < GRID - 1 && CUM[i + 1] < p) i++;
  const f = (p - CUM[i]) / Math.max(1e-9, CUM[i + 1] - CUM[i]);
  return ((i + clamp(f)) / GRID) * PEAKS.voDur;
}

const lane = (env, dur, cls) => `<div class="el-lane ${cls}" style="width: ${((dur / RULER) * 100).toFixed(3)}%">${env.map((v) => `<i style="height: ${Math.max(6, v).toFixed(0)}%"></i>`).join('')}</div>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.vo0 = r + VO_AT; T.vo1 = T.vo0 + VO_LEN;
    T.mu0 = r + MU_AT; T.mu1 = T.mu0 + MU_LEN;
    T.end = Math.max(T.vo1, T.mu1, r + SAY_AT + SAY.length / CPS) + HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="el-card">
      <div class="el-hd">
        <span class="el-orb"></span>
        <span class="el-vn"><b>Sam (your voice)</b><small>Professional Voice Clone</small></span>
        <span class="el-model">Eleven v4</span>
      </div>
      <div class="el-script">${PEAKS.lines.map((l) => `<div class="el-ln"><span class="el-at">${fmt(l.at)}</span><span class="el-tx">${l.words.map(([w]) => `<span>${x.esc(w)}</span>`).join(' ')}</span></div>`).join('')}</div>
      <div class="el-trk">
        <div class="el-lb"><b>Voiceover</b><span>Eleven v4, <em class="el-vo-n">0:00</em></span></div>
        <div class="el-rail">${lane(PEAKS.vo, PEAKS.voDur, 'el-vo')}</div>
      </div>
      <div class="el-trk">
        <div class="el-lb"><b>Music</b><span>Eleven Music v2.5, lo-fi, ${PEAKS.bpm} BPM, <em class="el-mu-n">0:00</em></span></div>
        <div class="el-rail">${lane(PEAKS.music, PEAKS.musicDur, 'el-mu')}</div>
      </div>
      <div class="el-ruler">${[0, 5, 10, 15, 20, 25, 30].map((s) => `<span style="left: ${((s / RULER) * 100).toFixed(3)}%">${fmt(s)}</span>`).join('')}</div>
    </div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const vo = [...card.querySelectorAll('.el-vo i')], mu = [...card.querySelectorAll('.el-mu i')];
    const voN = card.querySelector('.el-vo-n'), muN = card.querySelector('.el-mu-n');
    const words = [...card.querySelectorAll('.el-tx span')].map((n, i) => ({ n, a: WORDS[i][1], b: WORDS[i][2], st: null }));
    const bars = (list, pos) => list.forEach((n, i) => {
      // bar i grows in over its own slice as the head passes it (drawn = solid black, ahead = nothing yet)
      const f = clamp(pos - i);
      const s = f > 0 ? (0.25 + 0.75 * outCubic(f)).toFixed(3) : '0';
      if (n._s !== s) { n.style.transform = `scaleY(${s})`; n._s = s; }
    });
    let shown = -1, voT = '', muT = '';
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the VO lane: the head's audio time drives both the bars and the words
        const vp = seg(t, T.vo0, T.vo1);
        const tau = headAt(vp);
        bars(vo, (tau / PEAKS.voDur) * vo.length);
        const vs = vp >= 1 ? fmt(PEAKS.voDur) : fmt(tau);
        if (vs !== voT) { voN.textContent = vs; voT = vs; }
        words.forEach((w) => {
          const st = vp <= 0 || tau < w.a ? '' : tau < w.b && vp < 1 ? 'el-now' : 'el-said';
          if (st !== w.st) { w.n.className = st; w.st = st; }
        });
        // the music lane: linear
        const mp = seg(t, T.mu0, T.mu1);
        bars(mu, mp * mu.length);
        const ms = fmt(mp * PEAKS.musicDur);
        if (ms !== muT) { muN.textContent = ms; muT = ms; }
      },
    };
  },
};
