// Voice beat: ElevenLabs reads the pinned reply aloud as a short voice note. Its line streams ("Here's the pinned reply
// as a voice note.") and a voice-note card rises in superbot's dark panel grammar: a header row ("Voice note" and the
// note's static length; the ElevenLabs two-bar mark is left out of the card on purpose: beside a waveform it reads as
// a pause button, and the reply's own author row already names ElevenLabs in its wordmark lockup), a waveform of 48 bars whose heights are the REAL audio's amplitude envelope
// (audio/voice-note.js, baked from audio/voice-note.mp3), filling left to right in step with the audio, the reply text
// with each word lighting as it is spoken (the word times are baked from the same audio), and a small caption. No
// transport of any kind (no play or pause glyph, no scrubber knob, no speed or download control, no elapsed counter):
// it is a recording playing, not a player. The renderer mixes audio/voice-note.mp3 in at window.__AD_MARKS.voice.
// Pure function of t: every value on screen is written from t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { VOICE } from '../../../audio/voice-note.js?v=0670df81';

const SAY = 'Here\'s the pinned reply as a voice note.';
const CAPTION = 'Pinned reply, read by ElevenLabs';
// the static length, the real audio's rounded up (0:0N)
const LEN = `0:${String(Math.ceil(VOICE.dur)).padStart(2, '0')}`;
const BARS = VOICE.env.length;

const CPS = 90;              // the line streams
const SAY_AT = 0.05;         // reply start to the line's first character
const CARD_AT = 0.12;        // reply start to the card rising
const CARD_IN = 0.3;         // the card rising in
const PLAY_AT = 0.3; /* deliberate */  // the card landing to the audio starting (it reads first)
const HOLD = 0.6; /* deliberate */     // the finished note holds before the scene moves on

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.a0 = T.card + PLAY_AT;           // the audio starts (window.__AD_MARKS.voice)
    T.a1 = T.a0 + VOICE.dur;           // ...and ends
    T.end = Math.max(T.a1 + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { voice: T.a0, voiceDur: VOICE.dur });
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="vn-card">
      <div class="vn-hd"><b>Voice note</b><span class="vn-len">${LEN}</span></div>
      <div class="vn-wave">${VOICE.env.map((v) => `<i style="height: ${(8 + v * 92).toFixed(1)}%"><u></u></i>`).join('')}</div>
      <div class="vn-text">${VOICE.words.map(([w]) => `<span>${esc(w)}</span>`).join(' ')}</div>
      <div class="vn-cap">${esc(CAPTION)}</div>
    </div>`);
    const bars = [...card.querySelectorAll('.vn-wave u')];
    const words = [...card.querySelectorAll('.vn-text span')].map((n, i) => ({ n, t0: VOICE.words[i][1], t1: VOICE.words[i][2], st: '' }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the waveform fills left to right with the audio: bar i lights over its own slice of the note
        const p = seg(t, T.a0, T.a1) * BARS;
        bars.forEach((u, i) => { u.style.opacity = Math.min(1, Math.max(0, p - i)).toFixed(3); });
        // the words: spoken ones bright, the one being spoken marked, the rest dim
        const lt = t - T.a0;
        words.forEach((w) => {
          const st = lt < w.t0 ? '' : lt < w.t1 && t < T.a1 ? 'vn-now' : 'vn-said';
          if (st !== w.st) { w.n.className = st; w.st = st; }
        });
      },
    };
  },
};
