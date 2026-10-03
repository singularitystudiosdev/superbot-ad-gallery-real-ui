// Write beat: Claude Opus 5.5 rewrites the suppressed listing titles to Amazon's title rules, in the base's writing-panel
// grammar (its Cursor-style work panel: header with an honest clock, file-style tabs, a streaming body, the review bar)
// with the GitHub sibling's tab switch. The panel is "Listing titles"; its tabs are the two listings Gemini flagged
// first, Baking Mat (active) then Oil Mister. Each tab shows the old title as one muted, struck-through line under
// "Before" (cut with an ellipsis), and the new title streams in under "After" behind a caret. The review bar counts
// the titles ("Writing 1 of 6") and lands on "6 of 6 titles rewritten to Amazon's title rules" with the green check.
// In the zoom cut the camera pushes in on the panel while it writes (chat.js FOCUS). Pure function of t: every value on
// screen is written from t; the new titles are laid out whole from the start (one span per character, revealed in
// order), so nothing reflows while they stream.
import { seg, outCubic } from '../../../lib.js';
import { LISTINGS } from './catalog.js?v=37d4e2c2';
import { ico } from './sc-icons.js?v=37d4e2c2';

const SAY = "Rewrote the suppressed titles to Amazon's title rules.";
const TITLE = 'Listing titles';
const CHAN = 'Amazon US';
const TABS = [LISTINGS[0], LISTINGS[1]];
const TOTAL = 6;
const DONE = "6 of 6 titles rewritten to Amazon's title rules";

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.36;   // the panel is up, then the first new character lands (the Before line reads first)
const WRITE_A = 0.72; /* deliberate */ // the Baking Mat title streaming in (110 characters)
const TAB_AT = 0.22;     // the first title written, then the tab switches to Oil Mister
const TAB_IN = 0.14;     // the second tab's body fading up
const WRITE_B = 0.62; /* deliberate */ // the Oil Mister title streaming in (86 characters, read while the camera holds)
const REST = 0.3;        // the second title written, then the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Keep all pulses once
const HOLD_DONE = 0.45; /* deliberate */ // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TICK = '<svg class="wr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="wr-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.a0 = T.card + WRITE_AT;
    T.a1 = T.a0 + WRITE_A;
    T.tab = T.a1 + TAB_AT;
    T.b0 = T.tab + TAB_IN;
    T.b1 = T.b0 + WRITE_B;
    T.done = T.b1 + REST;
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
    const body = (l) => `<div class="wr-tb">
        <span class="wr-lab">Before</span>
        <div class="wr-old">${esc(l.old)}</div>
        <span class="wr-lab wr-lab-a">After</span>
        <div class="wr-new">${[...l.title].map((ch) => `<i>${esc(ch)}</i>`).join('')}<u class="wr-caret"></u></div>
      </div>`;
    const card = x.el(`<div class="wr-x">
      <div class="wr-hd">
        <span class="wr-doc">${ico('doc', 'wr-ico')}<b>${esc(TITLE)}</b></span><span class="wr-chan">${esc(CHAN)}</span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Working</span><span class="wr-clk">0s</span></em>
      </div>
      <div class="wr-tabs">${TABS.map((l, i) => `<span class="wr-tab${i === 0 ? ' on' : ''}"><img src="${x.img(l.img)}" alt=""/>${esc(l.tab)}</span>`).join('')}</div>
      <div class="wr-bds">${TABS.map(body).join('')}</div>
      <div class="wr-ft">
        <span class="wr-sum">${CHEV}${TICK.replace('wr-tk', 'wr-tk wr-dn')}<b class="wr-nf">Writing</b><span class="wr-cnt">1 of ${TOTAL}</span></span>
        <span class="wr-btns"><i class="wr-b">Review</i><i class="wr-b wr-pri">Keep all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.wr-tab')];
    const bodies = [...card.querySelectorAll('.wr-tb')].map((n) => ({ n, chars: [...n.querySelectorAll('.wr-new i')], caret: n.querySelector('.wr-caret'), shown: -1 }));
    const state = $('.wr-state'), stateL = $('.wr-sl'), clk = $('.wr-clk'), spin = $('.wr-hd .wr-spin'), stTk = state.querySelector('.wr-tk');
    const nf = $('.wr-nf'), cnt = $('.wr-cnt'), ft = $('.wr-ft'), pri = $('.wr-pri');
    // the narrow column (4:5) drops the channel chip and the Review button (a width class, as the base's write.js does)
    const sizeCls = (w) => { if (w > 0) card.classList.toggle('wr-narrow', w <= 470); };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    let said = -1, onTab = -1;

    // one tab's stream: characters [0, n) shown, the caret riding the last one while it writes
    const stream = (b, n, writing) => {
      if (n !== b.shown) {
        const lo = Math.min(n, Math.max(0, b.shown)), hi = Math.max(n, Math.max(0, b.shown));
        for (let i = b.shown < 0 ? 0 : lo; i < (b.shown < 0 ? b.chars.length : hi); i++) b.chars[i].style.visibility = i < n ? 'visible' : 'hidden';
        b.shown = n;
      }
      b.caret.style.display = writing ? '' : 'none';
      if (writing) {
        const at = n > 0 ? b.chars[n - 1] : null;
        const x0 = at ? at.offsetLeft + at.offsetWidth : b.chars[0].offsetLeft, y0 = at ? at.offsetTop : b.chars[0].offsetTop;
        b.caret.style.transform = `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`;
      }
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

        // the tab: Baking Mat until the switch, then Oil Mister (its body fades up). Both bodies share one grid cell,
        // so the panel's height never changes with the switch.
        const tab = t >= T.tab ? 1 : 0;
        if (tab !== onTab) {
          tabs.forEach((n, i) => n.classList.toggle('on', i === tab));
          onTab = tab;
        }
        // (opacity, not visibility: the streamed characters set their own visibility)
        bodies[0].n.style.opacity = tab ? '0' : '1';
        bodies[1].n.style.opacity = tab ? outCubic(seg(t, T.tab, T.b0)).toFixed(3) : '0';
        const nA = bodies[0].chars.length, nB = bodies[1].chars.length;
        stream(bodies[0], Math.round(nA * seg(t, T.a0, T.a1)), t >= T.a0 - 0.12 && t < T.a1 + 0.12);
        stream(bodies[1], Math.round(nB * seg(t, T.b0, T.b1)), t >= T.b0 - 0.06 && t < T.b1 + 0.16);

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the title being written (1 of 6, 2 of 6), then the result
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${tab + 1} of ${TOTAL}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('wr-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
