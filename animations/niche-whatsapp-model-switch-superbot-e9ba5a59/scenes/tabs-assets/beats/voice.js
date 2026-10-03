// Voice beat: ElevenLabs Scribe transcribes the voice notes Gemini flagged (the discord fork's voice.js grammar,
// restyled as WhatsApp voice notes). Its line streams, the "Transcribing 7 voice notes" chip spins, and a card rises
// with three of them as WhatsApp's own incoming voice-note bubbles (the sender's photo, the round play button, the
// waveform with its progress knob, the duration). Each bubble lands in turn, its button flips to pause while the
// progress sweeps the waveform, and the transcript resolves under it, as WhatsApp's own voice transcripts do, with the
// language Scribe heard in a small chip. The chip resolves to "Transcribed" and the footer tallies the languages.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount, rand } from '../../../lib.js';
import { ms } from './wa-icons.js?v=e9ba5a59';

const SAY = 'Transcribed the voice notes, in whatever language they came in.';
// [name, avatar photo (or null for WhatsApp's default avatar), duration, language, transcript]
export const NOTES = [
  ['Lucía Ortega', 'avatar-lucia.jpg', '0:14', 'ES', 'Hola, ¿mi bici ya está lista? La dejé el martes.'],
  ['João Pereira', 'avatar-joao.jpg', '0:09', 'PT', 'Oi, vocês têm câmara de ar 700x28?'],
  ['Dana Kim', null, '0:21', 'EN', 'Hey, my brakes squeal on hills. Can you fit me in Saturday?'],
];
const TOTAL = 7;
const DONE = '7 voice notes transcribed: 4 English, 2 Spanish, 1 Portuguese';
const BARS = 34;                   // waveform bars in a bubble
// timing (seconds from the reply start, or from a row's landing where noted), in the source's v3 pace
const CPS = 100;                   // the reply line streams at this many characters a second
const SAY_AT = 0.048;              // reply start to the line's first character
const CHIP_AT = 0.176;             // reply start to the "Transcribing" chip
const CARD_AT = 0.32;              // reply start to the card
const ROW_AT = 0.4;                // reply start to the first voice note landing
const STAGGER = 0.17;              // one voice note landing to the next
const RISE = 0.24;                 // the chip, the card and each row rising in
const LISTEN_AT = 0.06;            // a row landing to its playback sweep starting
const LISTEN = 0.36; /* deliberate */ // the sweep across the waveform (Scribe listening, sped up)
const TX_AT = 0.3;                 // a row landing to its transcript starting to stream
const TX_CPS = 200;                // the transcript streams at this many characters a second
const FOOT_AT = 0.12;              // the last transcript done to the footer
const FOOT_IN = 0.24;

export default {
  times(r) {
    const T = { r };
    T.chip = r + CHIP_AT;
    T.card = r + CARD_AT;
    T.row = NOTES.map((_, i) => r + ROW_AT + i * STAGGER);
    T.tx = NOTES.map((n, i) => [T.row[i] + TX_AT, T.row[i] + TX_AT + n[4].length / TX_CPS]);
    T.done = Math.max(...T.tx.map(([, b]) => b), T.row[NOTES.length - 1] + LISTEN_AT + LISTEN);
    T.foot = T.done + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Transcribing ${TOTAL} voice notes</span></div></div>`);
    const av = (photo) => (photo ? `<img src="${x.img(photo)}" alt=""/>` : `<span class="vn-def">${ms('person')}</span>`);
    const card = x.el(`<div class="vn-card">
      <div class="vn-hd"><b>Voice notes</b><small>${TOTAL} in the inbox</small></div>
      ${NOTES.map(([name, photo, dur, lang, tx], i) => `<div class="vn-row">
        <b class="vn-name">${x.esc(name)}</b>
        <div class="vn-bub">
          <div class="vn-pl">
            <span class="vn-av">${av(photo)}<i class="vn-mic">${ms('mic')}</i></span>
            <span class="vn-btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="vn-play" d="M8 5.2v13.6L19 12z"/><path class="vn-pause" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg></span>
            <span class="vn-wave">${Array.from({ length: BARS }, (_, j) => `<b style="height:${(16 + 84 * (0.3 + 0.7 * rand(i * 53 + j * 7.7)) * (0.5 + 0.5 * Math.sin((j / BARS) * Math.PI))).toFixed(0)}%"></b>`).join('')}<i class="vn-knob"></i></span>
          </div>
          <div class="vn-meta"><span>${dur}</span><span>9:4${i + 1} AM</span></div>
          <div class="vn-tx"><i class="vn-lang">${lang}</i><span class="vn-txt"><span class="qc-vis"></span><span class="qc-hid">${x.esc(tx)}</span></span></div>
        </div>
      </div>`).join('')}
      <div class="vn-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.vn-row')].map((row, i) => {
      const tx = row.querySelector('.vn-txt');
      return { row, bars: [...row.querySelectorAll('.vn-wave b')], knob: row.querySelector('.vn-knob'), btn: row.querySelector('.vn-btn'),
        lang: row.querySelector('.vn-lang'), vis: tx.firstElementChild, hid: tx.lastElementChild, text: NOTES[i][4], shown: -1, played: -1 };
    });
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const ft = card.querySelector('.vn-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[NOTES.length - 1], rows[NOTES.length - 1].row], [T.foot, ft]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + RISE), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = `${done ? 'Transcribed' : 'Transcribing'} ${TOTAL} voice notes`;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((m, i) => {
          const a = T.row[i];
          rise(m.row, seg(t, a, a + RISE), 6);
          // the playback sweep: the bars it has passed darken, the knob rides it; the button reads pause while it runs
          const p = seg(t, a + LISTEN_AT, a + LISTEN_AT + LISTEN);
          const played = Math.round(p * BARS);
          if (played !== m.played) { m.bars.forEach((b, j) => b.classList.toggle('on', j < played)); m.played = played; }
          m.knob.style.left = `${(p * 100).toFixed(2)}%`;
          m.btn.classList.toggle('vn-on', p > 0 && p < 1);
          const c = streamCount(m.text, T.tx[i][0], TX_CPS, t);
          if (c !== m.shown) { m.vis.textContent = m.text.slice(0, c); m.hid.textContent = m.text.slice(c); m.shown = c; }
          const lq = outCubic(seg(t, T.tx[i][0] - 0.06, T.tx[i][0] + 0.14));
          m.lang.style.opacity = lq.toFixed(3);
          m.lang.style.transform = lq >= 1 ? '' : `scale(${lerp(0.6, 1, lq).toFixed(3)})`;
        });
        rise(ft, seg(t, T.foot, T.foot + FOOT_IN), 6);
      },
    };
  },
};
