// Writing beat: Claude Opus 5.5 writes the Gumroad product page in the creator's voice. Its line streams and a card
// rises: "Product page" (no tabs, no chevron, no buttons), then a well where the draft writes itself, one part after
// the other: the name, the summary, the description, what's inside (three lines) and the price. Each part is a muted
// label and its text; a part (label and text together) only appears as its text starts writing, so the card never
// shows an empty labelled slot that could read as a form field waiting for the viewer, and no caret is drawn. Then
// the green check line lands: "Product page written, 3 files listed". In the zoom cut the camera pushes in on the
// card while the page writes (chat.js FOCUS). Pure function of t: every part is laid out whole from the start (the
// unwritten rest of a line is transparent), so nothing reflows while it writes.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { gi } from './gumroad-icons.js?v=55f5d380';

const SAY = 'Writing your product page in your voice';
const TITLE = 'Product page';
// the draft, part by part (exact, per the spec): [label, lines, class]
export const PARTS = [
  ['Name', ['Price It Right'], 'wr-name'],
  ['Summary', ['A pricing guide for freelance designers'], ''],
  ['Description', ['I undercharged for years. This is the system I use now to quote projects, raise rates with old clients and turn down work that does not pay.'], ''],
  ["What's inside", ['84-page PDF', 'Rate calculator spreadsheet', '6 quote templates'], 'wr-list'],
  ['Price', ['$29'], 'wr-price'],
];
const DONE = 'Product page written, 3 files listed';
// timing (seconds from the reply start, or from the card where noted)
const CPS_SAY = 106.25;  // the reply line streams (the base's Opus beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.2;     // the card rising in
const WRITE_AT = 0.3;    // the card is up, then the first character lands
const CPS_W = 190; /* deliberate */ // the page writes at this many characters a second
const BREAK = 0.08;      // a pause between two parts (the label lands with it)
const PART_IN = 0.14;    // a part's label fading up as its text starts
const DONE_AT = 0.16;    // the price written, then the check line
const DONE_IN = 0.22;    // the check line rising in
const HOLD_DONE = 0.5; /* deliberate */ // done: the result reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// every line's start on the writing clock (seconds after the first character), parts separated by BREAK
const PLAN = (() => {
  let at = 0;
  return PARTS.map(([, lines]) => {
    const start = at;
    const ls = lines.map((ln) => { const o = { at, len: ln.length }; at += ln.length / CPS_W; return o; });
    at += BREAK;
    return { start, ls };
  });
})();
const WRITE = PLAN[PLAN.length - 1].ls[PLAN[PLAN.length - 1].ls.length - 1].at + PARTS[PARTS.length - 1][1].slice(-1)[0].length / CPS_W;

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + WRITE;
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
    const card = x.el(`<div class="wr-card">
      <div class="wr-hd"><span class="wr-ic">${gi('file-pen-line')}</span><b>${esc(TITLE)}</b></div>
      <div class="wr-well">${PARTS.map(([label, lines, cls]) => `<div class="wr-part ${cls}"><span class="wr-lb">${esc(label)}</span><div class="wr-v">${lines.map((ln) => `<div class="wr-l"><span class="wr-on"></span><span class="wr-off">${esc(ln)}</span></div>`).join('')}</div></div>`).join('')}</div>
      <div class="wr-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const parts = [...card.querySelectorAll('.wr-part')].map((n, i) => ({
      n, lines: [...n.querySelectorAll('.wr-l')].map((l, j) => ({ on: l.firstElementChild, off: l.lastElementChild, text: PARTS[i][1][j], at: PLAN[i].ls[j].at, shown: -1 })),
    }));
    const ft = card.querySelector('.wr-ft');
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

        // each part appears as its first character lands; its lines write in order
        parts.forEach((p, i) => {
          const a = T.w0 + PLAN[i].start;
          p.n.style.opacity = outCubic(seg(t, a - 0.02, a - 0.02 + PART_IN)).toFixed(3);
          p.lines.forEach((L) => {
            const n = streamCount(L.text, T.w0 + L.at, CPS_W, t);
            if (n !== L.shown) { L.on.textContent = L.text.slice(0, n); L.off.textContent = L.text.slice(n); L.shown = n; }
          });
        });

        const f = outCubic(seg(t, T.done, T.done + DONE_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
