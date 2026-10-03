// Script beat: Claude Opus 5.5 writes reformat.jsx, the ExtendScript that does the reformat inside the designer's own
// After Effects project. Its line streams and a card rises: a file-code glyph, "reformat.jsx", the muted
// "ExtendScript"; then a mono editor well with real line numbers where the script types in (16 lines visible, the
// well scrolls with the caret like an editor), and the check line "+29 lines in reformat.jsx, 3 sizes from Launch
// Promo 16x9" (the file is exactly the 29 lines shown). Every call is from the After Effects Scripting Guide
// (https://ae-scripting.docsforadobe.dev/, checked call by call: research/ae-api.txt): CompItem.duplicate(),
// CompItem width/height, Item.name, app.beginUndoGroup/endUndoGroup, Layer.parent,
// property("ADBE Transform Group").property("ADBE Position"), Property numKeys/keyValue/setValueAtKey/value/setValue,
// app.project.renderQueue.items.add(), RenderQueueItem.outputModule(1).file. ES3 only (var, no let/const/arrows).
// In the zoom cut the camera pushes in on the card while it types (chat.js FOCUS). Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { oi } from './ae-icons.js?v=74195fef';

const SAY = 'Wrote reformat.jsx to run in your open project';
const TITLE = 'reformat.jsx';
const LANG = 'ExtendScript';
export const CODE = [
  '// reformat.jsx: 9x16, 1x1 and 4x5 from Launch Promo 16x9',
  'var src = app.project.activeItem;',
  'var sizes = [["9x16", 1080, 1920], ["1x1", 1080, 1080],',
  '             ["4x5", 1080, 1350]];',
  'app.beginUndoGroup("Reformat Launch Promo");',
  'for (var s = 0; s < sizes.length; s++) {',
  '  var comp = src.duplicate();',
  '  comp.name = "Launch Promo " + sizes[s][0];',
  '  comp.width = sizes[s][1];',
  '  comp.height = sizes[s][2];',
  '  var dx = (comp.width - src.width) / 2;',
  '  var dy = (comp.height - src.height) / 2;',
  '  for (var i = 1; i <= comp.numLayers; i++) {',
  '    if (comp.layer(i).parent) continue;',
  '    var p = comp.layer(i).property("ADBE Transform Group")',
  '      .property("ADBE Position");',
  '    for (var k = 1; k <= p.numKeys; k++) {',
  '      var kv = p.keyValue(k); kv[0] += dx; kv[1] += dy;',
  '      p.setValueAtKey(k, kv);',
  '    }',
  '    if (p.numKeys === 0) {',
  '      var v = p.value; v[0] += dx; v[1] += dy; p.setValue(v);',
  '    }',
  '  }',
  '  var rq = app.project.renderQueue.items.add(comp);',
  '  var out = "~/Desktop/Fernway_" + sizes[s][0] + ".mp4";',
  '  rq.outputModule(1).file = new File(out);',
  '}',
  'app.endUndoGroup();',
];
const DONE = `+${CODE.length} lines in reformat.jsx, 3 sizes from Launch Promo 16x9`;
const VIS = 16;                 // lines visible in the well
// timing (seconds from the reply start, or from the card where noted)
const CPS_SAY = 106.25;  // the reply line streams (the base's Opus beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.2;     // the card rising in
const WRITE_AT = 0.3;    // the card is up, then the first character lands
const CPS_W = 600; /* deliberate */ // the script types at this many characters a second (a line break counts one)
const DONE_AT = 0.16;    // the script written, then the check line
const DONE_IN = 0.22;    // the check line rising in
const HOLD_DONE = 0.5; /* deliberate */ // done: the finished script reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
const LINE_H = 16;       // a line of the well (design px), the scroll unit

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// each line as tokens: comment, string, keyword (var / for / if only), number, plain. A plain run keeps the words
// around it, so no element ever holds a bare word on its own.
const KW = /^(var|for|if)\b/;
function tokens(ln) {
  const out = [];
  let i = 0, plain = '';
  const flush = () => { if (plain) { out.push({ s: plain, c: '' }); plain = ''; } };
  while (i < ln.length) {
    const rest = ln.slice(i);
    if (rest.startsWith('//')) { flush(); out.push({ s: rest, c: 'sc-c' }); break; }
    if (rest[0] === '"') { const j = rest.indexOf('"', 1); flush(); out.push({ s: rest.slice(0, j + 1), c: 'sc-s' }); i += j + 1; continue; }
    const kw = (i === 0 || /[^\w.]/.test(ln[i - 1])) && rest.match(KW);
    if (kw) { flush(); out.push({ s: kw[0], c: 'sc-k' }); i += kw[0].length; continue; }
    const num = (i === 0 || /[^\w.]/.test(ln[i - 1])) && rest.match(/^\d+/);
    if (num) { flush(); out.push({ s: num[0], c: 'sc-n' }); i += num[0].length; continue; }
    plain += ln[i]; i++;
  }
  flush();
  return out;
}
const LINES = (() => {
  let acc = 0;
  return CODE.map((ln) => { const o = { start: acc, len: ln.length, toks: tokens(ln) }; acc += ln.length + 1; return o; });
})();
const STREAM = LINES[LINES.length - 1].start + LINES[LINES.length - 1].len;

