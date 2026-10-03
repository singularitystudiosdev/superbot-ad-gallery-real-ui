// Write beat: Claude Opus 5.5 writes launch_set.md, the three launch layouts, as a sped-up replay of an agent run
// in the source's work-panel grammar (its code.js: Cursor's agent panel): "Thought" and "Read" tool rows, a Markdown
// card whose lines land one by one (layout A, B and C, each with its format, its size, its headline and its photo,
// then the brand rule), a "Checked" row, then the status line "3 layouts ready" (plain text: no button row, per the
// X ad policy amendment, so nothing on screen looks tappable). The
// transcript is bottom-anchored inside a fixed viewport, so every item that lands pushes the run up the way the real
// panel autoscrolls. In the zoom cut the camera pushes in on the panel while the run plays (chat.js FOCUS).
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else. Item heights are constants in --u units, so the stacking is exact at every column width.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Three layouts, one per size, in the brand\u2019s voice.';
const FILE = 'launch_set.md';

// the layouts, line by line, in mono with their columns aligned (letter, format, size, headline, photo)
const CODE = [
  'A  Post    1080 x 1080  "Autumn Blend is here"     beans',
  'B  Story   1080 x 1920  "Your first cup is on us"  pour-over',
  'C  Poster  18 x 24 in   "Slow mornings are back"   cup + leaves',
  '',
  'rule: Copper on Oat, Pine for small type, no exclamation marks',
];

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 2s' },
  { k: 'row', v: 'Read', a: 'copperleaf_brief.pdf' },
  { k: 'card', kind: 'code', title: FILE, tag: 'Markdown', em: `+${CODE.length}`, lines: CODE },
  { k: 'row', v: 'Checked:', a: 'brand colours only, every headline under 6 words' },
];

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP), in the source's
// v3 pace (its code beat: rows 0.08/0.072, a card streaming a whole body in under half a second)
const DUR = { row: 0.08, card: 0.56 };
const STEP = { row: 0.072, card: 0.48 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the output is printed, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: the status line settles
const HOLD_DONE = 0.5; /* deliberate */  // done: "3 layouts ready" reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
// heights in --u units; GAP rides inside each item's slot
const LH = 17; // a card's body line
const HGT = { row: 22, card: 32 + CODE.length * LH + 12 };
const GAP = 6;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ico = (d, cls = 'wr-ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const DOC = ico('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9.5 13l-2 2 2 2M14.5 13l2 2-2 2"/>');
const TICK = '<svg class="wr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// the Markdown mark (an M and a down arrow in a rounded frame) as the channel chip's glyph
const MD = '<svg class="wr-md" viewBox="0 0 208 128" aria-hidden="true"><rect x="6" y="6" width="196" height="116" rx="14"/><path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z"/></svg>';

// a line of the layouts, lightly highlighted (escaped first, then wrapped): the letter, the quoted headline, the
// size, the rule's key
// (the quoted words first, so no later wrap's class attribute is ever matched as a string)
const hl = (src) => esc(src)
  .replace(/(&quot;[^&]*&quot;|"[^"]*")/g, '<em class="wr-str">$1</em>')
  .replace(/\b(\d+ x \d+(?: in)?)/g, '<em class="wr-arg">$1</em>')
  .replace(/^([ABC]) /, '<em class="wr-kw">$1</em> ')
  .replace(/^(rule:)/, '<em class="wr-kw">$1</em>');

function itemHTML(s) {
  if (s.k === 'row') return `<div class="wr-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  const code = s.kind === 'code';
  return `<div class="wr-card wr-${s.kind}" style="height: calc(var(--u) * ${HGT[s.k]})">
    <div class="wr-ch">${DOC}<b>${esc(s.title)}</b><s>${esc(s.tag)}</s><em${code ? ' class="wr-add"' : ' class="ok"'}>${esc(s.em)}</em></div>
    <div class="wr-bd"><div class="wr-lines">${s.lines.map((txt, i) => `<div class="wr-l">${code ? `<i>${i + 1}</i><span>${hl(txt)}</span>` : `<i>&rsaquo;</i><span>${esc(txt)}</span>`}</div>`).join('')}</div></div>
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
    T.done = T.items[T.items.length - 1].b + SETTLE; // the output is printed: review bar live, Worked for
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
        <span class="wr-doc">${DOC}<b>${FILE}</b></span><span class="wr-chan">${MD}Markdown</span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Working</span><span class="wr-clk">0s</span></em>
      </div>
      <div class="wr-vp"><div class="wr-stk">${SCRIPT.map((s) => `<div class="wr-it">${itemHTML(s)}</div>`).join('')}<div class="wr-sp"></div></div></div>
      <div class="wr-ft">
        <span class="wr-sum">${TICK.replace('wr-tk', 'wr-tk wr-ftk')}<b class="wr-nf">Writing ${FILE}</b><span class="wr-cnt"></span></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (the source's code.js): thresholds on the card's width
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('wr-wide', w >= 760); card.classList.toggle('wr-narrow', w <= 470); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const items = [...card.querySelectorAll('.wr-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k !== 'row') { o.lines = [...n.querySelectorAll('.wr-l')]; o.shown = -1; }
      return o;
    });
    const state = $('.wr-state'), stateL = $('.wr-sl'), clk = $('.wr-clk'), spin = $('.wr-hd .wr-spin'), stTk = state.querySelector('.wr-tk');
    const nf = $('.wr-nf'), cnt = $('.wr-cnt'), ft = $('.wr-ft'), ftk = $('.wr-ftk');
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
        let lines = 0;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + SLOT_IN));
          const h = e * (HGT[s.k] + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (o.lines) {
            // the card's lines land one by one: a slow first line, then a run to the end
            const nf2 = t < o.a ? 0 : o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;
            const shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
            o.n.classList.toggle('live', t >= o.a && t < o.b);
            if (s.kind === 'code') lines = shown;
          }
        });
        const ran = t >= items[3].a; // the "Checked" row has landed: the layouts are being checked against the brief

        // header: this beat's own elapsed seconds from r, rounded up: "Working 1s" with a spinner, then a check and
        // "Worked for 1s"

        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.max(1, Math.ceil(Math.min(t, T.done) - T.r - 1e-6))}s`); // whole seconds, rounded up (the run is under 1 s of screen time)
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the status line: the file's lines count up as they land; at done it reads the result (plain text, its
        // check popping in; no buttons)
        setText(nf, d ? '3 layouts ready' : ran ? 'Checking against the brief' : `Writing ${FILE}`);
        setText(cnt, d || ran ? '' : `${lines} of ${CODE.length} lines`);
        ft.classList.toggle('on', d);
        card.classList.toggle('wr-done', d);
        const fp = seg(t, T.done, T.done + PULSE);
        ftk.style.opacity = d ? outCubic(fp).toFixed(3) : '0';
        ftk.style.transform = d && fp < 1 ? `scale(${(0.6 + 0.4 * outCubic(fp)).toFixed(3)})` : '';
      },
    };
  },
};
