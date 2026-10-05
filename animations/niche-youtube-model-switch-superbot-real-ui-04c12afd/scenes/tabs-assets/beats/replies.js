// Replies beat: Claude Opus 5.5 writes the five replies in the creator's voice and decides the pin. It is the writing
// model, so it gets the writing: each draft sits under the comment it answers (handle and the comment, dimmed) and
// streams in behind a caret, using what the earlier models found (Priya's and Lena's answers are Gemini's two
// timestamped answers from the video, video.js). The panel keeps the base's agent-panel shell: a header with an honest
// clock ("Working 1s", then a check and "Worked for 2s"), and the review bar that counts the drafts ("Writing 1 of 5")
// and lands on the pin decision with the green check, with Review / Post all. In the zoom cut the camera pushes in on
// the panel while it writes (chat.js FOCUS). Pure function of t: every value on screen is written from t; each draft
// holds its full text from the start (the unwritten part transparent), so the stream never changes layout.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=04c12afd';
import { TOP } from './comments.js?v=04c12afd';

const SAY = 'Writing all five replies in your voice, then picking the one to pin.';
const TITLE = 'Reply drafts';
// the replies superbot writes as the creator, one per ranked comment (comments.js TOP order); Priya's and Lena's carry
// Gemini's answers from 7:05 and 4:38
export const REPLIES = [
  'The $49 dynamic. It ignores most of the room echo, you can hear it side by side at 7:05.',
  'My editor fell for the $29 one too. It\'s the sleeper of the whole video.',
  'Low-profile boom arm, mic mounted underneath. Linked it in the description.',
  'Headsets are already on the list. They\'re next.',
  'Same here, the USB one surprised me most.',
];
const N = 5;
const DONE = 'Pin @priyanair\'s question: 214 people asked it';

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first character lands
const WRITE = 1.35; /* deliberate */ // all five replies streaming in (read while the camera holds)
const REST_AT = 0.06;    // the last reply written, then the pin decision settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Post all pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const ENV = ms('comment-outline', 'em-ico');
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// the character stream: draft i shows chars [0, k) of itself once the running count passes its start
const STARTS = REPLIES.reduce((a, l, i) => (a.push(i ? a[i - 1] + REPLIES[i - 1].length : 0), a), []);
const TOTAL = STARTS[N - 1] + REPLIES[N - 1].length;

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + WRITE;
    T.n0 = T.w1 + REST_AT;
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
    const card = x.el(`<div class="em-x">
      <div class="em-hd">
        <span class="em-proj">${ENV}<b>${TITLE}</b></span><span class="em-br">${N} replies</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span><span class="em-clk">0s</span></em>
      </div>
      <div class="em-bd">${REPLIES.map((txt, i) => `<div class="em-d"><span class="em-q"><b>${x.esc(TOP[i][0])}</b>${x.esc(TOP[i][1])}</span>
        <span class="em-r"><i class="em-av">S</i><span class="em-tx"><span class="em-v"></span><i class="em-caret"></i><span class="em-h">${x.esc(txt)}</span></span></span></div>`).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${N}</span></span>
        <span class="em-btns"><i class="em-b">Review</i><i class="em-b em-pri">Post all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.em-d')].map((n) => ({ n, v: n.querySelector('.em-v'), h: n.querySelector('.em-h'), c: n.querySelector('.em-caret'), shown: -1, caret: null }));
    const state = $('.em-state'), stateL = $('.em-sl'), clk = $('.em-clk'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft'), pri = $('.em-pri');
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

        // the stream: a steady typewriter over WRITE, the caret riding the last character
        const c = Math.round(TOTAL * seg(t, T.w0, T.w1));
        const writing = t >= T.w0 && t < T.w1 + 0.3;
        rows.forEach((o, i) => {
          const k2 = Math.max(0, Math.min(REPLIES[i].length, c - STARTS[i]));
          if (k2 !== o.shown) { o.v.textContent = REPLIES[i].slice(0, k2); o.h.textContent = REPLIES[i].slice(k2); o.shown = k2; }
          const on = writing && c >= STARTS[i] && (i === N - 1 || c < STARTS[i + 1]);
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the reply being written (1 of 5 .. 5 of 5, as each one starts), then the pin decision
        const n = Math.max(1, STARTS.filter((o) => c > o).length);
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${n} of ${N}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
