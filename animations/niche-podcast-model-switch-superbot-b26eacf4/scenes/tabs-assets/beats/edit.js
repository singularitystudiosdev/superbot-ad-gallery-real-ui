// Edit beat: Gemini listens to the raw interview and marks the edit. Its line streams and a card rises (the base's
// catalog grammar: a compact card, a counter, rows that resolve). First the recording: a waveform glyph tile, "Episode
// 42 raw recording", "1:14:08, host and guest tracks". Then the counter "Listening to 74 min of audio, 2 tracks" ticks
// the minutes up while a thin waveform strip plays through under it (the base's counter bar, drawn as the episode's
// waveform), and three findings resolve as rows (a glyph tile; the finding; where or how many; the time it cuts). The
// first, the off-topic tangent, carries the highlight; as each row lands its cut region shades on the strip. The footer
// lands with the green check: "Cut 17:36, episode now runs 56:32".
// EP is the one table of episode facts every later beat and the Spotify for Creators page read (brand/CREDITS.txt
// DATA: the show, the host, the guest and every number are made up for the spot; 1:14:08 minus 8:35, 6:10 and 2:51 is
// 56:32). Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=b26eacf4';

const SAY = 'Listened to the whole interview and marked what to cut.';
export const EP = {
  show: 'Kiln and Counter', host: 'Maya Ortiz', initials: 'MO', guest: 'Lena Brooks', number: 42,
  title: 'From garage kiln to three studios, with Lena Brooks',
  summary: 'Lena Brooks fired her first bowls in a garage kiln. Five years later she runs three pottery studios. We talk pricing handmade work, the wholesale order that almost sank her, and why she still teaches on Tuesdays.',
  raw: '1:14:08', rawMin: 74, rawSec: 4448, tracks: 2, cut: '17:36', runtime: '56:32', runSec: 3392, date: 'Oct 3, 2026',
  file: 'ep42-raw-interview.wav',
  // Spotify's documented chapter format "(MM:SS) Title": first at 00:00, at least 30 s apart, titles under 40 chars
  chapters: [
    ['00:00', 'Cold open'], ['01:12', 'The garage kiln'], ['09:48', 'Pricing handmade work'], ['21:30', 'The wholesale order'],
    ['33:05', 'Opening studio two'], ['44:20', 'Teaching on Tuesdays'], ['53:10', 'What comes next'],
  ],
};
// the findings: [what, where or how many, tag, lucide glyph, highlighted, cut regions on the raw timeline (seconds)]
const FINDINGS = [
  ['Off-topic tangent', '31:05 to 39:40', 'Cut 8:35', 'scissors', true, [[1865, 2380]]],
  ['Filler words and long pauses', '214 found', 'Cut 6:10', 'audio-lines', false, null],
  ['False start before the intro', '00:00 to 02:51', 'Cut 2:51', 'skip-forward', false, [[0, 171]]],
];
const DONE = `Cut ${EP.cut}, episode now runs ${EP.runtime}`;
// the waveform strip: BARS bars across the raw 1:14:08, heights from a fixed seed (a speech-like envelope)
const BARS = 120;
const HEIGHTS = Array.from({ length: BARS }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453, r = a - Math.floor(a);
  const b = Math.sin(i * 0.37) * 0.18 + Math.sin(i * 1.7) * 0.12;
  return Math.max(0.18, Math.min(1, 0.42 + b + r * 0.5));
});
// the filler words: thin ticks spread through the recording (a sample of the 214), drawn when that row lands
const FILLER = [7, 13, 19, 24, 29, 41, 46, 52, 58, 63, 68, 74, 81, 87, 92, 97, 103, 109, 114];
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.2;                  // the card landing to the counter starting
const COUNT = 0.7; /* deliberate */    // the counter running up to 74 min (the strip plays through with it)
const ROW_AT = 0.3;                    // the counter starting to the first finding
const STAGGER = 0.14;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.24;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = FINDINGS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const pct = (s) => (100 * s / EP.rawSec).toFixed(3);
    const regions = FINDINGS.map(([, , , , , reg], i) => (reg || []).map(([a, b]) => `<i class="ct-cut" data-i="${i}" style="left:${pct(a)}%;width:${pct(b - a)}%"></i>`).join('')).join('');
    const ticks = FILLER.map((b) => `<i class="ct-tick" data-i="1" style="left:${(100 * (b + 0.5) / BARS).toFixed(3)}%"></i>`).join('');
    const card = x.el(`<div class="ct-card">
      <div class="ct-store">
        <span class="ct-bag">${lc('audio-lines')}</span>
        <span class="ct-sm"><b>Episode ${EP.number} raw recording</b><code>${x.esc(EP.raw)}, host and guest tracks</code></span>
      </div>
      <div class="ct-ch"><span class="ct-st"><i class="ct-spin"></i>${x.OK}</span><b>Listening to <span class="ct-n">0</span> min of audio, ${EP.tracks} tracks</b></div>
      <div class="ct-wave">${HEIGHTS.map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('')}${regions}${ticks}</div>
      <div class="ct-list">${FINDINGS.map(([name, text, tag, gl, hi]) => `<div class="ct-row${hi ? ' ct-hi' : ''}"><span class="ct-th ct-gl">${lc(gl)}</span>
        <div class="ct-main"><span class="ct-r1"><b>${x.esc(name)}</b><span class="ct-tag">${x.esc(tag)}</span></span><span class="ct-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="ct-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.ct-spin'), ok: $('.ct-st .qc-ok') };
    const ch = $('.ct-ch'), wave = $('.ct-wave'), n = $('.ct-n'), ft = $('.ct-ft');
    const bars = [...wave.querySelectorAll(':scope > i:not(.ct-cut):not(.ct-tick)')];
    const marks = [...wave.querySelectorAll('.ct-cut, .ct-tick')].map((m) => ({ m, i: +m.dataset.i }));
    const rows = [...card.querySelectorAll('.ct-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', played = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the counter and the strip: the minutes run up while the waveform plays through
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        wave.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const c = String(Math.round(EP.rawMin * q));
        if (c !== count) { n.textContent = c; count = c; }
        const p = Math.round(BARS * q);
        if (p !== played) { bars.forEach((b, i) => b.classList.toggle('on', i < p)); played = p; }
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.c0) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        // each finding's cut shades on the strip as its row lands
        marks.forEach(({ m, i }) => { m.style.opacity = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN)).toFixed(3); });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
