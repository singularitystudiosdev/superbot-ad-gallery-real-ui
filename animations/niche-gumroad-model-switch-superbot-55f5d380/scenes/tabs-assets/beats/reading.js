// Reading beat: Gemini reads the creator's whole ebook and the rate calculator (long context). Its line streams and a
// card rises (the base's compact-card grammar, no tabs, no footer controls): the PDF's glyph, "price-it-right.pdf" with
// the muted "84 pages", a big page counter running 0 to 84, a thin bar filling once, and the chapter map: five rows
// (chapter, title, page), each landing as the counter passes its page; the Ch 4 row (the rate calculator, p. 31) is
// highlighted with the plain-text tag "Preview". Under the rows a status line: a spinner and "Mapping chapters", which
// resolves to the green check and "9 chapters mapped, 3 preview pages picked, 6 templates found". Every title and
// number is made up for the spot. Pure function of t: every moving value is written from t, so ?t= and __AD.seek
// freeze any frame. The rows are laid out whole from the start, so nothing reflows.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { gi } from './gumroad-icons.js?v=55f5d380';

const SAY = 'Reading 84 pages and your rate calculator';
export const DOC = { title: 'price-it-right.pdf', meta: '84 pages', pages: 84 };
// the chapter map (exact, per the spec): chapter, title, page, tag
export const ROWS = [
  ['Ch 1', 'Why hourly pricing fails', 4, ''],
  ['Ch 3', 'Your first quote, line by line', 18, ''],
  ['Ch 4', 'The rate calculator', 31, 'Preview'],
  ['Ch 6', 'Raising rates with old clients', 47, ''],
  ['Ch 8', 'Quote templates', 66, ''],
];
const READING = 'Mapping chapters';
const DONE = '9 chapters mapped, 3 preview pages picked, 6 templates found';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.24;                   // the card landing to the counter starting
const RUN = 1.3; /* deliberate */      // the counter running up to 84 pages (the bar fills, the chapters land)
const ROW_IN = 0.2;                    // a chapter row fading up as the counter passes its page
const DONE_IN = 0.24;                  // the status line's text crossfade
const HOLD = 0.45; /* deliberate */    // the result reads before the next status line

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + RUN_AT;
    T.c1 = T.c0 + RUN;
    // the counter is linear in pages, so a row lands the moment the count reaches its page
    T.rows = ROWS.map(([, , p]) => T.c0 + (p / DOC.pages) * RUN);
    T.end = Math.max(T.c1 + DONE_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rd-card">
      <div class="rd-q">
        <span class="rd-doc">${gi('book-open')}</span>
        <div class="rd-meta">
          <span class="rd-title"><b>${esc(DOC.title)}</b><span class="rd-sub">${esc(DOC.meta)}</span></span>
          <i class="rd-bar"><i class="rd-fill"></i></i>
        </div>
        <span class="rd-big"><b>0</b><small>pages</small></span>
      </div>
      <div class="rd-map">${ROWS.map(([c, title, p, tag]) => `<div class="rd-row${tag ? ' rd-hi' : ''}"><span class="rd-ch">${esc(c)}</span><span class="rd-t">${esc(title)}</span>${tag ? `<span class="rd-tag">${esc(tag)}</span>` : ''}<span class="rd-p">p. ${p}</span></div>`).join('')}</div>
      <div class="rd-st"><span class="rd-ic"><i class="rd-spin"></i>${x.OK}</span><span class="rd-tx"><span class="rd-a">${esc(READING)}</span><span class="rd-b">${esc(DONE)}</span></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const fill = $('.rd-fill'), big = $('.rd-big b');
    const rows = [...card.querySelectorAll('.rd-row')];
    const spin = $('.rd-spin'), ok = $('.rd-ic .qc-ok'), ta = $('.rd-a'), tb = $('.rd-b'), st = $('.rd-st');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.c0 + 0.2, st]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the page counter and the bar on one linear clock; each chapter lands as the count passes its page
        const q = seg(t, T.c0, T.c1);
        const c = String(Math.floor(DOC.pages * q + 1e-6));
        if (c !== count) { big.textContent = c; count = c; }
        fill.style.transform = `scaleX(${q.toFixed(4)})`;
        rows.forEach((n, i) => {
          const p = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          n.style.opacity = p.toFixed(3);
          n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 5).toFixed(2)}px)`;
        });

        // the status: spinner and "Mapping chapters", then the check and the result
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const sw = seg(t, T.c1, T.c1 + DONE_IN);
        ta.style.opacity = (1 - outCubic(seg(sw, 0, 0.5))).toFixed(3);
        tb.style.opacity = outCubic(seg(sw, 0.5, 1)).toFixed(3);
        st.style.opacity = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14)).toFixed(3);
      },
    };
  },
};
