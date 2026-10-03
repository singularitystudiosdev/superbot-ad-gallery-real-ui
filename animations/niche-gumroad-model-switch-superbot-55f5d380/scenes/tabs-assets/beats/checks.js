// Checks beat: GPT-6 Astra (vision) checks every claim on the product page against the creator's own files before
// anything is published. Its line streams and a card rises (the base's check-run card grammar, no shell prompt, no
// chips): a header ("Product page claims" with its spinner resolving to the check), then a well where four checks land
// one by one (a glyph left, the claim, the verdict right-aligned as plain text). Three pass (green check). The fourth is
// the one fix (amber): "Preview page 31" -> "Client name blurred"; under it the preview page itself, built from type (a
// page of text with a small table), where a small blur bar sweeps over the line that names a client. Then the closing
// check line: "4 checks, 1 fix: a client name on page 31". The well is laid out whole from the start, so nothing
// reflows while it fills. Pure function of t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { gi } from './gumroad-icons.js?v=55f5d380';

const SAY = 'Checking every claim against your files';
// the checks, top to bottom: [kind, claim, verdict] (exact, per the spec)
const LINES = [
  ['ok', '"84 pages"', 'Matches the PDF'],
  ['ok', '"6 quote templates"', 'Found on pages 66 to 71'],
  ['ok', 'Cover title at thumbnail size', 'Readable'],
  ['fix', 'Preview page 31', 'Client name blurred'],
];
const TITLE = 'Product page claims';
const DONE = '4 checks, 1 fix: a client name on page 31';
// the preview page, page 31 of the PDF, set in type (made up for the spot; the client line is the one blurred)
const PAGE = {
  head: '4. The rate calculator',
  text: ['Work out what a day of your time is', 'worth. Add your costs, then the weeks', 'you can bill in a year.'],
  client: 'Client: Harlow & Finch, brand refresh',
  table: [['Project', 'Days', 'Rounds'], ['Logo', '4', '2'], ['Site', '9', '3']],
  foot: '31',
};
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const RUN_AT = 0.3;                    // the card landing to the first check
const LINE = 0.2;                      // one check to the next
const LINE_IN = 0.16;                  // a check landing
const PAGE_IN = 0.24;                  // the fix lands, then the preview page rises with it
const BLUR_AT = 0.3;                   // the page in, then the blur bar sweeps over the client line
const BLUR = 0.35;                     // the sweep
const FOOT_AT = 0.16;                  // the blur in, then the closing check line
const FOOT_IN = 0.24;                  // the closing line rising in
const HOLD = 0.45; /* deliberate */    // the result reads before the next status line

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.lines = LINES.map((_, i) => T.card + RUN_AT + i * LINE);
    T.page = T.lines[LINES.length - 1] + 0.04;
    T.blur = T.page + BLUR_AT;
    T.foot = T.blur + BLUR + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const line = ([kind, claim, verdict]) => `<div class="ck-ln ck-${kind}">${kind === 'ok' ? gi('check', 'ck-ck') : gi('eye-off', 'ck-fx')}<span class="ck-c">${esc(claim)}</span><em>${esc(verdict)}</em></div>`;
    const page = `<div class="ck-pg"><div class="ck-paper">
        <b class="ck-ph">${esc(PAGE.head)}</b>
        ${PAGE.text.map((l) => `<span class="ck-pt">${esc(l)}</span>`).join('')}
        <span class="ck-pt ck-cl"><span class="ck-clt">${esc(PAGE.client)}</span><i class="ck-bar"></i></span>
        <span class="ck-tb">${PAGE.table.map((row, i) => `<span class="ck-tr${i ? '' : ' ck-th'}">${row.map((c) => `<span>${esc(c)}</span>`).join('')}</span>`).join('')}</span>
        <span class="ck-pf">${esc(PAGE.foot)}</span>
      </div></div>`;
    const card = x.el(`<div class="ck-card">
      <div class="ck-hd"><span class="ck-st"><i class="ck-spin"></i>${x.OK}</span><b>${esc(TITLE)}</b></div>
      <div class="ck-term">${LINES.map(line).join('')}${page}</div>
      <div class="ck-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.ck-ln')];
    const st = { spin: card.querySelector('.ck-spin'), ok: card.querySelector('.ck-st .qc-ok') };
    const pg = card.querySelector('.ck-pg'), bar = card.querySelector('.ck-bar'), clt = card.querySelector('.ck-clt');
    const ft = card.querySelector('.ck-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const lastAt = T.blur + BLUR;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.lines[3], rows[3]], [T.page, pg], [T.foot, ft]],
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
        // the preview page rises under the fix, then the blur bar sweeps over the client's name
        const pp = outCubic(seg(t, T.page, T.page + PAGE_IN));
        pg.style.opacity = pp.toFixed(3);
        pg.style.transform = pp >= 1 ? 'none' : `translateY(${((1 - pp) * 6).toFixed(2)}px)`;
        const b = outCubic(seg(t, T.blur, T.blur + BLUR));
        bar.style.transform = `scaleX(${b.toFixed(4)})`;
        clt.style.filter = b > 0 ? `blur(${(b * 2.2).toFixed(2)}px)` : 'none';

        // the header's status: spinning while the run plays, the check once the fix is in
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
