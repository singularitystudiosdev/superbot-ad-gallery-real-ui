// Write beat: Claude Opus 5.5 drafts a reply to every comment, as a sped-up replay of an agent run in the source's
// work-panel grammar (its code.js: Cursor's agent panel), re-skinned as a writing panel: "Thought" and "Read" tool
// rows, then one draft card per comment (who it answers, the comment quoted, the reply streaming in, writing then
// drafted), and the review bar "4 drafts ready for you to review" with Edit / Show me. Nothing is sent here. The
// transcript is bottom-anchored inside a fixed viewport, so every item that lands pushes the run up the way the real
// panel autoscrolls. In the zoom cut the camera pushes in on the panel while the run plays (chat.js FOCUS).
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else. Item heights are constants in --u units, so the stacking is exact at every column width.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { COMMENTS } from './x.js?v=5e94b3a8';

const SAY = 'Drafted a reply to every comment. Nothing goes out until you approve.';

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 2s' },
  { k: 'row', v: 'Read', a: '4 comments' },
  { k: 'row', v: 'Read', a: 'your voice profile' },
  { k: 'row', v: 'Thought', a: 'for 1s' },
  ...COMMENTS.map((c) => ({ k: 'draft', to: c.name.split(' ')[0], quote: c.text, text: c.draft })),
];
const NDRAFTS = COMMENTS.length;

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP), in the source's
// v3 pace (its code beat: rows 0.08/0.072, a card streaming a whole body in under half a second)
const DUR = { row: 0.08, draft: 0.4 };
const STEP = { row: 0.072, draft: 0.34 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the last draft is written, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Show me pulses once
const HOLD_DONE = 0.5; /* deliberate */  // done: "4 drafts ready for you to review" reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
// heights in --u units; GAP rides inside each item's slot
const LH = 17;
const HGT = { row: 22, draft: 32 + 3 * LH + 14 };
const GAP = 6;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ico = (d, cls = 'wr-ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const PEN = ico('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>');
const REPLY = ico('<path d="M10 8V5L3 11l7 6v-3c4.5 0 7.5 1.4 10 5-1-5-4-10-10-10z"/>', 'wr-ico wr-rp');
const TICK = '<svg class="wr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="wr-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';

function itemHTML(s) {
  if (s.k === 'row') return `<div class="wr-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  return `<div class="wr-card wr-draft">
    <div class="wr-ch">${REPLY}<b>Reply to ${esc(s.to)}</b><em class="wr-dst">draft</em></div>
    <div class="wr-bd"><div class="wr-q">${esc(s.quote)}</div><div class="wr-txt"><span class="qc-vis"></span><span class="qc-hid">${esc(s.text)}</span></div></div>
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
    T.done = T.items[T.items.length - 1].b + SETTLE; // the last draft is written: review bar live, Worked for
    // zoom cut only (nozoom has no camera move): the camera (scenes/tabs.js, via chat.js FOCUS) pushes in on the panel
    // once it is up, holds through the run, and pulls back to rest after done
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
    const card = x.el(`<div class="wr-x">
      <div class="wr-hd">
        <span class="wr-doc">${PEN}<b>Replies to your last post</b></span><span class="wr-chan"><img src="${x.brand('x-logo.svg')}" alt=""/></span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Working</span><span class="wr-clk">0s</span></em>
      </div>
      <div class="wr-vp"><div class="wr-stk">${SCRIPT.map((s) => `<div class="wr-it">${itemHTML(s)}</div>`).join('')}<div class="wr-sp"></div></div></div>
      <div class="wr-ft">
        <span class="wr-sum">${CHEV}<b class="wr-nf">Drafting replies</b><span class="wr-cnt">0 of ${NDRAFTS}</span></span>
        <span class="wr-btns"><i class="wr-b">Edit</i><i class="wr-b wr-pri">Show me</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (the source's code.js): thresholds on the card's width
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('wr-wide', w >= 760); card.classList.toggle('wr-narrow', w <= 470); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const items = [...card.querySelectorAll('.wr-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'draft') {
        const tx = n.querySelector('.wr-txt');
        o.vis = tx.firstElementChild; o.hid = tx.lastElementChild; o.shown = -1;
        o.st = n.querySelector('.wr-dst');
      }
      return o;
    });
    const state = $('.wr-state'), stateL = $('.wr-sl'), clk = $('.wr-clk'), spin = $('.wr-hd .wr-spin'), stTk = state.querySelector('.wr-tk');
    const nf = $('.wr-nf'), cnt = $('.wr-cnt'), ft = $('.wr-ft'), pri = $('.wr-pri');
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 16);
        const d = t >= T.done;
        let drafted = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + SLOT_IN));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'draft') {
            // the reply writes itself into the draft card over its slot
            const c = t < o.a ? 0 : Math.round(s.text.length * outCubic(seg(t, o.a + 0.04, o.b)) ** 0.85);
            if (c !== o.shown) { o.vis.textContent = s.text.slice(0, c); o.hid.textContent = s.text.slice(c); o.shown = c; }
            o.n.classList.toggle('live', t >= o.a && t < o.b);
            if (t >= o.b) drafted++;
            setText(o.st, t >= o.b ? 'drafted' : 'writing');
            o.st.classList.toggle('ok', t >= o.b);
          }
        });

        // header: an honest clock, this beat's own elapsed whole seconds from r: "Working 1s" with a spinner, then a
        // check and "Worked for 2s" (the whole seconds from r to done)
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the drafts count up as they land; at done it reads the result and Show me pulses
        setText(nf, d ? `${NDRAFTS} drafts ready for you to review` : 'Drafting replies');
        setText(cnt, d ? '' : `${drafted} of ${NDRAFTS}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('wr-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