function lineHtml(L, n) {
  let out = '', left = n;
  for (const tk of L.toks) {
    if (left <= 0) break;
    const part = tk.s.slice(0, left);
    left -= tk.s.length;
    out += tk.c ? `<span class="${tk.c}">${esc(part)}</span>` : esc(part);
  }
  return out;
}

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + STREAM / CPS_W;
    T.done = T.w1 + DONE_AT;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + DONE_IN + HOLD_DONE, back: T.done + DONE_IN + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + DONE_IN + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="sc-card">
      <div class="sc-hd"><span class="sc-ic">${oi('file-code')}</span><b>${esc(TITLE)}</b><span class="sc-lang">${esc(LANG)}</span></div>
      <div class="sc-well"><div class="sc-view"><div class="sc-scroll">${LINES.map((L, i) => `<div class="sc-l"><span class="sc-no">${i + 1}</span><span class="sc-v"></span><i class="sc-caret"></i></div>`).join('')}</div></div></div>
      <div class="sc-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.sc-l')].map((n) => ({ n, v: n.querySelector('.sc-v'), c: n.querySelector('.sc-caret'), html: null }));
    const scroll = card.querySelector('.sc-scroll'), ft = card.querySelector('.sc-ft');
    let shown = -1;

    return {
      nodes: [say, card],
      focus: card,
      marks: [[T.r, say], [T.card, card], [T.done, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the script types; the caret sits on the line being written and goes when the script is done
        const n = streamCount('x'.repeat(STREAM), T.w0, CPS_W, t);
        let cur = 0, frac = 0;
        LINES.forEach((L, i) => {
          const m = Math.max(0, Math.min(L.len, n - L.start));
          const html = lineHtml(L, m);
          if (html !== rows[i].html) { rows[i].v.innerHTML = html; rows[i].html = html; }
          const on = t >= T.w0 && n < STREAM && n >= L.start && n <= L.start + L.len;
          rows[i].c.style.opacity = on ? '1' : '0';
          if (n >= L.start) { cur = i; frac = L.len ? m / L.len : 1; }
          // a line number shows once its line has started
          rows[i].n.firstElementChild.style.opacity = t >= T.w0 && n >= L.start ? '1' : '0';
        });
        // the well follows the caret: once the caret passes the last visible line, the lines glide up under it
        const y = Math.max(0, cur + frac - (VIS - 1)) * LINE_H;
        scroll.style.transform = `translateY(${(-y).toFixed(2)}px)`;

        const f = outCubic(seg(t, T.done, T.done + DONE_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
