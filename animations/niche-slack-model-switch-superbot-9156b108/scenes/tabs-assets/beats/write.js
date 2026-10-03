// Write beat: Claude Opus 5.5 writes Sam's catch-up and drafts the replies, as a sped-up replay of an agent run in the
// source's work-panel grammar (Cursor's agent panel, as the e13744a9 source ad's code.js and the Reddit fork's
// code.js): the file tabs it has open (catch-up.md, replies.md and 4 more), "Thought" and "Read" tool rows, then the
// star, a file-edit card whose green diff lines stream past with line numbers (catch-up.md: the #launch-q4 summary and
// the reply to Priya), a collapsed edit row (replies.md, its +N the line count of every draft), and the review bar,
// which reads "14 channels summarized, 5 replies drafted in your voice" when the run is done. The transcript is
// bottom-anchored inside a fixed viewport, so every item that lands pushes the run up the way the real panel
// autoscrolls. In the zoom cut the camera pushes in on the panel while the run plays (chat.js FOCUS).
// Every number on screen is counted from digest.js, never typed: a card's +N is the lines it has streamed, the edit
// row's +N is replies.md's line count.
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else. Item heights are constants in --u units, so the stacking is exact at every column width.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { CATCHUP_MD, REPLIES_MD, CHANNELS, MESSAGES, HUDDLES, DRAFTS } from './digest.js?v=9156b108';

const SAY = 'Writing your catch-up and drafting your replies.';
const DONE = `${CHANNELS} channels summarized, ${DRAFTS.length} replies drafted in your voice`;
const lineCount = (src) => src.split('\n').length;

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 2s' },
  { k: 'row', v: 'Read', a: `${MESSAGES.toLocaleString('en-US')} messages in ${CHANNELS} channels` },
  { k: 'row', v: 'Read', a: `${HUDDLES} huddle transcripts` },
  { k: 'star', f: 'catch-up.md', src: CATCHUP_MD },
  { k: 'edit', f: 'replies.md', src: REPLIES_MD },
];
SCRIPT.forEach((s) => { if (s.src) s.n = lineCount(s.src); });
const TABS = ['catch-up.md', 'replies.md'];
const MORE = 4;

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP), in the source's
// v3 pace. The star streams slower than a plain card, so its lines read while the camera holds.
const DUR = { row: 0.08, edit: 0.08, star: 0.96 };
const STEP = { row: 0.072, edit: 0.08, star: 0.92 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the last edit lands, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Review pulses once
const HOLD_DONE = 0.5; /* deliberate */  // done: the review bar's line reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
// heights in --u units; GAP sits inside each item's slot
const LH = 17;
const STAR_BODY = lineCount(CATCHUP_MD); // the star shows all its lines
const HGT = { row: 22, edit: 28, star: 32 + STAR_BODY * LH + 12 };
const GAP = 6;

// ---- Markdown highlighting: headings, the "Reply to" label, dates and numbers ----
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const span = (cls, s) => `<i class="${cls}">${esc(s)}</i>`;
function hlMd(line) {
  if (/^#/.test(line)) return span('k', line);
  if (/^Reply to [^:]+:$/.test(line)) return span('p', line);
  return esc(line).replace(/\b(Oct \d+|Friday|Thursday)\b/g, '<i class="n">$1</i>');
}

const TICK = '<svg class="code-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="code-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const fileIco = () => '<b class="code-fi md">MD</b>';
const stats = (n) => `<span class="code-add">+${n}</span><span class="code-del">-0</span>`;

function itemHTML(s) {
  if (s.k === 'row') return `<div class="code-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  if (s.k === 'edit') return `<div class="code-ed">${fileIco()}<b>${s.f}</b><em>${stats(s.n)}</em></div>`;
  const lines = s.src.split('\n');
  return `<div class="code-card code-star">
    <div class="code-ch">${fileIco()}<b>${s.f}</b><em>${stats(0)}</em></div>
    <div class="code-bd"><div class="code-lines">${lines.map((l, i) => `<div class="code-l"><u>${i + 1}</u><code>${hlMd(l) || ' '}</code></div>`).join('')}</div></div>
  </div>`;
}

const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
function rise(n, p, dy) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
}

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    let at = T.card + FIRST;
    T.items = SCRIPT.map((s) => { const o = { a: at, b: at + DUR[s.k] }; at += STEP[s.k]; return o; });
    T.done = T.items[T.items.length - 1].b + SETTLE; // the last edit lands: review bar live, Worked for
    // zoom cut only (chat.js passes opts.zoom; nozoom has no camera move): the camera (scenes/tabs.js, via chat.js
    // FOCUS) pushes in on the panel once it is up, holds through the run, and pulls back to rest after done
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    // the beat's last visible change: the camera back at rest in the zoom cut; the panel itself settles at done + PULSE
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="code-x">
      <div class="code-hd">
        <span class="wt-tabs">${TABS.map((f, i) => `<span class="wt-tab${i === 0 ? ' on' : ''}">${fileIco()}${f}</span>`).join('')}<span class="wt-more">+${MORE}</span></span>
        <em class="code-state"><i class="code-spin"></i>${TICK}<span class="code-sl">Working</span><span class="code-clk">0s</span></em>
      </div>
      <div class="code-vp"><div class="code-stk">${SCRIPT.map((s) => `<div class="code-it">${itemHTML(s)}</div>`).join('')}<div class="code-sp"></div></div></div>
      <div class="code-ft">
        <span class="code-sum">${CHEV}<b class="code-nf">Writing catch-up.md</b></span>
        <span class="code-btns"><i class="code-b code-pri">Review</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (as the source's code.js): thresholds on the card's width
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('code-wide', w >= 760); card.classList.toggle('code-narrow', w <= 470); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const items = [...card.querySelectorAll('.code-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'star') { o.lines = [...n.querySelectorAll('.code-l')]; o.shown = -1; o.add = n.querySelector('.code-ch .code-add'); }
      return o;
    });
    const state = $('.code-state'), stateL = $('.code-sl'), clk = $('.code-clk'), spin = $('.code-hd .code-spin'), stTk = state.querySelector('.code-tk');
    const nf = $('.code-nf'), ft = $('.code-ft'), pri = $('.code-pri');
    let said = -1;

    // lines streamed so far in the star's body: a slow first line, then a run to the end
    const streamed = (o, t) => o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 16);
        const d = t >= T.done;
        let writing = 'Reading the backlog';
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + SLOT_IN));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'star') {
            const nf2 = t < o.a ? 0 : streamed(o, t), shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            o.n.classList.toggle('live', t >= o.a && t < o.b);
            setText(o.add, `+${shown}`);
          }
          if (s.f && t >= o.a) writing = `Writing ${s.f}`;
        });

        // header: an honest clock, this beat's own elapsed whole seconds from r: "Working 1s" with a spinner, then a
        // check and "Worked for 2s" (the whole seconds from r to done)
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: what the run is writing, then the result; at done Review goes live and pulses once
        setText(nf, d ? DONE : writing);
        ft.classList.toggle('on', d);
        card.classList.toggle('code-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
