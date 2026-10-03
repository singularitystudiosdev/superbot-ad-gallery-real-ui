// Rewrite beat: Claude Opus 5.5 rewrites each broken formula and keeps the layout, in the sibling's code-panel grammar
// (panel chrome, streaming caret, the camera's push on the panel) as a formula diff: a header with the workbook and a
// counter that ticks "N formulas rewritten" from 0 to 37 (a count, never a clock), then four diff rows, each the cell
// reference in mono, the broken formula (red, struck) and the rewrite streaming in under it (green) behind a caret.
// The footer lands on "37 of 37 rewritten, layout unchanged" with the green check. No tabs, no Review / Commit / Apply
// buttons, no timers (X ad policy). In the zoom cut the camera pushes in on the panel while it writes (chat.js FOCUS).
// Pure function of t: every value on screen is written from t; line heights are constants, so nothing reflows.
import { seg, outCubic } from '../../../lib.js';
import { fl } from './fluent-icons.js?v=cb7a5452';

const SAY = 'Rewriting each formula and keeping your layout.';
const FILE = 'Q3 Revenue.xlsx';
const TOTAL = 37;
// the diff rows: [cell, before, after]. Sales table columns: A Date, B Region, C Currency, D Units, E Price, F Amount,
// G Revenue USD. The rewrites avoid the this-row structured reference ([@Amount]): X ad policy allows no '@' on screen,
// so they use plain cell references with the same meaning (XLOOKUP matches exactly by default).
export const DIFFS = [
  ['Sales!G2', '=F2*VLOOKUP(C2,FX!A:B,2)', '=F2*XLOOKUP(C2,FX[Code],FX[Rate])'],
  ['Summary!B4', '=SUM(#REF!)', '=SUMIFS(Sales[Revenue USD],Sales[Region],$A4)'],
  ['Sales!F118', '48200', '=D118*E118'],
  ['Summary!B10', '=SUM(B4:B7)', '=SUM(B4:B8)'],
];
const DONE = '37 of 37 rewritten, layout unchanged';

// timing (seconds from the reply start, or from the panel where noted), the sibling's replies beat pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first rewrite starts
const WRITE = 1.54; /* deliberate */ // all four rewrites streaming, one after another (the sibling's two replies + switch)
const ROW_IN = 0.12;     // a diff row's broken formula fading up, just before its rewrite streams
const REST_AT = 0.06;    // the last rewrite written, then the summary settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TICK = '<svg class="rw-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
// each rewrite's share of the stream window, by its length
const LENS = DIFFS.map(([, , a]) => a.length);
const SUM = LENS.reduce((a, b) => a + b, 0);

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    let acc = T.w0;
    T.rows = DIFFS.map((_, i) => { const a = acc; acc += (WRITE * LENS[i]) / SUM; return [a, acc]; });
    T.w1 = acc;
    T.n0 = T.w1 + REST_AT;
    T.done = T.n0 + REST;
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
    const card = x.el(`<div class="rw-x">
      <div class="rw-hd">
        <span class="rw-proj">${fl('table', 'rw-ico')}<b>${esc(FILE)}</b></span>
        <em class="rw-state"><i class="rw-spin"></i>${TICK}<span class="rw-n">0</span><span class="rw-sl">formulas rewritten</span></em>
      </div>
      <div class="rw-body">${DIFFS.map(([cell, before]) => `<div class="rw-d">
        <code class="rw-ref">${esc(cell)}</code>
        <div class="rw-ls"><div class="rw-l rw-old"><s>${esc(before)}</s></div><div class="rw-l rw-new"><span class="rw-v"></span><i class="rw-caret"></i></div></div>
      </div>`).join('')}</div>
      <div class="rw-ft"><i class="rw-spin"></i>${TICK.replace('rw-tk', 'rw-tk rw-dn')}<b class="rw-nf">Rewriting</b></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.rw-d')].map((n, i) => ({ n, v: n.querySelector('.rw-v'), c: n.querySelector('.rw-caret'), text: DIFFS[i][2], shown: -1, caret: null }));
    const state = $('.rw-state'), cnt = $('.rw-n'), spin = $('.rw-hd .rw-spin');
    const ft = $('.rw-ft'), nf = $('.rw-nf'), fspin = $('.rw-ft .rw-spin');
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS_SAY + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;

        // each diff row: its broken formula fades up, then its rewrite streams in behind the caret
        rows.forEach((o, i) => {
          const [a, b] = T.rows[i];
          o.n.style.opacity = outCubic(seg(t, a - ROW_IN, a)).toFixed(3);
          const k2 = Math.round(o.text.length * seg(t, a, b));
          if (k2 !== o.shown) { o.v.textContent = o.text.slice(0, k2); o.shown = k2; }
          const on = t >= a && t < b + 0.12 && (i === rows.length - 1 || t < T.rows[i + 1][0]);
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });

        // header: the count of formulas rewritten (0 to 37, in step with the stream), spinner then the check
        const q = seg(t, T.w0, T.w1);
        setText(cnt, String(Math.round(TOTAL * q)));
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        fspin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        state.querySelector('.rw-tk').style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the footer: rewriting, then the summary with the check
        setText(nf, d ? DONE : 'Rewriting');
        ft.classList.toggle('on', d);
        card.classList.toggle('rw-done', d);
      },
    };
  },
};
