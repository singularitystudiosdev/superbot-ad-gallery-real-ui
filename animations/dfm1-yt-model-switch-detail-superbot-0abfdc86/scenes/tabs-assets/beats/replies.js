// Replies beat: Claude Opus 5.5 writes the five replies in the creator's voice and decides the pin, as one finished,
// reviewed deliverable on a wide drafts card built for the 16:9 push (about 640 x 360 design px, so the camera's
// FOCUS fills the frame without clipping). Two columns:
//   left   the five drafts, in TOP's rank order. Each is the original comment, small and muted (avatar in the
//          commenter's colour, first name, the comment clamped to one line), with the drafted reply streaming in
//          under it behind a caret. A reply that cites a moment (REPLIES[].at) renders that timestamp as an accent
//          link chip, the way YouTube links a timestamp in a comment.
//   right  the voice panel ("Matched to your last 50 replies", VOICE.traits ticking in as green checks) and the
//          bold element, the pin decision: it weighs as "Choosing the pin" over a small grey column chart of how often
//          each top comment was asked again (TOP[].repeats), then lands on Priya's reply: the accent hairline, her
//          column turning accent, and PIN.why as three evidence rows, each with a check. Priya's draft gets a Pin tag.
// The header keeps the base's honest clock ("Working 1s", then a check and "Worked for 1s"); the footer counts the
// drafts as they start ("Writing 2 of 5") and closes on the done line with superbot's check. In the zoom cut the
// camera pushes in on the card while it writes and holds through the pin decision (chat.js FOCUS). Every fact comes
// from script.js. Pure function of t: every value on screen is written from t; row heights are constants in the CSS,
// so the stream never measures layout.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=0abfdc86';
import { TOP, REPLIES, VOICE, PIN, byId } from '../script.js?v=0abfdc86';

const SAY = 'Drafted all five replies in your voice and picked the one to pin.';
const first = (name) => name.split(' ')[0];
const ROWS = REPLIES.map((d) => ({ ...d, c: byId(TOP, d.id) }));
const N = ROWS.length;
const PINNED = byId(TOP, PIN.id);
const DONE = `${N} replies drafted, ${first(PINNED.name)}'s marked to pin`;
const MAXREP = Math.max(...TOP.map((c) => c.repeats));

// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.16;    // the card rising in
const WRITE_AT = 0.3;    // the card is up, then the first draft starts
const ROW_GAP = 0.2;     // each draft starts this long after the one above it
const CPS = 190;         // the drafts stream at this many characters a second (the longest, Priya's, takes 0.59s)
const ROW_IN = 0.2;      // a draft's comment line fading up as its reply starts
const VOICE_AT = 0.32;   // from the first draft, the voice traits start ticking in...
const TRAIT_GAP = 0.15;  // ...one every this long
const PIN_AT = 0.82;     // from the first draft, the pin decision lands (while the last two drafts still stream)
const BARS_AT = 0.36;    // from the first draft, the repeat-ask columns grow in, all grey while the pin is weighed
const BARS = 0.35;       // the repeat-ask columns growing in (outCubic)
const WHY_AT = 0.16;     // the decision lands, then the evidence rows check in...
const WHY_GAP = 0.12;    // ...one every this long
const TAG_AT = 0.42;     // the decision lands, then Priya's draft takes the Pin tag
const REST = 0.28;       // the last draft written, then the done line lands
const TICK_IN = 0.2;     // a check scaling in (outCubic, no overshoot)
const POP = 0.176;       // done: the header check pops in
const HOLD_DONE = 0.52; /* deliberate */ // done: the pin decision and done line read, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const TICK = '<svg class="rp-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="rp-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
const ease = (t, a, d) => outCubic(seg(t, a, a + d));
// a check scaling in: hidden before a, then 0.6 to 1 over TICK_IN
const tickAt = (n, t, a) => {
  const e = ease(t, a, TICK_IN);
  n.style.opacity = e.toFixed(3);
  n.style.transform = e >= 1 ? '' : `scale(${(0.6 + 0.4 * e).toFixed(3)})`;
};
const avatar = (c) => `<i class="rp-av" style="background:${c.color}">${c.name[0]}</i>`;

