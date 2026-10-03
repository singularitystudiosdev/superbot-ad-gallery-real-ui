// Replies beat: Claude Opus 5.5 writes the replies, one per customer in the customer's own language, and the weekend
// sale, in the source's code-panel grammar (Cursor's agent panel, via the email and Instagram forks): a header with the
// project and an honest clock ("Working 1s", then a check and "Worked for 2s"), a row of file tabs each with a small
// language badge (dana.txt EN active, lucia.txt ES, joao.txt PT, +35, weekend-sale.txt EN), the editor body with line
// numbers where Dana's reply streams in character by character behind a caret, then the other replies count up and
// the active tab flips to weekend-sale.txt, which streams the sale. The review bar counts ("Writing 1 of 38") and lands
// on "38 replies in each customer's language, 9 Saturday slots booked" with Review / Send all. In the zoom cut the
// camera pushes in on the panel while it writes (chat.js FOCUS). Pure function of t: every value on screen is written
// from t; line heights are constants, so the stream never measures layout.
import { seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = "Wrote a reply to every customer in their own language, and the weekend sale.";
const PROJECT = 'whatsapp-replies';
// Dana's reply (English, so the viewer can read it; exact, per the brief) and the weekend sale
export const DANA = `Hi Dana, squeaky brakes on hills usually means
glazed pads. You're booked for Saturday at 10:00.
Pads + bleed is $40, about 45 minutes.
See you then,
Marco`;
export const SALE = `This weekend at Kettle Hill Cycles:
20% off every tune-up, Saturday and Sunday.
Reply with a time and we'll hold your slot.`;
// the file tabs: [name, language badge]
const TABS = [['dana.txt', 'EN'], ['lucia.txt', 'ES'], ['joao.txt', 'PT']];
const MORE = '+35';
const SALE_TAB = ['weekend-sale.txt', 'EN'];
const N = 38;
const DONE = "38 replies in each customer's language, 9 Saturday slots booked";
const FILES = [DANA.split('\n'), SALE.split('\n')];
const ROWS = Math.max(...FILES.map((l) => l.length));

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first character lands
const WRITE = 1.0; /* deliberate */ // Dana's reply streaming in (read while the camera holds)
const REST_AT = 0.06;    // Dana's reply written, then the other 37 count up
const REST = 0.2;        // ...from 1 to 38
const FLIP_AT = 0.06;    // all 38 written, then the active tab flips to weekend-sale.txt
const SALE_AT = 0.12;    // the tab flipped, then the sale's first character lands
const SALE_W = 0.65; /* deliberate */ // the sale streaming in
const DONE_AT = 0.08;    // the sale written, then the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Send all pulses once
const HOLD_DONE = 0.3; /* deliberate */ // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light highlighter: the booking, the price and the offer read in the accent colour
const hl = (line) => esc(line).replace('Saturday at 10:00', '<i class="k">Saturday at 10:00</i>').replace('$40', '<i class="k">$40</i>')
  .replace('20% off', '<i class="k">20% off</i>');
const ENV = '<svg class="em-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10.5H9.5L5 20v-4H4z"/></svg>';
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// the character stream: line i shows chars [0, k) of itself once the total count passes its start
const starts = (lines) => lines.reduce((a, l, i) => (a.push(i ? a[i - 1] + lines[i - 1].length + 1 : 0), a), []);
const STARTS = FILES.map(starts);
const TOTALS = [DANA.length, SALE.length];

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;            // Dana's reply streams
    T.w1 = T.w0 + WRITE;
    T.n0 = T.w1 + REST_AT;               // the other 37 count up
    T.n1 = T.n0 + REST;
    T.flip = T.n1 + FLIP_AT;             // weekend-sale.txt takes the editor
    T.s0 = T.flip + SALE_AT;             // the sale streams
    T.s1 = T.s0 + SALE_W;
    T.done = T.s1 + DONE_AT;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const tab = ([f, lang], cls = '') => `<span class="em-tab ${cls}"><b class="em-fi">${lang}</b>${f}</span>`;
    const card = x.el(`<div class="em-x">
      <div class="em-hd">
        <span class="em-proj">${ENV}<b>${PROJECT}</b></span><span class="em-br">${N} replies + 1 sale</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span><span class="em-clk">0s</span></em>
      </div>
      <div class="em-tabs">${TABS.map((f, i) => tab(f, i === 0 ? 'on em-t0' : '')).join('')}<span class="em-tab em-more">${MORE}</span>${tab(SALE_TAB, 'em-sale')}</div>
      <div class="em-bd">${Array.from({ length: ROWS }, (_, i) => `<div class="em-l"><u>${i + 1}</u><code><span class="em-v"></span><i class="em-caret"></i></code></div>`).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${N}</span></span>
        <span class="em-btns"><i class="em-b">Review</i><i class="em-b em-pri">Send all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.em-l')].map((n) => ({ n, v: n.querySelector('.em-v'), c: n.querySelector('.em-caret'), shown: '', caret: null }));
    const state = $('.em-state'), stateL = $('.em-sl'), clk = $('.em-clk'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft'), pri = $('.em-pri'), t0 = $('.em-t0'), tSale = $('.em-sale');
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;

        // which file holds the editor: Dana's reply, then (from the flip) the weekend sale
        const f = t >= T.flip ? 1 : 0;
        t0.classList.toggle('on', !f);
        tSale.classList.toggle('on', !!f);
        const lines = FILES[f], st = STARTS[f], total = TOTALS[f];
        const a = f ? T.s0 : T.w0, b = f ? T.s1 : T.w1;
        // the stream: a steady typewriter, the caret riding the last character
        const c = Math.round(total * seg(t, a, b));
        const writing = t >= a && t < b + 0.3 && !d;
        rows.forEach((o, i) => {
          const line = lines[i] || '';
          const k2 = Math.max(0, Math.min(line.length, c - (st[i] ?? Infinity)));
          const key = `${f}:${k2}`;
          if (key !== o.shown) { o.v.innerHTML = hl(line.slice(0, k2)); o.shown = key; }
          const visible = i < lines.length && (c > st[i] || (i === 0 && t >= a));
          o.n.style.visibility = visible ? '' : 'hidden';
          const on = writing && i < lines.length && c >= st[i] && (i === lines.length - 1 || c < st[i + 1]);
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: 1 of 38 while Dana's writes, the rest count up, then the sale, then the result
        const n = t < T.n0 ? 1 : 1 + Math.round((N - 1) * inOutCubic(seg(t, T.n0, T.n1)));
        setText(nf, d ? DONE : f ? 'Writing the weekend sale' : 'Writing');
        setText(cnt, d || f ? '' : `${n} of ${N}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
