// Replies beat: Claude Opus 5.5 writes the five replies in the creator's voice and decides the pin, in the base's
// code-panel grammar (Cursor's agent panel, via bikeride-model-switch's code beat): a header with the project and a
// plain state (a spinner and "Writing", then a check and "Done"; no clock), the file name (replies.md), the editor body
// with line numbers where the replies stream in character by character behind a caret, and the review bar that counts
// the replies written ("Writing 1 of 5") and lands on the pin decision with the green check. Lena's reply says what
// GPT-6 Astra read in the 4:38 frame (frame.js VERDICT). In the zoom cut the camera pushes in on the panel while it
// writes (chat.js FOCUS), and once the pin is decided Priya's reply is marked and the camera HOLDS on it (>= 2.0 s)
// before it pulls back. Pure function of t: every value on screen is written from t; line heights are constants, so
// the stream never measures layout.
// ytv10 policy guard (X Ads deceptive content): no timer ("Working 0s" / "Worked for Ns" removed), no Review / Post
// all buttons, no file tabs or draft-count chip (plain text), no disclosure chevron.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=ce37f243';

const SAY = 'Wrote all five replies in your voice and picked the one to pin.';
const PROJECT = 'comment-replies';
// the replies superbot writes as the creator (exact, per the brief; Lena's line is the frame's verdict)
export const REPLIES = `Priya: The $49 dynamic. It ignores most of the room
echo, you can hear it side by side at 7:05.

Marco: My editor fell for the $29 one too. It's the
sleeper of the whole video.

Lena: Low-profile boom arm, mic mounted underneath.
Linked it in the description.

Dee: Headsets are already on the list. They're next.

Tom: Same here, the USB one surprised me most.`;
// the same replies keyed by first name, one line each (the Studio page reads them from here; never retype a reply)
export const REPLY = Object.fromEntries(REPLIES.split('\n\n').map((b) => {
  const s = b.replace(/\n/g, ' ');
  const i = s.indexOf(': ');
  return [s.slice(0, i), s.slice(i + 2)];
}));
const FILE = 'replies.md';
const N = 5;
const DONE = 'Pin Priya\'s question: 214 people asked it, one reply answers them all';
const LINES = REPLIES.split('\n');

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first character lands
const WRITE = 1.4; /* deliberate */ // all five replies streaming in (the base's 1.35 s, a touch calmer)
const REST_AT = 0.06;    // the last reply written, then the pin decision settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const MARK_IN = 0.35;    // done: Priya's reply is marked (the one to pin)
const HOLD_DONE = 2.0; /* deliberate */  // done: the camera holds on Priya's marked reply, readable, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.64; /* deliberate */ // push-in, outCubic (1.6x the base's 0.4)
const FOCUS_PULL = 0.64; /* deliberate */ // pull-back, inOutSine (1.6x the base's 0.4)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light highlighter: the commenter's name that opens each reply
const hl = (line) => {
  const m = /^([A-Z][a-z]+):/.exec(line);
  return m ? `<i class="k">${esc(m[0])}</i>${esc(line.slice(m[0].length))}` : esc(line);
};
const ENV = ms('comment-outline', 'em-ico');
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// the character stream: line i shows chars [0, k) of itself once the total count passes its start
const STARTS = LINES.reduce((a, l, i) => (a.push(i ? a[i - 1] + LINES[i - 1].length + 1 : 0), a), []);
const TOTAL = REPLIES.length;
// where each reply starts in the stream (the lines that open on a name): the review bar counts them as they begin
const OPENS = LINES.map((l, i) => (/^[A-Z][a-z]+:/.test(l) ? STARTS[i] : -1)).filter((v) => v >= 0);

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
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + MARK_IN + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="em-x">
      <div class="em-hd">
        <span class="em-proj">${ENV}<b>${PROJECT}</b></span><span class="em-br">${N} replies</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Writing</span></em>
      </div>
      <div class="em-tabs"><span class="em-tab"><b class="em-fi">MD</b>${FILE}</span></div>
      <div class="em-bd"><i class="em-mk"></i>${LINES.map((l, i) => `<div class="em-l"><u>${i + 1}</u><code><span class="em-v"></span><i class="em-caret"></i></code></div>`).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${N}</span></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.em-l')].map((n, i) => ({ n, v: n.querySelector('.em-v'), c: n.querySelector('.em-caret'), shown: -1, caret: null }));
    const state = $('.em-state'), stateL = $('.em-sl'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft'), mk = $('.em-mk');
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
          const k2 = Math.max(0, Math.min(LINES[i].length, c - STARTS[i]));
          const visible = c > STARTS[i] || (i === 0 && t >= T.w0);
          if (k2 !== o.shown) { o.v.innerHTML = hl(LINES[i].slice(0, k2)); o.shown = k2; }
          o.n.style.visibility = visible || c >= TOTAL ? '' : 'hidden';
          const on = writing && c >= STARTS[i] && (i === LINES.length - 1 || c < STARTS[i + 1]);
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });

        // header: a plain state, no clock (policy: no timers)
        setText(stateL, d ? 'Done' : 'Writing');
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the reply being written (1 of 5 .. 5 of 5, as each one starts), then the pin decision
        const n = Math.max(1, OPENS.filter((o) => c > o).length);
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${n} of ${N}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
        // the pin decision marks Priya's reply (lines 1 and 2): the camera holds on it
        mk.style.opacity = outCubic(seg(t, T.done, T.done + MARK_IN)).toFixed(3);
      },
    };
  },
};