// each draft's stream: the text split around its timestamp, so the chip streams in place as a link
const parts = (o) => {
  const i = o.at ? o.text.indexOf(o.at) : -1;
  return i < 0 ? [o.text, '', ''] : [o.text.slice(0, i), o.at, o.text.slice(i + o.at.length)];
};
const shown = (o, x, k) => {
  const [a, b, c] = parts(o);
  let h = x.esc(a.slice(0, k));
  if (k > a.length && b) h += `<a class="rp-ts">${x.esc(b.slice(0, k - a.length))}</a>`;
  if (k > a.length + b.length) h += x.esc(c.slice(0, k - a.length - b.length));
  return h;
};

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.rows = ROWS.map((o, i) => { const a = T.w0 + i * ROW_GAP; return [a, a + o.text.length / CPS]; });
    T.w1 = Math.max(...T.rows.map((s) => s[1]));
    T.voice = T.w0 + VOICE_AT;
    T.bars = T.w0 + BARS_AT;
    T.pin = T.w0 + PIN_AT;
    T.done = Math.max(T.w1, T.pin + TAG_AT) + REST;
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
    const card = x.el(`<div class="rp-x">
      <div class="rp-hd">
        <span class="rp-ttl">${ms('comment-outline', 'rp-ico')}<b>Replies in your voice</b></span><span class="rp-n">${N} drafts</span>
        <em class="rp-state"><i class="rp-spin"></i>${TICK}<span class="rp-sl">Working</span><span class="rp-clk">0s</span></em>
      </div>
      <div class="rp-bd">
        <div class="rp-drafts">${ROWS.map((o) => `<div class="rp-row${o.id === PIN.id ? ' rp-pinrow' : ''}">
          <div class="rp-cm">${avatar(o.c)}<b>${x.esc(first(o.c.name))}</b><span class="rp-ct">${x.esc(o.c.text)}</span>${o.id === PIN.id ? `<i class="rp-tag">${ms('keep', 'rp-kp')}Pin</i>` : ''}</div>
          <div class="rp-re"><span class="rp-v"></span><i class="rp-caret"></i></div>
        </div>`).join('')}</div>
        <div class="rp-side">
          <div class="rp-voice">
            <b class="rp-h">Matched to your last ${VOICE.from} replies</b>
            ${VOICE.traits.map((s) => `<div class="rp-ck">${TICK}<span>${x.esc(s)}</span></div>`).join('')}
          </div>
          <div class="rp-pin">
            <div class="rp-ph">${ms('keep', 'rp-pk')}<b class="rp-pt">Choosing the pin</b>${avatar(PINNED)}</div>
            <div class="rp-pb">
              <div class="rp-chart">
                <span class="rp-cl">Asked again by viewers</span>
                <div class="rp-cols">${TOP.map((c) => `<div class="rp-col${c.id === PIN.id ? ' on' : ''}"><em>${c.repeats || ''}</em><i class="rp-bar"></i>${avatar(c)}</div>`).join('')}</div>
              </div>
              ${PIN.why.map((s) => `<div class="rp-ck">${TICK}<span>${x.esc(s)}</span></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="rp-ft">
        <span class="rp-sum">${CHEV}${x.OK}<b class="rp-nf">Writing</b><span class="rp-cnt">1 of ${N}</span></span>
        <span class="rp-btns"><i class="rp-b">Review</i><i class="rp-b rp-pri">Post all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const rows = $$('.rp-row').map((n, i) => ({ n, cm: n.querySelector('.rp-cm'), v: n.querySelector('.rp-v'), c: n.querySelector('.rp-caret'), o: ROWS[i], k: -1, caret: null }));
    const state = $('.rp-state'), stateL = $('.rp-sl'), clk = $('.rp-clk'), spin = $('.rp-hd .rp-spin'), stTk = state.querySelector('.rp-tk');
    const traits = $$('.rp-voice .rp-tk'), voice = $('.rp-voice');
    const pin = $('.rp-pin'), pt = $('.rp-pt'), chart = $('.rp-chart'), why = $$('.rp-pb > .rp-ck'), whyTk = why.map((n) => n.querySelector('.rp-tk'));
    const bars = $$('.rp-bar'), vals = $$('.rp-col em'), tag = $('.rp-tag');
    const nf = $('.rp-nf'), cnt = $('.rp-cnt'), ft = $('.rp-ft');
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = ease(t, T.card, CARD_IN);
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;

        // the drafts: each row's comment fades up as its reply starts streaming, the caret riding the last character
        rows.forEach((o, i) => {
          const [a, b] = T.rows[i];
          const kk = streamCount(o.o.text, a, CPS, t);
          if (kk !== o.k) { o.v.innerHTML = shown(o.o, x, kk); o.k = kk; }
          const f = ease(t, a, ROW_IN);
          o.n.style.opacity = f.toFixed(3);
          o.cm.style.transform = f >= 1 ? '' : `translateY(${((1 - f) * 4).toFixed(2)}px)`;
          const on = t >= a && t < b + 0.12;
          if (on !== o.caret) { o.c.style.display = on ? 'inline-block' : 'none'; o.caret = on; }
        });

        // the voice panel: up with the first draft, its traits checking in one by one
        voice.style.opacity = (0.35 + 0.65 * ease(t, T.w0, 0.25)).toFixed(3);
        traits.forEach((n, i) => tickAt(n, t, T.voice + i * TRAIT_GAP));

        // the pin decision: "Choosing the pin" until it lands on Priya, then the columns grow and the evidence checks in
        const p = t >= T.pin;
        pin.classList.toggle('on', p);
        setText(pt, p ? `Pin ${first(PINNED.name)}'s reply` : 'Choosing the pin');
        chart.style.opacity = ease(t, T.w0, 0.25).toFixed(3);
        const g = ease(t, T.bars, BARS);
        bars.forEach((n, i) => { n.style.height = `${(2 + 26 * g * TOP[i].repeats / MAXREP).toFixed(2)}px`; });
        vals.forEach((n) => { n.style.opacity = seg(t, T.bars + BARS * 0.6, T.bars + BARS).toFixed(3); });
        whyTk.forEach((n, i) => tickAt(n, t, T.pin + WHY_AT + i * WHY_GAP));
        why.forEach((n, i) => {
          const w = ease(t, T.pin + WHY_AT + i * WHY_GAP - 0.1, 0.25);
          n.style.opacity = w.toFixed(3);
          n.style.transform = w >= 1 ? '' : `translateY(${((1 - w) * 4).toFixed(2)}px)`;
        });
        const te = ease(t, T.pin + TAG_AT, 0.25);
        tag.style.opacity = te.toFixed(3);
        tag.style.transform = te >= 1 ? '' : `scale(${(0.85 + 0.15 * te).toFixed(3)})`;

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';

        // the footer: the draft being written (1 of 5 .. 5 of 5, as each one starts), then the done line
        const n = Math.max(1, T.rows.filter((s) => t >= s[0]).length);
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : `${n} of ${N}`);
        ft.classList.toggle('on', d);
      },
    };
  },
};
