// Huddles beat: ElevenLabs Scribe transcribes the two Slack huddles Sam missed. Its line streams, the "Transcribing 2
// huddles" chip spins, and a card rises with the two huddle recordings (Slack's huddle headphones on its green, the
// channel and length, a player pill with a waveform). Each row lands in turn, its play button flips to pause while the
// progress sweeps the waveform, and the line that mattered resolves under it as Scribe writes it. The chip resolves to
// "Transcribed", and the card's last line lands: the decisions Scribe found. The grammar is the sibling forks' voice
// beat (chip, takes card, staggered rows, waveform sweep, streaming transcript).
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount, rand } from '../../../lib.js';
import { icon } from './sk-icons.js?v=9156b108';

const SAY = 'Transcribing the 2 huddles you missed.';
// [channel, length, speaker, line]
const HUDDLES = [
  ['launch-q4', '38 min', 'Priya', "Let's move launch to the 14th so the FAQ is ready."],
  ['design', '21 min', 'Leo', 'Option B tested best, 7 of 9 people finished setup.'],
];
const DECISIONS = 'Decisions found: launch moves to Oct 14, onboarding goes with option B';
const BARS = 34;                   // waveform bars in a player
// timing (seconds from the reply start, or from a row's landing where noted), in the source's v3 pace
const CPS = 100;                   // the reply line streams at this many characters a second
const SAY_AT = 0.048;              // reply start to the line's first character
const CHIP_AT = 0.176;             // reply start to the "Transcribing" chip
const CARD_AT = 0.32;              // reply start to the card
const ROW_AT = 0.44;               // reply start to the first huddle landing
const STAGGER = 0.22;              // one huddle landing to the next
const RISE = 0.24;                 // the chip, the card and each row rising in
const LISTEN_AT = 0.06;            // a row landing to its playback sweep starting
const LISTEN = 0.45; /* deliberate */ // the sweep across the waveform (Scribe listening, sped up)
const TX_AT = 0.3;                 // a row landing to its transcript starting to stream
const TX_CPS = 150;                // the transcript streams at this many characters a second
const DEC_AT = 0.08, DEC_IN = 0.28; // the last transcript written to the decisions line, and its rise
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="hd-pl" d="M8 5.5v13l11-6.5z"/><path class="hd-pa" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + CHIP_AT;
    T.card = r + CARD_AT;
    T.row = HUDDLES.map((_, i) => r + ROW_AT + i * STAGGER);
    T.tx = HUDDLES.map((h, i) => [T.row[i] + TX_AT, T.row[i] + TX_AT + (h[2].length + 2 + h[3].length) / TX_CPS]);
    T.heard = Math.max(...T.tx.map(([, b]) => b), T.row[HUDDLES.length - 1] + LISTEN_AT + LISTEN);
    T.dec = T.heard + DEC_AT;
    T.done = T.dec + DEC_IN;
    // the beat's last visible change: the decisions line settled, or the reply line's last character
    T.end = Math.max(T.done, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Transcribing ${HUDDLES.length} huddles</span></div></div>`);
    const card = x.el(`<div class="hd-card">
      <div class="hd-hd"><b>Huddles</b><small>Sep 22 to Oct 2</small></div>
      ${HUDDLES.map(([ch, len, who, line], i) => `<div class="hd-row">
        <span class="hd-tile">${icon('headphones')}</span>
        <div class="hd-main">
          <b class="hd-name">#${x.esc(ch)} huddle, ${x.esc(len)}</b>
          <div class="hd-pl"><span class="hd-btn">${PLAY}</span><span class="hd-wave">${Array.from({ length: BARS }, (_, j) => `<b style="height:${(18 + 82 * (0.35 + 0.65 * rand(i * 53 + j * 7.3)) * (0.55 + 0.45 * Math.sin((j / BARS) * Math.PI))).toFixed(0)}%"></b>`).join('')}</span></div>
          <div class="hd-tx"><span class="qc-vis"></span><span class="qc-hid">${x.esc(`${who}: ${line}`)}</span></div>
        </div>
      </div>`).join('')}
      <div class="hd-dec">${x.OK}<span>${x.esc(DECISIONS)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.hd-row')].map((row, i) => {
      const tx = row.querySelector('.hd-tx');
      const [, , who, line] = HUDDLES[i];
      return { row, bars: [...row.querySelectorAll('.hd-wave b')], btn: row.querySelector('.hd-btn'), vis: tx.firstElementChild, hid: tx.lastElementChild, who, line, text: `${who}: ${line}`, shown: -1, played: -1 };
    });
    const dec = card.querySelector('.hd-dec'), decOk = dec.querySelector('.qc-ok');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // the speaker's name is bold, the line plain: write the visible prefix with the name split out
    const txHTML = (m, c) => {
      const s = m.text.slice(0, c), cut = m.who.length + 1;
      return c <= cut ? `<b>${x.esc(s)}</b>` : `<b>${x.esc(s.slice(0, cut))}</b>${x.esc(s.slice(cut))}`;
    };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[HUDDLES.length - 1], rows[HUDDLES.length - 1].row], [T.dec, card]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + RISE), 8);
        const done = t >= T.heard;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = `${done ? 'Transcribed' : 'Transcribing'} ${HUDDLES.length} huddles`;
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
          m.btn.classList.toggle('hd-on', p > 0 && p < 1);
          const c = streamCount(m.text, T.tx[i][0], TX_CPS, t);
          if (c !== m.shown) { m.vis.innerHTML = txHTML(m, c); m.hid.textContent = m.text.slice(c); m.shown = c; }
        });

        // the decisions line: what the two huddles settled, with its check
        const e = outCubic(seg(t, T.dec, T.dec + DEC_IN));
        dec.style.opacity = e.toFixed(3);
        dec.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 6).toFixed(2)}px)`;
        decOk.style.transform = `scale(${lerp(0.5, 1, e).toFixed(4)})`;
      },
    };
  },
};
