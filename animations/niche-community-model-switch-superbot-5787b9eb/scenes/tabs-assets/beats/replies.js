// Replies beat: Claude Opus 5.5 drafts the forum replies and the weekly roundup, as a sped-up replay in the base ad's
// agent-panel grammar (ported from its code beat: a header with the run's state, file tabs, line numbers in a gutter,
// the green "new lines" wash and bar, text streaming in, the camera pushing in on the panel while it runs). Here the
// files are Markdown prose, soft-wrapped: replies.md (the star: two of the 23 replies, streaming) and roundup.md (the
// weekly roundup), the tab strip switching from one to the other. The run ends on a plain check line, "23 replies and
// the weekly roundup drafted".
// X ad policy: no button row (no Undo all / Accept all / Review), no close glyph on the tabs, no chevrons, and no
// clock: the header is a spinner and "Drafting", then a check and "Done".
// Pure function of t: every line's stream comes from the schedule in times(); render() reads the clock and the laid-out
// line boxes (the soft wrap depends on the column width), nothing else. The text is laid out whole from the start (the
// part not yet streamed is transparent), so nothing reflows while it streams.
import { seg, outCubic, inOutCubic } from '../../../lib.js';

const SAY = 'Drafted a reply to each of the 23 posts from your docs, and this week\'s roundup.';
const TITLE = 'Fernote Community';

// the two files, one Markdown line per entry (a line soft-wraps in the panel; the gutter numbers logical lines)
const FILES = [
  { f: 'replies.md', lines: [
    '## Sync stuck on "Waiting" after 4.2',
    'Hi Jonas, thanks for the screenshots. In 4.2 this is the sync cache. Open Settings, then Sync, then Rebuild sync cache. If it still says Waiting after that, reply here and I\'ll check your account with the team.',
    '',
    '## Export a notebook to PDF',
    'Hi Ana, open the notebook, then File, then Export, and pick PDF. Images and tags come along.',
  ] },
  { f: 'roundup.md', lines: [
    '# Weekly roundup',
    '- 4.2 is out: a new tag panel and faster search',
    '- Most helpful thread: Templates for meeting notes (thanks, Lena)',
    '- 38 new members said hi in Introductions',
  ] },
];
const STATUS = 'Drafting replies for 23 posts';
const CHECKED = '23 replies and the weekly roundup drafted';

