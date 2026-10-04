// Drafts beat: Claude Opus 5.5 answers the top five comments in the creator's voice (the ask's "Answer" clause). The
// output is the replies themselves, shaped like YouTube's comment thread in the hub's dark card: a header with the
// video they answer, the draft counter ("Drafting 1 of 5" .. "5 of 5") and an honest clock ("Working 1s", then a check
// and "Worked for 2s"); a voice strip (what the replies were matched to: VOICE); five draft blocks, each the
// commenter's line (letter avatar, name, comment, likes) with the creator's reply indented under it (OWNER's avatar,
// the owner pill, the reply streaming in behind a caret, its timestamp turning into a blue YouTube link the moment it
// is typed, a check when the draft is finished); and a footer that lands on "5 replies ready" with Edit / Post all.
// Every name, line and figure comes from content.js. In the zoom cut the camera pushes in on the card while it writes
// (chat.js FOCUS). Pure function of t: every value on screen is written from t; each reply's full text is laid out
// from the start (the untyped rest is hidden), so the stream never moves layout.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=ba89fddc';
import { OWNER, VIDEO, TOP, VOICE, REPLIES } from '../content.js?v=ba89fddc';

const SAY = 'Wrote five replies in your voice, each one pointing to its moment.';
const N = REPLIES.length;
const READY = `${N} replies ready, in your voice`;
const IDLE = 'Nothing posted yet';

// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.16;    // the card rising in
const ROW_AT = 0.06;     // card: the first comment row starts in
const ROW_STEP = 0.03;   // ...and each next one this much later
const ROW_IN = 0.16;     // a comment row rising in
const WRITE_AT = 0.3;    // the card is up, then the first character of the first reply lands
const WRITE = 1.35; /* deliberate */ // all five replies streaming in, one after another (read while the camera holds)
const REST_AT = 0.06;    // the last reply written, then the footer settles
const REST = 0.3;        // ...before the status lands
const POP = 0.176;       // a check popping in (a finished draft, and the header at done)
const WASH = 0.5;        // a typed timestamp link: its blue wash fades over this
const PULSE = 0.24;      // done: Post all pulses once
const HOLD_DONE = 0.4; /* deliberate */  // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// YouTube links any m:ss in a comment: the commenter's own timestamps render as links too
const linkify = (s) => esc(s).replace(/\b\d{1,2}:\d{2}\b/g, (m) => `<a class="em-ts">${m}</a>`);
const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CARET = '<i class="em-caret"></i>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

