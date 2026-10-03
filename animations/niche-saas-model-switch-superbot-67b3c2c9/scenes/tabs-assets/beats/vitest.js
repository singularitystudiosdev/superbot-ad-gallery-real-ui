// Vitest beat: GPT-6 Astra runs the suite, then replays the failure against a local server with the Stripe CLI in
// test mode. Its line streams and a terminal card rises (the github sibling's tests-beat grammar: a mono well where
// the commands type and the output lands line by line, then the run's chips and the footer).
// "$ npx vitest run" types and Vitest's own default-reporter lines land (vitest.dev/guide/reporters: " ✓ <file>
// (N tests)" per file, then the right-aligned "Test Files  3 passed (3)" / "Tests  38 passed (38)" summary). Vitest
// would also print a per-file time, "Start at" and "Duration": all omitted (the spot shows no times or durations).
// Then the Stripe CLI: "$ stripe listen --forward-to localhost:3000/api/stripe/webhook &" and its ready line, and
// "$ stripe trigger invoice.payment_failed" with the trigger's real output: one "Setting up fixture for: <name>" per
// fixture in stripe-cli's pkg/fixtures/triggers/invoice.payment_failed.json (customer, payment_method, invoiceitem,
// invoice, invoice_pay) and "Trigger succeeded! Check dashboard for event details." (docs.stripe.com/cli/trigger).
// The listener's two log lines use the CLI's own formats (stripe-cli pkg/cmd/listen.go: "%s   --> %s%s [%s]" and
// "%s  <--  [%d] %s %s [%s]"), minus the leading local time, with the event id truncated. Last, the app's own log
// line: "subscription kept: status past_due, card update email queued". The chips are static labels ("38 of 38
// passing", "Webhook 200", "Kept on decline"), the footer "Tested, ready to ship". The terminal is laid out whole from
// the start (each typed character a span, revealed in order), so nothing reflows while it types. ASCII only in the
// copy this beat adds. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic } from '../../../lib.js';
import { oct } from './glyphs.js?v=67b3c2c9';

const SAY = 'Ran the suite, then replayed a declined renewal with the Stripe CLI in test mode.';
const EVT = 'evt_1QxT4m...';
// the terminal, top to bottom: ['$', command] types; ['ok', file, count] lands with a green check; ['sum', label,
// value, total] is Vitest's summary line; ['out', text] is plain output; ['in' | 'back', ...] are the listener's
// arrows; ['log', text] is the app's own log line
const TERM = [
  ['$', 'npx vitest run'],
  ['ok', 'src/billing/webhooks.test.ts', '(9 tests)'],
  ['ok', 'src/billing/checkout.test.ts', '(17 tests)'],
  ['ok', 'src/billing/plans.test.ts', '(12 tests)'],
  ['sum', 'Test Files', '3 passed', '(3)'],
  ['sum', 'Tests', '38 passed', '(38)'],
  ['$', 'stripe listen --forward-to localhost:3000/api/stripe/webhook &'],
  ['out', 'Ready! Your webhook signing secret is whsec_7Gk2... (^C to quit)'],
  ['$', 'stripe trigger invoice.payment_failed'],
  ['out', 'Setting up fixture for: customer'],
  ['out', 'Setting up fixture for: payment_method'],
  ['out', 'Setting up fixture for: invoiceitem'],
  ['out', 'Setting up fixture for: invoice'],
  ['out', 'Setting up fixture for: invoice_pay'],
  ['out', 'Trigger succeeded! Check dashboard for event details.'],
  ['in', 'invoice.payment_failed'],
  ['back', 'POST http://localhost:3000/api/stripe/webhook'],
  ['log', 'subscription kept: status past_due, card update email queued'],
];
const CHIPS = ['38 of 38 passing', 'Webhook 200', 'Kept on decline'];
const DONE = 'Tested, ready to ship';
// timing (seconds from the reply start, or from the card where noted), the github sibling's tests-beat pace
const CPS = 110;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const TYPE_AT = 0.2;                   // the card landing to the first command's first character
const TYPE_CPS = 140;                  // a command types this fast (a sped-up replay)
const RUN = 0.12;                      // a command typed to its first output line
const LINE = 0.075;                    // one output line to the next
const LINE_IN = 0.12;                  // an output line landing
const NEXT = 0.1;                      // a block's last line landed to the next command starting
const CHIPS_AT = 0.1;                  // the last line in, then the first chip
const STAGGER = 0.07;                  // one chip to the next
const CHIP_IN = 0.22;                  // a chip rising in
const FOOT_AT = 0.1;                   // the last chip landing to the footer
const FOOT_IN = 0.24;                  // the footer rising in
const HOLD = 0.3; /* deliberate */     // the settled card reads before the next pill

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// each terminal line's moment: a command types from a0 to a1, an output line lands at a0
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
    T.end = Math.max(T.foot + FOOT_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const line = (ln) => {
      if (ln[0] === '$') return `<div class="vt-ln vt-cmd"><b>$</b><span>${[...ln[1]].map((ch) => `<i>${esc(ch)}</i>`).join('')}</span><u class="vt-caret"></u></div>`;
      if (ln[0] === 'ok') return `<div class="vt-ln vt-ok">${oct('check', 'vt-ck')}<span>${esc(ln[1])}</span><em>${esc(ln[2])}</em></div>`;
      if (ln[0] === 'sum') return `<div class="vt-ln vt-sum"><span class="vt-lab">${esc(ln[1])}</span><span class="vt-pass">${esc(ln[2])}</span><em>${esc(ln[3])}</em></div>`;
      if (ln[0] === 'in') return `<div class="vt-ln vt-ev"><span class="vt-ar">   --&gt; </span><b>${esc(ln[1])}</b><em> [${EVT}]</em></div>`;
      if (ln[0] === 'back') return `<div class="vt-ln vt-ev"><span class="vt-ar">  &lt;--  </span><span class="vt-200">[200]</span><span> ${esc(ln[1])}</span><em> [${EVT}]</em></div>`;
      if (ln[0] === 'log') return `<div class="vt-ln vt-log"><span>${esc(ln[1])}</span></div>`;
      return `<div class="vt-ln vt-out"><span>${esc(ln[1])}</span></div>`;
    };
    const card = x.el(`<div class="vt-card">
      <div class="vt-hd"><span class="vt-st"><i class="vt-spin"></i>${x.OK}</span><b>Running tests</b><span class="vt-repo">pinwheel-rota</span><code class="vt-br">${oct('git-branch')}fix/failed-payment-grace</code></div>
      <div class="vt-term">${TERM.map(line).join('')}</div>
      <div class="vt-chips">${CHIPS.map((c) => `<span class="vt-chip">${esc(c)}</span>`).join('')}</div>
      <div class="vt-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.vt-ln')].map((n, i) => ({
      n, kind: TERM[i][0], chars: [...n.querySelectorAll('span > i')], caret: n.querySelector('.vt-caret'), shown: -1,
    }));
    const st = { spin: card.querySelector('.vt-spin'), ok: card.querySelector('.vt-st .qc-ok') };
    const chips = [...card.querySelectorAll('.vt-chip')];
    const ft = card.querySelector('.vt-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const lastAt = T.lines[T.lines.length - 1].a0 + LINE_IN;
    const cmdIdx = TERM.map((l, i) => (l[0] === '$' ? i : -1)).filter((i) => i >= 0);

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], ...cmdIdx.slice(1).map((i) => [T.lines[i].a0, rows[i].n]), [T.lines[TERM.length - 1].a0, rows[TERM.length - 1].n], [T.foot, ft]],
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
