// Preview beat: the animation written in an editor with a live preview beside it. Codex types the head of
// src/scenes/KineticType.tsx line by line under a syntax colourer, and the 16:9 pane on the right runs that file:
// the style frames cut as the code types, the scrub bar and the timecode walk 0:00 -> 0:15 with it.
// Pure function of t: every moving value is written from t, so ?t= freezes a frame.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Writing the animation in Remotion, live preview on.';
const PATH = 'src/scenes/KineticType.tsx';
const FPS = 60;
const SPAN = 15; // the spot is 15 seconds long: the timecode walks the whole 0:00 -> 0:15

// the head of the component, one array entry per line (the editor types this top-down)
const SRC = [
  "import { Easing, interpolate } from 'remotion';",
  '',
  'export const KineticType = ({ frame }) => {',
  '  const x = interpolate(frame, [0, 30], [0, 140], {',
  '    easing: Easing.out(Easing.cubic),',
  '  });',
  '  return <h1 style={{ left: x }}>EVERY FRAME</h1>;',
];

const SHOTS = ['mg/frame-1.jpg', 'mg/frame-2.jpg', 'mg/frame-3.jpg', 'mg/frame-4.jpg'];

// the tokenizer is code.js's, copied (not imported) so this beat owns its own colourer; the class letter maps to
// .pv-<letter> in preview.css
const KEYWORDS = new Set(['import', 'from', 'export', 'class', 'const', 'new', 'readonly', 'return', 'this', 'as', 'let', 'function', 'extends', 'interface', 'type', 'enum', 'if', 'else']);
const TYPES = new Set(['Easing', 'interpolate', 'Composition', 'Spot', 'Root', 'string', 'number', 'void', 'boolean', 'Map', 'Float32Array', 'Props', 'React']);
const TOKEN = /(\/\/.*$)|('[^']*'|"[^"]*"|`[^`]*`)|([A-Za-z_$][\w$]*)|(\d[\w.]*)|(\s+)|([^\s\w])/g;

/** one source line -> [css class letter, text] runs, merged so the DOM stays small */
function colorLine(line) {
  const raw = [];
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line))) {
    if (m[1]) raw.push(['c', m[1]]);
    else if (m[2]) raw.push(['s', m[2]]);
    else if (m[3]) {
      const w = m[3];
      if (KEYWORDS.has(w)) raw.push(['k', w]);
      else if (TYPES.has(w) || /^[A-Z]/.test(w)) raw.push(['t', w]);
      else raw.push(['x', w]);
    } else if (m[4]) raw.push(['n', m[4]]);
    else raw.push(['p', m[5] || m[6]]);
  }
  for (let i = 0; i < raw.length - 1; i++) {
    if (raw[i][0] === 'x' && raw[i + 1][1].trim().charAt(0) === '(') raw[i][0] = 'f';
  }
  const out = [];
  raw.forEach(([c, text]) => {
    const last = out[out.length - 1];
    if (last && last[0] === c) last[1] += text;
    else out.push([c, text]);
  });
  return out;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.28;  // the split card lands
    T.code0 = r + 0.5;  // the file starts typing ...
    T.code1 = r + 2.5;  // ... and its last character lands; the preview follows the typing
    T.end = r + 3.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="pv-card">
      <div class="pv-ed">
        <div class="pv-tabs"><span class="pv-tab">${x.esc(PATH)}</span><span class="pv-live">LIVE</span></div>
        <div class="pv-ed-bd">
          <div class="pv-gut">${SRC.map((_, i) => `<i>${i + 1}</i>`).join('')}</div>
          <pre class="pv-src"></pre>
        </div>
      </div>
      <div class="pv-side">
        <div class="pv-prev">
          ${SHOTS.map((src, i) => `<img class="pv-frame" src="${x.img(src)}" alt="style frame ${i + 1}"/>`).join('')}
          <span class="pv-badge">Preview · ${FPS} fps</span>
          <span class="pv-tc"><b class="pv-tcn">0:00</b><em class="pv-tct">/ 0:${SPAN}</em></span>
          <div class="pv-scrub"><i class="pv-fill"></i><i class="pv-knob"></i></div>
        </div>
      </div>
    </div>`);
    const src = card.querySelector('.pv-src');
    const caret = x.el('<i class="pv-caret"></i>');
    const code = SRC.map((text) => {
      const node = x.el('<div class="pv-ln"></div>');
      const spans = colorLine(text).map(([c, t]) => { const s = x.el(`<span class="pv-${c}"></span>`); s.textContent = t; node.appendChild(s); return { s, t }; });
      src.appendChild(node);
      return { text, node, spans };
    });
    const CODE = SRC.join('\n');
    const cps = CODE.length / Math.max(0.2, T.code1 - T.code0);
    const frames = [...card.querySelectorAll('.pv-frame')];
    const tcn = card.querySelector('.pv-tcn');
    const fill = card.querySelector('.pv-fill');
    const knob = card.querySelector('.pv-knob');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, shownCode = -1;

    // reveal the first n characters of the file, caret after the last one revealed
    const paint = (n) => {
      let acc = 0, placed = false;
      code.forEach((L) => {
        const start = acc, len = L.text.length;
        let used = 0;
        L.spans.forEach(({ s, t }) => {
          const take = clamp(n - (start + used), 0, t.length);
          if (s.textContent.length !== take) s.textContent = t.slice(0, take);
          used += t.length;
        });
        if (!placed && n <= start + len) {
          let c0 = 0, done = false;
          for (const { s, t } of L.spans) {
            if (n < c0 + t.length) { L.node.insertBefore(caret, n === c0 ? s : s.nextSibling); done = true; break; }
            c0 += t.length;
          }
          if (!done) L.node.appendChild(caret);
          placed = true;
        }
        acc = start + len + 1;
      });
      if (!placed && code.length) code[code.length - 1].node.appendChild(caret);
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the editor types the file in under a caret
        const cn = streamCount(CODE, T.code0, cps, t);
        if (cn !== shownCode) { paint(cn); shownCode = cn; }
        caret.style.opacity = t >= T.code0 && t <= T.code1 + 0.4 ? '1' : '0';

        // the preview follows the typing: the style frames cut on each quarter of the file, the timecode and the
        // scrub bar walk 0:00 -> 0:15 across it
        const p = seg(t, T.code0, T.code1);
        frames.forEach((img, i) => {
          const a = i / SHOTS.length, b = (i + 1) / SHOTS.length, d = 0.04;
          const o = i === 0 ? 1 - seg(p, b - d, b + d)
            : i === frames.length - 1 ? seg(p, a - d, a + d)
              : seg(p, a - d, a + d) * (1 - seg(p, b - d, b + d));
          img.style.opacity = o.toFixed(3);
        });
        const tc = `0:${String(Math.round(SPAN * p)).padStart(2, '0')}`;
        if (tcn.textContent !== tc) tcn.textContent = tc;
        const w = `${(p * 100).toFixed(1)}%`;
        fill.style.width = w;
        knob.style.left = w;
      },
    };
  },
};