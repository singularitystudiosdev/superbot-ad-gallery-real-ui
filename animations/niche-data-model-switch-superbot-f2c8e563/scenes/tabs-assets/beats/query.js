// Query beat: DuckDB rolls the clean rows up. Its line streams, a query card rises (the backlog card's frame: a status
// spinner, a label, a count), the SQL types itself into a mono editor, and the result grid lands row by row under
// "Month | Revenue" (Jan to Sep 2026, each row with a thin inline bar to scale), then the run's chips land:
// "Ran in 0.04 s", "Total $4.82M" and "Top region: North America". On a wide column the SQL and the grid sit side by
// side; on a narrow one (4:5) they stack.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. The SQL is laid out
// whole from the start (each character a span, revealed in order), so nothing reflows while it types.
import { lerp, seg, outCubic } from '../../../lib.js';

const SAY = 'Rolled up revenue by month and region.';
const LABEL = 'Query on clean';
const META = '2,381 rows';
// the query, as typed (line breaks are the editor's)
const SQL = [
  "SELECT date_trunc('month', date) AS month,",
  '       region,',
  '       sum(amount_usd) AS revenue',
  'FROM clean',
  'GROUP BY ALL',
  'ORDER BY month;',
];
// revenue by month, 2026, $K (the same numbers as the Sheets dashboard, sheets.js)
export const MONTHS = [['Jan', 412], ['Feb', 438], ['Mar', 501], ['Apr', 476], ['May', 534], ['Jun', 589], ['Jul', 562], ['Aug', 618], ['Sep', 694]];
const PEAK = 700;
const CHIPS = ['Ran in 0.04 s', 'Total $4.82M', 'Top region: North America'];
// timing (seconds from the reply start, or from the card where noted), in the backlog beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const TYPE_AT = 0.2;                   // the card landing to the SQL's first character
const TYPE_CPS = 220;                  // the SQL types this fast (a sped-up replay)
const RUN = 0.1;                       // the last character to the first result row
const ROW_STAGGER = 0.05;              // one result row to the next
const ROW_IN = 0.18;                   // a row landing (its bar grows with it)
const CHIPS_AT = 0.1;                  // the last row in, then the first chip
const STAGGER = 0.06;                  // one chip to the next
const CHIP_IN = 0.24;                  // a chip rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const KW = /^(SELECT|AS|FROM|GROUP|BY|ALL|ORDER)$/;
// the SQL as one span per character, each tagged with its token class
function sqlHTML() {
  return SQL.map((ln) => {
    const toks = ln.match(/'[^']*'|[A-Za-z_]+|\s+|./g) || [];
    return `<div class="dq-ln">${toks.map((tk, j) => {
      const cls = tk[0] === "'" ? 'dq-str' : KW.test(tk) ? 'dq-kw' : /^[a-z_]+$/.test(tk) && toks[j + 1] === '(' ? 'dq-fn' : '';
      return [...tk].map((ch) => `<span class="dq-c ${cls}">${esc(ch)}</span>`).join('');
    }).join('')}</div>`;
  }).join('');
}
const NCH = SQL.reduce((a, l) => a + l.length, 0);
const money = (k) => `$${(k * 1000).toLocaleString('en-US')}`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.type = T.card + TYPE_AT;
    T.typed = T.type + NCH / TYPE_CPS;
    T.rows = MONTHS.map((_, i) => T.typed + RUN + i * ROW_STAGGER);
    T.done = T.rows[T.rows.length - 1] + ROW_IN;       // the result is in: the spinner resolves to the check
    T.chip = CHIPS.map((_, i) => T.done + CHIPS_AT + i * STAGGER);
    T.end = Math.max(T.chip[T.chip.length - 1] + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="dq-card">
      <div class="dq-hd"><span class="dq-st"><i class="dq-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="dq-meta">${x.esc(META)}</span></div>
      <div class="dq-bd">
        <div class="dq-l">
          <div class="dq-ed">${sqlHTML()}<i class="dq-caret"></i></div>
          <div class="dq-chips">${CHIPS.map((c, i) => `<span class="dq-chip${i === CHIPS.length - 1 ? ' dq-top' : ''}">${x.esc(c)}</span>`).join('')}</div>
        </div>
        <div class="dq-res">
          <div class="dq-rh"><span>month</span><span>revenue</span><i></i></div>
          ${MONTHS.map(([m, v]) => `<div class="dq-row"><span>${m} 2026</span><span>${money(v)}</span><i><b style="width: ${((v / PEAK) * 100).toFixed(1)}%"></b></i></div>`).join('')}
        </div>
      </div>
    </div>`);
    const chars = [...card.querySelectorAll('.dq-c')];
    const caret = card.querySelector('.dq-caret');
    const rows = [...card.querySelectorAll('.dq-row')].map((n) => ({ n, bar: n.querySelector('b') }));
    const chips = [...card.querySelectorAll('.dq-chip')];
    const spin = card.querySelector('.dq-spin'), ok = card.querySelector('.dq-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let said = -1, typed = 0;
    // narrow column (4:5): the grid stacks under the SQL (a width class, as write.js does, in place of a container)
    const sizeCls = (w) => { if (w > 0) card.classList.toggle('dq-narrow', w < 560); };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the SQL types in: characters [0, n) shown, the caret after the last one until the run starts
        const n = Math.max(0, Math.min(NCH, Math.floor((t - T.type) * TYPE_CPS + 1e-6)));
        if (n !== typed) {
          for (let i = Math.min(n, typed); i < Math.max(n, typed); i++) chars[i].classList.toggle('on', i < n);
          typed = n;
        }
        const at = n > 0 ? chars[n - 1] : null;
        const live = t >= T.type - 0.1 && t < T.rows[0];
        caret.style.opacity = live ? '1' : '0';
        if (live) {
          // in the editor's own px (the editor is the characters' offsetParent)
          const x0 = at ? at.offsetLeft + at.offsetWidth : chars[0].offsetLeft, y0 = at ? at.offsetTop : chars[0].offsetTop;
          caret.style.transform = `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`;
        }

        // the result grid: each row lands and its bar grows to scale
        rows.forEach((o, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          o.n.style.opacity = q.toFixed(3);
          o.n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
          o.bar.style.transform = `scaleX(${q.toFixed(4)})`;
        });

        // done: the spinner resolves to the check as the last row lands
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        chips.forEach((ch, i) => {
          const q = outCubic(seg(t, T.chip[i], T.chip[i] + CHIP_IN));
          ch.style.opacity = q.toFixed(3);
          ch.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
        });
      },
    };
  },
};
