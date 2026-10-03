// Fix beat: Claude Opus 5.5 writes the webhook fix and its test, in the github sibling's code-panel grammar (Cursor's
// agent panel, via bikeride-model-switch's code beat): a header with the branch fix/failed-payment-grace, the repo chip
// and a state that reads "Working" with a spinner, then a check and "Done" (no clock: the spot shows no timers), the
// file tabs (webhooks.ts active, then webhooks.test.ts), and an editor body with a unified-diff gutter: the removed
// line tinted red with "-", the added lines tinted green with "+" (Primer's diff colours, chat.css --gh-diff-*).
// webhooks.ts lands with its context and the removed line (line 88, the line Gemini named: the old branch cancelled
// the subscription on the first declined renewal), and the fix streams in behind a caret: mark the account past_due
// but keep access, open a customer portal session and email the customer its url, and revoke access only on
// customer.subscription.deleted. Then the tab switches to webhooks.test.ts (a new file, every line "+") and the Vitest
// test streams. The review bar counts the files ("Writing 1 of 2") and lands on "+38 -6 in 3 files, decline test
// added" with the green check. No Review / Commit buttons (the policy guard: no tappable-looking controls).
//
// The code is valid, current TypeScript against the official stripe Node SDK (checked on docs.stripe.com 2026-10-03):
// event.data.object narrows to Stripe.Invoice inside case 'invoice.payment_failed'; since API version
// 2025-03-31.basil the Invoice has no top-level `subscription` field, the id lives at
// invoice.parent.subscription_details.subscription (changelog "adds-new-parent-field-to-invoicing-objects"); the
// portal session is stripe.billingPortal.sessions.create({ customer, return_url }) and its `url`
// (api/customer_portal/sessions/create); "customer.subscription.deleted" is "Sent when a customer's subscription
// ends" (billing/subscriptions/webhooks). The test uses Vitest's own API (it, expect, not.toHaveBeenCalled,
// toHaveBeenCalledOnce, toBe). The counts are never smaller than what is visible: webhooks.ts shows 9 added lines and 1
// removed, the test file shows 6 of its new lines (numbered from 12: imports and the vi.mock setup sit above).
// In the zoom cut the camera pushes in on the panel while it writes (chat.js FOCUS). Pure function of t: every value
// on screen is written from t; line heights are constants, so the stream never measures layout.
import { seg, outCubic } from '../../../lib.js';
import { oct } from './glyphs.js?v=67b3c2c9';

const SAY = 'Declined renewals now keep the subscription and email a card update link.';
const BRANCH = 'fix/failed-payment-grace';
const REPO = 'pinwheel-rota';
// the two files: [tab, [kind, line number, code]] with kind ' ' context, '-' removed, '+' added
const FILES = [
  ['webhooks.ts', [
    [' ', 84, '  switch (event.type) {'],
    [' ', 85, "    case 'invoice.payment_failed': {"],
    [' ', 86, '      const invoice = event.data.object;'],
    [' ', 87, '      const sub = invoice.parent?.subscription_details?.subscription;'],
    ['-', 88, '      await stripe.subscriptions.cancel(sub as string);'],
    ['+', 88, '      await markPastDue(sub as string); // keep access while Stripe retries'],
    ['+', 89, '      const portal = await stripe.billingPortal.sessions.create({'],
    ['+', 90, '        customer: invoice.customer as string,'],
    ['+', 91, '        return_url: `${APP_URL}/settings/billing`,'],
    ['+', 92, '      });'],
    ['+', 93, '      await sendCardUpdateEmail(invoice.customer as string, portal.url);'],
    [' ', 94, '      break;'],
    [' ', 95, '    }'],
    ['+', 96, "    case 'customer.subscription.deleted':"],
    ['+', 97, '      await revokeAccess(event.data.object.id);'],
    ['+', 98, '      break;'],
  ]],
  ['webhooks.test.ts', [
    ['+', 12, "it('keeps the subscription when a renewal is declined', async () => {"],
    ['+', 13, "  await handleEvent(paymentFailedEvent('sub_123', 'cus_123'));"],
    ['+', 14, '  expect(stripe.subscriptions.cancel).not.toHaveBeenCalled();'],
    ['+', 15, "  expect((await getAccount('sub_123')).status).toBe('past_due');"],
    ['+', 16, '  expect(sendCardUpdateEmail).toHaveBeenCalledOnce();'],
    ['+', 17, '});'],
  ]],
];
const DONE = '+38 -6 in 3 files, decline test added';

