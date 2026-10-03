// Write beat: Claude Opus 5.5 writes render_colorways.py, the Blender scene script, as a sped-up replay of an agent run
// in the source's work-panel grammar (its code.js: Cursor's agent panel): a "Read" tool row, a Python card whose lines
// land one by one, a "Checked" row, then the plain status line "Scene script ready". The card's lines are verbatim
// lines of the real script that rendered the three colorways (the asset build's out/excerpt.txt). No clock anywhere:
// the header is a spinner and "Working", then a check and "Done"; no button row, so nothing on screen looks tappable
// (X ad policy). The transcript is bottom-anchored inside a fixed viewport, so every item that lands pushes the run up
// the way the real panel autoscrolls. In the zoom cut the camera pushes in on the panel while the run plays (chat.js
// FOCUS).
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else. Item heights are constants in --u units, so the stacking is exact at every column width.
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Wrote the scene script: swap the body texture, keep the steel, render each colorway.';
const FILE = 'render_colorways.py';

// the script, line by line (verbatim from the real script; spaces kept)
// <excerpt>  (out/excerpt.txt, 8 lines, each a verbatim line of out/render_colorways.py)
const CODE = [
  "COLORWAYS = {",
  "    \"Sage\": \"#8FAE8B\",",
  "    \"Coral\": \"#E2725B\",",
  "    \"Midnight\": \"#1E2A44\",",
  "}",
  "camera.data.lens = 85",
  "scene.render.engine = \"CYCLES\"",
  "for name, hex_value in COLORWAYS.items():",
];
// </excerpt>

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Read', a: 'alarm_clock.blend: body material, camera, sweep' },
  { k: 'card', kind: 'code', title: FILE, tag: 'Python', em: `+${CODE.length}`, lines: CODE },
  { k: 'row', v: 'Checked', a: 'body recolored only, bells and frame keep steel' },
];

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP), in the source's
// v3 pace (its code beat: rows 0.08/0.072, a card streaming a whole body in under half a second)
const DUR = { row: 0.08, card: 0.8 };
const STEP = { row: 0.072, card: 0.72 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the output is printed, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: the status line settles
const HOLD_DONE = 0.8; /* deliberate */  // done: "Scene script ready" reads, pushed in, before the pull-back
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
// a code glyph (angle brackets) as the language label's mark
const MD = '<svg class="wr-md" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5"/></svg>';

// a line of Python, lightly highlighted: comments, strings, keywords, numbers. Tokenised on the raw line and each
// piece escaped on its own, so a highlight never matches inside markup
const TOK = /(#.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(import|from|for|in|def|return|as|if|elif|else|with|not|and|or|None|True|False|lambda)\b|\b(\d+(?:\.\d+)?)\b/g;
const CLS = ['wr-cm', 'wr-str', 'wr-kw', 'wr-arg'];
function hl(src) {
  let out = '', last = 0, m;
  TOK.lastIndex = 0;
  while ((m = TOK.exec(src))) {
    const g = [1, 2, 3, 4].find((i) => m[i] !== undefined);
    out += esc(src.slice(last, m.index)) + `<em class="${CLS[g - 1]}">${esc(m[0])}</em>`;
    last = m.index + m[0].length;
  }
  return out + esc(src.slice(last));
}

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
    T.done = T.items[T.items.length - 1].b + SETTLE; // the run is done: the status line reads the result
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
        <span class="wr-doc">${DOC}<b>${FILE}</b></span><span class="wr-chan">${MD}Python</span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Working</span></em>
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
    const state = $('.wr-state'), stateL = $('.wr-sl'), spin = $('.wr-hd .wr-spin'), stTk = state.querySelector('.wr-tk');
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
        const ran = t >= items[2].a; // the "Checked" row has landed: the script is being checked against the spec

        // header: words only, no clock: "Working" with a spinner, then a check and "Done"
        setText(stateL, d ? 'Done' : 'Working');
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the status line: the file's lines count up as they land; at done it reads the result (plain text, its
        // check popping in; no buttons)
        setText(nf, d ? 'Scene script ready' : ran ? 'Checking against the spec' : `Writing ${FILE}`);
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
