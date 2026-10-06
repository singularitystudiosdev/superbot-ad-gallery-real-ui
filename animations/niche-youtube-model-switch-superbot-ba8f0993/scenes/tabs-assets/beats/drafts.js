// Drafts beat: Claude Opus 5.5 writes the replies. Its line streams and a drafts panel rises: the header ("Replies",
// "5 drafts", a voice meter filling to 96% "your voice"), the tone line it learned from Sam's past replies, then one
// draft per top comment (the commenter's avatar, name and comment in grey, Sam's reply streaming under it with its
// timestamps turning into YouTube's blue links as they complete, a spinner resolving to a check). All five write at
// once, staggered; Priya's is the longest (the short buyer's guide that gets pinned). The footer counts the words and
// "Approve all" pulses once. The camera pushes in on the panel while it writes (chat.js FOCUS) and pulls back after.
// Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=ba8f0993';
import { TOP, REPLY, rich } from './data.js?v=ba8f0993';

const SAY = 'Wrote all five in your voice, each with the exact moment or link that answers it.';
const TONE = 'Tone from your last 212 replies: casual, specific, always names the timestamp';
const VOICE = 96;
const WORDS = REPLY.join(' ').split(/\s+/).length;
const FOOT = `${REPLY.length} replies · ${WORDS} words · every timestamp checked against the video`;
// timing (seconds from the reply start, or from the panel where noted)
const CPS_SAY = 110;
const SAY_AT = 0.04;
const CARD_AT = 0.08;                   // the line starts, then the panel rises
const CARD_IN = 0.18;
const WRITE_AT = 0.28;                  // the panel is up, then the first draft starts
const STAG = 0.12;                      // one draft starting to the next
const CPS = 172; /* deliberate */       // each draft streams at this rate; Priya's (the longest) sets the length
const POP = 0.18;                       // a draft's check popping in
const REST = 0.16;                      // the last draft written to the footer landing
const PULSE = 0.24;                     // Approve all pulses once
const HOLD_DONE = 0.42; /* deliberate */ // done: the panel reads, pushed in, before the pull-back
const FOCUS_AT = 0.3; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */
const FOCUS_PULL = 0.4; /* deliberate */

const PLAIN = REPLY;

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.ws = PLAIN.map((_, i) => T.w0 + i * STAG);
    T.we = PLAIN.map((s, i) => T.ws[i] + s.length / CPS);
    T.w1 = Math.max(...T.we);
    T.done = T.w1 + REST;
    if (opts.zoom) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="dr-card">
      <div class="dr-hd">${ms('comment-outline', 'dr-ic')}<b>Replies</b><span class="dr-n">${REPLY.length} drafts</span>
        <span class="dr-voice">${ms('graphic-eq', 'dr-eq')}<span>Your voice</span><i class="dr-meter"><i></i></i><b class="dr-pc">0%</b></span></div>
      <div class="dr-tone">${x.esc(TONE)}</div>
      <div class="dr-list">${TOP.map((c, i) => `<div class="dr-it">
        <span class="dr-av" style="--c: ${c.c}">${x.esc(c.name[0])}</span>
        <div class="dr-b"><div class="dr-q"><b>${x.esc(c.name)}</b><span>${x.esc(c.text)}</span></div>
          <div class="dr-r"><span class="dr-rv"></span><span class="dr-rh">${rich(REPLY[i], x.esc)}</span></div></div>
        <span class="dr-st"><i class="dr-spin"></i>${x.OK}</span>
      </div>`).join('')}</div>
      <div class="dr-ft"><span class="dr-fl">${x.esc(FOOT)}</span><span class="dr-go">${ms('check')}<span>Approve all</span></span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const items = [...card.querySelectorAll('.dr-it')].map((n, i) => ({
      n, vis: n.querySelector('.dr-rv'), hid: n.querySelector('.dr-rh'),
      spin: n.querySelector('.dr-spin'), ok: n.querySelector('.dr-st .qc-ok'), shown: -1, i,
    }));
    const meter = $('.dr-meter i'), pc = $('.dr-pc'), ft = $('.dr-ft'), go = $('.dr-go');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, pct = '';
    const caret = '<i class="dr-caret"></i>';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.done, ft]],
      focus: T.focus ? card : null,
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 12).toFixed(2)}px)`;

        // the voice meter fills while the drafts write
        const v = inOutCubic(seg(t, T.w0, T.w1));
        meter.style.transform = `scaleX(${(v * VOICE / 100).toFixed(4)})`;
        const p = `${Math.round(VOICE * v)}%`;
        if (p !== pct) { pc.textContent = p; pct = p; }

        // each draft streams; the unwritten rest keeps its height (hidden), so the panel never grows while it writes
        items.forEach((it) => {
          const s = PLAIN[it.i];
          const n = streamCount(s, T.ws[it.i], CPS, t);
          if (n !== it.shown) {
            const writing = n > 0 && n < s.length;
            it.vis.innerHTML = rich(s.slice(0, n), x.esc) + (writing ? caret : '');
            it.hid.innerHTML = rich(s.slice(n), x.esc);
            it.shown = n;
          }
          const d = outCubic(seg(t, T.we[it.i], T.we[it.i] + POP));
          it.spin.style.opacity = (t < T.ws[it.i] - 0.1 ? 0 : 1 - seg(t, T.we[it.i] - 0.06, T.we[it.i] + 0.04)).toFixed(3);
          it.spin.style.transform = `rotate(${((t - T.w0) * 420).toFixed(1)}deg)`;
          it.ok.style.opacity = d.toFixed(3);
          it.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        });

        const f = outCubic(seg(t, T.done, T.done + 0.24));
        ft.style.opacity = f.toFixed(3);
        const pu = Math.sin(Math.PI * seg(t, T.done + 0.1, T.done + 0.1 + PULSE));
        go.style.transform = pu > 0 ? `scale(${(1 + 0.06 * pu).toFixed(4)})` : 'none';
        go.classList.toggle('dr-on', t >= T.done + 0.1);
      },
    };
  },
};
