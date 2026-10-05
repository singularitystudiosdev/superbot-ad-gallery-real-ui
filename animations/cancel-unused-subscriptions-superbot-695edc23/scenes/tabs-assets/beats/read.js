// DeepSeek V4 Flash reads the attached statement_sep.pdf: one count line, then the four unused subscriptions slide in
// as rows (the service name in its accent, last-used date, monthly price, status). Each row's status flips from Active
// to Cancelled with a green check at the moment the Superbot beat cancels it (CLOCK.flips, written by beats/cancel.js).
import { clamp, seg, outCubic, bump } from './anim.js';
import { SCAN, SUBS, PDF, money, CLOCK, pdfIcon } from './subs.js';

const SAY = `${SCAN.tx} transactions, ${SCAN.subs} subscriptions, ${SCAN.unused} unused for ${SCAN.days}+ days.`;
const CPS = 130;

export default {
  times(r) {
    const T = { r, say: r + 0.04, card: r + 0.14 };
    T.rows = SUBS.map((_, i) => r + 0.3 + i * 0.09);
    T.end = r + 1.12;
    return T;
  },
  build(k, { el, esc, OK }) {
    const T = k.T;
    const say = el('<div class="qc-say"></div>');
    const rowsHTML = SUBS.map((s) => `<div class="sb-row sb-r-${s.id}">`
      + `<span class="sb-nm"><b style="color:${s.c}">${esc(s.name)}</b>${s.plan ? ` ${esc(s.plan)}` : ''}</span>`
      + `<span class="sb-last">Last used ${esc(s.last)}</span>`
      + `<span class="sb-pr">${money(s.price)}<small>/mo</small></span>`
      + `<span class="sb-st"><span class="sb-st-a"><i></i>Active</span><span class="sb-st-c">${OK}Cancelled</span></span></div>`).join('');
    const card = el(`<div class="dd-card sb-scard"><div class="sb-sh"><span class="sb-sh-ic">${pdfIcon()}</span><b>${esc(PDF.file)}</b>`
      + `<span class="sb-sh-m">${PDF.pages} pages · ${SCAN.tx} transactions</span><span class="sb-sh-r">Unused ${SCAN.days}+ days</span></div>${rowsHTML}</div>`);
    const rows = [...card.querySelectorAll('.sb-row')].map((n) => ({ n, a: n.querySelector('.sb-st-a'), c: n.querySelector('.sb-st-c') }));
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.card, card]],
      render(t) {
        const n = clamp(Math.floor((t - T.say) * CPS), 0, SAY.length);
        if (n !== shown) { say.innerHTML = `${esc(SAY.slice(0, n))}<span class="qc-hid">${esc(SAY.slice(n))}</span>`; shown = n; }
        const c = outCubic(seg(t, T.card, T.card + 0.26));
        card.style.opacity = c.toFixed(3);
        card.style.transform = c >= 1 ? 'none' : `translateY(${((1 - c) * 10).toFixed(2)}px)`;
        rows.forEach((r, i) => {
          const p = outCubic(seg(t, T.rows[i], T.rows[i] + 0.26));
          r.n.style.opacity = p.toFixed(3);
          r.n.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * -22).toFixed(2)}px)`;
          // the status pill flips over its horizontal axis: Active turns away, Cancelled turns in
          const f = CLOCK.flips[i];
          const q = f === undefined ? 0 : seg(t, f, f + 0.2);
          const h1 = clamp(q * 2), h2 = clamp(q * 2 - 1);
          r.a.style.opacity = q < 0.5 ? '1' : '0';
          r.a.style.transform = h1 > 0 ? `rotateX(${(h1 * 90).toFixed(1)}deg)` : 'none';
          r.c.style.opacity = q >= 0.5 ? '1' : '0';
          r.c.style.transform = h2 < 1 ? `rotateX(${((1 - h2) * -90).toFixed(1)}deg)` : 'none';
          const fl = f === undefined ? 0 : bump(seg(t, f, f + 0.45));
          r.n.style.setProperty('--fl', fl.toFixed(3));
        });
      },
    };
  },
};