// each reply as runs of plain text and its one timestamp link (REPLIES[i].at), with their offsets into the reply
const RUNS = REPLIES.map((rp) => {
  const j = rp.at ? rp.text.indexOf(rp.at) : -1;
  const parts = j < 0 ? [[rp.text, false]] : [[rp.text.slice(0, j), false], [rp.at, true], [rp.text.slice(j + rp.at.length), false]];
  let o = 0;
  return parts.filter((p) => p[0]).map(([s, link]) => { const run = { s, link, o }; o += s.length; return run; });
});
// the replies stream back to back: reply i owns chars [START[i], START[i] + length) of the one count
const START = REPLIES.reduce((a, rp, i) => (a.push(i ? a[i - 1] + REPLIES[i - 1].text.length : 0), a), []);
const TOTAL = START[N - 1] + REPLIES[N - 1].text.length;
// reply i's first k characters, the caret after the last one while it writes, the untyped rest laid out but hidden
const replyHtml = (i, k, caret) => {
  let out = '', placed = !caret;
  for (const run of RUNS[i]) {
    const n = Math.max(0, Math.min(run.s.length, k - run.o));
    let h = esc(run.s.slice(0, n));
    if (!placed && (n < run.s.length || run.o + run.s.length >= REPLIES[i].text.length)) { h += CARET; placed = true; }
    if (n < run.s.length) h += `<i class="em-h">${esc(run.s.slice(n))}</i>`;
    out += run.link ? `<a class="em-ts${n >= run.s.length ? ' on' : ''}">${h}</a>` : h;
  }
  return out;
};

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
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the moment the stream count first covers char c (c = round(TOTAL * progress), so c lands at (c - .5) / TOTAL)
    const at = (c) => T.w0 + WRITE * Math.max(0, c - 0.5) / TOTAL;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    // the creator's avatar carries the finished draft's check as a badge
    const own = `<i class="em-av em-own" style="background:${OWNER.color}">${esc(OWNER.initial)}${TICK.replace('em-tk', 'em-tk em-dk')}</i>`;
    const card = x.el(`<div class="em-x">
      <div class="em-hd">
        ${ms('comment-outline', 'em-ico')}<span class="em-ti">Replies on <b>${esc(VIDEO.title)}</b></span>
        <span class="em-br"><span class="em-bl">Drafting</span><span class="em-cnt">1 of ${N}</span></span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span><span class="em-clk">0s</span></em>
      </div>
      <div class="em-vo">
        ${ms('auto-fix', 'em-ico')}<span class="em-vl">Matched to your last <b>${VOICE.sample}</b> replies</span>
        <span class="em-chips">${VOICE.traits.map((tr) => `<i class="em-chip">${esc(tr)}</i>`).join('')}<i class="em-chip em-avg">avg <b>${VOICE.avgWords}</b> words</i></span>
      </div>
      <div class="em-bd">${TOP.map((c, i) => `<div class="em-d">
        <div class="em-c"><i class="em-av" style="background:${c.color}">${esc(c.name[0])}</i><b class="em-cn">${esc(c.name)}</b><span class="em-ct">${linkify(c.text)}</span><span class="em-lk">${ms('thumb-up-outline', 'em-th')}${esc(c.likes)}</span></div>
        <div class="em-r">${own}<p class="em-tx"><span class="em-pill">${esc(OWNER.handle)}</span><i class="em-sk"></i><span class="em-rt"></span></p></div>
      </div>`).join('')}</div>
      <div class="em-ft">
        <span class="em-sum">${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">${IDLE}</b></span>
        <span class="em-btns"><i class="em-b">Edit</i><i class="em-b em-pri">Post all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const drafts = [...card.querySelectorAll('.em-d')].map((n, i) => {
      const len = REPLIES[i].text.length, link = RUNS[i].find((run) => run.link);
      return {
        n, c: n.querySelector('.em-c'), r: n.querySelector('.em-r'), tx: n.querySelector('.em-rt'),
        dk: n.querySelector('.em-dk'), done: at(START[i] + len), lk: link ? at(START[i] + link.o + link.s.length) : null, key: '',
      };
    });
    const state = $('.em-state'), stateL = $('.em-sl'), clk = $('.em-clk'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const bl = $('.em-bl'), cnt = $('.em-cnt'), nf = $('.em-nf'), ft = $('.em-ft'), pri = $('.em-pri');
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

        // the stream: a steady typewriter over WRITE across the five replies in order, the caret riding the last character
        const c = Math.round(TOTAL * seg(t, T.w0, T.w1));
        const writing = t >= T.w0 && t < T.w1 + 0.3;
        // drafts opened so far (one starts as the count passes its first character); the last one open is being written
        const opened = t < T.w0 ? 0 : Math.max(1, START.filter((s0) => c > s0).length);
        drafts.forEach((o, i) => {
          // the comment rows rise in staggered with the card; a comment waiting for its reply reads dimmed
          const ri = outCubic(seg(t, T.card + ROW_AT + i * ROW_STEP, T.card + ROW_AT + i * ROW_STEP + ROW_IN));
          const open = i < opened;
          o.n.style.transform = ri >= 1 ? '' : `translateY(${((1 - ri) * 6).toFixed(2)}px)`;
          o.n.style.opacity = ri.toFixed(3);
          o.c.style.opacity = open ? '' : '.55';
          // the reply: the owner pill opens the line, the text hidden until its turn (a skeleton holds its place), then typed in place
          const k2 = Math.max(0, Math.min(REPLIES[i].text.length, c - START[i]));
          const on = writing && i === opened - 1;
          const key = `${k2}|${on}`;
          if (key !== o.key) { o.tx.innerHTML = replyHtml(i, k2, on); o.key = key; }
          o.r.classList.toggle('em-wait', !open);
          o.n.classList.toggle('em-on', on && !d);
          // the timestamp link's blue wash, fading from the moment its last character lands
          if (o.lk !== null) {
            const a = o.tx.querySelector('.em-ts');
            const w = t >= o.lk ? 1 - seg(t, o.lk, o.lk + WASH) : 0;
            if (a) a.style.backgroundColor = w > 0 ? `rgba(62,166,255,${(0.24 * w).toFixed(3)})` : '';
          }
          // the finished draft's check pops in on the creator's avatar
          const fin = t >= o.done && open;
          o.dk.style.display = fin ? 'block' : 'none';
          const p = seg(t, o.done, o.done + POP);
          o.dk.style.transform = fin && p < 1 ? `scale(${(0.6 + 0.4 * outCubic(p)).toFixed(3)})` : '';
        });

        // header: the draft being written (1 of 5 .. 5 of 5, as each one starts), the beat's own elapsed whole seconds
        setText(bl, d ? 'Drafted' : 'Drafting');
        setText(cnt, `${Math.max(1, opened)} of ${N}`);
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the footer: idle until done, then the ready status with the green check
        setText(nf, d ? READY : IDLE);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,241,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
