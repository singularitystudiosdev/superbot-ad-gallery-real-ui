// Checks beat: GPT-6 Astra checks every note against its article before anything goes into the vault. Its line
// streams and a card rises (the base's check-run card grammar, no shell prompt, no chips): a header ("Checking 46
// notes"), then a mono well where four check lines land one by one (a check glyph left, the check, the count
// right-aligned in mono, plain text); all four pass. Then the closing check line: "46 notes checked, ready for your
// vault". The well is laid out whole from the start, so nothing reflows while it fills. Pure function of t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { oi } from './obsidian-icons.js?v=d1018d78';

const SAY = 'Checked every note against its article.';
// the check run, top to bottom: [kind, text, count]; every line lands with a check (exact, per the spec)
const LINES = [
  ['ok', 'Every note names its source article', '46/46'],
  ['ok', 'Every quote matches the article word for word', '58/58'],
  ['ok', 'No two notes say the same thing', '0 repeats'],
  ['ok', 'Every note has a title, tags and links', '46/46'],
];
const TITLE = 'Checking 46 notes';
const DONE = '46 notes checked, ready for your vault';
// timing (seconds from the reply start, or from the card where noted), in the query beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.3;                    // the card landing to the first check line
const LINE = 0.17;                     // one check line to the next
const LINE_IN = 0.16;                  // a check line landing
const FOOT_AT = 0.14;                  // the last line landing to the closing check line
const FOOT_IN = 0.24;                  // the closing line rising in
const HOLD = 0.3; /* deliberate */     // the result reads before the next status line

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = LINES.map((_, i) => T.card + RUN_AT + i * LINE);
    T.foot = T.lines[LINES.length - 1] + LINE_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const line = ([kind, text, n]) => `<div class="ck-ln ck-${kind}">${oi('check', 'ck-ck')}<span>${esc(text)}</span><em>${esc(n)}</em></div>`;
    const card = x.el(`<div class="ck-card">
      <div class="ck-hd"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><b>${esc(TITLE)}</b></div>
      <div class="ck-term">${LINES.map(line).join('')}</div>
      <div class="ck-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.ck-ln')];
    const st = { spin: card.querySelector('.ck-spin'), ok: card.querySelector('.ck-st .qc-ok') };
    const ft = card.querySelector('.ck-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const lastAt = T.lines[LINES.length - 1] + LINE_IN;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.lines[2], rows[2]], [T.foot, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((n, i) => {
          const p = outCubic(seg(t, T.lines[i], T.lines[i] + LINE_IN));
          n.style.opacity = p.toFixed(3);
          n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
        });
        // the header's status: spinning while the run plays, the check once the last line is in
        const d = outCubic(seg(t, lastAt, lastAt + 0.2));
        st.spin.style.opacity = (1 - seg(t, lastAt - 0.08, lastAt + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
