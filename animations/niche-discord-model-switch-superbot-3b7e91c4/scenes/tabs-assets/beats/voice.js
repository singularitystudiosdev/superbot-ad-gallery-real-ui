// Voice beat: ElevenLabs Scribe transcribes the three Discord voice messages Gemini found. Its line streams, the
// "Transcribing 3 voice messages" chip spins, and a card rises with the three voice messages in Discord's own player
// (blurple play circle, waveform, duration). Each row lands in turn, its play button flips to pause while the progress
// sweeps the waveform, and its transcript resolves under it as one line. The chip resolves to "Transcribed".
// The grammar is the source's sound beat (chip, takes card, staggered rows). Pure function of t: every moving value
// is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Transcribed the three voice notes from Leo, Theo and Maya.';
// [name, default-avatar colour, role colour, duration, transcript]
const NOTES = [
  ['Leo', 'blurple', 'teal', '0:42', 'Steam page goes live Monday, launch is the 24th.'],
  ['Theo', 'green', 'blue', '0:18', 'I can run the build server during the playtest.'],
  ['Maya', 'pink', 'orange', '0:27', 'Friday works for me, 7pm ET.'],
];
const BARS = 30;                   // waveform bars in a player
// timing (seconds from the reply start, or from a row's landing where noted), in the source's v3 pace
const CPS = 100;                   // the reply line streams at this many characters a second
const SAY_AT = 0.048;              // reply start to the line's first character
const CHIP_AT = 0.176;             // reply start to the "Transcribing" chip
const CARD_AT = 0.32;              // reply start to the card
const ROW_AT = 0.44;               // reply start to the first message landing
const STAGGER = 0.176;             // one message landing to the next
const RISE = 0.24;                 // the chip, the card and each row rising in
const LISTEN_AT = 0.06;            // a row landing to its playback sweep starting
const LISTEN = 0.4; /* deliberate */ // the sweep across the waveform (Scribe listening, sped up)
const TX_AT = 0.3;                 // a row landing to its transcript starting to stream
const TX_CPS = 150;                // the transcript streams at this many characters a second
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="vc-pl" d="M8 5.5v13l11-6.5z"/><path class="vc-pa" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + CHIP_AT;
    T.card = r + CARD_AT;
    T.row = NOTES.map((_, i) => r + ROW_AT + i * STAGGER);
    T.tx = NOTES.map((n, i) => [T.row[i] + TX_AT, T.row[i] + TX_AT + n[4].length / TX_CPS]);
    T.done = Math.max(...T.tx.map(([, b]) => b), T.row[NOTES.length - 1] + LISTEN_AT + LISTEN);
    // the beat's last visible change: the last transcript's last character, or the line's
    T.end = Math.max(T.done, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Transcribing ${NOTES.length} voice messages</span></div></div>`);
    const card = x.el(`<div class="vc-card">
      <div class="vc-hd"><b>Voice messages</b><small>#general</small></div>
      ${NOTES.map(([name, avc, role, dur, tx], i) => `<div class="vc-row">
        <span class="vc-av" style="--c: var(--dc-av-${avc})"><img src="${x.brand('discord-logo.svg')}" alt=""/></span>
        <div class="vc-main">
          <b class="vc-name" style="color: var(--dc-role-${role})">${x.esc(name)}</b>
          <div class="vc-pl"><span class="vc-btn">${PLAY}</span><span class="vc-wave">${Array.from({ length: BARS }, (_, j) => `<b style="height:${(18 + 82 * (0.35 + 0.65 * rand(i * 41 + j * 7.3)) * (0.55 + 0.45 * Math.sin((j / BARS) * Math.PI))).toFixed(0)}%"></b>`).join('')}</span><small>${dur}</small></div>
          <div class="vc-tx"><span class="qc-vis"></span><span class="qc-hid">${x.esc(tx)}</span></div>
        </div>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.vc-row')].map((row, i) => {
      const tx = row.querySelector('.vc-tx');
      return { row, bars: [...row.querySelectorAll('.vc-wave b')], btn: row.querySelector('.vc-btn'), vis: tx.firstElementChild, hid: tx.lastElementChild, text: NOTES[i][4], shown: -1, played: -1 };
    });
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[NOTES.length - 1], rows[NOTES.length - 1].row]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + RISE), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = `${done ? 'Transcribed' : 'Transcribing'} ${NOTES.length} voice messages`;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((m, i) => {
          const a = T.row[i];
          rise(m.row, seg(t, a, a + RISE), 6);
          // the playback sweep: the bars it has passed light up; the button reads pause while it runs
          const p = seg(t, a + LISTEN_AT, a + LISTEN_AT + LISTEN);
          const played = Math.round(p * BARS);
          if (played !== m.played) { m.bars.forEach((b, j) => b.classList.toggle('on', j < played)); m.played = played; }
          m.btn.classList.toggle('vc-on', p > 0 && p < 1);
          const c = streamCount(m.text, T.tx[i][0], TX_CPS, t);
          if (c !== m.shown) { m.vis.textContent = m.text.slice(0, c); m.hid.textContent = m.text.slice(c); m.shown = c; }
        });
      },
    };
  },
};
