// Tests beat: GPT-6 Astra runs the suite and the e2e login test against the fix. Its line streams and a terminal card
// rises (the data sibling's query.js grammar: a mono editor that types, then the result lands line by line, then run
// chips). "$ npm test" types itself, the result lines land one by one (Vitest's own layout: a green check per file
// with its test count, then the "Test Files" / "Tests" summary), "$ npx playwright test login" types and its one
// e2e line lands ("login > Remember me survives 16 minutes", ">" being Playwright's own title separator), and the
// run's chips land: "214 of 214 passing", "e2e login green", "Reviewed: no regressions". The footer: "Tests green,
// ready to ship". The terminal is laid out whole from the start (each typed character a span, revealed in order), so
// nothing reflows while it types. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { oct } from './gh-icons.js?v=0cb69286';

const SAY = 'Ran the full suite and the e2e login test on the fix.';
// the terminal, top to bottom: ['$', command] types; ['ok', text, count] lands with a green check; ['sum', label, value]
// is Vitest's summary line; ['gap'] is an empty line
const TERM = [
  ['$', 'npm test'],
  ['ok', 'src/auth/session.test.ts', '(5)'],
  ['ok', 'src/auth/refresh.test.ts', '(6)'],
  ['ok', 'src/checkout/cart.test.ts', '(12)'],
  ['sum', 'Test Files', '38 passed', '(38)'],
  ['sum', 'Tests', '214 passed', '(214)'],
  ['$', 'npx playwright test login'],
  ['ok', 'login > Remember me survives 16 minutes', '(2.1s)'],
];
const CHIPS = ['214 of 214 passing', 'e2e login green', 'Reviewed: no regressions'];
const DONE = 'Tests green, ready to ship';
// timing (seconds from the reply start, or from the card where noted), in the query beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const TYPE_AT = 0.2;                   // the card landing to the first command's first character
const TYPE_CPS = 90;                   // a command types this fast (a sped-up replay)
const RUN = 0.14;                      // a command typed to its first result line
const LINE = 0.09;                     // one result line to the next
const LINE_IN = 0.14;                  // a result line landing
const NEXT = 0.12;                     // a block's last line landed to the next command starting
const CHIPS_AT = 0.1;                  // the last line in, then the first chip
const STAGGER = 0.07;                  // one chip to the next
const CHIP_IN = 0.22;                  // a chip rising in
const FOOT_AT = 0.1;                   // the last chip landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// each terminal line's moment: a command types from a0 to a1, a result line lands at a0
function schedule(t0) {
  let at = t0;
  return TERM.map((ln, i) => {
    if (ln[0] === '$') {
      if (i > 0) at += NEXT - LINE + LINE_IN;
      const a0 = at, a1 = a0 + ln[1].length / TYPE_CPS;
      at = a1 + RUN;
      return { a0, a1 };
    }
    const a0 = at;
    at += LINE;
    return { a0, a1: a0 };
  });
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = schedule(T.card + TYPE_AT);
    const last = T.lines[T.lines.length - 1].a0 + LINE_IN;
    T.chips = CHIPS.map((_, i) => last + CHIPS_AT + i * STAGGER);
    T.foot = T.chips[CHIPS.length - 1] + CHIP_IN + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const line = (ln) => {
      if (ln[0] === '$') return `<div class="ts-ln ts-cmd"><b>$</b><span>${[...ln[1]].map((ch) => `<i>${esc(ch)}</i>`).join('')}</span><u class="ts-caret"></u></div>`;
      if (ln[0] === 'ok') return `<div class="ts-ln ts-ok">${oct('check', 'ts-ck')}<span>${esc(ln[1])}</span><em>${esc(ln[2])}</em></div>`;
      return `<div class="ts-ln ts-sum"><span class="ts-lab">${esc(ln[1])}</span><span class="ts-pass">${esc(ln[2])}</span><em>${esc(ln[3])}</em></div>`;
    };
    const card = x.el(`<div class="ts-card">
      <div class="ts-hd"><span class="ts-st"><i class="ts-spin"></i>${x.OK}</span><b>Running tests</b><span class="ts-repo">kitebase/web</span><code class="ts-br">${oct('git-branch')}fix/482-session-refresh</code></div>
      <div class="ts-term">${TERM.map(line).join('')}</div>
      <div class="ts-chips">${CHIPS.map((c) => `<span class="ts-chip">${esc(c)}</span>`).join('')}</div>
      <div class="ts-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.ts-ln')].map((n, i) => ({
      n, kind: TERM[i][0], chars: [...n.querySelectorAll('span > i')], caret: n.querySelector('.ts-caret'), shown: -1,
    }));
    const st = { spin: card.querySelector('.ts-spin'), ok: card.querySelector('.ts-st .qc-ok') };
    const chips = [...card.querySelectorAll('.ts-chip')];
    const ft = card.querySelector('.ts-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const lastAt = T.lines[T.lines.length - 1].a0 + LINE_IN;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.lines[6].a0, rows[6].n], [T.foot, ft]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        rows.forEach((o, i) => {
          const { a0, a1 } = T.lines[i];
          if (o.kind === '$') {
            // the prompt is there once its line is due; the command types in, the caret riding it until it runs
            const n = t < a0 ? 0 : Math.min(o.chars.length, Math.floor((t - a0) * TYPE_CPS + 1e-6) + 1);
            if (n !== o.shown) { o.chars.forEach((c, j) => { c.style.display = j < n ? '' : 'none'; }); o.shown = n; }
            o.n.style.opacity = t >= a0 - 0.06 ? '1' : '0';
            const next = i + 1 < T.lines.length ? T.lines[i + 1].a0 : Infinity;
            o.caret.style.display = t >= a0 && t < Math.min(next, a1 + 0.12) ? '' : 'none';
          } else {
            const p = outCubic(seg(t, a0, a0 + LINE_IN));
            o.n.style.opacity = p.toFixed(3);
            o.n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
          }
        });
        // the header's status: spinning while the run plays, the check once the last line is in
        const d = outCubic(seg(t, lastAt, lastAt + 0.2));
        st.spin.style.opacity = (1 - seg(t, lastAt - 0.08, lastAt + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        chips.forEach((c, i) => {
          const o = outCubic(seg(t, T.chips[i], T.chips[i] + CHIP_IN));
          c.style.opacity = o.toFixed(3);
          c.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 6).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
