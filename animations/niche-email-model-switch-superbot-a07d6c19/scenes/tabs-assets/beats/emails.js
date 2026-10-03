// Emails beat: Claude Opus 5.5 writes the 40 personal emails, in the source's code-panel grammar (Cursor's agent
// panel, via bikeride-model-switch's code beat): a header with the project and an honest clock ("Working 1s", then a
// check and "Worked for 2s"), a row of file tabs (juniper-street.eml active, pecan-row.eml, bluebonnet.eml, +37), the
// editor body with line numbers where the first email streams in character by character behind a caret, and the
// review bar that counts the emails written ("Writing 1 of 40") and lands on "40 personal emails, 40 different
// openers" with Review / Send all. In the zoom cut the camera pushes in on the panel while it writes (chat.js FOCUS).
// Pure function of t: every value on screen is written from t; line heights are constants, so the stream never
// measures layout.
import { seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Wrote 40 emails, each one opening on that cafe\'s own news.';
const PROJECT = 'cold-brew-outreach';
// the email superbot writes to Juniper Street Cafe (exact, per the brief)
export const EMAIL = `Subject: Cold brew for the new patio?

Hi Maya,

Saw Juniper Street just opened the patio. Iced drinks
are about to be your best sellers, and your menu has
no cold brew yet.

We roast in East Austin and brew a 20-hour batch.
Could I drop off three samples Thursday morning?

Sam, Lantern Cold Brew`;
const TABS = ['juniper-street.eml', 'pecan-row.eml', 'bluebonnet.eml'];
const MORE = '+37';
const N = 40;
const DONE = `${N} personal emails, ${N} different openers`;
const LINES = EMAIL.split('\n');

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first character lands
const WRITE = 1.35; /* deliberate */ // the whole email streaming in (read while the camera holds)
const REST_AT = 0.06;    // the first email written, then the other 39 count up
const REST = 0.3;        // ...from 1 to 40
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Send all pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light highlighter: the Subject header's key, the greeting and the sign-off
const hl = (line) => {
  if (line.startsWith('Subject:')) return `<i class="k">Subject:</i>${esc(line.slice(8))}`;
  return esc(line);
};
const ENV = '<svg class="em-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>';
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// the character stream: line i shows chars [0, k) of itself once the total count passes its start
const STARTS = LINES.reduce((a, l, i) => (a.push(i ? a[i - 1] + LINES[i - 1].length + 1 : 0), a), []);
const TOTAL = EMAIL.length;

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
        <span class="em-proj">${ENV}<b>${PROJECT}</b></span><span class="em-br">${N} drafts</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span><span class="em-clk">0s</span></em>
      </div>
      <div class="em-tabs">${TABS.map((f, i) => `<span class="em-tab${i === 0 ? ' on' : ''}"><b class="em-fi">EML</b>${f}</span>`).join('')}<span class="em-tab em-more">${MORE}</span></div>
      <div class="em-bd">${LINES.map((l, i) => `<div class="em-l"><u>${i + 1}</u><code><span class="em-v"></span><i class="em-caret"></i></code></div>`).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${N}</span></span>
        <span class="em-btns"><i class="em-b">Review</i><i class="em-b em-pri">Send all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.em-l')].map((n, i) => ({ n, v: n.querySelector('.em-v'), c: n.querySelector('.em-caret'), shown: -1, caret: null }));
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

        // the review bar: 1 of 40 while the first one writes, then the rest count up, then the result
        const n = t < T.n0 ? 1 : 1 + Math.round((N - 1) * inOutCubic(seg(t, T.n0, T.done)));
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
