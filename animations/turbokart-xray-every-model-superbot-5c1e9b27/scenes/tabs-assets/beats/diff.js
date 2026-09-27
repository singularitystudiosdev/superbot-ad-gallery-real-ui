// Diff beat: the Turbo Kart Rally playtest fix as a reviewed patch. The headless playtest caught Koopz clipping the
// inside wall at turn 4 on lap 2 (the CPU racing line ignored the bank), and this is the 3-line change to src/ai.js
// that fixes it: one line removed, two added (the same patch terminal.js prints inline). Its line streams, the diff
// card rises and its lines land one by one (removed lines red, added lines green, a highlight sweeping each changed
// line as it lands), a note signed by the routed model pops in under the diff, and a "Rerunning playtest" chip closes
// the beat. Line 88 is the one the playtest pointed at (terminal.js: "at src/ai.js:88").
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Found it: the CPU line ignores the bank on turn 4. Patching src/ai.js.';
const FILE = 'src/ai.js';
const FIRST = 87;   // line number of the first row
// [mark, code]: ' ' context, '-' removed, '+' added
const DIFF = [
  [' ', 'const apex = track.apexAt(this.t);'],
  ['-', 'this.lineOffset = apex.inside * 0.9;'],
  ['+', '// keep a kart width off the wall on banked turns'],
  ['+', 'this.lineOffset = apex.inside * (0.9 - apex.bank * 0.35);'],
  [' ', 'this.target = track.pointAt(this.t + 0.02, this.lineOffset);'],
];
const NOTE = 'Koopz clipped the inside wall at turn 4 on lap 2. The line now eases off the apex as the road banks.';
const BACK = 'Rerunning playtest: 8 karts x 3 laps';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.line = DIFF.map((_, i) => r + 0.55 + i * 0.2);
    T.note = T.line[DIFF.length - 1] + 0.35;
    T.back = T.note + 0.55;
    T.end = T.back + 0.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const adds = DIFF.filter(([m]) => m === '+').length, dels = DIFF.filter(([m]) => m === '-').length;
    let n0 = FIRST;
    const nos = DIFF.map(([m]) => (m === '+' ? '' : n0++));
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="df-card">
      <div class="df-hd"><b>${x.esc(FILE)}</b><span class="df-n"><i class="df-add">+${adds}</i><i class="df-del">-${dels}</i></span></div>
      <div class="df-bd">${DIFF.map(([m, code], i) => `<div class="df-ln df-${m === '+' ? 'a' : m === '-' ? 'd' : 'c'}"><span class="df-no">${nos[i]}</span><span class="df-m">${m}</span><span class="df-code">${x.esc(code)}</span><i class="df-hi"></i></div>`).join('')}</div>
      <div class="df-note">${x.tile(k.app)}<span>${x.esc(NOTE)}</span></div>
    </div>`);
    const back = x.el(`<div class="dd-chiprow df-backrow"><div class="ch-tool df-back">${x.tile(k.app)}<span class="ch-tool-t">${x.esc(BACK)}</span><svg class="df-arr" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div></div>`);
    const lines = [...card.querySelectorAll('.df-ln')].map((n) => ({ n, hi: n.querySelector('.df-hi') }));
    const note = card.querySelector('.df-note');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;

    return {
      nodes: [say, card, back],
      marks: [[T.r, say], [T.card, card], [T.note, note], [T.back, back]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // each line lands; a changed line gets a bright sweep that settles to its tint
        lines.forEach((L, i) => {
          const a = T.line[i];
          rise(L.n, seg(t, a, a + 0.22), 4);
          const p = seg(t, a, a + 0.5);
          L.hi.style.transform = `scaleX(${p.toFixed(3)})`;
          L.hi.style.opacity = (1 - seg(p, 0.6, 1)).toFixed(3);
        });

        const np = seg(t, T.note, T.note + 0.35);
        note.style.opacity = outCubic(np).toFixed(3);
        note.style.transform = np >= 1 ? '' : `scale(${lerp(0.94, 1, outBack(np)).toFixed(4)})`;

        rise(back, seg(t, T.back, T.back + 0.3), 6);
        back.firstElementChild.lastElementChild.style.transform = `translateX(${(4 * outCubic(seg(t, T.back + 0.15, T.back + 0.5))).toFixed(2)}px)`;
      },
    };
  },
};
