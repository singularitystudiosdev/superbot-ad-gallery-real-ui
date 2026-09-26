// Diff beat: the model writes the film's cue sheet as a code diff. k.opts.kind picks the shape.
// 'cue'    DeepSeek times the film to the narration: the file film/cues.json is created, its header tags it
//          "new file" and counts the added lines, and the cue sheet drops in one line at a time under green gutters,
//          JSON syntax coloured.
// 'retime' the hand-back: Kling came back 2s short on shot 03, so the same file is edited in place. The card shows
//          one hunk: the muted hunk header, shot 02 untouched as context, the two old lines struck out in red and
//          their retimed replacements added in green, with the numbers that actually moved lit brighter inside the
//          line (word-level diff), then an "Applied" check lands under the card.
// Pure function of t: every moving value is written from t in render, so ?t= freezes any frame. No Date, no rAF,
// no CSS transitions or animations.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const FILE = 'film/cues.json';
const SAY = {
  cue: 'Timed every shot to the narration.',
  retime: 'Kling came back 2s short on shot 03, so I retimed the cues.',
};
const COUNT = '+9';    // the new file's added-line count, as the diff header reports it
const CPS = 80;        // the reply types at the chat's speed
const SLIDE = 0.26;    // seconds one line takes to drop into its row
const FILEIC = '<svg class="df-ic" viewBox="0 0 24 24"><path d="M13.5 2.5H7A2 2 0 0 0 5 4.5v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>'
  + '<path d="M13.5 2.5V8H19"/></svg>';

// the cue sheet the narration is timed to, exactly as the model wrote it. Every line of it is an addition.
const CUE = [
  '{',
  '  "vo": "narration.wav",',
  '  "shots": [',
  '    { "id": "01", "in": 0,  "out": 8,  "vo": "born in the autumn of 2026" },',
  '    { "id": "02", "in": 8,  "out": 16, "vo": "the steep part of the curve" },',
  '    { "id": "03", "in": 16, "out": 24, "vo": "2036, smarter than everyone" },',
  '    { "id": "04", "in": 24, "out": 32, "vo": "2046, the garden and the moon" },',
  '  ]',
  '}',
];

