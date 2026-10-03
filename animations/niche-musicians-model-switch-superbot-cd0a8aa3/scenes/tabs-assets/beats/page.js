// Page beat: Claude Opus 5.5 writes the single's release page. ONE card, the sections stacked (no tabs, no Review or
// Keep buttons, no clock): a header ("Last Bus Home, release page" and a status that reads "Writing" with a spinner,
// then the green check and "Written"), then About (two short lines in the artist's own voice), Credits (written and
// performed by the artist, recorded at home, mixed by a friend), Tags (eight, plain text) and Lyrics (the first lines
// of an original verse written for the ad, not a real song's words). The text streams in behind a caret, section by
// section, each paragraph laid out whole from the start (the streamed part visible, the rest transparent) so nothing
// reflows. In the zoom cut the camera pushes in on the card while it writes (chat.js FOCUS). Pure function of t.
import { seg, outCubic } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=cd0a8aa3';
import { REL } from './rel.js?v=cd0a8aa3';

const SAY = 'Wrote your release page, in your own words.';
const TITLE = `${REL.title}, release page`;
// the sections: [label, glyph, lines]
const SECTIONS = [
  ['About', 'align-left', [REL.about.join(' ')]],
  ['Credits', 'user-round', REL.credits],
  ['Tags', 'tag', [REL.tags.join(', ')]],
  ['Lyrics', 'music', REL.lyrics],
];
const CPS_SAY = 106.25;  // the reply line streams
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.16;    // the card rising in
const WRITE_AT = 0.3;    // the card is up, then the first written character lands
const WRITE = 1.7; /* deliberate */ // every section streaming in, by length (read while the camera holds)
const POP = 0.176;       // done: the header check pops in
const HOLD_DONE = 0.5; /* deliberate */  // done: the page reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */
const FOCUS_PULL = 0.4; /* deliberate */

const TICK = '<svg class="pg-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + WRITE;
    T.done = T.w1 + 0.1;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + POP + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="pg-x">
      <div class="pg-hd"><span class="pg-proj">${lc('file-text')}<b>${x.esc(TITLE)}</b></span>
        <em class="pg-state"><i class="pg-spin"></i>${TICK}<span class="pg-sl">Writing</span></em></div>
      <div class="pg-bd">${SECTIONS.map(([label, gl, lines]) => `<section class="pg-sec pg-${label.toLowerCase()}"><h4>${lc(gl)}${x.esc(label)}</h4>
        ${lines.map(() => '<p class="pg-p"><span class="pg-v"></span><i class="pg-caret"></i><span class="pg-h"></span></p>').join('')}</section>`).join('')}</div>
    </div>`);
    // every streamed paragraph in order, with the share of the write window it takes (by length)
    const texts = SECTIONS.flatMap(([, , lines]) => lines);
    const total = texts.reduce((s, l) => s + l.length, 0);
    let acc = 0;
    const ps = [...card.querySelectorAll('.pg-p')].map((p, j) => {
      const a = acc / total; acc += texts[j].length;
      return { v: p.querySelector('.pg-v'), h: p.querySelector('.pg-h'), c: p.querySelector('.pg-caret'), text: texts[j], a, b: acc / total, shown: -1, caret: null };
    });
    const heads = [...card.querySelectorAll('.pg-sec')].map((n, i) => ({ n, a: ps[SECTIONS.slice(0, i).reduce((s, [, , l]) => s + l.length, 0)].a }));
    const state = card.querySelector('.pg-state'), stateL = card.querySelector('.pg-sl'), spin = card.querySelector('.pg-spin'), stTk = card.querySelector('.pg-tk');
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS_SAY + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const u = seg(t, T.w0, T.w1);
        ps.forEach((p, j) => {
          const n = Math.round(p.text.length * seg(u, p.a, p.b));
          if (n !== p.shown) { p.v.textContent = p.text.slice(0, n); p.h.textContent = p.text.slice(n); p.shown = n; }
          const last = j === ps.length - 1;
          const on = t >= T.w0 - 0.05 && t < T.w1 + 0.25 && u >= p.a && (u < p.b || last);
          if (on !== p.caret) { p.c.style.display = on ? '' : 'none'; p.caret = on; }
        });
        // each section's label lands as its first line starts
        heads.forEach(({ n, a }) => { n.firstElementChild.style.opacity = outCubic(seg(u, a - 0.03, a + 0.02)).toFixed(3); });
        const d = t >= T.done;
        setText(stateL, d ? 'Written' : 'Writing');
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';
      },
    };
  },
};
