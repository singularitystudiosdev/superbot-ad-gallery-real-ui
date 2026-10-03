// Listen beat: Gemini listens to the single. Its line streams and a card rises (the sibling's catalog grammar: a
// compact card, a status line, a waveform strip that plays through, rows that resolve). First the file:
// "last-bus-home.wav", "Vocal, acoustic guitar and Rhodes". Then the status "Listening" with a spinner while the
// strip plays through (no counter, no minutes, no clock: policy), resolving to the green check and "Listened". Four
// findings land as rows (a glyph, the finding, its detail): the lyrics transcribed from the vocal (3 verses, 2
// choruses), the bridge that clips (+0.4 dBTP; the highlighted row, its region shades red on the strip), the room
// noise after the last chord (its tail shades on the strip) and the key and tempo (D minor, 92 BPM, slow and warm).
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=cd0a8aa3';
import { REL } from './rel.js?v=cd0a8aa3';

const SAY = `Listened to ${REL.title}, every line and every bar.`;
// the findings: [glyph, what, detail, highlighted, region on the strip (0..1 of the song)]
const FINDINGS = [
  ['mic-vocal', 'Lyrics transcribed from the vocal', '3 verses, 2 choruses', false, null],
  ['triangle-alert', 'The bridge clips', 'Peaks at +0.4 dBTP', true, [0.6, 0.71]],
  ['audio-lines', 'Room noise after the last chord', 'Hiss under the fade', false, [0.93, 1]],
  ['music', 'D minor, 92 BPM', 'Slow and warm', false, null],
];
// the waveform strip: BARS bars, heights from a fixed seed (a song-like envelope: quiet intro, verses, louder bridge)
const BARS = 110;
const HEIGHTS = Array.from({ length: BARS }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453, r = a - Math.floor(a);
  const x = i / BARS;
  const env = x < 0.06 ? 0.35 : x > 0.93 ? 0.22 : x > 0.6 && x < 0.71 ? 0.95 : 0.62 + 0.12 * Math.sin(x * 19);
  return Math.max(0.14, Math.min(1, env * (0.62 + r * 0.45)));
});
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const PLAY_AT = 0.2;                   // the card landing to the strip starting to play through
const PLAY = 0.8; /* deliberate */     // the strip playing through (the listen)
const ROW_AT = 0.3;                    // the play starting to the first finding
const STAGGER = 0.16;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const HOLD = 0.35; /* deliberate */    // the last finding in, the card holds before the next pill

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.row = FINDINGS.map((_, i) => T.p0 + ROW_AT + i * STAGGER);
    T.end = Math.max(T.row[FINDINGS.length - 1] + ROW_IN + HOLD, T.p1 + 0.2, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const pct = (v) => (100 * v).toFixed(3);
    const regions = FINDINGS.map(([, , , , reg], i) => (reg ? `<i class="ls-reg${FINDINGS[i][3] ? ' ls-hot' : ''}" data-i="${i}" style="left:${pct(reg[0])}%;width:${pct(reg[1] - reg[0])}%"></i>` : '')).join('');
    const card = x.el(`<div class="ls-card">
      <div class="ls-file"><span class="ls-ic">${lc('file-audio')}</span><span class="ls-fm"><b>${x.esc(REL.file)}</b><small>Vocal, acoustic guitar and Rhodes</small></span></div>
      <div class="ls-st"><span class="ls-sti"><i class="ls-spin"></i>${x.OK}</span><b class="ls-stl">Listening</b></div>
      <div class="ls-wave">${HEIGHTS.map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('')}${regions}</div>
      <div class="ls-list">${FINDINGS.map(([gl, name, text, hi]) => `<div class="ls-row${hi ? ' ls-hi' : ''}"><span class="ls-gl">${lc(gl)}</span>
        <span class="ls-main"><b>${x.esc(name)}</b><span>${x.esc(text)}</span></span></div>`).join('')}</div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.ls-spin'), ok: $('.ls-sti .qc-ok'), label: $('.ls-stl') };
    const stl = $('.ls-st'), wave = $('.ls-wave');
    const bars = [...wave.querySelectorAll(':scope > i:not(.ls-reg)')];
    const regs = [...wave.querySelectorAll('.ls-reg')].map((m) => ({ m, i: +m.dataset.i }));
    const rows = [...card.querySelectorAll('.ls-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, played = -1, lab = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.row[3], rows[3]]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        const cin = outCubic(seg(t, T.p0 - 0.1, T.p0 + 0.14));
        stl.style.opacity = cin.toFixed(3);
        wave.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.p0, T.p1));
        const p = Math.round(BARS * q);
        if (p !== played) { bars.forEach((b, i) => b.classList.toggle('on', i < p)); played = p; }
        const d = outCubic(seg(t, T.p1, T.p1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.p1 - 0.08, T.p1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.p0) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const l = t >= T.p1 ? 'Listened' : 'Listening';
        if (l !== lab) { st.label.textContent = l; lab = l; }

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        regs.forEach(({ m, i }) => { m.style.opacity = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN)).toFixed(3); });
      },
    };
  },
};
