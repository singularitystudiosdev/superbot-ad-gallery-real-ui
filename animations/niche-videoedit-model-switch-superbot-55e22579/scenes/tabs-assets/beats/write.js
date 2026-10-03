// Cut beat (the Discord remake's write.js, re-skinned): Claude Opus 5.5 picks the best 5 moments, trims each to under a
// minute with the hook in its first 2 seconds and writes the captions, as a sped-up replay of an agent run in the
// source's work-panel grammar (its code.js: Cursor's agent panel): "Thought" and "Read" tool rows (the moments Gemini
// found, the Scribe transcript), a file card whose cut list streams in (cuts.json: in, out, hook and caption per clip),
// then the result card whose lines land one by one (the 5 clips with their lengths and hooks), and the review bar
// "5 clips trimmed, captions written" with Edit / Use clips / Preview. The transcript is bottom-anchored inside a fixed
// viewport, so every item that lands pushes the run up the way the real panel autoscrolls. In the zoom cut the camera
// pushes in on the panel while the run plays (chat.js FOCUS).
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else. Item heights are constants in --u units, so the stacking is exact at every column width.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Picked the best 5, each under a minute with a hook in the first 2 seconds.';
const FILE = 'Friday ranked stream';
// the cut list Opus writes (white-space: pre, so the indent is kept)
const CMD = [
  '{ "clip": 1, "in": "1:12:07.8", "out": "1:12:48.8", "hook": 0.6,',
  '  "caption": "NO WAY THAT JUST WORKED", "highlight": "WORKED" },',
  '{ "clip": 2, "in": "0:08:14.2", "out": "0:08:52.2", "hook": 1.2,',
];
const RESULTS = [
  '1v4 clutch  \u00b7  0:41  \u00b7  hook at 0:00.6',
  'Chat picks my loadout  \u00b7  0:38  \u00b7  hook at 0:01.2',
  'Boss down, first try  \u00b7  0:57  \u00b7  hook at 0:00.9',
  'The lag spike  \u00b7  0:33  \u00b7  hook at 0:01.5',
  'Raid welcome  \u00b7  0:46  \u00b7  hook at 0:00.4',
]

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Read', a: 'moments.json, 23 moments' },
  { k: 'row', v: 'Read', a: 'transcript.json, 18,400 words' },
  { k: 'row', v: 'Thought', a: 'for 3s' },
  { k: 'code', lines: CMD },
  { k: 'res', lines: RESULTS },
];
const NRES = RESULTS.length;

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP), in the source's
// v3 pace (its code beat: rows 0.08/0.072, a card streaming a whole body in under half a second)
const DUR = { row: 0.08, code: 0.5, res: 0.46 };
const STEP = { row: 0.072, code: 0.44, res: 0.4 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the last result is in, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Use clip pulses once
const HOLD_DONE = 0.5; /* deliberate */  // done: "5 clips trimmed" reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
// heights in --u units; GAP rides inside each item's slot
const LH = 17;
const HGT = { row: 22, code: 32 + CMD.length * LH + 14, res: 32 + NRES * LH + 14 };
const GAP = 6;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ico = (d, cls = 'wr-ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const LIST = ico('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="17.5" r="1.2"/>');
const DOC = ico('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>');
const SCISSORS = ico('<circle cx="6" cy="6.5" r="2.5"/><circle cx="6" cy="17.5" r="2.5"/><path d="M8 8l12 10M8 16 20 6"/>');
const TICK = '<svg class="wr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="wr-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const CK = '<svg class="wr-lck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function itemHTML(s) {
  if (s.k === 'row') return `<div class="wr-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  if (s.k === 'code') {
    return `<div class="wr-card wr-code">
      <div class="wr-ch">${DOC}<b>cuts.json</b><s>5 clips</s><em class="wr-dst">writing</em></div>
      <div class="wr-bd"><div class="wr-lines">${s.lines.map(() => '<div class="wr-l wr-cl"><span class="qc-vis"></span></div>').join('')}</div></div>
    </div>`;
  }
  return `<div class="wr-card wr-res">
    <div class="wr-ch">${LIST}<b>The best 5</b><s>all under 1:00</s><em class="wr-dst ok">picked</em></div>
    <div class="wr-bd"><div class="wr-lines">${s.lines.map((txt) => `<div class="wr-l wr-li">${CK}<span>${esc(txt)}</span></div>`).join('')}</div></div>
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
    T.done = T.items[T.items.length - 1].b + SETTLE; // the last result is in: review bar live, Worked for
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
        <span class="wr-doc">${SCISSORS}<b>${esc(FILE)}</b></span><span class="wr-chan">cut list</span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Working</span><span class="wr-clk">0s</span></em>
      </div>
      <div class="wr-vp"><div class="wr-stk">${SCRIPT.map((s) => `<div class="wr-it">${itemHTML(s)}</div>`).join('')}<div class="wr-sp"></div></div></div>
      <div class="wr-ft">
        <span class="wr-sum">${CHEV}<b class="wr-nf">Picking the clips</b><span class="wr-cnt">0 of ${NRES}</span></span>
        <span class="wr-btns"><i class="wr-b">Edit</i><i class="wr-b wr-pri">Use clips</i><i class="wr-b">Preview</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (the source's code.js): thresholds on the card's width
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('wr-wide', w >= 760); card.classList.toggle('wr-narrow', w <= 470); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const total = CMD.reduce((a, l) => a + l.length, 0);
    const items = [...card.querySelectorAll('.wr-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'code') { o.lines = [...n.querySelectorAll('.wr-cl .qc-vis')]; o.shown = -1; o.st = n.querySelector('.wr-dst'); }
      if (s.k === 'res') { o.lines = [...n.querySelectorAll('.wr-l')]; o.shown = -1; }
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
        let landed = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + SLOT_IN));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (s.k === 'code') {
            // the command types itself in, line after line
            const c = t < o.a ? 0 : Math.round(total * outCubic(seg(t, o.a + 0.03, o.b)) ** 0.85);
            if (c !== o.shown) {
              let left = c;
              o.lines.forEach((l, q) => { const m = Math.max(0, Math.min(CMD[q].length, left)); left -= CMD[q].length; setText(l, CMD[q].slice(0, m)); });
              o.shown = c;
            }
            o.n.classList.toggle('live', t >= o.a && t < o.b);
            setText(o.st, t >= o.b ? 'saved' : 'writing');
            o.st.classList.toggle('ok', t >= o.b);
          } else if (s.k === 'res') {
            // the results land one by one: a slow first line, then a run to the end
            const nf2 = t < o.a ? 0 : o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;
            const shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            landed = shown;
            o.n.classList.toggle('live', t >= o.a && t < o.b);
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

        // the review bar: the results count up as they land; at done it reads the result and Use clip pulses
        setText(nf, d ? '5 clips trimmed, captions written' : 'Picking the clips');
        setText(cnt, d ? '' : `${landed} of ${NRES}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('wr-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
