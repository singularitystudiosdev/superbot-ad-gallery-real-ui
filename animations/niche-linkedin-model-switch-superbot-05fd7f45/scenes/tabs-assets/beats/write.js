// Write beat: Claude Opus 5.5 tailors the resume and writes a note to each hiring manager, as a sped-up replay of an
// agent run in the source's work-panel grammar (its code.js: Cursor's agent panel), headed "Note to Priya Shah" with a
// "1 of 12" chip: "Thought" and "Read" tool rows, a message card where the note to Priya streams in (the UI font,
// wrapped like a message, not mono), a "Tailored" row for the role's resume and a result card whose three lines land
// with checks, then the review bar "12 applications ready". The transcript is bottom-anchored inside a fixed viewport,
// so every item that lands pushes the run up the way the real panel autoscrolls. In the zoom cut the camera pushes in
// on the panel while the run plays (chat.js FOCUS).
// Pure function of t: every item's slot, height and stream come from the schedule in times(); render() reads the
// clock and nothing else. Item heights are constants in --u units, except the note card's, which is its wrapped text
// measured once per column width (layout px, so the camera never feeds back into it).
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Tailored your resume for each role and wrote a note to each hiring manager.';
const TITLE = 'Note to Priya Shah';
export const NOTE = 'Hi Priya, I saw Ledgerline is moving checkout to multi-currency. At Fernway Pay I led that rebuild: 14 countries in 9 months, failed payments down 31%. I would love to show you how we did it. Dana';
// what the run produced
const OUT = ['12 resumes tailored, one per role', '12 notes to hiring managers', 'Every claim matches your resume'];

// ---- the run: what lands, in order ----
const SCRIPT = [
  { k: 'row', v: 'Thought', a: 'for 3s' },
  { k: 'row', v: 'Read', a: '12 job posts and your resume' },
  { k: 'card', kind: 'note', title: 'Priya Shah', tag: 'Director of Product, Payments at Ledgerline', em: 'LinkedIn message' },
  { k: 'row', v: 'Tailored', a: 'Dana_Ruiz_Resume_Ledgerline.pdf' },
  { k: 'out', kind: 'out', title: 'Ready to apply', tag: '12 verified roles', em: '12 of 12', lines: OUT },
];

