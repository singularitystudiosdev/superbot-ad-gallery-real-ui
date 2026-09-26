// Diff beat: a second model (Claude Opus 5.5) reviews the first model's code and hands it back. Its line streams, the
// diff card rises and its lines land one by one (removed lines red, added lines green, a highlight sweeping each
// changed line as it lands), a review comment pops in under the diff, and a "Sent back to GPT-5 Codex" chip closes
// the beat so the next request visibly returns to the model that wrote the code.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Reviewed Codex’s renderer. One fix, sending it back.';
const FILE = 'src/render/retro-renderer.ts';
// [mark, code]: ' ' context, '-' removed, '+' added
const DIFF = [
  [' ', 'const gl = new THREE.WebGLRenderer({ antialias: false });'],
  ['-', 'gl.setPixelRatio(window.devicePixelRatio);'],
  ['+', 'gl.setPixelRatio(1); // keep the 320x240 grain'],
  ['+', 'tex.magFilter = THREE.NearestFilter;'],
  ['+', 'tex.minFilter = THREE.NearestFilter;'],
  [' ', 'gl.setSize(RES.w, RES.h, false);'],
];
const NOTE = 'Linear filtering smears the pixel textures. Nearest keeps the 90s look.';
const BACK = 'Sent back to GPT-5 Codex';

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
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="df-card">
      <div class="df-hd"><b>${x.esc(FILE)}</b><span class="df-n"><i class="df-add">+${adds}</i><i class="df-del">-${dels}</i></span></div>
      <div class="df-bd">${DIFF.map(([m, code], i) => `<div class="df-ln df-${m === '+' ? 'a' : m === '-' ? 'd' : 'c'}"><span class="df-no">${i + 41}</span><span class="df-m">${m}</span><span class="df-code">${x.esc(code)}</span><i class="df-hi"></i></div>`).join('')}</div>
      <div class="df-note">${x.tile('opus')}<span>${x.esc(NOTE)}</span></div>
    </div>`);
    const back = x.el(`<div class="dd-chiprow df-backrow"><div class="ch-tool df-back">${x.tile('codex')}<span class="ch-tool-t">${x.esc(BACK)}</span><svg class="df-arr" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></div></div>`);
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
        back.firstElementChild.lastElementChild.style.transform = `translateX(${(-4 * outCubic(seg(t, T.back + 0.15, T.back + 0.5))).toFixed(2)}px)`;
      },
    };
  },
};
