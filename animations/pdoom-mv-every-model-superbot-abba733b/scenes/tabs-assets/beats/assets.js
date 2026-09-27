// Vocals beat: ElevenLabs records the vocal takes for "Upping My P(doom)" over Lyria's beat (the voice model sits
// where the fork's 3D asset model sat, on the same list beat). Its line streams, the "Recording 4 takes" chip spins,
// and the takes list rises: each row lands, a level meter pulses over the singer's still while the take records, the
// still sharpens as the take resolves, its duration climbs to the take's length, and its status pill flips from
// Recording (Tuning, for the Korean ad-lib) to Ready. The chip resolves to "Recorded 4 takes".
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Recording the vocal takes over the beat.';
// [the singer's still, file, the lyric it carries, seconds, the pill while it is still in work]
const TAKES = [
  ['pdoom/take-verse.jpg', 'verse_1_lead.wav', 'I see sparks of AGI in your eyes', 20, 'Recording'],
  ['pdoom/take-hook.jpg', 'hook_lead.wav', "I'm upping my p(doom)", 14, 'Recording'],
  ['pdoom/take-shinigami.jpg', 'hook_harmony.wav', 'Trapped in the Chinese room', 14, 'Recording'],
  ['pdoom/take-outro.jpg', 'adlibs_ko.wav', '축하해', 6, 'Tuning'],
];
const GEN = 1.1;       // seconds one take takes to resolve
const STAGGER = 0.28;
const LVL = 5;         // level-meter bars over a still while its take records
const HANGUL = /[가-힣]/;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.row = TAKES.map((_, i) => r + 0.55 + i * STAGGER);
    T.done = T.row[TAKES.length - 1] + GEN;
    T.end = T.done + 0.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Recording 4 takes</span></div></div>');
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><b>Upping My P(doom): vocals</b><small class="as-sum">4 takes, 2:21</small></div>
      ${TAKES.map(([src, file, lyric, , wip]) => `<div class="as-row">
        <span class="as-th"><img src="${x.img(src)}" alt="${x.esc(file)}"/><i class="as-lvl">${'<b></b>'.repeat(LVL)}</i></span>
        <span class="as-main"><b class="as-file">${x.esc(file)}</b><small${HANGUL.test(lyric) ? ' lang="ko"' : ''}>${x.esc(lyric)}</small></span>
        <span class="as-dur">0:00</span>
        <span class="as-st">${x.esc(wip)}</span>
      </div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.as-row')].map((row) => ({
      row, img: row.querySelector('.as-th img'), lvl: row.querySelector('.as-lvl'), bars: [...row.querySelectorAll('.as-lvl b')],
      dur: row.querySelector('.as-dur'), st: row.querySelector('.as-st'),
    }));
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[TAKES.length - 1], rows[TAKES.length - 1].row]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? 'Recorded 4 takes' : 'Recording 4 takes';
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((m, i) => {
          const a = T.row[i];
          rise(m.row, seg(t, a, a + 0.3), 6);
          const p = seg(t, a + 0.1, a + GEN), e = outCubic(p);
          // the still settles in from a slight push and sharpens as the take resolves
          m.img.style.transform = p >= 1 ? 'none' : `scale(${lerp(1.14, 1, e).toFixed(4)})`;
          m.img.style.filter = p >= 1 ? 'none' : `blur(${((1 - e) * 5).toFixed(2)}px) saturate(${lerp(0.2, 1, e).toFixed(3)})`;
          // the level meter: each bar bounces on its own phase while the take records, then the meter fades out
          m.lvl.style.opacity = (1 - seg(p, 0.55, 1)).toFixed(3);
          if (p < 1) m.bars.forEach((b, j) => {
            const v = Math.abs(Math.sin(t * (7.3 + j * 1.9) + i * 2.1 + j * 1.3));
            b.style.transform = `scaleY(${lerp(0.22, 1, v).toFixed(3)})`;
          });
          const s = mmss(TAKES[i][3] * e);
          if (m.dur.textContent !== s) m.dur.textContent = s;
          const ready = p >= 1;
          m.row.classList.toggle('as-ready', ready);
          const st = ready ? 'Ready' : TAKES[i][4];
          if (m.st.textContent !== st) m.st.textContent = st;
          const pop = seg(t, a + GEN, a + GEN + 0.3);
          m.st.style.transform = pop > 0 && pop < 1 ? `scale(${lerp(0.8, 1, outBack(pop)).toFixed(3)})` : '';
        });
      },
    };
  },
};