// seconds: how long an item takes to land/stream (DUR) and when the next one starts after it (STEP), in the source's
// v3 pace (its code beat: rows 0.08/0.072); the note streams its 196 characters in DUR.card
const DUR = { row: 0.08, card: 0.9, out: 0.36 };
const STEP = { row: 0.072, card: 0.82, out: 0.32 };
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const SLOT_IN = 0.064;   // an item's slot opening (and its content landing)
const FIRST = 0.096;     // the panel is up, then the first row lands
const SETTLE = 0.032;    // the results are in, then the run is done
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Approve all pulses once
const HOLD_DONE = 0.6; /* deliberate */  // done: the note and "12 applications ready" read, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic
// heights in --u units; GAP rides inside each item's slot. The note card's body is measured (noteH, below).
const LH = 20; // a result line
const HGT = { row: 22, card: 120, out: 32 + OUT.length * LH + 12 };
const GAP = 6;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ico = (d, cls = 'wr-ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const MSG = ico('<path d="M4 5.5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>');
const DONE = ico('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 14l2 2 4-4"/>');
const TICK = '<svg class="wr-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="wr-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const CK = '<svg class="wr-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function itemHTML(s) {
  if (s.k === 'row') return `<div class="wr-row"><span>${s.v}</span> ${esc(s.a)}</div>`;
  if (s.kind === 'note') {
    return `<div class="wr-card wr-note">
      <div class="wr-ch"><i class="wr-av">PS</i><b>${esc(s.title)}</b><s>${esc(s.tag)}</s><em>${esc(s.em)}</em></div>
      <div class="wr-bd"><div class="wr-msg"><span class="wr-vis"></span><span class="wr-hid">${esc(NOTE)}</span></div></div>
    </div>`;
  }
  return `<div class="wr-card wr-out" style="height: calc(var(--u) * ${HGT[s.k]})">
    <div class="wr-ch">${DONE}<b>${esc(s.title)}</b><s>${esc(s.tag)}</s><em class="ok">${esc(s.em)}</em></div>
    <div class="wr-bd"><div class="wr-lines">${s.lines.map((txt) => `<div class="wr-l">${CK}<span>${esc(txt)}</span></div>`).join('')}</div></div>
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
    T.done = T.items[T.items.length - 1].b + SETTLE; // the results are in: review bar live, header check
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
        <span class="wr-doc">${MSG}<b>${esc(TITLE)}</b></span><span class="wr-chan">1 of 12</span>
        <em class="wr-state"><i class="wr-spin"></i>${TICK}<span class="wr-sl">Writing</span></em>
      </div>
      <div class="wr-vp"><div class="wr-stk">${SCRIPT.map((s) => `<div class="wr-it">${itemHTML(s)}</div>`).join('')}<div class="wr-sp"></div></div></div>
      <div class="wr-ft">
        <span class="wr-sum">${CHEV}<b class="wr-nf">Writing note 1 of 12</b></span>
        <span class="wr-btns"><i class="wr-b">Edit</i><i class="wr-b">Review</i><i class="wr-b wr-pri">Approve all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (the source's code.js): thresholds on the card's width
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('wr-wide', w >= 760); card.classList.toggle('wr-narrow', w <= 470); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const vp = $('.wr-vp');
    const items = [...card.querySelectorAll('.wr-it')].map((n, i) => {
      const s = SCRIPT[i], o = { n, s, ...T.items[i], h: -1 };
      if (s.k === 'out') { o.lines = [...n.querySelectorAll('.wr-l')]; o.shown = -1; }
      if (s.kind === 'note') { o.card = n.firstElementChild; o.msg = n.querySelector('.wr-msg'); o.vis = n.querySelector('.wr-vis'); o.hid = n.querySelector('.wr-hid'); o.ns = -1; }
      return o;
    });
    const note = items.find((o) => o.s.kind === 'note');
    const state = $('.wr-state'), stateL = $('.wr-sl'), spin = $('.wr-hd .wr-spin'), stTk = state.querySelector('.wr-tk');
    const nf = $('.wr-nf'), ft = $('.wr-ft'), pri = $('.wr-pri');
    let said = -1, mw = -1, noteH = HGT.card;
    // the note card's height in --u units: header + its wrapped text + padding, re-measured only when the column changes
    const measure = () => {
      const w = card.clientWidth;
      if (!w || w === mw) return;
      mw = w;
      const u = parseFloat(getComputedStyle(vp).getPropertyValue('--u')) || 1;
      noteH = 32 + note.msg.offsetHeight / u + 16;
      note.card.style.height = `calc(var(--u) * ${noteH.toFixed(2)})`;
      note.h = -1;
    };

    return {
      nodes: [say, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 16);
        measure();
        const d = t >= T.done;
        items.forEach((o) => {
          const { s } = o;
          // the slot opens (height), which pushes the whole run up; the content lands just behind it
          const e = outCubic(seg(t, o.a, o.a + SLOT_IN));
          const h = e * ((s.kind === 'note' ? noteH : HGT[s.k]) + GAP);
          if (Math.abs(h - o.h) > 1e-3) { o.n.style.height = `calc(var(--u) * ${h.toFixed(3)})`; o.h = h; }
          o.n.style.opacity = e.toFixed(3);
          if (o.msg) {
            // the note streams in, character by character, over the card's [a, b]
            const n = t < o.a ? 0 : Math.min(NOTE.length, Math.ceil(NOTE.length * seg(t, o.a + 0.04, o.b) - 1e-6));
            if (n !== o.ns) { o.vis.textContent = NOTE.slice(0, n); o.hid.textContent = NOTE.slice(n); o.ns = n; }
            o.n.classList.toggle('live', t >= o.a && t < o.b);
          }
          if (o.lines) {
            // the result lines land one by one
            const nf2 = t < o.a ? 0 : o.lines.length * outCubic(seg(t, o.a + 0.02 * (o.b - o.a), o.b)) ** 0.9;
            const shown = Math.min(o.lines.length, Math.ceil(nf2 - 1e-6));
            if (shown !== o.shown) { o.lines.forEach((l, q) => { l.style.visibility = q < shown ? '' : 'hidden'; }); o.shown = shown; }
          }
        });
        const tailored = t >= items[3].a; // the "Tailored" row has landed

        // header: "Writing" with a spinner, then a check and "Done"
        setText(stateL, d ? 'Done' : 'Writing');
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: what is being written, then the result, and Approve all pulses once
        setText(nf, d ? '12 applications ready' : tailored ? 'Tailoring 12 resumes' : 'Writing note 1 of 12');
        ft.classList.toggle('on', d);
        card.classList.toggle('wr-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
