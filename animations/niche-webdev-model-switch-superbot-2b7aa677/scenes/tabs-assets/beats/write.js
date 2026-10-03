// Write beat: Claude Opus 5.5 writes app/page.tsx and runs the build, as a sped-up replay of an agent run in the
// source's work-panel grammar (its code.js: Cursor's agent panel): "Thought" and "Read" tool rows, a code card whose
// Next.js lines land one by one (the App Router page: Hero, Today's bakes, the story and the visit block, on
// Tailwind classes), a "Ran npm run build" row and an output card with the build's result, then the review bar
// "Build passed. Ready to ship." with Undo / Keep all / Review. The transcript is bottom-anchored inside a fixed
// viewport, so every item that lands pushes the run up the way the real panel autoscrolls. In the zoom cut the camera
// pushes in on the panel while the run plays (chat.js FOCUS).
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else. Item heights are constants in --u units, so the stacking is exact at every column width.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Built it in Next.js and Tailwind. The build passes, ready to ship.';
const FILE = 'app/page.tsx';
const CMD = 'npm run build';

// the page, line by line (a little highlighting: strings, keywords, JSX tags and props)
const CODE = [
  'export default function Home() {',
  '  return (',
  '    <main className="min-h-screen bg-cream text-cocoa">',
  '      <Hero title="Baked before sunrise. Gone by noon." />',
  '      <TodaysBakes items={bakes} />',
  '      <Story />',
  '      <Visit hours="7am to 3pm" />',
  '    </main>',
  '  );',
  '}',
];
// what the build printed
const OUT = ['\u2713 Compiled successfully in 3.1s', '\u2713 Generating static pages (4/4)', 'Route (app)    \u25cb /    5.2 kB'];

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 2s' },
  { k: 'row', v: 'Read', a: 'page-plan.md' },
  { k: 'card', kind: 'code', title: FILE, tag: 'TypeScript', em: `+${CODE.length}`, lines: CODE },
  { k: 'row', v: 'Ran', a: CMD },
  { k: 'out', kind: 'out', title: 'Output', tag: CMD, em: 'exit 0', lines: OUT },
];

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP), in the source's
// v3 pace (its code beat: rows 0.08/0.072, a card streaming a whole body in under half a second)
const DUR = { row: 0.08, card: 0.56, out: 0.36 };
const STEP = { row: 0.072, card: 0.48, out: 0.32 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the output is printed, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Keep all pulses once
const HOLD_DONE = 0.5; /* deliberate */  // done: "Build passed. Ready to ship." reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
// heights in --u units; GAP rides inside each item's slot
const LH = 17; // a card's body line
const HGT = { row: 22, card: 32 + CODE.length * LH + 12, out: 32 + OUT.length * LH + 12 };
const GAP = 6;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ico = (d, cls = 'wr-ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const DOC = ico('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9.5 13l-2 2 2 2M14.5 13l2 2-2 2"/>');
const TERM = ico('<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5"/>');
const TICK = '<svg class="wr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="wr-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
// TypeScript's blue as a small chip square
const TS = '<i class="wr-ts"></i>';

// a line of TSX, lightly highlighted (escaped first, then wrapped): strings first, so no later pattern can match
// inside a string, and none of the later patterns can match the markup the earlier ones added
const hl = (src) => esc(src)
  .replace(/("[^"]*")/g, '<em class="wr-str">$1</em>')
  .replace(/\b(className|title|items|hours)=/g, '<em class="wr-arg">$1</em>=')
  .replace(/\b(export|default|function|return)\b/g, '<em class="wr-kw">$1</em>')
  .replace(/(&lt;\/?)([A-Za-z]+)/g, '$1<em class="wr-tag">$2</em>');

function itemHTML(s) {
  if (s.k === 'row') return `<div class="wr-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  const code = s.kind === 'code';
  return `<div class="wr-card wr-${s.kind}" style="height: calc(var(--u) * ${HGT[s.k]})">
    <div class="wr-ch">${code ? DOC : TERM}<b>${esc(s.title)}</b><s>${esc(s.tag)}</s><em${code ? ' class="wr-add"' : ' class="ok"'}>${esc(s.em)}</em></div>
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
        <span class="wr-doc">${DOC}<b>${FILE}</b></span><span class="wr-chan">${TS}TypeScript</span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Working</span><span class="wr-clk">0s</span></em>
      </div>
      <div class="wr-vp"><div class="wr-stk">${SCRIPT.map((s) => `<div class="wr-it">${itemHTML(s)}</div>`).join('')}<div class="wr-sp"></div></div></div>
      <div class="wr-ft">
        <span class="wr-sum">${CHEV}<b class="wr-nf">Writing ${FILE}</b><span class="wr-cnt"></span></span>
        <span class="wr-btns"><i class="wr-b">Undo</i><i class="wr-b wr-pri">Keep all</i><i class="wr-b">Review</i></span>
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
        const ran = t >= items[3].a; // the "Ran" row has landed: the build is running

        // header: an honest clock, this beat's own elapsed whole seconds from r: "Working 1s" with a spinner, then a
        // check and "Worked for 2s" (the whole seconds from r to done)
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the page's lines count up as they land; at done it reads the result and Keep all pulses
        setText(nf, d ? 'Build passed. Ready to ship.' : ran ? `Running ${CMD}` : `Writing ${FILE}`);
        setText(cnt, d || ran ? '' : `${lines} of ${CODE.length} lines`);
        ft.classList.toggle('on', d);
        card.classList.toggle('wr-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
