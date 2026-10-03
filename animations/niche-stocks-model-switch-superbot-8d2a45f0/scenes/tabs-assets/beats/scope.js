// Scope beat: superbot connects your brokerage, unbranded, with read-only access. Its line streams and a scope card
// rises (a landmark icon, "Read-only access", the account) whose rows land one by one: View positions (allowed),
// Cannot place trades (blocked), Account Individual ••4821. Icons are lucide (landmark, eye, ban, lock), inlined.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Connected with read-only access.';
const lucide = (d) => `<svg class="sc-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
// lucide paths, verbatim from brand/lucide-*.svg (api.iconify.design/lucide/<name>.svg)
const LANDMARK = lucide('M10 18v-7m1.119-8.795a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949zM14 18v-7m4 7v-7M3 22h18M6 18v-7');
const EYE = lucide('M2.062 12.348a1 1 0 0 1 0-.696a10.75 10.75 0 0 1 19.876 0a1 1 0 0 1 0 .696a10.75 10.75 0 0 1-19.876 0');
const EYE2 = '<circle cx="12" cy="12" r="3"/>';
const BAN = lucide('M4.929 4.929L19.07 19.071');
const LOCK = lucide('M7 11V7a5 5 0 0 1 10 0v4');
// [icon, label, status, kind]
const ROWS = [
  [EYE.replace('</svg>', `${EYE2}</svg>`), 'View positions', 'Allowed', 'ok'],
  [BAN.replace('</svg>', '<circle cx="12" cy="12" r="10"/></svg>'), 'Cannot place trades', 'Blocked', 'no'],
  [LOCK.replace('</svg>', '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/></svg>'), 'Account', 'Individual ••4821', 'acct'],
];
const CPS = 100;
const SAY_AT = 0.048;
const CARD_AT = 0.12;
const RISE = 0.24;
const ROW_AT = 0.3;                  // reply start to the first row landing
const STAGGER = 0.12;
const POP = 0.16;                    // a row's status pops in once the row has landed

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.row = ROWS.map((_, i) => r + ROW_AT + i * STAGGER);
    T.end = Math.max(T.row[ROWS.length - 1] + RISE + POP * 0.5, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-head"><span class="sc-tile">${LANDMARK}</span><span class="sc-tt"><b>Read-only access</b><small>Brokerage account</small></span></div>
      ${ROWS.map(([ic, l, s, kind]) => `<div class="sc-row sc-${kind}">${ic}<span class="sc-l">${x.esc(l)}</span><span class="sc-s">${kind === 'ok' ? x.OK : ''}${x.esc(s)}</span></div>`).join('')}
    </div>`);
    const rows = [...card.querySelectorAll('.sc-row')].map((n) => ({ n, s: n.querySelector('.sc-s') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[ROWS.length - 1], rows[ROWS.length - 1].n]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px)`;
        rows.forEach((m, i) => {
          const e = outCubic(seg(t, T.row[i], T.row[i] + RISE));
          m.n.style.opacity = e.toFixed(3);
          m.n.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 6).toFixed(2)}px)`;
          const p = outCubic(seg(t, T.row[i] + RISE * 0.5, T.row[i] + RISE * 0.5 + POP));
          m.s.style.opacity = p.toFixed(3);
          m.s.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.7, 1, p).toFixed(4)})`;
        });
      },
    };
  },
};
