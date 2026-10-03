// Notes beat: Claude Opus 5.5 writes the episode's title, show notes and chapters, in the base's writing-panel grammar
// (Cursor's agent panel, via bikeride-model-switch's code beat): a header with "Episode 42 show notes", the runtime chip
// and an honest clock ("Working 1s", then a check and "Worked for 2s"), the tabs (Show notes active, then Chapters), and
// a body where the tab's muted meta line ("Title and a 3-sentence summary") sits above the writing streaming in behind
// a caret: the bold title, then the summary. Then the tab switches to Chapters and the seven "(MM:SS) Title" lines
// stream (Spotify's documented chapter format, timed to the 56:32 cut). The review bar names what is being written
// ("Writing show notes", then "Writing chapter 3 of 7") and lands on "Title, show notes and 7 chapters ready" with the
// green check, with Review / Keep notes. In the zoom cut the camera pushes in on the panel while it writes (chat.js
// FOCUS). Pure function of t: every value on screen is written from t. Each paragraph is laid out whole from the start
// (the streamed part visible, the rest transparent), so nothing reflows while it streams.
import { seg, outCubic } from '../../../lib.js';
import { EP } from './edit.js?v=b26eacf4';
import { lc } from './lucide-icons.js?v=b26eacf4';

const SAY = 'Wrote the title, show notes and chapters for the cut.';
const TITLE = `Episode ${EP.number} show notes`;
const CHAPTERS = EP.chapters.map(([ts, name]) => `(${ts}) ${name}`);
// the two tabs: [tab, glyph, meta line, streams: [[class, text], ...]]
const TABS = [
  ['Show notes', 'file-text', 'Title and a 3-sentence summary', [['wr-t1', EP.title], ['', EP.summary]]],
  ['Chapters', 'list-ordered', `${CHAPTERS.length} chapters, timed to the edit`, [['wr-ch', CHAPTERS.join('\n')]]],
];
const DONE = `Title, show notes and ${CHAPTERS.length} chapters ready`;

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first written character lands
const WRITE_A = 0.8; /* deliberate */ // the title and summary streaming in (twice the base's text, so a little longer)
const TAB_AT = 0.2;      // the notes written, then the tab switches to Chapters
const TAB_IN = 0.12;     // the Chapters body fading up
const WRITE_B = 0.8; /* deliberate */ // the seven chapters streaming in (read while the camera holds)
const REST_AT = 0.06;    // the chapters written, then the status lands
const REST = 0.34;       // ...the review bar settling on the last chapter before the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Keep notes pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const TICK = '<svg class="wr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="wr-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const DOC = '<svg class="wr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 12.5h7M8.5 16h5"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.a0 = T.card + WRITE_AT;
    T.a1 = T.a0 + WRITE_A;
    T.tab = T.a1 + TAB_AT;
    T.b0 = T.tab + TAB_IN;
    T.b1 = T.b0 + WRITE_B;
    T.n0 = T.b1 + REST_AT;
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
    const body = ([, , meta, streams]) => `<div class="wr-bd">
        <span class="wr-meta">${x.esc(meta)}</span>
        ${streams.map(([cls]) => `<p class="wr-new ${cls}"><span class="wr-v"></span><i class="wr-caret"></i><span class="wr-h"></span></p>`).join('')}
      </div>`;
    const card = x.el(`<div class="wr-x">
      <div class="wr-hd">
        <span class="wr-proj">${DOC}<b>${x.esc(TITLE)}</b></span><span class="wr-br">${x.esc(EP.runtime)}</span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Working</span><span class="wr-clk">0s</span></em>
      </div>
      <div class="wr-tabs">${TABS.map(([tab, gl], i) => `<span class="wr-tab${i === 0 ? ' on' : ''}">${lc(gl)}${x.esc(tab)}</span>`).join('')}</div>
      <div class="wr-bds">${TABS.map(body).join('')}</div>
      <div class="wr-ft">
        <span class="wr-sum">${CHEV}${TICK.replace('wr-tk', 'wr-tk wr-dn')}<b class="wr-nf">Writing show notes</b><span class="wr-cnt"></span></span>
        <span class="wr-btns"><i class="wr-b">Review</i><i class="wr-b wr-pri">Keep notes</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.wr-tab')];
    // every streamed paragraph, in order, with the share of its tab's write window it takes (by length)
    const bodies = [...card.querySelectorAll('.wr-bd')].map((n, i) => {
      const streams = TABS[i][3];
      const total = streams.reduce((s, [, txt]) => s + txt.length, 0);
      let acc = 0;
      const ps = [...n.querySelectorAll('.wr-new')].map((p, j) => {
        const a = acc / total; acc += streams[j][1].length;
        return { v: p.querySelector('.wr-v'), h: p.querySelector('.wr-h'), c: p.querySelector('.wr-caret'), text: streams[j][1], a, b: acc / total, shown: -1, caret: null };
      });
      return { n, ps };
    });
    const state = $('.wr-state'), stateL = $('.wr-sl'), clk = $('.wr-clk'), spin = $('.wr-hd .wr-spin'), stTk = state.querySelector('.wr-tk');
    const nf = $('.wr-nf'), cnt = $('.wr-cnt'), ft = $('.wr-ft'), pri = $('.wr-pri');
    let said = -1, onTab = -1;

    // one tab's stream over [a, b]: each paragraph takes its share; characters [0, n) visible, the rest laid out but
    // transparent, the caret riding the edge of the paragraph being written
    const stream = (o, a, b, t) => {
      const u = seg(t, a, b);
      o.ps.forEach((p, j) => {
        const n = Math.round(p.text.length * seg(u, p.a, p.b));
        if (n !== p.shown) { p.v.textContent = p.text.slice(0, n); p.h.textContent = p.text.slice(n); p.shown = n; }
        const last = j === o.ps.length - 1;
        const on = t >= a - 0.05 && t < b + 0.25 && u >= p.a && (u < p.b || last);
        if (on !== p.caret) { p.c.style.display = on ? '' : 'none'; p.caret = on; }
      });
      return u;
    };

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

        // the tab: Show notes until the switch, then Chapters (its body fades up)
        const tab = t >= T.tab ? 1 : 0;
        if (tab !== onTab) {
          tabs.forEach((n, i) => n.classList.toggle('on', i === tab));
          bodies.forEach((o, i) => { o.n.style.visibility = i === tab ? '' : 'hidden'; });
          onTab = tab;
        }
        bodies[1].n.style.opacity = tab ? outCubic(seg(t, T.tab, T.b0)).toFixed(3) : '0';
        stream(bodies[0], T.a0, T.a1, t);
        const ub = stream(bodies[1], T.b0, T.b1, t);

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: show notes, then the chapter being written (it follows the stream), then the summary
        const nCh = Math.min(CHAPTERS.length, 1 + Math.floor(CHAPTERS.length * ub + 1e-6));
        setText(nf, d ? DONE : tab === 0 ? 'Writing show notes' : 'Writing chapter');
        setText(cnt, d || tab === 0 ? '' : `${nCh} of ${CHAPTERS.length}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('wr-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