// the retime: shot 03 ran 2s short, so its out comes in 24 -> 22 and shot 04 follows it (in 24 -> 22, out 32 -> 30).
// n is the line's number in the file; hi lists the numbers that changed, which carry the word-level highlight.
const RETIME = [
  { t: 'hunk', c: '@@ -5,3 +5,3 @@' },
  { t: 'ctx', n: 5, c: '    { "id": "02", "in": 8,  "out": 16, "vo": "the steep part of the curve" },' },
  { t: 'del', n: 6, c: '    { "id": "03", "in": 16, "out": 24, "vo": "2036, smarter than everyone" },', hi: ['24'] },
  { t: 'del', n: 7, c: '    { "id": "04", "in": 24, "out": 32, "vo": "2046, the garden and the moon" },', hi: ['24', '32'] },
  { t: 'add', n: 6, c: '    { "id": "03", "in": 16, "out": 22, "vo": "2036, smarter than everyone" },', hi: ['22'] },
  { t: 'add', n: 7, c: '    { "id": "04", "in": 22, "out": 30, "vo": "2046, the garden and the moon" },', hi: ['22', '30'] },
];
const GUT = { add: '+', del: '-', ctx: ' ' };  // the gutter glyph per line type (a hunk header has none)
// one token of a JSON line: a "key":, a plain string, a number, a run of spaces, or a single brace / bracket / comma
const TOK = /"(?:[^"\\]|\\.)*"\s*:|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?|\s+|[{}[\],:]/y;

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.34;    // the diff card rises in
    T.line0 = r + 0.52;   // the first line lands; the next starts one stagger later
    T.apply = r + 1.86;   // "Applied" lands under the card (retime only)
    T.end = r + 2.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const kind = (k.opts || {}).kind === 'retime' ? 'retime' : 'cue';
    const sayTxt = SAY[kind];
    const stagger = kind === 'cue' ? 0.13 : 0.15;   // cue lines land ~0.12s apart; the retime's rows a little wider
    const defs = kind === 'cue' ? CUE.map((c, i) => ({ t: 'add', n: i + 1, c })) : RETIME;

    // one JSON line, coloured: keys #9cdcfe, strings #ce9178, numbers #b5cea8, punctuation muted. A number listed in
    // `hi` is a number the retime moved, so it also carries .df-w (the brighter word-level highlight).
    const code = (src, hi) => {
      let out = '', i = 0, m;
      while (i < src.length) {
        TOK.lastIndex = i;
        m = TOK.exec(src);
        if (!m) { out += x.esc(src.slice(i)); break; }   // anything the tokens do not cover stays literal
        const tk = m[0];
        if (/^\s+$/.test(tk)) out += tk;
        else if (/^".*":$/.test(tk)) out += `<i class="df-k">${x.esc(tk.slice(0, -1))}</i>:`;
        else if (tk[0] === '"') out += `<i class="df-s">${x.esc(tk)}</i>`;
        else if (hi && hi.indexOf(tk) >= 0) out += `<i class="df-num df-w">${tk}</i>`;
        else if (/^-?\d/.test(tk)) out += `<i class="df-num">${tk}</i>`;
        else out += `<i class="df-p">${x.esc(tk)}</i>`;
        i = TOK.lastIndex;
      }
      return out;
    };

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(sayTxt)}</span></div>`);
    const rows = defs.map((d) => {
      const node = x.el(`<div class="df-line df-l-${d.t}"><span class="df-g">${GUT[d.t] || ''}</span>`
        + `<span class="df-ln">${d.n || ''}</span>`
        + `<code class="df-c">${d.t === 'hunk' ? x.esc(d.c) : code(d.c, d.hi)}</code></div>`);
      return { node, t: d.t, w: [...node.querySelectorAll('.df-w')] };
    });
    // the header right side: the new file's tag and green count, or the edited file's +2 / -2
    const meta = kind === 'cue'
      ? `<span class="df-tag">new file</span><span class="df-cnt df-cnt-a">${COUNT}</span>`
      : '<span class="df-cnt df-cnt-a">+2</span><span class="df-cnt df-cnt-d">-2</span>';
    const card = x.el(`<div class="df-card">
      <div class="df-hd">${FILEIC}<b class="df-file">${x.esc(FILE)}</b>${meta}</div>
      <div class="df-body"></div>
    </div>`);
    const body = card.querySelector('.df-body');
    rows.forEach((r) => body.appendChild(r.node));
    const appl = kind === 'retime' ? x.el(`<div class="df-appl">${x.OK}<span>Applied</span></div>`) : null;

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: appl ? [say, card, appl] : [say, card],
      // the marks keep the card in view as it lands, and the Applied check as it lands under it
      marks: appl ? [[T.r, say], [T.card, card], [T.apply, appl]] : [[T.r, say], [T.card, card]],
      render(t) {
        // the reply streams one line
        const n = streamCount(sayTxt, T.r + 0.06, CPS, t);
        if (n !== shown) { vis.textContent = sayTxt.slice(0, n); hid.textContent = sayTxt.slice(n); shown = n; }

        // the card rises in
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.98, 1, ci).toFixed(4)})`;

        // the lines land one after another: each drops a few px into its row, and on the retime the numbers that
        // moved flash brighter and then settle into the steady word-level highlight
        rows.forEach((r, i) => {
          const a = T.line0 + i * stagger;
          const p = seg(t, a, a + SLIDE), e = outCubic(p);
          r.node.style.opacity = e.toFixed(3);
          r.node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * 6).toFixed(2)}px)`;
          if (r.w.length) {
            const f = seg(t, a + SLIDE, a + SLIDE + 0.5);
            const bg = (r.t === 'add'
              ? `rgba(48, 209, 88, ${lerp(0.42, 0.20, f).toFixed(3)})`
              : `rgba(255, 69, 58, ${lerp(0.48, 0.24, f).toFixed(3)})`);
            r.w.forEach((w) => { w.style.background = bg; });
          }
        });

        // the retime lands an "Applied" check under the card
        if (appl) {
          const ai = outCubic(seg(t, T.apply, T.apply + 0.32));
          appl.style.opacity = ai.toFixed(3);
          appl.style.transform = ai >= 1 ? 'none' : `translateY(${((1 - ai) * 6).toFixed(2)}px)`;
        }
      },
    };
  },
};