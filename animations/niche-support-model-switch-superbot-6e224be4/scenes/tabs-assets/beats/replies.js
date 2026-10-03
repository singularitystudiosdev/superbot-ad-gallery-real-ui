// Replies beat: Claude Opus 5.5 drafts the replies, in the base's code-panel grammar kept whole (panel chrome, tabs,
// streaming caret, the camera's push on the panel) but as a REPLY composer: no diff gutter, no line numbers, the body in
// the UI sans. A header with "209 drafts", the account chip trailkit.zendesk.com and an honest clock ("Working 1s",
// then a check and "Worked for 2s"); the tabs "Where is my order" (active) then "Return or exchange". Each tab opens on
// its ticket (mono id, subject, the requester with a letter avatar) and the reply streams in behind a caret; then the
// tab switches and the second reply streams. The review bar counts the tabs ("Writing 1 of 2") and lands on "209 replies
// drafted from your help center articles" with the green check, with Review / Approve all. In the zoom cut the camera
// pushes in on the panel while it writes (chat.js FOCUS). Pure function of t: every value on screen is written from t;
// line heights are constants, so the stream never measures layout.
import { seg, outCubic } from '../../../lib.js';
import { zdi, initials } from './zd-icons.js?v=6e224be4';
import { AV } from './zendesk.js?v=6e224be4';

const SAY = 'Drafted a reply for every ticket from your help center.';
const TITLE = '209 drafts';
const HOST = 'trailkit.zendesk.com';
// the two tabs: [tab, ticket id, subject, requester, reply lines]; a link inside a line is wrapped in [[ ]]
const TABS = [
  ['Where is my order', '#48213', 'Still no tracking for order 10482', 'Dana Whitfield', [
    'Hi Dana,',
    '',
    'Order 10482 left our warehouse this morning.',
    'Track it here: [[trailkit.co/track/10482]]',
    'It should reach you by Thursday, Oct 8.',
    '',
    'Sorry for the wait.',
    'Jess, Trailkit Support',
  ]],
  ['Return or exchange', '#48207', 'How do I return the size M jacket?', 'Leo Brandt', [
    'Hi Leo,',
    '',
    'Returns are free for 30 days. Your prepaid label',
    "is attached, and the refund posts once it's scanned.",
    '',
    'Jess, Trailkit Support',
  ]],
];
const DONE = '209 replies drafted from your help center articles';

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.3;    // the panel is up, then the first character lands
const WRITE_A = 0.66; /* deliberate */ // the first reply streaming in
const TAB_AT = 0.16;     // the first reply written, then the tab switches
const TAB_IN = 0.12;     // the second ticket's body fading up
const WRITE_B = 0.6; /* deliberate */ // the second reply streaming in (read while the camera holds)
const REST_AT = 0.06;    // the second reply written, then the summary settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // done: the header check pops in
const PULSE = 0.24;      // done: Approve all pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// one span per character, so a partly streamed line keeps each character's final colour (links in the hub's blue)
function charsOf(line) {
  const out = [];
  line.split(/(\[\[.*?\]\])/).forEach((part) => {
    const link = part.startsWith('[[');
    [...(link ? part.slice(2, -2) : part)].forEach((ch) => out.push(link ? `<i class="lk">${esc(ch)}</i>` : esc(ch)));
  });
  return out;
}
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// per tab: every line's start offset in that tab's stream (a line break counts one character), and its length
const STREAMS = TABS.map(([, , , , lines]) => {
  let acc = 0;
  const starts = lines.map((ln) => { const s = acc; acc += charsOf(ln).length + 1; return s; });
  return { starts, total: acc - 1 };
});

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
    const body = ([, id, subject, who, lines], f) => `<div class="rp-bd" data-f="${f}">
      <div class="rp-tk"><code class="rp-id">${esc(id)}</code><b class="rp-sub">${esc(subject)}</b>
        <span class="rp-who"><i class="rp-av" style="background:${AV[who]}">${initials(who)}</i>${esc(who)}</span></div>
      <div class="rp-txt">${lines.map((ln) => `<div class="rp-l${ln ? '' : ' rp-gap'}"><span class="rp-v"></span><i class="em-caret"></i></div>`).join('')}</div>
    </div>`;
    const card = x.el(`<div class="em-x rp-x">
      <div class="em-hd">
        <span class="em-proj">${zdi('speech-bubble-plain-stroke', 'em-ico')}<b>${TITLE}</b></span><span class="em-br">${HOST}</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span><span class="em-clk">0s</span></em>
      </div>
      <div class="em-tabs">${TABS.map(([tab], i) => `<span class="em-tab${i === 0 ? ' on' : ''}">${esc(tab)}</span>`).join('')}</div>
      <div class="rp-bds">${TABS.map(body).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">1 of ${TABS.length}</span></span>
        <span class="em-btns"><i class="em-b">Review</i><i class="em-b em-pri">Approve all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tabs = [...card.querySelectorAll('.em-tab')];
    const bodies = [...card.querySelectorAll('.rp-bd')];
    const files = TABS.map(([, , , , lines], f) => ({
      rows: [...bodies[f].querySelectorAll('.rp-l')].map((n, i) => ({
        n, v: n.querySelector('.rp-v'), c: n.querySelector('.em-caret'), chars: charsOf(lines[i]), shown: -1, caret: null,
      })),
    }));
    const state = $('.em-state'), stateL = $('.em-sl'), clk = $('.em-clk'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft'), pri = $('.em-pri');
    let said = -1, onTab = -1;

    // one tab's stream at character count c: lines fill in order, the caret riding the last character
    const stream = (f, c, writing) => {
      const S = STREAMS[f];
      files[f].rows.forEach((o, i) => {
        const st = S.starts[i];
        const k2 = Math.max(0, Math.min(o.chars.length, c - st));
        const next = S.starts[i + 1];
        const on = writing && c >= st && (next === undefined || c < next);
        if (k2 !== o.shown) { o.v.innerHTML = o.chars.slice(0, k2).join(''); o.shown = k2; }
        if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
      });
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

        // the tab: the order ticket until the switch, then the return ticket (its body fades up)
        const tab = t >= T.tab ? 1 : 0;
        if (tab !== onTab) {
          tabs.forEach((n, i) => n.classList.toggle('on', i === tab));
          bodies.forEach((n, i) => { n.style.visibility = i === tab ? '' : 'hidden'; });
          onTab = tab;
        }
        bodies[1].style.opacity = tab ? outCubic(seg(t, T.tab, T.b0)).toFixed(3) : '0';
        stream(0, Math.round(STREAMS[0].total * seg(t, T.a0, T.a1)), t >= T.a0 && t < T.a1 + 0.2);
        stream(1, Math.round(STREAMS[1].total * seg(t, T.b0, T.b1)), t >= T.b0 && t < T.b1 + 0.3);

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the review bar: the reply being written (1 of 2, 2 of 2), then the summary
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${tab + 1} of ${TABS.length}`);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
