// Replies beat: Claude Opus 5.5 writes the buyers' replies in the shop's voice, in the base's writing-panel grammar
// (write.js: Cursor's agent panel, via bikeride-model-switch's code beat): a header with the panel title "Replies", the
// count chip and an honest clock ("Working 1s", then a check and "Worked for 2s"), a row of tabs (Emma R. active, then
// Marcus T., then +21), and the body: the buyer's message as one muted line labelled "Buyer", then the reply streaming
// in under "Your reply" behind a caret. Emma's reply streams first; the Marcus T. tab is selected and his reply
// streams; then the review bar counts the rest up ("Writing 3 of 23") and lands, with the base's green check, on
// "23 of 23 replies written in your shop's voice" with Review / Send all. In the zoom cut the camera pushes in on the
// panel while it writes (chat.js FOCUS). Pure function of t: every value on screen is written from t; the streamed
// text keeps its unstreamed remainder laid out (transparent), so nothing reflows while it types.
import { seg, outCubic, inOutCubic } from '../../../lib.js';

const SAY = 'Wrote a reply to all 23 buyers, in your shop\'s voice.';
const TITLE = 'Replies';
const N = 23;
// the two conversations shown (exact, per the brief): [tab, buyer message, your reply]
const CONVOS = [
  ['Emma R.', "Will my name necklace get here before Christmas? It's for my sister.",
    "Hi Emma, yes! Your necklace ships Dec 9 and arrives before Christmas. I'll send tracking the day it ships."],
  ['Marcus T.', 'Can you stamp two names on one ring?',
    "Hi Marcus, yes, two names fit on one ring. Add both in the personalization box and I'll stamp them in the same font."],
];
const MORE = '+21';
const DONE = "23 of 23 replies written in your shop's voice";

// timing (seconds from the reply start, or from the panel where noted), in the base's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the base's write beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first reply's first character lands
const WRITE = [0.85, 0.85]; /* deliberate */ // each reply streaming in (read while the camera holds)
const TAB_AT = 0.16;     // the first reply written, then the Marcus T. tab is selected
const TAB = 0.12;        // the tab switch: the body crossfades
const WRITE2_AT = 0.12;  // the second tab shown, then its reply starts
const REST_AT = 0.06;    // the second reply written, then the other 21 count up
const REST = 0.3;        // ...from 3 to 23
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Send all pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MSG = '<svg class="rp-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10.5H9.5L5 20v-4H4z"/></svg>';
const TICK = '<svg class="rp-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="rp-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = [T.card + WRITE_AT];
    T.w1 = [T.w0[0] + WRITE[0]];
    T.tab = T.w1[0] + TAB_AT;                 // the Marcus T. tab is selected
    T.w0.push(T.tab + TAB + WRITE2_AT);
    T.w1.push(T.w0[1] + WRITE[1]);
    T.n0 = T.w1[1] + REST_AT;
    T.done = T.n0 + REST;
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
    const card = x.el(`<div class="rp-x">
      <div class="rp-hd">
        <span class="rp-proj">${MSG}<b>${TITLE}</b></span><span class="rp-br">${N} buyers</span>
        <em class="rp-state"><i class="rp-spin"></i>${TICK}<span class="rp-sl">Working</span><span class="rp-clk">0s</span></em>
      </div>
      <div class="rp-tabs">${CONVOS.map(([tab], i) => `<span class="rp-tab${i === 0 ? ' on' : ''}"><i class="rp-av">${tab.split(' ').map((w) => w[0]).join('')}</i>${esc(tab)}</span>`).join('')}<span class="rp-tab rp-more">${MORE}</span></div>
      <div class="rp-bd">${CONVOS.map(([, msg, rep]) => `<div class="rp-pg">
        <div class="rp-lb">Buyer</div><div class="rp-buyer">${esc(msg)}</div>
        <div class="rp-lb">Your reply</div><div class="rp-rep"><span class="rp-v"></span><i class="rp-caret"></i><span class="rp-h">${esc(rep)}</span></div>
      </div>`).join('')}</div>
      <div class="rp-ft">
        <span class="rp-sum">${CHEV}${TICK}<b class="rp-nf">Writing</b><span class="rp-cnt">1 of ${N}</span></span>
        <span class="rp-btns"><i class="rp-b">Review</i><i class="rp-b rp-pri">Send all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.rp-tab:not(.rp-more)')];
    const pages = [...card.querySelectorAll('.rp-pg')].map((n, i) => ({ n, v: n.querySelector('.rp-v'), h: n.querySelector('.rp-h'), c: n.querySelector('.rp-caret'), text: CONVOS[i][2], shown: -1, caret: null }));
    const state = $('.rp-state'), stateL = $('.rp-sl'), clk = $('.rp-clk'), spin = $('.rp-hd .rp-spin'), stTk = state.querySelector('.rp-tk');
    const nf = $('.rp-nf'), cnt = $('.rp-cnt'), ft = $('.rp-ft'), pri = $('.rp-pri');
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS_SAY + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;

        // the tabs: Emma's page until the switch, then Marcus's (a short crossfade, the pages share one slot)
        const sw = seg(t, T.tab, T.tab + TAB);
        tabs.forEach((tb, i) => tb.classList.toggle('on', i === (t >= T.tab ? 1 : 0)));
        pages[0].n.style.opacity = (1 - sw).toFixed(3);
        pages[1].n.style.opacity = sw.toFixed(3);
        // each reply: a steady typewriter over its WRITE, the caret riding the last character
        pages.forEach((o, i) => {
          const c = Math.round(o.text.length * seg(t, T.w0[i], T.w1[i]));
          if (c !== o.shown) { o.v.textContent = o.text.slice(0, c); o.h.textContent = o.text.slice(c); o.shown = c; }
          const on = t >= T.w0[i] - 0.1 && t < T.w1[i] + 0.25;
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: 1 of 23 while Emma's writes, 2 of 23 while Marcus's does, then the rest count up, then the result
        const n = t < T.tab ? 1 : t < T.n0 ? 2 : 2 + Math.round((N - 2) * inOutCubic(seg(t, T.n0, T.done)));
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${n} of ${N}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('rp-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
