// Post beat: Claude Opus 5.5 writes October's patron post in the creator's voice, in the base's code-panel grammar
// (Cursor's agent panel, via bikeride-model-switch's code beat): a header with the post's name, the voice note ("In
// your voice, from your past posts") and its state ("Writing", then a check and "Done"; no clock, per the policy guard
// against timers on screen), the file
// tabs (october-post.md active, notes.md), the editor body with line numbers where the title, the intro and the three
// sections stream in character by character behind a caret, and the review bar that counts the words of the post as it
// is written and lands on "Title, intro and 3 sections, 480 words" with the green check. The review bar carries no
// buttons (policy: no controls left standing on a held frame). In the zoom cut the camera pushes in on the panel while
// it writes, so the intro reads (chat.js FOCUS). Pure function of t: every value on screen is written from t; line
// heights are constants, so the stream never measures layout.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=8f4b57c6';

const SAY = 'Wrote October\'s post in your voice, ready to fill in.';
const PROJECT = 'October patron post';
const VOICE = 'In your voice, from your past posts';
// the post as Opus writes it (exact, per the brief with heron -> robin; the intro is wrapped by hand to the panel)
export const TITLE = 'October sketchbook: the robin pages';
export const INTRO = 'The robins won your poll by a mile, so October was all robins. Eight pages below, the whole ink and wash process in five short clips, and the wing I redrew twice before it behaved. Thank you for keeping this little corner of the internet going.';
export const SECTIONS = ['Eight pages, full size', 'The robin in 5 steps', 'Brushes and paper I used'];
export const WORDS = 480;
const DRAFT = `Title: ${TITLE}

The robins won your poll by a mile, so October was all
robins. Eight pages below, the whole ink and wash process
in five short clips, and the wing I redrew twice before it
behaved. Thank you for keeping this little corner of the
internet going.

${SECTIONS.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
const TABS = ['october-post.md', 'notes.md'];
const DONE = 'Title, intro and 3 sections, 480 words';
const LINES = DRAFT.split('\n');

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first character lands
const WRITE = 1.35; /* deliberate */ // the draft streaming in (read while the camera holds)
const REST_AT = 0.06;    // the last line written, then the summary settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light highlighter: the title field and the section numbers
const hl = (line) => {
  const m = /^(Title:|\d+\.)/.exec(line);
  return m ? `<i class="k">${esc(m[0])}</i>${esc(line.slice(m[0].length))}` : esc(line);
};
const ENV = lc('file-text', 'em-ico');
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// the character stream: line i shows chars [0, k) of itself once the total count passes its start
const STARTS = LINES.reduce((a, l, i) => (a.push(i ? a[i - 1] + LINES[i - 1].length + 1 : 0), a), []);
const TOTAL = DRAFT.length;
const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + WRITE;
    T.n0 = T.w1 + REST_AT;
    T.done = T.n0 + REST;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="em-x">
      <div class="em-hd">
        <span class="em-proj">${ENV}<b>${PROJECT}</b></span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Writing</span></em>
      </div>
      <div class="em-meta">${VOICE}</div>
      <div class="em-tabs">${TABS.map((f, i) => `<span class="em-tab${i === 0 ? ' on' : ''}"><b class="em-fi">MD</b>${f}</span>`).join('')}</div>
      <div class="em-bd">${LINES.map((l, i) => `<div class="em-l"><u>${i + 1}</u><code><span class="em-v"></span><i class="em-caret"></i></code></div>`).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">0 words</span></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.em-l')].map((n, i) => ({ n, v: n.querySelector('.em-v'), c: n.querySelector('.em-caret'), shown: -1, caret: null }));
    const state = $('.em-state'), stateL = $('.em-sl'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft');
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
        const d = t >= T.done;

        // the stream: a steady typewriter over WRITE, the caret riding the last character
        const c = Math.round(TOTAL * seg(t, T.w0, T.w1));
        const writing = t >= T.w0 && t < T.w1 + 0.3;
        rows.forEach((o, i) => {
          const k2 = Math.max(0, Math.min(LINES[i].length, c - STARTS[i]));
          const visible = c > STARTS[i] || (i === 0 && t >= T.w0);
          if (k2 !== o.shown) { o.v.innerHTML = hl(LINES[i].slice(0, k2)); o.shown = k2; }
          o.n.style.visibility = visible || c >= TOTAL ? '' : 'hidden';
          const on = writing && c >= STARTS[i] && (i === LINES.length - 1 || c < STARTS[i + 1]);
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });

        // header: writing, then done
        setText(stateL, d ? 'Done' : 'Writing');
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the words of the whole post counted up while it is written, then the summary
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${fmt(Math.round(WORDS * seg(t, T.w0, T.w1)))} words`);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
      },
    };
  },
};
