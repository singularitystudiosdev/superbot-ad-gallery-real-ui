// Writing beat: Claude Opus 5.5 writes the 46 notes. Its line streams and a card rises: "Writing notes" with the
// plain-text count "12 of 46" (no chevron, no buttons), then a mono well where one note types out in Markdown, exactly
// as Obsidian stores it: the heading, its source as a wikilink, its tags, the body and the related notes. Each [[...]]
// wikilink turns Obsidian's accent (--text-accent, measured, chat.css --ob-accent) the moment its ]] closes. Then the
// count steps up to "46 of 46" and the green check line lands: "46 notes written, 212 links". In the zoom cut the
// camera pushes in on the card while the note writes (chat.js FOCUS). Pure function of t: the typed prefix, the link
// colours, the count and every opacity are written from t; line heights are constants, so nothing reflows.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { oi } from './obsidian-icons.js?v=d1018d78';

const SAY = 'Wrote 46 notes, each with its source and links';
const TITLE = 'Writing notes';
// the note, line by line (exact, per the spec)
export const NOTE = [
  '# Deep sleep moves memories to the cortex',
  'source: [[What deep sleep does for memory]]',
  'tags: #sleep #memory',
  '',
  'During slow-wave sleep the [[Hippocampus]] replays the day,',
  'and the [[Neocortex]] keeps what gets replayed.',
  '',
  'Related: [[Spaced repetition]], [[Naps before learning]]',
];
const FROM = 12, TOTAL = 46;
const DONE = '46 notes written, 212 links';
// timing (seconds from the reply start, or from the card where noted)
const CPS_SAY = 106.25;  // the reply line streams (the base's Opus beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.2;     // the card rising in
const WRITE_AT = 0.3;    // the card is up, then the first character lands
const CPS_W = 190; /* deliberate */ // the note types at this many characters a second (a line break counts one)
const COUNT_AT = 0.12;   // the note written, then the count steps up
const COUNT = 0.45;      // 12 of 46 -> 46 of 46
const DONE_AT = 0.04;    // the count on 46, then the check line
const DONE_IN = 0.22;    // the check line rising in
const HOLD_DONE = 0.45; /* deliberate */ // done: the result reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// each line as tokens: plain runs and [[links]]; a line's stream offset counts the line breaks before it
const LINES = (() => {
  let acc = 0;
  return NOTE.map((ln) => {
    const toks = [];
    const re = /\[\[[^\]]+\]\]/g;
    let i = 0, m;
    while ((m = re.exec(ln))) { if (m.index > i) toks.push({ s: ln.slice(i, m.index), link: false }); toks.push({ s: m[0], link: true }); i = m.index + m[0].length; }
    if (i < ln.length) toks.push({ s: ln.slice(i), link: false });
    const o = { start: acc, len: ln.length, toks, cls: ln.startsWith('# ') ? 'wr-h' : /^(source|tags):/.test(ln) ? 'wr-p' : '' };
    acc += ln.length + 1;
    return o;
  });
})();
const STREAM = LINES[LINES.length - 1].start + LINES[LINES.length - 1].len;

// one line's markup with n of its characters typed: a link is plain text while open, accent once its ]] is in
function lineHtml(L, n) {
  let out = '', left = n;
  for (const tk of L.toks) {
    if (left <= 0) break;
    const part = tk.s.slice(0, left);
    left -= tk.s.length;
    if (tk.link) out += `<span class="wr-wl${part.length === tk.s.length ? ' on' : ''}">${esc(part)}</span>`;
    else out += esc(part);
  }
  return out;
}

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + STREAM / CPS_W;
    T.n0 = T.w1 + COUNT_AT;
    T.n1 = T.n0 + COUNT;
    T.done = T.n1 + DONE_AT;
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
      <div class="wr-hd"><span class="wr-ic">${oi('file-plus')}</span><b>${esc(TITLE)}</b><span class="wr-n"><span class="wr-k">${FROM}</span> of ${TOTAL}</span></div>
      <div class="wr-well">${LINES.map((L) => `<div class="wr-l ${L.cls}"><span class="wr-v"></span><i class="wr-caret"></i></div>`).join('')}</div>
      <div class="wr-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.wr-l')].map((n) => ({ v: n.querySelector('.wr-v'), c: n.querySelector('.wr-caret'), html: null }));
    const kEl = card.querySelector('.wr-k'), ft = card.querySelector('.wr-ft');
    let shown = -1, kShown = '';

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

        // the note types; the caret sits on the line being written and goes when the note is done
        const n = streamCount('x'.repeat(STREAM), T.w0, CPS_W, t);
        LINES.forEach((L, i) => {
          const m = Math.max(0, Math.min(L.len, n - L.start));
          const html = lineHtml(L, m);
          if (html !== rows[i].html) { rows[i].v.innerHTML = html; rows[i].html = html; }
          const on = t >= T.w0 && n < STREAM && n >= L.start && n <= L.start + L.len;
          rows[i].c.style.opacity = on ? '1' : '0';
        });

        const kv = String(Math.round(lerp(FROM, TOTAL, outCubic(seg(t, T.n0, T.n1)))));
        if (kv !== kShown) { kEl.textContent = kv; kShown = kv; }
        const f = outCubic(seg(t, T.done, T.done + DONE_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