// seconds
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const FIRST = 0.12;      // the panel is up, then replies.md starts streaming
const CPS = [360, 340];  /* deliberate */ // characters a second per file (the star reads while the camera holds)
const NL = 0.05;         // a line's end to the next line's first character (a blank line costs the same)
const TAB_AT = 0.15;     // replies.md done, then the tab strip switches to roundup.md
const TAB = 0.2;         // the tab switching (the ink slides, the files cross-fade)
const ROUND_AT = 0.08;   // the switch done, then roundup.md streams
const SETTLE = 0.08;     // roundup.md done, then the run is done
const POP = 0.176;       // done: the header check pops in
const LINE_IN = 0.24;    // done: the check line rising in
const HOLD_DONE = 0.4; /* deliberate */ // done: the check line reads, pushed in, before the camera pulls back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Markdown, lightly: a heading's hashes dim and its text bright, a bullet's dash dim; prose plain
function md(line) {
  let m = line.match(/^(#{1,6} )(.*)$/);
  if (m) return [`<i class="mh">${esc(m[1])}</i>`, `<i class="hd">`, m[2], '</i>'];
  m = line.match(/^(- )(.*)$/);
  if (m) return [`<i class="mh">${esc(m[1])}</i>`, '', m[2], ''];
  return ['', '', line, ''];
}

// Material Design Icons (Pictogrammers, Apache 2.0), paths verbatim from the Iconify API (mdi set): the panel's mark
const FORUM = '<svg class="code-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4v7H5.17L4 12.17V4zm1-2H3a1 1 0 0 0-1 1v14l4-4h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1m5 4h-2v9H6v2a1 1 0 0 0 1 1h11l4 4V7a1 1 0 0 0-1-1"/></svg>';
const TICK = '<svg class="code-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
function rise(n, p, dy) {
  const e = outCubic(p);
  n.style.opacity = e.toFixed(3);
  n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
}

// exported for the page's own checks (the copy the brief fixes)
export const CHECK_LINE = CHECKED;

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    // every line's stream [a, b]: one file after the other, a line at a time
    let at = T.card + FIRST;
    T.files = FILES.map((file, fi) => {
      if (fi === 1) { T.tab = at - NL + TAB_AT; at = T.tab + TAB + ROUND_AT; }
      const lines = file.lines.map((l) => { const o = { a: at, b: at + l.length / CPS[fi] }; at = o.b + NL; return o; });
      return { a: lines[0].a, b: lines[lines.length - 1].b, lines };
    });
    T.done = T.files[1].b + SETTLE; // the roundup is written: header check, the check line
    // zoom cut only (chat.js passes opts.zoom; nozoom has no camera move): the camera (scenes/tabs.js, via chat.js
    // FOCUS) pushes in on the panel once it is up, holds through the run, and pulls back to rest after done
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    // the beat's last visible change: the camera back at rest in the zoom cut; the panel itself settles at done + LINE_IN
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + LINE_IN, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const fileHTML = (file) => `<div class="code-file"><div class="code-lines">${file.lines.map((l, i) => {
      const [pre, open, text, close] = md(l);
      return `<div class="code-l"><u>${i + 1}</u><code>${pre}${open}<span class="sv"></span><span class="sh">${esc(text) || ' '}</span>${close}</code></div>`;
    }).join('')}</div></div>`;
    const card = x.el(`<div class="code-x">
      <div class="code-hd">
        <span class="code-repo">${FORUM}<b>${esc(TITLE)}</b></span>
        <em class="code-state"><i class="code-spin"></i>${TICK}<span class="code-sl">Drafting</span></em>
      </div>
      <div class="code-tabs">${FILES.map((f) => `<span class="code-tab"><b class="code-fi">MD</b>${esc(f.f)}</span>`).join('')}<i class="code-ink"></i></div>
      <div class="code-vp">${FILES.map(fileHTML).join('')}</div>
      <div class="code-ft"><span class="code-st">${esc(STATUS)}</span><span class="code-sumln">${TICK}<span>${esc(CHECKED)}</span></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    // width classes in place of a CSS size container (as the base): thresholds on the card's width
    const sizeCls = (w) => { if (w > 0) { card.classList.toggle('code-wide', w >= 760); card.classList.toggle('code-mid', w < 600); } };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);
    const tabs = [...card.querySelectorAll('.code-tab')], ink = $('.code-ink');
    const files = [...card.querySelectorAll('.code-file')].map((n, fi) => ({
      n, box: n.querySelector('.code-lines'), y: '',
      lines: [...n.querySelectorAll('.code-l')].map((l, li) => ({ l, text: md(FILES[fi].lines[li])[2], sv: l.querySelector('.sv'), sh: l.querySelector('.sh'), shown: -1, on: null, ...T.files[fi].lines[li] })),
    }));
    const vp = $('.code-vp');
    const state = $('.code-state'), stateL = $('.code-sl'), spin = $('.code-hd .code-spin'), stTk = state.querySelector('.code-tk');
    const ft = $('.code-ft'), st = $('.code-st'), sum = $('.code-sumln');
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS_SAY + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        rise(card, seg(t, T.card, T.card + CARD_IN), 16);
        const d = t >= T.done;

        // the tab strip: replies.md, then roundup.md; the ink slides under the active tab and the files cross-fade
        const sw = inOutCubic(seg(t, T.tab, T.tab + TAB));
        tabs.forEach((tb, i) => tb.classList.toggle('on', i === (sw >= 0.5 ? 1 : 0)));
        const t0 = tabs[0], t1 = tabs[1];
        const l0 = t0.offsetLeft, l1 = t1.offsetLeft, w0 = t0.offsetWidth, w1 = t1.offsetWidth;
        ink.style.transform = `translateX(${(l0 + (l1 - l0) * sw).toFixed(2)}px)`;
        ink.style.width = `${(w0 + (w1 - w0) * sw).toFixed(2)}px`;
        files[0].n.style.opacity = (1 - sw).toFixed(3);
        files[1].n.style.opacity = sw.toFixed(3);

        // each line streams in its window; a line not reached yet (number and text) is hidden
        const vh = vp.clientHeight;
        files.forEach((f) => {
          let bottom = 0;
          f.lines.forEach((o) => {
            const n = t < o.a ? 0 : Math.min(o.text.length, Math.floor((t - o.a) / Math.max(1e-6, o.b - o.a) * o.text.length + 1e-6));
            const on = t >= o.a;
            if (on !== o.on) { o.l.style.visibility = on ? '' : 'hidden'; o.on = on; }
            if (n !== o.shown) { o.sv.textContent = o.text.slice(0, n); o.sh.textContent = o.text.slice(n) || (o.text ? '' : ' '); o.shown = n; }
            o.l.classList.toggle('live', t >= o.a && t < o.b);
            // the stream's leading edge, for the autoscroll: the share of the line's height already written
            if (on) bottom = o.l.offsetTop + o.l.offsetHeight * (o.text.length ? n / o.text.length : 1);
          });
          // autoscroll: once the written text passes the viewport's foot it scrolls up with the stream
          const y = `translateY(${(-Math.max(0, bottom + 8 - vh)).toFixed(2)}px)`;
          if (y !== f.y) { f.box.style.transform = y; f.y = y; }
        });

        // header: a spinner and "Drafting", then a check and "Done" (no clock)
        setText(stateL, d ? 'Done' : 'Drafting');
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the foot: the status while it runs, then the check line (plain text, no buttons)
        const c = outCubic(seg(t, T.done, T.done + LINE_IN));
        st.style.opacity = (1 - c).toFixed(3);
        sum.style.opacity = c.toFixed(3);
        sum.style.transform = c >= 1 ? 'none' : `translateY(${((1 - c) * 6).toFixed(2)}px)`;
        ft.classList.toggle('on', d);
        card.classList.toggle('code-done', d);
      },
    };
  },
};
