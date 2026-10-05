// Replies beat (7c4a9f21): Claude Opus 5.5 writes the five replies in the creator's voice and decides the pin. This is
// the deliverable the ask is about, so the panel shows the voice it writes in, not just the text: a voice-model strip
// (the three tones read off 340 of the creator's past replies) over the base's code-panel grammar (Cursor's agent panel:
// header with an honest clock, file tabs, the editor body where the replies stream in behind a caret, the review bar).
// The review bar counts the replies written AND the running voice match, and lands on the pin decision with the green
// check, Review / Post all. Lena's draft says the desk arm is in the kit list; the exact 4:38 read lands in the next
// beat (verify.js) and is what studio.js posts. In the zoom cut the camera pushes in on the panel while it writes
// (chat.js FOCUS). Pure function of t: every value on screen is written from t; line heights are constants, so the
// stream never measures layout.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=7c4a9f21';

const SAY = 'Wrote all five replies in your voice and picked the one to pin.';
const PROJECT = 'comment-replies';
// the replies superbot writes as the creator (Lena's exact arm read lands in verify.js; studio posts that version)
export const REPLIES = `Priya: The $49 dynamic. It ignores most of the room
echo, you can hear it side by side at 7:05.

Marco: My editor fell for the $29 one too. It's the
sleeper of the whole video.

Lena: Good eye. Everything on the desk is in the kit
list now, boom arm included.

Dee: Headsets are already on the list. They're next.

Tom: Same here, the USB one surprised me most.`;
const TABS = ['replies.md', 'pin.md'];
const N = 5;
const DONE = 'Pin Priya\'s question: 842 people asked it, one reply answers them all';
// the voice model, read off 340 of the creator's past replies: [tone, 0-100]
const TONES = [['Blunt', 86], ['Warm', 72], ['Technical', 64]];
const MATCH = 97;                // overall voice match the drafts hold
const LINES = REPLIES.split('\n');

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const VOICE_AT = 0.12;   // the panel is up, then the voice meters fill
const VOICE = 0.4;       // the meters filling to their reading
const WRITE_AT = 0.3;    // the voice strip is read, then the first character lands
const WRITE = 1.35; /* deliberate */ // all five replies streaming in (read while the camera holds)
const REST_AT = 0.06;    // the last reply written, then the pin decision settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Post all pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light highlighter: the commenter's name that opens each reply
const hl = (line) => {
  const m = /^([A-Z][a-z]+):/.exec(line);
  return m ? `<i class="k">${esc(m[0])}</i>${esc(line.slice(m[0].length))}` : esc(line);
};
const ENV = ms('comment-outline', 'em-ico');
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
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
    T.v0 = T.card + VOICE_AT;
    T.v1 = T.v0 + VOICE;
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
        <span class="em-proj">${ENV}<b>${PROJECT}</b></span><span class="em-br">${N} replies</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span><span class="em-clk">0s</span></em>
      </div>
      <div class="em-voice">
        <span class="em-vlabel">${ms('auto-fix', 'em-vic')}Your voice</span>
        ${TONES.map(([tone, v]) => `<span class="em-tone"><b>${tone}</b><i><u style="--v:${v}%"></u></i></span>`).join('')}
        <span class="em-match"><b>${MATCH}%</b> match</span>
      </div>
      <div class="em-tabs">${TABS.map((f, i) => `<span class="em-tab${i === 0 ? ' on' : ''}"><b class="em-fi">MD</b>${f}</span>`).join('')}</div>
      <div class="em-bd">${LINES.map((l, i) => `<div class="em-l"><u>${i + 1}</u><code><span class="em-v"></span><i class="em-caret"></i></code></div>`).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${N}</span></span>
        <span class="em-btns"><i class="em-b">Review</i><i class="em-b em-pri">Post all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.em-l')].map((n, i) => ({ n, v: n.querySelector('.em-v'), c: n.querySelector('.em-caret'), shown: -1, caret: null }));
    const state = $('.em-state'), stateL = $('.em-sl'), clk = $('.em-clk'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const bars = [...card.querySelectorAll('.em-tone u')];
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

        // the voice meters read out before a word is written
        const v = outCubic(seg(t, T.v0, T.v1));
        bars.forEach((u) => { u.style.transform = `scaleX(${(0.04 + 0.96 * v).toFixed(4)})`; });

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

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the reply being written (1 of 5 .. 5 of 5) with the running voice match, then the pin
        const n = Math.max(1, OPENS.filter((o) => c > o).length);
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${n} of ${N} · ${MATCH}% voice match`);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};