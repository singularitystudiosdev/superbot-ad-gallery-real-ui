// Scribe beat (the watch beat's card grammar): ElevenLabs Scribe transcribes the whole stream with word-level
// timestamps. Its line streams and a card rises ("Transcribing Friday ranked stream.mov"): the progress bar fills while
// the word count runs 0 to 18,400, the spinner resolves to the check, and the window under it zooms into 1.5 s of the
// stream at 1:12:08 (the clutch): a waveform with a playhead sweeping across it, each word landing as a block over the
// audio exactly where it is spoken ("no way that just worked"), and under it the word as Scribe returns it (text, start,
// end in seconds, speaker) updating word by word. The file line "transcript.json  ·  18,400 words" lands last.
// The waveform is UI (a level meter of bars from a fixed seed), not footage. Made up for the spot (brand/CREDITS.txt).
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Transcribed all 18,400 words with word-level timestamps.';
const LABEL = 'Transcribing Friday ranked stream.mov';
const WORDS_TOTAL = 18400;
// the window: 1.5 s of the stream, 4328.30 s to 4329.80 s (1:12:08.3 to 1:12:09.8)
const W0 = 4328.3, W1 = 4329.8;
// [text, start, end] in stream seconds, as Scribe returns them
const WORDS = [['no', 4328.40, 4328.60], ['way', 4328.62, 4328.80], ['that', 4328.81, 4329.00], ['just', 4329.02, 4329.17], ['worked', 4329.19, 4329.70]];
const META = ['transcript.json', '18,400 words', 'speaker_0'];
const BARS = 84;
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.08, COUNT = 0.62;   // the card landing to the count running 0 to 18,400 (the bar fills with it)
const SWEEP_AT = 0.36, SWEEP = 0.66;   // the card landing to the playhead sweeping the window
const WORD_IN = 0.14;                  // a word block landing as the playhead reaches it
const META_AT = 0.06, META_IN = 0.26;  // the sweep done to the file line landing

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pct = (v) => ((v - W0) / (W1 - W0)) * 100;
// the level meter: louder where words are spoken, a fixed seed so every frame draws the same bars
function bars() {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const out = [];
  for (let i = 0; i < BARS; i++) {
    const tt = W0 + ((i + 0.5) / BARS) * (W1 - W0);
    const w = WORDS.find(([, a, b]) => tt >= a && tt <= b);
    const env = w ? 0.45 + 0.55 * Math.sin(Math.PI * (tt - w[1]) / (w[2] - w[1])) : 0.12;
    const h = Math.max(0.06, Math.min(1, env * (0.55 + 0.45 * rnd())));
    out.push(h);
  }
  return out;
}
const svgBars = (hs) => `<svg class="sc-wv" viewBox="0 0 ${BARS * 4} 40" preserveAspectRatio="none" aria-hidden="true">${hs.map((h, i) => `<rect x="${i * 4 + 0.6}" y="${(20 - h * 19).toFixed(2)}" width="2.6" height="${(h * 38).toFixed(2)}" rx="1.2"/>`).join('')}</svg>`;
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const json = ([w, a, b]) => `{ "text": "${w}", "start": ${a.toFixed(2)}, "end": ${b.toFixed(2)}, "speaker_id": "speaker_0" }`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT; T.c1 = T.c0 + COUNT;     // the count runs, the bar fills; the check lands at c1
    T.s0 = T.card + SWEEP_AT; T.s1 = T.s0 + SWEEP;     // the playhead sweeps the window
    T.w = WORDS.map(([, a]) => T.s0 + SWEEP * (pct(a) / 100)); // each word lands as the playhead reaches its start
    T.meta = T.s1 + META_AT;
    // the beat's last visible change: the file line settled, or the line's last character
    T.end = Math.max(T.meta + META_IN, T.w[WORDS.length - 1] + WORD_IN, T.c1 + 0.2, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const hs = bars();
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-hd"><span class="sc-st"><i class="sc-spin"></i>${x.OK}</span><b>${esc(LABEL)}</b>
        <span class="sc-cnt"><b class="sc-n">0</b> words</span></div>
      <div class="sc-bar"><i class="sc-fill"></i></div>
      <div class="sc-win">
        <div class="sc-tl"><span>1:12:08.3</span><span>1:12:09.8</span></div>
        <div class="sc-lane">
          <div class="sc-words">${WORDS.map(([w, a, b]) => `<span class="sc-w" style="left:${pct(a).toFixed(2)}%;width:${(pct(b) - pct(a)).toFixed(2)}%"><b>${esc(w)}</b></span>`).join('')}</div>
          <div class="sc-wave">${svgBars(hs)}<div class="sc-played">${svgBars(hs)}</div></div>
          <i class="sc-ph"></i>
        </div>
        <div class="sc-js"><span></span></div>
      </div>
      <div class="sc-meta"><b>${META[0]}</b><i>&middot;</i><span>${META[1]}</span><i>&middot;</i><span>${META[2]}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const n = $('.sc-n'), fill = $('.sc-fill'), spin = $('.sc-spin'), ok = $('.sc-st .qc-ok');
    const played = $('.sc-played'), ph = $('.sc-ph'), js = $('.sc-js span'), meta = $('.sc-meta');
    const words = [...card.querySelectorAll('.sc-w')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', jsk = -2;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the whole stream: the count runs and the bar fills; the spinner resolves to the check as it lands
        const p = outCubic(seg(t, T.c0, T.c1));
        const c = fmt(WORDS_TOTAL * p);
        if (c !== count) { n.textContent = c; count = c; }
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the window: the playhead sweeps, the played part of the waveform lights, each word lands where it is spoken
        const sp = seg(t, T.s0, T.s1); // linear: the playhead is the stream's clock
        played.style.clipPath = `inset(0 ${((1 - sp) * 100).toFixed(3)}% 0 0)`;
        ph.style.left = `${(sp * 100).toFixed(3)}%`;
        ph.style.opacity = (seg(t, T.s0 - 0.1, T.s0) * (1 - seg(t, T.s1, T.s1 + 0.2))).toFixed(3);
        let last = -1;
        words.forEach((w, i) => {
          const q = outCubic(seg(t, T.w[i], T.w[i] + WORD_IN));
          w.style.opacity = q.toFixed(3);
          w.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
          if (t >= T.w[i]) last = i;
        });
        if (last !== jsk) { js.textContent = last < 0 ? '' : json(WORDS[last]); jsk = last; }

        const m = outCubic(seg(t, T.meta, T.meta + META_IN));
        meta.style.opacity = m.toFixed(3);
        meta.style.transform = m >= 1 ? 'none' : `translateY(${((1 - m) * 8).toFixed(2)}px)`;
      },
    };
  },
};
