// Replies beat: Claude Opus 5.5, the route's writer, answers the five comments as the creator. It first learns the
// voice from Sam's own past replies (the header's "200 past replies" chip, the four traits it took from them landing in
// turn), then writes each answer under the comment it answers, streaming behind a caret, one after another. Every answer
// uses what the earlier models found: Priya's carries Gemini's 7:05 timestamp, Lena's what Gemini saw at 4:38, Kai's
// Grok's firmware 2.1 finding. Then the footer lands on the pin decision with the green check. In the zoom cut the camera
// pushes in on the card while it writes (chat.js FOCUS). Pure function of t: every value on screen is written from t;
// the answer rows are laid out at full height from the start, so the stream never moves layout.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { TOP } from './watch.js?v=0b34d5a7';

const SAY = 'Learned your voice from your last 200 replies and wrote all five.';
// the answers superbot writes as the creator, by commenter (Studio posts these verbatim). Each one rests only on what
// the route found: Gemini's moments in the video (7:05, 6:12, 4:38) and Grok's firmware 2.1 finding; nothing invented
export const REPLIES = {
  '@priyanair': 'The $49 dynamic. It ignores most of the room, you can hear it side by side at 7:05.',
  '@marcoruiz': 'Same, 6:12 still gets me. The $29 one is the sleeper of the whole video.',
  '@kaibrooks': 'Yes, firmware 2.1 (Oct 2) fixed it. Update and the hiss is gone, even at high gain.',
  '@lenafischer': 'Low-profile arm with the mic hung underneath. Best look at it is 4:38.',
  '@deeokafor': 'Headsets are already on the list. They\'re next.',
};
const TRAITS = ['Short', 'First person', 'Names the timestamp', 'No emoji'];
const DONE = 'Pin Priya\'s question: more viewers asked it than anything else';

// timing (seconds from the reply start, or from the card where noted)
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.2;     // the card rising in
const TRAIT_AT = 0.16;   // the card up, then the first voice trait lands
const TRAIT_STAGGER = 0.08;
const TRAIT_IN = 0.18;
const WRITE_AT = 0.5;    // the card up, then the first answer starts
const WRITE = 1.5; /* deliberate */ // all five answers streaming in (read while the camera holds)
const REST = 0.25;       // the last answer written, then the pin decision lands
const POP = 0.18;        // the footer's check popping in
const HOLD_DONE = 0.45; /* deliberate */ // the pin decision reads, pushed in, before the pull-back
const FOCUS_AT = 0.3; /* deliberate */   // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TICK = '<svg class="vr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// Material Symbols "keep" (the pin), the same glyph Studio's pinned label uses (st-icons.js)
const PIN = '<svg class="vr-pin" viewBox="0 0 24 24"><path fill="currentColor" d="m16 12l2 2v2h-5v6l-1 1l-1-1v-6H6v-2l2-2V5H7V3h10v2h-1z"/></svg>';

// the character stream: answer i shows chars [0, k) of itself once the total count passes its start
const TEXTS = TOP.map((c) => REPLIES[c.handle]);
const STARTS = TEXTS.reduce((a, s, i) => (a.push(i ? a[i - 1] + TEXTS[i - 1].length : 0), a), []);
const TOTAL = TEXTS.reduce((n, s) => n + s.length, 0);

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.trait = TRAITS.map((_, i) => T.card + TRAIT_AT + i * TRAIT_STAGGER);
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + WRITE;
    T.done = T.w1 + REST;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + POP + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="vr-card">
      <div class="vr-hd"><span class="vr-st"><i class="vr-spin"></i>${TICK}</span><b>Replying as @SamRivera</b><span class="vr-src">Voice from 200 past replies</span></div>
      <div class="vr-traits">${TRAITS.map((s) => `<span class="vr-tr">${esc(s)}</span>`).join('')}</div>
      <div class="vr-list">${TOP.map((c, i) => `<div class="vr-row">
        <div class="vr-q"><span class="vr-av" style="--c: ${c.c}">${esc(c.name[0])}</span><b>${esc(c.handle)}</b><span>${esc(c.text)}</span></div>
        <div class="vr-a"><span class="vr-me">S</span><span class="vr-tx"><span class="vr-v"></span><i class="vr-caret"></i><span class="vr-h">${esc(TEXTS[i])}</span></span></div>
      </div>`).join('')}</div>
      <div class="vr-ft">${PIN}<span>${esc(DONE)}</span>${TICK}</div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.vr-row')].map((n) => ({ n, a: n.querySelector('.vr-a'), v: n.querySelector('.vr-v'), h: n.querySelector('.vr-h'), c: n.querySelector('.vr-caret'), shown: -1, caret: null }));
    const traits = [...card.querySelectorAll('.vr-tr')];
    const spin = $('.vr-hd .vr-spin'), hdTk = $('.vr-hd .vr-tk'), ft = $('.vr-ft'), ftTk = $('.vr-ft .vr-tk');
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

        traits.forEach((n, i) => {
          const o = outCubic(seg(t, T.trait[i], T.trait[i] + TRAIT_IN));
          n.style.opacity = o.toFixed(3);
          n.style.transform = o >= 1 ? 'none' : `scale(${(0.9 + 0.1 * o).toFixed(4)})`;
        });

        // the stream: a steady typewriter over WRITE, answer after answer, the caret riding the last character; the
        // unwritten rest of each answer is laid out but transparent, so the rows hold their height from the start
        const c = Math.round(TOTAL * seg(t, T.w0, T.w1));
        const writing = t >= T.w0 && t < T.w1 + 0.25;
        rows.forEach((o, i) => {
          const k2 = Math.max(0, Math.min(TEXTS[i].length, c - STARTS[i]));
          if (k2 !== o.shown) { o.v.textContent = TEXTS[i].slice(0, k2); o.h.textContent = TEXTS[i].slice(k2); o.shown = k2; }
          o.a.style.opacity = c > STARTS[i] || (i === 0 && t >= T.w0) ? '1' : '0';
          const on = writing && c >= STARTS[i] && (i === rows.length - 1 || c < STARTS[i + 1]);
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });

        const d = t >= T.done;
        spin.style.display = d ? 'none' : '';
        spin.style.transform = `rotate(${((t - T.card) * 600).toFixed(1)}deg)`;
        hdTk.style.display = d ? '' : 'none';
        const pop = outCubic(seg(t, T.done, T.done + POP));
        ft.style.opacity = pop.toFixed(3);
        ft.style.transform = pop >= 1 ? 'none' : `translateY(${((1 - pop) * 6).toFixed(2)}px)`;
        ftTk.style.transform = `scale(${(0.5 + 0.5 * pop).toFixed(3)})`;
        card.classList.toggle('vr-done', d);
      },
    };
  },
};