// timing (seconds from the reply start, or from the panel where noted), the github sibling's diff-beat pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first added character lands
const WRITE_A = 1.0; /* deliberate */ // the fix's nine added lines streaming in
const TAB_AT = 0.2;      // the fix written, then the tab switches to the test
const TAB_IN = 0.12;     // the test file's body fading up
const WRITE_B = 0.8; /* deliberate */ // the test streaming in (read while the camera holds)
const REST_AT = 0.06;    // the test written, then the summary settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const HOLD_DONE = 0.5; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light TypeScript highlighter in GitHub's dark syntax colours (chat.css --gh-syn-*): one span per character, so a
// partly streamed line keeps each character's final colour
const KW = new Set(['const', 'switch', 'case', 'break', 'await', 'async', 'as', 'string', 'true', 'false', 'import', 'from', 'return']);
function charsOf(code) {
  const toks = code.match(/\/\/.*$|'[^']*'|`[^`]*`|\d[\d_]*|[A-Za-z_$][\w$]*|\s+|./g) || [];
  return toks.flatMap((tk, j) => {
    let c = '';
    if (tk.startsWith('//')) c = 'cm';
    else if (tk[0] === "'" || tk[0] === '`') c = 'st';
    else if (/^\d/.test(tk) || /^[A-Z][A-Z0-9_]+$/.test(tk)) c = 'cn';
    else if (KW.has(tk)) c = 'kw';
    else if (/^[A-Za-z_$]/.test(tk) && toks[j + 1] === '(') c = 'fn';
    return [...tk].map((ch) => (c ? `<i class="${c}">${esc(ch)}</i>` : esc(ch)));
  });
}
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// per file: the streamed (added) lines' start offsets in that file's stream, and its stream length. In webhooks.ts the
// context and the removed line are there from the start; only the added lines stream.
const STREAMS = FILES.map(([, lines]) => {
  let acc = 0;
  const starts = lines.map(([kind, , code]) => { if (kind !== '+') return -1; const s = acc; acc += code.length + 1; return s; });
  return { starts, total: acc - 1 };
});

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.a0 = T.card + WRITE_AT;
    T.a1 = T.a0 + WRITE_A;
    T.tab = T.a1 + TAB_AT;
    T.b0 = T.tab + TAB_IN;
    T.b1 = T.b0 + WRITE_B;
    T.n0 = T.b1 + REST_AT;
    T.done = T.n0 + REST;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const body = (lines, f) => `<div class="em-bd df-bd" data-f="${f}">${lines.map(([kind, no]) => `<div class="em-l df-l${kind === '+' ? ' df-add' : kind === '-' ? ' df-del' : ''}"><u>${no}</u><s>${kind === ' ' ? '' : kind === '-' ? '-' : '+'}</s><code><span class="em-v"></span><i class="em-caret"></i></code></div>`).join('')}</div>`;
    const card = x.el(`<div class="em-x">
      <div class="em-hd">
        <span class="em-proj">${oct('git-branch', 'em-ico')}<b>${BRANCH}</b></span><span class="em-br">${REPO}</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span></em>
      </div>
      <div class="em-tabs">${FILES.map(([f], i) => `<span class="em-tab${i === 0 ? ' on' : ''}"><b class="em-fi">TS</b>${f}</span>`).join('')}</div>
      <div class="df-bds">${FILES.map(([, lines], f) => body(lines, f)).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${FILES.length}</span></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.em-tab')];
    const bodies = [...card.querySelectorAll('.df-bd')];
    const files = FILES.map(([, lines], f) => ({
      rows: [...bodies[f].querySelectorAll('.em-l')].map((n, i) => ({
        n, v: n.querySelector('.em-v'), c: n.querySelector('.em-caret'), chars: charsOf(lines[i][2]), kind: lines[i][0], shown: -1, caret: null,
      })),
    }));
    const state = $('.em-state'), stateL = $('.em-sl'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft');
    let said = -1, onTab = -1;

    // one file's stream at character count c: added lines fill in order, the caret riding the last character
    const stream = (f, c, writing, started) => {
      const S = STREAMS[f];
      files[f].rows.forEach((o, i) => {
        let k2, on = false;
        if (o.kind !== '+') { k2 = o.chars.length; }
        else {
          const st = S.starts[i];
          k2 = Math.max(0, Math.min(o.chars.length, c - st));
          const next = S.starts.slice(i + 1).find((v) => v >= 0);
          on = writing && c >= st && (next === undefined || c < next);
        }
        if (k2 !== o.shown) { o.v.innerHTML = o.chars.slice(0, k2).join(''); o.shown = k2; }
        // an added line shows its gutter once its first character is due (the first one as soon as writing starts)
        const visible = o.kind !== '+' || c > S.starts[i] || (started && S.starts[i] === 0) || c >= S.total;
        o.n.style.visibility = visible ? '' : 'hidden';
        if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
      });
    };

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
        const d = t >= T.done;

        // the tab: webhooks.ts until the switch, then webhooks.test.ts (its body fades up)
        const tab = t >= T.tab ? 1 : 0;
        if (tab !== onTab) {
          tabs.forEach((n, i) => n.classList.toggle('on', i === tab));
          bodies.forEach((n, i) => { n.style.display = i === tab ? '' : 'none'; });
          onTab = tab;
        }
        bodies[1].style.opacity = tab ? outCubic(seg(t, T.tab, T.b0)).toFixed(3) : '0';
        stream(0, Math.round(STREAMS[0].total * seg(t, T.a0, T.a1)), t >= T.a0 && t < T.a1 + 0.2, t >= T.a0);
        stream(1, Math.round(STREAMS[1].total * seg(t, T.b0, T.b1)), t >= T.b0 && t < T.b1 + 0.3, t >= T.b0);

        // header: Working while it writes, Done once the summary lands (no clock)
        setText(stateL, d ? 'Done' : 'Working');
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the file being written (1 of 2, 2 of 2), then the summary
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${tab + 1} of ${FILES.length}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
      },
    };
  },
};
